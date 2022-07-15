import { Injectable } from '@nestjs/common'
import { ActivityOptions } from 'discord.js'
import { ClientService } from '../djs/client.service'
import { LogContexts } from '../logger/constants'
import { GolemLogger } from '../logger/logger.service'
import { formatForLog } from '../utils/debug-utils'
import { ArrayUtils } from '../utils/list-utils'
import { PlayerCache } from './player-cache'

@Injectable()
export class PresenceManager {
  private currentIndex = 0
  private currentId?: string = 'default'

  constructor(
    private logger: GolemLogger,
    private clientService: ClientService,
    private playerCache: PlayerCache
  ) {
    this.logger.setContext(LogContexts.PresenceManager)

    this.logger.debug('creating new PresenceManager')

    setInterval(() => {
      this.logger.silly(
        `update interval triggering - length ${this.activities.length} - current ${this.currentIndex}`
      )
      this.update()
    }, 30_000)
  }

  get activities(): { id: string; activity: ActivityOptions }[] {
    const listentingActivities = Array.from(this.playerCache.entries())
      .map(([key, player]) => {
        return player?.nowPlaying
          ? { key, title: player.nowPlaying?.title }
          : undefined
      })
      .filter(ArrayUtils.isDefined)
      .map((data) => {
        return {
          id: data.key,
          activity: { name: data.title, type: 'LISTENING' },
        }
      })

    listentingActivities.push({
      id: '_default',
      activity: { name: '$go get help', type: 'PLAYING' },
    })

    return listentingActivities as { id: string; activity: ActivityOptions }[]
  }

  update(): void {
    let newIndex = this.currentIndex + 1
    let nextItem = this.activities[newIndex]

    // Next index is out of the current list of activities
    if (newIndex > this.activities.length - 1) {
      this.logger.silly('update looping list')
      // need to loop?
      newIndex = 0
      nextItem = this.activities[newIndex]
    }

    this.currentId = nextItem.id
    this.currentIndex = newIndex
    this.logger.silly(`setting new with ${formatForLog(nextItem)}`)

    this.clientService.bot?.setActivity(nextItem.activity)
  }
}
