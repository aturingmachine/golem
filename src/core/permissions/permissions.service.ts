import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { MongoRepository } from 'typeorm'
import { GolemMessage } from '../../messages/golem-message'
import { LoggerService } from '../logger/logger.service'
import { PermissionCode, Permissions } from './permissions'

@Injectable()
export class PermissionsService {
  constructor(
    private log: LoggerService,
    private config: ConfigService,

    @InjectRepository(Permissions)
    private permissions: MongoRepository<Permissions>
  ) {
    this.log.setContext('PermissionsService')
  }

  async isAdmin(message: GolemMessage): Promise<boolean> {
    const rec = await this.for(message)

    return rec.permissions.includes(PermissionCode.Admin)
  }

  lookup(userId: string, guildId: string): Promise<Permissions | null> {
    return this.permissions.findOneBy({ userId, guildId })
  }

  async create(
    userId: string,
    guildId: string,
    permissions: PermissionCode[]
  ): Promise<Permissions> {
    const perm = this.permissions.create({ guildId, userId, permissions })

    await this.permissions.insertOne(perm)

    return perm
  }

  async upsert(
    userId: string,
    guildId: string,
    permissions: PermissionCode[]
  ): Promise<Permissions> {
    let record = await this.lookup(userId, guildId)

    if (record) {
      record.permissions = permissions
    } else {
      record = await this.create(userId, guildId, permissions)
    }

    return record
  }

  async for(message: GolemMessage): Promise<Permissions> {
    if (message.info.userId === this.config.get('discord.adminId')) {
      this.log.info(`creating new base admin record`)

      const rec = await this.permissions.findOneBy({
        userId: message.info.userId,
      })

      if (rec) {
        return rec
      }

      return Permissions.adminRecord(message.info.userId, message.info.guildId)
    }

    let rec = await this.permissions.findOneBy({
      userId: message.info.userId,
      guildId: message.info.guildId,
    })

    if (rec) {
      return rec
    }

    this.log.info(
      `database miss for user: ${message.info.userId} on guild ${message.info.guildId}`
    )

    // If the user is the owner of the Server they get more privileges
    if (message.info.userId === message.info.guild?.ownerId) {
      this.log.info(`creating new moderator permissions record`)
      rec = Permissions.moderatorRecord(
        message.info.userId,
        message.info.guildId
      )
    } else {
      this.log.info(`creating new base permissions record`)

      // Theres no record for that user on that guild
      // So we'll make a new base record.
      rec = Permissions.baseRecord(message.info)
    }

    await this.permissions.save(rec)

    return rec
  }
}
