import {
  MessagePayload,
  InteractionReplyOptions,
  Message,
  CommandInteraction,
} from 'discord.js'
import { Logger } from 'winston'
import { GolemConf } from './config'

type ReplyErrorOptions = {
  interaction: Message | CommandInteraction
  logger: Logger
  error: Error
  reply?: string | MessagePayload | InteractionReplyOptions
}

export class ReplyHelper {
  static async error(options: ReplyErrorOptions): Promise<void> {
    options.logger.error(`unexpected exception ${options.error.message}`)

    if (GolemConf.options.Debug || GolemConf.options.Verbose) {
      console.error(options.error.stack)
    }

    await options.interaction.reply(options.reply || 'Something went wrong...')
  }
}
