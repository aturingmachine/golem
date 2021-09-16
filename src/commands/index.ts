import fs from 'fs'
import { Collection } from 'discord.js'
import { GolemLogger, LogSources } from '../utils/logger'
import { Command } from '~/models/commands'
import goGet from './goget'
import goPause from './gopause'
import goPeek from './gopeek'
import goPlay from './goplay'
import goPlaylist from './goplaylist'
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

      GolemLogger.debug(`Registering Command ${file}`, {
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
  goShuffle,
}
