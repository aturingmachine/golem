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

  Permissions: {
    describe: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    add: jest.fn(),
    remove: jest.fn(),
  },
}
