// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import {
  ConsoleLog,
  type ConsoleMessage,
  MessageBus,
} from "../../src/infrastructure";

describe("Message bus", () => {
  it("should deliver published events to functional subscriber", () => {
    const bus = new MessageBus();
    const messages: unknown[] = [];
    bus.subscribe("foo", (message) => messages.push(message));

    bus.publish({ type: "foo", data: 42 });
    bus.publish({ type: "bar", data: "lorem ipsum" });

    expect(messages).toEqual([{ type: "foo", data: 42 }]);
  });

  it("should deliver published events to objectional subscriber", () => {
    const bus = new MessageBus();
    const messages: unknown[] = [];
    bus.subscribe("foo", {
      handle: (message) => messages.push(message),
    });

    bus.publish({ type: "foo", data: 42 });
    bus.publish({ type: "bar", data: "lorem ipsum" });

    expect(messages).toEqual([{ type: "foo", data: 42 }]);
  });

  it("should ignore handler errors", () => {
    const log = ConsoleLog.createNull();
    const bus = new MessageBus({ log });
    const messages: unknown[] = [];
    bus.subscribe("foo", () => {
      throw new Error("foobar");
    });
    bus.subscribe("foo", (message) => messages.push(message));
    const trackedMessages = log.trackMessages();

    bus.publish({ type: "foo", data: 42 });

    expect(messages).toEqual([{ type: "foo", data: 42 }]);
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
    const unsubscribe = bus.subscribe("foo", (message) =>
      messages.push(message),
    );

    bus.publish({ type: "foo", data: 42 });
    unsubscribe();
    bus.publish({ type: "foo", data: "lorem ipsum" });

    expect(messages).toEqual([{ type: "foo", data: 42 }]);
  });

  it("should ignore multiple unsubscribe", () => {
    const bus = new MessageBus();
    const messages: unknown[] = [];
    const unsubscribe = bus.subscribe("foo", (message) =>
      messages.push(message),
    );

    bus.publish({ type: "foo", data: 42 });
    unsubscribe();
    unsubscribe();
    bus.publish({ type: "foo", data: "lorem ipsum" });

    expect(messages).toEqual([{ type: "foo", data: 42 }]);
  });
});
