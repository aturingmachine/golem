import mongoose, { Schema } from 'mongoose'
import { CustomAlias } from '../custom-alias'

const schema = new Schema<CustomAlias>({
  name: String,
  command: String,
  args: String,
  createdBy: String,
  guildId: String,
  description: String,
})

export const CustomAliasData = mongoose.model<CustomAlias>(
  'CustomAlias',
  schema
)
