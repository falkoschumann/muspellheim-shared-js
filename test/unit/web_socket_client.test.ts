// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

/*
 * @vitest-environment jsdom
 */

import { describe, expect, it } from "vitest";

import { WebSocketClient } from "../../src/infrastructure/web_socket_client";

describe("Web socket client", () => {
  describe("with nulled", () => {
    it("should be not connect when created", () => {
      const client = WebSocketClient.createNull();

      expect(client.isConnected).toBe(false);
    });

    it("should connect to a server", async () => {
      const client = WebSocketClient.createNull();

      await client.connect("ws://example.com");

      expect(client.isConnected).toBe(true);
      expect(client.url).toBe("ws://example.com");
    });

    it("should emit open event when connected", async () => {
      const client = WebSocketClient.createNull();
      const events: Event[] = [];
      client.addEventListener("open", (event) => events.push(event));

      await client.connect("ws://example.com");

      expect(events).toEqual<Event[]>([
        expect.objectContaining({ type: "open" }),
      ]);
    });

    it("should reject multiple connections", async () => {
      const client = WebSocketClient.createNull();
      await client.connect("ws://example.com");

      await expect(() => client.connect("ws://example.com")).rejects.toThrow(
        "Already connected.",
      );
    });

    it("should close the connection", async () => {
      const client = WebSocketClient.createNull();
      await client.connect("ws://example.com");

      await client.close();

      expect(client.isConnected).toBe(false);
    });

    it("should emit a close event when disconnected", async () => {
      const client = WebSocketClient.createNull();
      const events: Event[] = [];
      client.addEventListener("close", (event) => events.push(event));
      await client.connect("ws://example.com");

      client.simulateClose(1003, "Unsupported Data");

      expect(events).toEqual<CloseEvent[]>([
        expect.objectContaining({ type: "close" }),
      ]);
    });

    it("should ignore multiple closures", async () => {
      const client = WebSocketClient.createNull();
      await client.connect("ws://example.com");
      await client.close();

      await client.close();

      expect(client.isConnected).toBe(false);
    });

    it("should emit a message event when a message is received", async () => {
      const client = WebSocketClient.createNull();
      const events: Event[] = [];
      client.addEventListener("message", (event) => events.push(event));
      await client.connect("ws://example.com");

      client.simulateMessage("lorem ipsum");

      expect(events).toEqual<MessageEvent[]>([
        expect.objectContaining({ type: "message", data: "lorem ipsum" }),
      ]);
    });

    it("should send a message", async () => {
      const client = WebSocketClient.createNull();
      const messagesSent = client.trackMessageSent();
      await client.connect("ws://example.com");

      client.send("lorem ipsum");

      expect(messagesSent.data).toEqual<string[]>(["lorem ipsum"]);
    });

    it("should emit an error event when an error occurred", async () => {
      const client = WebSocketClient.createNull();
      const events: Event[] = [];
      client.addEventListener("error", (event) => events.push(event));
      await client.connect("ws://example.com");

      client.simulateError();

      expect(events).toEqual<Event[]>([
        expect.objectContaining({ type: "error" }),
      ]);
    });

    it("should send heartbeats while connected", async () => {
      const client = WebSocketClient.createNull({ heartbeat: 1000 });
      const messagesSent = client.trackMessageSent();
      await client.connect("ws://example.com");

      client.simulateHeartbeat();
      client.simulateHeartbeat();
      await client.close();
      client.simulateHeartbeat();

      expect(messagesSent.data).toEqual<string[]>(["heartbeat", "heartbeat"]);
    });

    it("should recover after error", async () => {
      const client = WebSocketClient.createNull({ retry: 2 });
      const events: Event[] = [];
      client.addEventListener("open", (event) => events.push(event));
      client.addEventListener("close", (event) => events.push(event));
      client.addEventListener("error", (event) => events.push(event));
      await client.connect("ws://example.com");

      client.simulateError();
      await new Promise((resolve) => setTimeout(resolve, 200));
      await client.close();

      expect(events).toEqual<Event[]>([
        expect.objectContaining({ type: "open" }),
        expect.objectContaining({ type: "close" }),
        expect.objectContaining({ type: "error" }),
        expect.objectContaining({ type: "open" }),
        expect.objectContaining({ type: "close" }),
      ]);
    });
  });
});
