import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { Command } from '../models/commands'
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

const goPauseCommand = new Command(LogSources.GoPause, data, execute)

export default goPauseCommand
