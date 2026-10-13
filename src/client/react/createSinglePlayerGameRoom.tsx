import { createContext, JSX, useEffect, useState } from 'react';
import { GameOptions } from '../../shared/interface';
import { UserInfo } from '../../shared/gameRoomStore';
import { SinglePlayerGameRoomClient } from '../singlePlayerGameRoomClient';

export const SinglePlayerGameRoomContext = createContext<SinglePlayerGameRoomClient | null>(null);

/**
 * Props of the `CreateSinglePlayerGameRoomClient` component, which creates a serverless game room
 * and provides it to its children. The props are read only once, when the component is mounted.
 *
 * @template Action - The type of the actions of the game.
 */
interface CreateSinglePlayerGameRoomClientProps<Action> extends React.PropsWithChildren {
  /**
   * The options for the game room, eg. the number of seats.
   */
  options: GameOptions;

  /**
   * Action applied to the store of the game right after it is set by the single player provider of the game.
   */
  initialAction?: (options: GameOptions) => Action | undefined;

  /**
   * Information about the local user. Defaults to `{ id: 'local', name: 'Player' }`.
   */
  userInfo?: UserInfo;

  /**
   * Whether all seats should be taken by the local user. Defaults to `true`.
   */
  takeAllSeats?: boolean;

  /**
   * Whether the local user should take the first available seat. Used only when `takeAllSeats` is `false`. Defaults to `true`.
   */
  takeAvailableSeat?: boolean;

  /**
   * Called after the game room is created and the seats are taken.
   */
  onCreated?: (client: SinglePlayerGameRoomClient) => Promise<void>;

  /**
   * Called when creating the game room failed, or `onCreated` has thrown.
   */
  onFailed?: (error: Error) => Promise<void>;
}

export function CreateSinglePlayerGameRoomClient<Action>(props: CreateSinglePlayerGameRoomClientProps<Action>): JSX.Element {
  const [gameClient, setGameClient] = useState<SinglePlayerGameRoomClient | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const client = new SinglePlayerGameRoomClient({
      initialAction: props.initialAction,
      userInfo: props.userInfo,
    });

    const create = async () => {
      await client.createRoom(props.options);
      if (props.takeAllSeats ?? true) {
        for (let seat = 0; seat < props.options.players; seat++) {
          await client.takeSeat(seat);
        }
      } else if (props.takeAvailableSeat ?? true) {
        await client.takeAvailableSeat();
      }
      if (cancelled) return;

      setGameClient(client);
      await props.onCreated?.(client);
    };

    create().catch(err => {
      if (cancelled) return;
      return props.onFailed?.(err instanceof Error ? err : new Error(String(err)));
    });

    return () => {
      cancelled = true;
      setGameClient(undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!gameClient) {
    return <></>;
  }

  return <SinglePlayerGameRoomContext.Provider value={gameClient}>{props.children}</SinglePlayerGameRoomContext.Provider>;
}
