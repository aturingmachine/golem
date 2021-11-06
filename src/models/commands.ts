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
import { CommandInteraction, Message } from 'discord.js'
import { CommandBase, CommandNames } from '../constants'
import { GolemConf } from '../utils/config'
import { GolemLogger, LogSources } from '../utils/logger'
import { GolemModule } from './config'

export type CommandHandlerFn = (
  interaction: Message | CommandInteraction,
  ...args: any[]
) => Promise<any>

export type CommandErrorHandlerFn = (
  error: Error,
  interaction: Message | CommandInteraction,
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

export type CommandParams = {
  source: LogSources | string
  data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
  handler: CommandHandlerFn
  helpInfo: CommandHelp
  errorHandler?: CommandErrorHandlerFn
  requiredModules?: GolemModule[]
}

type CommandInfo = {
  short: string
  long?: string
}

type OptionType = 'boolean' | 'user' | 'channel' | 'role' | 'mentionable'

type ArgChoice<T = string | number> = { name: string; value: T }

export interface CommandArg_ {
  name: string
  description: CommandInfo
  required: boolean
  requiredModules?: GolemModule[]
}

export interface BaseCommandArg extends CommandArg_ {
  type: OptionType
}

export interface StringCommandArgWithChoices extends CommandArg_ {
  type: 'string'
  choices?: ArgChoice<string>[]
}

export interface IntegerCommandArgWithChoices extends CommandArg_ {
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

export type CommandDescription = {
  name: CommandBase
  description: CommandInfo
  args: CommandArgs[]
  examples: {
    legacy: string[]
    slashCommand: string[]
  }
  requiredModules?: {
    all?: GolemModule[]
    oneOf?: GolemModule[]
  }
  alias?: string
  subcommands?: SubCommand[]
}

type Command2Options = {
  logSource: LogSources | string
  handler: CommandHandlerFn
  info: CommandDescription
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

export class Command {
  public readonly slashCommand: SlashCommandBuilder
  public readonly execute: CommandHandlerFn

  constructor(public options: Command2Options) {
    this.slashCommand = new SlashCommandBuilder()
    this.slashCommand
      .setName(CommandNames.Slash(this.options.info.name))
      .setDescription(this.options.info.description.short)

    this.addOptions()
    this.addSubCommands()

    this.execute = this.wrapHandler()
  }

  get info(): CommandDescription {
    return this.options.info
  }

  toString(): string {
    return `
  ${this.info.name})${this.info.alias ? ' - ' + this.info.alias + '' : ''}
    ${this.info.description.long || this.info.description.short}
    Arguments:
    ${
      this.info.args.length
        ? this.info.args.map((arg) => {
            const argWrappers = arg.required ? ['<', '>'] : ['[', ']']

            return `${argWrappers[0]}${arg.name}${argWrappers[1]}\n\t\t${
              arg.description.long || arg.description.short
            }\n`
          })
        : ''
    }`
  }

  get missingRequiredModules(): { all: GolemModule[]; oneOf: GolemModule[] } {
    const missingAllMods =
      this.options.info.requiredModules?.all?.filter((mod) => {
        return !GolemConf.modules[mod]
      }) || []

    const missingOneOfMods =
      this.options.info.requiredModules?.oneOf?.filter((mod) => {
        return !GolemConf.modules[mod]
      }) || []

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
    const target = subcommand?.builder || this.slashCommand
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

      target[AddOptions[arg.type]](option as any)
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

  private wrapHandler(): CommandHandlerFn {
    return async (interaction, ...args: any[]) => {
      if (
        this.missingRequiredModules.all.length ||
        this.missingRequiredModules.oneOf.length
      ) {
        await interaction.reply(this.missingModulesMsg)

        GolemLogger.warn(
          `cannot execute command ${
            this.options.info.name
          } due to missing modules: All of - ${this.missingRequiredModules.all.join(
            ', '
          )}${
            this.missingRequiredModules.oneOf.length
              ? `; One of - ${this.missingRequiredModules.oneOf.join(', ')}`
              : ''
          }`,
          { src: this.options.logSource }
        )
        return
      }

      try {
        await this.options.handler(interaction, ...args)
      } catch (error) {
        if (this.options.errorHandler) {
          await this.options.errorHandler(error as Error, interaction, ...args)
        } else {
          await baseErrorHandler(
            this.options.logSource,
            error as Error,
            interaction,
            ...args
          )
        }
      }
    }
  }
}

async function baseErrorHandler(
  source: LogSources | string,
  error: Error,
  interaction: Message | CommandInteraction,
  ...args: any[]
): Promise<void> {
  GolemLogger.error(
    `unexpected exception: ${error.message}; ARGS=${args.join(', ')}`,
    { src: source }
  )

  if (GolemConf.options.Debug || GolemConf.options.Verbose) {
    console.error(error.stack)
  }

  await interaction.reply('Something went wrong...')
}
