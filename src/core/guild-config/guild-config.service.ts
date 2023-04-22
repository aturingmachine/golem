import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MongoRepository } from 'typeorm'
import { formatForLog } from '../../utils/debug-utils'
import { LoggerService } from '../logger/logger.service'
import { PermissionsService } from '../permissions/permissions.service'
import { GuildConfig } from './guild-config.model'

@Injectable()
export class GuildConfigService {
  constructor(
    private log: LoggerService,
    private permissionsService: PermissionsService,

    @InjectRepository(GuildConfig)
    private guildConfigs: MongoRepository<GuildConfig>
  ) {
    this.log.setContext('GuildConfigService')
  }

  async setDefaultChannelId(guildId: string, channelId: string): Promise<void> {
    this.log.debug(
      `setDefaultChannelId: for guild="${guildId}" channel="${channelId}"`
    )
    const existing = await this.forGuild(guildId)

    if (!!existing[0]?.defaultChannelId) {
      this.log.debug(
        `guild="${guildId}" default channel already set to "${existing[0]?.defaultChannelId}"`
      )
      return
    }

    existing[0].defaultChannelId = channelId

    await this.update(existing[0])
  }

  forGuild(guildId: string): Promise<GuildConfig[]> {
    return this.guildConfigs.find({ where: { guildId } })
  }

  async createDefault(guildId: string): Promise<GuildConfig> {
    this.log.info(`creating default config for guildId="${guildId}"`)

    const base = this.guildConfigs.create({
      guildId,
      subscribedToUpdates: false,
    })

    return this.guildConfigs.save(base)
  }

  async getOrCreateDefault(guildId: string): Promise<GuildConfig> {
    let newDefault
    const existing = await this.forGuild(guildId)

    if (!existing || !existing.length) {
      newDefault = await this.createDefault(guildId)
    }

    return existing[0] || newDefault
  }

  async update(newConfig: GuildConfig): Promise<void> {
    this.log.info(`updating config for guildId="${newConfig.guildId}"`)
    this.log.debug(`newConfig="${formatForLog(newConfig)}"`)

    await this.guildConfigs.update({ guildId: newConfig.guildId }, newConfig)
  }
}
