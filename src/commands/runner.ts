import { GolemMessage } from '../messages/message-wrapper'
import { StringFormat } from '../utils/string-utils'
import { Commands } from './register-commands'

export async function CommandRunner(message: GolemMessage): Promise<void> {
  const command = Commands.get(message.parsed.command)

  if (!command) {
    return
  }

  try {
    if (message.parsed.subCommand === '--help') {
      await message.reply({
        content: StringFormat.preformatted(command.toString()),
        ephemeral: true,
      })

      return
    }

    await command?.execute(message)
  } catch (error) {
    console.error(error)
    await message.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    })
  }
}
