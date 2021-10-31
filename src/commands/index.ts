import fs from 'fs'
import { Collection } from 'discord.js'
import { Command } from '../models/commands'
import { GolemLogger, LogSources } from '../utils/logger'
import goAlias from './goalias'
import goGet from './goget'
import goMix from './gomix'
import goPause from './gopause'
import goPeek from './gopeek'
import goPlay from './goplay'
import goPlaylist from './goplaylist'
import goPlayNext from './goplaynext'
import goSearch from './gosearch'
import goShuffle from './goshuffle'
import goSkip from './goskip'
import goStop from './gostop'

export const Commands = new Collection<string, Command>()

export const registerCommands = (): void => {
  fs.readdirSync(__dirname)
    .filter((file) => file.endsWith('.js') && !file.includes('index'))
    .forEach((file) => {
      /* eslint-disable-next-line @typescript-eslint/no-var-requires */
      const command = require(`./${file}`).default

      GolemLogger.verbose(`Registering Command ${file}`, {
        src: LogSources.CommandRegister,
      })
      // Set a new item in the Collection
      // With the key as the command name and the value as the exported module
      Commands.set(command.data.name, command)
    })
}

export const RegisteredCommands = {
  goStop,
  goGet,
  goPlay,
  goSkip,
  goPause,
  goSearch,
  goPeek,
  goPlaylist,
  goPlayNext,
  goShuffle,
  goMix,
  goAlias,
}

type CommandArg = {
  name: string
  type: string
  required: boolean
  description: string
  default?: string
}

type CommandListing = {
  cmd: Command
  name: string
  msg: string
  args: CommandArg[]
  alias?: string
}

export const _Commands: Record<string, CommandListing> = {
  stop: {
    cmd: goStop,
    name: 'stop',
    msg: 'Clears the current queue.',
    args: [],
    alias: '$stop',
  },
  get: {
    cmd: goGet,
    name: 'get',
    msg: 'Get information about the current Golem instance.',
    args: [
      {
        name: 'resource',
        type: 'string',
        required: false,
        description:
          '`time`: estimated queue time\n\t\t`count`: current queue count\n\t\t`np|nowplaying`: current playing track\n\t\t`tcount`: library size\n\t\t`playlist[s]`: list all playlists',
        default: 'Return a collection of all information.',
      },
    ],
    alias: '$np|$nowplaying',
  },
  play: {
    cmd: goPlay,
    name: 'stop',
    msg: 'Search for and play a track.',
    args: [
      {
        name: 'query',
        type: 'string',
        required: true,
        description: 'The track to search for and play.',
      },
    ],
    alias: '$play',
  },
  skip: {
    cmd: goSkip,
    name: 'skip',
    msg: 'Skip a number of tracks.',
    args: [
      {
        name: 'count',
        type: 'number',
        required: false,
        description: 'The number of tracks to skip.',
        default: '1',
      },
    ],
    alias: '$skip',
  },
  pause: {
    cmd: goPause,
    name: 'pause',
    msg: 'Pause the current playback.',
    args: [],
    alias: '$pause',
  },
  search: {
    cmd: goSearch,
    name: 'search',
    msg: 'Search for tracks, uses the same algorithm as $play.',
    args: [
      {
        name: 'query',
        type: 'string',
        required: true,
        description: 'The track to search for and play.',
      },
    ],
  },
  peek: {
    cmd: goPeek,
    name: 'peek',
    msg: 'View the top of the play queue.',
    args: [],
  },
  playlist: {
    cmd: goPlaylist,
    name: 'playlist',
    msg: 'Play a playlist sourced from a Plex server.',
    args: [
      {
        name: 'playlist',
        type: 'string',
        required: false,
        description: 'The playlist to play.',
        default: 'Returns a select of all playlists.',
      },
    ],
  },
  playnext: {
    cmd: goPlayNext,
    name: 'playnext',
    msg: 'Play a track, queues at the front of the queue. (Behind other playnext tracks).',
    args: [
      {
        name: 'query',
        type: 'string',
        required: true,
        description: 'The track to search for and play.',
      },
    ],
    alias: '$playnext',
  },
  shuffle: {
    cmd: goShuffle,
    name: 'shuffle',
    msg: 'Shuffle the queue. Keeps playnext-ed tracks in front of the main queue.',
    args: [],
  },
  mix: {
    cmd: goMix,
    name: 'mix',
    msg: 'Play tracks based off the current track or artist.',
    args: [
      {
        name: 'mix-type',
        type: 'string',
        required: false,
        description: 'Whether to mix by **track** or **artist**.',
        default: 'artist',
      },
    ],
  },
}

export function commandToString(command: CommandListing): string {
  return `
**${command.name}**${command.alias ? ' ** - ' + command.alias + '**' : ''}
  _${command.msg}_
  ${
    command.args.length
      ? command.args.map(
          (arg) =>
            `\`${arg.name}\` - ${
              arg.required ? 'required' : 'optional'
            }\n\t\t_${arg.description}_\n\t\t${
              arg.default ? '`Default: ' + arg.default + '`\n' : ''
            }`
        )
      : ''
  }`
}
