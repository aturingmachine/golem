import { config } from 'dotenv'
config()

export class Config {
  static get libraries(): string[] {
    return process.env.LIBRARY_PATHS?.split(',') || []
  }

  static get token(): string {
    return process.env.TOKEN || ''
  }

  static get clientId(): string {
    return process.env.CLIENT_ID || ''
  }

  static get guildIds(): string[] {
    return (process.env.SERVER_IDS || '').split(',')
  }

  static get libraryPath(): string {
    return process.env.LIBRARY_PATH || ''
  }

  static get testGuildId(): string {
    return process.env.TEST_SERVER_GUILD_ID || ''
  }

  static get plexURI(): string {
    return process.env.PLEX_URI || ''
  }

  static get plexUsername(): string {
    return process.env.PLEX_USERNAME || ''
  }

  static get plexPassword(): string {
    return process.env.PLEX_PASSWORD || ''
  }

  static get plexAppId(): string {
    return process.env.PLEX_APPLICATION_ID || ''
  }
}

const cliArgs = process.argv.slice(2)

export const opts = {
  debug: cliArgs.includes('debug'),
  noRun: cliArgs.includes('noRun'),
  bustCache: cliArgs.includes('bust-cache'),
  verbose: cliArgs.includes('verbose'),
  image: cliArgs.includes('image'),
  loadTest: cliArgs.includes('load-test'),
  logLevel:
    cliArgs.includes('debug') || cliArgs.includes('verbose') ? 'debug' : 'info',
}
