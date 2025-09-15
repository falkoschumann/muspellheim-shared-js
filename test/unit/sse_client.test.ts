// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import { SseClient } from "../../src/infrastructure/sse_client";

describe("SSE client", () => {
  describe("with nulled", () => {
    it("should be not connect when created", () => {
      const client = SseClient.createNull();

      expect(client.isConnected).toEqual(false);
    });

    it("should connect to a server", async () => {
      const client = SseClient.createNull();

      await client.connect("https://example.com");

      expect(client.isConnected).toEqual(true);
      expect(client.url).toEqual("https://example.com");
    });

    it("should emit open event when connected", async () => {
      const client = SseClient.createNull();
      const events: Event[] = [];
      client.addEventListener("open", (event) => events.push(event));

      await client.connect("https://example.com");

      expect(events).toEqual([expect.objectContaining({ type: "open" })]);
    });

    it("should reject multiple connections", async () => {
      const client = SseClient.createNull();
      await client.connect("https://example.com");

      await expect(() => client.connect("https://example.com")).rejects.toThrow(
        "Already connected.",
      );
    });

    it("should close the connection", async () => {
      const client = SseClient.createNull();
      await client.connect("https://example.com");

      await client.close();

      expect(client.isConnected).toEqual(false);
    });

    it("should ignore multiple closures", async () => {
      const client = SseClient.createNull();
      await client.connect("https://example.com");
      await client.close();

      await client.close();

      expect(client.isConnected).toEqual(false);
    });

    it("should emit a message event when a message is received", async () => {
      const client = SseClient.createNull();
      const events: Event[] = [];
      client.addEventListener("message", (event) => events.push(event));
      await client.connect("https://example.com");

      client.simulateMessage("lorem ipsum", undefined, "1");

      expect(events).toEqual([
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
      await client.connect("https://example.com");

      client.simulateMessage("lorem ipsum", "ping");

      expect(events).toEqual([
        expect.objectContaining({
          type: "ping",
          data: "lorem ipsum",
        }),
      ]);
    });

    it("should emit an error event when an error occurred", async () => {
      const client = SseClient.createNull();
      const events: Event[] = [];
      client.addEventListener("error", (event) => events.push(event));
      await client.connect("https://example.com");

      client.simulateError();

      expect(events).toEqual([expect.objectContaining({ type: "error" })]);
    });
  });
});
