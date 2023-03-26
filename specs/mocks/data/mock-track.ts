import { LocalListing } from '../../../src/music/local/listings/listings'
import { LocalTrack } from '../../../src/music/tracks/local-track'
import { createMockLocalListing } from './mock-listing'

const defaultLocalTrackParams = () => ({
  listing: createMockLocalListing(),
  userId: '960828',
})

export function createMockLocalTrack(
  record?: Partial<{ listing: LocalListing; userId: string }>
): LocalTrack {
  const def = defaultLocalTrackParams()

  return new LocalTrack(
    record?.listing || def.listing,
    record?.userId || def.userId
  )
}
