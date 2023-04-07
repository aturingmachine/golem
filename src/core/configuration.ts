import { readFileSync } from 'fs'
import path from 'path'
import { LogLevel } from '@nestjs/common'
import minimist, { ParsedArgs } from 'minimist'
import YAML from 'yaml'
import { ArrayUtils } from '../utils/list-utils'

export type DiscordConfig = {
  token: string
  clientId: string
  serverIds: string[]
  adminId: string
  debugServerId?: string
}

export type ImageConfig = {
  fallbackPath: string
  avgColorAlgorithm: 'sqrt' | 'dominant' | 'simple'
}

export type LastFmConfig = {
  apiKey: string
}

export type LibraryConfig = {
  paths: string[]
  albumLocation: string
}

export type MongoConfig = {
  uri: string
  dbName: string
  host: string
  port: number
}

export type PlexConfig = {
  uri: string
  appId: string
  username: string
  password: string
}

export type SearchConfig = {
  forceWeightTerms: string[]
  minimumScore: number
}

export type WebConfig = {
  apiPort: number
}

export type YoutubeConfig = {
  ytdlpPath: string
}

export type GolemArgs = {
  tty: boolean
  'bust-cache': boolean
  verbose: boolean
  debug: boolean
}

export type ConfigurationOptions = {
  args: GolemArgs & ParsedArgs
  discord?: DiscordConfig
  image?: ImageConfig
  lastfm?: LastFmConfig
  library?: LibraryConfig
  mongo?: MongoConfig
  plex?: PlexConfig
  search?: SearchConfig
  web?: WebConfig
  youtube?: YoutubeConfig
  logLevels: LogLevel[]
  crash?: {
    run: string
  }
}

export default (): ConfigurationOptions => {
  const raw = YAML.parse(
    readFileSync(path.resolve(__dirname, '../../config.yml'), {
      encoding: 'utf-8',
    })
  )

  const args = minimist<GolemArgs>(process.argv.slice(2), {
    boolean: ['tty', 'bust-cache', 'verbose'],

    alias: {
      tty: ['i'],
      'bust-cache': ['refresh'],
      verbose: ['v'],
    },
  })

  const discord = {
    token: raw.discord?.token || '',
    clientId: raw.discord?.clientId || '',
    serverIds: raw.discord?.serverIds || [],
    adminId: raw.discord?.adminId || '',
    debug: {
      channelId: raw.discord?.debug?.channel_id,
      channelName: raw.discord?.debug?.channel_name,
      guildId: raw.discord?.debug?.guild_id,
      guildName: raw.discord?.debug?.guild_name,
    },
  }

  const image = {
    fallbackPath: raw.image?.fallbackPath || '',
    avgColorAlgorithm:
      raw.image?.avgColorAlgorithm &&
      ['sqrt', 'dominant', 'simple'].includes(raw.image?.avgColorAlgorithm)
        ? raw.image.avgColorAlgorithm
        : 'sqrt',
  }

  const lastfm = {
    apiKey: raw.lastfm?.apiKey || '',
  }

  const library = {
    paths: raw.library?.paths || [],
    albumLocation: raw.library?.albumLocation || '',
  }

  const mongo = {
    uri: raw.mongo?.uri || '',
    dbName: raw.mongo?.dbName || 'golem',
    host: raw.mongo?.host || 'localhost',
    port: raw.mongo?.port || 27017,
  }

  const plex = {
    uri: raw.plex?.uri || '',
    appId: raw.plex?.appId || '',
    username: raw.plex?.username || '',
    password: raw.plex?.password || '',
  }

  const search = {
    forceWeightTerms: raw.search?.forceWeightTerms || [
      'instrumental',
      'inst.',
      'live',
      'remix',
    ],
    minimumScore: raw.search?.['minimum-score'] || 35,
  }

  const youtube = {
    ytdlpPath: raw.youtube?.ytdlpPath || '',
  }

  const web = {
    apiPort: raw.web?.apiPort || 3000,
  }

  let logLevels: LogLevel[] = ['error', 'warn', 'log']

  if (args.verbose) {
    logLevels.push('verbose')
  }

  if (args.debug) {
    logLevels.push('verbose', 'debug')
  }

  if (args.silly) {
    logLevels.push('verbose', 'debug', 'silly' as LogLevel)
  }

  logLevels = ArrayUtils.setFrom(logLevels)

  return {
    args,
    discord,
    image,
    lastfm,
    library,
    mongo,
    plex,
    search,
    youtube,
    web,
    logLevels,
  }
}
