import express from 'express'
import { LocalAlbum } from '../../../listing/album'
import { LocalListing } from '../../../listing/listing'

const router = express.Router()

router.get('/ids', async (req, res) => {
  const offset = req.query.offset ? parseInt(req.query.offset.toString()) : 0

  try {
    const records = await LocalListing.listingIds()

    const end = offset + 200

    const listingIds = records.slice(offset, end)

    res.status(200).json({ listingIds, hasMore: end < records.length })
  } catch (error: any) {
    console.error(error)
    res.status(500).json({ msg: error.message })
  }
})

router.get('/:id', async (req, res) => {
  const listingId = req.params.id
  try {
    const record = await LocalListing.findOne({ listingId })

    if (!record) {
      res.status(404).json({ msg: `no listing matching id ${listingId}` })
      return
    }

    const parsed = {
      ...record,
      album: record?.album.albumId,
    }

    res.status(200).json({ listing: parsed })
  } catch (error: any) {
    console.error(error)
    res.status(500).json({ msg: error.message })
  }
})

router.get('/album/:id', async (req, res) => {
  try {
    let size = req.query.size ? parseInt(req.query.size.toString()) : 200

    if (isNaN(size)) {
      size = 200
    }

    const record = await LocalAlbum.findOne({ albumId: req.params.id })

    if (!record) {
      res.status(404).json({ msg: `no album matching id ${req.params.id}` })
      return
    }

    return res.status(200).json({
      album: {
        art: (await record.getArt(200)).toString('base64'),
        name: record.albumName,
        id: record.albumId,
      },
    })
  } catch (error: any) {
    console.error(error)
    res.status(500).json({ msg: error.message })
  }
})

export { router as listingRouter }
