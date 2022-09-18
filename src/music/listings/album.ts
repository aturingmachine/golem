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

  @Column()
  fileRoot: string

  covers: Record<
    'small' | 'med' | 'large' | 'xlarge',
    { path: string; get(): Buffer }
  >

  constructor(name: string, artist: string) {
    this.name = name
    this.artist = artist
    this.path = path.resolve(
      Album.baseArtPath,
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
    console.log(`Getting album art at: ${path}`)
    return readFileSync(path)
  }
}
