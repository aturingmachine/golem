import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { Commands, registerCommands } from './commands'
import { Config } from './utils/config'
import { logger } from './utils/logger'

registerCommands()

const rest = new REST({ version: '9' }).setToken(Config.token)

;(async () => {
  try {
    for (const guildId of [Config.testGuildId]) {
      const cmdJson = Array.from(Commands.values()).map((x) => x.data.toJSON())
      const resp = await rest.put(
        Routes.applicationGuildCommands(Config.clientId, guildId),
        {
          body: cmdJson,
        }
      )

      console.log(resp)
    }
    logger.info('Application Commands Registered', { src: 'cmd-deploy' })
  } catch (error) {
    console.error(error)
  }
})()
