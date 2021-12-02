import { SelectMenuInteraction } from 'discord.js'
import { Golem } from '../golem'
import { GolemMessage } from '../messages/message-wrapper'
import { LocalTrack } from '../tracks/track'
import { GolemLogger, LogSources } from '../utils/logger'
import { GetEmbedFromListing } from '../utils/message-utils'

const log = GolemLogger.child({ src: LogSources.WideSearch })

export async function wideSearchHandler(
  this: GolemMessage,
  interaction: SelectMenuInteraction
): Promise<void> {
  log.info('executing')
  if (!this.player) {
    await interaction.update({
      content: 'Not in a valid voice channel.',
      components: [],
    })
    return
  }

  const listingId = interaction.values[0]

  const listing = Golem.trackFinder.findListingsByIds([{ id: listingId }])[0]

  log.verbose(`Got ${listing.shortName} from id ${listingId}`)

  const { image, embed } = await GetEmbedFromListing(
    listing,
    this.player,
    'queue'
  )

  await interaction.update({
    embeds: [embed],
    files: image ? [image] : [],
    components: [],
  })

  await this.player.enqueue(new LocalTrack(listing, interaction.user.id))
}
