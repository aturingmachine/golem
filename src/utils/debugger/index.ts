import chalk from 'chalk'
import winston from 'winston'
import { GolemConf } from '../../config'
import { Golem } from '../../golem'
import { GoGet } from '../../handlers/go-get-handler'
import { Youtube } from '../../integrations/youtube/youtils'
import { GolemLogger, LogSources } from '../logger'
import { GolemRepl } from './golem-repl'
import { MixDebugger } from './mix-debugger'
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const rl = require('serverline')

enum DebugCommands {
  Exit = 'exit',
  Kill = 'kill',
  Inspect = 'inspect',
  Pry = 'pry',
  Connections = 'conns',
  Stats = 'stats',
  Exec = 'exec',
  Similar = 'sim',
  Youtube = 'yt',
  Search = 'search',
}

const debuggerCompletions = [
  'exit',
  'kill',
  'inspect',
  'pry',
  'conns',
  'exec',
  'sim',
  'sim a',
  'sim artist',
  'sim t',
  'sim track',
  'search',
]

export class Debugger {
  log: winston.Logger
  state: 'open' | 'closed'
  repl: GolemRepl

  constructor() {
    this.log = GolemLogger.child({ src: LogSources.Debugger })
    this.state = 'closed'
    this.repl = new GolemRepl()
  }

  start(): void {
    rl.init({ forceTerminalContext: true })
    rl.setPrompt('')
    rl.setCompletion([...debuggerCompletions, ...GolemRepl.completions])
  }

  setPrompt(): void {
    this.state = 'open'
    rl.setPrompt(`${chalk.bgRed('DEBUG >')} `)
  }

  listen(): void {
    rl.on('line', async (msg: string) => {
      await this.handleDebugCommand(msg)
    })

    rl.on('completer', (arg: any) => {
      const root = arg.hits.sort(
        (a: string, b: string) => a.length - b.length
      )[0]

      if (
        root?.length &&
        arg.hits.every((hit: string) => hit.startsWith(root))
      ) {
        rl.getRL().cursor = 0
        rl.getRL().line = '\x1B[0K'
        rl.getRL().cursor = root.length
        rl.getRL().line = root
      }
    })
  }

  resume(): void {
    this.state = 'open'
  }

  closePrompt(): void {
    rl.setPrompt('')
    this.state = 'closed'
  }

  async handleDebugCommand(cmd: string): Promise<void> {
    if (this.state === 'closed') {
      if (cmd === 'pry') {
        this.resume()
        return
      }
      return
    }

    switch (cmd.toLowerCase().split(' ')[0]) {
      case DebugCommands.Kill:
        this.log.verbose('removing an aleph')
        process.exit(2)
      case DebugCommands.Exit:
        this.log.verbose('closing debug console')
        this.closePrompt()
        break
      case DebugCommands.Pry:
        this.setPrompt()
        rl.resume()
        break
      case DebugCommands.Youtube:
        const result = await Youtube.search(cmd.split(' ').slice(1).join(' '))
        console.log(result)
        break
      case DebugCommands.Stats:
        const id =
          cmd.split(' ')[1] || Golem.playerCache.keys().next().value || ''

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
          `\n${Object.entries(GolemConf.options)
            .map(([key, val]) => `${key}=${val}`)
            .join('\n')}`
        )
        break
      case DebugCommands.Connections:
        let conns = ''
        const it = Golem.playerCache.entries()
        let next = it.next()

        while (!next.done) {
          conns = conns.concat(`${next.value[0]} => ${next.value[1]}\n`)
          next = it.next()
        }

        console.log(conns)
        break
      case DebugCommands.Exec:
        // eval(cmd.split(' ').slice(1).join(' '))
        break
      case DebugCommands.Similar:
        MixDebugger.debug(cmd)
        break
      case DebugCommands.Search:
        const res = Golem.trackFinder.search(cmd)
        if (res) {
          console.log({ ...res.listing, albumArt: undefined })
        }
        break
      default:
        await this.repl.execute(cmd)
    }
  }
}
