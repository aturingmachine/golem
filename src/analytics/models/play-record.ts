import { ObjectId } from 'bson'
import { Collection, DeleteResult, Filter, FindOptions } from 'mongodb'
import { Golem } from '../../golem'

export interface PlayRecord {
  trackId: string
  interactionType?: 'play' | 'skip' | 'queue'
  timestamp: number
  userId: string
}

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

  static find(
    filter: Filter<PlayRecord>,
    options: FindOptions
  ): Promise<PlayRecord[]> {
    return PlayRecord.Collection.find(filter, options).toArray()
  }

  static deleteMany(filter: Filter<PlayRecord>): Promise<DeleteResult> {
    return PlayRecord.Collection.deleteMany(filter)
  }

  private static get Collection(): Collection<PlayRecord> {
    return Golem.db.collection<PlayRecord>('playrecords')
  }
}
