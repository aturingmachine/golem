import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { BasicError } from '../../errors/basic-error'
import { NoModuleError } from '../../errors/no-module-error'
import { NoPlayerError } from '../../errors/no-player-error'
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

  async handler({ message, source }): Promise<boolean> {
    this.services.log.setMessageContext(message, 'GoPlay')

    const query = source.getString('query')
    this.services.log.info(`executing play with query ${query}`)

    try {
      const player = await this.services.playerService.getOrCreate(message)

      if (!player) {
        this.services.log.warn(
          `unable to create player for guild: ${message.info.guild?.name} channel: ${message.info.voiceChannel?.name}`
        )

        throw new NoPlayerError({
          message: `unable to create player for guild: ${message.info.guild?.name} channel: ${message.info.voiceChannel?.name}`,
          sourceCmd: 'playnext',
        })
      }

      if (!query) {
        // If we are doing an "unpause" and nothing is playing
        // then we have errored...
        if (!player.isPlaying) {
          throw new NoPlayerError({
            sourceCmd: 'playnext',
            message:
              'Cannot execute. No search query to play, and no paused track to unpase.',
          })
        }

        player?.unpause()

        await message.addReply(new RawReply('Unpausing!'))

        return true
      }

      const queryResult = await this.services.queryService.process(
        message,
        query
      )

      // Handle a processed result that does not have a supported module
      if (!('tracks' in queryResult)) {
        if (queryResult.missingModule) {
          throw new NoModuleError({
            message: queryResult.message || 'Missing required modules to play.',
            sourceCmd: 'playnext',
            action: 'playnext',
            required: [queryResult.missingModule],
          })
        }

        throw new BasicError({
          code: 102,
          message: queryResult.message || 'Unable to process playnext request.',
          sourceCmd: 'playnext',
          requiresAdminAttention: true,
        })
      }

      if (queryResult.tracks.length > 1) {
        this.services.log.warn(`cannot play next multiple tracks`)
        await message.addReply(new RawReply('Cannot PlayNext multiple tracks.'))
        return false
      }

      this.services.playerService.play(
        message,
        player,
        queryResult.tracks,
        'queue'
      )

      this.services.log.debug(`query returned as: ${formatForLog(queryResult)}`)

      await message.addReply(queryResult.replies)

      return true
    } catch (error) {
      return false
    }
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
