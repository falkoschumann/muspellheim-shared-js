// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest';

import { WebSocketClient } from '../../lib/web-socket-client.js';

describe('Web socket client', () => {
  it('Creates a client without connection', () => {
    const client = WebSocketClient.createNull();

    expect(client.isConnected).toBe(false);
  });

  it('Connects to the server', async () => {
    const client = WebSocketClient.createNull();

    await client.connect('ws://example.com');

    expect(client.isConnected).toBe(true);
    expect(client.url).toBe('ws://example.com');
  });

  it('Emits event when connected', async () => {
    const client = WebSocketClient.createNull();
    const events = [];
    client.addEventListener('open', (event) => events.push(event));

    await client.connect('ws://example.com');

    expect(events).toEqual([expect.objectContaining({ type: 'open' })]);
  });

  it('Rejects multiple connections', async () => {
    const client = WebSocketClient.createNull();
    await client.connect('ws://example.com');

    await expect(() => client.connect('ws://example.com')).rejects.toThrow(
      'Already connected.',
    );
  });

  it('Closes the connection', async () => {
    const client = WebSocketClient.createNull();
    await client.connect('ws://example.com');

    await client.close();

    expect(client.isConnected).toBe(false);
  });

  it('Emits event when disconnected', async () => {
    const client = WebSocketClient.createNull();
    const events = [];
    client.addEventListener('close', (event) => events.push(event));
    await client.connect('ws://example.com');

    await client.simulateClose(1003, 'Unsupported Data');

    expect(events).toEqual([expect.objectContaining({ type: 'close' })]);
  });

  it('Does nothing when closing a disconnected client', async () => {
    const client = WebSocketClient.createNull();
    await client.connect('ws://example.com');
    await client.close();

    await client.close();

    expect(client.isConnected).toBe(false);
  });

  it('Receives a message', async () => {
    const client = WebSocketClient.createNull();
    const events = [];
    client.addEventListener('message', (event) => events.push(event));
    await client.connect('ws://example.com');

    client.simulateMessage('lorem ipsum');

    expect(events).toEqual([
      expect.objectContaining({ type: 'message', data: 'lorem ipsum' }),
    ]);
  });

  it('Sends a message', async () => {
    const client = WebSocketClient.createNull();
    const messagesSent = client.trackMessageSent();
    await client.connect('ws://example.com');

    client.send('lorem ipsum');

    expect(messagesSent.data).toEqual(['lorem ipsum']);
  });

  it('Handles an error', async () => {
    const client = WebSocketClient.createNull();
    const events = [];
    client.addEventListener('error', (event) => events.push(event));
    await client.connect('ws://example.com');

    client.simulateError();

    expect(events).toEqual([
      expect.objectContaining({ type: 'error' }),
    ]);
  });

  it.todo('Recovers after error');

  it('Sends heartbeats while connected', async () => {
    const client = WebSocketClient.createNull({ heartbeat: 10 });
    const messagesSent = client.trackMessageSent();
    await client.connect('ws://example.com');

    client.simulateHeartbeat();
    client.simulateHeartbeat();
    await client.close();
    client.simulateHeartbeat();

    expect(messagesSent.data).toEqual(['heartbeat', 'heartbeat']);
  });
});
