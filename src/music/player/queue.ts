import { ArrayUtils } from '../../utils/list-utils'
import { GolemLogger, LogSources } from '../../utils/logger'
import { Track } from '../tracks'

const log = GolemLogger.child({ src: LogSources.Queue })

interface QueuedTrack {
  queuedBy: string
  track: Track
}

export class TrackQueue {
  private explicitQueue!: QueuedTrack[]
  private passiveQueue!: QueuedTrack[]

  constructor() {
    this.explicitQueue = []
    this.passiveQueue = []
  }

  /**
   * Add a track to the explicit queue
   * @param userId
   * @param track
   */
  addNext(userId: string, track: Track): void {
    // log.verbose(`${userId} Adding Next ${track.listing.shortName}`)
    this.explicitQueue.push({ track, queuedBy: userId })
  }

  /**
   * Adds a track to the passive queue
   * @param userId
   * @param track
   */
  add(userId: string, track: Track): void {
    // log.verbose(`${userId} Adding ${track.listing.shortName}`)
    this.passiveQueue.push({ track, queuedBy: userId })
  }

  /**
   * Adds many tracks to the passive queue
   * @param userId
   * @param tracks
   */
  addMany(userId: string, tracks: Track[]): void {
    log.verbose(`Adding many - ${tracks.length} tracks`)
    this.passiveQueue.push(
      ...tracks.map((track) => ({ track, queuedBy: userId }))
    )
  }

  skip(count = 0): void {
    log.verbose(`Skipping ${count} queued tracks`)
    let amount = count

    if (this.explicitQueue.length > 0) {
      amount = count - this.explicitQueue.length
      if (amount > 0) {
        this.explicitQueue = []
      } else {
        this.explicitQueue = this.explicitQueue.slice(count)
      }
    }

    if (amount > 0) {
      this.passiveQueue = this.passiveQueue.slice(amount)
    }
  }

  clear(): void {
    log.verbose('Clearing')
    this.explicitQueue = []
    this.passiveQueue = []
  }

  peek(): Track | undefined {
    log.verbose('Peeking')
    return this.queue[0]?.track
  }

  peekDeep(depth = 5): Track[] {
    log.verbose('Deep Peeking')
    return depth > 0
      ? this.queue.slice(0, depth).map((i) => i.track)
      : this.queue.map((i) => i.track)
  }

  pop(): Track | undefined {
    log.verbose('Popping Next track')

    if (this.explicitQueue.length > 0) {
      return this.explicitQueue.shift()?.track
    }

    return this.passiveQueue.shift()?.track
  }

  shuffle(): void {
    log.verbose('shuffling')
    const passiveTemp = [...this.passiveQueue]
    const explicitTemp = [...this.explicitQueue]

    this.passiveQueue = ArrayUtils.shuffleArray(passiveTemp)
    this.explicitQueue = ArrayUtils.shuffleArray(explicitTemp)
    log.info('shuffled')
  }

  /**
   * Get rough runtime in seconds
   */
  get runTime(): number {
    const estRunTime = this.queue.reduce((prev, curr) => {
      return prev + curr.track.metadata.duration
    }, 0)

    log.silly(`Estimated Runtime ${estRunTime}`)

    return estRunTime
  }

  get explicitQueueRunTime(): number {
    const estRunTime = this.explicitQueue.reduce((prev, curr) => {
      return prev + curr.track.metadata.duration
    }, 0)

    log.silly(`Estimated Explicit Runtime ${estRunTime}`)

    return estRunTime
  }

  get queuedTrackCount(): number {
    return this.queue.length
  }

  private get queue(): QueuedTrack[] {
    return [...this.explicitQueue, ...this.passiveQueue]
  }
}
