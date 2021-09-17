import mongoose from 'mongoose'
import { Golem } from './golem'
import { Config, opts } from './utils/config'

const main = async (): Promise<void> => {
  console.log(Config.libraries)
  await Golem.initialize()

  if (!opts.noRun) {
    await Golem.login()
  }

  if (opts.debug) {
    Golem.debugger.start()
    Golem.debugger.setPrompt()
    Golem.debugger.listen()
  }
}

process.on('exit', () => {
  mongoose.connection.close()
  Golem.disconnectAll()
})

main()
