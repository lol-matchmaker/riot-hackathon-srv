import http = require('http');

import WebSocket = require('ws');

import { WsApp } from './ws_app';
import { QueueClientDelegate, QueueClient, QueueClientState, MatchPlayerData } from './queue_client';
import { Profile } from '../db/profile';
import { MatchedMessagePlayerRole, MatchedMessagePlayerInfo } from './ws_messages';

/** Used by the match-maker to report matches to the SwitchBox. */
export interface MatchResult {
  [accountId: string]: MatchedMessagePlayerRole;
}

/** Set to null for the real matcher, or to number of players to get matched.
 *
 * The debugging matcher is a pure greedy that matches the first people who
 * show up in the queue.
 */
const g_debugMatchLimit: number | null = 1;

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
    const clientsByAccountId = new Map<string, QueueClient>();
    for (const client of this.queued) {
      // "as Profile" is safe because all the clients in the queue must have
      // been authenticated.
      const profile = client.profile() as Profile;
      profiles.push(profile);
      clientsByAccountId.set(profile.account_id, client);
    }

    // Try to find a match.
    let matchResult: MatchResult | null = null;
    if (g_debugMatchLimit === null) {
      // Real matcher goes here. Takes profiles and returns MatchResult.
    } else {
      // Debugging matcher that takes the first players who show up.
      if (profiles.length >= g_debugMatchLimit) {
        matchResult = {};
        matchResult[profiles[0].account_id] = 'MID';
      }
    }

    // Make the match happen.
    if (!matchResult) {
      return;
    }
    const matchClients: QueueClient[] = [];
    const matchData: MatchPlayerData[] = [];
    for (const accountId in matchResult) {
      if (!matchResult.hasOwnProperty(accountId)) {
        continue;
      }
      const role = matchResult[accountId];

      // "as QueueClient" is safe here because clientsByProfile contains all
      // Profile instances in profiles, and match is a subset of profiles.
      const matchedClient = clientsByAccountId.get(accountId) as QueueClient;
      matchClients.push(matchedClient);

      // "as Profile" is safe here because matchClients is a subset of the
      // queued clients, all of which have been authenticated.
      const profile = matchedClient.profile() as Profile;
      matchData.push({ profile, role });
    }

    for (const matchedClient of matchClients) {
      this.queued.delete(matchedClient);
      this.matched.add(matchedClient);
      matchedClient.wasMatched(matchData);
    }
  }
}
