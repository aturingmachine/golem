import { Injectable } from '@nestjs/common'
import chalk from 'chalk'
import { GolemConf } from '../../config'
import { PlayerCache } from '../../golem/player-cache'
import { GolemLogger } from '../../logger/logger.service'
import { Youtube } from '../../music/youtube/youtils'
import { ListingFinder } from '../../search/track-finder'
import { GolemRepl } from './golem-repl'
// import { MixDebugger } from './mix-debugger'
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const rl = require('serverline')

enum DebugCommands {
  Exit = 'exit',
  Kill = 'kill',
  Inspect = 'inspect',
  Pry = 'pry',
  Connections = 'conns',
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

@Injectable()
export class Debugger {
  state: 'open' | 'closed'
  repl: GolemRepl

  constructor(
    private logger: GolemLogger,
    private config: GolemConf,
    private YouTube: Youtube,
    private playerCache: PlayerCache,
    private trackFinder: ListingFinder // private mixDebugger: MixDebugger
  ) {
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
        this.logger.verbose('removing an aleph')
        process.exit(2)
      case DebugCommands.Exit:
        this.logger.verbose('closing debug console')
        this.closePrompt()
        break
      case DebugCommands.Pry:
        this.setPrompt()
        rl.resume()
        break
      case DebugCommands.Youtube:
        const result = await this.YouTube.search(
          cmd.split(' ').slice(1).join(' ')
        )
        console.log(result)
        break

      case DebugCommands.Inspect:
        console.log(
          `\n${Object.entries(this.config.options)
            .map(([key, val]) => `${key}=${val}`)
            .join('\n')}`
        )
        break
      case DebugCommands.Connections:
        let conns = ''
        const it = this.playerCache.entries()
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
      // case DebugCommands.Similar:
      //   this.mixDebugger.debug(cmd)
      //   break
      case DebugCommands.Search:
        const res = this.trackFinder.search(cmd)
        if (res) {
          console.log({ ...res.listing, albumArt: undefined })
        }
        break
      default:
        await this.repl.execute(cmd)
    }
  }
}
