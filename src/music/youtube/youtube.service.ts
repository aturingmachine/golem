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
import ytsr from 'ytsr'
import { ConfigurationOptions } from '../../core/configuration'
import { LoggerService } from '../../core/logger/logger.service'
import { formatForLog } from '../../utils/debug-utils'
import { ArrayUtils } from '../../utils/list-utils'
import { similarity } from '../../utils/similarity'
import { TrackAudioResourceMetadata } from '../tracks'
import { YoutubeTrack } from '../tracks/youtube-track'
import { YoutubeListing } from './youtube-listing'
import { YoutubePlaylistListing } from './youtube-playlist'

@Injectable()
export class YoutubeService {
  private static readonly ytdlOptions = dargs({
    output: '-',
    quiet: true,
    format: 'ba[ext=webm][acodec=opus] / ba',
    limitRate: '1000K',
  })

  constructor(
    private log: LoggerService,
    private config: ConfigService<ConfigurationOptions>
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

  createAudioResource(
    track: YoutubeTrack
  ): Promise<AudioResource<TrackAudioResourceMetadata>> {
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

  async search(
    query: string
  ): Promise<
    { url: string; correctedQuery: string; similarity: number } | undefined
  > {
    this.log.info(`searching for query ${query}`)

    const result = await ytsr(query, { limit: 10 })

    // TODO this doesn't actually use the weight terms - it ignores weight terms
    const topVideo = result.items
      .filter((item) => item.type === 'video')
      .filter((item) => {
        return ![...this.config.get('search').forceWeightTerms, 'karaoke'].some(
          (term) => (item as ytsr.Video).title.toLowerCase().includes(term)
        )
      })[0] as ytsr.Video

    return topVideo
      ? {
          url: topVideo.url,
          correctedQuery: result.correctedQuery,
          similarity: similarity(query, result.correctedQuery),
        }
      : undefined
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
    this.log.debug(`creating YoutubeListing from ${formatForLog({
      name: item.author.name,
      title: item.title,
      url: item.url,
      duration: item.durationSec,
      artworkUrl: item.bestThumbnail.url,
    })}
    `)

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
    })
  }
}
