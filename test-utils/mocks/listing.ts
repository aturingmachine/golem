import { addStaticMocks } from '../mocks'
import { MockAlbum } from './album'
import { MockImageUtils } from './image-utils'
import { MockedMessage, MockMessage } from './message'
import { MockMongoCollection } from './mongodb-collection'

MockImageUtils()

export const MockLocalListing = jest.fn().mockImplementation(() => ({
  listingId: '',
  hasDefaultDuration: false,
  path: '',
  genres: [],
  key: '',
  moods: [],
  mb: {},
  addedAt: 828,
  bpm: 160,
  album: MockAlbum(),
  id: '',
  names: {},
  toString: jest.fn(),
  cleanDuration: '',
  shortName: '',
  shortNameSearchString: '',
  searchString: '',
  longName: '',
  debugString: '',
  isArtist: jest.fn(),
  toEmbed: jest.fn().mockImplementation(() => ({
    fields: [],
    image: {},
    color: {
      hex: 'color.hex',
    },
  })),
  save: jest.fn(),
}))

addStaticMocks(
  MockLocalListing,
  'fromMeta',
  'find',
  'findOne',
  'listingIds',
  'deleteMany',
  'fromRecord',
  ['Collection', MockMongoCollection()]
)

export type MockedLocalListing = typeof MockLocalListing & {
  fromMeta: jest.Mock
  find: jest.Mock
  findOne: jest.Mock
  listingIds: jest.Mock
  deleteMany: jest.Mock
  fromRecord: jest.Mock
  Collection: typeof MockMongoCollection
}

export const MockedListingEmbed = {
  image: {},
  listing: MockLocalListing(),
  _message: undefined as MockedMessage | undefined,

  get message(): MockedMessage {
    if (!this._message) {
      this._message = MockMessage() as MockedMessage
    }

    return this._message
  },

  send: jest.fn(),
  messageOptions: jest.fn(),
  queueMessage: jest.fn(),
  playMessage: jest.fn(),
  toMessage: jest.fn(),
  thumbnail: jest.fn(),
}

export const MockListingEmbed = jest
  .fn()
  .mockImplementation(() => MockedListingEmbed)
