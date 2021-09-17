import mongoose from 'mongoose'

export const establishConnection = async (): Promise<typeof mongoose> => {
  const connection = await mongoose.connect(process.env.MONGO_URI || '')
  return connection
}
