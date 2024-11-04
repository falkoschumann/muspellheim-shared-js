// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from 'vitest';

import {
  Health,
  HealthContributorRegistry,
  HealthEndpoint,
  SimpleHttpCodeStatusMapper,
  SimpleStatusAggregator,
  Status,
} from '../../lib/health.js';

describe('Health', () => {
  it('Creates default health', () => {
    const health = Health.status();

    expect(health.status).toBe(Status.UNKNOWN);
    expect(health.details).toBeUndefined();
  });

  describe('Health endpoint', () => {
    it('Returns default health', () => {
      const { endpoint } = configure();

      const response = endpoint.health();

      expect(response).toEqual({ status: 200, body: { status: Status.UP } });
    });

    it('Registers health indicators', () => {
      const { endpoint, registry } = configure();
      registry.registerContributor('test', {
        health() {
          return Health.unknown();
        },
      });

      const response = endpoint.health();

      expect(response).toEqual({
        status: 200,
        body: {
          status: Status.UNKNOWN,
          components: { test: { status: Status.UNKNOWN } },
        },
      });
    });

    it('Determines the worst status', () => {
      const { endpoint, registry } = configure();
      registry.registerContributor('test1', {
        health() {
          return Health.outOfService();
        },
      });
      registry.registerContributor('test2', {
        health() {
          return Health.down();
        },
      });

      const response = endpoint.health();

      expect(response).toEqual({
        status: 503,
        body: {
          status: Status.DOWN,
          components: {
            test1: { status: Status.OUT_OF_SERVICE },
            test2: { status: Status.DOWN },
          },
        },
      });
    });

    it('Returns the details', () => {
      const { endpoint, registry } = configure();
      registry.registerContributor('test', {
        health() {
          return Health.up({
            details: { foo: 'bar' },
          });
        },
      });

      const response = endpoint.health();

      expect(response).toEqual({
        status: 200,
        body: {
          status: Status.UP,
          components: {
            test: {
              status: Status.UP,
              details: { foo: 'bar' },
            },
          },
        },
      });
    });

    it('Adds an error to the details', () => {
      const { endpoint, registry } = configure();
      registry.registerContributor('test', {
        health() {
          return Health.down({
            error: new TypeError('error message'),
          });
        },
      });

      const response = endpoint.health();

      expect(response).toEqual({
        status: 503,
        body: {
          status: Status.DOWN,
          components: {
            test: {
              status: Status.DOWN,
              details: { error: 'TypeError: error message' },
            },
          },
        },
      });
    });
  });
});

function configure() {
  const registry = new HealthContributorRegistry();
  const endpoint = new HealthEndpoint(registry, {
    primary: {
      statusAggregator: new SimpleStatusAggregator(),
      httpCodeStatusMapper: new SimpleHttpCodeStatusMapper(),
    },
  });
  return { endpoint, registry };
}
