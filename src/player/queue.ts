import { Track } from '../models/track'
import { shuffleArray } from '../utils/list-utils'
import { GolemLogger, LogSources } from '../utils/logger'

const log = GolemLogger.child({ src: LogSources.Queue })

export class TrackQueue {
  private _queue!: Track[]

  constructor() {
    this._queue = []
  }

  add(track: Track): void {
    log.info(`Adding ${track.listing.name}`)
    this._queue.push(track)
  }

  addMany(tracks: Track[]): void {
    log.info(`Adding many - ${tracks.length} tracks`)
    this._queue.push(...tracks)
  }

  skip(): void {
    log.info(`Skipping ${this._queue[0].listing.name}`)
    this._queue.shift()
  }

  clear(): void {
    log.info('Clearing')
    this._queue = []
  }

  peek(): Track | undefined {
    log.info('Peeking')
    return this._queue[0]
  }

  peekDeep(depth = 5): Track[] {
    log.info('Deep Peeking')
    return this._queue.slice(0, depth)
  }

  pop(): Track | undefined {
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

  get first(): Track {
    return this._queue[0]
  }

  /**
   * Get rough runtime in seconds
   */
  get runTime(): number {
    const estRunTime = this._queue.slice(1).reduce((prev, curr) => {
      return prev + curr.listing.duration
    }, 0)

    log.info(`Estimated Runtime ${estRunTime}`)

    return estRunTime
  }

  get queuedTrackCount(): number {
    return this._queue.length
  }
}
