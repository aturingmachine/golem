import { AliasHandler } from '../aliases/alias-handler'
import { PermissionHandler } from '../permissions/permission-handler'
import { PlayHandler } from '../player/play-handler'
import { GoGet } from './go-get-handler'

export const Handlers = {
  Alias: AliasHandler,
  Play: new PlayHandler(),
  GoGet: new GoGet(),
  Permissions: PermissionHandler,
}
