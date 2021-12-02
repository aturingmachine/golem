import fs from 'fs'
import { ColorResolvable } from 'discord.js'
import { GolemConf } from './config'

export const PlexLogo = fs.readFileSync(GolemConf.image.fallbackPath)

export const Constants = {
  baseColor: '#f900d5' as ColorResolvable,
}

export enum CommandBase {
  admin = 'admin',
  alias = 'alias',
  get = 'get',
  help = 'help',
  mix = 'mix',
  pause = 'pause',
  peek = 'peek',
  perms = 'perms',
  play = 'play',
  playlist = 'playlist',
  playNext = 'playnext',
  search = 'search',
  shuffle = 'shuffle',
  skip = 'skip',
  stop = 'stop',
}

export enum BuiltInAlias {
  Play = 'play',
  PlayNext = 'playnext',
  NP = 'np',
  NowPlaying = 'nowplaying',
  Stop = 'stop',
  Skip = 'skip',
  Pause = 'pause',
  Help = 'help',
}

export const CommandNames = {
  Base: {
    ...CommandBase,
  },
  Aliases: {
    ...BuiltInAlias,
  },
  Slash(name: CommandBase): string {
    return `go${name}`
  },
}
