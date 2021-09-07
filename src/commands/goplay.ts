import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Interaction, Message } from 'discord.js'
import { TrackFinder } from '../player/track-finder'

const data = new SlashCommandBuilder()
  .setName('goplay')
  .setDescription('Play Something')
  .addStringOption((option) =>
    option
      .setName('query')
      .setDescription('query for a track')
      .setRequired(true)
  )

const execute = async (interaction: CommandInteraction): Promise<void> => {
  const query = interaction.options.getString('query') || ''
  const res = TrackFinder.search(query)
  await interaction.reply(
    `Searched For ${query}! Found ${res.artist} - ${res.album} - ${res.track}`
  )
}

export default {
  data,
  execute,
}
