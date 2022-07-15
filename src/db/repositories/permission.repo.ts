import { Injectable } from '@nestjs/common'
import { Collection } from 'mongodb'
import { CollectionNames } from '../../constants'
import { LogContexts } from '../../logger/constants'
import { GolemLogger } from '../../logger/logger.service'
import { UserPermission } from '../../permissions/permission'
import { DatabaseService } from '../database.service'
import { UserPermissionRecord } from '../records'

@Injectable()
export class PermissionRepo {
  constructor(private logger: GolemLogger, private database: DatabaseService) {
    this.logger.setContext(LogContexts.Repos.Permission)
  }

  async save(permission: UserPermission): Promise<UserPermission> {
    if (permission._id) {
      await this.collection.replaceOne(
        { _id: { $eq: permission._id } },
        { ...permission, permissions: Array.from(permission.permissions) }
      )
    } else {
      const result = await this.collection.insertOne({
        ...permission,
        permissions: Array.from(permission.permissions),
      })
      permission._id = result.insertedId
    }

    return permission
  }

  private get collection(): Collection<UserPermissionRecord> {
    return this.database.collection(CollectionNames.Permissions)
  }
}
