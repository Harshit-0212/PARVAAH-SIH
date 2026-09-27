/**
 * Non-leaking structured logger
 */

function sanitize(message: string): string {
  // Redact potential API keys, passwords, or bearer tokens
  return message
    .replace(/(api[_-]?key|secret|password|token)[=:]\s*["']?[^"'\s&]+["']?/gi, '$1=[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]');
}

export const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    console.log(`[INFO] [${timestamp}] ${sanitize(message)}${metaStr}`);
  },
  warn: (message: string, meta?: Record<string, any>) => {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    console.warn(`[WARN] [${timestamp}] ${sanitize(message)}${metaStr}`);
  },
  error: (message: string, error?: any, meta?: Record<string, any>) => {
    const timestamp = new Date().toISOString();
    const errMsg = error instanceof Error ? error.message : String(error || '');
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    console.error(`[ERROR] [${timestamp}] ${sanitize(message)}: ${sanitize(errMsg)}${metaStr}`);
  }
};
