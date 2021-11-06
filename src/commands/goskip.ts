import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { Command } from '../models/commands'
import { GolemModule } from '../models/config'
import { GolemLogger, LogSources } from '../utils/logger'
import { GetEmbedFromListing } from '../utils/message-utils'

const log = GolemLogger.child({ src: LogSources.GoSkip })

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

  // TODO dont skip one at a time, its costly on youtube tracks
  for (let i = 0; i < skipCount; i++) {
    log.verbose('Attempting to skip')
    if (player.nowPlaying && player.currentResource) {
      await player.skip()
      if (player.currentResource) {
        const assets = await GetEmbedFromListing(
          player.nowPlaying,
          player,
          'playing'
        )

        await interaction.reply({
          content: 'Skipped!',
          embeds: [assets.embed],
          files: assets.image ? [assets.image] : [],
        })
      } else {
        await interaction.reply({
          content: 'Skipped! Queue empty.',
        })
      }
    } else {
      await interaction.reply('No track to skip')
    }
  }
}

const goskip = new Command({
  logSource: LogSources.GoSkip,
  handler: execute,
  info: {
    name: CommandNames.skip,
    description: {
      short: 'Skip queued tracks.',
    },
    args: [
      {
        type: 'integer',
        name: 'skip-count',
        description: {
          short: 'The number of tracks to skip.',
        },
        required: false,
      },
    ],
    examples: {
      legacy: ['$go skip', '$skip'],
      slashCommand: ['/goskip'],
    },
    requiredModules: {
      oneOf: [GolemModule.Music, GolemModule.Youtube],
    },
    alias: '$skip',
  },
})

export default goskip
