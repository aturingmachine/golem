import { Injectable } from '@nestjs/common'
import { MessagePayload, MessageCreateOptions } from 'discord.js'
import { ClientService } from '../client.service'
import { GuildConfigService } from '../guild-config/guild-config.service'
import { LoggerService } from '../logger/logger.service'

@Injectable()
export class UpdatesService {
  constructor(
    private log: LoggerService,
    private clientService: ClientService,
    private guildConfig: GuildConfigService
  ) {
    this.log.setContext('UpdatesService')
  }

  async sendUpdate(
    payload: string | MessagePayload | MessageCreateOptions
  ): Promise<void> {
    const allConfigs = await this.guildConfig.all()

    const guildsToNotify = allConfigs.filter(
      (config) => config.subscribedToUpdates && !!config.defaultChannelId
    )

    const results: Record<'success' | 'failed', string[]> = {
      success: [],
      failed: [],
    }

    for (const guild of guildsToNotify) {
      if (!this.clientService.client) {
        return
      }

      const channel =
        this.clientService.client.channels.cache.get(guild.defaultChannelId!) ||
        (await this.clientService.client.channels.fetch(
          guild.defaultChannelId!
        ))

      const guildObj =
        this.clientService.client.guilds.cache.get(guild.guildId) ||
        (await this.clientService.client.guilds.fetch(guild.guildId))

      if (channel && channel.isTextBased()) {
        try {
          await channel.send(payload)
          results.success.push(guildObj.name)
        } catch (error) {
          results.failed.push(guildObj.name)
          this.log.error(
            `failed to send update to [${guild.guildId}::${guildObj.name}]`,
            error
          )
        }
      }
    }
  }
}
