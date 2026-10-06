/*
  demo-seed.js — SNAPSHOT-ONLY. Not part of the ts-table-types branch, and not
  built by CPO's Makefile.

  The editor opens blank and in plain "Run" mode, which never invokes the type
  checker. This loads a worked example and switches the Run button to
  "Type-check and Run" through the page's own #select-tc-run control (which also
  runs it once). Nothing else is touched.

  Append ?blank=1 to the URL to skip the seed and get the stock empty page.
*/
(function () {
  'use strict';

  if (/[?&]blank=1/.test(window.location.search)) { return; }

  var DEFS = [
    '# Table types (TS compiler, branch ts-table-types). The Run button is set',
    '# to "Type-check and Run". Uncomment one of the last two lines and run',
    '# again: both are rejected before the program runs.',
    '',
    'gradebook :: Table<{name :: String, quiz1 :: Number, quiz2 :: Number}> =',
    '  table: name, quiz1, quiz2',
    '    row: "Bob", 8, 9',
    '    row: "Alice", 6, 8',
    '    row: "Eve", 7, 10',
    '  end',
    '',
    'fun dot-product<S>(t :: Table<S>, c1 :: Col<S, Number>, c2 :: Col<S, Number>) -> Number:',
    '  ns = t.get-column(c1)',
    '  ms = t.get-column(c2)',
    '  for fold2(acc from 0, a from ns, b from ms): acc + (a * b) end',
    'end',
    '',
    'dot-product(gradebook, "quiz1", "quiz2")',
    '',
    '# dot-product(gradebook, "name", "quiz2")    # name is a String column',
    '# dot-product(gradebook, "quiz9", "quiz2")   # no such column',
  ].join('\n');

  var tries = 0;
  (function whenReady() {
    var btn = document.getElementById('runButton');
    var tc = document.getElementById('select-tc-run');
    if (!(window.CPO && CPO.editor && btn && tc && !btn.disabled)) {
      if (++tries > 600) { return; } // ~60s, then give up quietly
      setTimeout(whenReady, 100);
      return;
    }
    CPO.editor.cm.setValue(DEFS);
    tc.click();
  })();
})();
