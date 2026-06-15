// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import { State } from "../../src/domain";

describe("State", () => {
  it("should initialize a state", () => {
    const state = new State("foo");

    expect(state.get()).toEqual("foo");
  });

  it("should store a state", () => {
    const state = new State("foo");

    state.put("foobar");

    expect(state.get()).toEqual("foobar");
  });
});
