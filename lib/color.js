// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

const FACTOR = 0.7;

/**
 * The Color class represents a color in the RGB color space.
 */
export class Color {
  #value;

  /**
   * Creates a color instance from RGB values.
   *
   * @param {number} red - the red component or the RGB value
   * @param {number} [green] - the green component
   * @param {number} [blue] - the blue component
   */
  constructor(red, green, blue) {
    if (green === undefined && blue === undefined) {
      if (typeof red === 'string') {
        this.#value = parseInt(red, 16);
        return;
      }

      this.#value = Number(red);
      return;
    }

    this.#value = ((red & 0xff) << 16) | ((green & 0xff) << 8) |
      ((blue & 0xff) << 0);
  }

  /**
   * The RGB value of the color.
   *
   * @type {number}
   */
  get rgb() {
    return this.#value;
  }

  /**
   * The red component of the color.
   *
   * @type {number}
   */
  get red() {
    return (this.rgb >> 16) & 0xff;
  }

  /**
   * The green component of the color.
   *
   * @type {number}
   */
  get green() {
    return (this.rgb >> 8) & 0xff;
  }

  /**
   * The blue component of the color.
   *
   * @type {number}
   */
  get blue() {
    return (this.rgb >> 0) & 0xff;
  }

  /**
   * Creates a new color that is brighter than this color.
   *
   * @param {number} [factor] - the optional factor to brighten the color
   * @returns {Color} the brighter color
   */
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

  /**
   * Creates a new color that is darker than this color.
   *
   * @param {number} [factor] - the optional factor to darken the color
   * @returns {Color} the darker color
   */
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

  /**
   * Returns the RGB value of the color.
   *
   * @returns {number} the RGB value of the color
   */
  valueOf() {
    return this.rgb;
  }

  /**
   * Returns the hexadecimal representation of the color.
   *
   * @returns {string} the hexadecimal representation of the color
   */
  toString() {
    if (Number.isNaN(this.rgb)) {
      return 'Invalid Color';
    }

    return this.rgb.toString(16).padStart(6, '0');
  }
}
