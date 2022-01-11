export const MockHandlers = {
  Alias: {
    createAlias: jest.fn(),
    listAliases: jest.fn(),
    deleteAlias: jest.fn(),
  },
  Play: {
    process: jest.fn(),
  },
  GoGet: {
    it: jest.fn(),
  },

  _clearAll(): void {
    this.Alias.createAlias.mockClear()
    this.Alias.listAliases.mockClear()
    this.Alias.deleteAlias.mockClear()

    this.Play.process.mockClear()
  },
}

jest.mock('../../../src/handlers', () => ({
  __esModule: true,
  Handlers: MockHandlers,
}))
