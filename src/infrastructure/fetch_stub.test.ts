// Copyright (c) 2026 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import { createFetchStub } from "./fetch_stub";

describe("Fetch stub", () => {
  it("should return response with status", async () => {
    const fetch = createFetchStub({ status: 404, statusText: "Not Found" });

    const response = await fetch();

    expect(response.ok).toBe(false);
    expect(response.status).toBe(404);
    expect(response.statusText).toBe("Not Found");
  });

  it("should return response without body", async () => {
    const fetch = createFetchStub({ status: 204, statusText: "No Content" });

    const response = await fetch();

    expect(response.body).toBeNull();
  });

  it("should return text body", async () => {
    const fetch = createFetchStub({
      status: 200,
      statusText: "OK",
      body: "Hello, World!",
    });

    const response = await fetch();

    await expect(response.text()).resolves.toBe("Hello, World!");
  });

  it("should return object body as JSON", async () => {
    const fetch = createFetchStub({
      status: 200,
      statusText: "OK",
      body: { answer: 42 },
    });

    const response = await fetch();

    await expect(response.json()).resolves.toEqual({ answer: 42 });
  });

  it("should return bytes and media type of a Blob body", async () => {
    const bytes = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 255]);
    const fetch = createFetchStub({
      status: 200,
      statusText: "OK",
      body: new Blob([bytes], { type: "image/png" }),
    });

    const response = await fetch();

    expect(response.headers.get("Content-Type")).toBe("image/png");
    const blob = await response.blob();
    expect(blob.type).toBe("image/png");
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(bytes);
  });

  it("should return bytes of a Blob body without media type", async () => {
    const bytes = Uint8Array.from([1, 2, 3]);
    const fetch = createFetchStub({
      status: 200,
      statusText: "OK",
      body: new Blob([bytes]),
    });

    const response = await fetch();

    expect(response.headers.get("Content-Type")).toBeNull();
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  });

  it("should return bytes of a typed array body", async () => {
    const bytes = Uint8Array.from([137, 80, 78, 71, 255]);
    const fetch = createFetchStub({
      status: 200,
      statusText: "OK",
      body: bytes,
    });

    const response = await fetch();

    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  });

  it("should return bytes of an array buffer body", async () => {
    const bytes = Uint8Array.from([137, 80, 78, 71, 255]);
    const fetch = createFetchStub({
      status: 200,
      statusText: "OK",
      body: bytes.buffer,
    });

    const response = await fetch();

    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  });

  it("should throw configured error", async () => {
    const fetch = createFetchStub(new Error("Network unreachable"));

    const result = fetch();

    await expect(result).rejects.toThrow("Network unreachable");
  });

  it("should return configured responses in order", async () => {
    const fetch = createFetchStub([
      { status: 200, statusText: "OK" },
      new Error("Network unreachable"),
      { status: 503, statusText: "Service Unavailable" },
    ]);

    const first = await fetch();
    const second = fetch();
    await expect(second).rejects.toThrow("Network unreachable");
    const third = await fetch();

    expect(first.status).toBe(200);
    expect(third.status).toBe(503);
  });

  it("should throw error when no more responses are configured", async () => {
    const fetch = createFetchStub([{ status: 200, statusText: "OK" }]);
    await fetch();

    const result = fetch();

    await expect(result).rejects.toThrow("No more responses configured.");
  });
});
