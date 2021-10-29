import mongoose, { Schema } from 'mongoose'
import { CustomAlias } from '../custom-alias'

const schema = new Schema<CustomAlias>({
  name: String,
  createdBy: String,
  guildId: String,
  command: String,
  args: String,
})

export const CustomAliasData = mongoose.model<CustomAlias>(
  'CustomAlias',
  schema
)
