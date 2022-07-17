import { CustomTransportStrategy, Server } from '@nestjs/microservices'
import { Client, Intents } from 'discord.js'

export class DiscordBotServer
  extends Server
  implements CustomTransportStrategy
{
  client!: Client

  constructor() {
    super()

    this.client = new Client({
      allowedMentions: {
        parse: ['users'],
      },
      intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_MESSAGES,
      ],
    })
  }

  login(): Promise<string> {
    return this.client.login('')
  }

  /**
   * This method is triggered when you run "app.listen()".
   */
  async listen(callback: () => void): Promise<void> {
    await this.login()

    this.client.on('ready', (c) => {
      console.log('Logged in as', c.user.id)
    })

    this.client.on('messageCreate', (message) => {
      const handler = this.messageHandlers.get('messageCreate')

      if (handler) {
        handler({ message }, { something: 'some value' })
      }
    })

    callback()
  }

  /**
   * This method is triggered on application shutdown.
   */
  close() {
    //
  }
}
