// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import type { Message } from "../../src/domain";
import {
  ConsoleLog,
  type ConsoleMessage,
  EventBus,
} from "../../src/infrastructure";

describe("Event bus", () => {
  it("should deliver published events to functional subscriber", () => {
    const bus = new EventBus();
    const events: Message<{ value: number | string }>[] = [];
    bus.subscribe<{ value: number | string }>((event) => events.push(event));

    bus.publish({ type: "foo", data: { value: 42 } });
    bus.publish({ type: "bar", data: { value: "lorem ipsum" } });

    expect(events).toEqual([
      { type: "foo", data: { value: 42 } },
      { type: "bar", data: { value: "lorem ipsum" } },
    ]);
  });

  it("should deliver published events to objectional subscriber", () => {
    const bus = new EventBus();
    const events: Message<{ value: number | string }>[] = [];
    bus.subscribe<{ value: number | string }>({
      handle: (event) => events.push(event),
    });

    bus.publish({ type: "foo", data: { value: 42 } });
    bus.publish({ type: "bar", data: { value: "lorem ipsum" } });

    expect(events).toEqual([
      { type: "foo", data: { value: 42 } },
      { type: "bar", data: { value: "lorem ipsum" } },
    ]);
  });

  it("should ignore handler errors", () => {
    const log = ConsoleLog.createNull();
    const bus = new EventBus({ log });
    const events: Message[] = [];
    bus.subscribe(() => {
      throw new Error("foobar");
    });
    bus.subscribe((event) => events.push(event));
    const trackedMessages = log.trackMessages();

    bus.publish({ type: "foo", data: { value: 42 } });

    expect(events).toEqual([{ type: "foo", data: { value: 42 } }]);
    expect(trackedMessages.data).toEqual<ConsoleMessage[]>([
      {
        level: "error",
        message: [
          "Error in event handler:",
          expect.objectContaining({ message: "foobar" }),
        ],
      },
    ]);
  });

  it("should unsubscribe", () => {
    const bus = new EventBus();
    const events: Message[] = [];
    const unsubscribe = bus.subscribe((event) => events.push(event));

    bus.publish({ type: "foo", data: { value: 42 } });
    unsubscribe();
    bus.publish({ type: "bar", data: { value: "lorem ipsum" } });

    expect(events).toEqual([{ type: "foo", data: { value: 42 } }]);
  });

  it("should cache events", () => {
    const bus = new EventBus();

    bus.publish({ type: "foo", data: { value: 42 } });
    bus.publish({ type: "bar", data: { value: "lorem ipsum" } });

    expect(bus.getEvents()).toEqual([
      { type: "foo", data: { value: 42 } },
      { type: "bar", data: { value: "lorem ipsum" } },
    ]);
  });

  it("should discard old events when cache size is exceeded", () => {
    const bus = new EventBus({ cacheSize: 1 });

    bus.publish({ type: "foo", data: null });
    bus.publish({ type: "bar", data: null });

    expect(bus.getEvents()).toEqual([{ type: "bar", data: null }]);
  });
});
