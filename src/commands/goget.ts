import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { GoGet } from '../handlers/go-get-handler'
import { Command, CommandHelp } from '../models/commands'

const data = new SlashCommandBuilder()
  .setName(CommandNames.slash.get)
  .setDescription(
    'Get current queue time, queue count, now playing, or total track count.'
  )
  .addStringOption((option) =>
    option
      .setName('value')
      .setDescription('one of ["time", "qcount", "nowplaying (np)", "tcount"]')
      .setRequired(false)
  )

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

const helpInfo: CommandHelp = {
  name: 'get',
  msg: 'Get information about the current Golem instance.',
  args: [
    {
      name: 'resource',
      type: 'string',
      required: false,
      description:
        'time: estimated queue time\n\t\tcount: current queue count\n\t\tnp|nowplaying: current playing track\n\t\ttcount: library size\n\t\tplaylist[s]: list all playlists',
      default: 'Return a collection of all information.',
    },
  ],
  alias: '$np|$nowplaying',
}

const goGetCommand = new Command({
  source: 'go-get',
  data,
  handler: execute,
  helpInfo,
})

export default goGetCommand
