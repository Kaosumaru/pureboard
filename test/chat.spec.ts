import { ChatClient } from '../src/client/clients/chatClient';
import { createChat, registerChat } from '../src/server/components/chat';
import { Message } from '../src/shared/stores/chatStore';
import { TestServer } from './helper';

describe('chat client', () => {
  it('client should be able to send a message', async () => {
    const server = new TestServer();
    const client = server.createClient();

    registerChat(server, true);
    const chatCreator = createChat();

    const gameId = 0;
    server.addToGroup(client, `game/${gameId}`);
    const chatServer = chatCreator(gameId);
    const chatClient = new ChatClient({ client, gameId });
    chatClient.initialize();

    await chatClient.getState();
    await chatClient.sendMessage('test message');

    const expectedMessage: Message = {
      user: {
        id: client.getUserInfo()?.id ?? '',
        name: client.getUserInfo()?.name ?? '',
      },
      message: 'test message',
    };

    expect(chatClient.store.getState().messages).toEqual([expectedMessage]);

    chatServer(gameId);
  });
});
