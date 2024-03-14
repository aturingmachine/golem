import { CommandInteraction, CommandInteractionOption } from 'discord.js'
import { ASTDebugLogger } from '../ast/ast-debug-logger'
import { RawScriptSegment } from '../ast/compiler'
import { CommandDescription, GolemCommand } from '../commands'
import { Commands } from '../commands/register-commands'
import { BuiltInAlias, CommandBase, CommandNames } from '../constants'
import { formatForLog } from '../utils/debug-utils'
import { ArrayUtils } from '../utils/list-utils'
import { StringUtils } from '../utils/string-utils'
import { CommandInvocation, ExtendedArgRegex } from './message-info'

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
    /**
     * The Command Name
     */
    public command: CommandBase,
    /**
     * The Params for the command
     */
    public params: Record<string, string | number | boolean | undefined>,
    /**
     * Extra Options
     */
    public extendedArgs: Record<string, string | number | boolean | undefined>,
    public source: string,
    /**
     * Sub-Command name; if any
     */
    public subCommand?: string,
    /**
     * Actual implementation for the command.
     */
    public handler?: GolemCommand
  ) {}

  static fromInvocation(invocation: CommandInvocation): ParsedCommand {
    return new ParsedCommand(
      invocation.command as CommandBase,
      {},
      {},
      '',
      '',
      Commands.get(invocation.command)
    )
  }

  toDebug(): string {
    return formatForLog({
      command: this.command,
      params: this.params,
      subCommand: this.subCommand,
    })
  }

  toJSON(): unknown {
    return {
      command: this.command,
      params: this.params,
      subCommand: this.subCommand,
      extendedArgs: this.extendedArgs,
    }
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

    return new ParsedCommand(
      data.command,
      data.params,
      // TODO
      {},
      '',
      data.subCommand,
      Commands.get(data.command)
    )
  }

  static fromSegment(segment: RawScriptSegment): ParsedCommand {
    ASTDebugLogger.log(
      '[PARSED COMMAND]',
      'pc:fromSegment',
      `parsing from segment with command root "%s" compiled="%s"`,
      segment.command,
      segment.compiled
    )

    switch (segment.command) {
      case CommandBase.admin:
        return parseSegment(
          segment,
          Commands.get(CommandNames.Base.admin)?.info
        )
      case CommandBase.alias:
        return parseSegment(
          segment,
          Commands.get(CommandNames.Base.alias)?.info
        )
      case BuiltInAlias.NP:
      case BuiltInAlias.NowPlaying:
      case CommandBase.get:
        return parseSegment(segment, Commands.get(CommandNames.Base.get)?.info)
      // case CommandBase.help:
      //   return parseSegment(segment, gohelp.info)
      // case CommandBase.mix:
      //   return parseSegment(segment, Commands.get('gomix')?.info)
      case BuiltInAlias.Pause:
      case CommandBase.pause:
        return parseSegment(
          segment,
          Commands.get(CommandNames.Base.pause)?.info
        )
      case CommandBase.peek:
        return parseSegment(segment, Commands.get(CommandNames.Base.peek)?.info)
      case BuiltInAlias.Play:
      case CommandBase.play:
      default:
        return parseSegment(segment, Commands.get(CommandNames.Base.play)?.info)
      case CommandBase.playlist:
        return parseSegment(
          segment,
          Commands.get(CommandNames.Base.playlist)?.info
        )
      case BuiltInAlias.PlayNext:
      case CommandBase.playNext:
        return parseSegment(
          segment,
          Commands.get(CommandNames.Base.playNext)?.info
        )
      case CommandBase.report:
        return parseSegment(
          segment,
          Commands.get(CommandNames.Base.report)?.info
        )
      case CommandBase.search:
        return parseSegment(
          segment,
          Commands.get(CommandNames.Base.search)?.info
        )
      case CommandBase.shuffle:
        return parseSegment(
          segment,
          Commands.get(CommandNames.Base.shuffle)?.info
        )
      case BuiltInAlias.Skip:
      case CommandBase.skip:
        return parseSegment(segment, Commands.get(CommandNames.Base.skip)?.info)
      case BuiltInAlias.Stop:
      case CommandBase.stop:
        return parseSegment(segment, Commands.get(CommandNames.Base.stop)?.info)
      case CommandBase.perms:
        return parseSegment(
          segment,
          Commands.get(CommandNames.Base.perms)?.info
        )
      // default:
      //   return parseSegment(segment, Commands.get('goget')?.info)
    }
  }

  static fromRaw(raw: string): ParsedCommand {
    const parsed = raw.replace(/^\$(go )?/, '')
    const cmd = parsed
      .slice(0, parsed.includes(' ') ? parsed.indexOf(' ') : parsed.length)
      .trimStart()

    ASTDebugLogger.log(
      '[PARSED COMMAND]',
      'pc:fromRaw',
      `parsed as CMD="${cmd}"`
    )

    switch (cmd) {
      case CommandBase.admin:
        return parseString(parsed, Commands.get(CommandNames.Base.admin)?.info)
      case CommandBase.alias:
        return parseString(parsed, Commands.get(CommandNames.Base.alias)?.info)
      case BuiltInAlias.NP:
      case BuiltInAlias.NowPlaying:
      case CommandBase.get:
        return parseString(parsed, Commands.get(CommandNames.Base.get)?.info)
      case CommandBase.help:
        return parseString(parsed, Commands.get(CommandNames.Base.help)?.info)
      case CommandBase.mix:
        return parseString(parsed, Commands.get(CommandNames.Base.mix)?.info)
      case BuiltInAlias.Pause:
      case CommandBase.pause:
        return parseString(parsed, Commands.get(CommandNames.Base.pause)?.info)
      case CommandBase.peek:
        return parseString(parsed, Commands.get(CommandNames.Base.peek)?.info)
      case BuiltInAlias.Play:
      case CommandBase.play:
      default:
        return parseString(parsed, Commands.get(CommandNames.Base.peek)?.info)
      case CommandBase.playlist:
        return parseString(
          parsed,
          Commands.get(CommandNames.Base.playlist)?.info
        )
      case BuiltInAlias.PlayNext:
      case CommandBase.playNext:
        return parseString(
          parsed,
          Commands.get(CommandNames.Base.playNext)?.info
        )
      case CommandBase.report:
        return parseString(parsed, Commands.get(CommandNames.Base.report)?.info)
      case CommandBase.search:
        return parseString(parsed, Commands.get(CommandNames.Base.search)?.info)
      case CommandBase.shuffle:
        return parseString(
          parsed,
          Commands.get(CommandNames.Base.shuffle)?.info
        )
      case BuiltInAlias.Skip:
      case CommandBase.skip:
        return parseString(parsed, Commands.get(CommandNames.Base.skip)?.info)
      case BuiltInAlias.Stop:
      case CommandBase.stop:
        return parseString(parsed, Commands.get(CommandNames.Base.stop)?.info)
      case CommandBase.perms:
        return parseString(parsed, Commands.get(CommandNames.Base.perms)?.info)
      // default:
      //   return parseString(parsed, Commands.get('goget')?.info)
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

function parseString(content: string, def?: CommandDescription): ParsedCommand {
  if (!def) {
    throw new Error('No command Def provided to parseString.')
  }

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
    return new ParsedCommand(
      result.command,
      result.params,
      // TODO
      {},
      '',
      result.subCommand,
      Commands.get(result.command)
    )
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
              ASTDebugLogger.log(
                '[PARSED COMMAND]',
                'pc:parseString subcommand args:',
                `"${args.join(', ')}"`
              )

              if (arg.rest) {
                ASTDebugLogger.log(
                  '[PARSED COMMAND]',
                  'pc:parseString subcommand rest args:',
                  `"${args
                    .slice(index, ArrayUtils.safeIndex(args, ' -- '))
                    .join(' ')
                    .replaceAll(';', '')
                    .trim()}"`
                )
              }

              result.params[arg.name] = arg.rest
                ? args
                    .slice(index, ArrayUtils.safeIndex(args, ' -- '))
                    .join(' ')
                    .replaceAll(';', '')
                    .trim()
                : args[index]
            })
          } else {
            result.params[subc.args[0].name] = argString
          }
        }
      })
  } else {
    if (def.args?.length) {
      if (def.args?.length > 1 || /( \-\-[A-z\- ]+ ?)+/g.test(meat)) {
        const args = StringUtils.smartSplit(meat)
        def.args.forEach((arg, index) => {
          if (arg.rest) {
            ASTDebugLogger.log(
              '[PARSED COMMAND]',
              'pc:parseString not-subcommand args:',
              `"${args
                .slice(index, args.indexOf(' -- '))
                .join(' ')
                .replaceAll(';', '')
                .trim()}"`
            )
          }

          result.params[arg.name] = arg.rest
            ? args
                .slice(index, args.indexOf(' -- '))
                .join(' ')
                .replaceAll(';', '')
                .trim()
            : args[index]
        })
      } else {
        result.params[def.args[0].name] = meat
      }
    }
  }

  const extended = Object.fromEntries(
    Array.from(meat.matchAll(ExtendedArgRegex)).map((match) => {
      const [arg, value] = match.slice(0, 2)

      if (!arg.includes('=')) {
        return [arg.replace(/^--/, ''), true]
      }

      const splits = arg.split('=')

      return [splits[0].replace(/^--/, ''), value.replace('=', '')]
    })
  )

  return new ParsedCommand(
    result.command,
    result.params,
    // TODO
    extended,
    '',
    result.subCommand,
    Commands.get(result.command)
  )
}

function parseSegment(
  segment: RawScriptSegment,
  def?: CommandDescription
): ParsedCommand {
  if (!def) {
    ASTDebugLogger.warn(
      '[PARSED COMMAND]',
      'pc:parseSegment provided with no command definition'
    )

    throw new Error('No Command provided to parseSegment')
  }

  const content = segment.compiled

  ASTDebugLogger.log(
    '[PARSED COMMAND]',
    'pc:parseSegment using compiled %s',
    segment.compiled
  )

  const parsedContent = (
    /^\$/.test(content) ? content.replace(/^\$(go )?/, '') : content
  )
    .replace(';', '')
    .trim()
    // Remove all option flags from the raw compiled string
    .replaceAll(/(?:--[A-z_]+=((['"]).*?\2|[^s]*))/gi, '')

  ASTDebugLogger.log(
    '[PARSED COMMAND]',
    'pc:parseSegment parsedContent set to:',
    `"${parsedContent}"`
  )

  const meat = StringUtils.dropWords(parsedContent, 1)

  const result: IParsedCommand = {
    command: StringUtils.wordAt(parsedContent, 0) as CommandBase,
    params: {},
  }

  if (meat.trim() === '--help') {
    result.subCommand = '--help'
    return new ParsedCommand(
      result.command,
      result.params,
      // TODO
      {},
      '',
      result.subCommand,
      Commands.get(result.command)
    )
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
              if (arg.rest) {
                ASTDebugLogger.log(
                  '[PARSED COMMAND]',
                  'pc:parseSegment subcommand args:',
                  `"${args
                    .slice(index, args.indexOf(' -- '))
                    .join(' ')
                    .replaceAll(';', '')
                    .trim()}"`
                )
              }

              result.params[arg.name] = arg.rest
                ? args
                    .slice(index, args.indexOf(' -- '))
                    .join(' ')
                    .replaceAll(';', '')
                    .trim()
                : args[index]
            })
          } else {
            result.params[subc.args[0].name] = argString
          }
        }
      })
  } else {
    if (def.args?.length) {
      if (def.args?.length > 1 || /( \-\-[A-z\- ]+ ?)+/g.test(meat)) {
        const args = StringUtils.smartSplit(meat)
        def.args.forEach((arg, index) => {
          if (arg.rest) {
            ASTDebugLogger.log(
              '[PARSED COMMAND]',
              'pc:parseString not-subcommand args:',
              `"${args
                .slice(index, args.indexOf(' -- '))
                .join(' ')
                .replaceAll(';', '')
                .trim()}"`
            )
          }

          result.params[arg.name] = arg.rest
            ? args
                .slice(index, args.indexOf(' -- '))
                .join(' ')
                .replaceAll(';', '')
                .trim()
            : args[index]
        })
      } else {
        ASTDebugLogger.log(
          '[PARSED COMMAND]',
          'pc:parseString not-subcommand args:',
          `setting "${result.params[def.args[0].name]}" => "${meat}"`
        )
        result.params[def.args[0].name] = meat
      }
    }
  }

  return new ParsedCommand(
    result.command,
    result.params,
    segment.options,
    segment.compiled,
    result.subCommand,
    Commands.get(result.command)
  )
}
