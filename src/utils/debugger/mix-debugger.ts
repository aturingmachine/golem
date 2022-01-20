import { Golem } from '../../golem'
import { LocalListing } from '../../listing/listing'
import { MixMatcher } from '../../player/mixing/mix-matcher'

export class MixDebugger {
  static async debug(cmd: string): Promise<void> {
    const queryString = cmd.split(' ').slice(0, 2).join(' ')
    const mixType = cmd.split(' ')[1]
    const search = Golem.trackFinder.search(queryString)

    console.log('query found', search?.listing.shortName)

    if (search) {
      try {
        switch (mixType) {
          case 'track':
          case 't':
            MixDebugger.track(search.listing)
            break
          default:
          case 'artist':
          case 'a':
            MixDebugger.artist(search.listing)
            break
        }
      } catch (error) {
        console.error(error)
      }
    } else {
      console.log('No listings found for', queryString)
    }
  }

  private static async artist(listing: LocalListing): Promise<void> {
    try {
      const similar = await MixMatcher.similarArtists(listing)
      similar.map((s) => s.shortName)
    } catch (error) {
      console.error(error)
    }
  }

  private static async track(listing: LocalListing): Promise<void> {
    try {
      const similar = await MixMatcher.similarTracks(listing)
      similar.map((s) => s.shortName)
    } catch (error) {
      console.error(error)
    }
  }
}
