import { SlashCommandBuilder } from '@discordjs/builders'
import { Message } from 'discord.js'

const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong!')

const execute = async (interaction: Message): Promise<void> => {
  await interaction.reply('Pong!')
}

export default {
  data,
  execute,
}
