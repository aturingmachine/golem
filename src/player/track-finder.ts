import fuzzy from 'fuzzy'
import { SimilarArtistMatch, SimilarTrackMatch } from '../lastfm/models'
import { Listing } from '../models/listing'
import { isDefined, shuffleArray } from '../utils/list-utils'
import { GolemLogger, LogSources } from '../utils/logger'
import { SearchSchemes } from './search-schemes'

const log = GolemLogger.child({ src: LogSources.Search })

export interface SearchResult {
  listing: Listing
  isArtistQuery: boolean
  isWideMatch: boolean
}

export class TrackFinder {
  public readonly listings: Listing[]

  private _artistNames!: string[]

  constructor(listings: Listing[]) {
    log.info('instantiating track finder', listings)
    this.listings = listings
  }

  private get artistNames(): string[] {
    if (!this._artistNames) {
      this._artistNames = this.listings.map((l) => l.artist.toLowerCase())
    }

    return this._artistNames
  }

  search(query: string): SearchResult | undefined {
    log.info(`searching for ${query}`)
    log.debug(`using titleSearch`)

    const result = SearchSchemes.cascading(query, this.listings)

    const isArtistQuery = this.isArtistQuery(query, result)
    const isWideMatch = this.isWideMatch(result)

    log.debug(`${query}: ${result.length} Matches`)

    if (result.length) {
      log.debug(
        `Pre-weighting\nResult=${result[0].string};\nArtistQuery=${isArtistQuery};\nWideMatch=${isWideMatch}`
      )

      const final = this.weightResult(result).original
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

  searchMany(query: string): Listing[] {
    const result = SearchSchemes.cascading(query, this.listings)

    return result.map((r) => r.original)
  }

  getSimilarArtists(
    similarMatches: SimilarArtistMatch[],
    takeArtists = 10,
    takeTracks = 5
  ): Listing[] {
    log.info('get similar artists')
    const artistNames = similarMatches.map((m) => m.name.toLowerCase())

    const availableSimilarArtists = similarMatches.filter((similar) =>
      this.artistNames.includes(similar.name.toLowerCase())
    )

    console.log(`${availableSimilarArtists.length} available similar artists`)
    console.log(availableSimilarArtists.map((x) => x.name).join('\n'))

    return shuffleArray(availableSimilarArtists)
      .slice(0, takeArtists)
      .reduce((prev, curr) => {
        const res = SearchSchemes.byArtistWithMb(curr.name, this.listings)
        return prev.concat(
          res
            .map((r) => r.original)
            .filter((r) => artistNames.includes(r.artist.toLowerCase()))
            .slice(0, takeTracks)
        )
      }, [] as Listing[])
  }

  getSimilarTracks(
    similarMatches: SimilarTrackMatch[],
    takeTracks = 30
  ): Listing[] {
    log.info('get similar tracks')
    return shuffleArray(
      similarMatches.reduce((prev, curr) => {
        const res = SearchSchemes.byTitle(curr.name, this.listings)
        return res[0] ? prev.concat(res[0].original) : prev
      }, [] as Listing[])
    ).slice(0, takeTracks)
  }

  artistSample(artist: string, count = 1): Listing[] {
    const res = []
    let listings = this.listings.filter(
      (l) => l.artist.toLowerCase() === artist.toLowerCase() && l.albumArt
    )

    const uniques = listings.filter(
      (l, index, self) => self.map((x) => x.album).indexOf(l.album) === index
    )

    if (count < uniques.length) {
      listings = uniques
    }

    for (let i = 0; i < count; i++) {
      res.push(listings[Math.floor(Math.random() * listings.length)])
    }

    return res
  }

  findIdByPath(path: string): { id: string; name: string } {
    const listing = this.listings.find((l) => l.path === path)

    return {
      id: listing?.id || '',
      name: listing?.shortName || 'Not found',
    }
  }

  findListingsByIds(params: { id: string; [key: string]: any }[]): Listing[] {
    return params
      .map((param) => this.listings.find((l) => l.id === param.id))
      .filter(isDefined)
  }

  get trackCount(): number {
    return this.listings.length
  }

  private isArtistQuery(
    query: string,
    res: fuzzy.FilterResult<Listing>[]
  ): boolean {
    return [res[0], res[1], res[2], res[3]].filter(Boolean).some((r) => {
      const artist = r.original.artist.toLowerCase().trim()
      const q = query.toLowerCase().trim()
      return artist === query || artist.indexOf(q) === 0
    })
  }

  private isWideMatch(result: fuzzy.FilterResult<Listing>[]): boolean {
    return (
      result.length > 5 &&
      result.slice(1, 5).some((r) => result[0].score - r.score < 5)
    )
  }

  // Our library matches nicely but does not allow for key weighting, so we will do
  // it ourselves. Going to "add weight" to base tracks (non inst, live, jp version)
  // since those can be accessed by more exact queries, whereas we cannot work backwards.
  private weightResult(
    resultSet: fuzzy.FilterResult<Listing>[]
  ): fuzzy.FilterResult<Listing> {
    log.debug(
      `\n${resultSet
        .slice(0, 15)
        .map((r) => `${r.original.title} scored ${r.score}`)
        .join('\n')}`
    )
    let pref = resultSet[0]
    const startingScore = pref.score
    log.debug(`Post-Weight: Starting with ${pref.original.longName}`)

    if (this.isLiveOrInst(pref)) {
      log.debug(`Post-Weight: Pref flagged, searching for alternatives`)
      pref =
        resultSet
          .slice(0, 10)
          .filter((r) => Math.abs(startingScore - r.score) < 5)
          .find((result) => !this.isLiveOrInst(result)) || pref
    }

    log.debug(`Returning ${pref.original.title}`)

    return pref
  }

  private isLiveOrInst(result: fuzzy.FilterResult<Listing>): boolean {
    log.debug(
      `Checking force weighting for ${result.original.title.toLowerCase()}`
    )

    return [
      'instrumental',
      'inst.',
      'live',
      'tour',
      'jp',
      'eng.',
      'english',
      'remix',
    ].some((s) => result.original.title.toLowerCase().includes(s))
  }
}
