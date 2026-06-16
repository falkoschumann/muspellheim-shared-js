// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import { MessageRouter } from "../../src/infrastructure/message_router";

describe("Message router", () => {
  it("should route message to message handler function", () => {
    const router = new MessageRouter();
    router.register("my-message", (message) => message.data);

    const response = router.route<TestMessage>({
      type: "my-message",
      data: { foo: "bar" },
    });

    expect(response).toEqual<TestMessage>({ foo: "bar" });
  });

  it("should route message to message handler object", () => {
    const router = new MessageRouter();
    router.register("my-message", {
      handle: (message) => message.data,
    });

    const response = router.route<TestMessage>({
      type: "my-message",
      data: { foo: "bar" },
    });

    expect(response).toEqual<TestMessage>({ foo: "bar" });
  });

  it("should route message to the right message handler", () => {
    const router = new MessageRouter();
    router.register("message-1", () => ({ foo: "message-1" }));
    router.register("message-2", () => ({ foo: "message-2" }));

    const response = router.route<TestMessage>({
      type: "message-2",
      data: null,
    });

    expect(response).toEqual<TestMessage>({ foo: "message-2" });
  });

  it("should throw exception when message handler is not registered", () => {
    const router = new MessageRouter();
    router.register("my-message", (message) => message.data);

    const factory = () =>
      router.route<TestMessage>({
        type: "other-message",
        data: { foo: "bar" },
      });

    expect(factory).toThrow(
      "No handler registered for message type: other-message",
    );
  });
});

type TestMessage = Readonly<{ foo: string }>;
