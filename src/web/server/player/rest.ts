import { Snowflake } from 'discord.js'
import express from 'express'
import { Golem } from '../../../golem'
import { ImageCache } from '../utils/image-cache'

const router = express.Router()

/**
 * Get All Active Voice Connections
 */
router.get('/connections', (req, res) => {
  const serverIds: { id: Snowflake; isPlaying: boolean }[] = []
  const it = Golem.playerCache.entries()

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

  const playing = player.nowPlaying

  if (!playing) {
    res.json(undefined)
    return
  }

  res.json({
    nowPlaying: {
      ...playing,
      album: await ImageCache.getOrCreate(playing),
    },
  })
})

/**
 * Get queued tracks for a given connection
 */
router.get('/:serverId/queue', async (req, res) => {
  const serverId = req.params.serverId
  const player = Golem.getPlayer(serverId)

  if (!player || !player?.currentResource) {
    res.status(404).json({ error: `No player for server ${serverId}` })
    return
  }

  const queue = player.peek(-1)

  res.json({
    queue: await Promise.all(
      queue.map(async (t) => ({
        ...t.metadata,
        album: (await t.metadata.album.getArt(200)).toString('base64'),
      }))
    ),
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

router.post('/:channelId/playPause', (req, res) => {
  const channelId = req.params.channelId
  const player = Golem.getPlayer(channelId)

  if (!player) {
    res.status(404).json({ error: `No player for server ${channelId}` })
    return
  }

  const isPausing = player.isPlaying

  isPausing ? player.pause() : player?.unpause()

  res.status(200).json({ msg: isPausing ? 'paused player' : 'unpaused player' })
})

export { router as playerRouter }
