// import { Binary, ObjectId } from 'bson'
// import md5 from 'md5'
// import { Collection, DeleteResult, Filter, FindOptions } from 'mongodb'
// import { LocalAlbumRecord } from '../db/records'
// import { Golem } from '../golem'
// import { ImageUtils } from '../utils/image-utils'
// import { GolemLogger } from '../utils/logger'

// export abstract class Album {
//   public abstract albumId: string

//   public abstract getArt(
//     size: 200 | 400 | 1000 | 'original'
//   ): Promise<Buffer> | Promise<string> | Buffer | string
// }

// export class LocalAlbum extends Album {
//   private static log = GolemLogger.child({ src: 'local-album' })

//   _id!: ObjectId
//   readonly albumId: string

//   constructor(readonly albumName: string, readonly artistName: string) {
//     super()

//     this.albumId = md5(`${artistName}-${albumName}`)
//   }

//   async getArt(size: 200 | 400 | 1000 | 'original'): Promise<Buffer> {
//     const record = await LocalAlbum.Collection.findOne({
//       albumName: this.albumName,
//       artistName: this.artistName,
//       albumId: this.albumId,
//     })

//     // TODO this is bad but also kind of hard to make happen so :shrug:
//     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//     return record!.art[size].buffer
//   }

//   async save(rawArt: Buffer): Promise<this> {
//     const art = {
//       200: new Binary(await ImageUtils.resizeWithMaxSize(rawArt, 200)),
//       400: new Binary(await ImageUtils.resizeWithMaxSize(rawArt, 400)),
//       1000: new Binary(await ImageUtils.resizeWithMaxSize(rawArt, 1000)),
//       // not actually original but whatever
//       original: new Binary(await ImageUtils.resizeWithMaxSize(rawArt, 1600)),
//     }

//     if (this._id) {
//       await LocalAlbum.Collection.replaceOne(
//         { _id: { $eq: this._id } },
//         {
//           ...this,
//           art,
//         }
//       )
//     } else {
//       const result = await LocalAlbum.Collection.insertOne({
//         ...this,
//         art,
//       })
//       this._id = result.insertedId
//     }

//     return this
//   }

//   static async generate(
//     albumName: string,
//     artist: string,
//     rawArt: Buffer
//   ): Promise<LocalAlbum> {
//     LocalAlbum.log.silly(`generating for ${artist} - ${albumName}`)
//     const existing = await LocalAlbum.findOne({ albumName, artistName: artist })

//     if (existing) {
//       LocalAlbum.log.silly(`found existing for ${artist} - ${albumName}`)
//       return existing
//     }

//     const album = new LocalAlbum(albumName, artist)

//     LocalAlbum.log.silly(`saving new art for ${artist} - ${albumName}`)
//     await album.save(rawArt)

//     return album
//   }

//   static async find(
//     filter: Filter<LocalAlbumRecord>,
//     options?: FindOptions<LocalAlbumRecord>
//   ): Promise<LocalAlbum[]> {
//     const records = await LocalAlbum.Collection.find(filter, options).toArray()

//     return records.map(LocalAlbum.fromRecord)
//   }

//   static async findOne(
//     filter: Filter<LocalAlbumRecord>,
//     options?: FindOptions<LocalAlbumRecord>
//   ): Promise<LocalAlbum | null> {
//     const record = await LocalAlbum.Collection.findOne(filter, options)

//     if (!record) {
//       return null
//     }

//     return LocalAlbum.fromRecord(record)
//   }

//   static async deleteMany(
//     filter: Filter<LocalAlbumRecord>
//   ): Promise<DeleteResult> {
//     return LocalAlbum.Collection.deleteMany(filter)
//   }

//   private static fromRecord(record: LocalAlbumRecord): LocalAlbum {
//     const localAlbum = new LocalAlbum(record.albumName, record.artistName)
//     localAlbum._id = record._id

//     return localAlbum
//   }

//   private static get Collection(): Collection<LocalAlbumRecord> {
//     return Golem.database.localalbums
//   }
// }
