import http = require('http');

import WebSocket = require('ws');

import { WsApp } from './ws_app';
import { QueueClientDelegate, QueueClient, QueueClientState } from './queue_client';
import { Profile } from '../db/profile';

/** Manages all of the server's WebSocket clients. */
export class SwitchBox implements WsApp, QueueClientDelegate {
  /** The clients that are being authenticated. */
  private readonly limbo: Set<QueueClient>;
  /** The clients that are signed in and ready for player start. */
  private readonly ready: Set<QueueClient>;
  /** The clients that started and are queued for a match. */
  private readonly queued: Set<QueueClient>;
  /** The clients that are in a match. */
  private readonly matched: Set<QueueClient>;
  private readonly allQueues: Set<QueueClient>[];

  public constructor() {
    this.limbo = new Set();
    this.ready = new Set();
    this.queued = new Set();
    this.matched = new Set();
    this.allQueues = [this.limbo, this.ready, this.queued, this.matched];
  }

  public stats(): { [key: string]: string | number } {
    return {
      limbo: this.limbo.size,
      ready: this.ready.size,
      queued: this.queued.size,
      matched: this.matched.size,
    };
  }

  // WsApp
  public onWsConnection(socket: WebSocket,
                        request: http.IncomingMessage): void {
    const client = new QueueClient(socket, this);
    this.limbo.add(client);
  }

  // QueueClientDelegate
  public onClientStateChange(client: QueueClient, state: QueueClientState):
      void {
    switch (state) {
      case 'new':
      case 'challenged':
        this.limbo.add(client);
        break;
      case 'ready':
        this.limbo.delete(client);
        this.ready.add(client);
        break;
      case 'queued':
        if (!this.queued.has(client)) {
          throw new Error('Client was not supposed to be queued');
        }
        break;
      case 'matched':
        if (!this.matched.has(client)) {
          throw new Error('Client was not supposed to be matched');
        }
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
  public onClientQueueRequest(client: QueueClient): void {
    if (!this.ready.delete(client)) {
      throw new Error("Client was not ready to be queued");
    }
    this.queued.add(client);
    client.wasQueued();
    this.handleQueueChange(client, true);
  }
  public onClientQueueCancel(client: QueueClient): void {
    if (!this.queued.delete(client)) {
      throw new Error("Client was not queued");
    }
    this.ready.add(client);
    client.wasDequeued();
    this.handleQueueChange(client, false);
  }

  /** The clients queued for match-making changed. Try to find a match. */
  private handleQueueChange(client: QueueClient, added: boolean) {
    // Index the queued clients.
    const profiles: Profile[] = [];
    const clientsByProfile = new Map<Profile, QueueClient>();
    for (const client of this.queued) {
      // "as Profile" is safe because all the clients in the queue must have
      // been authenticated.
      const profile = client.profile() as Profile;
      profiles.push(profile);
      clientsByProfile.set(profile, client);
    }

    // Try to find a match.
    let match: Profile[] | null = null;
    if (profiles.length >= 2) {
      match = [profiles[0], profiles[1]];
    }

    // Make the match happen.
    if (!match) {
      return;
    }
    for (const matchedProfile of match) {
      // "as QueueClient" is safe here because clientsByProfile contains all
      // Profile instances in profiles, and match is a subset of profiles.
      const matchedClient = clientsByProfile.get(matchedProfile) as QueueClient;
      this.queued.delete(matchedClient);
      this.matched.add(matchedClient);

      matchedClient.wasMatched(match);
    }
  }
}
