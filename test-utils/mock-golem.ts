import { User } from 'discord.js'
import { Collection, ObjectId, OptionalId } from 'mongodb'
import { CollectionNames } from '../src/constants'
import {
  CustomAliasRecord,
  DBPlayRecord,
  LibIndexRecord,
  ListingRecord,
  LocalAlbumRecord,
  UserPermissionRecord,
} from '../src/db/records'
import { GolemEventEmitter } from '../src/golem/event-emitter'
import { PlayerCache } from '../src/golem/player-cache'
import { UserPermissionCache } from '../src/permissions/permission'
import { MockedMusicPlayer } from './mock-music-player'
import { Mocked } from './mocks'

export type MockedGolem = {
  permissions: Mocked<UserPermissionCache>
  playerCache: Mocked<PlayerCache>
  debugger: any
  client: {
    login: jest.Mock
    guilds: {
      cache: []
    }
    user: {
      setActivity: jest.Mock
    }
    users: {
      fetch: jest.Mock
    }
    once: jest.Mock
    on: jest.Mock
    destroy: jest.Mock
  }
  loader: {
    load: jest.Mock
    refresh: jest.Mock
  }
  events: Mocked<GolemEventEmitter>
  trackFinder: {
    search: jest.Mock
    searchMany: jest.Mock
    getSimilarArtists: jest.Mock
    getSimilarTracks: jest.Mock
    artistSample: jest.Mock
    findIdByPath: jest.Mock
    findListingsById: jest.Mock
    trackCount: number
  }
  plex: {
    init: jest.Mock
    getPlaylists: jest.Mock
    getPlaylistById: jest.Mock
  }
  db: {
    collection: jest.SpyInstance<string>
  }
  database: {
    [CollectionNames.Listings]: jest.Mocked<Collection<ListingRecord>>
    [CollectionNames.CustomAliases]: jest.Mocked<Collection<CustomAliasRecord>>
    [CollectionNames.LibIndexes]: jest.Mocked<Collection<LibIndexRecord>>
    [CollectionNames.Permissions]: jest.Mocked<Collection<UserPermissionRecord>>
    [CollectionNames.LocalAlbums]: jest.Mocked<Collection<LocalAlbumRecord>>
    [CollectionNames.PlayRecords]: jest.Mocked<Collection<DBPlayRecord>>
  }
  mongo: {
    connect: jest.Mock
    db: jest.Mock
  }

  initialize: jest.SpyInstance<Promise<void>>
  getPlayer: jest.SpyInstance<MockedMusicPlayer | undefined>
  removePlayer: jest.SpyInstance<Promise<void>>
  login: jest.SpyInstance<Promise<void>>
  setPresenceListening: jest.SpyInstance
  setPresenceIdle: jest.SpyInstance
  getUser: jest.SpyInstance<Promise<User>>
}

const mockPermCache = {
  get: jest.fn(),
  set: jest.fn(),
}

const mockPlayerCache = {
  get: jest.fn(),
  getOrCreate: jest.fn(),
  delete: jest.fn(),
  disconnectAll: jest.fn(),
  keys: jest.fn(),
  entries: jest.fn(),
}

const mockLoader = {
  load: jest.fn(),
  refresh: jest.fn(),
}

const mockEvents = {
  on: jest.fn(),
  off: jest.fn(),
  trigger: jest.fn(),
}

const mockTrackFinder = {
  search: jest.fn(),
  searchMany: jest.fn(),
  getSimilarArtists: jest.fn(),
  getSimilarTracks: jest.fn(),
  artistSample: jest.fn(),
  findIdByPath: jest.fn(),
  findListingsById: jest.fn(),
  trackCount: 0,
}

const mockPlex = {
  init: jest.fn(),
  getPlaylists: jest.fn(),
  getPlaylistById: jest.fn(),
}

const mockCollection = <
  T extends
    | LibIndexRecord
    | ListingRecord
    | UserPermissionRecord
    | DBPlayRecord
    | LocalAlbumRecord
    | CustomAliasRecord
>(
  collectionName: string
): jest.Mocked<Collection<T>> => {
  const mock = {
    dbName: 'golem-test',
    collectionName,
    insertOne: jest.fn<any, [any]>(),
    insertMany: jest.fn<T, any>(),
    updateOne: jest.fn<T, any>(),
    replaceOne: jest.fn<T, any>(),
    updateMany: jest.fn<T, any>(),
    deleteOne: jest.fn<T, any>(),
    deleteMany: jest.fn<T, any>(),
    rename: jest.fn<T, any>(),
    drop: jest.fn<T, any>(),
    findOne: jest.fn<T, any>(),
    find: jest.fn<T, any>(),
    options: jest.fn<T, any>(),
    isCapped: jest.fn<T, any>(),
    createIndex: jest.fn<T, any>(),
    createIndexes: jest.fn<T, any>(),
    dropIndex: jest.fn<T, any>(),
    dropIndexes: jest.fn<T, any>(),
    listIndexes: jest.fn<T, any>(),
    distinct: jest.fn<T, any>(),
    findOneAndDelete: jest.fn<T, any>(),
  } as unknown as jest.Mocked<Collection<T>>

  return mock
}

export const MockGolem: MockedGolem = {
  permissions: mockPermCache,
  playerCache: mockPlayerCache,
  debugger: {},
  client: {
    login: jest.fn(),
    guilds: {
      cache: [],
    },
    user: {
      setActivity: jest.fn(),
    },
    users: {
      fetch: jest.fn(),
    },
    once: jest.fn(),
    on: jest.fn(),
    destroy: jest.fn(),
  },
  loader: mockLoader,
  events: mockEvents,
  trackFinder: mockTrackFinder,
  plex: mockPlex,
  db: {
    collection: jest.fn(),
  },
  database: {
    libindexes: mockCollection<LibIndexRecord>('libindexes'),
    customaliases: mockCollection<CustomAliasRecord>('customaliases'),
    listings: mockCollection<ListingRecord>('listings'),
    permissions: mockCollection<UserPermissionRecord>('permissions'),
    playrecords: mockCollection<DBPlayRecord>('playrecords'),
    localalbums: mockCollection<LocalAlbumRecord>('localalbums'),
  },
  mongo: {
    connect: jest.fn(),
    db: jest.fn(),
  },

  initialize: jest.fn(),
  getPlayer: jest.fn(),
  removePlayer: jest.fn(),
  login: jest.fn(),
  setPresenceListening: jest.fn(),
  setPresenceIdle: jest.fn(),
  getUser: jest.fn(),
}

jest.mock('../src/golem', () => {
  return {
    __esModule: true,
    Golem: MockGolem,
  }
})

// MockGolem.database.permissions.insertOne.mockResolvedValue({
//   insertedId: new ObjectId(''),
// })
