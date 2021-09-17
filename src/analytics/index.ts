import { Document } from 'mongoose'
import { GolemLogger } from '../utils/logger'
import { BotInteractionData, GolemBotInteraction } from './models/interaction'
import { PlayRecord, PlayRecordData } from './models/play-record'

export class Analytics {
  private static playQueue: (Document<any, any, PlayRecord> & PlayRecord)[] = []

  static push(event: GolemBotInteraction): void {
    const model = new BotInteractionData(event)

    model.save()
  }

  //TODO plays are slightl inaccurate, skips are not tracked
  // if the track is played alone i dont think?
  static queuePlayRecord(trackId: string, userId: string): void {
    GolemLogger.info(`queuing play analytic for ${trackId}`, {
      src: 'analytics',
    })
    const record = new PlayRecordData({
      trackId,
      userId,
      timestamp: Date.now(),
    })

    Analytics.playQueue.push(record)
  }

  // Assume that enqueue many will result in autoplay
  static queuePlayRecords(trackIds: string[], userId: string): void {
    const records = trackIds.map((id) => {
      const record = new PlayRecordData({
        id,
        userId,
        timestamp: Date.now(),
        resolutionType: 'autoplay',
      })

      return record
    })

    Analytics.playQueue.push(...records)
  }

  static playRecord(trackId: string): void {
    GolemLogger.info(`writing play for ${trackId}`, {
      src: 'analytics',
    })
    Analytics.writePlayRecord(trackId, 'play')
  }

  static skipRecord(trackId: string): void {
    GolemLogger.info(`writing skip for ${trackId}`, {
      src: 'analytics',
    })
    Analytics.writePlayRecord(trackId, 'skip')
  }

  static autoplayRecord(trackId: string): void {
    GolemLogger.info(`writing autoplay for ${trackId}`, {
      src: 'analytics',
    })
    Analytics.writePlayRecord(trackId, 'autoplay')
  }

  private static writePlayRecord(
    trackId: string,
    type: 'play' | 'skip' | 'autoplay'
  ): void {
    let targetIndex = -1

    const target = Analytics.playQueue.find((record, index) => {
      if (record.trackId === trackId) {
        targetIndex = index
        return true
      }
    })

    if (target) {
      GolemLogger.info(`final - writing ${type} for ${trackId}`, {
        src: 'analytics',
      })
      target.resolutionType = type

      target.save()

      Analytics.playQueue.splice(targetIndex, 1)
    }
  }
}
