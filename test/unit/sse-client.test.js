// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest';

import { SseClient } from '../../lib/sse-client.js';

describe('SSE client', () => {
  it('Creates a client without connection', () => {
    const client = SseClient.createNull();

    expect(client.isConnected).toBe(false);
  });

  it('Connects to the server', async () => {
    const client = SseClient.createNull();

    await client.connect('http://example.com');

    expect(client.isConnected).toBe(true);
    expect(client.url).toBe('http://example.com');
  });

  it('Emits event when connected', async () => {
    const client = SseClient.createNull();
    const events = [];
    client.addEventListener('open', (event) => events.push(event));

    await client.connect('http://example.com');

    expect(events).toEqual([expect.objectContaining({ type: 'open' })]);
  });

  it('Rejects multiple connections', async () => {
    const client = SseClient.createNull();
    await client.connect('http://example.com');

    await expect(() => client.connect('http://example.com')).rejects.toThrow(
      'Already connected.',
    );
  });

  it('Closes the connection', async () => {
    const client = SseClient.createNull();
    await client.connect('http://example.com');

    await client.close();

    expect(client.isConnected).toBe(false);
  });

  it('Does nothing when closing a disconnected client', async () => {
    const client = SseClient.createNull();
    await client.connect('http://example.com');
    await client.close();

    await client.close();

    expect(client.isConnected).toBe(false);
  });

  it('Receives a message', async () => {
    const client = SseClient.createNull();
    const events = [];
    client.addEventListener('message', (event) => events.push(event));
    await client.connect('http://example.com');

    client.simulateMessage('lorem ipsum', undefined, '1');

    expect(events).toEqual([
      expect.objectContaining({
        type: 'message',
        data: 'lorem ipsum',
        lastEventId: '1',
      }),
    ]);
  });

  it('Receives a typed message', async () => {
    const client = SseClient.createNull();
    const events = [];
    client.addEventListener('ping', (event) => events.push(event));
    await client.connect('http://example.com');

    client.simulateMessage('lorem ipsum', 'ping');

    expect(events).toEqual([
      expect.objectContaining({
        type: 'ping',
        data: 'lorem ipsum',
      }),
    ]);
  });

  it('Handles an error', async () => {
    const client = SseClient.createNull();
    const events = [];
    client.addEventListener('error', (event) => events.push(event));
    await client.connect('http://example.com');

    client.simulateError();

    expect(events).toEqual([expect.objectContaining({ type: 'error' })]);
  });
});
