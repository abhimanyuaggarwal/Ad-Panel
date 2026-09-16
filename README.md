# Player Console — the Integrations Panel

A config panel for **how a publisher's video player asks for ads**. Two teams share it:

- **Product** manage *integrations* — one per property × platform. Which ad breaks are switched
  on, how the player starts, and a few per-break quick decisions.
- **Ad ops** manage *ad setups* — the ad units (ladders of ad tags) behind each break, and how
  each break behaves.

Nothing reaches a real player until it is **published**. The player then reads one JSON document
per integration key from `GET /panel/live/:apiKey`. Drafts are invisible to it no matter how many
times they were saved — that separation is the point of the whole thing.

> **Prototype.** Everything is in memory, so a restart is a reset. There is a front door and a
> session (`/login.html`), but **nothing authenticates anybody**: no password, no token, and
> **any address shaped like an address gets in** — the identity provider is mocked exactly as the
> Google Ad Manager directory is. See [ARCHITECTURE.md](ARCHITECTURE.md) §11 for the full list of
> what must close before real traffic.

## Run it

Needs **Node ≥ 20**. No build step, no bundler.

```
npm install
npm start          # http://localhost:4200 — serves the API and the web app together
```

| Command | What it does |
| --- | --- |
| `npm start` | the API and web app on :4200 (`PANEL_PORT` to change it) |
| `npm test` | the rule suite — 183 cases over HTTP, ~1 s |
| `npm run check` | every JS file parses |
| `npm run demo` | rebuild the seeded demo world (same ids every time) |
| `npm run scale` | rebuild it at the `scale` scenario |
| `npm run ui:snapshot <label>` | capture all 85 screens in headless Chrome, then `… diff a b` |

`ui:snapshot` additionally needs a local Chrome and `puppeteer-core`, neither of which this
package declares — point `PUPPETEER` and `CHROME` at your own installs if it cannot find them.

State lives in memory, so a polluted world is a one-line fix rather than a restart:
`POST /panel/mock/reset` reissues the same ids and key strings every time.

## Layout

```
api/     Express, in-memory. server.js assembles; routes/ is one router per subject;
         store/ holds every rule; mock/ holds all invented data
web/     the app — plain <script> tags in dependency order, every function a global;
         index.html is the console, login.html the front door
test/    run.js boots the API on :4299 and walks cases/NN-*.spec.js
docs/    the product overview and its flows, the dated scope documents, the hand-off FAQ
```

## Where to read next

| Document | For |
| --- | --- |
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | **start here to change the code** — the directory map, the model, how a request travels, the two planes, the web conventions, and the known gaps |
| [docs/PRODUCT-SCOPE.md](docs/PRODUCT-SCOPE.md) | what the product does and where its edges are, for any reader |
| [docs/PRODUCT-FLOW.md](docs/PRODUCT-FLOW.md) | the same scope read as journeys — who does what, in what order, and where it refuses |
| [PRODUCT-LOG.md](PRODUCT-LOG.md) | every decision, dated, with the reason — including the reversed ones and why |
| [docs/DECISION-RECORDS.md](docs/DECISION-RECORDS.md) | the original dated scope documents, merged, oldest first |
| [docs/FAQ.md](docs/FAQ.md) | the engineering hand-off FAQ |

The rule suite in `test/cases/` is the executable spec: it talks to the server over the wire
only, so a change that keeps it green kept the rules.
