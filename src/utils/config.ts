import { config } from 'dotenv'
config()

export class Config {
  static get token(): string {
    return process.env.TOKEN || ''
  }

  static get clientId(): string {
    return process.env.CLIENT_ID || ''
  }

  static get guildId(): string {
    return process.env.TEST_SERVER_GUILD_ID || ''
  }

  static get libraryPath(): string {
    return process.env.LIBRARY_PATH || ''
  }
}

export const debug = process.argv.slice(2).includes('debug')
export const noRun = process.argv.slice(2).includes('noRun')

export const opts = {
  debug: process.argv.slice(2).includes('debug'),
  noRun: process.argv.slice(2).includes('noRun'),
  bustCache: process.argv.slice(2).includes('bust-cache'),
  verbose: process.argv.slice(2).includes('verbose'),
  image: process.argv.slice(2).includes('image'),
}
