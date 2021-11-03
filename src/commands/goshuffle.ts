import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { Command2 } from '../models/commands'
import { GolemLogger, LogSources } from '../utils/logger'
import { GetPeekEmbed } from '../utils/message-utils'

// const data = new SlashCommandBuilder()
//   .setName(CommandNames.slash.shuffle)
//   .setDescription('shuffle the current queue')

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
    player.shuffle()
    await interaction.reply({ content: 'Shuffling the queue', embeds: [embed] })
  } else {
    await interaction.reply('No queue to shuffle.')
  }
}

// const helpInfo: CommandHelp = {
//   name: 'shuffle',
//   msg: 'Shuffle the queue. Keeps playnext-ed tracks in front of the main queue.',
//   args: [],
// }

// const goShuffleCommand = new Command({
//   source: LogSources.GoShuffle,
//   data,
//   handler: execute,
//   helpInfo,
// })

const goshuffle = new Command2({
  logSource: LogSources.GoShuffle,
  handler: execute,
  info: {
    name: CommandNames.shuffle,
    description: {
      short:
        "Shuffle the current queue maintaining the playnext queue's position.",
    },
    args: [],
    examples: ['$go shuffle'],
    requiredModules: [],
  },
})

export default goshuffle
