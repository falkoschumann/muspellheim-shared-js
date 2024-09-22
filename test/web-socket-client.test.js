/**
 * @jest-environment jsdom
 */

import { describe, expect, test } from '@jest/globals';
import { WebSocketClient } from '../src/web-socket-client.js';

describe('Web socket client', () => {
  test('Connects to the server', async () => {
    const client = WebSocketClient.createNull();

    await client.connect('http://example.com');

    expect(client.isConnected).toBe(true);
  });

  test('Rejects multiple connections', async () => {
    const client = WebSocketClient.createNull();
    await client.connect('http://example.com');

    expect(() => client.connect('http://example.com')).rejects.toThrow(
      /^Already connected.$/,
    );
  });

  test('Closes the connection', async () => {
    const client = WebSocketClient.createNull();
    await client.connect('http://example.com');

    await client.close();

    expect(client.isConnected).toBe(false);
  });
});
