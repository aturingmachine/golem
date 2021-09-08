import Fuse from 'fuse.js'
import { Config } from '../utils/config'
import { getAllFiles } from '../utils/filesystem'
import { logger } from '../utils/logger'

export interface SearchResult {
  listing: Listing
  isArtistQuery: boolean
  isWideMatch: boolean
}

interface Listing {
  artist: string
  album: string
  track: string
  path: string
}

const buildName = (l: Listing): string =>
  `${l.artist} - ${l.album} - ${l.track}`

const fuseOpts = {
  keys: [
    {
      name: 'artist',
      weight: 0.6,
    },
    {
      name: 'album',
      weight: 0.3,
    },
    {
      name: 'track',
      weight: 1.5,
    },
  ],
  includeScore: true,
  ignoreLocation: true,
  shouldSort: true,
  minMatchCharLength: 3,
}

export class TrackFinder {
  private static listings: Listing[] = []
  private static _search: Fuse<Listing>

  static loadLibrary(): void {
    const paths = getAllFiles(Config.libraryPath, [])
    TrackFinder.listings = paths.map((trackPath) => {
      const split = trackPath.replace(Config.libraryPath, '').split('/')
      const artist = split[1]
      const album = split[2]
      const track = split[3]

      return {
        artist,
        album,
        track,
        path: trackPath,
      }
    })

    TrackFinder._search = new Fuse<Listing>(TrackFinder.listings, fuseOpts)
  }

  static isArtistQuery(
    query: string,
    res: Fuse.FuseResult<Listing>[]
  ): boolean {
    return [res[0], res[1], res[2], res[3]]
      .filter(Boolean)
      .some((r) => r.item.artist.toLowerCase().includes(query.toLowerCase()))
  }

  static isWideMatch(
    query: string,
    result: Fuse.FuseResult<Listing>[]
  ): boolean {
    // if diffs are 0
    // if diff1 is < 0.001 maybe ?

    const picked = result[0]
    const second = result[1]
    const third = result[2]

    if (picked.score && second.score && third.score) {
      const diff1 = Math.abs(picked.score - second.score) * 1000

      return diff1 === 0 || diff1 < 0.1
    }
    return false
  }

  /**
   * Artist query > wide > pass query
   */

  static search(query: string): SearchResult {
    const result = TrackFinder._search.search(query)
    const isArtistQuery = TrackFinder.isArtistQuery(query, result)
    const isWideMatch = TrackFinder.isWideMatch(query, result)
    const diff1 = Math.abs(result[0].score || 0 - (result[1].score || 0)) * 1000

    logger.debug(
      `Query: ${query} -> {artistQuery: ${isArtistQuery}, wideMatch: ${isWideMatch}, diff: ${diff1}}`
    )

    if (false) {
      TrackFinder.debug(query, result, isArtistQuery, isWideMatch, diff1)
    }

    return {
      listing: result[0].item,
      isArtistQuery,
      isWideMatch,
    }
  }

  static debug(
    query: string,
    result: Fuse.FuseResult<Listing>[],
    isArtistQuery: boolean,
    isWideMatch: boolean,
    diff1: number
  ): void {
    const picked = result[0]
    const second = result[1]
    const third = result[2]

    const data = {
      picked: {
        value: buildName(picked.item),
        score: picked.score,
      },
      second: {
        value: buildName(second.item),
        score: second.score,
      },
      third: { value: buildName(third.item), score: third.score },
      diff1: { value: diff1 },
      isArtistQuery: { value: isArtistQuery },
      isWideMatch: { value: isWideMatch },
    }

    console.table(data)

    // fs.appendFileSync(
    //   './data-out.json',
    //   JSON.stringify(
    //     {
    //       query,
    //       isWideMatch,
    //       isArtistQuery,
    //       diff1,
    //       // data,
    //       // opts: {
    //       //   ...fuseOpts,
    //       // },
    //     },
    //     undefined,
    //     2
    //   ) + ',\n',
    //   { encoding: 'utf-8' }
    // )
  }
}
