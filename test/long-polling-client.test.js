import { describe, expect, it } from '@jest/globals';

import { LongPollingClient } from '../lib/long-polling-client.js';

describe('Long polling client', () => {
  it('Connects to the server', () => {
    const client = LongPollingClient.createNull();

    client.simulateConnected(() => {});

    expect(client.isConnected).toBe(true);
  });

  it('Rejects multiple connections', () => {
    const client = LongPollingClient.createNull();
    client.simulateConnected(() => {});

    const connectTwice = () => client.simulateConnected(() => {});

    expect(connectTwice).toThrow(/^Already connected.$/);
  });

  it('Closes the connection', () => {
    const client = LongPollingClient.createNull();
    client.simulateConnected(() => {});

    client.close();

    expect(client.isConnected).toBe(false);
  });

  it('Receives a message', async () => {
    const client = LongPollingClient.createNull();
    const events = [];
    client.simulateConnected((event) => events.push(event));

    await client.simulateResponse({
      status: 200,
      headers: { etag: '1' },
      body: { anwser: 42 },
    });

    expect(events).toEqual([expect.objectContaining({ data: { anwser: 42 } })]);
  });

  it('Ignores not modified', async () => {
    const client = LongPollingClient.createNull();
    const events = [];
    client.simulateConnected((event) => events.push(event));

    await client.simulateResponse({
      status: 200,
      headers: { etag: '1' },
      body: { counter: 1 },
    });
    await client.simulateResponse({ status: 304, headers: {}, body: null });
    await client.simulateResponse({
      status: 200,
      headers: { etag: '2' },
      body: { counter: 2 },
    });

    expect(events).toEqual([
      expect.objectContaining({ data: { counter: 1 } }),
      expect.objectContaining({ data: { counter: 2 } }),
    ]);
  });

  it('Recovers after error', async () => {
    const client = LongPollingClient.createNull();
    const events = [];
    client.simulateConnected((event) => events.push(event));

    await client.simulateResponse({
      status: 200,
      headers: { etag: '1' },
      body: { counter: 1 },
    });
    const result = client.simulateResponse({
      status: 500,
      headers: {},
      body: null,
    });
    await client.simulateResponse({
      status: 200,
      headers: { etag: '2' },
      body: { counter: 2 },
    });

    expect(client.isConnected).toBe(true);
    expect(events).toEqual([
      expect.objectContaining({ data: { counter: 1 } }),
      expect.objectContaining({ data: { counter: 2 } }),
    ]);
    await expect(result).rejects.toThrow(/^HTTP error: 500/);
  });

  it('Recovers after network error', async () => {
    const client = LongPollingClient.createNull();
    const events = [];
    client.simulateConnected((event) => events.push(event));

    await client.simulateResponse({
      status: 200,
      headers: { etag: '1' },
      body: { counter: 1 },
    });
    client.simulateError(new Error('network error'));
    await client.simulateResponse({
      status: 200,
      headers: { etag: '2' },
      body: { counter: 2 },
    });

    expect(client.isConnected).toBe(true);
    expect(events).toEqual([
      expect.objectContaining({ data: { counter: 1 } }),
      expect.objectContaining({ data: { counter: 2 } }),
    ]);
  });
});
