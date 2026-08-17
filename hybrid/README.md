# Hybrid VM — one function, two forms

Opens straight from disk: double-click `hybrid.html`. No server, no build step,
no network. 200 KB.

The idea it shows: the promise backend's tier analysis gives every function a
suspension verdict (`flat | tail-flat | few-suspend | gen`), and **only Gen
functions become bytecode** — everything else stays compiled JS at the leaves.
Each Gen function is compiled *twice from the same ANF*: to bytecode, and to a
**fast form**, ordinary sync JS whose suspend sites hand the machine their live
values only when a thenable actually arrives.

## What to look at

- **The left pane is the whole point.** Four functions in `01-tiers` differ only
  in how they recur, and land in four different tiers. Only the purple one is on
  the right-hand side at all. In `03-methods`, both `area` methods stay compiled
  JS and only the list walk over them is Gen.
- **The two panes are the same function.** Left is what a JS caller runs; right
  is what the machine runs after a real suspension.
- **Hover a highlighted `bail` call, a marked instruction, or a row of the site
  table** — all three light up together. That pairing *is* the mechanism:
  `sites[i] = [funcIdx, pc, dest, [slots]]` names the bytecode instruction to
  resume at and the slots live there, and the fast form's
  `R.$vm.bail($BC, i, t, [vals])` passes the JS variables holding exactly those
  slots. On `02-list-ops`/`my-filter`, site 4 reads: suspends on `$app66`, live
  values `pred59, hd64` → slots `[0, 4]`, resume at pc 34, value into `r6`.
- **Site 0 of each function is the fuel check** at pc 0 — `R.checkPause()`, no
  destination slot, carrying the arguments, which is how re-entry re-runs the
  argument contracts.
- `?sample=02-list-ops&fn=1&tab=forms` opens a specific view (also how the page
  is checked from headless Chrome, which can't click).

## What it is *not*

Nothing is compiled in the browser. Unlike `../bytecode-vm/` and
`../promise-vs-cont/`, this page does not frame the editor and borrow its
compiler — the `vm/` disassembler is not exported from `browser.ts` on this
branch, so a live version would need a bundle rebuild. Everything here was
emitted by the compiler on the dev box and baked in.

That trade bought a page that is 200 KB instead of 7–18 MB, opens from `file://`,
and can show things a live page could not — the site table, and both forms of the
same function side by side.

**Don't read a size claim off this page.** On toy modules like these the hybrid
module is *bigger* than the all-JS one (every Gen function ships twice, plus a
program table). The size result is a trove-scale one: 89% raw / 96% gzipped for
the default, 49% / 53% for the bytecode-only configuration. See the
[lab notebook entry](../../2026-08-hybrid-vm.md).

## Provenance

Emitted from `jpolitz/pyret@hybrid-vm` (tip `96340db51`) on
`tight-ship.exe.xyz:~/work/pyret`, 2026-08-17, with
`--stack-backend promise --vm-tiers gen --vm-fast all`.

**That branch exists only on that VM.** If it is gone, this page and
`src/hybrid-demo.json` are the only surviving artifacts of the emission.

Each pane's source, precisely:

| pane | comes from |
| --- | --- |
| tier bands + badges | `PYRET_TIER_DEBUG=1`, which prints one line per analyzed function with its verdict and source span |
| fast form | the emitted module text — the thunk at `funcs[i].ff`, sliced at brace boundaries out of the 4th argument of `R.$vm.load(...)` |
| bytecode | `disasm.disassembleFunc(prog, i)`, verbatim; the operand colors follow its own `r`/`u`/`k`/`g` spelling |
| site table | `prog.sites`, joined against the `R.$vm.bail(...)` calls found in the fast form |
| Promise backend tab | the same module compiled without `--vm-tiers`, for comparison |

## Rebuilding

On a checkout of the branch, from `lang/`:

```sh
node gen-hybrid-demo.js <samples-dir> hybrid-demo.json   # src/gen-hybrid-demo.js
node build.js page.html hybrid-demo.json hybrid.html     # src/build.js
```

`gen-hybrid-demo.js` compiles each sample twice (hybrid and promise) against a
shared compiled-dir, so the 30-module trove is only built once. Two things it
has to do that are worth knowing if this is ever re-derived:

- **Drop the sample's own compiled modules before each compile.** The cache is
  content-addressed, so an unchanged sample is re-served rather than recompiled —
  and then the tier analysis never runs and `PYRET_TIER_DEBUG` prints nothing for
  it. (Same family as the cache trap recorded in the Lezer entry.)
- **Re-parse every extracted JS slice** (`new Function`) before using it. The
  slicing is brace-matching over emitted JS; the re-parse is what makes a
  mistake fail loudly instead of shipping a garbled pane.

## Verified

Rendered in headless Chrome from this exact directory, 2026-08-17: four samples,
tier bands in all four colors, `01-tiers` shows one function per tier; every
function's bail-site set equals its site-table set and every site's live-slot
list has the same length as its JS name list (8 functions, 24 sites, no
mismatch); `?sample=…&fn=…&tab=…` selects as advertised.
