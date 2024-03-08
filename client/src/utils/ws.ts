import { io } from "socket.io-client";

export class WebSocketClient {
  private static _socket: ReturnType<typeof io>
  private static url: string

  private static ids: string[] = []

  static init(): void {
    if (WebSocketClient._socket) {
      return
    }

    WebSocketClient.url = 'ws://' + __API_HOST__ + ''

    console.log('[ws] using url:', WebSocketClient.url)

    WebSocketClient._socket = io(WebSocketClient.url)

    WebSocketClient._socket.on("connect", () => {
      console.log(WebSocketClient._socket.id)
    });

    WebSocketClient._socket.on("disconnect", () => {
      console.log(WebSocketClient._socket.id)
    });
  }

  static listen(
    id: string,
    key: string,
    handler: (...args: any[]) => Promise<void> | void
  ): void {
    WebSocketClient.init()

    if (WebSocketClient.ids.includes(id)) {
      return
    }

    WebSocketClient._socket.on(key, handler)
    WebSocketClient.ids.push(id)
  }
}
