import { SlashCommandBuilder } from '@discordjs/builders'
import { CommandInteraction, Message } from 'discord.js'
import { Player } from '../player/music-player'
import { TrackFinder } from '../player/track-finder'
import { Plex } from '../plex'
import { logger } from '../utils/logger'
import { GetPlaylistEmbed } from '../utils/message-utils'
import { Replier } from '../utils/replies'

const log = logger.child({ src: 'GoPlaylist' })

const data = new SlashCommandBuilder()
  .setName('goplaylist')
  .setDescription('Enqueue a playlist')
  .addStringOption((option) =>
    option
      .setName('playlist')
      .setDescription('the playlist to play')
      .setRequired(false)
  )

const execute = async (
  interaction: CommandInteraction | Message,
  playlist?: string
): Promise<void> => {
  log.debug(`invoked with ${playlist}`)
  const guild = interaction.client.guilds.cache.get(interaction.guildId || '')
  const member = guild?.members.cache.get(interaction.member?.user.id || '')
  const voiceChannel = member?.voice.channel

  let listName = playlist || ''

  if (interaction instanceof CommandInteraction) {
    listName = interaction.options.getString('playlist') || ''
  }

  if (listName.length) {
    log.debug(`Attempting to find playlist`)
    const list = Plex.playlists.find((list) =>
      list.name.toLowerCase().includes(listName.toLowerCase())
    )

    if (list) {
      if (interaction.guild && voiceChannel?.id) {
        log.debug('Starting Player.')
        Player.start({
          channelId: voiceChannel?.id || '',
          guildId: interaction.guildId || '',
          adapterCreator: interaction.guild.voiceAdapterCreator,
        })

        log.debug(`Enqueuing List ${list.name}`)
        Player.enqueueMany(TrackFinder.findListingsByIds(list.listings))
        await interaction.reply(
          `${Replier.affirmative}, I'll queue up ${list.name}`
        )
      } else {
        interaction.channel?.send('Not in a valid voice channel.')
      }
    } else {
      await interaction.reply(`No playlist found with name ${listName}`)
    }
  } else {
    await interaction.reply(GetPlaylistEmbed())
  }
}

export default {
  data,
  execute,
}
