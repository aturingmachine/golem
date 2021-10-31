import { Golem } from './golem'
import { GolemConf } from './utils/config'
import { startApi } from './web/server'

const main = async (): Promise<void> => {
  if (GolemConf.options.NoRun) {
    console.log('NoRun set - exiting')
    process.exit(0)
  }

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

function shutdown() {
  // mongoose.connection.close()

  try {
    Golem.disconnectAll()
  } catch (error) {
    console.error('couldnt disconnect all golem connections', error)
  }
}

process.once('exit', shutdown)
// process.once('SIGKILL', shutdown)
// process.once('SIGINT', shutdown)

main()
