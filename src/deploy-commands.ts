import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v9'
import { Commands, registerCommands } from './commands'
import { Config } from './utils/config'

registerCommands()

const rest = new REST({ version: '9' }).setToken(Config.token)

;(async () => {
  try {
    const cmdJson = Array.from(Commands.values()).map((x) => x.data.toJSON())
    // console.log(cmdJson)
    const resp = await rest.put(
      Routes.applicationGuildCommands(Config.clientId, Config.guildId),
      {
        body: cmdJson,
      }
    )

    console.log('Successfully registered application commands.')
    console.log(resp)
  } catch (error) {
    console.error(error)
  }
})()
