import { Message } from 'discord.js'
import { RegisteredCommands } from '../commands'
import { LegacyCommandHandler } from '../handlers/legacy-command-handler'
import { CustomAliasData } from './db/custom-alias'

export class CustomAlias {
  constructor(
    public name: string,
    public command: string,
    public args: string,
    public createdBy: string,
    public guildId: string
  ) {}

  // TODO get this to take in args as well or some shit idk
  async run(msg: Message): Promise<void> {
    await LegacyCommandHandler.executeCustomAlias(msg, this.fullCommand)
  }

  get fullCommand(): string {
    return `${this.command} ${this.args.trimStart()}`.trimStart()
  }

  static async fromString(
    aliasCommand: string,
    guildId: string,
    userId: string
  ): Promise<CustomAlias> {
    const parts = aliasCommand.split('=>')
    const aliasName = parts[0].replaceAll(' ', '')

    const fullCommand = parts[1].trim()
    const commandSplitIndex = fullCommand.startsWith('$go')
      ? fullCommand.indexOf(' ', fullCommand.indexOf(' '))
      : fullCommand.indexOf(' ')
    const command = fullCommand.slice(0, commandSplitIndex)
    const args = fullCommand.slice(commandSplitIndex).trim()

    if (!(await CustomAlias.isValidName(aliasName, guildId))) {
      throw new Error(`alias name ${aliasName} already registered`)
    }

    return new CustomAlias(aliasName, command, args, userId, guildId)
  }

  static async isValidName(name: string, guildId: string): Promise<boolean> {
    const builtInCommands = Object.values(RegisteredCommands)
    const builtInNames = builtInCommands.map((cmd) => cmd.data.name)
    const builtInAliases = builtInCommands.map((cmd) => cmd.helpInfo.alias)
    const customAliases = await CustomAlias.getAliases(guildId)

    return ![
      ...builtInNames,
      ...builtInAliases,
      ...customAliases.map((alias) => alias.name),
    ].some((cmd) => cmd === name)
  }

  static async getAliases(guildId: string): Promise<CustomAlias[]> {
    return await CustomAliasData.find({ guildId })
  }

  static async getAliasFor(
    command: string,
    guildId: string
  ): Promise<CustomAlias | undefined> {
    const parsedCommand =
      command.indexOf(' ') > -1
        ? command.slice(0, command.indexOf(' '))
        : command

    const aliases = await CustomAlias.getAliases(guildId)

    const match = aliases.find(
      (alias) => alias.name === parsedCommand.replace('$', '')
    )

    return match
      ? new CustomAlias(
          match.name,
          match.command,
          match.args,
          match.createdBy,
          match.guildId
        )
      : undefined
  }
}
