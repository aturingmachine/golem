import axios, { AxiosInstance } from 'axios'
import { GolemConf } from '../../config'
import { ListingFinder } from '../../search/track-finder'
import { GolemLogger, LogSources } from '../../utils/logger'
import { EzProgressBar } from '../../utils/progress-bar'
import {
  PlaylistRecord,
  PlaylistDetailsContainer,
  PlaylistsContainer,
  Playlist,
} from './models'

const log = GolemLogger.child({ src: LogSources.Plex })

const fixSlashes = (original: string): string => {
  const targetLib = original.split('\\').pop() || ''
  const match = targetLib.split('/').pop() || ''

  const normalizing = original.replaceAll('\\', '/')

  return targetLib.concat(
    normalizing.slice(normalizing.indexOf(match) + match.length)
  )
}

const PlexHeaders: Record<string, string> = {
  'X-Plex-Client-Identifier': GolemConf.plex.appId,
  'X-Plex-Product': 'Golem',
  'X-Plex-Version': '1.0.0',
  Accept: 'application/json',
}

export class PlexConnection {
  private token!: string
  private instance!: AxiosInstance

  public playlists: Playlist[] = []

  async init(trackFinder: ListingFinder): Promise<void> {
    if (!GolemConf.modules.Plex || !GolemConf.modules.Music) {
      log.info('plex module not loaded')
      return
    }

    log.info('Initializing Plex Connection')
    const res = await axios.post(
      'https://plex.tv/api/v2/users/signin',
      {
        login: GolemConf.plex.username,
        password: GolemConf.plex.password,
      },
      {
        headers: PlexHeaders,
      }
    )

    this.token = res.data.authToken
    PlexHeaders['X-Plex-Token'] = this.token

    this.instance = axios.create({
      baseURL: GolemConf.plex.uri,
      headers: PlexHeaders,
    })

    log.info('Plex Connection Initialized')

    const playlistRecords = await this.getPlaylists()

    playlistRecords.forEach((record) => {
      log.silly(`processing playlist ${record.name}`)
      EzProgressBar.add(1 / playlistRecords.length, record.name)

      this.playlists.push({
        name: record.name,
        count: record.count,
        listings: record.filePaths.map((path) => {
          // EzProgressBar.add(
          //   1 / record.filePaths.length / playlistRecords.length,
          //   path.split('/').pop()
          // )

          const res = trackFinder.findIdByPath(path)

          return res
        }),
      })
    })
    EzProgressBar.stop()

    log.info('Playlists Mapped')
  }

  async getPlaylists(): Promise<PlaylistRecord[]> {
    const records: PlaylistRecord[] = []
    const playlists = await this.instance?.get<PlaylistsContainer>('/playlists')

    if (playlists) {
      log.info(`Found ${playlists.data.MediaContainer.size} playlists.`)

      EzProgressBar.start(playlists.data.MediaContainer.Metadata.length)

      for (const playlist of playlists.data.MediaContainer.Metadata) {
        const details = await this.getPlaylistById(playlist.ratingKey)

        if (details?.MediaContainer && details.MediaContainer.Metadata) {
          records.push({
            name: details?.MediaContainer.title || '',
            count: details?.MediaContainer.leafCount || 0,
            filePaths:
              details?.MediaContainer.Metadata.map((data) =>
                fixSlashes(data.Media[0].Part[0].file)
              ) || [],
          })
        }

        EzProgressBar.add(
          1 / playlists.data.MediaContainer.Metadata.length,
          details?.MediaContainer.title
        )
      }

      EzProgressBar.stop()
    }

    return records
  }

  async getPlaylistById(
    id: string
  ): Promise<PlaylistDetailsContainer | undefined> {
    const response = await this.instance?.get<PlaylistDetailsContainer>(
      `/playlists/${id}/items`
    )

    return response?.data
  }
}
