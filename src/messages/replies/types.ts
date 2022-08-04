import { NowPlayingReply } from './now-playing'
import { RawReply } from './raw'
import { SearchReply } from './search-reply'

export enum ReplyType {
  NowPlaying,
  Raw,
  Search,
}

export type Replies = NowPlayingReply | SearchReply | RawReply
