import { ParsedCommand } from '../../src/messages/parsed-command'

export type MockedParsedCommand = {
  getString: jest.Mock
  getNumber: jest.Mock
  getBoolean: jest.Mock
  getUser: jest.Mock
  isSubCommand: jest.Mock
  getDefault: jest.Mock
  subCommand: string
  extendedArgs: Record<string, string | number | boolean | undefined>

  _mockedParams(params: Record<string, string | number | boolean>): void

  _cast(): ParsedCommand

  _reset(): void
}

export const MockParsedCommand = (): MockedParsedCommand => ({
  getString: jest.fn(),
  getNumber: jest.fn(),
  getBoolean: jest.fn(),
  getUser: jest.fn(),
  isSubCommand: jest.fn(),
  getDefault: jest.fn(),
  subCommand: '',
  extendedArgs: {},

  _mockedParams(params: Record<string, string | number | boolean>): void {
    this.getDefault.mockImplementation((key: string) => {
      return params[key]
    })
  },

  _cast(): ParsedCommand {
    return this as unknown as ParsedCommand
  },

  _reset(): void {
    this.getString.mockClear()
    this.getNumber.mockClear()
    this.getBoolean.mockClear()
    this.getUser.mockClear()
    this.isSubCommand.mockClear()
    this.getDefault.mockClear()

    this.subCommand = ''

    this.extendedArgs = {}
  },
})
