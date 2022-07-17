import fs from 'fs'
import path from 'path'
import { ColorResolvable } from 'discord.js'
// import { GolemConf } from './config'

export const PlexLogo = fs.readFileSync(
  path.resolve(__dirname, '../golem-logo.png')
)

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
  report = 'report',
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

export enum CollectionNames {
  LocalAlbums = 'localalbums',
  CustomAliases = 'customaliases',
  PlayRecords = 'playrecords',
  LibIndexes = 'libindexes',
  Listings = 'listings',
  Permissions = 'permissions',
}
