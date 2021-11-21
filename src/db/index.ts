import { Db, MongoClient } from 'mongodb'
import { GolemConf } from '../utils/config'

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
