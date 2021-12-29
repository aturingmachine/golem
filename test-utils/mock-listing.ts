import { AudioResource } from '@discordjs/voice'
import { ListingInfo, LocalListing } from '../src/listing/listing'
import { TrackAudioResourceMetadata } from '../src/tracks'
import { LocalTrack } from '../src/tracks/track'
import { createLocalAlbum } from './mock-album'

const defaultListingInfo: ListingInfo = {
  listingId: '828',
  artist: 'gugudan',
  albumName: 'Act 5. New Action',
  title: 'Pastel Sweater',
  duration: 180,
  hasDefaultDuration: false,
  path: '/some/path',
  genres: [],
  moods: [],
  key: '',
  mb: {},
  addedAt: 1,
  album: createLocalAlbum(),
}

export function createLocalListing(
  record?: Partial<ListingInfo>
): LocalListing {
  const info = {
    ...defaultListingInfo,
    ...record,
  }

  return new LocalListing(info)
}

type GolemTrackAudioResource = AudioResource & {
  metadata: TrackAudioResourceMetadata
}

export function createAudioResource(): GolemTrackAudioResource {
  return {
    edges: [],
    ended: false,
    metadata: {
      listing: createLocalListing(),
      track: new LocalTrack(createLocalListing(), '828'),
      ...createLocalListing(),
    },
    started: true,
    playbackDuration: 180,
    silencePaddingFrames: {},
    silenceRemaining: {},
    playStream: {},
    readable: true,
    read: jest.fn(),
  } as unknown as GolemTrackAudioResource
}
