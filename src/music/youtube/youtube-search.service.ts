import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import dargs from 'dargs'
import execa from 'execa'
import ytsr from 'ytsr'
import { ConfigurationOptions } from '../../core/configuration'
import { ConfigurationService } from '../../core/configuration.service'
import { LoggerService } from '../../core/logger/logger.service'
import { similarity } from '../../utils/similarity'
import { getYTInfo } from '../tracks/youtube-track'
import { YoutubeSearchResult } from './youtube.service'

@Injectable()
export class YoutubeSearch {
  constructor(
    private log: LoggerService,
    private config: ConfigService<ConfigurationOptions>
  ) {
    this.log.setContext('YoutubeSearch')
  }

  async search(query: string): Promise<YoutubeSearchResult | undefined> {
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

  async getInfo(url: string) {
    return getYTInfo(url)
  }
}
