import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { Command } from '../models/commands'
import { Listing } from '../models/listing'
import { MixMatcher } from '../player/mix-matcher'
import { shuffleArray } from '../utils/list-utils'
import { GolemLogger, LogSources } from '../utils/logger'
import { userFrom } from '../utils/message-utils'

const log = GolemLogger.child({ src: LogSources.GoMix })

const data = new SlashCommandBuilder()
  .setName(CommandNames.slash.mix)
  .setDescription(
    'Add a short collection of songs; by similar artist or genre/mood'
  )
  .addStringOption((option) =>
    option
      .setName('mixtype')
      .setDescription('(artist|genre|mood|track)')
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName('query')
      .setDescription('what to mix off of')
      .setRequired(false)
  )

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
  // let commandQuery = query || ''

  const isSlashCommand = interaction instanceof CommandInteraction

  if (isSlashCommand) {
    mixBy = interaction.options.getString('mixtype') || ''
    // commandQuery = interaction.options.getString('query') || ''
  }

  log.info(`executing with mixtype: ${mixBy || 'blank'}`)

  if (['genre', 'mood'].includes(mixBy.toLowerCase())) {
  }

  if (['artist', 'track'].includes(mixBy.toLowerCase())) {
    if (!player.currentResource) {
      await interaction.reply('No current playing resource to mix off of.')
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
    if (player.currentResource) {
      const result = await MixMatcher.similarArtists(
        player.currentResource?.metadata.track.listing
      )

      await interaction.reply(
        `Mixing ${result.length} tracks off ${player.currentResource.metadata.artist}`
      )

      player.enqueueMany(userFrom(interaction), shuffleArray(result))
    } else {
      // we have no current to work off of...
      await interaction.reply('No current playing resource to mix off of.')
    }
  }

  return
}

const goMixCommand = new Command(LogSources.GoMix, data, execute)

export default goMixCommand
