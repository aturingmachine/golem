import {
  FindOptions,
  DeleteResult,
  Filter,
  Collection,
  ObjectId,
} from 'mongodb'
import { DatabaseRecord } from '../db'
import { Golem } from '../golem'
import { LocalListing } from '../listing/listing'

type LibIndexRecord = DatabaseRecord<LibIndex>

export class LibIndex {
  public _id!: ObjectId

  constructor(
    public name: string,
    public count: number,
    public listings: LocalListing[]
  ) {}

  async save(): Promise<this> {
    if (this._id) {
      await LibIndex.Collection.replaceOne(
        { _id: { $eq: this._id } },
        { ...this, listings: this.listings.map((listing) => listing._id) }
      )
    } else {
      await LibIndex.Collection.insertOne({
        ...this,
        listings: this.listings.map((listing) => listing._id),
      })
    }

    return this
  }

  delete(): Promise<DeleteResult> {
    return LibIndex.Collection.deleteOne({ _id: this._id })
  }

  static async find(
    filter: Filter<LibIndexRecord>,
    options?: FindOptions
  ): Promise<LibIndex[]> {
    const records = await LibIndex.Collection.find(filter, options).toArray()

    return records.map(LibIndex.fromRecord)
  }

  static async findOne(
    filter: Filter<LibIndexRecord>,
    options?: FindOptions
  ): Promise<LibIndex | null> {
    const record = await LibIndex.Collection.findOne(filter, options)

    return record
      ? new LibIndex(record.name, record.count, record.listings)
      : null
  }

  static deleteMany(filter: Filter<LibIndexRecord>): Promise<DeleteResult> {
    return LibIndex.Collection.deleteMany(filter)
  }

  private static get Collection(): Collection<LibIndexRecord> {
    return Golem.db.collection<LibIndexRecord>('libindexes')
  }

  private static fromRecord(record: LibIndexRecord): LibIndex {
    const libIndex = new LibIndex(record.name, record.count, record.listings)

    libIndex._id = record._id

    return libIndex
  }
}
