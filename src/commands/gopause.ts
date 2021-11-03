import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { Command2 } from '../models/commands'
import { GolemLogger, LogSources } from '../utils/logger'

// const data = new SlashCommandBuilder()
//   .setName(CommandNames.slash.pause)
//   .setDescription('Pause playback')

const execute = async (
  interaction: CommandInteraction | Message
): Promise<void> => {
  const player = Golem.getPlayer(interaction)

  if (!player) {
    await interaction.reply('Not in a valid voice channel')
    return
  }

  GolemLogger.info('Executing', { src: LogSources.GoPause })

  await interaction.reply('Pausing playback...')
  player.pause()
}

// const helpInfo: CommandHelp = {
//   name: 'pause',
//   msg: 'Pause the current playback.',
//   args: [],
//   alias: '$pause',
// }

// const goPauseCommand = new Command({
//   source: LogSources.GoPause,
//   data,
//   handler: execute,
//   helpInfo,
// })

const gopause = new Command2({
  logSource: LogSources.GoPause,
  handler: execute,
  info: {
    name: CommandNames.pause,
    description: {
      long: 'Pause the current playback.',
      short: 'Pause the current playback.',
    },
    args: [],
    examples: ['$go pause'],
    requiredModules: [],
    alias: '$pause',
  },
})

export default gopause
