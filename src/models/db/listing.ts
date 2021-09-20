import mongoose, { Schema } from 'mongoose'
import { Listing } from '../listing'

const schema = new Schema<Listing>({
  trackId: String,
  artist: String,
  album: String,
  title: String,
  duration: Number,
  hasDefaultDuration: Boolean,
  path: String,
  genres: [String],
  key: String,
  moods: [String],
  bpm: Number,
  mb: {
    type: Schema.Types.Mixed,
  },
  albumArt: Buffer,
})

export const ListingData = mongoose.model<Listing>('Listing', schema)
