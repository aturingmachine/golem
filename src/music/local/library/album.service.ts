import { writeFileSync, mkdirSync } from 'fs'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MongoRepository, ObjectID } from 'typeorm'
import { LoggerService } from '../../../core/logger/logger.service'
import { pathExists } from '../../../utils/filesystem'
import { ImageUtils } from '../../../utils/image-utils'
import { Album } from '../listings/album'
import { LocalListing } from '../listings/listings'

@Injectable()
export class AlbumService {
  constructor(
    private log: LoggerService,

    @InjectRepository(Album)
    private albums: MongoRepository<Album>
  ) {
    this.log.setContext('AlbumService')
  }

  all(): Promise<Album[]> {
    return this.albums.find({})
  }

  async for(query: ObjectID | LocalListing): Promise<Album | null> {
    const parsedQuery = query instanceof LocalListing ? query.albumId : query
    const record = await this.albums.findOne({
      where: { _id: new ObjectID(parsedQuery.toString()) },
    })

    return record
  }

  async create(
    albumName: string,
    artist: string,
    cover?: Buffer
  ): Promise<Album> {
    let record: Album | undefined = undefined
    const existing = await this.albums.findOne({ where: { name: albumName } })

    const sizes: [number, string][] = [
      [200, '_small'],
      [400, '_med'],
      [800, '_large'],
      [1000, '_xl'],
    ]

    // const album = new Album(albumName, artist)
    const album = Album.rebuild(this.albums.create({ name: albumName, artist }))

    try {
      mkdirSync(album.path, { recursive: true })
    } catch (error) {}

    for (const set of sizes) {
      const size = set[0]
      const suffix = set[1]
      const imagePath = album.fileRoot + suffix

      if (pathExists(imagePath)) {
        continue
      }

      const image = await ImageUtils.resizeWithMaxSize(cover, size)

      writeFileSync(imagePath, image)
    }

    if (!existing) {
      record = await this.albums.save(album)
    }

    if (!record && !existing) {
      throw new Error(`Couldnt get an id for album ${albumName}`)
    }

    return existing || record!
  }
}
