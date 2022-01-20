import { MockLocalTrack } from './models/track'

jest.mock('../../src/tracks/track', () => ({
  LocalTrack: MockLocalTrack,
}))
