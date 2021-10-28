import ytpl from 'ytpl'
import ytsr from 'ytsr'
import { GolemConf } from '../utils/config'
import { GolemLogger } from '../utils/logger'

export class Youtube {
  private static log = GolemLogger.child({ src: 'youtils' })

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

  static async getPlaylist(url: string): Promise<{
    urls: string[]
    title: string
    thumbnail: string | null
  }> {
    Youtube.log.debug(`getting playlist for ${url}`)
    const result = await ytpl(url, { limit: 20 })

    return {
      title: result.title,
      urls: result.items.map((item) => item.url),
      thumbnail: result.bestThumbnail.url,
    }
  }
}
