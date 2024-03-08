import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { Errors } from '../../errors'
import { PlexService } from '../../integrations/plex/plex.service'
import { MessageBuilderService } from '../../messages/message-builder.service'
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
      },
    },
    create: {
      name: 'create',
      async handler({ message, source }) {
        const playlistName = source.getString('playlistname')

        if (!playlistName || playlistName === 'true') {
          throw Errors.BadArgs({
            message: 'Missing required argument for playlist name.',
            sourceCmd: 'playlist.create',
            argName: 'playlist name',
            subcommand: 'create',
            format: '$go playlist create <playlist name> [--fromQueue]',
            traceId: message.traceId,
          })
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
      },
    },
    play: {
      name: 'play',
      async handler({ message, source }) {
        const playlistName = source.getString('playlistname')

        if (!playlistName) {
          throw Errors.BadArgs({
            message: 'Missing required argument for playlist name.',
            sourceCmd: 'playlist.play',
            argName: 'playlist name',
            subcommand: 'play',
            format: '$go playlist play <playlist name>',
            traceId: message.traceId,
          })
        }

        const player = await this.services.players.getOrCreate(message)

        if (!player) {
          throw Errors.NoPlayer({
            message: `unable to create player for guild: ${message.info.guild?.name} channel: ${message.info.voiceChannel?.name}`,
            sourceCmd: 'playlist.play',
            traceId: message.traceId,
          })
        }

        const result = await this.services.playlists.hydrate({
          guildId: message.info.guildId,
          name: playlistName,
          userId: message.info.userId,
        })

        await this.services.players.playMany(message, player, result.tracks)

        // TODO proper reply here.
        // One full card for the current track, then a list of the
        // next couple tracks?
        await message.addReply(
          `Should have queued ${result.tracks.length} tracks.`
        )
      },
    },
    add: {
      name: 'add',
      async handler({ message, source }) {
        const playlistName = source.getString('playlistname')
        const query = source.getString('query')

        this.services.log.info(
          `goPlaylist:add running using playlistName="${playlistName}" query="${query}"`
        )

        if (!playlistName) {
          throw Errors.BadArgs({
            message: 'Missing required argument for playlist name.',
            sourceCmd: 'playlist.add',
            argName: 'playlist name',
            subcommand: 'add',
            format: '$go playlist add <playlist name> [search query]',
            traceId: message.traceId,
          })
        }

        let trackSource: AListing | undefined | QueryPlayResult =
          this.services.players.forGuild(message.info.guildId)?.nowPlaying
        let trackName = trackSource?.title

        let trackToAdd =
          this.services.playlists.createPlaylistListing(trackSource)

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
          throw Errors.Basic({
            message: 'Could not create listing to add to playlist.',
            sourceCmd: 'playlist.add',
            code: 104,
            traceId: message.traceId,
          })
        }

        const result = await this.services.playlists.add(
          playlistName,
          message.info.guildId,
          trackToAdd
        )

        if (!result) {
          throw Errors.NotFound({
            message: 'Could not create listing to add to playlist.',
            sourceCmd: 'playlist.add',
            identifier: playlistName,
            resource: 'playlist',
            traceId: message.traceId,
          })
        }

        await message.addReply(`Added track ${trackName} to playlist.`)
      },
    },
  },

  async handler(props) {
    const { message, source } = props
    this.services.log.setMessageContext(message, this.options.logSource)
    this.services.log.info(
      `running ${source.subCommand} ${source.getString('playlistname')}`
    )

    await this.subcommandTree.run(this, props)
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
          long: 'List all playlists available on this server. Additionaly lists any Plex playlists if the Plex Module is enabled.',
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
        name: 'play',
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
    extendedArgs: [
      {
        key: 'fromQueue',
        type: 'boolean',
        description:
          'Create a playlist from the current play queue. Useful when wanting to create a Golem Playlist from a YouTube playlist that is currently playing.',
      },
    ],
    examples: {
      legacy: ['$go playlist play my-playlist', '$go playlist list'],
      slashCommand: ['/goplaylist play my-playlist', '/goplaylist list'],
    },
    requiredModules: {
      all: [GolemModule.Plex, GolemModule.LocalMusic],
    },
  },
})
