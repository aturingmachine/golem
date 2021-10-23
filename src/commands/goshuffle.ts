import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { GolemLogger, LogSources } from '../utils/logger'
import { GetPeekEmbed } from '../utils/message-utils'
import { _Command } from '../models/commands'

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
    const embed = GetPeekEmbed(player)
    await interaction.reply({ content: 'Shuffling the queue', embeds: [embed] })
    player.shuffle()
  } else {
    await interaction.reply('No queue to shuffle.')
  }
}

const goShuffleCommand = new _Command(LogSources.GoShuffle, data, execute)

export default goShuffleCommand
