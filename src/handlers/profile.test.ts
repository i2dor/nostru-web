import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockLookupName } = vi.hoisted(() => ({ mockLookupName: vi.fn() }));
vi.mock('../lib/kv', () => ({ lookupName: mockLookupName }));

import { handleProfile } from './profile';

const PUBKEY = 'a'.repeat(64);
const ENV = { NIP05: {} as KVNamespace };

function req(name: string): Request {
  return new Request(`https://nostru.net/${name}`);
}

describe('handleProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 200 HTML for a claimed name', async () => {
    mockLookupName.mockResolvedValue(PUBKEY);
    const res = await handleProfile(req('alice'), ENV);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('alice');
    expect(html).toContain(PUBKEY);
  });

  it('returns 404 for unclaimed name', async () => {
    mockLookupName.mockResolvedValue(null);
    const res = await handleProfile(req('nobody'), ENV);
    expect(res.status).toBe(404);
    const html = await res.text();
    expect(html).toContain('nobody');
  });

  it('returns 400 for invalid name format', async () => {
    const res = await handleProfile(req('INVALID-NAME'), ENV);
    expect(res.status).toBe(400);
    expect(mockLookupName).not.toHaveBeenCalled();
  });

  it('passes the correct name to lookupName', async () => {
    mockLookupName.mockResolvedValue(PUBKEY);
    await handleProfile(req('alice'), ENV);
    expect(mockLookupName).toHaveBeenCalledWith(ENV.NIP05, 'alice');
  });
});
