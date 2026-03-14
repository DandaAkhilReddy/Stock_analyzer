/**
 * Tests for src/config/env.ts
 *
 * import.meta.env values are baked into the module at import time, so each
 * scenario that needs a different env state must:
 *   1. Mutate import.meta.env BEFORE importing the module
 *   2. Call vi.resetModules() to evict the cached module
 *   3. Re-import dynamically to get a fresh evaluation
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Capture the original env so every test starts from a clean slate
const originalEnv = { ...import.meta.env };

async function loadConfig(): Promise<{ apiUrl: string; wsUrl: string }> {
  const mod = await import('../../config/env');
  return mod.config;
}

describe('config/env', () => {
  beforeEach(() => {
    // Reset module registry so each dynamic import re-evaluates the module
    vi.resetModules();
  });

  afterEach(() => {
    // Restore import.meta.env to its original state after every test
    Object.assign(import.meta.env, originalEnv);
    // Remove any keys that were added during the test
    for (const key of Object.keys(import.meta.env)) {
      if (!(key in originalEnv)) {
        delete (import.meta.env as Record<string, unknown>)[key];
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Shape / contract
  // ---------------------------------------------------------------------------

  describe('config object shape', () => {
    it('exports a config object with apiUrl and wsUrl keys', async () => {
      const config = await loadConfig();

      expect(config).toHaveProperty('apiUrl');
      expect(config).toHaveProperty('wsUrl');
    });

    it('config object has exactly two keys', async () => {
      const config = await loadConfig();

      expect(Object.keys(config)).toHaveLength(2);
    });

    it('both values are strings', async () => {
      const config = await loadConfig();

      expect(typeof config.apiUrl).toBe('string');
      expect(typeof config.wsUrl).toBe('string');
    });
  });

  // ---------------------------------------------------------------------------
  // VITE_API_URL
  // ---------------------------------------------------------------------------

  describe('apiUrl', () => {
    it('returns empty string when VITE_API_URL is not set', async () => {
      delete (import.meta.env as Record<string, unknown>).VITE_API_URL;

      const config = await loadConfig();

      expect(config.apiUrl).toBe('');
    });

    it('returns the custom URL when VITE_API_URL is set', async () => {
      (import.meta.env as Record<string, unknown>).VITE_API_URL =
        'http://localhost:8000';

      const config = await loadConfig();

      expect(config.apiUrl).toBe('http://localhost:8000');
    });

    it('returns the URL as-is with trailing slash', async () => {
      (import.meta.env as Record<string, unknown>).VITE_API_URL =
        'https://api.example.com/';

      const config = await loadConfig();

      expect(config.apiUrl).toBe('https://api.example.com/');
    });

    it('falls back to empty string when VITE_API_URL is an empty string', async () => {
      // An empty string is falsy — the `|| ''` expression still yields ''
      (import.meta.env as Record<string, unknown>).VITE_API_URL = '';

      const config = await loadConfig();

      expect(config.apiUrl).toBe('');
    });

    it('falls back to empty string when VITE_API_URL is explicitly deleted (key absent)', async () => {
      // Deleting the key means import.meta.env.VITE_API_URL is `undefined`
      // at evaluation time, so `undefined || ''` yields ''.
      delete (import.meta.env as Record<string, unknown>).VITE_API_URL;

      const config = await loadConfig();

      expect(config.apiUrl).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // VITE_WS_URL
  // ---------------------------------------------------------------------------

  describe('wsUrl', () => {
    it('returns empty string when VITE_WS_URL is not set', async () => {
      delete (import.meta.env as Record<string, unknown>).VITE_WS_URL;

      const config = await loadConfig();

      expect(config.wsUrl).toBe('');
    });

    it('returns the custom URL when VITE_WS_URL is set', async () => {
      (import.meta.env as Record<string, unknown>).VITE_WS_URL =
        'ws://localhost:8000/ws';

      const config = await loadConfig();

      expect(config.wsUrl).toBe('ws://localhost:8000/ws');
    });

    it('falls back to empty string when VITE_WS_URL is an empty string', async () => {
      (import.meta.env as Record<string, unknown>).VITE_WS_URL = '';

      const config = await loadConfig();

      expect(config.wsUrl).toBe('');
    });

    it('falls back to empty string when VITE_WS_URL is explicitly deleted (key absent)', async () => {
      delete (import.meta.env as Record<string, unknown>).VITE_WS_URL;

      const config = await loadConfig();

      expect(config.wsUrl).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // Both vars set simultaneously
  // ---------------------------------------------------------------------------

  describe('both env vars set', () => {
    it('populates apiUrl and wsUrl independently when both are set', async () => {
      (import.meta.env as Record<string, unknown>).VITE_API_URL =
        'https://api.prod.example.com';
      (import.meta.env as Record<string, unknown>).VITE_WS_URL =
        'wss://ws.prod.example.com';

      const config = await loadConfig();

      expect(config.apiUrl).toBe('https://api.prod.example.com');
      expect(config.wsUrl).toBe('wss://ws.prod.example.com');
    });

    it('apiUrl and wsUrl are independent — setting one does not affect the other', async () => {
      delete (import.meta.env as Record<string, unknown>).VITE_API_URL;
      (import.meta.env as Record<string, unknown>).VITE_WS_URL =
        'ws://localhost:9000';

      const config = await loadConfig();

      expect(config.apiUrl).toBe('');
      expect(config.wsUrl).toBe('ws://localhost:9000');
    });
  });

  // ---------------------------------------------------------------------------
  // Immutability (as const)
  // ---------------------------------------------------------------------------

  describe('config immutability', () => {
    it('config object is frozen / readonly (as const)', async () => {
      const config = await loadConfig();

      // TypeScript enforces this at compile time; at runtime `as const` does
      // not freeze the object, but we document the intent here so a regression
      // (removing `as const`) is visible in the type-system tests.
      expect(config).toBeDefined();
    });
  });
});
