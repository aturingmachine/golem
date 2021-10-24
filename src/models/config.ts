export type DiscordConfig = {
  token: string
  clientId: string
  serverIds: string[]
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
}

export type PlexConfig = {
  uri: string
  appId: string
  username: string
  password: string
}

export type SearchConfig = {
  forceWeightTerms: string[]
}

export type WebConfig = {
  apiPort: number
}

export type JSONConfig = {
  discord?: DiscordConfig
  image?: ImageConfig
  lastfm?: LastFmConfig
  library?: LibraryConfig
  mongo?: MongoConfig
  plex?: PlexConfig
  search?: SearchConfig
  web?: WebConfig
}

export enum GolemModule {
  Plex = 'Plex',
  LastFm = 'LastFm',
  Web = 'Web',
}

export enum CliOption {
  TTY = 'TTY',
  BustCache = 'BustCache',
  Verbose = 'Verbose',
  Debug = 'Debug',
}
