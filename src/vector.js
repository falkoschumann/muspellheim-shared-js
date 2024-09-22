export const ZERO = Object.freeze({ x: 0, y: 0 });

export class Vector {
  static create({ x, y }) {
    return new Vector(x, y);
  }

  static fromPoints(a, b) {
    return new Vector(b.x - a.x, b.y - a.y);
  }

  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  get length() {
    return Math.hypot(this.x, this.y);
  }

  add({ x, y }) {
    return new Vector(this.x + x, this.y + y);
  }

  subtract({ x, y }) {
    return new Vector(this.x - x, this.y - y);
  }

  multiply(scalarOrVector) {
    if (typeof scalarOrVector === 'number') {
      return new Vector(this.x * scalarOrVector, this.y * scalarOrVector);
    }

    return this.x * scalarOrVector.x + this.y * scalarOrVector.y;
  }

  distance({ x, y }) {
    return Vector.fromPoints(this, { x, y }).length;
  }

  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vector(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
  }

  unitVector() {
    return this.multiply(1 / this.length);
  }
}

export class Line {
  static create({ point, direction }) {
    return new Line(point, direction);
  }

  static fromPoints(a, b) {
    return new Line(a, Vector.fromPoints(a, b));
  }

  constructor(point, direction) {
    this.point = Vector.create(point);
    this.direction = Vector.create(direction);
  }

  footOfPerpendicular(point) {
    // dissolve after r: (line.position + r * line.direction - point) * line.direction = 0
    const a = this.point.subtract(point);
    const b = a.multiply(this.direction);
    const c = this.direction.multiply(this.direction);
    const r = b !== 0 ? -b / c : 0;

    // solve with r: line.position + r * line.direction = foot
    return this.point.add(this.direction.multiply(r));
  }

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
