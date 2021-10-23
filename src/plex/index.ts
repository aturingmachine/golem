import axios, { AxiosInstance } from 'axios'
import { TrackFinder } from '../player/track-finder'
import { GolemConf } from '../utils/config'
import { GolemLogger, LogSources } from '../utils/logger'
import { EzProgressBar } from '../utils/progress-bar'
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

type Plex = {
  token: string
  init: (trackFinder: TrackFinder) => Promise<void>
  instance?: AxiosInstance
  getPlaylists: () => Promise<PlaylistRecord[]>
  getPlaylistById: (id: string) => Promise<PlaylistDetailsContainer | undefined>
  playlists: Playlist[]
}

export const Plex: Plex = {
  token: '',
  playlists: [],

  async init(trackFinder: TrackFinder): Promise<void> {
    if (!GolemConf.modules.Plex) {
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
      this.playlists.push({
        name: record.name,
        count: record.count,
        listings: record.filePaths.map((path) => {
          EzProgressBar.add(
            1 / record.filePaths.length / playlistRecords.length,
            path.split('/').pop()
          )

          const res = trackFinder.findIdByPath(path)

          return res
        }),
      })
    })
    EzProgressBar.stop()

    // console.log(this.playlists[0].listings[0])

    // process.exit(0)

    log.info('Playlists Mapped')
  },

  async getPlaylists(): Promise<PlaylistRecord[]> {
    const records: PlaylistRecord[] = []
    const playlists = await this.instance?.get<PlaylistsContainer>('/playlists')

    if (playlists) {
      log.info(`Found ${playlists.data.MediaContainer.size} playlists.`)

      EzProgressBar.start(playlists.data.MediaContainer.Metadata.length)

      for (const playlist of playlists.data.MediaContainer.Metadata) {
        const details = await this.getPlaylistById(playlist.ratingKey)

        records.push({
          name: details?.MediaContainer.title || '',
          count: details?.MediaContainer.leafCount || 0,
          filePaths:
            details?.MediaContainer.Metadata.map((data) =>
              fixSlashes(data.Media[0].Part[0].file)
            ) || [],
        })

        EzProgressBar.add(
          0.5 / playlists.data.MediaContainer.Metadata.length,
          details?.MediaContainer.title
        )
      }
    }

    return records
  },

  async getPlaylistById(
    id: string
  ): Promise<PlaylistDetailsContainer | undefined> {
    const response = await this.instance?.get<PlaylistDetailsContainer>(
      `/playlists/${id}/items`
    )

    return response?.data
  },
}
