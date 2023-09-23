import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  ChannelManager,
  Client,
  Collection,
  Guild,
  GuildManager,
  MessageCreateOptions,
  MessagePayload,
  User,
} from 'discord.js'
import { LoggerService } from './logger/logger.service'
import { BotPresenceService, GolemPresence } from './presence.service'

@Injectable()
export class ClientService {
  private _clientInstance?: Client

  constructor(
    private log: LoggerService,
    private config: ConfigService,
    private presence: BotPresenceService
  ) {
    this.log.setContext('ClientService')
  }

  set client(newClient: Client | undefined) {
    if (!this._clientInstance && newClient) {
      this.log.verbose('receiving new client instance')
      this._clientInstance = newClient
    }
  }

  get client(): Client | undefined {
    return this._clientInstance
  }

  get botId(): string | undefined {
    return this.client?.user?.id
  }

  get channels(): ChannelManager {
    if (!this.client) {
      throw new Error('Attempting to access undefined client.')
    }

    return this.client?.channels
  }

  get guildManager(): GuildManager {
    if (!this.client) {
      throw new Error('Attempting to access undefined client.')
    }

    return this.client.guilds
  }

  get guilds(): Collection<string, Guild> {
    if (!this.client) {
      throw new Error('Attempting to access undefined client.')
    }

    return this.client.guilds.cache
  }

  get guildIds(): string[] {
    return Object.keys(this.guildManager.cache)
  }

  userById(id: string): Promise<User> | undefined {
    try {
      return this.client?.users.fetch(id)
    } catch (error) {
      this.log.error(`unable to get user ${id}`, error)
      this.log.info(`unable to get user ${id} ${error}`)

      throw error
    }
  }

  startPresenceManager() {
    this.presence.startRotation((newStatus) => {
      this.client?.user?.setActivity(newStatus)
    })
  }

  addPresence(presence: GolemPresence) {
    this.presence.add(presence)
  }

  removePresence(id: string) {
    this.presence.remove(id)
  }

  async messageAdmin(
    payload: string | MessagePayload | MessageCreateOptions
  ): Promise<void> {
    this.log.info('sending DM to admin')

    const adminId = this.config.get('discord.adminId')

    if (!this.client || !adminId) {
      return
    }

    this.client.users.send(adminId, payload)
  }
}
