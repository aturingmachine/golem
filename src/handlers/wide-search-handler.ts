import { SelectMenuInteraction } from 'discord.js'
import { Golem } from '../golem'
import { GolemLogger, LogSources } from '../utils/logger'
import { GetEmbedFromListing } from '../utils/message-utils'

const log = GolemLogger.child({ src: LogSources.WideSearch })

export const wideSearchHandler = async (
  interaction: SelectMenuInteraction
): Promise<void> => {
  const player = Golem.getOrCreatePlayer(interaction)

  if (!player) {
    await interaction.reply('Not in a valid voice channel.')
    return
  }

  const listingId = interaction.values[0]

  const track = Golem.trackFinder.findListingsByIds([{ id: listingId }])[0]

  log.debug(`Got ${track.shortName} from id ${listingId}`)

  const { image, embed } = GetEmbedFromListing(track, player)

  await interaction.reply({
    embeds: [embed],
    files: [image],
    components: [],
  })

  player.enqueue(track)
}
