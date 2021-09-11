import axios, { AxiosInstance } from 'axios'
import { TrackFinder } from '../player/track-finder'
import { Config } from '../utils/config'
import { logger } from '../utils/logger'
import {
  PlaylistRecord,
  PlaylistDetailsContainer,
  PlaylistsContainer,
  Playlist,
} from './models'

const log = logger.child({ src: 'Plex' })

const fixSlashes = (original: string): string => {
  const match = Config.libraryPath.split('/').pop() || ''

  const normalizing = original.replaceAll('\\', '/')

  return Config.libraryPath.concat(
    normalizing.slice(normalizing.indexOf(match) + match.length)
  )
}

const PlexHeaders: Record<string, string> = {
  'X-Plex-Client-Identifier': Config.plexAppId,
  'X-Plex-Product': 'Golem',
  'X-Plex-Version': '1.0.0',
  Accept: 'application/json',
}

type Plex = {
  token: string
  init: () => Promise<void>
  instance?: AxiosInstance
  getPlaylists: () => Promise<PlaylistRecord[]>
  getPlaylistById: (id: string) => Promise<PlaylistDetailsContainer | undefined>
  playlists: Playlist[]
}

export const Plex: Plex = {
  token: '',
  playlists: [],

  async init(): Promise<void> {
    log.info('Initializing Plex Connection')
    const res = await axios.post(
      'https://plex.tv/api/v2/users/signin',
      {
        login: Config.plexUsername,
        password: Config.plexPassword,
      },
      {
        headers: PlexHeaders,
      }
    )

    this.token = res.data.authToken
    PlexHeaders['X-Plex-Token'] = this.token

    this.instance = axios.create({
      baseURL: Config.plexURI,
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
          TrackFinder.findIdByPath(path)
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