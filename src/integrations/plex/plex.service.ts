import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import PlexAPI, { LibraryItem, PlaylistMetadata } from 'plex-api'
import { LoggerService } from '../../core/logger/logger.service'
import { ListingLoaderService } from '../../music/local/library/loader.service'
import { ListingSearcher } from '../../music/local/library/searcher.service'
import { ArrayUtils } from '../../utils/list-utils'

type PlexPlaylistRecord = {
  name: string
  count: number
  tracks: Record<'name' | 'id', string>[]
}

@Injectable()
export class PlexService {
  readonly playlists: PlexPlaylistRecord[]

  private readonly client: PlexAPI

  constructor(
    private log: LoggerService,
    private config: ConfigService,
    private loader: ListingLoaderService,
    private searcher: ListingSearcher
  ) {
    this.log.setContext('PlexService')

    const host = this.config.get('plex.uri', 'localhost')
    const appId = this.config.get('plex.appId', 'golem-bot')
    const username = this.config.getOrThrow('plex.username')
    const password = this.config.getOrThrow('plex.password')

    this.client = new PlexAPI({
      hostname: host,
      username,
      password,
      options: {
        identifier: appId,
        product: 'Golem Bot',
      },
    })

    this.playlists = []
  }

  async loadPlaylists(): Promise<void> {
    this.log.info('Loading Plex Playlists')

    const response = await this.client.query<PlaylistMetadata>('/playlists')
    const playlistData = response.MediaContainer.Metadata

    if (!playlistData) {
      this.log.warn(`No Plex Playlist Data Found.`)
      return
    }

    for (const datum of playlistData) {
      this.log.debug(`Attempting to load playlist "${datum.title}"`)
      const record = await this.getPlaylistById(datum.ratingKey)

      if (record) {
        this.log.debug(`Got playlist data for "${datum.title}"`)
        this.playlists.push(record)
      }
    }

    this.log.info(`Loaded ${this.playlists.length} Playlists.`)
  }

  private async getPlaylistById(
    id: string
  ): Promise<PlexPlaylistRecord | undefined> {
    const details = await this.client.query<LibraryItem>(
      `/playlists/${id}/items`
    )

    if (details?.MediaContainer && details.MediaContainer.Metadata) {
      const filePaths =
        details?.MediaContainer.Metadata.map((data: LibraryItem) =>
          this.fixSlashes(data.Media[0].Part[0].file)
        ) || []

      return {
        name: details?.MediaContainer.title || '',
        count: details?.MediaContainer.leafCount || 0,
        tracks: filePaths
          .map((path: string) => this.searcher.findByPath(path))
          .filter(ArrayUtils.isDefined),
      }
    }
  }

  private fixSlashes(original: string): string {
    const targetLib = original.split('\\').pop() || ''
    const match = targetLib.split('/').pop() || ''

    const normalizing = original.replaceAll('\\', '/')

    return targetLib.concat(
      normalizing.slice(normalizing.indexOf(match) + match.length)
    )
  }
}
