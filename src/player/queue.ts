import { Listing } from '../models/listing'
import { shuffleArray } from '../utils/list-utils'
import { logger } from '../utils/logger'

const log = logger.child({ src: 'Queue' })

export class TrackQueue {
  private _queue!: Listing[]

  constructor() {
    this._queue = []
  }

  add(listing: Listing): void {
    log.info(`Adding ${listing.name}`)
    this._queue.push(listing)
  }

  addMany(listings: Listing[]): void {
    log.info(`Adding many - ${listings.length} tracks`)
    this._queue.push(...listings)
  }

  skip(): void {
    log.info(`Skipping ${this._queue[0].name}`)
    this._queue.shift()
  }

  clear(): void {
    log.info('Clearing')
    this._queue = []
  }

  peek(): Listing | undefined {
    log.info('Peeking')
    return this._queue[0]
  }

  peekDeep(depth = 5): Listing[] {
    log.info('Deep Peeking')
    return this._queue.slice(0, depth)
  }

  pop(): Listing | undefined {
    log.info('Popping Next track')
    return this._queue.shift()
  }

  shuffle(): void {
    log.info('shuffling')
    let temp = [...this._queue]
    temp.shift()
    temp = shuffleArray(temp)
    temp.unshift(this._queue[0])
    this._queue = temp
    log.info('shuffled')
  }

  get first(): Listing {
    return this._queue[0]
  }

  /**
   * Get rough runtime in seconds
   */
  get runTime(): number {
    const estRunTime = this._queue.slice(1).reduce((prev, curr) => {
      return prev + curr.duration
    }, 0)

    log.info(`Estimated Runtime ${estRunTime}`)

    return estRunTime
  }

  get queuedTrackCount(): number {
    return this._queue.length
  }
}
