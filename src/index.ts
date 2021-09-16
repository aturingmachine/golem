import { Golem } from './golem'
import { opts } from './utils/config'

const main = async (): Promise<void> => {
  await Golem.initialize()

  await Golem.login()

  if (opts.debug) {
    Golem.debugger.openPrompt()
  }
}

main()
