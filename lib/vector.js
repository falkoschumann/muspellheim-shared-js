// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

/**
 * A vector in a two-dimensional space.
 */
export class Vector2D {
  /**
   * Creates a vector from 2 points.
   *
   * @param {Vector2D} a The first point.
   * @param {Vector2D} b The second point.
   * @returns {Vector2D} The vector from a to b.
   */
  static fromPoints(a, b) {
    return new Vector2D(b.x - a.x, b.y - a.y);
  }

  /**
   * Creates a new vector.
   *
   * Examples:
   *
   * ```java
   * new Vector2D(1, 2)
   * new Vector2D([1, 2])
   * new Vector2D({ x: 1, y: 2 })
   * ```
   *
   * @param {number|Array<number>|Vector2D} [x=0] The x coordinate or an array
   *   or another vector.
   * @param {number} [y=0] The y coordinate or undefined if x is an array or
   *   another vector.
   */
  constructor(x = 0, y = 0) {
    if (Array.isArray(x)) {
      this.x = Number(x[0]);
      this.y = Number(x[1]);
    } else if (typeof x === 'object' && 'x' in x && 'y' in x) {
      this.x = Number(x.x);
      this.y = Number(x.y);
    } else {
      this.x = Number(x);
      this.y = Number(y);
    }
  }

  /**
   * Returns the length of the vector.
   *
   * @returns {number} The length of the vector.
   */
  length() {
    return Math.hypot(this.x, this.y);
  }

  /**
   * Adds another vector to this vector and return the new vector.
   *
   * @param {Vector2D} v The vector to add.
   * @returns {Vector2D} The new vector.
   */
  add(v) {
    v = new Vector2D(v);
    return new Vector2D(this.x + v.x, this.y + v.y);
  }

  /**
   * Subtracts another vector from this vector and return the new vector.
   *
   * @param {Vector2D} v The vector to subtract.
   * @returns {Vector2D} The new vector.
   */
  subtract(v) {
    v = new Vector2D(v);
    return new Vector2D(this.x - v.x, this.y - v.y);
  }

  /**
   * Multiplies the vector with a scalar and returns the new vector.
   *
   * @param {number} scalar The scalar to multiply with.
   * @returns {Vector2D} The new vector.
   */
  scale(scalar) {
    return new Vector2D(this.x * scalar, this.y * scalar);
  }

  /**
   * Multiplies the vector with another vector and returns the scalar.
   *
   * @param {Vector2D} v The vector to multiply with.
   * @returns {number} The scalar.
   */
  dot(v) {
    v = new Vector2D(v);
    return this.x * v.x + this.y * v.y;
  }

  /**
   * Returns the distance between this vector and another vector.
   *
   * @param {Vector2D} v The other vector.
   * @returns {number} The distance.
   */
  distance(v) {
    v = new Vector2D(v);
    return Vector2D.fromPoints(this, v).length();
  }

  /**
   * Returns the rotated vector by the given angle in radians.
   *
   * @param {number} angle The angle in radians.
   * @returns {Vector2D} The rotated vector.
   */
  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector2D(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos,
    );
  }

  /**
   * Returns the unit vector of this vector.
   *
   * @returns {Vector2D} The unit vector.
   */
  normalize() {
    return this.scale(1 / this.length());
  }
}

/**
 * A line in a two-dimensional space.
 */
export class Line2D {
  /**
   * Creates a line from 2 points.
   *
   * @param {Vector2D} a The first point.
   * @param {Vector2D} b The second point.
   * @returns {Line2D} The line from a to b.
   */
  static fromPoints(a, b) {
    return new Line2D(a, Vector2D.fromPoints(a, b));
  }

  /**
   * Creates a new line.
   *
   * @param {Vector2D} point A point on the line.
   * @param {Vector2D} direction The direction of the line.
   */
  constructor(point, direction) {
    this.point = new Vector2D(point);
    this.direction = new Vector2D(direction);
  }

  /**
   * Returns the perpendicular of a point on this line.
   *
   * @param {Vector2D} point A point.
   * @returns {{foot: number, scalar: number}} The `foot` and the `scalar`.
   */
  perpendicular(point) {
    // dissolve after r: (line.position + r * line.direction - point) * line.direction = 0
    const a = this.point.subtract(point);
    const b = a.dot(this.direction);
    const c = this.direction.dot(this.direction);
    const r = b !== 0 ? -b / c : 0;

    // solve with r: line.position + r * line.direction = foot
    const foot = this.point.add(this.direction.scale(r));

    let scalar;
    if (this.direction.x !== 0.0) {
      scalar = (foot.x - this.point.x) / this.direction.x;
    } else if (this.direction.y !== 0.0) {
      scalar = (foot.y - this.point.y) / this.direction.y;
    } else {
      scalar = Number.NaN;
    }

    return { foot, scalar };
  }
}
