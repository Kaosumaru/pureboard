import { ChatClient } from '../src/client/clients/chatClient';
import { createChat, createChatWithCallback, registerChat } from '../src/server/components/chat';
import { ComponentConstructor } from '../src/server/games';
import { Message } from '../src/shared/stores/chatStore';
import { componentTestHelper } from './componentTestHelper';

function testChat(componentConstructor: ComponentConstructor, testCallback: (chatClient: ChatClient) => Promise<void>) {
  return componentTestHelper(
    {
      registerServerComponents: server => {
        registerChat(server);
      },
      componentConstructor: componentConstructor,
      clientType: ChatClient,
    },
    testCallback
  );
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
  it('client should be allowed to send a message as a different user', async () => {
    await testChat(createChat(), async chatClient => {
      await expect(
        chatClient.sendAction({
          type: 'message',
          message: {
            user: {
              id: 'otherUser',
              name: 'otherUser',
            },
            message: 'test message',
          },
        })
      ).rejects.toThrowError('Not allowed to send message');
    });
  });
});
