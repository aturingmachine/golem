import { promisify } from 'util'
import {
  AudioPlayer,
  AudioPlayerState,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  entersState,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionState,
  VoiceConnectionStatus,
} from '@discordjs/voice'
import winston from 'winston'
import { Analytics } from '../analytics'
import { Golem } from '../golem'
import { ListingInfo } from '../models/listing'
import { GolemLogger, LogSources } from '../utils/logger'
import { humanReadableTime } from '../utils/time-utils'
import { Track, TrackAudioResourceMetadata } from '~/models/track'
import { TrackQueue } from './queue'

const wait = promisify(setTimeout)

export class MusicPlayer {
  private readonly queue: TrackQueue
  private readonly log: winston.Logger
  private currentResource?: AudioResource

  public queueLock = false
  public readyLock = false

  public readonly voiceConnection: VoiceConnection
  public readonly audioPlayer: AudioPlayer

  get isPlaying(): boolean {
    return this.audioPlayer.state.status === AudioPlayerStatus.Playing
  }

  get nowPlaying(): string | undefined {
    const info = this.currentResource?.metadata as ListingInfo
    return info ? `${info.artist} - ${info.album} - ${info.title}` : undefined
  }

  get currentTrackRemaining(): number {
    return (
      (this.queue.peek()?.listing.duration || 0) -
      (this.currentResource?.playbackDuration || 0) / 1000
    )
  }

  get stats(): { count: number; time: number; hTime: string } {
    return {
      count: this.queue.queuedTrackCount,
      time: this.queue.runTime + this.currentTrackRemaining,
      hTime: humanReadableTime(this.queue.runTime + this.currentTrackRemaining),
    }
  }

  public constructor(voiceConnection: VoiceConnection) {
    this.log = GolemLogger.child({ src: LogSources.MusicPlayer })
    this.voiceConnection = voiceConnection
    this.audioPlayer = createAudioPlayer()
    this.queue = new TrackQueue()

    this.voiceConnection.on(
      'stateChange',
      this.voiceConnectionStateHandler.bind(this)
    )

    this.audioPlayer.on('stateChange', this.playerStateHandler.bind(this))

    this.voiceConnection.subscribe(this.audioPlayer)
  }

  public enqueue(userId: string, track: Track): void {
    this.log.info(`queueing ${track.shortName}`)
    this.queue.add(userId, track)
    Analytics.queuePlayRecord(track.listing.trackId, userId)

    if (this.queue.queuedTrackCount === 0) {
      Analytics.playRecord(track.listing.trackId)
    }

    void this.processQueue()
  }

  public enqueueMany(userId: string, tracks: Track[]): void {
    this.log.info(`enqueueing ${tracks.length} tracks`)
    this.queue.addMany(userId, tracks)
    void this.processQueue()
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
    this.log.info(`clearing queue`)
    this.queueLock = true
    this.queue.clear()
    this.currentResource = undefined
    this.log.info(`force stopping player`)
    this.audioPlayer.stop(true)
  }

  public skip(): void {
    this.log.info(
      `skipping ${
        (this.currentResource?.metadata as TrackAudioResourceMetadata).track
          .title
      }`
    )
    Analytics.skipRecord(
      (this.currentResource?.metadata as TrackAudioResourceMetadata).track
        .trackId || ''
    )
    this.processQueue(true)
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
    this.voiceConnection.destroy()
  }

  public destroy(): void {
    Golem.removePlayer(this.voiceConnection.joinConfig.channelId || '')
    this.voiceConnection.destroy()
  }

  public get trackCount(): number {
    return this.queue.queuedTrackCount + (this.isPlaying ? 1 : 0)
  }

  private processQueue(force = false): void {
    this.log.debug(`processing queue${force ? ' - forcing next' : ''}`)
    if (
      (!force &&
        (this.queueLock ||
          this.audioPlayer.state.status !== AudioPlayerStatus.Idle)) ||
      this.queue.queuedTrackCount === 0
    ) {
      this.log.debug(`skipping processing due to state`)
      return
    }
    this.queueLock = true

    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    const nextTrack = this.queue.pop()!

    this.log.info(`playing ${nextTrack.shortName}`)
    const next = nextTrack.toAudioResource()
    this.currentResource = next
    this.audioPlayer.play(this.currentResource)

    if (this.queue.queuedTrackCount === 0) {
      Analytics.playRecord(
        (this.currentResource?.metadata as TrackAudioResourceMetadata).track
          .title
      )
    } else {
      Analytics.autoplayRecord(
        (this.currentResource?.metadata as TrackAudioResourceMetadata).track
          .title
      )
    }

    this.queueLock = false
  }

  private playerStateHandler(
    oldState: AudioPlayerState,
    newState: AudioPlayerState
  ): void {
    if (
      newState.status === AudioPlayerStatus.Idle &&
      oldState.status !== AudioPlayerStatus.Idle
    ) {
      this.log.debug(`entering Idle state - processing queue`)
      void this.processQueue()
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
}