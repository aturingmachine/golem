import { addStaticMocks } from '../../mocks'
import { MockImageUtils } from '../image-utils'
import { MockMongoCollection } from '../mongodb-collection'
import { MockAlbum } from './album'
import { MockedMessage, MockMessage } from './message'

MockImageUtils()

export const MockLocalListing = jest.fn().mockImplementation((id?: string) => ({
  listingId: id || '',
  hasDefaultDuration: false,
  path: '',
  genres: [],
  key: '',
  moods: [],
  mb: {},
  addedAt: 828,
  bpm: 160,
  album: MockAlbum(),
  duration: 180,
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

export const MockedQueuePeek = {
  _message: undefined as MockedMessage | undefined,

  get message(): MockedMessage {
    if (!this._message) {
      this._message = MockMessage() as MockedMessage
    }

    return this._message
  },

  send: jest.fn(),
  embed: {
    title: 'Mock Peek',
    description: '2 queued tracks',
  },
}

export const MockQueuePeek = jest.fn().mockImplementation(() => MockedQueuePeek)
