import { SelectMenuInteraction } from 'discord.js'
import { Golem } from '../golem'
import { LocalTrack } from '../models/track'
import { GolemLogger, LogSources } from '../utils/logger'
import { GetEmbedFromListing } from '../utils/message-utils'

const log = GolemLogger.child({ src: LogSources.WideSearch })

export const wideSearchHandler = async (
  interaction: SelectMenuInteraction
): Promise<void> => {
  log.info('executing')
  const player = Golem.getOrCreatePlayer(interaction)

  if (!player) {
    await interaction.reply('Not in a valid voice channel.')
    return
  }

  const listingId = interaction.values[0]

  const listing = Golem.trackFinder.findListingsByIds([{ id: listingId }])[0]

  log.debug(`Got ${listing.shortName} from id ${listingId}`)

  const { image, embed } = await GetEmbedFromListing(listing, player, 'queue')

  await interaction.reply({
    embeds: [embed],
    files: image ? [image] : [],
    components: [],
  })

  await player.enqueue(new LocalTrack(listing, interaction.user.id))
}
