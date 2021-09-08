import { CommandInteraction } from 'discord.js'
import { Commands } from '../commands'

export const commandHandler = async (
  interaction: CommandInteraction
): Promise<void> => {
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
}
