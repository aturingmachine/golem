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

@Injectable()
export class ClientService {
  private _clientInstance?: Client

  constructor(private log: LoggerService, private config: ConfigService) {
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
    return this.client?.users.fetch(id)
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
