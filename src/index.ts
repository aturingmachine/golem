import { NestFactory } from '@nestjs/core'
import { AppModule } from './application.module'
import { CommandService } from './commands/register-commands'
import { GolemConf } from './config'
import { DatabaseService } from './db/database.service'
import { GolemBot } from './golem'
import { GolemLogger } from './logger/logger.service'

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule)
  // application logic...
  const logger = app.get(GolemLogger)
  logger.setContext('bootstrap')

  logger.info('Bootstrapping')

  const config = app.get(GolemConf)
  config.init()

  app.useLogger(logger)

  const database = app.get(DatabaseService)
  logger.info('Getting DB Service and connecting')
  await database.connect()
  logger.info('DB Connected')

  // TODO
  logger.info('Registering Commands')
  const commandService = app.get(CommandService)
  commandService.registerCommands()

  if (config.options.NoRun) {
    logger.info('NoRun set - exiting')
    process.exit(0)
  }

  logger.info('Grabbing bot instance')
  const golemBot = app.get(GolemBot)
  logger.info('Running bot initialization')

  await golemBot.initialize()

  await golemBot.login()

  // TODO
  // if (config.modules.Web) {
  //   startApi()
  // }

  // golemBot.debugger.start()

  // if (config.options.TTY) {
  //   golemBot.debugger.setPrompt()
  //   golemBot.debugger.listen()
  // }
}

// TODO
function shutdownHandler(): void {
  // GolemLogger?.info('running shutdown handler', { src: 'main' }) ||
  //   console.log('running shutdown handler')

  // try {
  //   Golem.playerCache.disconnectAll()
  // } catch (error) {
  //   console.error('couldnt disconnect all golem connections', error)
  // }

  // GolemLogger?.info('logging out', { src: 'main' }) ||
  //   console.log('logging client out')

  // Golem.client.destroy()
  return
}

process.once('exit', shutdownHandler)
// process.once('uncaughtException', () => {
//   if (GolemConf.crashHandler) {
//     execSync(GolemConf.crashHandler)
//   }
// })
process.once('SIGINT', () => process.exit(1))

bootstrap()
