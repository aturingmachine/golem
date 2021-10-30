import ytpl from 'ytpl'
import ytsr from 'ytsr'
import { YoutubeListing, YoutubePlaylistListing } from '../models/youtube'
import { GolemConf } from '../utils/config'
import { GolemLogger, LogSources } from '../utils/logger'

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
    limit = 20
  ): Promise<YoutubePlaylistListing> {
    Youtube.log.debug(`getting playlist for ${url}`)
    const result = await ytpl(url, { limit })

    return {
      title: result.title,
      listings: result.items.map(YoutubeListing.fromPlaylistItem),
      thumbnail: result.bestThumbnail.url,
    }
  }
}
