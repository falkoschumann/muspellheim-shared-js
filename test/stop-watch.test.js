import { describe, expect, it } from '@jest/globals';

import { Clock } from '../lib/time.js';
import { StopWatch } from '../lib/stop-watch.js';

describe('Stop watch', () => {
  it('measures time', () => {
    const clock = Clock.fixed();
    const watch = new StopWatch(clock);

    watch.start();
    clock.add(1600);
    watch.stop();

    expect(watch.getTotalTimeMillis()).toBe(1600);
    expect(watch.getTotalTimeSeconds()).toBe(1.6);
  });
});
