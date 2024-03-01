import { URL } from 'url'
import { Injectable, Optional } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { LoggerService } from '../../core/logger/logger.service'
import { GolemMessage } from '../../messages/golem-message'
import { BaseReply } from '../../messages/replies/base'
import { ArtistQueryReply } from '../../messages/replies/interactive/artist-query'
import { ListingReply } from '../../messages/replies/listing-reply'
import { NowPlayingReply } from '../../messages/replies/now-playing'
import { YoutubePlaylistReply } from '../../messages/replies/youtube-playlist-reply'
import { GolemModule } from '../../utils/raw-config'
import {
  ListingSearcher,
  SearchResult,
} from '../local/library/searcher.service'
import { LocalTrack } from '../tracks/local-track'
import { Tracks } from '../tracks/tracks'
import { YoutubeTrack } from '../tracks/youtube-track'
import { YoutubeSearchResult, YoutubeService } from '../youtube/youtube.service'
import { PlayerService } from './player.service'

export const SupportedHosts = {
  Youtube: ['youtube.com', 'youtu.be'],
}

export type QueryPlayResult =
  | {
      tracks: Tracks[]
      replies: BaseReply[]
      raw: {
        local?: SearchResult
        youtube?: YoutubeSearchResult
      }
    }
  | { missingModule?: string; message?: string }

type PlayOptions = {
  limit?: number
  shuffle?: boolean
}

@Injectable()
export class PlayQueryService {
  constructor(
    private log: LoggerService,
    private config: ConfigService,
    private players: PlayerService,

    @Optional() private youtube: YoutubeService,

    @Optional() private localSearcher: ListingSearcher
  ) {
    this.log.setContext('PlayQueryService')
  }

  async process(
    message: GolemMessage,
    query: string,
    options?: PlayOptions
  ): Promise<QueryPlayResult> {
    const userId = message.info.userId

    // Check if we have a URL
    const url = this.queryAsUrl(query)

    if (url) {
      this.log.debug(`got url play query "${query}"`)
      // Check different supported URL Types
      return this.processUrl(userId, url, options)
    }

    // Check if we get a local hit
    const localTracks = await this.searchLocal(message, query)

    if (localTracks) {
      this.log.debug(`query returned search results`)

      return localTracks
    }

    // TODO maybe configure more than one fallback searcher
    // in case something is not supported
    if (!this.youtube) {
      return { missingModule: GolemModule.LocalMusic }
    }

    // Run a Youtube Search as a last resort
    return this.searchYoutube(userId, query)
  }

  private async searchLocal(
    message: GolemMessage,
    query: string
  ): Promise<QueryPlayResult | undefined> {
    const userId = message.info.userId

    if (!this.localSearcher) {
      return { missingModule: GolemModule.LocalMusic }
    }

    // Execute Local Search
    const results = this.localSearcher.search(query)

    if (!results?.listing) {
      return undefined
    }

    // Handle Artist Query
    if (results.isArtistQuery) {
      this.log.info(`query "${query}" produced Artist Query Result`)

      return {
        tracks: [],
        raw: { local: results },
        replies: [
          await ArtistQueryReply.fromQuery(
            results.listing.artist,
            message,
            this.localSearcher,
            this.players
          ),
        ],
      }
    }

    // Handle Wide Query
    if (results.isWideQuery) {
      this.log.info(`query "${query}" produced Wide Query Result`)
    }

    // Return single Track if we got a match
    const track = new LocalTrack(results?.listing, userId)
    return {
      tracks: [track],
      raw: { local: results },
      replies: [
        await NowPlayingReply.fromListing(
          message,
          track.listing,
          this.players.for(message.info.guildId)
        ),
      ],
    }
  }

  private async searchYoutube(
    userId: string,
    query: string
  ): Promise<QueryPlayResult> {
    const result = await this.youtube.search(query)

    if (!result) {
      this.log.warn(`query "${query}" returned no results?`)
      return { message: `Query "${query}" returned no results` }
    }

    if (result?.similarity <= 0.8) {
      this.log.warn(
        `youtube search returned dissimilar results query="${query}"; corrected="${result.correctedQuery}"; similarity=${result?.similarity}`
      )

      return {
        message: `Youtube search returned dissimilar results. Not playing.`,
      }
    }

    const track = await YoutubeTrack.fromUrl(userId, result.url)

    return {
      tracks: [track],
      replies: [await ListingReply.fromListing(track.listing)],
      raw: {
        youtube: result,
      },
    }
  }

  private async processUrl(
    userId: string,
    url: URL,
    options?: PlayOptions
  ): Promise<QueryPlayResult> {
    const host = Object.entries(SupportedHosts).find(([_host, domains]) => {
      return domains.some((domain) => url.host.includes(domain))
    })?.[0]

    this.log.debug(`determined URL as host type: ${host}`)

    switch (host) {
      case 'Youtube':
        return this.processYoutubeUrl(userId, url, options)
    }

    this.log.warn(`Unsupported URL Host: ${url.host}`)

    return { message: `Unsupported service: ${url.host}` }
  }

  private async processYoutubeUrl(
    userId: string,
    url: URL,
    options?: PlayOptions
  ): Promise<QueryPlayResult> {
    const tracks: YoutubeTrack[] = []
    const replies: BaseReply[] = []

    if (!this.youtube) {
      return { missingModule: GolemModule.Youtube }
    }

    // Check Playlist Param
    if (url.searchParams.has('list')) {
      this.log.debug(
        `youtube url has a playlist code "${url.searchParams.get('list')}"`
      )
      const playlist = await this.youtube.getPlaylist(
        url.toString(),
        options?.limit,
        options?.shuffle
      )

      tracks.push(...playlist.tracks)
      replies.push(await YoutubePlaylistReply.fromPlaylist(playlist))
    }

    // Check For a Video Param
    if (url.searchParams.has('v') || url.host === 'youtu.be') {
      this.log.debug(
        `youtube url has a video code "${
          url.searchParams.get('v') || url.pathname.replace('/', '')
        }"`
      )
      const firstTrack = await YoutubeTrack.fromUrl(userId, url.toString())

      tracks.unshift(firstTrack)
      replies.unshift(await ListingReply.fromListing(firstTrack.listing))
    }
    // else if () {
    //   const firstTrack = await YoutubeTrack.fromUrl(userId, url.toString())
    //   tracks.unshift(firstTrack)
    //   replies.unshift(await ListingReply.fromListing(firstTrack.listing))
    // }

    return { tracks, replies, raw: {} }
  }

  private queryAsUrl(str: string): URL | undefined {
    try {
      const url = new URL(str)

      return url
    } catch (error) {
      this.log.debug(`could not create url from ${str}`)
      return undefined
    }
  }
}
