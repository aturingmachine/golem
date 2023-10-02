import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { formatForLog } from '../utils/debug-utils'
import { KeyedSet } from '../utils/list-utils'
import { LoggerService } from './logger/logger.service'

export type GolemPresence = { id: string; status: string }

@Injectable()
export class BotPresenceService {
  readonly presences: KeyedSet<GolemPresence, 'id'> = new KeyedSet<
    GolemPresence,
    'id'
  >('id', undefined, [
    { id: 'help-message', status: 'Use `$go get help` to get started!' },
    {
      id: 'play-message',
      status: 'Use `$play <search-term>` to play something!',
    },
  ])

  activePresence = 'help-message'

  private timeout: NodeJS.Timeout | undefined

  constructor(private log: LoggerService, private config: ConfigService) {
    this.log.setContext('BotPresenceService')
  }

  moveToNextStatus(): void {
    // this.log.debug('moving to next status')
    const currentIndex = this.presences.indexOf(this.activePresence)

    let nextIndex = currentIndex + 1

    if (currentIndex < 0) {
      // this.log.debug('current not found, moving to 0')
      nextIndex = 0
    }

    if (currentIndex >= this.presences.size - 1) {
      // this.log.debug('at end of list, moving to 0')
      nextIndex = 0
    }

    const targetPresence = this.presences.values()[nextIndex]
    // this.log.debug(`setting to ${targetPresence.id} | ${targetPresence.status}`)

    this.activePresence = targetPresence.id
  }

  remove(id: string): void {
    this.log.debug(`removing ${id}`)

    if (this.activePresence === id) {
      this.moveToNextStatus()
    }

    this.presences.remove(id)
  }

  add(newPresence: GolemPresence): void {
    this.log.debug(`adding ${formatForLog(newPresence)}`)
    this.presences.add(newPresence)
  }

  get activeStatus(): string {
    return (
      this.presences.get(this.activePresence)?.status ||
      this.presences.values()[0].status
    )
  }

  startRotation(cb: (status: string) => Promise<void> | void): void {
    this.log.debug(`starting rotation`)

    if (this.timeout) {
      return
    }

    this.timeout = setInterval(async () => {
      // this.log.debug(`rotating`)
      this.moveToNextStatus()

      await cb(this.activeStatus)
    }, 30_000)
  }
}
