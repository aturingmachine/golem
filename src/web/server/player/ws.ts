import { IncomingMessage } from 'http'
import { Socket } from 'net'
import { Snowflake } from 'discord-api-types'
import ws from 'ws'
import { Golem } from '../../../golem'
import { GolemEvent } from '../../../golem/event-emitter'
import { Listing } from '../../../models/listing'
import { MusicPlayer } from '../../../player/music-player'
// import { resize } from '../../../utils/image-utils'
import { GolemLogger } from '../../../utils/logger'

export class VoiceConnectionsWebSocket {
  private wsServer: ws.Server
  private socket!: ws
  private timer!: NodeJS.Timer

  constructor() {
    console.log('Making new VS Web Socket.')
    this.wsServer = new ws.Server({ noServer: true })
    this.wsServer.on('connection', this.onConnection.bind(this))

    Golem.events.on(
      GolemEvent.Connection,
      'connection-ws',
      this.updateConnections.bind(this)
    )
  }

  handleUpgrade(request: any, socket: Socket, head: any): void {
    this.wsServer.handleUpgrade(request, socket, head, (socket) => {
      this.wsServer.emit('connection', socket, request)
    })
  }

  private onConnection(socket: ws, _request: IncomingMessage): void {
    this.socket = socket

    this.timer = setInterval(() => {
      this.updateConnections()
    }, 10000)

    this.updateConnections()
  }

  private updateConnections(): void {
    const serverIds: { id: Snowflake; isPlaying: boolean; name: string }[] = []
    const it = Golem.playerCache.entries()

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
      // this.wsServer.once('connection', this.setUpdateInterval.bind(this))
    }
  }

  handleUpgrade(request: any, socket: Socket, head: any): void {
    this.wsServer.handleUpgrade(request, socket, head, (socket) => {
      this.wsServer.emit('connection', socket, request)
    })
  }

  private onConnection(socket: ws, _request: IncomingMessage): void {
    this.socket = socket

    this.setUpdateInterval()
  }

  private setUpdateInterval(): void {
    this.timer = setInterval(async () => {
      await this.updateNowPlaying()
    }, 500)
  }

  private async updateNowPlaying(): Promise<void> {
    // if (this.player?.nowPlaying) {
    //   let data
    //   const np = this.player.nowPlaying
    //   const currentTime = this.player.currentTrackRemaining
    //   if (this.nowPlaying?.trackId !== np.trackId) {
    //     this.nowPlaying = np
    //     this.b64Art = (await resize(np.albumArt, 300)).toString('base64')
    //     data = {
    //       nowPlaying: { ...np, albumArt: this.b64Art },
    //       currentTime,
    //     }
    //   } else {
    //     data = {
    //       currentTime: this.player.currentTrackRemaining,
    //     }
    //   }
    //   try {
    //     this.socket.send(JSON.stringify(data))
    //   } catch (error) {
    //     console.error(error)
    //     console.error('SOCKET SEND FAILED!')
    //   }
    // }
  }
}

export class QueueWebSocket {
  private wsServer: ws.Server
  private socket!: ws
  private timer!: NodeJS.Timer
  private player?: MusicPlayer
  private imageCache: Record<string, string> = {}

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
    this.socket = socket

    Golem.events.on(
      GolemEvent.Queue,
      `${this.guildId}-queue-ws`,
      this.updateQueue.bind(this)
    )

    this.updateQueue()
  }

  private async updateQueue(): Promise<void> {
    const queue = this.player?.peek(-1)

    if (queue) {
      const data = []
      for (const item of queue) {
        if (!this.imageCache[item.metadata.album]) {
          // const art = (await resize(item.meta.albumArt, 100)).toString('base64')
          // this.imageCache[item.meta.album] = art
        }

        data.push({
          ...item.metadata,
          albumArt: this.imageCache[item.metadata.album],
        })
      }
      // const data = {
      //   queue: queue.map((t) => ({
      //     ...t.listing,
      //     albumArt: (await resize(t.listing.albumArt, 100)).toString('base64'),
      //   })),
      // }

      this.socket.send(JSON.stringify({ queue: data }))
    }
  }
}

export class LogWebSocket {
  private wsServer: ws.Server
  private socket!: ws
  private player?: MusicPlayer
  private imageCache: Record<string, string> = {}

  constructor() {
    this.wsServer = new ws.Server({ noServer: true })

    this.wsServer.on('connection', this.onConnection.bind(this))
  }

  handleUpgrade(request: any, socket: Socket, head: any): void {
    this.wsServer.handleUpgrade(request, socket, head, (socket) => {
      this.wsServer.emit('connection', socket, request)
    })
  }

  private onConnection(socket: ws, _request: IncomingMessage): void {
    this.socket = socket

    // Golem.on('queue', `${this.guildId}-queue-ws`, this.updateQueue.bind(this))

    this.streamLogs()
  }

  private async streamLogs(): Promise<void> {
    GolemLogger.on('data', (data: any) => {
      this.socket.send(JSON.stringify(data))
    })
  }
}
