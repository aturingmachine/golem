import { GolemMessage } from '../messages/message-wrapper'
import { Commands } from './register-commands'

export async function CommandRunner(message: GolemMessage): Promise<void> {
  console.log(`Command runner running with message ${message.toDebug()}`)
  const command = Commands.get(message.parsed.command)

  console.log(`Command runner using command ${command?.info.name}`)

  try {
    await command?.execute(message)
  } catch (error) {
    console.error(error)
    await message.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    })
  }
}
