import { Db, MongoClient } from 'mongodb'
import { ObjectId } from 'mongodb'
import { GolemConf } from '../config'

type NonFunctionPropertyNames<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends Function ? never : K
}[keyof T]

type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>

export type DatabaseRecord<T extends { _id: ObjectId }> =
  NonFunctionProperties<T>

export class GolemMongoConnection {
  private client: MongoClient
  private db!: Db

  constructor() {
    this.client = new MongoClient(GolemConf.mongo.uri, {
      connectTimeoutMS: 5000,
    })
  }

  async connect(): Promise<MongoClient> {
    await this.client.connect()

    this.db = this.client.db(GolemConf.mongo.dbName)

    return this.client
  }
}
