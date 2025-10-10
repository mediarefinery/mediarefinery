/**
 * Minimal in-memory enqueue helper for dashboard operations.
 * This is intentionally simple: it records jobs in a local array and returns a jobId.
 * In production this should be replaced with a persistent queue or DB-backed job table.
 */
type Job = { id: string; type: string; payload?: any; createdAt: number; status: string };

const JOBS: Job[] = [];

export function enqueueJob(type: string, payload?: any) {
  const jobId = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const job: Job = { id: jobId, type, payload: payload ?? null, createdAt: Date.now(), status: 'queued' };
  JOBS.push(job);
  return Promise.resolve({ jobId, job });
}

export function listJobs() {
  return JOBS.slice();
}
