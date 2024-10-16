import { describe, expect, it } from '@jest/globals';

import {
  ensureAnything,
  ensureArguments,
  ensureItemType,
  ensureNonEmpty,
  ensureThat,
  ensureType,
  ensureUnreachable,
} from '../lib/validation.js';
import { Enum } from '../lib/enum.js';

describe('Validation', () => {
  describe('Ensure unreachable', () => {
    it('Fails always', () => {
      expect(() => {
        ensureUnreachable();
      }).toThrow(/Unreachable code executed\./);
    });
  });

  describe('Ensure that', () => {
    it('Returns value when predicate is successful', () => {
      const result = ensureThat(1, (v) => v > 0);

      expect(result).toBe(1);
    });

    it('Returns value when predicate is successful', () => {
      expect(() =>
        ensureThat(0, (v) => v > 0, 'Value must be greater than 0.'),
      ).toThrow(/Value must be greater than 0\./);
    });
  });

  describe('Ensure anything', () => {
    it('Returns value when parameter is present', () => {
      const result = ensureAnything('John');

      expect(result).toBe('John');
    });

    it('Fails when value is undefined', () => {
      expect(() => ensureAnything(undefined)).toThrow(
        /The value is required, but it was undefined\./,
      );
    });

    it('Fails when value is null', () => {
      expect(() => ensureAnything(null)).toThrow(
        /The value is required, but it was null\./,
      );
    });
  });

  describe('Ensure non empty', () => {
    it('Returns value when it is not empty', () => {
      const result = ensureNonEmpty('John');

      expect(result).toBe('John');
    });

    it('Fails when value is an empty string', () => {
      expect(() => ensureNonEmpty('')).toThrow(
        /The value must not be empty, but it was ""\./,
      );
    });

    it('Fails when value is an empty array', () => {
      expect(() => ensureNonEmpty([])).toThrow(
        /The value must not be empty, but it was \[\]\./,
      );
    });

    it('Fails when value is an empty object', () => {
      expect(() => ensureNonEmpty({})).toThrow(
        /The value must not be empty, but it was {}\./,
      );
    });
  });

  describe('Ensure type', () => {
    describe('Built-in types', () => {
      describe('Undefined', () => {
        it('Returns value when it is the expected type', () => {
          const result = ensureType(undefined, undefined);

          expect(result).toBe(undefined);
        });

        it('Fails when value is not the expected type', () => {
          expect(() => ensureType('a', undefined)).toThrow(
            /The value must be undefined, but it was a string\./,
          );
        });

        it('Fails when value is null', () => {
          expect(() => ensureType(null, undefined)).toThrow(
            /The value must be undefined, but it was null\./,
          );
        });
      });

      describe('Null', () => {
        it('Returns value when it is the expected type', () => {
          const result = ensureType(null, null);

          expect(result).toBe(null);
        });

        it('Fails when value is not the expected type', () => {
          expect(() => ensureType(1, null)).toThrow(
            /The value must be null, but it was a number\./,
          );
        });

        it('Fails when value is undefined', () => {
          expect(() => ensureType(undefined, null)).toThrow(
            /The value must be null, but it was undefined\./,
          );
        });
      });

      describe('Boolean', () => {
        it('Returns value when it is the expected type', () => {
          const result = ensureType(true, Boolean);

          expect(result).toBe(true);
        });

        it('Fails when value is not the expected type', () => {
          expect(() => ensureType(1, Boolean)).toThrow(
            /The value must be a boolean, but it was a number\./,
          );
        });

        it('Fails when value is undefined', () => {
          expect(() => ensureType(undefined, Boolean)).toThrow(
            /The value must be a boolean, but it was undefined\./,
          );
        });

        it('Fails when value is null', () => {
          expect(() => ensureType(null, Boolean)).toThrow(
            /The value must be a boolean, but it was null\./,
          );
        });
      });

      describe('Number', () => {
        it('Returns value when it is the expected type', () => {
          const result = ensureType(42, Number);

          expect(result).toBe(42);
        });

        it('Fails when value is not the expected type', () => {
          expect(() => ensureType('42', Number)).toThrow(
            /The value must be a number, but it was a string\./,
          );
        });

        it('Fails when value is not a number', () => {
          expect(() => ensureType(NaN, Number)).toThrow(
            /The value must be a number, but it was NaN\./,
          );
        });

        it('Fails when value is undefined', () => {
          expect(() => ensureType(undefined, Number)).toThrow(
            /The value must be a number, but it was undefined\./,
          );
        });

        it('Fails when value is null', () => {
          expect(() => ensureType(null, Number)).toThrow(
            /The value must be a number, but it was null\./,
          );
        });
      });

      describe('BigInt', () => {
        it('Returns value when it is the expected type', () => {
          const result = ensureType(BigInt(42), BigInt);

          expect(result).toBe(BigInt(42));
        });

        it('Fails when value is not the expected type', () => {
          expect(() => ensureType(42, BigInt)).toThrow(
            /The value must be a bigint, but it was a number\./,
          );
        });

        it('Fails when value is undefined', () => {
          expect(() => ensureType(undefined, BigInt)).toThrow(
            /The value must be a bigint, but it was undefined\./,
          );
        });

        it('Fails when value is null', () => {
          expect(() => ensureType(null, BigInt)).toThrow(
            /The value must be a bigint, but it was null\./,
          );
        });
      });

      describe('String', () => {
        it('Returns value when it is the expected type', () => {
          const result = ensureType('John', String);

          expect(result).toBe('John');
        });

        it('Fails when value is not the expected type', () => {
          expect(() => ensureType(123, String)).toThrow(
            /The value must be a string, but it was a number\./,
          );
        });

        it('Fails when value is undefined', () => {
          expect(() => ensureType(undefined, String)).toThrow(
            /The value must be a string, but it was undefined\./,
          );
        });

        it('Fails when value is null', () => {
          expect(() => ensureType(null, String)).toThrow(
            /The value must be a string, but it was null\./,
          );
        });
      });

      describe('Symbol', () => {
        it('Returns value when it is the expected type', () => {
          const symbol = Symbol();
          const result = ensureType(symbol, Symbol);

          expect(result).toBe(symbol);
        });

        it('Fails when value is not the expected type', () => {
          expect(() => ensureType('John', Symbol)).toThrow(
            /The value must be a symbol, but it was a string\./,
          );
        });

        it('Fails when value is undefined', () => {
          expect(() => ensureType(undefined, Symbol)).toThrow(
            /The value must be a symbol, but it was undefined\./,
          );
        });

        it('Fails when value is null', () => {
          expect(() => ensureType(null, Symbol)).toThrow(
            /The value must be a symbol, but it was null\./,
          );
        });
      });

      describe('Function', () => {
        it('Returns value when it is the expected type', () => {
          const func = () => {};
          const result = ensureType(func, Function);

          expect(result).toBe(func);
        });

        it('Fails when value is not the expected type', () => {
          expect(() => ensureType('John', Function)).toThrow(
            /The value must be a function, but it was a string\./,
          );
        });

        it('Fails when value is undefined', () => {
          expect(() => ensureType(undefined, Function)).toThrow(
            /The value must be a function, but it was undefined\./,
          );
        });

        it('Fails when value is null', () => {
          expect(() => ensureType(null, Function)).toThrow(
            /The value must be a function, but it was null\./,
          );
        });
      });

      describe('Object', () => {
        it('Returns value when it is the expected type', () => {
          const object = { name: 'John' };
          const result = ensureType(object, Object);

          expect(result).toBe(object);
        });

        it('Fails when value is not the expected type', () => {
          expect(() => ensureType('John', Object)).toThrow(
            /The value must be an object, but it was a string\./,
          );
        });

        it('Fails when value is undefined', () => {
          expect(() => ensureType(undefined, Object)).toThrow(
            /The value must be an object, but it was undefined\./,
          );
        });

        it('Fails when value is null', () => {
          expect(() => ensureType(null, Object)).toThrow(
            /The value must be an object, but it was null\./,
          );
        });
      });

      describe('Array', () => {
        it('Returns value when it is the expected type', () => {
          const array = ['John', 'Smith'];
          const result = ensureType(array, Array);

          expect(result).toBe(array);
        });

        it('Fails when value is not the expected type', () => {
          expect(() => ensureType('John', Array)).toThrow(
            /The value must be an array, but it was a string\./,
          );
        });

        it('Fails when value is undefined', () => {
          expect(() => ensureType(undefined, Array)).toThrow(
            /The value must be an array, but it was undefined\./,
          );
        });

        it('Fails when value is null', () => {
          expect(() => ensureType(null, Array)).toThrow(
            /The value must be an array, but it was null\./,
          );
        });
      });
    });

    describe('Struct types', () => {
      it('Returns value when it is the expected type', () => {
        const result = ensureType(
          {
            name: 'John',
            birthDate: '1982-08-25',
            age: 42,
            isMarried: false,
            children: ['Alice', 'Bob'],
          },
          {
            name: String,
            birthDate: Date,
            age: Number,
            isMarried: Boolean,
            children: Array,
          },
        );

        expect(result).toEqual({
          name: 'John',
          birthDate: new Date('1982-08-25'),
          age: 42,
          isMarried: false,
          children: ['Alice', 'Bob'],
        });
      });

      it('Fails when value is not the expected type', () => {
        expect(() =>
          ensureType(
            { name: 'John', age: '42' },
            { name: String, age: Number },
            { name: 'User' },
          ),
        ).toThrow(/The User.age must be a number, but it was a string\./);
      });

      it('Fails when value is undefined', () => {
        expect(() =>
          ensureType(
            undefined,
            { name: String, age: Number },
            { name: 'User' },
          ),
        ).toThrow(/The User must be an object, but it was undefined\./);
      });

      it('Fails when value is null', () => {
        expect(() =>
          ensureType(null, { name: String, age: Number }, { name: 'User' }),
        ).toThrow(/The User must be an object, but it was null\./);
      });
    });

    describe('Constructor types', () => {
      it('Returns value when it is the expected type', () => {
        const date = new Date('2024-08-23T14:18');
        const result = ensureType(date, Date);

        expect(result).toBe(date);
      });

      it('Returns value when it can convert to the expected type', () => {
        const dateString = '2024-08-23T20:01';
        const result = ensureType(dateString, Date);

        expect(result).toEqual(new Date(dateString));
      });

      it('Fails when it can not convert to the expected type', () => {
        expect(() => ensureType('no-date', Date)).toThrow(
          /The value must be a valid Date, but it was a string: "no-date"\./,
        );
      });

      it('Fails when it it is undefined', () => {
        expect(() => ensureType(undefined, Date)).toThrow(
          /The value must be a valid Date, but it was undefined\./,
        );
      });

      it('Does not fails when it value is null', () => {
        const result = ensureType(null, Date);

        expect(result).toEqual(new Date(0));
      });
    });

    describe('Enums', () => {
      it('Returns value when it is the expected type', () => {
        const constant = YesNo.YES;
        const result = ensureType(constant, YesNo);

        expect(result).toBe(constant);
      });

      it('Returns value when it can convert to the expected type', () => {
        const result = ensureType('no', YesNo);

        expect(result).toBe(YesNo.NO);
      });

      it('Fails when it can not convert to the expected type', () => {
        expect(() => ensureType('no-enum-constant', YesNo)).toThrow(
          /The value must be a YesNo, but it was a string\./,
        );
      });

      it('Fails when it it is undefined', () => {
        expect(() => ensureType(undefined, YesNo)).toThrow(
          /The value must be a YesNo, but it was undefined\./,
        );
      });

      it('Fails when it it is null', () => {
        expect(() => ensureType(null, YesNo)).toThrow(
          /The value must be a YesNo, but it was null\./,
        );
      });
    });

    describe('Multiple types', () => {
      it('Returns value when it is one of the expected types', () => {
        const result = ensureType('John', [String, Number]);

        expect(result).toBe('John');
      });

      it('Returns value when it is another of the expected types', () => {
        const result = ensureType(42, [String, Number]);

        expect(result).toBe(42);
      });

      it('Fails when value is not one of the expected 2 types', () => {
        expect(() => ensureType(true, [String, Number])).toThrow(
          /The value must be a string or a number, but it was a boolean\./,
        );
      });

      it('Fails when value is not one of the expected 3 types', () => {
        expect(() => ensureType(true, [String, Number, undefined])).toThrow(
          /The value must be a string, a number, or undefined, but it was a boolean\./,
        );
      });
    });

    describe('Optional type', () => {
      it('Returns value when it is present', () => {
        const result = ensureType('John', [String, undefined]);

        expect(result).toBe('John');
      });

      it('Returns value when it is undefined', () => {
        const result = ensureType(undefined, [String, undefined]);

        expect(result).toBeUndefined();
      });

      it('Fails when parameter is not the expected type', () => {
        expect(() => ensureType(123, [String, undefined])).toThrow(
          /The value must be a string or undefined, but it was a number\./,
        );
      });

      it('Fails when parameter is null', () => {
        expect(() => ensureType(null, [String, undefined])).toThrow(
          /The value must be a string or undefined, but it was null\./,
        );
      });
    });
  });

  describe('Ensure item type', () => {
    it('Returns value when items has the expected type', () => {
      const names = ['John', 'Jane'];
      const result = ensureItemType(names, String);

      expect(result).toBe(names);
    });

    it('Fails when value is not an array', () => {
      expect(() => ensureItemType('John', String, { name: 'names' })).toThrow(
        /The names must be an array, but it was a string\./,
      );
    });

    it('Fails when items does not have the expected type', () => {
      expect(() =>
        ensureItemType(['John', 123], String, { name: 'names' }),
      ).toThrow(/The names.1 must be a string, but it was a number\./);
    });
  });

  describe('Ensure arguments', () => {
    it('Does nothing when arguments matches', () => {
      expect(() =>
        ensureArguments([123, 'John'], [Number, String]),
      ).not.toThrow();
    });

    it('Fails when too few arguments', () => {
      expect(() => ensureArguments(['John'])).toThrow(
        /Too many arguments: expected 0, but got 1./,
      );
    });

    it('Fails when expected types is not an array', () => {
      expect(() => ensureArguments(['John'], {})).toThrow(
        /The expectedTypes must be an array./,
      );
    });

    it('Fails when names is not an array', () => {
      expect(() => ensureArguments(['John'], [], '')).toThrow(
        /The names must be an array./,
      );
    });

    it('Fails with argument name when an argument does not match', () => {
      expect(() =>
        ensureArguments(['123', 'John'], [Number, String], ['id', 'name']),
      ).toThrow(/The id must be a number, but it was a string\./);
    });

    it('Fails with argument number when an argument does not match', () => {
      expect(() => ensureArguments([123, 456], [Number, String])).toThrow(
        /The argument #2 must be a string, but it was a number\./,
      );
    });
  });
});

class YesNo extends Enum {
  static YES = new YesNo('YES', 0);
  static NO = new YesNo('NO', 1);
}
