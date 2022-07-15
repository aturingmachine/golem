import { Injectable } from '@nestjs/common'
import fuzzy from 'fuzzy'
import { GolemConf } from '../config'
// import { Golem } from '../golem'
import {
  SimilarArtistMatch,
  SimilarTrackMatch,
} from '../integrations/lastfm/models'
import { LocalListing } from '../listing/listing'
import { ListingLoader } from '../listing/listing-loaders'
import { LogContexts } from '../logger/constants'
import { GolemLogger } from '../logger/logger.service'
import { ArrayUtils } from '../utils/list-utils'
import { SearchSchemes } from './search-schemes'

export enum ResultType {
  Wide = 'wide',
  Artist = 'artist',
  Track = 'track',
}

export interface SearchResult {
  listing: LocalListing
  type: ResultType
}

export class SearchResult {
  constructor(public listing: LocalListing, public type: ResultType) {}

  get isArtistQuery(): boolean {
    return this.type === ResultType.Artist
  }

  get isWideQuery(): boolean {
    return this.type === ResultType.Wide
  }
}

@Injectable()
export class ListingFinder {
  constructor(
    private config: GolemConf,
    private searchSchemes: SearchSchemes,
    private loader: ListingLoader,
    private logger: GolemLogger
  ) {
    this.logger.setContext(LogContexts.ListingFinder)
  }

  private _artistNames!: string[]

  private get artistNames(): string[] {
    if (!this._artistNames) {
      this._artistNames = this.loader.listings.map((l) =>
        l.artist.toLowerCase()
      )
    }

    return this._artistNames
  }

  search(query: string): SearchResult | undefined {
    this.logger.info(`searching for ${query}`)
    this.logger.verbose(
      `using titleSearch over ${this.loader.listings.length} listings`
    )

    const result = this.searchSchemes.cascading(query, this.loader.listings)

    const isArtistQuery = this.isArtistQuery(query, result)
    const isWideMatch = this.isWideMatch(result)

    this.logger.verbose(`${query}: ${result.length} Matches`)

    if (result.length) {
      this.logger.verbose(
        `Pre-weighting\nResult=${result[0].string};\nArtistQuery=${isArtistQuery};\nWideMatch=${isWideMatch}`
      )

      const final = this.weightResult(result).original
      const hasBeenWeighted = final.path !== result[0].original.path

      return new SearchResult(
        final,
        this.getResultType(isArtistQuery, isWideMatch && !hasBeenWeighted)
      )
    }

    this.logger.warn(`No Results found for ${query}`)
    return undefined
  }

  searchMany(query: string): LocalListing[] {
    const result = this.searchSchemes.cascading(query, this.loader.listings)

    return result.map((r) => r.original)
  }

  getSimilarArtists(
    similarMatches: SimilarArtistMatch[],
    takeArtists = 10,
    takeTracks = 5
  ): LocalListing[] {
    this.logger.info('get similar artists')
    const artistNames = similarMatches.map((m) => m.name.toLowerCase())

    const availableSimilarArtists = similarMatches.filter((similar) =>
      this.artistNames.includes(similar.name.toLowerCase())
    )

    return ArrayUtils.shuffleArray(availableSimilarArtists)
      .slice(0, takeArtists)
      .reduce((prev, curr) => {
        const res = this.searchSchemes.byArtistWithMb(
          curr.name,
          this.loader.listings
        )
        return prev.concat(
          res
            .map((r) => r.original)
            .filter((r) => artistNames.includes(r.artist.toLowerCase()))
            .slice(0, takeTracks)
        )
      }, [] as LocalListing[])
  }

  getSimilarTracks(
    similarMatches: SimilarTrackMatch[],
    takeTracks = 30
  ): LocalListing[] {
    this.logger.info('get similar tracks')
    return ArrayUtils.shuffleArray(
      similarMatches.reduce((prev, curr) => {
        const res = this.searchSchemes.byTitle(curr.name, this.loader.listings)
        return res[0] ? prev.concat(res[0].original) : prev
      }, [] as LocalListing[])
    ).slice(0, takeTracks)
  }

  artistSample(artist: string, count = 1): LocalListing[] {
    const res = []
    let listings = this.loader.listings.filter(
      (l) => l.artist.toLowerCase() === artist.toLowerCase() && l.album
    )

    const uniques = listings.filter(
      (l, index, self) =>
        self.map((x) => x.albumName).indexOf(l.albumName) === index
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
    const listing = this.loader.listings.find((l) => l.path === path)

    return {
      id: listing?.id || '',
      name: listing?.shortName || 'Not found',
    }
  }

  findListingsByIds<Q extends { id: string }>(params: Q[]): LocalListing[] {
    return params
      .map((param) => this.loader.listings.find((l) => l.id === param.id))
      .filter(ArrayUtils.isDefined)
  }

  get trackCount(): number {
    return this.loader.listings.length
  }

  private isArtistQuery(
    query: string,
    res: fuzzy.FilterResult<LocalListing>[]
  ): boolean {
    return [res[0], res[1], res[2], res[3]].filter(Boolean).some((r) => {
      const artist = r.original.artist.toLowerCase().trim()
      const q = query.toLowerCase().trim()
      return artist === query || artist.indexOf(q) === 0
    })
  }

  private isWideMatch(result: fuzzy.FilterResult<LocalListing>[]): boolean {
    return (
      result.length > 5 &&
      result.slice(1, 5).some((r) => result[0].score - r.score < 5)
    )
  }

  // Our library matches nicely but does not allow for key weighting, so we will do
  // it ourselves. Going to "add weight" to base tracks (non inst, live, jp version)
  // since those can be accessed by more exact queries, whereas we cannot work backwards.
  private weightResult(
    resultSet: fuzzy.FilterResult<LocalListing>[]
  ): fuzzy.FilterResult<LocalListing> {
    this.logger.verbose(
      `\n${resultSet
        .slice(0, 15)
        .map(
          (r) =>
            `${r.original.title} - ${r.original.albumName} scored ${r.score}`
        )
        .join('\n')}`
    )
    let pref: fuzzy.FilterResult<LocalListing> = resultSet[0]
    const startingScore = pref.score
    this.logger.verbose(`Weighting: Starting with ${pref.original.longName}`)

    if (this.matchesWeightedTerm(pref)) {
      this.logger.verbose(
        `Post-Weight: Pref flagged, searching for alternatives`
      )
      pref =
        resultSet
          .slice(0, 10)
          .filter((r) => Math.abs(startingScore - r.score) < 5)
          .find((result) => !this.matchesWeightedTerm(result)) || pref
    }

    this.logger.verbose(`Weighting: Checking near results for close calls`)
    const nextValid = resultSet
      .slice(0, 10)
      .filter(
        (r) =>
          Math.abs(startingScore - r.score) < 5 || r.score === startingScore
      )
      .filter((result) => !this.matchesWeightedTerm(result))

    // TODO oh no
    if (
      nextValid[0]?.score === nextValid[1]?.score ||
      nextValid[0]?.score === nextValid[2]?.score ||
      nextValid[0]?.score === nextValid[3]?.score ||
      nextValid[0]?.score - nextValid[1]?.score < 5 ||
      nextValid[0]?.score - nextValid[2]?.score < 5 ||
      nextValid[0]?.score - nextValid[3]?.score < 5
    ) {
      this.logger.debug(`some valid scores within 5 - weighting on album name`)
      pref =
        nextValid.find((result) => !this.matchesWeightedTerm(result, true)) ||
        pref
    }

    this.logger.verbose(`Returning ${pref.original.title}`)

    return pref
  }

  private matchesWeightedTerm(
    result: fuzzy.FilterResult<LocalListing>,
    checkAlbum = false
  ): boolean {
    this.logger.verbose(
      `Checking force weighting for ${result.original.title.toLowerCase()}`
    )

    return this.config.search.forceWeightTerms
      .map((s) => s.toLowerCase())
      .some((s) =>
        checkAlbum
          ? result.original.albumName.toLowerCase().includes(s)
          : result.original.title.toLowerCase().includes(s)
      )
  }

  private getResultType(isArtistQuery: boolean, isWide: boolean): ResultType {
    if (isArtistQuery) {
      return ResultType.Artist
    }
    if (isWide) {
      return ResultType.Wide
    }

    return ResultType.Track
  }
}
