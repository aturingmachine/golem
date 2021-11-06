import { CommandInteraction } from 'discord.js'
import { Commands } from '../commands'
import { GolemLogger, LogSources } from '../utils/logger'

const log = GolemLogger.child({ src: LogSources.CommandInteractionHandler })

export const commandHandler = async (
  interaction: CommandInteraction
): Promise<void> => {
  log.verbose(`Handling command for ${interaction.commandName}`)
  const command = Commands.get(interaction.commandName)

  if (!command) {
    log.verbose(`no command found for ${interaction.commandName}`)
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
