import {
  YoutubePlaylistEmbed,
  YoutubePlaylistListing,
} from '../../music/youtube/youtube-playlist'
import { BaseReply } from './base'
import { ReplyType } from './types'

export class YoutubePlaylistReply extends BaseReply {
  type = ReplyType.YoutubePlaylist
  isUnique = false

  constructor(readonly embed: YoutubePlaylistEmbed) {
    super(embed.options)
  }

  static async fromPlaylist(
    playlist: YoutubePlaylistListing
  ): Promise<YoutubePlaylistReply> {
    const embed = await playlist.embed

    return new YoutubePlaylistReply(embed)
  }

  addDebug(debugInfo: string): void {
    this.addDebugFooter(debugInfo)
  }
}
