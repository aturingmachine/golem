import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { GolemLogger, LogSources } from '../utils/logger'
import { GetEmbedFromListing } from '../utils/message-utils'
import { _Command } from '../models/commands'

const log = GolemLogger.child({ src: LogSources.GoSkip })

const data = new SlashCommandBuilder()
  .setName(CommandNames.slash.skip)
  .setDescription(
    'Skip the current song in queue, stops player if last song in queue.'
  )
  .addIntegerOption((option) =>
    option
      .setName('skip-count')
      .setDescription('how many tracks to skip')
      .setRequired(false)
  )

const execute = async (
  interaction: CommandInteraction | Message,
  count?: number
): Promise<void> => {
  const player = Golem.getPlayer(interaction)

  if (!player) {
    await interaction.reply('Not in a valid voice channel')
    return
  }

  log.info('executing')
  let skipCount = count || 1

  if (interaction instanceof CommandInteraction) {
    skipCount = interaction.options.getInteger('skip-count') || 1
  }

  for (let i = 0; i < skipCount; i++) {
    log.debug('Attempting to skip')
    if (player.nowPlaying && player.currentResource) {
      player.skip()
      const assets = await GetEmbedFromListing(
        player.currentResource.metadata.track.listing,
        player,
        'playing'
      )

      await interaction.reply({
        content: 'Skipped!',
        embeds: [assets.embed],
        files: [assets.image],
      })
    } else {
      await interaction.reply('No track to skip')
    }
  }
}

const goSkipCommand = new _Command(LogSources.GoSkip, data, execute)

export default goSkipCommand
