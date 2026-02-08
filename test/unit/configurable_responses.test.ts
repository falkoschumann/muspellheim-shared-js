// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import { ConfigurableResponses } from "../../src/infrastructure/configurable_responses";

describe("Configurable responses", () => {
  describe("with given single value", () => {
    it("should always return the same value", () => {
      const responses = ConfigurableResponses.create(42);

      expect(responses.next()).toBe(42);
      expect(responses.next()).toBe(42);
      expect(responses.next()).toBe(42);
    });

    it("should throw an error if no value is given", () => {
      const responses = ConfigurableResponses.create();

      expect(() => responses.next()).toThrow(
        new Error("No more responses configured."),
      );
    });
  });

  describe("with given multiple values", () => {
    it("should return values in order", () => {
      const responses = ConfigurableResponses.create([1, 2, 3]);

      expect(responses.next()).toBe(1);
      expect(responses.next()).toBe(2);
      expect(responses.next()).toBe(3);
    });

    it("should throw an error if no value is available", () => {
      const responses = ConfigurableResponses.create([1, 2, 3], "foobar");

      responses.next();
      responses.next();
      responses.next();

      expect(() => responses.next()).toThrow(
        new Error("No more responses configured in foobar."),
      );
    });

    it("should throw an error if array is empty", () => {
      const responses = ConfigurableResponses.create([]);

      expect(() => responses.next()).toThrow(
        new Error("No more responses configured."),
      );
    });
  });

  describe("with given response object", () => {
    it("should convert all properties in an object into ConfigurableResponse instances", () => {
      const responseObject = {
        a: 1,
        b: [2, 3],
      };

      const responses = ConfigurableResponses.mapObject(responseObject);

      expect(responses).toEqual<Record<string, ConfigurableResponses>>({
        a: expect.any(ConfigurableResponses),
        b: expect.any(ConfigurableResponses),
      });
    });

    it("should convert all properties in an object into ConfigurableResponse instances and add descripton", () => {
      const responseObject = {
        a: [],
        b: [2, 3],
      };

      const responses = ConfigurableResponses.mapObject(
        responseObject,
        "foobar",
      );
      // to trigger error message with description
      const run = () => responses.a.next();

      expect(run).toThrow(
        new Error("No more responses configured in foobar: a."),
      );
    });
  });
});
