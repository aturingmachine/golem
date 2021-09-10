import { SelectMenuInteraction } from 'discord.js'
import { TrackFinder } from '../player/track-finder'
import { logger } from '../utils/logger'
import { GetEmbedFromListing } from '../utils/message-utils'
import { Player } from '../voice/voice-handler'

export const wideSearchHandler = async (
  interaction: SelectMenuInteraction
): Promise<void> => {
  const guild = interaction.client.guilds.cache.get(interaction.guildId || '')
  const member = guild?.members.cache.get(interaction.member?.user.id || '')
  const voiceChannel = member?.voice.channel

  const listingId = interaction.values[0]

  const listing = TrackFinder.listings.filter((l) => l.id === listingId)[0]

  logger.debug(`Got ${listing.names.short.piped} from id ${listingId}`)

  const { image, embed } = GetEmbedFromListing(listing, Player.isPlaying)

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

    Player.enqueue(listing)
  } else {
    interaction.channel?.send('Not in a valid voice channel.')
  }
}
