import { Socket } from 'net'
import express from 'express'
import { GolemConf } from '../../config'
import { GolemLogger, LogSources } from '../../utils/logger'
import { cors } from './middleware/cors'
import { playerRouter } from './player/rest'
import {
  LogWebSocket,
  PlayerWebSocket,
  QueueWebSocket,
  VoiceConnectionsWebSocket,
} from './player/ws'

const log = GolemLogger.child({ src: LogSources.API })

export const startApi = (): void => {
  log.info('mounting express server')
  const app = express()

  app.use(cors)

  app.use('/api/player', playerRouter)

  log.verbose(`Attempting to run on port ${GolemConf.web.apiPort}`)

  const server = app.listen(GolemConf.web.apiPort)
  log.info('server mounted')
  let connectionWs: VoiceConnectionsWebSocket

  server.on('upgrade', (request, socket: Socket, head) => {
    const pathname = request.url
    if (!connectionWs) {
      connectionWs = new VoiceConnectionsWebSocket()
    }

    if (pathname === '/ws/connections') {
      connectionWs.handleUpgrade(request, socket, head)
    }

    if (pathname?.startsWith('/ws/nowplaying')) {
      const id = pathname.split('/')[3]

      if (id) {
        const playerWs = new PlayerWebSocket(id)

        playerWs.handleUpgrade(request, socket, head)
      }
    }

    if (pathname?.startsWith('/ws/queue')) {
      const id = pathname.split('/')[3]

      if (id) {
        const queueWs = new QueueWebSocket(id)

        queueWs.handleUpgrade(request, socket, head)
      }
    }

    if (pathname?.startsWith('/ws/logs')) {
      const logWs = new LogWebSocket()

      logWs.handleUpgrade(request, socket, head)
    }
  })
}
