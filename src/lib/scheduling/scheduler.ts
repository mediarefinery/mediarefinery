import { loadConfig } from '../../config';

export type ScheduleWindow = { start: string; end: string }; // ISO time hh:mm

/**
 * Evaluate whether now (in site timezone) is inside the configured schedule window.
 * Config `scheduleStart` and `scheduleEnd` are expected on the central config loader.
 */
export function isWithinSchedule(cfg?: { scheduleStart?: string; scheduleEnd?: string; siteTz?: string }) {
  const c = cfg ?? loadConfig();
  const start = c.scheduleStart;
  const end = c.scheduleEnd;
  if (!start || !end) return true; // no gating configured

  // Interpret times as local times in site's timezone; for now use system local time
  const now = new Date();
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);

  const startDate = new Date(now);
  startDate.setHours(sh, sm, 0, 0);
  const endDate = new Date(now);
  endDate.setHours(eh, em, 0, 0);

  if (startDate <= endDate) return now >= startDate && now <= endDate;
  // window crosses midnight
  return now >= startDate || now <= endDate;
}

export function overridesDisableAdaptive(cfg?: { disableAdaptive?: boolean }) {
  const c = cfg ?? loadConfig();
  return Boolean(c.disableAdaptive);
}
