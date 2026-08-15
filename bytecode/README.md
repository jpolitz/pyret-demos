# Bytecode VM visualizer

Needs to be served (same-origin requirement, see below):

```sh
python3 -m http.server 8098
# then http://127.0.0.1:8098/bytecode.html
```

Every edit in the definitions pane is compiled with `backend: 'interp'` and the
resulting bytecode is disassembled beside it. Nothing is run to produce the
listing — it is the same compile the editor does on Run, stopped one step
earlier, at the program the machine would execute.

## Why it needs a server

`bytecode.html` frames `editor.embed.html?compiler=interp` and then reads
`window.PyretTSCompiler` and `window.THE_RUNTIME` **out of that frame** rather
than shipping a second compiler. That cross-frame read only works same-origin,
so `file://` will not do. It also means the bytecode shown is necessarily the
bytecode that editor would run — the two cannot drift.

Listing text comes from `disasm.disassemble`, so it cannot drift from the
disassembler either; the structure around it (pc, opcode, source loc, jump
targets) is decoded separately with `disasm.instructions` and cross-checked
against that text by pc.

## Provenance

Snapshot of `code.pyret.org/build/web/` from `tight-ship.exe.xyz`
(`~/work/drydock`, branch `interp-backend`), 2026-08-15.

The full `build/web` is 223 MB; this is the demo's actual dependency closure,
34 files. The bulk is `js/cpo-main-ts.jarr.gz.js` (2.8 MB) and `js/require.js`
(1.2 MB). Excluded: Snap (41 MB), the non-TS `cpo-main.jarr*` (37 MB × 3), and
everything else the interp demo never loads.

Two files are **not** discoverable by scanning `src=`/`href=` attributes and
were missed on the first pass — `js/ts-compiler.gz.js` and `js/ts-compiler-lib.js`
are referenced through a runtime-constructed path
(`window.PYRET_TS_COMPILER = dir + "ts-compiler.gz.js"`). Without them the page
renders but hangs at "Waiting for the editor to load…". Worth knowing if this
closure is ever recomputed.

## Caveat

Inherited from `editor.embed.html`: the page still requests `apis.google.com`
(Drive), `gstatic.com/charts`, and cdnjs `vega-tooltip`. It works without them,
but this snapshot is not strictly offline.

## Rebuilding

On a checkout of `jpolitz/pyret-lang@interp-backend`, in `code.pyret.org/`:
`make web-local` (the Makefile there has a `build/web/bytecode.html` rule, added
alongside the demo), then copy the closure out.
