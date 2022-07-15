import { Injectable } from '@nestjs/common'
import { RegisteredCommands } from '../commands/register-commands'
import { AliasRepository } from '../db/repositories/alias.repo'
import { GolemLogger } from '../logger/logger.service'
import { ParsedMessage } from '../messages/message-info'
import { formatForLog } from '../utils/debug-utils'
import { CustomAlias } from './custom-alias'

@Injectable()
export class AliasService {
  private readonly cache: Map<string, CustomAlias[]>

  constructor(private logger: GolemLogger, private repo: AliasRepository) {
    this.cache = new Map()
  }

  async getAliases(guildId: string): Promise<CustomAlias[]> {
    this.logger.silly(`getting aliases for guild=${guildId}`)

    if (this.cache.has(guildId)) {
      this.logger.debug(`CustomAlias cache hit for ${guildId}`)
      // Safe to non Null here
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.cache.get(guildId)!
    }

    this.logger.debug(`CustomAlias cache miss for ${guildId}`)

    const records = await this.repo.find({ guildId })
    this.logger.silly(`found ${records.length} custom aliases`)

    const aliases = records.map(
      (match) =>
        new CustomAlias(
          match.name,
          match.command,
          match.args,
          match.createdBy,
          match.guildId,
          match.description
        )
    )

    this.cache.set(guildId, aliases)

    return aliases
  }

  async getAliasFor(
    command: string,
    guildId: string
  ): Promise<CustomAlias | undefined> {
    const parsedCommand =
      command.indexOf(' ') > -1
        ? command.slice(0, command.indexOf(' '))
        : command

    const aliases = await this.getAliases(guildId)

    const match = aliases.find(
      (alias) => alias.name === parsedCommand.replace('$', '')
    )

    return match
      ? new CustomAlias(
          match.name,
          match.command,
          match.args,
          match.createdBy,
          match.guildId,
          match.description
        )
      : undefined
  }

  async fromString(
    aliasCommand: string,
    guildId: string,
    userId: string
  ): Promise<CustomAlias> {
    const parsed = new ParsedMessage(aliasCommand)
    const cleanCommand = parsed.content

    const parts = cleanCommand.split('=>')
    const aliasName = parts[0].replaceAll(' ', '')

    const fullCommand = parts[1].trim()
    const isGoCommand = fullCommand.startsWith('$go')
    const commandSplitIndex = isGoCommand
      ? fullCommand.indexOf(' ', fullCommand.indexOf(' ') + 1)
      : fullCommand.indexOf(' ')
    const command = fullCommand.slice(0, commandSplitIndex)
    const args = fullCommand.slice(commandSplitIndex).trim()

    this.logger.silly(
      `splitting args - ${formatForLog({
        fullCommand,
        isGoCmd: isGoCommand,
        commandSplitIndex,
      })}`
    )

    this.logger.silly(
      `fromString - create using ${formatForLog({
        aliasName,
        command,
        args,
        userId,
        guildId,
        description: parsed.args.desc,
      })}`
    )

    if (!(await this.isValidName(aliasName, guildId))) {
      throw new Error(`alias name ${aliasName} already registered`)
    }

    return new CustomAlias(
      aliasName,
      command,
      args,
      userId,
      guildId,
      parsed.args.desc
    )
  }

  async isValidName(name: string, guildId: string): Promise<boolean> {
    const builtInCommands = Object.values(RegisteredCommands)
    const builtInNames = builtInCommands.map((cmd) => cmd.options.info.name)
    const builtInAliases = builtInCommands.map((cmd) => cmd.options.info.alias)
    const customAliases = await this.getAliases(guildId)

    return ![
      ...builtInNames,
      ...builtInAliases,
      ...customAliases.map((alias) => alias.name),
    ].some((cmd) => cmd === name)
  }
}
