import {
  AudioPlayer,
  AudioPlayerError,
  AudioPlayerState,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  CreateVoiceConnectionOptions,
  entersState,
  joinVoiceChannel,
  JoinVoiceChannelOptions,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionState,
  VoiceConnectionStatus,
} from '@discordjs/voice'
import winston from 'winston'
import { Golem } from '../golem'
import { TrackListingInfo } from '../models/listing'
import { Track, TrackAudioResourceMetadata } from '../models/track'
import { GolemLogger, LogSources } from '../utils/logger'
import { humanReadableTime, wait } from '../utils/time-utils'
import { TrackQueue } from './queue'

type GolemTrackAudioResource = AudioResource & {
  metadata: TrackAudioResourceMetadata
}

export class MusicPlayer {
  static readonly autoDCTime = 300000
  private readonly queue!: TrackQueue
  private readonly log: winston.Logger

  private leaveTimeout!: NodeJS.Timeout

  public queueLock = false
  public readyLock = false
  public voiceConnection!: VoiceConnection
  public currentResource?: GolemTrackAudioResource

  public readonly audioPlayer!: AudioPlayer

  public constructor(
    private options: JoinVoiceChannelOptions & CreateVoiceConnectionOptions
  ) {
    this.log = GolemLogger.child({ src: LogSources.MusicPlayer })
    this.queue = new TrackQueue()
    this.audioPlayer = createAudioPlayer()

    this.audioPlayer.on('stateChange', this.playerStateHandler.bind(this))

    this.audioPlayer.on('error', this.audioPlayErrorHandler.bind(this))

    this.joinVoice()
  }

  public get isPlaying(): boolean {
    return this.audioPlayer.state.status === AudioPlayerStatus.Playing
  }

  public get nowPlaying(): TrackListingInfo | undefined {
    return this.currentResource?.metadata.track.metadata
  }

  public get currentTrackRemaining(): number {
    return (
      (this.currentResource?.metadata.duration || 0) -
      (this.currentResource?.playbackDuration || 0) / 1000
    )
  }

  public get stats(): { count: number; time: number; hTime: string } {
    return {
      count: this.queue.queuedTrackCount + (this.isPlaying ? 1 : 0),
      time: this.queue.runTime + this.currentTrackRemaining,
      hTime: humanReadableTime(this.queue.runTime + this.currentTrackRemaining),
    }
  }

  public get trackCount(): number {
    return this.queue.queuedTrackCount + (this.isPlaying ? 1 : 0)
  }

  public get isDisconnected(): boolean {
    return (
      this.voiceConnection.state.status === VoiceConnectionStatus.Disconnected
    )
  }

  public get isDestroyed(): boolean {
    return this.voiceConnection.state.status === VoiceConnectionStatus.Destroyed
  }

  private get channelId(): string {
    return this.options.channelId
  }

  public async enqueue(track: Track, enqueueAsNext = false): Promise<void> {
    this.log.silly(`enqueue - VC Status = ${this.voiceConnection.state.status}`)
    this.log.info(`queueing ${track.name}`)

    if (enqueueAsNext) {
      this.queue.addNext(track.userId, track)
    } else {
      this.queue.add(track.userId, track)
    }

    // TODO thinking these should be moved into the process queue function?
    track.onPlay()

    void (await this.processQueue())
  }

  public async enqueueMany(userId: string, tracks: Track[]): Promise<void> {
    this.log.info(`enqueueing ${tracks.length} listings`)
    this.queue.addMany(userId, tracks)
    tracks.forEach((t) => t.onPlay())
    void (await this.processQueue())
  }

  public async skip(count = 0): Promise<void> {
    this.log.info(`skipping ${this.currentResource?.metadata.title}`)
    this.currentResource?.metadata.track.onSkip()

    this.queue.skip(count)

    await this.processQueue(true)
  }

  public async destroy(): Promise<void> {
    this.log.silly(
      `attempt destroy voice connection for ${this.channelId} - state=${this.voiceConnection.state.status}`
    )
    if (
      ![
        VoiceConnectionStatus.Destroyed,
        VoiceConnectionStatus.Disconnected,
      ].includes(this.voiceConnection.state.status)
    ) {
      this.log.debug(`destroying voice connection for ${this.channelId}`)

      this.queueLock = false
      this.currentResource?.metadata.track.onSkip()
      await Golem.removePlayer(this.channelId)
      this.voiceConnection.destroy()
      Golem.setPresenceIdle()
    }
  }

  public pause(): void {
    this.log.info(`pausing`)
    this.audioPlayer.pause(true)
  }

  public unpause(): void {
    this.log.info(`un-pausing`)
    this.audioPlayer.unpause()
  }

  public stop(): void {
    this.log.info(`stopping player`)
    this.currentResource?.metadata.track.onSkip()
    this.queueLock = true
    this.queue.clear()
    this.currentResource = undefined
    this.log.verbose(`force stopping player`)
    this.audioPlayer.stop(true)
    this.queueLock = false
    Golem.setPresenceIdle()
    // this.disconnect()
  }

  public shuffle(): void {
    this.log.info('shuffling')
    this.queue.shuffle()
  }

  public peek(depth = 5): Track[] {
    this.log.info('peeking')
    return this.queue.peekDeep(depth)
  }

  public disconnect(): void {
    if (
      ![
        VoiceConnectionStatus.Destroyed,
        VoiceConnectionStatus.Disconnected,
      ].includes(this.voiceConnection.state.status)
    ) {
      this.log.debug(`disconnecting voice connection for ${this.channelId}`)

      this.queueLock = false
      this.voiceConnection.disconnect()
      Golem.setPresenceIdle()
    }
  }

  private joinVoice(): void {
    this.voiceConnection = joinVoiceChannel(this.options)

    this.voiceConnection.on(
      'stateChange',
      this.voiceConnectionStateHandler.bind(this)
    )

    this.subscribe()
  }

  private subscribe(): void {
    this.voiceConnection.subscribe(this.audioPlayer)
  }

  private async autoDisconnect(): Promise<void> {
    this.log.info(
      `auto disconnect triggered for ${
        this.voiceConnection.joinConfig.channelId || ''
      }`
    )
    await this.destroy()

    this.clearTimer()
  }

  private startTimer(): void {
    this.log.debug(`starting auto-dc timer for ${this.channelId}`)
    this.leaveTimeout = setTimeout(
      this.autoDisconnect.bind(this),
      MusicPlayer.autoDCTime
    )
  }

  private clearTimer(): void {
    this.log.debug(`clearing auto-dc timer for ${this.channelId}`)
    clearTimeout(this.leaveTimeout)
  }

  private async processQueue(force = false): Promise<void> {
    this.log.verbose(`processing queue${force ? ' - forcing next' : ''}`)
    this.log.silly(
      `processing queue - VC Status = ${this.voiceConnection.state.status}`
    )

    if (this.isDestroyed) {
      this.log.debug(
        `player destroyed at process attempt for ${this.channelId} - running rejoin and subscribe`
      )
      this.joinVoice()
      // this.subscribe()
    }

    if (
      !force &&
      (this.queueLock ||
        this.audioPlayer.state.status !== AudioPlayerStatus.Idle)
      // ||      this.queue.queuedTrackCount === 0
    ) {
      this.log.verbose(
        `skipping processing due to state; force=${force}; queueLock=${
          this.queueLock
        }; status=${
          this.audioPlayer.state.status !== AudioPlayerStatus.Idle
        }; queuedTrackCount=${this.queue.queuedTrackCount === 0};`
      )

      // if (this.queue.queuedTrackCount === 0) {
      //   this.currentResource = undefined
      // }
      return
    }

    this.queueLock = true

    const nextTrack = this.queue.pop()

    // this.log.info(`playing ${nextTrack.listing.shortName}`)

    // Be careful in case the skip is forced and the last run
    if (nextTrack) {
      this.log.silly(`process has next track, attempting play`)
      try {
        const next = await nextTrack.toAudioResource()
        this.log.debug(`audio resouce generated`)
        this.currentResource = next
        this.currentResource.volume?.setVolume(0.35)
        this.audioPlayer.play(this.currentResource)
        Golem.setPresenceListening(nextTrack.metadata)

        Golem.triggerEvent('queue', this.voiceConnection.joinConfig.guildId)
      } catch (error) {
        console.error(error)
        this.log.error(`error processing queue ${error}`)
        this.skip()
      }
    } else {
      this.log.silly(`process has no next track, stopping out of caution`)
      this.stop()
      Golem.triggerEvent('queue', this.voiceConnection.joinConfig.guildId)
    }

    this.queueLock = false
  }

  private async playerStateHandler(
    oldState: AudioPlayerState,
    newState: AudioPlayerState
  ): Promise<void> {
    this.log.verbose(
      `player for ${this.channelId} state change ${oldState.status} => ${newState.status}`
    )

    if (newState.status === AudioPlayerStatus.Idle) {
      Golem.setPresenceIdle()
    }

    if (
      newState.status === AudioPlayerStatus.Idle &&
      oldState.status !== AudioPlayerStatus.Idle &&
      !this.isDisconnected &&
      !this.isDestroyed
    ) {
      this.log.verbose(`entering Idle state - processing queue`)
      // start timer
      this.startTimer()
      void (await this.processQueue())
    } else if (newState.status === AudioPlayerStatus.Playing) {
      if (
        [
          AudioPlayerStatus.Idle,
          AudioPlayerStatus.Paused,
          AudioPlayerStatus.AutoPaused,
        ].includes(oldState.status)
      ) {
        this.log.debug(`player ${this.channelId} entering Playing status`)

        if (oldState.status === AudioPlayerStatus.Idle) {
          Golem.triggerEvent('queue', this.voiceConnection.joinConfig.guildId)
        }

        // clear
        this.clearTimer()
      }
    } else if (
      [
        AudioPlayerStatus.Idle,
        AudioPlayerStatus.Paused,
        AudioPlayerStatus.AutoPaused,
      ].includes(newState.status)
    ) {
      // start timer
      this.startTimer()
    } else if (newState.status === AudioPlayerStatus.Buffering) {
      this.log.debug(`player ${this.channelId} entering Buffering status`)

      // clear the timer when we start buffering just for safety?
      this.clearTimer()
    }
  }

  private async voiceConnectionStateHandler(
    _: VoiceConnectionState,
    newState: VoiceConnectionState
  ): Promise<void> {
    if (newState.status === VoiceConnectionStatus.Disconnected) {
      if (
        newState.reason === VoiceConnectionDisconnectReason.WebSocketClose &&
        newState.closeCode === 4014
      ) {
        try {
          await entersState(
            this.voiceConnection,
            VoiceConnectionStatus.Connecting,
            5_000
          )
          // Probably moved voice channel
        } catch {
          this.voiceConnection.destroy()
          // Probably removed from voice channel
        }
      } else if (this.voiceConnection.rejoinAttempts < 5) {
        /*
          The disconnect in this case is recoverable, and we also have <5 repeated attempts so we will reconnect.
        */
        await wait((this.voiceConnection.rejoinAttempts + 1) * 5_000)
        this.voiceConnection.rejoin()
      } else {
        /*
          The disconnect in this case may be recoverable, but we have no more remaining attempts - destroy.
        */
        this.voiceConnection.destroy()
      }
    } else if (newState.status === VoiceConnectionStatus.Destroyed) {
      /*
        Once destroyed, stop the subscription
      */
      this.stop()
    } else if (
      !this.readyLock &&
      (newState.status === VoiceConnectionStatus.Connecting ||
        newState.status === VoiceConnectionStatus.Signalling)
    ) {
      /*
        In the Signalling or Connecting states, we set a 20 second time limit for the connection to become ready
        before destroying the voice connection. This stops the voice connection permanently existing in one of these
        states.
      */
      this.readyLock = true
      try {
        await entersState(
          this.voiceConnection,
          VoiceConnectionStatus.Ready,
          20_000
        )
      } catch {
        if (
          this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed
        )
          this.voiceConnection.destroy()
      } finally {
        this.readyLock = false
      }
    }
  }

  private audioPlayErrorHandler(error: AudioPlayerError): void {
    console.error(error)
    this.skip()
    this.log.error(`audio player error occurred ${error.message}`)
  }
}
