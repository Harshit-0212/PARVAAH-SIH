/**
 * PARVAAH Resilient REST API Client
 * Features:
 * - Environment configurable baseURL via import.meta.env.VITE_API_BASE_URL
 * - AbortController timeout cancellation
 * - Exponential backoff retry logic
 * - Normalized error types & offline state detection
 */

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class ApiError extends Error {
  status: number;
  isOffline: boolean;
  isTimeout: boolean;
  isRateLimited: boolean;
  rawResponse?: any;

  constructor(
    message: string,
    options: {
      status?: number;
      isOffline?: boolean;
      isTimeout?: boolean;
      isRateLimited?: boolean;
      rawResponse?: any;
    } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status ?? 0;
    this.isOffline = options.isOffline ?? false;
    this.isTimeout = options.isTimeout ?? false;
    this.isRateLimited = options.isRateLimited ?? false;
    this.rawResponse = options.rawResponse;
  }
}

export const API_BASE_URL = 
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
    ? import.meta.env.VITE_API_BASE_URL
    : 'http://localhost:5000/api/v1';

/**
 * Universal JSON fetcher with retry, timeout, and cancellation
 */
export async function apiClient<T>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const {
    timeoutMs = 6000,
    maxRetries = 2,
    retryDelayMs = 500,
    signal: userSignal,
    ...fetchOptions
  } = options;

  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${base}${path}`;

  let attempt = 0;
  let delay = retryDelayMs;

  while (attempt <= maxRetries) {
    // Check navigator offline state
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ApiError('Device is currently offline.', { isOffline: true });
    }

    const controller = new AbortController();
    let timeoutTriggered = false;

    const timeoutId = setTimeout(() => {
      timeoutTriggered = true;
      controller.abort();
    }, timeoutMs);

    // If caller provided their own signal, listen to it
    const handleUserAbort = () => controller.abort();
    if (userSignal) {
      if (userSignal.aborted) {
        clearTimeout(timeoutId);
        throw new ApiError('Request aborted by caller.');
      }
      userSignal.addEventListener('abort', handleUserAbort, { once: true });
    }

    try {
      const res = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(fetchOptions.headers || {})
        }
      });

      clearTimeout(timeoutId);
      if (userSignal) userSignal.removeEventListener('abort', handleUserAbort);

      if (res.status === 429) {
        throw new ApiError('Rate limit exceeded (HTTP 429). Please retry shortly.', {
          status: 429,
          isRateLimited: true
        });
      }

      if (!res.ok) {
        let errorBody: any;
        try {
          errorBody = await res.json();
        } catch {
          errorBody = await res.text();
        }

        // Do not retry 4xx errors except 429 or 408
        if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
          throw new ApiError(
            errorBody?.error || `HTTP request failed with status ${res.status}`,
            { status: res.status, rawResponse: errorBody }
          );
        }

        throw new ApiError(
          errorBody?.error || `Server responded with status ${res.status}`,
          { status: res.status, rawResponse: errorBody }
        );
      }

      const data = await res.json();
      return data as T;

    } catch (err: any) {
      clearTimeout(timeoutId);
      if (userSignal) userSignal.removeEventListener('abort', handleUserAbort);

      const isTimeout = timeoutTriggered || err.name === 'AbortError' && timeoutTriggered;
      const isAbort = err.name === 'AbortError' && !timeoutTriggered;

      if (isAbort) {
        throw new ApiError('Request cancelled by caller.');
      }

      if (isTimeout) {
        if (attempt === maxRetries) {
          throw new ApiError(`Request timed out after ${timeoutMs}ms.`, { isTimeout: true });
        }
      } else if (err instanceof ApiError) {
        if (attempt === maxRetries || err.status >= 400 && err.status < 500) {
          throw err;
        }
      } else if (attempt === maxRetries) {
        throw new ApiError(err.message || 'Network connection failed.', {
          status: 0,
          rawResponse: err
        });
      }

      // Backoff before next attempt
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
      attempt++;
    }
  }

  throw new ApiError('Maximum retry attempts exhausted.');
}
