// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import { EventTracker } from "../../src/common/event_tracker";
import { WebSocketClient } from "../../src/infrastructure/web_socket_client";

describe("Web socket client", () => {
  describe("with nulled event source", () => {
    describe("Connect", () => {
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
        const trackedEvents = EventTracker.create(client, "open");

        await client.connect("ws://example.com");

        expect(trackedEvents.events).toEqual<Event[]>([
          expect.objectContaining({ type: "open" }),
        ]);
      });

      it("should reject multiple connections", async () => {
        const client = WebSocketClient.createNull();
        await client.connect("ws://example.com");

        const action = client.connect("ws://example.com");

        await expect(action).rejects.toThrow("Already connected.");
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
    });

    describe("Close", () => {
      it("should close the connection", async () => {
        const client = WebSocketClient.createNull();
        await client.connect("ws://example.com");

        await client.close();

        expect(client.isConnected).toBe(false);
      });

      it("should ignore multiple closures", async () => {
        const client = WebSocketClient.createNull();
        await client.connect("ws://example.com");
        await client.close();

        await client.close();

        expect(client.isConnected).toBe(false);
      });

      it("should emit a close event when disconnected", async () => {
        const client = WebSocketClient.createNull();
        const trackedEvents = EventTracker.create(client, "close");
        await client.connect("ws://example.com");

        client.simulateClose(1003, "Unsupported Data");

        expect(trackedEvents.events).toEqual<CloseEvent[]>([
          expect.objectContaining({ type: "close" }),
        ]);
      });
    });

    describe("Send", () => {
      it("should send a message", async () => {
        const client = WebSocketClient.createNull();
        const messagesSent = client.trackMessageSent();
        await client.connect("ws://example.com");

        await client.send("lorem ipsum");

        expect(messagesSent.data).toEqual<string[]>(["lorem ipsum"]);
      });
    });

    describe("Receive message", () => {
      it("should emit a message event when a message is received", async () => {
        const client = WebSocketClient.createNull();
        const trackedEvents = EventTracker.create<MessageEvent>(
          client,
          "message",
        );
        await client.connect("ws://example.com");

        client.simulateMessage("lorem ipsum");

        expect(trackedEvents.events).toEqual<MessageEvent[]>([
          expect.objectContaining({ type: "message", data: "lorem ipsum" }),
        ]);
      });

      it("should convert an object to JSON string for simulated message", async () => {
        const client = WebSocketClient.createNull();
        const events: Event[] = [];
        client.addEventListener("message", (event) => events.push(event));
        await client.connect("https://example.com");

        client.simulateMessage({ foo: "bar" });

        expect(events).toEqual<MessageEvent[]>([
          expect.objectContaining({
            type: "message",
            data: '{"foo":"bar"}',
          }),
        ]);
      });

      it("should emit a message event with blob", async () => {
        const client = WebSocketClient.createNull();
        const trackedEvents = EventTracker.create<MessageEvent>(
          client,
          "message",
        );
        await client.connect("ws://example.com");

        const data = new Blob();
        client.simulateMessage(data);

        expect(trackedEvents.events).toEqual<MessageEvent[]>([
          expect.objectContaining({ type: "message", data }),
        ]);
      });

      it("should emit a message event with array buffer", async () => {
        const client = WebSocketClient.createNull();
        const trackedEvents = EventTracker.create<MessageEvent>(
          client,
          "message",
        );
        await client.connect("ws://example.com");

        const data = new ArrayBuffer();
        client.simulateMessage(data);

        expect(trackedEvents.events).toEqual<MessageEvent[]>([
          expect.objectContaining({ type: "message", data }),
        ]);
      });
    });

    describe("Handle error", () => {
      it("should emit an error event when an error occurred", async () => {
        const client = WebSocketClient.createNull();
        const trackEvents = EventTracker.create<Event>(client, "error");
        await client.connect("ws://example.com");

        client.simulateError();

        expect(trackEvents.events).toEqual<Event[]>([
          expect.objectContaining({ type: "error" }),
        ]);
      });

      it("should recover after error", async () => {
        const client = WebSocketClient.createNull({ retry: 2 });
        const trackEvents = EventTracker.create<Event>(
          client,
          "open",
          "close",
          "error",
        );
        await client.connect("ws://example.com");

        client.simulateError();
        await new Promise((resolve) => setTimeout(resolve, 200));
        await client.close();

        expect(trackEvents.events).toEqual<Event[]>([
          expect.objectContaining({ type: "open" }),
          expect.objectContaining({ type: "close" }),
          expect.objectContaining({ type: "error" }),
          expect.objectContaining({ type: "open" }),
          expect.objectContaining({ type: "close" }),
        ]);
      });
    });
  });
});
