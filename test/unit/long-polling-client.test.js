// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from 'vitest';

import { LongPollingClient } from '../../lib/long-polling-client.js';

describe('Long polling client', () => {
  it('Creates a client without connection', () => {
    const client = LongPollingClient.createNull();

    expect(client.isConnected).toBe(false);
  });

  it('Connects to the server', async () => {
    const client = LongPollingClient.createNull();

    await client.connect('http://example.com');

    expect(client.isConnected).toBe(true);
    expect(client.url).toBe('http://example.com');
  });

  it('Emits event when connected', async () => {
    const client = LongPollingClient.createNull();
    const events = [];
    client.addEventListener('open', (event) => events.push(event));

    await client.connect('http://example.com');

    expect(events).toEqual([expect.objectContaining({ type: 'open' })]);
  });

  it('Rejects multiple connections', async () => {
    const client = LongPollingClient.createNull();
    await client.connect('http://example.com');

    await expect(() => client.connect('http://example.com')).rejects.toThrow(
      'Already connected.',
    );
  });

  it('Closes the connection', async () => {
    const client = LongPollingClient.createNull();
    await client.connect('http://example.com');

    await client.close();

    expect(client.isConnected).toBe(false);
  });

  it('Does nothing when closing a disconnected client', async () => {
    const client = LongPollingClient.createNull();
    await client.connect('http://example.com');
    await client.close();

    await client.close();

    expect(client.isConnected).toBe(false);
  });

  it('Receives a message', async () => {
    const client = LongPollingClient.createNull({
      fetchResponse: {
        status: 200,
        headers: { etag: '1' },
        body: 'lorem ipsum',
      },
    });
    const requestsSent = client.trackRequestSent();
    const messages = [];
    const errors = [];

    const result = new Promise((resolve) => {
      client.addEventListener('error', (event) => {
        errors.push(event);
        client.close();
        resolve();
      });
      client.addEventListener('message', (event) => {
        messages.push(event);
        client.close();
        resolve();
      });
      client.connect('http://example.com');
    });

    await result;

    expect(requestsSent.data).toEqual([{ headers: { Prefer: 'wait=90' } }]);
    expect(messages).toEqual([
      expect.objectContaining({ type: 'message', data: 'lorem ipsum' }),
    ]);
    expect(errors).toEqual([]);
  });

  it.skip('Ignores not modified');

  it('Handles an error', async () => {
    const client = LongPollingClient.createNull({
      fetchResponse: { status: 500, statusText: 'Internal Server Error' },
    });
    const requestsSent = client.trackRequestSent();
    const messages = [];
    const errors = [];

    const result = new Promise((resolve) => {
      client.addEventListener('error', (event) => {
        errors.push(event);
        client.close();
        resolve();
      });
      client.addEventListener('message', (event) => {
        messages.push(event);
        client.close();
        resolve();
      });
      client.connect('http://example.com');
    });

    await result;

    expect(requestsSent.data).toEqual([{ headers: { Prefer: 'wait=90' } }]);
    expect(messages).toEqual([]);
    expect(errors).toEqual([expect.objectContaining({ type: 'error' })]);
  });

  it.todo('Recovers after error');

  it.todo('Recovers after network error');
});
