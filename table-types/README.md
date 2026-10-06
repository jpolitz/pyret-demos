# Table types — CPO with the TS compiler's table type checker

Needs to be served (see below):

```sh
python3 -m http.server 8095
# then http://127.0.0.1:8095/
```

Stock CPO editor, TS-compiler flavor, built from the `ts-table-types` branch.
The page opens on a worked example (B2T2 `dotProduct`) with the Run button set to
**Type-check and Run**. `?blank=1` gives the stock empty editor in plain Run mode.

Design doc: `lang/TYPED-TABLES.md` on the branch. Test corpus:
`lang/tests/type-check/tables-{good,bad}/`.

## Provenance

Built on `typed-tables-demo.exe.xyz` on 2026-10-06 from
`jpolitz/pyret-lang@ts-table-types` (`d931fab44`, "Table types for Pyret"), the
Fable reference solution. Not the Opus 5 `table-types-newcolumn` branch.

Build was the CI recipe: `ln -s ../lang pyret`; in `lang/`, `npm install && make
phaseA-deps`; in `code.pyret.org/`, `npm ci --ignore-scripts`, `make web-local`,
`make web-ts`. Then the page was rendered statically:

```sh
node make-template.js src/web/editor.html .env.typed-tables > index.html
```

```
BASE_URL="."
PYRET="./js/cpo-main-ts.jarr.min.js"
PYRET_TS="./js/cpo-main-ts.jarr.min.js"
PYRET_TS_COMPILER="./js/ts-compiler.js"
CPO_COMPILER="ts"
GOOGLE_API_KEY=""
GOOGLE_CLIENT_ID=""
GOOGLE_APP_ID=""
URL_FILE_MODE="all-remote"
POSTMESSAGE_ORIGIN="*"
IMAGE_PROXY_BYPASS="true"
APP_NAME="Pyret table types"
```

As in `../repartee-notebook/`, `PYRET` points at the inflated
`cpo-main-ts.jarr.min.js` (copied from the build's `cpo-main-ts.jarr.min`), not
`.gz.js`, because static hosts don't send `Content-Encoding: gzip`.

The full `build/web` is 225 MB; this is the page's closure: `index.html`, `css/`,
`img/`, and 11 files in `js/` (including `ts-compiler.js`, which is loaded via a
runtime-constructed path and does not show up in a `src=` scan).

`js/demo-seed.js` and its `<script>` tag are the only additions to the generated
page. They're snapshot-only and not on the branch. The script sets the definitions and clicks the
page's own `#select-tc-run`.

## Verified

Headless Chrome against this exact directory, 2026-10-06:

- Boots; seeded example type-checks and runs to `190`.
- `dot-product(gradebook, "name", "quiz2")` is rejected:
  *Number was incompatible with … String*.
- `dot-product(gradebook, "quiz9", "quiz2")` is rejected:
  *the string `"quiz9"` is used as a column name, but it is not a column of the
  table schema {name :: String, quiz1 :: Number, quiz2 :: Number}*.

Console shows two benign errors (no `gapi.client`; no `MESSAGES` embedding
context), the same ones the other CPO-based snapshots produce.

## Caveats

- **Must be served**, not opened from `file://` (the jarr `<link rel="preload"
  crossorigin>` is blocked under `file://`, same as `../repartee-notebook/`).
- Still requests `apis.google.com` and `gstatic.com/charts`; works without them.
- Drive/Save chrome is present but inert.
- A **snapshot, not a build**. Regenerate with the recipe above.
