import { Injectable } from '@nestjs/common'
import {
  Collection,
  DeleteResult,
  Filter,
  FindOptions,
  ObjectId,
} from 'mongodb'
import { CustomAlias } from '../../aliases/custom-alias'
import { CollectionNames } from '../../constants'
import { LogContexts } from '../../logger/constants'
import { GolemLogger } from '../../logger/logger.service'
import { DatabaseService } from '../database.service'
import { CustomAliasRecord } from '../records'

@Injectable()
export class AliasRepository {
  constructor(private logger: GolemLogger, private database: DatabaseService) {
    this.logger.setContext(LogContexts.Repos.Alias)
  }

  async save(alias: CustomAlias): Promise<CustomAlias> {
    this.logger.debug('saving new custom alias')

    if (alias._id) {
      await this.collection.replaceOne({ _id: { $eq: alias._id } }, alias)
    } else {
      const res = await this.collection.insertOne(alias)
      alias._id = res.insertedId
    }

    return alias
  }

  delete(query: string | ObjectId | CustomAlias): Promise<DeleteResult> {
    if (typeof query === 'string') {
      return this.collection.deleteOne({ _id: new ObjectId(query) })
    } else if (query instanceof ObjectId) {
      return this.collection.deleteOne({ _id: query })
    } else {
      return this.collection.deleteOne({ _id: query._id })
    }
  }

  async find(
    filter: Filter<CustomAliasRecord>,
    options?: FindOptions
  ): Promise<CustomAlias[]> {
    const records = await this.collection.find(filter, options).toArray()

    return records.map(CustomAlias.fromRecord)
  }

  async findOne(
    filter: Filter<CustomAliasRecord>,
    options?: FindOptions
  ): Promise<CustomAlias | null> {
    const record = await this.collection.findOne(filter, options)

    return record ? CustomAlias.fromRecord(record) : null
  }

  deleteMany(filter: Filter<CustomAliasRecord>): Promise<DeleteResult> {
    return this.collection.deleteMany(filter)
  }

  private get collection(): Collection<CustomAliasRecord> {
    return this.database.collection(CollectionNames.CustomAliases)
  }
}
