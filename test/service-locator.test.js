import { describe, expect, test } from '@jest/globals';
import { ServiceLocator } from '../src/service-locator.js';

describe('Service locator', () => {
  test('Resolves the same service object as registered', () => {
    const locator = new ServiceLocator();
    const service = 'service';
    locator.register('foobar', service);

    const resolved = locator.resolve('foobar');

    expect(resolved).toEqual(service);
  });

  test('Resolves a new service object when registered a constructor', () => {
    const locator = new ServiceLocator();
    const service = () => 'service';
    locator.register('foobar', service);

    const resolved = locator.resolve('foobar');

    expect(resolved).toEqual('service');
  });

  test('Throws error if service is not registered', () => {
    const locator = new ServiceLocator();

    expect(() => locator.resolve('foobar')).toThrow(
      /^Service not found: foobar.$/,
    );
  });
});
