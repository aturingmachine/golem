import { SlashCommandBuilder } from '@discordjs/builders'
import { Client, CommandInteraction, Interaction, Message } from 'discord.js'
import { TrackFinder } from '../player/track-finder'
import { Player } from '../voice/voice-handler'

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
  const guild = interaction.client.guilds.cache.get(interaction.guildId || '')
  const member = guild?.members.cache.get(interaction.member?.user.id || '')
  const voiceChannel = member?.voice.channel

  console.table({
    guild: guild?.name,
    memeber: member?.displayName,
    voiceChannel: voiceChannel?.id,
  })
  console.log(voiceChannel)

  const query = interaction.options.getString('query') || ''
  const res = TrackFinder.search(query)
  await interaction.reply(
    `Searched For ${query}! Found ${res.artist} - ${res.album} - ${res.track}`
  )

  console.log('ATTEMPTING TO JOIN')
  Player.play(res.path, {
    channelId: voiceChannel?.id,
    guildId: interaction.guildId,
    voiceAdapterCreator: interaction.guild?.voiceAdapterCreator,
  })
}

export default {
  data,
  execute,
}
