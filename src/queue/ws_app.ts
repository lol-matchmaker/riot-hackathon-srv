import http = require('http');
import WebSocket = require('ws');

/** Implemented by the WebSockets application exposed to the Multiplexer. */
export interface WsApp {
  /** Called when a new WebSocket connects to the Multiplexer.
   *
   * After this function is called, the WebSockets application owns the socket
   * and is responsible for closing it.
   */
  onWsConnection(socket: WebSocket, request: http.IncomingMessage): void;
}
