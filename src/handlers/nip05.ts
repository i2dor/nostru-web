import { lookupName } from '../lib/kv';
import type { Env } from '../lib/kv';

export async function handleNip05(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const name = url.searchParams.get('name')?.toLowerCase() ?? '';

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=300',
  };

  if (!name) {
    return new Response(JSON.stringify({ error: 'name parameter required' }), { status: 400, headers });
  }

  const pubkey = await lookupName(env.NIP05, name);
  if (!pubkey) {
    return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers });
  }

  return new Response(
    JSON.stringify({ names: { [name]: pubkey }, relays: { [pubkey]: [] } }),
    { status: 200, headers },
  );
}
