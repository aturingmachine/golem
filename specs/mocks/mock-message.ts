import { LoggerService } from '@nestjs/common'
import { Message, ChannelType } from 'discord.js'
import { CompiledGolemScript } from '../../src/ast/compiler'
import { AstParseResult } from '../../src/ast/parser'
import {
  GolemMessage,
  GolemMessageInteraction,
} from '../../src/messages/golem-message'
import { Replies } from '../../src/messages/replies/types'

jest.mock('../../src/messages/golem-message', () => ({
  GolemMessage: jest.fn(),
}))

type MockMessageParams = {
  content?: string
  author?: Partial<Message['author']>
  guild?: Partial<Message['guild']>
  channel?: Partial<Message['channel']>
  channelId?: string
}

/**
 * Mock Discord Message
 */
export class MockMessage {
  content: Message['content']
  author: Partial<Message['author']>
  guild: Partial<Message['guild']>
  channelId: string
  channel: Partial<Message['channel']>

  constructor(readonly __mock_params: MockMessageParams = {}) {
    this.content = __mock_params.content || ''
    this.reply = jest.fn()
    this.author =
      __mock_params.author || ({ id: '828' } as Partial<Message['author']>)
    this.guild =
      __mock_params.guild || ({ id: '107' } as Partial<Message['guild']>)
    this.channelId = __mock_params.channelId || '211'
    this.channel =
      __mock_params.channel ||
      ({ id: '107', type: ChannelType.GuildText } as Partial<
        Message['channel']
      >)
  }

  // Testing Util Functions
  _cast(): Message {
    return this as unknown as Message
  }

  _setContent(content: string): this {
    this.content = content

    return this
  }

  // Mock Implementation Functions
  reply: jest.MockedFunction<Message['reply']>
}

export const MockGolemMessage = {
  source: undefined as undefined | GolemMessageInteraction,
  messageContent: undefined as undefined | CompiledGolemScript,
  ast: undefined as undefined | AstParseResult,
  log: undefined as undefined | LoggerService,

  init(
    source: GolemMessageInteraction,
    messageContent: CompiledGolemScript,
    ast: AstParseResult,
    log: LoggerService
  ): void {
    this.source = source
    this.messageContent = messageContent
    this.ast = ast
    this.log = log
  },

  info: {
    member: {
      user: {
        id: '828',
      },

      voice: {
        channel: {
          name: 'Cigar Lounge',
          id: '528',
        },
      },
    },
    guild: {
      id: '211',
      name: 'Running on Empty',
    },

    get userId(): string {
      return this.member?.user.id || ''
    },

    get guildId(): string {
      return this.guild?.id || ''
    },

    get voiceChannel(): unknown {
      return this.member?.voice.channel
    },
  },

  addReply: jest
    .fn()
    .mockImplementation(async function (
      reply:
        | Replies
        | Promise<Replies>
        | (Replies | Promise<Replies>)[]
        | string
    ) {
      const r = await reply

      MockGolemMessage._added_replies.push(r)

      return Promise.resolve()
    }),

  reply: jest.fn().mockImplementation(() => {
    return Promise.resolve()
  }),

  _cast(): GolemMessage {
    return this as unknown as GolemMessage
  },

  _replies: {
    render: jest.fn<Replies[], []>(),
  },

  _reset(): void {
    this.reply.mockClear()
    this._replies.render.mockClear()
    this.addReply.mockClear()
    this._added_replies = []
  },

  getUserById: jest.fn().mockImplementation(() => 'Sejeong'),

  _added_replies: [] as any[],
}
;(GolemMessage as jest.MockedClass<typeof GolemMessage>).mockImplementation(
  (
    source: GolemMessageInteraction,
    messageContent: CompiledGolemScript,
    ast: AstParseResult,
    log: LoggerService
  ) => {
    MockGolemMessage.init(source, messageContent, ast, log)

    return MockGolemMessage as unknown as GolemMessage
  }
)
