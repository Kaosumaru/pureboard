import { canUserMoveAsPlayer as canUserActAsPlayer, GameRoomData, UserInfo } from '../shared/gameRoomStore';
import { Context } from 'yawr';
import { UserPermissions } from '../shared/interface';
import { generate as generateRandomString } from 'randomstring';
import { IServer } from './interface';
import { GameOptions } from '../shared/standardActions';

export type ComponentConstructor = (roomId: number) => [string, never];
export type Component = [string, never];
type ComponentsMap = { [componentId: string]: never };

interface GameRoom {
  // Game room data including seats, type, and password.
  // This data is sent to clients when they join a game room.
  data: GameRoomData;

  // Tracks how many times each user has joined the room.
  // Used to prevent users that not joined a game room from performing actions or getting game state.
  joinedUsers: Map<string, number>;

  // Components are stored in a map keyed by component type.
  components: ComponentsMap;
}

/**
 * Builds a component map for a game room from constructor functions.
 *
 * @param roomId - Game room id passed to each constructor.
 * @param arr - Component constructor list.
 * @returns A map keyed by component type.
 */
function buildComponentMap(roomId: number, arr: ComponentConstructor[]): ComponentsMap {
  const result: ComponentsMap = {};
  for (const constructor of arr) {
    const [key, component] = constructor(roomId);
    result[key] = component;
  }
  return result;
}

const rooms = new Map<number, GameRoom>();
let lastId = 0;

/**
 * Creates a validation helper bound to the current user and game room.
 * This is used to validate whether a user can perform actions as a specific player in the game.
 * (a user can only move as a player if they have taken that seat in the game room).
 *
 * @param ctx - Request context.
 * @param roomId - Target game id.
 * @returns Validation callbacks used by game actions.
 */
export function createUserPermissions(ctx: Context, roomId: number): UserPermissions {
  const room = getRoomData(ctx, roomId);
  const userId = ctx.userId ?? '';
  const userName = ctx.userName ?? '';

  return {
    isUser: (id: string, name: string) => id === userId && name === userName,
    canMoveAsPlayer: (player: number) => canUserActAsPlayer(userId, room, player),
    isServerOriginating: () => false,
  };
}

function getRoom(roomId: number): GameRoom {
  const room = rooms.get(roomId);
  if (!room) throw new Error('Room not found');
  return room;
}

export function canUserActAsPlayerInGame(userId: string, roomId: number, playerId: number): boolean {
  const room = getRoom(roomId);
  return canUserActAsPlayer(userId, room.data, playerId);
}

export function roomIdToGroup(id: number): string {
  return `room/${id}`;
}

function roomToGroup(gameRoom: GameRoomData): string {
  return roomIdToGroup(gameRoom.id);
}

function userInfoFromContext(ctx: Context): UserInfo {
  return { id: ctx.userId ?? '', name: ctx.userName ?? '' };
}

/**
 * Returns a component stored for a game room.
 *
 * @typeParam T - Expected component type.
 * @param roomId - Game id.
 * @param type - Component key.
 * @returns The component value.
 * @throws Error When the game or component does not exist.
 */
export function getRoomComponent<T>(roomId: number, type: string): T {
  const room = getRoom(roomId);
  const component = room.components[type];
  if (!component) throw new Error('Component not found');
  return component;
}

function getRoomData(ctx: Context, roomId: number): GameRoomData {
  if (ctx.userId === undefined) throw new Error('Not authorized');
  const room = getRoom(roomId);
  if (!room.joinedUsers.has(ctx.userId)) throw new Error('Not joined to this game');
  return room.data;
}

function joinRoom(ctx: Context, roomId: number, password?: string): GameRoomData {
  if (ctx.userId === undefined) throw new Error('Not authorized');
  const room = getRoom(roomId);
  if (room.data.password && room.data.password !== password) throw new Error('Invalid password');
  const prevValue = room.joinedUsers.get(ctx.userId);
  room.joinedUsers.set(ctx.userId, (prevValue ?? 0) + 1);
  ctx.addToGroup(roomToGroup(room.data));
  return room.data;
}

/**
 * Creates a game room and joins the caller as the first connected member.
 *
 * @param ctx - Request context.
 * @param options - Room options including player count.
 * @param type - Game type identifier.
 * @param components - Component constructors.
 * @param timeout - Empty-room timeout in milliseconds.
 * @returns Created game room data.
 */
export function createRoomAndJoin(ctx: Context, options: GameOptions, type: string, components: ComponentConstructor[], timeout: number): GameRoomData {
  const room = createRoom(options, type, components, timeout);

  room.joinedUsers.set(ctx.userId ?? '', 1);
  ctx.addToGroup(roomToGroup(room.data));

  return room.data;
}

/**
 * Removes a game room from memory.
 *
 * @param roomId - Game id.
 * @returns The removed game room, or undefined if it does not exist.
 */
export function deleteRoom(server: IServer, roomId: number): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;

  rooms.delete(roomId);

  server.onGroupRemoved(roomToGroup(room.data), undefined);
  return true;
}

/**
 * Creates and stores a new game room instance.
 * Will fill instance components by calling each constructor with the game id.
 *
 * @param options - Room options including player count.
 * @param type - Game type identifier.
 * @param components - Component constructors.
 * @param timeout - Optional empty-room timeout in milliseconds.
 * @returns The created game room with data and initialized components.
 */
export function createRoom(options: GameOptions, type: string, components: ComponentConstructor[], timeout?: number): GameRoom {
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

  const room: GameRoom = {
    data,
    joinedUsers: new Map<string, number>(),
    components: buildComponentMap(id, components),
  };

  rooms.set(id, room);

  return room;
}

/**
 * Registers game-related RPC handlers on the server.
 *
 * @param server - Server abstraction used to register handlers.
 */
export function registerRooms(server: IServer): void {
  /**
   * Schedules room deletion when the group becomes empty. (so we don't have players actively connected to the room)
   */
  const scheduleRoomDeletionWhenEmpty = (roomId: number, group: string, timeout?: number) => {
    // delete the room if it's empty for emptyRoomLifetime
    // TODO verify this in unit tests, check if we aren't installing multiple listeners
    if (timeout === undefined) return;
    server.onGroupRemoved(group, () =>
      setTimeout(() => {
        if (server.groupMemberCount(group) === 0) {
          deleteRoom(server, roomId);
        }
      }, timeout)
    );
  };

  server.RegisterFunction('room/join', (ctx, roomId: number, password?: string) => {
    joinRoom(ctx, roomId, password);
    return roomId;
  });

  server.RegisterFunction('room/takeSeat', (ctx, roomId: number, seat: number) => {
    const room = getRoomData(ctx, roomId);
    if (room.seats[seat]) throw new Error('Seat is taken');

    const userInfo = userInfoFromContext(ctx);

    room.seats[seat] = userInfo;

    const group = roomToGroup(room);
    ctx.emitToGroup(group, 'room/tookSeat', roomId, userInfo, seat);

    scheduleRoomDeletionWhenEmpty(roomId, group, room.timeoutToClose);
  });

  server.RegisterFunction('room/leaveSeat', (ctx, roomId: number, seat: number) => {
    const room = getRoomData(ctx, roomId);
    if (room.seats[seat]?.id !== ctx.userId) throw new Error('Not authorized');

    room.seats[seat] = null;
    const group = roomToGroup(room);
    ctx.emitToGroup(group, 'room/leftSeat', roomId, seat);
  });

  server.RegisterFunction('room/takeAvailableSeat', (ctx, roomId: number) => {
    const room = getRoomData(ctx, roomId);
    const alreadySeated = room.seats.findIndex(userId => userId?.id == ctx.userId);
    if (alreadySeated !== -1) return alreadySeated;
    const seat = room.seats.findIndex(userId => !userId);
    if (seat === -1) return seat;

    const userInfo = userInfoFromContext(ctx);

    room.seats[seat] = userInfo;
    const group = roomToGroup(room);
    ctx.emitToGroup(group, 'room/tookSeat', roomId, userInfo, seat);

    scheduleRoomDeletionWhenEmpty(roomId, group, room.timeoutToClose);
    return seat;
  });

  server.RegisterFunction('room/getSeatsState', (ctx, roomId: number) => {
    return getRoomData(ctx, roomId);
  });

  server.RegisterFunction('room/close', (ctx, roomId: number) => {
    if (!ctx.isAdmin) {
      throw new Error('Not authorized');
    }
    const room = getRoomData(ctx, roomId);
    deleteRoom(server, roomId);

    const group = roomToGroup(room);
    ctx.emitToGroup(group, 'room/closed', roomId);
  });
}
