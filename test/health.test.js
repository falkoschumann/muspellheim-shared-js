import { describe, expect, test } from '@jest/globals';

import { Health, HealthRegistry } from '../src/health.js';

describe('Health', () => {
  describe('Health registry', () => {
    test('Returns default health', () => {
      const endpoint = HealthRegistry.create();

      const health = endpoint.health();

      expect(health).toEqual({ status: 'UP' });
    });

    test('Registers health indicators', () => {
      const registry = HealthRegistry.create();
      registry.register('test', {
        health() {
          return new Health();
        },
      });

      const health = registry.health();

      expect(health).toEqual({
        status: 'UP',
        components: { test: { status: 'UP' } },
      });
    });

    test('Determines the worst status', () => {
      const registry = HealthRegistry.create();
      registry.register('test1', {
        health() {
          return Health.outOfService();
        },
      });
      registry.register('test2', {
        health() {
          return Health.down();
        },
      });

      const health = registry.health();

      expect(health).toEqual({
        status: 'DOWN',
        components: {
          test1: { status: 'OUT_OF_SERVICE' },
          test2: { status: 'DOWN' },
        },
      });
    });
  });
});
