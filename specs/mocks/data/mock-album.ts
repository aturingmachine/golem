import { ObjectID } from 'typeorm'
import { Album } from '../../../src/music/local/listings/album'

const defaultImageBase64 =
  'data:image/jpeg;base64,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'

const defaultAlbum = () => ({
  _id: '828',
  artist: 'gugudan',
  attachmentUrl: 'attachment://cover.png',
  covers: {
    small: {
      path: 'album/small',
      get(): Buffer {
        return Buffer.from(defaultImageBase64, 'base64')
      },
    },
    med: {
      path: 'album/small',
      get(): Buffer {
        return Buffer.from(defaultImageBase64, 'base64')
      },
    },
    large: {
      path: 'album/small',
      get(): Buffer {
        return Buffer.from(defaultImageBase64, 'base64')
      },
    },
    xlarge: {
      path: 'album/small',
      get(): Buffer {
        return Buffer.from(defaultImageBase64, 'base64')
      },
    },
  },
  fileRoot: '/path/to/art/root',
  name: 'Act 5 New Action',
  path: '/path/to/art/root/gugudan/Act 5 New Action',
})

export function createMockAlbum(
  record?: Partial<{
    _id: string
    artist: string
    fileRoot: string
    name: string
    path: string
  }>
): Album {
  const defaultParams = defaultAlbum()
  const _id = record?._id || defaultParams._id

  return {
    ...defaultParams,
    ...record,
    _id: _id as unknown as ObjectID,
  }
}
