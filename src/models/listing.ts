import { IAudioMetadata } from 'music-metadata'
import sharp from 'sharp'
import { v4 } from 'uuid'
import { Config } from '../utils/config'

type ListingNameStyles = {
  piped: string
  dashed: string
}

type ListingNames = {
  short: ListingNameStyles
  full: ListingNameStyles
}

export type ListingBackupInfo = Omit<ListingInfo, 'albumArt'> & {
  albumArt: string
}

export type ListingInfo = {
  id: string
  artist: string
  album: string
  track: string
  duration: number
  hasDefaultDuration: boolean
  path: string
  albumArt?: Buffer
}

export class Listing {
  id!: string
  artist!: string
  album!: string
  track!: string
  duration!: number
  hasDefaultDuration!: boolean
  path!: string
  albumArt?: Buffer

  constructor(info: ListingInfo) {
    this.id = info.id
    this.artist = info.artist
    this.album = info.album
    this.track = info.track
    this.duration = info.duration
    this.path = info.path
    this.albumArt = info.albumArt
  }

  get names(): ListingNames {
    return {
      short: {
        piped: `${this.artist} | ${this.track}`,
        dashed: `${this.artist} - ${this.track}`,
      },
      full: {
        piped: `${this.artist} | ${this.album} | ${this.track}`,
        dashed: `${this.artist} - ${this.album} - ${this.track}`,
      },
    }
  }

  get name(): string {
    return this.toString()
  }

  get pipedName(): string {
    return `${this.artist} | ${this.album} | ${this.track}`
  }

  toString(): string {
    return `${this.artist} - ${this.album} - ${this.track}`
  }

  get markup(): string {
    return `**${this.artist}**: _${this.album}_ - ${this.track}`
  }

  get cleanDuration(): string {
    return this.duration.toFixed(1)
  }

  static async fromMeta(meta: IAudioMetadata, path: string): Promise<Listing> {
    const split = path.replace(Config.libraryPath, '').split('/')

    return new Listing({
      id: v4(),
      artist: meta.common.artist || meta.common.artists?.[0] || split[1],
      album: meta.common.album || split[2],
      track: meta.common.title || split[3],
      duration: meta.format.duration || 160,
      hasDefaultDuration: !meta.format.duration,
      path: path,
      albumArt: meta.common.picture
        ? await sharp(meta.common.picture[0].data)
            .resize(100, 100)
            .toFormat('png')
            .toBuffer()
        : undefined,
    })
  }

  static async fromBackup(datum: ListingBackupInfo): Promise<Listing> {
    return new Listing({
      id: datum.id,
      artist: datum.artist,
      album: datum.album,
      track: datum.track,
      duration: datum.duration,
      hasDefaultDuration: datum.hasDefaultDuration,
      path: datum.path,
      albumArt: datum.albumArt
        ? await sharp(Buffer.from(datum.albumArt, 'base64'))
            .resize(100, 100)
            .toFormat('png')
            .toBuffer()
        : undefined,
    })
  }
}
