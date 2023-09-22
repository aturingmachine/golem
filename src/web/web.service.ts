import { execSync } from 'child_process'
import { Injectable, Optional } from '@nestjs/common'
import fuzzy from 'fuzzy'
import os from 'os-utils'
import { AuditRecord } from '../core/audits/audit.model'
import { AuditService } from '../core/audits/audit.service'
import { ClientService } from '../core/client.service'
import { ConfigurationOptions } from '../core/configuration'
import { ConfigurationService } from '../core/configuration.service'
import { GuildConfig } from '../core/guild-config/guild-config.model'
import { GuildConfigService } from '../core/guild-config/guild-config.service'
import { LoggerService } from '../core/logger/logger.service'
import { AlbumService } from '../music/local/library/album.service'
import { Library } from '../music/local/library/library'
import { ListingLoaderService } from '../music/local/library/loader.service'
import {
  ListingSearcher,
  SearchResult,
} from '../music/local/library/searcher.service'
import { Album } from '../music/local/listings/album'
import { LocalListing } from '../music/local/listings/listings'
import { MusicPlayerJSON } from '../music/player/player'
import { PlayerService } from '../music/player/player.service'

@Injectable()
export class WebService {
  constructor(
    private log: LoggerService,
    private client: ClientService,
    private players: PlayerService,
    private albums: AlbumService,
    private audits: AuditService,
    private search: ListingSearcher,
    private guildConfig: GuildConfigService,
    @Optional() private loader?: ListingLoaderService
  ) {
    this.log.setContext('WebService')
  }

  allPlayers(): { players: MusicPlayerJSON[] } {
    return {
      players: Array.from(this.players.cached.values()).map((p) => p.toJSON()),
    }
  }

  async allLibraries(): Promise<{ libraries: Library[] }> {
    let libraries: Library[] = []

    if (this.loader) {
      libraries = await this.loader.libs()
    }

    return { libraries }
  }

  async allListings(): Promise<{ listings: LocalListing[] }> {
    let listings: LocalListing[] = []

    if (this.loader) {
      listings = await this.loader.allListings()
    }

    return { listings }
  }

  async allAlbums(): Promise<{ albums: Album[] }> {
    const result = await this.albums.all()

    return { albums: result }
  }

  async allAudits(): Promise<{ audits: AuditRecord[] }> {
    const result = await this.audits.all()

    return { audits: result }
  }

  resourceData(): {
    load: number
    totalmem: number
    freemem: number
    uptime: number
    currentmemmaybe: number
  } {
    const pid = process.pid

    const asdf = execSync(
      `ps -aux | grep ${pid} | grep -v grep | awk '{print $4}'`,
      {
        encoding: 'utf-8',
      }
    )

    const load = os.loadavg(5)
    const totalmem = os.totalmem()
    const freemem = os.freememPercentage()
    const uptime = os.processUptime()
    const currentmemmaybe = parseFloat(asdf)

    return {
      uptime,
      load,
      totalmem,
      freemem,
      currentmemmaybe,
    }
  }

  searchListings(query: string): {
    results: fuzzy.FilterResult<LocalListing>[]
    top?: SearchResult
  } {
    const top = this.search.search(query)
    const results = this.search.searchManyRaw(query)

    return {
      top,
      results,
    }
  }

  getConfig(): ConfigurationOptions {
    return ConfigurationService.resolved
  }

  setConfig(path: string, value: unknown): ConfigurationOptions {
    try {
      ConfigurationService.set(path, value)
    } catch (error) {
      this.log.error(`unable to set config option`, error)

      throw error
    }

    this.log.debug(`Should have updated config "${path}" to ${value}`)

    return ConfigurationService.resolved
  }

  async getAllGuildConfigs(): Promise<GuildConfig[]> {
    const configs = await this.guildConfig.all()

    return configs
  }
}
