import { ActivityOptions } from 'discord.js'
import winston from 'winston'
import { formatForLog } from '../utils/debug-utils'
import { ArrayUtils } from '../utils/list-utils'
import { GolemLogger, LogSources } from '../utils/logger'
import { Golem } from '.'

export class PresenceManager {
  private currentIndex = 0
  private currentId?: string = 'default'
  private readonly log: winston.Logger

  constructor() {
    this.log = GolemLogger.child({ src: LogSources.PresenceManager })

    this.log.debug('creating new PresenceManager')

    setInterval(() => {
      this.log.silly(
        `update interval triggering - length ${this.activities.length} - current ${this.currentIndex}`
      )
      this.update()
    }, 30_000)
  }

  get activities(): { id: string; activity: ActivityOptions }[] {
    const listentingActivities = Array.from(Golem.playerCache.entries())
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
      this.log.silly('update looping list')
      // need to loop?
      newIndex = 0
      nextItem = this.activities[newIndex]
    }

    this.currentId = nextItem.id
    this.currentIndex = newIndex
    this.log.silly(`setting new with ${formatForLog(nextItem)}`)

    Golem.client.user?.setActivity(nextItem.activity)
  }
}
