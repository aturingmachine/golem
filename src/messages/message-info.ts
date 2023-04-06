import {
  Guild,
  GuildMember,
  Message,
  StageChannel,
  VoiceChannel,
} from 'discord.js'
import { AstTokenLeaf } from '../ast/parser'
import { FuncAstToken, OptAstToken, VarAstToken } from '../ast/tokenizer'
import { CommandBase } from '../constants'
import { LoggerService } from '../core/logger/logger.service'
import { GolemScriptFunctions } from '../golem-script/functions'
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

  constructor(readonly source: AstTokenLeaf) {
    this.command = (source.command?.value as CommandBase) || 'UNKNOWN'

    source.tokens
      .filter((token): token is OptAstToken => token.type === 'opt')
      .map((token) => {
        let val: string | boolean | number | FuncAstToken = token.opt_val

        // Handle nested Function Call
        if (typeof val === 'object') {
          const def = GolemScriptFunctions.get(val.name)

          const evaled = def?.implementation(...val.params.map((p) => p.value))

          this.options[token.name] = evaled

          return
        }

        const isBool = ['false', 'true'].includes(val)
        const isNumber = !isNaN(parseInt(val))

        if (isBool) {
          val = token.opt_val === 'true'
        } else if (isNumber) {
          val = parseInt(val)
        }

        this.options[token.name] = val
      })

    // TODO idk about this
    source.tokens
      .filter((token): token is VarAstToken => token.type === 'var')
      .map((token) => {
        this.variables[token.name] = this.options[token.name]
      })
  }

  toString(): string {
    return 'UNIMPLEMENTED'
    // return this.leaf.tokens
    //   .reduce((prev, curr) => prev.concat(curr.value + ' '), '')
    //   .trim()
  }

  get asRaw(): string {
    return this.source.tokens
      .map((token) => {
        switch (token.type) {
          case 'num':
          case 'str':
          case 'cmd':
            return token.value
          case 'opt':
            if (typeof (token as OptAstToken).opt_val === 'object') {
              return ''
            }

            return token.value
          case 'var':
            return this.variables[token.name]
          default:
            return ''
        }
      })
      .join(' ')
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

  constructor(
    message: Message | string,
    private log: LoggerService,
    private uid?: string
  ) {
    this.log.setContext(`message-info${uid ? '::' + uid : ''}`)
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
    parsedLogger: LoggerService,
    private uid?: string
  ) {
    this.member = this.interaction.member as GuildMember
    this.guild = this.interaction.guild

    this.parsed = new ParsedMessage(
      '' + this.interaction.toString(),
      parsedLogger,
      this.uid
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
