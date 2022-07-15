import { readFileSync } from 'fs'
import path from 'path'
import YAML from 'yaml'
import { LogLevel } from '../utils/logger'
import {
  ConfigurationOptions,
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
  YoutubeConfig,
} from './models'

const rawConfig: () => ConfigurationOptions = () =>
  YAML.parse(
    readFileSync(
      path.resolve(
        __dirname,
        process.env.NODE_ENV !== 'test'
          ? '../../config.yml'
          : '../../test-config.yml'
      ),
      {
        encoding: 'utf-8',
      }
    )
  )

const optFlags: Record<CliOption, string[]> = {
  TTY: ['tty', '-i'],
  BustCache: ['bust-cache', 'cache-bust', 'bust', 'refresh'],
  Verbose: ['verbose', '-V'],
  Debug: ['debug', '-D'],
  NoRun: ['noRun'],
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
      NoRun: this.args.includes(CliOption.NoRun),
    }
  }
}

export function logLevel(): LogLevel {
  let level = LogLevel.Info

  const debugLevelArgs = ['debug', '-D']
  const verboseArgs = ['verbose', '-V']
  const sillyArgs = ['silly']
  const args = process.argv.slice(2)

  let isDebug = false
  let isVerbose = false
  let isSilly = false

  args.forEach((arg) => {
    isDebug ||= debugLevelArgs.includes(arg)
    isVerbose ||= verboseArgs.includes(arg)
    isSilly ||= sillyArgs.includes(arg)
  })

  if (isDebug) {
    level = LogLevel.Debug
  }

  if (isVerbose) {
    level = LogLevel.Verbose
  }

  if (isSilly) {
    level = LogLevel.Silly
  }

  return level
}

// TODO should probably add some more extendable/complex validation pattern
export class GolemConf {
  private static values = rawConfig()
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

    GolemConf.enabledModules.push(GolemModule.Core)

    // check all potential optional modules
    if (!!GolemConf.values.library) {
      GolemConf.enabledModules.push(GolemModule.Music)
    }

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

  static get modules(): Record<GolemModule, boolean> {
    return {
      Core: GolemConf.enabledModules.includes(GolemModule.Core),
      LastFm: GolemConf.enabledModules.includes(GolemModule.LastFm),
      Music: GolemConf.enabledModules.includes(GolemModule.Music),
      Plex: GolemConf.enabledModules.includes(GolemModule.Plex),
      Web: GolemConf.enabledModules.includes(GolemModule.Web),
      Youtube: GolemConf.enabledModules.includes(GolemModule.Youtube),
    }
  }

  static get discord(): DiscordConfig {
    return {
      token: GolemConf.values.discord?.token || '',
      clientId: GolemConf.values.discord?.clientId || '',
      serverIds: GolemConf.values.discord?.serverIds || [],
      adminId: GolemConf.values.discord?.adminId || '',
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
      dbName: GolemConf.values.mongo?.dbName || 'golem',
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

  static get youtube(): YoutubeConfig {
    return {
      ytdlpPath: GolemConf.values.youtube?.ytdlpPath || '',
    }
  }

  static get web(): WebConfig {
    return {
      apiPort: GolemConf.values.web?.apiPort || 3000,
    }
  }

  static get crashHandler(): string | undefined {
    return GolemConf.values.crash?.run
  }

  static get logLevel(): LogLevel {
    return logLevel()
    // let level = LogLevel.Info

    // const debugLevelArgs = ['debug', '-D']
    // const verboseArgs = ['verbose', '-V']
    // const sillyArgs = ['silly']
    // const args = process.argv.slice(2)

    // let isDebug = false
    // let isVerbose = false
    // let isSilly = false

    // args.forEach((arg) => {
    //   isDebug ||= debugLevelArgs.includes(arg)
    //   isVerbose ||= verboseArgs.includes(arg)
    //   isSilly ||= sillyArgs.includes(arg)
    // })

    // if (isDebug) {
    //   level = LogLevel.Debug
    // }

    // if (isVerbose) {
    //   level = LogLevel.Verbose
    // }

    // if (isSilly) {
    //   level = LogLevel.Silly
    // }

    // return level
  }
}
