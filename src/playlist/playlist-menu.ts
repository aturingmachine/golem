import {
  MessageActionRow,
  MessageOptions,
  MessageSelectMenu,
  MessageSelectOptionData,
  SelectMenuInteraction,
} from 'discord.js'
import { CommandBase } from '../constants'
import { Golem } from '../golem'
import { SelectMenuId } from '../handlers/button-handler'
import { CustomId } from '../messages/custom-id'
import { GolemMessage } from '../messages/message-wrapper'
import { NowPlayingEmbed } from '../messages/now-playing'
import { LocalTrack } from '../music/tracks/track'
import { GolemLogger, LogSources } from '../utils/logger'
import { Replier } from '../utils/replies'

export class PlaylistMenu {
  private static log = GolemLogger.child({ src: LogSources.PlaylistMenu })

  private page = 1

  constructor(public interaction: GolemMessage) {}

  async send(): Promise<void> {
    await this.interaction.reply(this.getEmbed())
  }

  getEmbed(): MessageOptions {
    const options: MessageSelectOptionData[] = Golem.plex.playlists
      .slice(0, this.offset)
      .map((playlist) => ({
        label: `${playlist.name} - ${playlist.count} Tracks`,
        value: playlist.name,
      }))

    if (Golem.plex.playlists.length > 25) {
      options.pop()
      options.push({
        label: 'Load More...',
        value: `__load-more__`,
      })
    }

    const customId = new CustomId({
      type: SelectMenuId.Playlist,
      command: CommandBase.playlist,
      args: {
        query: this.interaction.parsed.getDefault('playlist', '-'),
      },
    })

    const row = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId(customId.toString())
        .setPlaceholder('Select A Playlist')
        .addOptions(...options)
    )

    return {
      content: `Found **${Golem.plex.playlists.length}** Playlists`,
      components: [row],
    }
  }

  async collectResponse(): Promise<void> {
    if (this.interaction.lastReply) {
      await this.interaction.collector(
        {
          componentType: 'SELECT_MENU',
          time: 30_000,
        },
        this.handler.bind(this)
      )
    }
  }

  private async handler(select: SelectMenuInteraction): Promise<void> {
    if (!this.interaction.player) {
      await select.update({
        content: 'Not in a valid voice channel.',
        components: [],
      })
      return
    }

    const listName = select.values[0]

    if (listName === '__load-more__') {
      // handle load more
      this.page++
      await this.interaction.update(this.getEmbed())
      return
    }

    const playlist = Golem.plex.playlists.find((list) =>
      list.name.includes(listName)
    )

    if (playlist) {
      const listings = Golem.trackFinder.findListingsByIds(playlist?.listings)

      PlaylistMenu.log.verbose('Playlist Menu Handler: starting Player.')

      await this.interaction.player.enqueueMany(
        this.interaction.info.userId,
        LocalTrack.fromListings(listings, this.interaction.info.userId)
      )

      const nowPlaying = new NowPlayingEmbed(this.interaction)
      const options = await nowPlaying.getOptions()

      await select.update({
        ...options,
        content: `${Replier.affirmative}, I'll queue up the playlist **${listName}**`,
        components: [],
      })
    } else {
      await select.update({
        content: `Unable to find playlist ${listName}`,
        components: [],
      })
    }

    // else we have a playlist
  }

  private get offset(): number {
    return this.page * 24
  }
}
