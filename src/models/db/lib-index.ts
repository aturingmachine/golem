import mongoose, { Schema } from 'mongoose'
import { Listing } from '../listing'

interface LibIndex {
  count: number
  listings: Listing[]
}

const schema = new Schema<LibIndex>({
  count: Number,
  listings: [Schema.Types.ObjectId],
})

export const LibIndex = mongoose.model<LibIndex>('LibIndex', schema)
