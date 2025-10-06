import { loadConfig } from '../../config/index';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createWpClient() {
  const cfg = loadConfig();
  const base = cfg.wpBaseUrl.replace(/\/$/, '');

  async function get(path: string, params?: Record<string, string>) {
    const url = new URL(path, base);
    if (params) url.search = new URLSearchParams(params).toString();

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (cfg.wpAppUser && cfg.wpAppPassword) {
      const token = Buffer.from(`${cfg.wpAppUser}:${cfg.wpAppPassword}`).toString('base64');
      headers.Authorization = `Basic ${token}`;
    }

    // simple retry/backoff for 429 / 5xx
    let attempt = 0;
    while (true) {
      attempt += 1;
      const resp = await fetch(url.toString(), { headers });

      if (resp.status === 429 || resp.status >= 500) {
        if (attempt >= 3) {
          const body = await resp.text().catch(() => '');
          throw new Error(`WP request failed after ${attempt} attempts: ${resp.status} ${body}`);
        }
        // exponential-ish backoff
        const wait = attempt * 1000;
        await sleep(wait);
        continue;
      }

      const data = await resp.json().catch(() => null);
      return { data, headers: resp.headers, status: resp.status } as const;
    }
  }

  return { get } as const;
}
