import mongoose from 'mongoose'
import { Config } from '../utils/config'

export const establishConnection = async (): Promise<typeof mongoose> => {
  const connection = await mongoose.connect(Config.MongoURI)
  return connection
}
