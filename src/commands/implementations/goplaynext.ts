import { GolemCommand } from '..'
import { GolemModule } from '../../config/models'
import { CommandNames } from '../../constants'
import { Handlers } from '../../handlers'
import { GolemMessage } from '../../messages/message-wrapper'
import { GolemLogger, LogSources } from '../../utils/logger'

const log = GolemLogger.child({ src: LogSources.GoPlay })

const execute = async (interaction: GolemMessage): Promise<void> => {
  log.debug(`executing`)
  await Handlers.Play.process(interaction, { playNext: true })
}

const goplaynext = new GolemCommand({
  logSource: LogSources.GoPlayNext,
  handler: execute,
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
      oneOf: [GolemModule.Music, GolemModule.Youtube],
    },
  },
})

export default goplaynext
