// TODO move to factory method
export const ZERO = Object.freeze({ x: 0, y: 0 });

/**
 * A vector in a two-dimensional space.
 */
export class Vector2D {
  /**
   * Creates a new vector.
   */
  static create({ x, y }) {
    return new Vector2D(x, y);
  }

  /**
   * Creates a vector from two points.
   */
  static fromPoints(a, b) {
    return new Vector2D(b.x - a.x, b.y - a.y);
  }

  // TODO accept x, y
  // TODO accept {x, y}
  // TODO accept []
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Returns the length of the vector.
   */
  get length() {
    return Math.hypot(this.x, this.y);
  }

  /**
   * Adds another vector to this vector and return the new vector.
   */
  add({ x, y }) {
    return new Vector2D(this.x + x, this.y + y);
  }

  /**
   * Subtracts another vector from this vector and return the new vector.
   */
  subtract({ x, y }) {
    return new Vector2D(this.x - x, this.y - y);
  }

  /**
   * Multiplies the vector with a scalar and returns the new vector or
   * multiplies the vector with another vector and returns the scalar.
   */
  multiply(scalarOrVector) {
    if (typeof scalarOrVector === 'number') {
      return new Vector2D(this.x * scalarOrVector, this.y * scalarOrVector);
    }

    return this.x * scalarOrVector.x + this.y * scalarOrVector.y;
  }

  /**
   * Returns the distance between this vector and another vector.
   */
  distance({ x, y }) {
    return Vector2D.fromPoints(this, { x, y }).length;
  }

  /**
   * Returns the rotated vector by the given angle in radians.
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
   */
  unitVector() {
    return this.multiply(1 / this.length);
  }
}

/**
 * A line in a two-dimensional space.
 */
export class Line2D {
  /**
   * Creates a new line.
   */
  static create({ point, direction }) {
    return new Line2D(point, direction);
  }

  /**
   * Creates a line from two points.
   */
  static fromPoints(a, b) {
    return new Line2D(a, Vector2D.fromPoints(a, b));
  }

  constructor(point, direction) {
    this.point = Vector2D.create(point);
    this.direction = Vector2D.create(direction);
  }

  /**
   * Returns the foot of the perpendicular as vector from the line to a point.
   */
  footOfPerpendicular(point) {
    // dissolve after r: (line.position + r * line.direction - point) * line.direction = 0
    const a = this.point.subtract(point);
    const b = a.multiply(this.direction);
    const c = this.direction.multiply(this.direction);
    const r = b !== 0 ? -b / c : 0;

    // solve with r: line.position + r * line.direction = foot
    return this.point.add(this.direction.multiply(r));
  }

  /**
   * Returns the scalar for the point on the line.
   */
  getScalarForPoint(point) {
    if (this.direction.x !== 0.0) {
      return (point.x - this.point.x) / this.direction.x;
    } else if (this.direction.y !== 0.0) {
      return (point.y - this.point.y) / this.direction.y;
    } else {
      return Number.NaN;
    }
  }
}
