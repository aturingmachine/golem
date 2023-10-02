import {
  AudioResource,
  createAudioResource,
  demuxProbe,
} from '@discordjs/voice'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import dargs from 'dargs'
import execa from 'execa'
import ytpl from 'ytpl'
import { ConfigurationOptions } from '../../core/configuration'
import { LoggerService } from '../../core/logger/logger.service'
import { ArrayUtils } from '../../utils/list-utils'
import { TrackAudioResourceMetadata } from '../tracks'
import { YoutubeTrack } from '../tracks/youtube-track'
import { YoutubeCache } from './cache/youtube-cache.service'
import { YoutubeListing } from './youtube-listing'
import { YoutubePlaylistListing } from './youtube-playlist'
import { YoutubeSearch } from './youtube-search.service'

export type YoutubeSearchResult = {
  url: string
  correctedQuery: string
  similarity: number
}

@Injectable()
export class YoutubeService {
  private static readonly ytdlOptions = dargs({
    output: '-',
    quiet: true,
    format: 'ba[ext=webm][acodec=opus] / ba',
    limitRate: '2000K',
    'check-formats': true,
  })

  constructor(
    private log: LoggerService,
    private config: ConfigService<ConfigurationOptions>,
    private ytCache: YoutubeCache,
    private ytSearch: YoutubeSearch
  ) {
    this.log.setContext('YoutubeService')
  }

  process(url: string): execa.ExecaChildProcess<string> {
    this.log.debug(`processing url: ${url}`)

    return execa(
      this.config.getOrThrow('youtube').ytdlpPath,
      [url, ...YoutubeService.ytdlOptions],
      {
        stdio: ['ignore', 'pipe', 'ignore'],
      }
    )
  }

  async createAudioResource(
    track: YoutubeTrack
  ): Promise<AudioResource<TrackAudioResourceMetadata>> {
    this.log.info(`creating audio resource for ${track.name}`)

    const cachedPath = await this.ytCache.get(track.listing)

    if (cachedPath) {
      this.log.info(`cache hit for ${track.name}`)
      return new Promise((resolve) => {
        const resource = createAudioResource(cachedPath, {
          metadata: { track: track, listing: track.listing },
        })

        resolve(resource)
      })
    }

    return new Promise((resolve, reject) => {
      const process = this.process(track.url)

      if (!process.stdout) {
        reject(new Error('No stdout'))
        return
      }

      const stream = process.stdout

      const onError = (error: Error) => {
        this.log.error(error.message)

        if (!process.killed) {
          this.log.debug(`process for track ${track.url} killed`)
          process.kill()
        }

        this.log.debug(`process for track ${track.url} errored - resuming now`)
        stream.resume()
        reject(error)
      }

      process.once('spawn', async () => {
        try {
          this.log.info(`attempting to cache '${track.name}'`)
          this.ytCache.save(track.listing, track.listing.listingId, process)
        } catch (error) {
          this.log.error(`could not cache '${track.name}' ${error}`)
        }

        try {
          this.log.silly(`attempting to demux - ${track.listing.title}`)
          const metadata: TrackAudioResourceMetadata = {
            track: track,
            listing: track.listing,
          }

          const demux = await demuxProbe(stream)
          const audioResource = createAudioResource<TrackAudioResourceMetadata>(
            stream,
            {
              metadata,
              inputType: demux.type,
            }
          )

          resolve(audioResource)
        } catch (error) {
          this.log.error(`demux error track=${track.url}`)
          this.log.error(error)
          onError(error as Error)
        }
      })

      process.on('error', onError)

      process.on('message', (message) => {
        this.log.debug(`yt-dlp out => "${message.toString()}"`)
      })
    })
  }

  async search(query: string): Promise<YoutubeSearchResult | undefined> {
    this.log.info(`searching for query ${query}`)
    return this.ytSearch.search(query)
  }

  async getPlaylist(
    url: string,
    limit = 20,
    shuffle = false
  ): Promise<YoutubePlaylistListing> {
    this.log.verbose(`getting playlist for ${url}`)

    const videoLimit = shuffle ? limit * 5 : limit
    const result = await ytpl(url, { limit: videoLimit })
    this.log.debug(`playlist ${url} fetched`)
    const videosToMap = shuffle
      ? ArrayUtils.shuffleArray([...result.items]).slice(0, limit)
      : result.items

    return new YoutubePlaylistListing(
      result.title,
      videosToMap.map(this.playlistItemToListing),
      result.bestThumbnail.url
    )
  }

  hydrateId(userId: string, id: string): Promise<YoutubeTrack> {
    const fullUrl = `https://www.youtube.com/watch?v=${id}`

    return YoutubeTrack.fromUrl(userId, fullUrl)
  }

  private playlistItemToListing(item: ytpl.Item): YoutubeListing {
    const cleanUrl = `${item.url.split('?')[0]}?${item.url
      .split('?')[1]
      .split('&')
      .map((q) => q.split('='))
      .filter(([key, _value]) => key === 'v')
      .map((q) => q.join('='))
      .join('')}`

    return new YoutubeListing({
      url: cleanUrl,
      author: item.author.name,
      title: item.title,
      duration: item.durationSec || 0,
      artworkUrl: item.bestThumbnail?.url || undefined,
    })
  }
}
