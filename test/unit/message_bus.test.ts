// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import {
  ConsoleLog,
  type ConsoleMessage,
  MessageBus,
} from "../../src/infrastructure";

describe("Message bus", () => {
  it("should deliver published events to subscriber", () => {
    const bus = new MessageBus();
    const messages: unknown[] = [];
    bus.subscribe("foo", (message) => messages.push(message));

    bus.publish("foo", { value: 42 });
    bus.publish("bar", { value: "lorem ipsum" });

    expect(messages).toEqual([{ value: 42 }]);
  });

  it("should ignore handler errors", () => {
    const log = ConsoleLog.createNull();
    const bus = new MessageBus({ log });
    const messages: unknown[] = [];
    bus.subscribe("foo", () => {
      throw new Error("foobar");
    });
    bus.subscribe("foo", (event) => messages.push(event));
    const trackedMessages = log.trackMessages();

    bus.publish("foo", { value: 42 });

    expect(messages).toEqual([{ value: 42 }]);
    expect(trackedMessages.data).toEqual<ConsoleMessage[]>([
      {
        level: "error",
        message: [
          'Error in message handler for message type "foo":',
          expect.objectContaining({ message: "foobar" }),
        ],
      },
    ]);
  });

  it("should unsubscribe", () => {
    const bus = new MessageBus();
    const messages: unknown[] = [];
    const unsubscribe = bus.subscribe("foo", (event) => messages.push(event));

    bus.publish("foo", { value: 42 });
    unsubscribe();
    bus.publish("foo", { value: "lorem ipsum" });

    expect(messages).toEqual([{ value: 42 }]);
  });

  it("should ignore multiple unsubscribe", () => {
    const bus = new MessageBus();
    const messages: unknown[] = [];
    const unsubscribe = bus.subscribe("foo", (event) => messages.push(event));

    bus.publish("foo", { value: 42 });
    unsubscribe();
    unsubscribe();
    bus.publish("foo", { value: "lorem ipsum" });

    expect(messages).toEqual([{ value: 42 }]);
  });
});
