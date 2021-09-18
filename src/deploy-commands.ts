import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { Commands, registerCommands } from './commands'
import { Config } from './utils/config'
import { GolemLogger, LogSources } from './utils/logger'

registerCommands()

const rest = new REST({ version: '9' }).setToken(Config.Discord.Token)

;(async () => {
  try {
    for (const guildId of Config.Discord.GuildIds) {
      const cmdJson = Array.from(Commands.values()).map((x) => x.data.toJSON())
      const resp = await rest.put(
        Routes.applicationGuildCommands(Config.Discord.ClientId, guildId),
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
