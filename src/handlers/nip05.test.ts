import { describe, it, expect } from 'vitest';
import { handleNip05 } from './nip05';
import type { Env } from '../lib/kv';

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

const PUBKEY = 'a'.repeat(64);

describe('handleNip05', () => {
  it('returns 400 when name param is missing', async () => {
    const res = await handleNip05(new Request('https://nostru.net/.well-known/nostr.json'), makeEnv());
    expect(res.status).toBe(400);
  });

  it('returns 404 when name is not found', async () => {
    const res = await handleNip05(
      new Request('https://nostru.net/.well-known/nostr.json?name=alice'),
      makeEnv(),
    );
    expect(res.status).toBe(404);
  });

  it('returns NIP-05 JSON for known name', async () => {
    const env = makeEnv({ 'name:alice': PUBKEY });
    const res = await handleNip05(
      new Request('https://nostru.net/.well-known/nostr.json?name=alice'),
      env,
    );
    expect(res.status).toBe(200);
    const body = await res.json() as { names: Record<string, string> };
    expect(body.names['alice']).toBe(PUBKEY);
  });

  it('normalizes name to lowercase', async () => {
    const env = makeEnv({ 'name:alice': PUBKEY });
    const res = await handleNip05(
      new Request('https://nostru.net/.well-known/nostr.json?name=Alice'),
      env,
    );
    expect(res.status).toBe(200);
  });

  it('sets CORS header', async () => {
    const env = makeEnv({ 'name:alice': PUBKEY });
    const res = await handleNip05(
      new Request('https://nostru.net/.well-known/nostr.json?name=alice'),
      env,
    );
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
