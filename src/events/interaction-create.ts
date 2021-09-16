import { buttonHandler } from '../handlers/button-handler'
import { commandHandler } from '../handlers/command-handler'
import { GolemLogger, LogSources } from '../utils/logger'
import { EventHandler } from '~/models/event-handler'

const log = GolemLogger.child({ src: LogSources.InteractionCreate })

const interactionCreate: EventHandler<'interactionCreate'> = {
  on: 'interactionCreate',
  async execute(interaction) {
    log.debug(`Received interaction ${interaction}`)

    if (interaction.isCommand()) {
      await commandHandler(interaction)
    }

    if (interaction.isMessageComponent()) {
      await buttonHandler(interaction)
    }
  },
}

export default interactionCreate
