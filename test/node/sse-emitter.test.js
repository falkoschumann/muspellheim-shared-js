import events from 'node:events';
import { describe, expect, it } from '@jest/globals';

import { SseEmitter } from '../../lib/node/sse-emitter';

describe('SSE emitter', () => {
  it('extends response', () => {
    const response = new ResponseStub();
    const emitter = new SseEmitter();
    emitter.extendResponse(response);

    expect(response.statusCode).toBe(200);
    expect(response.getHeader('Content-Type')).toBe('text/event-stream');
  });

  it('sends event', () => {
    const response = new ResponseStub();
    const emitter = new SseEmitter();
    emitter.extendResponse(response);

    emitter.send({ data: 'a text message' });

    expect(response.body).toBe(
      `data: a text message

`,
    );
  });

  it('sends typed event', () => {
    const response = new ResponseStub();
    const emitter = new SseEmitter();
    emitter.extendResponse(response);

    emitter.send({
      name: 'event-type',
      data: { prop1: 42, prop2: 'foobar' },
    });

    expect(response.body).toBe(
      `event: event-type
data: {"prop1":42,"prop2":"foobar"}

`,
    );
  });

  it('sends full event', () => {
    const response = new ResponseStub();
    const emitter = new SseEmitter();
    emitter.extendResponse(response);

    emitter.send({
      id: '42',
      name: 'event-type',
      reconnectTime: 30000,
      comment: 'a comment',
      data: { prop1: 42, prop2: 'foobar' },
    });

    expect(response.body).toBe(
      `: a comment
event: event-type
data: {"prop1":42,"prop2":"foobar"}
id: 42
retry: 30000

`,
    );
  });

  it('sends multiple events', () => {
    const response = new ResponseStub();
    const emitter = new SseEmitter();
    emitter.extendResponse(response);

    emitter.send({ comment: 'this is a test stream' });
    emitter.send({ data: 'some text' });
    emitter.send({ data: 'another message\nwith two lines' });
    emitter.send({
      name: 'userconnect',
      data: { username: 'bobby', time: '02:33:48' },
    });

    expect(response.body).toBe(
      `: this is a test stream

data: some text

data: another message
data: with two lines

event: userconnect
data: {"username":"bobby","time":"02:33:48"}

`,
    );
  });

  it('closes response after timeout', () => {
    const response = new ResponseStub();
    const emitter = new SseEmitter(60000);
    emitter.extendResponse(response);

    emitter.simulateTimeout();

    expect(response.finished).toBe(true);
  });
});

class ResponseStub extends events.EventEmitter {
  statusCode = 200;
  body = '';
  #headers = {};

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
