import { Golem } from './golem'
import { opts } from './utils/config'

const main = async (): Promise<Golem> => {
  const golem = new Golem()

  await golem.initialize()

  if (opts.debug) {
    golem.debugger.openPrompt()
  }

  await golem.login()

  return golem
}

let GolemBot: Golem

main().then((bot) => {
  GolemBot = bot
})

export { GolemBot }
