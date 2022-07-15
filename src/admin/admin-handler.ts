import { Injectable } from '@nestjs/common'
import { BugReport } from '../db/bug-report'
import { ListingLoader } from '../listing/listing-loaders'
import { GolemLogger } from '../logger/logger.service'
import { GolemMessage } from '../messages/message-wrapper'
import { RefreshResult } from '../messages/replies/library/refresh-result'
import { StringUtils } from '../utils/string-utils'

@Injectable()
export class AdminHandler {
  constructor(private logger: GolemLogger, private loader: ListingLoader) {}

  async libRefresh(message: GolemMessage): Promise<void> {
    this.logger.debug(`refreshing libraries`)

    const result = await this.loader.refresh()
    const response = new RefreshResult(message, result)

    await response.send()
  }

  async getLatestBugReports(message: GolemMessage): Promise<void> {
    this.logger.debug(`getting bug reports`)

    const reports = await BugReport.find(
      {},
      { limit: 5, sort: [['timestamp', 'desc']] }
    )
    let response = 'Last 5 Reports:\n'

    for (const report of reports) {
      response = response.concat(`\n${await report.toString()}`)
    }

    await message.reply(StringUtils.as.preformat(response))
  }
}
