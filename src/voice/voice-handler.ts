import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnection,
} from '@discordjs/voice'
import { logger } from '../utils/logger'

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
  private static _initialized = false

  static play(resourceName: string, test: any): void {
    if (!Player._initialized) {
      Player.setup()
    }

    Player._initialized = true
    logger.debug(`Attempting to play ${resourceName} using opts ${test}`)
    if (!Player.connection) {
      logger.debug('No Connection, creating new')
      Player.connect(test)
      logger.debug('Connection Created')
    }

    const resource = createAudioResource(resourceName)

    Player.connection.subscribe(Player._player)
    logger.debug('Should be playing maybe?')

    logger.debug('Attempting to play!')
    logger.debug(Player._player.state)
    Player._player.play(resource)
    logger.debug(Player._player.state)
  }

  static disconnect(): void {
    Player.connection.destroy(true)
  }

  static connect(test: any): void {
    Player.connection = joinVoiceChannel({
      channelId: test.channelId,
      guildId: test.guildId,
      adapterCreator: test.voiceAdapterCreator,
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
