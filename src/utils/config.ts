import path from 'path'
import { config } from 'dotenv'
import { LogLevel } from './logger'
config({ path: path.resolve(__dirname, '../../.env') })
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const rawJSConfig: JsonConfig = require(path.resolve(
  __dirname,
  '../../config.js'
))

type DiscordConfig = {
  token: string
  clientId: string
  serverIds: string[]
}

type ImageConfig = {
  fallbackPath: string
  avgColorAlgorithm: 'sqrt' | 'dominant' | 'simple'
}

type LastFmConfig = {
  apiKey: string
}

type LibraryConfig = {
  paths: string[]
}

type MongoConfig = {
  uri: string
}

type PlexConfig = {
  uri: string
  appId: string
  username: string
  password: string
}

type WebConfig = {
  apiPort: number
}

type JsonConfig = {
  discord?: DiscordConfig
  image?: ImageConfig
  lastfm?: LastFmConfig
  library?: LibraryConfig
  mongo?: MongoConfig
  plex?: PlexConfig
  web?: WebConfig
}

enum GolemModule {
  Plex = 'Plex',
  LastFm = 'LastFm',
  Web = 'Web',
}

type Conf = {
  values: JsonConfig
  enabledModules: GolemModule[]
  validate(): void
}

export const conf: Conf = {
  values: rawJSConfig,
  enabledModules: [],
  validate(): void {
    // kill application if no required config
    if (!this.values.discord) {
      throw new Error('')
    }

    // check all potential optional modules
    if (!!this.values.plex) {
      this.enabledModules.push(GolemModule.Plex)
    }

    if (!!this.values.lastfm) {
      this.enabledModules.push(GolemModule.LastFm)
    }

    if (!!this.values.web) {
      this.enabledModules.push(GolemModule.Web)
    }
  },
}

enum CliOption {
  TTY = 'TTY',
  BustCache = 'BustCache',
  Verbose = 'Verbose',
  Debug = 'Debug',
}

const optFlags: Record<CliOption, string[]> = {
  TTY: ['tty', '-i'],
  BustCache: ['bust-cache', 'cache-bust', 'bust', 'refresh'],
  Verbose: ['verbose', '-V'],
  Debug: ['debug', '-D'],
}

class Args {
  constructor(private values: string[]) {}

  includes(opt: CliOption): boolean {
    return this.values.some((val) => optFlags[opt].some((flag) => flag === val))
  }
}

class CliOptions {
  constructor(private args: Args) {}

  get options(): Record<CliOption, boolean> {
    return {
      TTY: this.args.includes(CliOption.TTY),
      BustCache: this.args.includes(CliOption.BustCache),
      Verbose: this.args.includes(CliOption.Verbose),
      Debug: this.args.includes(CliOption.Debug),
    }
  }
}

class Configuration {
  private values = rawJSConfig
  private enabledModules: GolemModule[] = []
  private cliOptions: CliOptions

  constructor() {
    // kill application if no required config
    if (!this.values.discord) {
      console.error('No Discord Config found. Terminating.')
      process.exit(1)
    }

    this.cliOptions = new CliOptions(new Args(process.argv.slice(2)))

    // check all potential optional modules
    if (!!this.values.plex) {
      this.enabledModules.push(GolemModule.Plex)
    }

    if (!!this.values.lastfm) {
      this.enabledModules.push(GolemModule.LastFm)
    }

    if (!!this.values.web) {
      this.enabledModules.push(GolemModule.Web)
    }
  }

  get options(): Record<CliOption, boolean> {
    return this.cliOptions.options
  }

  get logLevel(): LogLevel {
    return this.options.Debug || this.options.Verbose
      ? LogLevel.Debug
      : LogLevel.Info
  }

  get modules(): Record<GolemModule, boolean> {
    return {
      Plex: this.enabledModules.includes(GolemModule.Plex),
      LastFm: this.enabledModules.includes(GolemModule.LastFm),
      Web: this.enabledModules.includes(GolemModule.Web),
    }
  }

  get discord(): DiscordConfig {
    return {
      token: this.values.discord?.token || '',
      clientId: this.values.discord?.clientId || '',
      serverIds: this.values.discord?.serverIds || [],
    }
  }

  get image(): ImageConfig {
    return {
      fallbackPath: this.values.image?.fallbackPath || '',
      avgColorAlgorithm:
        this.values.image?.avgColorAlgorithm &&
        ['sqrt', 'dominant', 'simple'].includes(
          this.values.image?.avgColorAlgorithm
        )
          ? this.values.image.avgColorAlgorithm
          : 'sqrt',
    }
  }

  get lastfm(): LastFmConfig {
    return {
      apiKey: this.values.lastfm?.apiKey || '',
    }
  }

  get library(): LibraryConfig {
    return {
      paths: this.values.library?.paths || [],
    }
  }

  get mongo(): MongoConfig {
    return {
      uri: this.values.mongo?.uri || '',
    }
  }

  get plex(): PlexConfig {
    return {
      uri: this.values.plex?.uri || '',
      appId: this.values.plex?.appId || '',
      username: this.values.plex?.username || '',
      password: this.values.plex?.password || '',
    }
  }

  get web(): WebConfig {
    return {
      apiPort: this.values.web?.apiPort || 3000,
    }
  }
}

export const GolemConf = new Configuration()

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

// const cliArgs = process.argv.slice(2)

// export const opts = {
//   debug: cliArgs.includes('debug'),
//   get tty(): boolean {
//     return ['tty', ' -i '].some((o) => cliArgs.includes(o))
//   },
//   noRun: cliArgs.includes('noRun'),
//   get bustCache(): boolean {
//     return ['bust-cache', 'cache-bust', 'bust', 'refresh'].some((o) =>
//       cliArgs.includes(o)
//     )
//   },
//   verbose: cliArgs.includes('verbose'),
//   loadTest: cliArgs.includes('load-test'),
//   get logLevel(): string {
//     const isDebug =
//       cliArgs.includes('debug') || cliArgs.includes('verbose') || this.tty
//     return isDebug ? 'debug' : 'info'
//   },
//   noPlex: cliArgs.includes('no-plex'),
//   skipClient: cliArgs.includes('no-client'),
//   service: cliArgs.includes('service'),
// }
