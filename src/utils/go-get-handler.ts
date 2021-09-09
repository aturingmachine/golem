import { TrackFinder } from '../player/track-finder'
import { Player } from '../voice/voice-handler'

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
}
