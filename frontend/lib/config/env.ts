import { z } from 'zod';

const envSchema = z.object({
  // Core runtime
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000'),
  APP_BASE_URL: z.string().default('http://localhost:3000'),
  AUTH_SECRET: z.string().default('parvaah_dev_secret_key_32bytes_min_length'),

  // MongoDB Atlas Database
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is strictly required to run PARVAAH.'),
  MONGODB_DB_NAME: z.string().default('parvaah_db'),

  // Cloud media storage
  STORAGE_PROVIDER: z.enum(['s3', 'cloudinary', 'local']).default('s3'),
  STORAGE_S3_ENDPOINT: z.string().optional(),
  STORAGE_S3_REGION: z.string().default('ap-south-1'),
  STORAGE_S3_BUCKET: z.string().optional(),
  STORAGE_S3_ACCESS_KEY: z.string().optional(),
  STORAGE_S3_SECRET_KEY: z.string().optional(),
  STORAGE_CDN_URL: z.string().optional(),

  // Cloudinary fallback
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Meteorological integrations
  WEATHER_PROVIDER: z.enum(['open-meteo', 'imd']).default('open-meteo'),
  IMD_API_BASE_URL: z.string().optional(),
  IMD_API_KEY: z.string().optional(),

  // Emergency SMS / Dispatch
  SMS_PROVIDER: z.enum(['cdac', 'twilio', 'mock']).default('mock'),
  CDAC_SMS_GATEWAY_URL: z.string().optional(),
  CDAC_SMS_USERNAME: z.string().optional(),
  CDAC_SMS_PASSWORD: z.string().optional(),
  CDAC_SMS_SENDER_ID: z.string().default('PARVAH'),

  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Spatial & Tiles
  MAP_TILE_PROVIDER: z.string().default('osm'),
  BHUVAN_ISRO_API_KEY: z.string().optional(),
  MAPBOX_ACCESS_TOKEN: z.string().optional(),

  // AI & Reasoning
  GEMINI_API_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

function parseEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.warn('⚠️ Non-fatal environment configuration notices:');
    for (const issue of result.error.issues) {
      console.warn(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
  }

  // Guarantee minimal defaults so Next.js build/HMR does not abort unexpectedly
  return {
    NODE_ENV: (process.env.NODE_ENV as any) || 'development',
    PORT: process.env.PORT || '3000',
    APP_BASE_URL: process.env.APP_BASE_URL || 'http://localhost:3000',
    AUTH_SECRET: process.env.AUTH_SECRET || 'parvaah_dev_secret_key_32bytes_min_length',
    MONGODB_URI: process.env.MONGODB_URI || '',
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'parvaah_db',
    STORAGE_PROVIDER: (process.env.STORAGE_PROVIDER as any) || 's3',
    STORAGE_S3_ENDPOINT: process.env.STORAGE_S3_ENDPOINT,
    STORAGE_S3_REGION: process.env.STORAGE_S3_REGION || 'ap-south-1',
    STORAGE_S3_BUCKET: process.env.STORAGE_S3_BUCKET,
    STORAGE_S3_ACCESS_KEY: process.env.STORAGE_S3_ACCESS_KEY,
    STORAGE_S3_SECRET_KEY: process.env.STORAGE_S3_SECRET_KEY,
    STORAGE_CDN_URL: process.env.STORAGE_CDN_URL,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    WEATHER_PROVIDER: (process.env.WEATHER_PROVIDER as any) || 'open-meteo',
    IMD_API_BASE_URL: process.env.IMD_API_BASE_URL,
    IMD_API_KEY: process.env.IMD_API_KEY,
    SMS_PROVIDER: (process.env.SMS_PROVIDER as any) || 'mock',
    CDAC_SMS_GATEWAY_URL: process.env.CDAC_SMS_GATEWAY_URL,
    CDAC_SMS_USERNAME: process.env.CDAC_SMS_USERNAME,
    CDAC_SMS_PASSWORD: process.env.CDAC_SMS_PASSWORD,
    CDAC_SMS_SENDER_ID: process.env.CDAC_SMS_SENDER_ID || 'PARVAH',
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    MAP_TILE_PROVIDER: process.env.MAP_TILE_PROVIDER || 'osm',
    BHUVAN_ISRO_API_KEY: process.env.BHUVAN_ISRO_API_KEY,
    MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  };
}

export const env = parseEnv();

/**
 * Diagnostic helper returning the health and presence of external integrations.
 * Never leaks secret keys; returns boolean configuration presence only.
 */
export function getSystemIntegrationStatus() {
  return {
    database: {
      status: process.env.MONGODB_URI ? 'configured' : 'missing',
      databaseName: process.env.MONGODB_DB_NAME || 'parvaah_db',
    },
    mediaStorage: {
      provider: process.env.STORAGE_PROVIDER || 's3',
      isConfigured: Boolean(
        (process.env.STORAGE_PROVIDER === 's3' &&
          process.env.STORAGE_S3_BUCKET &&
          process.env.STORAGE_S3_ACCESS_KEY) ||
          (process.env.STORAGE_PROVIDER === 'cloudinary' &&
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_API_KEY)
      ),
      bucket: process.env.STORAGE_S3_BUCKET || 'Not set',
    },
    weather: {
      provider: process.env.WEATHER_PROVIDER || 'open-meteo',
      isConfigured:
        process.env.WEATHER_PROVIDER === 'open-meteo'
          ? true
          : Boolean(process.env.IMD_API_KEY && process.env.IMD_API_BASE_URL),
    },
    notifications: {
      provider: process.env.SMS_PROVIDER || 'mock',
      isConfigured:
        process.env.SMS_PROVIDER === 'cdac'
          ? Boolean(process.env.CDAC_SMS_USERNAME && process.env.CDAC_SMS_PASSWORD)
          : process.env.SMS_PROVIDER === 'twilio'
            ? Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
            : false,
    },
    satellite: {
      bhuvanConfigured: Boolean(process.env.BHUVAN_ISRO_API_KEY),
    },
    aiEngine: {
      provider: 'Google Gemini',
      isConfigured: Boolean(process.env.GEMINI_API_KEY),
    },
  };
}
