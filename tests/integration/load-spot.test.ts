import { AdaptiveScaler, Outcome } from '../../src/lib/queue/adaptive';
import fs from 'fs/promises';
import path from 'path';
import { performance } from 'perf_hooks';

// Load/performance spot test (10.4)
test(
  'load spot: ramp concurrency 3 -> 5 and record metrics',
  async () => {
    const scaler = new AdaptiveScaler({ windowSize: 100, minConcurrency: 1, maxConcurrency: 5, step: 1 });
    let currentConcurrency = 3; // base concurrency
    const totalJobs = 200;
    let processed = 0;
    const results: { outcome: Outcome; latencyMs: number }[] = [];

    const artifactPath = path.resolve(__dirname, '../artifacts/load-spot.json');
    await fs.mkdir(path.dirname(artifactPath), { recursive: true });

    function syntheticJob(): Promise<void> {
      const start = performance.now();
      return new Promise((resolve) => {
        const latency = 50 + Math.random() * 250; // 50-300ms
        setTimeout(() => {
          const r = Math.random();
          // tuned probabilities: fatal ~0.1%, transient ~0.5%
          let outcome: Outcome = 'success';
          if (r < 0.001) outcome = 'fatal_error';
          else if (r < 0.006) outcome = 'transient_error';
          const latencyMs = performance.now() - start;
          scaler.record(outcome);
          results.push({ outcome, latencyMs });
          processed++;
          resolve();
        }, latency);
      });
    }

    async function runPool() {
      const active: Promise<void>[] = [];
      while (processed < totalJobs) {
        // spawn up to currentConcurrency
        while (active.length < currentConcurrency && processed + active.length < totalJobs) {
          const p = syntheticJob();
          active.push(p);
          // remove when done
          p.then(() => {
            const idx = active.indexOf(p);
            if (idx >= 0) active.splice(idx, 1);
          });
        }

        // adjust concurrency suggestion after a short tick
        currentConcurrency = Math.max(1, scaler.suggestConcurrency(currentConcurrency));
        // small pause
        await new Promise((r) => setTimeout(r, 20));
      }

      // wait for remaining
      await Promise.all(active);
    }

    const t0 = performance.now();
    await runPool();
    const durationSec = (performance.now() - t0) / 1000;

    const success = results.filter((r) => r.outcome === 'success').length;
    const transient = results.filter((r) => r.outcome === 'transient_error').length;
    const fatal = results.filter((r) => r.outcome === 'fatal_error').length;
    const avgLatency = results.reduce((a, b) => a + b.latencyMs, 0) / results.length;
    const throughput = results.length / Math.max(0.0001, durationSec);

    const summary = {
      total: results.length,
      success,
      transient,
      fatal,
      avgLatency,
      durationSec,
      throughput,
      finalConcurrency: currentConcurrency,
      stats: scaler.stats(),
    };

    await fs.writeFile(artifactPath, JSON.stringify(summary, null, 2), 'utf8');

    expect(results.length).toBe(totalJobs);
    expect(success).toBeGreaterThan(0);
  },
  60000,
);
