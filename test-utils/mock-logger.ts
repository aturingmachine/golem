import winston from 'winston'
import { GolemLogger } from '../src/utils/logger'

jest.mock('../src/utils/logger')

jest.spyOn(GolemLogger, 'child').mockReturnValue({
  info: jest.fn(),
  error: jest.fn((...args: unknown[]) => {
    console.error(...args)
  }),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  silly: jest.fn(),
} as unknown as winston.Logger)
