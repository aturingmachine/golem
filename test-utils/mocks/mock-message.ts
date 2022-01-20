import { MockMessage } from './models/message'

jest.mock('../../src/messages/message-wrapper', () => ({
  GolemMessage: MockMessage,
}))
