// Agent-written (Claude Opus 5.5, 2026-11-13). Not written by Joe Politz.
//
// A Pyret JS module that connects reactors running in different embeds on the
// same host page. Load it with
//
//   import js-file("/channel") as Ch
//
// The host page serves this file to each embed through the fs RPCs, the same
// way the micro:bit harness serves microbit.js, and relays messages between
// the frames (see chat.html).
//
//   Ch.inbox  :: EventSource<Any>       messages posted by the other frames
//   Ch.outbox :: EventSink<List<Any>>   everything this program has sent, newest first
//
// With `to(Ch.outbox): lam(s): s.sent end`, the sink posts the items added to
// the front of the list since the last transition. `to` runs after every
// transition and Reactors does no dedupe, so the outbox does it here: it
// remembers how long the list was. The list it sees when the interaction starts
// (the initial projection) is taken as already sent, so pausing and resuming
// does not resend old messages.
//
// Wire values are a JSON subset: strings, numbers, booleans, lists, and records
// of those. Anything else is an error when it is sent.
({
  requires: [
    { "import-type": "builtin", "name": "reactors" }
  ],
  provides: {
    shorthands: {
      "EventSource": { tag: "name",
                       origin: { "import-type": "uri", uri: "builtin://reactors" },
                       name: "EventSource" },
      "EventSink": { tag: "name",
                     origin: { "import-type": "uri", uri: "builtin://reactors" },
                     name: "EventSink" },
      "List": { tag: "name",
                origin: { "import-type": "uri", uri: "builtin://lists" },
                name: "List" }
    },
    values: {
      "inbox": ["tyapp", "EventSource", ["Any"]],
      "outbox": ["tyapp", "EventSink", [["tyapp", "List", ["Any"]]]]
    },
    types: {}
  },
  nativeRequires: [],
  theModule: function(runtime, _, uri, reactors) {
    var R = runtime.getField(reactors, "internal");
    var ffi = runtime.ffi;
    var PROTOCOL = "pyret-channel";

    function toWire(v) {
      if(runtime.isString(v) || runtime.isBoolean(v)) { return v; }
      if(runtime.isNumber(v)) { return runtime.jsnums.toFixnum(v); }
      if(ffi.isList(v)) { return ffi.toArray(v).map(toWire); }
      if(runtime.isObject(v) && !runtime.isDataValue(v)) {
        var out = {};
        runtime.getFields(v).forEach(function(f) { out[f] = toWire(runtime.getField(v, f)); });
        return out;
      }
      throw new Error("channel: can only send strings, numbers, booleans, lists and records");
    }

    function fromWire(w) {
      if(typeof w === "string") { return runtime.makeString(w); }
      if(typeof w === "boolean") { return runtime.makeBoolean(w); }
      if(typeof w === "number") {
        return Number.isInteger(w) ? runtime.makeNumber(w) : runtime.makeNumberFromString(String(w));
      }
      if(Array.isArray(w)) { return ffi.makeList(w.map(fromWire)); }
      if(w && typeof w === "object") {
        var fields = {};
        Object.keys(w).forEach(function(k) { fields[k] = fromWire(w[k]); });
        return runtime.makeObject(fields);
      }
      throw new Error("channel: unexpected wire value " + JSON.stringify(w));
    }

    var inbox = R.makeEventSource("inbox", function(emit) {
      function listener(e) {
        if(e.source !== window.parent) { return; }
        var d = e.data;
        if(!d || d.protocol !== PROTOCOL || d.type !== "deliver") { return; }
        emit(fromWire(d.payload));
      }
      window.addEventListener("message", listener);
      return function() { window.removeEventListener("message", listener); };
    });

    var outbox = R.makeEventSink("outbox", function(context) {
      var seen = null;   // length of the list at the last projection; null until the first one
      return {
        send: function(list) {
          if(!ffi.isList(list)) { throw new Error("channel: outbox expects a List"); }
          var items = ffi.toArray(list);
          if(seen === null || items.length < seen) { seen = items.length; return; }
          var fresh = items.slice(0, items.length - seen).reverse();
          seen = items.length;
          fresh.forEach(function(item) {
            window.parent.postMessage({ protocol: PROTOCOL, type: "post", payload: toWire(item) }, "*");
          });
        }
      };
    });

    return runtime.makeModuleReturn({ "inbox": inbox, "outbox": outbox }, {});
  }
})
