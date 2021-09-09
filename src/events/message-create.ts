import { LegacyCommandHandler } from '../handlers/legacy-command-handler'
import { EventHandler } from '../models/event-handler'

const messageCreate: EventHandler<'messageCreate'> = {
  on: 'messageCreate',
  async execute(message) {
    if (
      !message.content.startsWith('$go') ||
      message.member?.id === '884552685028790305'
    ) {
      return
    }

    await LegacyCommandHandler.parseMessage(message)
  },
}

export default messageCreate

// TODO move this into interactionCreated handler, only thing I can think of
