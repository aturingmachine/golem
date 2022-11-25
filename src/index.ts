import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions } from '@nestjs/microservices'
import { AppModule } from './application.module'
import { CommandService } from './commands/commands.service'
import { ClientService } from './core/client.service'
import configuration from './core/configuration'
import { DiscordBotServer } from './core/discord-transport'
import { LoggerService } from './core/logger/logger.service'
import { PlexService } from './integrations/plex/plex.service'
import { ListingLoaderService } from './music/local/library/loader.service'
import { GolemModule } from './utils/raw-config'
import { RawConfig } from './utils/raw-config'
import { humanReadableDuration } from './utils/time-utils'

async function bootstrap() {
  const start = Date.now()
  const botServer = new DiscordBotServer()
  botServer.init()

  console.log(configuration().logLevels)

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      strategy: botServer,
      logger: configuration().logLevels,
    }
  )

  const log = await app.resolve(LoggerService)
  log.setContext('Bootstrap')
  log.info('Bootstrapping Golem...')

  log.info('Getting ConfigService')
  const config = app.get(ConfigService)
  log.info('Getting ClientService')
  const clientService = app.get(ClientService)

  if (RawConfig.hasLocalMusicModule) {
    log.info('Getting ListingLoaderService')
    const loader = app.get(ListingLoaderService)
    log.info('Loading Listings')
    await loader.load()
  } else {
    log.info('LocalMusicModule not enabled.')
  }

  if (RawConfig.modules.includes(GolemModule.Plex)) {
    log.info('Getting PlexService')
    const plexService = app.get(PlexService)
    log.info('Got PlexService')

    await plexService.loadPlaylists()
  } else {
    log.info('PlexModule not loaded.')
  }

  log.info('Logging in...')
  const id = await botServer.login(config.get('discord.token'))
  log.info(`Logged in as ${id}`)

  log.debug('Injecting client instance to container')
  clientService.client = botServer.client
  log.debug('Client instance injected')

  const commandService = app.get(CommandService)

  await commandService.registerCommands()

  const end = Date.now()
  log.debug(`bootstrap lasted ${humanReadableDuration((end - start) / 1000)}`)

  await app.listen()
  // const app = await NestFactory.createApplicationContext(AppModule)
  // // application logic...
  // const logger = app.get(GolemLogger)
  // logger.setContext('bootstrap')
  // logger.info('Bootstrapping')
  // const config = app.get(GolemConf)
  // config.init()
  // app.useLogger(logger)
  // const database = app.get(DatabaseService)
  // logger.info('Getting DB Service and connecting')
  // await database.connect()
  // logger.info('DB Connected')
  // // TODO
  // logger.info('Registering Commands')
  // const commandService = app.get(CommandService)
  // commandService.registerCommands()
  // if (config.options.NoRun) {
  //   logger.info('NoRun set - exiting')
  //   process.exit(0)
  // }
  // logger.info('Grabbing bot instance')
  // const golemBot = app.get(GolemBot)
  // logger.info('Running bot initialization')
  // await golemBot.initialize()
  // await golemBot.login()
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
