import { describe, it, expect, beforeEach } from 'vitest';
import { handleClaim } from './claim';
import type { Env } from '../lib/kv';

function makeEnv(store: Map<string, string> = new Map()): Env {
  return {
    NIP05: {
      get: (key: string) => Promise.resolve(store.get(key) ?? null),
      put: (key: string, value: string) => { store.set(key, value); return Promise.resolve(); },
      delete: () => Promise.resolve(),
      list: () => Promise.resolve({ keys: [], list_complete: true, caret: undefined }),
      getWithMetadata: (key: string) => Promise.resolve({ value: store.get(key) ?? null, metadata: null, cacheStatus: null }),
    } as unknown as KVNamespace,
  };
}

function post(body: unknown): Request {
  return new Request('https://nostru.net/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const PUBKEY = 'a'.repeat(64);
const PUBKEY2 = 'b'.repeat(64);

describe('handleClaim', () => {
  let env: Env;
  beforeEach(() => { env = makeEnv(); });

  it('rejects non-POST methods', async () => {
    const res = await handleClaim(new Request('https://nostru.net/claim'), env);
    expect(res.status).toBe(405);
  });

  it('rejects malformed JSON', async () => {
    const res = await handleClaim(
      new Request('https://nostru.net/claim', { method: 'POST', body: 'not-json' }),
      env,
    );
    expect(res.status).toBe(400);
  });

  it('rejects missing name or pubkey', async () => {
    const res = await handleClaim(post({ name: 'alice' }), env);
    expect(res.status).toBe(400);
  });

  it('rejects invalid name', async () => {
    const res = await handleClaim(post({ name: 'ALICE', pubkey: PUBKEY }), env);
    expect(res.status).toBe(422);
  });

  it('rejects reserved name', async () => {
    const res = await handleClaim(post({ name: 'admin', pubkey: PUBKEY }), env);
    expect(res.status).toBe(422);
  });

  it('rejects invalid pubkey', async () => {
    const res = await handleClaim(post({ name: 'alice', pubkey: 'short' }), env);
    expect(res.status).toBe(422);
  });

  it('rejects zero pubkey', async () => {
    const res = await handleClaim(post({ name: 'alice', pubkey: '0'.repeat(64) }), env);
    expect(res.status).toBe(422);
  });

  it('claims successfully and returns 200', async () => {
    const res = await handleClaim(post({ name: 'alice', pubkey: PUBKEY }), env);
    expect(res.status).toBe(200);
    const body = await res.json() as { ok: boolean; name: string };
    expect(body.ok).toBe(true);
    expect(body.name).toBe('alice');
  });

  it('normalizes name to lowercase on claim', async () => {
    const res = await handleClaim(post({ name: 'Alice', pubkey: PUBKEY }), env);
    expect(res.status).toBe(422);
  });

  it('returns 409 when name is already taken', async () => {
    await handleClaim(post({ name: 'alice', pubkey: PUBKEY }), env);
    const res = await handleClaim(post({ name: 'alice', pubkey: PUBKEY2 }), env);
    expect(res.status).toBe(409);
    const body = await res.json() as { code: string };
    expect(body.code).toBe('name_taken');
  });

  it('returns 409 when pubkey already has a name', async () => {
    await handleClaim(post({ name: 'alice', pubkey: PUBKEY }), env);
    const res = await handleClaim(post({ name: 'bob', pubkey: PUBKEY }), env);
    expect(res.status).toBe(409);
    const body = await res.json() as { code: string };
    expect(body.code).toBe('pubkey_taken');
  });
});
