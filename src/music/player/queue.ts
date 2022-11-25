import { LoggerService } from '../../core/logger/logger.service'
import { ArrayUtils } from '../../utils/list-utils'
import { AudioResourceDefinition } from './player.service'

interface QueuedTrack {
  queuedBy: string
  audioResource: AudioResourceDefinition
}

export class TrackQueue {
  private explicitQueue!: QueuedTrack[]
  private passiveQueue!: QueuedTrack[]

  constructor(readonly log: LoggerService, readonly guildName: string) {
    this.log.setContext(`TrackQueue`, guildName)

    this.explicitQueue = []
    this.passiveQueue = []
  }

  /**
   * Add a track to the explicit queue
   * @param userId
   * @param track
   */
  addNext(userId: string, audioResource: AudioResourceDefinition): void {
    this.log.verbose(
      `${userId} - Explicit Queue: Adding Next ${audioResource.track.listing.artist} - ${audioResource.track.listing.title}`
    )
    this.explicitQueue.push({ audioResource, queuedBy: userId })
  }

  /**
   * Adds a track to the passive queue
   * @param userId
   * @param audioResource
   */
  add(userId: string, audioResource: AudioResourceDefinition): void {
    this.log.verbose(
      `${userId} - Passive Queue: Adding ${audioResource.track.listing.artist} - ${audioResource.track.listing.title}`
    )

    this.passiveQueue.push({ audioResource, queuedBy: userId })
  }

  /**
   * Adds many tracks to the passive queue
   * @param userId
   * @param tracks
   */
  addMany(userId: string, tracks: AudioResourceDefinition[]): void {
    this.log.verbose(
      `${userId} - Passive Queue: Adding many - ${tracks.length} tracks`
    )

    this.passiveQueue.push(
      ...tracks.map((audioResource) => ({
        audioResource,
        queuedBy: userId,
      }))
    )
  }

  skip(count = 0): void {
    this.log.verbose(`Skipping ${count} queued tracks`)
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
    this.log.verbose('Clearing')
    this.explicitQueue = []
    this.passiveQueue = []
  }

  peek(): AudioResourceDefinition | undefined {
    this.log.verbose('Peeking')
    return this.queue[0]?.audioResource
  }

  peekDeep(depth = 5): AudioResourceDefinition[] {
    this.log.verbose('Deep Peeking')
    console.log(this.queue)
    console.log(this.queue.length)
    console.log(
      '---RAW QUEUE---',
      this.explicitQueue,
      this.passiveQueue,
      '---END RAW QUEUE---'
    )

    return depth > 0
      ? this.queue.slice(0, depth).map((i) => i.audioResource)
      : this.queue.map((i) => i.audioResource)
  }

  pop(): AudioResourceDefinition | undefined {
    this.log.verbose('Popping Next track')

    if (this.explicitQueue.length > 0) {
      return this.explicitQueue.shift()?.audioResource
    }

    return this.passiveQueue.shift()?.audioResource
  }

  shuffle(): void {
    this.log.verbose('shuffling')
    const passiveTemp = [...this.passiveQueue]
    const explicitTemp = [...this.explicitQueue]

    this.passiveQueue = ArrayUtils.shuffleArray(passiveTemp)
    this.explicitQueue = ArrayUtils.shuffleArray(explicitTemp)
    this.log.info('shuffled')
  }

  /**
   * Get rough runtime in seconds
   */
  get runTime(): number {
    const estRunTime = this.queue.reduce((prev, curr) => {
      return prev + curr.audioResource.track.metadata.duration
    }, 0)

    this.log.silly(`Estimated Runtime ${estRunTime}`)

    return estRunTime
  }

  get explicitQueueRunTime(): number {
    const estRunTime = this.explicitQueue.reduce((prev, curr) => {
      return prev + curr.audioResource.track.metadata.duration
    }, 0)

    this.log.silly(`Estimated Explicit Runtime ${estRunTime}`)

    return estRunTime
  }

  get queuedTrackCount(): number {
    return this.queue.length
  }

  private get queue(): QueuedTrack[] {
    return [...this.explicitQueue, ...this.passiveQueue]
  }
}
