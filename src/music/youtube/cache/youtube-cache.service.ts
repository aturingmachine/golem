import { execSync } from 'child_process'
import { createWriteStream, statSync, rmSync } from 'fs'
import { resolve, normalize } from 'path'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import execa from 'execa'
import { MongoRepository } from 'typeorm'
import { CacheConfig, ConfigurationOptions } from '../../../core/configuration'
import { LoggerService } from '../../../core/logger/logger.service'
import { DiscordMarkdown } from '../../../utils/discord-markdown-builder'
import { getAllFiles, pathExists } from '../../../utils/filesystem'
import { CachedStream, CachedStreamType } from '../../cache/cached-stream.model'
import { YoutubeListing } from '../youtube-listing'
import { YoutubeSearch } from '../youtube-search.service'

type YTCacheValidateAndCleanResult = {
  current: {
    items: number
    size: string
  }
  deleted: number
  invalid_items_fixed: number
  pretty_formatted: string
}

@Injectable()
export class YoutubeCache {
  constructor(
    private log: LoggerService,
    private config: ConfigService<ConfigurationOptions>,
    private ytSearch: YoutubeSearch,

    @InjectRepository(CachedStream)
    private cachedStreams: MongoRepository<CachedStream>
  ) {
    this.log.setContext('YoutubeCache')
  }

  get cacheConfig(): CacheConfig['yt'] {
    return this.config.get('cache')?.yt
  }

  save(
    listing: YoutubeListing,
    videoId: string,
    process: execa.ExecaChildProcess<string>
  ):
    | {
        cancel: () => void
      }
    | undefined {
    this.log.info(`attempting to cache '${videoId}'`)

    if (!process.stdout) {
      this.log.info(`no provided out stream - bailing`)
      return
    }

    if (!this.cacheRoot) {
      this.log.info(`no configured yt-cache root - bailing`)
      return
    }

    const cachedPath = resolve(this.cacheRoot, videoId)

    const writeStream = createWriteStream(cachedPath)

    process.stdout.pipe(writeStream)

    let hasCanceled = false

    const cancel = () => {
      this.log.info(`cancel handler triggered for ${videoId}`)
      writeStream.close()
      this.log.debug(`cancel handler closing writeStream for ${videoId}`)
      rmSync(cachedPath)
      this.log.debug(`cancel handler rmSync-ed "${cachedPath}" for ${videoId}`)

      hasCanceled = true
    }

    process.on('error', (err) => {
      this.log.info(`ytdlp process threw an error, removing cached file.`, err)
      cancel()
    })

    process.on('exit', (code) => {
      this.log.info(`ytdlp process emitted exit -`, code)
    })

    process.on('close', async () => {
      this.log.info(`ytdlp process emitted close, closing write stream`)

      writeStream.close()

      if (hasCanceled) {
        this.log.info(`track was cancelled - not saving track to db.`)

        return
      }

      await this.getDbRecord(listing)
    })

    return { cancel }
  }

  async get(listing: YoutubeListing): Promise<string | undefined> {
    const videoId = listing.listingId
    this.log.info(`checking yt-cache for '${videoId}'`)

    if (!this.cacheRoot) {
      this.log.info(`no configured yt-cache root - bailing`)
      return
    }

    const cachedPath = resolve(this.cacheRoot, videoId)

    const exists = pathExists(cachedPath)

    if (!exists) {
      // cache miss
      this.log.info(`cache miss for '${videoId}'`)

      return
    }

    // cache hit
    this.log.info(`cache hit for '${videoId}'`)

    // Get the Record if we have a cache on disk for it
    await this.getDbRecord(listing)

    return cachedPath
  }

  async cleanAndValidate(): Promise<YTCacheValidateAndCleanResult> {
    const result: YTCacheValidateAndCleanResult = {
      invalid_items_fixed: 0,
      deleted: 0,
      current: {
        items: 0,
        size: '',
      },
      pretty_formatted: '',
    }

    if (!this.cacheRoot) {
      result.pretty_formatted = 'No YoutTube Cache configured.'

      return result
    }

    result.deleted = await this.cleanCache()
    result.invalid_items_fixed = await this.validateCache()
    result.current = {
      items: getAllFiles(this.cacheRoot, []).length,
      size: `${this.getCacheDirSize()}MB`,
    }

    result.pretty_formatted = DiscordMarkdown.start()
      .bold('Youtube Cache: Clean And Validate')
      .newLine()
      .raw(`Deleted ${result.deleted} items`)
      .newLine()
      .raw(`Validated ${result.invalid_items_fixed} items`)
      .newLine()
      .raw(`${result.current.items} cached items`)
      .newLine()
      .raw(`${result.current.size} cache size`).content

    return result
  }

  allDbEntries(): Promise<CachedStream[]> {
    return this.cachedStreams.find({
      where: { type: CachedStreamType.YouTube },
    })
  }

  async cleanCache(): Promise<number> {
    const sortedItems = (await this.allDbEntries()).sort((left, right) => {
      if (left.last_access_date < right.last_access_date) {
        return -1
      }

      if (left.last_access_date > right.last_access_date) {
        return 1
      }

      return 0
    })

    if (!this.shouldTrimCache()) {
      this.log.info(`Cache does not need to be trimmed.`)

      return -1
    }

    if (!!this.cacheConfig?.size.space) {
      return this.cleanCacheUsingDiskSpace(sortedItems)
    }

    if (!!this.cacheConfig?.size.items) {
      return this.cleanCacheUsingCount(sortedItems)
    }

    return -1
  }

  async deleteById(id: string): Promise<void> {
    if (!this.cacheRoot) {
      return
    }

    const record = await this.cachedStreams.find({
      where: {
        external_id: id,
        type: CachedStreamType.YouTube,
      },
    })

    this.log.info(`attempting to delete record ${id} - ${record}`)

    if (!record) {
      return
    }

    const targetPath = resolve(this.cacheRoot, id)

    try {
      rmSync(targetPath)
    } catch (error) {
      this.log.warn(`could not delete "${targetPath}"`, error)
    }

    await this.deleteCachedItems(record)
  }

  async deleteCachedItems(items: CachedStream[]): Promise<void> {
    if (!this.cacheRoot) {
      return
    }

    for (const item of items) {
      this.log.info(`deleting cached item "${item.title}"`)
      const targetPath = resolve(this.cacheRoot, item.external_id)

      await this.cachedStreams.delete(item._id)
      this.log.info(`db item deleted for "${item.title}"`)

      try {
        this.log.info(`attemting to remove cached file for "${item.title}"`)
        rmSync(targetPath)
        this.log.info(`cached file for "${item.title}" removed`)
      } catch (error) {
        this.log.info(`could not remove cached file for "${item.title}"`, error)
      }
    }
  }

  async validateCache(): Promise<number> {
    if (!this.cacheRoot) {
      return -1
    }

    const cachedFiles = getAllFiles(this.cacheRoot, [])
    const entries = await this.allDbEntries()

    const untrackedFiles = cachedFiles.filter((file) => {
      const id = file.split('/').pop()
      const match = entries.find((item) => item.external_id === id)

      return !match
    })

    this.log.info(`found ${untrackedFiles.length} untracked cached streams`)

    const newEntries = await Promise.all(
      untrackedFiles.map(async (file) => {
        const id = file.split('/').pop()!
        this.log.debug(`generating cache entry for untracked "${id}"@"${file}"`)

        const ytResult = await this.ytSearch.getInfo(
          `https://www.youtube.com/watch?v=${id}`
        )

        const targetThumbnail: string =
          ytResult.thumbnails
            .filter((thumb: any) => thumb.url.endsWith('.jpg'))
            .sort((a: any, b: any) => {
              return b.preference - a.preference
            })?.[0]?.url || ytResult.thumbnail

        return this.cachedStreams.create({
          type: CachedStreamType.YouTube,
          external_id: id,
          title: ytResult.title,
          artist: ytResult.channel,
          thumbnail: targetThumbnail,
          initial_cache_date: new Date(),
          last_access_date: new Date(),
        })
      })
    )

    this.log.info(`saving ${newEntries.length} backfilled entries`)

    await this.cachedStreams.save(newEntries)

    return newEntries.length
  }

  private get cacheRoot(): string | undefined {
    return this.cacheConfig?.path
  }

  private async cleanCacheUsingCount(items: CachedStream[]): Promise<number> {
    if (!this.cacheConfig?.size.items) {
      return -1
    }

    const itemsToDelete = items.slice(this.cacheConfig.size.items)
    this.log.info(`Deleting ${items.length} cached items.`)

    await this.deleteCachedItems(itemsToDelete)

    this.log.info(`Cache cleaned.`)

    return items.length
  }

  private async cleanCacheUsingDiskSpace(
    items: CachedStream[]
  ): Promise<number> {
    if (!this.cacheConfig?.size.space) {
      return -1
    }

    const configuredMaxSpace = this.cacheConfig.size.space
    const currentDirSize = this.getCacheDirSize()
    const itemsToDelete: CachedStream[] = []
    let accumulatedSize = 0

    for (const item of items) {
      if (currentDirSize - accumulatedSize < configuredMaxSpace) {
        break
      }

      const itemPath = normalize(`${this.cacheRoot}/${item.external_id}`)
      const stats = statSync(itemPath)
      const sizeInMB = stats.size / (1024 * 1024)

      accumulatedSize = accumulatedSize + sizeInMB
      itemsToDelete.push(item)
    }

    this.log.info(
      `Deleting ${itemsToDelete.length} cached items equalling ${accumulatedSize} MB.`
    )

    await this.deleteCachedItems(itemsToDelete)

    this.log.info(`Cache cleaned.`)

    return itemsToDelete.length
  }

  private getCacheDirSize(): number {
    const rawSize = execSync(`du -sk ${this.cacheRoot}`, {
      encoding: 'utf-8',
    })

    const sizeInKB = parseInt(rawSize.split(' ')?.[0])

    const sizeInMB = sizeInKB / 1000

    return sizeInMB
  }

  /**
   * If no configuration is provided an infinitely sized cache is acceptable.
   *
   * @returns true if the cache needs to be trimmed; false if the cache is safe
   */
  private shouldTrimCache(): boolean {
    if (!this.cacheRoot) {
      return false
    }

    if (this.cacheConfig?.size.space !== undefined) {
      this.log.info(`Checking cache size using disk space config`)

      const sizeInMB = this.getCacheDirSize()

      this.log.info(`cache currently sits at ${sizeInMB}MB`)

      return sizeInMB > this.cacheConfig.size.space
    }

    if (this.cacheConfig?.size.items !== undefined) {
      this.log.info(`Checking cache size using number of items config`)

      const allFiles = getAllFiles(this.cacheRoot, [])

      this.log.info(`cache currently sits at ${allFiles.length} items`)

      return allFiles.length > this.cacheConfig.size.items
    }

    return false
  }

  private async getDbRecord(listing: YoutubeListing): Promise<CachedStream> {
    const id = listing.listingId
    const date = new Date()

    let model = await this.cachedStreams.findOne({
      where: { type: CachedStreamType.YouTube, external_id: id },
    })

    if (!model) {
      model = this.cachedStreams.create({
        type: CachedStreamType.YouTube,
        external_id: id,
        initial_cache_date: date,
        last_access_date: date,
        title: listing.title,
        artist: listing.artist,
        thumbnail: listing.albumArtUrl,
      })
    } else {
      model.last_access_date = date
    }

    await this.cachedStreams.save(model)

    return model
  }
}
