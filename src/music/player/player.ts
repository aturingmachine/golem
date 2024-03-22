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
  VoiceConnectionConnectingState,
  VoiceConnectionDestroyedState,
  VoiceConnectionDisconnectedState,
  VoiceConnectionDisconnectReason,
  VoiceConnectionSignallingState,
  VoiceConnectionState,
  VoiceConnectionStatus,
} from '@discordjs/voice'
import { ModuleRef } from '@nestjs/core'
import { ChannelType } from 'discord.js'
import { v4 } from 'uuid'
import { ClientService } from '../../core/client.service'
import { LoggerService } from '../../core/logger/logger.service'
import { humanReadableTime, wait } from '../../utils/time-utils'
import { AListing } from '../local/listings/listings'
import { TrackAudioResourceMetadata, TrackType } from '../tracks'
import { AudioResourceDefinition } from './player.service'
import { QueuedTrack, TrackQueue } from './queue'

export type MusicPlayerJSON = {
  guild: {
    id: string
    name: string
  }
  channel: {
    id: string
    name: string
  }
  nowPlaying: {
    listing: {
      id: string | undefined
      type: TrackType | undefined
      duration: number | undefined
      playbackDuration: number | undefined
      title: string | undefined
      artist: string | undefined
    }
  }
  queue: any[]
  status: AudioPlayerStatus
}

export type GolemTrackAudioResource = AudioResource & {
  metadata: TrackAudioResourceMetadata
}

export type MusicPlayerOptions = JoinVoiceChannelOptions &
  CreateVoiceConnectionOptions & {
    guildName: string
    channelName: string
    onDestroy: () => void
  }

export class MusicPlayer {
  static readonly autoDCTime = 30_000
  // static readonly autoDCTime = 300_000

  private leaveTimeout?: NodeJS.Timeout
  private queue!: TrackQueue
  private log!: LoggerService

  private readonly clientService: ClientService

  public queueLock = false
  public readyLock = false
  public voiceConnection!: VoiceConnection
  public currentResource?: GolemTrackAudioResource

  public readonly id: string
  public readonly audioPlayer: AudioPlayer
  public readonly guildName: string

  // TODO tracking these causes golem to hop into wrong channel lol
  public readonly _channelName: string
  private _channelId: string

  public constructor(
    private ref: ModuleRef,
    private options: MusicPlayerOptions
  ) {
    this.id = v4()

    this.clientService = ref.get(ClientService, { strict: false })
    this.guildName = options.guildName
    this._channelName = options.channelName
    this._channelId = options.channelId
    this.audioPlayer = createAudioPlayer()

    this.audioPlayer.on('error', this.audioPlayErrorHandler.bind(this))
  }

  async init(): Promise<void> {
    this.log = await this.ref.resolve(LoggerService, undefined, {
      strict: false,
    })
    this.log.setContext('MusicPlayer', this.guildName, this.options.guildId)
    this.log.debug('Logger resolved for the Player')

    this.log.debug('Trying to resolve a LoggerService for the queue')
    const queueLogger = await this.ref.resolve(LoggerService, undefined, {
      strict: false,
    })
    this.log.debug('Resolved a LoggerService for the Queue')

    this.queue = new TrackQueue(queueLogger, this.guildName)
    this.log.debug('Should be done with the init')

    this.addPlayerStateHandlers()
    this.joinVoice()
  }

  toJSON(): MusicPlayerJSON {
    return {
      guild: {
        id: this.options.guildId,
        name: this.options.guildName,
      },
      channel: {
        id: this.options.channelId,
        name: this.options.channelName,
      },
      nowPlaying: {
        listing: {
          type: this.nowPlayingResource?.metadata.track.type,
          id: this.nowPlaying?.listingId,
          duration: this.nowPlaying?.duration,
          playbackDuration: this.nowPlayingResource?.playbackDuration,
          title: this.nowPlaying?.title,
          artist: this.nowPlaying?.artist,
        },
      },
      status: this.audioPlayer.state.status,
      queue: this.queue.queue.map((track) => {
        return {
          type: track.audioResource.track.type,
          id: track.audioResource.track.listing.listingId,
          title: track.audioResource.track.listing.title,
          album: track.audioResource.track.listing.albumName,
          albumId:
            '_id' in track.audioResource.track.listing.album
              ? track.audioResource.track.listing.album._id
              : '',
          artist: track.audioResource.track.listing.artist,
          duration: track.audioResource.track.listing.duration,
        }
      }),
    }
  }

  /**
   * The primary key that the player should be referenced by.
   * Currently the GuildID of the Player.
   */
  public get primaryKey(): string {
    return this.options.guildId
  }

  public get presenceId(): string {
    return `${this.options.guildId}-${this.options.channelId}-player-status`
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

  public get nowPlayingResource(): GolemTrackAudioResource | undefined {
    return this.currentResource
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

  public get isConnected(): boolean {
    return this.voiceConnection?.state?.status === VoiceConnectionStatus.Ready
  }

  public get isDisconnected(): boolean {
    return (
      this.voiceConnection?.state?.status === VoiceConnectionStatus.Disconnected
    )
  }

  public get isDestroyed(): boolean {
    return (
      this.voiceConnection?.state?.status === VoiceConnectionStatus.Destroyed
    )
  }

  public async enqueue(
    resource: AudioResourceDefinition,
    enqueueAsNext = false
  ): Promise<void> {
    this.log.verbose(
      `enqueue - VC Status = ${this.voiceConnection.state.status}`
    )
    this.log.info(
      `queueing${enqueueAsNext ? ' as next ' : ' '}${resource.track.name}`
    )

    if (enqueueAsNext) {
      this.queue.addNext(resource.userId, resource)
    } else {
      this.queue.add(resource.userId, resource)
    }

    this.log.debug(`current queue ${this.queue.queue.length}`)

    // TODO thinking these should be moved into the process queue function?
    // resource.onPlay()

    void (await this.processQueue())

    // Golem.events.trigger(
    //   GolemEvent.Queue,
    //   this.voiceConnection.joinConfig.guildId
    // )
  }

  public async enqueueMany(
    userId: string,
    tracks: AudioResourceDefinition[]
  ): Promise<void> {
    this.log.info(`enqueueing ${tracks.length} listings`)
    this.queue.addMany(userId, tracks)
    // TODO handle this properly
    // tracks.forEach((t) => t.onPlay())
    await this.processQueue()

    // Golem.events.trigger(
    //   GolemEvent.Queue,
    //   this.voiceConnection.joinConfig.guildId
    // )
  }

  public async skip(count = 0): Promise<void> {
    this.log.info(`skipping ${this.currentResource?.metadata.listing.title}`)
    this.currentResource?.metadata.track.onSkip()

    this.queue.skip(count)

    await this.processQueue(true)
  }

  // TODO add on destroy callback here
  public async destroy(): Promise<void> {
    this.log.verbose(
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
      this.voiceConnection.destroy()
      this.updatePresence()
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
    this.updatePresence()
    // Golem.presence.update()
    // this.disconnect()

    this.startTimer()
  }

  public shuffle(): void {
    this.log.info('shuffling')
    this.queue.shuffle()
  }

  public trackList(): QueuedTrack[] {
    this.log.info('fetching tracklist')
    return this.queue.queue
  }

  public peek(depth = 5): AudioResourceDefinition[] {
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
      this.log.info(
        `disconnecting voice connection for ${this.primaryKey} -  ${this.secondaryKey}`
      )

      this.queueLock = false
      this.voiceConnection.disconnect()
      this.updatePresence()

      this.options.onDestroy()
    }
  }

  startTimer(): void {
    if (this.leaveTimeout) {
      this.log.info(
        `attempted to start a timer when was already set for ${this.primaryKey} -  ${this.secondaryKey}`
      )

      return
    }

    this.log.info(
      `starting auto-dc timer for ${this.primaryKey} -  ${this.secondaryKey}`
    )

    this.leaveTimeout = setTimeout(
      this.autoDisconnect.bind(this),
      MusicPlayer.autoDCTime
    )
  }

  get channelId(): string {
    return this._channelId
  }

  set channelId(id: string) {
    this.log.info(`Updating players channel id to "${id}`)

    this._channelId = id
  }

  async clearTimer(force = false): Promise<void> {
    this.log.info(
      `clearing auto-dc timer for ${this.primaryKey} -  ${this.secondaryKey} - ${force}`
    )

    if (force && this.leaveTimeout) {
      clearTimeout(this.leaveTimeout)
      this.leaveTimeout = undefined

      return
    }

    const channel = await this.clientService.channels.fetch(this._channelId)

    this.log.info(
      `clear timeout isVoiceChannel="${
        channel?.type === ChannelType.GuildVoice
      }"`
    )

    if (
      channel?.type === ChannelType.GuildVoice &&
      channel.members.size === 1
    ) {
      this.log.info(
        `non-forced timer clear bailing early for ${this.primaryKey} -  ${this.secondaryKey}. {${channel.type}:::${channel.members.size}}`
      )

      return
    }

    if (this.leaveTimeout) {
      clearTimeout(this.leaveTimeout)
      this.leaveTimeout = undefined
    }
  }

  private joinVoice(): void {
    this.voiceConnection = joinVoiceChannel({
      ...this.options,
      channelId: this.channelId,
    })

    this.voiceConnection.on(
      VoiceConnectionStatus.Disconnected,
      this.onVoiceDisconnected.bind(this)
    )

    this.voiceConnection.on(
      VoiceConnectionStatus.Destroyed,
      this.onVoiceDestroyed.bind(this)
    )

    this.voiceConnection.on(
      VoiceConnectionStatus.Connecting,
      this.onVoiceConnectingOrSignalling.bind(this)
    )

    this.voiceConnection.on(
      VoiceConnectionStatus.Signalling,
      this.onVoiceConnectingOrSignalling.bind(this)
    )

    this.subscribe()
  }

  private subscribe(): void {
    this.log.info(`subscribing for [${this.options.guildName}]`)
    this.voiceConnection.subscribe(this.audioPlayer)
  }

  private async autoDisconnect(): Promise<void> {
    this.log.info(
      `auto disconnect triggered for ${
        this.voiceConnection.joinConfig.channelId || ''
      }`
    )
    await this.destroy()

    await this.clearTimer(true)
    this.updatePresence()
  }

  private updatePresence(): void {
    this.clientService.removePresence(this.presenceId)

    if (this.nowPlaying) {
      this.clientService.addPresence({
        id: this.presenceId,
        status: `${this.nowPlaying.title}`,
      })
    }
  }

  private async processQueue(force = false): Promise<void> {
    this.log.verbose(`processing queue${force ? ' - forcing next' : ''}`)
    this.log.verbose(
      `processing queue - VC Status = ${this.voiceConnection.state.status}`
    )

    // TODO state transfers have changed I think and this is triggering when the shit
    // is empty lol
    if (this.isDestroyed && this.queue.queue.length > 0) {
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

      this.updatePresence()
      return
    }

    this.queueLock = true

    const nextTrack = this.queue.pop()

    // this.log.info(`playing ${nextTrack.listing.shortName}`)

    // Be careful in case the skip is forced and the last run
    if (nextTrack) {
      await this.clearTimer(true)

      this.log.verbose(`process has next track, attempting play`)
      try {
        const next = await nextTrack.factory()
        this.log.debug(`audio resouce generated`)
        this.currentResource = next
        this.currentResource.volume?.setVolume(0.35)
        this.audioPlayer.play(this.currentResource)

        // Golem.events.trigger(
        //   GolemEvent.Queue,
        //   this.voiceConnection.joinConfig.guildId
        // )
      } catch (error) {
        this.log.error(`error processing queue ${error}`)
        this.skip()
      }
    } else {
      this.log.verbose(`process has no next track, stopping out of caution`)
      this.stop()
      // Golem.events.trigger(
      //   GolemEvent.Queue,
      //   this.voiceConnection.joinConfig.guildId
      // )
    }

    this.queueLock = false
    this.updatePresence()
  }

  private onAutoPause(
    _oldState: AudioPlayerState,
    _newState: AudioPlayerState
  ): void {
    // this.log.debug(
    //   `player state change ${oldState.status} => ${newState.status}`
    // )
    this.startTimer()
  }

  private onBuffering(
    _oldState: AudioPlayerState,
    _newState: AudioPlayerState
  ): Promise<void> {
    // this.log.debug(
    //   `player state change ${oldState.status} => ${newState.status}`
    // )
    return this.clearTimer()
  }

  private async onIdle(
    oldState: AudioPlayerState,
    _newState: AudioPlayerState
  ): Promise<void> {
    // this.log.debug(
    //   `player state change ${oldState.status} => ${newState.status}`
    // )
    this.startTimer()

    if (
      oldState.status !== AudioPlayerStatus.Idle &&
      !this.isDisconnected &&
      !this.isDestroyed
    ) {
      // process queue
      await this.processQueue()
    }
  }

  private onPaused(
    _oldState: AudioPlayerState,
    _newState: AudioPlayerState
  ): void {
    // this.log.debug(
    //   `player state change ${oldState.status} => ${newState.status}`
    // )
    this.startTimer()
  }

  private onPlaying(
    _oldState: AudioPlayerState,
    _newState: AudioPlayerState
  ): Promise<void> {
    return this.clearTimer()
    // this.log.debug(
    //   `player state change ${oldState.status} => ${newState.status}`
    // )
    // if (!isNotActive(oldState.status)) {
    //   // clear timer
    //   this.clearTimer()

    // if idle trigger queue event
    // if (oldState.status === AudioPlayerStatus.Idle) {
    // Golem.events.trigger(
    //   GolemEvent.Queue,
    //   this.voiceConnection.joinConfig.guildId
    // )
    // }
    // }
  }

  private addPlayerStateHandlers(): void {
    this.audioPlayer.on('stateChange', async (oldState, newState) => {
      this.log.info(
        `player state change ${oldState.status} => ${newState.status}`
      )

      switch (newState.status) {
        case AudioPlayerStatus.AutoPaused:
          this.onAutoPause(oldState, newState)
          break
        case AudioPlayerStatus.Buffering:
          this.onBuffering(oldState, newState)
          break
        case AudioPlayerStatus.Idle:
          await this.onIdle(oldState, newState)
          break
        case AudioPlayerStatus.Paused:
          this.onPaused(oldState, newState)
          break
        case AudioPlayerStatus.Playing:
          this.onPlaying(oldState, newState)
          break
      }
    })

    // this.audioPlayer.on(
    //   AudioPlayerStatus.AutoPaused,
    //   this.onAutoPause.bind(this)
    // )
    // this.audioPlayer.on(
    //   AudioPlayerStatus.Buffering,
    //   this.onBuffering.bind(this)
    // )
    // this.audioPlayer.on(AudioPlayerStatus.Idle, this.onIdle.bind(this))
    // this.audioPlayer.on(AudioPlayerStatus.Paused, this.onPaused.bind(this))
    // this.audioPlayer.on(AudioPlayerStatus.Playing, this.onPlaying.bind(this))
  }

  private async onVoiceDisconnected(
    oldState: VoiceConnectionState,
    newState: VoiceConnectionDisconnectedState
  ): Promise<void> {
    this.log.debug(
      `voice state change ${oldState.status} => ${newState.status}`
    )
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
       * The disconnect in this case is recoverable, and we also have <5 repeated attempts so we will reconnect.
       */
      await wait((this.voiceConnection.rejoinAttempts + 1) * 5_000)
      this.voiceConnection.rejoin()
    } else {
      /*
       * The disconnect in this case may be recoverable, but we have no more remaining attempts - destroy.
       */
      this.voiceConnection.destroy()
    }
  }

  private async onVoiceDestroyed(
    oldState: VoiceConnectionState,
    newState: VoiceConnectionDestroyedState
  ): Promise<void> {
    this.log.debug(
      `voice state change ${oldState.status} => ${newState.status}`
    )
    /*
     * Once destroyed, stop the subscription
     */
    this.stop()
  }

  private async onVoiceConnectingOrSignalling(
    oldState: VoiceConnectionState,
    newState: VoiceConnectionConnectingState | VoiceConnectionSignallingState
  ): Promise<void> {
    this.log.debug(
      `voice state change ${oldState.status} => ${newState.status}`
    )
    /*
     * In the Signalling or Connecting states, we set a 20 second time limit for the connection to become ready
     * before destroying the voice connection. This stops the voice connection permanently existing in one of these
     * states.
     */
    this.readyLock = true
    try {
      await entersState(
        this.voiceConnection,
        VoiceConnectionStatus.Ready,
        20_000
      )
    } catch {
      if (this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed)
        this.voiceConnection.destroy()
    } finally {
      this.readyLock = false
    }
  }

  private audioPlayErrorHandler(error: AudioPlayerError): void {
    this.skip()
    this.log.error(`audio player error occurred ${error.message}`)
  }
}
