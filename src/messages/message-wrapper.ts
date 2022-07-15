import {
  AwaitMessageComponentOptions,
  CacheType,
  CommandInteraction,
  InteractionReplyOptions,
  Message,
  MessageComponentInteraction,
  MessageOptions,
  SelectMenuInteraction,
} from 'discord.js'
import { v4 } from 'uuid'
import winston from 'winston'
import { CustomAlias } from '../aliases/custom-alias'
import { BuiltInAlias, CommandNames } from '../constants'
import { Golem } from '../golem'
import { MusicPlayer } from '../music/player/music-player'
import { GolemLogger, LogSources } from '../utils/logger'
import { StringUtils } from '../utils/string-utils'
import { MessageInfo } from './message-info'
import { ParsedCommand } from './parsed-command'
import { SelectMenu } from './select-menu'

export type GolemMessageReplyOptions =
  | MessageOptions
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

  asMessage(aux?: Partial<MessageOptions>): MessageOptions {
    return { ...(this.rawOpts as MessageOptions), ...aux }
  }

  asObject<T extends MessageOptions | InteractionReplyOptions>(
    aux?: Partial<T>
  ): T {
    return {
      ...(this.rawOpts as T),
      ...aux,
    }
  }
}

export class GolemMessage {
  private readonly log: winston.Logger

  public readonly parsed: ParsedCommand
  public readonly info: MessageInfo

  /**
   * Internal UUID generated for this message
   */
  public readonly traceId: string

  private replies: Message[] = []

  constructor(
    public source: GolemMessageInteraction,
    customAlias?: CustomAlias
  ) {
    this.traceId = v4()
    this.log = GolemLogger.child({
      src: LogSources.GolemMessage,
      traceId: this.traceId,
    })

    if (this.source instanceof Message) {
      this.log.silly(`got Message`)
      const raw =
        customAlias?.evaluated ||
        this.ExpandBuiltInAlias(this.source.content) ||
        this.source.content

      this.log.silly(`parsed raw => ${raw}`)

      this.parsed = ParsedCommand.fromRaw(raw)
    } else if (this.source.isCommand()) {
      this.parsed = ParsedCommand.fromCommandInteraction(this.source)
    } else if (this.source.isSelectMenu()) {
      this.parsed = SelectMenu.fromId(this.source.customId).toParsedCommand()
    } else {
      throw new Error(`Invalid Interaction type - Cannot wrap ${this.source}`)
    }

    this.log.silly(`parsed => ${this.parsed.toDebug()}`)

    this.info = new MessageInfo(this.source)
  }

  toString(): string {
    return JSON.stringify({ ...this })
  }

  toDebug(): string {
    return this.parsed.toDebug()
  }

  collector<T extends MessageComponentInteraction<CacheType>>(
    options: AwaitMessageComponentOptions<T>,
    handler: (interaction: T) => Promise<T | void>
  ): Promise<T | void> | undefined {
    if (this.lastReply instanceof Message) {
      return this.lastReply
        .awaitMessageComponent({
          ...options,
          componentType: options.componentType || 'ACTION_ROW',
          filter: async (interaction): Promise<boolean> => {
            if (!interaction.isMessageComponent()) {
              return false
            }

            if (interaction.user.id !== this.info.userId) {
              return false
            }

            if (options.filter) {
              return await options.filter(interaction as T)
            }

            return true
          },
        })
        .then((val) => handler(val as T))
    }

    return undefined
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

    let parsedOptions: MessageOptions
    if (typeof options === 'string') {
      parsedOptions = { content: options }
    } else if ('reply' in options) {
      parsedOptions = options
    } else {
      // Handle interaction I guess?
      parsedOptions = { ...options, flags: undefined }
    }

    const message = await this.lastReply.reply(parsedOptions)

    this.replies.push(message)

    return message
  }

  get lastReply(): Message | undefined {
    return this.replies.at(-1)
  }

  get player(): MusicPlayer | undefined {
    const player = Golem.playerCache.getOrCreate(this)

    if (!player) {
      return undefined
    }

    return player
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
