import { MessageOptions } from 'discord.js'
import { Golem } from '../golem'
import { MusicPlayer } from '../player/music-player'
import { Plex } from '../plex'
import { GolemLogger } from '../utils/logger'
import { GetEmbedFromListing } from '../utils/message-utils'

export interface GetOptions {
  value: string | null
  guildId: string | null
}

const noPlayerMsg = 'Unable to find player.'

export class GoGet {
  static async it(opts: Partial<GetOptions>): Promise<MessageOptions> {
    GolemLogger.debug(`Go Getting With ${opts.value} ${opts.guildId}`, {
      src: 'goget-handler',
    })
    switch (opts.value?.toLowerCase()) {
      case 'time':
        return {
          content: GoGet.timeResponse(Golem.getPlayer(opts.guildId || '')),
        }
      case 'count':
        return {
          content: GoGet.qCountResponse(Golem.getPlayer(opts.guildId || '')),
        }
      case 'np':
      case 'nowplaying':
        return await GoGet.npResponse(Golem.getPlayer(opts.guildId || ''))
      case 'tcount':
        return { content: GoGet.tCountResponse }
      // case 'catalog':
      //   return GoGet.catalog
      case 'playlist':
      case 'playlists':
        return { content: GoGet.playlists }
      default:
        return await GoGet.stats(Golem.getPlayer(opts.guildId || ''))
    }
  }

  static timeResponse(player?: MusicPlayer): string {
    return `\n**Est. Queue Time**: ${player?.stats.hTime || noPlayerMsg}`
  }

  static qCountResponse(player?: MusicPlayer): string {
    return `\n**Queued Tracks**: ${player?.stats.count || noPlayerMsg}`
  }

  static async npResponse(player?: MusicPlayer): Promise<MessageOptions> {
    if (player && player.currentResource && player.nowPlaying) {
      const assets = await GetEmbedFromListing(
        player.nowPlaying,
        player,
        'playing'
      )

      return {
        embeds: [assets.embed],
        files: assets.image ? [assets.image] : [],
      }
    } else {
      return {
        content: `\n**Now Playing**: ${
          player?.nowPlaying || 'No track currently playing.'
        }`,
      }
    }
  }

  static get tCountResponse(): string {
    return `\n**Available Tracks**: ${Golem.trackFinder.trackCount}`
  }

  static async stats(player?: MusicPlayer): Promise<MessageOptions> {
    const np = await GoGet.npResponse(player)
    return {
      content: GoGet.timeResponse(player)
        .concat(GoGet.qCountResponse(player))
        .concat(GoGet.tCountResponse),
      embeds: np.embeds || [],
      files: np.files || [],
    }
  }

  // static get catalog(): string {
  //   let longest = 0
  //   const artistCounts = TrackFinder.listings
  //     .map((listing) =>
  //       listing.artist.length < 20
  //         ? listing.artist
  //         : listing.artist.concat('...')
  //     )
  //     .reduce((prev, curr) => {
  //       longest = curr?.length > longest ? curr?.length : longest
  //       if (prev[curr] !== undefined) {
  //         prev[curr] = prev[curr] + 1
  //       } else {
  //         prev[curr] = 1
  //       }

  //       return prev
  //     }, {} as Record<string, number>)

  //   const catalog = Object.entries(artistCounts).reduce((prev, curr, index) => {
  //     const label = curr.join(': ')
  //     if (index % 3) {
  //       return prev.concat(`\n\r${centerString(longest, label)}`)
  //     } else {
  //       return prev.concat(`${centerString(longest, label)}`)
  //     }
  //   }, '')

  //   return catalog
  // }

  static get playlists(): string {
    return Plex.playlists.reduce((prev, curr) => {
      return prev.concat(`\n${curr.name} - _${curr.count} tracks_`)
    }, '**Playlists:**')
  }
}

// longest => 10
// 'hello' => 5
// padStart((longest - str.length) / 2 + str.length)
