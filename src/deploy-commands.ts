import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { Commands, registerCommands } from './commands/register-commands'
import { GolemConf } from './config'
import { GolemLogger, LogSources } from './utils/logger'

registerCommands()

const rest = new REST({ version: '9' }).setToken(GolemConf.discord.token)

;(async () => {
  try {
    for (const guildId of GolemConf.discord.serverIds) {
      const cmdJson = Array.from(Commands.values()).map((x) =>
        x.slashCommand.toJSON()
      )
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
