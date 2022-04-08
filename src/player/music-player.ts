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
import { GolemEvent } from '../golem/event-emitter'
import { AListing } from '../listing/listing'
import { Track, TrackAudioResourceMetadata } from '../tracks'
import { GolemLogger, LogSources } from '../utils/logger'
import { humanReadableTime, wait } from '../utils/time-utils'
import { TrackQueue } from './queue'

export type GolemTrackAudioResource = AudioResource & {
  metadata: TrackAudioResourceMetadata
}

export type MusicPlayerOptions = JoinVoiceChannelOptions &
  CreateVoiceConnectionOptions & {
    guildName: string
    channelName: string
  }

export class MusicPlayer {
  static readonly autoDCTime = 300_000

  private readonly queue: TrackQueue
  private readonly log: winston.Logger

  private leaveTimeout!: NodeJS.Timeout

  public queueLock = false
  public readyLock = false
  public voiceConnection!: VoiceConnection
  public currentResource?: GolemTrackAudioResource

  public readonly audioPlayer: AudioPlayer
  public readonly guildName: string
  public readonly channelName: string
  public readonly channelId: string

  public constructor(private options: MusicPlayerOptions) {
    this.log = GolemLogger.child({
      src: LogSources.MusicPlayer,
      aux: { guildName: options.guildName, channelName: options.channelName },
    })
    this.guildName = options.guildName
    this.channelName = options.channelName
    this.channelId = options.channelId
    this.queue = new TrackQueue()
    this.audioPlayer = createAudioPlayer()

    this.audioPlayer.on('stateChange', this.playerStateHandler.bind(this))

    this.audioPlayer.on('error', this.audioPlayErrorHandler.bind(this))

    this.joinVoice()
  }

  /**
   * The primary key that the player should be referenced by.
   * Currently the GuildID of the Player.
   */
  public get primaryKey(): string {
    return this.options.guildId
  }

  /**
   * The secondary key that the player should be referenced by.
   * Currently the ChannlerId of the Player.
   */
  public get secondaryKey(): string {
    return this.options.channelId
  }

  public get isPlaying(): boolean {
    return this.audioPlayer.state.status === AudioPlayerStatus.Playing
  }

  public get nowPlaying(): AListing | undefined {
    return this.currentResource?.metadata.listing
  }

  public get currentTrackRemaining(): number {
    return (
      (this.currentResource?.metadata.listing.duration || 0) -
      (this.currentResource?.playbackDuration || 0) / 1000
    )
  }

  public get stats(): {
    count: number
    time: number
    hTime: string
    explicitTime: number
  } {
    return {
      count: this.trackCount,
      time: this.queue.runTime + this.currentTrackRemaining,
      hTime: humanReadableTime(this.queue.runTime + this.currentTrackRemaining),
      explicitTime:
        this.queue.explicitQueueRunTime + this.currentTrackRemaining,
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

  public async enqueue(track: Track, enqueueAsNext = false): Promise<void> {
    this.log.silly(`enqueue - VC Status = ${this.voiceConnection.state.status}`)
    this.log.info(`queueing${enqueueAsNext ? ' as next ' : ' '}${track.name}`)

    if (enqueueAsNext) {
      this.queue.addNext(track.userId, track)
    } else {
      this.queue.add(track.userId, track)
    }

    // TODO thinking these should be moved into the process queue function?
    track.onPlay()

    void (await this.processQueue())

    Golem.events.trigger(
      GolemEvent.Queue,
      this.voiceConnection.joinConfig.guildId
    )
  }

  public async enqueueMany(userId: string, tracks: Track[]): Promise<void> {
    this.log.info(`enqueueing ${tracks.length} listings`)
    this.queue.addMany(userId, tracks)
    // TODO handle this properly
    // tracks.forEach((t) => t.onPlay())
    await this.processQueue()

    Golem.events.trigger(
      GolemEvent.Queue,
      this.voiceConnection.joinConfig.guildId
    )
  }

  public async skip(count = 0): Promise<void> {
    this.log.info(`skipping ${this.currentResource?.metadata.listing.title}`)
    this.currentResource?.metadata.track.onSkip()

    this.queue.skip(count)

    await this.processQueue(true)
  }

  public async destroy(): Promise<void> {
    this.log.silly(
      `attempt destroy voice connection for ${this.primaryKey} - ${this.secondaryKey} - state=${this.voiceConnection.state.status}`
    )
    if (
      ![
        VoiceConnectionStatus.Destroyed,
        VoiceConnectionStatus.Disconnected,
      ].includes(this.voiceConnection.state.status)
    ) {
      this.log.debug(
        `destroying voice connection for ${this.primaryKey} - ${this.secondaryKey}`
      )

      this.queueLock = false
      this.currentResource?.metadata.track.onSkip()
      await Golem.removePlayer(this.primaryKey, this.secondaryKey)
      this.voiceConnection.destroy()
      Golem.presence.update()
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
    Golem.presence.update()
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
      this.log.debug(
        `disconnecting voice connection for ${this.primaryKey} -  ${this.secondaryKey}`
      )

      this.queueLock = false
      this.voiceConnection.disconnect()
      Golem.presence.update()
    }
  }

  startTimer(): void {
    this.log.debug(
      `starting auto-dc timer for ${this.primaryKey} -  ${this.secondaryKey}`
    )
    this.leaveTimeout = setTimeout(
      this.autoDisconnect.bind(this),
      MusicPlayer.autoDCTime
    )
  }

  async clearTimer(force = false): Promise<void> {
    this.log.debug(
      `clearing auto-dc timer for ${this.primaryKey} -  ${this.secondaryKey} - ${force}`
    )

    if (force) {
      clearTimeout(this.leaveTimeout)
      return
    }

    const channel = await Golem.client.channels.fetch(this.channelId)

    if (channel?.isVoice() && channel.members.size === 1) {
      return
    }

    clearTimeout(this.leaveTimeout)
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

    this.clearTimer(true)
  }

  private async processQueue(force = false): Promise<void> {
    this.log.verbose(`processing queue${force ? ' - forcing next' : ''}`)
    this.log.silly(
      `processing queue - VC Status = ${this.voiceConnection.state.status}`
    )

    if (this.isDestroyed) {
      this.log.debug(
        `player in destroyed state at process attempt for ${this.primaryKey}  -  ${this.secondaryKey} - running rejoin and subscribe`
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

        Golem.events.trigger(
          GolemEvent.Queue,
          this.voiceConnection.joinConfig.guildId
        )
      } catch (error) {
        console.error(error)
        this.log.error(`error processing queue ${error}`)
        this.skip()
      }
    } else {
      this.log.silly(`process has no next track, stopping out of caution`)
      this.stop()
      Golem.events.trigger(
        GolemEvent.Queue,
        this.voiceConnection.joinConfig.guildId
      )
    }

    this.queueLock = false
  }

  private async playerStateHandler(
    oldState: AudioPlayerState,
    newState: AudioPlayerState
  ): Promise<void> {
    this.log.verbose(
      `state change - player: ${this.primaryKey} -  ${this.secondaryKey}; ${oldState.status} => ${newState.status}`
    )

    switch (newState.status) {
      case AudioPlayerStatus.AutoPaused:
        // start timer
        this.startTimer()
        break
      case AudioPlayerStatus.Buffering:
        this.clearTimer()
        break
      case AudioPlayerStatus.Idle:
        Golem.presence.update()
        // start timer
        this.startTimer()

        if (
          oldState.status !== AudioPlayerStatus.Idle &&
          !this.isDisconnected &&
          !this.isDestroyed
        ) {
          // process queue
          await this.processQueue()
        }
        break
      case AudioPlayerStatus.Paused:
        // start timer
        this.startTimer()
        break
      case AudioPlayerStatus.Playing:
        if (isNotActive(oldState.status)) {
          // clear timer
          this.clearTimer()

          // if idle trigger queue event
          if (oldState.status === AudioPlayerStatus.Idle) {
            Golem.events.trigger(
              GolemEvent.Queue,
              this.voiceConnection.joinConfig.guildId
            )
          }
        }
        break
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

function isNotActive(status: AudioPlayerStatus): boolean {
  return ![AudioPlayerStatus.Buffering, AudioPlayerStatus.Playing].includes(
    status
  )
}
