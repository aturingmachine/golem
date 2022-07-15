import { Injectable } from '@nestjs/common'
import { getAverageColor } from 'fast-average-color-node'
import sharp, { gravity } from 'sharp'
import { GolemConf } from '../config'
import { PlexLogo } from '../constants'

@Injectable()
export class ImageUtils {
  constructor(private config: GolemConf) {}

  // Genuinely not sure about this any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  averageColor(img?: Buffer | string): any {
    return getAverageColor(img || PlexLogo, {
      algorithm: this.config.image.avgColorAlgorithm,
    })
  }

  async resize(img: Buffer = PlexLogo, size = 200): Promise<Buffer> {
    return await sharp(img).resize(size, size).toBuffer()
  }

  async resizeWithMaxSize(
    img: Buffer = PlexLogo,
    size = 200,
    maxBufferSize = 16_000_000
  ): Promise<Buffer> {
    const result = await this.resize(img, size)

    if (result.byteLength <= maxBufferSize) {
      return result
    }

    return this.resizeWithMaxSize(img, size * 0.9)
  }

  async fourSquare(config: {
    images: {
      img1?: Buffer
      img2?: Buffer
      img3?: Buffer
      img4?: Buffer
    }
    size?: number
  }): Promise<Buffer> {
    const logo = PlexLogo
    const dimension = config.size || 200
    const halfDimension = dimension / 2

    const base = sharp(config.images.img1)
      .resize(dimension, dimension)
      .toBuffer()

    const composite = [
      {
        src: config.images.img1?.length ? config.images.img1 : logo,
        pos: gravity.northwest,
      },
      {
        src: config.images.img2?.length ? config.images.img2 : logo,
        pos: gravity.northeast,
      },
      {
        src: config.images.img3?.length ? config.images.img3 : logo,
        pos: gravity.southeast,
      },
      {
        src: config.images.img4?.length ? config.images.img4 : logo,
        pos: gravity.southwest,
      },
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

    return f
  }
}
