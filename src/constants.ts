import fs from 'fs'
import path from 'path'
import { ColorResolvable } from 'discord.js'

export const PlexLogo = fs.readFileSync(
  path.resolve(__dirname, '../plex-logo.png')
)

export const Constants = {
  baseColor: '#f900d5' as ColorResolvable,
}

const CommandBase = {
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
}

export const CommandNames = {
  ...CommandBase,
  slash: {
    ...SlashCommands,
  },
}
