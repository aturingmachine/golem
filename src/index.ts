import { writeFileSync } from 'fs'
import path from 'path'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { MicroserviceOptions } from '@nestjs/microservices'
import minimist from 'minimist'
import { AppModule } from './application.module'
import { CommandService } from './commands/commands.service'
import { ClientService } from './core/client.service'
import configuration from './core/configuration'
import { DiscordBotServer } from './core/discord-transport'
import { LoggerService } from './core/logger/logger.service'
import { PermissionsService } from './core/permissions/permissions.service'
import { PlexService } from './integrations/plex/plex.service'
import { ListingLoaderService } from './music/local/library/loader.service'
import { GolemModule } from './utils/raw-config'
import { RawConfig } from './utils/raw-config'
import { humanReadableDuration } from './utils/time-utils'

export function debugDump(...args: unknown[]): void {
  const out = path.resolve(__dirname, '../out.json')
  writeFileSync(out, JSON.stringify(args, undefined, 2), { encoding: 'utf-8' })
}

const commandLineArgs = minimist(process.argv.slice(2))

/**
 * Inject Globals
 */

console.debug = (message: any, ...optionaParams: any[]) => {
  if (!!commandLineArgs.debug) {
    console.log('[DEBUG] >', message, ...optionaParams)
  }
}

async function bootstrap() {
  const start = Date.now()
  const botServer = new DiscordBotServer()
  botServer.init()

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

    try {
      await plexService.loadPlaylists()
    } catch (error) {
      log.warn(`unable to get plex playlists... ${error}`)
    }
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

  log.debug(`Setting base permissions.`)
  const permissionService = app.get(PermissionsService)
  await permissionService.setInitial()
  log.debug(`Done setting base permissions.`)

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

// process.once('exit', shutdownHandler)
// process.once('uncaughtException', () => {
//   if (GolemConf.crashHandler) {
//     execSync(GolemConf.crashHandler)
//   }
// })
process.once('SIGINT', () => process.exit(1))

bootstrap()
