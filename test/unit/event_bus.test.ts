// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import type { Message } from "../../src/domain";
import {
  ConsoleLog,
  type ConsoleMessage,
  EventBus,
} from "../../src/infrastructure";
import { BarMessage, FooMessage } from "./messages";

describe("Event bus", () => {
  it("should deliver published events to functional subscriber", () => {
    const bus = new EventBus();
    const events: (FooMessage | BarMessage)[] = [];
    const memorize = (event: FooMessage | BarMessage) => {
      events.push(event);
    };
    bus.subscribe(memorize);

    bus.publish(new FooMessage());
    bus.publish(new BarMessage());

    expect(events).toEqual([new FooMessage(), new BarMessage()]);
  });

  it("should deliver published events to objectional subscriber", () => {
    const bus = new EventBus();
    const events: (FooMessage | BarMessage)[] = [];
    bus.subscribe({
      handle: (event: FooMessage | BarMessage) => events.push(event),
    });

    bus.publish(new FooMessage());
    bus.publish(new BarMessage());

    expect(events).toEqual([new FooMessage(), new BarMessage()]);
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

    bus.publish(new FooMessage());

    expect(events).toEqual([new FooMessage()]);
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

    bus.publish(new FooMessage());
    unsubscribe();
    bus.publish(new BarMessage());

    expect(events).toEqual([new FooMessage()]);
  });

  it("should cache events", () => {
    const bus = new EventBus();

    bus.publish(new FooMessage());
    bus.publish(new BarMessage());

    expect(bus.getEvents()).toEqual([new FooMessage(), new BarMessage()]);
  });

  it("should discard old events when cache size is exceeded", () => {
    const bus = new EventBus({ cacheSize: 1 });

    bus.publish(new FooMessage());
    bus.publish(new BarMessage());

    expect(bus.getEvents()).toEqual([new BarMessage()]);
  });
});
