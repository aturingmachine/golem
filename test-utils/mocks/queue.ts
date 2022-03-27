export const MockedTrackQueue = {
  queuedTrackCount: 0,
  runTime: 10,
  explicitQueueRunTime: 2,
  addNext: jest.fn(),
  addMany: jest.fn(),
  add: jest.fn(),
  skip: jest.fn(),
  clear: jest.fn(),
  shuffle: jest.fn(),
  peekDeep: jest.fn(),
  pop: jest.fn(),
}

export const MockTrackQueue = jest
  .fn<typeof MockedTrackQueue, []>()
  .mockImplementation(() => MockedTrackQueue)

jest.mock('../../src/player/queue', () => ({
  TrackQueue: MockTrackQueue,
}))
