/**
 * Adaptive metric collector and scaler.
 * - maintains a ring buffer of recent outcomes
 * - exposes error/success rates and a suggested concurrency level
 */

export type Outcome = 'success' | 'transient_error' | 'fatal_error';

export class RingBuffer<T> {
  private buf: (T | undefined)[];
  private pos = 0;
  private filled = false;

  constructor(private size: number) {
    this.buf = new Array(size);
  }

  push(item: T) {
    this.buf[this.pos] = item;
    this.pos = (this.pos + 1) % this.size;
    if (this.pos === 0) this.filled = true;
  }

  toArray() {
    if (!this.filled) return this.buf.slice(0, this.pos) as T[];
    return [...this.buf.slice(this.pos), ...this.buf.slice(0, this.pos)] as T[];
  }

  length() {
    return this.filled ? this.buf.length : this.pos;
  }
}

export class AdaptiveScaler {
  private buffer: RingBuffer<Outcome>;
  private minConcurrency: number;
  private maxConcurrency: number;
  private step: number;

  constructor(opts: { windowSize?: number; minConcurrency?: number; maxConcurrency?: number; step?: number } = {}) {
    this.buffer = new RingBuffer(opts.windowSize ?? 100);
    this.minConcurrency = opts.minConcurrency ?? 1;
    this.maxConcurrency = opts.maxConcurrency ?? 10;
    this.step = opts.step ?? 1;
  }

  record(outcome: Outcome) {
    this.buffer.push(outcome);
  }

  stats() {
    const arr = this.buffer.toArray();
    const total = arr.length || 1;
    const transient = arr.filter((x) => x === 'transient_error').length;
    const fatal = arr.filter((x) => x === 'fatal_error').length;
    const success = arr.filter((x) => x === 'success').length;
    return { total, transient, fatal, success, transientRate: transient / total, fatalRate: fatal / total };
  }

  suggestConcurrency(current: number) {
    const { transientRate, fatalRate } = this.stats();
    // conservative rules:
    // - if fatalRate > 1% => drop to minConcurrency
    // - if transientRate > 3% => reduce by step
    // - if transientRate < 1% => increase by step (up to max)
    if (fatalRate > 0.01) return this.minConcurrency;
    if (transientRate > 0.03) return Math.max(this.minConcurrency, current - this.step);
    if (transientRate < 0.01) return Math.min(this.maxConcurrency, current + this.step);
    return current;
  }
}
