import { Track } from '../models/track'
import { shuffleArray } from '../utils/list-utils'
import { GolemLogger, LogSources } from '../utils/logger'

const log = GolemLogger.child({ src: LogSources.Queue })

interface QueuedTrack {
  queuedBy: string
  track: Track
}

export class TrackQueue {
  private _queue!: QueuedTrack[]

  constructor() {
    this._queue = []
  }

  add(userId: string, track: Track): void {
    log.info(`${userId} Adding ${track.listing.shortName}`)
    this._queue.push({ track, queuedBy: userId })
  }

  addMany(userId: string, tracks: Track[]): void {
    log.info(`Adding many - ${tracks.length} tracks`)
    this._queue.push(...tracks.map((track) => ({ track, queuedBy: userId })))
  }

  skip(): void {
    log.info(`Skipping ${this._queue[0]?.track.listing.name}`)
    this._queue.shift()
  }

  clear(): void {
    log.info('Clearing')
    this._queue = []
  }

  peek(): Track | undefined {
    log.info('Peeking')
    return this._queue[0]?.track
  }

  peekDeep(depth = 5): Track[] {
    log.info('Deep Peeking')
    return depth > 0
      ? this._queue.slice(0, depth).map((i) => i.track)
      : this._queue.map((i) => i.track)
  }

  pop(): Track | undefined {
    log.info('Popping Next track')
    return this._queue.shift()?.track
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

  get first(): Track {
    return this._queue[0].track
  }

  /**
   * Get rough runtime in seconds
   */
  get runTime(): number {
    const estRunTime = this._queue.reduce((prev, curr) => {
      return prev + curr.track.listing.duration
    }, 0)

    log.info(`Estimated Runtime ${estRunTime}`)

    return estRunTime
  }

  get queuedTrackCount(): number {
    return this._queue.length
  }
}
