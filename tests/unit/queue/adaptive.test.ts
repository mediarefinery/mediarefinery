import { AdaptiveScaler } from '../../../src/lib/queue/adaptive';

describe('AdaptiveScaler', () => {
  test('records outcomes and computes rates', () => {
    const s = new AdaptiveScaler({ windowSize: 10, minConcurrency: 1, maxConcurrency: 5, step: 1 });
    // push 8 successes, 1 transient, 1 fatal
    for (let i = 0; i < 8; i++) s.record('success');
    s.record('transient_error');
    s.record('fatal_error');

    const stats = s.stats();
    expect(stats.total).toBe(10);
    expect(stats.success).toBe(8);
    expect(stats.transient).toBe(1);
    expect(stats.fatal).toBe(1);
    // fatal rate is 0.1 > 0.01 so suggestion should be minConcurrency
    const suggested = s.suggestConcurrency(3);
    expect(suggested).toBe(1);
  });
});
