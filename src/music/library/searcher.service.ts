import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import fuzzy from 'fuzzy'
import { LoggerService } from '../../core/logger/logger.service'
import { LocalListing } from '../listings/listings'
import { ListingLoaderService } from './loader.service'
import { SearchSchemes } from './search-schemes'

export enum ResultType {
  Wide = 'wide',
  Artist = 'artist',
  Track = 'track',
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
export class ListingSearcher {
  constructor(
    private log: LoggerService,
    private listings: ListingLoaderService,
    private searchSchemes: SearchSchemes,
    private config: ConfigService
  ) {}

  search(query: string): SearchResult | undefined {
    const result = this.searchSchemes.cascading(query, this.listings.records)

    const isArtistQuery = this.isArtistQuery(query, result)
    const isWideMatch = this.isWideMatch(result)

    this.log.debug(`Query ${query} - ${result.length} results.`)

    if (result.length) {
      this.log.debug(
        `Pre-weighting - Result=${result[0].string}; ArtistQuery=${isArtistQuery}; WideMatch=${isWideMatch}`
      )

      const final = this.weightResult(result).original
      const hasBeenWeighted = final.path !== result[0].original.path

      return new SearchResult(
        final,
        this.getResultType(isArtistQuery, isWideMatch && !hasBeenWeighted)
      )
    }

    this.log.warn(`No Results found for ${query}`)
    return undefined
  }

  searchMany(query: string): LocalListing[] {
    const result = this.searchSchemes.cascading(query, this.listings.records)

    return result.map((r) => r.original)
  }

  private isWideMatch(result: fuzzy.FilterResult<LocalListing>[]): boolean {
    return (
      result.length > 5 &&
      result.slice(1, 5).some((r) => result[0].score - r.score < 5)
    )
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

  // Our library matches nicely but does not allow for key weighting, so we will do
  // it ourselves. Going to "add weight" to base tracks (non inst, live, jp version)
  // since those can be accessed by more exact queries, whereas we cannot work backwards.
  private weightResult(
    resultSet: fuzzy.FilterResult<LocalListing>[]
  ): fuzzy.FilterResult<LocalListing> {
    this.log.verbose(
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
    this.log.verbose(`Weighting: Starting with ${pref.original.longName}`)

    if (this.matchesWeightedTerm(pref)) {
      this.log.verbose(`Post-Weight: Pref flagged, searching for alternatives`)
      pref =
        resultSet
          .slice(0, 10)
          .filter((r) => Math.abs(startingScore - r.score) < 5)
          .find((result) => !this.matchesWeightedTerm(result)) || pref
    }

    this.log.verbose(`Weighting: Checking near results for close calls`)
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
      this.log.debug(`some valid scores within 5 - weighting on album name`)
      pref =
        nextValid.find((result) => !this.matchesWeightedTerm(result, true)) ||
        pref
    }

    this.log.verbose(`Returning ${pref.original.title}`)

    return pref
  }

  private matchesWeightedTerm(
    result: fuzzy.FilterResult<LocalListing>,
    checkAlbum = false
  ): boolean {
    this.log.verbose(
      `Checking force weighting for ${result.original.title.toLowerCase()}`
    )

    return this.config
      .get('search')
      .forceWeightTerms.map((s: string) => s.toLowerCase())
      .some((s: string) =>
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
