// Copyright (c) 2023-2024 Falko Schumann. All rights reserved. MIT license.

import { describe, expect, it } from 'vitest';

import { OutputTracker } from '../../lib/output-tracker.js';

describe('Output tracker', () => {
  it('uses custom event to track output', () => {
    const eventTarget = new EventTarget();
    const outputTracker = OutputTracker.create(eventTarget, 'foo');

    const event = new CustomEvent('foo', { detail: 'bar' });
    eventTarget.dispatchEvent(event);

    expect(outputTracker.data).toEqual(['bar']);
  });

  it('clears stored output', () => {
    const eventTarget = new EventTarget();
    const outputTracker = OutputTracker.create(eventTarget, 'foo');
    const event = new CustomEvent('foo', { detail: 'bar' });
    eventTarget.dispatchEvent(event);

    expect(outputTracker.clear()).toEqual(['bar']);

    expect(outputTracker.data).toEqual([]);
  });

  it('stops tracking', () => {
    const eventTarget = new EventTarget();
    const outputTracker = OutputTracker.create(eventTarget, 'foo');
    const event = new CustomEvent('foo', { detail: 'bar' });
    eventTarget.dispatchEvent(event);

    outputTracker.stop();
    eventTarget.dispatchEvent(event);

    expect(outputTracker.data).toEqual(['bar']);
  });
});
