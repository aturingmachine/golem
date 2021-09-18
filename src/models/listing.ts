import md5 from 'md5'
import { IAudioMetadata } from 'music-metadata'
import sharp from 'sharp'
import { Config } from '../utils/config'

type ListingNameStyles = {
  piped: string
  dashed: string
}

type ListingNames = {
  short: ListingNameStyles
  full: ListingNameStyles
}

export type ListingInfo = {
  trackId: string
  artist: string
  album: string
  title: string
  duration: number
  hasDefaultDuration: boolean
  path: string
  genres: string[]
  moods: string[]
  key: string
  bpm?: number
  albumArt?: Buffer
}

/**
 * Listing will be the data record itself, track will be
 * the implementation that we play.
 *
 * Tracks will also be stored in the search list, that way
 * we can write helper methods for naming and shit
 *
 * Listing should just be for reading from file and db.
 */
export class Listing {
  /**
   * The MongoId, is actually an ObjectId instance
   */
  _id!: string
  /**
   * An attempt at a consistent unique id made by md5 hashing
   * some info of the listing
   */
  trackId!: string
  artist!: string
  album!: string
  title!: string
  duration!: number
  hasDefaultDuration!: boolean
  path!: string
  genres!: string[]
  key!: string
  moods!: string[]
  bpm?: number
  albumArt?: Buffer

  constructor(info: ListingInfo) {
    this.trackId = info.trackId
    this.artist = info.artist
    this.album = info.album
    this.title = info.title
    this.duration = info.duration
    this.path = info.path
    this.genres = info.genres
    this.key = info.key
    this.moods = info.moods
    this.bpm = info.bpm
    this.albumArt = info.albumArt
  }

  /**
   * The ObjectId properly parsed
   */
  get id(): string {
    return this._id?.toString() || ''
  }

  get names(): ListingNames {
    return {
      short: {
        piped: `${this.artist} | ${this.title}`,
        dashed: `${this.artist} - ${this.title}`,
      },
      full: {
        piped: `${this.artist} | ${this.album} | ${this.title}`,
        dashed: `${this.artist} - ${this.album} - ${this.title}`,
      },
    }
  }

  get name(): string {
    return this.toString()
  }

  get pipedName(): string {
    return `${this.artist} | ${this.album} | ${this.title}`
  }

  toString(): string {
    return `${this.artist} - ${this.album} - ${this.title}`
  }

  get markup(): string {
    return `**${this.artist}**: _${this.album}_ - ${this.title}`
  }

  get cleanDuration(): string {
    return this.duration.toFixed(1)
  }

  get shortName(): string {
    return `${this.artist} - ${this.title}`.slice(0, 90)
  }

  get shortNameSearchString(): string {
    return `${this.artist} ${this.title}`
  }

  get searchString(): string {
    return `${this.artist} ${this.album} ${this.title}`
  }

  get longName(): string {
    return `${this.artist} | ${this.album} | ${this.title}`
  }

  get debugString(): string {
    return `{artist=${this.artist}; album=${this.album}; track=${this.title}}`
  }

  isArtist(artist: string): boolean {
    return artist === this.artist
  }

  static async fromMeta(meta: IAudioMetadata, path: string): Promise<Listing> {
    const targetConfig = Config.LibraryPaths.find((p) => path.includes(p))
    if (targetConfig?.length === 0) {
      console.log('LISTING GOT BAD PATH', path)
      console.log(targetConfig)
    }
    const split = path.replace(targetConfig || 'NO PATH FOUND', '').split('/')
    const artist = meta.common.artist || meta.common.artists?.[0] || split[1]
    const album = meta.common.album || split[2]
    const track = meta.common.title || split[3]
    const identifier =
      meta.common.musicbrainz_trackid ||
      meta.common.musicbrainz_recordingid ||
      meta.common.isrc?.[0] ||
      ''
    const id = md5(`${artist} - ${album} - ${track} - ${identifier}`)
    const key: string =
      meta.native['ID3v2.3']?.find((t) => t.id === 'TKEY')?.value || 'NA'
    const bpm: string | undefined =
      meta.native['ID3v2.3']?.find((t) => t.id === 'TBPM')?.value || undefined
    const moods: string[] = meta.native['ID3v2.3']
      ?.filter((t) => t.id === 'TXXX:mood' && !t.value.includes('Not '))
      .map((t) => t.value)

    return new Listing({
      trackId: id,
      artist,
      album,
      title: track,
      duration: meta.format.duration || 160,
      hasDefaultDuration: !meta.format.duration,
      path,
      genres: meta.common.genre?.map((g) => g.split('/')).flat(1) || [],
      key,
      moods: moods,
      bpm: bpm ? parseInt(bpm, 10) : undefined,
      albumArt: meta.common.picture
        ? await sharp(meta.common.picture[0].data)
            .resize(100, 100)
            .toFormat('png')
            .toBuffer()
        : undefined,
    })
  }
}
