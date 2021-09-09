import fs from 'fs'
import { Collection } from 'discord.js'
import { logger } from '../utils/logger'
import { Command } from '~/models/commands'
import goClear from './goclear'
import goGet from './goget'
import goPause from './gopause'
import goPlay from './goplay'
import goSkip from './goskip'

export const Commands = new Collection<string, Command>()

export const registerCommands = (): void => {
  fs.readdirSync(__dirname)
    .filter((file) => file.endsWith('.js') && !file.includes('index'))
    .forEach((file) => {
      /* eslint-disable-next-line @typescript-eslint/no-var-requires */
      const command = require(`./${file}`).default

      logger.debug(`Registering Command ${file}`)
      // Set a new item in the Collection
      // With the key as the command name and the value as the exported module
      Commands.set(command.data.name, command)
    })
}

export const RegisteredCommands = { goClear, goGet, goPlay, goSkip, goPause }
