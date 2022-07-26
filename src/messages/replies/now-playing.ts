import { BaseReply } from './base'
import { ReplyType } from './types'

export class NowPlayingReply extends BaseReply {
  type = ReplyType.NowPlaying
  isUnique = true
}
