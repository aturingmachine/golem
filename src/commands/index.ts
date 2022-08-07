/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  SlashCommandBooleanOption,
  SlashCommandBuilder,
  SlashCommandChannelOption,
  SlashCommandIntegerOption,
  SlashCommandMentionableOption,
  SlashCommandRoleOption,
  SlashCommandStringOption,
  SlashCommandSubcommandBuilder,
  SlashCommandUserOption,
} from '@discordjs/builders'
import { InjectionToken } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import { Constructable } from 'discord.js'
import { BuiltInAlias, CommandBase, CommandNames } from '../constants'
import { GolemMessage } from '../messages/golem-message'
import { ParsedCommand } from '../messages/parsed-command'
import { StringUtils } from '../utils/string-utils'
// import { GolemConf } from '../config'
// import { any } from '../config/models'
// import { GolemLogger, LogLevel, LogSources } from '../utils/logger'

export function expandBuiltInAlias(raw: string): string | undefined {
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
    default:
      return
  }
}

export type CommandHandlerFn<T extends ServiceReqs> = (
  this: GolemCommand<T>,
  module: ModuleRef,
  message: GolemMessage,
  source: ParsedCommand,
  ...args: any[]
) => Promise<boolean>

export type CommandErrorHandlerFn = (
  error: Error,
  message: GolemMessage,
  ...args: any[]
) => Promise<any>

type CommandArgDefinition = {
  name: string
  type: string
  required: boolean
  description: string
  default?: string
}

export type CommandHelp = {
  name: string
  msg: string
  args: CommandArgDefinition[]
  alias?: string
}

// export type CommandParams = {
//   source: string
//   data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
//   handler: CommandHandlerFn<T>
//   helpInfo: CommandHelp
//   errorHandler?: CommandErrorHandlerFn
//   requiredModules?: any[]
// }

type CommandInfo = {
  short: string
  long?: string
}

type OptionType = 'boolean' | 'user' | 'channel' | 'role' | 'mentionable'

type ArgChoice<T = string | number> = { name: string; value: T }

type ServiceReqs = Record<string, InjectionToken>

export interface ICommandArg {
  name: string
  description: CommandInfo
  required: boolean
  requiredModules?: any[]
  /**
   * If true, interperet the remainder of the message as the argument
   */
  rest?: boolean
}

export interface BaseCommandArg extends ICommandArg {
  type: OptionType
}

export interface StringCommandArgWithChoices extends ICommandArg {
  type: 'string'
  choices?: ArgChoice<string>[]
}

export interface IntegerCommandArgWithChoices extends ICommandArg {
  type: 'integer'
  choices?: ArgChoice<number>[]
}

export interface SubCommand {
  name: string
  description: CommandInfo
  args: CommandArgs[]
}

type CommandArgs =
  | BaseCommandArg
  | StringCommandArgWithChoices
  | IntegerCommandArgWithChoices

type ExtendedArg = {
  key: string
  type: 'string' | 'number' | 'boolean'
  description: string
}

export type CommandDescription = {
  name: CommandBase
  description: CommandInfo
  args: CommandArgs[]
  examples: {
    legacy: string[]
    slashCommand: string[]
  }
  requiredModules?: {
    all?: any[]
    oneOf?: any[]
  }
  alias?: string
  subcommands?: SubCommand[]
  extendedArgs?: ExtendedArg[]
}

type CommandOptions<T extends ServiceReqs> = {
  logSource: string
  handler: CommandHandlerFn<T>
  info: CommandDescription
  services: T
  errorHandler?: CommandErrorHandlerFn
}

type SlashCommand = Omit<
  SlashCommandBuilder,
  'addSubcommand' | 'addSubcommandGroup'
>

const AddOptions: Record<
  OptionType | 'string' | 'integer',
  keyof Pick<
    SlashCommand & SlashCommandSubcommandBuilder,
    | 'addBooleanOption'
    | 'addUserOption'
    | 'addRoleOption'
    | 'addMentionableOption'
    | 'addStringOption'
    | 'addIntegerOption'
    | 'addChannelOption'
  >
> = {
  boolean: 'addBooleanOption',
  user: 'addUserOption',
  channel: 'addChannelOption',
  role: 'addRoleOption',
  mentionable: 'addMentionableOption',
  string: 'addStringOption',
  integer: 'addIntegerOption',
}

type ValidOptions =
  | SlashCommandBooleanOption
  | SlashCommandChannelOption
  | SlashCommandIntegerOption
  | SlashCommandMentionableOption
  | SlashCommandRoleOption
  | SlashCommandStringOption
  | SlashCommandUserOption

export class GolemCommand<T extends ServiceReqs = {}> {
  public readonly slashCommand: SlashCommandBuilder
  public readonly execute: CommandHandlerFn<T>

  public static config: any

  public services!: {
    [K in keyof T]: T[K] extends Constructable<any> ? InstanceType<T[K]> : never
  }

  constructor(public options: CommandOptions<T>) {
    this.slashCommand = new SlashCommandBuilder()
    this.slashCommand
      .setName(CommandNames.Slash(this.options.info.name))
      .setDescription(this.options.info.description.short)

    this.addOptions()
    this.addSubCommands()

    this.execute = this.options.handler
  }

  async init(moduleRef: ModuleRef): Promise<void> {
    console.log('Init Command', this.options.info.name)

    if (!this.services) {
      this.services = {} as typeof this['services']
    }

    for (const property in this.options.services) {
      try {
        this.services[property] = await moduleRef.resolve(
          this.options.services[property],
          undefined,
          { strict: false }
        )
      } catch (error) {
        console.error(error)

        try {
          this.services[property] = moduleRef.get(
            this.options.services[property],
            { strict: false }
          )
        } catch (error) {
          console.error(error)
        }
      }
    }
  }

  get info(): CommandDescription {
    return this.options.info
  }

  toString(): string {
    return `
  ${this.info.name})${this.info.alias ? ' - ' + this.info.alias + '' : ''}
    ${this.info.description.short}
    ${
      this.info.args.length
        ? 'Arguments:\n' +
          this.info.args.map((arg) => {
            const argWrappers = arg.required ? ['<', '>'] : ['[', ']']

            return `${argWrappers[0]}${arg.name}${argWrappers[1]}\n\t\t${arg.description.short}\n`
          })
        : ''
    }`
  }

  // TODO
  get missingRequiredModules(): { all: any[]; oneOf: any[] } {
    const missingAllMods: any[] = []
    // this.options.info.requiredModules?.all?.filter((mod) => {
    //   return !GolemCommand.config.modules[mod]
    // }) || []

    const missingOneOfMods: any[] = []
    // this.options.info.requiredModules?.oneOf?.filter((mod) => {
    //   return !GolemCommand.config.modules[mod]
    // }) || []

    const isMissingOneOfs =
      this.options.info.requiredModules?.oneOf?.length ===
      missingOneOfMods.length

    return {
      all: missingAllMods,
      oneOf: isMissingOneOfs ? missingOneOfMods : [],
    }
  }

  missingModulesToString(): string {
    return `${this.missingRequiredModules.all.join(', ')}${
      this.missingRequiredModules.oneOf.length
        ? `; One of:${this.missingRequiredModules.oneOf.join(', ')}`
        : ''
    }`
  }

  private get missingModulesMsg(): string {
    return `cannot execute command \`${this.options.info.name}\`. ${
      this.missingRequiredModules.all.length
        ? `missing required modules: **All of: ${this.missingRequiredModules.all.join(
            ', '
          )}`
        : ''
    }${
      this.missingRequiredModules.oneOf.length
        ? `; One of:${this.missingRequiredModules.oneOf.join(', ')}`
        : ''
    }**`
  }

  private addOptions(subcommand?: {
    builder: SlashCommandSubcommandBuilder
    info: SubCommand
  }): void {
    // const target = subcommand?.builder || this.slashCommand
    const info = subcommand?.info || this.options.info

    info.args.forEach((arg) => {
      let option: ValidOptions

      switch (arg.type) {
        case 'boolean':
          option = new SlashCommandBooleanOption()
          break
        case 'channel':
          option = new SlashCommandChannelOption()
          break
        case 'integer':
          option = new SlashCommandIntegerOption()

          if (arg.choices) {
            arg.choices.forEach((choice) => {
              ;(option as SlashCommandIntegerOption).addChoice(
                choice.name,
                choice.value
              )
            })
          }
          break
        case 'mentionable':
          option = new SlashCommandMentionableOption()
          break
        case 'role':
          option = new SlashCommandRoleOption()
          break
        case 'string':
          option = new SlashCommandStringOption()

          if (arg.choices) {
            arg.choices.forEach((choice) => {
              ;(option as SlashCommandStringOption).addChoice(
                choice.name,
                choice.value
              )
            })
          }
          break
        case 'user':
          option = new SlashCommandUserOption()
          break
        default:
          return
      }

      option
        .setName(arg.name)
        .setDescription(arg.description.short)
        .setRequired(arg.required)

      const addOption = AddOptions[arg.type]

      if (subcommand?.builder) {
        subcommand.builder[addOption](option as any)
      } else {
        this.slashCommand[addOption](option as any)
      }
    })
  }

  private addSubCommands(): void {
    if (this.options.info.subcommands) {
      this.options.info.subcommands.forEach((subCommand) => {
        const slashSubcommand = new SlashCommandSubcommandBuilder()
        slashSubcommand.setDescription(subCommand.description.short)
        slashSubcommand.setName(subCommand.name)
        this.addOptions({ builder: slashSubcommand, info: subCommand })

        this.slashCommand.addSubcommand(slashSubcommand)
      })
    }
  }

  private wrapHandler(): CommandHandlerFn<T> {
    return this.execute

    // return async function (this, module, interaction, source, ...args: any[]) {
    //   if (
    //     this.missingRequiredModules.all.length ||
    //     this.missingRequiredModules.oneOf.length
    //   ) {
    //     await interaction.reply(this.missingModulesMsg)

    //     // GolemLogger.warn(
    //     //   `cannot execute command ${
    //     //     this.options.info.name
    //     //   } due to missing modules: All of - ${this.missingRequiredModules.all.join(
    //     //     ', '
    //     //   )}${
    //     //     this.missingRequiredModules.oneOf.length
    //     //       ? `; One of - ${this.missingRequiredModules.oneOf.join(', ')}`
    //     //       : ''
    //     //   }`,
    //     //   { src: this.options.logSource }
    //     // )
    //     return true
    //   }

    //   // try {
    //   //   // TODO?
    //   //   await this.options.handler(this, module, interaction, source, ...args)
    //   //   return true
    //   // } catch (error) {
    //   //   if (this.options.errorHandler) {
    //   //     await this.options.errorHandler(error as Error, interaction, ...args)
    //   //   } else {
    //   //     await baseErrorHandler(
    //   //       this.options.logSource,
    //   //       error as Error,
    //   //       interaction,
    //   //       ...args
    //   //     )
    //   //   }

    //   //   return false
    //   // }
    // }
  }
}

// async function baseErrorHandler(
//   source: string,
//   error: Error,
//   interaction: GolemMessage,
//   ..._args: any[]
// ): Promise<void> {
//   // GolemLogger.error(
//   //   `unexpected exception: ${error.message}; ARGS=${args.join(', ')}`,
//   //   { src: source }
//   // )
//   // if (
//   //   GolemCommand.config.logLevel !== LogLevel.Info ||
//   //   process.env.NODE_ENV === 'test'
//   // ) {
//   //   console.error(error.stack)
//   // }

//   interaction.log.error(error)
//   interaction._replies.add(new RawReply('Something Went Wrong'))
// }
