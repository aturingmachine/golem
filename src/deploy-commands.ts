import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { Commands, registerCommands } from './commands'
import { Config } from './utils/config'
import { logger } from './utils/logger'

registerCommands()

const rest = new REST({ version: '9' }).setToken(Config.token)

;(async () => {
  try {
    const cmdJson = Array.from(Commands.values()).map((x) => x.data.toJSON())
    await rest.put(
      Routes.applicationGuildCommands(Config.clientId, Config.guildId),
      {
        body: cmdJson,
      }
    )

    logger.info('Application Commands Registered')
  } catch (error) {
    console.error(error)
  }
})()
