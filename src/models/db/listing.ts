import mongoose, { Schema } from 'mongoose'
import { Listing } from '../listing'

const schema = new Schema<Listing>({
  artist: String,
  album: String,
  track: String,
  duration: Number,
  hasDefaultDuration: Boolean,
  path: String,
  albumArt: Buffer,
})

export const ListingSchema = mongoose.model<Listing>('Listing', schema)