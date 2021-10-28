import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { GolemConf } from '../utils/config'
import { GolemLogger, LogSources } from '../utils/logger'

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
}

export class Command {
  public source: LogSources | string
  public data: Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>
  public handler: CommandHandlerFn
  public helpInfo: CommandHelp
  public errorHandler?: CommandErrorHandlerFn

  constructor(params: CommandParams) {
    this.source = params.source
    this.data = params.data
    this.handler = params.handler
    this.helpInfo = params.helpInfo
    this.errorHandler = params.errorHandler
  }

  get execute(): CommandHandlerFn {
    return async (interaction, ...args: any[]) => {
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
