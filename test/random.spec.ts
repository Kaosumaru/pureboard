import { ClientRandomGenerator } from '../src/client/clientRandom';
import { ServerRandomGenerator } from '../src/server/serverRandom';

describe('random server/client', () => {
  it('server and client should generate same values with same seed', () => {
    const server = new ServerRandomGenerator();
    const client = new ClientRandomGenerator();

    server.regenerateSeed();
    client.setSeed(server.seed());
    const tries = 10;

    for (let i = 0; i < tries; i++) {
      expect(server.int(10)).toEqual(client.int(10));
      expect(server.intBetween(1, 10)).toEqual(client.intBetween(1, 10));
    }
  });
});
