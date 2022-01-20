import express from 'express'
import { CustomAlias } from '../../../aliases/custom-alias'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const aliases = await CustomAlias.find({})

    res.status(200).json({ aliases })
  } catch (error: any) {
    res.status(500).json({ msg: error.message })
  }
})

export { router as aliasRouter }
