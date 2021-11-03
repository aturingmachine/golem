import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { GoGet } from '../handlers/go-get-handler'
import { Command2 } from '../models/commands'
import { LogSources } from '../utils/logger'

// const data = new SlashCommandBuilder()
//   .setName(CommandNames.slash.get)
//   .setDescription(
//     'Get current queue time, queue count, now playing, or total track count.'
//   )
//   .addStringOption((option) =>
//     option
//       .setName('value')
//       .addChoices([
//         ['Run Time', 'time'],
//         ['Queue Count', 'count'],
//         ['Now Playing', 'nowplaying'],
//         ['Track Count', 'tcount'],
//         ['Playlists', 'playlists'],
//         ['Info', 'all-info'],
//       ])
//       .setDescription('Retrieve information about the current Golem instance.')
//       .setRequired(false)
//   )

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

// const helpInfo: CommandHelp = {
//   name: 'get',
//   msg: 'Get information about the current Golem instance.',
//   args: [
//     {
//       name: 'resource',
//       type: 'string',
//       required: false,
//       description:
//         'time: estimated queue time\n\t\tcount: current queue count\n\t\tnp|nowplaying: current playing track\n\t\ttcount: library size\n\t\tplaylist[s]: list all playlists',
//       default: 'Return a collection of all information.',
//     },
//   ],
//   alias: '$np|$nowplaying',
// }

// const goGetCommand = new Command({
//   source: 'go-get',
//   data,
//   handler: execute,
//   helpInfo,
// })

const goget = new Command2({
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
    examples: ['$go get', '$go get nowplaying', '$go get count'],
    requiredModules: [],
  },
})

export default goget
