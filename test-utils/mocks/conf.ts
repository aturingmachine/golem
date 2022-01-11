// import { GolemConf } from '../src/config'
// import { LogLevel } from '../src/utils/logger'
// import { deepMock } from './mocks'

jest.mock('../../src/config', () => ({
  GolemConf: {
    enabledModules: [],
    cliOptions: {},
    init: jest.fn(),
    options: {},
    modules: {
      Core: true,
      LastFm: true,
      Music: true,
      Plex: true,
      Web: true,
      Youtube: true,
    },
    discord: {},
    image: {
      fallbackPath: './golem-logo.png',
      avgColorAlgorithm: 'sqrt',
    },
    lastfm: {},
    library: {},
    mongo: {},
    plex: {},
    search: {},
    youtube: {},
    web: {},
    logLevel: {},
  },
  logLevel: jest.fn(),
}))

// const MockConf = deepMock(GolemConf)

// MockConf.logLevel = LogLevel.Info
