// import { GolemConf } from '../src/config'
// import { LogLevel } from '../src/utils/logger'
// import { deepMock } from './mocks'

import { GolemConf } from '../src/config'

// jest.mock('../src/config')

// const MockConf = deepMock(GolemConf)

// MockConf.logLevel = LogLevel.Info

GolemConf.init()
