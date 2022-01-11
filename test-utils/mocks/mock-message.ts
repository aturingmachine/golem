import { MockMessage } from './message'

jest.mock('../../src/messages/message-wrapper', () => ({
  GolemMessage: MockMessage,
}))
