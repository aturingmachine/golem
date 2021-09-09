import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { logger } from '../utils/logger'
import { Player } from '../voice/voice-handler'

const data = new SlashCommandBuilder()
  .setName('gopause')
  .setDescription('Pause playback')

const execute = async (
  interaction: CommandInteraction | Message
): Promise<void> => {
  logger.info('GoPause executing')

  await interaction.reply('Pausing playback...')
  Player
}

export default { data, execute }
