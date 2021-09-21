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
  LastFm: {
    APIKey: string
  }
  Web: {
    APIPort: number
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
        path.resolve(__dirname, '../../plex-logo.png'),
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

  static get LastFm(): ConfigValues['LastFm'] {
    return {
      APIKey: process.env.LAST_FM_API_KEY || '',
    }
  }

  static get Web(): ConfigValues['Web'] {
    return {
      APIPort: process.env.WEB_SERVER_PORT
        ? parseInt(process.env.WEB_SERVER_PORT, 10)
        : 3000,
    }
  }
}

const cliArgs = process.argv.slice(2)

export const opts = {
  debug: cliArgs.includes('debug'),
  get tty(): boolean {
    return ['tty', ' -i '].some((o) => cliArgs.includes(o))
  },
  noRun: cliArgs.includes('noRun'),
  get bustCache(): boolean {
    return ['bust-cache', 'cache-bust', 'bust', 'refresh'].some((o) =>
      cliArgs.includes(o)
    )
  },
  verbose: cliArgs.includes('verbose'),
  loadTest: cliArgs.includes('load-test'),
  get logLevel(): string {
    const isDebug =
      cliArgs.includes('debug') || cliArgs.includes('verbose') || this.tty
    return isDebug ? 'debug' : 'info'
  },
  noPlex: cliArgs.includes('no-plex'),
  skipClient: cliArgs.includes('no-client'),
}
