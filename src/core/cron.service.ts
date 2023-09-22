import { Injectable } from '@nestjs/common'
import cron from 'node-cron'
import { DiscordMarkdown } from '../utils/discord-markdown-builder'
import { AdminService } from './admin/admin.service'
import { ClientService } from './client.service'
import { ConfigurationService } from './configuration.service'
import { LoggerService } from './logger/logger.service'

@Injectable()
export class CronService {
  constructor(
    private log: LoggerService,
    private admin: AdminService,
    private client: ClientService
  ) {
    this.log.setContext('CronService')
  }

  setCronJobs(): void {
    this.log.info(`Setting Cron Jobs Up.`)

    this.setJob('libraryUpdate', () => this.admin._forceRefresh())
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private setJob(key: string, fn: () => any | Promise<any>): void {
    if (!ConfigurationService.resolved.cron[key]) {
      this.log.info(`no cron setting for ${key}`)

      return
    }

    this.log.info(`setting cron for "${key}"`)

    cron.schedule(ConfigurationService.resolved.cron[key], async (now) => {
      if (typeof now !== 'string') {
        this.log.info(`Running cron for ${key}`)
      }

      try {
        await fn()
        await this.client.messageAdmin(`cron for "${key}" ran successfully`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        this.log.error(`error running cron for ${key}`, error)

        await this.client.messageAdmin(
          DiscordMarkdown.start()
            .bold(`FAILED: cron for "${key}"`)
            .newLine()
            .preformat(error.message)
        )
      }
    })
  }
}
