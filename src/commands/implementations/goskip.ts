import { GolemCommand } from '..'
import { GolemModule } from '../../config/models'
import { CommandNames } from '../../constants'
import { GolemMessage } from '../../messages/message-wrapper'
import { ListingEmbed } from '../../messages/replies/listing-embed'
import { GolemLogger, LogSources } from '../../utils/logger'

const log = GolemLogger.child({ src: LogSources.GoSkip })

const execute = async (interaction: GolemMessage): Promise<void> => {
  if (!interaction.player) {
    await interaction.reply('Not in a valid voice channel')
    return
  }

  log.info('executing')
  const skipCount = interaction.parsed.getDefault('skip-count', 0)

  log.verbose(`Attempting to skip ${skipCount} tracks`)

  if (interaction.player.nowPlaying && interaction.player.currentResource) {
    await interaction.player.skip(skipCount)
    if (interaction.player.currentResource) {
      const listingEmbed = new ListingEmbed(interaction)

      await listingEmbed.send('play', false, { content: 'Skipped!' })
    } else {
      await interaction.reply({
        content: 'Skipped! Queue empty.',
      })
    }
  } else {
    await interaction.reply('No track to skip')
  }
}

const goskip = new GolemCommand({
  logSource: LogSources.GoSkip,
  handler: execute,
  info: {
    name: CommandNames.Base.skip,
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
