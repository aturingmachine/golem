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
  public readonly listings: LocalListing[]

  constructor() {
    this.listings = []
  }

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

  private async loadFromDisk(path: string, name: string): Promise<void> {
    await this.wipeData(name)

    log.verbose('Loading library from filesystem')
    const paths = getAllFiles(path, []).filter(
      (trackPath) => !reg.test(trackPath)
    )
    log.verbose(`Found ${paths.length} paths.`)

    let errorCount = 0
    const listings: LocalListing[] = []

    EzProgressBar.start(paths.length)

    for (const trackPath of paths) {
      try {
        const birthTime = fs.statSync(trackPath).birthtimeMs
        const meta = await mm.parseFile(trackPath)
        const listing = await LocalListing.fromMeta(meta, trackPath, birthTime)

        log.silly(`attempting to save ${listing.names.short.dashed}`)
        await listing.save()
        log.silly(`saved ${listing.names.short.dashed}`)

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
    await this.save(name, listings)
    this.listings.push(...listings)
    log.info('Backup saved to database')
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
        const data = dbRead.listings

        for (const datum of data) {
          this.listings.push(new LocalListing(datum))
        }
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
        _id: { $in: index?.listings.map((l) => l._id) || [] },
      })
      await index?.delete()
      log.info(`Stale ${libName} cache deleted`)
    } else {
      log.info(`no stale cache found for ${libName}`)
    }
  }

  private async save(
    name: string,
    listings: LocalListing[]
  ): Promise<LocalListing[]> {
    const record = new LibIndex(name, listings.length, listings)

    await record.save()

    return listings
  }
}
