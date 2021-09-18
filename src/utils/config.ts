import path from 'path'
import { config } from 'dotenv'
config()

type ConfigValues = {
  Discord: {
    Token: string
    ClientId: string
    GuildIds: string[]
  }
  Image: {
    FallbackImagePath: string
    ColorAlg: 'sqrt' | 'dominant' | 'simple'
  }
  Plex: {
    URI: string
    AppId: string
    Username: string
    Password: string
  }
}

export class Config {
  static get LibraryPaths(): string[] {
    return process.env.LIBRARY_PATHS?.split(',') || []
  }

  static get MongoURI(): string {
    return process.env.MONGO_URI || ''
  }

  static get Discord(): ConfigValues['Discord'] {
    return {
      Token: process.env.TOKEN || '',
      ClientId: process.env.CLIENT_ID || '',
      GuildIds: process.env.SERVER_IDS?.split(',') || [],
    }
  }

  static get Image(): ConfigValues['Image'] {
    return {
      FallbackImagePath:
        process.env.IMAGE_FALLBACK_PATH ||
        path.resolve(__dirname, '../plex-logo.png'),
      ColorAlg:
        (process.env.IMAGE_COLOR_ALG as 'sqrt' | 'dominant' | 'simple') ||
        'sqrt',
    }
  }

  static get Plex(): ConfigValues['Plex'] {
    return {
      URI: process.env.PLEX_URI || '',
      AppId: process.env.PLEX_APPLICATION_ID || '',
      Username: process.env.PLEX_USERNAME || '',
      Password: process.env.PLEX_PASSWORD || '',
    }
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
  noPlex: cliArgs.includes('no-plex'),
}
