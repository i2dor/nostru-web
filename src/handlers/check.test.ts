import { describe, it, expect } from 'vitest';
import { handleCheck } from './check';
import type { Env } from '../lib/kv';

const PUBKEY = 'a'.repeat(64);

function makeEnv(store: Record<string, string> = {}): Env {
  return {
    NIP05: {
      get: (key: string) => Promise.resolve(store[key] ?? null),
      put: () => Promise.resolve(),
      delete: () => Promise.resolve(),
      list: () => Promise.resolve({ keys: [], list_complete: true, caret: undefined }),
      getWithMetadata: (key: string) => Promise.resolve({ value: store[key] ?? null, metadata: null, cacheStatus: null }),
    } as unknown as KVNamespace,
  };
}

describe('handleCheck', () => {
  it('returns 400 when name param is missing', async () => {
    const res = await handleCheck(new Request('https://nostru.net/check'), makeEnv());
    expect(res.status).toBe(400);
  });

  it('reports available=true for unclaimed name', async () => {
    const res = await handleCheck(new Request('https://nostru.net/check?name=alice'), makeEnv());
    expect(res.status).toBe(200);
    const body = await res.json() as { available: boolean };
    expect(body.available).toBe(true);
  });

  it('reports available=false for claimed name', async () => {
    const env = makeEnv({ 'name:alice': PUBKEY });
    const res = await handleCheck(new Request('https://nostru.net/check?name=alice'), env);
    const body = await res.json() as { available: boolean };
    expect(body.available).toBe(false);
  });

  it('reports available=false for reserved name', async () => {
    const res = await handleCheck(new Request('https://nostru.net/check?name=admin'), makeEnv());
    const body = await res.json() as { available: boolean };
    expect(body.available).toBe(false);
  });

  it('normalizes name to lowercase', async () => {
    const env = makeEnv({ 'name:alice': PUBKEY });
    const res = await handleCheck(new Request('https://nostru.net/check?name=Alice'), env);
    const body = await res.json() as { available: boolean };
    expect(body.available).toBe(false);
  });

  it('reports available=false for invalid name format', async () => {
    const res = await handleCheck(new Request('https://nostru.net/check?name=ALICE'), makeEnv());
    const body = await res.json() as { available: boolean };
    expect(body.available).toBe(false);
  });
});
