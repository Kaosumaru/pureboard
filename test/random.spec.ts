import { ClientRandomGenerator } from '../src/client/clientRandom';
import { ServerRandomGenerator } from '../src/server/serverRandom';

describe('random server/client', () => {
  it('server and client should generate same values with same seed', () => {
    const server = new ServerRandomGenerator();
    const client = new ClientRandomGenerator();

    server.reset();

    const tries = 10;

    const serverValues1 = [];
    const serverValues2 = [];
    for (let i = 0; i < tries; i++) {
      serverValues1.push(server.int(10));
      serverValues2.push(server.intBetween(1, 10));
    }

    client.setRandomValues(server.randomValues());
    for (let i = 0; i < tries; i++) {
      expect(serverValues1[i]).toEqual(client.int(10));
      expect(serverValues2[i]).toEqual(client.intBetween(1, 10));
    }
  });
});
