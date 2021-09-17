import chalk from 'chalk'
import mongoose from 'mongoose'
import winston from 'winston'
import { BotInteractionData } from '../analytics/models/interaction'
import { Golem } from '../golem'
import { LibIndexData } from '../models/db/lib-index'
import { ListingData } from '../models/db/listing'
import { SearchResult } from '../player/track-finder'
import { opts } from './config'
import { GolemLogger, LogSources } from './logger'
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const rl = require('serverline')

enum DebugCommands {
  Exit = 'exit',
  Kill = 'kill',
  Inspect = 'inspect',
  DB = 'db',
  Pry = 'pry',
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
]

const debugLogSearchResult = (result: SearchResult) => {
  return `${result.track.longName}\nisArtistQuery=${result.isArtistQuery}\nisWide=${result.isWideMatch}`
}

export class Debugger {
  log: winston.Logger
  private pryLock = false

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
    rl.setPrompt(`${chalk.bgYellow.black.bold('DEBUG >')} `)
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
        await this.pryDatabase(cmd)
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

  private async pryDatabase(cmd: string): Promise<void> {
    if (this.pryLock) {
      return
    }

    this.pryLock = true
    const query = new PryQuery(cmd)
    let targetModel: typeof mongoose.Model | undefined = undefined

    console.log(query.filter)

    console.log('using', query.fields)
    console.log('field length', query.fields.length)

    switch (cmd.toLowerCase().split(' ')[1]) {
      case 'listings':
        targetModel = ListingData
        break
      case 'index':
      case 'libindex':
      case 'lib':
        targetModel = LibIndexData
        break
      case 'analytics':
      case 'interactions':
        targetModel = BotInteractionData
        break
      default:
        break
    }

    if (!!targetModel) {
      if (query.describe) {
        console.log(targetModel.schema)
        return
      }

      const resultSet = await targetModel.find(query.filter).exec()

      const results = query.fields.length
        ? resultSet.map((res) => {
            return Object.fromEntries(
              Object.entries(res._doc).filter(([key, _val]) =>
                query.fields.includes(key.toLowerCase())
              )
            )
          })
        : resultSet

      console.log(results.map((r) => JSON.stringify(r)).join('\n'))
      this.pryLock = false
    }
  }
}

class PryQuery {
  raw: string

  constructor(cmd: string) {
    this.raw = cmd
  }

  get describe(): boolean {
    return this.raw.includes('describe')
  }

  get filter(): Record<string, string | number | boolean | RegExp> {
    return Object.fromEntries(
      this.getQueryPart('where')
        .split(/ +(?=(?:(?:[^"]*"){2})*[^"]*$)/g)
        .slice(1)
        .map((q) => [q.split('=')[0], new RegExp(q.split('=')[1], 'i')])
    )
  }

  get fields(): string[] {
    const sub = this.getQueryPart('select')
    return sub.length === this.raw.length
      ? []
      : sub
          .split(' ')
          .slice(1)
          .filter((field) => !['albumArt'].includes(field))
          .map((field) => {
            if (field === 'id') {
              return '_id'
            }
            return field
          })
  }

  private getQueryPart(keyword: string): string {
    return this.raw.substring(
      this.raw.indexOf(keyword),
      this.raw.indexOf(';', this.raw.indexOf(keyword)) > -1
        ? this.raw.indexOf(';', this.raw.indexOf(keyword))
        : undefined
    )
  }
}
