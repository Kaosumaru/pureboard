import { canUserMoveAsPlayer, GameRoomData, UserInfo } from '../shared/gameRoomStore';
import { Context, RPCServer } from 'yawr';
import { CurrentPlayerValidation, GameOptions } from '../shared/interface';
import { generate as generateRandomString } from 'randomstring';

interface GameRoom {
  data: GameRoomData;
  joinedPlayers: Map<string, number>;
}

const games = new Map<number, GameRoom>();
const destructors = new Map<number, (id: number) => void>();
let lastId = 0;

export function createCurrentPlayerValidation(ctx: Context, gameId: number): CurrentPlayerValidation {
  const game = getGameRoom(ctx, gameId);
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

function getGameRoom(ctx: Context, gameId: number): GameRoomData {
  if (!ctx.userId) throw new Error('Not authorized');
  const game = games.get(gameId);
  if (!game) throw new Error('Game not found');
  if (!game.joinedPlayers.has(ctx.userId)) throw new Error('Not joined to this game');
  return game.data;
}

function joinGame(ctx: Context, gameId: number, password?: string): GameRoomData {
  if (!ctx.userId) throw new Error('Not authorized');
  const game = games.get(gameId);
  if (!game) throw new Error('Game not found');
  if (game.data.password && game.data.password !== password) throw new Error('Invalid password');
  const prevValue = game.joinedPlayers.get(ctx.userId);
  game.joinedPlayers.set(ctx.userId, (prevValue ?? 0) + 1);
  ctx.addToGroup(groupOf(game.data));
  return game.data;
}

type Destructor = (id: number) => void;
export type GameConstructor = (id: number) => Destructor;

export function createGameRoomAndJoin(ctx: Context, options: GameOptions, type: string, constructors: GameConstructor[], timeout: number): GameRoomData {
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
    joinedPlayers: new Map<string, number>([[ctx.userId ?? '', 1]]),
  };
  ctx.addToGroup(groupOf(data));
  games.set(id, game);

  const ds = constructors.map(constructor => constructor(id));
  destructors.set(id, i => {
    ds.forEach(destructor => destructor(i));
  });

  return data;
}

export function registerGames(server: RPCServer): void {
  const deleteGame = (gameId: number) => {
    const game = games.get(gameId);
    if (!game) return;

    games.delete(gameId);
    const destructor = destructors.get(gameId);
    if (destructor) destructor(gameId);
    destructors.delete(gameId);

    server.onGroupRemoved(groupOf(game.data), undefined);
  };

  server.RegisterFunction('game/join', (ctx, gameId: number, password?: string) => {
    joinGame(ctx, gameId, password);
    return gameId;
  });

  server.RegisterFunction('game/takeSeat', (ctx, gameId: number, seat: number) => {
    const game = getGameRoom(ctx, gameId);
    if (game.seats[seat]) throw new Error('Seat is taken');

    const userInfo = userInfoFromContext(ctx);

    game.seats[seat] = userInfo;

    const group = groupOf(game);
    ctx.emitToGroup(group, 'game/tookSeat', gameId, userInfo, seat);

    // delete the room if it's empty for emptyRoomLifetime
    server.onGroupRemoved(group, () =>
      setTimeout(() => {
        if (server.groupMemberCount(group) === 0) {
          deleteGame(gameId);
        }
      }, game.timeoutToClose)
    );
  });

  server.RegisterFunction('game/leaveSeat', (ctx, gameId: number, seat: number) => {
    const game = getGameRoom(ctx, gameId);
    if (game.seats[seat]?.id !== ctx.userId) throw new Error('Not authorized');

    game.seats[seat] = null;
    const group = groupOf(game);
    ctx.emitToGroup(group, 'game/leftSeat', gameId, seat);
  });

  server.RegisterFunction('game/takeAvailableSeat', (ctx, gameId: number) => {
    const game = getGameRoom(ctx, gameId);
    const alreadySeated = game.seats.findIndex(userId => userId?.id == ctx.userId);
    if (alreadySeated !== -1) return alreadySeated;
    const seat = game.seats.findIndex(userId => !userId);
    if (seat === -1) return seat;

    const userInfo = userInfoFromContext(ctx);

    game.seats[seat] = userInfo;
    const group = groupOf(game);
    ctx.emitToGroup(group, 'game/tookSeat', gameId, userInfo, seat);

    // delete the room if it's empty for emptyRoomLifetime
    server.onGroupRemoved(group, () =>
      setTimeout(() => {
        if (server.groupMemberCount(group) === 0) {
          deleteGame(gameId);
        }
      }, game.timeoutToClose)
    );

    return seat;
  });

  server.RegisterFunction('game/getSeatsState', (ctx, gameId: number) => {
    return getGameRoom(ctx, gameId);
  });

  server.RegisterFunction('game/close', (ctx, gameId: number) => {
    if (!ctx.isAdmin) {
      throw new Error('Not authorized');
    }
    const game = getGameRoom(ctx, gameId);
    deleteGame(gameId);

    const group = groupOf(game);
    ctx.emitToGroup(group, 'game/closed', gameId);
  });
}
