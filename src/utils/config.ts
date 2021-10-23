import path from 'path'
import { config } from 'dotenv'
import {
  JSONConfig,
  CliOption,
  GolemModule,
  DiscordConfig,
  ImageConfig,
  LastFmConfig,
  LibraryConfig,
  MongoConfig,
  PlexConfig,
  WebConfig,
} from '../models/config'
import { LogLevel } from './logger'
config({ path: path.resolve(__dirname, '../../.env') })

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const rawJSConfig: JSONConfig = require(path.resolve(
  __dirname,
  '../../config.js'
))

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

// TODO should probably add some more extendable/complex validation pattern
export const GolemConf = {
  values: rawJSConfig,
  enabledModules: [] as GolemModule[],
  cliOptions: new CliOptions(new Args(process.argv.slice(2))),

  init(): void {
    // kill application if no required config
    if (!GolemConf.values.discord) {
      console.error('No Discord Config found. Terminating.')
      process.exit(1)
    }

    // check all potential optional modules
    if (!!GolemConf.values.plex) {
      GolemConf.enabledModules.push(GolemModule.Plex)
    }

    if (!!GolemConf.values.lastfm) {
      GolemConf.enabledModules.push(GolemModule.LastFm)
    }

    if (!!GolemConf.values.web) {
      GolemConf.enabledModules.push(GolemModule.Web)
    }
  },

  get options(): Record<CliOption, boolean> {
    return GolemConf.cliOptions.options
  },

  get logLevel(): LogLevel {
    GolemConf.init()
    return GolemConf.options.Debug || GolemConf.options.Verbose
      ? LogLevel.Debug
      : LogLevel.Info
  },

  get modules(): Record<GolemModule, boolean> {
    return {
      Plex: GolemConf.enabledModules.includes(GolemModule.Plex),
      LastFm: GolemConf.enabledModules.includes(GolemModule.LastFm),
      Web: GolemConf.enabledModules.includes(GolemModule.Web),
    }
  },

  get discord(): DiscordConfig {
    return {
      token: GolemConf.values.discord?.token || '',
      clientId: GolemConf.values.discord?.clientId || '',
      serverIds: GolemConf.values.discord?.serverIds || [],
    }
  },

  get image(): ImageConfig {
    return {
      fallbackPath: GolemConf.values.image?.fallbackPath || '',
      avgColorAlgorithm:
        GolemConf.values.image?.avgColorAlgorithm &&
        ['sqrt', 'dominant', 'simple'].includes(
          GolemConf.values.image?.avgColorAlgorithm
        )
          ? GolemConf.values.image.avgColorAlgorithm
          : 'sqrt',
    }
  },

  get lastfm(): LastFmConfig {
    return {
      apiKey: GolemConf.values.lastfm?.apiKey || '',
    }
  },

  get library(): LibraryConfig {
    return {
      paths: GolemConf.values.library?.paths || [],
    }
  },

  get mongo(): MongoConfig {
    return {
      uri: GolemConf.values.mongo?.uri || '',
    }
  },

  get plex(): PlexConfig {
    return {
      uri: GolemConf.values.plex?.uri || '',
      appId: GolemConf.values.plex?.appId || '',
      username: GolemConf.values.plex?.username || '',
      password: GolemConf.values.plex?.password || '',
    }
  },

  get web(): WebConfig {
    return {
      apiPort: GolemConf.values.web?.apiPort || 3000,
    }
  },
}
