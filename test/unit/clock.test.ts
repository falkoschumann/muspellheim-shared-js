// Copyright (c) 2025 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from "vitest";

import { Clock } from "../../src/common/clock";

describe("Clock", () => {
  describe("with system clock", () => {
    it("should get current date", () => {
      const clock = Clock.system();

      const date = clock.date();

      const difference = Math.abs(date.getTime() - Date.now());
      expect(difference).toBeLessThan(200);
    });

    it("should get current millis", () => {
      const clock = Clock.system();

      const millis = clock.millis();

      const difference = Math.abs(millis - Date.now());
      expect(difference).toBeLessThan(200);
    });
  });

  describe("with fixed clock", () => {
    it("should get a fixed date", () => {
      const clock = Clock.fixed("2025-09-14T17:02");

      const date = clock.date();

      expect(date).toEqual<Date>(new Date("2025-09-14T17:02"));
    });
  });

  describe("with offset clock", () => {
    it("should add milliseconds to a fixed date", () => {
      let clock = Clock.fixed("2025-09-14T17:02");

      clock = Clock.offset(clock, 5000);

      expect(clock.date()).toEqual<Date>(new Date("2025-09-14T17:02:05"));
    });
  });
});
