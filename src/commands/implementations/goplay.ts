import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { Errors } from '../../errors'
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
  logSource: 'GoPlay',
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
        sourceCmd: 'play',
      })
    }

    if (!query) {
      // If we are doing an "unpause" and nothing is playing
      // then we have errored...
      if (!player.isPlaying) {
        throw Errors.NoPlayer({
          sourceCmd: 'play',
          message:
            'Cannot execute. No search query to play, and no paused track to unpase.',
        })
      }

      player?.unpause()

      await message.addReply(new RawReply('Unpausing!'))

      return
    }

    const queryResult = await this.services.queryService.process(message, query)

    if (!('tracks' in queryResult)) {
      // Handle a processed result that does not have a supported module
      if (queryResult.missingModule) {
        throw Errors.NoModule({
          message: queryResult.message || 'Missing required modules to play.',
          sourceCmd: 'play',
          action: 'play',
          required: [queryResult.missingModule],
        })
      }

      throw Errors.Basic({
        code: 101,
        message: queryResult.message || 'Unable to process play request.',
        sourceCmd: 'play',
        requiresAdminAttention: true,
      })
    }

    this.services.playerService.play(
      message,
      player,
      queryResult.tracks,
      'queue'
    )

    this.services.log.debug(`query returned as: ${formatForLog(queryResult)}`)

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
