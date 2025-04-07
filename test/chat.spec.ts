import { ChatClient } from '../src/client/clients/chatClient';
import { createChat, createChatWithCallback, registerChat } from '../src/server/components/chat';
import { GameConstructor } from '../src/server/games';
import { Action, Message } from '../src/shared/stores/chatStore';
import { TestServer } from './helper';

type SendAction<Action> = (action: Action) => Promise<void>;

async function testChat<Action>(chatCreator: GameConstructor, cb: (chatClient: ChatClient, sendAction: SendAction<Action>) => Promise<void>) {
  const server = new TestServer();
  const client = server.createClient();

  registerChat(server, true);

  const gameId = 0;
  server.addToGroup(client, `game/${gameId}`);
  const chatServer = chatCreator(gameId);
  const chatClient = new ChatClient({ client, gameId });
  chatClient.initialize();
  // TODO why is this needed?
  await chatClient.getState();

  const sendAction: SendAction<Action> = async action => {
    return client.call('chat/action', gameId, action);
  };
  await cb(chatClient, sendAction);

  chatServer(gameId);
}

describe('chat client', () => {
  it('client should be able to send a message', async () => {
    await testChat(createChat(), async chatClient => {
      await chatClient.sendMessage('test message');

      const info = chatClient.client.getUserInfo();
      const expectedMessage: Message = {
        user: {
          id: info?.id ?? '',
          name: info?.name ?? '',
        },
        message: 'test message',
      };

      expect(chatClient.store.getState().messages).toEqual([expectedMessage]);
    });
  });

  it('client should be able to send a message', async () => {
    let messageReceived: Message | undefined;
    await testChat(
      createChatWithCallback((cb, user, message) => {
        messageReceived = {
          user,
          message,
        };
      }),
      async chatClient => {
        await chatClient.sendMessage('test message');

        const info = chatClient.client.getUserInfo();
        const expectedMessage: Message = {
          user: {
            id: info?.id ?? '',
            name: info?.name ?? '',
          },
          message: 'test message',
        };

        expect(chatClient.store.getState().messages).toEqual([expectedMessage]);
        expect(messageReceived).toEqual(expectedMessage);
      }
    );
  });

  // this shouldn't pass, but passes since we are disabling validation on the server
  xit('client should be allowed to send a message as a different user', async () => {
    await testChat<Action>(createChat(), async (_chatClient, sendAction) => {
      await sendAction({
        type: 'message',
        message: {
          user: {
            id: 'otherUser',
            name: 'otherUser',
          },
          message: 'test message',
        },
      });
    });
  });
});
