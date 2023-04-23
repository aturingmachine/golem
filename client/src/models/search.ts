import type { LocalListing } from './listings'
import type { TrackType } from './players'

export type SearchResult = {
  string: string,
  score: number | null,
  index: number,
  original: LocalListing
}

export type MappedSearchResult = {
  string: string,
  score: number | null,
  index: number,
  original: string
}

export type TopResult = {
  listing: LocalListing
  type: TrackType
  rawResult: SearchResult
}

export type SearchResults = {
  results: {
    results: SearchResult[]
    top: TopResult
  }
}

export type MappedSearchResults = {
  results: {
    top: TopResult
    results: MappedSearchResult[]
  }
}
