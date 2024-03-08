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
import type { Constructable } from 'discord.js'
import { BuiltInAlias, CommandBase, CommandNames } from '../constants'
import { LoggerService } from '../core/logger/logger.service'
import { GolemMessage } from '../messages/golem-message'
import { ParsedCommand } from '../messages/parsed-command'
import { DiscordMarkdown } from '../utils/discord-markdown-builder'
import { GolemModule } from '../utils/raw-config'
import { StringUtils } from '../utils/string-utils'
import { SubcommandTree, SubcommandTreeParams } from './subcommand-tree'

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

export type CommandHandlerFnProps = {
  // module: ModuleRef
  message: GolemMessage
  source: ParsedCommand
}

export type CommandHandlerFn<
  T extends ServiceReqs = {
    log: typeof LoggerService
  }
> = (
  this: GolemCommand<T>,
  props: CommandHandlerFnProps,
  ...args: any[]
) => Promise<void>

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

type CommandInfo = {
  short: string
  long?: string
}

type OptionType = 'boolean' | 'user' | 'channel' | 'role' | 'mentionable'

type ArgChoice<T = string | number> = { name: string; value: T }

export type ServiceReqs = Record<string, InjectionToken>

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
  // Maybe roll this into `info`?
  subcommands?: SubcommandTreeParams<T>
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

export class GolemCommand<
  T extends ServiceReqs = {
    log: typeof LoggerService
  }
> {
  public readonly slashCommand: SlashCommandBuilder
  public readonly execute: CommandHandlerFn<T>
  public readonly subcommandTree!: SubcommandTree<T>

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

    if (options.subcommands) {
      this.subcommandTree = new SubcommandTree(options.subcommands)
    }
  }

  async init(moduleRef: ModuleRef): Promise<void> {
    const initLog = await moduleRef.resolve(LoggerService, undefined, {
      strict: false,
    })
    initLog.setContext(this.options.logSource, 'init')

    initLog.debug('running init command', this.options.logSource)

    if (!this.services) {
      this.services = {} as typeof this['services']
    }

    for (const property in this.options.services) {
      const serviceToken = this.options.services[property]

      initLog.silly(`Attempting to load module for ${property}`)

      try {
        this.services[property] = await moduleRef.resolve(
          serviceToken,
          undefined,
          { strict: false }
        )

        initLog.silly(`Module for ${property} Loaded.`)
      } catch (error) {
        initLog.warn(
          `Module for ${property} failed to async loaded - attempting sync load...`
        )

        try {
          this.services[property] = moduleRef.get(serviceToken, {
            strict: false,
          })
        } catch (error) {
          initLog.warn(error)
          initLog.warn(`Unable to load module for ${property}`)
        }
      }
    }
  }

  get info(): CommandDescription {
    return this.options.info
  }

  get helpMessage(): string {
    const markdown = DiscordMarkdown.start()
      .markCode()
      .raw('Command ')
      .raw(this.info.name)
      .raw(':')
      .newLine()
      .tab()
      .raw(this.info.description.long || this.info.description.short)

    if (this.info.args.length) {
      markdown.tab().newLine().raw('--Arguments--').newLine()
    }

    this.info.args.forEach((argDef) => {
      markdown
        .tab(2)
        .raw(argDef.required ? `[${argDef.name}]` : `<${argDef.name}>`)
        .newLine()
        .tab(3)
        .raw(argDef.description.long || argDef.description.short)

      markdown.newLine()
    })

    if (this.info.subcommands?.length) {
      markdown.tab().newLine().raw('--Sub Commands--').newLine()

      this.info.subcommands.forEach((subc) => {
        markdown.tab(2).raw('- ' + subc.name)

        subc.args.forEach((subcArg) => {
          markdown.raw(
            subcArg.required ? ` [${subcArg.name}]` : ` <${subcArg.name}>`
          )
        })

        markdown
          .newLine()
          .tab(4)
          .raw(subc.description.long || subc.description.short)
          .newLine()

        subc.args.forEach((subcArg) => {
          markdown
            .tab(5)
            .raw(subcArg.required ? `[${subcArg.name}]` : `<${subcArg.name}>`)
            .newLine()
            .tab(6)
            .raw(subcArg.description.long || subcArg.description.short)

          markdown.newLine()
        })
      })
    }

    if (this.info.extendedArgs?.length) {
      markdown.tab().newLine().raw('--Extended Arguments--').newLine()

      this.info.extendedArgs.forEach((eArg) => {
        markdown
          .tab(2)
          .raw(eArg.key + ': ' + eArg.type)
          .newLine()
          .tab(3)
          .raw(eArg.description)
          .newLine()
      })
    }

    if (this.info.requiredModules) {
      markdown.tab().newLine().raw('--Required Modules--').newLine()

      if (this.info.requiredModules.all?.length) {
        markdown.tab(2).raw('Requires All Of:').newLine()

        this.info.requiredModules.all.forEach((req) => {
          markdown
            .tab(3)
            .raw('- ' + req)
            .newLine()
        })
      }

      if (this.info.requiredModules.oneOf?.length) {
        markdown.tab(2).raw('Requires One Of:').newLine()

        this.info.requiredModules.oneOf.forEach((req) => {
          markdown
            .tab(3)
            .raw('- ' + req)
            .newLine()
        })
      }
    }

    markdown.tab().newLine().raw('--Example Usage--').newLine()

    this.info.examples.legacy.forEach((example) => {
      markdown.tab(2).raw(example).newLine()
    })

    return markdown
      .newLine()
      .newLine()
      .raw('*************')
      .newLine()
      .raw('arguments marked [] are required')
      .newLine()
      .raw('arguments marked <> are optional')
      .markCode()
      .toString()
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
  missingRequiredModules(activeModules: GolemModule[]): {
    all: any[]
    oneOf: any[]
  } {
    const missingAllMods =
      this.options.info.requiredModules?.all?.filter((mod) => {
        return !activeModules.includes(mod)
      }) || []

    const missingOneOfMods =
      this.options.info.requiredModules?.oneOf?.filter((mod) => {
        return activeModules.length < 1 || !activeModules.includes(mod)
      }) || []

    const isMissingOneOfs =
      this.options.info.requiredModules?.oneOf?.length ===
      missingOneOfMods.length

    return {
      all: missingAllMods,
      oneOf: isMissingOneOfs ? missingOneOfMods : [],
    }
  }

  // missingModulesToString(): string {
  //   return `${this.missingRequiredModules.all.join(', ')}${
  //     this.missingRequiredModules.oneOf.length
  //       ? `; One of:${this.missingRequiredModules.oneOf.join(', ')}`
  //       : ''
  //   }`
  // }

  // private get missingModulesMsg(): string {
  //   return `cannot execute command \`${this.options.info.name}\`. ${
  //     this.missingRequiredModules.all.length
  //       ? `missing required modules: **All of: ${this.missingRequiredModules.all.join(
  //           ', '
  //         )}`
  //       : ''
  //   }${
  //     this.missingRequiredModules.oneOf.length
  //       ? `; One of:${this.missingRequiredModules.oneOf.join(', ')}`
  //       : ''
  //   }**`
  // }

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
              ;(option as SlashCommandIntegerOption).addChoices(choice)
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
              ;(option as SlashCommandStringOption).addChoices(choice)
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
