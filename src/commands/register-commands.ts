import fs from 'fs'
import { Collection } from 'discord.js'
import { GolemLogger, LogSources } from '../utils/logger'
import goalias from './implementations/goalias'
import goget from './implementations/goget'
import gomix from './implementations/gomix'
import gopause from './implementations/gopause'
import gopeek from './implementations/gopeek'
import goplay from './implementations/goplay'
import goplaylist from './implementations/goplaylist'
import goplaynext from './implementations/goplaynext'
import gosearch from './implementations/gosearch'
import goshuffle from './implementations/goshuffle'
import goskip from './implementations/goskip'
import gostop from './implementations/gostop'
import { GolemCommand } from '.'

export const Commands = new Collection<string, GolemCommand>()

export const registerCommands = (): void => {
  fs.readdirSync(__dirname)
    .filter((file) => file.endsWith('.js') && !file.includes('index'))
    .forEach((file) => {
      /* eslint-disable-next-line @typescript-eslint/no-var-requires */
      const command: GolemCommand = require(`./${file}`).default

      if (
        command.missingRequiredModules.all.length > 0 ||
        command.missingRequiredModules.oneOf.length > 0
      ) {
        GolemLogger.verbose(
          `skipping registering command ${
            command.options.info.name
          }; ${command.missingModulesToString()}`,
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
