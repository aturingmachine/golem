import mongoose from 'mongoose'

export const establishConnection = async (): Promise<typeof mongoose> =>
  await mongoose.connect(process.env.MONGO_URI || '')
