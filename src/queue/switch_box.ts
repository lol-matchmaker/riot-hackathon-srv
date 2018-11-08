import crypto = require('crypto');
import http = require('http');
import WebSocket = require('ws');

import { WsServerDelegate } from './ws_server_delegate';

/** Tracks a connection to an app client. */
class QueueClient {
  /** The WebSocket connection. */
  private readonly socket: WebSocket;

  public constructor(socket: WebSocket) {
    this.socket = socket;
    this.socket.onclose = this.onWsClose.bind(this);
    this.socket.onerror = this.onWsError.bind(this);
    this.socket.onmessage = this.onWsMessage.bind(this);
  }

  private onWsClose(_: CloseEvent): void {
    console.log('Client WS closed');
  }

  private onWsError(error: Error): void {
    console.error('Client WS error');
    console.error(error);
  }

  private onWsMessage(event: MessageEvent): void {
    const message = JSON.parse(event.data);
    console.log('Client WS message');
    console.log(message);
  }
}

/** Manages all of the server's WebSocket clients. */
export class SwitchBox implements WsServerDelegate {
  public constructor() {
  }

  public onWsConnection(socket: WebSocket,
                        request: http.IncomingMessage): void {
    const client = new QueueClient(socket);
  }
}
