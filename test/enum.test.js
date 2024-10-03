import { describe, expect, test } from '@jest/globals';

import { Enum } from '../lib/enum.js';

describe('Enum', () => {
  test('Returns name when converted to string', () => {
    const yes = YesNo.YES;

    expect(yes.toString()).toEqual('YES');
  });

  test('Returns ordinal when converted to value', () => {
    const yes = YesNo.NO;

    expect(yes.valueOf()).toEqual(1);
  });

  test('Returns name when converted to JSON', () => {
    const yes = YesNo.YES;

    expect(yes.toJSON()).toEqual('YES');
  });

  test('Returns enum constant by name', () => {
    const yes = YesNo.valueOf('YES');

    expect(yes).toEqual(YesNo.YES);
  });

  test('Fails when enum constant does not exist', () => {
    expect(() => YesNo.valueOf('MAYBE')).toThrow(
      new Error('No enum constant YesNo.MAYBE exists.'),
    );
  });
});

class YesNo extends Enum {
  static YES = new YesNo(0, 'YES');
  static NO = new YesNo(1, 'NO');
}
