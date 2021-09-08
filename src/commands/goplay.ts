import { SlashCommandBuilder } from '@discordjs/builders'
import {
  Client,
  CommandInteraction,
  Interaction,
  Message,
  MessageActionRow,
  MessageButton,
} from 'discord.js'
import { ButtonIdPrefixes } from '../handlers/button-handler'
import { TrackFinder } from '../player/track-finder'
import { logger } from '../utils/logger'
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

  logger.debug(
    `goplay command -> guild=${guild?.name}, member=${member?.displayName}, voiceChannel=${voiceChannel?.id}`
  )

  const query = interaction.options.getString('query') || ''
  const res = TrackFinder.search(query)

  if (res.isArtistQuery) {
    const row = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId(
          `${ButtonIdPrefixes.confirmArtistPlay}${res.listing.artist}`
        )
        .setLabel('Yes')
        .setStyle('SUCCESS'),
      new MessageButton()
        .setCustomId(`${ButtonIdPrefixes.abortArtistPlay}${res.listing.artist}`)
        .setLabel('No')
        .setStyle('DANGER')
    )

    await interaction.reply({
      content: `Looks like you might be looking for the artist: **${res.listing.artist}**.\nShould I queue their discography?`,
      components: [row],
    })
  } else if (res.isWideMatch) {
    // TODO
    await interaction.reply(
      `WIDE: Searched For: **${query}**\nFound: **${res.listing.artist}** - **${res.listing.album}** - **${res.listing.track}**\nArtist Query: **${res.isArtistQuery}**\nWide Match: **${res.isWideMatch}**`
    )
  } else {
    await interaction.reply(
      `Searched For: **${query}**\nFound: **${res.listing.artist}** - **${res.listing.album}** - **${res.listing.track}**\nArtist Query: **${res.isArtistQuery}**\nWide Match: **${res.isWideMatch}**`
    )
  }

  // Player.play(res.path, {
  //   channelId: voiceChannel?.id,
  //   guildId: interaction.guildId,
  //   voiceAdapterCreator: interaction.guild?.voiceAdapterCreator,
  // })
}

export default {
  data,
  execute,
}
