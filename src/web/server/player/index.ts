import { IncomingMessage } from 'http'
import { Socket } from 'net'
import { Snowflake } from 'discord-api-types'
import express from 'express'
import ws from 'ws'
import { Golem } from '../../../golem'
import { Listing } from '../../../models/listing'
import { MusicPlayer } from '../../../player/music-player'
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

export { router as playerRouter }

export class VoiceConnectionsWebSocket {
  private wsServer: ws.Server
  private socket!: ws
  private timer!: NodeJS.Timer

  constructor() {
    console.log('Making new VS Web Socket.')
    this.wsServer = new ws.Server({ noServer: true })
    this.wsServer.on('connection', this.onConnection.bind(this))

    Golem.addEventHandler('connection-ws', this.updateConnections.bind(this))

    this.timer = setInterval(() => {
      this.updateConnections()
    }, 10000)
  }

  handleUpgrade(request: any, socket: Socket, head: any): void {
    this.wsServer.handleUpgrade(request, socket, head, (socket) => {
      this.wsServer.emit('connection', socket, request)
    })
  }

  private onConnection(socket: ws, _request: IncomingMessage): void {
    this.socket = socket
  }

  private updateConnections(): void {
    const serverIds: { id: Snowflake; isPlaying: boolean; name: string }[] = []
    const it = Golem.players.entries()

    let next = it.next()
    while (!next.done) {
      const guildName = Golem.client.guilds.cache.get(next.value[0])?.name

      serverIds.push({
        id: next.value[0],
        isPlaying: next.value[1].isPlaying,
        name: guildName || '',
      })
      next = it.next()
    }

    try {
      this.socket.send(JSON.stringify({ connections: serverIds }))
    } catch (error) {
      console.error('VoiceConnection websocket socket.send failed', error)
    }
  }
}

export class PlayerWebSocket {
  private wsServer: ws.Server
  private socket!: ws
  private timer!: NodeJS.Timer
  private player?: MusicPlayer
  private nowPlaying?: Listing
  private b64Art?: string

  constructor(private guildId: string) {
    this.wsServer = new ws.Server({ noServer: true })
    this.player = Golem.getPlayer(guildId)

    if (this.player) {
      this.wsServer.on('close', () => {
        clearInterval(this.timer)
      })

      this.wsServer.on('connection', this.onConnection.bind(this))
    }
  }

  handleUpgrade(request: any, socket: Socket, head: any): void {
    this.wsServer.handleUpgrade(request, socket, head, (socket) => {
      this.wsServer.emit('connection', socket, request)
    })
  }

  private onConnection(socket: ws, _request: IncomingMessage): void {
    console.log('GOT ONCONNECTION', socket)
    this.socket = socket

    this.setUpdateInterval()
  }

  private setUpdateInterval(): void {
    this.timer = setInterval(async () => {
      await this.updateNowPlaying()
    }, 2000)
  }

  private async updateNowPlaying(): Promise<void> {
    if (this.player?.nowPlaying) {
      const np = this.player.nowPlaying
      if (this.nowPlaying?.trackId !== np.trackId) {
        this.nowPlaying = np
        this.b64Art = (await resize(np.albumArt)).toString('base64')
      }

      const currentTime = this.player.currentTrackRemaining

      try {
        this.socket.send(
          JSON.stringify({
            nowPlaying: {
              ...np,
              albumArt: this.b64Art,
            },
            currentTime,
          })
        )
      } catch (error) {
        console.error(error)
        console.error('SOCKET SEND FAILED!')
      }
    }
  }
}
