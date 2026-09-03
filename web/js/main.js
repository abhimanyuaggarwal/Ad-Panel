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
    const gp = window.GLOBAL_PROP;
    document.getElementById('count-keys').textContent = keys.filter(k => gp === 'All' || k.property === gp).length;
    document.getElementById('count-setups').textContent = setups.filter(o => inScope(o.property)).length;
  } catch { /* API down — the view already shows the banner */ }
}

getMeta().then(m => renderPropSwitcher(m.propertyScopes)).catch(() => renderPropSwitcher(['All']));
window.addEventListener('hashchange', route);
route();
