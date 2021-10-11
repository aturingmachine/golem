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
    log.debug(`${userId} Adding ${track.listing.shortName}`)
    this._queue.push({ track, queuedBy: userId })
  }

  addMany(userId: string, tracks: Track[]): void {
    log.debug(`Adding many - ${tracks.length} tracks`)
    this._queue.push(...tracks.map((track) => ({ track, queuedBy: userId })))
  }

  skip(): void {
    log.debug(`Skipping ${this._queue[0]?.track.listing.name}`)
    this._queue.shift()
  }

  clear(): void {
    log.debug('Clearing')
    this._queue = []
  }

  peek(): Track | undefined {
    log.debug('Peeking')
    return this._queue[0]?.track
  }

  peekDeep(depth = 5): Track[] {
    log.debug('Deep Peeking')
    return depth > 0
      ? this._queue.slice(0, depth).map((i) => i.track)
      : this._queue.map((i) => i.track)
  }

  pop(): Track | undefined {
    log.debug('Popping Next track')
    return this._queue.shift()?.track
  }

  shuffle(): void {
    log.debug('shuffling')
    const temp = [...this._queue]
    // temp.shift()
    // temp = shuffleArray(temp)
    // temp.unshift(this._queue[0])
    this._queue = shuffleArray(temp)
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

    log.debug(`Estimated Runtime ${estRunTime}`)

    return estRunTime
  }

  get queuedTrackCount(): number {
    return this._queue.length
  }
}
