import { z } from 'zod';

const EnvSchema = z.object({
  WP_BASE_URL: z.string().url(),
  WP_APP_USER: z.string().optional(),
  WP_APP_PASSWORD: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  MAX_WIDTH: z.string().default('2560'),
  WEBP_QUALITY_PHOTO: z.string().default('75'),
  WEBP_QUALITY_GRAPHIC: z.string().default('85'),
  PRESERVE_ICC: z.enum(['auto', 'always', 'never']).default('auto'),
  AVIF_ENABLED: z.string().optional(),
  CONCURRENCY_BASE: z.string().default('3'),
  CONCURRENCY_MAX: z.string().default('5'),
  SCHEDULE_START_HHMM: z.string().optional(),
  SCHEDULE_END_HHMM: z.string().optional(),
});

function parseEnv(env: NodeJS.ProcessEnv) {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    throw new Error('Invalid environment configuration');
  }

  return {
    wpBaseUrl: parsed.data.WP_BASE_URL,
    wpAppUser: parsed.data.WP_APP_USER,
    wpAppPassword: parsed.data.WP_APP_PASSWORD,
    supabaseUrl: parsed.data.SUPABASE_URL,
    supabaseAnonKey: parsed.data.SUPABASE_ANON_KEY,
    supabaseServiceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
    maxWidth: Number(parsed.data.MAX_WIDTH),
    webpQualityPhoto: Number(parsed.data.WEBP_QUALITY_PHOTO),
    webpQualityGraphic: Number(parsed.data.WEBP_QUALITY_GRAPHIC),
    preserveIcc: parsed.data.PRESERVE_ICC,
    avifEnabled: parsed.data.AVIF_ENABLED === 'true',
    concurrencyBase: Number(parsed.data.CONCURRENCY_BASE),
    concurrencyMax: Number(parsed.data.CONCURRENCY_MAX),
    scheduleStart: parsed.data.SCHEDULE_START_HHMM,
    scheduleEnd: parsed.data.SCHEDULE_END_HHMM,
  } as const;
}

let _loaded: ReturnType<typeof parseEnv> | null = null;

export function loadConfig(opts?: { dotenvPath?: string }) {
  // Only load dotenv when explicitly requested (e.g., at app startup or tests)
  if (opts?.dotenvPath) {
    // lazily require dotenv so importing this module doesn't have side effects
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('dotenv').config({ path: opts.dotenvPath });
  } else {
    // try to call config() if dotenv is available on the environment
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('dotenv').config();
    } catch (_) {
      // ignore if dotenv isn't installed or available
    }
  }

  if (!_loaded) {
    _loaded = parseEnv(process.env);
  }
  return _loaded;
}

// Proxy to lazily initialize config on first access. This keeps imports side-effect free.
export const config: any = new Proxy({}, {
  get(_, prop) {
    if (!_loaded) loadConfig();
    return (_loaded as any)[prop];
  }
});

export type Config = ReturnType<typeof parseEnv>;
