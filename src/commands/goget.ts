import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { GoGet } from '../utils/go-get-handler'

const data = new SlashCommandBuilder()
  .setName('goget')
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

  const response = GoGet.it(value)

  await interaction.reply({ content: response })
}

export default {
  data,
  execute,
}
