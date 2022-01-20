import { GolemCommand } from '../src/commands'
import { MockedMessage } from './mocks/models/message'

export async function executeCommand(
  cmd: GolemCommand,
  msg: MockedMessage
): Promise<void> {
  return cmd.execute(msg._toWrapper())
}
