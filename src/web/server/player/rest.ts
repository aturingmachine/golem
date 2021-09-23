import { Snowflake } from 'discord-api-types'
import express from 'express'
import { Golem } from '../../../golem'
import { Listing } from '../../../models/listing'
import { resize } from '../../../utils/image-utils'

const router = express.Router()

/**
 * Get All Active Voice Connections
 */
router.get('/connections', (req, res) => {
  const serverIds: { id: Snowflake; isPlaying: boolean }[] = []
  const it = Golem.players.entries()

  let next = it.next()
  while (!next.done) {
    serverIds.push({ id: next.value[0], isPlaying: next.value[1].isPlaying })
    next = it.next()
  }

  res.json({ connections: serverIds })
})

/**
 * Get the Now Playing for a Connection
 */
router.get('/:serverId/nowplaying', async (req, res) => {
  const serverId = req.params.serverId
  const player = Golem.getPlayer(serverId)

  if (!player || !player?.currentResource) {
    res.status(404).json({ error: `No player for server ${serverId}` })
    return
  }

  const playing: Listing = player.currentResource.metadata.track.listing

  res.json({
    nowPlaying: {
      ...playing,
      albumArt: (await resize(playing.albumArt)).toString('base64'),
    },
  })
})

/**
 * Get queued tracks for a given connection
 */
router.get('/:serverId/queue', (req, res) => {
  const serverId = req.params.serverId
  const player = Golem.getPlayer(serverId)

  if (!player || !player?.currentResource) {
    res.status(404).json({ error: `No player for server ${serverId}` })
    return
  }

  const queue = player.peek(-1)

  res.json({
    queue: queue.map((t) => ({
      ...t.listing,
      albumArt: t.listing.albumArt?.toString('base64'),
    })),
  })
})

router.post('/:channelId/skip', (req, res) => {
  const channelId = req.params.channelId
  const player = Golem.getPlayer(channelId)

  if (!player) {
    res.status(404).json({ error: `No player for server ${channelId}` })
  }

  player?.skip()
})

export { router as playerRouter }
