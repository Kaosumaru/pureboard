import { canUserMoveAsPlayer, createGameRoomStore, GameRoomData, GameRoomState, seatOf, UserInfo } from '../shared/gameRoomStore';
import { GameOptions, Store } from '../shared/interface';
import { RPCClient } from 'yawr';
import { BaseClient } from './baseClient';

export class GameRoomClient extends BaseClient {
  public gameId: number | undefined;
  public gamePassword: string | undefined;
  public userInfo: UserInfo | undefined;
  public store: Store<GameRoomState>;

  constructor(path = '/ws') {
    const url = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host + path;
    super(new RPCClient(url));
    this.store = createGameRoomStore();

    this.onEvent('game/tookSeat', (roomId: number, userId: UserInfo, seat: number) => {
      if (this.gameId !== roomId) return;
      this.state().tookSeat(userId, seat);
    });

    this.onEvent('game/leftSeat', (roomId: number, seat: number) => {
      if (this.gameId !== roomId) return;
      this.state().leftSeat(seat);
    });

    this.onEvent('game/sendSeatsState', (roomId: number, stateData: GameRoomData) => {
      if (this.gameId !== roomId) return;
      this.state().setState(stateData);
    });

    this.onEvent('game/closed', (roomId: number) => {
      if (this.gameId !== roomId) return;
      this.state().close();
    });
  }

  public getClient(): RPCClient {
    return this.client;
  }

  public seatOf(): number {
    return seatOf(this.userInfo?.id ?? '', this.state());
  }

  public haveSeat(index: number): boolean {
    return canUserMoveAsPlayer(this.userInfo?.id ?? '', this.state(), index);
  }

  public isSeatEmpty(index: number): boolean {
    return this.state().seats[index] == null;
  }

  public async start(token: string | undefined): Promise<boolean> {
    if (!token) {
      this.disconnect();
      return false;
    }
    await this.client.connect();
    this.userInfo = await this.client.authorize(token);
    if (!this.userInfo) {
      this.disconnect();
      return false;
    }
    return true;
  }

  public disconnect(): void {
    this.client.disconnect();
  }

  public async reconnect(token: string | undefined): Promise<void> {
    await this.client.reconnect();
    await this.start(token);
    if (this.gameId) await this.join(this.gameId, this.gamePassword);
  }

  public async createRoom(game: string, options: GameOptions): Promise<[number, string | undefined]> {
    const state = await this.client.call<GameRoomData>(`${game}/createGame`, options);
    this.state().setState(state);
    this.gameId = state.id;
    this.gamePassword = state.password;

    return [this.gameId, state.password];
  }

  public async join(gameId: number, password?: string): Promise<number> {
    await this.client.call<number>('game/join', gameId, password);
    this.gameId = gameId;
    this.gamePassword = password;

    const state = await this.getState();
    this.state().setState(state);

    return this.gameId;
  }

  public async takeSeat(seat: number): Promise<void> {
    await this.client.call('game/takeSeat', this.gameId, seat);
  }

  public async leaveSeat(seat: number): Promise<void> {
    await this.client.call('game/leaveSeat', this.gameId, seat);
  }

  public async takeAvailableSeat(): Promise<number> {
    return await this.client.call<number>('game/takeAvailableSeat', this.gameId);
  }

  public async close(): Promise<void> {
    await this.client.call('game/close', this.gameId);
  }

  public async getState(): Promise<GameRoomData> {
    return await this.client.call<GameRoomData>('game/getSeatsState', this.gameId);
  }

  private state() {
    return this.store.getState();
  }
}
