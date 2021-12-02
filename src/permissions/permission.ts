import { Collection, Filter, FindOptions, ObjectId } from 'mongodb'
import { DatabaseRecord } from '../db'
import { Golem } from '../golem'
import { GolemMessage } from '../messages/message-wrapper'
import { formatForLog } from '../utils/debug-utils'
import { GolemLogger } from '../utils/logger'

type UserPermissionRecord = DatabaseRecord<UserPermission>

export enum Permission {
  // Super User
  Admin = 'admin',
  AliasCreate = 'alias.create',
  AliasDelete = 'alias.delete',
  AliasEdit = 'alias.edit',
  // All privileges of Admin - cannot make new Moderators
  Moderator = 'moderator',
  PlaylistCreate = 'playlist.create',
  PlaylistDelete = 'playlist.delete',
  PlaylistEdit = 'playlist.edit',
}

export function toPermission(str: string): Permission | undefined {
  console.log(Object.values(Permission))
  return Object.values(Permission)
    .filter((perm) => perm === str)
    .pop()
}

const BasePermissions = [Permission.AliasCreate, Permission.PlaylistCreate]

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

  get permArray(): Permission[] {
    return [...this.permissions]
  }

  get isAdmin(): boolean {
    return this.permissions.has(Permission.Admin)
  }

  can(perm: Permission): boolean {
    return this.permissions.has(Permission.Admin) || this.permissions.has(perm)
  }

  add(...newPermissions: Permission[]): Permission[] {
    return newPermissions
      .filter((newPerm) => !this.permissions.has(newPerm))
      .map((newPerm) => {
        this.permissions.add(newPerm)

        return newPerm
      })
  }

  remove(...permsToRemove: Permission[]): Permission[] {
    return permsToRemove
      .filter((newPerm) => this.permissions.has(newPerm))
      .map((perm) => {
        this.permissions.delete(perm)

        return perm
      })
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
    Golem.permissions.set(newRecord)
    await newRecord.save()

    return newRecord
  }

  static async check(
    interaction: GolemMessage,
    perms: Permission[]
  ): Promise<boolean> {
    UserPermission.log.debug(
      `checking permission: ${formatForLog({
        userId: interaction.info.userId,
        guildId: interaction.info.guildId,
        perms,
      })}`
    )

    const rec = await UserPermission.get(
      interaction.info.userId,
      interaction.info.guildId
    )

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

/**
 * Permissions required for certain actions
 */
export const Permissions = {
  Admin: Permission.Admin,
  Alias: {
    Create: Permission.AliasCreate,
    Delete: Permission.AliasDelete,
    Edit: Permission.AliasEdit,
  },
  Playlist: {
    Create: Permission.PlaylistCreate,
    Delete: Permission.PlaylistDelete,
    Edit: Permission.PlaylistEdit,
  },
}

/**
 * Objects to aid in Permission Descriptions
 */
export const PermissionDescriptions: Record<Permission, string> = {
  [Permission.Admin]: 'Grants all permissions',
  [Permission.AliasCreate]: 'Can create Aliased Commands',
  [Permission.AliasDelete]: 'Can delete other users aliased commands',
  [Permission.AliasEdit]: 'Can edit other users aliased commands',
  [Permission.Moderator]:
    'Grants all permission - cannot make new Admins or Moderators',
  [Permission.PlaylistCreate]: 'Can create playlists',
  [Permission.PlaylistDelete]: 'Can delete other users playlists',
  [Permission.PlaylistEdit]: 'Can edit other users playlists',
}
