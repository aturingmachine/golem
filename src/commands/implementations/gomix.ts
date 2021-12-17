import { GolemCommand } from '..'
import { GolemModule } from '../../config/models'
import { CommandNames } from '../../constants'
import { LocalListing } from '../../listing/listing'
import { GolemMessage } from '../../messages/message-wrapper'
import { MixMatcher } from '../../player/mixing/mix-matcher'
import { LocalTrack } from '../../tracks/track'
import { ArrayUtils } from '../../utils/list-utils'
import { GolemLogger, LogSources } from '../../utils/logger'

const log = GolemLogger.child({ src: LogSources.GoMix })

const execute = async (interaction: GolemMessage): Promise<void> => {
  if (!interaction.player) {
    await interaction.reply('Not in a valid voice channel.')
    log.info(`no channel to join, exiting early`)
    return
  }

  const mixBy = interaction.parsed.getDefault('mixtype', '')

  log.info(`executing with mixtype: ${mixBy || 'blank'}`)

  if (['genre', 'mood'].includes(mixBy.toLowerCase())) {
  }

  if (['artist', 'track'].includes(mixBy.toLowerCase())) {
    if (
      !interaction.player.currentResource ||
      !(interaction.player.currentResource.metadata.track instanceof LocalTrack)
    ) {
      await interaction.reply('No current playing resource to mix off of.')
      return
    }

    if (
      !(interaction.player.currentResource.metadata.track instanceof LocalTrack)
    ) {
      await interaction.reply('Currently unable to mix off non-local tracks.')

      return
    }

    let result: LocalListing[] = []

    switch (mixBy.toLowerCase()) {
      case 'artist':
        log.info(
          `mixing by artist using "${interaction.player.currentResource.metadata.listing.artist}"`
        )
        result = await MixMatcher.similarArtists(
          interaction.player.currentResource.metadata.track.listing
        )
        break
      case 'track':
        log.info(
          `mixing by track using "${interaction.player.currentResource.metadata.listing.title}"`
        )
        result = await MixMatcher.similarTracks(
          interaction.player.currentResource.metadata.track.listing
        )
        break
    }

    await interaction.reply(
      `Mixing ${result.length} tracks off ${interaction.player.currentResource.metadata.listing.artist}`
    )
  } else {
    // assume we want to mix the current artist?
    if (
      interaction.player.currentResource &&
      interaction.player.currentResource.metadata.track instanceof LocalTrack
    ) {
      const result = await MixMatcher.similarArtists(
        interaction.player.currentResource?.metadata.track.listing
      )

      await interaction.reply(
        `Mixing ${result.length} tracks off ${interaction.player.currentResource.metadata.listing.artist}`
      )

      await interaction.player.enqueueMany(
        interaction.info.userId,
        LocalTrack.fromListings(
          ArrayUtils.shuffleArray(result),
          interaction.info.userId
        )
      )
    } else {
      // we have no current to work off of...
      await interaction.reply('No current playing resource to mix off of.')
    }
  }

  return
}

const gomix = new GolemCommand({
  logSource: LogSources.GoMix,
  handler: execute,
  info: {
    name: CommandNames.Base.mix,
    description: {
      long: 'Enqueue a selection of tracks mixed off the current playing track. Can mix by either like artist or like tracks, defaulting to artist if no argument is provided.',
      short: 'Add a short collection of songs; by similar artist or genre/mood',
    },
    args: [
      {
        type: 'string',
        name: 'mixtype',
        description: {
          long: 'How to execute the mix. The supported option will be parsed off the currently playing track, like tracks found, then shuffled and queued.',
          short: 'What property of the current track to mix off of.',
        },
        required: false,
        choices: [
          { name: 'Artist', value: 'artist' },
          // { name: 'Queue Count', value: 'genre' },
          // { name: 'Now Playing', value: 'mood' },
          { name: 'Track', value: 'track' },
        ],
      },
    ],
    examples: {
      legacy: ['$go mix artist', '$go mix track'],
      slashCommand: ['/gomix artist', '/gomix track'],
    },
    requiredModules: {
      all: [GolemModule.LastFm],
    },
  },
})

export default gomix
