import mongoose from 'mongoose'
import { Golem } from './golem'
import { GolemConf } from './utils/config'
import { startApi } from './web/server'

const main = async (): Promise<void> => {
  await Golem.initialize()

  await Golem.login()

  if (GolemConf.modules.Web) {
    startApi()
  }

  if (GolemConf.options.TTY) {
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
