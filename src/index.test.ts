import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockNip05, mockClaim, mockCheck, mockLanding } = vi.hoisted(() => ({
  mockNip05:   vi.fn(),
  mockClaim:   vi.fn(),
  mockCheck:   vi.fn(),
  mockLanding: vi.fn(),
}));

vi.mock('./handlers/nip05',   () => ({ handleNip05:   mockNip05   }));
vi.mock('./handlers/claim',   () => ({ handleClaim:   mockClaim   }));
vi.mock('./handlers/check',   () => ({ handleCheck:   mockCheck   }));
vi.mock('./handlers/landing', () => ({ handleLanding: mockLanding }));

import worker from './index';

const OK = new Response('ok', { status: 200 });
const ENV = { NIP05: {} as KVNamespace };

function req(path: string, method = 'GET'): Request {
  return new Request('https://nostru.net' + path, { method });
}

describe('router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNip05.mockResolvedValue(OK);
    mockClaim.mockResolvedValue(OK);
    mockCheck.mockResolvedValue(OK);
    mockLanding.mockResolvedValue(OK);
  });

  it('routes GET / to landing', async () => {
    await worker.fetch(req('/'), ENV);
    expect(mockLanding).toHaveBeenCalledOnce();
  });

  it('routes GET /.well-known/nostr.json to nip05 handler', async () => {
    await worker.fetch(req('/.well-known/nostr.json'), ENV);
    expect(mockNip05).toHaveBeenCalledOnce();
  });

  it('routes POST /claim to claim handler', async () => {
    await worker.fetch(req('/claim', 'POST'), ENV);
    expect(mockClaim).toHaveBeenCalledOnce();
  });

  it('routes GET /check to check handler', async () => {
    await worker.fetch(req('/check'), ENV);
    expect(mockCheck).toHaveBeenCalledOnce();
  });

  it('returns 404 for unknown routes', async () => {
    const res = await worker.fetch(req('/unknown'), ENV);
    expect(res.status).toBe(404);
  });

  it('returns 204 with CORS headers for OPTIONS preflight', async () => {
    const res = await worker.fetch(req('/claim', 'OPTIONS'), ENV);
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
