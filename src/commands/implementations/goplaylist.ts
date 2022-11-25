import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { PlexService } from '../../integrations/plex/plex.service'
import { MessageBuilderService } from '../../messages/message-builder.service'
import { ListingLoaderService } from '../../music/local/library/loader.service'
import { PlayerService } from '../../music/player/player.service'
import { LocalTrack } from '../../music/tracks/local-track'
import { ArrayUtils } from '../../utils/list-utils'
import { GolemModule } from '../../utils/raw-config'

export default new GolemCommand({
  logSource: 'GoPlaylist',

  services: {
    log: LoggerService,
    players: PlayerService,
    plex: PlexService,
    loader: ListingLoaderService,
    builder: MessageBuilderService,
  },

  async handler({ message, source }): Promise<boolean> {
    this.services.log.setMessageContext(message, this.options.logSource)

    const playlistName = source.getString('playlist')
    const player = await this.services.players.getOrCreate(message)

    if (!player) {
      this.services.log.error(
        `unable to create player for guild: ${message.info.guild?.name}`
      )

      await message.addReply(
        'Unable to create a music player. Contact my admin.'
      )

      return false
    }

    // TODO Handle the Playlist Dropdown Case

    if (playlistName) {
      const targetPlaylist = this.services.plex.playlists.find(
        (playlist) => playlist.name.toLowerCase() === playlistName.toLowerCase()
      )

      if (!targetPlaylist) {
        await message.addReply(
          `I couldn't find a playlist named "${playlistName}".`
        )

        return false
      }

      let listings = targetPlaylist.tracks
        .map((t) =>
          this.services.loader.records.find(
            (rec) => rec._id.toString() === t.id
          )
        )
        .filter(ArrayUtils.isDefined)

      if (source.extendedArgs.shuffle) {
        this.services.log.debug(`shuffling prior to play`)
        listings = ArrayUtils.shuffleArray(listings)
      }

      await message.addReply(
        `Queueing **${listings.length}** tracks from playlist **${targetPlaylist.name}**`
      )

      await message.addReply(
        this.services.builder.nowPlaying(message, listings[0])
      )

      await this.services.players.playMany(
        message,
        player,
        listings.map((listing) => new LocalTrack(listing, message.info.userId))
      )

      return true
    }

    return false
  },

  info: {
    name: CommandNames.Base.playlist,
    description: {
      long: 'Play a given playlist by name. Presents a select of all playlists if no playlist name is provided. Requires enabling the Plex module and a local Plex Media Server.',
      short: 'Play a given playlist or choose one from a select menu.',
    },
    args: [
      {
        type: 'string',
        name: 'playlist',
        description: {
          short: 'The name of the playlist to queue.',
        },
        required: false,
      },
    ],
    examples: {
      legacy: ['$go playlist my-playlist', '$go playlist'],
      slashCommand: ['/goplaylist my-playlist', '/goplaylist'],
    },
    requiredModules: {
      all: [GolemModule.Plex, GolemModule.LocalMusic],
    },
  },
})
