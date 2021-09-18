import mongoose, { Schema } from 'mongoose'

export interface PlayRecord {
  trackId: string
  interactionType?: 'play' | 'skip' | 'queue'
  timestamp: number
  userId: string
}

const schema = new Schema<PlayRecord>({
  trackId: String,
  userId: String,
  timestamp: Number,
  interactionType: String,
})

export const PlayRecordData = mongoose.model<PlayRecord>('PlayRecord', schema)
