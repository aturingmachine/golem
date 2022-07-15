import { Injectable } from '@nestjs/common'
import {
  Client,
  ClientUser,
  Collection,
  Guild,
  Intents,
  User,
} from 'discord.js'
import { GolemConf } from '../config'
import { LogContexts } from '../logger/constants'
import { GolemLogger } from '../logger/logger.service'

@Injectable()
export class ClientService {
  private readonly _client: Client

  constructor(private config: GolemConf, private logger: GolemLogger) {
    this.logger.setContext(LogContexts.ClientService)

    this._client = new Client({
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

  async login(): Promise<void> {
    await this._client.login(this.config.discord.token)
  }

  get instance(): Client {
    return this._client
  }

  get guilds(): Collection<string, Guild> {
    return this._client.guilds.cache
  }

  get bot(): ClientUser | null {
    return this._client.user
  }

  getUser(id: string): Promise<User> {
    return this._client.users.fetch(id)
  }

  getGuild(id: string): Promise<Guild> {
    return this._client.guilds.fetch(id)
  }
}
