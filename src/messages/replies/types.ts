import { ListingReply } from './listing-reply'
import { NowPlayingReply } from './now-playing'
import { PermissionChangeReply } from './permissions-change'
import { RawReply } from './raw'
import { SearchReply } from './search-reply'

export enum ReplyType {
  NowPlaying = 'NowPlaying',
  Raw = 'Raw',
  Search = 'Search',
  Listing = 'Listing',
  Queue = 'Queue',
  YoutubePlaylist = 'YoutubePlaylist',
  Preformatted = 'Preformatted',
  PermissionChanged = 'PermissionChanged',
}

export type Replies =
  | NowPlayingReply
  | SearchReply
  | RawReply
  | ListingReply
  | PermissionChangeReply
