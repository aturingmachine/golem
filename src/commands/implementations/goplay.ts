import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { Errors } from '../../errors'
import { RawReply } from '../../messages/replies/raw'
import { PlayQueryService } from '../../music/player/play-query.service'
import { PlayerService } from '../../music/player/player.service'
import { formatForLog } from '../../utils/debug-utils'
import { GolemModule } from '../../utils/raw-config'
import { isValidPlayer } from '../utils/player-error-handlers'

export default new GolemCommand({
  services: {
    log: LoggerService,
    playerService: PlayerService,
    queryService: PlayQueryService,
  },
  logSource: 'GoPlay',
  async handler({ message, source }) {
    this.services.log.setMessageContext(message, 'GoPlay')

    const query = source.getString('query')
    this.services.log.info(`executing play with query ${query}`)

    const player = await this.services.playerService.getOrCreate(message)

    // Handle potential Error Codes from the PlayerService
    if (
      !isValidPlayer(player, {
        logger: this.services.log,
        message,
        sourceCmd: 'play',
      })
    ) {
      return
    }

    // Handle Unpause
    if (!query) {
      // If we are doing an "unpause" and nothing is playing
      // then we have errored...
      if (!player.isPlaying) {
        throw Errors.NoPlayer({
          sourceCmd: 'play',
          message:
            'Cannot execute. No search query to play, and no paused track to unpase.',
          traceId: message.traceId,
        })
      }

      player?.unpause()

      await message.addReply(new RawReply('Unpausing!'))

      return
    }

    // Execute the Query
    const queryResult = await this.services.queryService.process(
      message,
      query,
      source.extendedArgs
    )
    this.services.log.debug(`query returned as: ${formatForLog(queryResult)}`)

    if (!('tracks' in queryResult)) {
      // Handle a processed result that does not have a supported module
      if (queryResult.missingModule) {
        throw Errors.NoModule({
          message: queryResult.message || 'Missing required modules to play.',
          sourceCmd: 'play',
          action: 'play',
          required: [queryResult.missingModule],
          traceId: message.traceId,
        })
      }

      // Throw a slightly more generic error otherwise
      throw Errors.Basic({
        code: 101,
        message: queryResult.message || 'Unable to process play request.',
        sourceCmd: 'play',
        requiresAdminAttention: true,
        traceId: message.traceId,
      })
    }

    // Handle Single Track Result or URL based play.
    if (queryResult.raw.local?.isTrackQuery || !queryResult.raw.local) {
      this.services.playerService.play(
        message,
        player,
        queryResult.tracks,
        'queue',
        source.extendedArgs['no-cache'] === 'true'
      )
    }

    await message.addReply(queryResult.replies)
  },

  info: {
    name: CommandNames.Base.play,
    description: {
      long: 'Play a Local Track retrieved via searching for the provided query, a YouTube track retrievied via YouTube search if the Local Track search misses; A YouTube Track from a provided absolute url; A YouTube playlist from a provided absolute YouTube Playlist URL.',
      short:
        'Search for and play a track. Will search youtube if query returns no local results.',
    },
    args: [
      {
        type: 'string',
        name: 'query',
        description: {
          long: 'If a string is provided the argument is interpreted as a search query. First searching the Local Libraries, if no Local Track is found the query is then run against YouTube - taking the first result as the track to play. If a Youtube link is provided it will be played - if the link is a playlist it will have the first 20 tracks shuffled and queued. This number can be modified using the extended argument `limit=20`.',
          short:
            'The track to search for and play|A YouTube video/playlist URL to play.',
        },
        required: true,
      },
    ],
    examples: {
      legacy: [
        '$go play twice tt',
        '$go play <youtube url>',
        '$go play <youtube playlist url>',
      ],
      slashCommand: [
        '/goplay twice tt',
        '/goplay <youtube url>',
        '/goplay <youtube playlist url>',
      ],
    },
    requiredModules: {
      oneOf: [GolemModule.LocalMusic, GolemModule.Youtube],
    },
    alias: 'play',
    extendedArgs: [
      {
        key: 'no-cache',
        type: 'boolean',
        description:
          'Opt to not use a cached version of a streamed track. Will also delete any existing cached version.',
      },
      {
        key: 'limit',
        type: 'number',
        description:
          'Requires a YouTube playlist - Override the default fetch limit of 20',
      },
      {
        key: 'shuffle',
        type: 'boolean',
        description:
          'Requires a YouTube playlist - Shuffle the tracks pulled from the YouTube playlist',
      },
    ],
  },
})
