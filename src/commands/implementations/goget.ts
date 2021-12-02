import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { Handlers } from '../../handlers'
import { GolemMessage } from '../../messages/message-wrapper'
import { LogSources } from '../../utils/logger'

const execute = async (interaction: GolemMessage): Promise<void> => {
  const value = interaction.parsed.getString('value') || ''

  const response = await Handlers.GoGet.it({
    value,
    guildId: interaction.info.guildId,
  })

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

const goget = new GolemCommand({
  logSource: LogSources.GoGet,
  handler: execute,
  info: {
    name: CommandNames.Base.get,
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
  },
})

export default goget
