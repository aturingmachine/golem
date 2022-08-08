import { ModuleRef } from '@nestjs/core'
import { GolemCommand } from '..'
import { CommandNames } from '../../constants'
import { LoggerService } from '../../core/logger/logger.service'
import { GolemMessage } from '../../messages/golem-message'
import { ParsedCommand } from '../../messages/parsed-command'
import { RawReply } from '../../messages/replies/raw'
import { ListingSearcher } from '../../music/library/searcher.service'
import { PlayerService } from '../../music/player/player.service'
import { LocalTrack } from '../../music/tracks/track'

const goplay = new GolemCommand({
  services: {
    log: LoggerService,
    playerService: PlayerService,
    search: ListingSearcher,
  },
  logSource: 'go-play',
  async handler(
    ref: ModuleRef,
    interaction: GolemMessage,
    source: ParsedCommand
  ): Promise<boolean> {
    this.services.log.setMessageContext(interaction, 'GoPlay')

    try {
      this.services.log.info('Attempting to get player')
      const player = await this.services.playerService.getOrCreate(interaction)
      this.services.log.info('Got player?')

      if (!player) {
        this.services.log.warn(
          `unable to create player for guild: ${interaction.info.guild?.name} channel: ${interaction.info.voiceChannel?.name}`
        )
        return false
      }

      const query = source.getString('query')

      if (!query) {
        player?.unpause()
        interaction._replies.add(new RawReply('Unpausing!'))
        return true
      }

      // TODO handle YT Plays
      // TODO handle wide and artist queries

      const searchResult = this.services.search.search(query)

      if (!searchResult) {
        return true
      }

      player.enqueue(
        new LocalTrack(searchResult.listing, interaction.info.userId)
      )

      interaction._replies.add(new RawReply('Should have played?'))

      return true
    } catch (error) {
      return false
    }
  },
  info: {
    name: CommandNames.Base.play,
    description: {
      long: 'Play a Local Track retrieved via searching for the provided query, a YouTube track retrievied via YouTube search if the Local Track search misses; A YouTube Track from a provided absolute url; A YouTube playlist from a provided absolute YouTube Playlist URL.',
      short:
        'Search for and play a track. Will search youtube if query returns no local results.',
    },
    args: [
      {
        type: 'string',
        name: 'query',
        description: {
          long: 'If a string is provided the argument is interpreted as a search query. First searching the Local Libraries, if no Local Track is found the query is then run against YouTube - taking the first result as the track to play. If a Youtube link is provided it will be played - if the link is a playlist it will have the first 20 tracks shuffled and queued. This number can be modified using the extended argument `limit=20`.',
          short:
            'The track to search for and play|A YouTube video/playlist URL to play.',
        },
        required: true,
      },
    ],
    examples: {
      legacy: [
        '$go play twice tt',
        '$go play <youtube url>',
        '$go play <youtube playlist url>',
      ],
      slashCommand: [
        '/goplay twice tt',
        '/goplay <youtube url>',
        '/goplay <youtube playlist url>',
      ],
    },
    // requiredModules: {
    //   oneOf: [GolemModule.Music, GolemModule.Youtube],
    // },
    alias: 'play',
    extendedArgs: [
      {
        key: 'limit',
        type: 'number',
        description:
          'Requires a YouTube playlist - Override the default fetch limit of 20',
      },
      {
        key: 'shuffle',
        type: 'boolean',
        description:
          'Requires a YouTube playlist - Shuffle the tracks pulled from the YouTube playlist',
      },
    ],
  },
})

export default goplay
