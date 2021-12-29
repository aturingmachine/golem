import express from 'express'
import { PlayRecord } from '../../../analytics/models/play-record'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const records = await PlayRecord.find({}, {})

    res.status(200).json({ records })
  } catch (error: any) {
    console.error(error)
    res.status(500).json({ msg: error.message })
  }
})

export { router as analyticsRouter }
