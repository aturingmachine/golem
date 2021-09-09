import {
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  createAudioResource,
  CreateVoiceConnectionOptions,
  joinVoiceChannel,
  JoinVoiceChannelOptions,
  NoSubscriberBehavior,
  VoiceConnection,
} from '@discordjs/voice'
import { Listing } from '../models/listing'
import { TrackQueue } from '../player/queue'
import { logger } from '../utils/logger'
import { humanReadableTime } from '../utils/time-utils'

/**
 * TODO
 * Running this out of a class seems like a bad idea the more i play with
 * the API. Thinking the best option is to write this as some raw ass js and
 * just have the play function exported, essentially loading all of the
 * binding and shit on start.
 *
 * - needs to pause when empty channel -> behavior
 * - needs to gracefully exit on sigint
 * - needs to leave on timeout (not sure if this is on me to do?)
 * - need to expose pause
 *
 * - need to implement queue (thinking this may have to be implemented
 *   elsewhere and will simply interact with this Player API or something?)
 *  - needs skipping
 *  - needs clearing
 *
 */

export class Player {
  private static connection: VoiceConnection
  private static _player = createAudioPlayer({
    debug: true,
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Play,
    },
  })
  private static _currentResource: AudioResource
  private static _initialized = false
  private static queue = new TrackQueue()

  static start(
    channelOptions: JoinVoiceChannelOptions & CreateVoiceConnectionOptions
  ): void {
    logger.debug(`Player:start`)
    if (!Player._initialized) {
      Player.setup()
      Player._initialized = true
    }

    if (!Player.connection) {
      logger.debug('No Connection, creating new')
      Player.connect(channelOptions)
      logger.debug('Connection Created')
    }
  }

  static enqueue(listing: Listing): void {
    logger.debug(`Enqueuing ${listing.name}`)
    Player.queue.add(listing)
    Player.play(listing)
  }

  static enqueueMany(listings: Listing[]): void {
    const first = listings.shift()

    if (first) {
      Player.enqueue(first)
      Player.queue.addMany(listings)
    }
  }

  // TODO also broken...
  static pause(): void {
    logger.info('Player pausing')
    Player._player.pause()
  }

  static skip(): void {
    logger.info('Player Skipping')
    Player.stop()

    const next = Player.queue.pop()
    if (next) {
      Player.play(next)
    }
  }

  static clear(): void {
    logger.info('Player clearing queue')
    Player.queue.clear()

    Player.stop()
  }

  static unpause(): void {
    logger.info('Player resuming playback')
    Player._player.unpause()
  }

  static get stats(): { count: number; time: number; hTime: string } {
    return {
      count: Player.queue.queuedTrackCount,
      time: Player.queue.runTime,
      hTime: humanReadableTime(Player.queue.runTime),
    }
  }

  static get nowPlaying(): string {
    return Player.queue.peek()?.name || 'No Track Playing'
  }

  static get isPlaying(): boolean {
    return !(
      !Player._currentResource ||
      (Player._currentResource && Player._currentResource.ended)
    )
  }

  private static play(listing: Listing): void {
    logger.debug(`Attempting to play ${listing.name}`)
    logger.debug(
      `Current Player State: connection: ${Player.connection}, resource: ${Player._currentResource}`
    )
    logger.debug(
      `CurrentResource: ${Player._currentResource}; Ended: ${Player._currentResource?.ended}`
    )

    if (!Player.isPlaying) {
      const resource = createAudioResource(listing.path)
      Player._currentResource = resource
      // Player._player.play(resource) // TODO wtf was this
      Player._player.play(Player._currentResource)
      logger.debug(
        `Resource Created: CurrentResource: ${Player._currentResource}; Ended: ${Player._currentResource?.ended}`
      )
    }

    Player.connection.subscribe(Player._player)
  }

  // TODO this might need to be fixed
  private static playNext(): void {
    logger.debug('Player::playNext Called')
    const nextTrack = Player.queue.peek()

    if (Player._currentResource?.ended && nextTrack) {
      logger.info(`Playing Next track ${nextTrack.name}`)
      Player.play(Player.queue.pop() || nextTrack)
    } else if (Player._currentResource?.ended && !nextTrack) {
      Player.queue.pop()
      Player.stop()
    }
  }

  private static stop(): void {
    Player._player.stop()
  }

  private static disconnect(): void {
    logger.debug('Player:disconnect')
    Player.connection.destroy()
    Player._initialized = false
    return
  }

  private static connect(
    channelOptions: JoinVoiceChannelOptions & CreateVoiceConnectionOptions
  ): void {
    logger.debug(
      `Connection With channelId: ${channelOptions.channelId} guildId: ${channelOptions.guildId}`
    )
    Player.connection = joinVoiceChannel({
      channelId: channelOptions.channelId,
      guildId: channelOptions.guildId,
      adapterCreator: channelOptions.adapterCreator,
    })
  }

  private static setup(): void {
    process.on('SIGINT', () => {
      Player.disconnect()
      return
    })

    Player._player.on('error', (error) => {
      logger.error(`Audio Player Error: ${error}`)
    })

    Player._player.on('debug', (msg) => {
      logger.debug(`voice-handler <debug> ${msg}`)
    })

    Player._player.on(AudioPlayerStatus.Buffering, () => {
      logger.debug('Entered Buffering')
    })

    Player._player.on(AudioPlayerStatus.Idle, () => {
      logger.debug('Entered Idle')
      Player.playNext()
    })

    Player._player.on(AudioPlayerStatus.Paused, () => {
      logger.debug('Entered Paused')
    })

    Player._player.on(AudioPlayerStatus.Playing, () => {
      logger.debug('Entered Playing')
    })

    Player._player.on(AudioPlayerStatus.AutoPaused, () => {
      logger.debug('Entered AutoPaused')
    })
  }
}
