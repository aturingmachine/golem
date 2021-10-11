import sharp, { gravity } from 'sharp'
import { PlexLogo } from '../constants'

export const resize = async (
  img: Buffer = PlexLogo,
  size = 200
): Promise<Buffer> => await sharp(img).resize(size, size).toBuffer()

export const fourSquare = async (config: {
  images: {
    img1?: Buffer
    img2?: Buffer
    img3?: Buffer
    img4?: Buffer
  }
  size?: number
}): Promise<Buffer> => {
  const logo = PlexLogo
  const dimension = config.size || 200
  const halfDimension = dimension / 2

  const base = sharp(config.images.img1).resize(dimension, dimension).toBuffer()

  const composite = [
    { src: config.images.img1 || logo, pos: gravity.northwest },
    { src: config.images.img2 || logo, pos: gravity.northeast },
    { src: config.images.img3 || logo, pos: gravity.southeast },
    { src: config.images.img4 || logo, pos: gravity.southwest },
  ]
  const a = []

  for (const comp of composite) {
    a.push({
      src: sharp(comp.src)
        .resize(halfDimension, halfDimension, { fit: 'fill' })
        .toBuffer(),
      pos: comp.pos,
    })
  }

  const f = a.reduce(async (input, overlay) => {
    const data = await input
    return sharp(data)
      .composite([{ gravity: overlay.pos, input: await overlay.src }])
      .toBuffer()
  }, base)

  return await f
}
