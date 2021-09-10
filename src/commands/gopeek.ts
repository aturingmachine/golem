import { SlashCommandBuilder } from '@discordjs/builders'
import {
  CommandInteraction,
  EmbedFieldData,
  Message,
  MessageEmbed,
} from 'discord.js'
import { logger } from '../utils/logger'
import { Player } from '../voice/voice-handler'

const data = new SlashCommandBuilder()
  .setName('gopeek')
  .setDescription('See the next tracks in the queue.')

const execute = async (
  interaction: CommandInteraction | Message
): Promise<void> => {
  logger.debug('GoPeek: Executing')
  const peekedListings = Player.peek()

  const fields = peekedListings.map((listing, index) => ({
    name: index === 0 ? 'Up Next' : `Position: ${index + 1}`,
    value: listing.name,
  })) as EmbedFieldData[]

  const embed = new MessageEmbed()
    .setTitle('Upcoming Tracks')
    .setDescription(`${Player.stats.count} Queued Tracks`)
    .setFields(...fields)

  await interaction.reply({ embeds: [embed] })
}

export default {
  data,
  execute,
}
