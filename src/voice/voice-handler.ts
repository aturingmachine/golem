import {
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  NoSubscriberBehavior,
  VoiceConnection,
} from '@discordjs/voice'

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
    console.log(`Attempting to play ${resourceName} using opts ${test}`)
    if (!Player.connection) {
      console.log('No Connection, creating new')
      Player.connect(test)
      console.log('Connection Created')
    }

    const resource = createAudioResource(resourceName)

    Player.connection.subscribe(Player._player)
    console.log('Should be playing maybe?')

    console.log('Attempting to play!')
    console.log(Player._player.state)
    Player._player.play(resource)
    console.log(Player._player.state)
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

    Player._player.on('error', console.error)

    Player._player.on('debug', console.log)

    Player._player.on(AudioPlayerStatus.Buffering, () =>
      console.log('Entered Buffering')
    )

    Player._player.on(AudioPlayerStatus.Idle, () => console.log('Entered Idle'))

    Player._player.on(AudioPlayerStatus.Paused, () =>
      console.log('Entered Paused')
    )

    Player._player.on(AudioPlayerStatus.Playing, () =>
      console.log('Entered Playing')
    )

    Player._player.on(AudioPlayerStatus.AutoPaused, () =>
      console.log('Entered AutoPaused')
    )
  }
}
