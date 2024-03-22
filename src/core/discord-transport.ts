import { CustomTransportStrategy, Server } from '@nestjs/microservices'
import { Client, GatewayIntentBits, Partials } from 'discord.js'
import { LoggerService } from './logger/logger.service'

export class DiscordBotServer
  extends Server
  implements CustomTransportStrategy
{
  client!: Client
  log!: LoggerService

  constructor() {
    super()
  }

  init(log: LoggerService): void {
    this.log = this.log || log
    this.log.info('Initializing Bot Server Transport.')

    this.client =
      this.client ||
      new Client({
        allowedMentions: {
          parse: ['users'],
        },
        intents: [
          GatewayIntentBits.DirectMessages,
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildVoiceStates,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildMembers,
        ],
        partials: [Partials.Channel, Partials.Message],
      })

    this.log.info('Bot Server Transport Initialized.')
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
      this.log.info('Bot Server Transport Ready.')
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
    this.log.info('Bot Server Transport closing.')
  }
}
