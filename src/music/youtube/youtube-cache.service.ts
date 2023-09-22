import { createWriteStream } from 'fs'
import { resolve } from 'path'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import execa from 'execa'
import { ConfigurationOptions } from '../../core/configuration'
import { LoggerService } from '../../core/logger/logger.service'
import { pathExists } from '../../utils/filesystem'

@Injectable()
export class YoutubeCache {
  constructor(
    private log: LoggerService,
    private config: ConfigService<ConfigurationOptions>
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

    process.on('exit', () => {
      writeStream.close()
    })
  }

  get(videoId: string): string | undefined {
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

    return cachedPath
  }
}
