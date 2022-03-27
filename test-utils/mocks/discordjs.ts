import { MusicPlayerOptions } from '../../src/player/music-player'
import { MockedLocalListing, MockLocalListing } from './models/listing'
import { MockLocalTrack } from './models/track'

export type MockAudioResource = {
  started: true
  playbackDuration: 828
  read: jest.Mock
  metadata: {
    listing: MockedLocalListing
    track: MockLocalTrack
  }
}

export const MockAudioResource: jest.Mock<MockAudioResource> = jest
  .fn()
  .mockImplementation(() => ({
    started: true,
    playbackDuration: 828,
    read: jest.fn(),
    metadata: {
      listing: MockLocalListing(),
      track: MockLocalTrack(),
    },
  }))

export const MockAudioPlayer = {
  on: jest.fn(),
  pause: jest.fn(),
  unpause: jest.fn(),
  stop: jest.fn(),
  play: jest.fn(),
  state: {
    status: 'idle',
  },
}

export const MockVoiceConnection = {
  on: jest.fn(),
  subscribe: jest.fn(),
  destroy: jest.fn(),
  rejoin: jest.fn(),
  disconnect: jest.fn(),

  rejoinAttempts: 0,
  joinConfig: {},
  state: {
    status: 'idle',
  },
}

export const MockJoinOptions = {
  channelId: '828',
  guildId: 'clean',
  guildName: 'sesang',
  channelName: 'gugudan',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  adapterCreator: () => {},
} as unknown as MusicPlayerOptions

enum AudioPlayerStatus {
  Idle = 'idle',
  Buffering = 'buffering',
  Paused = 'paused',
  Playing = 'playing',
  AutoPaused = 'autopaused',
}

enum VoiceConnectionStatus {
  Signalling = 'signalling',
  Connecting = 'connecting',
  Ready = 'ready',
  Disconnected = 'disconnected',
  Destroyed = 'destroyed',
}

export const MockDiscordJS = {
  AudioResource: MockAudioResource,
  createAudioResource: jest.fn(() => MockAudioResource),
  AudioPlayer: MockAudioPlayer,
  createAudioPlayer: jest.fn().mockImplementation(() => MockAudioPlayer),
  VoiceConnection: MockVoiceConnection,
  joinVoiceChannel: jest.fn().mockImplementation(() => MockVoiceConnection),
  AudioPlayerStatus,
  VoiceConnectionStatus,
}

jest.mock('@discordjs/voice', () => MockDiscordJS)
