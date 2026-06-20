import { lookupName } from '../lib/kv';
import { validateName, NAME_RESERVED } from '../lib/validate';
import type { Env } from '../lib/kv';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export async function handleCheck(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const raw = url.searchParams.get('name');

  if (!raw) {
    return new Response(JSON.stringify({ error: 'name parameter required' }), { status: 400, headers: JSON_HEADERS });
  }

  const name = raw;

  if (validateName(name) !== null || NAME_RESERVED.has(name)) {
    return new Response(JSON.stringify({ available: false, name }), { status: 200, headers: JSON_HEADERS });
  }

  const existing = await lookupName(env.NIP05, name);
  return new Response(
    JSON.stringify({ available: existing === null, name }),
    { status: 200, headers: JSON_HEADERS },
  );
}
