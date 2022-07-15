import { readFileSync } from 'fs'
import path from 'path'
import { Injectable } from '@nestjs/common'
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
@Injectable()
export class GolemConf {
  private values = rawConfig()
  enabledModules = [] as GolemModule[]
  readonly cliOptions: CliOptions

  constructor() {
    this.cliOptions = new CliOptions(new Args(process.argv.slice(2)))
  }

  init(): void {
    // kill application if no required config
    if (
      !this.values.discord ||
      !this.values.discord.clientId ||
      !this.values.discord.token
    ) {
      console.error('No Discord Config found. Terminating.')
      process.exit(1)
    }

    this.enabledModules.push(GolemModule.Core)

    // check all potential optional modules
    if (!!this.values.library) {
      this.enabledModules.push(GolemModule.Music)
    }

    if (!!this.values.plex) {
      this.enabledModules.push(GolemModule.Plex)
    }

    if (!!this.values.lastfm) {
      this.enabledModules.push(GolemModule.LastFm)
    }

    if (!!this.values.web) {
      this.enabledModules.push(GolemModule.Web)
    }

    if (!!this.values.youtube) {
      this.enabledModules.push(GolemModule.Youtube)
    }
  }

  get options(): Record<CliOption, boolean> {
    return this.cliOptions.options
  }

  get modules(): Record<GolemModule, boolean> {
    return {
      Core: this.enabledModules.includes(GolemModule.Core),
      LastFm: this.enabledModules.includes(GolemModule.LastFm),
      Music: this.enabledModules.includes(GolemModule.Music),
      Plex: this.enabledModules.includes(GolemModule.Plex),
      Web: this.enabledModules.includes(GolemModule.Web),
      Youtube: this.enabledModules.includes(GolemModule.Youtube),
    }
  }

  get discord(): DiscordConfig {
    return {
      token: this.values.discord?.token || '',
      clientId: this.values.discord?.clientId || '',
      serverIds: this.values.discord?.serverIds || [],
      adminId: this.values.discord?.adminId || '',
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
      dbName: this.values.mongo?.dbName || 'golem',
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

  get search(): SearchConfig {
    return {
      forceWeightTerms: this.values.search?.forceWeightTerms || [
        'instrumental',
        'inst.',
        'live',
        'remix',
      ],
      minimumScore: this.values.search?.minimumScore || 35,
    }
  }

  get youtube(): YoutubeConfig {
    return {
      ytdlpPath: this.values.youtube?.ytdlpPath || '',
    }
  }

  get web(): WebConfig {
    return {
      apiPort: this.values.web?.apiPort || 3000,
    }
  }

  get crashHandler(): string | undefined {
    return this.values.crash?.run
  }

  get logLevel(): LogLevel {
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
