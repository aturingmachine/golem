import fs from 'fs'
import Fuse from 'fuse.js'
import * as mm from 'music-metadata'
import { Listing, ListingBackupInfo } from '../models/listing'
import { Config, opts } from '../utils/config'
import { getAllFiles, pathExists } from '../utils/filesystem'
import { logger } from '../utils/logger'

const backupPath = './lib.bk'

export interface SearchResult {
  listing: Listing
  isArtistQuery: boolean
  isWideMatch: boolean
}

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
  minMatchCharLength: 2,
}

const reg = /.*\.(png|html|pdf|db|jpg|jpeg|xml|js|css)$/

export class TrackFinder {
  private static listings: Listing[] = []
  private static _search: Fuse<Listing>

  static async loadLibrary(): Promise<void> {
    if (opts.bustCache) {
      await TrackFinder.loadTracksFromDisk()
    } else {
      await TrackFinder.loadTracksFromBackup()
    }

    TrackFinder._search = new Fuse<Listing>(TrackFinder.listings, fuseOpts)
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

    if (picked.score && second.score) {
      const diff1 = Math.abs(picked.score - second.score) * 1000

      return diff1 === 0 || diff1 < 0.1
    }
    return false
  }

  static search(query: string): SearchResult {
    const result = TrackFinder._search.search(query)
    const isArtistQuery = TrackFinder.isArtistQuery(query, result)
    const isWideMatch = TrackFinder.isWideMatch(result)

    return {
      listing: result[0].item,
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
    const listings = TrackFinder.listings.filter(
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
    return TrackFinder.listings.length
  }

  private static async loadTracksFromBackup(): Promise<void> {
    logger.info('Reading library from backup')

    if (pathExists(backupPath)) {
      const data: ListingBackupInfo[] = JSON.parse(
        fs.readFileSync(backupPath, { encoding: 'utf-8' })
      )

      for (const datum of data) {
        const listing = await Listing.fromBackup(datum)
        TrackFinder.listings.push(listing)
      }
    } else {
      logger.info('No backup, creating library from filesystem')
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
    TrackFinder.listings = listings

    fs.writeFileSync(
      backupPath,
      JSON.stringify(
        TrackFinder.listings.map((l) => ({
          ...l,
          albumArt: undefined,
        })),
        undefined,
        2
      ),
      {
        encoding: 'utf-8',
      }
    )
  }
}
