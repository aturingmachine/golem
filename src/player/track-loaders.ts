import * as mm from 'music-metadata'
import { LibIndexData } from '../models/db/lib-index'
import { ListingData } from '../models/db/listing'
import { Listing } from '../models/listing'
import { Track } from '../models/track'
import { Config, opts } from '../utils/config'
import { getAllFiles } from '../utils/filesystem'
import { GolemLogger, LogSources } from '../utils/logger'

const log = GolemLogger.child({ src: LogSources.Loader })

const reg = /.*\.(png|html|pdf|db|jpg|jpeg|xml|js|css)$/

export class TrackLoader {
  public readonly tracks: Track[]

  constructor() {
    this.tracks = []
  }

  get listings(): Listing[] {
    return this.tracks.map((t) => t.listing)
  }

  async load(): Promise<Track[]> {
    if (opts.bustCache) {
      await this.loadFromDisk()
    } else {
      await this.loadTracksFromDB()
    }

    return this.tracks
  }

  private async loadFromDisk(): Promise<void> {
    console.log(Config.libraryPath)
    await this.wipeData()

    log.debug('Loading library from filesystem')
    const paths = getAllFiles(Config.libraryPath, []).filter(
      (trackPath) => !reg.test(trackPath)
    )
    log.debug(`Found ${paths.length} paths.`)

    // const listings: Listing[] = []
    let errorCount = 0

    for (const trackPath of paths) {
      try {
        const meta = await mm.parseFile(trackPath)
        const listing = await Listing.fromMeta(meta, trackPath)

        // listings.push(listing)
        this.tracks.push(Track.fromListing(listing))
      } catch (error) {
        log.error(`${trackPath} encountered error.`)
        log.warn('Continuing with library read')
        log.error(error)
        errorCount++
      }
    }

    log.warn(`Encountered ${errorCount} errors while loading library.`)

    // log.info('Setting listings')
    // this.listings.push(...listings)

    log.info('Attempting backup save')
    this.save()
    log.info('Backup saved to database')
  }

  private async loadTracksFromDB(): Promise<void> {
    log.info('Reading library from Database')

    const dbRead = await LibIndexData.findOne()
      .sort({ created_at: -1 })
      .populate('listings')
      .exec()

    if (dbRead) {
      log.info('DB Record found')
      try {
        const data: Listing[] = dbRead.listings

        for (const datum of data) {
          this.tracks.push(Track.fromListing(datum))
        }
      } catch (error) {
        log.warn('unable to parse backup')
        LibIndexData.deleteOne({ id: { $eq: dbRead._id } })
        await this.loadFromDisk()
      }
    } else {
      log.warn('No backup, creating library from filesystem')
      await this.loadFromDisk()
    }
  }

  private async wipeData(): Promise<void> {
    log.info('Deleting stale cache')
    await LibIndexData.deleteMany().exec()
    await ListingData.deleteMany().exec()
    log.info('Stale cache deleted')
  }

  private async save(): Promise<void> {
    const listingIds: string[] = []

    for (const listing of this.listings) {
      const listingRecord = new ListingData(listing)

      await listingRecord.save()

      listingIds.push(listingRecord._id)
    }

    const record = new LibIndexData({
      listings: listingIds,
      count: this.listings.length,
    })

    await record.save()
  }
}
