import { LegacyCommandHandler } from '../handlers/legacy-command-handler'
import { EventHandler } from '../models/event-handler'
import { GolemLogger, LogSources } from '../utils/logger'

const log = GolemLogger.child({ src: LogSources.MessageCreate })

const messageCreate: EventHandler<'messageCreate'> = {
  on: 'messageCreate',
  async execute(message) {
    log.debug(`received ${message}`)

    if (
      !message.content.startsWith('$go') ||
      message.member?.id === '884552685028790305' ||
      !message.content.startsWith('$play')
    ) {
      return
    }

    await LegacyCommandHandler.parseMessage(message)
  },
}

export default messageCreate
