import { AttachmentBuilder, APIEmbedField } from 'discord.js'
import { IFastAverageColorResult } from 'fast-average-color'
import md5 from 'md5'
import { IAudioMetadata } from 'music-metadata'
// import { Album, LocalAlbum } from './album'
import { Entity, ObjectID, ObjectIdColumn, Column } from 'typeorm'
import { PlexLogo, embedFieldSpacer } from '../../../constants'
import { formatForLog } from '../../../utils/debug-utils'
import { ImageUtils } from '../../../utils/image-utils'
import { humanReadableDuration } from '../../../utils/time-utils'
import { AAlbum, Album } from './album'

export type ListingEmbedData = {
  fields: APIEmbedField[]
  color: IFastAverageColorResult
  image?: AttachmentBuilder
}

export abstract class AListing {
  abstract readonly listingId: string
  abstract readonly title: string
  abstract readonly duration: number
  abstract readonly artist: string
  abstract readonly albumName: string
  abstract albumArtUrl: string
  abstract album: AAlbum

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
  // album: Album
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
  albumArtist: string
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
@Entity()
export class LocalListing extends AListing {
  static collectionName = 'listings'

  @ObjectIdColumn()
  _id!: ObjectID

  @Column()
  public title: string
  @Column()
  public duration: number
  @Column()
  public artist: string
  @Column()
  public albumName: string

  @Column()
  public albumArtist: string

  @ObjectIdColumn()
  public albumId!: ObjectID

  @Column(() => Album)
  public album!: Album

  /**
   * An attempt at a consistent unique id made by md5 hashing
   * some info of the listing
   */
  @Column()
  listingId: string
  @Column()
  hasDefaultDuration!: boolean
  @Column()
  path: string
  @Column()
  genres: string[]
  @Column()
  key: string
  @Column()
  moods: string[]
  @Column()
  mb: MusicBrainzData
  @Column()
  addedAt: number
  @Column()
  bpm?: number

  // declare album: LocalAlbum

  constructor(info: ListingInfo) {
    super()

    this.title = info?.title
    this.duration = info?.duration
    this.artist = info?.artist
    this.albumName = info?.albumName
    this.listingId = info?.listingId || ''
    this.path = info?.path
    this.genres = info?.genres
    this.key = info?.key
    this.moods = info?.moods
    this.bpm = info?.bpm
    this.addedAt = info?.addedAt
    this.albumArtist = info?.albumArtist
    this.mb = info?.mb
  }

  setAlbum(album: Album): void {
    this.albumId = album._id
    this.album = new Album(album.name, album.artist)
  }

  get albumArtUrl(): string {
    return this.album.attachmentUrl
  }

  /**
   * The ObjectId properly parsed
   */
  // get id(): string {
  //   return this._id?.toString() || ''
  // }

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
      // album: this.album ? 'OMIT' : 'UNDEFINED',
    })
  }

  isArtist(artist: string): boolean {
    return artist === this.artist
  }

  async toEmbed(): Promise<ListingEmbedData> {
    const artBuffer = this.album.covers.med.get() || PlexLogo
    const image = new AttachmentBuilder(artBuffer, { name: 'cover.png' })
    const color = await ImageUtils.averageColor(artBuffer)

    const duration = this.hasDefaultDuration
      ? '-'
      : humanReadableDuration(this.duration)

    const fields: APIEmbedField[] = [
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

    return {
      fields,
      color,
      image,
    }
  }

  static fromMeta(
    meta: IAudioMetadata,
    path: string,
    birthTime: number,
    libraries: string[]
  ): LocalListing {
    const targetConfig = libraries.find((p) => path.includes(p))

    const split =
      path.replace(targetConfig || 'NO PATH FOUND', '')?.split('/') || []

    const artist = meta.common.artist || meta.common.artists?.[0] || split[1]
    const albumName = meta.common.album || split[2]
    const track = (meta.common.title || split[3]).replace(
      /^[0-2][0-9] \.*/g,
      ''
    )
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

    return new LocalListing({
      listingId: id,
      artist,
      albumArtist: meta.common.albumartist || artist,
      albumName,
      title: track,
      duration: meta.format.duration || 160,
      hasDefaultDuration: !meta.format.duration,
      path,
      genres: meta.common.genre?.map((g) => g?.split('/')).flat(1) || [],
      key,
      moods: moods,
      // album,
      bpm: bpm ? parseInt(bpm, 10) : undefined,
      addedAt: birthTime,
      mb: {
        artistId: artistMBId,
        trackId: trackMbId,
      },
    })
  }
}
