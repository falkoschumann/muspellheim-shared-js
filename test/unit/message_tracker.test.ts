// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import { MessageRouter } from "../../src/infrastructure";
import { MessageTracker } from "../../src/infrastructure/message_tracker";
import type { Message } from "../../src/domain";

describe("Message tracker", () => {
  it("should track a message", () => {
    const messageRouter = new MessageRouter();
    const messageTracker = MessageTracker.create(messageRouter, "foo");

    messageRouter.route({ type: "foo", data: { value: "bar" } });

    expect(messageTracker.messages).toEqual<Message[]>([
      { type: "foo", data: { value: "bar" } },
    ]);
  });

  it("should track multiple messages", () => {
    const messageRouter = new MessageRouter();
    const messageTracker = MessageTracker.create(messageRouter, "foo", "bar");

    messageRouter.route({ type: "foo", data: { value: "1" } });
    messageRouter.route({ type: "bar", data: { value: "2" } });

    expect(messageTracker.messages).toEqual<Message[]>([
      { type: "foo", data: { value: "1" } },
      { type: "bar", data: { value: "2" } },
    ]);
  });

  it("should clear stored output", () => {
    const messageRouter = new MessageRouter();
    const messageTracker = MessageTracker.create(messageRouter, "foo");

    messageRouter.route({ type: "foo", data: { value: "bar" } });
    const result = messageTracker.clear();

    expect(result).toEqual<Message[]>([
      { type: "foo", data: { value: "bar" } },
    ]);
    expect(messageTracker.messages).toEqual<Message[]>([]);
  });
});
