import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { Player } from '../player/music-player'
import { logger } from '../utils/logger'

const data = new SlashCommandBuilder()
  .setName('gopause')
  .setDescription('Pause playback')

const execute = async (
  interaction: CommandInteraction | Message
): Promise<void> => {
  logger.info('Executing', { src: 'GoPause' })

  await interaction.reply('Pausing playback...')
  Player.pause()
}

export default { data, execute }
