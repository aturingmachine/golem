import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { Player } from '../player/music-player'
import { logger } from '../utils/logger'

const data = new SlashCommandBuilder()
  .setName('goshuffle')
  .setDescription('shuffle the current queue')

const execute = async (
  interaction: CommandInteraction | Message
): Promise<void> => {
  logger.info('invoked', { src: 'GoShuffle' })

  if (Player.stats.count > 0) {
    await interaction.reply('Shuffling the queue')
    Player.shuffle()
  } else {
    await interaction.reply('No queue to shuffle.')
  }
}

export default { data, execute }
