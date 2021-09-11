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
import { logger } from '../utils/logger'
import { humanReadableTime } from '../utils/time-utils'
import { TrackQueue } from './queue'

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

const log = logger.child({ src: 'Player' })

export class Player {
  private static connection: VoiceConnection
  private static _player = createAudioPlayer({
    debug: true,
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Stop,
    },
  })
  private static _currentResource: AudioResource
  private static _initialized = false
  private static queue = new TrackQueue()

  static start(
    channelOptions: JoinVoiceChannelOptions & CreateVoiceConnectionOptions
  ): void {
    log.debug(`Start`)
    if (!Player._initialized) {
      Player.setup()
      Player._initialized = true
    }

    if (!Player.connection) {
      log.debug('No Connection, creating new')
      Player.connect(channelOptions)
      log.debug('Connection Created')
    }
  }

  static enqueue(listing: Listing): void {
    log.debug(`Enqueuing ${listing.name}`)
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
    log.info('pausing')
    Player._player.pause()
  }

  static skip(): void {
    log.info('Skipping')

    const next = Player.queue.pop()
    if (next) {
      Player.play(next)
    } else {
      Player.stop()
    }
  }

  static clear(): void {
    log.info('clearing queue')
    Player.stop()

    Player.queue.clear()
  }

  static unpause(): void {
    log.info('resuming playback')
    Player._player.unpause()
  }

  static peek(depth = 5): Listing[] {
    log.info('Peeking Deep')
    return this.queue.peekDeep(depth)
  }

  static shuffle(): void {
    log.info('Shuffling')
    this.queue.shuffle()
  }

  static get currentTrackRemaining(): number {
    return (
      (Player.queue.peek()?.duration || 0) -
      Player._currentResource.playbackDuration / 1000
    )
  }

  static get stats(): { count: number; time: number; hTime: string } {
    return {
      count: Player.queue.queuedTrackCount,
      time: Player.queue.runTime + Player.currentTrackRemaining,
      hTime: humanReadableTime(
        Player.queue.runTime + Player.currentTrackRemaining
      ),
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
    log.debug(`Attempting to play ${listing.name}`)
    log.debug(
      `Current Player State: connection: ${Player.connection}, resource: ${Player._currentResource}`
    )
    log.debug(
      `CurrentResource: ${Player._currentResource}; Ended: ${Player._currentResource?.ended}`
    )

    if (!Player.isPlaying) {
      const resource = createAudioResource(listing.path, {
        silencePaddingFrames: 10,
      })
      Player._currentResource = resource
      Player._player.play(resource) // TODO wtf was this
      // Player._player.play(Player._currentResource)
      log.debug(
        `Resource Created: CurrentResource: ${Player._currentResource}; Ended: ${Player._currentResource?.ended}`
      )
    }

    Player.connection.subscribe(Player._player)
  }

  // The peek pop peek can probs be pulled to a
  // function in teh queue?
  private static playNext(): void {
    log.debug('playNext Called')
    const nextTrack = Player.queue.peek()

    if (Player._currentResource?.ended && nextTrack) {
      Player.queue.pop()
      log.info(`Playing Next track ${nextTrack.name}`)
      const next = Player.queue.peek()
      if (next) {
        Player.play(next)
      }
    } else if (Player._currentResource?.ended && !nextTrack) {
      log.debug('playNext Resource ended, no next track')
      Player.queue.pop()
      Player.stop()
    }
  }

  private static stop(): void {
    Player._player.stop()
  }

  private static disconnect(): void {
    log.debug('Player:disconnect')
    Player.connection.destroy()
    Player._initialized = false
    return
  }

  private static connect(
    channelOptions: JoinVoiceChannelOptions & CreateVoiceConnectionOptions
  ): void {
    log.debug(
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
      log.error(`Audio Player Error: ${error}`)
    })

    Player._player.on('debug', (msg) => {
      log.debug(`<debug> ${msg}`)
    })

    Player._player.on(AudioPlayerStatus.Buffering, () => {
      log.debug('Entered Buffering')
    })

    Player._player.on(AudioPlayerStatus.Idle, () => {
      log.debug('Entered Idle')
      Player.playNext()
    })

    Player._player.on(AudioPlayerStatus.Paused, () => {
      log.debug('Entered Paused')
    })

    Player._player.on(AudioPlayerStatus.Playing, () => {
      log.debug('Entered Playing')
    })

    Player._player.on(AudioPlayerStatus.AutoPaused, () => {
      log.debug('Entered AutoPaused')
    })
  }
}
