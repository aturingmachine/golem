import { Injectable } from '@nestjs/common'
import { ChannelManager, Client } from 'discord.js'
import { LoggerService } from './logger/logger.service'

@Injectable()
export class ClientService {
  private _clientInstance?: Client

  constructor(private log: LoggerService) {
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
}
