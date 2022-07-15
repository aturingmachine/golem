import { Injectable } from '@nestjs/common'
import ytpl from 'ytpl'
import ytsr from 'ytsr'
import { GolemConf } from '../../config'
import { LogContexts } from '../../logger/constants'
import { GolemLogger } from '../../logger/logger.service'
import { ArrayUtils } from '../../utils/list-utils'
import { YoutubeListing } from './youtube-listing'
import { YoutubePlaylistListing } from './youtube-playlist'

@Injectable()
export class Youtube {
  constructor(private logger: GolemLogger, private config: GolemConf) {
    this.logger.setContext(LogContexts.YouTube)
  }

  async search(query: string): Promise<string | undefined> {
    this.logger.info(`searching for query ${query}`)
    const result = await ytsr(query, { limit: 10 })

    const topVideo = result.items
      .filter((item) => item.type === 'video')
      .filter((item) => {
        return ![...this.config.search.forceWeightTerms, 'karaoke'].some(
          (term) => (item as ytsr.Video).title.toLowerCase().includes(term)
        )
      })[0] as ytsr.Video

    return topVideo?.url
  }

  async getPlaylist(
    url: string,
    limit = 20,
    shuffle = false
  ): Promise<YoutubePlaylistListing> {
    this.logger.verbose(`getting playlist for ${url}`)
    const videoLimit = shuffle ? limit * 5 : limit
    const result = await ytpl(url, { limit: videoLimit })
    this.logger.debug(`playlist ${url} fetched`)
    const videosToMap = shuffle
      ? ArrayUtils.shuffleArray([...result.items]).slice(0, limit)
      : result.items

    return new YoutubePlaylistListing(
      result.title,
      videosToMap.map(YoutubeListing.fromPlaylistItem),
      result.bestThumbnail.url
    )
  }
}
