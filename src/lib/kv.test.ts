import { describe, it, expect, beforeEach } from 'vitest';
import { lookupName, lookupPubkey, claimName, ClaimError } from './kv';

function makeKV(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: (key: string) => Promise.resolve(store.get(key) ?? null),
    put: (key: string, value: string) => { store.set(key, value); return Promise.resolve(); },
    delete: (key: string) => { store.delete(key); return Promise.resolve(); },
    list: () => Promise.resolve({ keys: [], list_complete: true, caret: undefined }),
    getWithMetadata: (key: string) => Promise.resolve({ value: store.get(key) ?? null, metadata: null, cacheStatus: null }),
  } as unknown as KVNamespace;
}

const NAME = 'alice';
const PUBKEY = 'a'.repeat(64);
const PUBKEY2 = 'b'.repeat(64);

describe('lookupName', () => {
  it('returns null when name is not claimed', async () => {
    expect(await lookupName(makeKV(), NAME)).toBeNull();
  });

  it('returns pubkey after claim', async () => {
    const kv = makeKV();
    await claimName(kv, NAME, PUBKEY);
    expect(await lookupName(kv, NAME)).toBe(PUBKEY);
  });
});

describe('lookupPubkey', () => {
  it('returns null when pubkey has no name', async () => {
    expect(await lookupPubkey(makeKV(), PUBKEY)).toBeNull();
  });

  it('returns name after claim', async () => {
    const kv = makeKV();
    await claimName(kv, NAME, PUBKEY);
    expect(await lookupPubkey(kv, PUBKEY)).toBe(NAME);
  });
});

describe('claimName', () => {
  let kv: KVNamespace;
  beforeEach(() => { kv = makeKV(); });

  it('stores name->pubkey and pubkey->name', async () => {
    await claimName(kv, NAME, PUBKEY);
    expect(await lookupName(kv, NAME)).toBe(PUBKEY);
    expect(await lookupPubkey(kv, PUBKEY)).toBe(NAME);
  });

  it('throws name_taken when name already claimed', async () => {
    await claimName(kv, NAME, PUBKEY);
    const err = await claimName(kv, NAME, PUBKEY2).catch(e => e);
    expect(err).toBeInstanceOf(ClaimError);
    expect((err as ClaimError).code).toBe('name_taken');
  });

  it('throws pubkey_taken when pubkey already has a name', async () => {
    await claimName(kv, NAME, PUBKEY);
    const err = await claimName(kv, 'bob', PUBKEY).catch(e => e);
    expect(err).toBeInstanceOf(ClaimError);
    expect((err as ClaimError).code).toBe('pubkey_taken');
  });

  it('allows different name+pubkey pairs', async () => {
    await expect(claimName(kv, NAME, PUBKEY)).resolves.toBeUndefined();
    await expect(claimName(kv, 'bob', PUBKEY2)).resolves.toBeUndefined();
  });
});
