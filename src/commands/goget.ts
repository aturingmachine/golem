import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message, MessageAttachment } from 'discord.js'
import { CommandNames } from '../constants'
import { GoGet } from '../handlers/go-get-handler'

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

  const response = GoGet.it({ value, guildId: interaction.guildId })

  if (value === 'catalog') {
    const snippet = new MessageAttachment(
      Buffer.from(response, 'utf-8'),
      'catalog.txt'
    )

    await interaction.reply({ content: 'Current Catalog:', files: [snippet] })
  } else {
    await interaction.reply({ content: response })
  }
}

export default {
  data,
  execute,
}
