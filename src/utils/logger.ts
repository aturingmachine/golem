import chalk from 'chalk'
import { v4 as uuidv4 } from 'uuid'
import winston from 'winston'
import { GolemConf } from '../config'

export enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Verbose = 'verbose',
  Silly = 'silly',
}

const { combine, timestamp, colorize, printf, json, splat } = winston.format

const consoleLogFormat = printf(({ level, message, timestamp, src }) => {
  const d = new Date(timestamp)
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const seconds = d.getSeconds().toString().padStart(2, '0')

  const timeString = `${hours}:${minutes}:${seconds}`

  const srcColor = LogSourceColors[src as LogSources] || chalk.white

  return `${timeString} <${level}> [${srcColor(src)}] ${message}`
})

const id = winston.format((info) => {
  info.id = uuidv4()

  return info
})

const logger = winston.createLogger({
  level: GolemConf.logLevel,
  format: combine(splat(), timestamp(), id(), json()),
  transports: [
    new winston.transports.File({
      filename: './logs/combined.log',
    }),
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), splat(), consoleLogFormat),
    }),
  ],
})

enum LogSources {
  Analytics = 'analytics',
  API = 'web-server',
  App = 'app',
  ArtistButton = 'artist-button',
  ButtonHandler = 'button-handler',
  Client = 'client',
  CommandDeploy = 'cmd-deploy',
  CommandInteractionHandler = 'cmd-handler',
  CommandRegister = 'cmd-register',
  DatabaseConnection = 'db-con',
  DBDebug = 'db-debug',
  Debugger = 'debugger',
  GoAlias = 'go-alias',
  GoGet = 'goget',
  GoGetHandler = 'goget-handler',
  GoMix = 'go-mix',
  GoPause = 'go-pause',
  GoPeek = 'go-peek',
  GoPlay = 'go-play',
  GoPlayList = 'go-playlist',
  GoPlayNext = 'go-play-next',
  GoSearch = 'go-search',
  GoShuffle = 'go-shuffle',
  GoSkip = 'go-skip',
  GoStop = 'go-stop',
  InteractionCreate = 'interaction-create',
  LastFm = 'last-fm',
  LegacyHandler = 'legacy-handler',
  Loader = 'loader',
  LocalTrack = 'local-track',
  MessageCreate = 'message-create',
  MixDebugger = 'mix-debug',
  Mixer = 'mixer',
  MusicPlayer = 'music-player',
  PlayHandler = 'play-handler',
  PlaylistMenu = 'playlist-menu',
  Plex = 'plex',
  Queue = 'queue',
  Search = 'search',
  SearchSchemes = 'search-schemes',
  WideSearch = 'wide-search',
  Youtils = 'youtils',
  YoutubeListing = 'youtube-listing',
  YoutubeTrack = 'yt-track',
  AliasHandler = 'alias-handler',
  CustomAlias = 'custom-alias',
  PlayerCache = 'player-cache',
  ParsedMessage = 'parsed-message',
}

const LogSourceColors: Record<LogSources, chalk.Chalk> = {
  'artist-button': chalk.magentaBright,
  'button-handler': chalk.blue,
  'custom-alias': chalk.blueBright,
  'cmd-deploy': chalk.green,
  'cmd-register': chalk.yellow,
  'db-con': chalk.cyan,
  'db-debug': chalk.green,
  'go-alias': chalk.magenta,
  'go-mix': chalk.greenBright,
  'go-pause': chalk.magenta,
  'go-peek': chalk.magentaBright,
  'go-play-next': chalk.cyanBright,
  'go-play': chalk.blue,
  'go-playlist': chalk.green,
  'go-search': chalk.yellow,
  'go-shuffle': chalk.magenta,
  'go-skip': chalk.magentaBright,
  'go-stop': chalk.blue,
  'goget-handler': chalk.magenta,
  'interaction-create': chalk.green,
  'last-fm': chalk.magentaBright,
  'legacy-handler': chalk.green,
  'local-track': chalk.blueBright,
  'message-create': chalk.yellow,
  'mix-debug': chalk.blueBright,
  'music-player': chalk.magentaBright,
  'play-handler': chalk.green,
  'playlist-menu': chalk.yellow,
  'search-schemes': chalk.blue,
  'web-server': chalk.magenta,
  'wide-search': chalk.magenta,
  'youtube-listing': chalk.magentaBright,
  'cmd-handler': chalk.blue,
  'yt-track': chalk.cyanBright,
  'alias-handler': chalk.cyan,
  'player-cache': chalk.magentaBright,
  'parsed-message': chalk.yellow,
  analytics: chalk.cyanBright,
  app: chalk.blue,
  client: chalk.magenta,
  debugger: chalk.yellow,
  goget: chalk.magenta,
  loader: chalk.yellow,
  mixer: chalk.cyanBright,
  plex: chalk.magenta,
  queue: chalk.blue,
  search: chalk.green,
  youtils: chalk.yellow,
}

export { logger as GolemLogger, LogSources }
