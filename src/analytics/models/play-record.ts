import mongoose, { Schema } from 'mongoose'

export interface PlayRecord {
  trackId: string
  resolutionType?: 'play' | 'skip' | 'autoplay'
  timestamp: number
  userId: string
}

const schema = new Schema<PlayRecord>({
  trackId: String,
  userId: String,
  timestamp: Number,
  resolutionType: String,
})

export const PlayRecordData = mongoose.model<PlayRecord>('PlayRecord', schema)
