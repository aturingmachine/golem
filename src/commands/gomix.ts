import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { Command } from '../models/commands'
import { GolemModule } from '../models/config'
import { Listing } from '../models/listing'
import { LocalTrack } from '../models/track'
import { MixMatcher } from '../player/mix-matcher'
import { shuffleArray } from '../utils/list-utils'
import { GolemLogger, LogSources } from '../utils/logger'
import { userFrom } from '../utils/message-utils'

const log = GolemLogger.child({ src: LogSources.GoMix })

const execute = async (
  interaction: CommandInteraction | Message,
  mixtype?: string,
  _query?: string
): Promise<void> => {
  const player = Golem.getOrCreatePlayer(interaction)

  if (!player) {
    await interaction.reply('Not in a valid voice channel.')
    log.info(`no channel to join, exiting early`)
    return
  }

  let mixBy = mixtype || ''

  const isSlashCommand = interaction instanceof CommandInteraction

  if (isSlashCommand) {
    mixBy = interaction.options.getString('mixtype') || ''
  }

  log.info(`executing with mixtype: ${mixBy || 'blank'}`)

  if (['genre', 'mood'].includes(mixBy.toLowerCase())) {
  }

  if (['artist', 'track'].includes(mixBy.toLowerCase())) {
    if (
      !player.currentResource ||
      !(player.currentResource.metadata.track instanceof LocalTrack)
    ) {
      await interaction.reply('No current playing resource to mix off of.')
      return
    }

    if (!(player.currentResource.metadata.track instanceof LocalTrack)) {
      await interaction.reply('Currently unable to mix off non-local tracks.')

      return
    }

    let result: Listing[] = []

    switch (mixBy.toLowerCase()) {
      case 'artist':
        log.info(
          `mixing by artist using "${player.currentResource.metadata.artist}"`
        )
        result = await MixMatcher.similarArtists(
          player.currentResource.metadata.track.listing
        )
        break
      case 'track':
        log.info(
          `mixing by track using "${player.currentResource.metadata.title}"`
        )
        result = await MixMatcher.similarTracks(
          player.currentResource.metadata.track.listing
        )
        break
    }

    await interaction.reply(
      `Mixing ${result.length} tracks off ${player.currentResource.metadata.artist}`
    )
  } else {
    // assume we want to mix the current artist?
    if (
      player.currentResource &&
      player.currentResource.metadata.track instanceof LocalTrack
    ) {
      const result = await MixMatcher.similarArtists(
        player.currentResource?.metadata.track.listing
      )

      await interaction.reply(
        `Mixing ${result.length} tracks off ${player.currentResource.metadata.artist}`
      )

      await player.enqueueMany(
        userFrom(interaction),
        LocalTrack.fromListings(shuffleArray(result), userFrom(interaction))
      )
    } else {
      // we have no current to work off of...
      await interaction.reply('No current playing resource to mix off of.')
    }
  }

  return
}

const gomix = new Command({
  logSource: LogSources.GoMix,
  handler: execute,
  info: {
    name: CommandNames.mix,
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
    requiredModules: [GolemModule.LastFm],
  },
})

export default gomix
