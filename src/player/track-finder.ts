import fuzzy from 'fuzzy'
import { Listing } from '../models/listing'
import { Track } from '../models/track'
import { isDefined } from '../utils/list-utils'
import { logger } from '../utils/logger'

const log = logger.child({ src: 'search' })

export interface SearchResult {
  listing: Listing
  isArtistQuery: boolean
  isWideMatch: boolean
}

const baseSearchOptions = {
  extract: (t: Track) => t.searchString,
}

export class TrackFinder {
  public readonly tracks: Track[]
  private static _listings: Listing[] = []

  constructor(tracks: Track[]) {
    this.tracks = tracks
  }

  static get listings(): Listing[] {
    return [...this._listings]
  }

  search(query: string): SearchResult | undefined {
    const result = fuzzy.filter(query, this.tracks, baseSearchOptions)
    const isArtistQuery = this.isArtistQuery(query, result)
    const isWideMatch = this.isWideMatch(result)

    log.debug(`${query}: ${result.length} Matches\n`)

    if (result.length) {
      log.debug(
        `Pre-weighting Result=${result[0].string};\nArtistQuery=${isArtistQuery};\nWideMatch=${isWideMatch}`
      )

      const final = new Listing(this.weightResult(result).original)
      const hasBeenWeighted = final.path !== result[0].original.path

      return {
        listing: final,
        isArtistQuery,
        isWideMatch: isWideMatch && !hasBeenWeighted,
      }
    }

    log.warn(`No Results found for ${query}`)

    return undefined
  }

  static searchMany(query: string): Listing[] {
    const result = fuzzy.filter(query, TrackFinder.listings, baseSearchOptions)

    return result.map((r) => new Listing(r.original))
  }

  static artistSample(artist: string, count = 1): Listing[] {
    const res = []
    const listings = TrackFinder._listings
      .filter(
        (l) => l.artist.toLowerCase() === artist.toLowerCase() && l.albumArt
      )
      .filter(
        (l, index, self) => self.map((x) => x.album).indexOf(l.album) === index
      )

    for (let i = 0; i < count; i++) {
      res.push(listings[Math.floor(Math.random() * listings.length)])
    }

    return res
  }

  static findIdByPath(path: string): { id: string; name: string } {
    const listing = TrackFinder.listings.find((l) => l.path === path)

    return {
      id: listing?.id || '',
      name: listing?.names.short.piped || 'Not found',
    }
  }

  static findListingsByIds(
    params: { id: string; [key: string]: any }[]
  ): Listing[] {
    return params
      .map((param) => TrackFinder.listings.find((l) => l.id === param.id))
      .filter(isDefined)
  }

  static get trackCount(): number {
    return TrackFinder._listings.length
  }

  private isArtistQuery(
    query: string,
    res: fuzzy.FilterResult<Track>[]
  ): boolean {
    return [res[0], res[1], res[2], res[3]].filter(Boolean).some((r) => {
      const artist = r.original.listing.artist.toLowerCase().trim()
      const q = query.toLowerCase().trim()
      return artist === query || artist.indexOf(q) === 0
    })
  }

  private isWideMatch(result: fuzzy.FilterResult<Track>[]): boolean {
    return (
      result.length > 5 &&
      result.slice(1, 5).some((r) => result[0].score - r.score < 5)
    )
  }

  // Our library matches nicely but does not allow for key weighting, so we will do
  // it ourselves. Going to "add weight" to base tracks (non inst, live, jp version)
  // since those can be accessed by more exact queries, whereas we cannot work backwards.
  private weightResult(
    resultSet: fuzzy.FilterResult<Track>[]
  ): fuzzy.FilterResult<Track> {
    log.debug(
      `${resultSet.map((r) => `${r.original.listing.track} scored ${r.score}`)}`
    )
    let pref = resultSet[0]
    const startingScore = pref.score
    log.debug(`Post-Weight: Starting with ${pref.original.listing.name}`)

    if (this.isLiveOrInst(pref)) {
      log.debug(`Post-Weight: Pref flagged, searching for alternatives`)
      pref =
        resultSet
          .slice(0, 10)
          .filter((r) => Math.abs(startingScore - r.score) < 5)
          .find((result) => !this.isLiveOrInst(result)) || pref
    }

    log.debug(`Returning ${pref.original.listing.track}`)

    return pref
  }

  private isLiveOrInst(result: fuzzy.FilterResult<Track>): boolean {
    log.debug(
      `Checking inst for ${result.original.listing.track.toLowerCase()}`
    )

    return [
      'instrumental',
      'inst.',
      'live',
      'tour',
      'jp',
      'eng.',
      'english',
    ].some((s) => result.original.listing.track.toLowerCase().includes(s))
  }
}
