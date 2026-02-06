// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "bun:test";

import { OutputTracker } from "../../src/infrastructure/output_tracker";

describe("Output tracker", () => {
  it("should use custom event to track output", () => {
    const eventTarget = new EventTarget();
    const outputTracker = OutputTracker.create<string>(eventTarget, "foo");

    eventTarget.dispatchEvent(new CustomEvent("foo", { detail: "bar" }));

    expect(outputTracker.data).toEqual<string[]>(["bar"]);
  });

  it("should clear stored output", () => {
    const eventTarget = new EventTarget();
    const outputTracker = OutputTracker.create<string>(eventTarget, "foo");

    eventTarget.dispatchEvent(new CustomEvent("foo", { detail: "bar" }));

    const result = outputTracker.clear();

    expect(result).toEqual<string[]>(["bar"]);
    expect(outputTracker.data).toEqual<string[]>([]);
  });

  it("should stop tracking", () => {
    const eventTarget = new EventTarget();
    const outputTracker = OutputTracker.create<string>(eventTarget, "foo");
    eventTarget.dispatchEvent(new CustomEvent("foo", { detail: "bar" }));

    outputTracker.stop();
    eventTarget.dispatchEvent(new CustomEvent("foo", { detail: "bar" }));

    expect(outputTracker.data).toEqual<string[]>(["bar"]);
  });
});
