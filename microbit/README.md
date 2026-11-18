# micro:bit reactor events: `on(MB.button-a)`, `to(MB.leds)`, `to(MB.speaker)`

Needs to be served, not opened from `file://`:

```sh
python3 -m http.server 8093
# then http://127.0.0.1:8093/
```

The pyret-microbit harness (same header, same `js-file("/microbit")` RPC trick),
but the embedded editor is the static reactor-custom-events build instead of
Horizon CPO, and `microbit.js` provides reactor event sources and sinks. Chrome
or Edge (Web Serial / Web Bluetooth). `?example=N` picks the starting example.

## The library additions

| Name | Kind | Payload / message |
| --- | --- | --- |
| `MB.button-a`, `MB.button-b` | source | `"a"` / `"b"` on each press (not release) |
| `MB.buttons` | source | `"a"` or `"b"`, either press |
| `MB.tilt` | source | `{x, y, z}` milli-g, when any axis moves ≥ 40 |
| `MB.temperature` | source | °C, when it changes |
| `MB.light` | source | 0–255, when it changes |
| `MB.sample` | source | every raw sample, `[list: ax, ay, az, temp, light, a, b]` |
| `MB.leds` | sink | 5×5 grid (0–9 or Booleans), or a String to scroll; `none` = leave alone |
| `MB.speaker` | sink | a Number holds that pitch in Hz (0 = silence); `MB.note(hz, ms)` plays one note; `none` = leave alone |

Named controllers (`MB.controller("p1")`) carry the same fields: `on(p1.tilt)`,
`to(p1.leds)`. The sinks act only when the message changes (Reactors sends on
every transition); notes always play. The speaker goes quiet when the reactor
stops. A sink sending while the board isn't connected ends the interaction with
an error saying to call `MB.connect()` first.

The speaker needs the firmware in `firmware/` here (new `P:<hz>` and
`N:<hz>,<ms>` commands); older flashed boards still do LEDs and sensors.

## Files

- `index.html`: harness + four examples (buttons → LEDs and beeps; tilt → dot and
  theremin; temperature/light/raw samples; blank).
- `microbit.js`, `firmware/`: copies of `jpolitz/pyret-microbit@reactor-events`.
- Everything else: the static editor closure from [`../reactor-chat/`](../reactor-chat/)
  (`jpolitz/pyret-lang@reactor-custom-events` at `0de67cf37`), copied unchanged.

Agent-written (Claude Opus 5.5, 2026-11-18): `index.html` and the library/firmware changes.

## Verified

Headless Chrome (Playwright) on `reactor-events.exe.xyz`, 2026-11-18, with a fake
Web Serial board injected into the frame (real `microbit.js` code path, fed CSV
lines, recording writes). No console errors.

- Example 0: A, A, B → `L:` frames with 1, 2, then 1 LED lit; `N:262,120`, `N:292,120`.
- Example 1: tilt moves the LED dot; A → `P:740`, tilt left → `P:140`, A → `P:0`.
- Example 2: `T:22C`, then `T:23C` only when the temperature changes.

On a real board, 2026-11-18: Joe confirmed the speaker works.
