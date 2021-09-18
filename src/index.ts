import mongoose from 'mongoose'
import { Golem } from './golem'
import { opts } from './utils/config'

const main = async (): Promise<void> => {
  await Golem.initialize()
  Golem.addProgress(2)

  if (!opts.noRun) {
    await Golem.login()
  }
  Golem.addProgress(3)

  if (opts.debug) {
    Golem.debugger.start()
    Golem.debugger.setPrompt()
    Golem.debugger.listen()
  }
  Golem.addProgress(5)
}

process.on('exit', () => {
  mongoose.connection.close()
  Golem.disconnectAll()
})

main()
