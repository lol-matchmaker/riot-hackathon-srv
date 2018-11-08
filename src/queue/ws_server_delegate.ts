import http = require('http');
import WebSocket = require('ws');

/** Interface between the WebSocket server and the Multiplexer. */
export interface WsServerDelegate {
  /** Called when a WebSocket connection is accepted. */
  onWsConnection(socket: WebSocket, request: http.IncomingMessage): void;
}
