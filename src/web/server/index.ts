import { Socket } from 'net'
import express from 'express'
import { Config } from '../../utils/config'
import { GolemLogger, LogSources } from '../../utils/logger'
import { cors } from './middleware/cors'
import {
  playerRouter,
  PlayerWebSocket,
  VoiceConnectionsWebSocket,
} from './player'

const log = GolemLogger.child({ src: LogSources.API })

export const startApi = (): void => {
  const app = express()

  app.use(cors)

  app.use('/api/player', playerRouter)

  log.debug(`Attempting to run on port ${Config.Web.APIPort}`)

  const server = app.listen(Config.Web.APIPort)
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
  })
}
