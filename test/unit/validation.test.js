// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from 'vitest';

import { buildDefaultValidatorFactory } from '../../lib/validation.js';
import { ServerConfiguration } from '../../lib/node/server-configuration.js';

describe('Validation', () => {
  describe('Validator', () => {
    it('Is valid', () => {
      const validator = buildDefaultValidatorFactory().getValidator();

      const configuration = new ServerConfiguration('localhost', 8080);
      const constraintViolations = validator.validate(configuration);

      expect(constraintViolations).toEqual([]);
    });

    it('Is not valid', () => {
      const validator = buildDefaultValidatorFactory().getValidator();

      // @ts-ignore Test invalid configuration.
      const configuration = new ServerConfiguration(8080, 'localhost');
      const constraintViolations = validator.validate(configuration);

      expect(constraintViolations).toEqual([
        { propertyPath: '/address', message: 'must be string' },
        { propertyPath: '/port', message: 'must be number' },
      ]);
    });
  });
});
