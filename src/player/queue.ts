import { Track } from '../models/track'
import { shuffleArray } from '../utils/list-utils'
import { GolemLogger, LogSources } from '../utils/logger'

const log = GolemLogger.child({ src: LogSources.Queue })

interface QueuedTrack {
  queuedBy: string
  track: Track
}

export class TrackQueue {
  private explicitQueue!: QueuedTrack[]
  private passiveQueue!: QueuedTrack[]

  constructor() {
    this.passiveQueue = []
  }

  add(userId: string, track: Track): void {
    log.debug(`${userId} Adding ${track.listing.shortName}`)
    this.passiveQueue.push({ track, queuedBy: userId })
  }

  addMany(userId: string, tracks: Track[]): void {
    log.debug(`Adding many - ${tracks.length} tracks`)
    this.passiveQueue.push(
      ...tracks.map((track) => ({ track, queuedBy: userId }))
    )
  }

  skip(): void {
    log.debug(`Skipping ${this.passiveQueue[0]?.track.listing.name}`)
    this.passiveQueue.shift()
  }

  clear(): void {
    log.debug('Clearing')
    this.passiveQueue = []
  }

  peek(): Track | undefined {
    log.debug('Peeking')
    return this.passiveQueue[0]?.track
  }

  peekDeep(depth = 5): Track[] {
    log.debug('Deep Peeking')
    return depth > 0
      ? this.passiveQueue.slice(0, depth).map((i) => i.track)
      : this.passiveQueue.map((i) => i.track)
  }

  pop(): Track | undefined {
    log.debug('Popping Next track')
    return this.passiveQueue.shift()?.track
  }

  shuffle(): void {
    log.debug('shuffling')
    const temp = [...this.passiveQueue]
    // temp.shift()
    // temp = shuffleArray(temp)
    // temp.unshift(this._queue[0])
    this.passiveQueue = shuffleArray(temp)
    log.info('shuffled')
  }

  get first(): Track {
    return this.queue[0].track
  }

  /**
   * Get rough runtime in seconds
   */
  get runTime(): number {
    const estRunTime = this.queue.reduce((prev, curr) => {
      return prev + curr.track.listing.duration
    }, 0)

    log.debug(`Estimated Runtime ${estRunTime}`)

    return estRunTime
  }

  get queuedTrackCount(): number {
    return this.queue.length
  }

  private get queue(): QueuedTrack[] {
    return [...this.explicitQueue, ...this.passiveQueue]
  }
}
