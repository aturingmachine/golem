import { ObjectId } from 'bson'
import { Message } from 'discord.js'
import { Collection, DeleteResult, Filter, FindOptions } from 'mongodb'
import { RegisteredCommands } from '../commands'
import { Golem } from '../golem'
import { LegacyCommandHandler } from '../handlers/legacy-command-handler'
import { formatForLog } from '../utils/debug-utils'
import { shuffleArray } from '../utils/list-utils'
import { GolemLogger, LogSources } from '../utils/logger'
import { ParsedMessage } from '../utils/message-args'

export enum AliasFunctionType {
  Random = ':random',
  RandomNumber = ':randomNum',
}

export abstract class AliasFunction {
  public abstract type: AliasFunctionType

  constructor(public evalString: string) {}

  abstract run(): string

  static fromString(raw: string): AliasFunction[] {
    const fns: AliasFunction[] = []

    if (!!raw.match(RandomAliasFunction.signature)) {
      fns.push(...RandomAliasFunction.parseMatches(raw, []))
    }

    if (!!raw.match(RandomIntFunction.signature)) {
      fns.push(...RandomIntFunction.parseMatches(raw, []))
    }

    return fns
  }
}

export class RandomAliasFunction extends AliasFunction {
  private options: string[]

  private static startKey = ':random['
  private static endKey = ']'

  public static signature = /:random\[.+\]/

  public type: AliasFunctionType = AliasFunctionType.Random

  constructor(evalString: string) {
    super(evalString)

    this.options = evalString
      .slice(evalString.indexOf('[') + 1, evalString.indexOf(']'))
      .split(';')

    if (this.options.length === 0) {
      throw new Error('Cannot use :random with no options')
    }
  }

  run(): string {
    return shuffleArray(this.options).pop() || ''
  }

  static parseMatches(
    str: string,
    results: RandomAliasFunction[]
  ): RandomAliasFunction[] {
    const firstIndex = str.indexOf(RandomAliasFunction.startKey)

    if (firstIndex < 0) {
      return results
    }

    const slice1 = str.slice(
      firstIndex,
      str.indexOf(RandomAliasFunction.endKey) + 1
    )

    results.push(new RandomAliasFunction(slice1))

    return this.parseMatches(str.replace(slice1, ''), results)
  }
}

export class RandomIntFunction extends AliasFunction {
  private min: number
  private max: number

  private static startKey = ':randomNum['
  private static endKey = ']'

  public static signature = /:randomNum\[(?:\d+-{0,1})+\]+/

  public type: AliasFunctionType = AliasFunctionType.RandomNumber

  constructor(evalString: string) {
    super(evalString)

    const values = evalString
      .slice(evalString.indexOf('[') + 1, evalString.indexOf(']'))
      .split('-')

    if (values.length !== 2) {
      throw new Error(
        'Cannot use :randomNum with no provided numbers formatted start-end'
      )
    }

    this.min = parseInt(values[0], 10)
    this.max = parseInt(values[1], 10)
  }

  run(): string {
    return Math.floor(
      Math.random() * (this.max - this.min + 1) + this.min
    ).toString()
  }

  static parseMatches(
    str: string,
    results: RandomIntFunction[]
  ): RandomIntFunction[] {
    const firstIndex = str.indexOf(RandomIntFunction.startKey)

    if (firstIndex < 0) {
      return results
    }

    const slice1 = str.slice(
      firstIndex,
      str.indexOf(RandomIntFunction.endKey, firstIndex) + 1
    )
    results.push(new RandomIntFunction(slice1))

    return this.parseMatches(str.replace(slice1, ''), results)
  }
}

export class CustomAlias {
  private static log = GolemLogger.child({ src: LogSources.CustomAlias })

  public functions: AliasFunction[] = []

  public _id!: ObjectId

  constructor(
    public name: string,
    public command: string,
    public args: string,
    public createdBy: string,
    public guildId: string,
    public description?: string
  ) {
    this.functions = AliasFunction.fromString(this.unevaluated)
  }

  toString(): string {
    return `name=${this.name}; command=${this.command}; args=${this.args}`
  }

  // TODO get this to take in args as well or some shit idk
  async run(msg: Message): Promise<void> {
    await LegacyCommandHandler.executeCustomAlias(msg, this.evaluated)
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
    const aliases = await CustomAlias.find({ guildId })
    CustomAlias.log.silly(`found ${aliases.length} custom aliases`)
    return aliases.map(
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
      await CustomAlias.Collection.insertOne(this)
    }

    return this
  }

  delete(): Promise<DeleteResult> {
    return CustomAlias.Collection.deleteOne({ _id: this._id })
  }

  static find(
    filter: Filter<CustomAlias>,
    options?: FindOptions
  ): Promise<CustomAlias[]> {
    return CustomAlias.Collection.find(filter, options).toArray()
  }

  static async findOne(
    filter: Filter<CustomAlias>,
    options?: FindOptions
  ): Promise<CustomAlias | null> {
    const record = await CustomAlias.Collection.findOne(filter, options)

    return record
      ? new CustomAlias(
          record.name,
          record.command,
          record.args,
          record.createdBy,
          record.guildId,
          record.description
        )
      : null
  }

  static deleteMany(filter: Filter<CustomAlias>): Promise<DeleteResult> {
    return CustomAlias.Collection.deleteMany(filter)
  }

  private static get Collection(): Collection<CustomAlias> {
    return Golem.db.collection<CustomAlias>('CustomAliases')
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
}
