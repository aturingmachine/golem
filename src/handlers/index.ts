import { AliasHandler } from '../aliases/alias-handler'
import { PlayHandler } from '../player/play-handler'
import { GoGet } from './go-get-handler'
import { LegacyCommandHandler } from './legacy-command-handler'

export const Handlers = {
  Alias: AliasHandler,
  Play: new PlayHandler(),
  GoGet: new GoGet(),
  Legacy: new LegacyCommandHandler(),
}
