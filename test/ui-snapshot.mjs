// test/ui-snapshot.mjs — the UI safety net. `npm test` pins the RULES over HTTP; this
// pins the SCREENS, which is what you need when a change is meant to be invisible
// (a refactor, a file split, a rename).
//
//   node test/ui-snapshot.mjs before      capture the screens as they are now
//   …make your change…
//   node test/ui-snapshot.mjs after       capture them again
//   node test/ui-snapshot.mjs diff before after
//
// It boots its own API on port 4300 (never your :4200), resets the mock world, then
// walks every screen and the stateful interactions on them, writing for each step the
// innerHTML of #main / #dialog-root / #nav plus a PNG, and a set of normalized API
// answers. `diff` compares two runs and exits non-zero if anything moved. Timestamps,
// the toast area and whitespace inside class attributes are normalized away — a toast
// is a 2-second race and a collapsed double space is not a UI change.
//
// Requires puppeteer-core and a local Chrome. Both paths are overridable:
//   PUPPETEER=/path/to/puppeteer-core/…/puppeteer-core.js  CHROME=/path/to/Chrome
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PANEL = join(HERE, '..');
const OUT_ROOT = join(HERE, 'snapshots');
const PORT = 4300;
const BASE = `http://localhost:${PORT}`;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PUPPETEER = process.env.PUPPETEER
  || join(PANEL, '..', 'node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js');

// ---------- normalization + diff ----------

const norm = t => String(t)
  .replace(/<!-- toasts -->[\s\S]*/, '')                                  // a toast is a race
  .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, '<ts>')        // stamps move
  .replace(/class="([^"]*)"/g, (_, c) => `class="${c.split(/\s+/).filter(Boolean).join(' ')}"`);

function diff(a, b) {
  const dirA = join(OUT_ROOT, a), dirB = join(OUT_ROOT, b);
  for (const d of [dirA, dirB]) {
    if (!existsSync(d)) throw new Error(`no such run: ${d} — capture it first`);
  }
  const files = readdirSync(dirA).filter(f => !f.endsWith('.png') && f !== 'errors.txt');
  const bad = [];
  for (const f of files) {
    const other = join(dirB, f);
    if (!existsSync(other)) { bad.push(`${f} (missing in ${b})`); continue; }
    if (norm(readFileSync(join(dirA, f), 'utf8')) !== norm(readFileSync(other, 'utf8'))) bad.push(f);
  }
  console.log(bad.length ? `${bad.length} differ:\n  ${bad.join('\n  ')}` : `identical (${files.length} snapshots)`);
  process.exit(bad.length ? 1 : 0);
}

// ---------- the walk ----------

async function capture(label) {
  const out = join(OUT_ROOT, label) + '/';
  mkdirSync(out, { recursive: true });
  const server = spawn('node', ['api/server.js'], {
    cwd: PANEL, env: { ...process.env, PANEL_PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  await sleep(700);

  // The API's own answers, so a store change shows up even where no screen reads it.
  const reset = () => fetch(`${BASE}/panel/mock/reset`, { method: 'POST' });
  await reset();
  for (const p of ['/panel/meta', '/panel/keys', '/panel/setups', '/panel/tags', '/panel/templates',
    '/panel/keys/key_1', '/panel/setups/as_7', '/panel/keys/key_1/versions',
    '/panel/setups/as_1/versions', '/panel/setups/as_1/versions/1/preview', '/panel/gam/units?q=toi']) {
    const r = await fetch(BASE + p);
    writeFileSync(out + 'api' + p.replace(/[/?=]/g, '_') + '.json', norm(JSON.stringify(await r.json(), null, 1)));
  }
  const { keys } = await (await fetch(`${BASE}/panel/keys`)).json();
  writeFileSync(out + 'api_live.json', norm(JSON.stringify(await (await fetch(`${BASE}/panel/live/${keys[0].key}`)).json(), null, 1)));
  const refusal = await fetch(`${BASE}/panel/keys/key_3`, {
    method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ adSetupId: 'as_1' }),
  });
  writeFileSync(out + 'api_refusal.json', norm(JSON.stringify(await refusal.json(), null, 1)));
  await reset();

  const { default: puppeteer } = await import(PUPPETEER);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  // A REFUSAL IS NOT AN ERROR. The walk deliberately earns one — the door's refused sign-in —
  // and Chrome logs every 4xx as a console error, which would fail the run for capturing
  // exactly the screen it was asked to capture. In this panel a refusal is a normal answer
  // with a machine-readable body, so the two statuses refusals come back with are allowed;
  // a 5xx, a script error or a failed request still fails the run. (Chrome's line carries no
  // URL, so the allowance cannot be narrowed to the route.)
  const EXPECTED_CONSOLE = [/Failed to load resource.*\b(400|403)\b/];
  page.on('console', m => {
    if (m.type() !== 'error') return;
    if (EXPECTED_CONSOLE.some(re => re.test(m.text()))) return;
    errors.push('CONSOLE: ' + m.text());
  });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('requestfailed', r => errors.push('REQFAIL: ' + r.url()));

  let n = 0;
  const snap = async name => {
    await sleep(250);
    const html = await page.evaluate(() => {
      const part = id => document.getElementById(id)?.innerHTML || '';
      return `<!-- nav -->\n${part('nav')}\n<!-- main -->\n${part('main')}`
        + `\n<!-- dialog -->\n${part('dialog-root')}\n<!-- toasts -->\n${part('toasts')}`;
    });
    const stem = out + String(++n).padStart(2, '0') + '-' + name;
    writeFileSync(stem + '.html', norm(html));
    await page.screenshot({ path: stem + '.png' });
  };
  // The door has no #main and no #nav — its whole screen is the plate.
  const snapDoor = async name => {
    await sleep(250);
    const html = await page.evaluate(() =>
      `<!-- door -->\n${document.querySelector('.door')?.innerHTML || ''}`
      + `\n<!-- dialog -->\n${document.getElementById('dialog-root')?.innerHTML || ''}`);
    const stem = out + String(++n).padStart(2, '0') + '-' + name;
    writeFileSync(stem + '.html', norm(html));
    await page.screenshot({ path: stem + '.png' });
  };
  const go = async hash => { await page.goto(`${BASE}/#${hash}`, { waitUntil: 'networkidle0' }); await sleep(400); };
  const click = async (sel, i = 0) => {
    const ok = await page.evaluate((s, k) => { const el = document.querySelectorAll(s)[k]; if (!el) return false; el.click(); return true; }, sel, i);
    if (!ok) errors.push(`MISSING: ${sel}[${i}]`);
    await sleep(250);
  };

  // Integrations: list, filters, the three bulk sheets, the chooser
  await go('keys'); await snap('keys-list');
  await page.focus('.search'); await page.keyboard.type('toi', { delay: 5 }); await snap('keys-list-search');
  await page.evaluate(() => { const s = document.querySelector('.search'); s.value = ''; s.dispatchEvent(new Event('input')); });
  await click('#fp-brk .fpill-btn'); await click('.fp-grow[data-t="midroll"] button[data-v="on"]'); await snap('keys-list-break-filter');
  await click('.fp-gfoot .zlink');
  await click('#key-rows .chk input', 0); await click('#key-rows .chk input', 1); await snap('keys-list-selected');
  await click('#bulk-bar .btn.small', 0); await snap('bulk-ads');
  await click('.bqf-r.closed', 2); await snap('bulk-ads-lever-open');
  await click('.bqf-r.open .seg button', 0); await snap('bulk-ads-queued');
  await click('.btabs .btab', 1); await snap('bulk-ads-midroll');
  await click('#bulk-next'); await snap('bulk-ads-review'); await click('.dlg [data-act=no]');
  await click('#bulk-bar .btn.small', 1); await snap('bulk-default-player');
  await click('.bqf-r.closed', 0); await click('.bqf-r.open .seg button', 1); await snap('bulk-default-player-set');
  await click('.dlg-foot .btn.ghost');
  await click('#bulk-bar .btn.small', 2); await snap('bulk-custom-player');
  await click('.pbr-row', 1); await snap('bulk-custom-player-second');
  await click('.pbd-r .seg button', 1); await snap('bulk-custom-player-moved');
  await click('.dlg-foot .btn.ghost'); await click('#bulk-bar .btn.ghost.small');
  await click('.page-head .btn'); await snap('keys-chooser');
  await click('.dlg-card', 1); await snap('keys-new-from-copy');

  // One integration, every break tab and every door on the page
  await go('keys/key_1'); await snap('key-preroll');
  await click('.brk-tabs .stab', 1); await snap('key-midroll');
  await click('.brk-tabs .stab', 3); await snap('key-outstream');
  await click('.brk-tabs .stab', 0);
  await click('.pchip.on', 1); await snap('key-ask-toggled');
  await click('.drive-reset'); await snap('key-drive-reset');
  // The player grid (13 Sep): a fold open, then a config cell's menu — led by the default's answer
  await click('.pg-srow', 0); await snap('key-player-playback');
  await click('.pg-c[data-r="autoplay"][data-col="0"]'); await snap('key-player-cell-menu');
  await page.keyboard.press('Escape'); await sleep(250); await click('.pg-srow', 0);
  // One config beside the default (14 Sep): the count is the door, the header holds the way back
  await click('.pg-sdiff .pg-diff', 0); await snap('key-player-one-config');
  await click('.pg-back'); await click('.pg-srow', 0);
  await click('.pcc-add'); await snap('key-config-added');
  await click('.eh-more-btn'); await snap('key-more-menu'); await click('.eh-more-btn');
  // The chip IS the change door (8 Sep), and the journey is two steps in one frame.
  await click('.ads-fills .fs-setup'); await snap('key-change-setup');
  await click('.dlg-cards .sc-card:not(.current)', 0); await snap('key-change-setup-picked');
  await click('#chg-foot .btn:not(.ghost)'); await snap('key-change-setup-use');
  await click('#chg-foot .btn.ghost');                 // Back — the cards, selection intact
  await click('#chg-foot .btn.ghost', 1); await snap('key-change-setup-copy');
  await click('#chg-foot .btn.ghost');                 // Back again
  await click('#chg-foot .btn.ghost');                 // Cancel
  await click('.v-item:not(.pending) .v-head', 0); await snap('key-version-sheet'); await click('.dlg [data-act=no]');
  await click('.ehead .btn.ghost', 0); await snap('key-save-nothing');
  await go('keys/key_5'); await snap('key-unpublished');
  await go('keys/key_3'); await snap('key-with-pods');

  // Ad setups: list, chooser, the editor's every zone
  await go('setups'); await snap('setups-list');
  await click('.page-head .btn'); await snap('setups-chooser');
  await click('.dlg-card', 0); await snap('setups-new-blank');
  await go('setups'); await click('.page-head .btn'); await click('.dlg-card', 1); await snap('setups-new-copy');
  await go('setups/as_1'); await snap('setup-editor');
  await click('.shead', 0); await snap('setup-templates');
  await click('.shead', 1); await snap('setup-waterfall');
  // APPLY ON AD SLOTS (7 Sep): the grid, its two bulk axes, and the counted foot.
  await click('.wf-foot .slot-add', 1); await snap('setup-waterfall-apply');
  await click('.wfa-grid th.wfa-col .wfa-h', 0); await snap('setup-waterfall-apply-column');
  await click('.wfa-grid th.wfa-row .wfa-h', 0); await snap('setup-waterfall-apply-row');
  await click('.dlg [data-act=no]');
  await click('.slot-line', 0); await snap('setup-preroll');
  // The unit block: its fact line opens the settings, focus in its field opens them too.
  await click('.ad-unit-facts', 0); await snap('setup-unit-panel');
  await click('.ad-unit-facts', 0); await snap('setup-unit-facts');
  await page.focus('.ad-unit.filled .lookup input'); await snap('setup-unit-focus-opens');
  // The unit's switch rides the block's rail since 8 Sep, not its head row.
  await click('.unit-rail .toggle', 1); await snap('setup-unit-off');
  await click('.slot-line', 1); await snap('setup-midroll');
  await click('.pl-tabs .stab', 1); await snap('setup-second-placement');
  await click('.slot-line', 2); await snap('setup-linked-break');
  // THE SOURCE, IN TWO CONTROLS (8 Sep, third round): a switch, then — only while it is
  // on — Custom│Global. The round trip is Custom → Global → Custom, then the switch off
  // and on again (which restores the answer that was serving). `No ads` on a break a live
  // integration plays is refused ON the switch, so the off leg is walked on as_4 below.
  await snap('setup-source-custom');
  await click('.wf-src-seg button', 1); await snap('setup-source-global');
  await click('.wf-src-seg button', 0); await snap('setup-source-custom-again');
  await click('.pl-tabs .stab.add'); await snap('setup-placement-added');
  await click('.slot-line', 0); await snap('setup-empty-break-source');
  await click('.eh-more-btn'); await snap('setup-more-menu');
  await go('setups/as_7'); await click('.slot-line', 1); await snap('setup-pods');
  await click('.pod-tabs .stab', 1); await snap('setup-pod-2');
  await click('.pod-tabs .stab.add'); await snap('setup-pod-added');
  // Clear lives on a setup that has NEVER gone on air (as_4), which is also where the
  // break's ⋯ still exists at all: a published setup's one door is the source switch.
  await go('setups/as_4'); await click('.slot-line', 0);
  await click('.slot-menu-ph .row-kebab', 0); await snap('setup-slot-menu');
  // THE SWITCH OFF, AND THE WAY BACK (8 Sep) — on a setup that has never gone on air,
  // because a break a live integration plays refuses the OFF direction where it sits
  // (suSrcDarkWhy). Off parks every unit; Custom hands them all back. The three answers are
  // one seg on the WATERFALL section's own control row since 11 Sep, and every change asks a
  // small confirm first (user call, same day) — so the walk presses the answer, then Yes.
  await click('.wf-src-seg button', 0); await snap('setup-source-off-confirm');
  await click('[data-act=yes]'); await snap('setup-source-off');
  await click('.wf-src-seg button', 1); await click('[data-act=yes]'); await snap('setup-source-back-on');
  await go('setups/as_3'); await snap('setup-single-placement');
  await click('.slot-line', 3); await snap('setup-outstream');

  // The band's right seat: the profile menu (7 Sep — it took the property switcher's seat,
  // and this block still clicked `.ps-btn` until 8 Sep, so every run reported two MISSING
  // selectors and exited 1). Log out is the one act here the walk does NOT press: it ends
  // the session and lands on the door, which would strand every screen after it.
  await go('keys');
  await click('.me-btn'); await snap('profile-menu');
  await click('.me-menu .eh-item', 0); await snap('profile-view'); await click('.dlg [data-act=yes]');

  // THE FRONT DOOR (8 Sep) — its own page, so it has its own capture: the plate instead of
  // #main, and the session is emptied first because that is the state it is on screen in.
  await fetch(`${BASE}/panel/session`, { method: 'DELETE' });
  await page.goto(`${BASE}/login.html`, { waitUntil: 'networkidle0' }); await sleep(300);
  await snapDoor('door');
  await click('.acct-pick'); await snapDoor('door-accounts'); await click('.acct-pick');
  // The refused field. Since 8 Sep any address SHAPED like one gets in, so the one refusal left
  // (`bad_address`) is not reachable by clicking: the door disables its own act until the shape
  // passes, and a disabled default button also blocks Enter. So the submit is driven directly —
  // the painted refusal is worth pinning even though the path to it is now this narrow.
  await page.focus('#door-email'); await page.keyboard.type('not-an-address', { delay: 5 });
  await page.evaluate(() => doorSubmit()); await snapDoor('door-refused');
  await page.evaluate(() => { document.getElementById('door-email').value = ''; doorTyped(); });
  await click('.door-foot .door-link'); await snapDoor('door-request-access');

  writeFileSync(out + 'errors.txt', errors.join('\n'));
  await browser.close();
  server.kill();
  console.log(`${label}: ${n} screens captured in test/snapshots/${label}/`
    + (errors.length ? `\n${errors.length} problem(s):\n  ${errors.join('\n  ')}` : ', no console errors'));
  process.exit(errors.length ? 1 : 0);
}

const [mode, a, b] = process.argv.slice(2);
if (mode === 'diff') diff(a || 'before', b || 'after');
else if (mode) await capture(mode);
else {
  console.log('usage: node test/ui-snapshot.mjs <label> | diff <labelA> <labelB>');
  process.exit(2);
}
