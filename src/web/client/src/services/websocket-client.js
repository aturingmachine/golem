class WebSocketClient {
  uri
  websocket
  onMessageFuncs = {}

  open = new Promise(resolve => {
    resolve(this.websocket)
  })

  constructor(uri) {
    this.uri = uri
    this.websocket = new WebSocket(this.uri)

    this.websocket.onopen = () => {
      this.open.then(ws => ws)
    }
  }

  send(data) {
    this.websocket.send(data)
  }

  addMessageHandler(
    key,
    handler
  ) {
    this.onMessageFuncs[key] = handler.bind(this)
    this.setMessageHandlers()
  }

  removeMessageHandler(key) {
    delete this.onMessageFuncs[key]
    this.setMessageHandlers()
  }

  setMessageHandlers() {
    this.websocket.onmessage = (ev) => {
      Object.values(this.onMessageFuncs).forEach(func => func(ev))
    }
  }

  close() {
    this.websocket.close()
  }
}

export class VoiceConnectionsWebSocketClient extends WebSocketClient {
  constructor() {
    super('ws://localhost:3000/ws/connections')
  }

  addLogStreamHandler(handler) {
    this.addMessageHandler('VoiceConnectionHandler', handler)
  }
}

export class PlayerWebSocketClient extends WebSocketClient {
  constructor(channelId) {
    super(`ws://localhost:3000/ws/nowplaying/${channelId}`)
    this.channelId = channelId
  }

  addStatusHandler(handler) {
    this.addMessageHandler(`${this.channelId}-PlayerHandler`, handler)
  }
}