import { AliasHandler } from '../aliases/alias-handler'
import { PlayHandler } from '../player/play-handler'
import { GoGet } from './go-get-handler'

export const Handlers = {
  Alias: AliasHandler,
  Play: new PlayHandler(),
  GoGet: new GoGet(),
}
