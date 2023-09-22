import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { MongoRepository } from 'typeorm'
import { GolemMessage } from '../../messages/golem-message'
import { formatForLog } from '../../utils/debug-utils'
import { ClientService } from '../client.service'
import { LoggerService } from '../logger/logger.service'
import { PermissionCode, Permissions } from './permissions'

type PermLookup = {
  userId: string
  guildId: string
}

@Injectable()
export class PermissionsService {
  constructor(
    private log: LoggerService,
    private config: ConfigService,
    private clientService: ClientService,

    @InjectRepository(Permissions)
    private permissions: MongoRepository<Permissions>
  ) {
    this.log.setContext('PermissionsService')
  }

  // Set admin to config adminId, and Moderator for all guild owners
  async setInitial(): Promise<void> {
    if (!this.clientService.client) {
      return
    }

    for (const item of this.clientService.guildManager.cache) {
      const [_id, guild] = item
      this.log.debug(
        `setting initial permissions for guild ${guild.name}:${guild.id}`
      )

      await this.for({
        userId: this.config.get('discord.adminId') || '',
        guildId: guild.id,
      })

      if (guild.ownerId === this.config.get('discord.adminId')) {
        continue
      }

      this.log.debug(`setting initial for guild owner: ${guild.ownerId}`)
      await this.for({
        userId: guild.ownerId,
        guildId: guild.id,
      })
    }
  }

  async isAdmin(params: GolemMessage | PermLookup): Promise<boolean> {
    this.log.info(`checking isAdmin on ${formatForLog(params)}`)

    let rec
    if (params instanceof GolemMessage) {
      if (params.isAdminDM()) {
        return true
      }

      rec = await this.for(params)
    } else {
      rec = await this.lookup(params.userId, params.guildId)
    }

    if (!rec) {
      return false
    }

    return rec.permissions.includes(PermissionCode.Admin)
  }

  async can(
    lookup: PermLookup,
    permList: PermissionCode[]
  ): Promise<boolean | undefined> {
    const record = await this.lookup(lookup.userId, lookup.guildId)

    this.log.debug(
      `checking ${formatForLog(lookup)} for ${permList.join(', ')}`
    )

    return [...permList, PermissionCode.Admin, PermissionCode.Moderator].some(
      (code) => record?.permissions.includes(code)
    )
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

  async for(message: GolemMessage | PermLookup): Promise<Permissions> {
    const isGolemMessage = message instanceof GolemMessage
    const userId = isGolemMessage ? message.info.userId : message.userId
    const guildId = isGolemMessage ? message.info.guildId : message.guildId
    const guild = isGolemMessage
      ? message.info.guild
      : this.clientService.guilds.get(guildId)
    const lookup = isGolemMessage ? message.info : message

    let rec: Permissions | null | undefined

    this.log.info(`checking perms for: ${userId} on guild ${guildId}`)

    if (userId === this.config.get('discord.adminId')) {
      this.log.info(`creating new base admin record`)

      rec = await this.permissions.findOneBy({
        userId: userId,
      })

      if (rec) {
        return rec
      }

      rec = Permissions.adminRecord(userId, guildId)

      if (userId === guild?.ownerId) {
        rec.permissions.push(PermissionCode.Moderator)
      }
    } else {
      rec = await this.permissions.findOneBy({
        userId: userId,
        guildId: guildId,
      })

      if (rec) {
        this.log.info(`database hit for user: ${userId} on guild ${guildId}`)
        return rec
      }

      this.log.info(`database miss for user: ${userId} on guild ${guildId}`)

      // If the user is the owner of the Server they get more privileges
      if (userId === guild?.ownerId) {
        this.log.info(`creating new moderator permissions record`)
        rec = Permissions.moderatorRecord(userId, guildId)
      } else {
        this.log.info(`creating new base permissions record`)

        // Theres no record for that user on that guild
        // So we'll make a new base record.
        rec = Permissions.baseRecord(lookup)
      }
    }

    this.log.debug(`saving new permissions rec ${formatForLog(rec)}`)

    await this.permissions.save(rec)

    return rec
  }
}
