import { buttonHandler } from '../handlers/button-handler'
import { commandHandler } from '../handlers/command-handler'
import { logger } from '../utils/logger'
import { EventHandler } from '~/models/event-handler'

const interactionCreate: EventHandler<'interactionCreate'> = {
  on: 'interactionCreate',
  async execute(interaction) {
    logger.debug(`Received interaction ${interaction}`)

    if (interaction.isCommand()) {
      await commandHandler(interaction)
    }

    if (interaction.isMessageComponent()) {
      await buttonHandler(interaction)
    }
  },
}

export default interactionCreate
