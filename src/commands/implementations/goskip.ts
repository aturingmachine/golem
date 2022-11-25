import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { MessageBuilderService } from '../../messages/message-builder.service'
import { RawReply } from '../../messages/replies/raw'
import { PlayerService } from '../../music/player/player.service'
import { GolemModule } from '../../utils/raw-config'

export default new GolemCommand({
  services: {
    log: LoggerService,
    playerService: PlayerService,
    builder: MessageBuilderService,
  },

  logSource: 'GoSkip',

  async handler({ message, source }): Promise<boolean> {
    this.services.log.setMessageContext(message, 'GoSkip')

    const player = this.services.playerService.for(message.info.guildId)

    if (!player) {
      this.services.log.warn(
        `unable to create player for guild: ${message.info.guild?.name} channel: ${message.info.voiceChannel?.name}`
      )
      return false
    }

    this.services.log.info('executing')

    const skipCount = source.getDefault('skip-count', 0)

    this.services.log.verbose(`Attempting to skip ${skipCount} tracks`)

    if (player.nowPlaying && player.currentResource) {
      await player.skip(skipCount)

      if (player.currentResource) {
        const nowPlayingMessage = this.services.builder.nowPlaying(
          message,
          player.nowPlaying
        )

        await message.addReply(nowPlayingMessage)
      } else {
        await message.addReply(
          new RawReply('Track Skipped! The queue is now empty.')
        )
      }
    } else {
      await message.addReply(new RawReply('No track to skip.'))
    }

    return true
  },

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
      oneOf: [GolemModule.LocalMusic, GolemModule.Youtube],
    },
    alias: '$skip',
  },
})
