import { BugReport } from '../db/bug-report'
import { Golem } from '../golem'
import { GolemMessage } from '../messages/message-wrapper'
import { RefreshResult } from '../messages/replies/library/refresh-result'
import { GolemLogger, LogSources } from '../utils/logger'
import { StringUtils } from '../utils/string-utils'

export const AdminHandler = {
  log: GolemLogger.child({ src: LogSources.GoAdmin }),

  async libRefresh(message: GolemMessage): Promise<void> {
    this.log.debug(`refreshing libraries`)
    const result = await Golem.loader.refresh()
    const response = new RefreshResult(message, result)

    await response.send()
  },

  async getLatestBugReports(message: GolemMessage): Promise<void> {
    this.log.debug(`getting bug reports`)
    const reports = await BugReport.find(
      {},
      { limit: 5, sort: [['timestamp', 'desc']] }
    )
    let response = 'Last 5 Reports:\n'

    for (const report of reports) {
      response = response.concat(`\n${await report.toString()}`)
    }

    await message.reply(StringUtils.as.preformat(response))
  },
}
