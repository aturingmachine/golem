import {
  GolemMessage,
  GolemMessageReplyOptions,
} from '../../../src/messages/message-wrapper'
import { ParsedCommand } from '../../../src/messages/parsed-command'
import { Overwrite, Mocked } from '../../mocks'
import { MockedMusicPlayer, MockMusicPlayer } from './music-player'
import { MockPermission } from './permissions'

export const MockedParsedCommand = (): jest.Mocked<ParsedCommand> =>
  ({
    command: '',
    params: {},
    subCommand: '',
    getDefault: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    getUser: jest.fn(),
    isSubCommand: jest.fn(),
  } as unknown as jest.Mocked<ParsedCommand>)

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

type MockMessageInfo = {
  permissions: ReturnType<MockPermission>
  guildId?: string
  userId?: string
}

export type MockedMessage = Overwrite<
  Mocked<GolemMessage>,
  {
    send: jest.Mock
    ExpandBuiltInAlias: jest.Mock
    source: MockDiscordMessage
    info: MockMessageInfo
    player: MockedMusicPlayer
  }
> & {
  _toWrapper(): GolemMessage
  expectReply(expected: GolemMessageReplyOptions): void
}

// export type MockedMessage = ReturnType<typeof MockMessage>

export const MockMessage = jest.fn().mockImplementation(
  (): MockedMessage => ({
    source: mockDiscordMessage(),
    parsed: MockedParsedCommand(),
    info: {
      permissions: MockPermission(),
      guildId: 'gugudan',
      userId: 'ksj',
    },
    // replies: [],

    toString: jest.fn(),
    toDebug: jest.fn(),
    collector: jest.fn(),
    reply: jest.fn(),
    update: jest.fn(),

    send: jest.fn().mockResolvedValue({}),

    lastReply: undefined,
    player: MockMusicPlayer(),

    ExpandBuiltInAlias: jest.fn(),

    _toWrapper(): GolemMessage {
      return this as unknown as GolemMessage
    },

    expectReply(expected): void {
      expect(this.reply).toHaveBeenCalledWith(expected)
    },
  })
)
