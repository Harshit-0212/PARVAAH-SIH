import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DATA_MODE: z.enum(['demo', 'live', 'hybrid', 'research']).default('research'),
  
  // Open-Meteo Configuration
  OPEN_METEO_ENABLED: z.string().transform((v) => v === 'true').default('true'),
  OPEN_METEO_BASE_URL: z.string().default('https://api.open-meteo.com/v1/forecast'),
  OPEN_METEO_TIMEOUT_MS: z.coerce.number().default(10000),
  OPEN_METEO_CACHE_TTL_MINUTES: z.coerce.number().default(30),

  // IMD Integration Configuration
  IMD_ENABLED: z.string().transform((v) => v === 'true').default('false'),
  IMD_API_BASE_URL: z.string().optional().default(''),
  IMD_API_KEY: z.string().optional().default(''),
  IMD_API_TIMEOUT_MS: z.coerce.number().default(10000),
  IMD_POLL_INTERVAL_MINUTES: z.coerce.number().default(30),

  // MongoDB & Persistence
  MONGODB_URI: z.string().optional().default('mongodb://127.0.0.1:27017/parvaah_db'),
  DATABASE_URL: z.string().optional().default(''),

  // XGBoost ML Service Configuration
  ML_SERVICE_BASE_URL: z.string().default('http://127.0.0.1:8001'),
  ML_SERVICE_TIMEOUT_MS: z.coerce.number().default(10000),
  ML_MODEL_MODE: z.string().default('practice_xgboost'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid backend environment configuration:', parsed.error.format());
  throw new Error('Invalid backend environment configuration');
}

export const env = parsed.data;
