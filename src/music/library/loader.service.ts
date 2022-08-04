import fs from 'fs'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import * as mm from 'music-metadata'
import { MongoRepository } from 'typeorm'
import { LoggerService } from '../../core/logger/logger.service'
import { getAllFiles } from '../../utils/filesystem'
import { LocalListing } from '../listings/listings'
import { Library } from './library'

const reg = /.*\.(png|html|pdf|db|jpg|jpeg|xml|js|css|ini)$/

@Injectable()
export class ListingLoaderService {
  public readonly records: LocalListing[] = []

  constructor(
    private log: LoggerService,
    private config: ConfigService,

    @InjectRepository(LocalListing)
    private listings: MongoRepository<LocalListing>,

    @InjectRepository(Library)
    private libraries: MongoRepository<Library>
  ) {
    this.log.setContext('ListingLoader')
  }

  async load(): Promise<void> {
    for (const library of this.config.get('library.paths')) {
      const name = library.split('/').pop() || 'Library'

      if (this.config.get('args.bust-cache')) {
        await this.loadFromDisk(library, name)
      } else {
        await this.loadFromDB(name)
      }
    }
  }

  private getPaths(path: string): string[] {
    return getAllFiles(path, []).filter((trackPath) => !reg.test(trackPath))
  }

  private async loadFromDB(name: string): Promise<void> {
    this.log.debug(`Loading library ${name} from database.`)
    const library = await this.libraries.findOne({
      where: { name },
      order: { created_at: 'ASC' },
    })

    if (library) {
      try {
        const listingRecords = await this.listings.findBy({
          _id: { $in: library.listingIds },
        })

        this.records.push(...listingRecords)
        console.log(listingRecords[0])
        this.log.debug(
          `Library ${name} loaded. Included ${listingRecords.length} listings.`
        )
      } catch (error) {
        console.error(error)
      }
    }
  }

  private async loadFromDisk(
    path: string,
    name: string
  ): Promise<LocalListing[]> {
    await this.wipeData()

    const listings: LocalListing[] = []

    this.log.verbose('Loading library from filesystem')
    const paths = this.getPaths(path)
    this.log.verbose(`Found ${paths.length} paths.`)

    // EzProgressBar.start(paths.length)

    const newListings = await this.listingsFromPaths(paths, (listing) => {
      this.log.verbose(`saved ${listing.shortName}`)
      // EzProgressBar.add(1 / paths.length, `${listing.path.split('/').pop()}`)
    })

    listings.push(...newListings.listings)
    // EzProgressBar.stop()

    this.log.warn(
      `Encountered ${newListings.errors} errors while loading library.`
    )

    const library = new Library(
      name,
      listings.length,
      listings.map((listing) => listing._id)
    )

    this.log.debug(`Saving library ${name}`)
    await this.libraries.save(library)
    this.log.debug(`Saved library ${name}`)

    this.records.push(...listings)

    return listings
  }

  async wipeData(): Promise<void> {
    this.log.info('Wiping all local library data.')
    this.log.debug('Deleting Libraries.')
    const libraryResults = await this.libraries.deleteMany({})
    this.log.debug(`${libraryResults.deletedCount} Libraries Deleted.`)
    this.log.debug('Deleting Listings.')
    const listingResults = await this.listings.deleteMany({})
    this.log.debug(`${listingResults.deletedCount} Listings Deleted.`)
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
      const listing = await LocalListing.fromMeta(
        meta,
        path,
        birthTime,
        this.config.get('library.paths', [])
      )

      this.log.silly(`attempting to save ${listing.names.short.dashed}`)
      await this.listings.save(listing)

      return listing
    } catch (error) {
      this.log.error(`${path} encountered error.`)
      this.log.error((error as Error).stack)
      throw error
    }
  }
}
