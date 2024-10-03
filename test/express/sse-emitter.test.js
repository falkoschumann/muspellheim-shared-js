import events from 'node:events';
import { describe, expect, it } from '@jest/globals';

import { SseEmitter } from '../../lib/express/sse-emitter';

describe('SSE emitter', () => {
  it('Initializes response', () => {
    const response = new ResponseStub();
    SseEmitter.create({ response });

    expect(response.statusCode).toBe(200);
    expect(response.getHeader('Content-Type')).toBe('text/event-stream');
  });

  it('Sends event', () => {
    const response = new ResponseStub();
    const emitter = SseEmitter.create({ response });

    emitter.send('event-data');

    expect(response.body).toBe('data: event-data\n\n');
  });

  it('Sends typed event', () => {
    const response = new ResponseStub();
    const emitter = SseEmitter.create({ response });

    emitter.send({ data: 'event-data' }, 'event-type');

    expect(response.body).toBe(
      'event: event-type\ndata: {"data":"event-data"}\n\n',
    );
  });

  it('Closes response after timeout', () => {
    const response = new ResponseStub();
    const emitter = SseEmitter.create({ response, timeout: 60000 });

    emitter.simulateTimeout();

    expect(response.finished).toBe(true);
  });
});

class ResponseStub extends events.EventEmitter {
  body = '';
  #headers = {};

  status(code) {
    this.statusCode = code;
    return this;
  }

  setHeader(key, value) {
    this.#headers[key] = value;
    return this;
  }

  getHeader(key) {
    return this.#headers[key];
  }

  write(data) {
    this.body += data;
  }

  end() {
    this.finished = true;
    this.emit('close');
  }
}
