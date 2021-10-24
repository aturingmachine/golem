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

export class Command {
  constructor(
    public source: LogSources | string,
    public data: Omit<
      SlashCommandBuilder,
      'addSubcommand' | 'addSubcommandGroup'
    >,
    public handler: CommandHandlerFn,
    public errorHandler?: CommandErrorHandlerFn
  ) {}

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
