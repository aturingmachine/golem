import { LocalAlbum } from '../src/listing/album'

export function createLocalAlbum(
  record?: Partial<{ albumName: string; artistName: string }>
): LocalAlbum {
  const album = new LocalAlbum(
    record?.albumName || 'Act 5. New Action',
    record?.artistName || 'gugudan'
  )
  jest.spyOn(album, 'getArt')
  jest.spyOn(album, 'save')

  return album
}
