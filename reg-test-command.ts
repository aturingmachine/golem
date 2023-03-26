import fs from 'fs'
import path from 'path'
import './specs/mocks/image-utils'
import { Collection } from 'discord.js'
import { GolemCommand } from './src/commands'

jest.mock('./src/commands/register-commands', () => {
  const mockCommands = new Collection()
  const implementationPath = path.resolve(
    __dirname,
    './src/commands/implementations'
  )

  const files = fs
    .readdirSync(implementationPath)
    .filter(
      (file) =>
        (file.endsWith('.js') || file.endsWith('.ts')) &&
        !file.includes('index') &&
        !file.includes('_wip')
    )

  const mockRegCommands: any = {}

  for (const file of files) {
    const command: GolemCommand<any> =
      /* eslint-disable-next-line @typescript-eslint/no-var-requires */
      require(`${implementationPath}/${file}`).default

    if (!command) {
      continue
    }
    mockCommands.set(command.info.name, command)
    mockRegCommands['go' + command.info.name] = command
  }

  return {
    __esModule: true,
    Commands: mockCommands,
    RegisteredCommands: mockRegCommands,
    GetCommand: jest.fn().mockImplementation((arg: string) => {
      return mockRegCommands[arg]
    }),
  }
})

process.on('unhandledRejection', (reason) => {
  console.error(reason)
})
