import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { Player } from '../player/music-player'
import { logger } from '../utils/logger'

const log = logger.child({ src: 'GoSkip' })

const data = new SlashCommandBuilder()
  .setName('goskip')
  .setDescription(
    'Skip the current song in queue, stops player if last song in queue.'
  )
  .addIntegerOption((option) =>
    option
      .setName('skip-count')
      .setDescription('how many tracks to skip')
      .setRequired(false)
  )

const execute = async (
  interaction: CommandInteraction | Message,
  count?: number
): Promise<void> => {
  log.info('executing')
  let skipCount = count || 1

  if (interaction instanceof CommandInteraction) {
    skipCount = interaction.options.getInteger('skip-count') || 1
  }

  await interaction.reply('Skipping!')

  for (let i = 0; i < skipCount; i++) {
    log.debug('Attempting to skip')
    if (Player.nowPlaying !== 'No Track Playing') {
      Player.skip()
    }
  }
}

export default {
  data,
  execute,
}
