import { lookupName } from '../lib/kv';
import type { Env } from '../lib/kv';

const NAME_FORMAT_RE = /^[a-z0-9][a-z0-9_-]{0,28}[a-z0-9]$|^[a-z0-9]$/;

const RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.nostr.band'];

function profileHtml(name: string, pubkey: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${name}@nostru.net</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0d0d0f; --surface: #18181b; --border: #27272a;
      --text: #e4e4e7; --muted: #71717a; --purple: #7c3aed;
      --green: #22c55e; --mono: 'JetBrains Mono', 'Fira Mono', ui-monospace, monospace;
    }
    body { background: var(--bg); color: var(--text); font-family: var(--mono); font-size: 14px; line-height: 1.6; min-height: 100vh; }
    header { padding: 1.25rem 2rem; border-bottom: 1px solid var(--border); display: flex; align-items: baseline; gap: 1rem; }
    .logo { font-size: 1.1rem; font-weight: 700; color: var(--purple); text-decoration: none; letter-spacing: -0.02em; }
    .tagline { color: var(--muted); font-size: 0.75rem; }
    main { max-width: 640px; margin: 0 auto; padding: 2rem 1.5rem; display: flex; flex-direction: column; gap: 2rem; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .profile-header { display: flex; gap: 1.25rem; align-items: flex-start; }
    #avatar { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; background: var(--border); flex-shrink: 0; }
    .avatar-placeholder { width: 72px; height: 72px; border-radius: 50%; background: var(--purple); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; color: #fff; flex-shrink: 0; }
    .profile-meta { flex: 1; min-width: 0; }
    #display-name { font-size: 1.1rem; font-weight: 700; }
    .nip05-badge { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; color: var(--green); margin-top: 0.2rem; }
    .nip05-badge::before { content: "✓"; }
    #bio { color: var(--muted); font-size: 0.85rem; white-space: pre-wrap; }
    #website { color: var(--purple); font-size: 0.8rem; text-decoration: none; word-break: break-all; }
    #website:hover { text-decoration: underline; }
    .pubkey { font-size: 0.7rem; color: var(--muted); font-family: var(--mono); word-break: break-all; margin-top: 0.5rem; }
    h2 { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin-bottom: 0.5rem; }
    .post { padding: 1rem 0; border-bottom: 1px solid var(--border); }
    .post:last-child { border-bottom: none; padding-bottom: 0; }
    .post-content { font-size: 0.85rem; color: var(--text); white-space: pre-wrap; word-break: break-word; line-height: 1.65; }
    .post-time { font-size: 0.7rem; color: var(--muted); margin-top: 0.4rem; }
    .loading { color: var(--muted); font-size: 0.8rem; text-align: center; padding: 2rem 0; }
    footer { max-width: 640px; margin: 0 auto; padding: 1.25rem 1.5rem; color: var(--muted); font-size: 0.7rem; border-top: 1px solid var(--border); display: flex; gap: 1.5rem; }
    footer a { color: var(--muted); text-decoration: none; }
    footer a:hover { color: var(--text); }
  </style>
</head>
<body>

<header>
  <a class="logo" href="/">nostru.net</a>
  <span class="tagline">Nostr identity, yours</span>
</header>

<main>
  <div class="card">
    <div class="profile-header">
      <div class="avatar-placeholder" id="avatar-placeholder">${name.slice(0, 1).toUpperCase()}</div>
      <img id="avatar" style="display:none" alt="">
      <div class="profile-meta">
        <div id="display-name">${name}</div>
        <div class="nip05-badge">${name}@nostru.net</div>
        <div id="bio" style="display:none"></div>
        <a id="website" style="display:none" target="_blank" rel="noopener noreferrer"></a>
      </div>
    </div>
    <div class="pubkey" id="pubkey" title="${pubkey}">${pubkey.slice(0, 16)}...${pubkey.slice(-8)}</div>
  </div>

  <div>
    <h2>Recent posts</h2>
    <div id="posts-list" class="loading">Loading...</div>
  </div>
</main>

<footer>
  <a href="/">nostru.net</a>
  <a href="https://github.com/i2dor/nostru">Nostru extension</a>
  <span>no ads, no tracking</span>
</footer>

<script>
(function () {
  var PUBKEY = '${pubkey}';
  var RELAYS = ${JSON.stringify(RELAYS)};
  var seenPosts = {};
  var posts = [];
  var profileDone = false;

  function ts(t) {
    var d = new Date(t * 1000);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function renderPosts() {
    var el = document.getElementById('posts-list');
    if (!posts.length) { el.textContent = 'No posts yet.'; el.className = 'loading'; return; }
    posts.sort(function(a,b){ return b.created_at - a.created_at; });
    el.className = '';
    el.innerHTML = posts.slice(0, 20).map(function(p) {
      return '<div class="post"><div class="post-content">' + escHtml(p.content) + '</div><div class="post-time">' + ts(p.created_at) + '</div></div>';
    }).join('');
  }

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function applyProfile(meta) {
    if (profileDone) return;
    profileDone = true;
    try { meta = JSON.parse(meta); } catch { return; }
    if (meta.display_name || meta.name) {
      document.getElementById('display-name').textContent = meta.display_name || meta.name;
    }
    if (meta.about) {
      var bio = document.getElementById('bio');
      bio.textContent = meta.about;
      bio.style.display = '';
    }
    if (meta.website) {
      var ws = document.getElementById('website');
      ws.textContent = meta.website.replace(/^https?:\\/\\//, '');
      ws.href = meta.website;
      ws.style.display = '';
    }
    if (meta.picture) {
      var img = document.getElementById('avatar');
      img.src = meta.picture;
      img.style.display = '';
      img.onerror = function() { img.style.display = 'none'; document.getElementById('avatar-placeholder').style.display = ''; };
      document.getElementById('avatar-placeholder').style.display = 'none';
    }
  }

  RELAYS.forEach(function(relayUrl) {
    try {
      var ws = new WebSocket(relayUrl);
      var subId = Math.random().toString(36).slice(2);
      var subPosts = Math.random().toString(36).slice(2);

      ws.onopen = function() {
        ws.send(JSON.stringify(['REQ', subId, { kinds: [0], authors: [PUBKEY], limit: 1 }]));
        ws.send(JSON.stringify(['REQ', subPosts, { kinds: [1], authors: [PUBKEY], limit: 30 }]));
      };

      ws.onmessage = function(ev) {
        try {
          var msg = JSON.parse(ev.data);
          if (msg[0] !== 'EVENT') return;
          var event = msg[2];
          if (event.pubkey !== PUBKEY) return;
          if (event.kind === 0) applyProfile(event.content);
          if (event.kind === 1 && !seenPosts[event.id]) {
            seenPosts[event.id] = true;
            posts.push(event);
            renderPosts();
          }
        } catch {}
      };

      setTimeout(function() { try { ws.close(); } catch {} }, 8000);
    } catch {}
  });

  setTimeout(function() {
    var el = document.getElementById('posts-list');
    if (el.className === 'loading') { el.textContent = 'No posts found.'; }
  }, 9000);
})();
</script>

</body>
</html>`;
}

function notFoundHtml(name: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${name}@nostru.net - not found</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0d0d0f; color: #e4e4e7; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 14px; min-height: 100vh; display: flex; flex-direction: column; }
    header { padding: 1.25rem 2rem; border-bottom: 1px solid #27272a; }
    .logo { font-size: 1.1rem; font-weight: 700; color: #7c3aed; text-decoration: none; }
    main { flex: 1; max-width: 640px; margin: 0 auto; padding: 4rem 1.5rem; text-align: center; }
    h1 { font-size: 1rem; margin-bottom: 1rem; }
    p { color: #71717a; font-size: 0.85rem; margin-bottom: 1.5rem; }
    a { color: #7c3aed; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
<header><a class="logo" href="/">nostru.net</a></header>
<main>
  <h1>${name}@nostru.net is not claimed</h1>
  <p>This name has not been registered yet.</p>
  <a href="/?claim=${encodeURIComponent(name)}">Claim ${name}@nostru.net</a>
</main>
</body>
</html>`;
}

export async function handleProfile(request: Request, env: Env): Promise<Response> {
  const name = new URL(request.url).pathname.slice(1);

  if (!NAME_FORMAT_RE.test(name)) {
    return new Response(notFoundHtml(name), { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  const pubkey = await lookupName(env.NIP05, name);
  if (!pubkey) {
    return new Response(notFoundHtml(name), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  return new Response(profileHtml(name, pubkey), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
