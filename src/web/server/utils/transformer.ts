import { ImageUtils } from '../../../utils/image-utils'

export const Transformer = {
  async normalizeArt(art?: string | Buffer): Promise<string> {
    console.log('Transforming art for web:', typeof art, art)
    return art
      ? typeof art === 'string'
        ? art
        : art.length > 0
        ? (await ImageUtils.resize(art)).toString('base64')
        : ''
      : ''
  },
}
