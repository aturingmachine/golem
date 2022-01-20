import { AListing } from '../../../listing/listing'
import { Transformer } from './transformer'

export const ImageCache = {
  cache: {} as Record<string, string>,

  get(albumId: string): string | undefined {
    return this.cache[albumId]
  },

  set(albumId: string, art: string): void {
    this.cache[albumId] = art
  },

  async getOrCreate(listing: AListing): Promise<string> {
    let art = this.get(listing.album.albumId)

    if (!art) {
      art = Transformer.normalizeArt(await listing.album.getArt(400))
      this.set(listing.album.albumId, art)
    }

    return art
  },
}
