import axios, { AxiosInstance } from 'axios'
import { GolemConf } from '../../config'
import { Listing } from '../../listing/listing'
import { GolemLogger, LogSources } from '../../utils/logger'
import {
  SimilarArtistMatch,
  SimilarArtistMatchRecord,
  SimilarTrackMatch,
  SimilarTrackMatchRecord,
} from './models'

export class LastFm {
  private static log = GolemLogger.child({ src: LogSources.LastFm })
  private static http: AxiosInstance

  static init(): void {
    if (!GolemConf.modules.LastFm) {
      this.log.warn(
        `Cannot init LastFM, missing required module: ${GolemConf.modules.LastFm}`
      )
      return
    }

    LastFm.http = axios.create({
      baseURL: 'http://ws.audioscrobbler.com/2.0',
      params: {
        api_key: GolemConf.lastfm.apiKey,
        format: 'json',
      },
    })
  }

  static async getSimilarArtists(
    listing: Listing
  ): Promise<SimilarArtistMatch[]> {
    LastFm.log.info(
      `fetching similar tracks for ${listing.artist} - ${listing.title} by ARTIST`
    )

    const response = await LastFm.http.get<SimilarArtistMatchRecord>('', {
      params: {
        method: 'artist.getsimilar',
        artist: listing.artist,
        // mbid: listing.mb.artistId
        //   ? encodeURIComponent(listing.mb.artistId)
        //   : undefined,
      },
    })

    return response.data.similarartists.artist
  }

  static async getSimilarTracks(
    listing: Listing
  ): Promise<SimilarTrackMatch[]> {
    LastFm.log.info(
      `fetching similar tracks for ${listing.artist} - ${listing.title} by TRACK`
    )
    const response = await LastFm.http.get<SimilarTrackMatchRecord>('', {
      params: {
        method: 'track.getsimilar',
        artist: listing.artist,
        track: listing.title,
        // mbid: listing.mb.trackId,
        limit: 200,
      },
    })

    return response.data.similartracks.track
  }
}
