import { addStaticMocks } from '../mocks'
import { MockMongoCollection } from './mongodb-collection'

export const MockBuffer = {}

export const MockAlbum = jest.fn().mockImplementation(() => ({
  albumName: 'Act 4. Cait Sith',
  artistName: 'gugudan',
  getArt: jest.fn().mockResolvedValue(MockBuffer),
  save: jest.fn(),
}))

addStaticMocks(
  MockAlbum,
  'generate',
  'find',
  'findOne',
  'deleteMany',
  'fromRecord',
  ['Collection', MockMongoCollection()]
)

jest.mock('../../src/listing/album', () => ({
  LocalAlbum: MockAlbum,
}))
