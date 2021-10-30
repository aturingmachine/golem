import { LegacyCommandHandler } from '../handlers/legacy-command-handler'
import { CustomAlias } from '../models/custom-alias'
import { EventHandler } from '../models/event-handler'
import { GolemLogger, LogSources } from '../utils/logger'
import { guildIdFrom } from '../utils/message-utils'

const log = GolemLogger.child({ src: LogSources.MessageCreate })

const messageCreate: EventHandler<'messageCreate'> = {
  on: 'messageCreate',
  async execute(message) {
    if (message.member?.id === '884552685028790305') {
      return
    }

    log.silly(`received: ${message}`)

    if (message.content.startsWith('$go') || message.content.startsWith('$')) {
      const alias = await CustomAlias.getAliasFor(
        message.content,
        guildIdFrom(message)
      )

      if (alias) {
        await alias.run(message)

        return
      }

      await LegacyCommandHandler.parseMessage(message)
    }
  },
}

export default messageCreate
