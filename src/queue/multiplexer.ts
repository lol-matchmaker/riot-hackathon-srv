import http = require('http');

import Koa = require('koa');
import WebSocket = require('ws');
import { AddressInfo } from 'net';

/** Multiplexes a REST API server and a WebSockets server on the same socket. */
export class Multiplexer {
  /** The REST API server. */
  public readonly app: Koa;
  /** The IP address of the HTTP API server. */
  private address: AddressInfo | null;
  /** The HTTP server multiplexing the REST and WebSocket server. */
  private readonly httpServer: http.Server;
  /** The TCP port this HTTP server will listen to. */
  private readonly port: number;
  /** The WebSocket server. */
  public wsServer: WebSocket.Server | null;

  public constructor(app: Koa, port: number) {
    this.address = null;
    this.app = app;
    this.httpServer = http.createServer(app.callback());
    this.port = port;
    this.wsServer = null;
  }

  public listen(): void {
    if ((this.address !== null) || (this.wsServer !== null)) {
      throw new Error('Already listening');
    }

    this.wsServer = new WebSocket.Server({
      server: this.httpServer,
    });
    this.wsServer.on('connection', this.onWsConnection.bind(this));

    this.httpServer.listen(this.port, () => {
      // as AddressInfo
      this.address = this.httpServer.address() as AddressInfo;
    });
  }

  private onWsConnection(socket: WebSocket,
                         request: http.IncomingMessage): void {
    console.log(request);
    socket.terminate();
  }
}
