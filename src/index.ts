import { execSync } from 'child_process'
import { writeFileSync } from 'fs'
import path from 'path'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './application.module'
import { ClientService } from './core/client.service'
import configuration from './core/configuration'
import { ConfigurationService } from './core/configuration.service'
import { DiscordBotServer } from './core/discord-transport'
import { InitService } from './core/init.service'
import { PlexService } from './integrations/plex/plex.service'
import { ListingLoaderService } from './music/local/library/loader.service'
import { DiscordMarkdown } from './utils/discord-markdown-builder'
import { LogUtils } from './utils/log-utils'
import { GolemModule } from './utils/raw-config'
import { RawConfig } from './utils/raw-config'
import { JobTimer } from './utils/time-utils'

export function debugDump(...args: unknown[]): void {
  const out = path.resolve(__dirname, '../out.json')
  writeFileSync(out, JSON.stringify(args, undefined, 2), { encoding: 'utf-8' })
}

async function bootstrap() {
  const job = new JobTimer('bootstrap', async () => {
    // Read in Raw Config that we may need
    ConfigurationService.init()

    // Create the Nest Application
    const app = await NestFactory.create(AppModule)
    LogUtils.setContext(app)

    const log = await LogUtils.createLogger('Bootstrap')
    const transportLogger = await LogUtils.createLogger('DiscordTransport')

    log.info('Bootstrapping Golem...')
    log.info('Configuration Read and Nest Application Created.')

    // Create a new Bot Server (a transport) and initialize it
    const botServer = new DiscordBotServer()
    botServer.init(transportLogger)

    app.enableCors({
      origin: [
        /localhost:?[0-9]*/,
        /(?:http[s]?:\/\/)?192\.168\.[0-9]+\.[0-9]+:?[0-9]*/,
      ],
    })

    console.log('Using Log levels', configuration().logLevels)

    app.connectMicroservice({
      strategy: botServer,
      logger: configuration().logLevels,
    })

    log.debug('Getting ConfigService')
    const config = app.get(ConfigService)
    log.debug('Getting ClientService')
    const clientService = app.get(ClientService)

    if (RawConfig.hasLocalMusicModule) {
      log.debug('Getting ListingLoaderService')
      const loader = app.get(ListingLoaderService)
      log.info('Loading Listings')
      await loader.load()
    } else {
      log.info('LocalMusicModule not enabled.')
    }

    if (RawConfig.modules.includes(GolemModule.Plex)) {
      log.debug('Getting PlexService')
      const plexService = app.get(PlexService)
      log.debug('Got PlexService')

      try {
        await plexService.loadPlaylists()
      } catch (error) {
        log.warn(`unable to get plex playlists... ${error}`)
      }
    } else {
      log.info('PlexModule not loaded.')
    }

    log.debug(`Getting Init Service.`)
    const initService = app.get(InitService)
    await initService.runInit(botServer)

    return {
      clientService,
      config,
      initService,
      app,
      log,
    }
  })

  const { clientService, config, initService, app, log } = await job.run()

  log.info(`Bootstrap lasted ${job.duration}`)

  // Set a handler to DM the admin on an uncaught exception.
  process.on('uncaughtException', async (err) => {
    // MongoServerSelectionError
    // console.log(err, err.name)

    // Build a message for a DM
    const message = DiscordMarkdown.start()
      .preformat(
        `
GOLEM ERROR: UNCAUGHT EXCEPTION ${new Date().toUTCString()}
-----
Error: ${err.name} - ${err.message}
STACK: ${err.stack || 'No Stack Available.'}`
      )
      .toString()

    await clientService.messageAdmin(message)

    // Use a custom crash handler if there is one
    const customHandler = config.get('crash.run')

    if (customHandler) {
      execSync(customHandler)
    }
  })

  // Run the shutdown handler on exit.
  process.once('exit', () => initService.shutdown())

  await app.startAllMicroservices()
  await app.listen(config.get('web.apiPort') || 8211)
}

// TODO
// function shutdownHandler(): void {
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
// return
// }

// process.once('exit', shutdownHandler)
// process.once('uncaughtException', () => {
//   if (GolemConf.crashHandler) {
//     execSync(GolemConf.crashHandler)
//   }
// })

process.once('SIGINT', () => process.exit(1))

bootstrap()
