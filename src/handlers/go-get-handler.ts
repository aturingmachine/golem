import { Golem } from '../golem'
import { MusicPlayer } from '../player/beta-music-player'
import { Plex } from '../plex'

export interface GetOptions {
  value: string | null
  guildId: string | null
}

const noPlayerMsg = 'Unable to find player.'

export class GoGet {
  static it(opts: Partial<GetOptions>): string {
    switch (opts.value?.toLowerCase()) {
      case 'time':
        return GoGet.timeResponse(Golem.getPlayer(opts.guildId || ''))
      case 'count':
        return GoGet.qCountResponse(Golem.getPlayer(opts.guildId || ''))
      case 'np':
      case 'nowplaying':
        return GoGet.npResponse(Golem.getPlayer(opts.guildId || ''))
      case 'tcount':
        return GoGet.tCountResponse(Golem.getPlayer(opts.guildId || ''))
      // case 'catalog':
      //   return GoGet.catalog
      case 'playlist':
      case 'playlists':
        return GoGet.playlists
        break
      default:
        return GoGet.stats(Golem.getPlayer(opts.guildId || ''))
    }
  }

  static timeResponse(player?: MusicPlayer): string {
    return `\n**Est. Queue Time**: ${player?.stats.hTime || noPlayerMsg}`
  }

  static qCountResponse(player?: MusicPlayer): string {
    return `\n**Queued Tracks**: ${player?.stats.count || noPlayerMsg}`
  }

  static npResponse(player?: MusicPlayer): string {
    return `\n**Now Playing**: ${player?.nowPlaying || noPlayerMsg}`
  }

  // This needs to know the channel...
  static tCountResponse(player?: MusicPlayer): string {
    return `\n**Available Tracks**: ${player?.stats.count || noPlayerMsg}`
  }

  static stats(player?: MusicPlayer): string {
    return GoGet.timeResponse(player)
      .concat(GoGet.qCountResponse(player))
      .concat(GoGet.tCountResponse(player))
      .concat(GoGet.npResponse(player))
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