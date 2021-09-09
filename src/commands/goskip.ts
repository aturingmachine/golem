import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { logger } from '../utils/logger'
import { Player } from '../voice/voice-handler'

const data = new SlashCommandBuilder()
  .setName('goskip')
  .setDescription(
    'Skip the current song in queue, stops player if last song in queue.'
  )

const execute = async (
  interaction: CommandInteraction | Message
): Promise<void> => {
  logger.info('GoSkip executing')

  await interaction.reply('Skipping!')
  Player.skip()
}

export default {
  data,
  execute,
}
