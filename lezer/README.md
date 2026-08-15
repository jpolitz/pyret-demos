# Lezer vs RNGLR — live differential demo

Open `index.html`. Works from `file://`; no server, no network.

Both of Pyret's parsers run in the page on every edit, on the same source:

- **RNGLR** — the real compiler parser. Its four AMD sources (`cyclicJSON` →
  `rnglr` → `jglr` → `pyret-tokenizer`) plus the generated tables
  (`pyret-parser.js`, 1.6 MB, from `lang/build/phase0/js/`) are inlined as text
  and eval'd under a small `define` shim. Unmodified — not a reimplementation.
- **Lezer** — the experiment's grammar, compiled to tables ahead of time by
  `gen-table.js` so no grammar generator ships in the bundle.

Both consume the **same token stream**: the Lezer grammar's external tokenizer
replays Pyret's own tokenizer. That is the architectural point of the whole
experiment — only the CFG is ever under test.

`?preset=lists&bench=1` in the URL opens a specific state (also how it was
checked from headless Chrome, which can't click).

## What AGREE means

`differential.js` is a port of `lezer-pyret/compare-trees.js`, the offline
harness behind the 553/553 corpus figure: Lezer node names mapped back to BNF
names via `namemap.json`, Lezer's `Space` leaves dropped, transparent EBNF
grouping nodes spliced out of both trees. AGREE = those normalized trees are
string-identical. The right-hand pane renders the **normalized** tree, i.e. the
thing actually compared.

## On the timing number

These presets show roughly **2–3× end-to-end** (median of 5). Don't quote 5.4×
off this page — that is a corpus-wide figure from `timing.js` over 553 files /
3.16 MB in node, a different input mix; and the 11.5× companion figure is
parser-only, excluding tokenization, which is ~58% of Lezer's path.

## Rebuilding

From a checkout of `jpolitz/pyret-lang@lezer`:

```sh
cd lezer-pyret/cm6-demo
cp ../../lang/build/phase0/js/pyret-parser.js vendor/pyret-parser.amdtext   # RNGLR tables
cp ../../lang/src/arr/trove/lists.arr .                                    # large preset
npm install
npm run build          # -> bundle.js
```

`index.js`, `differential.js`, `index.html`, and the `pyret-tokenizer.js`
shim's `PyretGrammar` export were added for this demo and are **not** on the
`lezer` branch — they live only in this snapshot. Copy them back to the branch
before rebuilding, or the build produces the old highlight-only demo.
