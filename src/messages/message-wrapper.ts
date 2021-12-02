import {
  AwaitMessageComponentOptions,
  CommandInteraction,
  InteractionReplyOptions,
  Message,
  MessageComponentInteraction,
  MessageOptions,
  SelectMenuInteraction,
} from 'discord.js'
import { CustomAlias } from '../aliases/custom-alias'
import { BuiltInAlias, CommandNames } from '../constants'
import { Golem } from '../golem'
import { MusicPlayer } from '../player/music-player'
import { GolemLogger } from '../utils/logger'
import { StringUtils } from '../utils/string-utils'
import { MessageInfo } from './message-info'
import { ParsedCommand } from './parsed-command'
import { SelectMenu } from './select-menu'

export type GolemMessageReplyOptions =
  | (MessageOptions & InteractionReplyOptions)
  | string

export type GolemMessageInteraction =
  | Message
  | CommandInteraction
  | SelectMenuInteraction

export class GolemMessage {
  private static log = GolemLogger.child({ src: 'golem-msg' })

  public readonly parsed: ParsedCommand
  public readonly info: MessageInfo

  private replies: Message[] = []

  constructor(
    public source: GolemMessageInteraction,
    customAlias?: CustomAlias
  ) {
    if (this.source instanceof Message) {
      GolemMessage.log.silly(`got Message`)
      const raw =
        customAlias?.evaluated ||
        GolemMessage.ExpandBuiltInAlias(this.source.content) ||
        this.source.content

      GolemMessage.log.silly(`parsed raw => ${raw}`)

      this.parsed = ParsedCommand.fromRaw(raw)
    } else if (this.source.isCommand()) {
      this.parsed = ParsedCommand.fromCommandInteraction(this.source)
    } else if (this.source.isSelectMenu()) {
      this.parsed = SelectMenu.fromId(this.source.customId).toParsedCommand()
    } else {
      throw new Error(`Invalid Interaction type - Cannot wrap ${this.source}`)
    }

    GolemMessage.log.silly(`parsed => ${this.parsed.toDebug()}`)

    this.info = new MessageInfo(this.source)
  }

  toString(): string {
    return JSON.stringify({ ...this })
  }

  toDebug(): string {
    return this.parsed.toDebug()
  }

  collector<T extends MessageComponentInteraction>(
    options: AwaitMessageComponentOptions<T>,
    handler: (interaction: T) => Promise<T | void>
  ): Promise<T | void> | undefined {
    if (this.lastReply instanceof Message) {
      return this.lastReply
        .awaitMessageComponent({
          ...options,
          filter: async (interaction: T): Promise<boolean> => {
            if (interaction.user.id !== this.info.userId) {
              return false
            }

            if (options.filter) {
              return await options.filter(interaction)
            }

            return true
          },
        })
        .then(handler)
    }

    return undefined
  }

  async reply(options: GolemMessageReplyOptions): Promise<Message> {
    let message: Message
    let parsedOptions
    if (typeof options === 'string') {
      parsedOptions = { content: options }
    } else {
      parsedOptions = options
    }

    if (this.source instanceof Message) {
      message = await this.source.reply(parsedOptions)
    } else {
      const res = await this.source.reply({
        ...parsedOptions,
        fetchReply: true,
      })
      if (res instanceof Message) {
        message = res
      } else {
        message = new Message(this.source.client, res)
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

    let parsedOptions
    if (typeof options === 'string') {
      parsedOptions = { content: options }
    } else {
      parsedOptions = options
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

    return player
  }

  // TODO can probs be cleaner
  static ExpandBuiltInAlias(raw: string): string | undefined {
    const parsed = raw.replace(/^\$/, '')
    const aliasName = StringUtils.wordAt(parsed, 0) as BuiltInAlias

    switch (aliasName) {
      case CommandNames.Aliases.Play:
        return `play ${StringUtils.dropWords(parsed, 1)}`
      case CommandNames.Aliases.PlayNext:
        return `playnext ${StringUtils.dropWords(parsed, 1)}`
      case CommandNames.Aliases.NP:
      case CommandNames.Aliases.NowPlaying:
        return `go get np`
      case CommandNames.Aliases.Stop:
        return `stop`
      case CommandNames.Aliases.Skip:
        return `skip ${StringUtils.dropWords(parsed, 1)}`
      case CommandNames.Aliases.Pause:
        return `pause`
      case CommandNames.Aliases.Help:
        return ''
      default:
        return
    }
  }
}
