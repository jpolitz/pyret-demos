# Reactor chat: two embeds connected by event sources and sinks

Needs to be served, not opened from `file://`:

```sh
python3 -m http.server 8094
# then http://127.0.0.1:8094/chat.html
```

Two code.pyret.org embeds on one page, each running a chat reactor (Alice and
Bob). Click a chat window, type, and press Enter. `?autorun=0` loads the
programs without running them.

## Files

- `chat.html`: the host page. It serves `channel.js` to each embed through the
  embed's fs RPCs (the micro:bit harness trick), and relays `pyret-channel`
  posts from one frame to the other. The strip at the bottom logs each relayed
  message.
- `channel.js`: the shared Pyret JS module, `import js-file("/channel") as Ch`.
  `Ch.inbox :: EventSource<Any>`, `Ch.outbox :: EventSink<List<Any>>`. The
  outbox sends whatever was added to the front of the list since the last
  projection, and treats the list at interaction start as already sent. Wire
  values are strings, numbers, booleans, lists and records.
- Everything else is the static editor closure from the build: `editor.embed.html`,
  `css/`, `img/`, 10 files in `js/`.

`chat.html` and `channel.js` are agent-written (Claude Opus 5.5) and are not on
the branch.

## Provenance

`editor.embed.html` and its closure were copied from
`reactor-events.exe.xyz:~/pyret-lang/code.pyret.org/build/web` on 2026-11-13.
The jarr (`cpo-main.jarr.gz.js`, built 2026-11-13 10:03) matches
`jpolitz/pyret-lang@reactor-custom-events` at `0de67cf37`. This build decompresses the
`.gz.js` in the page (`PYRET_GZIPPED`), so unlike `../promise-vs-cont/` it ships
gzipped as-is.

Two details the RPCs need for this build: `js-file` resolution calls
`path.isAbsolute` (camelCase, in addition to the harness's `is-absolute`), and
`from` is a Pyret keyword, so it can't be a record field in the messages.

## Verified

Headless Chrome (Playwright) against this directory, 2026-11-13: both editors
boot and run in about 5 s. Alice types `Hi Bob?` + Enter, and Bob types `Hey!`,
Backspace, `! :)`, Enter. The relay log shows one message each way, and both
canvases show both lines. Console errors are only the `gapi.client` storage
warnings that every static embed shows.
