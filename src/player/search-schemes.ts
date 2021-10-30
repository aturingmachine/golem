import fuzzy from 'fuzzy'
import { Listing } from '../models/listing'
import { GolemConf } from '../utils/config'
import { GolemLogger, LogSources } from '../utils/logger'

const extractors = {
  // full name
  base: {
    extract: (t: Listing) => t.searchString.toLowerCase(),
  },

  // title only
  title: {
    extract: (t: Listing) => t.title.toLowerCase(),
  },

  // artist only
  artist: {
    extract: (t: Listing) => t.artist.toLowerCase(),
  },

  mbWithArtist: {
    extract: (t: Listing) => `${t.artist.toLowerCase()} ${t.mb.artistId}`,
  },

  // album only
  album: {
    extract: (t: Listing) => t.album.toLowerCase(),
  },

  // artist - title
  shortName: {
    extract: (t: Listing) => t.shortNameSearchString.toLowerCase(),
  },
}

export class SearchSchemes {
  private static log = GolemLogger.child({ src: LogSources.SearchSchemes })

  static byTitle(
    query: string,
    tracks: Listing[]
  ): fuzzy.FilterResult<Listing>[] {
    return fuzzy.filter(query, tracks, extractors.title)
  }

  static byArtist(
    query: string,
    tracks: Listing[]
  ): fuzzy.FilterResult<Listing>[] {
    return fuzzy.filter(query, tracks, extractors.artist)
  }

  static byArtistWithMb(
    query: string,
    tracks: Listing[]
  ): fuzzy.FilterResult<Listing>[] {
    return fuzzy.filter(query, tracks, extractors.mbWithArtist)
  }

  static byArtistTrack(
    query: string,
    tracks: Listing[]
  ): fuzzy.FilterResult<Listing>[] {
    return fuzzy.filter(query, tracks, extractors.shortName)
  }

  static cascading(
    query: string,
    tracks: Listing[]
  ): fuzzy.FilterResult<Listing>[] {
    let result = fuzzy.filter(query, tracks, extractors.artist)

    if (result.length === 0 || result[0].score < 1000) {
      this.log.debug(
        `artist ${
          result.length ? 'scores: ' + result[0].score : 'miss'
        }; using titleSearch`
      )
      result = fuzzy.filter(query, tracks, extractors.title)
    }

    if (result.length === 0 || result[0].score < 50) {
      this.log.debug(
        `titleSearch ${
          result.length ? 'scores: ' + result[0].score : 'miss'
        }; using shortNameSearch`
      )
      result = fuzzy.filter(query, tracks, extractors.shortName)
    }

    if (result.length === 0 || result[0].score < 50) {
      this.log.debug(
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
    tracks: Listing[]
  ): fuzzy.FilterResult<Listing>[] {
    const searchPatterns = [
      extractors.title,
      extractors.artist,
      extractors.album,
      extractors.shortName,
      extractors.base,
    ]

    const rawComposite = searchPatterns.reduce((prev, curr) => {
      return prev.concat(fuzzy.filter(query, tracks, curr))
    }, [] as fuzzy.FilterResult<Listing>[])

    return Array.from(new Set(rawComposite)).sort((l, r) => r.score - l.score)
  }
}
