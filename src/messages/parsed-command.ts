import { CommandInteraction, CommandInteractionOption } from 'discord.js'
import { CommandDescription } from '../commands'
import { RegisteredCommands } from '../commands/register-commands'
import { BuiltInAlias, CommandBase } from '../constants'
import { formatForLog } from '../utils/debug-utils'
import { StringUtils } from '../utils/string-utils'

export interface IParsedCommand {
  command: CommandBase
  params: Record<string, string | number | boolean | undefined>
  subCommand?: string
}

type ObjectType<T> = T extends string
  ? string
  : T extends number
  ? number
  : T extends boolean
  ? boolean
  : never

export class ParsedCommand {
  constructor(
    public command: CommandBase,
    public params: Record<string, string | number | boolean | undefined>,
    public subCommand?: string
  ) {}

  toDebug(): string {
    return formatForLog({
      command: this.command,
      params: this.params,
      subCommand: this.subCommand,
    })
  }

  getDefault<T extends string | number | boolean>(
    key: string,
    defaultValue: T
  ): ObjectType<T> {
    switch (typeof defaultValue) {
      case 'string':
        return (this.getString(key) || defaultValue) as ObjectType<T>
      case 'number':
        return (this.getNumber(key) || defaultValue) as ObjectType<T>
      case 'boolean':
        return (
          this.getBoolean(key) !== null ? this.getBoolean(key) : defaultValue
        ) as ObjectType<T>
    }
  }

  getString(key: string): string | null {
    return this.params[key]?.toString() || null
  }

  getNumber(key: string): number | null {
    const value = this.params[key]
    return ['string', 'number'].includes(typeof value) ? Number(value) : null
  }

  getBoolean(key: string): boolean | null {
    const value = this.params[key]
    return typeof value === 'boolean' ? value : null
  }

  getUser(key = 'user'): string | null {
    const value = this.params[key]
    return value ? value.toString().replace(/(<@!|>)/g, '') : null
  }

  isSubCommand(subCommand: string): boolean {
    return this.subCommand === subCommand
  }

  static fromCommandInteraction(
    interaction: CommandInteraction
  ): ParsedCommand {
    const data = {
      command: interaction.commandName.slice(2) as CommandBase,
      ...parseCommandInterface(interaction.options.data),
    }

    return new ParsedCommand(data.command, data.params, data.subCommand)
  }

  static fromRaw(raw: string): ParsedCommand {
    const parsed = raw.replace(/^\$(go )?/, '')
    const cmd = parsed.slice(0, parsed.indexOf(' ')).trimStart()

    switch (cmd) {
      case CommandBase.admin:
        return parseString(parsed, RegisteredCommands.goadmin.info)
      case CommandBase.alias:
        return parseString(parsed, RegisteredCommands.goalias.info)
      case BuiltInAlias.NP:
      case BuiltInAlias.NowPlaying:
      case CommandBase.get:
        return parseString(parsed, RegisteredCommands.goget.info)
      // case CommandBase.help:
      //   return parseString(parsed, gohelp.info)
      case CommandBase.mix:
        return parseString(parsed, RegisteredCommands.gomix.info)
      case BuiltInAlias.Pause:
      case CommandBase.pause:
        return parseString(parsed, RegisteredCommands.gopause.info)
      case CommandBase.peek:
        return parseString(parsed, RegisteredCommands.gopeek.info)
      case BuiltInAlias.Play:
      case CommandBase.play:
        return parseString(parsed, RegisteredCommands.goplay.info)
      case CommandBase.playlist:
        return parseString(parsed, RegisteredCommands.goplaylist.info)
      case BuiltInAlias.PlayNext:
      case CommandBase.playNext:
        return parseString(parsed, RegisteredCommands.goplaynext.info)
      case CommandBase.report:
        return parseString(parsed, RegisteredCommands.goreport.info)
      case CommandBase.search:
        return parseString(parsed, RegisteredCommands.gosearch.info)
      case CommandBase.shuffle:
        return parseString(parsed, RegisteredCommands.goshuffle.info)
      case BuiltInAlias.Skip:
      case CommandBase.skip:
        return parseString(parsed, RegisteredCommands.goskip.info)
      case BuiltInAlias.Stop:
      case CommandBase.stop:
        return parseString(parsed, RegisteredCommands.gostop.info)
      case CommandBase.perms:
        return parseString(parsed, RegisteredCommands.gopermission.info)
      default:
        return parseString(parsed, RegisteredCommands.goget.info)
    }
  }
}

export function parseCommandInterface(
  data: readonly CommandInteractionOption[]
): Pick<IParsedCommand, 'params' | 'subCommand'> {
  const res: Pick<IParsedCommand, 'params' | 'subCommand'> = {
    params: {},
  }

  data.forEach((item) => {
    if (item.options) {
      res.subCommand = item.name
      item.options.forEach((opt) => {
        res.params[opt.name] = opt.value
      })
    } else {
      res.params[item.name] = item.value
    }
  })

  return res
}

function parseString(content: string, def: CommandDescription): ParsedCommand {
  const parsedContent = /^\$/.test(content)
    ? content.replace(/^\$(go )?/, '')
    : content
  const meat = StringUtils.dropWords(parsedContent, 1)
  const result: IParsedCommand = {
    command: StringUtils.wordAt(parsedContent, 0) as CommandBase,
    params: {},
  }

  if (meat.trim() === '--help') {
    result.subCommand = '--help'
    return new ParsedCommand(result.command, result.params, result.subCommand)
  }

  if (def.subcommands && !result.subCommand) {
    result.subCommand = meat.split(' ')[0]

    def.subcommands
      .filter((subc) => subc.name === meat.split(' ')[0])
      .forEach((subc) => {
        if (subc.args?.length) {
          const argString = StringUtils.dropWords(meat, 1)
          if (subc.args?.length > 1) {
            const args = StringUtils.smartSplit(argString)
            subc.args.forEach((arg, index) => {
              result.params[arg.name] = arg.rest
                ? args.slice(index, args.indexOf(' -- ')).join(' ')
                : args[index]
            })
          } else {
            result.params[subc.args[0].name] = argString
          }
        }
      })
  } else {
    if (def.args?.length) {
      if (def.args?.length > 1) {
        const args = StringUtils.smartSplit(meat)
        def.args.forEach((arg, index) => {
          result.params[arg.name] = arg.rest
            ? args.slice(index, args.indexOf(' -- ')).join(' ')
            : args[index]
        })
      } else {
        result.params[def.args[0].name] = meat
      }
    }
  }

  return new ParsedCommand(result.command, result.params, result.subCommand)
}
