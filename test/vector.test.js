import { describe, expect, it } from '@jest/globals';

import { Line2D, Vector2D } from '../lib/vector.js';

describe('Vector', () => {
  describe('Vector 2D', () => {
    it('Creates a vector with 2 points', () => {
      const a = { x: 1.5, y: 5.0 };
      const b = { x: 6.5, y: 3.0 };

      const c = Vector2D.fromPoints(a, b);

      expect(c).toEqual({ x: 5.0, y: -2.0 });
    });

    it('Calculates the vectors length', () => {
      const l = Vector2D.create({ x: 5.0, y: -2.0 }).length;

      expect(l).toBeCloseTo(5.39);
    });

    it('Adds two vectors', () => {
      const a = Vector2D.create({ x: 1.5, y: 5.0 });
      const b = Vector2D.create({ x: 6.5, y: 3.0 });

      const c = a.add(b);

      expect(c).toEqual({ x: 8.0, y: 8.0 });
    });

    it('Subtracts two vectors', () => {
      const a = Vector2D.create({ x: 1.5, y: 5.0 });
      const b = Vector2D.create({ x: 6.5, y: 3.0 });

      const c = a.subtract(b);

      expect(c).toEqual({ x: -5.0, y: 2.0 });
    });

    it('Multiplies a vector with a scalar', () => {
      const a = Vector2D.create({ x: 1.5, y: 5.0 });

      const c = a.multiply(2);

      expect(c).toEqual({ x: 3.0, y: 10.0 });
    });

    it('Calculates the dot product of two vectors', () => {
      const a = Vector2D.create({ x: 1.5, y: 5.0 });
      const b = Vector2D.create({ x: 6.5, y: 3.0 });

      const c = a.multiply(b);

      expect(c).toBeCloseTo(24.75);
    });

    it('Calculates the distance between two points', () => {
      const a = Vector2D.create({ x: 1.5, y: 5.0 });
      const b = Vector2D.create({ x: 6.5, y: 3.0 });

      const c = a.distance(b);

      expect(c).toBeCloseTo(5.39);
    });

    it('Rotates a vector by 90 degrees', () => {
      const a = Vector2D.create({ x: 1.0, y: 0.0 });

      const c = a.rotate(Math.PI / 2);

      expect(c).toEqual({ x: expect.closeTo(0.0, 10), y: 1.0 });
    });

    it('Calculates the unit vector', () => {
      const a = Vector2D.create({ x: 1.5, y: 5.0 });

      const c = a.unitVector();

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

    describe('Calulates the foot of perpendicular', () => {
      it('Returns vector on line when the point is between first and second point', () => {
        const line = Line2D.create({
          point: { x: 1.5, y: 5.0 },
          direction: { x: 5.0, y: -2.0 },
        });
        const point = { x: 5.0, y: 6.5 };

        const foot = line.footOfPerpendicular(point);
        const scalar = line.getScalarForPoint(foot);

        expect(foot).toEqual({ x: 4.0, y: 4.0 });
        expect(0 < scalar && scalar < 1).toBe(true);
      });

      it('Returns vector on first point when the foot is the first point', () => {
        const line = Line2D.create({
          point: { x: 1.5, y: 5.0 },
          direction: { x: 5.0, y: -2.0 },
        });
        const point = { x: 2.5, y: 7.5 };

        const foot = line.footOfPerpendicular(point);
        const scalar = line.getScalarForPoint(foot);

        expect(foot).toEqual({ x: 1.5, y: 5.0 });
        expect(scalar).toEqual(0.0);
      });

      it('Returns vector on second point when the foot is the second point', () => {
        const line = Line2D.create({
          point: { x: 1.5, y: 5.0 },
          direction: { x: 5.0, y: -2.0 },
        });
        const point = { x: 7.5, y: 5.5 };

        const foot = line.footOfPerpendicular(point);
        const scalar = line.getScalarForPoint(foot);

        expect(foot).toEqual({ x: 6.5, y: 3.0 });
        expect(scalar).toEqual(1.0);
      });

      it('Return vector before line when the foot is before the first point', () => {
        const line = Line2D.create({
          point: { x: 1.5, y: 5.0 },
          direction: { x: 5.0, y: -2.0 },
        });
        const point = { x: 0.0, y: 8.5 };

        const foot = line.footOfPerpendicular(point);
        const scalar = line.getScalarForPoint(foot);

        expect(foot).toEqual({ x: -1.0, y: 6.0 });
        expect(scalar).toBeLessThan(0.0);
      });

      it('Return vector after line when the fot is after the second point', () => {
        const line = Line2D.create({
          point: { x: 1.5, y: 5.0 },
          direction: { x: 5.0, y: -2.0 },
        });
        const point = { x: 10.0, y: 4.5 };

        const foot = line.footOfPerpendicular(point);
        const scalar = line.getScalarForPoint(foot);

        expect(foot).toEqual({ x: 9.0, y: 2.0 });
        expect(scalar).toBeGreaterThan(1.0);
      });

      it('Returns vector on line when the line is horizontal', () => {
        const line = Line2D.create({
          point: { x: 2.0, y: 1.0 },
          direction: { x: 1.0, y: 0.0 },
        });
        const point = { x: 2.5, y: 2.0 };

        const foot = line.footOfPerpendicular(point);
        const scalar = line.getScalarForPoint(foot);

        expect(foot).toEqual({ x: 2.5, y: 1.0 });
        expect(0 < scalar && scalar < 1).toBe(true);
      });

      it('Returns vector on line when the line is vertical', () => {
        const line = Line2D.create({
          point: { x: 2.0, y: 2.0 },
          direction: { x: 0.0, y: -2.0 },
        });
        const point = { x: 3.0, y: 1.0 };

        const foot = line.footOfPerpendicular(point);
        const scalar = line.getScalarForPoint(foot);

        expect(foot).toEqual({ x: 2.0, y: 1.0 });
        expect(0 < scalar && scalar < 1).toBe(true);
      });

      it('Returns not a number when direction is zero vector', () => {
        const line = Line2D.create({
          point: { x: 2.0, y: 2.0 },
          direction: { x: 0.0, y: 0.0 },
        });
        const point = { x: 3.0, y: 1.0 };

        const foot = line.footOfPerpendicular(point);
        const scalar = line.getScalarForPoint(foot);

        expect(foot).toEqual({ x: 2.0, y: 2.0 });
        expect(Number.isNaN(scalar)).toBe(true);
      });
    });
  });
});
