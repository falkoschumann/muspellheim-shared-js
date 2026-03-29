// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import { createCommandStatus, Failure, Success } from "../../src/domain/messages.ts";

describe("Command status", () => {
  it("should create a success object", () => {
    const status = createCommandStatus({ isSuccess: true, result: { id: 42 } });

    expect(status).toEqual(new Success({ id: 42 }));
  });

  it("should create a failure object", () => {
    const status = createCommandStatus({
      isSuccess: false,
      errorMessage: "test error message",
    });

    expect(status).toEqual(new Failure("test error message"));
  });
});
