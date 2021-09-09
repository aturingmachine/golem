import { Listing } from '../models/listing'
import { logger } from '../utils/logger'

export class TrackQueue {
  private _queue!: Listing[]

  constructor() {
    this._queue = []
  }

  add(listing: Listing): void {
    logger.info(`Queue: Adding ${listing.name}`)
    this._queue.push(listing)
  }

  addMany(listings: Listing[]): void {
    logger.info(`Queue: Adding many - ${listings.length} tracks`)
    this._queue.push(...listings)
  }

  skip(): void {
    logger.info(`Queue: Skipping ${this._queue[0].name}`)
    this._queue.shift()
  }

  clear(): void {
    logger.info('Queue: Clearing')
    this._queue = []
  }

  peek(): Listing | undefined {
    logger.info('Queue: Peeking')
    return this._queue[0]
  }

  pop(): Listing | undefined {
    logger.info('Queue: Popping Next track')
    return this._queue.shift()
  }

  get first(): Listing {
    return this._queue[0]
  }

  /**
   * Get rough runtime in seconds
   */
  get runTime(): number {
    const estRunTime = this._queue.reduce((prev, curr) => {
      return prev + curr.duration
    }, 0)

    logger.info(`Queue: Estimated Runtime ${estRunTime}`)

    return estRunTime
  }

  get queuedTrackCount(): number {
    return this._queue.length
  }
}
