// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from 'vitest';

import { Line2D, Vector2D } from '../../lib/vector.js';

describe('Vector', () => {
  describe('Vector 2D', () => {
    it('creates zero vector when no parameters are passed', () => {
      const a = new Vector2D();

      expect(a).toEqual({ x: 0, y: 0 });
    });

    it('creates a vector with 2 coordinates', () => {
      const a = new Vector2D(1.5, 5.0);

      expect(a).toEqual({ x: 1.5, y: 5.0 });
    });

    it('creates a vector from another vector', () => {
      const a = new Vector2D({ x: 1.5, y: 5.0 });

      expect(a).toEqual({ x: 1.5, y: 5.0 });
    });

    it('creates a vector from an array', () => {
      const a = new Vector2D([1.5, 5.0]);

      expect(a).toEqual({ x: 1.5, y: 5.0 });
    });

    it('creates a vector with 2 points', () => {
      const a = { x: 1.5, y: 5.0 };
      const b = { x: 6.5, y: 3.0 };

      const c = Vector2D.fromPoints(a, b);

      expect(c).toEqual({ x: 5.0, y: -2.0 });
    });

    it('calculates the vectors length', () => {
      const l = new Vector2D({ x: 5.0, y: -2.0 }).length();

      expect(l).toBeCloseTo(5.39);
    });

    it('adds a vector', () => {
      const a = new Vector2D({ x: 1.5, y: 5.0 });
      const b = new Vector2D({ x: 6.5, y: 3.0 });

      const c = a.add(b);

      expect(c).toEqual({ x: 8.0, y: 8.0 });
    });

    it('subtracts a vectors', () => {
      const a = new Vector2D({ x: 1.5, y: 5.0 });
      const b = new Vector2D({ x: 6.5, y: 3.0 });

      const c = a.subtract(b);

      expect(c).toEqual({ x: -5.0, y: 2.0 });
    });

    it('scales a vector', () => {
      const a = new Vector2D({ x: 1.5, y: 5.0 });

      const c = a.scale(2);

      expect(c).toEqual({ x: 3.0, y: 10.0 });
    });

    it('calculates the dot product of two vectors', () => {
      const a = new Vector2D({ x: 1.5, y: 5.0 });
      const b = new Vector2D({ x: 6.5, y: 3.0 });

      const c = a.dot(b);

      expect(c).toBeCloseTo(24.75);
    });

    it('calculates the distance between two points', () => {
      const a = new Vector2D({ x: 1.5, y: 5.0 });
      const b = new Vector2D({ x: 6.5, y: 3.0 });

      const c = a.distance(b);

      expect(c).toBeCloseTo(5.39);
    });

    it('rotates a vector', () => {
      const a = new Vector2D({ x: 1.0, y: 0.0 });

      const c = a.rotate(Math.PI / 2); // 90 degrees

      expect(c).toEqual({ x: expect.closeTo(0.0, 10), y: 1.0 });
    });

    it('normalizes a vector', () => {
      const a = new Vector2D({ x: 1.5, y: 5.0 });

      const c = a.normalize();

      expect(c).toEqual({
        x: expect.closeTo(0.287347, 5),
        y: expect.closeTo(0.957826, 5),
      });
    });
  });

  describe('Line 2D', () => {
    it('Create line from two points', () => {
      const a = { x: 1.5, y: 5.0 };
      const b = { x: 6.5, y: 3.0 };

      const line = Line2D.fromPoints(a, b);

      expect(line).toEqual({
        point: { x: 1.5, y: 5.0 },
        direction: { x: 5.0, y: -2.0 },
      });
    });

    describe('Perpendicular', () => {
      it('returns point on line when the point is between first and second point', () => {
        const line = new Line2D({ x: 1.5, y: 5.0 }, { x: 5.0, y: -2.0 });
        const point = { x: 5.0, y: 6.5 };

        const { foot, scalar } = line.perpendicular(point);

        expect(foot).toEqual({ x: 4.0, y: 4.0 });
        expect(0 < scalar && scalar < 1).toBe(true);
      });

      it('returns vector on first point when the foot is the first point', () => {
        const line = new Line2D({ x: 1.5, y: 5.0 }, { x: 5.0, y: -2.0 });
        const point = { x: 2.5, y: 7.5 };

        const { foot, scalar } = line.perpendicular(point);

        expect(foot).toEqual({ x: 1.5, y: 5.0 });
        expect(scalar).toBe(0.0);
      });

      it('returns vector on second point when the foot is the second point', () => {
        const line = new Line2D({ x: 1.5, y: 5.0 }, { x: 5.0, y: -2.0 });
        const point = { x: 7.5, y: 5.5 };

        const { foot, scalar } = line.perpendicular(point);

        expect(foot).toEqual({ x: 6.5, y: 3.0 });
        expect(scalar).toBe(1.0);
      });

      it('return vector before line when the foot is before the first point', () => {
        const line = new Line2D({ x: 1.5, y: 5.0 }, { x: 5.0, y: -2.0 });
        const point = { x: 0.0, y: 8.5 };

        const { foot, scalar } = line.perpendicular(point);

        expect(foot).toEqual({ x: -1.0, y: 6.0 });
        expect(scalar).toBeLessThan(0.0);
      });

      it('return vector after line when the fot is after the second point', () => {
        const line = new Line2D({ x: 1.5, y: 5.0 }, { x: 5.0, y: -2.0 });
        const point = { x: 10.0, y: 4.5 };

        const { foot, scalar } = line.perpendicular(point);

        expect(foot).toEqual({ x: 9.0, y: 2.0 });
        expect(scalar).toBeGreaterThan(1.0);
      });

      it('returns vector on line when the line is horizontal', () => {
        const line = new Line2D({ x: 2.0, y: 1.0 }, { x: 1.0, y: 0.0 });
        const point = { x: 2.5, y: 2.0 };

        const { foot, scalar } = line.perpendicular(point);

        expect(foot).toEqual({ x: 2.5, y: 1.0 });
        expect(0 < scalar && scalar < 1).toBe(true);
      });

      it('returns vector on line when the line is vertical', () => {
        const line = new Line2D({ x: 2.0, y: 2.0 }, { x: 0.0, y: -2.0 });
        const point = { x: 3.0, y: 1.0 };

        const { foot, scalar } = line.perpendicular(point);

        expect(foot).toEqual({ x: 2.0, y: 1.0 });
        expect(0 < scalar && scalar < 1).toBe(true);
      });

      it('returns not a number when direction is zero vector', () => {
        const line = new Line2D({ x: 2.0, y: 2.0 }, { x: 0.0, y: 0.0 });
        const point = { x: 3.0, y: 1.0 };

        const { foot, scalar } = line.perpendicular(point);

        expect(foot).toEqual({ x: 2.0, y: 2.0 });
        expect(Number.isNaN(scalar)).toBe(true);
      });
    });
  });
});
