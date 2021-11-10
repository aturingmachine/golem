import mongoose from 'mongoose'
import { registerCommands } from './commands'
import { Golem } from './golem'
import { GolemConf } from './utils/config'
import { GolemLogger } from './utils/logger'
import { startApi } from './web/server'

function shutdownHandler(): void {
  GolemLogger?.info('running shutdown handler', { src: 'main' }) ||
    console.log('running shutdown handler')

  mongoose.connection.close((error) => {
    if (error) {
      console.error(`could not close connection gracefully`, error)

      mongoose.connection.close(true, () => {
        console.log('force closing connection')
      })
    }
  })

  try {
    Golem.playerCache.disconnectAll()
  } catch (error) {
    console.error('couldnt disconnect all golem connections', error)
  }

  GolemLogger?.info('logging out', { src: 'main' }) ||
    console.log('logging client out')

  Golem.client.destroy()
  return
}

const main = async (): Promise<void> => {
  GolemConf.init()

  registerCommands()

  if (GolemConf.options.NoRun) {
    console.log('NoRun set - exiting')
    process.exit(0)
  }

  await Golem.initialize()

  await Golem.login()

  if (GolemConf.modules.Web) {
    startApi()
  }

  Golem.debugger.start()

  if (GolemConf.options.TTY) {
    Golem.debugger.setPrompt()
    Golem.debugger.listen()
  }
}

process.once('exit', shutdownHandler)
process.once('SIGINT', () => process.exit(1))

main()
