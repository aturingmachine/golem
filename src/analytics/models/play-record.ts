import { ObjectId } from 'bson'
import { Collection, DeleteResult, Filter, FindOptions } from 'mongodb'
import { DatabaseRecord } from '../../db'
import { Golem } from '../../golem'

type DBPlayRecord = DatabaseRecord<PlayRecord>

export class PlayRecord {
  public _id!: ObjectId

  constructor(
    public trackId: string,
    public timestamp: number,
    public userId: string,
    public interactionType?: 'play' | 'skip' | 'queue'
  ) {}

  async save(): Promise<this> {
    if (this._id) {
      await PlayRecord.Collection.replaceOne({ _id: { $eq: this._id } }, this)
    } else {
      const result = await PlayRecord.Collection.insertOne(this)
      this._id = result.insertedId
    }

    return this
  }

  static async find(
    filter: Filter<DBPlayRecord>,
    options: FindOptions
  ): Promise<PlayRecord[]> {
    const records = await PlayRecord.Collection.find(filter, options).toArray()

    return records.map((record) => {
      const playRecord = new PlayRecord(
        record.trackId,
        record.timestamp,
        record.userId,
        record.interactionType
      )

      playRecord._id = record._id

      return playRecord
    })
  }

  static deleteMany(filter: Filter<DBPlayRecord>): Promise<DeleteResult> {
    return PlayRecord.Collection.deleteMany(filter)
  }

  private static get Collection(): Collection<DBPlayRecord> {
    return Golem.db.collection<DBPlayRecord>('playrecords')
  }
}
