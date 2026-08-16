# cont vs promise — side-by-side codegen

Needs to be served (same-origin requirement):

```sh
python3 -m http.server 8097
# then http://127.0.0.1:8097/backends.html
```

Every edit compiles the **same source twice** — once with the default cont
(trampoline) backend, once with `stackBackend = promise` — and shows the two
emitted JS programs side by side. Nothing runs.

`?preset=method%20call&flat=0` opens a specific state (also how it's checked from
headless Chrome, which can't click).

## What to look at

- `"theModule": function(` on the left vs `"theModule": async function(` on the
  right. That one keyword is the backend.
- **Emitted JS is ~22% smaller under promise** on these presets — independently
  in the same neighbourhood as the −21% self-host figure in `lang/REPORT.md`
  (33.19 MB → 26.16 MB), reached here by a completely different route.
- **Phase counts: cont 15, promise 22.** The extra seven are the optimization
  campaign built for this backend — Optimized ANF, Operator weakening, Direct
  field tagging, Method receiver info, Type-flow ann elision, Tier analysis,
  Unboxable vars.
- **The method-flatness toggle**, on the *method call* preset: 7 awaits / 2 pause
  checks becomes 8 / 4, and the module grows 10.0 → 10.6 KB. That is the
  flatness optimization stripping async machinery from provably-flat calls,
  visible per-function instead of as a byte count in a table.
- On *mutual recursion* the toggle changes **nothing**, and that is correct: two
  functions in a letrec cycle can never be flat. Worth showing precisely because
  it marks the optimization's boundary.

The checkbox is labelled "method flatness" rather than "flatness" because it sets
`methodFlatness` / `tailFlat` / `importedMethodFlat`, and the method preset is the
only one of the four where the emitted code actually moves.

## How it works

`backends.html` frames `editor.embed.html` and reads `window.PyretTSCompiler`,
`window.THE_RUNTIME`, and the in-jarr `ts-compiler-lib` module out of the frame —
the same borrow-the-editor's-compiler trick as `../bytecode-vm/`. Both compiles go
through `compileWorklistKnownModules` (builtins arrive as already-compiled
Loadables, so only `definitions://` is ever compiled) then `compileProgramWith`
with `collectAll`, and the trace's last phase ("Generated JS") holds a JS AST —
`pyretToJsPretty().pretty(100)` renders it to lines.

## Provenance, and the two things that needed fiddling

Built from `anchor-reborn.exe.xyz:~/pyret` (branch `promise-rederive`,
repo `jpolitz/pyret`), 2026-08-15, which already had a full CPO build including
`cpo-main-ts-promise.jarr`.

**1. The embed env.** `editor.html` picks the compiler flavor *client-side*
(`?compiler=` → `window.CPO_COMPILER`), and `ts-promise` is already a supported
flavor — but stock `.env.embed` doesn't set `PYRET_TS`, `PYRET_TS_PROMISE`, or
`PYRET_TS_COMPILER` (the server supplies those from `process.env`, and a static
embed build has no server). Templated as-is, the flavor switch silently falls back
to the default compiler. `src/.env.embed.promise` adds them and pins
`CPO_COMPILER=ts-promise`; regenerate with:

```sh
node make-template.js src/web/editor.html .env.embed.promise > editor.embed.html
```

**2. The gzipped jarr.** This branch's `beforePyret.js` loads `.gz.js` assets with
a plain `<script src>`, relying on CPO's Express server to send
`Content-Encoding: gzip`. No static host does that, so the browser gets raw gzip
bytes and dies with `Uncaught SyntaxError: Invalid or unexpected token`. (The
newer drydock build handles this in-page via `PYRET_GZIPPED` +
`DecompressionStream` — that machinery does not exist here.) Fix: inflate it
once, ship the plain JS.

```sh
gunzip -c cpo-main-ts-promise.jarr.gz.js > cpo-main-ts-promise.jarr.min.js
```

13 MB uncompressed, but GitHub Pages gzips `.js` on the wire, so the transfer is
roughly what the `.gz.js` would have been.

## Caveat

Inherited from `editor.embed.html`: the page still requests `apis.google.com`,
`gstatic.com/charts`, and cdnjs `vega-tooltip`. It works without them.
