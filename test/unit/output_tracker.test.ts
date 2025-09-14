// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import { OutputTracker } from "../../src/common/output_tracker";

describe("Output tracker", () => {
  it("should use custom event to track output", () => {
    const eventTarget = new EventTarget();
    const outputTracker = OutputTracker.create<string>(eventTarget, "foo");

    const event = new CustomEvent("foo", { detail: "bar" });
    eventTarget.dispatchEvent(event);

    expect(outputTracker.data).toEqual(["bar"]);
  });

  it("should clear stored output", () => {
    const eventTarget = new EventTarget();
    const outputTracker = OutputTracker.create<string>(eventTarget, "foo");
    const event = new CustomEvent("foo", { detail: "bar" });
    eventTarget.dispatchEvent(event);

    const result = outputTracker.clear();

    expect(result).toEqual(["bar"]);
    expect(outputTracker.data).toEqual([]);
  });

  it("should stop tracking", () => {
    const eventTarget = new EventTarget();
    const outputTracker = OutputTracker.create<string>(eventTarget, "foo");
    const event = new CustomEvent("foo", { detail: "bar" });
    eventTarget.dispatchEvent(event);

    outputTracker.stop();
    eventTarget.dispatchEvent(event);

    expect(outputTracker.data).toEqual(["bar"]);
  });
});
