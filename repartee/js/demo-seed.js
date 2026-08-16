/*
  demo-seed.js — SNAPSHOT-ONLY. Not part of the repartee-repl branch, and not
  built by CPO's Makefile.

  /editor2 opens blank, exactly as /editor does, so a visitor sees nothing of
  what Repartee is for until they type. This seeds a worked example through the
  UI's own public API (repartee.setDefinitions / addInteraction / run) — no
  private state is touched, and nothing here changes how the engine behaves.

  Append ?blank=1 to the URL to skip the seed and get the stock empty page.
*/
(function () {
  'use strict';

  if (/[?&]blank=1/.test(window.location.search)) { return; }

  var DEFS = [
    'use context starter2024',
    '',
    '# Change tax-rate below and press Run.',
    '# Both entries on the right go dashed the moment you type: their',
    '# displayed values no longer match the code that produced them.',
    '',
    'tax-rate = 0.08',
    '',
    'fun with-tax(price :: Number) -> Number:',
    '  doc: "Add sales tax to a price"',
    '  price * (1 + tax-rate)',
    'where:',
    '  with-tax(100) is-roughly 108',
    'end',
  ].join('\n');

  var ENTRIES = [
    'with-tax(25)',
    'map(with-tax, [list: 10, 20, 30])',
  ];

  var tries = 0;
  (function whenReady() {
    if (!window.repartee) {
      if (++tries > 600) { return; } // ~60s, then give up quietly
      setTimeout(whenReady, 100);
      return;
    }
    var r = window.repartee;
    r.setDefinitions(DEFS);
    ENTRIES.forEach(function (src) { r.addInteraction(src); });
    r.run(true);
  })();
})();
