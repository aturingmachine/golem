import {
  Guild,
  GuildMember,
  Message,
  StageChannel,
  VoiceChannel,
} from 'discord.js'
import { Permission, UserPermission } from '../permissions/permission'
import { formatForLog } from '../utils/debug-utils'
import { GolemLogger, LogSources } from '../utils/logger'
import { GolemMessageInteraction } from './message-wrapper'

const log = GolemLogger.child({ src: LogSources.ParsedMessage })

/**
 * Parses legacy string commands into content and arguments
 * for easy consumption.
 *
 * @todo this needs to be moved to the OTHER Parsed stuff
 */
export class ParsedMessage {
  public static argSeparatorRegexGlobal = / --/g

  public args: Record<string, string>
  public content: string

  constructor(message: Message | string) {
    const rawContent = typeof message === 'string' ? message : message.content

    const sliceIndex = getSliceIndex(rawContent)

    log.silly(`parsing raw ${formatForLog({ rawContent, sliceIndex })}`)

    this.content = sliceIndex > 0 ? rawContent.slice(0, sliceIndex) : rawContent

    this.args =
      sliceIndex < 1
        ? {}
        : Object.fromEntries(
            rawContent
              .slice(sliceIndex)
              .split(/(?<!"[A-z0-9 ]*[^ ])\s/g)
              .map((argPair) => argPair.split('='))
          )

    log.silly(`new - ${formatForLog(this)}`)
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

  constructor(public interaction: GolemMessageInteraction) {
    this.member = this.interaction.member as GuildMember
    this.guild = this.interaction.guild

    this.parsed = new ParsedMessage('' + this.interaction.toString())
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

  /**
   * Get the Permissions record for this user in this guild
   */
  get permissions(): Promise<UserPermission> {
    return UserPermission.get(this.userId, this.guildId)
  }

  /**
   * Check if this user can do some action in this guild
   * @param perm
   * @returns
   */
  async can(perm: Permission): Promise<boolean> {
    return (await this.permissions).can(perm)
  }
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
