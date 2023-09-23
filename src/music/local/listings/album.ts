import { readFileSync } from 'fs'
import path from 'path'
import { Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm'
import { RawConfig } from '../../../utils/raw-config'
import { StringUtils } from '../../../utils/string-utils'

export abstract class AAlbum {
  //
  abstract attachmentUrl: string
}

@Entity()
export class Album extends AAlbum {
  @ObjectIdColumn()
  _id!: ObjectID

  @Column()
  public name: string

  @Column()
  public artist: string

  @Column()
  public path: string

  @Column()
  fileRoot: string

  covers: Record<
    'small' | 'med' | 'large' | 'xlarge',
    { path: string; get(): Buffer }
  >

  static rebuild(album: Album): Album {
    const rebuilt = new Album(album.name, album.artist)
    rebuilt._id = album._id

    return rebuilt
  }

  constructor(name: string, artist: string) {
    super()

    this.name = name
    this.artist = artist
    this.path = path.resolve(
      RawConfig.settings.library?.albumLocation || '../../../data/albums',
      StringUtils.slugify(artist),
      StringUtils.slugify(name)
    )

    this.fileRoot = path.resolve(this.path, StringUtils.slugify(this.name))

    this.covers = {
      small: {
        path: this.fileRoot + '_small',
        get: () => Album.getCover(this.fileRoot + '_small'),
      },
      med: {
        path: this.fileRoot + '_med',
        get: () => Album.getCover(this.fileRoot + '_med'),
      },
      large: {
        path: this.fileRoot + '_large',
        get: () => Album.getCover(this.fileRoot + '_large'),
      },
      xlarge: {
        path: this.fileRoot + '_original',
        get: () => Album.getCover(this.fileRoot + '_xl'),
      },
    }
  }

  get attachmentUrl(): string {
    return 'attachment://cover.jpg'
  }

  // get fileRoot(): string {
  //   return path.resolve(this.path, StringUtils.slugify(this.name))
  // }

  // get covers(): Record<
  //   'small' | 'med' | 'large' | 'xlarge',
  //   { path: string; get(): Buffer }
  // > {
  //   return {
  //     small: {
  //       path: this.fileRoot + '_small',
  //       get: () => Album.getCover(this.fileRoot + '_small'),
  //     },
  //     med: {
  //       path: this.fileRoot + '_med',
  //       get: () => Album.getCover(this.fileRoot + '_med'),
  //     },
  //     large: {
  //       path: this.fileRoot + '_large',
  //       get: () => Album.getCover(this.fileRoot + '_large'),
  //     },
  //     xlarge: {
  //       path: this.fileRoot + '_original',
  //       get: () => Album.getCover(this.fileRoot + '_xl'),
  //     },
  //   }
  // }

  private static getCover(path: string): Buffer {
    return readFileSync(path)
  }
}
