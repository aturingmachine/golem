import { SelectMenuInteraction } from 'discord.js'
import { Golem } from '../golem'
import { GolemMessage } from '../messages/message-wrapper'
import { ListingEmbed } from '../messages/replies/listing-embed'
import { LocalTrack } from '../tracks/track'
import { GolemLogger, LogSources } from '../utils/logger'

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

  const listingEmbed = new ListingEmbed(this, listing)
  const messageOptions = await listingEmbed.messageOptions('queue')

  await interaction.update({
    ...messageOptions,
    components: [],
  })

  await this.player.enqueue(new LocalTrack(listing, interaction.user.id))
}
