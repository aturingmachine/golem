import axios, { AxiosInstance } from 'axios'
import { Listing } from '../models/listing'
import { GolemConf } from '../utils/config'
import { GolemLogger, LogSources } from '../utils/logger'
import {
  SimilarArtistMatch,
  SimilarArtistMatchRecord,
  SimilarTrackMatch,
  SimilarTrackMatchRecord,
} from './models'

export class LastFm {
  private static log = GolemLogger.child({ src: LogSources.LastFm })
  // http://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=cher&api_key=YOUR_API_KEY&format=json
  private static http: AxiosInstance

  static init(): void {
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
