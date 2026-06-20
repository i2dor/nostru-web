const HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>nostru.net - Nostr identity, yours</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: #0d0d0f;
      --surface: #18181b;
      --border: #27272a;
      --text: #e4e4e7;
      --muted: #71717a;
      --purple: #7c3aed;
      --purple-dim: #4c1d95;
      --green: #22c55e;
      --red: #ef4444;
      --mono: 'JetBrains Mono', 'Fira Mono', 'Cascadia Code', ui-monospace, monospace;
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--mono);
      font-size: 14px;
      line-height: 1.6;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    header {
      padding: 2rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: baseline;
      gap: 1rem;
    }

    .logo {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--purple);
      letter-spacing: -0.02em;
    }

    .tagline { color: var(--muted); font-size: 0.8rem; }

    main {
      flex: 1;
      max-width: 640px;
      width: 100%;
      margin: 0 auto;
      padding: 3rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 3rem;
    }

    section { display: flex; flex-direction: column; gap: 1rem; }

    h2 {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--muted);
    }

    p { color: var(--text); max-width: 52ch; }

    .highlight { color: var(--purple); }

    label { display: block; color: var(--muted); font-size: 0.75rem; margin-bottom: 0.35rem; }

    input[type="text"] {
      width: 100%;
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      font-family: var(--mono);
      font-size: 0.875rem;
      padding: 0.6rem 0.75rem;
      border-radius: 4px;
      outline: none;
      transition: border-color 0.15s;
    }
    input[type="text"]:focus { border-color: var(--purple); }

    .row { display: flex; gap: 0.5rem; align-items: flex-end; }
    .row input { flex: 1; }

    button {
      background: var(--purple);
      color: #fff;
      border: none;
      font-family: var(--mono);
      font-size: 0.875rem;
      padding: 0.6rem 1.25rem;
      border-radius: 4px;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s;
    }
    button:hover { background: var(--purple-dim); }
    button:disabled { opacity: 0.4; cursor: default; }

    .status {
      font-size: 0.75rem;
      padding: 0.5rem 0.75rem;
      border-radius: 4px;
      border: 1px solid var(--border);
      display: none;
    }
    .status.ok  { border-color: var(--green); color: var(--green); display: block; }
    .status.err { border-color: var(--red);   color: var(--red);   display: block; }
    .status.info { border-color: var(--border); color: var(--muted); display: block; }

    .avail-ok  { color: var(--green); }
    .avail-no  { color: var(--red); }
    .avail-hint { font-size: 0.75rem; min-height: 1.1rem; }

    .divider { border: none; border-top: 1px solid var(--border); }

    footer {
      padding: 1.5rem 2rem;
      border-top: 1px solid var(--border);
      color: var(--muted);
      font-size: 0.75rem;
      display: flex;
      gap: 1.5rem;
      flex-wrap: wrap;
    }
    footer a { color: var(--muted); text-decoration: none; }
    footer a:hover { color: var(--text); }
  </style>
</head>
<body>

<header>
  <span class="logo">nostru.net</span>
  <span class="tagline">Nostr identity, yours</span>
</header>

<main>
  <section>
    <h2>What is this</h2>
    <p>
      Claim a free <span class="highlight">name@nostru.net</span> Nostr identity (NIP-05).
      Enter your chosen name and your Nostr public key (hex). No email, no account.
    </p>
    <p>
      Works with any Nostr client. Open source.
      Built for <a href="https://github.com/i2dor/nostru" style="color:var(--purple);text-decoration:none">Nostru</a>, the Nostr browser extension.
    </p>
  </section>

  <hr class="divider">

  <section>
    <h2>Claim your identity</h2>

    <div>
      <label for="inp-name">name (a-z, 0-9, hyphens, underscores)</label>
      <input id="inp-name" type="text" placeholder="satoshi" maxlength="30" autocomplete="off" spellcheck="false">
      <div class="avail-hint" id="avail-hint"></div>
    </div>

    <div>
      <label for="inp-pubkey">public key (64-char hex)</label>
      <input id="inp-pubkey" type="text" placeholder="a3d9..." maxlength="64" autocomplete="off" spellcheck="false">
    </div>

    <div class="row">
      <button id="btn-claim" disabled>Claim</button>
    </div>

    <div class="status" id="claim-status"></div>
  </section>

  <hr class="divider">

  <section>
    <h2>Look up an identity</h2>
    <div class="row">
      <input id="inp-lookup" type="text" placeholder="satoshi" maxlength="30" autocomplete="off" spellcheck="false">
      <button id="btn-lookup">Look up</button>
    </div>
    <div class="status" id="lookup-status"></div>
  </section>
</main>

<footer>
  <a href="https://github.com/nostr-protocol/nostr/blob/master/nips/05.md">NIP-05 spec</a>
  <a href="https://github.com/i2dor/nostru">Nostru extension</a>
  <span>no ads, no tracking, no accounts</span>
</footer>

<script>
(function () {
  const $ = id => document.getElementById(id);
  const inpName   = $('inp-name');
  const inpPubkey = $('inp-pubkey');
  const btnClaim  = $('btn-claim');
  const claimSt   = $('claim-status');
  const availHint = $('avail-hint');
  const inpLookup = $('inp-lookup');
  const btnLookup = $('btn-lookup');
  const lookupSt  = $('lookup-status');

  const NAME_RE   = /^[a-z0-9][a-z0-9_-]{0,28}[a-z0-9]$|^[a-z0-9]$/;
  const PUBKEY_RE = /^[0-9a-f]{64}$/;

  let checkTimer = null;

  function setStatus(el, type, text) {
    el.className = 'status ' + type;
    el.textContent = text;
  }

  function updateClaimBtn() {
    const nameOk   = NAME_RE.test(inpName.value);
    const pubkeyOk = PUBKEY_RE.test(inpPubkey.value) && inpPubkey.value !== '0'.repeat(64);
    btnClaim.disabled = !(nameOk && pubkeyOk);
  }

  inpName.addEventListener('input', () => {
    updateClaimBtn();
    availHint.className = 'avail-hint';
    availHint.textContent = '';
    clearTimeout(checkTimer);
    const name = inpName.value;
    if (!NAME_RE.test(name)) return;
    checkTimer = setTimeout(async () => {
      try {
        const r = await fetch('/check?name=' + encodeURIComponent(name));
        const d = await r.json();
        if (d.available) {
          availHint.className = 'avail-hint avail-ok';
          availHint.textContent = name + '@nostru.net is available';
        } else {
          availHint.className = 'avail-hint avail-no';
          availHint.textContent = name + '@nostru.net is taken or reserved';
        }
      } catch { availHint.textContent = ''; }
    }, 400);
  });

  inpPubkey.addEventListener('input', updateClaimBtn);

  btnClaim.addEventListener('click', async () => {
    btnClaim.disabled = true;
    claimSt.className = 'status info';
    claimSt.textContent = 'Claiming...';
    try {
      const r = await fetch('/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inpName.value, pubkey: inpPubkey.value }),
      });
      const d = await r.json();
      if (r.ok) {
        setStatus(claimSt, 'ok', 'Claimed! Your identity: ' + d.name + '@nostru.net');
      } else {
        setStatus(claimSt, 'err', d.error || 'Something went wrong');
        btnClaim.disabled = false;
      }
    } catch {
      setStatus(claimSt, 'err', 'Network error');
      btnClaim.disabled = false;
    }
  });

  btnLookup.addEventListener('click', async () => {
    const name = inpLookup.value.trim();
    if (!name) return;
    setStatus(lookupSt, 'info', 'Looking up...');
    try {
      const r = await fetch('/.well-known/nostr.json?name=' + encodeURIComponent(name));
      const d = await r.json();
      if (r.ok && d.names && d.names[name]) {
        setStatus(lookupSt, 'ok', name + '@nostru.net -> ' + d.names[name]);
      } else {
        setStatus(lookupSt, 'err', name + '@nostru.net is not claimed');
      }
    } catch {
      setStatus(lookupSt, 'err', 'Network error');
    }
  });
})();
</script>

</body>
</html>`;

export async function handleLanding(): Promise<Response> {
  return new Response(HTML, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
