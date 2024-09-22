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

  test('Receives a message', async () => {
    const client = WebSocketClient.createNull();
    const events = [];
    client.addEventListener('message', (event) => events.push(event));
    await client.connect('http://example.com');

    await client.simulateMessageReceived({ data: 'Hello' });

    expect(events).toEqual([expect.objectContaining({ data: 'Hello' })]);
  });

  test('Simulates error', async () => {
    const client = WebSocketClient.createNull();
    const events = [];
    client.addEventListener('close', (event) => events.push(event));
    client.addEventListener('error', (event) => events.push(event));
    await client.connect('http://example.com');

    await client.simulateErrorOccurred();

    expect(client.isConnected).toBe(false);
    expect(events).toEqual([
      expect.objectContaining({ type: 'close' }),
      expect.objectContaining({ type: 'error' }),
    ]);
  });
});
