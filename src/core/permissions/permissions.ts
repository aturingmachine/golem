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

const BasePermissions = [
  PermissionCode.AliasCreate,
  PermissionCode.PlaylistCreate,
]

@Entity()
export class Permissions {
  @ObjectIdColumn()
  _id!: ObjectID

  @Column()
  userId!: string

  @Column()
  guildId!: string

  @Column()
  permissions!: PermissionCode[]

  static baseRecord(info: MessageInfo): Permissions {
    const perm = new Permissions()
    perm.userId = info.userId
    perm.guildId = info.guildId
    perm.permissions = BasePermissions

    return perm
  }
}
