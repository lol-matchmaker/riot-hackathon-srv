import crypto = require('crypto');
import http = require('http');
import util = require('util');



import WebSocket = require('ws');

import { WsServerDelegate } from './ws_server_delegate';

/** Tracks a connection to an app client. */
class QueueClient {
  /** The WebSocket connection. */
  private readonly socket: WebSocket;

  /** Returns a cryptographically secure random token. */
  public static async createToken(): Promise<string> {
    const cryptoRandomPromise = new Promise<Buffer>((resolve, reject) => {
      crypto.randomBytes(32, (error: Error, buffer: Buffer) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(buffer);
      });
    });

    const buffer = await cryptoRandomPromise;
    // TODO(pwnall): Use base32. Base64 won't work, due to the set of allowable
    //               characters.
    return buffer.toString('hex');
  }

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
