import { ModuleRef } from '@nestjs/core'
import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { GolemMessage } from '../../messages/golem-message'
import { RawReply } from '../../messages/replies/raw'

const execute = async (
  ref: ModuleRef,
  interaction: GolemMessage
): Promise<boolean> => {
  const log = await ref.resolve(LoggerService)
  log.setMessageContext(interaction, 'GoPlay')

  try {
    interaction._replies.add(new RawReply('This is a test reply.'))

    return true
  } catch (error) {
    return false
  }
}

const goplay = new GolemCommand({
  logSource: 'go-play',
  handler: execute,
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
    // requiredModules: {
    //   oneOf: [GolemModule.Music, GolemModule.Youtube],
    // },
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

export default goplay
