// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "bun:test";

import { EventTracker } from "../../src/common/event_tracker";

describe("Event tracker", () => {
  it("should track an event", () => {
    const eventTarget = new EventTarget();
    const eventTracker = EventTracker.create(eventTarget, "foo");

    eventTarget.dispatchEvent(new CustomEvent("foo", { detail: "bar" }));

    expect(eventTracker.events).toEqual<CustomEvent[]>([
      expect.objectContaining({
        type: "foo",
        detail: "bar",
      }),
    ]);
  });

  it("should track multiple event", () => {
    const eventTarget = new EventTarget();
    const eventTracker = EventTracker.create(eventTarget, "foo", "bar");

    eventTarget.dispatchEvent(new CustomEvent("foo", { detail: "1" }));
    eventTarget.dispatchEvent(new CustomEvent("bar", { detail: "2" }));

    expect(eventTracker.events).toEqual<CustomEvent[]>([
      expect.objectContaining({
        type: "foo",
        detail: "1",
      }),
      expect.objectContaining({
        type: "bar",
        detail: "2",
      }),
    ]);
  });

  it("should clear stored output", () => {
    const eventTarget = new EventTarget();
    const eventTracker = EventTracker.create(eventTarget, "foo");

    eventTarget.dispatchEvent(new CustomEvent("foo", { detail: "bar" }));

    const result = eventTracker.clear();

    expect(result).toEqual<CustomEvent[]>([
      expect.objectContaining({
        type: "foo",
        detail: "bar",
      }),
    ]);
    expect(eventTracker.events).toEqual<CustomEvent[]>([]);
  });

  it("should stop tracking", () => {
    const eventTarget = new EventTarget();
    const eventTracker = EventTracker.create(eventTarget, "foo");
    eventTarget.dispatchEvent(new CustomEvent("foo", { detail: "bar" }));

    eventTracker.stop();
    eventTarget.dispatchEvent(new CustomEvent("foo", { detail: "bar" }));

    expect(eventTracker.events).toEqual<CustomEvent[]>([
      expect.objectContaining({
        type: "foo",
        detail: "bar",
      }),
    ]);
  });

  it("should wait for same events", async () => {
    const eventTarget = new EventTarget();
    const eventTracker = EventTracker.create(eventTarget, "foo");

    setTimeout(() => {
      eventTarget.dispatchEvent(new CustomEvent("foo", { detail: "bar1" }));
      eventTarget.dispatchEvent(new CustomEvent("foo", { detail: "bar2" }));
    }, 10);

    const events = await eventTracker.waitFor(2);

    expect(events).toEqual<CustomEvent[]>([
      expect.objectContaining({
        type: "foo",
        detail: "bar1",
      }),
      expect.objectContaining({
        type: "foo",
        detail: "bar2",
      }),
    ]);
  });

  it("should wait for different events", async () => {
    const eventTarget = new EventTarget();
    const eventTracker = EventTracker.create(eventTarget, "foo", "bar");

    setTimeout(() => {
      eventTarget.dispatchEvent(new CustomEvent("foo", { detail: "1" }));
      eventTarget.dispatchEvent(new CustomEvent("bar", { detail: "2" }));
    }, 10);

    const events = await eventTracker.waitFor(2);

    expect(events).toEqual<CustomEvent[]>([
      expect.objectContaining({
        type: "foo",
        detail: "1",
      }),
      expect.objectContaining({
        type: "bar",
        detail: "2",
      }),
    ]);
  });
});
