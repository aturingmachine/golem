import ytpl from 'ytpl'
import ytsr from 'ytsr'
import { GolemConf } from '../../config'
import { shuffleArray } from '../../utils/list-utils'
import { GolemLogger, LogSources } from '../../utils/logger'
import { YoutubeListing } from './youtube-listing'
import { YoutubePlaylistListing } from './youtube-playlist'

export class Youtube {
  private static log = GolemLogger.child({ src: LogSources.Youtils })

  static async search(query: string): Promise<string | undefined> {
    Youtube.log.info(`searching for query ${query}`)
    const result = await ytsr(query, { limit: 10 })

    const topVideo = result.items
      .filter((item) => item.type === 'video')
      .filter((item) => {
        return ![...GolemConf.search.forceWeightTerms, 'karaoke'].some((term) =>
          (item as ytsr.Video).title.toLowerCase().includes(term)
        )
      })[0] as ytsr.Video

    return topVideo?.url
  }

  static async getPlaylist(
    url: string,
    limit = 20,
    shuffle = false
  ): Promise<YoutubePlaylistListing> {
    Youtube.log.verbose(`getting playlist for ${url}`)
    const videoLimit = shuffle ? limit * 5 : limit
    const result = await ytpl(url, { limit: videoLimit })
    Youtube.log.debug(`playlist ${url} fetched`)
    const videosToMap = shuffle
      ? shuffleArray([...result.items]).slice(0, limit)
      : result.items

    return new YoutubePlaylistListing(
      result.title,
      videosToMap.map(YoutubeListing.fromPlaylistItem),
      result.bestThumbnail.url
    )
  }
}
