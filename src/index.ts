import mongoose from 'mongoose'
import { Golem } from './golem'
import { opts } from './utils/config'
import { startApi } from './web/server'

const main = async (): Promise<void> => {
  await Golem.initialize()

  if (!opts.noRun) {
    await Golem.login()
  }

  if (!opts.skipClient) {
    startApi()
  }

  if (opts.tty) {
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
