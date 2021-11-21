import md5 from 'md5'
import {
  Collection,
  DeleteResult,
  Filter,
  FindOptions,
  ObjectId,
} from 'mongodb'
import { IAudioMetadata } from 'music-metadata'
import sharp from 'sharp'
import { GolemConf } from '../config'
import { DatabaseRecord } from '../db'
import { Golem } from '../golem'

export abstract class AListing {
  constructor(
    public title: string,
    public duration: number,
    public artist: string,
    public album: string,
    public albumArt?: Buffer | string
  ) {}
}

type ListingRecord = DatabaseRecord<LocalListing>

/**
 * Core Data for a track.
 */
export interface TrackListingInfo {
  title: string
  duration: number
  artist: string
  album: string
  albumArt?: Buffer | string
}

interface MusicBrainzData {
  artistId?: string
  trackId?: string
}

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
  mb: MusicBrainzData
  addedAt: number
  bpm?: number
  albumArt?: Buffer
  id?: string
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
export class LocalListing extends AListing {
  static collectionName = 'listings'

  /**
   * The MongoId, is actually an ObjectId instance
   */
  _id!: ObjectId
  /**
   * An attempt at a consistent unique id made by md5 hashing
   * some info of the listing
   */
  trackId: string
  hasDefaultDuration!: boolean
  path: string
  genres: string[]
  key: string
  moods: string[]
  mb: MusicBrainzData
  addedAt: number
  bpm?: number
  albumArt?: Buffer

  constructor(info: ListingInfo) {
    super(info.title, info.duration, info.artist, info.album, info.albumArt)

    this.trackId = info.trackId
    this.path = info.path
    this.genres = info.genres
    this.key = info.key
    this.moods = info.moods
    this.bpm = info.bpm
    this.addedAt = info.addedAt
    this.mb = info.mb
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

  toString(): string {
    return `${this.artist} - ${this.album} - ${this.title}`
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

  static async fromMeta(
    meta: IAudioMetadata,
    path: string,
    birthTime: number
  ): Promise<LocalListing> {
    const targetConfig = GolemConf.library.paths.find((p) => path.includes(p))

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
    const artistMBId = meta.common.musicbrainz_artistid?.[0] || ''
    const trackMbId = meta.common.musicbrainz_trackid || ''

    return new LocalListing({
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
      addedAt: birthTime,
      mb: {
        artistId: artistMBId,
        trackId: trackMbId,
      },
      albumArt: meta.common.picture
        ? await sharp(meta.common.picture[0].data)
            .resize(200, 200)
            .toFormat('png')
            .toBuffer()
        : undefined,
    })
  }

  async save(): Promise<this> {
    if (this._id) {
      await LocalListing.Collection.replaceOne({ _id: { $eq: this._id } }, this)
    } else {
      const result = await LocalListing.Collection.insertOne(this)
      this._id = result.insertedId
    }

    return this
  }

  static async find(
    filter: Filter<ListingRecord>,
    options: FindOptions
  ): Promise<LocalListing[]> {
    const records = await LocalListing.Collection.find(
      filter,
      options
    ).toArray()

    return records.map((record) => {
      const listing = new LocalListing(record)
      listing._id = record._id

      return listing
    })
  }

  static async findOne(
    filter: Filter<ListingRecord>,
    options: FindOptions
  ): Promise<LocalListing | null> {
    const record = await LocalListing.Collection.findOne(filter, options)

    if (!record) {
      return null
    }

    const listing = new LocalListing(record)
    listing._id = record._id

    return listing
  }

  static deleteMany(filter: Filter<ListingRecord>): Promise<DeleteResult> {
    return LocalListing.Collection.deleteMany(filter)
  }

  private static get Collection(): Collection<ListingRecord> {
    return Golem.db.collection<ListingRecord>('listings')
  }
}
