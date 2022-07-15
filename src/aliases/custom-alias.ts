import { ObjectId } from 'bson'
import { CustomAliasRecord } from '../db/records'
import { GolemLogger, LogSources } from '../utils/logger'
import { AAliasFunction } from './functions'
import { RandomAliasFunction } from './functions/random'
import { RandomIntFunction } from './functions/random-number'

function parseAliasFunctions(raw: string): AAliasFunction[] {
  const fns: AAliasFunction[] = []

  if (!!raw.match(RandomAliasFunction.signature)) {
    fns.push(...RandomAliasFunction.parseMatches(raw, []))
  }

  if (!!raw.match(RandomIntFunction.signature)) {
    fns.push(...RandomIntFunction.parseMatches(raw, []))
  }

  return fns
}

export class CustomAlias {
  private static log = GolemLogger.child({ src: LogSources.CustomAlias })
  private static cache: Map<string, CustomAlias[]> = new Map()

  public functions: AAliasFunction[] = []

  public _id!: ObjectId

  constructor(
    public name: string,
    public command: string,
    public args: string,
    public createdBy: string,
    public guildId: string,
    public description?: string
  ) {
    this.functions = parseAliasFunctions(this.unevaluated)
  }

  toString(): string {
    return `name=${this.name}; command=${this.command}; args=${this.args}`
  }

  get helpString(): string {
    return `\t${this.name}\n\t\t${
      this.description ? ' -' + this.description : this.unevaluated
    }`
  }

  get evaluated(): string {
    return this.functions.reduce((prev, curr) => {
      return prev.replace(curr.evalString, curr.run())
    }, this.unevaluated)
  }

  get unevaluated(): string {
    return `${this.command} ${this.args.trimStart()}`.trimStart()
  }

  static fromRecord(record: CustomAliasRecord): CustomAlias {
    const alias = new CustomAlias(
      record.name,
      record.command,
      record.args,
      record.createdBy,
      record.guildId,
      record.description
    )

    alias._id = record._id

    return alias
  }
}
