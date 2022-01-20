export const MockPlaylistMenu = {
  send: jest.fn(),
  getEmbed: jest.fn(),
  collectResponse: jest.fn(),
  handler: jest.fn(),
  offset: 0,
}

export type MockPlaylistMenu = typeof MockPlaylistMenu

jest.mock('../../src/playlist/playlist-menu', () => ({
  PlaylistMenu: jest.fn().mockImplementation(() => MockPlaylistMenu),
}))
