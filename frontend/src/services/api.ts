import { config } from '../config/env';

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface ErrorBody {
  error: { code: string; message: string };
}

const REQUEST_TIMEOUT_MS = 120_000;
const MAX_RETRIES = 2;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${config.apiUrl}${path}`;
  let lastError: Error = new Error('Request failed');

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let code = 'UNKNOWN_ERROR';
        let message = `HTTP ${response.status}`;
        try {
          const body: ErrorBody = await response.json();
          code = body.error.code;
          message = body.error.message;
        } catch {
          // Use defaults
        }
        throw new ApiError(response.status, code, message);
      }

      return await response.json() as T;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err as Error;

      // Don't retry API errors (4xx/5xx) — they won't succeed on retry
      if (err instanceof ApiError) {
        throw err;
      }

      // Timeout — don't retry, give clear message
      if ((err as Error).name === 'AbortError') {
        throw new ApiError(
          408,
          'TIMEOUT',
          'Request timed out. The AI model is taking too long — please try again.',
        );
      }

      // Network error — retry with exponential backoff
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
        continue;
      }

      throw new ApiError(
        0,
        'NETWORK_ERROR',
        'Network error. Please check your connection and try again.',
      );
    }
  }

  throw lastError;
}

export function get<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

export function post<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}
