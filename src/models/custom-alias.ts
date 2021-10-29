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
    console.log('Running using', this.fullCommand)
    await LegacyCommandHandler.executeCustomAlias(msg, this.fullCommand)
  }

  get fullCommand(): string {
    return `${this.command} ${this.args.trimStart()}`.trimStart()
  }

  static validateName(name: string): boolean {
    return !Object.values(RegisteredCommands).some(
      (cmd) => cmd.data.name === name || cmd.helpInfo.alias?.includes(name)
    )
  }

  static async getAliases(): Promise<CustomAlias[]> {
    return CustomAliasData.find({})
  }

  static async getAliasFor(command: string): Promise<CustomAlias | undefined> {
    console.log('Getting alias for raw command', command)
    const parsedCommand =
      command.indexOf(' ') > -1
        ? command.slice(0, command.indexOf(' '))
        : command
    const aliases = await CustomAlias.getAliases()

    console.log(parsedCommand, aliases)

    const match = aliases.find(
      (alias) => alias.name === parsedCommand.replace('$', '')
    )

    console.log('match: ', match)

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
