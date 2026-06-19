// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import { MessageRouter } from "../../src/infrastructure";
import { TestResponse } from "./messages";

describe("Message router", () => {
  it("should route message to message handler function", async () => {
    const router = new MessageRouter();
    router.register("my-message", (message) => message.data);

    const response = await router.route<TestResponse>({
      type: "my-message",
      data: new TestResponse(),
    });

    expect(response).toEqual<TestResponse>(new TestResponse());
  });

  it("should route message to message handler object", async () => {
    const router = new MessageRouter();
    router.register("my-message", {
      handle: (message) => message.data,
    });

    const response = await router.route<TestResponse>({
      type: "my-message",
      data: new TestResponse(),
    });

    expect(response).toEqual<TestResponse>(new TestResponse());
  });

  it("should route message to the right message handler", async () => {
    const router = new MessageRouter();
    router.register("message-1", () => ({ value: "message-1" }));
    router.register("message-2", () => ({ value: "message-2" }));

    const response = await router.route<TestResponse>({
      type: "message-2",
      data: null,
    });

    expect(response).toEqual<TestResponse>({ value: "message-2" });
  });

  it("should throw exception when message handler is not registered", async () => {
    const router = new MessageRouter();
    router.register("my-message", (message) => message.data);

    const factory = () =>
      router.route<TestResponse>({
        type: "other-message",
        data: new TestResponse(),
      });

    await expect(factory).rejects.toThrow(
      "No handler registered for message type: other-message",
    );
  });
});
