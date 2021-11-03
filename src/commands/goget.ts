import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { GoGet } from '../handlers/go-get-handler'
import { Command } from '../models/commands'
import { LogSources } from '../utils/logger'

const execute = async (
  interaction: CommandInteraction | Message,
  arg?: string
): Promise<void> => {
  let value = arg || ''

  if (interaction instanceof CommandInteraction) {
    value = interaction.options.getString('value', false) || ''
  }

  const response = await GoGet.it({ value, guildId: interaction.guildId })

  if (value === 'catalog') {
    // const snippet = new MessageAttachment(
    //   Buffer.from(response, 'utf-8'),
    //   'catalog.txt'
    // )
    // await interaction.reply({ content: 'Current Catalog:', files: [snippet] })
  } else {
    await interaction.reply(response)
  }
}

const goget = new Command({
  logSource: LogSources.GoGet,
  handler: execute,
  info: {
    name: CommandNames.get,
    description: {
      short: 'Retrieve information about the current Golem instance.',
    },
    args: [
      {
        type: 'string',
        name: 'value',
        description: {
          short: 'The property to get information about.',
        },
        required: false,
        choices: [
          { name: 'Run Time', value: 'time' },
          { name: 'Queue Count', value: 'count' },
          { name: 'Now Playing', value: 'nowplaying' },
          { name: 'Track Count', value: 'tcount' },
          { name: 'Playlists', value: 'playlists' },
          { name: 'Info', value: 'all-info' },
        ],
      },
    ],
    examples: {
      legacy: ['$go get', '$go get nowplaying', '$go get count'],
      slashCommand: ['/goget', '/goget nowplaying', '/goget count'],
    },
    requiredModules: [],
  },
})

export default goget
