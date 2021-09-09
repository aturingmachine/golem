import mongoose, { Schema } from 'mongoose'
import { Listing } from '../listing'

interface LibIndex {
  count: number
  listings: Listing[]
}

const schema = new Schema<LibIndex>({
  count: Number,
  listings: [{ type: Schema.Types.ObjectId, ref: 'Listing' }],
})

export const LibIndex = mongoose.model<LibIndex>('LibIndex', schema)
