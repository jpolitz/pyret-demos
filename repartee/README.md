# Repartee — incremental-rerun notebook

Needs to be served (see below):

```sh
python3 -m http.server 8096
# then http://127.0.0.1:8096/
```

A notebook-style Pyret editor where **editing invalidates**. Definitions and every
past interaction stay editable; touching any of them dashes its own result and
every result below it, and Run re-evaluates from the earliest edited entry rather
than from the top. It is the PLATEAU 2021 model
([paper](https://jpolitz.github.io/docs/plateau-2021-repartee.pdf)) built as a real
driver on CPO's editor, not a mockup.

The page opens on a worked example. `?blank=1` gives the stock empty editor instead.

## What to look at

- **Change `tax-rate` and don't press anything.** Both entries on the right go
  dashed immediately, and the definitions block picks up an "edited" rail. That
  is the whole point: the values on screen no longer correspond to the code that
  produced them, and the UI says so before you re-run.
- **Then press Run.** `with-tax(25)` goes 27 → 31.25 and the list goes
  `[list: 10.8, 21.6, 32.4]` → `[list: 12.5, 25, 37.5]`. The run started at the
  definitions because that is the earliest edited chunk.
- **The `where:` block flips with it** — `with-tax(100) is-roughly 108` passes at
  0.08 and fails at 0.25, rendered by CPO's own `drawCheckResults`. Check results
  are part of what goes stale, not a separate thing.
- **Edit an interaction instead of the definitions.** Entries above it keep their
  results and are not recomputed; only that entry and everything after it re-runs.
- **The `×` on an entry deletes it**, which changes the program for everything
  below and marks those stale.
- **Left status rail** on each entry: green clean, blue running, dotted amber
  edited/stale, dotted red errored. An entry can be both outdated *and*
  invalidated at once — the state the paper argues traditional notebooks hide.

## How it works

Unlike the other demos here, this one does **not** frame `editor.embed.html` and
reach in for the compiler. Repartee's UI mounts *into* CPO's own editor page: the
definitions chunk is `CPO.editor`, each interaction entry is `CPO.makeEditor`, the
resize divider and toolbar are CPO's, and results render through CPO's
`renderPyretValue` / `drawCheckResults` / `error_to_html`. `window.CPO_UI="repartee"`
is what tells the TS jarr to mount the notebook instead of the normal repl.

The engine underneath is `lang/src/ts-compiler/src/repartee.ts`, driven through its
pull/stream API (`rerunStream`) so rendering never races execution.

So the whole CPO page boot is on this demo's critical path, where the other demos
only needed the compiler out of an iframe. That is the one structural difference,
and it is why this took a separate diagnosis.

## Provenance, and the one thing that needed fiddling

Built from `anchor-reborn.exe.xyz:~/rep-build` — a git worktree of
**`jpolitz/pyret`**`@repartee-repl` (commit `180a5808e`) — on 2026-08-16.

**The embed env.** `CPO_UI` is set only by the server's `res.render` for the
`/editor2` route. Unlike `?compiler=`, `editor.html` never re-reads it from the
query string, and it gates the `{{#CPO_UI}}` includes of `repartee.css` and
`repartee-ui.js` — so a static build has to bake it in at template time. That plus
the TS-compiler flavor vars (the server normally supplies those from `process.env`)
is all of `.env.repartee`:

```sh
node make-template.js src/web/editor.html .env.repartee > index.html
```

```
BASE_URL="."
PYRET="./js/cpo-main-ts.jarr.min.js"
PYRET_TS="./js/cpo-main-ts.jarr.min.js"
PYRET_TS_COMPILER="./js/ts-compiler.js"
CPO_COMPILER="ts"
CPO_UI="repartee"
GOOGLE_API_KEY=""    # + the other GOOGLE_* keys empty; URL_FILE_MODE="all-remote"
POSTMESSAGE_ORIGIN="*"
IMAGE_PROXY_BYPASS="true"
```

Note `PYRET` points at `cpo-main-ts.jarr.min.js`, **not** `.gz.js`. This branch's
`beforePyret.js` loads gzipped jarrs with a plain `<script src>` and relies on CPO's
Express server to send `Content-Encoding: gzip`; no static host does that. Shipping
the inflated 17 MB file sidesteps it, and GitHub Pages gzips `.js` on the wire
anyway. (Same trap as `../promise-vs-cont/`.)

`js/demo-seed.js` and its `<script>` tag are the only additions to the generated
page — snapshot-only, not on the branch. It calls the UI's public API
(`setDefinitions` / `addInteraction` / `run`) and nothing else.

## Verified

Rendered in headless Chrome from this exact directory, 2026-08-16:

- Boots, mounts, `#loader` clears; seeded example runs to
  `with-tax(25)` → 27 and `map(with-tax, [list: 10, 20, 30])` →
  `[list: 10.8, 21.6, 32.4]`, check block passing.
- Editing `tax-rate` marks 3 results stale with rails `edited / stale / stale`,
  no re-run triggered.
- Run then gives 31.25, `[list: 12.5, 25, 37.5]`, all rails clean, check block
  now failing.
- `?blank=1` gives the empty editor.
- Controls run at the same time: stock `editor.embed.html` and a `CPO_UI=""`
  build of the same TS jarr both boot clean, which is what pins the console error
  below to the `CPO_UI` path rather than to anything about static hosting.

## Caveats

- **Must be served; `file://` does not work.** Not for the same-origin reason the
  other two demos have — this page frames nothing. `editor.html` marks the jarr
  `<link rel="preload" crossorigin="anonymous">`, and under `file://` Chrome
  blocks it: *"Access to script … from origin 'null' has been blocked by CORS
  policy."* Pyret never loads.
- **One red console error on every load**, harmless:

  ```
  The run ended in error: FailureResult
  Abstraction breaking: Uncaught JavaScript error:
  Error: Module not loaded yet: js-file(../js/cpo-main-ts)
  ```

  `cpo-main-ts.js:290` does a bare `return` on the repartee path instead of
  returning `runtime.makeModuleReturn({repl: …}, {})`, so the four-line
  `cpo-main-ts.arr` that does `repl = T.repl` finds nothing. It is entirely inside
  the jarr, so `/editor2` on a real server produces it too — nothing about it is
  caused by static hosting, and everything on the page works regardless. Fixing it
  is a one-liner on the branch plus a jarr rebuild; not done here, so this snapshot
  matches `180a5808e` exactly.
- **Guest chrome is present but inert**: "Connect to Google Drive", File, Save,
  Insert. The branch left the Drive/image picker for a follow-up because guest
  `/editor2` sessions have no Google auth.
- Inherited from `editor.html`: the page still requests `apis.google.com` and
  `gstatic.com/charts`. It works without them. (`vega-tooltip` is local here, so
  one fewer external than `../bytecode-vm/`.)
- This is a **snapshot, not a build**. Regenerate with the recipe above against a
  full CPO build of the branch.
