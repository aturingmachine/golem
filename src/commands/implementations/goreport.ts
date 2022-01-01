import { GolemCommand } from '..'
import { GolemConf } from '../../config'
import { CommandNames } from '../../constants'
import { BugReport } from '../../db/bug-report'
import { GolemMessage } from '../../messages/message-wrapper'
import { GolemLogger, LogSources } from '../../utils/logger'
import { Replier } from '../../utils/replies'

const log = GolemLogger.child({ src: LogSources.GoReport })

const execute = async (message: GolemMessage): Promise<void> => {
  log.info('executing')

  try {
    const newReport = BugReport.fromMessage(message)

    await newReport.save()
    log.debug(`new report created and saved`)

    await message.reply(
      `${Replier.affirmative}, I've recorded your bug report!`
    )
  } catch (error) {
    log.error(`couldnt record bug report - ${error}`)
    await message.reply(
      `${Replier.negative} - Ironically I had a problem recording that bug. Contact my keeper <@${GolemConf.discord.adminId}> if the issue is urgent.`
    )
  }
}

const goreport = new GolemCommand({
  logSource: LogSources.GoReport,
  handler: execute,
  info: {
    name: CommandNames.Base.report,
    description: {
      short: 'Report bugs you experience while using Golem',
    },
    args: [
      {
        type: 'string',
        name: 'content',
        description: {
          long: 'Describe the bug you experienced. Try to be specific with what occurred before the bug (for example - you may note that a YouTube Track was playing at the time), as well as what you expected to have happened. Any information can help resolve the underlying cause of the bug.',
          short:
            'What you were doing leading up to the bug & what you expected to happen.',
        },
        required: true,
        rest: true,
      },
    ],
    examples: {
      legacy: [
        '$go report Golem left the voice channel when I tried to queue a playlist while they were playing a local track',
      ],
      slashCommand: [
        '/goreport Golem left the voice channel when I tried to queue a playlist while they were playing a local track',
      ],
    },
  },
})

export default goreport
