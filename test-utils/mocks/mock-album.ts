import { MockAlbum } from './album'

jest.mock('../../src/listing/album', () => ({
  LocalAlbum: MockAlbum,
}))
