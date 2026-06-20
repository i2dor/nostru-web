import { claimName, ClaimError } from '../lib/kv';
import { validateName, validatePubkey } from '../lib/validate';
import type { Env } from '../lib/kv';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function handleClaim(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers: JSON_HEADERS });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid JSON body' }), { status: 400, headers: JSON_HEADERS });
  }

  if (typeof body !== 'object' || body === null) {
    return new Response(JSON.stringify({ error: 'body must be a JSON object' }), { status: 400, headers: JSON_HEADERS });
  }

  const { name, pubkey } = body as Record<string, unknown>;

  if (typeof name !== 'string' || typeof pubkey !== 'string') {
    return new Response(JSON.stringify({ error: 'name and pubkey are required strings' }), { status: 400, headers: JSON_HEADERS });
  }

  const nameErr = validateName(name);
  if (nameErr) return new Response(JSON.stringify({ error: nameErr }), { status: 422, headers: JSON_HEADERS });

  const pubkeyErr = validatePubkey(pubkey);
  if (pubkeyErr) return new Response(JSON.stringify({ error: pubkeyErr }), { status: 422, headers: JSON_HEADERS });

  try {
    await claimName(env.NIP05, name, pubkey);
    return new Response(JSON.stringify({ ok: true, name, pubkey }), { status: 200, headers: JSON_HEADERS });
  } catch (err) {
    if (err instanceof ClaimError) {
      return new Response(JSON.stringify({ error: err.message, code: err.code }), { status: 409, headers: JSON_HEADERS });
    }
    throw err;
  }
}
