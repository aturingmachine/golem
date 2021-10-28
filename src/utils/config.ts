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
  SearchConfig,
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
export class GolemConf {
  private static values = rawJSConfig
  static enabledModules = [] as GolemModule[]
  static cliOptions = new CliOptions(new Args(process.argv.slice(2)))

  static init(): void {
    // kill application if no required config
    if (
      !GolemConf.values.discord ||
      !GolemConf.values.discord.clientId ||
      !GolemConf.values.discord.token
    ) {
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

    if (!!GolemConf.values.youtube) {
      GolemConf.enabledModules.push(GolemModule.Youtube)
    }
  }

  static get options(): Record<CliOption, boolean> {
    return GolemConf.cliOptions.options
  }

  static get logLevel(): LogLevel {
    GolemConf.init()
    return GolemConf.options.Debug || GolemConf.options.Verbose
      ? LogLevel.Debug
      : LogLevel.Info
  }

  static get modules(): Record<GolemModule, boolean> {
    return {
      Plex: GolemConf.enabledModules.includes(GolemModule.Plex),
      LastFm: GolemConf.enabledModules.includes(GolemModule.LastFm),
      Web: GolemConf.enabledModules.includes(GolemModule.Web),
      Youtube: GolemConf.enabledModules.includes(GolemModule.Youtube),
    }
  }

  static get discord(): DiscordConfig {
    return {
      token: GolemConf.values.discord?.token || '',
      clientId: GolemConf.values.discord?.clientId || '',
      serverIds: GolemConf.values.discord?.serverIds || [],
    }
  }

  static get image(): ImageConfig {
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
  }

  static get lastfm(): LastFmConfig {
    return {
      apiKey: GolemConf.values.lastfm?.apiKey || '',
    }
  }

  static get library(): LibraryConfig {
    return {
      paths: GolemConf.values.library?.paths || [],
    }
  }

  static get mongo(): MongoConfig {
    return {
      uri: GolemConf.values.mongo?.uri || '',
    }
  }

  static get plex(): PlexConfig {
    return {
      uri: GolemConf.values.plex?.uri || '',
      appId: GolemConf.values.plex?.appId || '',
      username: GolemConf.values.plex?.username || '',
      password: GolemConf.values.plex?.password || '',
    }
  }

  static get search(): SearchConfig {
    return {
      forceWeightTerms: GolemConf.values.search?.forceWeightTerms || [
        'instrumental',
        'inst.',
        'live',
        'remix',
      ],
      minimumScore: GolemConf.values.search?.minimumScore || 35,
    }
  }

  static get web(): WebConfig {
    return {
      apiPort: GolemConf.values.web?.apiPort || 3000,
    }
  }
}
