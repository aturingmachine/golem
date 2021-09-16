import { SlashCommandBuilder } from '@discordjs/builders'
import {
  CommandInteraction,
  EmbedFieldData,
  Message,
  MessageEmbed,
} from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { GolemLogger, LogSources } from '../utils/logger'

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

  const peekedTracks = player.peek()

  const fields = peekedTracks.map((track, index) => ({
    name: index === 0 ? 'Up Next' : `Position: ${index + 1}`,
    value: track.longName,
  })) as EmbedFieldData[]

  const embed = new MessageEmbed()
    .setTitle('Upcoming Tracks')
    .setDescription(`${player.trackCount} Queued Tracks`)
    .setFields(...fields)

  await interaction.reply({ embeds: [embed] })
}

export default {
  data,
  execute,
}
