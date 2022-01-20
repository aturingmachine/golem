export type DiscordConfig = {
  token: string
  clientId: string
  serverIds: string[]
  adminId: string
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
}

export type MongoConfig = {
  uri: string
  dbName: string
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

export type ConfigurationOptions = {
  discord?: DiscordConfig
  image?: ImageConfig
  lastfm?: LastFmConfig
  library?: LibraryConfig
  mongo?: MongoConfig
  plex?: PlexConfig
  search?: SearchConfig
  web?: WebConfig
  youtube?: YoutubeConfig
  crash?: {
    run: string
  }
}

export enum GolemModule {
  Core = 'Core',
  Music = 'Music',
  Plex = 'Plex',
  LastFm = 'LastFm',
  Web = 'Web',
  Youtube = 'Youtube',
}

export enum CliOption {
  TTY = 'TTY',
  BustCache = 'BustCache',
  Verbose = 'Verbose',
  Debug = 'Debug',
  NoRun = 'NoRun',
}
