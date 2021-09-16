import chalk from 'chalk'
import winston from 'winston'
import { Golem } from '../golem'
import { SearchResult } from '../player/track-finder'
import { opts } from './config'
import { GolemLogger, LogSources } from './logger'
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const rl = require('serverline')

enum DebugCommands {
  Exit = 'exit',
  Kill = 'kill',
  Inspect = 'inspect',
}

const debugLogSearchResult = (result: SearchResult) => {
  return `${result.track.longName}\nisArtistQuery=${result.isArtistQuery}\nisWide=${result.isWideMatch}`
}

export class Debugger {
  log: winston.Logger

  constructor() {
    this.log = GolemLogger.child({ src: LogSources.Debugger })
    // setInterval(() => this.log.debug('something'), 1000)
    rl.init()
  }

  openPrompt(): void {
    rl.setPrompt(`${chalk.bgYellow.black.bold('DEBUG >')} `)
    rl.on('line', this.handleDebugCommand.bind(this))
  }

  private handleDebugCommand(cmd: string): void {
    switch (cmd.toLowerCase()) {
      case DebugCommands.Kill:
        this.log.debug('killing golem bot process')
        process.exit(2)
      case DebugCommands.Exit:
        this.log.debug('closing debug console')
        break
      case DebugCommands.Inspect:
        console.log(
          `\n${Object.entries(opts)
            .map(([key, val]) => `${key}=${val}`)
            .join('\n')}`
        )
        break
      default:
        const res = Golem.trackFinder.search(cmd)
        if (res) {
          console.log(debugLogSearchResult(res))
        }
    }
  }
}
