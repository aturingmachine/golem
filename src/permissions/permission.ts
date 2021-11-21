import { CommandInteraction, Message } from 'discord.js'
import { Collection, Filter, FindOptions, ObjectId } from 'mongodb'
import { Golem } from '../golem'
import { DatabaseRecord } from '../models/db'
import { MessageInfo } from '../models/messages/message-info'
import { formatForLog } from '../utils/debug-utils'
import { GolemLogger } from '../utils/logger'

type UserPermissionRecord = DatabaseRecord<UserPermission>

export enum Permission {
  Admin = 'admin',
  AliasCreate = 'alias.create',
  AliasDeleteAny = 'alias.delete.any',
  AliasDeleteOwn = 'alias.delete.own',
  AliasEditAny = 'alias.edit.any',
  AliasEditOwn = 'alias.edit.own',
  PlaylistCreate = 'playlist.create',
  PlaylistDeleteAny = 'playlist.delete.any',
  PlaylistDeleteOwn = 'playlist.delete.own',
  PlaylistEditAny = 'playlist.edit.any',
  PlaylistEditOwn = 'playlist.edit.own',
}

const BasePermissions = [
  Permission.AliasCreate,
  Permission.AliasDeleteOwn,
  Permission.AliasEditOwn,
  Permission.PlaylistCreate,
  Permission.PlaylistDeleteOwn,
  Permission.PlaylistEditOwn,
]

/**
 * @todo need to figure out an efficient way to check things.
 * maybe pass in the interaction and the lowest needed permission?
 */
export class UserPermission {
  private static log = GolemLogger.child({ src: 'perms' })
  public _id!: ObjectId
  public permissions: Set<Permission>

  constructor(
    public userId: string,
    public guildId: string,
    permissions?: Permission[]
  ) {
    this.permissions = new Set(permissions || BasePermissions)
  }

  can(perms: Permission[]): boolean {
    return (
      this.permissions.has(Permission.Admin) ||
      perms.some((perm) => this.permissions.has(perm))
    )
  }

  async save(): Promise<this> {
    if (this._id) {
      await UserPermission.Collection.replaceOne(
        { _id: { $eq: this._id } },
        { ...this, permissions: Array.from(this.permissions) }
      )
    } else {
      const result = await UserPermission.Collection.insertOne({
        ...this,
        permissions: Array.from(this.permissions),
      })
      this._id = result.insertedId
    }

    return this
  }

  static async findOne(
    filter: Filter<UserPermissionRecord>,
    options?: FindOptions
  ): Promise<UserPermission | null> {
    const record = await UserPermission.Collection.findOne(filter, options)

    if (record) {
      const permissions = new UserPermission(record.userId, record.guildId, [
        ...record.permissions,
      ])

      permissions._id = record._id

      return permissions
    } else {
      return null
    }
  }

  static async get(userId: string, guildId: string): Promise<UserPermission> {
    // check cache
    const cacheRecord = Golem.permissions.get(userId, guildId)

    if (cacheRecord) {
      UserPermission.log.debug('permission cache hit')
      return cacheRecord
    }
    UserPermission.log.silly('permission cache miss')

    // check db, insert to cache
    const dbRecord = await UserPermission.findOne({
      userId: userId,
      guildId: guildId,
    })

    if (dbRecord) {
      UserPermission.log.debug('permission record pulled from db')
      const parsedDbRecord = UserPermission.fromData(dbRecord)

      Golem.permissions.set(parsedDbRecord)
      return parsedDbRecord
    }

    UserPermission.log.silly('permission db miss')
    UserPermission.log.debug('creating new permission record')
    // create new record, insert to db, set into cache
    const newRecord = new UserPermission(userId, guildId)
    console.log(newRecord)
    Golem.permissions.set(newRecord)
    await newRecord.save()

    return newRecord
  }

  static async check(
    interaction: CommandInteraction | Message,
    perms: Permission[]
  ): Promise<boolean> {
    const info = new MessageInfo(interaction)
    UserPermission.log.debug(
      `checking permission: ${formatForLog({
        userId: info.userId,
        guildId: info.guildId,
        perms,
      })}`
    )

    const rec = await UserPermission.get(info.userId, info.guildId)

    return UserPermission.checkPermissions(rec, perms)
  }

  static fromData(data: UserPermission): UserPermission {
    return new UserPermission(data.userId, data.guildId, [...data.permissions])
  }

  private static checkPermissions(
    userPerm: UserPermission,
    perms: Permission[]
  ): boolean {
    return perms.some((perm) => userPerm.permissions.has(perm))
  }

  private static get Collection(): Collection<UserPermissionRecord> {
    return Golem.db.collection<UserPermissionRecord>('permissions')
  }
}

export class UserPermissionCache {
  private cache: Map<string, Record<string, UserPermission>>

  constructor() {
    this.cache = new Map()
  }

  set(perm: UserPermission): void {
    const record = this.cache.get(perm.userId)

    if (record) {
      record[perm.guildId] = perm
      this.cache.set(perm.userId, record)
    } else {
      this.cache.set(perm.userId, { [perm.guildId]: perm })
    }
  }

  get(userId: string, guildId: string): UserPermission | undefined {
    return this.cache.get(userId)?.[guildId]
  }
}

export const Permissions = {
  Alias: {
    Create: [Permission.AliasCreate],
    Delete: {
      Own: [Permission.AliasDeleteOwn, Permission.AliasDeleteAny],
      Any: [Permission.AliasDeleteOwn],
    },
    Edit: {
      Own: [Permission.AliasEditOwn, Permission.AliasEditAny],
      Any: [Permission.AliasEditOwn],
    },
  },
  Playlist: {
    Create: [Permission.PlaylistCreate],
    Delete: {
      Own: [Permission.PlaylistDeleteOwn, Permission.PlaylistDeleteAny],
      Any: [Permission.PlaylistDeleteAny],
    },
    Edit: {
      Own: [Permission.PlaylistEditOwn, Permission.PlaylistEditAny],
      Any: [Permission.PlaylistEditAny],
    },
  },
}
