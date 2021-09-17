import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { GolemLogger, LogSources } from '../utils/logger'

const data = new SlashCommandBuilder()
  .setName(CommandNames.slash.shuffle)
  .setDescription('shuffle the current queue')

const execute = async (
  interaction: CommandInteraction | Message
): Promise<void> => {
  const player = Golem.getPlayer(interaction)

  if (!player) {
    await interaction.reply('Not in a valid voice channel')
    return
  }

  GolemLogger.info('invoked', { src: LogSources.GoShuffle })

  if (player.stats.count > 0) {
    await interaction.reply('Shuffling the queue')
    player.shuffle()
  } else {
    await interaction.reply('No queue to shuffle.')
  }
}

export default { data, execute }
