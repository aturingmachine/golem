import { Golem } from '../golem'
import { GolemMessage } from '../messages/message-wrapper'
import { RefreshResult } from '../messages/replies/library/refresh-result'
import { GolemLogger, LogSources } from '../utils/logger'

export const AdminHandler = {
  log: GolemLogger.child({ src: LogSources.GoAdmin }),

  async libRefresh(message: GolemMessage): Promise<void> {
    this.log.debug(`refreshing libraries`)
    const result = await Golem.loader.refresh()
    const response = new RefreshResult(message, result)

    await response.send()
  },
}
