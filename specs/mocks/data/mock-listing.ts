import { LocalListing } from '../../../src/music/local/listings/listings'
import { YoutubeListing } from '../../../src/music/youtube/youtube-listing'
import { createMockAlbum } from './mock-album'

const defaultLocalListingParams: () => ConstructorParameters<
  typeof LocalListing
>[0] = () => ({
  listingId: '828',
  artist: 'gugudan',
  albumName: 'Act 5. New Action',
  title: 'Pastel Sweater',
  duration: 828,
  hasDefaultDuration: false,
  path: '/some/path/to/gugudan/Act 5 New Action/Pastel Sweater.mp3',
  genres: ['kpop'],
  moods: ['sick_as_hell'],
  key: 'F# Major',
  mb: {
    artistId: '1',
    trackId: '2',
  },
  addedAt: Date.now(),
  albumArtist: 'gugudan',
  bpm: 126,
  id: '426',
})

export function createMockLocalListing(
  record?: Partial<ConstructorParameters<typeof LocalListing>[0]>
): LocalListing {
  const listing = new LocalListing({
    ...defaultLocalListingParams(),
    ...record,
  })

  const album = createMockAlbum()

  listing.album = album
  listing.albumId = album._id

  return listing
}

const defaultYTListingParams: () => ConstructorParameters<
  typeof YoutubeListing
>[0] = () => ({
  url: 'https://www.youtube.com/watch?v=x9797gIH13Y',
  author: 'gugudan',
  title: 'Pastel Sweater',
  duration: 266,
  artworkUrl:
    'https://i.ytimg.com/vi/x9797gIH13Y/hq720.jpg?sqp=-oaymwEcCOgCEMoBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLDuI-657Azd1C3NK3xN8yDuZfQsLg',
})

export function createMockYTListing(
  record?: Partial<ConstructorParameters<typeof YoutubeListing>[0]>
): YoutubeListing {
  return new YoutubeListing({
    ...defaultYTListingParams(),
    ...record,
  })
}
