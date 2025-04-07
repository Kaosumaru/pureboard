import { TestServer } from './testServer';
import { CurrentPlayerValidation } from '../src/shared/interface';
import { overrideComponentContainerValidation } from '../src/server/test/server';
import { IComponentClient, IDisposableClient } from '../src/client/baseComponentClient';
import { Context } from 'yawr';
import { GameConstructor } from '../src/server/games';

function createComponentValidation(ctx: Context, _gameId: number): CurrentPlayerValidation {
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
  componentCreator: GameConstructor;
  clientType: { new (client: IComponentClient): ComponentClient };
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

  const gameId = 0;
  server.addToGroup(client, `game/${gameId}`);
  const componentDestructor = data.componentCreator(gameId);

  const componentClient = new data.clientType({ client, gameId });
  await componentClient.initialize();

  await testCallback(componentClient);

  componentDestructor(gameId);
}
