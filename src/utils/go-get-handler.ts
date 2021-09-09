import { TrackFinder } from '../player/track-finder'
import { Player } from '../voice/voice-handler'
import { centerString } from './message-utils'

export class GoGet {
  static it(value?: string | null): string {
    switch (value?.toLowerCase()) {
      case 'time':
        return GoGet.timeResponse
      case 'count':
        return GoGet.qCountResponse
      case 'np':
      case 'nowplaying':
        return GoGet.npResponse
      case 'tcount':
        return GoGet.tCountResponse
      case 'catalog':
        return GoGet.catalog
      default:
        return GoGet.stats
    }
  }

  static get timeResponse(): string {
    return `\n**Est. Queue Time**: ${Player.stats.hTime}`
  }

  static get qCountResponse(): string {
    return `\n**Queued Tracks**: ${Player.stats.count}`
  }

  static get npResponse(): string {
    return `\n**Now Playing**: ${Player.nowPlaying}`
  }

  static get tCountResponse(): string {
    return `\n**Available Tracks**: ${TrackFinder.trackCount}`
  }

  static get stats(): string {
    return GoGet.timeResponse
      .concat(GoGet.qCountResponse)
      .concat(GoGet.tCountResponse)
      .concat(GoGet.npResponse)
  }

  // [...Array(Math.ceil(list.length / chunkSize))].map(_ => list.splice(0,chunkSize))

  static get catalog(): string {
    let longest = 0
    const artistCounts = TrackFinder.listings
      .map((listing) =>
        listing.artist.length < 20
          ? listing.artist
          : listing.artist.concat('...')
      )
      .reduce((prev, curr) => {
        longest = curr?.length > longest ? curr?.length : longest
        if (prev[curr] !== undefined) {
          prev[curr] = prev[curr] + 1
        } else {
          prev[curr] = 1
        }

        return prev
      }, {} as Record<string, number>)

    const catalog = Object.entries(artistCounts).reduce((prev, curr, index) => {
      const label = curr.join(': ')
      if (index % 3) {
        return prev.concat(`\n\r${centerString(longest, label)}`)
      } else {
        return prev.concat(`${centerString(longest, label)}`)
      }
    }, '')

    return catalog
  }
}

// longest => 10
// 'hello' => 5
// padStart((longest - str.length) / 2 + str.length)
