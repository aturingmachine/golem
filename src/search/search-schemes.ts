import fuzzy from 'fuzzy'
import { GolemConf } from '../config'
import { LocalListing } from '../listing/listing'
import { GolemLogger, LogSources } from '../utils/logger'

const extractors = {
  // full name
  base: {
    extract: (t: LocalListing) => t.searchString.toLowerCase(),
  },

  // title only
  title: {
    extract: (t: LocalListing) => t.title.toLowerCase(),
  },

  // artist only
  artist: {
    extract: (t: LocalListing) => t.artist.toLowerCase(),
  },

  mbWithArtist: {
    extract: (t: LocalListing) => `${t.artist.toLowerCase()} ${t.mb.artistId}`,
  },

  // album only
  album: {
    extract: (t: LocalListing) => t.album.toLowerCase(),
  },

  // artist - title
  shortName: {
    extract: (t: LocalListing) => t.shortNameSearchString.toLowerCase(),
  },

  // title - artist
  shortNameReverse: {
    extract: (t: LocalListing) => `${t.title} ${t.artist}`.toLowerCase(),
  },
}

export class SearchSchemes {
  private static log = GolemLogger.child({ src: LogSources.SearchSchemes })

  static byTitle(
    query: string,
    tracks: LocalListing[]
  ): fuzzy.FilterResult<LocalListing>[] {
    return fuzzy.filter(query, tracks, extractors.title)
  }

  static byArtist(
    query: string,
    tracks: LocalListing[]
  ): fuzzy.FilterResult<LocalListing>[] {
    return fuzzy.filter(query, tracks, extractors.artist)
  }

  static byArtistWithMb(
    query: string,
    tracks: LocalListing[]
  ): fuzzy.FilterResult<LocalListing>[] {
    return fuzzy.filter(query, tracks, extractors.mbWithArtist)
  }

  static byArtistTrack(
    query: string,
    tracks: LocalListing[]
  ): fuzzy.FilterResult<LocalListing>[] {
    return fuzzy.filter(query, tracks, extractors.shortName)
  }

  static cascading(
    query: string,
    tracks: LocalListing[]
  ): fuzzy.FilterResult<LocalListing>[] {
    let result = fuzzy.filter(query, tracks, extractors.artist)

    if (result.length === 0 || result[0].score < 1000) {
      this.log.verbose(
        `artist ${
          result.length ? 'scores: ' + result[0].score : 'miss'
        }; using titleSearch`
      )
      result = fuzzy.filter(query, tracks, extractors.title)
    }

    if (result.length === 0 || result[0].score < 50) {
      this.log.verbose(
        `titleSearch ${
          result.length ? 'scores: ' + result[0].score : 'miss'
        }; using shortNameSearch`
      )
      result = fuzzy.filter(query, tracks, extractors.shortName)
    }

    if (result.length === 0 || result[0].score < 50) {
      this.log.verbose(
        `titleSearch ${
          result.length ? 'scores: ' + result[0].score : 'miss'
        }; using shortNameReverseSearch`
      )
      result = fuzzy.filter(query, tracks, extractors.shortNameReverse)
    }

    if (result.length === 0 || result[0].score < 50) {
      this.log.verbose(
        `shortNameSearch ${
          result.length ? 'scores: ' + result[0].score : 'miss'
        }; using baseSearch`
      )
      result = fuzzy.filter(query, tracks, extractors.base)
    }

    return result[0]?.score > GolemConf.search.minimumScore ? result : []
  }

  static composite(
    query: string,
    tracks: LocalListing[]
  ): fuzzy.FilterResult<LocalListing>[] {
    const searchPatterns = [
      extractors.title,
      extractors.artist,
      extractors.album,
      extractors.shortName,
      extractors.base,
    ]

    const rawComposite = searchPatterns.reduce((prev, curr) => {
      return prev.concat(fuzzy.filter(query, tracks, curr))
    }, [] as fuzzy.FilterResult<LocalListing>[])

    return Array.from(new Set(rawComposite)).sort((l, r) => r.score - l.score)
  }
}
