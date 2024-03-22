import { ErrorReply } from './error-reply'
import { ArtistQueryReply } from './interactive/artist-query'
import { ListingReply } from './listing-reply'
import { NowPlayingReply } from './now-playing'
import { PermissionChangeReply } from './permissions-change'
import { PreformattedReply } from './preformatted'
import { QueueReply } from './queue'
import { RawReply } from './raw'
import { SearchReply } from './search-reply'
import { YoutubePlaylistReply } from './youtube-playlist-reply'

export enum ReplyType {
  NowPlaying = 'NowPlaying',
  Raw = 'Raw',
  Search = 'Search',
  Listing = 'Listing',
  Queue = 'Queue',
  YoutubePlaylist = 'YoutubePlaylist',
  Preformatted = 'Preformatted',
  PermissionChanged = 'PermissionChanged',
  RawError = 'RawError',

  ArtistQuery = 'ArtistQuery',
}

export type Replies =
  | NowPlayingReply
  | SearchReply
  | RawReply
  | ListingReply
  | PermissionChangeReply
  | ArtistQueryReply
  | ErrorReply
  | PreformattedReply
  | QueueReply
  | YoutubePlaylistReply
