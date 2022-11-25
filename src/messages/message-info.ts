import {
  Guild,
  GuildMember,
  Message,
  StageChannel,
  VoiceChannel,
} from 'discord.js'
import { AstTokenLeaf } from '../ast/parser'
import { OptAstToken, VarAstToken } from '../ast/tokenizer'
import { LoggerService } from '../core/logger/logger.service'
import { formatForLog } from '../utils/debug-utils'
import { GolemMessageInteraction } from './golem-message'

// const log = GolemLogger.child({ src: LogSources.ParsedMessage })
export const ExtendedArgRegex = new RegExp(/--[A-z_\-]+(=[A-z0-9]+)?/, 'g')

type ValDict = Record<string, string | number | boolean | undefined>

export class CommandInvocation {
  readonly command: string
  readonly options: ValDict = {}
  readonly variables: ValDict = {}

  readonly info!: string

  constructor(readonly leaf: AstTokenLeaf) {
    this.command =
      leaf.tokens.find((leaf) => leaf.type === 'cmd')?.value?.toString() ||
      'UNKNOWN'

    leaf.tokens
      .filter((token): token is OptAstToken => token.type === 'opt')
      .map((token) => {
        this.options[token.name] = token.opt_val
      })

    // TODO idk about this
    leaf.tokens
      .filter((token): token is VarAstToken => token.type === 'var')
      .map((token) => {
        this.options[token.name] = token.value
      })
  }

  toString(): string {
    return this.leaf.tokens
      .reduce((prev, curr) => prev.concat(curr.value + ' '), '')
      .trim()
  }
}

/**
 * Parses legacy string commands into content and arguments
 * for easy consumption.
 *
 * @todo this needs to be moved to the OTHER Parsed stuff
 */
export class ParsedMessage {
  public static argSeparatorRegexGlobal = / --/g

  public args: Record<string, string | boolean | number>
  public content: string

  constructor(message: Message | string, private log: LoggerService) {
    const rawContent = typeof message === 'string' ? message : message.content

    const sliceIndex = getSliceIndex(rawContent)

    this.log.debug(
      `parsing raw ${formatForLog({
        rawContent,
        sliceIndex,
      })}; slice index: ${sliceIndex}`
    )

    this.content = sliceIndex > 0 ? rawContent.slice(0, sliceIndex) : rawContent

    this.log.debug(`produced content: ${this.content}`)

    this.args = Object.fromEntries(
      Array.from(this.content.matchAll(ExtendedArgRegex)).map((match) => {
        const [arg, value] = match.slice(0, 2)

        if (!arg.includes('=')) {
          return [arg.replace(/^--/, ''), true]
        }

        const splits = arg.split('=')

        return [splits[0].replace(/^--/, ''), value.replace('=', '')]
      })
    )

    this.log.debug(`produced args: ${formatForLog(this.args)}`)
  }
}

export class MessageInfo {
  public member: GuildMember | null
  public guild: Guild | null

  /**
   * Extended message information. Only applicable if the
   * source interaction is a Message
   */
  public parsed: ParsedMessage

  constructor(
    public interaction: GolemMessageInteraction,
    private logger: LoggerService,
    parasedLogger: LoggerService
  ) {
    this.member = this.interaction.member as GuildMember
    this.guild = this.interaction.guild

    this.parsed = new ParsedMessage(
      '' + this.interaction.toString(),
      parasedLogger
    )
  }

  get userId(): string {
    return this.member?.user.id || ''
  }

  get guildId(): string {
    return this.guild?.id || ''
  }

  get voiceChannel(): VoiceChannel | StageChannel | null | undefined {
    return this.member?.voice.channel
  }

  // /**
  //  * Get the Permissions record for this user in this guild
  //  */
  // get permissions(): Promise<UserPermission> {
  //   return UserPermission.get(this.userId, this.guildId)
  // }

  // /**
  //  * Check if this user can do some action in this guild
  //  * @param perm
  //  * @returns
  //  */
  // async can(perm: Permission): Promise<boolean> {
  //   return (await this.permissions).can(perm)
  // }
}

function getSliceIndex(message: string): number {
  // this.log.debug(`getting slice index for message: "${message}"`)
  const isAliasCommand = message.includes(' => ')
  const matches = message.match(ParsedMessage.argSeparatorRegexGlobal) || []

  if (isAliasCommand) {
    return matches.length > 1
      ? message.indexOf(' --', message.indexOf(' -- ') + 1)
      : message.indexOf(' -- ')
  } else {
    return message.indexOf(' -- ')
  }
}
