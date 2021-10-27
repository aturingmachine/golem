import ytsr from 'ytsr'

export class Youtube {
  static async search(query: string): Promise<string | undefined> {
    const result = await ytsr(query, { limit: 10 })

    const topVideo = result.items.filter(
      (item) => item.type === 'video'
    )[0] as ytsr.Video

    return topVideo?.url
  }
}
