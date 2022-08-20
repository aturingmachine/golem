import { readFileSync } from 'fs'
import path from 'path'
import { Column, Entity, ObjectID, ObjectIdColumn } from 'typeorm'
import { StringUtils } from '../../utils/string-utils'

@Entity()
export class Album {
  static readonly baseArtPath = '/home/turing/dev/golem/data/albums'

  @ObjectIdColumn()
  _id!: ObjectID

  @Column()
  public name: string

  @Column()
  public artist: string

  @Column()
  public path: string

  constructor(name: string, artist: string) {
    this.name = name
    this.artist = artist
    this.path = path.resolve(
      Album.baseArtPath,
      StringUtils.slugify(artist),
      StringUtils.slugify(name)
    )
  }

  get fileRoot(): string {
    return path.resolve(this.path, StringUtils.slugify(this.name))
  }

  get covers(): Record<
    'small' | 'med' | 'large' | 'xlarge',
    { path: string; get(): Buffer }
  > {
    return {
      small: {
        path: this.fileRoot + '_small',
        get: Album.getCover.bind(this.fileRoot + '_small'),
      },
      med: {
        path: this.fileRoot + '_med',
        get: Album.getCover.bind(this.fileRoot + '_med'),
      },
      large: {
        path: this.fileRoot + '_large',
        get: Album.getCover.bind(this.fileRoot + '_large'),
      },
      xlarge: {
        path: this.fileRoot + '_original',
        get: Album.getCover.bind(this.fileRoot + '_xl'),
      },
    }
  }

  private static getCover(this: string): Buffer {
    return readFileSync(this)
  }
}
