import { BadArgsError, NoSubCommandError } from './bad-args-error'
import { BasicError } from './basic-error'
import { ExistingResourceError } from './existing-resource-error'
import { NoModuleError } from './no-module-error'
import { NoPlayerError } from './no-player-error'
import { NoPrivilegesError } from './no-privileges-error'
import { NotFoundError } from './not-found-error'
import { NotOwnedError } from './not-owner-error'

export const Errors = {
  BadArgs(params: ConstructorParameters<typeof BadArgsError>[0]): BadArgsError {
    return new BadArgsError(params)
  },
  Basic(params: ConstructorParameters<typeof BasicError>[0]): BasicError {
    return new BasicError(params)
  },
  ExistingResource(
    params: ConstructorParameters<typeof ExistingResourceError>[0]
  ): ExistingResourceError {
    return new ExistingResourceError(params)
  },
  NoModule(
    params: ConstructorParameters<typeof NoModuleError>[0]
  ): NoModuleError {
    return new NoModuleError(params)
  },
  NoPlayer(
    params: ConstructorParameters<typeof NoPlayerError>[0]
  ): NoPlayerError {
    return new NoPlayerError(params)
  },
  Permissions(
    params: ConstructorParameters<typeof NoPrivilegesError>[0]
  ): NoPrivilegesError {
    return new NoPrivilegesError(params)
  },
  NotFound(
    params: ConstructorParameters<typeof NotFoundError>[0]
  ): NotFoundError {
    return new NotFoundError(params)
  },
  NotOwned(
    params: ConstructorParameters<typeof NotOwnedError>[0]
  ): NotOwnedError {
    return new NotOwnedError(params)
  },
  NoSubCommand(
    params: ConstructorParameters<typeof NoSubCommandError>[0]
  ): NoSubCommandError {
    return new NoSubCommandError(params)
  },
}
