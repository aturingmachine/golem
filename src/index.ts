import { execSync } from 'child_process'
import { writeFileSync } from 'fs'
import path from 'path'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './application.module'
import { ClientService } from './core/client.service'
import configuration from './core/configuration'
import { DiscordBotServer } from './core/discord-transport'
import { InitService } from './core/init.service'
import { LoggerService } from './core/logger/logger.service'
import { PlexService } from './integrations/plex/plex.service'
import { ListingLoaderService } from './music/local/library/loader.service'
import { DiscordMarkdown } from './utils/discord-markdown-builder'
import { GolemModule } from './utils/raw-config'
import { RawConfig } from './utils/raw-config'
import { humanReadableDuration } from './utils/time-utils'

export function debugDump(...args: unknown[]): void {
  const out = path.resolve(__dirname, '../out.json')
  writeFileSync(out, JSON.stringify(args, undefined, 2), { encoding: 'utf-8' })
}

async function bootstrap() {
  const start = Date.now()
  const botServer = new DiscordBotServer()
  botServer.init()

  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: [/localhost:?[0-9]*/, /192\.168\.[0-9]+\.[0-9]+:?[0-9]*/],
  })
  app.connectMicroservice({
    strategy: botServer,
    logger: configuration().logLevels,
  })

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
  log.debug(`Running Init.`)
  await initService.runInit(botServer)
  log.debug(`Init Complete.`)

  const end = Date.now()
  log.debug(`bootstrap lasted ${humanReadableDuration((end - start) / 1000)}`)

  // Set a handler to DM the admin on an uncaught exception.
  process.on('uncaughtException', async (err) => {
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
