import { describe, expect, it } from '@jest/globals';

import { Health, HealthRegistry } from '../lib/health.js';

describe('Health', () => {
  describe('Health registry', () => {
    it('Returns default health', () => {
      const endpoint = HealthRegistry.create();

      const health = endpoint.health();

      expect(health).toEqual({ status: 'UP' });
    });

    it('Registers health indicators', () => {
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

    it('Determines the worst status', () => {
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
