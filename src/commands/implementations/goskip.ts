import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { Errors } from '../../errors'
import { MessageBuilderService } from '../../messages/message-builder.service'
import { Replies } from '../../messages/replies/replies'
import { PlayerService } from '../../music/player/player.service'
import { GolemModule } from '../../utils/raw-config'

export default new GolemCommand({
  services: {
    log: LoggerService,
    playerService: PlayerService,
    builder: MessageBuilderService,
  },

  logSource: 'GoSkip',

  async handler({ message, source }) {
    this.services.log.setMessageContext(message, 'GoSkip')

    const player = this.services.playerService.for(message.info)

    if (!player) {
      this.services.log.warn(
        `unable to create player for guild: ${message.info.guild?.name} channel: ${message.info.voiceChannel?.name}`
      )

      throw Errors.NoPlayer({
        message: `unable to create player for guild: ${message.info.guild?.name} channel: ${message.info.voiceChannel?.name}`,
        sourceCmd: 'skip',
        traceId: message.traceId,
      })
    }

    this.services.log.info('executing')

    const skipCount = source.getDefault('skip-count', 0)

    this.services.log.verbose(`Attempting to skip ${skipCount} tracks`)

    if (player.nowPlaying && player.currentResource) {
      await player.skip(skipCount)

      if (player.currentResource) {
        const nowPlayingMessage = await this.services.builder.nowPlaying(
          message,
          player.nowPlaying
        )

        await message.addReply(nowPlayingMessage)
      } else {
        await message.addReply(
          Replies.Raw('Track Skipped! The queue is now empty.')
        )
      }
    } else {
      throw Errors.NoPlayer({
        message: `No track to skip.`,
        sourceCmd: 'skip',
        traceId: message.traceId,
      })
    }
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
