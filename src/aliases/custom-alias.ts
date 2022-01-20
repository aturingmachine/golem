import { ObjectId } from 'bson'
import { Collection, DeleteResult, Filter, FindOptions } from 'mongodb'
import { RegisteredCommands } from '../commands/register-commands'
import { CustomAliasRecord } from '../db/records'
import { Golem } from '../golem'
import { ParsedMessage } from '../messages/message-info'
import { formatForLog } from '../utils/debug-utils'
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

  static async fromString(
    aliasCommand: string,
    guildId: string,
    userId: string
  ): Promise<CustomAlias> {
    const parsed = new ParsedMessage(aliasCommand)
    const cleanCommand = parsed.content

    const parts = cleanCommand.split('=>')
    const aliasName = parts[0].replaceAll(' ', '')

    const fullCommand = parts[1].trim()
    const isGoCommand = fullCommand.startsWith('$go')
    const commandSplitIndex = isGoCommand
      ? fullCommand.indexOf(' ', fullCommand.indexOf(' ') + 1)
      : fullCommand.indexOf(' ')
    const command = fullCommand.slice(0, commandSplitIndex)
    const args = fullCommand.slice(commandSplitIndex).trim()

    CustomAlias.log.silly(
      `splitting args - ${formatForLog({
        fullCommand,
        isGoCmd: isGoCommand,
        commandSplitIndex,
      })}`
    )

    CustomAlias.log.silly(
      `fromString - create using ${formatForLog({
        aliasName,
        command,
        args,
        userId,
        guildId,
        description: parsed.args.desc,
      })}`
    )

    if (!(await CustomAlias.isValidName(aliasName, guildId))) {
      throw new Error(`alias name ${aliasName} already registered`)
    }

    return new CustomAlias(
      aliasName,
      command,
      args,
      userId,
      guildId,
      parsed.args.desc
    )
  }

  static async getAliases(guildId: string): Promise<CustomAlias[]> {
    CustomAlias.log.silly(`getting aliases for guild=${guildId}`)

    if (CustomAlias.cache.has(guildId)) {
      CustomAlias.log.debug(`CustomAlias cache hit for ${guildId}`)
      return CustomAlias.cache.get(guildId)!
    }

    CustomAlias.log.debug(`CustomAlias cache miss for ${guildId}`)

    const records = await CustomAlias.find({ guildId })
    CustomAlias.log.silly(`found ${records.length} custom aliases`)

    const aliases = records.map(
      (match) =>
        new CustomAlias(
          match.name,
          match.command,
          match.args,
          match.createdBy,
          match.guildId,
          match.description
        )
    )

    CustomAlias.cache.set(guildId, aliases)

    return aliases
  }

  static async getAliasFor(
    command: string,
    guildId: string
  ): Promise<CustomAlias | undefined> {
    const parsedCommand =
      command.indexOf(' ') > -1
        ? command.slice(0, command.indexOf(' '))
        : command

    const aliases = await CustomAlias.getAliases(guildId)

    const match = aliases.find(
      (alias) => alias.name === parsedCommand.replace('$', '')
    )

    return match
      ? new CustomAlias(
          match.name,
          match.command,
          match.args,
          match.createdBy,
          match.guildId,
          match.description
        )
      : undefined
  }

  async save(): Promise<this> {
    if (this._id) {
      await CustomAlias.Collection.replaceOne({ _id: { $eq: this._id } }, this)
    } else {
      const res = await CustomAlias.Collection.insertOne(this)
      this._id = res.insertedId
    }

    return this
  }

  delete(): Promise<DeleteResult> {
    return CustomAlias.Collection.deleteOne({ _id: this._id })
  }

  static async find(
    filter: Filter<CustomAliasRecord>,
    options?: FindOptions
  ): Promise<CustomAlias[]> {
    const records = await CustomAlias.Collection.find(filter, options).toArray()

    return records.map(CustomAlias.fromRecord)
  }

  static async findOne(
    filter: Filter<CustomAliasRecord>,
    options?: FindOptions
  ): Promise<CustomAlias | null> {
    const record = await CustomAlias.Collection.findOne(filter, options)

    return record ? CustomAlias.fromRecord(record) : null
  }

  static deleteMany(filter: Filter<CustomAliasRecord>): Promise<DeleteResult> {
    return CustomAlias.Collection.deleteMany(filter)
  }

  private static get Collection(): Collection<CustomAliasRecord> {
    return Golem.database.customaliases
  }

  private static async isValidName(
    name: string,
    guildId: string
  ): Promise<boolean> {
    const builtInCommands = Object.values(RegisteredCommands)
    const builtInNames = builtInCommands.map((cmd) => cmd.options.info.name)
    const builtInAliases = builtInCommands.map((cmd) => cmd.options.info.alias)
    const customAliases = await CustomAlias.getAliases(guildId)

    return ![
      ...builtInNames,
      ...builtInAliases,
      ...customAliases.map((alias) => alias.name),
    ].some((cmd) => cmd === name)
  }

  private static fromRecord(record: CustomAliasRecord): CustomAlias {
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
