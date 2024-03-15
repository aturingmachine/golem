import {
  AwaitMessageComponentOptions,
  ChannelType,
  CollectedMessageInteraction,
  Collection,
  CommandInteraction,
  ComponentType,
  GuildMember,
  InteractionReplyOptions,
  Message,
  MessageReplyOptions,
  SelectMenuInteraction,
} from 'discord.js'
import { v4 } from 'uuid'
import { CompiledGolemScript } from '../ast/compiler'
import { AstParseResult } from '../ast/parser'
import { BuiltInAlias, CommandNames } from '../constants'
import { ConfigurationService } from '../core/configuration.service'
import { LoggerService } from '../core/logger/logger.service'
import { GolemError } from '../errors/golem-error'
import { StringUtils } from '../utils/string-utils'
import { MessageInfo } from './message-info'
import { ParsedCommand } from './parsed-command'
import { Reply } from './replies'
import { ErrorReply } from './replies/error-reply'
import { RawReply } from './replies/raw'
import { Replies } from './replies/types'

export type GolemMessageReplyOptions =
  | MessageReplyOptions
  | InteractionReplyOptions
  | string

export type GolemMessageInteraction =
  | Message
  | CommandInteraction
  | SelectMenuInteraction

export class GolemMessageOpts {
  constructor(readonly rawOpts: GolemMessageReplyOptions) {
    if (typeof rawOpts === 'string') {
      this.rawOpts = { content: rawOpts }
    }
  }

  asInteraction(
    aux?: Partial<InteractionReplyOptions>
  ): InteractionReplyOptions {
    return { ...(this.rawOpts as InteractionReplyOptions), ...aux }
  }

  asMessage(aux?: Partial<MessageReplyOptions>): MessageReplyOptions {
    return { ...(this.rawOpts as MessageReplyOptions), ...aux }
  }

  asObject<T extends MessageReplyOptions | InteractionReplyOptions>(
    aux?: Partial<T>
  ): T {
    return {
      ...(this.rawOpts as T),
      ...aux,
    }
  }
}

export class GolemMessage {
  // public readonly parsed: ParsedCommand
  public readonly commands: ParsedCommand[] = []
  public readonly info: MessageInfo
  // public readonly invocation: CommandInvocation

  public readonly _replies: Reply = new Reply()

  /**
   * Internal UUID generated for this message
   */
  public readonly traceId: string

  public auditId!: string

  private replies: Message[] = []

  constructor(
    public source: GolemMessageInteraction,
    public messageContent: CompiledGolemScript,
    public ast: AstParseResult,
    public log: LoggerService,
    logs: [LoggerService, LoggerService]
  ) {
    this.traceId = v4().split('-')[0]
    this.log.setContext(`message`, this.traceId)

    this.commands = this.messageContent.segments.map((segment, index) => {
      this.log.debug(`rendering segment[${index}]`)
      return ParsedCommand.fromSegment(segment)
    })

    this.log.debug(`rendered ${this.commands.length} commands.`)

    this.info = new MessageInfo(
      this.source,
      logs[0],
      logs[1],
      source.channel?.type === ChannelType.DM,
      this.traceId
    )
  }

  isAdminDM(): boolean {
    this.log.log(
      `isAdminDM> isDM=${this.info.isDM}; userID=${this.info.userId}; adminID=${
        ConfigurationService.resolved.discord?.adminId
      }; idMatch=${
        this.info.userId === ConfigurationService.resolved.discord?.adminId
      }`
    )
    return !!(
      this.info.isDM &&
      this.info.userId === ConfigurationService.resolved.discord?.adminId
    )
  }

  getUserById(userId: string): GuildMember | undefined {
    return this.source.guild?.members.cache.get(userId)
  }

  toString(): string {
    return JSON.stringify({ ...this })
  }

  toDebug(): string {
    return this.commands.map((c) => c.toDebug()).join(', ')
  }

  collector<T extends CollectedMessageInteraction>(
    options: AwaitMessageComponentOptions<T>,
    handler: (interaction: T) => Promise<T | void>
  ): Promise<T | void> | undefined {
    if (this.lastReply instanceof Message) {
      return this.lastReply
        .awaitMessageComponent({
          ...options,
          componentType:
            options.componentType || (ComponentType.ActionRow as any),
          filter: async (interaction): Promise<boolean> => {
            this.log.debug(`[collecter::filter] filtering interaction`)

            if (!interaction.isMessageComponent()) {
              return false
            }

            if (interaction.user.id !== this.info.userId) {
              return false
            }

            if (options.filter) {
              return await options.filter(interaction as T, new Collection())
            }

            return true
          },
        })
        .then(async (val) => {
          try {
            await handler(val as T)
          } catch (error) {
            this.log.error(`[collector::handler] threw error ${error}`)

            const errorReply = await this.createErrorReply(error)

            if (errorReply) {
              await val.update({
                content: `Something went wrong.`,
                components: [],
                embeds: [],
                files: [],
                ...errorReply.opts,
              })
            } else {
              await val.update({
                content: `Something went wrong.`,
                components: [],
                embeds: [],
                files: [],
              })
            }
          }
        })
    }

    return undefined
  }

  addReply(
    reply: Replies | Promise<Replies> | (Replies | Promise<Replies>)[] | string
  ): Promise<Replies[]> {
    if (typeof reply === 'string') {
      return this._replies.add(new RawReply(reply))
    }

    return this._replies.add(reply)
  }

  async createErrorReply(
    error: Error | GolemError | string | unknown
  ): Promise<Replies | undefined> {
    if (typeof error === 'string') {
      return new RawReply(error)
    }

    if (GolemError.is(error)) {
      this.log.info('adding reply for a golem error')

      if (error.hasRendered) {
        return undefined
      }

      return error.render()
    }

    if (error instanceof Error) {
      this.log.info('adding raw error reply')

      return new ErrorReply(error)
    }

    return new RawReply(`Something went wrong.`)
  }

  async addError(
    error: Error | GolemError | string | unknown
  ): Promise<Replies[]> {
    this.log.info(error)

    if (!!error && typeof error === 'object' && 'stack' in error) {
      this.log.info(error.stack)
    }

    const parsedError = await this.createErrorReply(error)

    if (!parsedError) {
      return this._replies.children
    }

    return this._replies.add(parsedError)

    // if (typeof error === 'string') {
    //   return this._replies.add(new RawReply(error))
    // }

    // if (GolemError.is(error)) {
    //   this.log.info('adding reply for a golem error')

    //   if (error.hasRendered) {
    //     return this._replies.children
    //   }

    //   return this._replies.add(error.render())
    // }

    // if (error instanceof Error) {
    //   this.log.info('adding raw error reply')

    //   return this._replies.add(new ErrorReply(error))
    // }

    // return this._replies.add(new RawReply(`Something went wrong.`))
  }

  async reply(
    options: GolemMessageReplyOptions | GolemMessageOpts
  ): Promise<Message | undefined> {
    let message: Message

    const opts =
      options instanceof GolemMessageOpts
        ? options
        : new GolemMessageOpts(options)

    if (this.source instanceof Message) {
      message = await this.source.reply(opts.asMessage())
    } else {
      const res = await this.source.reply({
        ...opts.asInteraction(),
        fetchReply: true,
      })

      if (res instanceof Message) {
        message = res
      } else {
        // message = new Message(this.source.client, res)
        return
      }
    }

    this.replies.push(message)

    return message
  }

  /**
   * Update last reply
   * @param options
   * @returns
   */
  async update(
    options: GolemMessageReplyOptions
  ): Promise<Message | undefined> {
    if (!this.lastReply) {
      return
    }

    let parsedOptions: MessageReplyOptions
    if (typeof options === 'string') {
      parsedOptions = { content: options }
    } else if ('reply' in options) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      parsedOptions = options
    } else {
      // Handle interaction I guess?
      parsedOptions = { ...options, flags: undefined }
    }

    const message = await this.lastReply.reply(parsedOptions)

    this.replies.push(message)

    return message
  }

  get messageDebugInfo(): string {
    return `[trace_id: ${this.traceId} | audit_id: ${this.auditId}]`
  }

  get lastReply(): Message | undefined {
    return this.replies.at(-1)
  }

  get player(): undefined {
    return undefined
    // TODO
    // const player = Golem.playerCache.getOrCreate(this)

    // if (!player) {
    //   return undefined
    // }

    // return player
  }

  get logMeta(): { traceId: string } {
    return { traceId: this.traceId }
  }

  // TODO can probs be cleaner
  ExpandBuiltInAlias(raw: string): string | undefined {
    this.log.debug(`running ${raw} as Built In Alias`)

    const parsed = raw.replace(/^\$/, '')
    const aliasName = StringUtils.wordAt(parsed, 0) as BuiltInAlias

    this.log.debug(`parsed ${raw} to alias: ${aliasName}`)

    switch (aliasName) {
      case CommandNames.Aliases.Play:
        return `play ${StringUtils.dropWords(parsed, 1)}`
      case CommandNames.Aliases.PlayNext:
        return `playnext ${StringUtils.dropWords(parsed, 1)}`
      case CommandNames.Aliases.NP:
      case CommandNames.Aliases.NowPlaying:
        return `get np`
      case CommandNames.Aliases.Stop:
        return `stop`
      case CommandNames.Aliases.Skip:
        return `skip ${StringUtils.dropWords(parsed, 1)}`
      case CommandNames.Aliases.Pause:
        return `pause`
      case CommandNames.Aliases.Help:
        return 'get help'
      default:
        return
    }
  }
}
