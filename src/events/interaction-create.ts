import { Commands } from '..//commands'
import { EventHandler } from '~/models/event-handler'

const interactionCreate: EventHandler<'interactionCreate'> = {
  on: 'interactionCreate',
  async execute(interaction) {
    console.log(interaction)
    if (!interaction.isCommand()) {
      return
    }

    const command = Commands.get(interaction.commandName)

    if (!command) {
      return
    }

    try {
      await command.execute(interaction)
    } catch (error) {
      console.error(error)
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      })
    }
  },
}

export default interactionCreate
