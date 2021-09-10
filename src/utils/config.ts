import { config } from 'dotenv'
config()

export class Config {
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
