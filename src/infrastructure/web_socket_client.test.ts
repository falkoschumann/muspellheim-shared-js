// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import { WebSocketClient } from "./web_socket_client";

describe("Web socket client", () => {
  it("should connect", async () => {
    const client = WebSocketClient.createNull();

    await client.connect("ws://example.com");

    expect(client.isConnected).toBe(true);
  });

  it("should reject the connection when it closes before it is opened", async () => {
    const client = WebSocketClient.createNull();
    const closed = new Promise((resolve) =>
      client.addEventListener("close", resolve),
    );

    const result = client.connect("ws://example.com");
    client.simulateClose(1006);

    await expect(result).rejects.toThrow(
      "Connection closed before it was opened (code 1006).",
    );
    await expect(closed).resolves.toBeDefined();
  });

  it("should not reject a connection that closes after it was opened", async () => {
    const client = WebSocketClient.createNull();
    await client.connect("ws://example.com");

    await client.close();

    expect(client.isConnected).toBe(false);
  });
});
