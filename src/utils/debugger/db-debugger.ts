import mongoose from 'mongoose'
import { BotInteractionData } from '../../analytics/models/interaction'
import { PlayRecordData } from '../../analytics/models/play-record'
import { LibIndexData } from '../../models/db/lib-index'
import { ListingData } from '../../models/db/listing'
import { GolemLogger, LogSources } from '../logger'

const log = GolemLogger.child({ src: LogSources.DBDebug })

export class PryQuery {
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
        .split(/(?<!"[A-z0-9]*[^ ])\s/)
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

export async function pryDatabase(cmd: string): Promise<void> {
  const query = new PryQuery(cmd)
  let targetModel: typeof mongoose.Model | undefined = undefined

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
    case 'plays':
      targetModel = PlayRecordData
    default:
      break
  }

  if (!!targetModel) {
    if (query.describe) {
      log.verbose(
        '\n'.concat(
          Object.entries(targetModel.schema.paths)
            .map(([key, value]) => `${key}=>${value.instance}`)
            .join('\n')
        )
      )
      return
    }

    const resultSet = await targetModel.find(query.filter)

    const results = query.fields.length
      ? resultSet.map((res) => {
          return Object.fromEntries(
            Object.entries(res._doc).filter(([key, _val]) =>
              query.fields.includes(key.toLowerCase())
            )
          )
        })
      : resultSet.map((res) => {
          return Object.fromEntries(
            Object.entries(res._doc).filter(([key, _val]) => key !== 'albumArt')
          )
        })

    console.log(
      results.length
        ? results.map((r) => JSON.stringify(r)).join('\n')
        : 'No results found.'
    )
  }
}
