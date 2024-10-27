import { describe, expect, it } from '@jest/globals';

import { ServiceLocator } from '../../lib/service-locator.js';

describe('Service locator', () => {
  it('resolves the same service object as registered', () => {
    const locator = new ServiceLocator();
    const service = 'service';
    locator.register('foobar', service);

    const resolved = locator.resolve('foobar');

    expect(resolved).toEqual(service);
  });

  it('resolves a new service object when registered a constructor', () => {
    const locator = new ServiceLocator();
    const service = () => 'service';
    locator.register('foobar', service);

    const resolved = locator.resolve('foobar');

    expect(resolved).toEqual('service');
  });

  it('throws error if service is not registered', () => {
    const locator = new ServiceLocator();

    expect(() => locator.resolve('foobar')).toThrow(
      /^Service not found: foobar.$/,
    );
  });
});
