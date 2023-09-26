import { createWriteStream } from 'fs'
import { resolve } from 'path'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import execa from 'execa'
import { MongoRepository } from 'typeorm'
import { ConfigurationOptions } from '../../../core/configuration'
import { LoggerService } from '../../../core/logger/logger.service'
import { pathExists } from '../../../utils/filesystem'
import { CachedStream, CachedStreamType } from '../../cache/cached-stream.model'

@Injectable()
export class YoutubeCache {
  constructor(
    private log: LoggerService,
    private config: ConfigService<ConfigurationOptions>,

    @InjectRepository(CachedStream)
    private cachedStreams: MongoRepository<CachedStream>
  ) {
    this.log.setContext('YoutubeCache')
  }

  save(videoId: string, process: execa.ExecaChildProcess<string>): void {
    this.log.info(`attempting to cache '${videoId}'`)

    if (!process.stdout) {
      this.log.info(`no provided out stream - bailing`)
      return
    }

    const cacheRoot: string | undefined = this.config.get('youtube')?.cachePath

    if (!cacheRoot) {
      this.log.info(`no configured yt-cache root - bailing`)
      return
    }

    const cachedPath = resolve(cacheRoot, videoId)

    const writeStream = createWriteStream(cachedPath)

    process.stdout.pipe(writeStream)

    process.on('close', async () => {
      this.log.info(`ytdlp process emitted close, closing write stream`)
      writeStream.close()

      await this.getDbRecord(videoId)
    })
  }

  async get(videoId: string): Promise<string | undefined> {
    this.log.info(`checking yt-cache for '${videoId}'`)
    const cacheRoot: string | undefined = this.config.get('youtube')?.cachePath

    if (!cacheRoot) {
      this.log.info(`no configured yt-cache root - bailing`)
      return
    }

    const cachedPath = resolve(cacheRoot, videoId)

    const exists = pathExists(cachedPath)

    if (!exists) {
      // cache miss
      this.log.info(`cache miss for '${videoId}'`)

      return
    }

    // cache hit
    this.log.info(`cache hit for '${videoId}'`)

    // Get the Record if we have a cache on disk for it
    await this.getDbRecord(videoId)

    return cachedPath
  }

  private async getDbRecord(id: string): Promise<CachedStream> {
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
      })
    } else {
      model.last_access_date = date
    }

    await this.cachedStreams.save(model)

    return model
  }
}
