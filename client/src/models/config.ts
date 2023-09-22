
export type DiscordConfig = {
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
  args: GolemArgs
  discord?: DiscordConfig
  image?: ImageConfig
  lastfm?: LastFmConfig
  library?: LibraryConfig
  mongo?: MongoConfig
  plex?: PlexConfig
  search?: SearchConfig
  web?: WebConfig
  youtube?: YoutubeConfig
  logLevels: string[]
  crash?: {
    run: string
  }
}
