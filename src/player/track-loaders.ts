import fs from 'fs'
import * as mm from 'music-metadata'
import { LibIndexData } from '../models/db/lib-index'
import { ListingData } from '../models/db/listing'
import { Listing } from '../models/listing'
import { GolemConf } from '../utils/config'
import { getAllFiles } from '../utils/filesystem'
import { GolemLogger, LogSources } from '../utils/logger'
import { EzProgressBar } from '../utils/progress-bar'

const log = GolemLogger.child({ src: LogSources.Loader })

const reg = /.*\.(png|html|pdf|db|jpg|jpeg|xml|js|css|ini)$/

export class TrackLoader {
  public readonly listings: Listing[]

  constructor() {
    this.listings = []
  }

  async load(): Promise<Listing[]> {
    if (!GolemConf.modules.Music) {
      log.verbose('music module disabled - not initializing track loading')
      return []
    }

    for (const lib of GolemConf.library.paths) {
      const name = lib.split('/').pop() || 'Library'

      if (GolemConf.options.BustCache) {
        await this.loadFromDisk(lib, name)
      } else {
        await this.loadTracksFromDB(lib, name)
      }
    }

    return this.listings
  }

  private async loadFromDisk(path: string, name: string): Promise<void> {
    await this.wipeData(name)

    log.verbose('Loading library from filesystem')
    const paths = getAllFiles(path, []).filter(
      (trackPath) => !reg.test(trackPath)
    )
    log.verbose(`Found ${paths.length} paths.`)

    let errorCount = 0
    const listings: Listing[] = []

    EzProgressBar.start(paths.length)

    for (const trackPath of paths) {
      try {
        const birthTime = fs.statSync(trackPath).birthtimeMs
        const meta = await mm.parseFile(trackPath)
        const listing = await Listing.fromMeta(meta, trackPath, birthTime)

        listings.push(listing)
      } catch (error) {
        log.error(`${trackPath} encountered error.`)
        log.warn('Continuing with library read')
        log.error(error)
        errorCount++
      }

      EzProgressBar.add(
        1 / paths.length,
        `${trackPath.split('/')[trackPath.split('/').length - 1]}`
      )
    }

    EzProgressBar.stop()

    log.warn(`Encountered ${errorCount} errors while loading library.`)

    log.info('Attempting backup save')
    this.save(name, listings)
    this.listings.push(...listings)
    log.info('Backup saved to database')
  }

  private async loadTracksFromDB(path: string, name: string): Promise<void> {
    log.info('Reading library from Database')

    const dbRead = await LibIndexData.findOne({ name })
      .sort({ created_at: -1 })
      .populate('listings')
      .exec()

    if (dbRead) {
      log.info('DB Record found')
      try {
        const data = dbRead.listings

        for (const datum of data) {
          this.listings.push(new Listing(datum, datum.id))
        }
      } catch (error) {
        log.warn('unable to parse backup')
        LibIndexData.deleteOne({ _id: { $eq: dbRead._id } })
        await this.loadFromDisk(path, name)
      }
    } else {
      log.warn('No backup, creating library from filesystem')
      await this.loadFromDisk(path, name)
    }
  }

  private async wipeData(libName: string): Promise<void> {
    const index = await LibIndexData.findOne({ name: libName }).exec()
    if (index) {
      log.info('Deleting stale cache')
      await ListingData.deleteMany({
        id: { $in: index?.listings.map((l) => l._id) || [] },
      }).exec()
      await index?.delete()
      log.info('Stale cache deleted')
    } else {
      log.info(`no stale cache found for ${libName}`)
    }
  }

  private async save(name: string, listings: Listing[]): Promise<Listing[]> {
    const listingIds: string[] = []

    for (const listing of listings) {
      const listingRecord = new ListingData(listing)

      await listingRecord.save()

      listing._id = listingRecord._id.toString()

      listingIds.push(listingRecord._id)
    }

    const record = new LibIndexData({
      name,
      listings: listingIds,
      count: listings.length,
    })

    await record.save()

    return listings
  }
}
