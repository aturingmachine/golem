import { SelectMenuInteraction } from 'discord.js'
import { Player } from '../player/music-player'
import { TrackFinder } from '../player/track-finder'
import { logger } from '../utils/logger'
import { GetEmbedFromListing } from '../utils/message-utils'

const log = logger.child({ src: 'wide-search' })

export const wideSearchHandler = async (
  interaction: SelectMenuInteraction
): Promise<void> => {
  const guild = interaction.client.guilds.cache.get(interaction.guildId || '')
  const member = guild?.members.cache.get(interaction.member?.user.id || '')
  const voiceChannel = member?.voice.channel

  const listingId = interaction.values[0]

  const listing = TrackFinder.listings.filter((l) => l.id === listingId)[0]

  log.debug(`Got ${listing.names.short.piped} from id ${listingId}`)

  const { image, embed } = GetEmbedFromListing(listing, Player.isPlaying)

  await interaction.reply({
    embeds: [embed],
    files: [image],
    components: [],
  })

  if (interaction.guild && voiceChannel?.id) {
    log.debug('GoPlay starting Player.')
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
