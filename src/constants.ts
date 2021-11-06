import fs from 'fs'
import { ColorResolvable } from 'discord.js'
import { GolemConf } from './utils/config'

export const PlexLogo = fs.readFileSync(GolemConf.image.fallbackPath)

export const Constants = {
  baseColor: '#f900d5' as ColorResolvable,
}

export enum CommandBase {
  help = 'help',
  get = 'get',
  pause = 'pause',
  peek = 'peek',
  play = 'play',
  playNext = 'playnext',
  playlist = 'playlist',
  search = 'search',
  shuffle = 'shuffle',
  skip = 'skip',
  stop = 'stop',
  mix = 'mix',
  alias = 'alias',
}

const SlashCommands = {
  get: `go${CommandBase.get}`,
  pause: `go${CommandBase.pause}`,
  peek: `go${CommandBase.peek}`,
  play: `go${CommandBase.play}`,
  playNext: `go${CommandBase.playNext}`,
  playlist: `go${CommandBase.playlist}`,
  search: `go${CommandBase.search}`,
  shuffle: `go${CommandBase.shuffle}`,
  skip: `go${CommandBase.skip}`,
  stop: `go${CommandBase.stop}`,
  mix: `go${CommandBase.mix}`,
  alias: `go${CommandBase.alias}`,
}

export const CommandNames = {
  ...CommandBase,
  slash: {
    ...SlashCommands,
  },
  Slash(name: CommandBase): string {
    return `go${name}`
  },
}
