import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MongoRepository } from 'typeorm'
import { LoggerService } from '../../core/logger/logger.service'
import { PermissionCode } from '../../core/permissions/permissions'
import { PermissionsService } from '../../core/permissions/permissions.service'
import { formatForLog } from '../../utils/debug-utils'
import { ArrayUtils } from '../../utils/list-utils'
import { ListingSearcher } from '../local/library/searcher.service'
import { AListing, LocalListing } from '../local/listings/listings'
import { PlayerService } from '../player/player.service'
import { TrackType } from '../tracks'
import { LocalTrack } from '../tracks/local-track'
import { Tracks } from '../tracks/tracks'
import { YoutubeTrack } from '../tracks/youtube-track'
import { YoutubeListing } from '../youtube/youtube-listing'
import { YoutubeService } from '../youtube/youtube.service'
import { Playlist } from './playlist.model'

type CreatePlaylistPayload = {
  userInfo: {
    userId: string
    guildId: string
  }
  name: string
  fromQueue?: boolean
}

type HydratePlaylistPayload = {
  userId: string
  guildId: string
  name: string
  shuffle?: boolean
}

type HydratePlaylistResult = {
  tracks: Tracks[]
}

@Injectable()
export class PlaylistService {
  constructor(
    private log: LoggerService,
    private permissionsService: PermissionsService,
    private players: PlayerService,
    private localSearch: ListingSearcher,
    private youtubeService: YoutubeService,

    @InjectRepository(Playlist)
    private playlists: MongoRepository<Playlist>
  ) {
    this.log.setContext('PlaylistService')
  }

  forGuild(guildId: string): Promise<Playlist[]> {
    return this.playlists.find({ where: { guildId } })
  }

  byName(guildId: string, name: string): Promise<Playlist | null> {
    return this.playlists.findOne({ where: { guildId, name } })
  }

  createPlaylistListing(
    source?: Tracks | AListing
  ): Playlist['listings'] | undefined {
    if (source instanceof AListing) {
      if (source instanceof LocalListing) {
        return [{ source: TrackType.Local, id: source.listingId }]
      } else if (source instanceof YoutubeListing) {
        return [{ source: TrackType.Youtube, id: source.listingId }]
      }
    } else {
      if (source instanceof LocalTrack) {
        return [{ source: TrackType.Local, id: source.internalId }]
      } else if (source instanceof YoutubeTrack) {
        return [{ source: TrackType.Youtube, id: source.listing.listingId }]
      }
    }
  }

  async add(
    playListName: string,
    guildId: string,
    listing: Playlist['listings']
  ): Promise<Playlist | undefined> {
    const playlist = await this.byName(guildId, playListName)

    if (!playlist) {
      return
    }

    playlist.listings.push(...listing)

    await this.playlists.save(playlist)

    return playlist
  }

  async list(guildId: string): Promise<string> {
    const records = await this.forGuild(guildId)

    if (!records?.length) {
      return `No playlists registered on this server.`
    }

    return records
      .map((record, index) => {
        return `${index + 1}: ${record.name} (${record.listings.length})`
      })
      .join('\n')
  }

  async create(payload: CreatePlaylistPayload): Promise<Playlist | number> {
    this.log.debug(`create using initial payload: ${formatForLog(payload)}`)
    const canCreate = await this.permissionsService.can(payload.userInfo, [
      PermissionCode.PlaylistCreate,
    ])

    if (!canCreate) {
      return 1
    }

    const records = await this.forGuild(payload.userInfo.guildId)

    if (records.some((record) => record.name === payload.name)) {
      return 2
    }

    let listings: Playlist['listings'] = []

    if (payload.fromQueue) {
      const player = this.players.for(payload.userInfo.guildId)

      if (!player || !player.nowPlaying) {
        return 3
      }

      const tracks = player.trackList().map((t) => t.audioResource.track)

      this.log.debug(
        `processing ${tracks.length} to generate fromQueue playlist.`
      )

      listings = tracks.map((t) => {
        let id = ''

        if (t.type === TrackType.Local) {
          id = t.internalId
        }

        if (t.type === TrackType.Youtube) {
          id = t.listing.listingId
        }

        this.log.debug(`mapping track produced id: ${id}`)

        return {
          id,
          source: t.type,
        }
      })

      listings.unshift({
        id: player.nowPlaying.listingId,
        source:
          player.nowPlaying instanceof LocalListing
            ? TrackType.Local
            : TrackType.Youtube,
      })
    }

    const createPayload = {
      ownerId: payload.userInfo.userId,
      guildId: payload.userInfo.guildId,
      listings,
      name: payload.name,
    }

    this.log.debug(`creating with ${formatForLog(createPayload)}`)

    const newRecord = this.playlists.create(createPayload)

    await this.playlists.save(newRecord)

    return newRecord
  }

  async hydrate(
    payload: HydratePlaylistPayload
  ): Promise<HydratePlaylistResult | number> {
    const playlist = await this.byName(payload.guildId, payload.name.trim())

    if (!playlist) {
      return 1
    }

    const hydrated = (
      await Promise.all(
        playlist.listings.map(async (listing) => {
          switch (listing.source) {
            case TrackType.Local:
              const localListing = this.localSearch.byId(listing.id)
              return (
                localListing &&
                LocalTrack.fromListing(localListing, payload.userId)
              )
              break
            case TrackType.Youtube:
              return this.youtubeService.hydrateId(payload.userId, listing.id)
              break
          }
        })
      )
    ).filter(ArrayUtils.isDefined)

    return {
      tracks: hydrated,
    }
  }
}
