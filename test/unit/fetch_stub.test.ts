// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import { createFetchStub } from "../../src/infrastructure/fetch_stub";

describe("Fetch stub", () => {
  it("should return ok when status is between 200 and 299", async () => {
    const fetch = createFetchStub({ status: 200, statusText: "OK" });

    const response = await fetch();

    expect(response.ok).toEqual(true);
  });

  it("should return not ok when status not between 200 and 299", async () => {
    const fetch = createFetchStub({ status: 404, statusText: "Not found" });

    const response = await fetch();

    expect(response.ok).toEqual(false);
  });

  it("should return blob from null", async () => {
    const fetch = createFetchStub({
      status: 200,
      statusText: "OK",
    });

    const response = await fetch();
    const json = await response.blob();

    expect(json).toEqual(null);
  });

  it("should return blob from blob", async () => {
    const fetch = createFetchStub({
      status: 200,
      statusText: "OK",
      body: new Blob(),
    });

    const response = await fetch();
    const blob = await response.blob();

    expect(blob).toBeInstanceOf(Blob);
  });

  it("should return JSON from string", async () => {
    const fetch = createFetchStub({
      status: 200,
      statusText: "OK",
      body: '{"key":"value"}',
    });

    const response = await fetch();
    const json = await response.json();

    expect(json).toEqual({ key: "value" });
  });

  it("should return JSON from object", async () => {
    const fetch = createFetchStub({
      status: 200,
      statusText: "OK",
      body: { key: "value" },
    });

    const response = await fetch();
    const json = await response.json();

    expect(json).toEqual({ key: "value" });
  });

  it("should return JSON from empty body", async () => {
    const fetch = createFetchStub({
      status: 200,
      statusText: "OK",
    });

    const response = await fetch();
    const json = await response.json();

    expect(json).toEqual(null);
  });

  it("should return text", async () => {
    const fetch = createFetchStub({
      status: 200,
      statusText: "OK",
      body: "some text",
    });

    const response = await fetch();
    const text = await response.text();

    expect(text).toEqual("some text");
  });

  it("should return text from empty body", async () => {
    const fetch = createFetchStub({
      status: 200,
      statusText: "OK",
    });

    const response = await fetch();
    const text = await response.text();

    expect(text).toEqual("");
  });

  it("should throw an error when response is an error", async () => {
    const fetch = createFetchStub(new Error("Fetch error"));

    const response = fetch();

    await expect(response).rejects.toThrowError(new Error("Fetch error"));
  });
});
