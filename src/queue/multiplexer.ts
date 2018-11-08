import http = require('http');
import net = require('net');

import Koa = require('koa');
import WebSocket = require('ws');

/** Multiplexes a REST API server and a WebSockets server on the same socket. */
export class Multiplexer {
  /** The REST API server. */
  public readonly app: Koa;
  /** The IP address of the HTTP API server. */
  private address: net.AddressInfo | null;
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

  /** Starts listening on HTTP. */
  public async listen(): Promise<void> {
    if ((this.address !== null) || (this.wsServer !== null)) {
      throw new Error('Already listening');
    }

    this.wsServer = new WebSocket.Server({
      server: this.httpServer,
    });
    this.wsServer.on('connection', this.onWsConnection.bind(this));

    const listenPromise = new Promise(resolve => {
      this.httpServer.listen(this.port, resolve);
    });
    await listenPromise;

    // "as AddressInfo" is safe because address() only returns strings for
    // pipes and UNIX sockets.
    this.address = this.httpServer.address() as net.AddressInfo;
  }

  /** Stops serving the HTTP socket. Must be called while listening. */
  public async close() {
    if (this.address === null || this.wsServer === null) {
      throw new Error('Not listening');
    }

    this.address = null;

    const wsServerClosePromise = new Promise(resolve => {
      // "as WebSocket.Server" is safe because we just checked that
      // wsServer !== null in the if at the beginning of the function. The TS
      // checker doesn't know that the Promise inner function is invoked
      // synchronously.
      (this.wsServer as WebSocket.Server).close(resolve);
    });
    await wsServerClosePromise;

    this.wsServer = null;
    this.httpServer
    const httpServerClosePromise = new Promise(resolve => {
      this.httpServer.close(resolve);
    });
    await httpServerClosePromise;
  }

  /** This server's HTTP URL. */
  public httpUrl(): string | null {
    if (this.address === null) {
      return null;
    }

    return `http://localhost:${this.address.port}`;
  }

  /** This server's WebSockets URL. */
  public wsUrl(): string | null {
    if (this.address === null) {
      return null;
    }

    return `ws://localhost:${this.address.port}`;
  }

  /** Developer-friendly listen address.
   *
   * This is intended to be displayed in "Listening to ..." messages.
   */
  public listenAddress(): string | null {
    if (this.address === null) {
      return null;
    }

    return `${this.address.address}:${this.address.port}`;
  }

  /** Called when a new WebSocket connects. */
  private onWsConnection(socket: WebSocket,
                         request: http.IncomingMessage): void {
    console.log(request);
    socket.send(JSON.stringify({type: 'welcome'}));
  }
}
