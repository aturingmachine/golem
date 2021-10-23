import fs from 'fs'
import { ColorResolvable } from 'discord.js'
import { GolemConf } from './utils/config'

export const PlexLogo = fs.readFileSync(GolemConf.image.fallbackPath)

export const Constants = {
  baseColor: '#f900d5' as ColorResolvable,
}

export const CommandBase = {
  help: 'help',
  get: 'get',
  pause: 'pause',
  peek: 'peek',
  play: 'play',
  playlist: 'playlist',
  search: 'search',
  shuffle: 'shuffle',
  skip: 'skip',
  stop: 'stop',
  mix: 'mix',
}

const SlashCommands = {
  get: `go${CommandBase.get}`,
  pause: `go${CommandBase.pause}`,
  peek: `go${CommandBase.peek}`,
  play: `go${CommandBase.play}`,
  playlist: `go${CommandBase.playlist}`,
  search: `go${CommandBase.search}`,
  shuffle: `go${CommandBase.shuffle}`,
  skip: `go${CommandBase.skip}`,
  stop: `go${CommandBase.stop}`,
  mix: `go${CommandBase.mix}`,
}

export const CommandNames = {
  ...CommandBase,
  slash: {
    ...SlashCommands,
  },
}
