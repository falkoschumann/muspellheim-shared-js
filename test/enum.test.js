import { describe, expect, it } from '@jest/globals';

import { Enum } from '../lib/enum.js';

describe('Enum', () => {
  it('returns name when converted to string', () => {
    const yes = YesNo.YES;

    expect(yes.toString()).toEqual('YES');
  });

  it('returns ordinal when converted to value', () => {
    const yes = YesNo.NO;

    expect(yes.valueOf()).toEqual(1);
  });

  it('returns name when converted to JSON', () => {
    const yes = YesNo.YES;

    expect(yes.toJSON()).toEqual('YES');
  });

  it('returns enum constant by name', () => {
    const yes = YesNo.valueOf('YES');

    expect(yes).toEqual(YesNo.YES);
  });

  it('fails when enum constant does not exist', () => {
    expect(() => YesNo.valueOf('MAYBE')).toThrow(
      new Error('No enum constant YesNo.MAYBE exists.'),
    );
  });
});

class YesNo extends Enum {
  static YES = new YesNo('YES', 0);
  static NO = new YesNo('NO', 1);
}
