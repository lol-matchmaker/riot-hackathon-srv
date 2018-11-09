import http = require('http');

import WebSocket = require('ws');

import { WsApp } from './ws_app';
import { QueueClientDelegate, QueueClient, QueueClientState } from './queue_client';

/** Manages all of the server's WebSocket clients. */
export class SwitchBox implements WsApp, QueueClientDelegate {
  /** The clients that are being authenticated. */
  private readonly limbo: Set<QueueClient>;
  /** The clients that are signed in and ready for player start. */
  private readonly ready: Set<QueueClient>;
  /** The clients that started and are queued for a match. */
  private readonly queued: Set<QueueClient>;
  private readonly allQueues: Set<QueueClient>[];

  public constructor() {
    this.limbo = new Set();
    this.ready = new Set();
    this.queued = new Set();
    this.allQueues = [this.limbo, this.ready, this.queued];
  }

  public onWsConnection(socket: WebSocket,
                        request: http.IncomingMessage): void {
    const client = new QueueClient(socket, this);
    this.limbo.add(client);
  }

  public onClientStateChange(client: QueueClient, state: QueueClientState):
      void {
    switch (state) {
      case 'new':
      case 'challenged':
        this.limbo.add(client);
        break;
      case 'authenticated':
        this.limbo.delete(client);
        this.ready.add(client);
        break;
      case 'closed':
        for (const set of this.allQueues) {
          set.delete(client);
        }
        break;
      default:
        throw new Error(`Unsupported client state ${state}`);
    }
  }
}
