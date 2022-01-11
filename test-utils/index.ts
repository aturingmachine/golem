import { GolemCommand } from '../src/commands'
import { MockedMessage } from './mocks/message'

export async function executeCommand(
  cmd: GolemCommand,
  msg: MockedMessage
): Promise<void> {
  await cmd.execute(msg._toWrapper())
}
