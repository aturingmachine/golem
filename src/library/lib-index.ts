import {
  FindOptions,
  DeleteResult,
  Filter,
  Collection,
  ObjectId,
} from 'mongodb'
import { LibIndexRecord } from '../db/records'
import { Golem } from '../golem'

export class LibIndex {
  public _id!: ObjectId

  constructor(
    public name: string,
    public count: number,
    public listingIds: ObjectId[]
  ) {}

  async save(): Promise<this> {
    console.log(`Saving Lib Index ${this.name} - ${this._id}`)
    if (this._id) {
      console.log(`calling replace one ${this.name} - ${this._id}`)
      await LibIndex.Collection.replaceOne({ _id: { $eq: this._id } }, this)
    } else {
      console.log(`Saving Lib Index - INsert one ${this.name}`)
      const res = await LibIndex.Collection.insertOne(this)
      this._id = res.insertedId
    }

    console.log(`Saved ${this.name} - ${this._id}`)
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

    if (!record) {
      return null
    }

    return this.fromRecord(record)
  }

  static deleteMany(filter: Filter<LibIndexRecord>): Promise<DeleteResult> {
    return LibIndex.Collection.deleteMany(filter)
  }

  private static get Collection(): Collection<LibIndexRecord> {
    return Golem.database.libindexes
  }

  private static fromRecord(record: LibIndexRecord): LibIndex {
    const libIndex = new LibIndex(record.name, record.count, record.listingIds)

    libIndex._id = record._id

    return libIndex
  }
}
