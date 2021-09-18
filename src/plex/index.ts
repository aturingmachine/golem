import axios, { AxiosInstance } from 'axios'
import { TrackFinder } from '../player/track-finder'
import { Config, opts } from '../utils/config'
import { GolemLogger, LogSources } from '../utils/logger'
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
  'X-Plex-Client-Identifier': Config.Plex.AppId,
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
    if (opts.noPlex) {
      log.info('no-plex flag set, skipping plex init')
      return
    }

    log.info('Initializing Plex Connection')
    const res = await axios.post(
      'https://plex.tv/api/v2/users/signin',
      {
        login: Config.Plex.Username,
        password: Config.Plex.Password,
      },
      {
        headers: PlexHeaders,
      }
    )

    this.token = res.data.authToken
    PlexHeaders['X-Plex-Token'] = this.token

    this.instance = axios.create({
      baseURL: Config.Plex.URI,
      headers: PlexHeaders,
    })
    log.info('Plex Connection Initialized')

    const playlistRecords = await this.getPlaylists()

    log.info('Mapping Playlists')
    playlistRecords.forEach((record) => {
      this.playlists.push({
        name: record.name,
        count: record.count,
        listings: record.filePaths.map((path) =>
          trackFinder.findIdByPath(path)
        ),
      })
    })
    log.info('Playlists Mapped')
  },

  async getPlaylists(): Promise<PlaylistRecord[]> {
    const records: PlaylistRecord[] = []
    const playlists = await this.instance?.get<PlaylistsContainer>('/playlists')

    if (playlists) {
      log.info(`Found ${playlists.data.MediaContainer.size} playlists.`)

      for (const playlist of playlists.data.MediaContainer.Metadata) {
        const details = await this.getPlaylistById(playlist.ratingKey)
        log.info(`Parsing ${details?.MediaContainer.title}`)

        records.push({
          name: details?.MediaContainer.title || '',
          count: details?.MediaContainer.leafCount || 0,
          filePaths:
            details?.MediaContainer.Metadata.map((data) =>
              fixSlashes(data.Media[0].Part[0].file)
            ) || [],
        })
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
