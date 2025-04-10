import { canUserMoveAsPlayer, GameRoomData, UserInfo } from '../shared/gameRoomStore';
import { Context } from 'yawr';
import { CurrentPlayerValidation, GameOptions } from '../shared/interface';
import { generate as generateRandomString } from 'randomstring';
import { IServer } from './interface';

export type ComponentConstructor = (id: number) => [string, never];
export type Component = [string, never];
type ComponentsMap = { [id: string]: never };

interface GameRoom {
  data: GameRoomData;
  joinedPlayers: Map<string, number>;
  components: ComponentsMap;
}

function arrayToComponents(id: number, arr: ComponentConstructor[]): ComponentsMap {
  const result: ComponentsMap = {};
  for (const constructor of arr) {
    const [key, component] = constructor(id);
    result[key] = component;
  }
  return result;
}

const games = new Map<number, GameRoom>();
let lastId = 0;

export function createCurrentPlayerValidation(ctx: Context, gameId: number): CurrentPlayerValidation {
  const game = getGameRoomData(ctx, gameId);
  const userId = ctx.userId ?? '';
  const userName = ctx.userName ?? '';

  return {
    isUser: (id: string, name: string) => id === userId && name === userName,
    canMoveAsPlayer: (player: number) => canUserMoveAsPlayer(userId, game, player),
    isServerOriginating: () => false,
  };
}

export function canUserMoveAsPlayerInGame(userId: string, gameId: number, playerId: number): boolean {
  const game = games.get(gameId);
  if (!game) throw new Error('Game not found');
  return canUserMoveAsPlayer(userId, game.data, playerId);
}

function groupOf(gameRoom: GameRoomData): string {
  return `game/${gameRoom.id}`;
}

function userInfoFromContext(ctx: Context): UserInfo {
  return { id: ctx.userId ?? '', name: ctx.userName ?? '' };
}

export function getGameComponent<T>(gameId: number, type: string): T {
  const game = games.get(gameId);
  if (!game) throw new Error('Game not found');
  const component = game.components[type];
  if (!component) throw new Error('Component not found');
  return component;
}

function getGameRoomData(ctx: Context, gameId: number): GameRoomData {
  if (ctx.userId === undefined) throw new Error('Not authorized');
  const game = games.get(gameId);
  if (!game) throw new Error('Game not found');
  if (!game.joinedPlayers.has(ctx.userId)) throw new Error('Not joined to this game');
  return game.data;
}

function joinGame(ctx: Context, gameId: number, password?: string): GameRoomData {
  if (ctx.userId === undefined) throw new Error('Not authorized');
  const game = games.get(gameId);
  if (!game) throw new Error('Game not found');
  if (game.data.password && game.data.password !== password) throw new Error('Invalid password');
  const prevValue = game.joinedPlayers.get(ctx.userId);
  game.joinedPlayers.set(ctx.userId, (prevValue ?? 0) + 1);
  ctx.addToGroup(groupOf(game.data));
  return game.data;
}

export function createGameRoomAndJoin(ctx: Context, options: GameOptions, type: string, components: ComponentConstructor[], timeout: number): GameRoomData {
  const gameRoom = createGameRoom(options, type, components, timeout);

  gameRoom.joinedPlayers.set(ctx.userId ?? '', 1);
  ctx.addToGroup(groupOf(gameRoom.data));

  return gameRoom.data;
}

export function closeGame(gameId: number): GameRoom | undefined {
  const game = games.get(gameId);
  if (!game) return undefined;

  games.delete(gameId);
  return game;
}

export function createGameRoom(options: GameOptions, type: string, components: ComponentConstructor[], timeout?: number): GameRoom {
  lastId++;
  const id = lastId;

  const seats = Array.from({ length: options.players }, () => null);
  const data: GameRoomData = {
    id,
    seats,
    type,
    timeoutToClose: timeout,
    closed: false,
    password: generateRandomString({ length: 8, charset: 'alphanumeric', capitalization: 'lowercase' }),
  };

  const game: GameRoom = {
    data,
    joinedPlayers: new Map<string, number>(),
    components: arrayToComponents(id, components),
  };

  games.set(id, game);

  return game;
}

export function registerGames(server: IServer): void {
  const deleteGame = (gameId: number) => {
    const game = closeGame(gameId);
    if (!game) return;
    server.onGroupRemoved(groupOf(game.data), undefined);
  };

  const createTimeoutDelete = (gameId: number, group: string, timeout?: number) => {
    // delete the room if it's empty for emptyRoomLifetime
    if (timeout === undefined) return;
    server.onGroupRemoved(group, () =>
      setTimeout(() => {
        if (server.groupMemberCount(group) === 0) {
          deleteGame(gameId);
        }
      }, timeout)
    );
  };

  server.RegisterFunction('game/join', (ctx, gameId: number, password?: string) => {
    joinGame(ctx, gameId, password);
    return gameId;
  });

  server.RegisterFunction('game/takeSeat', (ctx, gameId: number, seat: number) => {
    const game = getGameRoomData(ctx, gameId);
    if (game.seats[seat]) throw new Error('Seat is taken');

    const userInfo = userInfoFromContext(ctx);

    game.seats[seat] = userInfo;

    const group = groupOf(game);
    ctx.emitToGroup(group, 'game/tookSeat', gameId, userInfo, seat);

    createTimeoutDelete(gameId, group, game.timeoutToClose);
  });

  server.RegisterFunction('game/leaveSeat', (ctx, gameId: number, seat: number) => {
    const game = getGameRoomData(ctx, gameId);
    if (game.seats[seat]?.id !== ctx.userId) throw new Error('Not authorized');

    game.seats[seat] = null;
    const group = groupOf(game);
    ctx.emitToGroup(group, 'game/leftSeat', gameId, seat);
  });

  server.RegisterFunction('game/takeAvailableSeat', (ctx, gameId: number) => {
    const game = getGameRoomData(ctx, gameId);
    const alreadySeated = game.seats.findIndex(userId => userId?.id == ctx.userId);
    if (alreadySeated !== -1) return alreadySeated;
    const seat = game.seats.findIndex(userId => !userId);
    if (seat === -1) return seat;

    const userInfo = userInfoFromContext(ctx);

    game.seats[seat] = userInfo;
    const group = groupOf(game);
    ctx.emitToGroup(group, 'game/tookSeat', gameId, userInfo, seat);

    createTimeoutDelete(gameId, group, game.timeoutToClose);
    return seat;
  });

  server.RegisterFunction('game/getSeatsState', (ctx, gameId: number) => {
    return getGameRoomData(ctx, gameId);
  });

  server.RegisterFunction('game/close', (ctx, gameId: number) => {
    if (!ctx.isAdmin) {
      throw new Error('Not authorized');
    }
    const game = getGameRoomData(ctx, gameId);
    deleteGame(gameId);

    const group = groupOf(game);
    ctx.emitToGroup(group, 'game/closed', gameId);
  });
}
