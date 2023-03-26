import { ListingReply } from './listing-reply'
import { NowPlayingReply } from './now-playing'
import { PermissionChangeReply } from './permissions-change'
import { PreformattedReply } from './preformatted'
import { QueueReply } from './queue'
import { RawReply } from './raw'
import { SearchReply } from './search-reply'
import { YoutubePlaylistReply } from './youtube-playlist-reply'

/**
 * Helper with all Reply classes
 */
export const Replies = {
  Listing(...params: ConstructorParameters<typeof ListingReply>): ListingReply {
    return new ListingReply(...params)
  },
  NowPlaying(
    ...params: ConstructorParameters<typeof NowPlayingReply>
  ): NowPlayingReply {
    return new NowPlayingReply(...params)
  },
  PermChange(
    ...params: ConstructorParameters<typeof PermissionChangeReply>
  ): PermissionChangeReply {
    return new PermissionChangeReply(...params)
  },
  Preformatted(
    ...params: ConstructorParameters<typeof PreformattedReply>
  ): PreformattedReply {
    return new PreformattedReply(...params)
  },
  Queue(...params: ConstructorParameters<typeof QueueReply>): QueueReply {
    return new QueueReply(...params)
  },
  Raw(...params: ConstructorParameters<typeof RawReply>): RawReply {
    return new RawReply(...params)
  },
  Search(...params: ConstructorParameters<typeof SearchReply>): SearchReply {
    return new SearchReply(...params)
  },
  YTPlaylist(
    ...params: ConstructorParameters<typeof YoutubePlaylistReply>
  ): YoutubePlaylistReply {
    return new YoutubePlaylistReply(...params)
  },
}
