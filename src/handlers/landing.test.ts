import { describe, it, expect } from 'vitest';
import { handleLanding } from './landing';

describe('handleLanding', () => {
  it('returns 200 with HTML content-type', async () => {
    const res = await handleLanding();
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
  });

  it('HTML contains nostru.net branding', async () => {
    const res = await handleLanding();
    const text = await res.text();
    expect(text).toContain('nostru.net');
    expect(text).toContain('Nostru');
  });

  it('HTML contains claim form fields', async () => {
    const res = await handleLanding();
    const text = await res.text();
    expect(text).toContain('name');
    expect(text).toContain('pubkey');
  });
});
