import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets'
import { Socket, Server } from 'socket.io'
import { LoggerService } from '../core/logger/logger.service'
import { WebService } from './web.service'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  allowEIO3: true,
})
export class WS {
  @WebSocketServer()
  server!: Server

  constructor(private log: LoggerService, private webService: WebService) {
    this.log.setContext('WebSocket')
    this.log.info('WS Gateway started.')

    setInterval(() => {
      this.updatePlayers()
      this.updateResourceUsage()
    }, 3000)

    setInterval(async () => {
      await this.updateAudits()
    }, 6_000)
  }

  @SubscribeMessage('events')
  handleEvent(
    @MessageBody('id') id: number,
    @ConnectedSocket() client: Socket
  ): number {
    this.log.info(`ws pinged: ${id}`)

    client.emit('events', id)

    return id
  }

  updatePlayers(): void {
    this.server.emit('players_update', this.webService.allPlayers())
  }

  updateResourceUsage(): void {
    this.server.emit('resource_update', {
      data: this.webService.resourceData(),
    })
  }

  async updateAudits(): Promise<void> {
    this.server.emit('audit_update', await this.webService.allAudits())
  }
}
