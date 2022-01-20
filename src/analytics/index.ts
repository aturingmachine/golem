import { PlayRecord } from './models/play-record'

export class Analytics {
  static async createPlayRecord(
    trackId: string,
    userId: string,
    interactionType: 'play' | 'skip' | 'queue'
  ): Promise<PlayRecord> {
    const record = new PlayRecord(trackId, Date.now(), userId, interactionType)

    await record.save()

    return record
  }
}
