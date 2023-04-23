import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import fuzzy from 'fuzzy'
import { LoggerService } from '../../../core/logger/logger.service'
import { LocalListing } from '../listings/listings'

const extractors = {
  // full name
  base: {
    extract: (t: LocalListing) => t.searchString.toLowerCase(),
  },

  // full name
  baseReverse: {
    extract: (t: LocalListing) =>
      `${t.title} ${t.albumName} ${t.artist}`.toLowerCase(),
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
    extract: (t: LocalListing) => t.albumName.toLowerCase(),
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

@Injectable()
export class SearchSchemes {
  constructor(private config: ConfigService, private log: LoggerService) {
    this.log.setContext('SearchSchemes')
  }

  byTitle(
    query: string,
    tracks: LocalListing[]
  ): fuzzy.FilterResult<LocalListing>[] {
    return fuzzy.filter(query, tracks, extractors.title)
  }

  byArtist(
    query: string,
    tracks: LocalListing[]
  ): fuzzy.FilterResult<LocalListing>[] {
    return fuzzy.filter(query, tracks, extractors.artist)
  }

  byArtistWithMb(
    query: string,
    tracks: LocalListing[]
  ): fuzzy.FilterResult<LocalListing>[] {
    return fuzzy.filter(query, tracks, extractors.mbWithArtist)
  }

  byArtistTrack(
    query: string,
    tracks: LocalListing[]
  ): fuzzy.FilterResult<LocalListing>[] {
    return fuzzy.filter(query, tracks, extractors.shortName)
  }

  cascading(
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

    if (result.length === 0 || result[0].score < 50) {
      this.log.verbose(
        `base ${
          result.length ? 'scores: ' + result[0].score : 'miss'
        }; using baseReverse`
      )
      result = fuzzy.filter(query, tracks, extractors.baseReverse)
    }

    return result[0]?.score <
      (this.config.get<number>('search.minimum-score') || 35)
      ? []
      : result
  }

  composite(
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
