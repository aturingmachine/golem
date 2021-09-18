import { BotInteractionData, GolemBotInteraction } from './models/interaction'
import { PlayRecordData } from './models/play-record'

export class Analytics {
  static push(event: GolemBotInteraction): void {
    const model = new BotInteractionData(event)

    model.save()
  }

  static async createPlayRecord(
    trackId: string,
    userId: string,
    interactionType: 'play' | 'skip' | 'queue'
  ): Promise<void> {
    new PlayRecordData({
      trackId,
      userId,
      timestamp: Date.now(),
      interactionType,
    }).save()
  }
}
