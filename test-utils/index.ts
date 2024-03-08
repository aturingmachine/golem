import { ObjectID } from 'typeorm'
import { v4 as uid } from 'uuid'
import { GolemCommand } from '../src/commands'
import { MockedMessage } from './mocks/models/message'

export async function executeCommand(
  cmd: GolemCommand,
  msg: MockedMessage
): Promise<void> {
  return cmd.execute(msg._toWrapper())
}

export function MockObjectId(id?: string): ObjectID {
  return (id ? id : uid()) as unknown as ObjectID
}
