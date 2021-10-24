import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { Command } from '../models/commands'
import { GolemLogger, LogSources } from '../utils/logger'
import { GetPeekEmbed } from '../utils/message-utils'

const log = GolemLogger.child({ src: LogSources.GoPeek })

const data = new SlashCommandBuilder()
  .setName(CommandNames.slash.peek)
  .setDescription('See the next tracks in the queue.')

const execute = async (
  interaction: CommandInteraction | Message
): Promise<void> => {
  log.debug('Executing')
  const player = Golem.getPlayer(interaction)

  if (!player) {
    await interaction.reply('Not in a valid voice channel.')
    log.info(`no channel to join, exiting early`)
    return
  }

  const embed = GetPeekEmbed(player)

  await interaction.reply({ embeds: [embed] })
}

const goPeekCommand = new Command(LogSources.GoPeek, data, execute)

export default goPeekCommand
