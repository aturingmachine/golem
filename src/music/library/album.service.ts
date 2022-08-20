import { writeFileSync, mkdirSync } from 'fs'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MongoRepository, ObjectID } from 'typeorm'
import { LoggerService } from '../../core/logger/logger.service'
import { pathExists } from '../../utils/filesystem'
import { ImageUtils } from '../../utils/image-utils'
import { Album } from '../listings/album'

@Injectable()
export class AlbumService {
  constructor(
    private log: LoggerService,

    @InjectRepository(Album)
    private albums: MongoRepository<Album>
  ) {
    console.log('Inside album service constructor')
    this.log.setContext('AlbumService')
  }

  async create(
    albumName: string,
    artist: string,
    cover?: Buffer
  ): Promise<ObjectID> {
    let id: ObjectID | undefined
    let record: Album | undefined = undefined
    const existing = await this.albums.findOne({ where: { name: albumName } })

    if (existing) {
      id = existing._id
    }

    const sizes: [number, string][] = [
      [200, '_small'],
      [400, '_med'],
      [800, '_large'],
      [1000, '_xl'],
    ]

    const album = new Album(albumName, artist)

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

    id = record?._id || existing?._id

    if (!id) {
      throw new Error(`Couldnt get an id for album ${albumName}`)
    }

    return id
  }
}
