import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { Commands, registerCommands } from './commands'
import { GolemConf } from './utils/config'
import { GolemLogger, LogSources } from './utils/logger'

registerCommands()

const rest = new REST({ version: '9' }).setToken(GolemConf.discord.token)

;(async () => {
  try {
    for (const guildId of GolemConf.discord.serverIds) {
      const cmdJson = Array.from(Commands.values()).map((x) => x.data.toJSON())
      const resp = await rest.put(
        Routes.applicationGuildCommands(GolemConf.discord.clientId, guildId),
        {
          body: cmdJson,
        }
      )

      console.log(resp)
    }
    GolemLogger.info('Application Commands Registered', {
      src: LogSources.CommandDeploy,
    })
  } catch (error) {
    console.error(error)
  }
})()
