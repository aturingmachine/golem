import { MessageOptions } from 'discord.js'
import fuzzy from 'fuzzy'
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

/**
 * TODO - General Search Notes
 *
 * - Live should be weighted less
 * - Inst. should be weighted less
 * - figure out how to do weighting lol
 */

// Need to re-run the search if we get nothing but this time include the album?
// lotsa problems
const baseSearchOptions = {
  extract: (l: Listing) => `${l.artist} | ${l.track}`,
}

const reg = /.*\.(png|html|pdf|db|jpg|jpeg|xml|js|css)$/

export class TrackFinder {
  private static _listings: Listing[] = []

  static get listings(): Listing[] {
    return [...this._listings]
  }

  static async loadLibrary(): Promise<void> {
    if (opts.bustCache) {
      await TrackFinder.loadTracksFromDisk()
    } else {
      await TrackFinder.loadTracksFromDB()
    }
  }

  static isArtistQuery(
    query: string,
    res: fuzzy.FilterResult<Listing>[]
  ): boolean {
    return [res[0], res[1], res[2], res[3]].filter(Boolean).some((r) => {
      const artist = r.original.artist.toLowerCase().trim()
      const q = query.toLowerCase().trim()
      return artist === query || artist.indexOf(q) === 0
    })
  }

  // Dreamcatcher BOCA fucks this up
  // maybe check the length of the results as well?
  // ----
  // songs of the same name can trigger this (See above)
  // we have a lot of the same blackpink and its unplayable lol
  static isWideMatch(result: fuzzy.FilterResult<Listing>[]): boolean {
    return (
      result.length > 5 &&
      result.slice(1, 5).some((r) => result[0].score - r.score < 5)
    )
  }

  // Handle no results more gracefully
  // probs say something and best case dont die on a
  // bad $go play
  static search(query: string): SearchResult | undefined {
    const result = fuzzy.filter(query, TrackFinder.listings, baseSearchOptions)
    const isArtistQuery = TrackFinder.isArtistQuery(query, result)
    const isWideMatch = TrackFinder.isWideMatch(result)

    logger.debug(`${query}: ${result.length} Matches\n`)

    if (result.length) {
      logger.debug(
        `Pre-weighting Result=${result[0].string};\nArtistQuery=${isArtistQuery};\nWideMatch=${isWideMatch}`
      )

      const final = new Listing(TrackFinder.weightResult(result).original)
      const hasBeenWeighted = final.path !== result[0].original.path

      return {
        listing: final,
        isArtistQuery,
        isWideMatch: isWideMatch && !hasBeenWeighted,
      }
    }

    logger.warn(`No Results found for ${query}`)

    return undefined
  }

  static searchMany(query: string): Listing[] {
    const result = fuzzy.filter(query, TrackFinder.listings, baseSearchOptions)

    return result.map((r) => new Listing(r.original))
  }

  static artistSample(artist: string, count = 1): Listing[] {
    const res = []
    const listings = TrackFinder._listings
      .filter(
        (l) => l.artist.toLowerCase() === artist.toLowerCase() && l.albumArt
      )
      .filter(
        (l, index, self) => self.map((x) => x.album).indexOf(l.album) === index
      )

    for (let i = 0; i < count; i++) {
      res.push(listings[Math.floor(Math.random() * listings.length)])
    }

    return res
  }

  static get trackCount(): number {
    return TrackFinder._listings.length
  }

  // Our library matches nicely but does not
  // allow for key weighting, so we will do
  // it ourselves. Going to "add weight" to
  // base tracks (non inst, live, jp version)
  // since those can be accessed by more exact
  // queries, whereas we cannot work backwards.
  private static weightResult(
    resultSet: fuzzy.FilterResult<Listing>[]
  ): fuzzy.FilterResult<Listing> {
    logger.debug(
      `${resultSet.map((r) => `${r.original.track} scored ${r.score}`)}`
    )
    let pref = resultSet[0]
    const startingScore = pref.score
    logger.debug(`Post-Weight: Starting with ${pref.original.name}`)

    if (TrackFinder.isLiveOrInst(pref)) {
      logger.debug(`Post-Weight: Pref flagged, searching for alternatives`)
      pref =
        resultSet
          .slice(0, 10)
          .filter((r) => Math.abs(startingScore - r.score) < 5)
          .find((result) => !this.isLiveOrInst(result)) || pref
    }

    logger.debug(`Returning ${pref.original.track}`)

    return pref
  }

  private static isLiveOrInst(result: fuzzy.FilterResult<Listing>): boolean {
    logger.debug(`Checking inst for ${result.original.track.toLowerCase()}`)
    return ['instrumental', 'inst.', 'live', 'tour', 'jp'].some((s) =>
      result.original.track.toLowerCase().includes(s)
    )
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
          TrackFinder._listings.push(new Listing(datum))
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
    await LibIndex.deleteMany().exec()
    await ListingSchema.deleteMany().exec()
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
