import fs from 'fs'
import Fuse from 'fuse.js'
import * as mm from 'music-metadata'
import { LibIndex } from '../models/db/lib-index'
import { ListingSchema } from '../models/db/listing'
import { Listing } from '../models/listing'
import { Config, opts } from '../utils/config'
import { getAllFiles } from '../utils/filesystem'
import { logger } from '../utils/logger'

export interface SearchResult {
  listing: Listing
  isArtistQuery: boolean
  isWideMatch: boolean
}

const fuseOpts: Fuse.IFuseOptions<Listing> = {
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
  minMatchCharLength: 4,
  includeMatches: true,
  threshold: 0.1,
}

const reg = /.*\.(png|html|pdf|db|jpg|jpeg|xml|js|css)$/

export class TrackFinder {
  private static _listings: Listing[] = []
  private static _search: Fuse<Listing>

  static get listings(): Listing[] {
    return [...this._listings]
  }

  static async loadLibrary(): Promise<void> {
    if (opts.bustCache) {
      await TrackFinder.loadTracksFromDisk()
    } else {
      await TrackFinder.loadTracksFromDB()
    }

    TrackFinder._search = new Fuse<Listing>(TrackFinder._listings, fuseOpts)
  }

  static isArtistQuery(
    query: string,
    res: Fuse.FuseResult<Listing>[]
  ): boolean {
    return [res[0], res[1], res[2], res[3]].filter(Boolean).some((r) => {
      const artist = r.item.artist.toLowerCase().trim()
      const q = query.toLowerCase().trim()
      return artist === query || artist.indexOf(q) === 0
    })
  }

  static isWideMatch(result: Fuse.FuseResult<Listing>[]): boolean {
    const picked = result[0]
    const second = result[1]

    if (picked?.score && second?.score) {
      const diff1 = Math.abs(picked.score - second.score) * 1000

      return diff1 === 0 || diff1 < 0.1
    }
    return false
  }

  /**
   * TODO
   *
   * currently this does not search on each key, but
   * on all keys. For example searching for:
   * "twicecoaster lane 2 TT" returns "MAMAMOO - Better than i thought"
   *
   * Which it shouldnt.
   */
  static search(query: string): SearchResult {
    logger.debug(`Querying for ${query}`)
    const result = TrackFinder._search.search({
      $or: [{ artist: query }, { album: query }, { track: query }],
    })
    // const result = TrackFinder._search.search({ $path: 'artist' })

    const isArtistQuery = TrackFinder.isArtistQuery(query, result)
    const isWideMatch = TrackFinder.isWideMatch(result)

    fs.appendFileSync(
      './out.put',
      `----------- QUERY="${query}" -----------\nisArtistQuery=${isArtistQuery};\nisWide=${isWideMatch}`,
      {
        encoding: 'utf-8',
      }
    )

    result[0].matches?.forEach((m) =>
      logger.debug(`match=${JSON.stringify(m)}`)
    )

    result.slice(0, 10).forEach((r) => {
      const l = new Listing(r.item)
      const resStr = `\nResult\nName=\n${r.matches
        ?.map((match) => highlightMatches(l, match))
        .join('\n')};\nscore=${r.score};\nmatches.length=${
        r.matches?.length
      };\n--------------------------------------------------------------\n`
      fs.appendFileSync('./out.put', resStr, {
        encoding: 'utf-8',
      })
    })

    logger.debug(
      `Result\nName=${
        new Listing(result[0]?.item).name
      };\nisArtistQuery=${isArtistQuery};\nisWide=${isWideMatch}`
    )

    return {
      listing: new Listing(result[0]?.item),
      isArtistQuery,
      isWideMatch,
    }
  }

  static searchMany(query: string): Listing[] {
    const result = TrackFinder._search.search(query)

    return result.map((r) => r.item)
  }

  static artistSample(artist: string, count = 1): Listing[] {
    const res = []
    const listings = TrackFinder._listings.filter(
      (l, index, self) =>
        l.artist.toLowerCase() === artist.toLowerCase() &&
        l.albumArt &&
        self.map((x) => x.album).indexOf(l.album) === index
    )

    for (let i = 0; i < count; i++) {
      res.push(listings[Math.floor(Math.random() * listings.length)])
    }

    return res
  }

  static get trackCount(): number {
    return TrackFinder._listings.length
  }

  private static async loadTracksFromDB(): Promise<void> {
    logger.info('Reading library from Database')

    const dbRead = await LibIndex.findOne()
      .sort({ created_at: -1 })
      .populate('listings')
      .exec()

    if (dbRead) {
      logger.info('DB Record found')
      try {
        const data: Listing[] = dbRead.listings

        for (const datum of data) {
          // const listing = await Listing.fromBackup(datum)
          TrackFinder._listings.push(datum)
        }
      } catch (error) {
        logger.warn('unable to parse backup')
        LibIndex.deleteOne({ id: { $eq: dbRead._id } })
        await TrackFinder.loadTracksFromDisk()
      }
    } else {
      logger.warn('No backup, creating library from filesystem')
      await TrackFinder.loadTracksFromDisk()
    }
  }

  private static async loadTracksFromDisk(): Promise<void> {
    logger.debug('Loading library from filesystem')
    const paths = getAllFiles(Config.libraryPath, []).filter(
      (trackPath) => !reg.test(trackPath)
    )
    logger.debug(`Found ${paths.length} paths.`)

    const listings: Listing[] = []
    let errorCount = 0

    for (const trackPath of paths) {
      try {
        const meta = await mm.parseFile(trackPath)
        const listing = await Listing.fromMeta(meta, trackPath)

        listings.push(listing)
      } catch (error) {
        logger.error(`${trackPath} encountered error.`)
        logger.warn('Continuing with library read')
        errorCount++
      }
    }

    logger.warn(`Encountered ${errorCount} errors while loading library.`)

    logger.info('Setting listings')
    TrackFinder._listings = listings

    logger.info('Attempting backup save')
    TrackFinder.save()
    logger.info('Backup saved to database')
  }

  private static async save(): Promise<void> {
    const listingIds = TrackFinder._listings.map((listing) => {
      const listingRecord = new ListingSchema(listing)

      listingRecord.save()

      return listingRecord._id
    })

    const record = new LibIndex({
      listings: listingIds,
      count: TrackFinder._listings.length,
    })

    record.save()
  }
}

const highlightMatches = (
  listing: Listing,
  match?: Fuse.FuseResultMatch
): string => {
  const t = { ...listing } as any
  console.log(match, match?.key, match?.indices)
  if (match?.key) {
    const highlighted =
      (listing[match.key as keyof Listing] as string).slice(
        0,
        match.indices[0][0]
      ) +
      '[' +
      (listing[match.key as keyof Listing] as string).slice(
        match.indices[0][0],
        match.indices[0][1] + 1
      ) +
      ']' +
      (listing[match.key as keyof Listing] as string).slice(
        match.indices[0][1] + 1
      )

    t[match.key as keyof Listing] = highlighted
  }

  return `${t.artist} - ${t.album} - ${t.track}`
}
