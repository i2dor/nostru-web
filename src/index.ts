import { handleLanding } from './handlers/landing';
import { handleNip05 } from './handlers/nip05';
import { handleClaim } from './handlers/claim';
import { handleCheck } from './handlers/check';
import { handleProfile } from './handlers/profile';
import type { Env } from './lib/kv';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.protocol === 'http:') {
      return Response.redirect(`https://${url.host}${url.pathname}${url.search}`, 301);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (url.pathname === '/.well-known/nostr.json') return handleNip05(request, env);
    if (url.pathname === '/claim') return handleClaim(request, env);
    if (url.pathname === '/check') return handleCheck(request, env);
    if (url.pathname === '/' || url.pathname === '') return handleLanding();

    if (/^\/[a-z0-9][a-z0-9_-]{0,29}$/.test(url.pathname)) return handleProfile(request, env);

    return new Response('Not found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
