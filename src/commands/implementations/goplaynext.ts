import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { Errors } from '../../errors'
import { BasicError } from '../../errors/basic-error'
import { NoModuleError } from '../../errors/no-module-error'
import { RawReply } from '../../messages/replies/raw'
import { PlayQueryService } from '../../music/player/play-query.service'
import { PlayerService } from '../../music/player/player.service'
import { formatForLog } from '../../utils/debug-utils'
import { GolemModule } from '../../utils/raw-config'

export default new GolemCommand({
  services: {
    log: LoggerService,
    playerService: PlayerService,
    queryService: PlayQueryService,
  },

  logSource: 'GoPlayNext',

  async handler({ message, source }) {
    this.services.log.setMessageContext(message, 'GoPlay')

    const query = source.getString('query')
    this.services.log.info(`executing play with query ${query}`)

    const player = await this.services.playerService.getOrCreate(message)

    if (!player) {
      this.services.log.warn(
        `unable to create player for guild: ${message.info.guild?.name} channel: ${message.info.voiceChannel?.name}`
      )

      throw Errors.NoPlayer({
        message: `unable to create player for guild: ${message.info.guild?.name} channel: ${message.info.voiceChannel?.name}`,
        sourceCmd: 'playnext',
        traceId: message.traceId,
      })
    }

    if (player === 'ERR_ALREADY_ACTIVE') {
      this.services.log.warn(
        `attempted to play from another voice channel while bot was already active; guild: ${message.info.guild?.name} channel: ${message.info.voiceChannel?.name}`
      )

      throw Errors.ActivePlayerChannelMismatch({
        message: `Attempted action that requires matching Voice Channel with bot, but found mismsatched Voice Channels.`,
        sourceCmd: 'playnext',
        traceId: message.traceId,
      })
    }

    if (!query) {
      // If we are doing an "unpause" and nothing is playing
      // then we have errored...
      if (!player.isPlaying) {
        throw Errors.NoPlayer({
          sourceCmd: 'playnext',
          message:
            'Cannot execute. No search query to play, and no paused track to unpase.',
          traceId: message.traceId,
        })
      }

      player?.unpause()

      await message.addReply(new RawReply('Unpausing!'))

      return
    }

    const queryResult = await this.services.queryService.process(message, query)

    // Handle a processed result that does not have a supported module
    if (!('tracks' in queryResult)) {
      if (queryResult.missingModule) {
        throw new NoModuleError({
          message: queryResult.message || 'Missing required modules to play.',
          sourceCmd: 'playnext',
          action: 'playnext',
          required: [queryResult.missingModule],
          traceId: message.traceId,
        })
      }

      throw new BasicError({
        code: 102,
        message: queryResult.message || 'Unable to process playnext request.',
        sourceCmd: 'playnext',
        requiresAdminAttention: true,
        traceId: message.traceId,
      })
    }

    if (queryResult.tracks.length > 1) {
      this.services.log.warn(`cannot play next multiple tracks`)
      await message.addReply(new RawReply('Cannot PlayNext multiple tracks.'))
      throw new Error('')
    }

    this.services.playerService.play(
      message,
      player,
      queryResult.tracks,
      'next'
    )

    this.services.log.debug(`query returned as: ${formatForLog(queryResult)}`)

    await message.addReply(queryResult.replies)
  },

  info: {
    name: CommandNames.Base.playNext,
    description: {
      long: 'Execute a Play command, queueing the track ahead of the passive queue, behind other tracks that have been Playnext-ed',
      short:
        'Play a track, queues at the front of the queue. (Behind other playnext tracks).',
    },
    args: [
      {
        type: 'string',
        name: 'query',
        description: {
          long: 'If a string is provided the argument is interpreted as a search query. First searching the Local Libraries, if no Local Track is found the query is then run against YouTube - taking the first result as the track to play.',
          short:
            'The track to search for and play|A YouTube video URL to play.',
        },
        required: true,
      },
    ],
    examples: {
      legacy: [
        '$go playnext twice tt',
        '$go playnext <youtube url>',
        '$go playnext <youtube playlist url>',
      ],
      slashCommand: [
        '/goplaynext twice tt',
        '/goplaynext <youtube url>',
        '/goplaynext <youtube playlist url>',
      ],
    },
    alias: '$playnext',
    requiredModules: {
      oneOf: [GolemModule.LocalMusic, GolemModule.Youtube],
    },
  },
})
