import { MockAlbum } from './models/album'

jest.mock('../../src/listing/album', () => ({
  LocalAlbum: MockAlbum,
}))
