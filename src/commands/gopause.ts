import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { Command, CommandHelp } from '../models/commands'
import { GolemLogger, LogSources } from '../utils/logger'

const data = new SlashCommandBuilder()
  .setName(CommandNames.slash.pause)
  .setDescription('Pause playback')

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

const helpInfo: CommandHelp = {
  name: 'pause',
  msg: 'Pause the current playback.',
  args: [],
  alias: '$pause',
}

const goPauseCommand = new Command({
  source: LogSources.GoPause,
  data,
  handler: execute,
  helpInfo,
})

export default goPauseCommand
