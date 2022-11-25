import { Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm'
import { MessageInfo } from '../../messages/message-info'

export enum PermissionCode {
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

export const PermissionDescriptions: Record<PermissionCode, string> = {
  [PermissionCode.Admin]: 'Super User. Reserved for whomever owns this Golem.',
  [PermissionCode.Moderator]: 'Super User restricted to a Guild.',
  [PermissionCode.AliasCreate]: 'Create new aliases.',
  [PermissionCode.AliasDelete]: 'Delete aliases.',
  [PermissionCode.AliasEdit]: 'Edit aliases.',
  [PermissionCode.PlaylistCreate]: 'Create Playlists.',
  [PermissionCode.PlaylistDelete]: 'Delete Playlists.',
  [PermissionCode.PlaylistEdit]: 'Edit Playlists.',
}

export const tablePermissions = (perms: PermissionCode[]): string =>
  perms.reduce((prev: string, curr: PermissionCode) => {
    return prev.concat('\n' + `${curr}: ${PermissionDescriptions[curr]}`)
  }, '')

@Entity()
export class Permissions {
  public static readonly BasePermissions = [
    PermissionCode.AliasCreate,
    PermissionCode.PlaylistCreate,
  ]

  @ObjectIdColumn()
  _id!: ObjectID

  @Column()
  userId!: string

  @Column()
  guildId!: string

  @Column()
  permissions!: PermissionCode[]

  static adminRecord(adminId: string, guildId: string): Permissions {
    const perm = new Permissions()
    perm.userId = adminId
    perm.guildId = guildId
    perm.permissions = [PermissionCode.Admin]

    return perm
  }

  static moderatorRecord(userId: string, guildId: string): Permissions {
    const perm = new Permissions()
    perm.userId = userId
    perm.guildId = guildId
    perm.permissions = [PermissionCode.Moderator]

    return perm
  }

  static baseRecord(info: MessageInfo): Permissions {
    const perm = new Permissions()
    perm.userId = info.userId
    perm.guildId = info.guildId
    perm.permissions = Permissions.BasePermissions

    return perm
  }
}
