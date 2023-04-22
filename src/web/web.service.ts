import { CpuInfo } from 'os'
import { Injectable, Optional } from '@nestjs/common'
import os from 'os-utils'
import { AuditRecord } from '../core/audits/audit.model'
import { AuditService } from '../core/audits/audit.service'
import { ClientService } from '../core/client.service'
import { LoggerService } from '../core/logger/logger.service'
import { AlbumService } from '../music/local/library/album.service'
import { Library } from '../music/local/library/library'
import { ListingLoaderService } from '../music/local/library/loader.service'
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
  } {
    const load = os.loadavg(5)
    const totalmem = os.totalmem()
    const freemem = os.freememPercentage()
    const uptime = os.processUptime()

    return {
      uptime,
      load,
      totalmem,
      freemem,
    }
  }
}
