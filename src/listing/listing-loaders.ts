import fs from 'fs'
import * as mm from 'music-metadata'
import { GolemConf } from '../config'
import { LibIndex } from '../library/lib-index'
import { getAllFiles } from '../utils/filesystem'
import { GolemLogger, LogSources } from '../utils/logger'
import { EzProgressBar } from '../utils/progress-bar'
import { LocalListing } from './listing'

const log = GolemLogger.child({ src: LogSources.Loader })

const reg = /.*\.(png|html|pdf|db|jpg|jpeg|xml|js|css|ini)$/

export class ListingLoader {
  public readonly listings: LocalListing[] = []

  async load(): Promise<LocalListing[]> {
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

  async refresh(): Promise<Record<string, number>> {
    const result: Record<string, number> = {}

    for (const lib of GolemConf.library.paths) {
      const name = lib.split('/').pop() || 'Library'
      log.info(`refreshing library - ${name}@${lib}`)

      const record = await LibIndex.findOne({ name })
      log.silly(`library - ${name}@${lib} mongoId: ${record?._id}`)

      if (!record) {
        log.info(`no record found for library - ${name}@${lib}`)
        continue
      }

      // Get all paths for the library
      const paths = this.getPaths(lib)
      const newPathCount = paths.length - record.count

      if (newPathCount === 0) {
        log.info(`no new listings in library - ${name}@${lib}`)
        continue
      }

      log.debug(
        `found ${newPathCount} new listings for library - ${name}@${lib}`
      )

      const listingPaths = (
        await LocalListing.find({
          _id: { $in: record.listingIds },
        })
      ).map((l) => l.path)

      const newListings = await this.listingsFromPaths(
        paths.filter((path) => !listingPaths.includes(path)),
        (listing) => {
          record.listingIds.push(listing._id)
          this.listings.push(listing)
        }
      )

      result[name] = newListings.listings.length

      log.verbose(`saving library - ${name}@${lib}`)
      log.verbose(
        `added ${newListings.listings.length} listings to - ${name}@${lib}`
      )
      log.warn(`encountered ${newListings.errors.length} errors`)

      await record.save()
    }

    return result
  }

  private getPaths(path: string): string[] {
    return getAllFiles(path, []).filter((trackPath) => !reg.test(trackPath))
  }

  /**
   * Get LocalListings generated from some collection of paths.
   *
   * @param paths
   * @param cb
   * @returns
   */
  private async listingsFromPaths(
    paths: string[],
    cb?: (l: LocalListing) => void
  ): Promise<{ listings: LocalListing[]; errors: Error[] }> {
    const listings: LocalListing[] = []
    const errors: Error[] = []

    for (const path of paths) {
      try {
        const newListing = await this.saveListingFromPath(path)

        listings.push(newListing)

        if (cb) {
          cb(newListing)
        }
      } catch (error) {
        errors.push(error as Error)
      }
    }

    return {
      listings,
      errors,
    }
  }

  /**
   * Create a LocalListing by reading a file at the provided path
   * @param path
   * @returns
   */
  private async saveListingFromPath(path: string): Promise<LocalListing> {
    try {
      const birthTime = fs.statSync(path).birthtimeMs
      const meta = await mm.parseFile(path)
      const listing = await LocalListing.fromMeta(meta, path, birthTime)

      log.silly(`attempting to save ${listing.names.short.dashed}`)
      await listing.save()
      log.silly(`saved ${listing.names.short.dashed}`)

      return listing
    } catch (error) {
      log.error(`${path} encountered error.`)
      log.error(error)
      throw error
    }
  }

  private async loadFromDisk(
    path: string,
    name: string
  ): Promise<LocalListing[]> {
    await this.wipeData(name)

    const listings: LocalListing[] = []

    log.verbose('Loading library from filesystem')
    const paths = this.getPaths(path)
    log.verbose(`Found ${paths.length} paths.`)

    EzProgressBar.start(paths.length)

    const newListings = await this.listingsFromPaths(paths, (listing) => {
      EzProgressBar.add(1 / paths.length, `${listing.path.split('/').pop()}`)
    })

    listings.push(...newListings.listings)
    EzProgressBar.stop()

    log.warn(`Encountered ${newListings.errors} errors while loading library.`)

    log.info('Attempting backup save')
    await this.save(name, listings)
    this.listings.push(...listings)
    log.info('Backup saved to database')

    return listings
  }

  private async loadTracksFromDB(path: string, name: string): Promise<void> {
    log.info('Reading library from Database')

    const dbRead = await LibIndex.findOne(
      { name },
      { sort: { created_at: -1 } }
    )

    if (dbRead) {
      log.info(`DB Record found for library ${name}`)
      try {
        const listingRecords = await LocalListing.find({
          _id: { $in: dbRead.listingIds },
        })

        this.listings.push(...listingRecords)
      } catch (error) {
        log.warn(`unable to parse backup for library ${name}`)
        await dbRead.delete()
        await this.loadFromDisk(path, name)
      }
    } else {
      log.warn(`No backup for ${name}, creating library from filesystem`)
      await this.loadFromDisk(path, name)
    }
  }

  private async wipeData(libName: string): Promise<void> {
    const index = await LibIndex.findOne({ name: libName })
    if (index) {
      log.info(`Deleting stale cache for ${libName}`)
      await LocalListing.deleteMany({
        _id: { $in: index?.listingIds || [] },
      })
      await index?.delete()
      log.info(`Stale ${libName} cache deleted`)
    } else {
      log.info(`no stale cache found for ${libName}`)
    }
  }

  private async save(name: string, listings: LocalListing[]): Promise<void> {
    log.info('Attempting backup save')

    const record = new LibIndex(
      name,
      listings.length,
      listings.map((listing) => listing._id)
    )

    await record.save()

    log.info('Backup saved to database')
  }
}
