import { TestServer } from './testServer';
import { UserPermissions } from '../src/shared/interface';
import { overrideComponentContainerValidation } from '../src/server/test/server';
import { Context } from 'yawr';
import { deleteRoom, ComponentConstructor, createRoom } from '../src/server/rooms';
import { IDisposableClient, IGameRoomClient } from '../src/client/interface';

function createComponentValidation(ctx: Context, _gameId: number): UserPermissions {
  const userId = ctx.userId ?? '';
  const userName = ctx.userName ?? '';

  return {
    isUser: (id: string, name: string) => id === userId && name === userName,
    canMoveAsPlayer: (_player: number) => true,
    isServerOriginating: () => false,
  };
}

export interface ComponentData<ComponentClient extends IDisposableClient> {
  registerServerComponents: (server: TestServer) => void;
  componentConstructor: ComponentConstructor;
  clientType: { new (client: IGameRoomClient): ComponentClient };
}

export async function componentTestHelper<ComponentClient extends IDisposableClient>(
  data: ComponentData<ComponentClient>,
  testCallback: (chatClient: ComponentClient) => Promise<void>
): Promise<void> {
  const server = new TestServer();
  const client = server.createClient();
  overrideComponentContainerValidation(createComponentValidation, () => {
    data.registerServerComponents(server);
  });

  const game = createRoom({
    seats: 0,
    typeId: 'test',
    components: [data.componentConstructor],
  });

  const gameId = game.data.id;
  server.addToGroup(client, `room/${gameId}`);

  const componentClient = new data.clientType({ client, gameId });
  await componentClient.initialize();

  await testCallback(componentClient);

  deleteRoom(server, gameId);
}
