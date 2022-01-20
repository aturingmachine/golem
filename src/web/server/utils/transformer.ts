export const Transformer = {
  normalizeArt(art: string | Buffer): string {
    return typeof art === 'string' ? art : art.toString('base64')
  },
}
