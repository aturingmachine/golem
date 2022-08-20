import { CustomTransportStrategy, Server } from '@nestjs/microservices'
import { Client, Intents } from 'discord.js'

export class DiscordBotServer
  extends Server
  implements CustomTransportStrategy
{
  client!: Client

  constructor() {
    super()
  }

  init(): void {
    console.log('Init Bot Server')
    this.client =
      this.client ||
      new Client({
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

  login(token?: string): Promise<string> {
    if (!token) {
      throw new Error('No Discord Bot Token provided.')
    }

    return this.client.login(token)
  }

  /**
   * This method is triggered when you run "app.listen()".
   */
  async listen(callback: () => void): Promise<void> {
    this.client.on('ready', (_c) => {
      // console.log('Logged in as', c.user.id)
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