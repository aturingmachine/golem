import mongoose, { Schema } from 'mongoose'
import { Listing } from '../listing'

export interface LibIndex {
  count: number
  listings: Listing[]
}

const schema = new Schema<LibIndex>({
  count: Number,
  listings: [{ type: Schema.Types.ObjectId, ref: 'Listing' }],
})

export const LibIndexData = mongoose.model<LibIndex>('LibIndex', schema)
