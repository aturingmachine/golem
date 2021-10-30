import { Golem } from '../golem'
import { LastFm } from '../lastfm'
import { Listing } from '../models/listing'
import { GolemLogger, LogSources } from '../utils/logger'

export class MixMatcher {
  private static log = GolemLogger.child({ src: LogSources.Mixer })

  static async similarArtists(listing: Listing): Promise<Listing[]> {
    const similar = await LastFm.getSimilarArtists(listing)

    MixMatcher.log.verbose(`found ${similar.length} artists`)

    return Golem.trackFinder.getSimilarArtists(similar)
  }

  static async similarTracks(listing: Listing): Promise<Listing[]> {
    const similar = await LastFm.getSimilarTracks(listing)

    MixMatcher.log.verbose(`found ${similar.length} tracks`)

    return Golem.trackFinder.getSimilarTracks(similar)
  }
}
