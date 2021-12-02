import { GolemCommand } from '..'
import { GolemModule } from '../../config/models'
import { CommandNames } from '../../constants'
import { Handlers } from '../../handlers'
import { GolemMessage } from '../../messages/message-wrapper'
import { GolemLogger, LogSources } from '../../utils/logger'

const log = GolemLogger.child({ src: LogSources.GoPlay })

const execute = async (interaction: GolemMessage): Promise<void> => {
  log.debug(`executing`)
  await Handlers.Play.process(interaction, { playNext: false })
}

const goplay = new GolemCommand({
  logSource: LogSources.GoPlay,
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
    requiredModules: {
      oneOf: [GolemModule.Music, GolemModule.Youtube],
    },
    alias: 'play',
  },
})

export default goplay
