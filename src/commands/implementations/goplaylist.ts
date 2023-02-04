import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { PlexService } from '../../integrations/plex/plex.service'
import { MessageBuilderService } from '../../messages/message-builder.service'
import { RawReply } from '../../messages/replies/raw'
import { ListingLoaderService } from '../../music/local/library/loader.service'
import { AListing } from '../../music/local/listings/listings'
import {
  PlayQueryService,
  QueryPlayResult,
} from '../../music/player/play-query.service'
import { PlayerService } from '../../music/player/player.service'
import { PlaylistService } from '../../music/playlists/playlist.service'
import { formatForLog } from '../../utils/debug-utils'
import { GolemModule } from '../../utils/raw-config'

export default new GolemCommand({
  logSource: 'GoPlaylist',

  services: {
    log: LoggerService,
    players: PlayerService,
    plex: PlexService,
    loader: ListingLoaderService,
    builder: MessageBuilderService,
    playlists: PlaylistService,
    queries: PlayQueryService,
  },

  subcommands: {
    list: {
      name: 'list',
      async handler({ message }) {
        await message.addReply(
          await this.services.playlists.list(message.info.guildId)
        )
        return true
      },
    },
    create: {
      name: 'create',
      async handler({ message, source }) {
        const playlistName = source.getString('playlistname')

        if (!playlistName || playlistName === 'true') {
          await message.addReply('Missing required argument for playlist name.')
          return false
        }

        this.services.log.debug(
          `extendedArgs? ${formatForLog(source.extendedArgs)}`
        )

        const createResult = await this.services.playlists.create({
          name: playlistName.trim(),
          fromQueue: !!source.extendedArgs?.fromQueue,
          userInfo: {
            userId: message.info.userId,
            guildId: message.info.guildId,
          },
        })

        await message.addReply(
          `Created playlist ${createResult.name} with ${createResult.listings.length} listings.`
        )

        return true
      },
    },
    test: {
      name: 'test',
      async handler({ message, source }) {
        const playlistName = source.getString('playlistname')

        if (!playlistName) {
          await message.addReply('Missing required argument for playlist name.')
          return false
        }

        const player = await this.services.players.getOrCreate(message)

        if (!player) {
          await message.addReply(`ERR: NOPLAYER`)
          return false
        }

        const result = await this.services.playlists.hydrate({
          guildId: message.info.guildId,
          name: playlistName,
          userId: message.info.userId,
        })

        // TODO proper error handling
        if (typeof result === 'number') {
          await message.addReply(`ERR: ${result}`)
          return false
        }

        await this.services.players.playMany(message, player, result.tracks)

        // TODO proper reply here.
        // One full card for the current track, then a list of the
        // next couple tracks?
        await message.addReply(
          `Should have queued ${result.tracks.length} tracks.`
        )

        return true
      },
    },
    add: {
      name: 'add',
      async handler({ message, source }) {
        const playlistName = source.getString('playlistname')
        const query = source.getString('query')

        if (!playlistName) {
          await message.addReply(`Missing required argument for playlist name.`)
          return false
        }

        let trackSource: AListing | undefined | QueryPlayResult =
          this.services.players.for(message.info.guildId)?.nowPlaying
        let trackName = trackSource?.title

        let trackToAdd =
          this.services.playlists.createPlaylistListing(trackSource)

        // If there is no query we are adding the current track
        if (!!query) {
          trackSource = await this.services.queries.process(message, query)

          if ('tracks' in trackSource) {
            trackName = trackSource.tracks[0].listing.title
            trackToAdd = this.services.playlists.createPlaylistListing(
              trackSource.tracks.pop()
            )
          }
        }

        if (!trackToAdd) {
          await message.addReply(`couldn't create listing to add.`)
          return false
        }

        const result = await this.services.playlists.add(
          playlistName,
          message.info.guildId,
          trackToAdd
        )

        if (!result) {
          await message.addReply(
            `Could not find playlist of name ${playlistName}`
          )
          return false
        }

        await message.addReply(`Added track ${trackName} to playlist.`)

        return true
      },
    },
  },

  async handler(props): Promise<boolean> {
    const { message, source } = props
    this.services.log.setMessageContext(message, this.options.logSource)
    this.services.log.info(
      `running ${source.subCommand} ${source.getString('playlistname')}`
    )

    return this.subcommandTree.run(this, props)

    if (!source.subCommand) {
      await message.addReply(
        new RawReply('Temporarily Disabling Legacy Playlist Support.')
      )

      return false
    }

    // LEGEACY
    // const playlistName = source.getString('playlist')
    // const player = await this.services.players.getOrCreate(message)

    // if (!player) {
    //   this.services.log.error(
    //     `unable to create player for guild: ${message.info.guild?.name}`
    //   )

    //   await message.addReply(
    //     'Unable to create a music player. Contact my admin.'
    //   )

    //   return false
    // }

    // // TODO Handle the Playlist Dropdown Case

    // if (playlistName) {
    //   const targetPlaylist = this.services.plex.playlists.find(
    //     (playlist) => playlist.name.toLowerCase() === playlistName.toLowerCase()
    //   )

    //   if (!targetPlaylist) {
    //     await message.addReply(
    //       `I couldn't find a playlist named "${playlistName}".`
    //     )

    //     return false
    //   }

    //   let listings = targetPlaylist.tracks
    //     .map((t) =>
    //       this.services.loader.records.find(
    //         (rec) => rec._id.toString() === t.id
    //       )
    //     )
    //     .filter(ArrayUtils.isDefined)

    //   if (source.extendedArgs.shuffle) {
    //     this.services.log.debug(`shuffling prior to play`)
    //     listings = ArrayUtils.shuffleArray(listings)
    //   }

    //   await message.addReply(
    //     `Queueing **${listings.length}** tracks from playlist **${targetPlaylist.name}**`
    //   )

    //   await message.addReply(
    //     this.services.builder.nowPlaying(message, listings[0])
    //   )

    //   await this.services.players.playMany(
    //     message,
    //     player,
    //     listings.map((listing) => new LocalTrack(listing, message.info.userId))
    //   )

    //   return true
    // }

    // return false
  },

  info: {
    name: CommandNames.Base.playlist,
    description: {
      long: 'Play a given playlist by name. Presents a select of all playlists if no playlist name is provided. Requires enabling the Plex module and a local Plex Media Server.',
      short: 'Play a given playlist or choose one from a select menu.',
    },
    subcommands: [
      {
        name: 'list',
        description: {
          long: 'List all playlists available on this server.',
          short: 'List all playlists available on this server.',
        },
        args: [],
      },
      {
        name: 'create',
        description: {
          short: 'Create a new playlist.',
        },
        args: [
          {
            type: 'string',
            name: 'playlistname',
            description: {
              short: 'The name for the new playlist.',
            },
            required: true,
          },
        ],
      },
      {
        // TODO this named 'play' breaks things?
        name: 'test',
        description: {
          short: 'Play a playlist by name.',
        },
        args: [
          {
            type: 'string',
            name: 'playlistname',
            description: {
              short: 'The playlist to play',
            },
            required: true,
          },
        ],
      },
      {
        name: 'add',
        description: {
          short: 'Add the current track or the result of a query.',
        },
        args: [
          {
            type: 'string',
            name: 'playlistname',
            description: {
              short: 'The playlist to add a track to.',
            },
            required: true,
          },
          {
            type: 'string',
            name: 'query',
            description: {
              short: 'A search term to add.',
            },
            required: false,
            rest: true,
          },
        ],
      },
    ],
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
