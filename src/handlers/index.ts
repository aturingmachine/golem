import { GoGet } from './go-get-handler'
import { LegacyCommandHandler } from './legacy-command-handler'
import { PlayHandler } from './play-handler'

export const Handlers = {
  Play: new PlayHandler(),
  GoGet: new GoGet(),
  Legacy: new LegacyCommandHandler(),
}
