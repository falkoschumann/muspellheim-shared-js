// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import {
  ConsoleLog,
  type ConsoleMessage,
  type Event,
  EventBus,
} from "../../src/infrastructure";

describe("Event bus", () => {
  it("should deliver published events to subscriber", () => {
    const bus = new EventBus<{ value: number | string }>();
    const events: Event[] = [];
    bus.subscribe((event) => events.push(event));

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
    const events: Event[] = [];
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
    const events: Event[] = [];
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
