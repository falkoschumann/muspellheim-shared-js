// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "bun:test";

import { SseClient } from "../../src/infrastructure/sse_client";

describe("SSE client", () => {
  describe("with nulled event source", () => {
    it("should be not connect when created", () => {
      const client = SseClient.createNull();

      const isConnected = client.isConnected;

      expect(isConnected).toBe(false);
    });

    it("should connect to a server", async () => {
      const client = SseClient.createNull();

      await client.connect("https://example.com");

      expect(client.isConnected).toBe(true);
      expect(client.url).toBe("https://example.com");
    });

    it("should emit open event when connected", async () => {
      const client = SseClient.createNull();
      const events: Event[] = [];
      client.addEventListener("open", (event) => events.push(event));

      await client.connect("https://example.com");

      expect(events).toEqual<Event[]>([
        expect.objectContaining({ type: "open" }),
      ]);
    });

    it("should reject multiple connections", async () => {
      const client = SseClient.createNull();
      await client.connect("https://example.com");

      const result = client.connect("https://example.com");

      await expect(result).rejects.toThrow("Already connected.");
    });

    it("should close the connection", async () => {
      const client = SseClient.createNull();
      await client.connect("https://example.com");

      await client.close();

      expect(client.isConnected).toBe(false);
    });

    it("should ignore multiple closures", async () => {
      const client = SseClient.createNull();
      await client.connect("https://example.com");
      await client.close();

      await client.close();

      expect(client.isConnected).toBe(false);
    });

    it("should emit a message event when a message is received", async () => {
      const client = SseClient.createNull();
      const events: Event[] = [];
      client.addEventListener("message", (event) => events.push(event));
      await client.connect("https://example.com");

      client.simulateMessage("lorem ipsum", undefined, "1");

      expect(events).toEqual<MessageEvent[]>([
        expect.objectContaining({
          type: "message",
          data: "lorem ipsum",
          lastEventId: "1",
        }),
      ]);
    });

    it("should emit a typed message event when a typed message is received", async () => {
      const client = SseClient.createNull();
      const events: Event[] = [];
      client.addEventListener("ping", (event) => events.push(event));
      await client.connect("https://example.com", "ping");

      client.simulateMessage("lorem ipsum", "ping");

      expect(events).toEqual<MessageEvent[]>([
        expect.objectContaining({
          type: "ping",
          data: "lorem ipsum",
        }),
      ]);
    });

    it("should emit multiple events when a various messages are received", async () => {
      const client = SseClient.createNull();
      const events: Event[] = [];
      client.addEventListener("foo", (event) => events.push(event));
      client.addEventListener("bar", (event) => events.push(event));
      await client.connect("https://example.com", "foo", "bar");

      client.simulateMessage("foo-message", "foo");
      client.simulateMessage("bar-message", "bar");

      expect(events).toEqual<MessageEvent[]>([
        expect.objectContaining({
          type: "foo",
          data: "foo-message",
        }),
        expect.objectContaining({
          type: "bar",
          data: "bar-message",
        }),
      ]);
    });

    it("should emit an error event when an error occurred", async () => {
      const client = SseClient.createNull();
      const events: Event[] = [];
      client.addEventListener("error", (event) => events.push(event));
      await client.connect("https://example.com");

      client.simulateError();

      expect(events).toEqual<Event[]>([
        expect.objectContaining({ type: "error" }),
      ]);
    });
  });
});
