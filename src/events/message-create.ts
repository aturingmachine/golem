import { LegacyCommandHandler } from '../handlers/legacy-command-handler'
import { EventHandler } from '../models/event-handler'
import { GolemLogger, LogSources } from '../utils/logger'

const log = GolemLogger.child({ src: LogSources.MessageCreate })

const messageCreate: EventHandler<'messageCreate'> = {
  on: 'messageCreate',
  async execute(message) {
    if (message.member?.id === '884552685028790305') {
      return
    }

    log.debug(`received ${message}`)

    if (
      message.content.startsWith('$go') ||
      message.content.startsWith('$play')
    ) {
      await LegacyCommandHandler.parseMessage(message)
    }
  },
}

export default messageCreate
