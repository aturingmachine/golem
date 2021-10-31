import mongoose from 'mongoose'
import { GolemConf } from '../utils/config'

export const establishConnection = (): Promise<typeof mongoose> => {
  return mongoose.connect(GolemConf.mongo.uri, {
    connectTimeoutMS: 5000,
  })
}
