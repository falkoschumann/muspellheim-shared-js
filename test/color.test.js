import { describe, expect, test } from '@jest/globals';

import { Color } from '../src/color.js';

describe('Color', () => {
  test('Creates a color instance from RGB values', () => {
    const color = new Color(14, 83, 255);

    expect(color.rgb).toEqual(0x0e53ff);
    expect(color.red).toEqual(14);
    expect(color.green).toEqual(83);
    expect(color.blue).toEqual(255);
    expect(color.valueOf()).toEqual(0x0e53ff);
    expect(color.toString()).toEqual('0e53ff');
  });

  test('Creates a color instance from RGB value', () => {
    const color = new Color(0x0e53ff);

    expect(color.valueOf()).toEqual(0x0e53ff);
  });

  test('Creates a color instance from RGB string', () => {
    const color = new Color('0e53ff');

    expect(color.valueOf()).toEqual(0x0e53ff);
  });

  test('Creates invalid color', () => {
    const color = new Color();

    expect(color.valueOf()).toEqual(Number.NaN);
    expect(color.toString()).toEqual('Invalid Color');
  });

  test('Returns darker color', () => {
    const color = new Color('0e53ff');

    const newColor = color.darker();

    expect(newColor.toString()).toEqual('093ab2');
  });

  test('Returns brighter color', () => {
    const color = new Color('093ab2');

    const newColor = color.brighter();

    expect(newColor.toString()).toEqual('0c52fe');
  });

  test('Returns grey when color is black', () => {
    const color = new Color('000000');

    const newColor = color.brighter();

    expect(newColor.toString()).toEqual('030303');
  });
});
