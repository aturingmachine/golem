import chalk from 'chalk'
import winston from 'winston'
import { Golem } from '../../golem'
import { GoGet } from '../../handlers/go-get-handler'
import { SearchResult } from '../../player/track-finder'
import { opts } from '../config'
import { GolemLogger, LogSources } from '../logger'
import { pryDatabase } from './db-debugger'
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const rl = require('serverline')

enum DebugCommands {
  Exit = 'exit',
  Kill = 'kill',
  Inspect = 'inspect',
  DB = 'db',
  Pry = 'pry',
  Connections = 'conns',
  Stats = 'stats',
}

const debuggerCompletions = [
  'exit',
  'kill',
  'inspect',
  'pry',
  'db',
  'db listings',
  'db libindex',
  'db analytics',
  'db plays',
  'conns',
]

const debugLogSearchResult = (result: SearchResult) => {
  return `${result.track.longName}\nisArtistQuery=${result.isArtistQuery}\nisWide=${result.isWideMatch}`
}

export class Debugger {
  log: winston.Logger
  state: 'open' | 'closed'

  constructor() {
    this.log = GolemLogger.child({ src: LogSources.Debugger })
    this.state = 'closed'
  }

  start(): void {
    rl.init()
    rl.setCompletion(debuggerCompletions)
    this.state = 'open'
  }

  setPrompt(): void {
    this.state = 'open'
    rl.setPrompt(`${chalk.bgYellow.bold('DEBUG >')} `)
  }

  listen(): void {
    rl.on('line', async (msg: string) => {
      await this.handleDebugCommand(msg)
    })
  }

  closePrompt(): void {
    rl.setPrompt(' ')
    rl.pause()
    this.state = 'closed'
  }

  private async handleDebugCommand(cmd: string): Promise<void> {
    if (this.state === 'closed') {
      return
    }

    switch (cmd.toLowerCase().split(' ')[0]) {
      case DebugCommands.DB:
        await pryDatabase(cmd)
        break
      case DebugCommands.Kill:
        this.log.debug('removing an aleph')
        process.exit(2)
      case DebugCommands.Exit:
        this.log.debug('closing debug console')
        this.closePrompt()
        break
      case DebugCommands.Pry:
        this.setPrompt()
        rl.resume()
        break
      case DebugCommands.Stats:
        const id = cmd.split(' ')[1] || Golem.players.keys().next().value || ''

        console.log(
          GoGet.it({
            value: cmd
              .split(' ')
              .filter((x) => !/^[0-9]*$/.test(x))
              .join(' '),
            guildId: id,
          })
        )
        break

      case DebugCommands.Inspect:
        console.log(
          `\n${Object.entries(opts)
            .map(([key, val]) => `${key}=${val}`)
            .join('\n')}`
        )
        break
      case DebugCommands.Connections:
        let conns = ''
        const it = Golem.players.entries()
        let next = it.next()

        while (!next.done) {
          conns = conns.concat(`${next.value[0]} => ${next.value[1]}\n`)
          next = it.next()
        }

        console.log(conns)
        break
      default:
        const res = Golem.trackFinder.search(cmd)
        if (res) {
          console.log(debugLogSearchResult(res))
        }
    }
  }
}
