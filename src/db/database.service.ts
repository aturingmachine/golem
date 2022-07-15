import { Injectable } from '@nestjs/common'
import { Collection, Db, MongoClient } from 'mongodb'
import { GolemConf } from '../config'
import { LogContexts } from '../logger/constants'
import { GolemLogger } from '../logger/logger.service'

@Injectable()
export class DatabaseService {
  private readonly _mongoClient: MongoClient
  private _connection!: Db

  constructor(private logger: GolemLogger, private config: GolemConf) {
    this.logger.setContext(LogContexts.DatabaseService)

    this._mongoClient = new MongoClient(this.config.mongo.uri, {
      connectTimeoutMS: 5000,
    })
  }

  async connect(): Promise<void> {
    this.logger.info('connecting to database: ' + this.config.mongo.dbName)
    try {
      await this._mongoClient.connect()

      this._connection = this._mongoClient.db(this.config.mongo.dbName)

      this.logger.info('connected to database')
    } catch (error) {
      this.logger.error(`could not connect to database ${error}`)
    }
  }

  collection<R>(collectionName: string): Collection<R> {
    return this._connection.collection(collectionName)
  }
}
