import { ParsedCommand } from '../../src/messages/parsed-command'

export type MockedParsedCommand = {
  getString: jest.Mock
  getNumber: jest.Mock
  getBoolean: jest.Mock
  getUser: jest.Mock
  isSubCommand: jest.Mock
  getDefault: jest.Mock

  _mockedParams(params: Record<string, string | number | boolean>): void

  _cast(): ParsedCommand
}

export const MockParsedCommand = (): MockedParsedCommand => ({
  getString: jest.fn(),
  getNumber: jest.fn(),
  getBoolean: jest.fn(),
  getUser: jest.fn(),
  isSubCommand: jest.fn(),
  getDefault: jest.fn(),

  _mockedParams(params: Record<string, string | number | boolean>): void {
    this.getDefault.mockImplementation((key: string) => {
      return params[key]
    })
  },

  _cast(): ParsedCommand {
    return this as unknown as ParsedCommand
  },
})
