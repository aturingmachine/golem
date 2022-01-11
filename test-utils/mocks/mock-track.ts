import { MockLocalTrack } from './track'

jest.mock('../../src/tracks/track', () => ({
  LocalTrack: MockLocalTrack,
}))
