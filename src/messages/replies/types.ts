import { ListingReply } from './listing-reply'
import { NowPlayingReply } from './now-playing'
import { RawReply } from './raw'
import { SearchReply } from './search-reply'

export enum ReplyType {
  NowPlaying,
  Raw,
  Search,
  Listing,
}

export type Replies = NowPlayingReply | SearchReply | RawReply | ListingReply
