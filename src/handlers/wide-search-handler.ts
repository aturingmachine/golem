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
  const player = Golem.players.getOrCreate(interaction)

  if (!player) {
    await interaction.update({
      content: 'Not in a valid voice channel.',
      components: [],
    })
    return
  }

  const listingId = interaction.values[0]

  const listing = Golem.trackFinder.findListingsByIds([{ id: listingId }])[0]

  log.verbose(`Got ${listing.shortName} from id ${listingId}`)

  const { image, embed } = await GetEmbedFromListing(listing, player, 'queue')

  await interaction.update({
    embeds: [embed],
    files: image ? [image] : [],
    components: [],
  })

  await player.enqueue(new LocalTrack(listing, interaction.user.id))
}
