import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { TrackFinder } from '../player/track-finder'
import { fourSquare } from '../utils/image-helpers'
import { logger } from '../utils/logger'
import {
  ArtistConfirmReply,
  GetEmbedFromListing,
  GetWideSearchEmbed,
} from '../utils/message-utils'
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

const execute = async (
  interaction: CommandInteraction | Message,
  query?: string
): Promise<void> => {
  const guild = interaction.client.guilds.cache.get(interaction.guildId || '')
  const member = guild?.members.cache.get(interaction.member?.user.id || '')
  const voiceChannel = member?.voice.channel

  logger.debug(
    `goplay command -> guild=${guild?.name}, member=${member?.displayName}, voiceChannel=${voiceChannel?.id}`
  )

  let commandQuery = query

  if (interaction instanceof CommandInteraction) {
    commandQuery = interaction.options.getString('query') || ''
  }

  if (commandQuery) {
    const res = TrackFinder.search(commandQuery)

    if (!res) {
      logger.debug(`GoPlay: No ResultSet`)
      await interaction.reply(`No Results for **${query}**`)
      return
    }

    logger.debug(
      `Query Result: \nartist=${res.listing.artist},\nalbum=${res.listing.album}\ntrack=${res.listing.track}\nwide=${res.isWideMatch}\nartistQuery=${res.isArtistQuery}`
    )

    // Handle artist query
    if (res.isArtistQuery) {
      const srcs = TrackFinder.artistSample(res.listing.artist, 4)

      await interaction.reply(
        ArtistConfirmReply(
          res.listing.artist,
          await fourSquare({
            images: {
              img1: srcs[0].albumArt,
              img2: srcs[1].albumArt,
              img3: srcs[2].albumArt,
              img4: srcs[3].albumArt,
            },
          })
        )
      )
    }
    // Handle Wide Queries
    else if (res.isWideMatch) {
      await interaction.reply(
        GetWideSearchEmbed(commandQuery, TrackFinder.searchMany(commandQuery))
      )
    }
    // Handle Catch-All queries
    else {
      const { image, embed } = GetEmbedFromListing(
        res.listing,
        Player.isPlaying
      )

      await interaction.reply({
        embeds: [embed],
        files: [image],
      })

      if (interaction.guild && voiceChannel?.id) {
        logger.debug('GoPlay starting Player.')
        Player.start({
          channelId: voiceChannel?.id || '',
          guildId: interaction.guildId || '',
          adapterCreator: interaction.guild.voiceAdapterCreator,
        })

        Player.enqueue(res.listing)
      } else {
        interaction.channel?.send('Not in a valid voice channel.')
      }
    }
  } else {
    Player.unpause()
  }
}

export default {
  data,
  execute,
}
