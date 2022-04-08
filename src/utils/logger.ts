import chalk from 'chalk'
import { v4 as uuidv4 } from 'uuid'
import winston from 'winston'
import { formatForLog } from './debug-utils'

export enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Verbose = 'verbose',
  Silly = 'silly',
}

const { combine, timestamp, colorize, printf, json, splat } = winston.format

const consoleLogFormat = printf(
  ({ level, message, timestamp, src, traceId, aux }) => {
    const d = new Date(timestamp)
    const hours = d.getHours().toString().padStart(2, '0')
    const minutes = d.getMinutes().toString().padStart(2, '0')
    const seconds = d.getSeconds().toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const year = (d.getFullYear() - 2000).toString().padStart(2, '0')

    const timeString = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`

    const srcColor = LogSourceColors[src as LogSources] || chalk.white

    const auxLog = !!aux ? ` ${formatForLog(aux)}` : ''

    const idString = !!traceId ? `[${traceId}] ` : ''

    return `${timeString} <${level}> [${srcColor(
      src
    )}] ${idString}${message}${auxLog}`
  }
)

const id = winston.format((info) => {
  info.id = uuidv4()

  return info
})

function logLevel(): LogLevel {
  let level = LogLevel.Info

  const debugLevelArgs = ['debug', '-D']
  const verboseArgs = ['verbose', '-V']
  const sillyArgs = ['silly']
  const args = process.argv.slice(2)

  let isDebug = false
  let isVerbose = false
  let isSilly = false

  args.forEach((arg) => {
    isDebug ||= debugLevelArgs.includes(arg)
    isVerbose ||= verboseArgs.includes(arg)
    isSilly ||= sillyArgs.includes(arg)
  })

  if (isDebug) {
    level = LogLevel.Debug
  }

  if (isVerbose) {
    level = LogLevel.Verbose
  }

  if (isSilly) {
    level = LogLevel.Silly
  }

  return level
}

const logger = winston.createLogger({
  level: logLevel(),
  format: combine(splat(), timestamp(), id(), json()),
  transports: [
    new winston.transports.File({
      filename: './logs/combined.log',
      maxsize: 1_000_000,
      maxFiles: 10,
      tailable: true,
    }),
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), splat(), consoleLogFormat),
    }),
  ],
})

enum LogSources {
  AdminHandler = 'admin-handler',
  AliasHandler = 'alias-handler',
  Analytics = 'analytics',
  API = 'web-server',
  App = 'app',
  ArtistButton = 'artist-button',
  BugReport = 'bugreport',
  ButtonHandler = 'button-handler',
  Client = 'client',
  CommandDeploy = 'cmd-deploy',
  CommandInteractionHandler = 'cmd-handler',
  CommandRegister = 'cmd-register',
  CustomAlias = 'custom-alias',
  DatabaseConnection = 'db-con',
  DBDebug = 'db-debug',
  Debugger = 'debugger',
  GoAdmin = 'go-admin',
  GoAlias = 'go-alias',
  GoGet = 'goget',
  GoGetHandler = 'goget-handler',
  GolemMessage = 'golem-message',
  GoMix = 'go-mix',
  GoPause = 'go-pause',
  GoPeek = 'go-peek',
  GoPermission = 'go-permission',
  GoPlay = 'go-play',
  GoPlayList = 'go-playlist',
  GoPlayNext = 'go-play-next',
  GoReport = 'go-report',
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
  ParsedMessage = 'parsed-message',
  PermissionHandler = 'permission-handler',
  PlayerCache = 'player-cache',
  PlayHandler = 'play-handler',
  PlaylistMenu = 'playlist-menu',
  Plex = 'plex',
  PresenceManager = 'presence-manager',
  Queue = 'queue',
  Search = 'search',
  SearchSchemes = 'search-schemes',
  WideSearch = 'wide-search',
  VoiceStateUpdate = 'voice-state-update',
  Youtils = 'youtils',
  YoutubeListing = 'youtube-listing',
  YoutubeTrack = 'yt-track',
}

const LogSourceColors: Record<LogSources, chalk.Chalk> = {
  'admin-handler': chalk.magenta,
  'alias-handler': chalk.cyan,
  'artist-button': chalk.magentaBright,
  'button-handler': chalk.blue,
  'cmd-deploy': chalk.green,
  'cmd-handler': chalk.blue,
  'cmd-register': chalk.yellow,
  'custom-alias': chalk.blueBright,
  'db-con': chalk.cyan,
  'db-debug': chalk.green,
  'go-admin': chalk.blueBright,
  'go-alias': chalk.magenta,
  'go-mix': chalk.greenBright,
  'go-pause': chalk.magenta,
  'go-peek': chalk.magentaBright,
  'go-permission': chalk.greenBright,
  'go-play-next': chalk.cyanBright,
  'go-play': chalk.blue,
  'go-playlist': chalk.green,
  'go-report': chalk.blue,
  'go-search': chalk.yellow,
  'go-shuffle': chalk.magenta,
  'go-skip': chalk.magentaBright,
  'go-stop': chalk.blue,
  'goget-handler': chalk.magenta,
  'golem-message': chalk.cyanBright,
  'interaction-create': chalk.green,
  'last-fm': chalk.magentaBright,
  'legacy-handler': chalk.green,
  'local-track': chalk.blueBright,
  'message-create': chalk.yellow,
  'mix-debug': chalk.blueBright,
  'music-player': chalk.magentaBright,
  'parsed-message': chalk.yellow,
  'permission-handler': chalk.magenta,
  'play-handler': chalk.green,
  'player-cache': chalk.magentaBright,
  'playlist-menu': chalk.yellow,
  'presence-manager': chalk.blue,
  'search-schemes': chalk.blue,
  'web-server': chalk.magenta,
  'wide-search': chalk.magenta,
  'voice-state-update': chalk.yellow,
  'youtube-listing': chalk.magentaBright,
  'yt-track': chalk.cyanBright,
  analytics: chalk.cyanBright,
  app: chalk.blue,
  bugreport: chalk.yellow,
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
