import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDatabase(): Promise<boolean> {
  if (mongoose.connection.readyState === 1) return true;

  if (!env.MONGODB_URI) {
    logger.info('MongoDB URI not provided. Running with IN_MEMORY_FALLBACK repository.');
    return false;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10
    });
    logger.info('✅ Successfully connected to MongoDB database!');
    return true;
  } catch (err: any) {
    logger.warn(`⚠️ MongoDB connection unavailable (${err.message}). IN_MEMORY_FALLBACK activated.`);
    return false;
  }
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export interface DatabaseHealth {
  status: 'CONNECTED' | 'DISCONNECTED' | 'NOT_CONFIGURED' | 'ERROR';
  configured: boolean;
  checkedAt: string;
  latencyMs: number | null;
  lastError: string | null;
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const checkedAt = new Date().toISOString();
  const startedAt = Date.now();

  if (!env.MONGODB_URI) {
    return { status: 'NOT_CONFIGURED', configured: false, checkedAt, latencyMs: null, lastError: null };
  }

  try {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      return { status: 'DISCONNECTED', configured: true, checkedAt, latencyMs: Date.now() - startedAt, lastError: 'MongoDB connection is not ready.' };
    }
    await mongoose.connection.db.command({ ping: 1 });
    return { status: 'CONNECTED', configured: true, checkedAt, latencyMs: Date.now() - startedAt, lastError: null };
  } catch {
    return { status: 'ERROR', configured: true, checkedAt, latencyMs: Date.now() - startedAt, lastError: 'MongoDB readiness check failed.' };
  }
}
