import chalk from 'chalk'
import { v4 as uuidv4 } from 'uuid'
import winston from 'winston'
import { opts } from './config'

const { combine, timestamp, colorize, printf, json, splat } = winston.format

const consoleLogFormat = printf(({ level, message, timestamp, src }) => {
  const d = new Date(timestamp)

  const timeString = `${d.getHours()}:${d.getMinutes()}:${d
    .getSeconds()
    .toString()
    .padStart(2, '0')}`

  const srcColor = LogSourceColors[src as LogSources] || chalk.white

  return `${timeString} <${level}> [${srcColor(src)}] ${message}`
})

const id = winston.format((info) => {
  info.id = uuidv4()

  return info
})

const logger = winston.createLogger({
  level: opts.logLevel,
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
  App = 'app',
  ArtistButton = 'artist-button',
  ButtonHandler = 'button-handler',
  Client = 'client',
  CommandDeploy = 'cmd-deploy',
  CommandRegister = 'cmd-register',
  Debugger = 'debugger',
  GoPause = 'go-pause',
  GoPeek = 'go-peek',
  GoPlay = 'go-play',
  GoPlayList = 'go-playlist',
  GoSearch = 'go-search',
  GoShuffle = 'go-shuffle',
  GoSkip = 'go-skip',
  GoStop = 'go-stop',
  GoMix = 'go-mix',
  InteractionCreate = 'interaction-create',
  LegacyHandler = 'legacy-handler',
  Loader = 'loader',
  MessageCreate = 'message-create',
  MusicPlayer = 'music-player',
  PlaylistMenu = 'playlist-menu',
  Plex = 'plex',
  Queue = 'queue',
  Search = 'search',
  WideSearch = 'wide-search',
  DatabaseConnection = 'db-con',
  Analytics = 'analytics',
  LastFm = 'last-fm',
  Mixer = 'mixer',
}

const LogSourceColors: Record<LogSources, chalk.Chalk> = {
  analytics: chalk.cyanBright,
  'artist-button': chalk.magentaBright,
  'button-handler': chalk.blue,
  'cmd-deploy': chalk.green,
  'cmd-register': chalk.yellow,
  'go-pause': chalk.magenta,
  'go-peek': chalk.magentaBright,
  'go-play': chalk.blue,
  'go-playlist': chalk.green,
  'go-search': chalk.yellow,
  'go-shuffle': chalk.magenta,
  'go-skip': chalk.magentaBright,
  'go-stop': chalk.blue,
  'interaction-create': chalk.green,
  'legacy-handler': chalk.green,
  'message-create': chalk.yellow,
  'music-player': chalk.magentaBright,
  'playlist-menu': chalk.yellow,
  'wide-search': chalk.magenta,
  app: chalk.blue,
  client: chalk.magenta,
  debugger: chalk.yellow,
  loader: chalk.yellow,
  plex: chalk.magenta,
  queue: chalk.blue,
  search: chalk.green,
  'db-con': chalk.cyan,
  'last-fm': chalk.magentaBright,
  'go-mix': chalk.greenBright,
  mixer: chalk.cyanBright,
}

export { logger as GolemLogger, LogSources }
