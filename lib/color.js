const FACTOR = 0.7;

export class Color {
  #value;

  constructor(red, green, blue) {
    if (green === undefined && blue === undefined) {
      if (typeof red === 'string') {
        this.#value = parseInt(red, 16);
        return;
      }

      this.#value = Number(red);
      return;
    }

    this.#value =
      ((red & 0xff) << 16) | ((green & 0xff) << 8) | ((blue & 0xff) << 0);
  }

  get rgb() {
    return this.#value;
  }

  get red() {
    return (this.rgb >> 16) & 0xff;
  }

  get green() {
    return (this.rgb >> 8) & 0xff;
  }

  get blue() {
    return (this.rgb >> 0) & 0xff;
  }

  brighter(factor = FACTOR) {
    if (Number.isNaN(this.rgb)) {
      return new Color();
    }

    let red = this.red;
    let green = this.green;
    let blue = this.blue;

    const inverse = Math.floor(1 / (1 - factor));
    if (red === 0 && green === 0 && blue === 0) {
      return new Color(inverse, inverse, inverse);
    }

    if (red > 0 && red < inverse) red = inverse;
    if (green > 0 && green < inverse) green = inverse;
    if (blue > 0 && blue < inverse) blue = inverse;

    return new Color(
      Math.min(Math.floor(red / FACTOR), 255),
      Math.min(Math.floor(green / FACTOR), 255),
      Math.min(Math.floor(blue / FACTOR), 255),
    );
  }

  darker(factor = FACTOR) {
    if (Number.isNaN(this.rgb)) {
      return new Color();
    }

    return new Color(
      Math.max(Math.floor(this.red * factor), 0),
      Math.max(Math.floor(this.green * factor), 0),
      Math.max(Math.floor(this.blue * factor), 0),
    );
  }

  valueOf() {
    return this.rgb;
  }

  toString() {
    if (Number.isNaN(this.rgb)) {
      return 'Invalid Color';
    }

    return this.rgb.toString(16).padStart(6, '0');
  }
}
