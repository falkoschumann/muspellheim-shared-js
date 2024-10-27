import { describe, expect, it } from '@jest/globals';

import {
  Counter,
  MeterId,
  MeterRegistry,
  MeterType,
} from '../../lib/metrics.js';

describe('Metrics', () => {
  describe('Meter registry', () => {
    it('Creates a new counter if it does not exist', () => {
      const registry = MeterRegistry.create();

      const counter = registry.counter('counter1', ['tag1', 'tag2']);

      expect(
        counter.id.equals(
          MeterId.create({ name: 'counter1', tags: ['tag1', 'tag2'] }),
        ),
      ).toEqual(true);
      expect(counter.id.type).toEqual(MeterType.COUNTER);
    });

    it('Returns the same counter if it already exists', () => {
      const registry = MeterRegistry.create();

      const counter1 = registry.counter('counter1', ['tag1', 'tag2']);
      const counter2 = registry.counter('counter1', ['tag1', 'tag2']);

      expect(counter1).toBe(counter2);
    });
  });

  describe('Counter', () => {
    it('Increments by 1 by default', () => {
      const counter = new Counter(MeterId.create({ name: 'counter1' }));

      counter.increment();

      expect(counter.count()).toEqual(1);
    });

    it('Increments by 3', () => {
      const counter = new Counter(MeterId.create({ name: 'counter1' }));

      counter.increment(3);

      expect(counter.count()).toEqual(3);
    });
  });

  describe('Meter ID', () => {
    describe('Equals', () => {
      it('Returns true if names and tags are equal', () => {
        const id1 = MeterId.create({
          name: 'name',
          tags: ['tag1', 'tag2'],
          type: MeterType.COUNTER,
        });
        const id2 = MeterId.create({
          name: 'name',
          tags: ['tag1', 'tag2'],
          type: MeterType.COUNTER,
        });

        const result = id1.equals(id2);

        expect(result).toEqual(true);
      });

      it('Returns false if names are not equal', () => {
        const id1 = MeterId.create({
          name: 'name1',
          tags: ['tag1', 'tag2'],
          type: MeterType.COUNTER,
        });
        const id2 = MeterId.create({
          name: 'name2',
          tags: ['tag1', 'tag2'],
          type: MeterType.COUNTER,
        });

        const result = id1.equals(id2);

        expect(result).toEqual(false);
      });

      it('Returns false if tags are not equal', () => {
        const id1 = MeterId.create({
          name: 'name',
          tags: ['tag1', 'tag2'],
          type: MeterType.COUNTER,
        });
        const id2 = MeterId.create({
          name: 'name',
          tags: ['tag1', 'tag3'],
          type: MeterType.COUNTER,
        });

        const result = id1.equals(id2);

        expect(result).toEqual(false);
      });

      it('Ignores different types', () => {
        const id1 = MeterId.create({
          name: 'name',
          tags: ['tag1', 'tag2'],
          type: MeterType.COUNTER,
        });
        const id2 = MeterId.create({
          name: 'name',
          tags: ['tag1', 'tag2'],
          type: MeterType.GAUGE,
        });

        const result = id1.equals(id2);

        expect(result).toEqual(true);
      });
    });
  });
});
