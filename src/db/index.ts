import mongoose from 'mongoose'
import { GolemConf } from '../utils/config'

export const establishConnection = async (): Promise<typeof mongoose> => {
  const connection = await mongoose.connect(GolemConf.mongo.uri)
  return connection
}
