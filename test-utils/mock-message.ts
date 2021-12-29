import { MessageType } from 'discord-api-types'
import { Client, Message } from 'discord.js'
import { GolemMessage } from '../src/messages/message-wrapper'
import { deepMock, Mocked, Overwrite } from './mocks'

export type MockClient = {
  channels: { resolve: jest.SpyInstance }
  users: {
    _add: jest.SpyInstance
  }
  options: {
    makeCache: jest.SpyInstance
  }
  guilds: {
    resolve: jest.SpyInstance
  }
}

const mockClient: MockClient = {
  channels: { resolve: jest.fn() },
  users: {
    _add: jest.fn(),
  },
  options: {
    makeCache: jest.fn(() => ({})),
  },
  guilds: {
    resolve: jest.fn(),
  },
}

const getMessage = (): Message => {
  return new Message(mockClient as unknown as Client, {
    id: '',
    channel_id: '',
    author: {
      id: '',
      username: '',
      discriminator: '',
      avatar: '',
    },
    content: 'message content',
    timestamp: '',
    edited_timestamp: null,
    tts: false,
    mention_everyone: false,
    mention_roles: [''],
    mentions: [],
    mention_channels: [],
    attachments: [],
    embeds: [],
    pinned: false,
    type: MessageType.Default,
  })
}

type MockDiscordMessage = {
  id: string
  reply: jest.SpyInstance
  channel_id: string
  client: MockClient
}

const mockDiscordMessage = (id = '828'): MockDiscordMessage => {
  return {
    id,
    reply: jest.fn(),
    channel_id: 'roe',
    client: mockClient,
  }
}

export type MockedMessage = Overwrite<
  Mocked<GolemMessage>,
  { source: MockDiscordMessage }
> & {
  _toWrapper(): GolemMessage
}

export const MockMessage = (): MockedMessage => {
  const msg = getMessage()
  const mocked = deepMock(new GolemMessage(msg)) as unknown as MockedMessage

  mocked.source = mockDiscordMessage()

  mocked.source.reply.mockResolvedValue(mockDiscordMessage('211'))

  mocked._toWrapper = function (): GolemMessage {
    return this as unknown as GolemMessage
  }

  return mocked as unknown as MockedMessage
}
