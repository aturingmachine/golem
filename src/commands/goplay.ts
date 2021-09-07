import { SlashCommandBuilder } from '@discordjs/builders'
import { Message } from 'discord.js'

const data = new SlashCommandBuilder()
  .setName('goplay')
  .setDescription('Play Something')
  .addStringOption((option) =>
    option
      .setName('query')
      .setDescription('query for a track')
      .setRequired(true)
  )

const execute = async (interaction: Message): Promise<void> => {
  await interaction.reply('Pong!')
}

export default {
  data,
  execute,
}
