import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { CommandNames } from '../constants'
import { Golem } from '../golem'
import { GolemLogger, LogSources } from '../utils/logger'

const log = GolemLogger.child({ src: LogSources.GoSkip })

const data = new SlashCommandBuilder()
  .setName(CommandNames.slash.skip)
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
  const player = Golem.getPlayer(interaction)

  if (!player) {
    await interaction.reply('Not in a valid voice channel')
    return
  }

  log.info('executing')
  let skipCount = count || 1

  if (interaction instanceof CommandInteraction) {
    skipCount = interaction.options.getInteger('skip-count') || 1
  }

  await interaction.reply('Skipping!')

  for (let i = 0; i < skipCount; i++) {
    log.debug('Attempting to skip')
    if (player.nowPlaying) {
      player.skip()
    }
  }
}

export default {
  data,
  execute,
}
