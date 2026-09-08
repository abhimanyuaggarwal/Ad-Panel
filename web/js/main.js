// main.js — hash router + nav counts. Two rooms: #keys (product), #setups (ops).

let META_CACHE = null;
async function getMeta() {
  if (!META_CACHE) {
    META_CACHE = await API.meta();
    if (META_CACHE.tagProviders) window.KL_PROVIDERS = META_CACHE.tagProviders;
    if (META_CACHE.urlProviders) window.KL_URL_PROVIDERS = META_CACHE.urlProviders;
    window.KL_PROVIDER_TYPES = META_CACHE.providerTypes || {};
    window.KL_DIR_PROVIDERS = Object.entries(window.KL_PROVIDER_TYPES).length
      ? Object.keys(window.KL_PROVIDER_TYPES).filter(p => !META_CACHE.urlProviders.includes(p))
      : ['ima', 'gpt'];
    // The shape a hand-typed ad unit takes, spoken by the server so the example in the
    // UI and the one in a refusal are never two different strings.
    if (META_CACHE.adUnitExample) window.KL_AD_UNIT_EXAMPLE = META_CACHE.adUnitExample;
  }
  return META_CACHE;
}

let ROUTE_SEQ = 0;

async function route() {
  const seq = ++ROUTE_SEQ;
  startProgress();
  const hash = location.hash || '#keys';
  const [root, arg, sub, subArg] = hash.slice(1).split('/');

  document.querySelectorAll('#nav a').forEach(a =>
    a.classList.toggle('on', a.dataset.nav === root));

  try {
    if (root === 'keys') {
      if (!arg) await viewKeysList();
      // New integration starts at the CHOOSER (3 Sep) — blank, or a photocopy of one
      // that exists — and the edit page itself is where it takes shape. No wizard.
      else if (arg === 'new') { await viewKeysList(); newIntegrationChooser(); }
      // Player and ad behaviour are collapsed sections ON the integration page now
      // (24 Aug night) — the old drill-in routes land on the page itself.
      else await viewKeyForm(arg);
    } else if (root === 'setups') {
      if (!arg) await viewSetupsList();
      // New ad setup starts at the CHOOSER (3 Sep) — blank, or a photocopy of one that
      // exists — and the editor itself is where it takes shape. No wizard.
      else if (arg === 'new') { await viewSetupsList(); newSetupChooser(); }
      else await viewSetupForm(arg);
    } else {
      location.hash = '#keys';
      return;
    }
  } catch (e) {
    if (seq !== ROUTE_SEQ) return; // a newer navigation won
    document.getElementById('main').innerHTML =
      `<div class="banner bad">Couldn’t load this view — is the panel API running? (${esc(e.message)})</div>`;
  }
  if (seq !== ROUTE_SEQ) return;
  finishProgress();
  fadeInView();
  refreshCounts();
}

async function refreshCounts() {
  try {
    const [{ keys }, { setups }] = await Promise.all([API.listKeys(), API.listSetups()]);
    document.getElementById('count-keys').textContent = keys.filter(k => inScope(k.property)).length;
    document.getElementById('count-setups').textContent = setups.filter(o => inScope(o.property)).length;
  } catch { /* API down — the view already shows the banner */ }
}

// THE GATE (8 Sep, the front door). The console is a room you have to be in the session to
// stand in, so the session is read ONCE, before anything paints: no session and the browser
// goes to login.html instead of the rooms. Nothing else in the app asks — every view assumes
// it is past this point, exactly as it did when there was no door at all.
//
// A server that does not answer is NOT a missing session: it leaves `session` null, the
// rooms paint, and route() shows the banner that names the failure. Bouncing someone to a
// door that also cannot reach the server would strand them.
async function boot() {
  let session = null;
  try {
    session = await API.session();
  } catch { /* the panel server is down — route() paints the banner that says so */ }
  if (session && !session.signedIn) { location.replace('login.html'); return; }
  // Who is signed in comes from the SESSION now, not from meta's fixture: one seam, and the
  // band names the very account the door signed in. `meta.me` stays as it was for anything
  // that wants the world's own person without a session.
  renderMe(session ? session.account : null);
  getMeta().catch(() => { /* every view awaits it too; this only warms the cache */ });
  window.addEventListener('hashchange', route);
  route();
}

boot();
