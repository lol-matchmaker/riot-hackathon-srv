import crypto = require('crypto');

import WebSocket = require('ws');

import { Profile } from "../db/profile";
import { ChallengeMessage, WsMessage, WelcomeMessage, QueuedMessage,
         DequeuedMessage, MatchedMessage, MatchedMessagePlayerRole }
    from './ws_messages';
import { findProfileByAccountId } from '../fetcher/resolver';
import { fetchSummonerVerification } from '../fetcher/riot_fetcher';

export type QueueClientState =
    'new' | 'challenged' | 'ready' | 'queued' | 'matched' | 'closed';

export interface QueueClientDelegate {
  onClientStateChange(client: QueueClient, state: QueueClientState): void;
  onClientQueueRequest(client: QueueClient): void;
  onClientQueueCancel(client: QueueClient): void;
}

export interface MatchPlayerData {
  profile: Profile,
  role: MatchedMessagePlayerRole,
}

/** Tracks a connection to an app client. */
export class QueueClient {
  /** The delegate receives state change notifications. */
  private readonly delegate: QueueClientDelegate;
  /** The profile of the most recently authenticated user. */
  private lastProfile: Profile | null;
  /** The last challenge token sent to the client. */
  private lastToken: string | null;
  /** Most recent  status reported to the switch box. */
  private lastState: QueueClientState;
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

  public constructor(socket: WebSocket, delegate: QueueClientDelegate) {
    this.delegate = delegate;
    this.lastProfile = null;
    this.lastState = 'new';
    this.lastToken = null;

    this.socket = socket;
    this.socket.onclose = this.onWsClose.bind(this);
    this.socket.onerror = this.onWsError.bind(this);
    this.socket.onmessage = this.onWsMessage.bind(this);

    this.challenge();  // Promise intentionally ignored.
  }

  /** Last authenticated profile. */
  public profile(): Profile | null { return this.lastProfile; }
  /** Last reported state. */
  public state(): QueueClientState { return this.lastState; }

  /** Notifies the client they were added to the match-making queue. */
  public wasQueued(): void {
    const message : QueuedMessage = { type: 'queued' };
    this.socket.send(JSON.stringify(message));
    this.setState('queued');
  }

  /** Notifies the client they were removed from the match-making queue. */
  public wasDequeued(): void {
    const message : DequeuedMessage = { type: 'dequeued' };
    this.socket.send(JSON.stringify(message));
    this.setState('ready');
  }

  /** Notifies the client that they were added to a match. */
  public wasMatched(players: MatchPlayerData[]): void {
    const message : MatchedMessage = { type: 'matched', players: [] };
    for (const player of players) {
      message.players.push({
        account_id: player.profile.account_id,
        summoner_id: player.profile.summoner_id,
        role: player.role,
      });
    }
    this.socket.send(JSON.stringify(message));
    this.setState('matched');
  }

  /** Creates a challenge token and sends it to the client app. */
  private async challenge(): Promise<void> {
    this.lastProfile = null;
    this.setState('new');

    const token = await QueueClient.createToken();
    this.lastToken = token;

    const message : ChallengeMessage = { type: 'challenge', token };
    this.socket.send(JSON.stringify(message));
    this.setState('challenged');
  }

  /** Attempts to authenticate a client app. */
  private async authenticate(accountId: string, summonerId: string) {
    if (this.lastState !== 'challenged') {
      // TODO(pwnall): Close the socket?
      return;
    }

    let profile: Profile;
    try {
      profile = await findProfileByAccountId(accountId);
    } catch (findError) {
      console.error(findError);
      await this.challenge();
      return;
    }

    let token: string;
    try {
      token = await fetchSummonerVerification(profile.summoner_id);
    } catch (fetchError) {
      console.error(fetchError);
      await this.challenge();
      return;
    }

    if (summonerId !== profile.summoner_id || token !== this.lastToken) {
      await this.challenge();
      return;
    }

    this.lastProfile = profile;

    const message: WelcomeMessage = { type: 'ready' };
    this.socket.send(JSON.stringify(message));
    this.setState('ready');
  }

  private setState(state: QueueClientState): void {
    if (state === this.lastState) {
      return;
    }

    this.lastState = state;
    this.delegate.onClientStateChange(this, state);
  }

  private onWsClose(_: CloseEvent): void {
    console.log('Client WS closed');
    this.setState('closed');
  }

  private onWsError(error: Error): void {
    console.error('Client WS error');
    console.error(error);
  }

  private onWsMessage(event: MessageEvent): void {
    console.log('Client WS message');

    const message: WsMessage = JSON.parse(event.data);
    console.log(message);
    switch (message.type) {
      case 'auth':
        const accountId = message.accountId;
        const summonerId = message.summonerId;
        this.authenticate(accountId, summonerId);  // Promise ignored.
        break;
      case 'plsqueue':
        if (this.lastState !== 'ready') {
          // TODO(pwnall): Close socket?
          return;
        }
        this.delegate.onClientQueueRequest(this);
        break;
      case 'noqueue':
        if (this.lastState !== 'queued') {
          // TODO(pwnall): Close socket?
          return;
        }
        this.delegate.onClientQueueCancel(this);
        break;
    }
  }
}
