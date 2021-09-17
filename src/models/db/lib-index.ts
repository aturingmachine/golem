import mongoose, { Schema } from 'mongoose'
import { Listing } from '../listing'

export interface LibIndex {
  name: string
  count: number
  listings: Listing[]
}

const schema = new Schema<LibIndex>({
  name: String,
  count: Number,
  listings: [{ type: Schema.Types.ObjectId, ref: 'Listing' }],
})

export const LibIndexData = mongoose.model<LibIndex>('LibIndex', schema)
