import { MessageAttachment, EmbedFieldData } from 'discord.js'
import { IFastAverageColorResult } from 'fast-average-color'
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
import { PlexLogo } from '../constants'
import { ListingRecord } from '../db/records'
import { Golem } from '../golem'
import { formatForLog } from '../utils/debug-utils'
import { ImageUtils } from '../utils/image-utils'
import { embedFieldSpacer } from '../utils/message-utils'
import { humanReadableDuration } from '../utils/time-utils'
import { Album, LocalAlbum } from './album'

export type ListingEmbedData = {
  fields: EmbedFieldData[]
  color: IFastAverageColorResult
  image?: MessageAttachment
}

export abstract class AListing {
  constructor(
    public listingId: string,
    public title: string,
    public duration: number,
    public artist: string,
    public albumName: string,
    public album: Album
  ) {}

  abstract toEmbed(): Promise<ListingEmbedData> | ListingEmbedData
}

/**
 * Core Data for a track.
 */
export interface TrackListingInfo {
  title: string
  duration: number
  artist: string
  albumName: string
  album: Album
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
  listingId: string
  artist: string
  albumName: string
  title: string
  duration: number
  hasDefaultDuration: boolean
  path: string
  genres: string[]
  moods: string[]
  key: string
  mb: MusicBrainzData
  addedAt: number
  album: LocalAlbum
  bpm?: number
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
  listingId: string
  hasDefaultDuration!: boolean
  path: string
  genres: string[]
  key: string
  moods: string[]
  mb: MusicBrainzData
  addedAt: number
  bpm?: number

  declare album: LocalAlbum

  constructor(info: ListingInfo) {
    super(
      info.listingId,
      info.title,
      info.duration,
      info.artist,
      info.albumName,
      info.album
    )

    this.listingId = info.listingId
    this.path = info.path
    this.genres = info.genres
    this.key = info.key
    this.moods = info.moods
    this.bpm = info.bpm
    this.addedAt = info.addedAt
    this.mb = info.mb
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
        piped: `${this.artist} | ${this.albumName} | ${this.title}`,
        dashed: `${this.artist} - ${this.albumName} - ${this.title}`,
      },
    }
  }

  toString(): string {
    return `${this.artist} - ${this.albumName} - ${this.title}`
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
    return `${this.artist} ${this.albumName} ${this.title}`
  }

  get longName(): string {
    return `${this.artist} | ${this.albumName} | ${this.title}`
  }

  get debugString(): string {
    return formatForLog({
      ...this,
      album: this.album ? 'OMIT' : 'UNDEFINED',
    })
  }

  isArtist(artist: string): boolean {
    return artist === this.artist
  }

  async toEmbed(): Promise<ListingEmbedData> {
    const artBuffer = (await this.album.getArt(200)) || PlexLogo
    console.log('Have Art')
    const image = new MessageAttachment(artBuffer, 'cover.png')
    console.log('Have Message Attachment')
    console.log(ImageUtils)
    const color = await ImageUtils.averageColor(artBuffer)
    console.log('Have Color')

    const duration = this.hasDefaultDuration
      ? '-'
      : humanReadableDuration(this.duration)

    const fields: EmbedFieldData[] = [
      {
        name: 'Artist',
        value: this.artist,
      },
      {
        name: 'Album',
        value: this.albumName,
        inline: true,
      },
      embedFieldSpacer,
      {
        name: 'Duration',
        value: duration,
        inline: true,
      },
      {
        name: 'Track',
        value: this.title,
        inline: true,
      },
      embedFieldSpacer,
      {
        name: 'Genres',
        value: this.genres.length ? this.genres.slice(0, 3).join(', ') : 'N/A',
        inline: true,
      },
    ]

    console.log('Returning Embed')

    return {
      fields,
      color,
      image,
    }
  }

  static async fromMeta(
    meta: IAudioMetadata,
    path: string,
    birthTime: number
  ): Promise<LocalListing> {
    const targetConfig = GolemConf.library.paths.find((p) => path.includes(p))

    const split =
      path.replace(targetConfig || 'NO PATH FOUND', '')?.split('/') || []
    const artist = meta.common.artist || meta.common.artists?.[0] || split[1]
    const albumName = meta.common.album || split[2]
    const track = meta.common.title || split[3]
    const identifier =
      meta.common.musicbrainz_trackid ||
      meta.common.musicbrainz_recordingid ||
      meta.common.isrc?.[0] ||
      ''
    const id = md5(`${artist} - ${albumName} - ${track} - ${identifier}`)
    const key: string =
      meta.native['ID3v2.3']?.find((t) => t.id === 'TKEY')?.value || 'NA'
    const bpm: string | undefined =
      meta.native['ID3v2.3']?.find((t) => t.id === 'TBPM')?.value || undefined
    const moods: string[] = meta.native['ID3v2.3']
      ?.filter((t) => t.id === 'TXXX:mood' && !t.value.includes('Not '))
      .map((t) => t.value)
    const artistMBId = meta.common.musicbrainz_artistid?.[0] || ''
    const trackMbId = meta.common.musicbrainz_trackid || ''
    const art = meta.common.picture
      ? await sharp(meta.common.picture[0].data).toFormat('png').toBuffer()
      : undefined

    const album = await LocalAlbum.generate(albumName, artist, art || PlexLogo)

    return new LocalListing({
      listingId: id,
      artist,
      albumName,
      title: track,
      duration: meta.format.duration || 160,
      hasDefaultDuration: !meta.format.duration,
      path,
      genres: meta.common.genre?.map((g) => g?.split('/')).flat(1) || [],
      key,
      moods: moods,
      album,
      bpm: bpm ? parseInt(bpm, 10) : undefined,
      addedAt: birthTime,
      mb: {
        artistId: artistMBId,
        trackId: trackMbId,
      },
    })
  }

  async save(): Promise<this> {
    if (this._id) {
      await LocalListing.Collection.replaceOne(
        { _id: { $eq: this._id } },
        {
          ...this,
          album: this.album._id,
        }
      )
    } else {
      const result = await LocalListing.Collection.insertOne({
        ...this,
        album: this.album._id,
      })
      this._id = result.insertedId
    }

    return this
  }

  static async find(
    filter: Filter<ListingRecord>,
    options?: FindOptions
  ): Promise<LocalListing[]> {
    const records = await LocalListing.Collection.find(
      filter,
      options
    ).toArray()

    return await Promise.all(records.map(LocalListing.fromRecord))
  }

  static async findOne(
    filter: Filter<ListingRecord>,
    options?: FindOptions
  ): Promise<LocalListing | null> {
    const record = await LocalListing.Collection.findOne(filter, options)

    if (!record) {
      return null
    }

    return LocalListing.fromRecord(record)
  }

  static async listingIds(): Promise<string[]> {
    const record = await LocalListing.Collection.find(
      {},
      { projection: { listingId: 1 } }
    ).toArray()

    return record.map((r) => r.listingId)
  }

  static deleteMany(filter: Filter<ListingRecord>): Promise<DeleteResult> {
    return LocalListing.Collection.deleteMany(filter)
  }

  private static async fromRecord(
    record: ListingRecord
  ): Promise<LocalListing> {
    const album =
      (await LocalAlbum.findOne({
        albumName: record.albumName,
        artistName: record.artist,
      })) ||
      (await LocalAlbum.generate(record.albumName, record.artist, PlexLogo))

    const listing = new LocalListing({
      ...record,
      album,
    })

    listing._id = record._id

    return listing
  }

  private static get Collection(): Collection<ListingRecord> {
    return Golem.database.listings
  }
}
