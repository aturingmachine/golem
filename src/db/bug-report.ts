import { Collection, Filter, FindOptions, ObjectId } from 'mongodb'
import { Golem } from '../golem'
import { GolemMessage } from '../messages/message-wrapper'
import { GolemLogger, LogSources } from '../utils/logger'
import { DatabaseRecord } from '.'

type BugReportRecord = DatabaseRecord<BugReport>

export class BugReport {
  private static log = GolemLogger.child({ src: LogSources.BugReport })

  _id!: ObjectId

  constructor(
    readonly userId: string,
    readonly guildId: string,
    readonly content: string,
    readonly timestamp: string
  ) {}

  async toString(): Promise<string> {
    const user = await Golem.getUser(this.userId)
    const guild = await Golem.getGuild(this.guildId)

    return `[${this.timestamp}] ${user.username} - ${guild.name}: ${this.content}`
  }

  async save(): Promise<this> {
    if (this._id) {
      await BugReport.Collection.replaceOne(
        { _id: { $eq: this._id } },
        { ...this }
      )
    } else {
      const result = await BugReport.Collection.insertOne({ ...this })
      this._id = result.insertedId
    }

    return this
  }

  static async find(
    filter: Filter<BugReportRecord>,
    options?: FindOptions
  ): Promise<BugReport[]> {
    const records = await BugReport.Collection.find(filter, options).toArray()

    return records.map((rec) => {
      const report = new BugReport(
        rec.userId,
        rec.guildId,
        rec.content,
        rec.timestamp
      )
      report._id = rec._id

      return report
    })
  }

  static fromMessage(message: GolemMessage): BugReport {
    BugReport.log.silly(
      `creating bug report from message: ${message.toDebug()}`
    )
    return new BugReport(
      message.info.userId,
      message.info.guildId,
      message.parsed.getDefault('content', 'N/A'),
      new Date().toString()
    )
  }

  private static get Collection(): Collection<BugReportRecord> {
    return Golem.db.collection('bugreports')
  }
}
