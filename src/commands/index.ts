import fs from 'fs'
import { Collection } from 'discord.js'
import { Command2 } from '../models/commands'
import { GolemLogger, LogSources } from '../utils/logger'
import goalias from './goalias'
import goget from './goget'
import gomix from './gomix'
import gopause from './gopause'
import gopeek from './gopeek'
import goplay from './goplay'
import goplaylist from './goplaylist'
import goplaynext from './goplaynext'
import gosearch from './gosearch'
import goshuffle from './goshuffle'
import goskip from './goskip'
import gostop from './gostop'

export const Commands = new Collection<string, Command2>()

export const registerCommands = (): void => {
  fs.readdirSync(__dirname)
    .filter((file) => file.endsWith('.js') && !file.includes('index'))
    .forEach((file) => {
      /* eslint-disable-next-line @typescript-eslint/no-var-requires */
      const command: Command2 = require(`./${file}`).default

      if (command.missingRequiredModules.length > 0) {
        GolemLogger.verbose(
          `skipping registering command ${
            command.options.info.name
          }; missing modules :${command.missingRequiredModules.join(', ')}`,
          {
            src: LogSources.CommandRegister,
          }
        )
      }

      GolemLogger.verbose(`registering command ${command.options.info.name}`, {
        src: LogSources.CommandRegister,
      })
      // Set a new item in the Collection
      // With the key as the command name and the value as the exported module
      Commands.set(command.slashCommand.name, command)
    })
}

export const RegisteredCommands = {
  gostop,
  goget,
  goplay,
  goskip,
  gopause,
  gosearch,
  gopeek,
  goplaylist,
  goplaynext,
  goshuffle,
  gomix,
  goalias,
}
