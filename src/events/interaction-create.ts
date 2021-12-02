import { CommandRunner } from '../commands/runner'
import { buttonHandler } from '../handlers/button-handler'
import { GolemMessage } from '../messages/message-wrapper'
import { GolemLogger, LogSources } from '../utils/logger'
import { EventHandler } from '.'

const log = GolemLogger.child({ src: LogSources.InteractionCreate })

const interactionCreate: EventHandler<'interactionCreate'> = {
  on: 'interactionCreate',
  async execute(interaction) {
    log.silly(`Received interaction ${JSON.stringify(interaction.toJSON())}`)

    if (interaction.isCommand()) {
      log.debug('Interaction is command')
      await CommandRunner(new GolemMessage(interaction))
    }

    // if (interaction.isMessageComponent()) {
    //   log.debug('Interaction is message component interaction')
    //   await buttonHandler(interaction)
    // }
  },
}

export default interactionCreate
