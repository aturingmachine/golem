import fuzzy from 'fuzzy'
import { Track } from '../models/track'
import { GolemLogger } from '../utils/logger'

const extractors = {
  // full name
  base: {
    extract: (t: Track) => t.searchString.toLowerCase(),
  },

  // title only
  title: {
    extract: (t: Track) => t.listing.title.toLowerCase(),
  },

  // artist only
  artist: {
    extract: (t: Track) => t.listing.artist.toLowerCase(),
  },

  // album only
  album: {
    extract: (t: Track) => t.listing.album.toLowerCase(),
  },

  // artist - title
  shortName: {
    extract: (t: Track) => t.shortNameSearchString.toLowerCase(),
  },
}

export class SearchSchemes {
  private static log = GolemLogger.child({ src: 'search-schemes' })

  static cascading(
    query: string,
    tracks: Track[]
  ): fuzzy.FilterResult<Track>[] {
    let result = fuzzy.filter(query, tracks, extractors.title)

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

    return result
  }

  static composite(
    query: string,
    tracks: Track[]
  ): fuzzy.FilterResult<Track>[] {
    const searchPatterns = [
      extractors.title,
      extractors.artist,
      extractors.album,
      extractors.shortName,
      extractors.base,
    ]

    const rawComposite = searchPatterns.reduce((prev, curr) => {
      return prev.concat(fuzzy.filter(query, tracks, curr))
    }, [] as fuzzy.FilterResult<Track>[])

    return rawComposite.sort((l, r) => r.score - l.score)
  }
}
