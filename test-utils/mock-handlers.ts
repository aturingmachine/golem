export const MockHandlers = {
  Alias: {},
  Play: {
    process: jest.fn(),
  },
  GoGet: {},
}

jest.mock('../src/handlers', () => ({
  __esModule: true,
  Handlers: MockHandlers,
}))
