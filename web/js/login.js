// login.js — THE FRONT DOOR (8 Sep, user call). Owns login.html and nothing else.
//
// The panel already had a real Log out (meLogOut, 7 Sep) and no way back in. This is the
// other half: one question — which address are you — answered two ways, by pressing an
// account the console already remembers or by typing one. Both go through the SAME seam
// (API.signIn), so there is one place a refusal comes from and one place it is painted.
//
// WHICH ACT LEADS (8 Sep, user call: "most people will tend to login with google"). The
// remembered account is first and carries the accent; the address is the alternate under the
// divider. Exactly ONE act on the plate is primary, and which one is decided once, at paint,
// from a fact: if the console remembers nobody there is no Google act to offer — no account
// to continue AS, and no chooser behind it — so the address takes the accent back. Nothing
// moves later: the accent never follows the cursor or the caret.
//
// WHAT THE DOOR DOES NOT DO. There is no password field, because there is no password to
// check: the exchange that would prove an address belongs to the person typing it is not
// built (see api/store/session.js, and ARCHITECTURE.md §11). So the door promises nothing
// it cannot do — it never says a link is on its way, and it never shows a spinner over a
// check that is not happening.
//
// House rules this screen keeps, the same as every other:
//   · the plate paints once; the button's state, the error and the account row are toggled
//     imperatively — a repaint while typing loses the caret
//   · a refusal lands WHERE IT HAPPENED (under the field), never in the receipt pill; the
//     pill is for a receipt, and the pill is not where anyone is looking
//   · an act that would be refused greys where it sits with its reason on hover
//   · no identity is invented here: every name and address comes from /panel/session
//   · the only thing the console tells the door out of band is DOOR_UNCONFIRMED (util.js) —
//     a log-out the server never confirmed, read once and cleared

const DOOR = {
  workDomain: '',        // the domain this console signs in, from the server
  remembered: [],        // the accounts it has seen before
  accessOwner: null,     // who Request access goes to
  session: null,         // the account already signed in, if any
  busy: false,
};

// The server's own shape check, restated so a typo is caught before a round trip. The
// server refuses the same thing in the same words if this is ever out of step
// (store/session.js EMAIL_RE) — this copy only decides whether the button is live.
const DOOR_ADDR = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The refusals that belong ON THE FIELD rather than in the receipt pill. Since 8 Sep any
// address SHAPED like one gets in (store/session.js), so this is down to one — and the door
// disables its own act until the shape passes, which makes it the narrow fail-closed case
// where the server refuses what the client already would. Anything else that throws is the
// seam failing and has no field to sit on. A future refusal about the ADDRESS joins this list.
const ADDRESS_REFUSALS = ['bad_address'];

async function doorBoot() {
  // Two things can want the top of the plate, and both can be true at once: a log-out the
  // server never confirmed, and a server that is not answering now. Collect, then paint once.
  const banners = [];
  // Read-and-clear: the note is for the arrival it belongs to, not for every later visit.
  let unconfirmed = false;
  try {
    unconfirmed = sessionStorage.getItem(DOOR_UNCONFIRMED) === '1';
    if (unconfirmed) sessionStorage.removeItem(DOOR_UNCONFIRMED);
  } catch { /* a private window has no store — then there was nothing to read either */ }
  if (unconfirmed) {
    // Amber, not red: leaving worked. What is uncertain is the far end, and that is all it says.
    banners.push('<div class="banner warn">You have left the console, but the server never'
      + ' confirmed it — it may still hold your session.</div>');
  }
  try {
    const s = await API.session();
    DOOR.workDomain = s.workDomain || '';
    DOOR.remembered = s.remembered || [];
    DOOR.accessOwner = s.accessOwner || null;
    DOOR.session = s.signedIn ? s.account : null;
  } catch (e) {
    // The panel server did not answer. Nothing was typed wrong, so this is not a refusal:
    // it is the banner every other view shows for the same failure.
    banners.push(`<div class="banner bad">${esc(e.message)}</div>`);
  }
  document.getElementById('door-down').innerHTML = banners.join('');
  if (DOOR.workDomain) {
    document.getElementById('door-email').placeholder = `name@${DOOR.workDomain}`;
  }
  doorPaintAlt();
  doorPaintNote();
  doorTyped();
  // The caret goes in the box only when the box IS the act. With an account to continue as,
  // opening on a blinking caret in the alternate would argue with the accent above it.
  if (!DOOR.remembered.length) document.getElementById('door-email').focus();
}

// ---------- the remembered accounts: the act that leads ----------
// The row states a fact (this console has seen this person) and offers the shortcut it
// implies. The chevron beside them is a DIFFERENT act — choosing somebody else — so it is
// its own control, and the provider's mark at the far edge is a fact and not pressable.
//
// It also settles where the accent lives, because that is the same question: a remembered
// account means Google leads (`.acct.primary`) and the email button turns ghost; nobody
// remembered means the row is not drawn at all and the email button keeps the accent.
function doorPaintAlt() {
  const wrap = document.getElementById('door-alt');
  const box = document.getElementById('acct-wrap');
  const go = document.getElementById('door-go');
  if (!DOOR.remembered.length) {
    wrap.classList.add('none');
    box.innerHTML = '';
    go.classList.remove('ghost'); // the only act there is, so it is the primary one
    return;
  }
  wrap.classList.remove('none');
  go.classList.add('ghost');
  const first = DOOR.remembered[0];
  // First name only on the row: "Continue as Priya" is what a person calls themselves,
  // and the whole address is on the line under it already.
  const firstName = String(first.name || '').split(/\s+/)[0] || first.email;
  box.innerHTML = `
    <div class="acct primary">
      <button type="button" class="acct-main" onclick="doorAs('${esc(first.email)}')">
        <span class="acct-av">${esc(first.initials || firstName.slice(0, 1).toUpperCase())}</span>
        <span class="acct-who">
          <span class="acct-name">Continue as ${esc(firstName)}</span>
          <span class="acct-mail" title="${esc(first.email)}">${esc(first.email)}</span>
        </span>
      </button>
      <button type="button" class="acct-pick" onclick="acctToggle(event)"
        title="Use a different account">▾</button>
      ${gmarkHtml(first.via)}
    </div>
    <div class="eh-menu acct-menu">
      ${DOOR.remembered.map(a => `
        <div class="eh-item" onclick="doorAs('${esc(a.email)}')">
          <span class="acct-io">
            <span class="acct-av">${esc(a.initials || '\u00b7')}</span>
            <span>${esc(a.name)}</span>
          </span>
          <span class="acct-osub">${esc(a.email)}</span>
        </div>`).join('')}
      <div class="eh-item other" onclick="doorAnother()">Use another address</div>
    </div>`;
}

// The provider's own mark, inline: an artifact of the account, never a boxed image and
// never a name we style ourselves. Only Google is remembered today; anything else states
// the fact in words rather than drawing a mark we do not have.
function gmarkHtml(via) {
  if (via !== 'google') return via ? `<span class="acct-osub">${esc(via)}</span>` : '';
  return `<svg class="gmark" viewBox="0 0 48 48" aria-label="Google" role="img">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>`;
}

function acctToggle(e) {
  if (e) e.stopPropagation();
  document.getElementById('acct-wrap')?.classList.toggle('open');
}
function acctShut() {
  document.getElementById('acct-wrap')?.classList.remove('open');
}
// Click-away, the same arrangement the panel's other menus use: open state is pure DOM,
// and one listener on the document closes it.
document.addEventListener('click', () => acctShut());
document.addEventListener('keydown', e => { if (e.key === 'Escape') acctShut(); });

// "Use another address" is not a third way in — it points at the field that already exists.
function doorAnother() {
  acctShut();
  const el = document.getElementById('door-email');
  el.focus();
  el.select();
}

// ---------- the line under the plate ----------
// One line, and which line depends on a fact: standing here already signed in is a real
// state (someone reached the door from a bookmark), so it says so and offers the way on
// rather than bouncing the browser somewhere it did not ask to go.
function doorPaintNote() {
  const el = document.getElementById('door-note');
  if (DOOR.session) {
    el.innerHTML = `Already signed in as ${esc(DOOR.session.name)} —
      <button type="button" class="door-link" onclick="doorEnter()">open the console</button>`;
    return;
  }
  el.textContent = 'Either way there is no password — your email address is the sign-in.';
}

// ---------- typing ----------
// Never repaints. It writes nothing but the two things that must change: whether the act is
// live, and whether last attempt's refusal is still on screen.
function doorTyped() {
  const typed = document.getElementById('door-email').value.trim();
  const go = document.getElementById('door-go');
  const ok = DOOR_ADDR.test(typed);
  go.disabled = !ok || DOOR.busy;
  // The reason travels with the refused control (tooltip policy: refusals may have a title).
  go.title = ok ? '' : (typed
    ? `${typed} is not an email address yet`
    : 'Enter your work email address first');
  doorClearErr();
}

function doorClearErr() {
  document.getElementById('door-field').classList.remove('err');
  const err = document.getElementById('door-err');
  err.hidden = true;
  err.textContent = '';
}

// The refusal, in the server's own words, under the field that earned it.
function doorRefuse(msg) {
  document.getElementById('door-field').classList.add('err');
  const err = document.getElementById('door-err');
  err.textContent = msg;
  err.hidden = false;
  document.getElementById('door-email').focus();
}

// ---------- the two ways in, one seam ----------
function doorSubmit(e) {
  if (e) e.preventDefault();
  doorSignIn(document.getElementById('door-email').value.trim());
}

// Pressing a remembered account puts its address in the field first: if it is refused, the
// refusal lands under an address that is on screen, not under an empty box.
function doorAs(email) {
  acctShut();
  const el = document.getElementById('door-email');
  el.value = email;
  doorTyped();
  doorSignIn(email);
}

async function doorSignIn(email) {
  if (DOOR.busy) return;
  DOOR.busy = true;
  const go = document.getElementById('door-go');
  go.disabled = true;
  doorClearErr();
  try {
    await API.signIn(email);
    // No receipt pill: the console itself arriving is the receipt.
    doorEnter();
  } catch (err) {
    DOOR.busy = false;
    doorTyped();
    // A refusal names the address it read (bad_address / not_work_address / no_account) and
    // belongs on the field. Anything else is the seam failing, which has no field to sit on.
    if (ADDRESS_REFUSALS.includes(err.code)) doorRefuse(err.message);
    else toast(err.message, 'bad');
  }
}

function doorEnter() {
  // replace, not assign: Back from the console must not land on the door again.
  location.replace('index.html');
}

// ---------- the way in for someone who has no account ----------
// The console cannot create accounts, so this says who can, by name, and hands over their
// address — a door that says "ask someone" without naming them is a dead end.
async function doorRequestAccess() {
  const o = DOOR.accessOwner;
  if (!o) {
    await ask({
      title: 'Request access',
      noCancel: true, okLabel: 'Close',
      body: '<p class="dlg-note">Accounts for this console are created by whoever owns it — ask your ad ops lead.</p>',
    });
    return;
  }
  const copy = await ask({
    title: 'Request access',
    okLabel: 'Copy their address',
    cancelLabel: 'Close',
    body: `
      <div class="me-prof">
        <div class="me-prow"><span class="me-plab">Ask</span><span>${esc(o.name)}${o.role ? ` (${esc(o.role)})` : ''}</span></div>
        <div class="me-prow"><span class="me-plab">Email</span><span>${esc(o.email)}</span></div>
      </div>
      <p class="dlg-note">Send them your work address and say which room you need —
        Integrations, Ad Setups, or both. The console cannot create an account for you.</p>`,
  });
  if (copy) copyText(o.email, 'Address copied');
}

doorBoot();
