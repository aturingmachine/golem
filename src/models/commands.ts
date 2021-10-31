import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
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

export class Command {
  public source: LogSources | string
  public data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
  public handler: CommandHandlerFn
  public helpInfo: CommandHelp
  public errorHandler?: CommandErrorHandlerFn
  public requiredModules?: GolemModule[]

  constructor(params: CommandParams) {
    this.source = params.source
    this.data = params.data
    this.handler = params.handler
    this.helpInfo = params.helpInfo
    this.errorHandler = params.errorHandler
    this.requiredModules = params.requiredModules
  }

  get execute(): CommandHandlerFn {
    return async (interaction, ...args: any[]) => {
      if (this.missingRequiredModules.length) {
        await interaction.reply(this.missingModulesMsg)

        GolemLogger.warn(
          `cannot execute command ${
            this.data.name
          } due to missing modules: ${this.missingRequiredModules.join(', ')}`,
          { src: this.source }
        )
        return
      }

      try {
        this.handler(interaction, ...args)
      } catch (error) {
        if (this.errorHandler) {
          this.errorHandler(error as Error, interaction, ...args)
        } else {
          Command.BaseErrorHandler(
            this.source,
            error as Error,
            interaction,
            ...args
          )
        }
      }
    }
  }

  toString(): string {
    return `
  ${this.helpInfo.name})${
      this.helpInfo.alias ? ' - ' + this.helpInfo.alias + '' : ''
    }
    ${this.helpInfo.msg}
    Arguments:
    ${
      this.helpInfo.args.length
        ? this.helpInfo.args.map((arg) => {
            const argWrappers = arg.required ? ['<', '>'] : ['[', ']']

            return `${argWrappers[0]}${arg.name}${argWrappers[1]}\n\t\t${
              arg.description
            }\n\t\t${arg.default ? 'Default: {' + arg.default + '}\n' : ''}`
          })
        : ''
    }`
  }

  private get missingRequiredModules(): GolemModule[] {
    return this.requiredModules
      ? this.requiredModules.filter((mod) => !GolemConf.modules[mod])
      : []
  }

  private get missingModulesMsg(): string {
    return `cannot execute command \`${
      this.data.name
    }\`. missing required modules: **${this.missingRequiredModules.join(
      ', '
    )}**`
  }

  static async BaseErrorHandler(
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
}
