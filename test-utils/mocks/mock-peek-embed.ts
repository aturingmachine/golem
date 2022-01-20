import { MockQueuePeek } from './models/listing'

jest.mock('../../src/messages/replies/queue-peek', () => ({
  QueuePeek: MockQueuePeek,
}))
