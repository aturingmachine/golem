import { Constructable } from 'discord.js'
import { Db, Filter, FindOptions, MongoClient } from 'mongodb'
import { GolemConf } from '../utils/config'

export type Record<T> = {
  collectionName: string
} & Constructable<T>

export class GolemMongoConnection {
  private client: MongoClient
  private db: Db

  constructor() {
    this.client = new MongoClient(GolemConf.mongo.uri, {
      connectTimeoutMS: 5000,
    })

    this.db = this.client.db(GolemConf.mongo.dbName)
  }

  async find<R>(
    klass: Record<R>,
    filter: Filter<R>,
    options: FindOptions
  ): Promise<R[]> {
    const records = await this.db
      .collection<R>(klass.collectionName)
      .find(filter, options)
      .toArray()

    return records.map((r) => new klass(r))
  }

  async findOne<R>(
    klass: Record<R>,
    filter: Filter<R>,
    options: FindOptions
  ): Promise<R> {
    const record = await this.db
      .collection<R>(klass.collectionName)
      .findOne(filter, options)

    return new klass(record)
  }
}
