/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/web/js/modal-prompt.js"
/*!************************************!*\
  !*** ./src/web/js/modal-prompt.js ***!
  \************************************/
(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
 * Module for managing modal prompt instances.
 * NOTE: This module is currently limited in a number
 *       of ways. For one, it only allows radio
 *       input options. Additionally, it hard-codes in
 *       a number of other behaviors which are specific
 *       to the image import style prompt (for which
 *       this module was written).
 *       If desired, this module may be made more
 *       general-purpose in the future, but, for now,
 *       be aware of these limitations.
 */
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! q */ "./node_modules/q/q.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (Q) {
  function autoHighlightBox(text) {
    var textBox = $("<input type='text'>").addClass("auto-highlight");
    textBox.attr("readonly", "readonly");
    textBox.on("focus", function () {
      $(this).select();
    });
    textBox.on("mouseup", function () {
      $(this).select();
    });
    textBox.val(text);
    return textBox;
  }

  // Allows asynchronous requesting of prompts
  var promptQueue = Q();
  var styles = ["radio", "tiles", "text", "copyText", "confirm"];
  window.modals = [];

  /**
   * Represents an option to present the user
   * @typedef {Object} ModalOption
   * @property {string} message - The message to show the user which
               describes this option
   * @property {string} value - The value to return if this option is chosen
   * @property {string} [example] - A code snippet to show with this option
   */

  /**
   * Constructor for modal prompts.
   * @param {ModalOption[]} options - The options to present the user
   */
  function Prompt(options) {
    window.modals.push(this);
    if (!options || styles.indexOf(options.style) === -1 || !options.options || typeof options.options.length !== "number" || options.options.length === 0) {
      throw new Error("Invalid Prompt Options", options);
    }
    this.options = options;
    this.modal = $("#promptModal");
    if (this.options.style === "radio") {
      this.elts = $($.parseHTML("<table></table>")).addClass("choiceContainer");
    } else if (this.options.style === "text") {
      this.elts = $("<div>").addClass("choiceContainer");
    } else if (this.options.style === "copyText") {
      this.elts = $("<div>").addClass("choiceContainer");
    } else if (this.options.style === "confirm") {
      this.elts = $("<div>").addClass("choiceContainer");
    } else {
      this.elts = $($.parseHTML("<div></div>")).addClass("choiceContainer");
    }
    this.title = $(".modal-header > h3", this.modal);
    this.modalContent = $(".modal-content", this.modal);
    this.closeButton = $(".close", this.modal);
    this.submitButton = $(".submit", this.modal);
    if (this.options.submitText) {
      this.submitButton.text(this.options.submitText);
    } else {
      this.submitButton.text("Submit");
    }
    if (this.options.cancelText) {
      this.closeButton.text(this.options.cancelText);
    } else {
      this.closeButton.text("Cancel");
    }
    this.modalContent.toggleClass("narrow", !!this.options.narrow);
    this.isCompiled = false;
    this.deferred = Q.defer();
    this.promise = this.deferred.promise;
  }

  /**
   * Type for handlers of responses from modal prompts
   * @callback promptCallback
   * @param {string} resp - The response from the user
   */

  /**
   * Shows this prompt to the user (will wait until any active
   * prompts have finished)
   * @param {promptCallback} [callback] - Optional callback which is passed the
   *        result of the prompt
   * @returns A promise resolving to either the result of `callback`, if provided,
   *          or the result of the prompt, otherwise.
   */
  Prompt.prototype.show = function (callback) {
    // Use the promise queue to make sure there's no other
    // prompt being shown currently
    if (this.options.hideSubmit) {
      this.submitButton.hide();
    } else {
      this.submitButton.show();
    }
    this.closeButton.click(this.onClose.bind(this));
    this.modal.keypress(function (e) {
      if (e.which == 13) {
        this.submitButton.click();
        return false;
      }
    }.bind(this));
    this.submitButton.click(this.onSubmit.bind(this));
    var docClick = function (e) {
      // If the prompt is active and the background is clicked,
      // then close.
      if ($(e.target).is(this.modal) && this.deferred) {
        this.onClose(e);
        $(document).off("click", docClick);
      }
    }.bind(this);
    $(document).click(docClick);
    var docKeydown = function (e) {
      if (e.key === "Escape") {
        this.onClose(e);
        $(document).off("keydown", docKeydown);
      }
    }.bind(this);
    $(document).keydown(docKeydown);
    this.title.text(this.options.title);
    this.populateModal();
    this.modal.css('display', 'block');
    $(":input:enabled:visible:first", this.modal).focus().select();
    if (callback) {
      return this.promise.then(callback);
    } else {
      return this.promise;
    }
  };

  /**
   * Clears the contents of the modal prompt.
   */
  Prompt.prototype.clearModal = function () {
    this.submitButton.off();
    this.closeButton.off();
    this.elts.empty();
  };

  /**
   * Populates the contents of the modal prompt with the
   * options in this prompt.
   */
  Prompt.prototype.populateModal = function () {
    function createRadioElt(option, idx) {
      var elt = $($.parseHTML("<input name=\"pyret-modal\" type=\"radio\">"));
      var id = "r" + idx.toString();
      var label = $($.parseHTML("<label for=\"" + id + "\"></label>"));
      elt.attr("id", id);
      elt.attr("value", option.value);
      label.text(option.message);
      var eltContainer = $($.parseHTML("<td class=\"pyret-modal-option-radio\"></td>"));
      eltContainer.append(elt);
      var labelContainer = $($.parseHTML("<td class=\"pyret-modal-option-message\"></td>"));
      labelContainer.append(label);
      var container = $($.parseHTML("<tr class=\"pyret-modal-option\"></tr>"));
      container.append(eltContainer);
      container.append(labelContainer);
      if (option.example) {
        var example = $($.parseHTML("<div></div>"));
        var cm = CodeMirror(example[0], {
          value: option.example,
          mode: 'pyret',
          lineNumbers: false,
          readOnly: "nocursor" // this makes it readOnly & not focusable as a form input
        });
        setTimeout(function () {
          cm.refresh();
        }, 1);
        var exampleContainer = $($.parseHTML("<td class=\"pyret-modal-option-example\"></td>"));
        exampleContainer.append(example);
        container.append(exampleContainer);
      }
      return container;
    }
    function createTileElt(option, idx) {
      var elt = $($.parseHTML("<button name=\"pyret-modal\" class=\"tile\"></button>"));
      elt.attr("id", "t" + idx.toString());
      elt.append($("<b>").text(option.message)).append($("<p>").text(option.details));
      for (var evt in option.on) elt.on(evt, option.on[evt]);
      return elt;
    }
    function createTextElt(option) {
      var elt = $("<div class=\"pyret-modal-text\">");
      var input = $("<input id='modal-prompt-text' type='text'>").val(option.defaultValue);
      if (option.drawElement) {
        elt.append(option.drawElement(input));
      } else {
        elt.append($("<label for='modal-prompt-text'>").addClass("textLabel").text(option.message));
        elt.append(input);
      }
      return elt;
    }
    function createCopyTextElt(option) {
      var elt = $("<div>");
      elt.append($("<p>").addClass("textLabel").text(option.message));
      if (option.text) {
        var box = autoHighlightBox(option.text);
        //      elt.append($("<span>").text("(" + option.details + ")"));
        elt.append(box);
        box.focus();
      }
      return elt;
    }
    function createConfirmElt(option) {
      return $("<p>").text(option.message);
    }
    var that = this;
    function createElt(option, i) {
      if (that.options.style === "radio") {
        return createRadioElt(option, i);
      } else if (that.options.style === "tiles") {
        return createTileElt(option, i);
      } else if (that.options.style === "text") {
        return createTextElt(option);
      } else if (that.options.style === "copyText") {
        return createCopyTextElt(option);
      } else if (that.options.style === "confirm") {
        return createConfirmElt(option);
      }
    }
    var optionElts;
    // Cache results
    //    if (true) {
    optionElts = this.options.options.map(createElt);
    //      this.compiledElts = optionElts;
    //      this.isCompiled = true;
    //    } else {
    //      optionElts = this.compiledElts;
    //    }
    $("input[type='radio']", optionElts[0]).attr('checked', true);
    this.elts.append(optionElts);
    $(".modal-body", this.modal).empty().append(this.elts);
  };

  /**
   * Handler which is called when the user does not select anything
   */
  Prompt.prototype.onClose = function (e) {
    this.modal.css('display', 'none');
    this.clearModal();
    this.deferred.resolve(null);
    delete this.deferred;
    delete this.promise;
  };

  /**
   * Handler which is called when the user presses "submit"
   */
  Prompt.prototype.onSubmit = function (e) {
    if (this.options.style === "radio") {
      var retval = $("input[type='radio']:checked", this.modal).val();
    } else if (this.options.style === "text") {
      var retval = $("input[type='text']", this.modal).val();
    } else if (this.options.style === "copyText") {
      var retval = true;
    } else if (this.options.style === "confirm") {
      var retval = true;
    } else {
      var retval = true; // Just return true if they clicked submit
    }
    this.modal.css('display', 'none');
    this.clearModal();
    this.deferred.resolve(retval);
    delete this.deferred;
    delete this.promise;
  };
  return Prompt;
}).apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

/***/ },

/***/ "./node_modules/q/q.js"
/*!*****************************!*\
  !*** ./node_modules/q/q.js ***!
  \*****************************/
(module) {

// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2012 Kris Kowal under the terms of the MIT
 * license found at http://github.com/kriskowal/q/raw/master/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
    "use strict";

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (true) {
        module.exports = definition();

    // RequireJS
    } else // removed by dead control flow
{ var previousQ, global; }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;
    // queue for late tasks, used by unhandled rejection tracking
    var laterQueue = [];

    function flush() {
        /* jshint loopfunc: true */
        var task, domain;

        while (head.next) {
            head = head.next;
            task = head.task;
            head.task = void 0;
            domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }
            runSingle(task, domain);

        }
        while (laterQueue.length) {
            task = laterQueue.pop();
            runSingle(task);
        }
        flushing = false;
    }
    // runs a single function in the async queue
    function runSingle(task, domain) {
        try {
            task();

        } catch (e) {
            if (isNodeJS) {
                // In node, uncaught exceptions are considered fatal errors.
                // Re-throw them synchronously to interrupt flushing!

                // Ensure continuation if the uncaught exception is suppressed
                // listening "uncaughtException" events (as domains does).
                // Continue in next event to avoid tick recursion.
                if (domain) {
                    domain.exit();
                }
                setTimeout(flush, 0);
                if (domain) {
                    domain.enter();
                }

                throw e;

            } else {
                // In browsers, uncaught exceptions are not fatal.
                // Re-throw them asynchronously to avoid slow-downs.
                setTimeout(function () {
                    throw e;
                }, 0);
            }
        }

        if (domain) {
            domain.exit();
        }
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process === "object" &&
        process.toString() === "[object process]" && process.nextTick) {
        // Ensure Q is in a real Node environment, with a `process.nextTick`.
        // To see through fake Node environments:
        // * Mocha test runner - exposes a `process` global without a `nextTick`
        // * Browserify - exposes a `process.nexTick` function that uses
        //   `setTimeout`. In this case `setImmediate` is preferred because
        //    it is faster. Browserify's `process.toString()` yields
        //   "[object Object]", while in a real Node environment
        //   `process.nextTick()` yields "[object process]".
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }
    // runs a task after all other tasks have been run
    // this is useful for unhandled rejection tracking that needs to happen
    // after all `then`d tasks have been run.
    nextTick.runAfter = function (task) {
        laterQueue.push(task);
        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };
    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this **might** have the nice side-effect of reducing the size of
// the minified code by reducing x.call() to merely x()
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack &&
        error.stack.indexOf(STACK_JUMP_SEPARATOR) === -1
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack) {
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        error.stack = filterStackString(concatedStacks);
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (value instanceof Promise) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}
Q.resolve = Q;

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

// enable long stacks if Q_DEBUG is set
if (typeof process === "object" && process && process.env && process.env.Q_DEBUG) {
    Q.longStackSupport = true;
}

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            Q.nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    };

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;
        promise.source = newPromise;

        array_reduce(messages, function (undefined, message) {
            Q.nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(Q(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            Q.nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.Promise = promise; // ES6
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }
    var deferred = defer();
    try {
        resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
        deferred.reject(reason);
    }
    return deferred.promise;
}

promise.race = race; // ES6
promise.all = all; // ES6
promise.reject = reject; // ES6
promise.resolve = Q; // ES6

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
};

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q(x).join(y);
};

Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become settled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be settled
 */
Q.race = race;
function race(answerPs) {
    return promise(function (resolve, reject) {
        // Switch to this once we can assume at least ES5
        // answerPs.forEach(function (answerP) {
        //     Q(answerP).then(resolve, reject);
        // });
        // Use this in the meantime
        for (var i = 0, len = answerPs.length; i < len; i++) {
            Q(answerPs[i]).then(resolve, reject);
        }
    });
}

Promise.prototype.race = function () {
    return this.then(Q.race);
};

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        };
    }

    return promise;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    Q.nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

Q.tap = function (promise, callback) {
    return Q(promise).tap(callback);
};

/**
 * Works almost like "finally", but not called for rejections.
 * Original resolution value is passed through callback unaffected.
 * Callback may return a promise that will be awaited for.
 * @param {Function} callback
 * @returns {Q.Promise}
 * @example
 * doSomething()
 *   .then(...)
 *   .tap(console.log)
 *   .then(...);
 */
Promise.prototype.tap = function (callback) {
    callback = Q(callback);

    return this.then(function (value) {
        return callback.fcall(value).thenResolve(value);
    });
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

Promise.prototype.thenResolve = function (value) {
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
};

Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return object instanceof Promise;
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
};

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
};

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var reportedUnhandledRejections = [];
var trackUnhandledRejections = true;

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }
    if (typeof process === "object" && typeof process.emit === "function") {
        Q.nextTick.runAfter(function () {
            if (array_indexOf(unhandledRejections, promise) !== -1) {
                process.emit("unhandledRejection", reason, promise);
                reportedUnhandledRejections.push(promise);
            }
        });
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        if (typeof process === "object" && typeof process.emit === "function") {
            Q.nextTick.runAfter(function () {
                var atReport = array_indexOf(reportedUnhandledRejections, promise);
                if (atReport !== -1) {
                    process.emit("rejectionHandled", unhandledReasons[at], promise);
                    reportedUnhandledRejections.splice(atReport, 1);
                }
            });
        }
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    Q.nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return Q(object).inspect();
    });
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected);
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;

            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
            // engine that has a deployed base of browsers that support generators.
            // However, SM's generators use the Python-inspired semantics of
            // outdated ES6 drafts.  We would like to support ES6, but we'd also
            // like to make it possible to use generators in deployed browsers, so
            // we also support Python-style generators.  At some point we can remove
            // this block.

            if (typeof StopIteration === "undefined") {
                // ES6 Generators
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return Q(result.value);
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // SpiderMonkey Generators
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return Q(exception.value);
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
}

Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    Q.nextTick(function () {
        self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
};

Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
};

Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
};

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q.del = // XXX legacy
Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
};

Promise.prototype.del = // XXX legacy
Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
Q.mapply = // XXX As proposed by "Redsandro"
Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
};

Promise.prototype.mapply = // XXX As proposed by "Redsandro"
Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = // XXX Mark Miller's proposed parlance
Q.mcall = // XXX As proposed by "Redsandro"
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
};

Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
};

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
};

Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var pendingCount = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++pendingCount;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--pendingCount === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
            }
        }, void 0);
        if (pendingCount === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

Promise.prototype.all = function () {
    return all(this);
};

/**
 * Returns the first resolved promise of an array. Prior rejected promises are
 * ignored.  Rejects only if all promises are rejected.
 * @param {Array*} an array containing values or promises for values
 * @returns a promise fulfilled with the value of the first resolved promise,
 * or a rejected promise if all promises are rejected.
 */
Q.any = any;

function any(promises) {
    if (promises.length === 0) {
        return Q.resolve();
    }

    var deferred = Q.defer();
    var pendingCount = 0;
    array_reduce(promises, function (prev, current, index) {
        var promise = promises[index];

        pendingCount++;

        when(promise, onFulfilled, onRejected, onProgress);
        function onFulfilled(result) {
            deferred.resolve(result);
        }
        function onRejected() {
            pendingCount--;
            if (pendingCount === 0) {
                deferred.reject(new Error(
                    "Can't get fulfillment value from any promise, all " +
                    "promises were rejected."
                ));
            }
        }
        function onProgress(progress) {
            deferred.notify({
                index: index,
                value: progress
            });
        }
    }, undefined);

    return deferred.promise;
}

Promise.prototype.any = function () {
    return any(this);
};

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, Q);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Promise.prototype.allResolved = function () {
    return allResolved(this);
};

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(promises) {
    return Q(promises).allSettled();
}

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
        return all(array_map(promises, function (promise) {
            promise = Q(promise);
            function regardless() {
                return promise.inspect();
            }
            return promise.then(regardless, regardless);
        }));
    });
};

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q.fail = // XXX legacy
Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
};

Promise.prototype.fail = // XXX legacy
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
}

Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q.fin = // XXX legacy
Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
};

Promise.prototype.fin = // XXX legacy
Promise.prototype["finally"] = function (callback) {
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        Q.nextTick(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {Any*} custom error message or Error object (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, error) {
    return Q(object).timeout(ms, error);
};

Promise.prototype.timeout = function (ms, error) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        if (!error || "string" === typeof error) {
            error = new Error(error || "Timed out after " + ms + " ms");
            error.code = "ETIMEDOUT";
        }
        deferred.reject(error);
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, timeout);
        return deferred.promise;
    });
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
};

Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nbind = function (/*thisp, ...args*/) {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nmapply = // XXX As proposed by "Redsandro"
Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
};

Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = // XXX Based on Mark Miller's proposed "send"
Q.nmcall = // XXX Based on "Redsandro's" proposal
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
Q.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            Q.nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            Q.nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};

Q.noConflict = function() {
    throw new Error("Q.noConflict only works when Q is used as a global");
};

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});


/***/ },

/***/ "./node_modules/url.js/url.js"
/*!************************************!*\
  !*** ./node_modules/url.js/url.js ***!
  \************************************/
(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_RESULT__;// Copyright 2013-2014 Kevin Cox

/*******************************************************************************
*                                                                              *
*  This software is provided 'as-is', without any express or implied           *
*  warranty. In no event will the authors be held liable for any damages       *
*  arising from the use of this software.                                      *
*                                                                              *
*  Permission is granted to anyone to use this software for any purpose,       *
*  including commercial applications, and to alter it and redistribute it      *
*  freely, subject to the following restrictions:                              *
*                                                                              *
*  1. The origin of this software must not be misrepresented; you must not     *
*     claim that you wrote the original software. If you use this software in  *
*     a product, an acknowledgment in the product documentation would be       *
*     appreciated but is not required.                                         *
*                                                                              *
*  2. Altered source versions must be plainly marked as such, and must not be  *
*     misrepresented as being the original software.                           *
*                                                                              *
*  3. This notice may not be removed or altered from any source distribution.  *
*                                                                              *
*******************************************************************************/

+function(){
"use strict";

var array = /\[([^\[]*)\]$/;

/// URL Regex.
/**
 * This regex splits the URL into parts.  The capture groups catch the important
 * bits.
 * 
 * Each section is optional, so to work on any part find the correct top level
 * `(...)?` and mess around with it.
 */
var regex = /^(?:([a-z]*):)?(?:\/\/)?(?:([^:@]*)(?::([^@]*))?@)?([a-z-._]+)?(?::([0-9]*))?(\/[^?#]*)?(?:\?([^#]*))?(?:#(.*))?$/i;
//               1 - scheme                2 - user    3 = pass 4 - host        5 - port  6 - path        7 - query    8 - hash

var noslash = ["mailto","bitcoin"];

var self = {
	/** Parse a query string.
	 *
	 * This function parses a query string (sometimes called the search
	 * string).  It takes a query string and returns a map of the results.
	 *
	 * Keys are considered to be everything up to the first '=' and values are
	 * everything afterwords.  Since URL-decoding is done after parsing, keys
	 * and values can have any values, however, '=' have to be encoded in keys
	 * while '?' and '&' have to be encoded anywhere (as they delimit the
	 * kv-pairs).
	 *
	 * Keys and values will always be strings, except if there is a key with no
	 * '=' in which case it will be considered a flag and will be set to true.
	 * Later values will override earlier values.
	 *
	 * Array keys are also supported.  By default keys in the form of `name[i]`
	 * will be returned like that as strings.  However, if you set the `array`
	 * flag in the options object they will be parsed into arrays.  Note that
	 * although the object returned is an `Array` object all keys will be
	 * written to it.  This means that if you have a key such as `k[forEach]`
	 * it will overwrite the `forEach` function on that array.  Also note that
	 * string properties always take precedence over array properties,
	 * irrespective of where they are in the query string.
	 *
	 *   url.get("array[1]=test&array[foo]=bar",{array:true}).array[1]  === "test"
	 *   url.get("array[1]=test&array[foo]=bar",{array:true}).array.foo === "bar"
	 *   url.get("array=notanarray&array[0]=1",{array:true}).array      === "notanarray"
	 *
	 * If array parsing is enabled keys in the form of `name[]` will
	 * automatically be given the next available index.  Note that this can be
	 * overwritten with later values in the query string.  For this reason is
	 * is best not to mix the two formats, although it is safe (and often
	 * useful) to add an automatic index argument to the end of a query string.
	 *
	 *   url.get("a[]=0&a[]=1&a[0]=2", {array:true})  -> {a:["2","1"]};
	 *   url.get("a[0]=0&a[1]=1&a[]=2", {array:true}) -> {a:["0","1","2"]};
	 *
	 * @param{string} q The query string (the part after the '?').
	 * @param{{full:boolean,array:boolean}=} opt Options.
	 *
	 * - full: If set `q` will be treated as a full url and `q` will be built.
	 *   by calling #parse to retrieve the query portion.
	 * - array: If set keys in the form of `key[i]` will be treated
	 *   as arrays/maps.
	 *
	 * @return{!Object.<string, string|Array>} The parsed result.
	 */
	"get": function(q, opt){
		q = q || "";
		if ( typeof opt          == "undefined" ) opt = {};
		if ( typeof opt["full"]  == "undefined" ) opt["full"] = false;
		if ( typeof opt["array"] == "undefined" ) opt["array"] = false;
		
		if ( opt["full"] === true )
		{
			q = self["parse"](q, {"get":false})["query"] || "";
		}
		
		var o = {};
		
		var c = q.split("&");
		for (var i = 0; i < c.length; i++)
		{
			if (!c[i].length) continue;
			
			var d = c[i].indexOf("=");
			var k = c[i], v = true;
			if ( d >= 0 )
			{
				k = c[i].substr(0, d);
				v = c[i].substr(d+1);
				
				v = decodeURIComponent(v);
			}
			
			if (opt["array"])
			{
				var inds = [];
				var ind;
				var curo = o;
				var curk = k;
				while (ind = curk.match(array)) // Array!
				{
					curk = curk.substr(0, ind.index);
					inds.unshift(decodeURIComponent(ind[1]));
				}
				curk = decodeURIComponent(curk);
				if (inds.some(function(i)
				{
					if ( typeof curo[curk] == "undefined" ) curo[curk] = [];
					if (!Array.isArray(curo[curk]))
					{
						//console.log("url.get: Array property "+curk+" already exists as string!");
						return true;
					}
					
					curo = curo[curk];
					
					if ( i === "" ) i = curo.length;
					
					curk = i;
				})) continue;
				curo[curk] = v;
				continue;
			}
			
			k = decodeURIComponent(k);
			
			//typeof o[k] == "undefined" || console.log("Property "+k+" already exists!");
			o[k] = v;
		}
		
		return o;
	},
	
	/** Build a get query from an object.
	 *
	 * This constructs a query string from the kv pairs in `data`.  Calling
	 * #get on the string returned should return an object identical to the one
	 * passed in except all non-boolean scalar types become strings and all
	 * object types become arrays (non-integer keys are still present, see
	 * #get's documentation for more details).
	 *
	 * This always uses array syntax for describing arrays.  If you want to
	 * serialize them differently (like having the value be a JSON array and
	 * have a plain key) you will need to do that before passing it in.
	 *
	 * All keys and values are supported (binary data anyone?) as they are
	 * properly URL-encoded and #get properly decodes.
	 *
	 * @param{Object} data The kv pairs.
	 * @param{string} prefix The properly encoded array key to put the
	 *   properties.  Mainly intended for internal use.
	 * @return{string} A URL-safe string.
	 */
	"buildget": function(data, prefix){
		var itms = [];
		for ( var k in data )
		{
			var ek = encodeURIComponent(k);
			if ( typeof prefix != "undefined" )
				ek = prefix+"["+ek+"]";
			
			var v = data[k];
			
			switch (typeof v)
			{
				case 'boolean':
					if(v) itms.push(ek);
					break;
				case 'number':
					v = v.toString();
				case 'string':
					itms.push(ek+"="+encodeURIComponent(v));
					break;
				case 'object':
					itms.push(self["buildget"](v, ek));
					break;
			}
		}
		return itms.join("&");
	},
	
	/** Parse a URL
	 * 
	 * This breaks up a URL into components.  It attempts to be very liberal
	 * and returns the best result in most cases.  This means that you can
	 * often pass in part of a URL and get correct categories back.  Notably,
	 * this works for emails and Jabber IDs, as well as adding a '?' to the
	 * beginning of a string will parse the whole thing as a query string.  If
	 * an item is not found the property will be undefined.  In some cases an
	 * empty string will be returned if the surrounding syntax but the actual
	 * value is empty (example: "://example.com" will give a empty string for
	 * scheme.)  Notably the host name will always be set to something.
	 * 
	 * Returned properties.
	 * 
	 * - **scheme:** The url scheme. (ex: "mailto" or "https")
	 * - **user:** The username.
	 * - **pass:** The password.
	 * - **host:** The hostname. (ex: "localhost", "123.456.7.8" or "example.com")
	 * - **port:** The port, as a number. (ex: 1337)
	 * - **path:** The path. (ex: "/" or "/about.html")
	 * - **query:** "The query string. (ex: "foo=bar&v=17&format=json")
	 * - **get:** The query string parsed with get.  If `opt.get` is `false` this
	 *   will be absent
	 * - **hash:** The value after the hash. (ex: "myanchor")
	 *   be undefined even if `query` is set.
	 *
	 * @param{string} url The URL to parse.
	 * @param{{get:Object}=} opt Options:
	 *
	 * - get: An options argument to be passed to #get or false to not call #get.
	 *    **DO NOT** set `full`.
	 *
	 * @return{!Object} An object with the parsed values.
	 */
	"parse": function(url, opt) {
		
		if ( typeof opt == "undefined" ) opt = {};
		
		var md = url.match(regex) || [];
		
		var r = {
			"url":    url,
			
			"scheme": md[1],
			"user":   md[2],
			"pass":   md[3],
			"host":   md[4],
			"port":   md[5] && +md[5],
			"path":   md[6],
			"query":  md[7],
			"hash":   md[8],
		};
		
		if ( opt.get !== false )
			r["get"] = r["query"] && self["get"](r["query"], opt.get);
		
		return r;
	},
	
	/** Build a URL from components.
	 * 
	 * This pieces together a url from the properties of the passed in object.
	 * In general passing the result of `parse()` should return the URL.  There
	 * may differences in the get string as the keys and values might be more
	 * encoded then they were originally were.  However, calling `get()` on the
	 * two values should yield the same result.
	 * 
	 * Here is how the parameters are used.
	 * 
	 *  - url: Used only if no other values are provided.  If that is the case
	 *     `url` will be returned verbatim.
	 *  - scheme: Used if defined.
	 *  - user: Used if defined.
	 *  - pass: Used if defined.
	 *  - host: Used if defined.
	 *  - path: Used if defined.
	 *  - query: Used only if `get` is not provided and non-empty.
	 *  - get: Used if non-empty.  Passed to #buildget and the result is used
	 *    as the query string.
	 *  - hash: Used if defined.
	 * 
	 * These are the options that are valid on the options object.
	 * 
	 *  - useemptyget: If truthy, a question mark will be appended for empty get
	 *    strings.  This notably makes `build()` and `parse()` fully symmetric.
	 *
	 * @param{Object} data The pieces of the URL.
	 * @param{Object} opt Options for building the url.
	 * @return{string} The URL.
	 */
	"build": function(data, opt){
		opt = opt || {};
		
		var r = "";
		
		if ( typeof data["scheme"] != "undefined" )
		{
			r += data["scheme"];
			r += (noslash.indexOf(data["scheme"])>=0)?":":"://";
		}
		if ( typeof data["user"] != "undefined" )
		{
			r += data["user"];
			if ( typeof data["pass"] == "undefined" )
			{
				r += "@";
			}
		}
		if ( typeof data["pass"] != "undefined" ) r += ":" + data["pass"] + "@";
		if ( typeof data["host"] != "undefined" ) r += data["host"];
		if ( typeof data["port"] != "undefined" ) r += ":" + data["port"];
		if ( typeof data["path"] != "undefined" ) r += data["path"];
		
		if (opt["useemptyget"])
		{
			if      ( typeof data["get"]   != "undefined" ) r += "?" + self["buildget"](data["get"]);
			else if ( typeof data["query"] != "undefined" ) r += "?" + data["query"];
		}
		else
		{
			// If .get use it.  If .get leads to empty, use .query.
			var q = data["get"] && self["buildget"](data["get"]) || data["query"];
			if (q) r += "?" + q;
		}
		
		if ( typeof data["hash"] != "undefined" ) r += "#" + data["hash"];
		
		return r || data["url"] || "";
	},
};

if ( true ) !(__WEBPACK_AMD_DEFINE_FACTORY__ = (self),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.call(exports, __webpack_require__, exports, module)) :
		__WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
else // removed by dead control flow
{}

}();


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!***********************************!*\
  !*** ./src/web/js/beforePyret.js ***!
  \***********************************/
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/* global $ jQuery CPO CodeMirror storageAPI Q createProgramCollectionAPI makeShareAPI */

var originalPageLoad = Date.now();
console.log("originalPageLoad: ", originalPageLoad);

// Transparently route browser fetches to allowlisted hosts through the
// server-side proxy at /load-shareurl, but only when the direct path doesn't
// work.
//
// Strategy: the FIRST fetch to an allowlisted host fires direct + proxied in
// parallel. We decide shouldProxy for the rest of the page-load from direct's
// response *headers*:
//   - direct returned 2xx with content-type text/plain  -> shouldProxy=false:
//     serve direct's response, abort the in-flight proxy fetch.
//   - direct failed, hung past timeout, or returned anything else
//                                                        -> shouldProxy=true:
//     serve proxy's response.
// A key idea is that network-blocky things sometimes return 200 with a
// message page about blocking (or an error, but that counts as a fail). We
// don't want to accidentally think that's a success.
// shouldProxy state is in-memory and per-host — never persisted, since
// reachability changes between networks and a stale value would silently
// break loads.
//
// Installed on the global fetch as early as possible so it catches every fetch
// caller; some of them are in the pyret-lang runtime and would be otherwise
// difficult to configure.
var SHAREURL_PROXY_HOSTS = new Set(['raw.githubusercontent.com']);
var SHAREURL_DIRECT_TIMEOUT_MS = 5000;
var _origFetch = window.fetch.bind(window);
var _shareurlShouldProxy = new Map(); // host -> boolean
var _shareurlShouldProxyInflight = new Map(); // host -> Promise<boolean>

function _shareurlProxyUrl(fetchInput) {
  return '/load-shareurl?url=' + encodeURIComponent(_shareurlInputToUrl(fetchInput));
}
function _shareurlInputToUrl(fetchInput) {
  return typeof fetchInput === 'string' ? fetchInput : typeof Request !== 'undefined' && fetchInput instanceof Request ? fetchInput.url : String(fetchInput);
}
function _shareurlVerifyDirect(r) {
  if (!r.ok) return false;
  var ct = (r.headers.get('content-type') || '').toLowerCase();
  // Source files served from raw.githubusercontent.com come back as
  // text/plain (.arr, .json, .csv, .md all do). Anything else — HTML block
  // pages, captive portals, surprise content types — we don't trust as a
  // real upstream response.
  return ct.startsWith('text/plain');
}
function _shareurlFetch(shouldProxy, fetchInput, fetchInit) {
  var maybeProxyInput = shouldProxy ? _shareurlProxyUrl(fetchInput) : fetchInput;
  return _origFetch(maybeProxyInput, fetchInit);
}
function _shareurlRace(fetchInput, fetchInit) {
  var proxyCtrl = new AbortController();
  // NOTE(joe): The signal overwrite is technically not the right fetch()
  // polyfill. If the caller elsewhere in the codebase provided a different
  // signal (which in the fetch API is only for aborting as of April '26), that
  // caller aborting through that signal won't cancel the proxy fetch.
  // I'm OK letting that case slip through here in exchange for not having a
  // bunch of extra event handler forwarding
  var proxyP = _origFetch(_shareurlProxyUrl(fetchInput), Object.assign({}, fetchInit, {
    signal: proxyCtrl.signal
  }));
  var directP = _origFetch(fetchInput, fetchInit).then(function (r) {
    if (!_shareurlVerifyDirect(r)) throw new Error('direct request failed');
    return r;
  });

  // shouldProxy: false iff direct verified before the timeout, else true.
  // Whether to proxy is decided solely on whether direct succeeds or not
  var shouldProxyPromise = Promise.race([directP.then(function () {
    return false;
  }, function () {
    return true;
  }), new Promise(function (resolve) {
    return setTimeout(function () {
      return resolve(true);
    }, SHAREURL_DIRECT_TIMEOUT_MS);
  })]);

  // Settlement-order check: if direct verifies before proxy returns, abort
  // the in-flight proxy to stop wasting server bandwidth. We must NOT
  // abort once proxy has already returned, since by then the caller is
  // reading proxy's body and aborting would error its stream mid-read.
  var directFinishedSuccessfullyAndFirstP = Promise.race([directP.then(function () {
    return true;
  }, function () {
    return false;
  }), proxyP.then(function () {
    return false;
  }, function () {
    return false;
  })]);
  directFinishedSuccessfullyAndFirstP.then(function (directFirst) {
    if (directFirst) proxyCtrl.abort();
  });

  // Caller's response: whichever of direct-verified or proxy-OK fulfills
  // first. A non-ok proxy response must NOT win while direct is still
  // pending: fetch fulfills on HTTP errors, and on hosts with no proxy
  // endpoint at all (static serving: the vscode webview, embed-static) the
  // local 404 arrives long before the real cross-origin response, which
  // would hand the caller a bogus 404. If BOTH fail, surface proxy's
  // response/error (the more authoritative upstream — direct's may just be
  // 'direct-not-verified').
  var responsePromise = Promise.any([directP, proxyP.then(function (r) {
    if (!r.ok) {
      var e = new Error('proxy response not ok');
      e._shareurlResponse = r;
      throw e;
    }
    return r;
  })])["catch"](function (aggErr) {
    var proxyErr = aggErr.errors[1];
    if (proxyErr && proxyErr._shareurlResponse) return proxyErr._shareurlResponse;
    return Promise.reject(proxyErr || aggErr.errors[0]);
  });
  return {
    responsePromise: responsePromise,
    shouldProxyPromise: shouldProxyPromise
  };
}
window.fetch = function (fetchInput, fetchInit) {
  var host;
  try {
    host = new URL(_shareurlInputToUrl(fetchInput), window.location.href).hostname;
  } catch (_) {
    return _origFetch(fetchInput, fetchInit);
  }
  if (!SHAREURL_PROXY_HOSTS.has(host)) return _origFetch(fetchInput, fetchInit);
  var shouldProxy = _shareurlShouldProxy.get(host);
  var inflight = _shareurlShouldProxyInflight.get(host);
  if (shouldProxy !== undefined) {
    return _shareurlFetch(shouldProxy, fetchInput, fetchInit);
  } else if (inflight) {
    // shouldProxy pending: queue this fetch on it and issue a single fresh
    // request once shouldProxy is decided.
    return inflight.then(function (sp) {
      return _shareurlFetch(sp, fetchInput, fetchInit);
    });
  } else {
    // First fetch to this host this page-load: run the race.
    var _shareurlRace2 = _shareurlRace(fetchInput, fetchInit),
      responsePromise = _shareurlRace2.responsePromise,
      shouldProxyPromise = _shareurlRace2.shouldProxyPromise;
    _shareurlShouldProxyInflight.set(host, shouldProxyPromise);
    shouldProxyPromise.then(function (sp) {
      _shareurlShouldProxy.set(host, sp);
      _shareurlShouldProxyInflight["delete"](host);
    });
    return responsePromise;
  }
};
var isEmbedded = window.parent !== window;
var shareAPI = makeShareAPI("");
var url = window.url = __webpack_require__(/*! url.js */ "./node_modules/url.js/url.js");
var modalPrompt = __webpack_require__(/*! ./modal-prompt.js */ "./src/web/js/modal-prompt.js");
window.modalPrompt = modalPrompt;
var LOG = true;
window.ct_log = function /* varargs */
() {
  if (window.console && LOG) {
    console.log.apply(console, arguments);
  }
};
window.ct_error = function /* varargs */
() {
  if (window.console && LOG) {
    console.error.apply(console, arguments);
  }
};
var initialParams = url.parse(document.location.href);
var params = url.parse("/?" + initialParams["hash"]);
// Who owns this editor's initial contents? A standalone page installs its own
// (programLoaded below). An embedded instance (the embed API's iframe, the
// vscode webview) or a page booted from an initialState hash is host-fed: its
// real contents arrive via the events.js `reset` protocol, and boot isn't
// over until that reset fully settles -- reset() runs a warm-start program
// before installing contents, and driving the editor during that window races
// the host's own handshake. EDITOR_CONTENTS_SETTLED is the single "initial
// contents are in and the editor is quiescent" fact, declared at whichever of
// those two settle points applies (here for standalone; events.js reset() for
// host-fed), so observers don't have to re-derive per-host boot behavior.
window.EXPECTS_HOST_RESET = isEmbedded || !!params["get"]["initialState"];
window.highlightMode = "mcmh"; // what is this for?
window.clearFlash = function () {
  $(".notificationArea").empty();
};
window.whiteToBlackNotification = function () {
  /*
  $(".notificationArea .active").css("background-color", "white");
  $(".notificationArea .active").animate({backgroundColor: "#111111" }, 1000);
  */
};
window.stickError = function (message, more) {
  CPO.sayAndForget(message);
  clearFlash();
  var err = $("<span>").addClass("error").text(message);
  if (more) {
    err.attr("title", more);
  }
  err.tooltip();
  $(".notificationArea").prepend(err);
  whiteToBlackNotification();
};
window.flashError = function (message) {
  CPO.sayAndForget(message);
  clearFlash();
  var err = $("<span>").addClass("error").text(message);
  $(".notificationArea").prepend(err);
  whiteToBlackNotification();
  err.fadeOut(7000);
};
window.flashMessage = function (message) {
  CPO.sayAndForget(message);
  clearFlash();
  var msg = $("<span>").addClass("active").text(message);
  $(".notificationArea").prepend(msg);
  whiteToBlackNotification();
  msg.fadeOut(7000);
};
window.stickMessage = function (message) {
  CPO.sayAndForget(message);
  clearFlash();
  var msg = $("<span>").addClass("active").text(message);
  $(".notificationArea").prepend(msg);
  whiteToBlackNotification();
};
window.stickRichMessage = function (content) {
  CPO.sayAndForget(content.text());
  clearFlash();
  $(".notificationArea").prepend($("<span>").addClass("active").append(content));
  whiteToBlackNotification();
};
window.mkWarningUpper = function () {
  return $("<div class='warning-upper'>");
};
window.mkWarningLower = function () {
  return $("<div class='warning-lower'>");
};
var Documents = function () {
  function Documents() {
    this.documents = new Map();
  }
  Documents.prototype.has = function (name) {
    return this.documents.has(name);
  };
  Documents.prototype.get = function (name) {
    return this.documents.get(name);
  };
  Documents.prototype.set = function (name, doc) {
    if (logger.isDetailed) logger.log("doc.set", {
      name: name,
      value: doc.getValue()
    });
    return this.documents.set(name, doc);
  };
  Documents.prototype["delete"] = function (name) {
    if (logger.isDetailed) logger.log("doc.del", {
      name: name
    });
    return this.documents["delete"](name);
  };
  Documents.prototype.forEach = function (f) {
    return this.documents.forEach(f);
  };
  return Documents;
}();
var VERSION_CHECK_INTERVAL = 120000 + 30000 * Math.random();
function checkVersion() {
  $.get("/current-version").then(function (resp) {
    resp = JSON.parse(resp);
    if (resp.version && resp.version !== "") {
      window.flashMessage("A new version of Pyret is available. Save and reload the page to get the newest version.");
    }
  });
}
if (!isEmbedded) {
  window.setInterval(checkVersion, VERSION_CHECK_INTERVAL);
}
window.CPO = {
  save: function save() {},
  autoSave: function autoSave() {},
  documents: new Documents()
};
$(function () {
  var CONTEXT_FOR_NEW_FILES = "use context starter2024\n";
  var CONTEXT_PREFIX = /^use context\s+/;
  function merge(obj, extension) {
    var newobj = {};
    Object.keys(obj).forEach(function (k) {
      newobj[k] = obj[k];
    });
    Object.keys(extension).forEach(function (k) {
      newobj[k] = extension[k];
    });
    return newobj;
  }
  var animationDiv = null;
  function closeAnimationIfOpen() {
    if (animationDiv) {
      animationDiv.empty();
      animationDiv.dialog("destroy");
      animationDiv = null;
    }
  }
  var activeEditor = null;
  CPO.makeEditor = function (container, options) {
    var initial = "";
    if (options.hasOwnProperty("initial")) {
      initial = options.initial;
    }
    var textarea = jQuery("<textarea aria-hidden='true'>");
    textarea.val(initial);
    container.append(textarea);
    var runFun = function runFun(code, replOptions) {
      options.run(code, {
        cm: CM
      }, replOptions);
    };
    var useLineNumbers = !options.simpleEditor;
    var useFolding = !options.simpleEditor;
    var gutters = !options.simpleEditor ? ["help-gutter", "CodeMirror-linenumbers", "CodeMirror-foldgutter"] : [];
    function reindentAllLines(cm) {
      var last = cm.lineCount();
      cm.operation(function () {
        for (var i = 0; i < last; ++i) cm.indentLine(i);
      });
    }
    var CODE_LINE_WIDTH = 100;
    var rulers, rulersMinCol;

    // place a vertical line in code editor, and not repl
    if (options.simpleEditor) {
      rulers = [];
    } else {
      rulers = [{
        color: "#317BCF",
        column: CODE_LINE_WIDTH,
        lineStyle: "dashed",
        className: "hidden"
      }];
      rulersMinCol = CODE_LINE_WIDTH;
    }
    var mac = CodeMirror.keyMap["default"] === CodeMirror.keyMap.macDefault;
    console.log("Using keymap: ", CodeMirror.keyMap["default"], "macDefault: ", CodeMirror.keyMap.macDefault, "mac: ", mac);
    var modifier = mac ? "Cmd" : "Ctrl";
    var extraKeys = _defineProperty(_defineProperty({
      "Shift-Enter": function ShiftEnter(cm) {
        runFun(cm.getValue());
      },
      "Shift-Ctrl-Enter": function ShiftCtrlEnter(cm) {
        runFun(cm.getValue());
      },
      "Tab": "indentAuto",
      "Ctrl-I": reindentAllLines,
      "Esc Left": "goBackwardSexp",
      "Alt-Left": "goBackwardSexp",
      "Esc Right": "goForwardSexp",
      "Alt-Right": "goForwardSexp",
      "Ctrl-Left": "goBackwardToken",
      "Ctrl-Right": "goForwardToken"
    }, "".concat(modifier, "-F"), "findPersistent"), "".concat(modifier, "-/"), "toggleComment");
    if (window.PYRET_IN_VSCODE) {
      // Disable undo and redo in vscode, since they mess with the host editor's undo/redo stack
      // Oddly, it doesn't seem to work to add these to extraKeys; I have to
      // override them in the default keymap
      CodeMirror.keyMap["default"]["".concat(modifier, "-Z")] = false;
      CodeMirror.keyMap["default"]["Shift-".concat(modifier, "-Z")] = false;
      CodeMirror.keyMap["default"]["".concat(modifier, "-Y")] = false;
      // Ctrl-U is Undo within a range
      CodeMirror.keyMap["default"]["".concat(modifier, "-U")] = false;
    }
    var cmOptions = {
      keyMap: 'default',
      extraKeys: CodeMirror.normalizeKeyMap(extraKeys),
      indentUnit: 2,
      tabSize: 2,
      viewportMargin: Infinity,
      lineNumbers: useLineNumbers,
      matchKeywords: true,
      matchBrackets: true,
      styleSelectedText: true,
      foldGutter: useFolding,
      gutters: gutters,
      lineWrapping: true,
      logging: true,
      rulers: rulers,
      rulersMinCol: rulersMinCol,
      scrollPastEnd: true
    };
    cmOptions = merge(cmOptions, options.cmOptions || {});
    var CM = CodeMirror.fromTextArea(textarea[0], cmOptions);
    CM.on("focus", function () {
      activeEditor = CM;
    });
    function firstLineIsNamespace() {
      var firstline = CM.getLine(0);
      var match = firstline.match(CONTEXT_PREFIX);
      return match !== null;
    }
    var namespacemark = null;
    function setContextLine(newContextLine) {
      var hasNamespace = firstLineIsNamespace();
      if (!hasNamespace && namespacemark !== null) {
        namespacemark.clear();
      }
      if (!hasNamespace) {
        CM.replaceRange(newContextLine, {
          line: 0,
          ch: 0
        }, {
          line: 0,
          ch: 0
        });
      } else {
        CM.replaceRange(newContextLine, {
          line: 0,
          ch: 0
        }, {
          line: 1,
          ch: 0
        });
      }
    }
    if (!options.simpleEditor) {
      var gutterQuestionWrapper = document.createElement("div");
      gutterQuestionWrapper.className = "gutter-question-wrapper";
      var gutterTooltip = document.createElement("span");
      gutterTooltip.className = "gutter-question-tooltip";
      gutterTooltip.innerText = "The use context line tells Pyret to load tools for a specific class context. It can be changed through the main Pyret menu. Most of the time you won't need to change this at all.";
      var gutterQuestion = document.createElement("img");
      gutterQuestion.src = window.APP_BASE_URL + "/img/question.png";
      gutterQuestion.className = "gutter-question";
      gutterQuestionWrapper.appendChild(gutterQuestion);
      gutterQuestionWrapper.appendChild(gutterTooltip);
      CM.setGutterMarker(0, "help-gutter", gutterQuestionWrapper);
      CM.getWrapperElement().onmouseleave = function (e) {
        CM.clearGutter("help-gutter");
      };

      // NOTE(joe): This seems to be the best way to get a hover on a mark: https://github.com/codemirror/CodeMirror/issues/3529
      CM.getWrapperElement().onmousemove = function (e) {
        var lineCh = CM.coordsChar({
          left: e.clientX,
          top: e.clientY
        });
        var markers = CM.findMarksAt(lineCh);
        if (markers.length === 0) {
          CM.clearGutter("help-gutter");
        }
        if (lineCh.line === 0 && markers[0] === namespacemark) {
          CM.setGutterMarker(0, "help-gutter", gutterQuestionWrapper);
        } else {
          CM.clearGutter("help-gutter");
        }
      };
      CM.on("change", function (change) {
        function doesNotChangeFirstLine(c) {
          return c.from.line !== 0;
        }
        if (change.curOp.changeObjs && change.curOp.changeObjs.every(doesNotChangeFirstLine)) {
          return;
        }
        var hasNamespace = firstLineIsNamespace();
        if (hasNamespace) {
          if (namespacemark) {
            namespacemark.clear();
          }
          namespacemark = CM.markText({
            line: 0,
            ch: 0
          }, {
            line: 1,
            ch: 0
          }, {
            attributes: {
              useline: true
            },
            className: "useline",
            atomic: true,
            inclusiveLeft: true,
            inclusiveRight: false
          });
        }
      });
    }
    if (useLineNumbers) {
      CM.display.wrapper.appendChild(mkWarningUpper()[0]);
      CM.display.wrapper.appendChild(mkWarningLower()[0]);
    }
    getTopTierMenuitems();
    return {
      cm: CM,
      setContextLine: setContextLine,
      refresh: function refresh() {
        CM.refresh();
      },
      run: function run() {
        runFun(CM.getValue());
      },
      focus: function focus() {
        CM.focus();
      },
      focusCarousel: null //initFocusCarousel
    };
  };
  CPO.RUN_CODE = function () {
    console.log("Running before ready", arguments);
  };
  function setUsername(target) {
    var token = window.gapi.auth.getToken().access_token;
    return fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: {
        Authorization: 'Bearer ' + token
      }
    }).then(function (resp) {
      return resp.json();
    }).then(function (info) {
      target.text(info.email);
    });
  }
  storageAPI.then(function (api) {
    api.collection.then(function () {
      $(".loginOnly").show();
      $(".logoutOnly").hide();
      setUsername($("#username"));
    });
    api.collection.fail(function () {
      $(".loginOnly").hide();
      $(".logoutOnly").show();
    });
  });
  storageAPI = storageAPI.then(function (api) {
    return api.api;
  });
  $("#connectButton").click(function () {
    $("#connectButton").text("Connecting...");
    $("#connectButton").attr("disabled", "disabled");
    $('#connectButtonli').attr('disabled', 'disabled');
    $("#connectButton").attr("tabIndex", "-1");
    //$("#topTierUl").attr("tabIndex", "0");
    getTopTierMenuitems();
    storageAPI = createProgramCollectionAPI("code.pyret.org", false);
    storageAPI.then(function (api) {
      api.collection.then(function () {
        $(".loginOnly").show();
        $(".logoutOnly").hide();
        document.activeElement.blur();
        $("#bonniemenubutton").focus();
        setUsername($("#username"));
        if (params["get"] && params["get"]["program"]) {
          var toLoad = api.api.getFileById(params["get"]["program"]);
          console.log("Logged in and has program to load: ", toLoad);
          loadProgram(toLoad);
          programToSave = toLoad;
        } else {
          programToSave = Q.fcall(function () {
            return null;
          });
        }
      });
      api.collection.fail(function () {
        $("#connectButton").text("Connect to Google Drive");
        $("#connectButton").attr("disabled", false);
        $('#connectButtonli').attr('disabled', false);
        //$("#connectButton").attr("tabIndex", "0");
        document.activeElement.blur();
        $("#connectButton").focus();
        //$("#topTierUl").attr("tabIndex", "-1");
      });
    });
    storageAPI = storageAPI.then(function (api) {
      return api.api;
    });
  });

  /*
    initialProgram holds a promise for a Drive File object or null
     It's null if the page doesn't have a #share or #program url
     If the url does have a #program or #share, the promise is for the
    corresponding object.
  */
  var initialProgram;
  if (params["get"] && params["get"]["shareurl"]) {
    initialProgram = makeUrlFile(params["get"]["shareurl"]);
  } else {
    initialProgram = storageAPI.then(function (api) {
      var programLoad = null;
      if (params["get"] && params["get"]["program"]) {
        enableFileOptions();
        programLoad = api.getFileById(params["get"]["program"]);
        programLoad.then(function (p) {
          showShareContainer(p);
        });
      } else if (params["get"] && params["get"]["share"]) {
        logger.log('shared-program-load', {
          id: params["get"]["share"]
        });
        programLoad = api.getSharedFileById(params["get"]["share"]);
        programLoad.then(function (file) {
          // NOTE(joe): If the current user doesn't own or have access to this file
          // (or isn't logged in) this will simply fail with a 401, so we don't do
          // any further permission checking before showing the link.
          file.getOriginal().then(function (response) {
            console.log("Response for original: ", response);
            var original = $("#open-original").show().off("click");
            var id = response.result.value;
            original.removeClass("hidden");
            original.click(function () {
              window.open(window.APP_BASE_URL + "/editor#program=" + id, "_blank");
            });
          });
        });
      } else {
        programLoad = null;
      }
      if (programLoad) {
        programLoad.fail(function (err) {
          console.error(err);
          window.stickError("The program failed to load.");
        });
        return programLoad;
      } else {
        return null;
      }
    })["catch"](function (e) {
      console.error("storageAPI failed to load, proceeding without saving programs: ", e);
      return null;
    });
  }
  function setTitle(progName) {
    document.title = progName + " - " + "code.pyret.org";
    $("#showFilename").text("File: " + progName);
  }
  CPO.setTitle = setTitle;
  var filename = false;
  $("#download a").click(function () {
    var downloadElt = $("#download a");
    var contents = CPO.editor.cm.getValue();
    var downloadBlob = window.URL.createObjectURL(new Blob([contents], {
      type: 'text/plain'
    }));
    if (!filename) {
      filename = 'untitled_program.arr';
    }
    if (filename.indexOf(".arr") !== filename.length - 4) {
      filename += ".arr";
    }
    downloadElt.attr({
      download: filename,
      href: downloadBlob
    });
    $("#download").append(downloadElt);
  });
  function showModal(currentContext) {
    function drawElement(input) {
      var element = $("<div>");
      var greeting = $("<p>");
      var shared = $("<tt>shared-gdrive(...)</tt>");
      var currentContextElt = $("<tt>" + currentContext + "</tt>");
      greeting.append("Enter the context to use for the program, or choose “Cancel” to keep the current context of ", currentContextElt, ".");
      var essentials = $("<tt>starter2024</tt>");
      var list = $("<ul>").append($("<li>").append("The default is ", essentials, ".")).append($("<li>").append("You might use something like ", shared, " if one was provided as part of a course."));
      element.append(greeting);
      element.append($("<p>").append(list));
      var useContext = $("<tt>use context</tt>").css({
        'flex-grow': '0',
        'padding-right': '1em'
      });
      var inputWrapper = $("<div>").append(input).css({
        'flex-grow': '1'
      });
      var entry = $("<div>").css({
        display: 'flex',
        'flex-direction': 'row',
        'justify-content': 'flex-start',
        'align-items': 'baseline'
      });
      entry.append(useContext).append(inputWrapper);
      element.append(entry);
      return element;
    }
    var namespaceResult = new modalPrompt({
      title: "Choose a Context",
      style: "text",
      options: [{
        drawElement: drawElement,
        submitText: "Change Namespace",
        defaultValue: currentContext
      }]
    });
    namespaceResult.show(function (result) {
      if (!result) {
        return;
      }
      CPO.editor.setContextLine("use context " + result.trim() + "\n");
    });
  }
  $("#choose-context").on("click", function () {
    var firstLine = CPO.editor.cm.getLine(0);
    var contextLen = firstLine.match(CONTEXT_PREFIX);
    showModal(contextLen === null ? "" : firstLine.slice(contextLen[0].length));
  });
  var TRUNCATE_LENGTH = 20;
  function truncateName(name) {
    if (name.length <= TRUNCATE_LENGTH + 1) {
      return name;
    }
    return name.slice(0, TRUNCATE_LENGTH / 2) + "…" + name.slice(name.length - TRUNCATE_LENGTH / 2, name.length);
  }
  function updateName(p) {
    filename = p.getName();
    $("#filename").text(" (" + truncateName(filename) + ")");
    $("#filename").attr('title', filename);
    setTitle(filename);
    showShareContainer(p);
  }
  function loadProgram(p) {
    programToSave = p;
    return p.then(function (prog) {
      if (prog !== null) {
        updateName(prog);
        if (prog.shared) {
          window.stickMessage("You are viewing a shared program. Any changes you make will not be saved. You can use File -> Save a copy to save your own version with any edits you make.");
        }
        return prog.getContents();
      } else {
        if (params["get"]["editorContents"] && !(params["get"]["program"] || params["get"]["share"])) {
          return params["get"]["editorContents"];
        } else {
          return CONTEXT_FOR_NEW_FILES;
        }
      }
    });
  }
  function say(msg, forget) {
    if (msg === "") return;
    var announcements = document.getElementById("announcementlist");
    var li = document.createElement("LI");
    li.appendChild(document.createTextNode(msg));
    announcements.insertBefore(li, announcements.firstChild);
    if (forget) {
      setTimeout(function () {
        announcements.removeChild(li);
      }, 1000);
    }
  }
  function sayAndForget(msg) {
    console.log('doing sayAndForget', msg);
    say(msg, true);
  }
  function cycleAdvance(currIndex, maxIndex, reverseP) {
    var nextIndex = currIndex + (reverseP ? -1 : +1);
    nextIndex = (nextIndex % maxIndex + maxIndex) % maxIndex;
    return nextIndex;
  }
  function populateFocusCarousel(editor) {
    if (!editor.focusCarousel) {
      editor.focusCarousel = [];
    }
    var fc = editor.focusCarousel;
    var docmain = document.getElementById("main");
    if (!fc[0]) {
      var toolbar = document.getElementById('Toolbar');
      fc[0] = toolbar;
      //fc[0] = document.getElementById("headeronelegend");
      //getTopTierMenuitems();
      //fc[0] = document.getElementById('bonniemenubutton');
    }
    if (!fc[1]) {
      var docreplMain = docmain.getElementsByClassName("replMain");
      var docreplMain0;
      if (docreplMain.length === 0) {
        docreplMain0 = undefined;
      } else if (docreplMain.length === 1) {
        docreplMain0 = docreplMain[0];
      } else {
        for (var i = 0; i < docreplMain.length; i++) {
          if (docreplMain[i].innerText !== "") {
            docreplMain0 = docreplMain[i];
          }
        }
      }
      fc[1] = docreplMain0;
    }
    if (!fc[2]) {
      var docrepl = docmain.getElementsByClassName("repl");
      var docreplcode = docrepl[0].getElementsByClassName("prompt-container")[0].getElementsByClassName("CodeMirror")[0];
      fc[2] = docreplcode;
    }
    if (!fc[3]) {
      fc[3] = document.getElementById("announcements");
    }
  }
  function cycleFocus(reverseP) {
    //console.log('doing cycleFocus', reverseP);
    var editor = this.editor;
    populateFocusCarousel(editor);
    var fCarousel = editor.focusCarousel;
    var maxIndex = fCarousel.length;
    var currentFocusedElt = fCarousel.find(function (node) {
      if (!node) {
        return false;
      } else {
        return node.contains(document.activeElement);
      }
    });
    var currentFocusIndex = fCarousel.indexOf(currentFocusedElt);
    var nextFocusIndex = currentFocusIndex;
    var focusElt;
    do {
      nextFocusIndex = cycleAdvance(nextFocusIndex, maxIndex, reverseP);
      focusElt = fCarousel[nextFocusIndex];
      //console.log('trying focusElt', focusElt);
    } while (!focusElt);
    var focusElt0;
    if (focusElt.classList.contains('toolbarregion')) {
      //console.log('settling on toolbar region')
      getTopTierMenuitems();
      focusElt0 = document.getElementById('bonniemenubutton');
    } else if (focusElt.classList.contains("replMain") || focusElt.classList.contains("CodeMirror")) {
      //console.log('settling on defn window')
      var textareas = focusElt.getElementsByTagName("textarea");
      //console.log('txtareas=', textareas)
      //console.log('txtarea len=', textareas.length)
      if (textareas.length === 0) {
        //console.log('I')
        focusElt0 = focusElt;
      } else if (textareas.length === 1) {
        //console.log('settling on inter window')
        focusElt0 = textareas[0];
      } else {
        //console.log('settling on defn window')
        /*
        for (var i = 0; i < textareas.length; i++) {
          if (textareas[i].getAttribute('tabIndex')) {
            focusElt0 = textareas[i];
          }
        }
        */
        focusElt0 = textareas[textareas.length - 1];
        focusElt0.removeAttribute('tabIndex');
      }
    } else {
      //console.log('settling on announcement region', focusElt)
      focusElt0 = focusElt;
    }
    document.activeElement.blur();
    focusElt0.click();
    focusElt0.focus();
    //console.log('(cf)docactelt=', document.activeElement);
  }
  var programLoaded = loadProgram(initialProgram);
  var programToSave = initialProgram;
  function showShareContainer(p) {
    //console.log('called showShareContainer');
    if (!p.shared) {
      $("#shareContainer").empty();
      $('#publishli').show();
      $("#shareContainer").append(shareAPI.makeShareLink(p));
      getTopTierMenuitems();
    }
  }
  function nameOrUntitled() {
    return filename || "Untitled";
  }
  function autoSave() {
    programToSave.then(function (p) {
      if (p !== null && !p.shared) {
        save();
      }
    });
  }
  function enableFileOptions() {
    $("#filemenuContents *").removeClass("disabled");
  }
  function menuItemDisabled(id) {
    return $("#" + id).hasClass("disabled");
  }
  function newEvent(e) {
    window.open(window.APP_BASE_URL + "/editor");
  }
  function saveEvent(e) {
    if (menuItemDisabled("save")) {
      return;
    }
    return save();
  }

  /*
    save : string (optional) -> undef
     If a string argument is provided, create a new file with that name and save
    the editor contents in that file.
     If no filename is provided, save the existing file referenced by the editor
    with the current editor contents.  If no filename has been set yet, just
    set the name to "Untitled".
   */
  function save(newFilename) {
    var useName, create;
    if (newFilename !== undefined) {
      useName = newFilename;
      create = true;
    } else if (filename === false) {
      filename = "Untitled";
      create = true;
    } else {
      useName = filename; // A closed-over variable
      create = false;
    }
    window.stickMessage("Saving...");
    var savedProgram = programToSave.then(function (p) {
      if (p !== null && p.shared && !create) {
        return p; // Don't try to save shared files
      }
      if (create) {
        programToSave = storageAPI.then(function (api) {
          return api.createFile(useName);
        }).then(function (p) {
          // showShareContainer(p); TODO(joe): figure out where to put this
          history.pushState(null, null, "#program=" + p.getUniqueId());
          updateName(p); // sets filename
          enableFileOptions();
          return p;
        });
        return programToSave.then(function (p) {
          return save();
        });
      } else {
        return programToSave.then(function (p) {
          if (p === null) {
            return null;
          } else {
            return p.save(CPO.editor.cm.getValue(), false);
          }
        }).then(function (p) {
          if (p !== null) {
            window.flashMessage("Program saved as " + p.getName());
          }
          return p;
        });
      }
    });
    savedProgram.fail(function (err) {
      window.stickError("Unable to save", "Your internet connection may be down, or something else might be wrong with this site or saving to Google.  You should back up any changes to this program somewhere else.  You can try saving again to see if the problem was temporary, as well.");
      console.error(err);
    });
    return savedProgram;
  }
  function saveAs() {
    if (menuItemDisabled("saveas")) {
      return;
    }
    programToSave.then(function (p) {
      var name = p === null ? "Untitled" : p.getName();
      var saveAsPrompt = new modalPrompt({
        title: "Save a copy",
        style: "text",
        submitText: "Save",
        narrow: true,
        options: [{
          message: "The name for the copy:",
          defaultValue: name
        }]
      });
      return saveAsPrompt.show().then(function (newName) {
        if (newName === null) {
          return null;
        }
        window.stickMessage("Saving...");
        return save(newName);
      }).fail(function (err) {
        console.error("Failed to rename: ", err);
        window.flashError("Failed to rename file");
      });
    });
  }
  function rename() {
    programToSave.then(function (p) {
      var renamePrompt = new modalPrompt({
        title: "Rename this file",
        style: "text",
        narrow: true,
        submitText: "Rename",
        options: [{
          message: "The new name for the file:",
          defaultValue: p.getName()
        }]
      });
      // null return values are for the "cancel" path
      return renamePrompt.show().then(function (newName) {
        if (newName === null) {
          return null;
        }
        window.stickMessage("Renaming...");
        programToSave = p.rename(newName);
        return programToSave;
      }).then(function (p) {
        if (p === null) {
          return null;
        }
        updateName(p);
        window.flashMessage("Program saved as " + p.getName());
      }).fail(function (err) {
        console.error("Failed to rename: ", err);
        window.flashError("Failed to rename file");
      });
    }).fail(function (err) {
      console.error("Unable to rename: ", err);
    });
  }
  $("#runButton").click(function () {
    CPO.autoSave();
  });
  $("#new").click(newEvent);
  $("#save").click(saveEvent);
  $("#rename").click(rename);
  $("#saveas").click(saveAs);
  var focusableElts = $(document).find('#header .focusable');
  //console.log('focusableElts=', focusableElts)
  var theToolbar = $(document).find('#Toolbar');
  function getTopTierMenuitems() {
    //console.log('doing getTopTierMenuitems')
    var topTierMenuitems = $(document).find('#header ul li.topTier').toArray();
    topTierMenuitems = topTierMenuitems.filter(function (elt) {
      return !(elt.style.display === 'none' || elt.getAttribute('disabled') === 'disabled');
    });
    var numTopTierMenuitems = topTierMenuitems.length;
    for (var i = 0; i < numTopTierMenuitems; i++) {
      var ithTopTierMenuitem = topTierMenuitems[i];
      var iChild = $(ithTopTierMenuitem).children().first();
      //console.log('iChild=', iChild);
      iChild.find('.focusable').attr('aria-setsize', numTopTierMenuitems.toString()).attr('aria-posinset', (i + 1).toString());
    }
    return topTierMenuitems;
  }
  function updateEditorHeight() {
    var toolbarHeight = document.getElementById('topTierUl').offsetHeight;
    // gets bumped to 67 on initial resize perturbation, but actual value is indeed 40
    if (toolbarHeight < 80) toolbarHeight = 40;
    toolbarHeight += 'px';
    document.getElementById('REPL').style.paddingTop = toolbarHeight;
    var docMain = document.getElementById('main');
    var docReplMain = docMain.getElementsByClassName('replMain');
    if (docReplMain.length !== 0) {
      docReplMain[0].style.paddingTop = toolbarHeight;
    }
  }
  $(window).on('resize', updateEditorHeight);
  function insertAriaPos(submenu) {
    //console.log('doing insertAriaPos', submenu)
    var arr = submenu.toArray();
    //console.log('arr=', arr);
    var len = arr.length;
    for (var i = 0; i < len; i++) {
      var elt = arr[i];
      //console.log('elt', i, '=', elt);
      elt.setAttribute('aria-setsize', len.toString());
      elt.setAttribute('aria-posinset', (i + 1).toString());
    }
  }
  document.addEventListener('click', function () {
    hideAllTopMenuitems();
  });
  theToolbar.click(function (e) {
    e.stopPropagation();
  });
  theToolbar.keydown(function (e) {
    //console.log('toolbar keydown', e);
    //most any key at all
    var kc = e.keyCode;
    if (kc === 27) {
      // escape
      hideAllTopMenuitems();
      //console.log('calling cycleFocus from toolbar')
      CPO.cycleFocus();
      e.stopPropagation();
    } else if (kc === 9 || kc === 37 || kc === 38 || kc === 39 || kc === 40) {
      // an arrow
      var target = $(this).find('[tabIndex=-1]');
      getTopTierMenuitems();
      document.activeElement.blur(); //needed?
      target.first().focus(); //needed?
      //console.log('docactelt=', document.activeElement);
      e.stopPropagation();
    } else {
      hideAllTopMenuitems();
    }
  });
  function clickTopMenuitem(e) {
    hideAllTopMenuitems();
    var thisElt = $(this);
    //console.log('doing clickTopMenuitem on', thisElt);
    var topTierUl = thisElt.closest('ul[id=topTierUl]');
    if (thisElt[0].hasAttribute('aria-hidden')) {
      return;
    }
    if (thisElt[0].getAttribute('disabled') === 'disabled') {
      return;
    }
    //var hiddenP = (thisElt[0].getAttribute('aria-expanded') === 'false');
    //hiddenP always false?
    var thisTopMenuitem = thisElt.closest('li.topTier');
    //console.log('thisTopMenuitem=', thisTopMenuitem);
    var t1 = thisTopMenuitem[0];
    var submenuOpen = thisElt[0].getAttribute('aria-expanded') === 'true';
    if (!submenuOpen) {
      //console.log('hiddenp true branch');
      hideAllTopMenuitems();
      thisTopMenuitem.children('ul.submenu').attr('aria-hidden', 'false').show();
      thisTopMenuitem.children().first().find('[aria-expanded]').attr('aria-expanded', 'true');
    } else {
      //console.log('hiddenp false branch');
      thisTopMenuitem.children('ul.submenu').attr('aria-hidden', 'true').hide();
      thisTopMenuitem.children().first().find('[aria-expanded]').attr('aria-expanded', 'false');
    }
    e.stopPropagation();
  }
  var expandableElts = $(document).find('#header [aria-expanded]');
  expandableElts.click(clickTopMenuitem);
  function hideAllTopMenuitems() {
    //console.log('doing hideAllTopMenuitems');
    var topTierUl = $(document).find('#header ul[id=topTierUl]');
    topTierUl.find('[aria-expanded]').attr('aria-expanded', 'false');
    topTierUl.find('ul.submenu').attr('aria-hidden', 'true').hide();
  }
  var nonexpandableElts = $(document).find('#header .topTier > div > button:not([aria-expanded])');
  nonexpandableElts.click(hideAllTopMenuitems);
  function switchTopMenuitem(destTopMenuitem, destElt) {
    //console.log('doing switchTopMenuitem', destTopMenuitem, destElt);
    //console.log('dtmil=', destTopMenuitem.length);
    hideAllTopMenuitems();
    if (destTopMenuitem && destTopMenuitem.length !== 0) {
      var elt = destTopMenuitem[0];
      var eltId = elt.getAttribute('id');
      destTopMenuitem.children('ul.submenu').attr('aria-hidden', 'false').show();
      destTopMenuitem.children().first().find('[aria-expanded]').attr('aria-expanded', 'true');
    }
    if (destElt) {
      //destElt.attr('tabIndex', '0').focus();
      destElt.focus();
    }
  }
  var showingHelpKeys = false;
  function showHelpKeys() {
    showingHelpKeys = true;
    $('#help-keys').fadeIn(100);
    reciteHelp();
  }
  focusableElts.keydown(function (e) {
    //console.log('focusable elt keydown', e);
    var kc = e.keyCode;
    //$(this).blur(); // Delete?
    var withinSecondTierUl = true;
    var topTierUl = $(this).closest('ul[id=topTierUl]');
    var secondTierUl = $(this).closest('ul.submenu');
    if (secondTierUl.length === 0) {
      withinSecondTierUl = false;
    }
    if (kc === 27) {
      //console.log('escape pressed i')
      $('#help-keys').fadeOut(500);
    }
    if (kc === 27 && withinSecondTierUl) {
      // escape
      var destTopMenuitem = $(this).closest('li.topTier');
      var possElts = destTopMenuitem.find('.focusable:not([disabled])').filter(':visible');
      switchTopMenuitem(destTopMenuitem, possElts.first());
      e.stopPropagation();
    } else if (kc === 39) {
      // rightarrow
      //console.log('rightarrow pressed');
      var srcTopMenuitem = $(this).closest('li.topTier');
      //console.log('srcTopMenuitem=', srcTopMenuitem);
      srcTopMenuitem.children().first().find('.focusable').attr('tabIndex', '-1');
      var topTierMenuitems = getTopTierMenuitems();
      //console.log('ttmi* =', topTierMenuitems);
      var ttmiN = topTierMenuitems.length;
      var j = topTierMenuitems.indexOf(srcTopMenuitem[0]);
      //console.log('j initial=', j);
      for (var i = (j + 1) % ttmiN; i !== j; i = (i + 1) % ttmiN) {
        var destTopMenuitem = $(topTierMenuitems[i]);
        //console.log('destTopMenuitem(a)=', destTopMenuitem);
        var possElts = destTopMenuitem.find('.focusable:not([disabled])').filter(':visible');
        //console.log('possElts=', possElts)
        if (possElts.length > 0) {
          //console.log('final i=', i);
          //console.log('landing on', possElts.first());
          switchTopMenuitem(destTopMenuitem, possElts.first());
          e.stopPropagation();
          break;
        }
      }
    } else if (kc === 37) {
      // leftarrow
      //console.log('leftarrow pressed');
      var srcTopMenuitem = $(this).closest('li.topTier');
      //console.log('srcTopMenuitem=', srcTopMenuitem);
      srcTopMenuitem.children().first().find('.focusable').attr('tabIndex', '-1');
      var topTierMenuitems = getTopTierMenuitems();
      //console.log('ttmi* =', topTierMenuitems);
      var ttmiN = topTierMenuitems.length;
      var j = topTierMenuitems.indexOf(srcTopMenuitem[0]);
      //console.log('j initial=', j);
      for (var i = (j + ttmiN - 1) % ttmiN; i !== j; i = (i + ttmiN - 1) % ttmiN) {
        var destTopMenuitem = $(topTierMenuitems[i]);
        //console.log('destTopMenuitem(b)=', destTopMenuitem);
        //console.log('i=', i)
        var possElts = destTopMenuitem.find('.focusable:not([disabled])').filter(':visible');
        //console.log('possElts=', possElts)
        if (possElts.length > 0) {
          //console.log('final i=', i);
          //console.log('landing on', possElts.first());
          switchTopMenuitem(destTopMenuitem, possElts.first());
          e.stopPropagation();
          break;
        }
      }
    } else if (kc === 38) {
      // uparrow
      //console.log('uparrow pressed');
      var submenu;
      if (withinSecondTierUl) {
        var nearSibs = $(this).closest('div').find('.focusable').filter(':visible');
        //console.log('nearSibs=', nearSibs);
        var myId = $(this)[0].getAttribute('id');
        //console.log('myId=', myId);
        submenu = $([]);
        var thisEncountered = false;
        for (var i = nearSibs.length - 1; i >= 0; i--) {
          if (thisEncountered) {
            //console.log('adding', nearSibs[i]);
            submenu = submenu.add($(nearSibs[i]));
          } else if (nearSibs[i].getAttribute('id') === myId) {
            thisEncountered = true;
          }
        }
        //console.log('submenu so far=', submenu);
        var farSibs = $(this).closest('li').prevAll().find('div:not(.disabled)').find('.focusable').filter(':visible');
        submenu = submenu.add(farSibs);
        if (submenu.length === 0) {
          submenu = $(this).closest('li').closest('ul').find('div:not(.disabled)').find('.focusable').filter(':visible').last();
        }
        if (submenu.length > 0) {
          submenu.last().focus();
        } else {
          /*
          //console.log('no actionable submenu found')
          var topmenuItem = $(this).closest('ul.submenu').closest('li')
          .children().first().find('.focusable:not([disabled])').filter(':visible');
          if (topmenuItem.length > 0) {
            topmenuItem.first().focus();
          } else {
            //console.log('no actionable topmenuitem found either')
          }
          */
        }
      }
      e.stopPropagation();
    } else if (kc === 40) {
      // downarrow
      //console.log('downarrow pressed');
      var submenuDivs;
      var submenu;
      if (!withinSecondTierUl) {
        //console.log('1st tier')
        submenuDivs = $(this).closest('li').children('ul').find('div:not(.disabled)');
        submenu = submenuDivs.find('.focusable').filter(':visible');
        insertAriaPos(submenu);
      } else {
        //console.log('2nd tier')
        var nearSibs = $(this).closest('div').find('.focusable').filter(':visible');
        //console.log('nearSibs=', nearSibs);
        var myId = $(this)[0].getAttribute('id');
        //console.log('myId=', myId);
        submenu = $([]);
        var thisEncountered = false;
        for (var i = 0; i < nearSibs.length; i++) {
          if (thisEncountered) {
            //console.log('adding', nearSibs[i]);
            submenu = submenu.add($(nearSibs[i]));
          } else if (nearSibs[i].getAttribute('id') === myId) {
            thisEncountered = true;
          }
        }
        //console.log('submenu so far=', submenu);
        var farSibs = $(this).closest('li').nextAll().find('div:not(.disabled)').find('.focusable').filter(':visible');
        submenu = submenu.add(farSibs);
        if (submenu.length === 0) {
          submenu = $(this).closest('li').closest('ul').find('div:not(.disabled)').find('.focusable').filter(':visible');
        }
      }
      //console.log('submenu=', submenu)
      if (submenu.length > 0) {
        submenu.first().focus();
      } else {
        //console.log('no actionable submenu found')
      }
      e.stopPropagation();
    } else if (kc === 27) {
      //console.log('esc pressed');
      hideAllTopMenuitems();
      if (showingHelpKeys) {
        showingHelpKeys = false;
      } else {
        //console.log('calling cycleFocus ii')
        CPO.cycleFocus();
      }
      e.stopPropagation();
      e.preventDefault();
      //$(this).closest('nav').closest('main').focus();
    } else if (kc === 9) {
      if (e.shiftKey) {
        hideAllTopMenuitems();
        CPO.cycleFocus(true);
      }
      e.stopPropagation();
      e.preventDefault();
    } else if (kc === 13 || kc === 17 || kc === 20 || kc === 32) {
      // 13=enter 17=ctrl 20=capslock 32=space
      //console.log('stopprop 1')
      e.stopPropagation();
    } else if (kc >= 112 && kc <= 123) {
      //console.log('doprop 1')
      // fn keys
      // go ahead, propagate
    } else if (e.ctrlKey && kc === 191) {
      //console.log('C-? pressed')
      showHelpKeys();
      e.stopPropagation();
    } else {
      //console.log('stopprop 2')
      e.stopPropagation();
    }
    //e.stopPropagation();
  });

  // shareAPI.makeHoverMenu($("#filemenu"), $("#filemenuContents"), false, function(){});
  // shareAPI.makeHoverMenu($("#bonniemenu"), $("#bonniemenuContents"), false, function(){});

  var codeContainer = $("<div>").addClass("replMain");
  codeContainer.attr("role", "region").attr("aria-label", "Definitions");
  //attr("tabIndex", "-1");
  $("#main").prepend(codeContainer);
  if (params["get"]["hideDefinitions"]) {
    $(".replMain").attr("aria-hidden", true).attr("tabindex", '-1');
  }
  var isControlled = params["get"]["controlled"];
  var hasWarnOnExit = "warnOnExit" in params["get"];
  var skipWarning = hasWarnOnExit && params["get"]["warnOnExit"] === "false";
  if (!isControlled && !skipWarning) {
    $(window).bind("beforeunload", function () {
      return "Because this page can load slowly, and you may have outstanding changes, we ask that you confirm before leaving the editor in case closing was an accident.";
    });
  }
  CPO.editor = CPO.makeEditor(codeContainer, {
    runButton: $("#runButton"),
    simpleEditor: false,
    run: CPO.RUN_CODE,
    initialGas: 100,
    scrollPastEnd: true
  });
  CPO.editor.cm.setOption("readOnly", "nocursor");
  CPO.editor.cm.setOption("longLines", new Map());
  function removeShortenedLine(lineHandle) {
    var rulers = CPO.editor.cm.getOption("rulers");
    var rulersMinCol = CPO.editor.cm.getOption("rulersMinCol");
    var longLines = CPO.editor.cm.getOption("longLines");
    if (lineHandle.text.length <= rulersMinCol) {
      lineHandle.rulerListeners.forEach(function (f, evt) {
        return lineHandle.off(evt, f);
      });
      longLines["delete"](lineHandle);
      // console.log("Removed ", lineHandle);
      refreshRulers();
    }
  }
  function deleteLine(lineHandle) {
    var longLines = CPO.editor.cm.getOption("longLines");
    lineHandle.rulerListeners.forEach(function (f, evt) {
      return lineHandle.off(evt, f);
    });
    longLines["delete"](lineHandle);
    // console.log("Removed ", lineHandle);
    refreshRulers();
  }
  function refreshRulers() {
    var rulers = CPO.editor.cm.getOption("rulers");
    var longLines = CPO.editor.cm.getOption("longLines");
    var minLength;
    if (longLines.size === 0) {
      minLength = 0; // if there are no long lines, then we don't care about showing any rulers
    } else {
      minLength = Number.MAX_VALUE;
      longLines.forEach(function (lineNo, lineHandle) {
        if (lineHandle.text.length < minLength) {
          minLength = lineHandle.text.length;
        }
      });
    }
    for (var i = 0; i < rulers.length; i++) {
      if (rulers[i].column >= minLength) {
        rulers[i].className = "hidden";
      } else {
        rulers[i].className = undefined;
      }
    }
    // gotta set the option twice, or else CM short-circuits and ignores it
    CPO.editor.cm.setOption("rulers", undefined);
    CPO.editor.cm.setOption("rulers", rulers);
  }
  CPO.editor.cm.on('changes', function (instance, changeObjs) {
    var minLine = instance.lastLine(),
      maxLine = 0;
    var rulersMinCol = instance.getOption("rulersMinCol");
    var longLines = instance.getOption("longLines");
    changeObjs.forEach(function (change) {
      if (minLine > change.from.line) {
        minLine = change.from.line;
      }
      if (maxLine < change.from.line + change.text.length) {
        maxLine = change.from.line + change.text.length;
      }
    });
    var changed = false;
    instance.eachLine(minLine, maxLine, function (lineHandle) {
      if (lineHandle.text.length > rulersMinCol) {
        if (!longLines.has(lineHandle)) {
          changed = true;
          longLines.set(lineHandle, lineHandle.lineNo());
          lineHandle.rulerListeners = new Map([["change", removeShortenedLine], ["delete", function () {
            // needed because the delete handler gets no arguments at all
            deleteLine(lineHandle);
          }]]);
          lineHandle.rulerListeners.forEach(function (f, evt) {
            return lineHandle.on(evt, f);
          });
          // console.log("Added ", lineHandle);
        }
      } else {
        if (longLines.has(lineHandle)) {
          changed = true;
          longLines["delete"](lineHandle);
          // console.log("Removed ", lineHandle);
        }
      }
    });
    if (changed) {
      refreshRulers();
    }
  });
  programLoaded.then(function (c) {
    CPO.documents.set("definitions://", CPO.editor.cm.getDoc());
    if (c === "") {
      c = CONTEXT_FOR_NEW_FILES;
    }
    if (c.startsWith("<scriptsonly")) {
      // this is blocks file. Open it with /blocks
      window.location.href = window.location.href.replace('editor', 'blocks');
    }
    if (!params["get"]["controlled"]) {
      // NOTE(joe): Clearing history to address https://github.com/brownplt/pyret-lang/issues/386,
      // in which undo can revert the program back to empty
      CPO.editor.cm.setValue(c);
      CPO.editor.cm.clearHistory();
    } else {
      var hideWhenControlled = ["#logging", "#logout"];
      var removeWhenControlled = ["#connectButtonli"];
      hideWhenControlled.forEach(function (s) {
        return $(s).hide();
      });
      removeWhenControlled.forEach(function (s) {
        return $(s).remove();
      });
    }

    // Standalone boot settles here; a host-fed editor settles at the end of
    // events.js reset() instead (see EXPECTS_HOST_RESET above).
    if (!window.EXPECTS_HOST_RESET) {
      window.EDITOR_CONTENTS_SETTLED = true;
    }
  });
  programLoaded.fail(function (error) {
    console.error("Program contents did not load: ", error);
    CPO.documents.set("definitions://", CPO.editor.cm.getDoc());
  });
  console.log("About to load Pyret: ", originalPageLoad, Date.now());
  var pyretLoad = document.createElement('script');
  console.log(window.PYRET);
  pyretLoad.type = "text/javascript";
  pyretLoad.setAttribute("crossorigin", "anonymous");
  var pyretLoad2 = document.createElement('script');

  /*
    Fetch a .gz.js asset and hand back a Blob of runnable JavaScript.
     Those assets are gzip bytes at rest, and hosts disagree about how to serve
    them. A static or webview host sends them verbatim -- that is the whole
    reason PYRET_GZIPPED exists, since nothing inflates them for us. A host
    that knows the convention (code.pyret.org's own server has explicit routes
    for exactly these four files) sends Content-Encoding: gzip instead, and by
    the time fetch resolves the browser has already inflated the body.
    Inflating unconditionally turns that second case into "Failed to fetch",
    which is what serving editor.embed.html from the CPO server used to do.
     So look at the bytes rather than trusting either convention: a gzip member
    starts with 0x1f 0x8b, and JavaScript source does not. Buffering the body
    to check costs the compressed size (~3MB for the jarr) and gives up
    overlapping the download with the inflate; that is worth being able to
    serve this page from any host.
  */
  function fetchScriptBlob(url) {
    return fetch(url).then(function (resp) {
      if (!resp.ok) {
        throw new Error("status " + resp.status);
      }
      return resp.arrayBuffer();
    }).then(function (buf) {
      var head = new Uint8Array(buf, 0, Math.min(2, buf.byteLength));
      if (!(head.length === 2 && head[0] === 0x1f && head[1] === 0x8b)) {
        // Already plain JavaScript: this host decoded it for us.
        return new Blob([buf], {
          type: "application/javascript"
        });
      }
      return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"))).blob();
    });
  }
  if (window.PYRET_GZIPPED) {
    // The runtime bundle is gzipped and this host serves it WITHOUT an
    // executable MIME type (e.g. a vscode webview whose resources come from
    // Open VSX / the GitLab Web IDE). fetch ignores script MIME, so pull the
    // .gz.js, inflate it in-page if the host has not already (see
    // fetchScriptBlob), and run it from a Blob URL. The `error` handler
    // registered below (synchronously) fires before this async append
    // resolves.
    //
    // In the ts and interp flavors the compiler bundle has the same MIME
    // problem (its <script src> in editor.html is skipped under
    // PYRET_GZIPPED) and is the same gzip-at-rest asset
    // (ts-compiler.gz.js) -- so fetch and Blob-execute it FIRST: the jarr
    // expects window.PyretTSCompiler, matching the synchronous script order
    // of the un-gzipped page.
    var tsCompilerLoad = Promise.resolve();
    if (window.CPO_USES_TS_ASSETS && window.PYRET_TS_COMPILER) {
      tsCompilerLoad = fetchScriptBlob(window.PYRET_TS_COMPILER).then(function (blob) {
        return new Promise(function (resolve, reject) {
          var tsLoad = document.createElement('script');
          tsLoad.onload = resolve;
          tsLoad.onerror = function () {
            reject(new Error("executing ts-compiler bundle failed"));
          };
          tsLoad.src = URL.createObjectURL(new Blob([blob], {
            type: "application/javascript"
          }));
          document.body.appendChild(tsLoad);
        });
      });
    }
    tsCompilerLoad.then(function () {
      return fetchScriptBlob(window.PYRET);
    }).then(function (blob) {
      pyretLoad.src = URL.createObjectURL(new Blob([blob], {
        type: "application/javascript"
      }));
      document.body.appendChild(pyretLoad);
    })["catch"](function (e) {
      logFailureAndManualFetch(window.PYRET, e);
      loadBackupPyret("fetching/decompressing " + window.PYRET + " failed: " + e.message);
    });
  } else {
    pyretLoad.src = window.PYRET;
    document.body.appendChild(pyretLoad);
  }

  // The page's terminal state: neither the runtime bundle nor its backup is
  // coming. Alongside the user-facing banner, say WHY on the console -- in a
  // vscode webview there is no logging server behind logger.log, so the
  // console line is the only diagnostic that survives (and the browser-test
  // harness now records it).
  function terminalPyretLoadFailure(detail) {
    console.error("Pyret failed to load: " + detail);
    $("#loader").hide();
    $("#runPart").hide();
    $("#breakButton").hide();
    window.stickError("Pyret failed to load; check your connection or try refreshing the page.  If this happens repeatedly, please report it as a bug.  (" + detail + ")");
  }
  function loadBackupPyret(primaryDetail) {
    console.error("Pyret runtime bundle failed to load: " + primaryDetail);
    // Builds without a configured PYRET_BACKUP (the vscode webview, anything
    // built without the env var) used to assign it anyway, so the browser
    // requested a literal "undefined" -- an instant 404 whose error event
    // replaced the primary failure's story. No backup: go straight to the
    // terminal state, carrying the reason the primary died.
    if (false) // removed by dead control flow
{} else {
      terminalPyretLoadFailure(primaryDetail);
    }
  }
  function logFailureAndManualFetch(url, e) {
    // NOTE(joe): The error reported by the "error" event has essentially no
    // information on it; it's just a notification that _something_ went wrong.
    // So, we log that something happened, then immediately do an AJAX request
    // call for the same URL, to see if we can get more information. This
    // doesn't perfectly tell us about the original failure, but it's
    // something.

    // In addition, if someone is seeing the Pyret failed to load error, but we
    // don't get these logging events, we have a strong hint that something is
    // up with their network.
    logger.log('pyret-load-failure', {
      event: 'initial-failure',
      url: url,
      // The timestamp appears to count from the beginning of page load,
      // which may approximate download time if, say, requests are timing out
      // or getting cut off.

      timeStamp: e.timeStamp
    });
    var manualFetch = $.ajax(url);
    manualFetch.then(function (res) {
      // Here, we log the first 100 characters of the response to make sure
      // they resemble the Pyret blob
      logger.log('pyret-load-failure', {
        event: 'success-with-ajax',
        contentsPrefix: res.slice(0, 100)
      });
    });
    manualFetch.fail(function (res) {
      logger.log('pyret-load-failure', {
        event: 'failure-with-ajax',
        status: res.status,
        statusText: res.statusText,
        // Since responseText could be a long error page, and we don't want to
        // log huge pages, we slice it to 100 characters, which is enough to
        // tell us what's going on (e.g. AWS failure, network outage).
        responseText: res.responseText.slice(0, 100)
      });
    });
  }
  $(pyretLoad).on("error", function (e) {
    logFailureAndManualFetch(window.PYRET, e);
    loadBackupPyret("the script tag for " + window.PYRET + " fired its error event");
  });
  $(pyretLoad2).on("error", function (e) {
    terminalPyretLoadFailure("the backup bundle " + undefined + " also failed");
    logFailureAndManualFetch(undefined, e);
  });
  window.addEventListener("focus", function (e) {
    if (activeEditor) {
      activeEditor.focus();
    }
  });
  function makeEvent() {
    var handlers = [];
    function on(handler) {
      handlers.push(handler);
    }
    function trigger(v) {
      handlers.forEach(function (h) {
        return h(v);
      });
    }
    return [on, trigger];
  }
  var _makeEvent = makeEvent(),
    _makeEvent2 = _slicedToArray(_makeEvent, 2),
    onRun = _makeEvent2[0],
    triggerOnRun = _makeEvent2[1];
  var _makeEvent3 = makeEvent(),
    _makeEvent4 = _slicedToArray(_makeEvent3, 2),
    onInteraction = _makeEvent4[0],
    triggerOnInteraction = _makeEvent4[1];
  var _makeEvent5 = makeEvent(),
    _makeEvent6 = _slicedToArray(_makeEvent5, 2),
    onLoad = _makeEvent6[0],
    triggerOnLoad = _makeEvent6[1];
  programLoaded.fin(function () {
    CPO.editor.focus();
    CPO.editor.cm.setOption("readOnly", false);
  });
  CPO.autoSave = autoSave;
  CPO.save = save;
  CPO.updateName = updateName;
  CPO.showShareContainer = showShareContainer;
  CPO.loadProgram = loadProgram;
  CPO.storageAPI = storageAPI;
  CPO.cycleFocus = cycleFocus;
  CPO.say = say;
  CPO.sayAndForget = sayAndForget;
  CPO.events = {
    onRun: onRun,
    triggerOnRun: triggerOnRun,
    onInteraction: onInteraction,
    triggerOnInteraction: triggerOnInteraction,
    onLoad: onLoad,
    triggerOnLoad: triggerOnLoad
  };

  // We never want interactions to be hidden *when running code*.
  // So hideInteractions should go away as soon as run is clicked
  CPO.events.onRun(function () {
    document.body.classList.remove("hideInteractions");
  });
  var initialState = params["get"]["initialState"];
  window.PYRET_IS_EMBEDDED = false;
  window.PYRET_IN_VSCODE = false;
  if (typeof acquireVsCodeApi === "function") {
    window.MESSAGES = makeEvents({
      CPO: CPO,
      sendPort: acquireVsCodeApi(),
      receivePort: window,
      initialState: initialState
    });
    window.PYRET_IS_EMBEDDED = true;
    window.PYRET_IN_VSCODE = true;
  } else if (window.parent && window.parent !== window) {
    window.MESSAGES = makeEvents({
      CPO: CPO,
      sendPort: window.parent,
      receivePort: window,
      initialState: initialState
    });
    window.PYRET_IS_EMBEDDED = true;
  }
});
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxNQUFNLFNBQVMsSUFBeUQ7QUFDeEU7O0FBRUE7QUFDQSxNQUFNLEtBQUs7QUFBQSwwQkErQk47O0FBRUwsQ0FBQztBQUNEOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QUN4RDtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQjtBQUNwQjtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFNBQVM7QUFDVCxLQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7O0FBRUw7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFVBQVU7QUFDckIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsbUNBQW1DLGVBQWU7QUFDbEQ7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsbUNBQW1DLGVBQWU7QUFDbEQ7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBLEtBQUs7QUFDTCxpQkFBaUI7QUFDakIsS0FBSzs7QUFFTDtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxpQkFBaUI7QUFDakIsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBLEtBQUs7QUFDTDtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0EsV0FBVyxVQUFVO0FBQ3JCLGFBQWEsVUFBVTtBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLFNBQVM7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFFBQVE7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQSwwQ0FBMEMsK0JBQStCO0FBQ3pFO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxRQUFRO0FBQ25CO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxLQUFLOztBQUVMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBLFNBQVM7QUFDVCxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsYUFBYTtBQUN4QjtBQUNBLGFBQWEsY0FBYztBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxNQUFNO0FBQ2pCLFdBQVcsVUFBVTtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsTUFBTTtBQUNqQixXQUFXLFVBQVU7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxNQUFNO0FBQ2pCLFdBQVcsVUFBVTtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLE1BQU07QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNB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NkQsWUFBWSxHQUFHbmIsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLGNBQWMsQ0FBQztFQUVoRDNLLE1BQU0sQ0FBQytsQixpQkFBaUIsR0FBRyxLQUFLO0VBQ2hDL2xCLE1BQU0sQ0FBQ2tRLGVBQWUsR0FBRyxLQUFLO0VBQzlCLElBQUksT0FBTzhWLGdCQUFnQixLQUFLLFVBQVUsRUFBRTtJQUMxQ2htQixNQUFNLENBQUNpbUIsUUFBUSxHQUFHQyxVQUFVLENBQUM7TUFDM0JoYixHQUFHLEVBQUVBLEdBQUc7TUFDUmliLFFBQVEsRUFBRUgsZ0JBQWdCLENBQUMsQ0FBQztNQUM1QkksV0FBVyxFQUFFcG1CLE1BQU07TUFDbkI4bEIsWUFBWSxFQUFaQTtJQUNGLENBQUMsQ0FBQztJQUNGOWxCLE1BQU0sQ0FBQytsQixpQkFBaUIsR0FBRyxJQUFJO0lBQy9CL2xCLE1BQU0sQ0FBQ2tRLGVBQWUsR0FBRyxJQUFJO0VBQy9CLENBQUMsTUFDSSxJQUFJbFEsTUFBTSxDQUFDMkosTUFBTSxJQUFLM0osTUFBTSxDQUFDMkosTUFBTSxLQUFLM0osTUFBTyxFQUFHO0lBQ3JEQSxNQUFNLENBQUNpbUIsUUFBUSxHQUFHQyxVQUFVLENBQUM7TUFBRWhiLEdBQUcsRUFBRUEsR0FBRztNQUFFaWIsUUFBUSxFQUFFbm1CLE1BQU0sQ0FBQzJKLE1BQU07TUFBRXljLFdBQVcsRUFBRXBtQixNQUFNO01BQUU4bEIsWUFBWSxFQUFaQTtJQUFhLENBQUMsQ0FBQztJQUN0RzlsQixNQUFNLENBQUMrbEIsaUJBQWlCLEdBQUcsSUFBSTtFQUNqQztBQUNGLENBQUMsQ0FBQyxDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY29kZS5weXJldC5vcmcvLi9zcmMvd2ViL2pzL21vZGFsLXByb21wdC5qcyIsIndlYnBhY2s6Ly9jb2RlLnB5cmV0Lm9yZy8uL25vZGVfbW9kdWxlcy9xL3EuanMiLCJ3ZWJwYWNrOi8vY29kZS5weXJldC5vcmcvLi9ub2RlX21vZHVsZXMvdXJsLmpzL3VybC5qcyIsIndlYnBhY2s6Ly9jb2RlLnB5cmV0Lm9yZy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9jb2RlLnB5cmV0Lm9yZy8uL3NyYy93ZWIvanMvYmVmb3JlUHlyZXQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBNb2R1bGUgZm9yIG1hbmFnaW5nIG1vZGFsIHByb21wdCBpbnN0YW5jZXMuXG4gKiBOT1RFOiBUaGlzIG1vZHVsZSBpcyBjdXJyZW50bHkgbGltaXRlZCBpbiBhIG51bWJlclxuICogICAgICAgb2Ygd2F5cy4gRm9yIG9uZSwgaXQgb25seSBhbGxvd3MgcmFkaW9cbiAqICAgICAgIGlucHV0IG9wdGlvbnMuIEFkZGl0aW9uYWxseSwgaXQgaGFyZC1jb2RlcyBpblxuICogICAgICAgYSBudW1iZXIgb2Ygb3RoZXIgYmVoYXZpb3JzIHdoaWNoIGFyZSBzcGVjaWZpY1xuICogICAgICAgdG8gdGhlIGltYWdlIGltcG9ydCBzdHlsZSBwcm9tcHQgKGZvciB3aGljaFxuICogICAgICAgdGhpcyBtb2R1bGUgd2FzIHdyaXR0ZW4pLlxuICogICAgICAgSWYgZGVzaXJlZCwgdGhpcyBtb2R1bGUgbWF5IGJlIG1hZGUgbW9yZVxuICogICAgICAgZ2VuZXJhbC1wdXJwb3NlIGluIHRoZSBmdXR1cmUsIGJ1dCwgZm9yIG5vdyxcbiAqICAgICAgIGJlIGF3YXJlIG9mIHRoZXNlIGxpbWl0YXRpb25zLlxuICovXG5kZWZpbmUoXCJjcG8vbW9kYWwtcHJvbXB0XCIsIFtcInFcIl0sIGZ1bmN0aW9uKFEpIHtcblxuICBmdW5jdGlvbiBhdXRvSGlnaGxpZ2h0Qm94KHRleHQpIHtcbiAgICB2YXIgdGV4dEJveCA9ICQoXCI8aW5wdXQgdHlwZT0ndGV4dCc+XCIpLmFkZENsYXNzKFwiYXV0by1oaWdobGlnaHRcIik7XG4gICAgdGV4dEJveC5hdHRyKFwicmVhZG9ubHlcIiwgXCJyZWFkb25seVwiKTtcbiAgICB0ZXh0Qm94Lm9uKFwiZm9jdXNcIiwgZnVuY3Rpb24oKSB7ICQodGhpcykuc2VsZWN0KCk7IH0pO1xuICAgIHRleHRCb3gub24oXCJtb3VzZXVwXCIsIGZ1bmN0aW9uKCkgeyAkKHRoaXMpLnNlbGVjdCgpOyB9KTtcbiAgICB0ZXh0Qm94LnZhbCh0ZXh0KTtcbiAgICByZXR1cm4gdGV4dEJveDtcblxuXG4gIH1cblxuICAvLyBBbGxvd3MgYXN5bmNocm9ub3VzIHJlcXVlc3Rpbmcgb2YgcHJvbXB0c1xuICB2YXIgcHJvbXB0UXVldWUgPSBRKCk7XG4gIHZhciBzdHlsZXMgPSBbXG4gICAgXCJyYWRpb1wiLCBcInRpbGVzXCIsIFwidGV4dFwiLCBcImNvcHlUZXh0XCIsIFwiY29uZmlybVwiXG4gIF07XG5cbiAgd2luZG93Lm1vZGFscyA9IFtdO1xuXG4gIC8qKlxuICAgKiBSZXByZXNlbnRzIGFuIG9wdGlvbiB0byBwcmVzZW50IHRoZSB1c2VyXG4gICAqIEB0eXBlZGVmIHtPYmplY3R9IE1vZGFsT3B0aW9uXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgdG8gc2hvdyB0aGUgdXNlciB3aGljaFxuICAgICAgICAgICAgICAgZGVzY3JpYmVzIHRoaXMgb3B0aW9uXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB2YWx1ZSAtIFRoZSB2YWx1ZSB0byByZXR1cm4gaWYgdGhpcyBvcHRpb24gaXMgY2hvc2VuXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbZXhhbXBsZV0gLSBBIGNvZGUgc25pcHBldCB0byBzaG93IHdpdGggdGhpcyBvcHRpb25cbiAgICovXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yIGZvciBtb2RhbCBwcm9tcHRzLlxuICAgKiBAcGFyYW0ge01vZGFsT3B0aW9uW119IG9wdGlvbnMgLSBUaGUgb3B0aW9ucyB0byBwcmVzZW50IHRoZSB1c2VyXG4gICAqL1xuICBmdW5jdGlvbiBQcm9tcHQob3B0aW9ucykge1xuICAgIHdpbmRvdy5tb2RhbHMucHVzaCh0aGlzKTtcbiAgICBpZiAoIW9wdGlvbnMgfHxcbiAgICAgICAgKHN0eWxlcy5pbmRleE9mKG9wdGlvbnMuc3R5bGUpID09PSAtMSkgfHxcbiAgICAgICAgIW9wdGlvbnMub3B0aW9ucyB8fFxuICAgICAgICAodHlwZW9mIG9wdGlvbnMub3B0aW9ucy5sZW5ndGggIT09IFwibnVtYmVyXCIpIHx8IChvcHRpb25zLm9wdGlvbnMubGVuZ3RoID09PSAwKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBQcm9tcHQgT3B0aW9uc1wiLCBvcHRpb25zKTtcbiAgICB9XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLm1vZGFsID0gJChcIiNwcm9tcHRNb2RhbFwiKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnN0eWxlID09PSBcInJhZGlvXCIpIHtcbiAgICAgIHRoaXMuZWx0cyA9ICQoJC5wYXJzZUhUTUwoXCI8dGFibGU+PC90YWJsZT5cIikpLmFkZENsYXNzKFwiY2hvaWNlQ29udGFpbmVyXCIpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnN0eWxlID09PSBcInRleHRcIikge1xuICAgICAgdGhpcy5lbHRzID0gJChcIjxkaXY+XCIpLmFkZENsYXNzKFwiY2hvaWNlQ29udGFpbmVyXCIpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnN0eWxlID09PSBcImNvcHlUZXh0XCIpIHtcbiAgICAgIHRoaXMuZWx0cyA9ICQoXCI8ZGl2PlwiKS5hZGRDbGFzcyhcImNob2ljZUNvbnRhaW5lclwiKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5zdHlsZSA9PT0gXCJjb25maXJtXCIpIHtcbiAgICAgIHRoaXMuZWx0cyA9ICQoXCI8ZGl2PlwiKS5hZGRDbGFzcyhcImNob2ljZUNvbnRhaW5lclwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbHRzID0gJCgkLnBhcnNlSFRNTChcIjxkaXY+PC9kaXY+XCIpKS5hZGRDbGFzcyhcImNob2ljZUNvbnRhaW5lclwiKTtcbiAgICB9XG4gICAgdGhpcy50aXRsZSA9ICQoXCIubW9kYWwtaGVhZGVyID4gaDNcIiwgdGhpcy5tb2RhbCk7XG4gICAgdGhpcy5tb2RhbENvbnRlbnQgPSAkKFwiLm1vZGFsLWNvbnRlbnRcIiwgdGhpcy5tb2RhbCk7XG4gICAgdGhpcy5jbG9zZUJ1dHRvbiA9ICQoXCIuY2xvc2VcIiwgdGhpcy5tb2RhbCk7XG4gICAgdGhpcy5zdWJtaXRCdXR0b24gPSAkKFwiLnN1Ym1pdFwiLCB0aGlzLm1vZGFsKTtcbiAgICBpZih0aGlzLm9wdGlvbnMuc3VibWl0VGV4dCkge1xuICAgICAgdGhpcy5zdWJtaXRCdXR0b24udGV4dCh0aGlzLm9wdGlvbnMuc3VibWl0VGV4dCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5zdWJtaXRCdXR0b24udGV4dChcIlN1Ym1pdFwiKTtcbiAgICB9XG4gICAgaWYodGhpcy5vcHRpb25zLmNhbmNlbFRleHQpIHtcbiAgICAgIHRoaXMuY2xvc2VCdXR0b24udGV4dCh0aGlzLm9wdGlvbnMuY2FuY2VsVGV4dCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5jbG9zZUJ1dHRvbi50ZXh0KFwiQ2FuY2VsXCIpO1xuICAgIH1cbiAgICB0aGlzLm1vZGFsQ29udGVudC50b2dnbGVDbGFzcyhcIm5hcnJvd1wiLCAhIXRoaXMub3B0aW9ucy5uYXJyb3cpO1xuXG4gICAgdGhpcy5pc0NvbXBpbGVkID0gZmFsc2U7XG4gICAgdGhpcy5kZWZlcnJlZCA9IFEuZGVmZXIoKTtcbiAgICB0aGlzLnByb21pc2UgPSB0aGlzLmRlZmVycmVkLnByb21pc2U7XG4gIH1cblxuICAvKipcbiAgICogVHlwZSBmb3IgaGFuZGxlcnMgb2YgcmVzcG9uc2VzIGZyb20gbW9kYWwgcHJvbXB0c1xuICAgKiBAY2FsbGJhY2sgcHJvbXB0Q2FsbGJhY2tcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlc3AgLSBUaGUgcmVzcG9uc2UgZnJvbSB0aGUgdXNlclxuICAgKi9cblxuICAvKipcbiAgICogU2hvd3MgdGhpcyBwcm9tcHQgdG8gdGhlIHVzZXIgKHdpbGwgd2FpdCB1bnRpbCBhbnkgYWN0aXZlXG4gICAqIHByb21wdHMgaGF2ZSBmaW5pc2hlZClcbiAgICogQHBhcmFtIHtwcm9tcHRDYWxsYmFja30gW2NhbGxiYWNrXSAtIE9wdGlvbmFsIGNhbGxiYWNrIHdoaWNoIGlzIHBhc3NlZCB0aGVcbiAgICogICAgICAgIHJlc3VsdCBvZiB0aGUgcHJvbXB0XG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSByZXNvbHZpbmcgdG8gZWl0aGVyIHRoZSByZXN1bHQgb2YgYGNhbGxiYWNrYCwgaWYgcHJvdmlkZWQsXG4gICAqICAgICAgICAgIG9yIHRoZSByZXN1bHQgb2YgdGhlIHByb21wdCwgb3RoZXJ3aXNlLlxuICAgKi9cbiAgUHJvbXB0LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAvLyBVc2UgdGhlIHByb21pc2UgcXVldWUgdG8gbWFrZSBzdXJlIHRoZXJlJ3Mgbm8gb3RoZXJcbiAgICAvLyBwcm9tcHQgYmVpbmcgc2hvd24gY3VycmVudGx5XG4gICAgaWYgKHRoaXMub3B0aW9ucy5oaWRlU3VibWl0KSB7XG4gICAgICB0aGlzLnN1Ym1pdEJ1dHRvbi5oaWRlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3VibWl0QnV0dG9uLnNob3coKTtcbiAgICB9XG4gICAgdGhpcy5jbG9zZUJ1dHRvbi5jbGljayh0aGlzLm9uQ2xvc2UuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5tb2RhbC5rZXlwcmVzcyhmdW5jdGlvbihlKSB7XG4gICAgICBpZihlLndoaWNoID09IDEzKSB7XG4gICAgICAgIHRoaXMuc3VibWl0QnV0dG9uLmNsaWNrKCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuICAgIHRoaXMuc3VibWl0QnV0dG9uLmNsaWNrKHRoaXMub25TdWJtaXQuYmluZCh0aGlzKSk7XG4gICAgdmFyIGRvY0NsaWNrID0gKGZ1bmN0aW9uKGUpIHtcbiAgICAgIC8vIElmIHRoZSBwcm9tcHQgaXMgYWN0aXZlIGFuZCB0aGUgYmFja2dyb3VuZCBpcyBjbGlja2VkLFxuICAgICAgLy8gdGhlbiBjbG9zZS5cbiAgICAgIGlmICgkKGUudGFyZ2V0KS5pcyh0aGlzLm1vZGFsKSAmJiB0aGlzLmRlZmVycmVkKSB7XG4gICAgICAgIHRoaXMub25DbG9zZShlKTtcbiAgICAgICAgJChkb2N1bWVudCkub2ZmKFwiY2xpY2tcIiwgZG9jQ2xpY2spO1xuICAgICAgfVxuICAgIH0pLmJpbmQodGhpcyk7XG4gICAgJChkb2N1bWVudCkuY2xpY2soZG9jQ2xpY2spO1xuICAgIHZhciBkb2NLZXlkb3duID0gKGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChlLmtleSA9PT0gXCJFc2NhcGVcIikge1xuICAgICAgICB0aGlzLm9uQ2xvc2UoZSk7XG4gICAgICAgICQoZG9jdW1lbnQpLm9mZihcImtleWRvd25cIiwgZG9jS2V5ZG93bik7XG4gICAgICB9XG4gICAgfSkuYmluZCh0aGlzKTtcbiAgICAkKGRvY3VtZW50KS5rZXlkb3duKGRvY0tleWRvd24pO1xuICAgIHRoaXMudGl0bGUudGV4dCh0aGlzLm9wdGlvbnMudGl0bGUpO1xuICAgIHRoaXMucG9wdWxhdGVNb2RhbCgpO1xuICAgIHRoaXMubW9kYWwuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJyk7XG4gICAgJChcIjppbnB1dDplbmFibGVkOnZpc2libGU6Zmlyc3RcIiwgdGhpcy5tb2RhbCkuZm9jdXMoKS5zZWxlY3QoKVxuXG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcm9taXNlLnRoZW4oY2FsbGJhY2spO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5wcm9taXNlO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBDbGVhcnMgdGhlIGNvbnRlbnRzIG9mIHRoZSBtb2RhbCBwcm9tcHQuXG4gICAqL1xuICBQcm9tcHQucHJvdG90eXBlLmNsZWFyTW9kYWwgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN1Ym1pdEJ1dHRvbi5vZmYoKTtcbiAgICB0aGlzLmNsb3NlQnV0dG9uLm9mZigpO1xuICAgIHRoaXMuZWx0cy5lbXB0eSgpO1xuICB9O1xuICBcbiAgLyoqXG4gICAqIFBvcHVsYXRlcyB0aGUgY29udGVudHMgb2YgdGhlIG1vZGFsIHByb21wdCB3aXRoIHRoZVxuICAgKiBvcHRpb25zIGluIHRoaXMgcHJvbXB0LlxuICAgKi9cbiAgUHJvbXB0LnByb3RvdHlwZS5wb3B1bGF0ZU1vZGFsID0gZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gY3JlYXRlUmFkaW9FbHQob3B0aW9uLCBpZHgpIHtcbiAgICAgIHZhciBlbHQgPSAkKCQucGFyc2VIVE1MKFwiPGlucHV0IG5hbWU9XFxcInB5cmV0LW1vZGFsXFxcIiB0eXBlPVxcXCJyYWRpb1xcXCI+XCIpKTtcbiAgICAgIHZhciBpZCA9IFwiclwiICsgaWR4LnRvU3RyaW5nKCk7XG4gICAgICB2YXIgbGFiZWwgPSAkKCQucGFyc2VIVE1MKFwiPGxhYmVsIGZvcj1cXFwiXCIgKyBpZCArIFwiXFxcIj48L2xhYmVsPlwiKSk7XG4gICAgICBlbHQuYXR0cihcImlkXCIsIGlkKTtcbiAgICAgIGVsdC5hdHRyKFwidmFsdWVcIiwgb3B0aW9uLnZhbHVlKTtcbiAgICAgIGxhYmVsLnRleHQob3B0aW9uLm1lc3NhZ2UpO1xuICAgICAgdmFyIGVsdENvbnRhaW5lciA9ICQoJC5wYXJzZUhUTUwoXCI8dGQgY2xhc3M9XFxcInB5cmV0LW1vZGFsLW9wdGlvbi1yYWRpb1xcXCI+PC90ZD5cIikpO1xuICAgICAgZWx0Q29udGFpbmVyLmFwcGVuZChlbHQpO1xuICAgICAgdmFyIGxhYmVsQ29udGFpbmVyID0gJCgkLnBhcnNlSFRNTChcIjx0ZCBjbGFzcz1cXFwicHlyZXQtbW9kYWwtb3B0aW9uLW1lc3NhZ2VcXFwiPjwvdGQ+XCIpKTtcbiAgICAgIGxhYmVsQ29udGFpbmVyLmFwcGVuZChsYWJlbCk7XG4gICAgICB2YXIgY29udGFpbmVyID0gJCgkLnBhcnNlSFRNTChcIjx0ciBjbGFzcz1cXFwicHlyZXQtbW9kYWwtb3B0aW9uXFxcIj48L3RyPlwiKSk7XG4gICAgICBjb250YWluZXIuYXBwZW5kKGVsdENvbnRhaW5lcik7XG4gICAgICBjb250YWluZXIuYXBwZW5kKGxhYmVsQ29udGFpbmVyKTtcbiAgICAgIGlmIChvcHRpb24uZXhhbXBsZSkge1xuICAgICAgICB2YXIgZXhhbXBsZSA9ICQoJC5wYXJzZUhUTUwoXCI8ZGl2PjwvZGl2PlwiKSk7XG4gICAgICAgIHZhciBjbSA9IENvZGVNaXJyb3IoZXhhbXBsZVswXSwge1xuICAgICAgICAgIHZhbHVlOiBvcHRpb24uZXhhbXBsZSxcbiAgICAgICAgICBtb2RlOiAncHlyZXQnLFxuICAgICAgICAgIGxpbmVOdW1iZXJzOiBmYWxzZSxcbiAgICAgICAgICByZWFkT25seTogXCJub2N1cnNvclwiIC8vIHRoaXMgbWFrZXMgaXQgcmVhZE9ubHkgJiBub3QgZm9jdXNhYmxlIGFzIGEgZm9ybSBpbnB1dFxuICAgICAgICB9KTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgIGNtLnJlZnJlc2goKTtcbiAgICAgICAgfSwgMSk7XG4gICAgICAgIHZhciBleGFtcGxlQ29udGFpbmVyID0gJCgkLnBhcnNlSFRNTChcIjx0ZCBjbGFzcz1cXFwicHlyZXQtbW9kYWwtb3B0aW9uLWV4YW1wbGVcXFwiPjwvdGQ+XCIpKTtcbiAgICAgICAgZXhhbXBsZUNvbnRhaW5lci5hcHBlbmQoZXhhbXBsZSk7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmQoZXhhbXBsZUNvbnRhaW5lcik7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJldHVybiBjb250YWluZXI7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNyZWF0ZVRpbGVFbHQob3B0aW9uLCBpZHgpIHtcbiAgICAgIHZhciBlbHQgPSAkKCQucGFyc2VIVE1MKFwiPGJ1dHRvbiBuYW1lPVxcXCJweXJldC1tb2RhbFxcXCIgY2xhc3M9XFxcInRpbGVcXFwiPjwvYnV0dG9uPlwiKSk7XG4gICAgICBlbHQuYXR0cihcImlkXCIsIFwidFwiICsgaWR4LnRvU3RyaW5nKCkpO1xuICAgICAgZWx0LmFwcGVuZCgkKFwiPGI+XCIpLnRleHQob3B0aW9uLm1lc3NhZ2UpKVxuICAgICAgICAuYXBwZW5kKCQoXCI8cD5cIikudGV4dChvcHRpb24uZGV0YWlscykpO1xuICAgICAgZm9yICh2YXIgZXZ0IGluIG9wdGlvbi5vbilcbiAgICAgICAgZWx0Lm9uKGV2dCwgb3B0aW9uLm9uW2V2dF0pO1xuICAgICAgcmV0dXJuIGVsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVUZXh0RWx0KG9wdGlvbikge1xuICAgICAgdmFyIGVsdCA9ICQoXCI8ZGl2IGNsYXNzPVxcXCJweXJldC1tb2RhbC10ZXh0XFxcIj5cIik7XG4gICAgICBjb25zdCBpbnB1dCA9ICQoXCI8aW5wdXQgaWQ9J21vZGFsLXByb21wdC10ZXh0JyB0eXBlPSd0ZXh0Jz5cIikudmFsKG9wdGlvbi5kZWZhdWx0VmFsdWUpO1xuICAgICAgaWYob3B0aW9uLmRyYXdFbGVtZW50KSB7XG4gICAgICAgIGVsdC5hcHBlbmQob3B0aW9uLmRyYXdFbGVtZW50KGlucHV0KSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgZWx0LmFwcGVuZCgkKFwiPGxhYmVsIGZvcj0nbW9kYWwtcHJvbXB0LXRleHQnPlwiKS5hZGRDbGFzcyhcInRleHRMYWJlbFwiKS50ZXh0KG9wdGlvbi5tZXNzYWdlKSk7XG4gICAgICAgIGVsdC5hcHBlbmQoaW5wdXQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVDb3B5VGV4dEVsdChvcHRpb24pIHtcbiAgICAgIHZhciBlbHQgPSAkKFwiPGRpdj5cIik7XG4gICAgICBlbHQuYXBwZW5kKCQoXCI8cD5cIikuYWRkQ2xhc3MoXCJ0ZXh0TGFiZWxcIikudGV4dChvcHRpb24ubWVzc2FnZSkpO1xuICAgICAgaWYob3B0aW9uLnRleHQpIHtcbiAgICAgICAgdmFyIGJveCA9IGF1dG9IaWdobGlnaHRCb3gob3B0aW9uLnRleHQpO1xuICAvLyAgICAgIGVsdC5hcHBlbmQoJChcIjxzcGFuPlwiKS50ZXh0KFwiKFwiICsgb3B0aW9uLmRldGFpbHMgKyBcIilcIikpO1xuICAgICAgICBlbHQuYXBwZW5kKGJveCk7XG4gICAgICAgIGJveC5mb2N1cygpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVDb25maXJtRWx0KG9wdGlvbikge1xuICAgICAgcmV0dXJuICQoXCI8cD5cIikudGV4dChvcHRpb24ubWVzc2FnZSk7XG4gICAgfVxuXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gY3JlYXRlRWx0KG9wdGlvbiwgaSkge1xuICAgICAgaWYodGhhdC5vcHRpb25zLnN0eWxlID09PSBcInJhZGlvXCIpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZVJhZGlvRWx0KG9wdGlvbiwgaSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKHRoYXQub3B0aW9ucy5zdHlsZSA9PT0gXCJ0aWxlc1wiKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVUaWxlRWx0KG9wdGlvbiwgaSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKHRoYXQub3B0aW9ucy5zdHlsZSA9PT0gXCJ0ZXh0XCIpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZVRleHRFbHQob3B0aW9uKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYodGhhdC5vcHRpb25zLnN0eWxlID09PSBcImNvcHlUZXh0XCIpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUNvcHlUZXh0RWx0KG9wdGlvbik7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKHRoYXQub3B0aW9ucy5zdHlsZSA9PT0gXCJjb25maXJtXCIpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUNvbmZpcm1FbHQob3B0aW9uKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgb3B0aW9uRWx0cztcbiAgICAvLyBDYWNoZSByZXN1bHRzXG4vLyAgICBpZiAodHJ1ZSkge1xuICAgICAgb3B0aW9uRWx0cyA9IHRoaXMub3B0aW9ucy5vcHRpb25zLm1hcChjcmVhdGVFbHQpO1xuLy8gICAgICB0aGlzLmNvbXBpbGVkRWx0cyA9IG9wdGlvbkVsdHM7XG4vLyAgICAgIHRoaXMuaXNDb21waWxlZCA9IHRydWU7XG4vLyAgICB9IGVsc2Uge1xuLy8gICAgICBvcHRpb25FbHRzID0gdGhpcy5jb21waWxlZEVsdHM7XG4vLyAgICB9XG4gICAgJChcImlucHV0W3R5cGU9J3JhZGlvJ11cIiwgb3B0aW9uRWx0c1swXSkuYXR0cignY2hlY2tlZCcsIHRydWUpO1xuICAgIHRoaXMuZWx0cy5hcHBlbmQob3B0aW9uRWx0cyk7XG4gICAgJChcIi5tb2RhbC1ib2R5XCIsIHRoaXMubW9kYWwpLmVtcHR5KCkuYXBwZW5kKHRoaXMuZWx0cyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEhhbmRsZXIgd2hpY2ggaXMgY2FsbGVkIHdoZW4gdGhlIHVzZXIgZG9lcyBub3Qgc2VsZWN0IGFueXRoaW5nXG4gICAqL1xuICBQcm9tcHQucHJvdG90eXBlLm9uQ2xvc2UgPSBmdW5jdGlvbihlKSB7XG4gICAgdGhpcy5tb2RhbC5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgIHRoaXMuY2xlYXJNb2RhbCgpO1xuICAgIHRoaXMuZGVmZXJyZWQucmVzb2x2ZShudWxsKTtcbiAgICBkZWxldGUgdGhpcy5kZWZlcnJlZDtcbiAgICBkZWxldGUgdGhpcy5wcm9taXNlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBIYW5kbGVyIHdoaWNoIGlzIGNhbGxlZCB3aGVuIHRoZSB1c2VyIHByZXNzZXMgXCJzdWJtaXRcIlxuICAgKi9cbiAgUHJvbXB0LnByb3RvdHlwZS5vblN1Ym1pdCA9IGZ1bmN0aW9uKGUpIHtcbiAgICBpZih0aGlzLm9wdGlvbnMuc3R5bGUgPT09IFwicmFkaW9cIikge1xuICAgICAgdmFyIHJldHZhbCA9ICQoXCJpbnB1dFt0eXBlPSdyYWRpbyddOmNoZWNrZWRcIiwgdGhpcy5tb2RhbCkudmFsKCk7XG4gICAgfVxuICAgIGVsc2UgaWYodGhpcy5vcHRpb25zLnN0eWxlID09PSBcInRleHRcIikge1xuICAgICAgdmFyIHJldHZhbCA9ICQoXCJpbnB1dFt0eXBlPSd0ZXh0J11cIiwgdGhpcy5tb2RhbCkudmFsKCk7XG4gICAgfVxuICAgIGVsc2UgaWYodGhpcy5vcHRpb25zLnN0eWxlID09PSBcImNvcHlUZXh0XCIpIHtcbiAgICAgIHZhciByZXR2YWwgPSB0cnVlO1xuICAgIH1cbiAgICBlbHNlIGlmKHRoaXMub3B0aW9ucy5zdHlsZSA9PT0gXCJjb25maXJtXCIpIHtcbiAgICAgIHZhciByZXR2YWwgPSB0cnVlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHZhciByZXR2YWwgPSB0cnVlOyAvLyBKdXN0IHJldHVybiB0cnVlIGlmIHRoZXkgY2xpY2tlZCBzdWJtaXRcbiAgICB9XG4gICAgdGhpcy5tb2RhbC5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgIHRoaXMuY2xlYXJNb2RhbCgpO1xuICAgIHRoaXMuZGVmZXJyZWQucmVzb2x2ZShyZXR2YWwpO1xuICAgIGRlbGV0ZSB0aGlzLmRlZmVycmVkO1xuICAgIGRlbGV0ZSB0aGlzLnByb21pc2U7XG4gIH07XG5cbiAgcmV0dXJuIFByb21wdDtcblxufSk7XG5cbiIsIi8vIHZpbTp0cz00OnN0cz00OnN3PTQ6XG4vKiFcbiAqXG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEyIEtyaXMgS293YWwgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBNSVRcbiAqIGxpY2Vuc2UgZm91bmQgYXQgaHR0cDovL2dpdGh1Yi5jb20va3Jpc2tvd2FsL3EvcmF3L21hc3Rlci9MSUNFTlNFXG4gKlxuICogV2l0aCBwYXJ0cyBieSBUeWxlciBDbG9zZVxuICogQ29weXJpZ2h0IDIwMDctMjAwOSBUeWxlciBDbG9zZSB1bmRlciB0aGUgdGVybXMgb2YgdGhlIE1JVCBYIGxpY2Vuc2UgZm91bmRcbiAqIGF0IGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UuaHRtbFxuICogRm9ya2VkIGF0IHJlZl9zZW5kLmpzIHZlcnNpb246IDIwMDktMDUtMTFcbiAqXG4gKiBXaXRoIHBhcnRzIGJ5IE1hcmsgTWlsbGVyXG4gKiBDb3B5cmlnaHQgKEMpIDIwMTEgR29vZ2xlIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqXG4gKi9cblxuKGZ1bmN0aW9uIChkZWZpbml0aW9uKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAvLyBUaGlzIGZpbGUgd2lsbCBmdW5jdGlvbiBwcm9wZXJseSBhcyBhIDxzY3JpcHQ+IHRhZywgb3IgYSBtb2R1bGVcbiAgICAvLyB1c2luZyBDb21tb25KUyBhbmQgTm9kZUpTIG9yIFJlcXVpcmVKUyBtb2R1bGUgZm9ybWF0cy4gIEluXG4gICAgLy8gQ29tbW9uL05vZGUvUmVxdWlyZUpTLCB0aGUgbW9kdWxlIGV4cG9ydHMgdGhlIFEgQVBJIGFuZCB3aGVuXG4gICAgLy8gZXhlY3V0ZWQgYXMgYSBzaW1wbGUgPHNjcmlwdD4sIGl0IGNyZWF0ZXMgYSBRIGdsb2JhbCBpbnN0ZWFkLlxuXG4gICAgLy8gTW9udGFnZSBSZXF1aXJlXG4gICAgaWYgKHR5cGVvZiBib290c3RyYXAgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBib290c3RyYXAoXCJwcm9taXNlXCIsIGRlZmluaXRpb24pO1xuXG4gICAgLy8gQ29tbW9uSlNcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBtb2R1bGUgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbml0aW9uKCk7XG5cbiAgICAvLyBSZXF1aXJlSlNcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShkZWZpbml0aW9uKTtcblxuICAgIC8vIFNFUyAoU2VjdXJlIEVjbWFTY3JpcHQpXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2VzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGlmICghc2VzLm9rKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlcy5tYWtlUSA9IGRlZmluaXRpb247XG4gICAgICAgIH1cblxuICAgIC8vIDxzY3JpcHQ+XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiIHx8IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIFByZWZlciB3aW5kb3cgb3ZlciBzZWxmIGZvciBhZGQtb24gc2NyaXB0cy4gVXNlIHNlbGYgZm9yXG4gICAgICAgIC8vIG5vbi13aW5kb3dlZCBjb250ZXh0cy5cbiAgICAgICAgdmFyIGdsb2JhbCA9IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiBzZWxmO1xuXG4gICAgICAgIC8vIEdldCB0aGUgYHdpbmRvd2Agb2JqZWN0LCBzYXZlIHRoZSBwcmV2aW91cyBRIGdsb2JhbFxuICAgICAgICAvLyBhbmQgaW5pdGlhbGl6ZSBRIGFzIGEgZ2xvYmFsLlxuICAgICAgICB2YXIgcHJldmlvdXNRID0gZ2xvYmFsLlE7XG4gICAgICAgIGdsb2JhbC5RID0gZGVmaW5pdGlvbigpO1xuXG4gICAgICAgIC8vIEFkZCBhIG5vQ29uZmxpY3QgZnVuY3Rpb24gc28gUSBjYW4gYmUgcmVtb3ZlZCBmcm9tIHRoZVxuICAgICAgICAvLyBnbG9iYWwgbmFtZXNwYWNlLlxuICAgICAgICBnbG9iYWwuUS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZ2xvYmFsLlEgPSBwcmV2aW91c1E7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoaXMgZW52aXJvbm1lbnQgd2FzIG5vdCBhbnRpY2lwYXRlZCBieSBRLiBQbGVhc2UgZmlsZSBhIGJ1Zy5cIik7XG4gICAgfVxuXG59KShmdW5jdGlvbiAoKSB7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGhhc1N0YWNrcyA9IGZhbHNlO1xudHJ5IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbn0gY2F0Y2ggKGUpIHtcbiAgICBoYXNTdGFja3MgPSAhIWUuc3RhY2s7XG59XG5cbi8vIEFsbCBjb2RlIGFmdGVyIHRoaXMgcG9pbnQgd2lsbCBiZSBmaWx0ZXJlZCBmcm9tIHN0YWNrIHRyYWNlcyByZXBvcnRlZFxuLy8gYnkgUS5cbnZhciBxU3RhcnRpbmdMaW5lID0gY2FwdHVyZUxpbmUoKTtcbnZhciBxRmlsZU5hbWU7XG5cbi8vIHNoaW1zXG5cbi8vIHVzZWQgZm9yIGZhbGxiYWNrIGluIFwiYWxsUmVzb2x2ZWRcIlxudmFyIG5vb3AgPSBmdW5jdGlvbiAoKSB7fTtcblxuLy8gVXNlIHRoZSBmYXN0ZXN0IHBvc3NpYmxlIG1lYW5zIHRvIGV4ZWN1dGUgYSB0YXNrIGluIGEgZnV0dXJlIHR1cm5cbi8vIG9mIHRoZSBldmVudCBsb29wLlxudmFyIG5leHRUaWNrID0oZnVuY3Rpb24gKCkge1xuICAgIC8vIGxpbmtlZCBsaXN0IG9mIHRhc2tzIChzaW5nbGUsIHdpdGggaGVhZCBub2RlKVxuICAgIHZhciBoZWFkID0ge3Rhc2s6IHZvaWQgMCwgbmV4dDogbnVsbH07XG4gICAgdmFyIHRhaWwgPSBoZWFkO1xuICAgIHZhciBmbHVzaGluZyA9IGZhbHNlO1xuICAgIHZhciByZXF1ZXN0VGljayA9IHZvaWQgMDtcbiAgICB2YXIgaXNOb2RlSlMgPSBmYWxzZTtcbiAgICAvLyBxdWV1ZSBmb3IgbGF0ZSB0YXNrcywgdXNlZCBieSB1bmhhbmRsZWQgcmVqZWN0aW9uIHRyYWNraW5nXG4gICAgdmFyIGxhdGVyUXVldWUgPSBbXTtcblxuICAgIGZ1bmN0aW9uIGZsdXNoKCkge1xuICAgICAgICAvKiBqc2hpbnQgbG9vcGZ1bmM6IHRydWUgKi9cbiAgICAgICAgdmFyIHRhc2ssIGRvbWFpbjtcblxuICAgICAgICB3aGlsZSAoaGVhZC5uZXh0KSB7XG4gICAgICAgICAgICBoZWFkID0gaGVhZC5uZXh0O1xuICAgICAgICAgICAgdGFzayA9IGhlYWQudGFzaztcbiAgICAgICAgICAgIGhlYWQudGFzayA9IHZvaWQgMDtcbiAgICAgICAgICAgIGRvbWFpbiA9IGhlYWQuZG9tYWluO1xuXG4gICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgaGVhZC5kb21haW4gPSB2b2lkIDA7XG4gICAgICAgICAgICAgICAgZG9tYWluLmVudGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBydW5TaW5nbGUodGFzaywgZG9tYWluKTtcblxuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChsYXRlclF1ZXVlLmxlbmd0aCkge1xuICAgICAgICAgICAgdGFzayA9IGxhdGVyUXVldWUucG9wKCk7XG4gICAgICAgICAgICBydW5TaW5nbGUodGFzayk7XG4gICAgICAgIH1cbiAgICAgICAgZmx1c2hpbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgLy8gcnVucyBhIHNpbmdsZSBmdW5jdGlvbiBpbiB0aGUgYXN5bmMgcXVldWVcbiAgICBmdW5jdGlvbiBydW5TaW5nbGUodGFzaywgZG9tYWluKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0YXNrKCk7XG5cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGlzTm9kZUpTKSB7XG4gICAgICAgICAgICAgICAgLy8gSW4gbm9kZSwgdW5jYXVnaHQgZXhjZXB0aW9ucyBhcmUgY29uc2lkZXJlZCBmYXRhbCBlcnJvcnMuXG4gICAgICAgICAgICAgICAgLy8gUmUtdGhyb3cgdGhlbSBzeW5jaHJvbm91c2x5IHRvIGludGVycnVwdCBmbHVzaGluZyFcblxuICAgICAgICAgICAgICAgIC8vIEVuc3VyZSBjb250aW51YXRpb24gaWYgdGhlIHVuY2F1Z2h0IGV4Y2VwdGlvbiBpcyBzdXBwcmVzc2VkXG4gICAgICAgICAgICAgICAgLy8gbGlzdGVuaW5nIFwidW5jYXVnaHRFeGNlcHRpb25cIiBldmVudHMgKGFzIGRvbWFpbnMgZG9lcykuXG4gICAgICAgICAgICAgICAgLy8gQ29udGludWUgaW4gbmV4dCBldmVudCB0byBhdm9pZCB0aWNrIHJlY3Vyc2lvbi5cbiAgICAgICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluLmVudGVyKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBJbiBicm93c2VycywgdW5jYXVnaHQgZXhjZXB0aW9ucyBhcmUgbm90IGZhdGFsLlxuICAgICAgICAgICAgICAgIC8vIFJlLXRocm93IHRoZW0gYXN5bmNocm9ub3VzbHkgdG8gYXZvaWQgc2xvdy1kb3ducy5cbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZXh0VGljayA9IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHRhaWwgPSB0YWlsLm5leHQgPSB7XG4gICAgICAgICAgICB0YXNrOiB0YXNrLFxuICAgICAgICAgICAgZG9tYWluOiBpc05vZGVKUyAmJiBwcm9jZXNzLmRvbWFpbixcbiAgICAgICAgICAgIG5leHQ6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIWZsdXNoaW5nKSB7XG4gICAgICAgICAgICBmbHVzaGluZyA9IHRydWU7XG4gICAgICAgICAgICByZXF1ZXN0VGljaygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICBwcm9jZXNzLnRvU3RyaW5nKCkgPT09IFwiW29iamVjdCBwcm9jZXNzXVwiICYmIHByb2Nlc3MubmV4dFRpY2spIHtcbiAgICAgICAgLy8gRW5zdXJlIFEgaXMgaW4gYSByZWFsIE5vZGUgZW52aXJvbm1lbnQsIHdpdGggYSBgcHJvY2Vzcy5uZXh0VGlja2AuXG4gICAgICAgIC8vIFRvIHNlZSB0aHJvdWdoIGZha2UgTm9kZSBlbnZpcm9ubWVudHM6XG4gICAgICAgIC8vICogTW9jaGEgdGVzdCBydW5uZXIgLSBleHBvc2VzIGEgYHByb2Nlc3NgIGdsb2JhbCB3aXRob3V0IGEgYG5leHRUaWNrYFxuICAgICAgICAvLyAqIEJyb3dzZXJpZnkgLSBleHBvc2VzIGEgYHByb2Nlc3MubmV4VGlja2AgZnVuY3Rpb24gdGhhdCB1c2VzXG4gICAgICAgIC8vICAgYHNldFRpbWVvdXRgLiBJbiB0aGlzIGNhc2UgYHNldEltbWVkaWF0ZWAgaXMgcHJlZmVycmVkIGJlY2F1c2VcbiAgICAgICAgLy8gICAgaXQgaXMgZmFzdGVyLiBCcm93c2VyaWZ5J3MgYHByb2Nlc3MudG9TdHJpbmcoKWAgeWllbGRzXG4gICAgICAgIC8vICAgXCJbb2JqZWN0IE9iamVjdF1cIiwgd2hpbGUgaW4gYSByZWFsIE5vZGUgZW52aXJvbm1lbnRcbiAgICAgICAgLy8gICBgcHJvY2Vzcy5uZXh0VGljaygpYCB5aWVsZHMgXCJbb2JqZWN0IHByb2Nlc3NdXCIuXG4gICAgICAgIGlzTm9kZUpTID0gdHJ1ZTtcblxuICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHByb2Nlc3MubmV4dFRpY2soZmx1c2gpO1xuICAgICAgICB9O1xuXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgLy8gSW4gSUUxMCwgTm9kZS5qcyAwLjkrLCBvciBodHRwczovL2dpdGh1Yi5jb20vTm9ibGVKUy9zZXRJbW1lZGlhdGVcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrID0gc2V0SW1tZWRpYXRlLmJpbmQod2luZG93LCBmbHVzaCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzZXRJbW1lZGlhdGUoZmx1c2gpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgTWVzc2FnZUNoYW5uZWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gbW9kZXJuIGJyb3dzZXJzXG4gICAgICAgIC8vIGh0dHA6Ly93d3cubm9uYmxvY2tpbmcuaW8vMjAxMS8wNi93aW5kb3duZXh0dGljay5odG1sXG4gICAgICAgIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgICAgIC8vIEF0IGxlYXN0IFNhZmFyaSBWZXJzaW9uIDYuMC41ICg4NTM2LjMwLjEpIGludGVybWl0dGVudGx5IGNhbm5vdCBjcmVhdGVcbiAgICAgICAgLy8gd29ya2luZyBtZXNzYWdlIHBvcnRzIHRoZSBmaXJzdCB0aW1lIGEgcGFnZSBsb2Fkcy5cbiAgICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IHJlcXVlc3RQb3J0VGljaztcbiAgICAgICAgICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZmx1c2g7XG4gICAgICAgICAgICBmbHVzaCgpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgcmVxdWVzdFBvcnRUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gT3BlcmEgcmVxdWlyZXMgdXMgdG8gcHJvdmlkZSBhIG1lc3NhZ2UgcGF5bG9hZCwgcmVnYXJkbGVzcyBvZlxuICAgICAgICAgICAgLy8gd2hldGhlciB3ZSB1c2UgaXQuXG4gICAgICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICAgICAgcmVxdWVzdFBvcnRUaWNrKCk7XG4gICAgICAgIH07XG5cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBvbGQgYnJvd3NlcnNcbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLy8gcnVucyBhIHRhc2sgYWZ0ZXIgYWxsIG90aGVyIHRhc2tzIGhhdmUgYmVlbiBydW5cbiAgICAvLyB0aGlzIGlzIHVzZWZ1bCBmb3IgdW5oYW5kbGVkIHJlamVjdGlvbiB0cmFja2luZyB0aGF0IG5lZWRzIHRvIGhhcHBlblxuICAgIC8vIGFmdGVyIGFsbCBgdGhlbmBkIHRhc2tzIGhhdmUgYmVlbiBydW4uXG4gICAgbmV4dFRpY2sucnVuQWZ0ZXIgPSBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICBsYXRlclF1ZXVlLnB1c2godGFzayk7XG4gICAgICAgIGlmICghZmx1c2hpbmcpIHtcbiAgICAgICAgICAgIGZsdXNoaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBuZXh0VGljaztcbn0pKCk7XG5cbi8vIEF0dGVtcHQgdG8gbWFrZSBnZW5lcmljcyBzYWZlIGluIHRoZSBmYWNlIG9mIGRvd25zdHJlYW1cbi8vIG1vZGlmaWNhdGlvbnMuXG4vLyBUaGVyZSBpcyBubyBzaXR1YXRpb24gd2hlcmUgdGhpcyBpcyBuZWNlc3NhcnkuXG4vLyBJZiB5b3UgbmVlZCBhIHNlY3VyaXR5IGd1YXJhbnRlZSwgdGhlc2UgcHJpbW9yZGlhbHMgbmVlZCB0byBiZVxuLy8gZGVlcGx5IGZyb3plbiBhbnl3YXksIGFuZCBpZiB5b3UgZG9u4oCZdCBuZWVkIGEgc2VjdXJpdHkgZ3VhcmFudGVlLFxuLy8gdGhpcyBpcyBqdXN0IHBsYWluIHBhcmFub2lkLlxuLy8gSG93ZXZlciwgdGhpcyAqKm1pZ2h0KiogaGF2ZSB0aGUgbmljZSBzaWRlLWVmZmVjdCBvZiByZWR1Y2luZyB0aGUgc2l6ZSBvZlxuLy8gdGhlIG1pbmlmaWVkIGNvZGUgYnkgcmVkdWNpbmcgeC5jYWxsKCkgdG8gbWVyZWx5IHgoKVxuLy8gU2VlIE1hcmsgTWlsbGVy4oCZcyBleHBsYW5hdGlvbiBvZiB3aGF0IHRoaXMgZG9lcy5cbi8vIGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWNvbnZlbnRpb25zOnNhZmVfbWV0YV9wcm9ncmFtbWluZ1xudmFyIGNhbGwgPSBGdW5jdGlvbi5jYWxsO1xuZnVuY3Rpb24gdW5jdXJyeVRoaXMoZikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBjYWxsLmFwcGx5KGYsIGFyZ3VtZW50cyk7XG4gICAgfTtcbn1cbi8vIFRoaXMgaXMgZXF1aXZhbGVudCwgYnV0IHNsb3dlcjpcbi8vIHVuY3VycnlUaGlzID0gRnVuY3Rpb25fYmluZC5iaW5kKEZ1bmN0aW9uX2JpbmQuY2FsbCk7XG4vLyBodHRwOi8vanNwZXJmLmNvbS91bmN1cnJ5dGhpc1xuXG52YXIgYXJyYXlfc2xpY2UgPSB1bmN1cnJ5VGhpcyhBcnJheS5wcm90b3R5cGUuc2xpY2UpO1xuXG52YXIgYXJyYXlfcmVkdWNlID0gdW5jdXJyeVRoaXMoXG4gICAgQXJyYXkucHJvdG90eXBlLnJlZHVjZSB8fCBmdW5jdGlvbiAoY2FsbGJhY2ssIGJhc2lzKSB7XG4gICAgICAgIHZhciBpbmRleCA9IDAsXG4gICAgICAgICAgICBsZW5ndGggPSB0aGlzLmxlbmd0aDtcbiAgICAgICAgLy8gY29uY2VybmluZyB0aGUgaW5pdGlhbCB2YWx1ZSwgaWYgb25lIGlzIG5vdCBwcm92aWRlZFxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgLy8gc2VlayB0byB0aGUgZmlyc3QgdmFsdWUgaW4gdGhlIGFycmF5LCBhY2NvdW50aW5nXG4gICAgICAgICAgICAvLyBmb3IgdGhlIHBvc3NpYmlsaXR5IHRoYXQgaXMgaXMgYSBzcGFyc2UgYXJyYXlcbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggaW4gdGhpcykge1xuICAgICAgICAgICAgICAgICAgICBiYXNpcyA9IHRoaXNbaW5kZXgrK107XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoKytpbmRleCA+PSBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gd2hpbGUgKDEpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJlZHVjZVxuICAgICAgICBmb3IgKDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIC8vIGFjY291bnQgZm9yIHRoZSBwb3NzaWJpbGl0eSB0aGF0IHRoZSBhcnJheSBpcyBzcGFyc2VcbiAgICAgICAgICAgIGlmIChpbmRleCBpbiB0aGlzKSB7XG4gICAgICAgICAgICAgICAgYmFzaXMgPSBjYWxsYmFjayhiYXNpcywgdGhpc1tpbmRleF0sIGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmFzaXM7XG4gICAgfVxuKTtcblxudmFyIGFycmF5X2luZGV4T2YgPSB1bmN1cnJ5VGhpcyhcbiAgICBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiB8fCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbm90IGEgdmVyeSBnb29kIHNoaW0sIGJ1dCBnb29kIGVub3VnaCBmb3Igb3VyIG9uZSB1c2Ugb2YgaXRcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpc1tpXSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuKTtcblxudmFyIGFycmF5X21hcCA9IHVuY3VycnlUaGlzKFxuICAgIEFycmF5LnByb3RvdHlwZS5tYXAgfHwgZnVuY3Rpb24gKGNhbGxiYWNrLCB0aGlzcCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBjb2xsZWN0ID0gW107XG4gICAgICAgIGFycmF5X3JlZHVjZShzZWxmLCBmdW5jdGlvbiAodW5kZWZpbmVkLCB2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGNvbGxlY3QucHVzaChjYWxsYmFjay5jYWxsKHRoaXNwLCB2YWx1ZSwgaW5kZXgsIHNlbGYpKTtcbiAgICAgICAgfSwgdm9pZCAwKTtcbiAgICAgICAgcmV0dXJuIGNvbGxlY3Q7XG4gICAgfVxuKTtcblxudmFyIG9iamVjdF9jcmVhdGUgPSBPYmplY3QuY3JlYXRlIHx8IGZ1bmN0aW9uIChwcm90b3R5cGUpIHtcbiAgICBmdW5jdGlvbiBUeXBlKCkgeyB9XG4gICAgVHlwZS5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG4gICAgcmV0dXJuIG5ldyBUeXBlKCk7XG59O1xuXG52YXIgb2JqZWN0X2hhc093blByb3BlcnR5ID0gdW5jdXJyeVRoaXMoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSk7XG5cbnZhciBvYmplY3Rfa2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAgaWYgKG9iamVjdF9oYXNPd25Qcm9wZXJ0eShvYmplY3QsIGtleSkpIHtcbiAgICAgICAgICAgIGtleXMucHVzaChrZXkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBrZXlzO1xufTtcblxudmFyIG9iamVjdF90b1N0cmluZyA9IHVuY3VycnlUaGlzKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcpO1xuXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gT2JqZWN0KHZhbHVlKTtcbn1cblxuLy8gZ2VuZXJhdG9yIHJlbGF0ZWQgc2hpbXNcblxuLy8gRklYTUU6IFJlbW92ZSB0aGlzIGZ1bmN0aW9uIG9uY2UgRVM2IGdlbmVyYXRvcnMgYXJlIGluIFNwaWRlck1vbmtleS5cbmZ1bmN0aW9uIGlzU3RvcEl0ZXJhdGlvbihleGNlcHRpb24pIHtcbiAgICByZXR1cm4gKFxuICAgICAgICBvYmplY3RfdG9TdHJpbmcoZXhjZXB0aW9uKSA9PT0gXCJbb2JqZWN0IFN0b3BJdGVyYXRpb25dXCIgfHxcbiAgICAgICAgZXhjZXB0aW9uIGluc3RhbmNlb2YgUVJldHVyblZhbHVlXG4gICAgKTtcbn1cblxuLy8gRklYTUU6IFJlbW92ZSB0aGlzIGhlbHBlciBhbmQgUS5yZXR1cm4gb25jZSBFUzYgZ2VuZXJhdG9ycyBhcmUgaW5cbi8vIFNwaWRlck1vbmtleS5cbnZhciBRUmV0dXJuVmFsdWU7XG5pZiAodHlwZW9mIFJldHVyblZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgUVJldHVyblZhbHVlID0gUmV0dXJuVmFsdWU7XG59IGVsc2Uge1xuICAgIFFSZXR1cm5WYWx1ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgfTtcbn1cblxuLy8gbG9uZyBzdGFjayB0cmFjZXNcblxudmFyIFNUQUNLX0pVTVBfU0VQQVJBVE9SID0gXCJGcm9tIHByZXZpb3VzIGV2ZW50OlwiO1xuXG5mdW5jdGlvbiBtYWtlU3RhY2tUcmFjZUxvbmcoZXJyb3IsIHByb21pc2UpIHtcbiAgICAvLyBJZiBwb3NzaWJsZSwgdHJhbnNmb3JtIHRoZSBlcnJvciBzdGFjayB0cmFjZSBieSByZW1vdmluZyBOb2RlIGFuZCBRXG4gICAgLy8gY3J1ZnQsIHRoZW4gY29uY2F0ZW5hdGluZyB3aXRoIHRoZSBzdGFjayB0cmFjZSBvZiBgcHJvbWlzZWAuIFNlZSAjNTcuXG4gICAgaWYgKGhhc1N0YWNrcyAmJlxuICAgICAgICBwcm9taXNlLnN0YWNrICYmXG4gICAgICAgIHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICBlcnJvciAhPT0gbnVsbCAmJlxuICAgICAgICBlcnJvci5zdGFjayAmJlxuICAgICAgICBlcnJvci5zdGFjay5pbmRleE9mKFNUQUNLX0pVTVBfU0VQQVJBVE9SKSA9PT0gLTFcbiAgICApIHtcbiAgICAgICAgdmFyIHN0YWNrcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBwID0gcHJvbWlzZTsgISFwOyBwID0gcC5zb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChwLnN0YWNrKSB7XG4gICAgICAgICAgICAgICAgc3RhY2tzLnVuc2hpZnQocC5zdGFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RhY2tzLnVuc2hpZnQoZXJyb3Iuc3RhY2spO1xuXG4gICAgICAgIHZhciBjb25jYXRlZFN0YWNrcyA9IHN0YWNrcy5qb2luKFwiXFxuXCIgKyBTVEFDS19KVU1QX1NFUEFSQVRPUiArIFwiXFxuXCIpO1xuICAgICAgICBlcnJvci5zdGFjayA9IGZpbHRlclN0YWNrU3RyaW5nKGNvbmNhdGVkU3RhY2tzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZpbHRlclN0YWNrU3RyaW5nKHN0YWNrU3RyaW5nKSB7XG4gICAgdmFyIGxpbmVzID0gc3RhY2tTdHJpbmcuc3BsaXQoXCJcXG5cIik7XG4gICAgdmFyIGRlc2lyZWRMaW5lcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGxpbmUgPSBsaW5lc1tpXTtcblxuICAgICAgICBpZiAoIWlzSW50ZXJuYWxGcmFtZShsaW5lKSAmJiAhaXNOb2RlRnJhbWUobGluZSkgJiYgbGluZSkge1xuICAgICAgICAgICAgZGVzaXJlZExpbmVzLnB1c2gobGluZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRlc2lyZWRMaW5lcy5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBpc05vZGVGcmFtZShzdGFja0xpbmUpIHtcbiAgICByZXR1cm4gc3RhY2tMaW5lLmluZGV4T2YoXCIobW9kdWxlLmpzOlwiKSAhPT0gLTEgfHxcbiAgICAgICAgICAgc3RhY2tMaW5lLmluZGV4T2YoXCIobm9kZS5qczpcIikgIT09IC0xO1xufVxuXG5mdW5jdGlvbiBnZXRGaWxlTmFtZUFuZExpbmVOdW1iZXIoc3RhY2tMaW5lKSB7XG4gICAgLy8gTmFtZWQgZnVuY3Rpb25zOiBcImF0IGZ1bmN0aW9uTmFtZSAoZmlsZW5hbWU6bGluZU51bWJlcjpjb2x1bW5OdW1iZXIpXCJcbiAgICAvLyBJbiBJRTEwIGZ1bmN0aW9uIG5hbWUgY2FuIGhhdmUgc3BhY2VzIChcIkFub255bW91cyBmdW5jdGlvblwiKSBPX29cbiAgICB2YXIgYXR0ZW1wdDEgPSAvYXQgLisgXFwoKC4rKTooXFxkKyk6KD86XFxkKylcXCkkLy5leGVjKHN0YWNrTGluZSk7XG4gICAgaWYgKGF0dGVtcHQxKSB7XG4gICAgICAgIHJldHVybiBbYXR0ZW1wdDFbMV0sIE51bWJlcihhdHRlbXB0MVsyXSldO1xuICAgIH1cblxuICAgIC8vIEFub255bW91cyBmdW5jdGlvbnM6IFwiYXQgZmlsZW5hbWU6bGluZU51bWJlcjpjb2x1bW5OdW1iZXJcIlxuICAgIHZhciBhdHRlbXB0MiA9IC9hdCAoW14gXSspOihcXGQrKTooPzpcXGQrKSQvLmV4ZWMoc3RhY2tMaW5lKTtcbiAgICBpZiAoYXR0ZW1wdDIpIHtcbiAgICAgICAgcmV0dXJuIFthdHRlbXB0MlsxXSwgTnVtYmVyKGF0dGVtcHQyWzJdKV07XG4gICAgfVxuXG4gICAgLy8gRmlyZWZveCBzdHlsZTogXCJmdW5jdGlvbkBmaWxlbmFtZTpsaW5lTnVtYmVyIG9yIEBmaWxlbmFtZTpsaW5lTnVtYmVyXCJcbiAgICB2YXIgYXR0ZW1wdDMgPSAvLipAKC4rKTooXFxkKykkLy5leGVjKHN0YWNrTGluZSk7XG4gICAgaWYgKGF0dGVtcHQzKSB7XG4gICAgICAgIHJldHVybiBbYXR0ZW1wdDNbMV0sIE51bWJlcihhdHRlbXB0M1syXSldO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNJbnRlcm5hbEZyYW1lKHN0YWNrTGluZSkge1xuICAgIHZhciBmaWxlTmFtZUFuZExpbmVOdW1iZXIgPSBnZXRGaWxlTmFtZUFuZExpbmVOdW1iZXIoc3RhY2tMaW5lKTtcblxuICAgIGlmICghZmlsZU5hbWVBbmRMaW5lTnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgZmlsZU5hbWUgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMF07XG4gICAgdmFyIGxpbmVOdW1iZXIgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMV07XG5cbiAgICByZXR1cm4gZmlsZU5hbWUgPT09IHFGaWxlTmFtZSAmJlxuICAgICAgICBsaW5lTnVtYmVyID49IHFTdGFydGluZ0xpbmUgJiZcbiAgICAgICAgbGluZU51bWJlciA8PSBxRW5kaW5nTGluZTtcbn1cblxuLy8gZGlzY292ZXIgb3duIGZpbGUgbmFtZSBhbmQgbGluZSBudW1iZXIgcmFuZ2UgZm9yIGZpbHRlcmluZyBzdGFja1xuLy8gdHJhY2VzXG5mdW5jdGlvbiBjYXB0dXJlTGluZSgpIHtcbiAgICBpZiAoIWhhc1N0YWNrcykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB2YXIgbGluZXMgPSBlLnN0YWNrLnNwbGl0KFwiXFxuXCIpO1xuICAgICAgICB2YXIgZmlyc3RMaW5lID0gbGluZXNbMF0uaW5kZXhPZihcIkBcIikgPiAwID8gbGluZXNbMV0gOiBsaW5lc1syXTtcbiAgICAgICAgdmFyIGZpbGVOYW1lQW5kTGluZU51bWJlciA9IGdldEZpbGVOYW1lQW5kTGluZU51bWJlcihmaXJzdExpbmUpO1xuICAgICAgICBpZiAoIWZpbGVOYW1lQW5kTGluZU51bWJlcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcUZpbGVOYW1lID0gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzBdO1xuICAgICAgICByZXR1cm4gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzFdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVwcmVjYXRlKGNhbGxiYWNrLCBuYW1lLCBhbHRlcm5hdGl2ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICAgICAgdHlwZW9mIGNvbnNvbGUud2FybiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4obmFtZSArIFwiIGlzIGRlcHJlY2F0ZWQsIHVzZSBcIiArIGFsdGVybmF0aXZlICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBcIiBpbnN0ZWFkLlwiLCBuZXcgRXJyb3IoXCJcIikuc3RhY2spO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseShjYWxsYmFjaywgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuXG4vLyBlbmQgb2Ygc2hpbXNcbi8vIGJlZ2lubmluZyBvZiByZWFsIHdvcmtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcHJvbWlzZSBmb3IgYW4gaW1tZWRpYXRlIHJlZmVyZW5jZSwgcGFzc2VzIHByb21pc2VzIHRocm91Z2gsIG9yXG4gKiBjb2VyY2VzIHByb21pc2VzIGZyb20gZGlmZmVyZW50IHN5c3RlbXMuXG4gKiBAcGFyYW0gdmFsdWUgaW1tZWRpYXRlIHJlZmVyZW5jZSBvciBwcm9taXNlXG4gKi9cbmZ1bmN0aW9uIFEodmFsdWUpIHtcbiAgICAvLyBJZiB0aGUgb2JqZWN0IGlzIGFscmVhZHkgYSBQcm9taXNlLCByZXR1cm4gaXQgZGlyZWN0bHkuICBUaGlzIGVuYWJsZXNcbiAgICAvLyB0aGUgcmVzb2x2ZSBmdW5jdGlvbiB0byBib3RoIGJlIHVzZWQgdG8gY3JlYXRlZCByZWZlcmVuY2VzIGZyb20gb2JqZWN0cyxcbiAgICAvLyBidXQgdG8gdG9sZXJhYmx5IGNvZXJjZSBub24tcHJvbWlzZXMgdG8gcHJvbWlzZXMuXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgLy8gYXNzaW1pbGF0ZSB0aGVuYWJsZXNcbiAgICBpZiAoaXNQcm9taXNlQWxpa2UodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBjb2VyY2UodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmdWxmaWxsKHZhbHVlKTtcbiAgICB9XG59XG5RLnJlc29sdmUgPSBRO1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgdGFzayBpbiBhIGZ1dHVyZSB0dXJuIG9mIHRoZSBldmVudCBsb29wLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gdGFza1xuICovXG5RLm5leHRUaWNrID0gbmV4dFRpY2s7XG5cbi8qKlxuICogQ29udHJvbHMgd2hldGhlciBvciBub3QgbG9uZyBzdGFjayB0cmFjZXMgd2lsbCBiZSBvblxuICovXG5RLmxvbmdTdGFja1N1cHBvcnQgPSBmYWxzZTtcblxuLy8gZW5hYmxlIGxvbmcgc3RhY2tzIGlmIFFfREVCVUcgaXMgc2V0XG5pZiAodHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiYgcHJvY2VzcyAmJiBwcm9jZXNzLmVudiAmJiBwcm9jZXNzLmVudi5RX0RFQlVHKSB7XG4gICAgUS5sb25nU3RhY2tTdXBwb3J0ID0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEge3Byb21pc2UsIHJlc29sdmUsIHJlamVjdH0gb2JqZWN0LlxuICpcbiAqIGByZXNvbHZlYCBpcyBhIGNhbGxiYWNrIHRvIGludm9rZSB3aXRoIGEgbW9yZSByZXNvbHZlZCB2YWx1ZSBmb3IgdGhlXG4gKiBwcm9taXNlLiBUbyBmdWxmaWxsIHRoZSBwcm9taXNlLCBpbnZva2UgYHJlc29sdmVgIHdpdGggYW55IHZhbHVlIHRoYXQgaXNcbiAqIG5vdCBhIHRoZW5hYmxlLiBUbyByZWplY3QgdGhlIHByb21pc2UsIGludm9rZSBgcmVzb2x2ZWAgd2l0aCBhIHJlamVjdGVkXG4gKiB0aGVuYWJsZSwgb3IgaW52b2tlIGByZWplY3RgIHdpdGggdGhlIHJlYXNvbiBkaXJlY3RseS4gVG8gcmVzb2x2ZSB0aGVcbiAqIHByb21pc2UgdG8gYW5vdGhlciB0aGVuYWJsZSwgdGh1cyBwdXR0aW5nIGl0IGluIHRoZSBzYW1lIHN0YXRlLCBpbnZva2VcbiAqIGByZXNvbHZlYCB3aXRoIHRoYXQgb3RoZXIgdGhlbmFibGUuXG4gKi9cblEuZGVmZXIgPSBkZWZlcjtcbmZ1bmN0aW9uIGRlZmVyKCkge1xuICAgIC8vIGlmIFwibWVzc2FnZXNcIiBpcyBhbiBcIkFycmF5XCIsIHRoYXQgaW5kaWNhdGVzIHRoYXQgdGhlIHByb21pc2UgaGFzIG5vdCB5ZXRcbiAgICAvLyBiZWVuIHJlc29sdmVkLiAgSWYgaXQgaXMgXCJ1bmRlZmluZWRcIiwgaXQgaGFzIGJlZW4gcmVzb2x2ZWQuICBFYWNoXG4gICAgLy8gZWxlbWVudCBvZiB0aGUgbWVzc2FnZXMgYXJyYXkgaXMgaXRzZWxmIGFuIGFycmF5IG9mIGNvbXBsZXRlIGFyZ3VtZW50cyB0b1xuICAgIC8vIGZvcndhcmQgdG8gdGhlIHJlc29sdmVkIHByb21pc2UuICBXZSBjb2VyY2UgdGhlIHJlc29sdXRpb24gdmFsdWUgdG8gYVxuICAgIC8vIHByb21pc2UgdXNpbmcgdGhlIGByZXNvbHZlYCBmdW5jdGlvbiBiZWNhdXNlIGl0IGhhbmRsZXMgYm90aCBmdWxseVxuICAgIC8vIG5vbi10aGVuYWJsZSB2YWx1ZXMgYW5kIG90aGVyIHRoZW5hYmxlcyBncmFjZWZ1bGx5LlxuICAgIHZhciBtZXNzYWdlcyA9IFtdLCBwcm9ncmVzc0xpc3RlbmVycyA9IFtdLCByZXNvbHZlZFByb21pc2U7XG5cbiAgICB2YXIgZGVmZXJyZWQgPSBvYmplY3RfY3JlYXRlKGRlZmVyLnByb3RvdHlwZSk7XG4gICAgdmFyIHByb21pc2UgPSBvYmplY3RfY3JlYXRlKFByb21pc2UucHJvdG90eXBlKTtcblxuICAgIHByb21pc2UucHJvbWlzZURpc3BhdGNoID0gZnVuY3Rpb24gKHJlc29sdmUsIG9wLCBvcGVyYW5kcykge1xuICAgICAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgICAgIGlmIChtZXNzYWdlcykge1xuICAgICAgICAgICAgbWVzc2FnZXMucHVzaChhcmdzKTtcbiAgICAgICAgICAgIGlmIChvcCA9PT0gXCJ3aGVuXCIgJiYgb3BlcmFuZHNbMV0pIHsgLy8gcHJvZ3Jlc3Mgb3BlcmFuZFxuICAgICAgICAgICAgICAgIHByb2dyZXNzTGlzdGVuZXJzLnB1c2gob3BlcmFuZHNbMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZWRQcm9taXNlLnByb21pc2VEaXNwYXRjaC5hcHBseShyZXNvbHZlZFByb21pc2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gWFhYIGRlcHJlY2F0ZWRcbiAgICBwcm9taXNlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChtZXNzYWdlcykge1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5lYXJlclZhbHVlID0gbmVhcmVyKHJlc29sdmVkUHJvbWlzZSk7XG4gICAgICAgIGlmIChpc1Byb21pc2UobmVhcmVyVmFsdWUpKSB7XG4gICAgICAgICAgICByZXNvbHZlZFByb21pc2UgPSBuZWFyZXJWYWx1ZTsgLy8gc2hvcnRlbiBjaGFpblxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZWFyZXJWYWx1ZTtcbiAgICB9O1xuXG4gICAgcHJvbWlzZS5pbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwicGVuZGluZ1wiIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc29sdmVkUHJvbWlzZS5pbnNwZWN0KCk7XG4gICAgfTtcblxuICAgIGlmIChRLmxvbmdTdGFja1N1cHBvcnQgJiYgaGFzU3RhY2tzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gTk9URTogZG9uJ3QgdHJ5IHRvIHVzZSBgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2VgIG9yIHRyYW5zZmVyIHRoZVxuICAgICAgICAgICAgLy8gYWNjZXNzb3IgYXJvdW5kOyB0aGF0IGNhdXNlcyBtZW1vcnkgbGVha3MgYXMgcGVyIEdILTExMS4gSnVzdFxuICAgICAgICAgICAgLy8gcmVpZnkgdGhlIHN0YWNrIHRyYWNlIGFzIGEgc3RyaW5nIEFTQVAuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gQXQgdGhlIHNhbWUgdGltZSwgY3V0IG9mZiB0aGUgZmlyc3QgbGluZTsgaXQncyBhbHdheXMganVzdFxuICAgICAgICAgICAgLy8gXCJbb2JqZWN0IFByb21pc2VdXFxuXCIsIGFzIHBlciB0aGUgYHRvU3RyaW5nYC5cbiAgICAgICAgICAgIHByb21pc2Uuc3RhY2sgPSBlLnN0YWNrLnN1YnN0cmluZyhlLnN0YWNrLmluZGV4T2YoXCJcXG5cIikgKyAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5PVEU6IHdlIGRvIHRoZSBjaGVja3MgZm9yIGByZXNvbHZlZFByb21pc2VgIGluIGVhY2ggbWV0aG9kLCBpbnN0ZWFkIG9mXG4gICAgLy8gY29uc29saWRhdGluZyB0aGVtIGludG8gYGJlY29tZWAsIHNpbmNlIG90aGVyd2lzZSB3ZSdkIGNyZWF0ZSBuZXdcbiAgICAvLyBwcm9taXNlcyB3aXRoIHRoZSBsaW5lcyBgYmVjb21lKHdoYXRldmVyKHZhbHVlKSlgLiBTZWUgZS5nLiBHSC0yNTIuXG5cbiAgICBmdW5jdGlvbiBiZWNvbWUobmV3UHJvbWlzZSkge1xuICAgICAgICByZXNvbHZlZFByb21pc2UgPSBuZXdQcm9taXNlO1xuICAgICAgICBwcm9taXNlLnNvdXJjZSA9IG5ld1Byb21pc2U7XG5cbiAgICAgICAgYXJyYXlfcmVkdWNlKG1lc3NhZ2VzLCBmdW5jdGlvbiAodW5kZWZpbmVkLCBtZXNzYWdlKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBuZXdQcm9taXNlLnByb21pc2VEaXNwYXRjaC5hcHBseShuZXdQcm9taXNlLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCB2b2lkIDApO1xuXG4gICAgICAgIG1lc3NhZ2VzID0gdm9pZCAwO1xuICAgICAgICBwcm9ncmVzc0xpc3RlbmVycyA9IHZvaWQgMDtcbiAgICB9XG5cbiAgICBkZWZlcnJlZC5wcm9taXNlID0gcHJvbWlzZTtcbiAgICBkZWZlcnJlZC5yZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlY29tZShRKHZhbHVlKSk7XG4gICAgfTtcblxuICAgIGRlZmVycmVkLmZ1bGZpbGwgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVjb21lKGZ1bGZpbGwodmFsdWUpKTtcbiAgICB9O1xuICAgIGRlZmVycmVkLnJlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVjb21lKHJlamVjdChyZWFzb24pKTtcbiAgICB9O1xuICAgIGRlZmVycmVkLm5vdGlmeSA9IGZ1bmN0aW9uIChwcm9ncmVzcykge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhcnJheV9yZWR1Y2UocHJvZ3Jlc3NMaXN0ZW5lcnMsIGZ1bmN0aW9uICh1bmRlZmluZWQsIHByb2dyZXNzTGlzdGVuZXIpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHByb2dyZXNzTGlzdGVuZXIocHJvZ3Jlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIHZvaWQgMCk7XG4gICAgfTtcblxuICAgIHJldHVybiBkZWZlcnJlZDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgTm9kZS1zdHlsZSBjYWxsYmFjayB0aGF0IHdpbGwgcmVzb2x2ZSBvciByZWplY3QgdGhlIGRlZmVycmVkXG4gKiBwcm9taXNlLlxuICogQHJldHVybnMgYSBub2RlYmFja1xuICovXG5kZWZlci5wcm90b3R5cGUubWFrZU5vZGVSZXNvbHZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChlcnJvciwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICBzZWxmLnJlamVjdChlcnJvcik7XG4gICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICAgIHNlbGYucmVzb2x2ZShhcnJheV9zbGljZShhcmd1bWVudHMsIDEpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYucmVzb2x2ZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuLyoqXG4gKiBAcGFyYW0gcmVzb2x2ZXIge0Z1bmN0aW9ufSBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBub3RoaW5nIGFuZCBhY2NlcHRzXG4gKiB0aGUgcmVzb2x2ZSwgcmVqZWN0LCBhbmQgbm90aWZ5IGZ1bmN0aW9ucyBmb3IgYSBkZWZlcnJlZC5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IG1heSBiZSByZXNvbHZlZCB3aXRoIHRoZSBnaXZlbiByZXNvbHZlIGFuZCByZWplY3RcbiAqIGZ1bmN0aW9ucywgb3IgcmVqZWN0ZWQgYnkgYSB0aHJvd24gZXhjZXB0aW9uIGluIHJlc29sdmVyXG4gKi9cblEuUHJvbWlzZSA9IHByb21pc2U7IC8vIEVTNlxuUS5wcm9taXNlID0gcHJvbWlzZTtcbmZ1bmN0aW9uIHByb21pc2UocmVzb2x2ZXIpIHtcbiAgICBpZiAodHlwZW9mIHJlc29sdmVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInJlc29sdmVyIG11c3QgYmUgYSBmdW5jdGlvbi5cIik7XG4gICAgfVxuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdHJ5IHtcbiAgICAgICAgcmVzb2x2ZXIoZGVmZXJyZWQucmVzb2x2ZSwgZGVmZXJyZWQucmVqZWN0LCBkZWZlcnJlZC5ub3RpZnkpO1xuICAgIH0gY2F0Y2ggKHJlYXNvbikge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVhc29uKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59XG5cbnByb21pc2UucmFjZSA9IHJhY2U7IC8vIEVTNlxucHJvbWlzZS5hbGwgPSBhbGw7IC8vIEVTNlxucHJvbWlzZS5yZWplY3QgPSByZWplY3Q7IC8vIEVTNlxucHJvbWlzZS5yZXNvbHZlID0gUTsgLy8gRVM2XG5cbi8vIFhYWCBleHBlcmltZW50YWwuICBUaGlzIG1ldGhvZCBpcyBhIHdheSB0byBkZW5vdGUgdGhhdCBhIGxvY2FsIHZhbHVlIGlzXG4vLyBzZXJpYWxpemFibGUgYW5kIHNob3VsZCBiZSBpbW1lZGlhdGVseSBkaXNwYXRjaGVkIHRvIGEgcmVtb3RlIHVwb24gcmVxdWVzdCxcbi8vIGluc3RlYWQgb2YgcGFzc2luZyBhIHJlZmVyZW5jZS5cblEucGFzc0J5Q29weSA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAvL2ZyZWV6ZShvYmplY3QpO1xuICAgIC8vcGFzc0J5Q29waWVzLnNldChvYmplY3QsIHRydWUpO1xuICAgIHJldHVybiBvYmplY3Q7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5wYXNzQnlDb3B5ID0gZnVuY3Rpb24gKCkge1xuICAgIC8vZnJlZXplKG9iamVjdCk7XG4gICAgLy9wYXNzQnlDb3BpZXMuc2V0KG9iamVjdCwgdHJ1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIElmIHR3byBwcm9taXNlcyBldmVudHVhbGx5IGZ1bGZpbGwgdG8gdGhlIHNhbWUgdmFsdWUsIHByb21pc2VzIHRoYXQgdmFsdWUsXG4gKiBidXQgb3RoZXJ3aXNlIHJlamVjdHMuXG4gKiBAcGFyYW0geCB7QW55Kn1cbiAqIEBwYXJhbSB5IHtBbnkqfVxuICogQHJldHVybnMge0FueSp9IGEgcHJvbWlzZSBmb3IgeCBhbmQgeSBpZiB0aGV5IGFyZSB0aGUgc2FtZSwgYnV0IGEgcmVqZWN0aW9uXG4gKiBvdGhlcndpc2UuXG4gKlxuICovXG5RLmpvaW4gPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHJldHVybiBRKHgpLmpvaW4oeSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5qb2luID0gZnVuY3Rpb24gKHRoYXQpIHtcbiAgICByZXR1cm4gUShbdGhpcywgdGhhdF0pLnNwcmVhZChmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICBpZiAoeCA9PT0geSkge1xuICAgICAgICAgICAgLy8gVE9ETzogXCI9PT1cIiBzaG91bGQgYmUgT2JqZWN0LmlzIG9yIGVxdWl2XG4gICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IGpvaW46IG5vdCB0aGUgc2FtZTogXCIgKyB4ICsgXCIgXCIgKyB5KTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIGZpcnN0IG9mIGFuIGFycmF5IG9mIHByb21pc2VzIHRvIGJlY29tZSBzZXR0bGVkLlxuICogQHBhcmFtIGFuc3dlcnMge0FycmF5W0FueSpdfSBwcm9taXNlcyB0byByYWNlXG4gKiBAcmV0dXJucyB7QW55Kn0gdGhlIGZpcnN0IHByb21pc2UgdG8gYmUgc2V0dGxlZFxuICovXG5RLnJhY2UgPSByYWNlO1xuZnVuY3Rpb24gcmFjZShhbnN3ZXJQcykge1xuICAgIHJldHVybiBwcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgLy8gU3dpdGNoIHRvIHRoaXMgb25jZSB3ZSBjYW4gYXNzdW1lIGF0IGxlYXN0IEVTNVxuICAgICAgICAvLyBhbnN3ZXJQcy5mb3JFYWNoKGZ1bmN0aW9uIChhbnN3ZXJQKSB7XG4gICAgICAgIC8vICAgICBRKGFuc3dlclApLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vIFVzZSB0aGlzIGluIHRoZSBtZWFudGltZVxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYW5zd2VyUHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIFEoYW5zd2VyUHNbaV0pLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5yYWNlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oUS5yYWNlKTtcbn07XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIFByb21pc2Ugd2l0aCBhIHByb21pc2UgZGVzY3JpcHRvciBvYmplY3QgYW5kIG9wdGlvbmFsIGZhbGxiYWNrXG4gKiBmdW5jdGlvbi4gIFRoZSBkZXNjcmlwdG9yIGNvbnRhaW5zIG1ldGhvZHMgbGlrZSB3aGVuKHJlamVjdGVkKSwgZ2V0KG5hbWUpLFxuICogc2V0KG5hbWUsIHZhbHVlKSwgcG9zdChuYW1lLCBhcmdzKSwgYW5kIGRlbGV0ZShuYW1lKSwgd2hpY2ggYWxsXG4gKiByZXR1cm4gZWl0aGVyIGEgdmFsdWUsIGEgcHJvbWlzZSBmb3IgYSB2YWx1ZSwgb3IgYSByZWplY3Rpb24uICBUaGUgZmFsbGJhY2tcbiAqIGFjY2VwdHMgdGhlIG9wZXJhdGlvbiBuYW1lLCBhIHJlc29sdmVyLCBhbmQgYW55IGZ1cnRoZXIgYXJndW1lbnRzIHRoYXQgd291bGRcbiAqIGhhdmUgYmVlbiBmb3J3YXJkZWQgdG8gdGhlIGFwcHJvcHJpYXRlIG1ldGhvZCBhYm92ZSBoYWQgYSBtZXRob2QgYmVlblxuICogcHJvdmlkZWQgd2l0aCB0aGUgcHJvcGVyIG5hbWUuICBUaGUgQVBJIG1ha2VzIG5vIGd1YXJhbnRlZXMgYWJvdXQgdGhlIG5hdHVyZVxuICogb2YgdGhlIHJldHVybmVkIG9iamVjdCwgYXBhcnQgZnJvbSB0aGF0IGl0IGlzIHVzYWJsZSB3aGVyZWV2ZXIgcHJvbWlzZXMgYXJlXG4gKiBib3VnaHQgYW5kIHNvbGQuXG4gKi9cblEubWFrZVByb21pc2UgPSBQcm9taXNlO1xuZnVuY3Rpb24gUHJvbWlzZShkZXNjcmlwdG9yLCBmYWxsYmFjaywgaW5zcGVjdCkge1xuICAgIGlmIChmYWxsYmFjayA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZhbGxiYWNrID0gZnVuY3Rpb24gKG9wKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcIlByb21pc2UgZG9lcyBub3Qgc3VwcG9ydCBvcGVyYXRpb246IFwiICsgb3BcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAoaW5zcGVjdCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge3N0YXRlOiBcInVua25vd25cIn07XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIHByb21pc2UgPSBvYmplY3RfY3JlYXRlKFByb21pc2UucHJvdG90eXBlKTtcblxuICAgIHByb21pc2UucHJvbWlzZURpc3BhdGNoID0gZnVuY3Rpb24gKHJlc29sdmUsIG9wLCBhcmdzKSB7XG4gICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoZGVzY3JpcHRvcltvcF0pIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBkZXNjcmlwdG9yW29wXS5hcHBseShwcm9taXNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZmFsbGJhY2suY2FsbChwcm9taXNlLCBvcCwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc29sdmUpIHtcbiAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBwcm9taXNlLmluc3BlY3QgPSBpbnNwZWN0O1xuXG4gICAgLy8gWFhYIGRlcHJlY2F0ZWQgYHZhbHVlT2ZgIGFuZCBgZXhjZXB0aW9uYCBzdXBwb3J0XG4gICAgaWYgKGluc3BlY3QpIHtcbiAgICAgICAgdmFyIGluc3BlY3RlZCA9IGluc3BlY3QoKTtcbiAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiKSB7XG4gICAgICAgICAgICBwcm9taXNlLmV4Y2VwdGlvbiA9IGluc3BlY3RlZC5yZWFzb247XG4gICAgICAgIH1cblxuICAgICAgICBwcm9taXNlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaW5zcGVjdGVkID0gaW5zcGVjdCgpO1xuICAgICAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJwZW5kaW5nXCIgfHxcbiAgICAgICAgICAgICAgICBpbnNwZWN0ZWQuc3RhdGUgPT09IFwicmVqZWN0ZWRcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGluc3BlY3RlZC52YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFwiW29iamVjdCBQcm9taXNlXVwiO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlbiA9IGZ1bmN0aW9uIChmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIGRvbmUgPSBmYWxzZTsgICAvLyBlbnN1cmUgdGhlIHVudHJ1c3RlZCBwcm9taXNlIG1ha2VzIGF0IG1vc3QgYVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2luZ2xlIGNhbGwgdG8gb25lIG9mIHRoZSBjYWxsYmFja3NcblxuICAgIGZ1bmN0aW9uIF9mdWxmaWxsZWQodmFsdWUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgZnVsZmlsbGVkID09PSBcImZ1bmN0aW9uXCIgPyBmdWxmaWxsZWQodmFsdWUpIDogdmFsdWU7XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3JlamVjdGVkKGV4Y2VwdGlvbikge1xuICAgICAgICBpZiAodHlwZW9mIHJlamVjdGVkID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIG1ha2VTdGFja1RyYWNlTG9uZyhleGNlcHRpb24sIHNlbGYpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKG5ld0V4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3RXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3Byb2dyZXNzZWQodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBwcm9ncmVzc2VkID09PSBcImZ1bmN0aW9uXCIgPyBwcm9ncmVzc2VkKHZhbHVlKSA6IHZhbHVlO1xuICAgIH1cblxuICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnByb21pc2VEaXNwYXRjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoX2Z1bGZpbGxlZCh2YWx1ZSkpO1xuICAgICAgICB9LCBcIndoZW5cIiwgW2Z1bmN0aW9uIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoX3JlamVjdGVkKGV4Y2VwdGlvbikpO1xuICAgICAgICB9XSk7XG4gICAgfSk7XG5cbiAgICAvLyBQcm9ncmVzcyBwcm9wYWdhdG9yIG5lZWQgdG8gYmUgYXR0YWNoZWQgaW4gdGhlIGN1cnJlbnQgdGljay5cbiAgICBzZWxmLnByb21pc2VEaXNwYXRjaCh2b2lkIDAsIFwid2hlblwiLCBbdm9pZCAwLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIG5ld1ZhbHVlO1xuICAgICAgICB2YXIgdGhyZXcgPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG5ld1ZhbHVlID0gX3Byb2dyZXNzZWQodmFsdWUpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aHJldyA9IHRydWU7XG4gICAgICAgICAgICBpZiAoUS5vbmVycm9yKSB7XG4gICAgICAgICAgICAgICAgUS5vbmVycm9yKGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aHJldykge1xuICAgICAgICAgICAgZGVmZXJyZWQubm90aWZ5KG5ld1ZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuUS50YXAgPSBmdW5jdGlvbiAocHJvbWlzZSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50YXAoY2FsbGJhY2spO1xufTtcblxuLyoqXG4gKiBXb3JrcyBhbG1vc3QgbGlrZSBcImZpbmFsbHlcIiwgYnV0IG5vdCBjYWxsZWQgZm9yIHJlamVjdGlvbnMuXG4gKiBPcmlnaW5hbCByZXNvbHV0aW9uIHZhbHVlIGlzIHBhc3NlZCB0aHJvdWdoIGNhbGxiYWNrIHVuYWZmZWN0ZWQuXG4gKiBDYWxsYmFjayBtYXkgcmV0dXJuIGEgcHJvbWlzZSB0aGF0IHdpbGwgYmUgYXdhaXRlZCBmb3IuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybnMge1EuUHJvbWlzZX1cbiAqIEBleGFtcGxlXG4gKiBkb1NvbWV0aGluZygpXG4gKiAgIC50aGVuKC4uLilcbiAqICAgLnRhcChjb25zb2xlLmxvZylcbiAqICAgLnRoZW4oLi4uKTtcbiAqL1xuUHJvbWlzZS5wcm90b3R5cGUudGFwID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sgPSBRKGNhbGxiYWNrKTtcblxuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCh2YWx1ZSkudGhlblJlc29sdmUodmFsdWUpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgYW4gb2JzZXJ2ZXIgb24gYSBwcm9taXNlLlxuICpcbiAqIEd1YXJhbnRlZXM6XG4gKlxuICogMS4gdGhhdCBmdWxmaWxsZWQgYW5kIHJlamVjdGVkIHdpbGwgYmUgY2FsbGVkIG9ubHkgb25jZS5cbiAqIDIuIHRoYXQgZWl0aGVyIHRoZSBmdWxmaWxsZWQgY2FsbGJhY2sgb3IgdGhlIHJlamVjdGVkIGNhbGxiYWNrIHdpbGwgYmVcbiAqICAgIGNhbGxlZCwgYnV0IG5vdCBib3RoLlxuICogMy4gdGhhdCBmdWxmaWxsZWQgYW5kIHJlamVjdGVkIHdpbGwgbm90IGJlIGNhbGxlZCBpbiB0aGlzIHR1cm4uXG4gKlxuICogQHBhcmFtIHZhbHVlICAgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIHRvIG9ic2VydmVcbiAqIEBwYXJhbSBmdWxmaWxsZWQgIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aXRoIHRoZSBmdWxmaWxsZWQgdmFsdWVcbiAqIEBwYXJhbSByZWplY3RlZCAgIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aXRoIHRoZSByZWplY3Rpb24gZXhjZXB0aW9uXG4gKiBAcGFyYW0gcHJvZ3Jlc3NlZCBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gYW55IHByb2dyZXNzIG5vdGlmaWNhdGlvbnNcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBmcm9tIHRoZSBpbnZva2VkIGNhbGxiYWNrXG4gKi9cblEud2hlbiA9IHdoZW47XG5mdW5jdGlvbiB3aGVuKHZhbHVlLCBmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIFEodmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3NlZCk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnRoZW5SZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiB2YWx1ZTsgfSk7XG59O1xuXG5RLnRoZW5SZXNvbHZlID0gZnVuY3Rpb24gKHByb21pc2UsIHZhbHVlKSB7XG4gICAgcmV0dXJuIFEocHJvbWlzZSkudGhlblJlc29sdmUodmFsdWUpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlblJlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICgpIHsgdGhyb3cgcmVhc29uOyB9KTtcbn07XG5cblEudGhlblJlamVjdCA9IGZ1bmN0aW9uIChwcm9taXNlLCByZWFzb24pIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50aGVuUmVqZWN0KHJlYXNvbik7XG59O1xuXG4vKipcbiAqIElmIGFuIG9iamVjdCBpcyBub3QgYSBwcm9taXNlLCBpdCBpcyBhcyBcIm5lYXJcIiBhcyBwb3NzaWJsZS5cbiAqIElmIGEgcHJvbWlzZSBpcyByZWplY3RlZCwgaXQgaXMgYXMgXCJuZWFyXCIgYXMgcG9zc2libGUgdG9vLlxuICogSWYgaXTigJlzIGEgZnVsZmlsbGVkIHByb21pc2UsIHRoZSBmdWxmaWxsbWVudCB2YWx1ZSBpcyBuZWFyZXIuXG4gKiBJZiBpdOKAmXMgYSBkZWZlcnJlZCBwcm9taXNlIGFuZCB0aGUgZGVmZXJyZWQgaGFzIGJlZW4gcmVzb2x2ZWQsIHRoZVxuICogcmVzb2x1dGlvbiBpcyBcIm5lYXJlclwiLlxuICogQHBhcmFtIG9iamVjdFxuICogQHJldHVybnMgbW9zdCByZXNvbHZlZCAobmVhcmVzdCkgZm9ybSBvZiB0aGUgb2JqZWN0XG4gKi9cblxuLy8gWFhYIHNob3VsZCB3ZSByZS1kbyB0aGlzP1xuUS5uZWFyZXIgPSBuZWFyZXI7XG5mdW5jdGlvbiBuZWFyZXIodmFsdWUpIHtcbiAgICBpZiAoaXNQcm9taXNlKHZhbHVlKSkge1xuICAgICAgICB2YXIgaW5zcGVjdGVkID0gdmFsdWUuaW5zcGVjdCgpO1xuICAgICAgICBpZiAoaW5zcGVjdGVkLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5zcGVjdGVkLnZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSBwcm9taXNlLlxuICogT3RoZXJ3aXNlIGl0IGlzIGEgZnVsZmlsbGVkIHZhbHVlLlxuICovXG5RLmlzUHJvbWlzZSA9IGlzUHJvbWlzZTtcbmZ1bmN0aW9uIGlzUHJvbWlzZShvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0IGluc3RhbmNlb2YgUHJvbWlzZTtcbn1cblxuUS5pc1Byb21pc2VBbGlrZSA9IGlzUHJvbWlzZUFsaWtlO1xuZnVuY3Rpb24gaXNQcm9taXNlQWxpa2Uob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzT2JqZWN0KG9iamVjdCkgJiYgdHlwZW9mIG9iamVjdC50aGVuID09PSBcImZ1bmN0aW9uXCI7XG59XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcGVuZGluZyBwcm9taXNlLCBtZWFuaW5nIG5vdFxuICogZnVsZmlsbGVkIG9yIHJlamVjdGVkLlxuICovXG5RLmlzUGVuZGluZyA9IGlzUGVuZGluZztcbmZ1bmN0aW9uIGlzUGVuZGluZyhvYmplY3QpIHtcbiAgICByZXR1cm4gaXNQcm9taXNlKG9iamVjdCkgJiYgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJwZW5kaW5nXCI7XG59XG5cblByb21pc2UucHJvdG90eXBlLmlzUGVuZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnNwZWN0KCkuc3RhdGUgPT09IFwicGVuZGluZ1wiO1xufTtcblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSB2YWx1ZSBvciBmdWxmaWxsZWRcbiAqIHByb21pc2UuXG4gKi9cblEuaXNGdWxmaWxsZWQgPSBpc0Z1bGZpbGxlZDtcbmZ1bmN0aW9uIGlzRnVsZmlsbGVkKG9iamVjdCkge1xuICAgIHJldHVybiAhaXNQcm9taXNlKG9iamVjdCkgfHwgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIjtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuaXNGdWxmaWxsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zcGVjdCgpLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiO1xufTtcblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSByZWplY3RlZCBwcm9taXNlLlxuICovXG5RLmlzUmVqZWN0ZWQgPSBpc1JlamVjdGVkO1xuZnVuY3Rpb24gaXNSZWplY3RlZChvYmplY3QpIHtcbiAgICByZXR1cm4gaXNQcm9taXNlKG9iamVjdCkgJiYgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5pc1JlamVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiO1xufTtcblxuLy8vLyBCRUdJTiBVTkhBTkRMRUQgUkVKRUNUSU9OIFRSQUNLSU5HXG5cbi8vIFRoaXMgcHJvbWlzZSBsaWJyYXJ5IGNvbnN1bWVzIGV4Y2VwdGlvbnMgdGhyb3duIGluIGhhbmRsZXJzIHNvIHRoZXkgY2FuIGJlXG4vLyBoYW5kbGVkIGJ5IGEgc3Vic2VxdWVudCBwcm9taXNlLiAgVGhlIGV4Y2VwdGlvbnMgZ2V0IGFkZGVkIHRvIHRoaXMgYXJyYXkgd2hlblxuLy8gdGhleSBhcmUgY3JlYXRlZCwgYW5kIHJlbW92ZWQgd2hlbiB0aGV5IGFyZSBoYW5kbGVkLiAgTm90ZSB0aGF0IGluIEVTNiBvclxuLy8gc2hpbW1lZCBlbnZpcm9ubWVudHMsIHRoaXMgd291bGQgbmF0dXJhbGx5IGJlIGEgYFNldGAuXG52YXIgdW5oYW5kbGVkUmVhc29ucyA9IFtdO1xudmFyIHVuaGFuZGxlZFJlamVjdGlvbnMgPSBbXTtcbnZhciByZXBvcnRlZFVuaGFuZGxlZFJlamVjdGlvbnMgPSBbXTtcbnZhciB0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMgPSB0cnVlO1xuXG5mdW5jdGlvbiByZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKSB7XG4gICAgdW5oYW5kbGVkUmVhc29ucy5sZW5ndGggPSAwO1xuICAgIHVuaGFuZGxlZFJlamVjdGlvbnMubGVuZ3RoID0gMDtcblxuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IHRydWU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0cmFja1JlamVjdGlvbihwcm9taXNlLCByZWFzb24pIHtcbiAgICBpZiAoIXRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgcHJvY2Vzcy5lbWl0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgUS5uZXh0VGljay5ydW5BZnRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoYXJyYXlfaW5kZXhPZih1bmhhbmRsZWRSZWplY3Rpb25zLCBwcm9taXNlKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmVtaXQoXCJ1bmhhbmRsZWRSZWplY3Rpb25cIiwgcmVhc29uLCBwcm9taXNlKTtcbiAgICAgICAgICAgICAgICByZXBvcnRlZFVuaGFuZGxlZFJlamVjdGlvbnMucHVzaChwcm9taXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5wdXNoKHByb21pc2UpO1xuICAgIGlmIChyZWFzb24gJiYgdHlwZW9mIHJlYXNvbi5zdGFjayAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2gocmVhc29uLnN0YWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2goXCIobm8gc3RhY2spIFwiICsgcmVhc29uKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVudHJhY2tSZWplY3Rpb24ocHJvbWlzZSkge1xuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgYXQgPSBhcnJheV9pbmRleE9mKHVuaGFuZGxlZFJlamVjdGlvbnMsIHByb21pc2UpO1xuICAgIGlmIChhdCAhPT0gLTEpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBwcm9jZXNzLmVtaXQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgUS5uZXh0VGljay5ydW5BZnRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGF0UmVwb3J0ID0gYXJyYXlfaW5kZXhPZihyZXBvcnRlZFVuaGFuZGxlZFJlamVjdGlvbnMsIHByb21pc2UpO1xuICAgICAgICAgICAgICAgIGlmIChhdFJlcG9ydCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5lbWl0KFwicmVqZWN0aW9uSGFuZGxlZFwiLCB1bmhhbmRsZWRSZWFzb25zW2F0XSwgcHJvbWlzZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydGVkVW5oYW5kbGVkUmVqZWN0aW9ucy5zcGxpY2UoYXRSZXBvcnQsIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHVuaGFuZGxlZFJlamVjdGlvbnMuc3BsaWNlKGF0LCAxKTtcbiAgICAgICAgdW5oYW5kbGVkUmVhc29ucy5zcGxpY2UoYXQsIDEpO1xuICAgIH1cbn1cblxuUS5yZXNldFVuaGFuZGxlZFJlamVjdGlvbnMgPSByZXNldFVuaGFuZGxlZFJlamVjdGlvbnM7XG5cblEuZ2V0VW5oYW5kbGVkUmVhc29ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBNYWtlIGEgY29weSBzbyB0aGF0IGNvbnN1bWVycyBjYW4ndCBpbnRlcmZlcmUgd2l0aCBvdXIgaW50ZXJuYWwgc3RhdGUuXG4gICAgcmV0dXJuIHVuaGFuZGxlZFJlYXNvbnMuc2xpY2UoKTtcbn07XG5cblEuc3RvcFVuaGFuZGxlZFJlamVjdGlvblRyYWNraW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucygpO1xuICAgIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IGZhbHNlO1xufTtcblxucmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zKCk7XG5cbi8vLy8gRU5EIFVOSEFORExFRCBSRUpFQ1RJT04gVFJBQ0tJTkdcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcmVqZWN0ZWQgcHJvbWlzZS5cbiAqIEBwYXJhbSByZWFzb24gdmFsdWUgZGVzY3JpYmluZyB0aGUgZmFpbHVyZVxuICovXG5RLnJlamVjdCA9IHJlamVjdDtcbmZ1bmN0aW9uIHJlamVjdChyZWFzb24pIHtcbiAgICB2YXIgcmVqZWN0aW9uID0gUHJvbWlzZSh7XG4gICAgICAgIFwid2hlblwiOiBmdW5jdGlvbiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICAgIC8vIG5vdGUgdGhhdCB0aGUgZXJyb3IgaGFzIGJlZW4gaGFuZGxlZFxuICAgICAgICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgICAgICAgICAgdW50cmFja1JlamVjdGlvbih0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZWplY3RlZCA/IHJlamVjdGVkKHJlYXNvbikgOiB0aGlzO1xuICAgICAgICB9XG4gICAgfSwgZnVuY3Rpb24gZmFsbGJhY2soKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sIGZ1bmN0aW9uIGluc3BlY3QoKSB7XG4gICAgICAgIHJldHVybiB7IHN0YXRlOiBcInJlamVjdGVkXCIsIHJlYXNvbjogcmVhc29uIH07XG4gICAgfSk7XG5cbiAgICAvLyBOb3RlIHRoYXQgdGhlIHJlYXNvbiBoYXMgbm90IGJlZW4gaGFuZGxlZC5cbiAgICB0cmFja1JlamVjdGlvbihyZWplY3Rpb24sIHJlYXNvbik7XG5cbiAgICByZXR1cm4gcmVqZWN0aW9uO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBmdWxmaWxsZWQgcHJvbWlzZSBmb3IgYW4gaW1tZWRpYXRlIHJlZmVyZW5jZS5cbiAqIEBwYXJhbSB2YWx1ZSBpbW1lZGlhdGUgcmVmZXJlbmNlXG4gKi9cblEuZnVsZmlsbCA9IGZ1bGZpbGw7XG5mdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7XG4gICAgcmV0dXJuIFByb21pc2Uoe1xuICAgICAgICBcIndoZW5cIjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBcImdldFwiOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlW25hbWVdO1xuICAgICAgICB9LFxuICAgICAgICBcInNldFwiOiBmdW5jdGlvbiAobmFtZSwgcmhzKSB7XG4gICAgICAgICAgICB2YWx1ZVtuYW1lXSA9IHJocztcbiAgICAgICAgfSxcbiAgICAgICAgXCJkZWxldGVcIjogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB2YWx1ZVtuYW1lXTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJwb3N0XCI6IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgICAgICAgICAvLyBNYXJrIE1pbGxlciBwcm9wb3NlcyB0aGF0IHBvc3Qgd2l0aCBubyBuYW1lIHNob3VsZCBhcHBseSBhXG4gICAgICAgICAgICAvLyBwcm9taXNlZCBmdW5jdGlvbi5cbiAgICAgICAgICAgIGlmIChuYW1lID09PSBudWxsIHx8IG5hbWUgPT09IHZvaWQgMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5hcHBseSh2b2lkIDAsIGFyZ3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVbbmFtZV0uYXBwbHkodmFsdWUsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImFwcGx5XCI6IGZ1bmN0aW9uICh0aGlzcCwgYXJncykge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmFwcGx5KHRoaXNwLCBhcmdzKTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJrZXlzXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3Rfa2V5cyh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9LCB2b2lkIDAsIGZ1bmN0aW9uIGluc3BlY3QoKSB7XG4gICAgICAgIHJldHVybiB7IHN0YXRlOiBcImZ1bGZpbGxlZFwiLCB2YWx1ZTogdmFsdWUgfTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyB0aGVuYWJsZXMgdG8gUSBwcm9taXNlcy5cbiAqIEBwYXJhbSBwcm9taXNlIHRoZW5hYmxlIHByb21pc2VcbiAqIEByZXR1cm5zIGEgUSBwcm9taXNlXG4gKi9cbmZ1bmN0aW9uIGNvZXJjZShwcm9taXNlKSB7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHByb21pc2UudGhlbihkZWZlcnJlZC5yZXNvbHZlLCBkZWZlcnJlZC5yZWplY3QsIGRlZmVycmVkLm5vdGlmeSk7XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuLyoqXG4gKiBBbm5vdGF0ZXMgYW4gb2JqZWN0IHN1Y2ggdGhhdCBpdCB3aWxsIG5ldmVyIGJlXG4gKiB0cmFuc2ZlcnJlZCBhd2F5IGZyb20gdGhpcyBwcm9jZXNzIG92ZXIgYW55IHByb21pc2VcbiAqIGNvbW11bmljYXRpb24gY2hhbm5lbC5cbiAqIEBwYXJhbSBvYmplY3RcbiAqIEByZXR1cm5zIHByb21pc2UgYSB3cmFwcGluZyBvZiB0aGF0IG9iamVjdCB0aGF0XG4gKiBhZGRpdGlvbmFsbHkgcmVzcG9uZHMgdG8gdGhlIFwiaXNEZWZcIiBtZXNzYWdlXG4gKiB3aXRob3V0IGEgcmVqZWN0aW9uLlxuICovXG5RLm1hc3RlciA9IG1hc3RlcjtcbmZ1bmN0aW9uIG1hc3RlcihvYmplY3QpIHtcbiAgICByZXR1cm4gUHJvbWlzZSh7XG4gICAgICAgIFwiaXNEZWZcIjogZnVuY3Rpb24gKCkge31cbiAgICB9LCBmdW5jdGlvbiBmYWxsYmFjayhvcCwgYXJncykge1xuICAgICAgICByZXR1cm4gZGlzcGF0Y2gob2JqZWN0LCBvcCwgYXJncyk7XG4gICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gUShvYmplY3QpLmluc3BlY3QoKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBTcHJlYWRzIHRoZSB2YWx1ZXMgb2YgYSBwcm9taXNlZCBhcnJheSBvZiBhcmd1bWVudHMgaW50byB0aGVcbiAqIGZ1bGZpbGxtZW50IGNhbGxiYWNrLlxuICogQHBhcmFtIGZ1bGZpbGxlZCBjYWxsYmFjayB0aGF0IHJlY2VpdmVzIHZhcmlhZGljIGFyZ3VtZW50cyBmcm9tIHRoZVxuICogcHJvbWlzZWQgYXJyYXlcbiAqIEBwYXJhbSByZWplY3RlZCBjYWxsYmFjayB0aGF0IHJlY2VpdmVzIHRoZSBleGNlcHRpb24gaWYgdGhlIHByb21pc2VcbiAqIGlzIHJlamVjdGVkLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlIG9yIHRocm93biBleGNlcHRpb24gb2ZcbiAqIGVpdGhlciBjYWxsYmFjay5cbiAqL1xuUS5zcHJlYWQgPSBzcHJlYWQ7XG5mdW5jdGlvbiBzcHJlYWQodmFsdWUsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gUSh2YWx1ZSkuc3ByZWFkKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5zcHJlYWQgPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCkge1xuICAgIHJldHVybiB0aGlzLmFsbCgpLnRoZW4oZnVuY3Rpb24gKGFycmF5KSB7XG4gICAgICAgIHJldHVybiBmdWxmaWxsZWQuYXBwbHkodm9pZCAwLCBhcnJheSk7XG4gICAgfSwgcmVqZWN0ZWQpO1xufTtcblxuLyoqXG4gKiBUaGUgYXN5bmMgZnVuY3Rpb24gaXMgYSBkZWNvcmF0b3IgZm9yIGdlbmVyYXRvciBmdW5jdGlvbnMsIHR1cm5pbmdcbiAqIHRoZW0gaW50byBhc3luY2hyb25vdXMgZ2VuZXJhdG9ycy4gIEFsdGhvdWdoIGdlbmVyYXRvcnMgYXJlIG9ubHkgcGFydFxuICogb2YgdGhlIG5ld2VzdCBFQ01BU2NyaXB0IDYgZHJhZnRzLCB0aGlzIGNvZGUgZG9lcyBub3QgY2F1c2Ugc3ludGF4XG4gKiBlcnJvcnMgaW4gb2xkZXIgZW5naW5lcy4gIFRoaXMgY29kZSBzaG91bGQgY29udGludWUgdG8gd29yayBhbmQgd2lsbFxuICogaW4gZmFjdCBpbXByb3ZlIG92ZXIgdGltZSBhcyB0aGUgbGFuZ3VhZ2UgaW1wcm92ZXMuXG4gKlxuICogRVM2IGdlbmVyYXRvcnMgYXJlIGN1cnJlbnRseSBwYXJ0IG9mIFY4IHZlcnNpb24gMy4xOSB3aXRoIHRoZVxuICogLS1oYXJtb255LWdlbmVyYXRvcnMgcnVudGltZSBmbGFnIGVuYWJsZWQuICBTcGlkZXJNb25rZXkgaGFzIGhhZCB0aGVtXG4gKiBmb3IgbG9uZ2VyLCBidXQgdW5kZXIgYW4gb2xkZXIgUHl0aG9uLWluc3BpcmVkIGZvcm0uICBUaGlzIGZ1bmN0aW9uXG4gKiB3b3JrcyBvbiBib3RoIGtpbmRzIG9mIGdlbmVyYXRvcnMuXG4gKlxuICogRGVjb3JhdGVzIGEgZ2VuZXJhdG9yIGZ1bmN0aW9uIHN1Y2ggdGhhdDpcbiAqICAtIGl0IG1heSB5aWVsZCBwcm9taXNlc1xuICogIC0gZXhlY3V0aW9uIHdpbGwgY29udGludWUgd2hlbiB0aGF0IHByb21pc2UgaXMgZnVsZmlsbGVkXG4gKiAgLSB0aGUgdmFsdWUgb2YgdGhlIHlpZWxkIGV4cHJlc3Npb24gd2lsbCBiZSB0aGUgZnVsZmlsbGVkIHZhbHVlXG4gKiAgLSBpdCByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSAod2hlbiB0aGUgZ2VuZXJhdG9yXG4gKiAgICBzdG9wcyBpdGVyYXRpbmcpXG4gKiAgLSB0aGUgZGVjb3JhdGVkIGZ1bmN0aW9uIHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKiAgICBvZiB0aGUgZ2VuZXJhdG9yIG9yIHRoZSBmaXJzdCByZWplY3RlZCBwcm9taXNlIGFtb25nIHRob3NlXG4gKiAgICB5aWVsZGVkLlxuICogIC0gaWYgYW4gZXJyb3IgaXMgdGhyb3duIGluIHRoZSBnZW5lcmF0b3IsIGl0IHByb3BhZ2F0ZXMgdGhyb3VnaFxuICogICAgZXZlcnkgZm9sbG93aW5nIHlpZWxkIHVudGlsIGl0IGlzIGNhdWdodCwgb3IgdW50aWwgaXQgZXNjYXBlc1xuICogICAgdGhlIGdlbmVyYXRvciBmdW5jdGlvbiBhbHRvZ2V0aGVyLCBhbmQgaXMgdHJhbnNsYXRlZCBpbnRvIGFcbiAqICAgIHJlamVjdGlvbiBmb3IgdGhlIHByb21pc2UgcmV0dXJuZWQgYnkgdGhlIGRlY29yYXRlZCBnZW5lcmF0b3IuXG4gKi9cblEuYXN5bmMgPSBhc3luYztcbmZ1bmN0aW9uIGFzeW5jKG1ha2VHZW5lcmF0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyB3aGVuIHZlcmIgaXMgXCJzZW5kXCIsIGFyZyBpcyBhIHZhbHVlXG4gICAgICAgIC8vIHdoZW4gdmVyYiBpcyBcInRocm93XCIsIGFyZyBpcyBhbiBleGNlcHRpb25cbiAgICAgICAgZnVuY3Rpb24gY29udGludWVyKHZlcmIsIGFyZykge1xuICAgICAgICAgICAgdmFyIHJlc3VsdDtcblxuICAgICAgICAgICAgLy8gVW50aWwgVjggMy4xOSAvIENocm9taXVtIDI5IGlzIHJlbGVhc2VkLCBTcGlkZXJNb25rZXkgaXMgdGhlIG9ubHlcbiAgICAgICAgICAgIC8vIGVuZ2luZSB0aGF0IGhhcyBhIGRlcGxveWVkIGJhc2Ugb2YgYnJvd3NlcnMgdGhhdCBzdXBwb3J0IGdlbmVyYXRvcnMuXG4gICAgICAgICAgICAvLyBIb3dldmVyLCBTTSdzIGdlbmVyYXRvcnMgdXNlIHRoZSBQeXRob24taW5zcGlyZWQgc2VtYW50aWNzIG9mXG4gICAgICAgICAgICAvLyBvdXRkYXRlZCBFUzYgZHJhZnRzLiAgV2Ugd291bGQgbGlrZSB0byBzdXBwb3J0IEVTNiwgYnV0IHdlJ2QgYWxzb1xuICAgICAgICAgICAgLy8gbGlrZSB0byBtYWtlIGl0IHBvc3NpYmxlIHRvIHVzZSBnZW5lcmF0b3JzIGluIGRlcGxveWVkIGJyb3dzZXJzLCBzb1xuICAgICAgICAgICAgLy8gd2UgYWxzbyBzdXBwb3J0IFB5dGhvbi1zdHlsZSBnZW5lcmF0b3JzLiAgQXQgc29tZSBwb2ludCB3ZSBjYW4gcmVtb3ZlXG4gICAgICAgICAgICAvLyB0aGlzIGJsb2NrLlxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIFN0b3BJdGVyYXRpb24gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAvLyBFUzYgR2VuZXJhdG9yc1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGdlbmVyYXRvclt2ZXJiXShhcmcpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZG9uZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUShyZXN1bHQudmFsdWUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3aGVuKHJlc3VsdC52YWx1ZSwgY2FsbGJhY2ssIGVycmJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gU3BpZGVyTW9ua2V5IEdlbmVyYXRvcnNcbiAgICAgICAgICAgICAgICAvLyBGSVhNRTogUmVtb3ZlIHRoaXMgY2FzZSB3aGVuIFNNIGRvZXMgRVM2IGdlbmVyYXRvcnMuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZ2VuZXJhdG9yW3ZlcmJdKGFyZyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1N0b3BJdGVyYXRpb24oZXhjZXB0aW9uKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFEoZXhjZXB0aW9uLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gd2hlbihyZXN1bHQsIGNhbGxiYWNrLCBlcnJiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZ2VuZXJhdG9yID0gbWFrZUdlbmVyYXRvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBjb250aW51ZXIuYmluZChjb250aW51ZXIsIFwibmV4dFwiKTtcbiAgICAgICAgdmFyIGVycmJhY2sgPSBjb250aW51ZXIuYmluZChjb250aW51ZXIsIFwidGhyb3dcIik7XG4gICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgIH07XG59XG5cbi8qKlxuICogVGhlIHNwYXduIGZ1bmN0aW9uIGlzIGEgc21hbGwgd3JhcHBlciBhcm91bmQgYXN5bmMgdGhhdCBpbW1lZGlhdGVseVxuICogY2FsbHMgdGhlIGdlbmVyYXRvciBhbmQgYWxzbyBlbmRzIHRoZSBwcm9taXNlIGNoYWluLCBzbyB0aGF0IGFueVxuICogdW5oYW5kbGVkIGVycm9ycyBhcmUgdGhyb3duIGluc3RlYWQgb2YgZm9yd2FyZGVkIHRvIHRoZSBlcnJvclxuICogaGFuZGxlci4gVGhpcyBpcyB1c2VmdWwgYmVjYXVzZSBpdCdzIGV4dHJlbWVseSBjb21tb24gdG8gcnVuXG4gKiBnZW5lcmF0b3JzIGF0IHRoZSB0b3AtbGV2ZWwgdG8gd29yayB3aXRoIGxpYnJhcmllcy5cbiAqL1xuUS5zcGF3biA9IHNwYXduO1xuZnVuY3Rpb24gc3Bhd24obWFrZUdlbmVyYXRvcikge1xuICAgIFEuZG9uZShRLmFzeW5jKG1ha2VHZW5lcmF0b3IpKCkpO1xufVxuXG4vLyBGSVhNRTogUmVtb3ZlIHRoaXMgaW50ZXJmYWNlIG9uY2UgRVM2IGdlbmVyYXRvcnMgYXJlIGluIFNwaWRlck1vbmtleS5cbi8qKlxuICogVGhyb3dzIGEgUmV0dXJuVmFsdWUgZXhjZXB0aW9uIHRvIHN0b3AgYW4gYXN5bmNocm9ub3VzIGdlbmVyYXRvci5cbiAqXG4gKiBUaGlzIGludGVyZmFjZSBpcyBhIHN0b3AtZ2FwIG1lYXN1cmUgdG8gc3VwcG9ydCBnZW5lcmF0b3IgcmV0dXJuXG4gKiB2YWx1ZXMgaW4gb2xkZXIgRmlyZWZveC9TcGlkZXJNb25rZXkuICBJbiBicm93c2VycyB0aGF0IHN1cHBvcnQgRVM2XG4gKiBnZW5lcmF0b3JzIGxpa2UgQ2hyb21pdW0gMjksIGp1c3QgdXNlIFwicmV0dXJuXCIgaW4geW91ciBnZW5lcmF0b3JcbiAqIGZ1bmN0aW9ucy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgdGhlIHJldHVybiB2YWx1ZSBmb3IgdGhlIHN1cnJvdW5kaW5nIGdlbmVyYXRvclxuICogQHRocm93cyBSZXR1cm5WYWx1ZSBleGNlcHRpb24gd2l0aCB0aGUgdmFsdWUuXG4gKiBAZXhhbXBsZVxuICogLy8gRVM2IHN0eWxlXG4gKiBRLmFzeW5jKGZ1bmN0aW9uKiAoKSB7XG4gKiAgICAgIHZhciBmb28gPSB5aWVsZCBnZXRGb29Qcm9taXNlKCk7XG4gKiAgICAgIHZhciBiYXIgPSB5aWVsZCBnZXRCYXJQcm9taXNlKCk7XG4gKiAgICAgIHJldHVybiBmb28gKyBiYXI7XG4gKiB9KVxuICogLy8gT2xkZXIgU3BpZGVyTW9ua2V5IHN0eWxlXG4gKiBRLmFzeW5jKGZ1bmN0aW9uICgpIHtcbiAqICAgICAgdmFyIGZvbyA9IHlpZWxkIGdldEZvb1Byb21pc2UoKTtcbiAqICAgICAgdmFyIGJhciA9IHlpZWxkIGdldEJhclByb21pc2UoKTtcbiAqICAgICAgUS5yZXR1cm4oZm9vICsgYmFyKTtcbiAqIH0pXG4gKi9cblFbXCJyZXR1cm5cIl0gPSBfcmV0dXJuO1xuZnVuY3Rpb24gX3JldHVybih2YWx1ZSkge1xuICAgIHRocm93IG5ldyBRUmV0dXJuVmFsdWUodmFsdWUpO1xufVxuXG4vKipcbiAqIFRoZSBwcm9taXNlZCBmdW5jdGlvbiBkZWNvcmF0b3IgZW5zdXJlcyB0aGF0IGFueSBwcm9taXNlIGFyZ3VtZW50c1xuICogYXJlIHNldHRsZWQgYW5kIHBhc3NlZCBhcyB2YWx1ZXMgKGB0aGlzYCBpcyBhbHNvIHNldHRsZWQgYW5kIHBhc3NlZFxuICogYXMgYSB2YWx1ZSkuICBJdCB3aWxsIGFsc28gZW5zdXJlIHRoYXQgdGhlIHJlc3VsdCBvZiBhIGZ1bmN0aW9uIGlzXG4gKiBhbHdheXMgYSBwcm9taXNlLlxuICpcbiAqIEBleGFtcGxlXG4gKiB2YXIgYWRkID0gUS5wcm9taXNlZChmdW5jdGlvbiAoYSwgYikge1xuICogICAgIHJldHVybiBhICsgYjtcbiAqIH0pO1xuICogYWRkKFEoYSksIFEoQikpO1xuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0byBkZWNvcmF0ZVxuICogQHJldHVybnMge2Z1bmN0aW9ufSBhIGZ1bmN0aW9uIHRoYXQgaGFzIGJlZW4gZGVjb3JhdGVkLlxuICovXG5RLnByb21pc2VkID0gcHJvbWlzZWQ7XG5mdW5jdGlvbiBwcm9taXNlZChjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzcHJlYWQoW3RoaXMsIGFsbChhcmd1bWVudHMpXSwgZnVuY3Rpb24gKHNlbGYsIGFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseShzZWxmLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBzZW5kcyBhIG1lc3NhZ2UgdG8gYSB2YWx1ZSBpbiBhIGZ1dHVyZSB0dXJuXG4gKiBAcGFyYW0gb2JqZWN0KiB0aGUgcmVjaXBpZW50XG4gKiBAcGFyYW0gb3AgdGhlIG5hbWUgb2YgdGhlIG1lc3NhZ2Ugb3BlcmF0aW9uLCBlLmcuLCBcIndoZW5cIixcbiAqIEBwYXJhbSBhcmdzIGZ1cnRoZXIgYXJndW1lbnRzIHRvIGJlIGZvcndhcmRlZCB0byB0aGUgb3BlcmF0aW9uXG4gKiBAcmV0dXJucyByZXN1bHQge1Byb21pc2V9IGEgcHJvbWlzZSBmb3IgdGhlIHJlc3VsdCBvZiB0aGUgb3BlcmF0aW9uXG4gKi9cblEuZGlzcGF0Y2ggPSBkaXNwYXRjaDtcbmZ1bmN0aW9uIGRpc3BhdGNoKG9iamVjdCwgb3AsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKG9wLCBhcmdzKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuZGlzcGF0Y2ggPSBmdW5jdGlvbiAob3AsIGFyZ3MpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5wcm9taXNlRGlzcGF0Y2goZGVmZXJyZWQucmVzb2x2ZSwgb3AsIGFyZ3MpO1xuICAgIH0pO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBHZXRzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIHByb3BlcnR5IHRvIGdldFxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcHJvcGVydHkgdmFsdWVcbiAqL1xuUS5nZXQgPSBmdW5jdGlvbiAob2JqZWN0LCBrZXkpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiZ2V0XCIsIFtrZXldKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImdldFwiLCBba2V5XSk7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIHZhbHVlIG9mIGEgcHJvcGVydHkgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciBvYmplY3Qgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgcHJvcGVydHkgdG8gc2V0XG4gKiBAcGFyYW0gdmFsdWUgICAgIG5ldyB2YWx1ZSBvZiBwcm9wZXJ0eVxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cblEuc2V0ID0gZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJzZXRcIiwgW2tleSwgdmFsdWVdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJzZXRcIiwgW2tleSwgdmFsdWVdKTtcbn07XG5cbi8qKlxuICogRGVsZXRlcyBhIHByb3BlcnR5IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIHByb3BlcnR5IHRvIGRlbGV0ZVxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cblEuZGVsID0gLy8gWFhYIGxlZ2FjeVxuUVtcImRlbGV0ZVwiXSA9IGZ1bmN0aW9uIChvYmplY3QsIGtleSkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJkZWxldGVcIiwgW2tleV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZGVsID0gLy8gWFhYIGxlZ2FjeVxuUHJvbWlzZS5wcm90b3R5cGVbXCJkZWxldGVcIl0gPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJkZWxldGVcIiwgW2tleV0pO1xufTtcblxuLyoqXG4gKiBJbnZva2VzIGEgbWV0aG9kIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIG1ldGhvZCB0byBpbnZva2VcbiAqIEBwYXJhbSB2YWx1ZSAgICAgYSB2YWx1ZSB0byBwb3N0LCB0eXBpY2FsbHkgYW4gYXJyYXkgb2ZcbiAqICAgICAgICAgICAgICAgICAgaW52b2NhdGlvbiBhcmd1bWVudHMgZm9yIHByb21pc2VzIHRoYXRcbiAqICAgICAgICAgICAgICAgICAgYXJlIHVsdGltYXRlbHkgYmFja2VkIHdpdGggYHJlc29sdmVgIHZhbHVlcyxcbiAqICAgICAgICAgICAgICAgICAgYXMgb3Bwb3NlZCB0byB0aG9zZSBiYWNrZWQgd2l0aCBVUkxzXG4gKiAgICAgICAgICAgICAgICAgIHdoZXJlaW4gdGhlIHBvc3RlZCB2YWx1ZSBjYW4gYmUgYW55XG4gKiAgICAgICAgICAgICAgICAgIEpTT04gc2VyaWFsaXphYmxlIG9iamVjdC5cbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG4vLyBib3VuZCBsb2NhbGx5IGJlY2F1c2UgaXQgaXMgdXNlZCBieSBvdGhlciBtZXRob2RzXG5RLm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5RLnBvc3QgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lLCBhcmdzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFyZ3NdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5Qcm9taXNlLnByb3RvdHlwZS5wb3N0ID0gZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFyZ3NdKTtcbn07XG5cbi8qKlxuICogSW52b2tlcyBhIG1ldGhvZCBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBtZXRob2QgdG8gaW52b2tlXG4gKiBAcGFyYW0gLi4uYXJncyAgIGFycmF5IG9mIGludm9jYXRpb24gYXJndW1lbnRzXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuUS5zZW5kID0gLy8gWFhYIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgcGFybGFuY2VcblEubWNhbGwgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUS5pbnZva2UgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMildKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnNlbmQgPSAvLyBYWFggTWFyayBNaWxsZXIncyBwcm9wb3NlZCBwYXJsYW5jZVxuUHJvbWlzZS5wcm90b3R5cGUubWNhbGwgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUHJvbWlzZS5wcm90b3R5cGUuaW52b2tlID0gZnVuY3Rpb24gKG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSldKTtcbn07XG5cbi8qKlxuICogQXBwbGllcyB0aGUgcHJvbWlzZWQgZnVuY3Rpb24gaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgZnVuY3Rpb25cbiAqIEBwYXJhbSBhcmdzICAgICAgYXJyYXkgb2YgYXBwbGljYXRpb24gYXJndW1lbnRzXG4gKi9cblEuZmFwcGx5ID0gZnVuY3Rpb24gKG9iamVjdCwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcmdzXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mYXBwbHkgPSBmdW5jdGlvbiAoYXJncykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJnc10pO1xufTtcblxuLyoqXG4gKiBDYWxscyB0aGUgcHJvbWlzZWQgZnVuY3Rpb24gaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgZnVuY3Rpb25cbiAqIEBwYXJhbSAuLi5hcmdzICAgYXJyYXkgb2YgYXBwbGljYXRpb24gYXJndW1lbnRzXG4gKi9cblFbXCJ0cnlcIl0gPVxuUS5mY2FsbCA9IGZ1bmN0aW9uIChvYmplY3QgLyogLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSldKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmZjYWxsID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcnJheV9zbGljZShhcmd1bWVudHMpXSk7XG59O1xuXG4vKipcbiAqIEJpbmRzIHRoZSBwcm9taXNlZCBmdW5jdGlvbiwgdHJhbnNmb3JtaW5nIHJldHVybiB2YWx1ZXMgaW50byBhIGZ1bGZpbGxlZFxuICogcHJvbWlzZSBhbmQgdGhyb3duIGVycm9ycyBpbnRvIGEgcmVqZWN0ZWQgb25lLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBmdW5jdGlvblxuICogQHBhcmFtIC4uLmFyZ3MgICBhcnJheSBvZiBhcHBsaWNhdGlvbiBhcmd1bWVudHNcbiAqL1xuUS5mYmluZCA9IGZ1bmN0aW9uIChvYmplY3QgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgcHJvbWlzZSA9IFEob2JqZWN0KTtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGZib3VuZCgpIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2UuZGlzcGF0Y2goXCJhcHBseVwiLCBbXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgYXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSlcbiAgICAgICAgXSk7XG4gICAgfTtcbn07XG5Qcm9taXNlLnByb3RvdHlwZS5mYmluZCA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHZhciBwcm9taXNlID0gdGhpcztcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGZib3VuZCgpIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2UuZGlzcGF0Y2goXCJhcHBseVwiLCBbXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgYXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSlcbiAgICAgICAgXSk7XG4gICAgfTtcbn07XG5cbi8qKlxuICogUmVxdWVzdHMgdGhlIG5hbWVzIG9mIHRoZSBvd25lZCBwcm9wZXJ0aWVzIG9mIGEgcHJvbWlzZWRcbiAqIG9iamVjdCBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIGtleXMgb2YgdGhlIGV2ZW50dWFsbHkgc2V0dGxlZCBvYmplY3RcbiAqL1xuUS5rZXlzID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJrZXlzXCIsIFtdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJrZXlzXCIsIFtdKTtcbn07XG5cbi8qKlxuICogVHVybnMgYW4gYXJyYXkgb2YgcHJvbWlzZXMgaW50byBhIHByb21pc2UgZm9yIGFuIGFycmF5LiAgSWYgYW55IG9mXG4gKiB0aGUgcHJvbWlzZXMgZ2V0cyByZWplY3RlZCwgdGhlIHdob2xlIGFycmF5IGlzIHJlamVjdGVkIGltbWVkaWF0ZWx5LlxuICogQHBhcmFtIHtBcnJheSp9IGFuIGFycmF5IChvciBwcm9taXNlIGZvciBhbiBhcnJheSkgb2YgdmFsdWVzIChvclxuICogcHJvbWlzZXMgZm9yIHZhbHVlcylcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgdGhlIGNvcnJlc3BvbmRpbmcgdmFsdWVzXG4gKi9cbi8vIEJ5IE1hcmsgTWlsbGVyXG4vLyBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1zdHJhd21hbjpjb25jdXJyZW5jeSZyZXY9MTMwODc3NjUyMSNhbGxmdWxmaWxsZWRcblEuYWxsID0gYWxsO1xuZnVuY3Rpb24gYWxsKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIHdoZW4ocHJvbWlzZXMsIGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgICAgICB2YXIgcGVuZGluZ0NvdW50ID0gMDtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgYXJyYXlfcmVkdWNlKHByb21pc2VzLCBmdW5jdGlvbiAodW5kZWZpbmVkLCBwcm9taXNlLCBpbmRleCkge1xuICAgICAgICAgICAgdmFyIHNuYXBzaG90O1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIGlzUHJvbWlzZShwcm9taXNlKSAmJlxuICAgICAgICAgICAgICAgIChzbmFwc2hvdCA9IHByb21pc2UuaW5zcGVjdCgpKS5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIlxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgcHJvbWlzZXNbaW5kZXhdID0gc25hcHNob3QudmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICsrcGVuZGluZ0NvdW50O1xuICAgICAgICAgICAgICAgIHdoZW4oXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXNbaW5kZXhdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoLS1wZW5kaW5nQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHByb21pc2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0LFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAocHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLm5vdGlmeSh7IGluZGV4OiBpbmRleCwgdmFsdWU6IHByb2dyZXNzIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdm9pZCAwKTtcbiAgICAgICAgaWYgKHBlbmRpbmdDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfSk7XG59XG5cblByb21pc2UucHJvdG90eXBlLmFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gYWxsKHRoaXMpO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBmaXJzdCByZXNvbHZlZCBwcm9taXNlIG9mIGFuIGFycmF5LiBQcmlvciByZWplY3RlZCBwcm9taXNlcyBhcmVcbiAqIGlnbm9yZWQuICBSZWplY3RzIG9ubHkgaWYgYWxsIHByb21pc2VzIGFyZSByZWplY3RlZC5cbiAqIEBwYXJhbSB7QXJyYXkqfSBhbiBhcnJheSBjb250YWluaW5nIHZhbHVlcyBvciBwcm9taXNlcyBmb3IgdmFsdWVzXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZnVsZmlsbGVkIHdpdGggdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCByZXNvbHZlZCBwcm9taXNlLFxuICogb3IgYSByZWplY3RlZCBwcm9taXNlIGlmIGFsbCBwcm9taXNlcyBhcmUgcmVqZWN0ZWQuXG4gKi9cblEuYW55ID0gYW55O1xuXG5mdW5jdGlvbiBhbnkocHJvbWlzZXMpIHtcbiAgICBpZiAocHJvbWlzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBRLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICB2YXIgZGVmZXJyZWQgPSBRLmRlZmVyKCk7XG4gICAgdmFyIHBlbmRpbmdDb3VudCA9IDA7XG4gICAgYXJyYXlfcmVkdWNlKHByb21pc2VzLCBmdW5jdGlvbiAocHJldiwgY3VycmVudCwgaW5kZXgpIHtcbiAgICAgICAgdmFyIHByb21pc2UgPSBwcm9taXNlc1tpbmRleF07XG5cbiAgICAgICAgcGVuZGluZ0NvdW50Kys7XG5cbiAgICAgICAgd2hlbihwcm9taXNlLCBvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgb25Qcm9ncmVzcyk7XG4gICAgICAgIGZ1bmN0aW9uIG9uRnVsZmlsbGVkKHJlc3VsdCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG9uUmVqZWN0ZWQoKSB7XG4gICAgICAgICAgICBwZW5kaW5nQ291bnQtLTtcbiAgICAgICAgICAgIGlmIChwZW5kaW5nQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QobmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgICBcIkNhbid0IGdldCBmdWxmaWxsbWVudCB2YWx1ZSBmcm9tIGFueSBwcm9taXNlLCBhbGwgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcInByb21pc2VzIHdlcmUgcmVqZWN0ZWQuXCJcbiAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvblByb2dyZXNzKHByb2dyZXNzKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkoe1xuICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcHJvZ3Jlc3NcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSwgdW5kZWZpbmVkKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hbnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFueSh0aGlzKTtcbn07XG5cbi8qKlxuICogV2FpdHMgZm9yIGFsbCBwcm9taXNlcyB0byBiZSBzZXR0bGVkLCBlaXRoZXIgZnVsZmlsbGVkIG9yXG4gKiByZWplY3RlZC4gIFRoaXMgaXMgZGlzdGluY3QgZnJvbSBgYWxsYCBzaW5jZSB0aGF0IHdvdWxkIHN0b3BcbiAqIHdhaXRpbmcgYXQgdGhlIGZpcnN0IHJlamVjdGlvbi4gIFRoZSBwcm9taXNlIHJldHVybmVkIGJ5XG4gKiBgYWxsUmVzb2x2ZWRgIHdpbGwgbmV2ZXIgYmUgcmVqZWN0ZWQuXG4gKiBAcGFyYW0gcHJvbWlzZXMgYSBwcm9taXNlIGZvciBhbiBhcnJheSAob3IgYW4gYXJyYXkpIG9mIHByb21pc2VzXG4gKiAob3IgdmFsdWVzKVxuICogQHJldHVybiBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHByb21pc2VzXG4gKi9cblEuYWxsUmVzb2x2ZWQgPSBkZXByZWNhdGUoYWxsUmVzb2x2ZWQsIFwiYWxsUmVzb2x2ZWRcIiwgXCJhbGxTZXR0bGVkXCIpO1xuZnVuY3Rpb24gYWxsUmVzb2x2ZWQocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gd2hlbihwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHByb21pc2VzID0gYXJyYXlfbWFwKHByb21pc2VzLCBRKTtcbiAgICAgICAgcmV0dXJuIHdoZW4oYWxsKGFycmF5X21hcChwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybiB3aGVuKHByb21pc2UsIG5vb3AsIG5vb3ApO1xuICAgICAgICB9KSksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlcztcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cblByb21pc2UucHJvdG90eXBlLmFsbFJlc29sdmVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhbGxSZXNvbHZlZCh0aGlzKTtcbn07XG5cbi8qKlxuICogQHNlZSBQcm9taXNlI2FsbFNldHRsZWRcbiAqL1xuUS5hbGxTZXR0bGVkID0gYWxsU2V0dGxlZDtcbmZ1bmN0aW9uIGFsbFNldHRsZWQocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gUShwcm9taXNlcykuYWxsU2V0dGxlZCgpO1xufVxuXG4vKipcbiAqIFR1cm5zIGFuIGFycmF5IG9mIHByb21pc2VzIGludG8gYSBwcm9taXNlIGZvciBhbiBhcnJheSBvZiB0aGVpciBzdGF0ZXMgKGFzXG4gKiByZXR1cm5lZCBieSBgaW5zcGVjdGApIHdoZW4gdGhleSBoYXZlIGFsbCBzZXR0bGVkLlxuICogQHBhcmFtIHtBcnJheVtBbnkqXX0gdmFsdWVzIGFuIGFycmF5IChvciBwcm9taXNlIGZvciBhbiBhcnJheSkgb2YgdmFsdWVzIChvclxuICogcHJvbWlzZXMgZm9yIHZhbHVlcylcbiAqIEByZXR1cm5zIHtBcnJheVtTdGF0ZV19IGFuIGFycmF5IG9mIHN0YXRlcyBmb3IgdGhlIHJlc3BlY3RpdmUgdmFsdWVzLlxuICovXG5Qcm9taXNlLnByb3RvdHlwZS5hbGxTZXR0bGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHJldHVybiBhbGwoYXJyYXlfbWFwKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZSkge1xuICAgICAgICAgICAgcHJvbWlzZSA9IFEocHJvbWlzZSk7XG4gICAgICAgICAgICBmdW5jdGlvbiByZWdhcmRsZXNzKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlLmluc3BlY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlLnRoZW4ocmVnYXJkbGVzcywgcmVnYXJkbGVzcyk7XG4gICAgICAgIH0pKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogQ2FwdHVyZXMgdGhlIGZhaWx1cmUgb2YgYSBwcm9taXNlLCBnaXZpbmcgYW4gb3BvcnR1bml0eSB0byByZWNvdmVyXG4gKiB3aXRoIGEgY2FsbGJhY2suICBJZiB0aGUgZ2l2ZW4gcHJvbWlzZSBpcyBmdWxmaWxsZWQsIHRoZSByZXR1cm5lZFxuICogcHJvbWlzZSBpcyBmdWxmaWxsZWQuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgZm9yIHNvbWV0aGluZ1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gZnVsZmlsbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpZiB0aGVcbiAqIGdpdmVuIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgY2FsbGJhY2tcbiAqL1xuUS5mYWlsID0gLy8gWFhYIGxlZ2FjeVxuUVtcImNhdGNoXCJdID0gZnVuY3Rpb24gKG9iamVjdCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLnRoZW4odm9pZCAwLCByZWplY3RlZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mYWlsID0gLy8gWFhYIGxlZ2FjeVxuUHJvbWlzZS5wcm90b3R5cGVbXCJjYXRjaFwiXSA9IGZ1bmN0aW9uIChyZWplY3RlZCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCByZWplY3RlZCk7XG59O1xuXG4vKipcbiAqIEF0dGFjaGVzIGEgbGlzdGVuZXIgdGhhdCBjYW4gcmVzcG9uZCB0byBwcm9ncmVzcyBub3RpZmljYXRpb25zIGZyb20gYVxuICogcHJvbWlzZSdzIG9yaWdpbmF0aW5nIGRlZmVycmVkLiBUaGlzIGxpc3RlbmVyIHJlY2VpdmVzIHRoZSBleGFjdCBhcmd1bWVudHNcbiAqIHBhc3NlZCB0byBgYGRlZmVycmVkLm5vdGlmeWBgLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlIGZvciBzb21ldGhpbmdcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRvIHJlY2VpdmUgYW55IHByb2dyZXNzIG5vdGlmaWNhdGlvbnNcbiAqIEByZXR1cm5zIHRoZSBnaXZlbiBwcm9taXNlLCB1bmNoYW5nZWRcbiAqL1xuUS5wcm9ncmVzcyA9IHByb2dyZXNzO1xuZnVuY3Rpb24gcHJvZ3Jlc3Mob2JqZWN0LCBwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS50aGVuKHZvaWQgMCwgdm9pZCAwLCBwcm9ncmVzc2VkKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUucHJvZ3Jlc3MgPSBmdW5jdGlvbiAocHJvZ3Jlc3NlZCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCB2b2lkIDAsIHByb2dyZXNzZWQpO1xufTtcblxuLyoqXG4gKiBQcm92aWRlcyBhbiBvcHBvcnR1bml0eSB0byBvYnNlcnZlIHRoZSBzZXR0bGluZyBvZiBhIHByb21pc2UsXG4gKiByZWdhcmRsZXNzIG9mIHdoZXRoZXIgdGhlIHByb21pc2UgaXMgZnVsZmlsbGVkIG9yIHJlamVjdGVkLiAgRm9yd2FyZHNcbiAqIHRoZSByZXNvbHV0aW9uIHRvIHRoZSByZXR1cm5lZCBwcm9taXNlIHdoZW4gdGhlIGNhbGxiYWNrIGlzIGRvbmUuXG4gKiBUaGUgY2FsbGJhY2sgY2FuIHJldHVybiBhIHByb21pc2UgdG8gZGVmZXIgY29tcGxldGlvbi5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gb2JzZXJ2ZSB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW5cbiAqIHByb21pc2UsIHRha2VzIG5vIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2Ugd2hlblxuICogYGBmaW5gYCBpcyBkb25lLlxuICovXG5RLmZpbiA9IC8vIFhYWCBsZWdhY3lcblFbXCJmaW5hbGx5XCJdID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gUShvYmplY3QpW1wiZmluYWxseVwiXShjYWxsYmFjayk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5maW4gPSAvLyBYWFggbGVnYWN5XG5Qcm9taXNlLnByb3RvdHlwZVtcImZpbmFsbHlcIl0gPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayA9IFEoY2FsbGJhY2spO1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIFRPRE8gYXR0ZW1wdCB0byByZWN5Y2xlIHRoZSByZWplY3Rpb24gd2l0aCBcInRoaXNcIi5cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmZjYWxsKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aHJvdyByZWFzb247XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBUZXJtaW5hdGVzIGEgY2hhaW4gb2YgcHJvbWlzZXMsIGZvcmNpbmcgcmVqZWN0aW9ucyB0byBiZVxuICogdGhyb3duIGFzIGV4Y2VwdGlvbnMuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgYXQgdGhlIGVuZCBvZiBhIGNoYWluIG9mIHByb21pc2VzXG4gKiBAcmV0dXJucyBub3RoaW5nXG4gKi9cblEuZG9uZSA9IGZ1bmN0aW9uIChvYmplY3QsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kb25lKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRvbmUgPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIHtcbiAgICB2YXIgb25VbmhhbmRsZWRFcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAvLyBmb3J3YXJkIHRvIGEgZnV0dXJlIHR1cm4gc28gdGhhdCBgYHdoZW5gYFxuICAgICAgICAvLyBkb2VzIG5vdCBjYXRjaCBpdCBhbmQgdHVybiBpdCBpbnRvIGEgcmVqZWN0aW9uLlxuICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1ha2VTdGFja1RyYWNlTG9uZyhlcnJvciwgcHJvbWlzZSk7XG4gICAgICAgICAgICBpZiAoUS5vbmVycm9yKSB7XG4gICAgICAgICAgICAgICAgUS5vbmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBBdm9pZCB1bm5lY2Vzc2FyeSBgbmV4dFRpY2tgaW5nIHZpYSBhbiB1bm5lY2Vzc2FyeSBgd2hlbmAuXG4gICAgdmFyIHByb21pc2UgPSBmdWxmaWxsZWQgfHwgcmVqZWN0ZWQgfHwgcHJvZ3Jlc3MgP1xuICAgICAgICB0aGlzLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIDpcbiAgICAgICAgdGhpcztcblxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiBwcm9jZXNzICYmIHByb2Nlc3MuZG9tYWluKSB7XG4gICAgICAgIG9uVW5oYW5kbGVkRXJyb3IgPSBwcm9jZXNzLmRvbWFpbi5iaW5kKG9uVW5oYW5kbGVkRXJyb3IpO1xuICAgIH1cblxuICAgIHByb21pc2UudGhlbih2b2lkIDAsIG9uVW5oYW5kbGVkRXJyb3IpO1xufTtcblxuLyoqXG4gKiBDYXVzZXMgYSBwcm9taXNlIHRvIGJlIHJlamVjdGVkIGlmIGl0IGRvZXMgbm90IGdldCBmdWxmaWxsZWQgYmVmb3JlXG4gKiBzb21lIG1pbGxpc2Vjb25kcyB0aW1lIG91dC5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtOdW1iZXJ9IG1pbGxpc2Vjb25kcyB0aW1lb3V0XG4gKiBAcGFyYW0ge0FueSp9IGN1c3RvbSBlcnJvciBtZXNzYWdlIG9yIEVycm9yIG9iamVjdCAob3B0aW9uYWwpXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlIGlmIGl0IGlzXG4gKiBmdWxmaWxsZWQgYmVmb3JlIHRoZSB0aW1lb3V0LCBvdGhlcndpc2UgcmVqZWN0ZWQuXG4gKi9cblEudGltZW91dCA9IGZ1bmN0aW9uIChvYmplY3QsIG1zLCBlcnJvcikge1xuICAgIHJldHVybiBRKG9iamVjdCkudGltZW91dChtcywgZXJyb3IpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGltZW91dCA9IGZ1bmN0aW9uIChtcywgZXJyb3IpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHZhciB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFlcnJvciB8fCBcInN0cmluZ1wiID09PSB0eXBlb2YgZXJyb3IpIHtcbiAgICAgICAgICAgIGVycm9yID0gbmV3IEVycm9yKGVycm9yIHx8IFwiVGltZWQgb3V0IGFmdGVyIFwiICsgbXMgKyBcIiBtc1wiKTtcbiAgICAgICAgICAgIGVycm9yLmNvZGUgPSBcIkVUSU1FRE9VVFwiO1xuICAgICAgICB9XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgfSwgbXMpO1xuXG4gICAgdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh2YWx1ZSk7XG4gICAgfSwgZnVuY3Rpb24gKGV4Y2VwdGlvbikge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgfSwgZGVmZXJyZWQubm90aWZ5KTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIGdpdmVuIHZhbHVlIChvciBwcm9taXNlZCB2YWx1ZSksIHNvbWVcbiAqIG1pbGxpc2Vjb25kcyBhZnRlciBpdCByZXNvbHZlZC4gUGFzc2VzIHJlamVjdGlvbnMgaW1tZWRpYXRlbHkuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2VcbiAqIEBwYXJhbSB7TnVtYmVyfSBtaWxsaXNlY29uZHNcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2UgYWZ0ZXIgbWlsbGlzZWNvbmRzXG4gKiB0aW1lIGhhcyBlbGFwc2VkIHNpbmNlIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlLlxuICogSWYgdGhlIGdpdmVuIHByb21pc2UgcmVqZWN0cywgdGhhdCBpcyBwYXNzZWQgaW1tZWRpYXRlbHkuXG4gKi9cblEuZGVsYXkgPSBmdW5jdGlvbiAob2JqZWN0LCB0aW1lb3V0KSB7XG4gICAgaWYgKHRpbWVvdXQgPT09IHZvaWQgMCkge1xuICAgICAgICB0aW1lb3V0ID0gb2JqZWN0O1xuICAgICAgICBvYmplY3QgPSB2b2lkIDA7XG4gICAgfVxuICAgIHJldHVybiBRKG9iamVjdCkuZGVsYXkodGltZW91dCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kZWxheSA9IGZ1bmN0aW9uICh0aW1lb3V0KSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBQYXNzZXMgYSBjb250aW51YXRpb24gdG8gYSBOb2RlIGZ1bmN0aW9uLCB3aGljaCBpcyBjYWxsZWQgd2l0aCB0aGUgZ2l2ZW5cbiAqIGFyZ3VtZW50cyBwcm92aWRlZCBhcyBhbiBhcnJheSwgYW5kIHJldHVybnMgYSBwcm9taXNlLlxuICpcbiAqICAgICAgUS5uZmFwcGx5KEZTLnJlYWRGaWxlLCBbX19maWxlbmFtZV0pXG4gKiAgICAgIC50aGVuKGZ1bmN0aW9uIChjb250ZW50KSB7XG4gKiAgICAgIH0pXG4gKlxuICovXG5RLm5mYXBwbHkgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIGFyZ3MpIHtcbiAgICByZXR1cm4gUShjYWxsYmFjaykubmZhcHBseShhcmdzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mYXBwbHkgPSBmdW5jdGlvbiAoYXJncykge1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJncyk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZmFwcGx5KG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIFBhc3NlcyBhIGNvbnRpbnVhdGlvbiB0byBhIE5vZGUgZnVuY3Rpb24sIHdoaWNoIGlzIGNhbGxlZCB3aXRoIHRoZSBnaXZlblxuICogYXJndW1lbnRzIHByb3ZpZGVkIGluZGl2aWR1YWxseSwgYW5kIHJldHVybnMgYSBwcm9taXNlLlxuICogQGV4YW1wbGVcbiAqIFEubmZjYWxsKEZTLnJlYWRGaWxlLCBfX2ZpbGVuYW1lKVxuICogLnRoZW4oZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAqIH0pXG4gKlxuICovXG5RLm5mY2FsbCA9IGZ1bmN0aW9uIChjYWxsYmFjayAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gUShjYWxsYmFjaykubmZhcHBseShhcmdzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mY2FsbCA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogV3JhcHMgYSBOb2RlSlMgY29udGludWF0aW9uIHBhc3NpbmcgZnVuY3Rpb24gYW5kIHJldHVybnMgYW4gZXF1aXZhbGVudFxuICogdmVyc2lvbiB0aGF0IHJldHVybnMgYSBwcm9taXNlLlxuICogQGV4YW1wbGVcbiAqIFEubmZiaW5kKEZTLnJlYWRGaWxlLCBfX2ZpbGVuYW1lKShcInV0Zi04XCIpXG4gKiAudGhlbihjb25zb2xlLmxvZylcbiAqIC5kb25lKClcbiAqL1xuUS5uZmJpbmQgPVxuUS5kZW5vZGVpZnkgPSBmdW5jdGlvbiAoY2FsbGJhY2sgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYmFzZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBub2RlQXJncyA9IGJhc2VBcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKTtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgICAgICBRKGNhbGxiYWNrKS5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mYmluZCA9XG5Qcm9taXNlLnByb3RvdHlwZS5kZW5vZGVpZnkgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgYXJncy51bnNoaWZ0KHRoaXMpO1xuICAgIHJldHVybiBRLmRlbm9kZWlmeS5hcHBseSh2b2lkIDAsIGFyZ3MpO1xufTtcblxuUS5uYmluZCA9IGZ1bmN0aW9uIChjYWxsYmFjaywgdGhpc3AgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYmFzZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBub2RlQXJncyA9IGJhc2VBcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKTtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgICAgICBmdW5jdGlvbiBib3VuZCgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseSh0aGlzcCwgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgICAgICBRKGJvdW5kKS5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5iaW5kID0gZnVuY3Rpb24gKC8qdGhpc3AsIC4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAwKTtcbiAgICBhcmdzLnVuc2hpZnQodGhpcyk7XG4gICAgcmV0dXJuIFEubmJpbmQuYXBwbHkodm9pZCAwLCBhcmdzKTtcbn07XG5cbi8qKlxuICogQ2FsbHMgYSBtZXRob2Qgb2YgYSBOb2RlLXN0eWxlIG9iamVjdCB0aGF0IGFjY2VwdHMgYSBOb2RlLXN0eWxlXG4gKiBjYWxsYmFjayB3aXRoIGEgZ2l2ZW4gYXJyYXkgb2YgYXJndW1lbnRzLCBwbHVzIGEgcHJvdmlkZWQgY2FsbGJhY2suXG4gKiBAcGFyYW0gb2JqZWN0IGFuIG9iamVjdCB0aGF0IGhhcyB0aGUgbmFtZWQgbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBuYW1lIG9mIHRoZSBtZXRob2Qgb2Ygb2JqZWN0XG4gKiBAcGFyYW0ge0FycmF5fSBhcmdzIGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBtZXRob2Q7IHRoZSBjYWxsYmFja1xuICogd2lsbCBiZSBwcm92aWRlZCBieSBRIGFuZCBhcHBlbmRlZCB0byB0aGVzZSBhcmd1bWVudHMuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSB2YWx1ZSBvciBlcnJvclxuICovXG5RLm5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUS5ucG9zdCA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLm5wb3N0KG5hbWUsIGFyZ3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5Qcm9taXNlLnByb3RvdHlwZS5ucG9zdCA9IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJncyB8fCBbXSk7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIG5vZGVBcmdzXSkuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBDYWxscyBhIG1ldGhvZCBvZiBhIE5vZGUtc3R5bGUgb2JqZWN0IHRoYXQgYWNjZXB0cyBhIE5vZGUtc3R5bGVcbiAqIGNhbGxiYWNrLCBmb3J3YXJkaW5nIHRoZSBnaXZlbiB2YXJpYWRpYyBhcmd1bWVudHMsIHBsdXMgYSBwcm92aWRlZFxuICogY2FsbGJhY2sgYXJndW1lbnQuXG4gKiBAcGFyYW0gb2JqZWN0IGFuIG9iamVjdCB0aGF0IGhhcyB0aGUgbmFtZWQgbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBuYW1lIG9mIHRoZSBtZXRob2Qgb2Ygb2JqZWN0XG4gKiBAcGFyYW0gLi4uYXJncyBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgbWV0aG9kOyB0aGUgY2FsbGJhY2sgd2lsbFxuICogYmUgcHJvdmlkZWQgYnkgUSBhbmQgYXBwZW5kZWQgdG8gdGhlc2UgYXJndW1lbnRzLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgdmFsdWUgb3IgZXJyb3JcbiAqL1xuUS5uc2VuZCA9IC8vIFhYWCBCYXNlZCBvbiBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIFwic2VuZFwiXG5RLm5tY2FsbCA9IC8vIFhYWCBCYXNlZCBvbiBcIlJlZHNhbmRybydzXCIgcHJvcG9zYWxcblEubmludm9rZSA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIFEob2JqZWN0KS5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIG5vZGVBcmdzXSkuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubnNlbmQgPSAvLyBYWFggQmFzZWQgb24gTWFyayBNaWxsZXIncyBwcm9wb3NlZCBcInNlbmRcIlxuUHJvbWlzZS5wcm90b3R5cGUubm1jYWxsID0gLy8gWFhYIEJhc2VkIG9uIFwiUmVkc2FuZHJvJ3NcIiBwcm9wb3NhbFxuUHJvbWlzZS5wcm90b3R5cGUubmludm9rZSA9IGZ1bmN0aW9uIChuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgbm9kZUFyZ3NdKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIElmIGEgZnVuY3Rpb24gd291bGQgbGlrZSB0byBzdXBwb3J0IGJvdGggTm9kZSBjb250aW51YXRpb24tcGFzc2luZy1zdHlsZSBhbmRcbiAqIHByb21pc2UtcmV0dXJuaW5nLXN0eWxlLCBpdCBjYW4gZW5kIGl0cyBpbnRlcm5hbCBwcm9taXNlIGNoYWluIHdpdGhcbiAqIGBub2RlaWZ5KG5vZGViYWNrKWAsIGZvcndhcmRpbmcgdGhlIG9wdGlvbmFsIG5vZGViYWNrIGFyZ3VtZW50LiAgSWYgdGhlIHVzZXJcbiAqIGVsZWN0cyB0byB1c2UgYSBub2RlYmFjaywgdGhlIHJlc3VsdCB3aWxsIGJlIHNlbnQgdGhlcmUuICBJZiB0aGV5IGRvIG5vdFxuICogcGFzcyBhIG5vZGViYWNrLCB0aGV5IHdpbGwgcmVjZWl2ZSB0aGUgcmVzdWx0IHByb21pc2UuXG4gKiBAcGFyYW0gb2JqZWN0IGEgcmVzdWx0IChvciBhIHByb21pc2UgZm9yIGEgcmVzdWx0KVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbm9kZWJhY2sgYSBOb2RlLmpzLXN0eWxlIGNhbGxiYWNrXG4gKiBAcmV0dXJucyBlaXRoZXIgdGhlIHByb21pc2Ugb3Igbm90aGluZ1xuICovXG5RLm5vZGVpZnkgPSBub2RlaWZ5O1xuZnVuY3Rpb24gbm9kZWlmeShvYmplY3QsIG5vZGViYWNrKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5ub2RlaWZ5KG5vZGViYWNrKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUubm9kZWlmeSA9IGZ1bmN0aW9uIChub2RlYmFjaykge1xuICAgIGlmIChub2RlYmFjaykge1xuICAgICAgICB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBub2RlYmFjayhudWxsLCB2YWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBub2RlYmFjayhlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufTtcblxuUS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiUS5ub0NvbmZsaWN0IG9ubHkgd29ya3Mgd2hlbiBRIGlzIHVzZWQgYXMgYSBnbG9iYWxcIik7XG59O1xuXG4vLyBBbGwgY29kZSBiZWZvcmUgdGhpcyBwb2ludCB3aWxsIGJlIGZpbHRlcmVkIGZyb20gc3RhY2sgdHJhY2VzLlxudmFyIHFFbmRpbmdMaW5lID0gY2FwdHVyZUxpbmUoKTtcblxucmV0dXJuIFE7XG5cbn0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTMtMjAxNCBLZXZpbiBDb3hcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4qICBUaGlzIHNvZnR3YXJlIGlzIHByb3ZpZGVkICdhcy1pcycsIHdpdGhvdXQgYW55IGV4cHJlc3Mgb3IgaW1wbGllZCAgICAgICAgICAgKlxuKiAgd2FycmFudHkuIEluIG5vIGV2ZW50IHdpbGwgdGhlIGF1dGhvcnMgYmUgaGVsZCBsaWFibGUgZm9yIGFueSBkYW1hZ2VzICAgICAgICpcbiogIGFyaXNpbmcgZnJvbSB0aGUgdXNlIG9mIHRoaXMgc29mdHdhcmUuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4qICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgUGVybWlzc2lvbiBpcyBncmFudGVkIHRvIGFueW9uZSB0byB1c2UgdGhpcyBzb2Z0d2FyZSBmb3IgYW55IHB1cnBvc2UsICAgICAgICpcbiogIGluY2x1ZGluZyBjb21tZXJjaWFsIGFwcGxpY2F0aW9ucywgYW5kIHRvIGFsdGVyIGl0IGFuZCByZWRpc3RyaWJ1dGUgaXQgICAgICAqXG4qICBmcmVlbHksIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyByZXN0cmljdGlvbnM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiogIDEuIFRoZSBvcmlnaW4gb2YgdGhpcyBzb2Z0d2FyZSBtdXN0IG5vdCBiZSBtaXNyZXByZXNlbnRlZDsgeW91IG11c3Qgbm90ICAgICAqXG4qICAgICBjbGFpbSB0aGF0IHlvdSB3cm90ZSB0aGUgb3JpZ2luYWwgc29mdHdhcmUuIElmIHlvdSB1c2UgdGhpcyBzb2Z0d2FyZSBpbiAgKlxuKiAgICAgYSBwcm9kdWN0LCBhbiBhY2tub3dsZWRnbWVudCBpbiB0aGUgcHJvZHVjdCBkb2N1bWVudGF0aW9uIHdvdWxkIGJlICAgICAgICpcbiogICAgIGFwcHJlY2lhdGVkIGJ1dCBpcyBub3QgcmVxdWlyZWQuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4qICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgMi4gQWx0ZXJlZCBzb3VyY2UgdmVyc2lvbnMgbXVzdCBiZSBwbGFpbmx5IG1hcmtlZCBhcyBzdWNoLCBhbmQgbXVzdCBub3QgYmUgICpcbiogICAgIG1pc3JlcHJlc2VudGVkIGFzIGJlaW5nIHRoZSBvcmlnaW5hbCBzb2Z0d2FyZS4gICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4qICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgMy4gVGhpcyBub3RpY2UgbWF5IG5vdCBiZSByZW1vdmVkIG9yIGFsdGVyZWQgZnJvbSBhbnkgc291cmNlIGRpc3RyaWJ1dGlvbi4gICpcbiogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4rZnVuY3Rpb24oKXtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgYXJyYXkgPSAvXFxbKFteXFxbXSopXFxdJC87XG5cbi8vLyBVUkwgUmVnZXguXG4vKipcbiAqIFRoaXMgcmVnZXggc3BsaXRzIHRoZSBVUkwgaW50byBwYXJ0cy4gIFRoZSBjYXB0dXJlIGdyb3VwcyBjYXRjaCB0aGUgaW1wb3J0YW50XG4gKiBiaXRzLlxuICogXG4gKiBFYWNoIHNlY3Rpb24gaXMgb3B0aW9uYWwsIHNvIHRvIHdvcmsgb24gYW55IHBhcnQgZmluZCB0aGUgY29ycmVjdCB0b3AgbGV2ZWxcbiAqIGAoLi4uKT9gIGFuZCBtZXNzIGFyb3VuZCB3aXRoIGl0LlxuICovXG52YXIgcmVnZXggPSAvXig/OihbYS16XSopOik/KD86XFwvXFwvKT8oPzooW146QF0qKSg/OjooW15AXSopKT9AKT8oW2Etei0uX10rKT8oPzo6KFswLTldKikpPyhcXC9bXj8jXSopPyg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8kL2k7XG4vLyAgICAgICAgICAgICAgIDEgLSBzY2hlbWUgICAgICAgICAgICAgICAgMiAtIHVzZXIgICAgMyA9IHBhc3MgNCAtIGhvc3QgICAgICAgIDUgLSBwb3J0ICA2IC0gcGF0aCAgICAgICAgNyAtIHF1ZXJ5ICAgIDggLSBoYXNoXG5cbnZhciBub3NsYXNoID0gW1wibWFpbHRvXCIsXCJiaXRjb2luXCJdO1xuXG52YXIgc2VsZiA9IHtcblx0LyoqIFBhcnNlIGEgcXVlcnkgc3RyaW5nLlxuXHQgKlxuXHQgKiBUaGlzIGZ1bmN0aW9uIHBhcnNlcyBhIHF1ZXJ5IHN0cmluZyAoc29tZXRpbWVzIGNhbGxlZCB0aGUgc2VhcmNoXG5cdCAqIHN0cmluZykuICBJdCB0YWtlcyBhIHF1ZXJ5IHN0cmluZyBhbmQgcmV0dXJucyBhIG1hcCBvZiB0aGUgcmVzdWx0cy5cblx0ICpcblx0ICogS2V5cyBhcmUgY29uc2lkZXJlZCB0byBiZSBldmVyeXRoaW5nIHVwIHRvIHRoZSBmaXJzdCAnPScgYW5kIHZhbHVlcyBhcmVcblx0ICogZXZlcnl0aGluZyBhZnRlcndvcmRzLiAgU2luY2UgVVJMLWRlY29kaW5nIGlzIGRvbmUgYWZ0ZXIgcGFyc2luZywga2V5c1xuXHQgKiBhbmQgdmFsdWVzIGNhbiBoYXZlIGFueSB2YWx1ZXMsIGhvd2V2ZXIsICc9JyBoYXZlIHRvIGJlIGVuY29kZWQgaW4ga2V5c1xuXHQgKiB3aGlsZSAnPycgYW5kICcmJyBoYXZlIHRvIGJlIGVuY29kZWQgYW55d2hlcmUgKGFzIHRoZXkgZGVsaW1pdCB0aGVcblx0ICoga3YtcGFpcnMpLlxuXHQgKlxuXHQgKiBLZXlzIGFuZCB2YWx1ZXMgd2lsbCBhbHdheXMgYmUgc3RyaW5ncywgZXhjZXB0IGlmIHRoZXJlIGlzIGEga2V5IHdpdGggbm9cblx0ICogJz0nIGluIHdoaWNoIGNhc2UgaXQgd2lsbCBiZSBjb25zaWRlcmVkIGEgZmxhZyBhbmQgd2lsbCBiZSBzZXQgdG8gdHJ1ZS5cblx0ICogTGF0ZXIgdmFsdWVzIHdpbGwgb3ZlcnJpZGUgZWFybGllciB2YWx1ZXMuXG5cdCAqXG5cdCAqIEFycmF5IGtleXMgYXJlIGFsc28gc3VwcG9ydGVkLiAgQnkgZGVmYXVsdCBrZXlzIGluIHRoZSBmb3JtIG9mIGBuYW1lW2ldYFxuXHQgKiB3aWxsIGJlIHJldHVybmVkIGxpa2UgdGhhdCBhcyBzdHJpbmdzLiAgSG93ZXZlciwgaWYgeW91IHNldCB0aGUgYGFycmF5YFxuXHQgKiBmbGFnIGluIHRoZSBvcHRpb25zIG9iamVjdCB0aGV5IHdpbGwgYmUgcGFyc2VkIGludG8gYXJyYXlzLiAgTm90ZSB0aGF0XG5cdCAqIGFsdGhvdWdoIHRoZSBvYmplY3QgcmV0dXJuZWQgaXMgYW4gYEFycmF5YCBvYmplY3QgYWxsIGtleXMgd2lsbCBiZVxuXHQgKiB3cml0dGVuIHRvIGl0LiAgVGhpcyBtZWFucyB0aGF0IGlmIHlvdSBoYXZlIGEga2V5IHN1Y2ggYXMgYGtbZm9yRWFjaF1gXG5cdCAqIGl0IHdpbGwgb3ZlcndyaXRlIHRoZSBgZm9yRWFjaGAgZnVuY3Rpb24gb24gdGhhdCBhcnJheS4gIEFsc28gbm90ZSB0aGF0XG5cdCAqIHN0cmluZyBwcm9wZXJ0aWVzIGFsd2F5cyB0YWtlIHByZWNlZGVuY2Ugb3ZlciBhcnJheSBwcm9wZXJ0aWVzLFxuXHQgKiBpcnJlc3BlY3RpdmUgb2Ygd2hlcmUgdGhleSBhcmUgaW4gdGhlIHF1ZXJ5IHN0cmluZy5cblx0ICpcblx0ICogICB1cmwuZ2V0KFwiYXJyYXlbMV09dGVzdCZhcnJheVtmb29dPWJhclwiLHthcnJheTp0cnVlfSkuYXJyYXlbMV0gID09PSBcInRlc3RcIlxuXHQgKiAgIHVybC5nZXQoXCJhcnJheVsxXT10ZXN0JmFycmF5W2Zvb109YmFyXCIse2FycmF5OnRydWV9KS5hcnJheS5mb28gPT09IFwiYmFyXCJcblx0ICogICB1cmwuZ2V0KFwiYXJyYXk9bm90YW5hcnJheSZhcnJheVswXT0xXCIse2FycmF5OnRydWV9KS5hcnJheSAgICAgID09PSBcIm5vdGFuYXJyYXlcIlxuXHQgKlxuXHQgKiBJZiBhcnJheSBwYXJzaW5nIGlzIGVuYWJsZWQga2V5cyBpbiB0aGUgZm9ybSBvZiBgbmFtZVtdYCB3aWxsXG5cdCAqIGF1dG9tYXRpY2FsbHkgYmUgZ2l2ZW4gdGhlIG5leHQgYXZhaWxhYmxlIGluZGV4LiAgTm90ZSB0aGF0IHRoaXMgY2FuIGJlXG5cdCAqIG92ZXJ3cml0dGVuIHdpdGggbGF0ZXIgdmFsdWVzIGluIHRoZSBxdWVyeSBzdHJpbmcuICBGb3IgdGhpcyByZWFzb24gaXNcblx0ICogaXMgYmVzdCBub3QgdG8gbWl4IHRoZSB0d28gZm9ybWF0cywgYWx0aG91Z2ggaXQgaXMgc2FmZSAoYW5kIG9mdGVuXG5cdCAqIHVzZWZ1bCkgdG8gYWRkIGFuIGF1dG9tYXRpYyBpbmRleCBhcmd1bWVudCB0byB0aGUgZW5kIG9mIGEgcXVlcnkgc3RyaW5nLlxuXHQgKlxuXHQgKiAgIHVybC5nZXQoXCJhW109MCZhW109MSZhWzBdPTJcIiwge2FycmF5OnRydWV9KSAgLT4ge2E6W1wiMlwiLFwiMVwiXX07XG5cdCAqICAgdXJsLmdldChcImFbMF09MCZhWzFdPTEmYVtdPTJcIiwge2FycmF5OnRydWV9KSAtPiB7YTpbXCIwXCIsXCIxXCIsXCIyXCJdfTtcblx0ICpcblx0ICogQHBhcmFte3N0cmluZ30gcSBUaGUgcXVlcnkgc3RyaW5nICh0aGUgcGFydCBhZnRlciB0aGUgJz8nKS5cblx0ICogQHBhcmFte3tmdWxsOmJvb2xlYW4sYXJyYXk6Ym9vbGVhbn09fSBvcHQgT3B0aW9ucy5cblx0ICpcblx0ICogLSBmdWxsOiBJZiBzZXQgYHFgIHdpbGwgYmUgdHJlYXRlZCBhcyBhIGZ1bGwgdXJsIGFuZCBgcWAgd2lsbCBiZSBidWlsdC5cblx0ICogICBieSBjYWxsaW5nICNwYXJzZSB0byByZXRyaWV2ZSB0aGUgcXVlcnkgcG9ydGlvbi5cblx0ICogLSBhcnJheTogSWYgc2V0IGtleXMgaW4gdGhlIGZvcm0gb2YgYGtleVtpXWAgd2lsbCBiZSB0cmVhdGVkXG5cdCAqICAgYXMgYXJyYXlzL21hcHMuXG5cdCAqXG5cdCAqIEByZXR1cm57IU9iamVjdC48c3RyaW5nLCBzdHJpbmd8QXJyYXk+fSBUaGUgcGFyc2VkIHJlc3VsdC5cblx0ICovXG5cdFwiZ2V0XCI6IGZ1bmN0aW9uKHEsIG9wdCl7XG5cdFx0cSA9IHEgfHwgXCJcIjtcblx0XHRpZiAoIHR5cGVvZiBvcHQgICAgICAgICAgPT0gXCJ1bmRlZmluZWRcIiApIG9wdCA9IHt9O1xuXHRcdGlmICggdHlwZW9mIG9wdFtcImZ1bGxcIl0gID09IFwidW5kZWZpbmVkXCIgKSBvcHRbXCJmdWxsXCJdID0gZmFsc2U7XG5cdFx0aWYgKCB0eXBlb2Ygb3B0W1wiYXJyYXlcIl0gPT0gXCJ1bmRlZmluZWRcIiApIG9wdFtcImFycmF5XCJdID0gZmFsc2U7XG5cdFx0XG5cdFx0aWYgKCBvcHRbXCJmdWxsXCJdID09PSB0cnVlIClcblx0XHR7XG5cdFx0XHRxID0gc2VsZltcInBhcnNlXCJdKHEsIHtcImdldFwiOmZhbHNlfSlbXCJxdWVyeVwiXSB8fCBcIlwiO1xuXHRcdH1cblx0XHRcblx0XHR2YXIgbyA9IHt9O1xuXHRcdFxuXHRcdHZhciBjID0gcS5zcGxpdChcIiZcIik7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjLmxlbmd0aDsgaSsrKVxuXHRcdHtcblx0XHRcdGlmICghY1tpXS5sZW5ndGgpIGNvbnRpbnVlO1xuXHRcdFx0XG5cdFx0XHR2YXIgZCA9IGNbaV0uaW5kZXhPZihcIj1cIik7XG5cdFx0XHR2YXIgayA9IGNbaV0sIHYgPSB0cnVlO1xuXHRcdFx0aWYgKCBkID49IDAgKVxuXHRcdFx0e1xuXHRcdFx0XHRrID0gY1tpXS5zdWJzdHIoMCwgZCk7XG5cdFx0XHRcdHYgPSBjW2ldLnN1YnN0cihkKzEpO1xuXHRcdFx0XHRcblx0XHRcdFx0diA9IGRlY29kZVVSSUNvbXBvbmVudCh2KTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0aWYgKG9wdFtcImFycmF5XCJdKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgaW5kcyA9IFtdO1xuXHRcdFx0XHR2YXIgaW5kO1xuXHRcdFx0XHR2YXIgY3VybyA9IG87XG5cdFx0XHRcdHZhciBjdXJrID0gaztcblx0XHRcdFx0d2hpbGUgKGluZCA9IGN1cmsubWF0Y2goYXJyYXkpKSAvLyBBcnJheSFcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGN1cmsgPSBjdXJrLnN1YnN0cigwLCBpbmQuaW5kZXgpO1xuXHRcdFx0XHRcdGluZHMudW5zaGlmdChkZWNvZGVVUklDb21wb25lbnQoaW5kWzFdKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y3VyayA9IGRlY29kZVVSSUNvbXBvbmVudChjdXJrKTtcblx0XHRcdFx0aWYgKGluZHMuc29tZShmdW5jdGlvbihpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKCB0eXBlb2YgY3Vyb1tjdXJrXSA9PSBcInVuZGVmaW5lZFwiICkgY3Vyb1tjdXJrXSA9IFtdO1xuXHRcdFx0XHRcdGlmICghQXJyYXkuaXNBcnJheShjdXJvW2N1cmtdKSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKFwidXJsLmdldDogQXJyYXkgcHJvcGVydHkgXCIrY3VyaytcIiBhbHJlYWR5IGV4aXN0cyBhcyBzdHJpbmchXCIpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGN1cm8gPSBjdXJvW2N1cmtdO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmICggaSA9PT0gXCJcIiApIGkgPSBjdXJvLmxlbmd0aDtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRjdXJrID0gaTtcblx0XHRcdFx0fSkpIGNvbnRpbnVlO1xuXHRcdFx0XHRjdXJvW2N1cmtdID0gdjtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGsgPSBkZWNvZGVVUklDb21wb25lbnQoayk7XG5cdFx0XHRcblx0XHRcdC8vdHlwZW9mIG9ba10gPT0gXCJ1bmRlZmluZWRcIiB8fCBjb25zb2xlLmxvZyhcIlByb3BlcnR5IFwiK2srXCIgYWxyZWFkeSBleGlzdHMhXCIpO1xuXHRcdFx0b1trXSA9IHY7XG5cdFx0fVxuXHRcdFxuXHRcdHJldHVybiBvO1xuXHR9LFxuXHRcblx0LyoqIEJ1aWxkIGEgZ2V0IHF1ZXJ5IGZyb20gYW4gb2JqZWN0LlxuXHQgKlxuXHQgKiBUaGlzIGNvbnN0cnVjdHMgYSBxdWVyeSBzdHJpbmcgZnJvbSB0aGUga3YgcGFpcnMgaW4gYGRhdGFgLiAgQ2FsbGluZ1xuXHQgKiAjZ2V0IG9uIHRoZSBzdHJpbmcgcmV0dXJuZWQgc2hvdWxkIHJldHVybiBhbiBvYmplY3QgaWRlbnRpY2FsIHRvIHRoZSBvbmVcblx0ICogcGFzc2VkIGluIGV4Y2VwdCBhbGwgbm9uLWJvb2xlYW4gc2NhbGFyIHR5cGVzIGJlY29tZSBzdHJpbmdzIGFuZCBhbGxcblx0ICogb2JqZWN0IHR5cGVzIGJlY29tZSBhcnJheXMgKG5vbi1pbnRlZ2VyIGtleXMgYXJlIHN0aWxsIHByZXNlbnQsIHNlZVxuXHQgKiAjZ2V0J3MgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBkZXRhaWxzKS5cblx0ICpcblx0ICogVGhpcyBhbHdheXMgdXNlcyBhcnJheSBzeW50YXggZm9yIGRlc2NyaWJpbmcgYXJyYXlzLiAgSWYgeW91IHdhbnQgdG9cblx0ICogc2VyaWFsaXplIHRoZW0gZGlmZmVyZW50bHkgKGxpa2UgaGF2aW5nIHRoZSB2YWx1ZSBiZSBhIEpTT04gYXJyYXkgYW5kXG5cdCAqIGhhdmUgYSBwbGFpbiBrZXkpIHlvdSB3aWxsIG5lZWQgdG8gZG8gdGhhdCBiZWZvcmUgcGFzc2luZyBpdCBpbi5cblx0ICpcblx0ICogQWxsIGtleXMgYW5kIHZhbHVlcyBhcmUgc3VwcG9ydGVkIChiaW5hcnkgZGF0YSBhbnlvbmU/KSBhcyB0aGV5IGFyZVxuXHQgKiBwcm9wZXJseSBVUkwtZW5jb2RlZCBhbmQgI2dldCBwcm9wZXJseSBkZWNvZGVzLlxuXHQgKlxuXHQgKiBAcGFyYW17T2JqZWN0fSBkYXRhIFRoZSBrdiBwYWlycy5cblx0ICogQHBhcmFte3N0cmluZ30gcHJlZml4IFRoZSBwcm9wZXJseSBlbmNvZGVkIGFycmF5IGtleSB0byBwdXQgdGhlXG5cdCAqICAgcHJvcGVydGllcy4gIE1haW5seSBpbnRlbmRlZCBmb3IgaW50ZXJuYWwgdXNlLlxuXHQgKiBAcmV0dXJue3N0cmluZ30gQSBVUkwtc2FmZSBzdHJpbmcuXG5cdCAqL1xuXHRcImJ1aWxkZ2V0XCI6IGZ1bmN0aW9uKGRhdGEsIHByZWZpeCl7XG5cdFx0dmFyIGl0bXMgPSBbXTtcblx0XHRmb3IgKCB2YXIgayBpbiBkYXRhIClcblx0XHR7XG5cdFx0XHR2YXIgZWsgPSBlbmNvZGVVUklDb21wb25lbnQoayk7XG5cdFx0XHRpZiAoIHR5cGVvZiBwcmVmaXggIT0gXCJ1bmRlZmluZWRcIiApXG5cdFx0XHRcdGVrID0gcHJlZml4K1wiW1wiK2VrK1wiXVwiO1xuXHRcdFx0XG5cdFx0XHR2YXIgdiA9IGRhdGFba107XG5cdFx0XHRcblx0XHRcdHN3aXRjaCAodHlwZW9mIHYpXG5cdFx0XHR7XG5cdFx0XHRcdGNhc2UgJ2Jvb2xlYW4nOlxuXHRcdFx0XHRcdGlmKHYpIGl0bXMucHVzaChlayk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ251bWJlcic6XG5cdFx0XHRcdFx0diA9IHYudG9TdHJpbmcoKTtcblx0XHRcdFx0Y2FzZSAnc3RyaW5nJzpcblx0XHRcdFx0XHRpdG1zLnB1c2goZWsrXCI9XCIrZW5jb2RlVVJJQ29tcG9uZW50KHYpKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnb2JqZWN0Jzpcblx0XHRcdFx0XHRpdG1zLnB1c2goc2VsZltcImJ1aWxkZ2V0XCJdKHYsIGVrKSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBpdG1zLmpvaW4oXCImXCIpO1xuXHR9LFxuXHRcblx0LyoqIFBhcnNlIGEgVVJMXG5cdCAqIFxuXHQgKiBUaGlzIGJyZWFrcyB1cCBhIFVSTCBpbnRvIGNvbXBvbmVudHMuICBJdCBhdHRlbXB0cyB0byBiZSB2ZXJ5IGxpYmVyYWxcblx0ICogYW5kIHJldHVybnMgdGhlIGJlc3QgcmVzdWx0IGluIG1vc3QgY2FzZXMuICBUaGlzIG1lYW5zIHRoYXQgeW91IGNhblxuXHQgKiBvZnRlbiBwYXNzIGluIHBhcnQgb2YgYSBVUkwgYW5kIGdldCBjb3JyZWN0IGNhdGVnb3JpZXMgYmFjay4gIE5vdGFibHksXG5cdCAqIHRoaXMgd29ya3MgZm9yIGVtYWlscyBhbmQgSmFiYmVyIElEcywgYXMgd2VsbCBhcyBhZGRpbmcgYSAnPycgdG8gdGhlXG5cdCAqIGJlZ2lubmluZyBvZiBhIHN0cmluZyB3aWxsIHBhcnNlIHRoZSB3aG9sZSB0aGluZyBhcyBhIHF1ZXJ5IHN0cmluZy4gIElmXG5cdCAqIGFuIGl0ZW0gaXMgbm90IGZvdW5kIHRoZSBwcm9wZXJ0eSB3aWxsIGJlIHVuZGVmaW5lZC4gIEluIHNvbWUgY2FzZXMgYW5cblx0ICogZW1wdHkgc3RyaW5nIHdpbGwgYmUgcmV0dXJuZWQgaWYgdGhlIHN1cnJvdW5kaW5nIHN5bnRheCBidXQgdGhlIGFjdHVhbFxuXHQgKiB2YWx1ZSBpcyBlbXB0eSAoZXhhbXBsZTogXCI6Ly9leGFtcGxlLmNvbVwiIHdpbGwgZ2l2ZSBhIGVtcHR5IHN0cmluZyBmb3Jcblx0ICogc2NoZW1lLikgIE5vdGFibHkgdGhlIGhvc3QgbmFtZSB3aWxsIGFsd2F5cyBiZSBzZXQgdG8gc29tZXRoaW5nLlxuXHQgKiBcblx0ICogUmV0dXJuZWQgcHJvcGVydGllcy5cblx0ICogXG5cdCAqIC0gKipzY2hlbWU6KiogVGhlIHVybCBzY2hlbWUuIChleDogXCJtYWlsdG9cIiBvciBcImh0dHBzXCIpXG5cdCAqIC0gKip1c2VyOioqIFRoZSB1c2VybmFtZS5cblx0ICogLSAqKnBhc3M6KiogVGhlIHBhc3N3b3JkLlxuXHQgKiAtICoqaG9zdDoqKiBUaGUgaG9zdG5hbWUuIChleDogXCJsb2NhbGhvc3RcIiwgXCIxMjMuNDU2LjcuOFwiIG9yIFwiZXhhbXBsZS5jb21cIilcblx0ICogLSAqKnBvcnQ6KiogVGhlIHBvcnQsIGFzIGEgbnVtYmVyLiAoZXg6IDEzMzcpXG5cdCAqIC0gKipwYXRoOioqIFRoZSBwYXRoLiAoZXg6IFwiL1wiIG9yIFwiL2Fib3V0Lmh0bWxcIilcblx0ICogLSAqKnF1ZXJ5OioqIFwiVGhlIHF1ZXJ5IHN0cmluZy4gKGV4OiBcImZvbz1iYXImdj0xNyZmb3JtYXQ9anNvblwiKVxuXHQgKiAtICoqZ2V0OioqIFRoZSBxdWVyeSBzdHJpbmcgcGFyc2VkIHdpdGggZ2V0LiAgSWYgYG9wdC5nZXRgIGlzIGBmYWxzZWAgdGhpc1xuXHQgKiAgIHdpbGwgYmUgYWJzZW50XG5cdCAqIC0gKipoYXNoOioqIFRoZSB2YWx1ZSBhZnRlciB0aGUgaGFzaC4gKGV4OiBcIm15YW5jaG9yXCIpXG5cdCAqICAgYmUgdW5kZWZpbmVkIGV2ZW4gaWYgYHF1ZXJ5YCBpcyBzZXQuXG5cdCAqXG5cdCAqIEBwYXJhbXtzdHJpbmd9IHVybCBUaGUgVVJMIHRvIHBhcnNlLlxuXHQgKiBAcGFyYW17e2dldDpPYmplY3R9PX0gb3B0IE9wdGlvbnM6XG5cdCAqXG5cdCAqIC0gZ2V0OiBBbiBvcHRpb25zIGFyZ3VtZW50IHRvIGJlIHBhc3NlZCB0byAjZ2V0IG9yIGZhbHNlIHRvIG5vdCBjYWxsICNnZXQuXG5cdCAqICAgICoqRE8gTk9UKiogc2V0IGBmdWxsYC5cblx0ICpcblx0ICogQHJldHVybnshT2JqZWN0fSBBbiBvYmplY3Qgd2l0aCB0aGUgcGFyc2VkIHZhbHVlcy5cblx0ICovXG5cdFwicGFyc2VcIjogZnVuY3Rpb24odXJsLCBvcHQpIHtcblx0XHRcblx0XHRpZiAoIHR5cGVvZiBvcHQgPT0gXCJ1bmRlZmluZWRcIiApIG9wdCA9IHt9O1xuXHRcdFxuXHRcdHZhciBtZCA9IHVybC5tYXRjaChyZWdleCkgfHwgW107XG5cdFx0XG5cdFx0dmFyIHIgPSB7XG5cdFx0XHRcInVybFwiOiAgICB1cmwsXG5cdFx0XHRcblx0XHRcdFwic2NoZW1lXCI6IG1kWzFdLFxuXHRcdFx0XCJ1c2VyXCI6ICAgbWRbMl0sXG5cdFx0XHRcInBhc3NcIjogICBtZFszXSxcblx0XHRcdFwiaG9zdFwiOiAgIG1kWzRdLFxuXHRcdFx0XCJwb3J0XCI6ICAgbWRbNV0gJiYgK21kWzVdLFxuXHRcdFx0XCJwYXRoXCI6ICAgbWRbNl0sXG5cdFx0XHRcInF1ZXJ5XCI6ICBtZFs3XSxcblx0XHRcdFwiaGFzaFwiOiAgIG1kWzhdLFxuXHRcdH07XG5cdFx0XG5cdFx0aWYgKCBvcHQuZ2V0ICE9PSBmYWxzZSApXG5cdFx0XHRyW1wiZ2V0XCJdID0gcltcInF1ZXJ5XCJdICYmIHNlbGZbXCJnZXRcIl0ocltcInF1ZXJ5XCJdLCBvcHQuZ2V0KTtcblx0XHRcblx0XHRyZXR1cm4gcjtcblx0fSxcblx0XG5cdC8qKiBCdWlsZCBhIFVSTCBmcm9tIGNvbXBvbmVudHMuXG5cdCAqIFxuXHQgKiBUaGlzIHBpZWNlcyB0b2dldGhlciBhIHVybCBmcm9tIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBwYXNzZWQgaW4gb2JqZWN0LlxuXHQgKiBJbiBnZW5lcmFsIHBhc3NpbmcgdGhlIHJlc3VsdCBvZiBgcGFyc2UoKWAgc2hvdWxkIHJldHVybiB0aGUgVVJMLiAgVGhlcmVcblx0ICogbWF5IGRpZmZlcmVuY2VzIGluIHRoZSBnZXQgc3RyaW5nIGFzIHRoZSBrZXlzIGFuZCB2YWx1ZXMgbWlnaHQgYmUgbW9yZVxuXHQgKiBlbmNvZGVkIHRoZW4gdGhleSB3ZXJlIG9yaWdpbmFsbHkgd2VyZS4gIEhvd2V2ZXIsIGNhbGxpbmcgYGdldCgpYCBvbiB0aGVcblx0ICogdHdvIHZhbHVlcyBzaG91bGQgeWllbGQgdGhlIHNhbWUgcmVzdWx0LlxuXHQgKiBcblx0ICogSGVyZSBpcyBob3cgdGhlIHBhcmFtZXRlcnMgYXJlIHVzZWQuXG5cdCAqIFxuXHQgKiAgLSB1cmw6IFVzZWQgb25seSBpZiBubyBvdGhlciB2YWx1ZXMgYXJlIHByb3ZpZGVkLiAgSWYgdGhhdCBpcyB0aGUgY2FzZVxuXHQgKiAgICAgYHVybGAgd2lsbCBiZSByZXR1cm5lZCB2ZXJiYXRpbS5cblx0ICogIC0gc2NoZW1lOiBVc2VkIGlmIGRlZmluZWQuXG5cdCAqICAtIHVzZXI6IFVzZWQgaWYgZGVmaW5lZC5cblx0ICogIC0gcGFzczogVXNlZCBpZiBkZWZpbmVkLlxuXHQgKiAgLSBob3N0OiBVc2VkIGlmIGRlZmluZWQuXG5cdCAqICAtIHBhdGg6IFVzZWQgaWYgZGVmaW5lZC5cblx0ICogIC0gcXVlcnk6IFVzZWQgb25seSBpZiBgZ2V0YCBpcyBub3QgcHJvdmlkZWQgYW5kIG5vbi1lbXB0eS5cblx0ICogIC0gZ2V0OiBVc2VkIGlmIG5vbi1lbXB0eS4gIFBhc3NlZCB0byAjYnVpbGRnZXQgYW5kIHRoZSByZXN1bHQgaXMgdXNlZFxuXHQgKiAgICBhcyB0aGUgcXVlcnkgc3RyaW5nLlxuXHQgKiAgLSBoYXNoOiBVc2VkIGlmIGRlZmluZWQuXG5cdCAqIFxuXHQgKiBUaGVzZSBhcmUgdGhlIG9wdGlvbnMgdGhhdCBhcmUgdmFsaWQgb24gdGhlIG9wdGlvbnMgb2JqZWN0LlxuXHQgKiBcblx0ICogIC0gdXNlZW1wdHlnZXQ6IElmIHRydXRoeSwgYSBxdWVzdGlvbiBtYXJrIHdpbGwgYmUgYXBwZW5kZWQgZm9yIGVtcHR5IGdldFxuXHQgKiAgICBzdHJpbmdzLiAgVGhpcyBub3RhYmx5IG1ha2VzIGBidWlsZCgpYCBhbmQgYHBhcnNlKClgIGZ1bGx5IHN5bW1ldHJpYy5cblx0ICpcblx0ICogQHBhcmFte09iamVjdH0gZGF0YSBUaGUgcGllY2VzIG9mIHRoZSBVUkwuXG5cdCAqIEBwYXJhbXtPYmplY3R9IG9wdCBPcHRpb25zIGZvciBidWlsZGluZyB0aGUgdXJsLlxuXHQgKiBAcmV0dXJue3N0cmluZ30gVGhlIFVSTC5cblx0ICovXG5cdFwiYnVpbGRcIjogZnVuY3Rpb24oZGF0YSwgb3B0KXtcblx0XHRvcHQgPSBvcHQgfHwge307XG5cdFx0XG5cdFx0dmFyIHIgPSBcIlwiO1xuXHRcdFxuXHRcdGlmICggdHlwZW9mIGRhdGFbXCJzY2hlbWVcIl0gIT0gXCJ1bmRlZmluZWRcIiApXG5cdFx0e1xuXHRcdFx0ciArPSBkYXRhW1wic2NoZW1lXCJdO1xuXHRcdFx0ciArPSAobm9zbGFzaC5pbmRleE9mKGRhdGFbXCJzY2hlbWVcIl0pPj0wKT9cIjpcIjpcIjovL1wiO1xuXHRcdH1cblx0XHRpZiAoIHR5cGVvZiBkYXRhW1widXNlclwiXSAhPSBcInVuZGVmaW5lZFwiIClcblx0XHR7XG5cdFx0XHRyICs9IGRhdGFbXCJ1c2VyXCJdO1xuXHRcdFx0aWYgKCB0eXBlb2YgZGF0YVtcInBhc3NcIl0gPT0gXCJ1bmRlZmluZWRcIiApXG5cdFx0XHR7XG5cdFx0XHRcdHIgKz0gXCJAXCI7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmICggdHlwZW9mIGRhdGFbXCJwYXNzXCJdICE9IFwidW5kZWZpbmVkXCIgKSByICs9IFwiOlwiICsgZGF0YVtcInBhc3NcIl0gKyBcIkBcIjtcblx0XHRpZiAoIHR5cGVvZiBkYXRhW1wiaG9zdFwiXSAhPSBcInVuZGVmaW5lZFwiICkgciArPSBkYXRhW1wiaG9zdFwiXTtcblx0XHRpZiAoIHR5cGVvZiBkYXRhW1wicG9ydFwiXSAhPSBcInVuZGVmaW5lZFwiICkgciArPSBcIjpcIiArIGRhdGFbXCJwb3J0XCJdO1xuXHRcdGlmICggdHlwZW9mIGRhdGFbXCJwYXRoXCJdICE9IFwidW5kZWZpbmVkXCIgKSByICs9IGRhdGFbXCJwYXRoXCJdO1xuXHRcdFxuXHRcdGlmIChvcHRbXCJ1c2VlbXB0eWdldFwiXSlcblx0XHR7XG5cdFx0XHRpZiAgICAgICggdHlwZW9mIGRhdGFbXCJnZXRcIl0gICAhPSBcInVuZGVmaW5lZFwiICkgciArPSBcIj9cIiArIHNlbGZbXCJidWlsZGdldFwiXShkYXRhW1wiZ2V0XCJdKTtcblx0XHRcdGVsc2UgaWYgKCB0eXBlb2YgZGF0YVtcInF1ZXJ5XCJdICE9IFwidW5kZWZpbmVkXCIgKSByICs9IFwiP1wiICsgZGF0YVtcInF1ZXJ5XCJdO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0Ly8gSWYgLmdldCB1c2UgaXQuICBJZiAuZ2V0IGxlYWRzIHRvIGVtcHR5LCB1c2UgLnF1ZXJ5LlxuXHRcdFx0dmFyIHEgPSBkYXRhW1wiZ2V0XCJdICYmIHNlbGZbXCJidWlsZGdldFwiXShkYXRhW1wiZ2V0XCJdKSB8fCBkYXRhW1wicXVlcnlcIl07XG5cdFx0XHRpZiAocSkgciArPSBcIj9cIiArIHE7XG5cdFx0fVxuXHRcdFxuXHRcdGlmICggdHlwZW9mIGRhdGFbXCJoYXNoXCJdICE9IFwidW5kZWZpbmVkXCIgKSByICs9IFwiI1wiICsgZGF0YVtcImhhc2hcIl07XG5cdFx0XG5cdFx0cmV0dXJuIHIgfHwgZGF0YVtcInVybFwiXSB8fCBcIlwiO1xuXHR9LFxufTtcblxuaWYgKCB0eXBlb2YgZGVmaW5lICE9IFwidW5kZWZpbmVkXCIgJiYgZGVmaW5lW1wiYW1kXCJdICkgZGVmaW5lKHNlbGYpO1xuZWxzZSBpZiAoIHR5cGVvZiBtb2R1bGUgIT0gXCJ1bmRlZmluZWRcIiApIG1vZHVsZVsnZXhwb3J0cyddID0gc2VsZjtcbmVsc2Ugd2luZG93W1widXJsXCJdID0gc2VsZjtcblxufSgpO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRpZiAoIShtb2R1bGVJZCBpbiBfX3dlYnBhY2tfbW9kdWxlc19fKSkge1xuXHRcdGRlbGV0ZSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRcdHZhciBlID0gbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIiArIG1vZHVsZUlkICsgXCInXCIpO1xuXHRcdGUuY29kZSA9ICdNT0RVTEVfTk9UX0ZPVU5EJztcblx0XHR0aHJvdyBlO1xuXHR9XG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLyogZ2xvYmFsICQgalF1ZXJ5IENQTyBDb2RlTWlycm9yIHN0b3JhZ2VBUEkgUSBjcmVhdGVQcm9ncmFtQ29sbGVjdGlvbkFQSSBtYWtlU2hhcmVBUEkgKi9cblxudmFyIG9yaWdpbmFsUGFnZUxvYWQgPSBEYXRlLm5vdygpO1xuY29uc29sZS5sb2coXCJvcmlnaW5hbFBhZ2VMb2FkOiBcIiwgb3JpZ2luYWxQYWdlTG9hZCk7XG5cbi8vIFRyYW5zcGFyZW50bHkgcm91dGUgYnJvd3NlciBmZXRjaGVzIHRvIGFsbG93bGlzdGVkIGhvc3RzIHRocm91Z2ggdGhlXG4vLyBzZXJ2ZXItc2lkZSBwcm94eSBhdCAvbG9hZC1zaGFyZXVybCwgYnV0IG9ubHkgd2hlbiB0aGUgZGlyZWN0IHBhdGggZG9lc24ndFxuLy8gd29yay5cbi8vXG4vLyBTdHJhdGVneTogdGhlIEZJUlNUIGZldGNoIHRvIGFuIGFsbG93bGlzdGVkIGhvc3QgZmlyZXMgZGlyZWN0ICsgcHJveGllZCBpblxuLy8gcGFyYWxsZWwuIFdlIGRlY2lkZSBzaG91bGRQcm94eSBmb3IgdGhlIHJlc3Qgb2YgdGhlIHBhZ2UtbG9hZCBmcm9tIGRpcmVjdCdzXG4vLyByZXNwb25zZSAqaGVhZGVycyo6XG4vLyAgIC0gZGlyZWN0IHJldHVybmVkIDJ4eCB3aXRoIGNvbnRlbnQtdHlwZSB0ZXh0L3BsYWluICAtPiBzaG91bGRQcm94eT1mYWxzZTpcbi8vICAgICBzZXJ2ZSBkaXJlY3QncyByZXNwb25zZSwgYWJvcnQgdGhlIGluLWZsaWdodCBwcm94eSBmZXRjaC5cbi8vICAgLSBkaXJlY3QgZmFpbGVkLCBodW5nIHBhc3QgdGltZW91dCwgb3IgcmV0dXJuZWQgYW55dGhpbmcgZWxzZVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0+IHNob3VsZFByb3h5PXRydWU6XG4vLyAgICAgc2VydmUgcHJveHkncyByZXNwb25zZS5cbi8vIEEga2V5IGlkZWEgaXMgdGhhdCBuZXR3b3JrLWJsb2NreSB0aGluZ3Mgc29tZXRpbWVzIHJldHVybiAyMDAgd2l0aCBhXG4vLyBtZXNzYWdlIHBhZ2UgYWJvdXQgYmxvY2tpbmcgKG9yIGFuIGVycm9yLCBidXQgdGhhdCBjb3VudHMgYXMgYSBmYWlsKS4gV2Vcbi8vIGRvbid0IHdhbnQgdG8gYWNjaWRlbnRhbGx5IHRoaW5rIHRoYXQncyBhIHN1Y2Nlc3MuXG4vLyBzaG91bGRQcm94eSBzdGF0ZSBpcyBpbi1tZW1vcnkgYW5kIHBlci1ob3N0IOKAlCBuZXZlciBwZXJzaXN0ZWQsIHNpbmNlXG4vLyByZWFjaGFiaWxpdHkgY2hhbmdlcyBiZXR3ZWVuIG5ldHdvcmtzIGFuZCBhIHN0YWxlIHZhbHVlIHdvdWxkIHNpbGVudGx5XG4vLyBicmVhayBsb2Fkcy5cbi8vXG4vLyBJbnN0YWxsZWQgb24gdGhlIGdsb2JhbCBmZXRjaCBhcyBlYXJseSBhcyBwb3NzaWJsZSBzbyBpdCBjYXRjaGVzIGV2ZXJ5IGZldGNoXG4vLyBjYWxsZXI7IHNvbWUgb2YgdGhlbSBhcmUgaW4gdGhlIHB5cmV0LWxhbmcgcnVudGltZSBhbmQgd291bGQgYmUgb3RoZXJ3aXNlXG4vLyBkaWZmaWN1bHQgdG8gY29uZmlndXJlLlxuY29uc3QgU0hBUkVVUkxfUFJPWFlfSE9TVFMgPSBuZXcgU2V0KFsncmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSddKTtcbmNvbnN0IFNIQVJFVVJMX0RJUkVDVF9USU1FT1VUX01TID0gNTAwMDtcbmNvbnN0IF9vcmlnRmV0Y2ggPSB3aW5kb3cuZmV0Y2guYmluZCh3aW5kb3cpO1xuXG5jb25zdCBfc2hhcmV1cmxTaG91bGRQcm94eSA9IG5ldyBNYXAoKTsgICAgICAgICAgLy8gaG9zdCAtPiBib29sZWFuXG5jb25zdCBfc2hhcmV1cmxTaG91bGRQcm94eUluZmxpZ2h0ID0gbmV3IE1hcCgpOyAgLy8gaG9zdCAtPiBQcm9taXNlPGJvb2xlYW4+XG5cbmZ1bmN0aW9uIF9zaGFyZXVybFByb3h5VXJsKGZldGNoSW5wdXQpIHtcbiAgcmV0dXJuICcvbG9hZC1zaGFyZXVybD91cmw9JyArIGVuY29kZVVSSUNvbXBvbmVudChfc2hhcmV1cmxJbnB1dFRvVXJsKGZldGNoSW5wdXQpKTtcbn1cblxuZnVuY3Rpb24gX3NoYXJldXJsSW5wdXRUb1VybChmZXRjaElucHV0KSB7XG4gIHJldHVybiAodHlwZW9mIGZldGNoSW5wdXQgPT09ICdzdHJpbmcnKSA/IGZldGNoSW5wdXRcbiAgICAgICAgIDogKHR5cGVvZiBSZXF1ZXN0ICE9PSAndW5kZWZpbmVkJyAmJiBmZXRjaElucHV0IGluc3RhbmNlb2YgUmVxdWVzdCkgPyBmZXRjaElucHV0LnVybFxuICAgICAgICAgOiBTdHJpbmcoZmV0Y2hJbnB1dCk7XG59XG5cbmZ1bmN0aW9uIF9zaGFyZXVybFZlcmlmeURpcmVjdChyKSB7XG4gIGlmICghci5vaykgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBjdCA9IChyLmhlYWRlcnMuZ2V0KCdjb250ZW50LXR5cGUnKSB8fCAnJykudG9Mb3dlckNhc2UoKTtcbiAgLy8gU291cmNlIGZpbGVzIHNlcnZlZCBmcm9tIHJhdy5naXRodWJ1c2VyY29udGVudC5jb20gY29tZSBiYWNrIGFzXG4gIC8vIHRleHQvcGxhaW4gKC5hcnIsIC5qc29uLCAuY3N2LCAubWQgYWxsIGRvKS4gQW55dGhpbmcgZWxzZSDigJQgSFRNTCBibG9ja1xuICAvLyBwYWdlcywgY2FwdGl2ZSBwb3J0YWxzLCBzdXJwcmlzZSBjb250ZW50IHR5cGVzIOKAlCB3ZSBkb24ndCB0cnVzdCBhcyBhXG4gIC8vIHJlYWwgdXBzdHJlYW0gcmVzcG9uc2UuXG4gIHJldHVybiBjdC5zdGFydHNXaXRoKCd0ZXh0L3BsYWluJyk7XG59XG5cbmZ1bmN0aW9uIF9zaGFyZXVybEZldGNoKHNob3VsZFByb3h5LCBmZXRjaElucHV0LCBmZXRjaEluaXQpIHtcbiAgY29uc3QgbWF5YmVQcm94eUlucHV0ID0gc2hvdWxkUHJveHkgPyBfc2hhcmV1cmxQcm94eVVybChmZXRjaElucHV0KSA6IGZldGNoSW5wdXQ7XG4gIHJldHVybiBfb3JpZ0ZldGNoKG1heWJlUHJveHlJbnB1dCwgZmV0Y2hJbml0KTtcbn1cblxuZnVuY3Rpb24gX3NoYXJldXJsUmFjZShmZXRjaElucHV0LCBmZXRjaEluaXQpIHtcbiAgY29uc3QgcHJveHlDdHJsID0gbmV3IEFib3J0Q29udHJvbGxlcigpO1xuICAvLyBOT1RFKGpvZSk6IFRoZSBzaWduYWwgb3ZlcndyaXRlIGlzIHRlY2huaWNhbGx5IG5vdCB0aGUgcmlnaHQgZmV0Y2goKVxuICAvLyBwb2x5ZmlsbC4gSWYgdGhlIGNhbGxlciBlbHNld2hlcmUgaW4gdGhlIGNvZGViYXNlIHByb3ZpZGVkIGEgZGlmZmVyZW50XG4gIC8vIHNpZ25hbCAod2hpY2ggaW4gdGhlIGZldGNoIEFQSSBpcyBvbmx5IGZvciBhYm9ydGluZyBhcyBvZiBBcHJpbCAnMjYpLCB0aGF0XG4gIC8vIGNhbGxlciBhYm9ydGluZyB0aHJvdWdoIHRoYXQgc2lnbmFsIHdvbid0IGNhbmNlbCB0aGUgcHJveHkgZmV0Y2guXG4gIC8vIEknbSBPSyBsZXR0aW5nIHRoYXQgY2FzZSBzbGlwIHRocm91Z2ggaGVyZSBpbiBleGNoYW5nZSBmb3Igbm90IGhhdmluZyBhXG4gIC8vIGJ1bmNoIG9mIGV4dHJhIGV2ZW50IGhhbmRsZXIgZm9yd2FyZGluZ1xuICBjb25zdCBwcm94eVAgPSBfb3JpZ0ZldGNoKF9zaGFyZXVybFByb3h5VXJsKGZldGNoSW5wdXQpLFxuICAgIE9iamVjdC5hc3NpZ24oe30sIGZldGNoSW5pdCwgeyBzaWduYWw6IHByb3h5Q3RybC5zaWduYWwgfSkpO1xuICBjb25zdCBkaXJlY3RQID0gX29yaWdGZXRjaChmZXRjaElucHV0LCBmZXRjaEluaXQpLnRoZW4ociA9PiB7XG4gICAgaWYgKCFfc2hhcmV1cmxWZXJpZnlEaXJlY3QocikpIHRocm93IG5ldyBFcnJvcignZGlyZWN0IHJlcXVlc3QgZmFpbGVkJyk7XG4gICAgcmV0dXJuIHI7XG4gIH0pO1xuXG4gIC8vIHNob3VsZFByb3h5OiBmYWxzZSBpZmYgZGlyZWN0IHZlcmlmaWVkIGJlZm9yZSB0aGUgdGltZW91dCwgZWxzZSB0cnVlLlxuICAvLyBXaGV0aGVyIHRvIHByb3h5IGlzIGRlY2lkZWQgc29sZWx5IG9uIHdoZXRoZXIgZGlyZWN0IHN1Y2NlZWRzIG9yIG5vdFxuICBjb25zdCBzaG91bGRQcm94eVByb21pc2UgPSBQcm9taXNlLnJhY2UoW1xuICAgIGRpcmVjdFAudGhlbigoKSA9PiBmYWxzZSwgKCkgPT4gdHJ1ZSksXG4gICAgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUodHJ1ZSksIFNIQVJFVVJMX0RJUkVDVF9USU1FT1VUX01TKSksXG4gIF0pO1xuXG4gIC8vIFNldHRsZW1lbnQtb3JkZXIgY2hlY2s6IGlmIGRpcmVjdCB2ZXJpZmllcyBiZWZvcmUgcHJveHkgcmV0dXJucywgYWJvcnRcbiAgLy8gdGhlIGluLWZsaWdodCBwcm94eSB0byBzdG9wIHdhc3Rpbmcgc2VydmVyIGJhbmR3aWR0aC4gV2UgbXVzdCBOT1RcbiAgLy8gYWJvcnQgb25jZSBwcm94eSBoYXMgYWxyZWFkeSByZXR1cm5lZCwgc2luY2UgYnkgdGhlbiB0aGUgY2FsbGVyIGlzXG4gIC8vIHJlYWRpbmcgcHJveHkncyBib2R5IGFuZCBhYm9ydGluZyB3b3VsZCBlcnJvciBpdHMgc3RyZWFtIG1pZC1yZWFkLlxuICBjb25zdCBkaXJlY3RGaW5pc2hlZFN1Y2Nlc3NmdWxseUFuZEZpcnN0UCA9IFByb21pc2UucmFjZShbXG4gICAgZGlyZWN0UC50aGVuKCgpID0+IHRydWUsICgpID0+IGZhbHNlKSxcbiAgICBwcm94eVAudGhlbigoKSA9PiBmYWxzZSwgKCkgPT4gZmFsc2UpLFxuICBdKTtcbiAgZGlyZWN0RmluaXNoZWRTdWNjZXNzZnVsbHlBbmRGaXJzdFAudGhlbihkaXJlY3RGaXJzdCA9PiB7XG4gICAgaWYgKGRpcmVjdEZpcnN0KSBwcm94eUN0cmwuYWJvcnQoKTtcbiAgfSk7XG5cbiAgLy8gQ2FsbGVyJ3MgcmVzcG9uc2U6IHdoaWNoZXZlciBvZiBkaXJlY3QtdmVyaWZpZWQgb3IgcHJveHktT0sgZnVsZmlsbHNcbiAgLy8gZmlyc3QuIEEgbm9uLW9rIHByb3h5IHJlc3BvbnNlIG11c3QgTk9UIHdpbiB3aGlsZSBkaXJlY3QgaXMgc3RpbGxcbiAgLy8gcGVuZGluZzogZmV0Y2ggZnVsZmlsbHMgb24gSFRUUCBlcnJvcnMsIGFuZCBvbiBob3N0cyB3aXRoIG5vIHByb3h5XG4gIC8vIGVuZHBvaW50IGF0IGFsbCAoc3RhdGljIHNlcnZpbmc6IHRoZSB2c2NvZGUgd2VidmlldywgZW1iZWQtc3RhdGljKSB0aGVcbiAgLy8gbG9jYWwgNDA0IGFycml2ZXMgbG9uZyBiZWZvcmUgdGhlIHJlYWwgY3Jvc3Mtb3JpZ2luIHJlc3BvbnNlLCB3aGljaFxuICAvLyB3b3VsZCBoYW5kIHRoZSBjYWxsZXIgYSBib2d1cyA0MDQuIElmIEJPVEggZmFpbCwgc3VyZmFjZSBwcm94eSdzXG4gIC8vIHJlc3BvbnNlL2Vycm9yICh0aGUgbW9yZSBhdXRob3JpdGF0aXZlIHVwc3RyZWFtIOKAlCBkaXJlY3QncyBtYXkganVzdCBiZVxuICAvLyAnZGlyZWN0LW5vdC12ZXJpZmllZCcpLlxuICBjb25zdCByZXNwb25zZVByb21pc2UgPSBQcm9taXNlLmFueShbXG4gICAgZGlyZWN0UCxcbiAgICBwcm94eVAudGhlbihyID0+IHtcbiAgICAgIGlmICghci5vaykgeyBjb25zdCBlID0gbmV3IEVycm9yKCdwcm94eSByZXNwb25zZSBub3Qgb2snKTsgZS5fc2hhcmV1cmxSZXNwb25zZSA9IHI7IHRocm93IGU7IH1cbiAgICAgIHJldHVybiByO1xuICAgIH0pLFxuICBdKS5jYXRjaChhZ2dFcnIgPT4ge1xuICAgIGNvbnN0IHByb3h5RXJyID0gYWdnRXJyLmVycm9yc1sxXTtcbiAgICBpZiAocHJveHlFcnIgJiYgcHJveHlFcnIuX3NoYXJldXJsUmVzcG9uc2UpIHJldHVybiBwcm94eUVyci5fc2hhcmV1cmxSZXNwb25zZTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QocHJveHlFcnIgfHwgYWdnRXJyLmVycm9yc1swXSk7XG4gIH0pO1xuXG4gIHJldHVybiB7IHJlc3BvbnNlUHJvbWlzZSwgc2hvdWxkUHJveHlQcm9taXNlIH07XG59XG5cbndpbmRvdy5mZXRjaCA9IGZ1bmN0aW9uKGZldGNoSW5wdXQsIGZldGNoSW5pdCkge1xuICBsZXQgaG9zdDtcbiAgdHJ5IHsgaG9zdCA9IG5ldyBVUkwoX3NoYXJldXJsSW5wdXRUb1VybChmZXRjaElucHV0KSwgd2luZG93LmxvY2F0aW9uLmhyZWYpLmhvc3RuYW1lOyB9XG4gIGNhdGNoIChfKSB7IHJldHVybiBfb3JpZ0ZldGNoKGZldGNoSW5wdXQsIGZldGNoSW5pdCk7IH1cbiAgaWYgKCFTSEFSRVVSTF9QUk9YWV9IT1NUUy5oYXMoaG9zdCkpIHJldHVybiBfb3JpZ0ZldGNoKGZldGNoSW5wdXQsIGZldGNoSW5pdCk7XG5cbiAgY29uc3Qgc2hvdWxkUHJveHkgPSBfc2hhcmV1cmxTaG91bGRQcm94eS5nZXQoaG9zdCk7XG4gIGNvbnN0IGluZmxpZ2h0ID0gX3NoYXJldXJsU2hvdWxkUHJveHlJbmZsaWdodC5nZXQoaG9zdCk7XG4gIGlmIChzaG91bGRQcm94eSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIF9zaGFyZXVybEZldGNoKHNob3VsZFByb3h5LCBmZXRjaElucHV0LCBmZXRjaEluaXQpO1xuICB9IGVsc2UgaWYgKGluZmxpZ2h0KSB7XG4gICAgLy8gc2hvdWxkUHJveHkgcGVuZGluZzogcXVldWUgdGhpcyBmZXRjaCBvbiBpdCBhbmQgaXNzdWUgYSBzaW5nbGUgZnJlc2hcbiAgICAvLyByZXF1ZXN0IG9uY2Ugc2hvdWxkUHJveHkgaXMgZGVjaWRlZC5cbiAgICByZXR1cm4gaW5mbGlnaHQudGhlbihzcCA9PiBfc2hhcmV1cmxGZXRjaChzcCwgZmV0Y2hJbnB1dCwgZmV0Y2hJbml0KSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gRmlyc3QgZmV0Y2ggdG8gdGhpcyBob3N0IHRoaXMgcGFnZS1sb2FkOiBydW4gdGhlIHJhY2UuXG4gICAgY29uc3QgeyByZXNwb25zZVByb21pc2UsIHNob3VsZFByb3h5UHJvbWlzZSB9ID0gX3NoYXJldXJsUmFjZShmZXRjaElucHV0LCBmZXRjaEluaXQpO1xuICAgIF9zaGFyZXVybFNob3VsZFByb3h5SW5mbGlnaHQuc2V0KGhvc3QsIHNob3VsZFByb3h5UHJvbWlzZSk7XG4gICAgc2hvdWxkUHJveHlQcm9taXNlLnRoZW4oc3AgPT4ge1xuICAgICAgX3NoYXJldXJsU2hvdWxkUHJveHkuc2V0KGhvc3QsIHNwKTtcbiAgICAgIF9zaGFyZXVybFNob3VsZFByb3h5SW5mbGlnaHQuZGVsZXRlKGhvc3QpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXNwb25zZVByb21pc2U7XG4gIH1cbn07XG5cbmNvbnN0IGlzRW1iZWRkZWQgPSB3aW5kb3cucGFyZW50ICE9PSB3aW5kb3c7XG5cbnZhciBzaGFyZUFQSSA9IG1ha2VTaGFyZUFQSShwcm9jZXNzLmVudi5DVVJSRU5UX1BZUkVUX1JFTEVBU0UpO1xuXG52YXIgdXJsID0gd2luZG93LnVybCA9IHJlcXVpcmUoJ3VybC5qcycpO1xudmFyIG1vZGFsUHJvbXB0ID0gcmVxdWlyZSgnLi9tb2RhbC1wcm9tcHQuanMnKTtcbndpbmRvdy5tb2RhbFByb21wdCA9IG1vZGFsUHJvbXB0O1xuXG5jb25zdCBMT0cgPSB0cnVlO1xud2luZG93LmN0X2xvZyA9IGZ1bmN0aW9uKC8qIHZhcmFyZ3MgKi8pIHtcbiAgaWYgKHdpbmRvdy5jb25zb2xlICYmIExPRykge1xuICAgIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cyk7XG4gIH1cbn07XG5cbndpbmRvdy5jdF9lcnJvciA9IGZ1bmN0aW9uKC8qIHZhcmFyZ3MgKi8pIHtcbiAgaWYgKHdpbmRvdy5jb25zb2xlICYmIExPRykge1xuICAgIGNvbnNvbGUuZXJyb3IuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKTtcbiAgfVxufTtcbnZhciBpbml0aWFsUGFyYW1zID0gdXJsLnBhcnNlKGRvY3VtZW50LmxvY2F0aW9uLmhyZWYpO1xudmFyIHBhcmFtcyA9IHVybC5wYXJzZShcIi8/XCIgKyBpbml0aWFsUGFyYW1zW1wiaGFzaFwiXSk7XG4vLyBXaG8gb3ducyB0aGlzIGVkaXRvcidzIGluaXRpYWwgY29udGVudHM/IEEgc3RhbmRhbG9uZSBwYWdlIGluc3RhbGxzIGl0cyBvd25cbi8vIChwcm9ncmFtTG9hZGVkIGJlbG93KS4gQW4gZW1iZWRkZWQgaW5zdGFuY2UgKHRoZSBlbWJlZCBBUEkncyBpZnJhbWUsIHRoZVxuLy8gdnNjb2RlIHdlYnZpZXcpIG9yIGEgcGFnZSBib290ZWQgZnJvbSBhbiBpbml0aWFsU3RhdGUgaGFzaCBpcyBob3N0LWZlZDogaXRzXG4vLyByZWFsIGNvbnRlbnRzIGFycml2ZSB2aWEgdGhlIGV2ZW50cy5qcyBgcmVzZXRgIHByb3RvY29sLCBhbmQgYm9vdCBpc24ndFxuLy8gb3ZlciB1bnRpbCB0aGF0IHJlc2V0IGZ1bGx5IHNldHRsZXMgLS0gcmVzZXQoKSBydW5zIGEgd2FybS1zdGFydCBwcm9ncmFtXG4vLyBiZWZvcmUgaW5zdGFsbGluZyBjb250ZW50cywgYW5kIGRyaXZpbmcgdGhlIGVkaXRvciBkdXJpbmcgdGhhdCB3aW5kb3cgcmFjZXNcbi8vIHRoZSBob3N0J3Mgb3duIGhhbmRzaGFrZS4gRURJVE9SX0NPTlRFTlRTX1NFVFRMRUQgaXMgdGhlIHNpbmdsZSBcImluaXRpYWxcbi8vIGNvbnRlbnRzIGFyZSBpbiBhbmQgdGhlIGVkaXRvciBpcyBxdWllc2NlbnRcIiBmYWN0LCBkZWNsYXJlZCBhdCB3aGljaGV2ZXIgb2Zcbi8vIHRob3NlIHR3byBzZXR0bGUgcG9pbnRzIGFwcGxpZXMgKGhlcmUgZm9yIHN0YW5kYWxvbmU7IGV2ZW50cy5qcyByZXNldCgpIGZvclxuLy8gaG9zdC1mZWQpLCBzbyBvYnNlcnZlcnMgZG9uJ3QgaGF2ZSB0byByZS1kZXJpdmUgcGVyLWhvc3QgYm9vdCBiZWhhdmlvci5cbndpbmRvdy5FWFBFQ1RTX0hPU1RfUkVTRVQgPSBpc0VtYmVkZGVkIHx8ICEhcGFyYW1zW1wiZ2V0XCJdW1wiaW5pdGlhbFN0YXRlXCJdO1xud2luZG93LmhpZ2hsaWdodE1vZGUgPSBcIm1jbWhcIjsgLy8gd2hhdCBpcyB0aGlzIGZvcj9cbndpbmRvdy5jbGVhckZsYXNoID0gZnVuY3Rpb24oKSB7XG4gICQoXCIubm90aWZpY2F0aW9uQXJlYVwiKS5lbXB0eSgpO1xufVxud2luZG93LndoaXRlVG9CbGFja05vdGlmaWNhdGlvbiA9IGZ1bmN0aW9uKCkge1xuICAvKlxuICAkKFwiLm5vdGlmaWNhdGlvbkFyZWEgLmFjdGl2ZVwiKS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIFwid2hpdGVcIik7XG4gICQoXCIubm90aWZpY2F0aW9uQXJlYSAuYWN0aXZlXCIpLmFuaW1hdGUoe2JhY2tncm91bmRDb2xvcjogXCIjMTExMTExXCIgfSwgMTAwMCk7XG4gICovXG59O1xud2luZG93LnN0aWNrRXJyb3IgPSBmdW5jdGlvbihtZXNzYWdlLCBtb3JlKSB7XG4gIENQTy5zYXlBbmRGb3JnZXQobWVzc2FnZSk7XG4gIGNsZWFyRmxhc2goKTtcbiAgdmFyIGVyciA9ICQoXCI8c3Bhbj5cIikuYWRkQ2xhc3MoXCJlcnJvclwiKS50ZXh0KG1lc3NhZ2UpO1xuICBpZihtb3JlKSB7XG4gICAgZXJyLmF0dHIoXCJ0aXRsZVwiLCBtb3JlKTtcbiAgfVxuICBlcnIudG9vbHRpcCgpO1xuICAkKFwiLm5vdGlmaWNhdGlvbkFyZWFcIikucHJlcGVuZChlcnIpO1xuICB3aGl0ZVRvQmxhY2tOb3RpZmljYXRpb24oKTtcbn07XG53aW5kb3cuZmxhc2hFcnJvciA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgQ1BPLnNheUFuZEZvcmdldChtZXNzYWdlKTtcbiAgY2xlYXJGbGFzaCgpO1xuICB2YXIgZXJyID0gJChcIjxzcGFuPlwiKS5hZGRDbGFzcyhcImVycm9yXCIpLnRleHQobWVzc2FnZSk7XG4gICQoXCIubm90aWZpY2F0aW9uQXJlYVwiKS5wcmVwZW5kKGVycik7XG4gIHdoaXRlVG9CbGFja05vdGlmaWNhdGlvbigpO1xuICBlcnIuZmFkZU91dCg3MDAwKTtcbn07XG53aW5kb3cuZmxhc2hNZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICBDUE8uc2F5QW5kRm9yZ2V0KG1lc3NhZ2UpO1xuICBjbGVhckZsYXNoKCk7XG4gIHZhciBtc2cgPSAkKFwiPHNwYW4+XCIpLmFkZENsYXNzKFwiYWN0aXZlXCIpLnRleHQobWVzc2FnZSk7XG4gICQoXCIubm90aWZpY2F0aW9uQXJlYVwiKS5wcmVwZW5kKG1zZyk7XG4gIHdoaXRlVG9CbGFja05vdGlmaWNhdGlvbigpO1xuICBtc2cuZmFkZU91dCg3MDAwKTtcbn07XG53aW5kb3cuc3RpY2tNZXNzYWdlID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICBDUE8uc2F5QW5kRm9yZ2V0KG1lc3NhZ2UpO1xuICBjbGVhckZsYXNoKCk7XG4gIHZhciBtc2cgPSAkKFwiPHNwYW4+XCIpLmFkZENsYXNzKFwiYWN0aXZlXCIpLnRleHQobWVzc2FnZSk7XG4gICQoXCIubm90aWZpY2F0aW9uQXJlYVwiKS5wcmVwZW5kKG1zZyk7XG4gIHdoaXRlVG9CbGFja05vdGlmaWNhdGlvbigpO1xufTtcbndpbmRvdy5zdGlja1JpY2hNZXNzYWdlID0gZnVuY3Rpb24oY29udGVudCkge1xuICBDUE8uc2F5QW5kRm9yZ2V0KGNvbnRlbnQudGV4dCgpKTtcbiAgY2xlYXJGbGFzaCgpO1xuICAkKFwiLm5vdGlmaWNhdGlvbkFyZWFcIikucHJlcGVuZCgkKFwiPHNwYW4+XCIpLmFkZENsYXNzKFwiYWN0aXZlXCIpLmFwcGVuZChjb250ZW50KSk7XG4gIHdoaXRlVG9CbGFja05vdGlmaWNhdGlvbigpO1xufTtcbndpbmRvdy5ta1dhcm5pbmdVcHBlciA9IGZ1bmN0aW9uKCl7cmV0dXJuICQoXCI8ZGl2IGNsYXNzPSd3YXJuaW5nLXVwcGVyJz5cIik7fVxud2luZG93Lm1rV2FybmluZ0xvd2VyID0gZnVuY3Rpb24oKXtyZXR1cm4gJChcIjxkaXYgY2xhc3M9J3dhcm5pbmctbG93ZXInPlwiKTt9XG5cbnZhciBEb2N1bWVudHMgPSBmdW5jdGlvbigpIHtcblxuICBmdW5jdGlvbiBEb2N1bWVudHMoKSB7XG4gICAgdGhpcy5kb2N1bWVudHMgPSBuZXcgTWFwKCk7XG4gIH1cblxuICBEb2N1bWVudHMucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuZG9jdW1lbnRzLmhhcyhuYW1lKTtcbiAgfTtcblxuICBEb2N1bWVudHMucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMuZG9jdW1lbnRzLmdldChuYW1lKTtcbiAgfTtcblxuICBEb2N1bWVudHMucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChuYW1lLCBkb2MpIHtcbiAgICBpZihsb2dnZXIuaXNEZXRhaWxlZClcbiAgICAgIGxvZ2dlci5sb2coXCJkb2Muc2V0XCIsIHtuYW1lOiBuYW1lLCB2YWx1ZTogZG9jLmdldFZhbHVlKCl9KTtcbiAgICByZXR1cm4gdGhpcy5kb2N1bWVudHMuc2V0KG5hbWUsIGRvYyk7XG4gIH07XG5cbiAgRG9jdW1lbnRzLnByb3RvdHlwZS5kZWxldGUgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIGlmKGxvZ2dlci5pc0RldGFpbGVkKVxuICAgICAgbG9nZ2VyLmxvZyhcImRvYy5kZWxcIiwge25hbWU6IG5hbWV9KTtcbiAgICByZXR1cm4gdGhpcy5kb2N1bWVudHMuZGVsZXRlKG5hbWUpO1xuICB9O1xuXG4gIERvY3VtZW50cy5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChmKSB7XG4gICAgcmV0dXJuIHRoaXMuZG9jdW1lbnRzLmZvckVhY2goZik7XG4gIH07XG5cbiAgcmV0dXJuIERvY3VtZW50cztcbn0oKTtcblxudmFyIFZFUlNJT05fQ0hFQ0tfSU5URVJWQUwgPSAxMjAwMDAgKyAoMzAwMDAgKiBNYXRoLnJhbmRvbSgpKTtcblxuZnVuY3Rpb24gY2hlY2tWZXJzaW9uKCkge1xuICAkLmdldChcIi9jdXJyZW50LXZlcnNpb25cIikudGhlbihmdW5jdGlvbihyZXNwKSB7XG4gICAgcmVzcCA9IEpTT04ucGFyc2UocmVzcCk7XG4gICAgaWYocmVzcC52ZXJzaW9uICYmIHJlc3AudmVyc2lvbiAhPT0gcHJvY2Vzcy5lbnYuQ1VSUkVOVF9QWVJFVF9SRUxFQVNFKSB7XG4gICAgICB3aW5kb3cuZmxhc2hNZXNzYWdlKFwiQSBuZXcgdmVyc2lvbiBvZiBQeXJldCBpcyBhdmFpbGFibGUuIFNhdmUgYW5kIHJlbG9hZCB0aGUgcGFnZSB0byBnZXQgdGhlIG5ld2VzdCB2ZXJzaW9uLlwiKTtcbiAgICB9XG4gIH0pO1xufVxuaWYoIWlzRW1iZWRkZWQpIHtcbiAgd2luZG93LnNldEludGVydmFsKGNoZWNrVmVyc2lvbiwgVkVSU0lPTl9DSEVDS19JTlRFUlZBTCk7XG59XG5cbndpbmRvdy5DUE8gPSB7XG4gIHNhdmU6IGZ1bmN0aW9uKCkge30sXG4gIGF1dG9TYXZlOiBmdW5jdGlvbigpIHt9LFxuICBkb2N1bWVudHMgOiBuZXcgRG9jdW1lbnRzKClcbn07XG4kKGZ1bmN0aW9uKCkge1xuICBjb25zdCBDT05URVhUX0ZPUl9ORVdfRklMRVMgPSBcInVzZSBjb250ZXh0IHN0YXJ0ZXIyMDI0XFxuXCI7XG4gIGNvbnN0IENPTlRFWFRfUFJFRklYID0gL151c2UgY29udGV4dFxccysvO1xuXG4gIGZ1bmN0aW9uIG1lcmdlKG9iaiwgZXh0ZW5zaW9uKSB7XG4gICAgdmFyIG5ld29iaiA9IHt9O1xuICAgIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgICBuZXdvYmpba10gPSBvYmpba107XG4gICAgfSk7XG4gICAgT2JqZWN0LmtleXMoZXh0ZW5zaW9uKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICAgIG5ld29ialtrXSA9IGV4dGVuc2lvbltrXTtcbiAgICB9KTtcbiAgICByZXR1cm4gbmV3b2JqO1xuICB9XG4gIHZhciBhbmltYXRpb25EaXYgPSBudWxsO1xuICBmdW5jdGlvbiBjbG9zZUFuaW1hdGlvbklmT3BlbigpIHtcbiAgICBpZihhbmltYXRpb25EaXYpIHtcbiAgICAgIGFuaW1hdGlvbkRpdi5lbXB0eSgpO1xuICAgICAgYW5pbWF0aW9uRGl2LmRpYWxvZyhcImRlc3Ryb3lcIik7XG4gICAgICBhbmltYXRpb25EaXYgPSBudWxsO1xuICAgIH1cbiAgfVxuICBsZXQgYWN0aXZlRWRpdG9yID0gbnVsbDtcbiAgQ1BPLm1ha2VFZGl0b3IgPSBmdW5jdGlvbihjb250YWluZXIsIG9wdGlvbnMpIHtcbiAgICB2YXIgaW5pdGlhbCA9IFwiXCI7XG4gICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoXCJpbml0aWFsXCIpKSB7XG4gICAgICBpbml0aWFsID0gb3B0aW9ucy5pbml0aWFsO1xuICAgIH1cblxuICAgIHZhciB0ZXh0YXJlYSA9IGpRdWVyeShcIjx0ZXh0YXJlYSBhcmlhLWhpZGRlbj0ndHJ1ZSc+XCIpO1xuICAgIHRleHRhcmVhLnZhbChpbml0aWFsKTtcbiAgICBjb250YWluZXIuYXBwZW5kKHRleHRhcmVhKTtcblxuICAgIHZhciBydW5GdW4gPSBmdW5jdGlvbiAoY29kZSwgcmVwbE9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMucnVuKGNvZGUsIHtjbTogQ019LCByZXBsT3B0aW9ucyk7XG4gICAgfTtcblxuICAgIHZhciB1c2VMaW5lTnVtYmVycyA9ICFvcHRpb25zLnNpbXBsZUVkaXRvcjtcbiAgICB2YXIgdXNlRm9sZGluZyA9ICFvcHRpb25zLnNpbXBsZUVkaXRvcjtcblxuICAgIHZhciBndXR0ZXJzID0gIW9wdGlvbnMuc2ltcGxlRWRpdG9yID9cbiAgICAgIFtcImhlbHAtZ3V0dGVyXCIsIFwiQ29kZU1pcnJvci1saW5lbnVtYmVyc1wiLCBcIkNvZGVNaXJyb3ItZm9sZGd1dHRlclwiXSA6XG4gICAgICBbXTtcblxuICAgIGZ1bmN0aW9uIHJlaW5kZW50QWxsTGluZXMoY20pIHtcbiAgICAgIHZhciBsYXN0ID0gY20ubGluZUNvdW50KCk7XG4gICAgICBjbS5vcGVyYXRpb24oZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGFzdDsgKytpKSBjbS5pbmRlbnRMaW5lKGkpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIENPREVfTElORV9XSURUSCA9IDEwMDtcblxuICAgIHZhciBydWxlcnMsIHJ1bGVyc01pbkNvbDtcblxuICAgIC8vIHBsYWNlIGEgdmVydGljYWwgbGluZSBpbiBjb2RlIGVkaXRvciwgYW5kIG5vdCByZXBsXG4gICAgaWYgKG9wdGlvbnMuc2ltcGxlRWRpdG9yKSB7XG4gICAgICBydWxlcnMgPSBbXTtcbiAgICB9IGVsc2V7XG4gICAgICBydWxlcnMgPSBbe2NvbG9yOiBcIiMzMTdCQ0ZcIiwgY29sdW1uOiBDT0RFX0xJTkVfV0lEVEgsIGxpbmVTdHlsZTogXCJkYXNoZWRcIiwgY2xhc3NOYW1lOiBcImhpZGRlblwifV07XG4gICAgICBydWxlcnNNaW5Db2wgPSBDT0RFX0xJTkVfV0lEVEg7XG4gICAgfVxuXG4gICAgY29uc3QgbWFjID0gQ29kZU1pcnJvci5rZXlNYXAuZGVmYXVsdCA9PT0gQ29kZU1pcnJvci5rZXlNYXAubWFjRGVmYXVsdDtcbiAgICBjb25zb2xlLmxvZyhcIlVzaW5nIGtleW1hcDogXCIsIENvZGVNaXJyb3Iua2V5TWFwLmRlZmF1bHQsIFwibWFjRGVmYXVsdDogXCIsIENvZGVNaXJyb3Iua2V5TWFwLm1hY0RlZmF1bHQsIFwibWFjOiBcIiwgbWFjKTtcbiAgICBjb25zdCBtb2RpZmllciA9IG1hYyA/IFwiQ21kXCIgOiBcIkN0cmxcIjtcblxuICAgIGNvbnN0IGV4dHJhS2V5cyA9IHtcbiAgICAgICAgXCJTaGlmdC1FbnRlclwiOiBmdW5jdGlvbihjbSkgeyBydW5GdW4oY20uZ2V0VmFsdWUoKSk7IH0sXG4gICAgICAgIFwiU2hpZnQtQ3RybC1FbnRlclwiOiBmdW5jdGlvbihjbSkgeyBydW5GdW4oY20uZ2V0VmFsdWUoKSk7IH0sXG4gICAgICAgIFwiVGFiXCI6IFwiaW5kZW50QXV0b1wiLFxuICAgICAgICBcIkN0cmwtSVwiOiByZWluZGVudEFsbExpbmVzLFxuICAgICAgICBcIkVzYyBMZWZ0XCI6IFwiZ29CYWNrd2FyZFNleHBcIixcbiAgICAgICAgXCJBbHQtTGVmdFwiOiBcImdvQmFja3dhcmRTZXhwXCIsXG4gICAgICAgIFwiRXNjIFJpZ2h0XCI6IFwiZ29Gb3J3YXJkU2V4cFwiLFxuICAgICAgICBcIkFsdC1SaWdodFwiOiBcImdvRm9yd2FyZFNleHBcIixcbiAgICAgICAgXCJDdHJsLUxlZnRcIjogXCJnb0JhY2t3YXJkVG9rZW5cIixcbiAgICAgICAgXCJDdHJsLVJpZ2h0XCI6IFwiZ29Gb3J3YXJkVG9rZW5cIixcbiAgICAgICAgW2Ake21vZGlmaWVyfS1GYF06IFwiZmluZFBlcnNpc3RlbnRcIixcbiAgICAgICAgW2Ake21vZGlmaWVyfS0vYF06IFwidG9nZ2xlQ29tbWVudFwiLFxuICAgICAgfTtcbiAgICBpZih3aW5kb3cuUFlSRVRfSU5fVlNDT0RFKSB7XG4gICAgICAvLyBEaXNhYmxlIHVuZG8gYW5kIHJlZG8gaW4gdnNjb2RlLCBzaW5jZSB0aGV5IG1lc3Mgd2l0aCB0aGUgaG9zdCBlZGl0b3IncyB1bmRvL3JlZG8gc3RhY2tcbiAgICAgIC8vIE9kZGx5LCBpdCBkb2Vzbid0IHNlZW0gdG8gd29yayB0byBhZGQgdGhlc2UgdG8gZXh0cmFLZXlzOyBJIGhhdmUgdG9cbiAgICAgIC8vIG92ZXJyaWRlIHRoZW0gaW4gdGhlIGRlZmF1bHQga2V5bWFwXG4gICAgICBDb2RlTWlycm9yLmtleU1hcC5kZWZhdWx0W2Ake21vZGlmaWVyfS1aYF0gPSBmYWxzZTtcbiAgICAgIENvZGVNaXJyb3Iua2V5TWFwLmRlZmF1bHRbYFNoaWZ0LSR7bW9kaWZpZXJ9LVpgXSA9IGZhbHNlO1xuICAgICAgQ29kZU1pcnJvci5rZXlNYXAuZGVmYXVsdFtgJHttb2RpZmllcn0tWWBdID0gZmFsc2U7XG4gICAgICAvLyBDdHJsLVUgaXMgVW5kbyB3aXRoaW4gYSByYW5nZVxuICAgICAgQ29kZU1pcnJvci5rZXlNYXAuZGVmYXVsdFtgJHttb2RpZmllcn0tVWBdID0gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIGNtT3B0aW9ucyA9IHtcbiAgICAgIGtleU1hcDogJ2RlZmF1bHQnLFxuICAgICAgZXh0cmFLZXlzOiBDb2RlTWlycm9yLm5vcm1hbGl6ZUtleU1hcChleHRyYUtleXMpLFxuICAgICAgaW5kZW50VW5pdDogMixcbiAgICAgIHRhYlNpemU6IDIsXG4gICAgICB2aWV3cG9ydE1hcmdpbjogSW5maW5pdHksXG4gICAgICBsaW5lTnVtYmVyczogdXNlTGluZU51bWJlcnMsXG4gICAgICBtYXRjaEtleXdvcmRzOiB0cnVlLFxuICAgICAgbWF0Y2hCcmFja2V0czogdHJ1ZSxcbiAgICAgIHN0eWxlU2VsZWN0ZWRUZXh0OiB0cnVlLFxuICAgICAgZm9sZEd1dHRlcjogdXNlRm9sZGluZyxcbiAgICAgIGd1dHRlcnM6IGd1dHRlcnMsXG4gICAgICBsaW5lV3JhcHBpbmc6IHRydWUsXG4gICAgICBsb2dnaW5nOiB0cnVlLFxuICAgICAgcnVsZXJzOiBydWxlcnMsXG4gICAgICBydWxlcnNNaW5Db2w6IHJ1bGVyc01pbkNvbCxcbiAgICAgIHNjcm9sbFBhc3RFbmQ6IHRydWUsXG4gICAgfTtcblxuICAgIGNtT3B0aW9ucyA9IG1lcmdlKGNtT3B0aW9ucywgb3B0aW9ucy5jbU9wdGlvbnMgfHwge30pO1xuXG4gICAgdmFyIENNID0gQ29kZU1pcnJvci5mcm9tVGV4dEFyZWEodGV4dGFyZWFbMF0sIGNtT3B0aW9ucyk7XG4gICAgQ00ub24oXCJmb2N1c1wiLCAoKSA9PiB7XG4gICAgICBhY3RpdmVFZGl0b3IgPSBDTTtcbiAgICB9KTtcblxuICAgIGZ1bmN0aW9uIGZpcnN0TGluZUlzTmFtZXNwYWNlKCkge1xuICAgICAgY29uc3QgZmlyc3RsaW5lID0gQ00uZ2V0TGluZSgwKTtcbiAgICAgIGNvbnN0IG1hdGNoID0gZmlyc3RsaW5lLm1hdGNoKENPTlRFWFRfUFJFRklYKTtcbiAgICAgIHJldHVybiBtYXRjaCAhPT0gbnVsbDtcbiAgICB9XG5cbiAgICBsZXQgbmFtZXNwYWNlbWFyayA9IG51bGw7XG4gICAgZnVuY3Rpb24gc2V0Q29udGV4dExpbmUobmV3Q29udGV4dExpbmUpIHtcbiAgICAgIHZhciBoYXNOYW1lc3BhY2UgPSBmaXJzdExpbmVJc05hbWVzcGFjZSgpO1xuICAgICAgaWYoIWhhc05hbWVzcGFjZSAmJiBuYW1lc3BhY2VtYXJrICE9PSBudWxsKSB7XG4gICAgICAgIG5hbWVzcGFjZW1hcmsuY2xlYXIoKTtcbiAgICAgIH1cbiAgICAgIGlmKCFoYXNOYW1lc3BhY2UpIHtcbiAgICAgICAgQ00ucmVwbGFjZVJhbmdlKG5ld0NvbnRleHRMaW5lLCB7IGxpbmU6MCwgY2g6IDB9LCB7bGluZTogMCwgY2g6IDB9KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBDTS5yZXBsYWNlUmFuZ2UobmV3Q29udGV4dExpbmUsIHsgbGluZTowLCBjaDogMH0sIHtsaW5lOiAxLCBjaDogMH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmKCFvcHRpb25zLnNpbXBsZUVkaXRvcikge1xuXG4gICAgICBjb25zdCBndXR0ZXJRdWVzdGlvbldyYXBwZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgZ3V0dGVyUXVlc3Rpb25XcmFwcGVyLmNsYXNzTmFtZSA9IFwiZ3V0dGVyLXF1ZXN0aW9uLXdyYXBwZXJcIjtcbiAgICAgIGNvbnN0IGd1dHRlclRvb2x0aXAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKTtcbiAgICAgIGd1dHRlclRvb2x0aXAuY2xhc3NOYW1lID0gXCJndXR0ZXItcXVlc3Rpb24tdG9vbHRpcFwiO1xuICAgICAgZ3V0dGVyVG9vbHRpcC5pbm5lclRleHQgPSBcIlRoZSB1c2UgY29udGV4dCBsaW5lIHRlbGxzIFB5cmV0IHRvIGxvYWQgdG9vbHMgZm9yIGEgc3BlY2lmaWMgY2xhc3MgY29udGV4dC4gSXQgY2FuIGJlIGNoYW5nZWQgdGhyb3VnaCB0aGUgbWFpbiBQeXJldCBtZW51LiBNb3N0IG9mIHRoZSB0aW1lIHlvdSB3b24ndCBuZWVkIHRvIGNoYW5nZSB0aGlzIGF0IGFsbC5cIjtcbiAgICAgIGNvbnN0IGd1dHRlclF1ZXN0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImltZ1wiKTtcbiAgICAgIGd1dHRlclF1ZXN0aW9uLnNyYyA9IHdpbmRvdy5BUFBfQkFTRV9VUkwgKyBcIi9pbWcvcXVlc3Rpb24ucG5nXCI7XG4gICAgICBndXR0ZXJRdWVzdGlvbi5jbGFzc05hbWUgPSBcImd1dHRlci1xdWVzdGlvblwiO1xuICAgICAgZ3V0dGVyUXVlc3Rpb25XcmFwcGVyLmFwcGVuZENoaWxkKGd1dHRlclF1ZXN0aW9uKTtcbiAgICAgIGd1dHRlclF1ZXN0aW9uV3JhcHBlci5hcHBlbmRDaGlsZChndXR0ZXJUb29sdGlwKTtcbiAgICAgIENNLnNldEd1dHRlck1hcmtlcigwLCBcImhlbHAtZ3V0dGVyXCIsIGd1dHRlclF1ZXN0aW9uV3JhcHBlcik7XG5cbiAgICAgIENNLmdldFdyYXBwZXJFbGVtZW50KCkub25tb3VzZWxlYXZlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBDTS5jbGVhckd1dHRlcihcImhlbHAtZ3V0dGVyXCIpO1xuICAgICAgfVxuXG4gICAgICAvLyBOT1RFKGpvZSk6IFRoaXMgc2VlbXMgdG8gYmUgdGhlIGJlc3Qgd2F5IHRvIGdldCBhIGhvdmVyIG9uIGEgbWFyazogaHR0cHM6Ly9naXRodWIuY29tL2NvZGVtaXJyb3IvQ29kZU1pcnJvci9pc3N1ZXMvMzUyOVxuICAgICAgQ00uZ2V0V3JhcHBlckVsZW1lbnQoKS5vbm1vdXNlbW92ZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIGxpbmVDaCA9IENNLmNvb3Jkc0NoYXIoeyBsZWZ0OiBlLmNsaWVudFgsIHRvcDogZS5jbGllbnRZIH0pO1xuICAgICAgICB2YXIgbWFya2VycyA9IENNLmZpbmRNYXJrc0F0KGxpbmVDaCk7XG4gICAgICAgIGlmIChtYXJrZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIENNLmNsZWFyR3V0dGVyKFwiaGVscC1ndXR0ZXJcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxpbmVDaC5saW5lID09PSAwICYmIG1hcmtlcnNbMF0gPT09IG5hbWVzcGFjZW1hcmspIHtcbiAgICAgICAgICBDTS5zZXRHdXR0ZXJNYXJrZXIoMCwgXCJoZWxwLWd1dHRlclwiLCBndXR0ZXJRdWVzdGlvbldyYXBwZXIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIENNLmNsZWFyR3V0dGVyKFwiaGVscC1ndXR0ZXJcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIENNLm9uKFwiY2hhbmdlXCIsIGZ1bmN0aW9uKGNoYW5nZSkge1xuICAgICAgICBmdW5jdGlvbiBkb2VzTm90Q2hhbmdlRmlyc3RMaW5lKGMpIHsgcmV0dXJuIGMuZnJvbS5saW5lICE9PSAwOyB9XG4gICAgICAgIGlmKGNoYW5nZS5jdXJPcC5jaGFuZ2VPYmpzICYmIGNoYW5nZS5jdXJPcC5jaGFuZ2VPYmpzLmV2ZXJ5KGRvZXNOb3RDaGFuZ2VGaXJzdExpbmUpKSB7IHJldHVybjsgfVxuICAgICAgICB2YXIgaGFzTmFtZXNwYWNlID0gZmlyc3RMaW5lSXNOYW1lc3BhY2UoKTtcbiAgICAgICAgaWYoaGFzTmFtZXNwYWNlKSB7XG4gICAgICAgICAgaWYobmFtZXNwYWNlbWFyaykgeyBuYW1lc3BhY2VtYXJrLmNsZWFyKCk7IH1cbiAgICAgICAgICBuYW1lc3BhY2VtYXJrID0gQ00ubWFya1RleHQoe2xpbmU6IDAsIGNoOiAwfSwge2xpbmU6IDEsIGNoOiAwfSwgeyBhdHRyaWJ1dGVzOiB7IHVzZWxpbmU6IHRydWUgfSwgY2xhc3NOYW1lOiBcInVzZWxpbmVcIiwgYXRvbWljOiB0cnVlLCBpbmNsdXNpdmVMZWZ0OiB0cnVlLCBpbmNsdXNpdmVSaWdodDogZmFsc2UgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAodXNlTGluZU51bWJlcnMpIHtcbiAgICAgIENNLmRpc3BsYXkud3JhcHBlci5hcHBlbmRDaGlsZChta1dhcm5pbmdVcHBlcigpWzBdKTtcbiAgICAgIENNLmRpc3BsYXkud3JhcHBlci5hcHBlbmRDaGlsZChta1dhcm5pbmdMb3dlcigpWzBdKTtcbiAgICB9XG5cbiAgICBnZXRUb3BUaWVyTWVudWl0ZW1zKCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY206IENNLFxuICAgICAgc2V0Q29udGV4dExpbmU6IHNldENvbnRleHRMaW5lLFxuICAgICAgcmVmcmVzaDogZnVuY3Rpb24oKSB7IENNLnJlZnJlc2goKTsgfSxcbiAgICAgIHJ1bjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJ1bkZ1bihDTS5nZXRWYWx1ZSgpKTtcbiAgICAgIH0sXG4gICAgICBmb2N1czogZnVuY3Rpb24oKSB7IENNLmZvY3VzKCk7IH0sXG4gICAgICBmb2N1c0Nhcm91c2VsOiBudWxsIC8vaW5pdEZvY3VzQ2Fyb3VzZWxcbiAgICB9O1xuICB9O1xuICBDUE8uUlVOX0NPREUgPSBmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZyhcIlJ1bm5pbmcgYmVmb3JlIHJlYWR5XCIsIGFyZ3VtZW50cyk7XG4gIH07XG5cbiAgZnVuY3Rpb24gc2V0VXNlcm5hbWUodGFyZ2V0KSB7XG4gICAgdmFyIHRva2VuID0gd2luZG93LmdhcGkuYXV0aC5nZXRUb2tlbigpLmFjY2Vzc190b2tlbjtcbiAgICByZXR1cm4gZmV0Y2goJ2h0dHBzOi8vb3BlbmlkY29ubmVjdC5nb29nbGVhcGlzLmNvbS92MS91c2VyaW5mbycsIHtcbiAgICAgIGhlYWRlcnM6IHsgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgdG9rZW4gfVxuICAgIH0pLnRoZW4oZnVuY3Rpb24ocmVzcCkge1xuICAgICAgcmV0dXJuIHJlc3AuanNvbigpO1xuICAgIH0pLnRoZW4oZnVuY3Rpb24oaW5mbykge1xuICAgICAgdGFyZ2V0LnRleHQoaW5mby5lbWFpbCk7XG4gICAgfSk7XG4gIH1cblxuICBzdG9yYWdlQVBJLnRoZW4oZnVuY3Rpb24oYXBpKSB7XG4gICAgYXBpLmNvbGxlY3Rpb24udGhlbihmdW5jdGlvbigpIHtcbiAgICAgICQoXCIubG9naW5Pbmx5XCIpLnNob3coKTtcbiAgICAgICQoXCIubG9nb3V0T25seVwiKS5oaWRlKCk7XG4gICAgICBzZXRVc2VybmFtZSgkKFwiI3VzZXJuYW1lXCIpKTtcbiAgICB9KTtcbiAgICBhcGkuY29sbGVjdGlvbi5mYWlsKGZ1bmN0aW9uKCkge1xuICAgICAgJChcIi5sb2dpbk9ubHlcIikuaGlkZSgpO1xuICAgICAgJChcIi5sb2dvdXRPbmx5XCIpLnNob3coKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgc3RvcmFnZUFQSSA9IHN0b3JhZ2VBUEkudGhlbihmdW5jdGlvbihhcGkpIHsgcmV0dXJuIGFwaS5hcGk7IH0pO1xuICAkKFwiI2Nvbm5lY3RCdXR0b25cIikuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgJChcIiNjb25uZWN0QnV0dG9uXCIpLnRleHQoXCJDb25uZWN0aW5nLi4uXCIpO1xuICAgICQoXCIjY29ubmVjdEJ1dHRvblwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAkKCcjY29ubmVjdEJ1dHRvbmxpJykuYXR0cignZGlzYWJsZWQnLCAnZGlzYWJsZWQnKTtcbiAgICAkKFwiI2Nvbm5lY3RCdXR0b25cIikuYXR0cihcInRhYkluZGV4XCIsIFwiLTFcIik7XG4gICAgLy8kKFwiI3RvcFRpZXJVbFwiKS5hdHRyKFwidGFiSW5kZXhcIiwgXCIwXCIpO1xuICAgIGdldFRvcFRpZXJNZW51aXRlbXMoKTtcbiAgICBzdG9yYWdlQVBJID0gY3JlYXRlUHJvZ3JhbUNvbGxlY3Rpb25BUEkocHJvY2Vzcy5lbnYuQVBQX05BTUUsIGZhbHNlKTtcbiAgICBzdG9yYWdlQVBJLnRoZW4oZnVuY3Rpb24oYXBpKSB7XG4gICAgICBhcGkuY29sbGVjdGlvbi50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKFwiLmxvZ2luT25seVwiKS5zaG93KCk7XG4gICAgICAgICQoXCIubG9nb3V0T25seVwiKS5oaWRlKCk7XG4gICAgICAgIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuICAgICAgICAkKFwiI2Jvbm5pZW1lbnVidXR0b25cIikuZm9jdXMoKTtcbiAgICAgICAgc2V0VXNlcm5hbWUoJChcIiN1c2VybmFtZVwiKSk7XG4gICAgICAgIGlmKHBhcmFtc1tcImdldFwiXSAmJiBwYXJhbXNbXCJnZXRcIl1bXCJwcm9ncmFtXCJdKSB7XG4gICAgICAgICAgdmFyIHRvTG9hZCA9IGFwaS5hcGkuZ2V0RmlsZUJ5SWQocGFyYW1zW1wiZ2V0XCJdW1wicHJvZ3JhbVwiXSk7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJMb2dnZWQgaW4gYW5kIGhhcyBwcm9ncmFtIHRvIGxvYWQ6IFwiLCB0b0xvYWQpO1xuICAgICAgICAgIGxvYWRQcm9ncmFtKHRvTG9hZCk7XG4gICAgICAgICAgcHJvZ3JhbVRvU2F2ZSA9IHRvTG9hZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcm9ncmFtVG9TYXZlID0gUS5mY2FsbChmdW5jdGlvbigpIHsgcmV0dXJuIG51bGw7IH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGFwaS5jb2xsZWN0aW9uLmZhaWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICQoXCIjY29ubmVjdEJ1dHRvblwiKS50ZXh0KFwiQ29ubmVjdCB0byBHb29nbGUgRHJpdmVcIik7XG4gICAgICAgICQoXCIjY29ubmVjdEJ1dHRvblwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgZmFsc2UpO1xuICAgICAgICAkKCcjY29ubmVjdEJ1dHRvbmxpJykuYXR0cignZGlzYWJsZWQnLCBmYWxzZSk7XG4gICAgICAgIC8vJChcIiNjb25uZWN0QnV0dG9uXCIpLmF0dHIoXCJ0YWJJbmRleFwiLCBcIjBcIik7XG4gICAgICAgIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuICAgICAgICAkKFwiI2Nvbm5lY3RCdXR0b25cIikuZm9jdXMoKTtcbiAgICAgICAgLy8kKFwiI3RvcFRpZXJVbFwiKS5hdHRyKFwidGFiSW5kZXhcIiwgXCItMVwiKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN0b3JhZ2VBUEkgPSBzdG9yYWdlQVBJLnRoZW4oZnVuY3Rpb24oYXBpKSB7IHJldHVybiBhcGkuYXBpOyB9KTtcbiAgfSk7XG5cbiAgLypcbiAgICBpbml0aWFsUHJvZ3JhbSBob2xkcyBhIHByb21pc2UgZm9yIGEgRHJpdmUgRmlsZSBvYmplY3Qgb3IgbnVsbFxuXG4gICAgSXQncyBudWxsIGlmIHRoZSBwYWdlIGRvZXNuJ3QgaGF2ZSBhICNzaGFyZSBvciAjcHJvZ3JhbSB1cmxcblxuICAgIElmIHRoZSB1cmwgZG9lcyBoYXZlIGEgI3Byb2dyYW0gb3IgI3NoYXJlLCB0aGUgcHJvbWlzZSBpcyBmb3IgdGhlXG4gICAgY29ycmVzcG9uZGluZyBvYmplY3QuXG4gICovXG4gIGxldCBpbml0aWFsUHJvZ3JhbTtcbiAgaWYocGFyYW1zW1wiZ2V0XCJdICYmIHBhcmFtc1tcImdldFwiXVtcInNoYXJldXJsXCJdKSB7XG4gICAgaW5pdGlhbFByb2dyYW0gPSBtYWtlVXJsRmlsZShwYXJhbXNbXCJnZXRcIl1bXCJzaGFyZXVybFwiXSk7XG4gIH1cbiAgZWxzZSB7XG4gICAgaW5pdGlhbFByb2dyYW0gPSBzdG9yYWdlQVBJLnRoZW4oZnVuY3Rpb24oYXBpKSB7XG4gICAgICB2YXIgcHJvZ3JhbUxvYWQgPSBudWxsO1xuICAgICAgaWYocGFyYW1zW1wiZ2V0XCJdICYmIHBhcmFtc1tcImdldFwiXVtcInByb2dyYW1cIl0pIHtcbiAgICAgICAgZW5hYmxlRmlsZU9wdGlvbnMoKTtcbiAgICAgICAgcHJvZ3JhbUxvYWQgPSBhcGkuZ2V0RmlsZUJ5SWQocGFyYW1zW1wiZ2V0XCJdW1wicHJvZ3JhbVwiXSk7XG4gICAgICAgIHByb2dyYW1Mb2FkLnRoZW4oZnVuY3Rpb24ocCkgeyBzaG93U2hhcmVDb250YWluZXIocCk7IH0pO1xuICAgICAgfVxuICAgICAgZWxzZSBpZihwYXJhbXNbXCJnZXRcIl0gJiYgcGFyYW1zW1wiZ2V0XCJdW1wic2hhcmVcIl0pIHtcbiAgICAgICAgbG9nZ2VyLmxvZygnc2hhcmVkLXByb2dyYW0tbG9hZCcsXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWQ6IHBhcmFtc1tcImdldFwiXVtcInNoYXJlXCJdXG4gICAgICAgICAgfSk7XG4gICAgICAgIHByb2dyYW1Mb2FkID0gYXBpLmdldFNoYXJlZEZpbGVCeUlkKHBhcmFtc1tcImdldFwiXVtcInNoYXJlXCJdKTtcbiAgICAgICAgcHJvZ3JhbUxvYWQudGhlbihmdW5jdGlvbihmaWxlKSB7XG4gICAgICAgICAgLy8gTk9URShqb2UpOiBJZiB0aGUgY3VycmVudCB1c2VyIGRvZXNuJ3Qgb3duIG9yIGhhdmUgYWNjZXNzIHRvIHRoaXMgZmlsZVxuICAgICAgICAgIC8vIChvciBpc24ndCBsb2dnZWQgaW4pIHRoaXMgd2lsbCBzaW1wbHkgZmFpbCB3aXRoIGEgNDAxLCBzbyB3ZSBkb24ndCBkb1xuICAgICAgICAgIC8vIGFueSBmdXJ0aGVyIHBlcm1pc3Npb24gY2hlY2tpbmcgYmVmb3JlIHNob3dpbmcgdGhlIGxpbmsuXG4gICAgICAgICAgZmlsZS5nZXRPcmlnaW5hbCgpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVzcG9uc2UgZm9yIG9yaWdpbmFsOiBcIiwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgdmFyIG9yaWdpbmFsID0gJChcIiNvcGVuLW9yaWdpbmFsXCIpLnNob3coKS5vZmYoXCJjbGlja1wiKTtcbiAgICAgICAgICAgIHZhciBpZCA9IHJlc3BvbnNlLnJlc3VsdC52YWx1ZTtcbiAgICAgICAgICAgIG9yaWdpbmFsLnJlbW92ZUNsYXNzKFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgb3JpZ2luYWwuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHdpbmRvdy5vcGVuKHdpbmRvdy5BUFBfQkFTRV9VUkwgKyBcIi9lZGl0b3IjcHJvZ3JhbT1cIiArIGlkLCBcIl9ibGFua1wiKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBwcm9ncmFtTG9hZCA9IG51bGw7XG4gICAgICB9XG4gICAgICBpZihwcm9ncmFtTG9hZCkge1xuICAgICAgICBwcm9ncmFtTG9hZC5mYWlsKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICB3aW5kb3cuc3RpY2tFcnJvcihcIlRoZSBwcm9ncmFtIGZhaWxlZCB0byBsb2FkLlwiKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBwcm9ncmFtTG9hZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH0pLmNhdGNoKGUgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcihcInN0b3JhZ2VBUEkgZmFpbGVkIHRvIGxvYWQsIHByb2NlZWRpbmcgd2l0aG91dCBzYXZpbmcgcHJvZ3JhbXM6IFwiLCBlKTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0VGl0bGUocHJvZ05hbWUpIHtcbiAgICBkb2N1bWVudC50aXRsZSA9IHByb2dOYW1lICsgXCIgLSBcIiArIHByb2Nlc3MuZW52LkFQUF9OQU1FO1xuICAgICQoXCIjc2hvd0ZpbGVuYW1lXCIpLnRleHQoXCJGaWxlOiBcIiArIHByb2dOYW1lKTtcbiAgfVxuICBDUE8uc2V0VGl0bGUgPSBzZXRUaXRsZTtcblxuICB2YXIgZmlsZW5hbWUgPSBmYWxzZTtcblxuICAkKFwiI2Rvd25sb2FkIGFcIikuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRvd25sb2FkRWx0ID0gJChcIiNkb3dubG9hZCBhXCIpO1xuICAgIHZhciBjb250ZW50cyA9IENQTy5lZGl0b3IuY20uZ2V0VmFsdWUoKTtcbiAgICB2YXIgZG93bmxvYWRCbG9iID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW2NvbnRlbnRzXSwge3R5cGU6ICd0ZXh0L3BsYWluJ30pKTtcbiAgICBpZighZmlsZW5hbWUpIHsgZmlsZW5hbWUgPSAndW50aXRsZWRfcHJvZ3JhbS5hcnInOyB9XG4gICAgaWYoZmlsZW5hbWUuaW5kZXhPZihcIi5hcnJcIikgIT09IChmaWxlbmFtZS5sZW5ndGggLSA0KSkge1xuICAgICAgZmlsZW5hbWUgKz0gXCIuYXJyXCI7XG4gICAgfVxuICAgIGRvd25sb2FkRWx0LmF0dHIoe1xuICAgICAgZG93bmxvYWQ6IGZpbGVuYW1lLFxuICAgICAgaHJlZjogZG93bmxvYWRCbG9iXG4gICAgfSk7XG4gICAgJChcIiNkb3dubG9hZFwiKS5hcHBlbmQoZG93bmxvYWRFbHQpO1xuICB9KTtcblxuICBmdW5jdGlvbiBzaG93TW9kYWwoY3VycmVudENvbnRleHQpIHtcbiAgICBmdW5jdGlvbiBkcmF3RWxlbWVudChpbnB1dCkge1xuICAgICAgY29uc3QgZWxlbWVudCA9ICQoXCI8ZGl2PlwiKTtcbiAgICAgIGNvbnN0IGdyZWV0aW5nID0gJChcIjxwPlwiKTtcbiAgICAgIGNvbnN0IHNoYXJlZCA9ICQoXCI8dHQ+c2hhcmVkLWdkcml2ZSguLi4pPC90dD5cIik7XG4gICAgICBjb25zdCBjdXJyZW50Q29udGV4dEVsdCA9ICQoXCI8dHQ+XCIgKyBjdXJyZW50Q29udGV4dCArIFwiPC90dD5cIik7XG4gICAgICBncmVldGluZy5hcHBlbmQoXCJFbnRlciB0aGUgY29udGV4dCB0byB1c2UgZm9yIHRoZSBwcm9ncmFtLCBvciBjaG9vc2Ug4oCcQ2FuY2Vs4oCdIHRvIGtlZXAgdGhlIGN1cnJlbnQgY29udGV4dCBvZiBcIiwgY3VycmVudENvbnRleHRFbHQsIFwiLlwiKTtcbiAgICAgIGNvbnN0IGVzc2VudGlhbHMgPSAkKFwiPHR0PnN0YXJ0ZXIyMDI0PC90dD5cIik7XG4gICAgICBjb25zdCBsaXN0ID0gJChcIjx1bD5cIilcbiAgICAgICAgLmFwcGVuZCgkKFwiPGxpPlwiKS5hcHBlbmQoXCJUaGUgZGVmYXVsdCBpcyBcIiwgZXNzZW50aWFscywgXCIuXCIpKVxuICAgICAgICAuYXBwZW5kKCQoXCI8bGk+XCIpLmFwcGVuZChcIllvdSBtaWdodCB1c2Ugc29tZXRoaW5nIGxpa2UgXCIsIHNoYXJlZCwgXCIgaWYgb25lIHdhcyBwcm92aWRlZCBhcyBwYXJ0IG9mIGEgY291cnNlLlwiKSk7XG4gICAgICBlbGVtZW50LmFwcGVuZChncmVldGluZyk7XG4gICAgICBlbGVtZW50LmFwcGVuZCgkKFwiPHA+XCIpLmFwcGVuZChsaXN0KSk7XG4gICAgICBjb25zdCB1c2VDb250ZXh0ID0gJChcIjx0dD51c2UgY29udGV4dDwvdHQ+XCIpLmNzcyh7ICdmbGV4LWdyb3cnOiAnMCcsICdwYWRkaW5nLXJpZ2h0JzogJzFlbScgfSk7XG4gICAgICBjb25zdCBpbnB1dFdyYXBwZXIgPSAkKFwiPGRpdj5cIikuYXBwZW5kKGlucHV0KS5jc3MoeyAnZmxleC1ncm93JzogJzEnIH0pO1xuICAgICAgY29uc3QgZW50cnkgPSAkKFwiPGRpdj5cIikuY3NzKHtcbiAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAncm93JyxcbiAgICAgICAgJ2p1c3RpZnktY29udGVudCc6ICdmbGV4LXN0YXJ0JyxcbiAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2Jhc2VsaW5lJ1xuICAgICAgfSk7XG4gICAgICBlbnRyeS5hcHBlbmQodXNlQ29udGV4dCkuYXBwZW5kKGlucHV0V3JhcHBlcik7XG4gICAgICBlbGVtZW50LmFwcGVuZChlbnRyeSk7XG4gICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG4gICAgY29uc3QgbmFtZXNwYWNlUmVzdWx0ID0gbmV3IG1vZGFsUHJvbXB0KHtcbiAgICAgICAgdGl0bGU6IFwiQ2hvb3NlIGEgQ29udGV4dFwiLFxuICAgICAgICBzdHlsZTogXCJ0ZXh0XCIsXG4gICAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBkcmF3RWxlbWVudDogZHJhd0VsZW1lbnQsXG4gICAgICAgICAgICBzdWJtaXRUZXh0OiBcIkNoYW5nZSBOYW1lc3BhY2VcIixcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZTogY3VycmVudENvbnRleHRcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH0pO1xuICAgIG5hbWVzcGFjZVJlc3VsdC5zaG93KChyZXN1bHQpID0+IHtcbiAgICAgIGlmKCFyZXN1bHQpIHsgcmV0dXJuOyB9XG4gICAgICBDUE8uZWRpdG9yLnNldENvbnRleHRMaW5lKFwidXNlIGNvbnRleHQgXCIgKyByZXN1bHQudHJpbSgpICsgXCJcXG5cIik7XG4gICAgfSk7XG4gIH1cbiAgJChcIiNjaG9vc2UtY29udGV4dFwiKS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uKCkge1xuICAgIGNvbnN0IGZpcnN0TGluZSA9IENQTy5lZGl0b3IuY20uZ2V0TGluZSgwKTtcbiAgICBjb25zdCBjb250ZXh0TGVuID0gZmlyc3RMaW5lLm1hdGNoKENPTlRFWFRfUFJFRklYKTtcbiAgICBzaG93TW9kYWwoY29udGV4dExlbiA9PT0gbnVsbCA/IFwiXCIgOiBmaXJzdExpbmUuc2xpY2UoY29udGV4dExlblswXS5sZW5ndGgpKTtcbiAgfSk7XG5cbiAgdmFyIFRSVU5DQVRFX0xFTkdUSCA9IDIwO1xuXG4gIGZ1bmN0aW9uIHRydW5jYXRlTmFtZShuYW1lKSB7XG4gICAgaWYobmFtZS5sZW5ndGggPD0gVFJVTkNBVEVfTEVOR1RIICsgMSkgeyByZXR1cm4gbmFtZTsgfVxuICAgIHJldHVybiBuYW1lLnNsaWNlKDAsIFRSVU5DQVRFX0xFTkdUSCAvIDIpICsgXCLigKZcIiArIG5hbWUuc2xpY2UobmFtZS5sZW5ndGggLSBUUlVOQ0FURV9MRU5HVEggLyAyLCBuYW1lLmxlbmd0aCk7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVOYW1lKHApIHtcbiAgICBmaWxlbmFtZSA9IHAuZ2V0TmFtZSgpO1xuICAgICQoXCIjZmlsZW5hbWVcIikudGV4dChcIiAoXCIgKyB0cnVuY2F0ZU5hbWUoZmlsZW5hbWUpICsgXCIpXCIpO1xuICAgICQoXCIjZmlsZW5hbWVcIikuYXR0cigndGl0bGUnLCBmaWxlbmFtZSk7XG4gICAgc2V0VGl0bGUoZmlsZW5hbWUpO1xuICAgIHNob3dTaGFyZUNvbnRhaW5lcihwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxvYWRQcm9ncmFtKHApIHtcbiAgICBwcm9ncmFtVG9TYXZlID0gcDtcbiAgICByZXR1cm4gcC50aGVuKGZ1bmN0aW9uKHByb2cpIHtcbiAgICAgIGlmKHByb2cgIT09IG51bGwpIHtcbiAgICAgICAgdXBkYXRlTmFtZShwcm9nKTtcbiAgICAgICAgaWYocHJvZy5zaGFyZWQpIHtcbiAgICAgICAgICB3aW5kb3cuc3RpY2tNZXNzYWdlKFwiWW91IGFyZSB2aWV3aW5nIGEgc2hhcmVkIHByb2dyYW0uIEFueSBjaGFuZ2VzIHlvdSBtYWtlIHdpbGwgbm90IGJlIHNhdmVkLiBZb3UgY2FuIHVzZSBGaWxlIC0+IFNhdmUgYSBjb3B5IHRvIHNhdmUgeW91ciBvd24gdmVyc2lvbiB3aXRoIGFueSBlZGl0cyB5b3UgbWFrZS5cIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb2cuZ2V0Q29udGVudHMoKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBpZihwYXJhbXNbXCJnZXRcIl1bXCJlZGl0b3JDb250ZW50c1wiXSAmJiAhKHBhcmFtc1tcImdldFwiXVtcInByb2dyYW1cIl0gfHwgcGFyYW1zW1wiZ2V0XCJdW1wic2hhcmVcIl0pKSB7XG4gICAgICAgICAgcmV0dXJuIHBhcmFtc1tcImdldFwiXVtcImVkaXRvckNvbnRlbnRzXCJdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHJldHVybiBDT05URVhUX0ZPUl9ORVdfRklMRVM7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNheShtc2csIGZvcmdldCkge1xuICAgIGlmIChtc2cgPT09IFwiXCIpIHJldHVybjtcbiAgICB2YXIgYW5ub3VuY2VtZW50cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYW5ub3VuY2VtZW50bGlzdFwiKTtcbiAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiTElcIik7XG4gICAgbGkuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobXNnKSk7XG4gICAgYW5ub3VuY2VtZW50cy5pbnNlcnRCZWZvcmUobGksIGFubm91bmNlbWVudHMuZmlyc3RDaGlsZCk7XG4gICAgaWYgKGZvcmdldCkge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgYW5ub3VuY2VtZW50cy5yZW1vdmVDaGlsZChsaSk7XG4gICAgICB9LCAxMDAwKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzYXlBbmRGb3JnZXQobXNnKSB7XG4gICAgY29uc29sZS5sb2coJ2RvaW5nIHNheUFuZEZvcmdldCcsIG1zZyk7XG4gICAgc2F5KG1zZywgdHJ1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBjeWNsZUFkdmFuY2UoY3VyckluZGV4LCBtYXhJbmRleCwgcmV2ZXJzZVApIHtcbiAgICB2YXIgbmV4dEluZGV4ID0gY3VyckluZGV4ICsgKHJldmVyc2VQPyAtMSA6ICsxKTtcbiAgICBuZXh0SW5kZXggPSAoKG5leHRJbmRleCAlIG1heEluZGV4KSArIG1heEluZGV4KSAlIG1heEluZGV4O1xuICAgIHJldHVybiBuZXh0SW5kZXg7XG4gIH1cblxuICBmdW5jdGlvbiBwb3B1bGF0ZUZvY3VzQ2Fyb3VzZWwoZWRpdG9yKSB7XG4gICAgaWYgKCFlZGl0b3IuZm9jdXNDYXJvdXNlbCkge1xuICAgICAgZWRpdG9yLmZvY3VzQ2Fyb3VzZWwgPSBbXTtcbiAgICB9XG4gICAgdmFyIGZjID0gZWRpdG9yLmZvY3VzQ2Fyb3VzZWw7XG4gICAgdmFyIGRvY21haW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1haW5cIik7XG4gICAgaWYgKCFmY1swXSkge1xuICAgICAgdmFyIHRvb2xiYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnVG9vbGJhcicpO1xuICAgICAgZmNbMF0gPSB0b29sYmFyO1xuICAgICAgLy9mY1swXSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGVhZGVyb25lbGVnZW5kXCIpO1xuICAgICAgLy9nZXRUb3BUaWVyTWVudWl0ZW1zKCk7XG4gICAgICAvL2ZjWzBdID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Jvbm5pZW1lbnVidXR0b24nKTtcbiAgICB9XG4gICAgaWYgKCFmY1sxXSkge1xuICAgICAgdmFyIGRvY3JlcGxNYWluID0gZG9jbWFpbi5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwicmVwbE1haW5cIik7XG4gICAgICB2YXIgZG9jcmVwbE1haW4wO1xuICAgICAgaWYgKGRvY3JlcGxNYWluLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBkb2NyZXBsTWFpbjAgPSB1bmRlZmluZWQ7XG4gICAgICB9IGVsc2UgaWYgKGRvY3JlcGxNYWluLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBkb2NyZXBsTWFpbjAgPSBkb2NyZXBsTWFpblswXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZG9jcmVwbE1haW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoZG9jcmVwbE1haW5baV0uaW5uZXJUZXh0ICE9PSBcIlwiKSB7XG4gICAgICAgICAgICBkb2NyZXBsTWFpbjAgPSBkb2NyZXBsTWFpbltpXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZjWzFdID0gZG9jcmVwbE1haW4wO1xuICAgIH1cbiAgICBpZiAoIWZjWzJdKSB7XG4gICAgICB2YXIgZG9jcmVwbCA9IGRvY21haW4uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInJlcGxcIik7XG4gICAgICB2YXIgZG9jcmVwbGNvZGUgPSBkb2NyZXBsWzBdLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJwcm9tcHQtY29udGFpbmVyXCIpWzBdLlxuICAgICAgICBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiQ29kZU1pcnJvclwiKVswXTtcbiAgICAgIGZjWzJdID0gZG9jcmVwbGNvZGU7XG4gICAgfVxuICAgIGlmICghZmNbM10pIHtcbiAgICAgIGZjWzNdID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhbm5vdW5jZW1lbnRzXCIpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGN5Y2xlRm9jdXMocmV2ZXJzZVApIHtcbiAgICAvL2NvbnNvbGUubG9nKCdkb2luZyBjeWNsZUZvY3VzJywgcmV2ZXJzZVApO1xuICAgIHZhciBlZGl0b3IgPSB0aGlzLmVkaXRvcjtcbiAgICBwb3B1bGF0ZUZvY3VzQ2Fyb3VzZWwoZWRpdG9yKTtcbiAgICB2YXIgZkNhcm91c2VsID0gZWRpdG9yLmZvY3VzQ2Fyb3VzZWw7XG4gICAgdmFyIG1heEluZGV4ID0gZkNhcm91c2VsLmxlbmd0aDtcbiAgICB2YXIgY3VycmVudEZvY3VzZWRFbHQgPSBmQ2Fyb3VzZWwuZmluZChmdW5jdGlvbihub2RlKSB7XG4gICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5vZGUuY29udGFpbnMoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdmFyIGN1cnJlbnRGb2N1c0luZGV4ID0gZkNhcm91c2VsLmluZGV4T2YoY3VycmVudEZvY3VzZWRFbHQpO1xuICAgIHZhciBuZXh0Rm9jdXNJbmRleCA9IGN1cnJlbnRGb2N1c0luZGV4O1xuICAgIHZhciBmb2N1c0VsdDtcbiAgICBkbyB7XG4gICAgICBuZXh0Rm9jdXNJbmRleCA9IGN5Y2xlQWR2YW5jZShuZXh0Rm9jdXNJbmRleCwgbWF4SW5kZXgsIHJldmVyc2VQKTtcbiAgICAgIGZvY3VzRWx0ID0gZkNhcm91c2VsW25leHRGb2N1c0luZGV4XTtcbiAgICAgIC8vY29uc29sZS5sb2coJ3RyeWluZyBmb2N1c0VsdCcsIGZvY3VzRWx0KTtcbiAgICB9IHdoaWxlICghZm9jdXNFbHQpO1xuXG4gICAgdmFyIGZvY3VzRWx0MDtcbiAgICBpZiAoZm9jdXNFbHQuY2xhc3NMaXN0LmNvbnRhaW5zKCd0b29sYmFycmVnaW9uJykpIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ3NldHRsaW5nIG9uIHRvb2xiYXIgcmVnaW9uJylcbiAgICAgIGdldFRvcFRpZXJNZW51aXRlbXMoKTtcbiAgICAgIGZvY3VzRWx0MCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdib25uaWVtZW51YnV0dG9uJyk7XG4gICAgfSBlbHNlIGlmIChmb2N1c0VsdC5jbGFzc0xpc3QuY29udGFpbnMoXCJyZXBsTWFpblwiKSB8fFxuICAgICAgZm9jdXNFbHQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiQ29kZU1pcnJvclwiKSkge1xuICAgICAgLy9jb25zb2xlLmxvZygnc2V0dGxpbmcgb24gZGVmbiB3aW5kb3cnKVxuICAgICAgdmFyIHRleHRhcmVhcyA9IGZvY3VzRWx0LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidGV4dGFyZWFcIik7XG4gICAgICAvL2NvbnNvbGUubG9nKCd0eHRhcmVhcz0nLCB0ZXh0YXJlYXMpXG4gICAgICAvL2NvbnNvbGUubG9nKCd0eHRhcmVhIGxlbj0nLCB0ZXh0YXJlYXMubGVuZ3RoKVxuICAgICAgaWYgKHRleHRhcmVhcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnSScpXG4gICAgICAgIGZvY3VzRWx0MCA9IGZvY3VzRWx0O1xuICAgICAgfSBlbHNlIGlmICh0ZXh0YXJlYXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ3NldHRsaW5nIG9uIGludGVyIHdpbmRvdycpXG4gICAgICAgIGZvY3VzRWx0MCA9IHRleHRhcmVhc1swXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ3NldHRsaW5nIG9uIGRlZm4gd2luZG93JylcbiAgICAgICAgLypcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0ZXh0YXJlYXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAodGV4dGFyZWFzW2ldLmdldEF0dHJpYnV0ZSgndGFiSW5kZXgnKSkge1xuICAgICAgICAgICAgZm9jdXNFbHQwID0gdGV4dGFyZWFzW2ldO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAqL1xuICAgICAgICBmb2N1c0VsdDAgPSB0ZXh0YXJlYXNbdGV4dGFyZWFzLmxlbmd0aC0xXTtcbiAgICAgICAgZm9jdXNFbHQwLnJlbW92ZUF0dHJpYnV0ZSgndGFiSW5kZXgnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy9jb25zb2xlLmxvZygnc2V0dGxpbmcgb24gYW5ub3VuY2VtZW50IHJlZ2lvbicsIGZvY3VzRWx0KVxuICAgICAgZm9jdXNFbHQwID0gZm9jdXNFbHQ7XG4gICAgfVxuXG4gICAgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7XG4gICAgZm9jdXNFbHQwLmNsaWNrKCk7XG4gICAgZm9jdXNFbHQwLmZvY3VzKCk7XG4gICAgLy9jb25zb2xlLmxvZygnKGNmKWRvY2FjdGVsdD0nLCBkb2N1bWVudC5hY3RpdmVFbGVtZW50KTtcbiAgfVxuXG4gIHZhciBwcm9ncmFtTG9hZGVkID0gbG9hZFByb2dyYW0oaW5pdGlhbFByb2dyYW0pO1xuXG4gIHZhciBwcm9ncmFtVG9TYXZlID0gaW5pdGlhbFByb2dyYW07XG5cbiAgZnVuY3Rpb24gc2hvd1NoYXJlQ29udGFpbmVyKHApIHtcbiAgICAvL2NvbnNvbGUubG9nKCdjYWxsZWQgc2hvd1NoYXJlQ29udGFpbmVyJyk7XG4gICAgaWYoIXAuc2hhcmVkKSB7XG4gICAgICAkKFwiI3NoYXJlQ29udGFpbmVyXCIpLmVtcHR5KCk7XG4gICAgICAkKCcjcHVibGlzaGxpJykuc2hvdygpO1xuICAgICAgJChcIiNzaGFyZUNvbnRhaW5lclwiKS5hcHBlbmQoc2hhcmVBUEkubWFrZVNoYXJlTGluayhwKSk7XG4gICAgICBnZXRUb3BUaWVyTWVudWl0ZW1zKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbmFtZU9yVW50aXRsZWQoKSB7XG4gICAgcmV0dXJuIGZpbGVuYW1lIHx8IFwiVW50aXRsZWRcIjtcbiAgfVxuICBmdW5jdGlvbiBhdXRvU2F2ZSgpIHtcbiAgICBwcm9ncmFtVG9TYXZlLnRoZW4oZnVuY3Rpb24ocCkge1xuICAgICAgaWYocCAhPT0gbnVsbCAmJiAhcC5zaGFyZWQpIHsgc2F2ZSgpOyB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBlbmFibGVGaWxlT3B0aW9ucygpIHtcbiAgICAkKFwiI2ZpbGVtZW51Q29udGVudHMgKlwiKS5yZW1vdmVDbGFzcyhcImRpc2FibGVkXCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gbWVudUl0ZW1EaXNhYmxlZChpZCkge1xuICAgIHJldHVybiAkKFwiI1wiICsgaWQpLmhhc0NsYXNzKFwiZGlzYWJsZWRcIik7XG4gIH1cblxuICBmdW5jdGlvbiBuZXdFdmVudChlKSB7XG4gICAgd2luZG93Lm9wZW4od2luZG93LkFQUF9CQVNFX1VSTCArIFwiL2VkaXRvclwiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNhdmVFdmVudChlKSB7XG4gICAgaWYobWVudUl0ZW1EaXNhYmxlZChcInNhdmVcIikpIHsgcmV0dXJuOyB9XG4gICAgcmV0dXJuIHNhdmUoKTtcbiAgfVxuXG4gIC8qXG4gICAgc2F2ZSA6IHN0cmluZyAob3B0aW9uYWwpIC0+IHVuZGVmXG5cbiAgICBJZiBhIHN0cmluZyBhcmd1bWVudCBpcyBwcm92aWRlZCwgY3JlYXRlIGEgbmV3IGZpbGUgd2l0aCB0aGF0IG5hbWUgYW5kIHNhdmVcbiAgICB0aGUgZWRpdG9yIGNvbnRlbnRzIGluIHRoYXQgZmlsZS5cblxuICAgIElmIG5vIGZpbGVuYW1lIGlzIHByb3ZpZGVkLCBzYXZlIHRoZSBleGlzdGluZyBmaWxlIHJlZmVyZW5jZWQgYnkgdGhlIGVkaXRvclxuICAgIHdpdGggdGhlIGN1cnJlbnQgZWRpdG9yIGNvbnRlbnRzLiAgSWYgbm8gZmlsZW5hbWUgaGFzIGJlZW4gc2V0IHlldCwganVzdFxuICAgIHNldCB0aGUgbmFtZSB0byBcIlVudGl0bGVkXCIuXG5cbiAgKi9cbiAgZnVuY3Rpb24gc2F2ZShuZXdGaWxlbmFtZSkge1xuICAgIHZhciB1c2VOYW1lLCBjcmVhdGU7XG4gICAgaWYobmV3RmlsZW5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdXNlTmFtZSA9IG5ld0ZpbGVuYW1lO1xuICAgICAgY3JlYXRlID0gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSBpZihmaWxlbmFtZSA9PT0gZmFsc2UpIHtcbiAgICAgIGZpbGVuYW1lID0gXCJVbnRpdGxlZFwiO1xuICAgICAgY3JlYXRlID0gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB1c2VOYW1lID0gZmlsZW5hbWU7IC8vIEEgY2xvc2VkLW92ZXIgdmFyaWFibGVcbiAgICAgIGNyZWF0ZSA9IGZhbHNlO1xuICAgIH1cbiAgICB3aW5kb3cuc3RpY2tNZXNzYWdlKFwiU2F2aW5nLi4uXCIpO1xuICAgIHZhciBzYXZlZFByb2dyYW0gPSBwcm9ncmFtVG9TYXZlLnRoZW4oZnVuY3Rpb24ocCkge1xuICAgICAgaWYocCAhPT0gbnVsbCAmJiBwLnNoYXJlZCAmJiAhY3JlYXRlKSB7XG4gICAgICAgIHJldHVybiBwOyAvLyBEb24ndCB0cnkgdG8gc2F2ZSBzaGFyZWQgZmlsZXNcbiAgICAgIH1cbiAgICAgIGlmKGNyZWF0ZSkge1xuICAgICAgICBwcm9ncmFtVG9TYXZlID0gc3RvcmFnZUFQSVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGFwaSkgeyByZXR1cm4gYXBpLmNyZWF0ZUZpbGUodXNlTmFtZSk7IH0pXG4gICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocCkge1xuICAgICAgICAgICAgLy8gc2hvd1NoYXJlQ29udGFpbmVyKHApOyBUT0RPKGpvZSk6IGZpZ3VyZSBvdXQgd2hlcmUgdG8gcHV0IHRoaXNcbiAgICAgICAgICAgIGhpc3RvcnkucHVzaFN0YXRlKG51bGwsIG51bGwsIFwiI3Byb2dyYW09XCIgKyBwLmdldFVuaXF1ZUlkKCkpO1xuICAgICAgICAgICAgdXBkYXRlTmFtZShwKTsgLy8gc2V0cyBmaWxlbmFtZVxuICAgICAgICAgICAgZW5hYmxlRmlsZU9wdGlvbnMoKTtcbiAgICAgICAgICAgIHJldHVybiBwO1xuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcHJvZ3JhbVRvU2F2ZS50aGVuKGZ1bmN0aW9uKHApIHtcbiAgICAgICAgICByZXR1cm4gc2F2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gcHJvZ3JhbVRvU2F2ZS50aGVuKGZ1bmN0aW9uKHApIHtcbiAgICAgICAgICBpZihwID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcC5zYXZlKENQTy5lZGl0b3IuY20uZ2V0VmFsdWUoKSwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSkudGhlbihmdW5jdGlvbihwKSB7XG4gICAgICAgICAgaWYocCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgd2luZG93LmZsYXNoTWVzc2FnZShcIlByb2dyYW0gc2F2ZWQgYXMgXCIgKyBwLmdldE5hbWUoKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBwO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBzYXZlZFByb2dyYW0uZmFpbChmdW5jdGlvbihlcnIpIHtcbiAgICAgIHdpbmRvdy5zdGlja0Vycm9yKFwiVW5hYmxlIHRvIHNhdmVcIiwgXCJZb3VyIGludGVybmV0IGNvbm5lY3Rpb24gbWF5IGJlIGRvd24sIG9yIHNvbWV0aGluZyBlbHNlIG1pZ2h0IGJlIHdyb25nIHdpdGggdGhpcyBzaXRlIG9yIHNhdmluZyB0byBHb29nbGUuICBZb3Ugc2hvdWxkIGJhY2sgdXAgYW55IGNoYW5nZXMgdG8gdGhpcyBwcm9ncmFtIHNvbWV3aGVyZSBlbHNlLiAgWW91IGNhbiB0cnkgc2F2aW5nIGFnYWluIHRvIHNlZSBpZiB0aGUgcHJvYmxlbSB3YXMgdGVtcG9yYXJ5LCBhcyB3ZWxsLlwiKTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB9KTtcbiAgICByZXR1cm4gc2F2ZWRQcm9ncmFtO1xuICB9XG5cbiAgZnVuY3Rpb24gc2F2ZUFzKCkge1xuICAgIGlmKG1lbnVJdGVtRGlzYWJsZWQoXCJzYXZlYXNcIikpIHsgcmV0dXJuOyB9XG4gICAgcHJvZ3JhbVRvU2F2ZS50aGVuKGZ1bmN0aW9uKHApIHtcbiAgICAgIHZhciBuYW1lID0gcCA9PT0gbnVsbCA/IFwiVW50aXRsZWRcIiA6IHAuZ2V0TmFtZSgpO1xuICAgICAgdmFyIHNhdmVBc1Byb21wdCA9IG5ldyBtb2RhbFByb21wdCh7XG4gICAgICAgIHRpdGxlOiBcIlNhdmUgYSBjb3B5XCIsXG4gICAgICAgIHN0eWxlOiBcInRleHRcIixcbiAgICAgICAgc3VibWl0VGV4dDogXCJTYXZlXCIsXG4gICAgICAgIG5hcnJvdzogdHJ1ZSxcbiAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiVGhlIG5hbWUgZm9yIHRoZSBjb3B5OlwiLFxuICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiBuYW1lXG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBzYXZlQXNQcm9tcHQuc2hvdygpLnRoZW4oZnVuY3Rpb24obmV3TmFtZSkge1xuICAgICAgICBpZihuZXdOYW1lID09PSBudWxsKSB7IHJldHVybiBudWxsOyB9XG4gICAgICAgIHdpbmRvdy5zdGlja01lc3NhZ2UoXCJTYXZpbmcuLi5cIik7XG4gICAgICAgIHJldHVybiBzYXZlKG5ld05hbWUpO1xuICAgICAgfSkuXG4gICAgICBmYWlsKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIHJlbmFtZTogXCIsIGVycik7XG4gICAgICAgIHdpbmRvdy5mbGFzaEVycm9yKFwiRmFpbGVkIHRvIHJlbmFtZSBmaWxlXCIpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiByZW5hbWUoKSB7XG4gICAgcHJvZ3JhbVRvU2F2ZS50aGVuKGZ1bmN0aW9uKHApIHtcbiAgICAgIHZhciByZW5hbWVQcm9tcHQgPSBuZXcgbW9kYWxQcm9tcHQoe1xuICAgICAgICB0aXRsZTogXCJSZW5hbWUgdGhpcyBmaWxlXCIsXG4gICAgICAgIHN0eWxlOiBcInRleHRcIixcbiAgICAgICAgbmFycm93OiB0cnVlLFxuICAgICAgICBzdWJtaXRUZXh0OiBcIlJlbmFtZVwiLFxuICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbWVzc2FnZTogXCJUaGUgbmV3IG5hbWUgZm9yIHRoZSBmaWxlOlwiLFxuICAgICAgICAgICAgZGVmYXVsdFZhbHVlOiBwLmdldE5hbWUoKVxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfSk7XG4gICAgICAvLyBudWxsIHJldHVybiB2YWx1ZXMgYXJlIGZvciB0aGUgXCJjYW5jZWxcIiBwYXRoXG4gICAgICByZXR1cm4gcmVuYW1lUHJvbXB0LnNob3coKS50aGVuKGZ1bmN0aW9uKG5ld05hbWUpIHtcbiAgICAgICAgaWYobmV3TmFtZSA9PT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHdpbmRvdy5zdGlja01lc3NhZ2UoXCJSZW5hbWluZy4uLlwiKTtcbiAgICAgICAgcHJvZ3JhbVRvU2F2ZSA9IHAucmVuYW1lKG5ld05hbWUpO1xuICAgICAgICByZXR1cm4gcHJvZ3JhbVRvU2F2ZTtcbiAgICAgIH0pXG4gICAgICAudGhlbihmdW5jdGlvbihwKSB7XG4gICAgICAgIGlmKHAgPT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB1cGRhdGVOYW1lKHApO1xuICAgICAgICB3aW5kb3cuZmxhc2hNZXNzYWdlKFwiUHJvZ3JhbSBzYXZlZCBhcyBcIiArIHAuZ2V0TmFtZSgpKTtcbiAgICAgIH0pXG4gICAgICAuZmFpbChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byByZW5hbWU6IFwiLCBlcnIpO1xuICAgICAgICB3aW5kb3cuZmxhc2hFcnJvcihcIkZhaWxlZCB0byByZW5hbWUgZmlsZVwiKTtcbiAgICAgIH0pO1xuICAgIH0pXG4gICAgLmZhaWwoZnVuY3Rpb24oZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiVW5hYmxlIHRvIHJlbmFtZTogXCIsIGVycik7XG4gICAgfSk7XG4gIH1cblxuICAkKFwiI3J1bkJ1dHRvblwiKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICBDUE8uYXV0b1NhdmUoKTtcbiAgfSk7XG5cbiAgJChcIiNuZXdcIikuY2xpY2sobmV3RXZlbnQpO1xuICAkKFwiI3NhdmVcIikuY2xpY2soc2F2ZUV2ZW50KTtcbiAgJChcIiNyZW5hbWVcIikuY2xpY2socmVuYW1lKTtcbiAgJChcIiNzYXZlYXNcIikuY2xpY2soc2F2ZUFzKTtcblxuICB2YXIgZm9jdXNhYmxlRWx0cyA9ICQoZG9jdW1lbnQpLmZpbmQoJyNoZWFkZXIgLmZvY3VzYWJsZScpO1xuICAvL2NvbnNvbGUubG9nKCdmb2N1c2FibGVFbHRzPScsIGZvY3VzYWJsZUVsdHMpXG4gIHZhciB0aGVUb29sYmFyID0gJChkb2N1bWVudCkuZmluZCgnI1Rvb2xiYXInKTtcblxuICBmdW5jdGlvbiBnZXRUb3BUaWVyTWVudWl0ZW1zKCkge1xuICAgIC8vY29uc29sZS5sb2coJ2RvaW5nIGdldFRvcFRpZXJNZW51aXRlbXMnKVxuICAgIHZhciB0b3BUaWVyTWVudWl0ZW1zID0gJChkb2N1bWVudCkuZmluZCgnI2hlYWRlciB1bCBsaS50b3BUaWVyJykudG9BcnJheSgpO1xuICAgIHRvcFRpZXJNZW51aXRlbXMgPSB0b3BUaWVyTWVudWl0ZW1zLlxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyKGVsdCA9PiAhKGVsdC5zdHlsZS5kaXNwbGF5ID09PSAnbm9uZScgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHQuZ2V0QXR0cmlidXRlKCdkaXNhYmxlZCcpID09PSAnZGlzYWJsZWQnKSk7XG4gICAgdmFyIG51bVRvcFRpZXJNZW51aXRlbXMgPSB0b3BUaWVyTWVudWl0ZW1zLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG51bVRvcFRpZXJNZW51aXRlbXM7IGkrKykge1xuICAgICAgdmFyIGl0aFRvcFRpZXJNZW51aXRlbSA9IHRvcFRpZXJNZW51aXRlbXNbaV07XG4gICAgICB2YXIgaUNoaWxkID0gJChpdGhUb3BUaWVyTWVudWl0ZW0pLmNoaWxkcmVuKCkuZmlyc3QoKTtcbiAgICAgIC8vY29uc29sZS5sb2coJ2lDaGlsZD0nLCBpQ2hpbGQpO1xuICAgICAgaUNoaWxkLmZpbmQoJy5mb2N1c2FibGUnKS5cbiAgICAgICAgYXR0cignYXJpYS1zZXRzaXplJywgbnVtVG9wVGllck1lbnVpdGVtcy50b1N0cmluZygpKS5cbiAgICAgICAgYXR0cignYXJpYS1wb3NpbnNldCcsIChpKzEpLnRvU3RyaW5nKCkpO1xuICAgIH1cbiAgICByZXR1cm4gdG9wVGllck1lbnVpdGVtcztcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZUVkaXRvckhlaWdodCgpIHtcbiAgICB2YXIgdG9vbGJhckhlaWdodCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0b3BUaWVyVWwnKS5vZmZzZXRIZWlnaHQ7XG4gICAgLy8gZ2V0cyBidW1wZWQgdG8gNjcgb24gaW5pdGlhbCByZXNpemUgcGVydHVyYmF0aW9uLCBidXQgYWN0dWFsIHZhbHVlIGlzIGluZGVlZCA0MFxuICAgIGlmICh0b29sYmFySGVpZ2h0IDwgODApIHRvb2xiYXJIZWlnaHQgPSA0MDtcbiAgICB0b29sYmFySGVpZ2h0ICs9ICdweCc7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ1JFUEwnKS5zdHlsZS5wYWRkaW5nVG9wID0gdG9vbGJhckhlaWdodDtcbiAgICB2YXIgZG9jTWFpbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWluJyk7XG4gICAgdmFyIGRvY1JlcGxNYWluID0gZG9jTWFpbi5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdyZXBsTWFpbicpO1xuICAgIGlmIChkb2NSZXBsTWFpbi5sZW5ndGggIT09IDApIHtcbiAgICAgIGRvY1JlcGxNYWluWzBdLnN0eWxlLnBhZGRpbmdUb3AgPSB0b29sYmFySGVpZ2h0O1xuICAgIH1cbiAgfVxuXG4gICQod2luZG93KS5vbigncmVzaXplJywgdXBkYXRlRWRpdG9ySGVpZ2h0KTtcblxuICBmdW5jdGlvbiBpbnNlcnRBcmlhUG9zKHN1Ym1lbnUpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdkb2luZyBpbnNlcnRBcmlhUG9zJywgc3VibWVudSlcbiAgICB2YXIgYXJyID0gc3VibWVudS50b0FycmF5KCk7XG4gICAgLy9jb25zb2xlLmxvZygnYXJyPScsIGFycik7XG4gICAgdmFyIGxlbiA9IGFyci5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgdmFyIGVsdCA9IGFycltpXTtcbiAgICAgIC8vY29uc29sZS5sb2coJ2VsdCcsIGksICc9JywgZWx0KTtcbiAgICAgIGVsdC5zZXRBdHRyaWJ1dGUoJ2FyaWEtc2V0c2l6ZScsIGxlbi50b1N0cmluZygpKTtcbiAgICAgIGVsdC5zZXRBdHRyaWJ1dGUoJ2FyaWEtcG9zaW5zZXQnLCAoaSsxKS50b1N0cmluZygpKTtcbiAgICB9XG4gIH1cblxuXG4gIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKCkge1xuICAgIGhpZGVBbGxUb3BNZW51aXRlbXMoKTtcbiAgfSk7XG5cbiAgdGhlVG9vbGJhci5jbGljayhmdW5jdGlvbiAoZSkge1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH0pO1xuXG4gIHRoZVRvb2xiYXIua2V5ZG93bihmdW5jdGlvbiAoZSkge1xuICAgIC8vY29uc29sZS5sb2coJ3Rvb2xiYXIga2V5ZG93bicsIGUpO1xuICAgIC8vbW9zdCBhbnkga2V5IGF0IGFsbFxuICAgIHZhciBrYyA9IGUua2V5Q29kZTtcbiAgICBpZiAoa2MgPT09IDI3KSB7XG4gICAgICAvLyBlc2NhcGVcbiAgICAgIGhpZGVBbGxUb3BNZW51aXRlbXMoKTtcbiAgICAgIC8vY29uc29sZS5sb2coJ2NhbGxpbmcgY3ljbGVGb2N1cyBmcm9tIHRvb2xiYXInKVxuICAgICAgQ1BPLmN5Y2xlRm9jdXMoKTtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSBlbHNlIGlmIChrYyA9PT0gOSB8fCBrYyA9PT0gMzcgfHwga2MgPT09IDM4IHx8IGtjID09PSAzOSB8fCBrYyA9PT0gNDApIHtcbiAgICAgIC8vIGFuIGFycm93XG4gICAgICB2YXIgdGFyZ2V0ID0gJCh0aGlzKS5maW5kKCdbdGFiSW5kZXg9LTFdJyk7XG4gICAgICBnZXRUb3BUaWVyTWVudWl0ZW1zKCk7XG4gICAgICBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKTsgLy9uZWVkZWQ/XG4gICAgICB0YXJnZXQuZmlyc3QoKS5mb2N1cygpOyAvL25lZWRlZD9cbiAgICAgIC8vY29uc29sZS5sb2coJ2RvY2FjdGVsdD0nLCBkb2N1bWVudC5hY3RpdmVFbGVtZW50KTtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhpZGVBbGxUb3BNZW51aXRlbXMoKTtcbiAgICB9XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIGNsaWNrVG9wTWVudWl0ZW0oZSkge1xuICAgIGhpZGVBbGxUb3BNZW51aXRlbXMoKTtcbiAgICB2YXIgdGhpc0VsdCA9ICQodGhpcyk7XG4gICAgLy9jb25zb2xlLmxvZygnZG9pbmcgY2xpY2tUb3BNZW51aXRlbSBvbicsIHRoaXNFbHQpO1xuICAgIHZhciB0b3BUaWVyVWwgPSB0aGlzRWx0LmNsb3Nlc3QoJ3VsW2lkPXRvcFRpZXJVbF0nKTtcbiAgICBpZiAodGhpc0VsdFswXS5oYXNBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXNFbHRbMF0uZ2V0QXR0cmlidXRlKCdkaXNhYmxlZCcpID09PSAnZGlzYWJsZWQnKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vdmFyIGhpZGRlblAgPSAodGhpc0VsdFswXS5nZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnKSA9PT0gJ2ZhbHNlJyk7XG4gICAgLy9oaWRkZW5QIGFsd2F5cyBmYWxzZT9cbiAgICB2YXIgdGhpc1RvcE1lbnVpdGVtID0gdGhpc0VsdC5jbG9zZXN0KCdsaS50b3BUaWVyJyk7XG4gICAgLy9jb25zb2xlLmxvZygndGhpc1RvcE1lbnVpdGVtPScsIHRoaXNUb3BNZW51aXRlbSk7XG4gICAgdmFyIHQxID0gdGhpc1RvcE1lbnVpdGVtWzBdO1xuICAgIHZhciBzdWJtZW51T3BlbiA9ICh0aGlzRWx0WzBdLmdldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcpID09PSAndHJ1ZScpO1xuICAgIGlmICghc3VibWVudU9wZW4pIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ2hpZGRlbnAgdHJ1ZSBicmFuY2gnKTtcbiAgICAgIGhpZGVBbGxUb3BNZW51aXRlbXMoKTtcbiAgICAgIHRoaXNUb3BNZW51aXRlbS5jaGlsZHJlbigndWwuc3VibWVudScpLmF0dHIoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJykuc2hvdygpO1xuICAgICAgdGhpc1RvcE1lbnVpdGVtLmNoaWxkcmVuKCkuZmlyc3QoKS5maW5kKCdbYXJpYS1leHBhbmRlZF0nKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ3RydWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9jb25zb2xlLmxvZygnaGlkZGVucCBmYWxzZSBicmFuY2gnKTtcbiAgICAgIHRoaXNUb3BNZW51aXRlbS5jaGlsZHJlbigndWwuc3VibWVudScpLmF0dHIoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKS5oaWRlKCk7XG4gICAgICB0aGlzVG9wTWVudWl0ZW0uY2hpbGRyZW4oKS5maXJzdCgpLmZpbmQoJ1thcmlhLWV4cGFuZGVkXScpLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcbiAgICB9XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfVxuXG4gIHZhciBleHBhbmRhYmxlRWx0cyA9ICQoZG9jdW1lbnQpLmZpbmQoJyNoZWFkZXIgW2FyaWEtZXhwYW5kZWRdJyk7XG4gIGV4cGFuZGFibGVFbHRzLmNsaWNrKGNsaWNrVG9wTWVudWl0ZW0pO1xuXG4gIGZ1bmN0aW9uIGhpZGVBbGxUb3BNZW51aXRlbXMoKSB7XG4gICAgLy9jb25zb2xlLmxvZygnZG9pbmcgaGlkZUFsbFRvcE1lbnVpdGVtcycpO1xuICAgIHZhciB0b3BUaWVyVWwgPSAkKGRvY3VtZW50KS5maW5kKCcjaGVhZGVyIHVsW2lkPXRvcFRpZXJVbF0nKTtcbiAgICB0b3BUaWVyVWwuZmluZCgnW2FyaWEtZXhwYW5kZWRdJykuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgIHRvcFRpZXJVbC5maW5kKCd1bC5zdWJtZW51JykuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpLmhpZGUoKTtcbiAgfVxuXG4gIHZhciBub25leHBhbmRhYmxlRWx0cyA9ICQoZG9jdW1lbnQpLmZpbmQoJyNoZWFkZXIgLnRvcFRpZXIgPiBkaXYgPiBidXR0b246bm90KFthcmlhLWV4cGFuZGVkXSknKTtcbiAgbm9uZXhwYW5kYWJsZUVsdHMuY2xpY2soaGlkZUFsbFRvcE1lbnVpdGVtcyk7XG5cbiAgZnVuY3Rpb24gc3dpdGNoVG9wTWVudWl0ZW0oZGVzdFRvcE1lbnVpdGVtLCBkZXN0RWx0KSB7XG4gICAgLy9jb25zb2xlLmxvZygnZG9pbmcgc3dpdGNoVG9wTWVudWl0ZW0nLCBkZXN0VG9wTWVudWl0ZW0sIGRlc3RFbHQpO1xuICAgIC8vY29uc29sZS5sb2coJ2R0bWlsPScsIGRlc3RUb3BNZW51aXRlbS5sZW5ndGgpO1xuICAgIGhpZGVBbGxUb3BNZW51aXRlbXMoKTtcbiAgICBpZiAoZGVzdFRvcE1lbnVpdGVtICYmIGRlc3RUb3BNZW51aXRlbS5sZW5ndGggIT09IDApIHtcbiAgICAgIHZhciBlbHQgPSBkZXN0VG9wTWVudWl0ZW1bMF07XG4gICAgICB2YXIgZWx0SWQgPSBlbHQuZ2V0QXR0cmlidXRlKCdpZCcpO1xuICAgICAgZGVzdFRvcE1lbnVpdGVtLmNoaWxkcmVuKCd1bC5zdWJtZW51JykuYXR0cignYXJpYS1oaWRkZW4nLCAnZmFsc2UnKS5zaG93KCk7XG4gICAgICBkZXN0VG9wTWVudWl0ZW0uY2hpbGRyZW4oKS5maXJzdCgpLmZpbmQoJ1thcmlhLWV4cGFuZGVkXScpLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAndHJ1ZScpO1xuICAgIH1cbiAgICBpZiAoZGVzdEVsdCkge1xuICAgICAgLy9kZXN0RWx0LmF0dHIoJ3RhYkluZGV4JywgJzAnKS5mb2N1cygpO1xuICAgICAgZGVzdEVsdC5mb2N1cygpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBzaG93aW5nSGVscEtleXMgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBzaG93SGVscEtleXMoKSB7XG4gICAgc2hvd2luZ0hlbHBLZXlzID0gdHJ1ZTtcbiAgICAkKCcjaGVscC1rZXlzJykuZmFkZUluKDEwMCk7XG4gICAgcmVjaXRlSGVscCgpO1xuICB9XG5cbiAgZm9jdXNhYmxlRWx0cy5rZXlkb3duKGZ1bmN0aW9uIChlKSB7XG4gICAgLy9jb25zb2xlLmxvZygnZm9jdXNhYmxlIGVsdCBrZXlkb3duJywgZSk7XG4gICAgdmFyIGtjID0gZS5rZXlDb2RlO1xuICAgIC8vJCh0aGlzKS5ibHVyKCk7IC8vIERlbGV0ZT9cbiAgICB2YXIgd2l0aGluU2Vjb25kVGllclVsID0gdHJ1ZTtcbiAgICB2YXIgdG9wVGllclVsID0gJCh0aGlzKS5jbG9zZXN0KCd1bFtpZD10b3BUaWVyVWxdJyk7XG4gICAgdmFyIHNlY29uZFRpZXJVbCA9ICQodGhpcykuY2xvc2VzdCgndWwuc3VibWVudScpO1xuICAgIGlmIChzZWNvbmRUaWVyVWwubGVuZ3RoID09PSAwKSB7XG4gICAgICB3aXRoaW5TZWNvbmRUaWVyVWwgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGtjID09PSAyNykge1xuICAgICAgLy9jb25zb2xlLmxvZygnZXNjYXBlIHByZXNzZWQgaScpXG4gICAgICAkKCcjaGVscC1rZXlzJykuZmFkZU91dCg1MDApO1xuICAgIH1cbiAgICBpZiAoa2MgPT09IDI3ICYmIHdpdGhpblNlY29uZFRpZXJVbCkgeyAvLyBlc2NhcGVcbiAgICAgIHZhciBkZXN0VG9wTWVudWl0ZW0gPSAkKHRoaXMpLmNsb3Nlc3QoJ2xpLnRvcFRpZXInKTtcbiAgICAgIHZhciBwb3NzRWx0cyA9IGRlc3RUb3BNZW51aXRlbS5maW5kKCcuZm9jdXNhYmxlOm5vdChbZGlzYWJsZWRdKScpLmZpbHRlcignOnZpc2libGUnKTtcbiAgICAgIHN3aXRjaFRvcE1lbnVpdGVtKGRlc3RUb3BNZW51aXRlbSwgcG9zc0VsdHMuZmlyc3QoKSk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0gZWxzZSBpZiAoa2MgPT09IDM5KSB7IC8vIHJpZ2h0YXJyb3dcbiAgICAgIC8vY29uc29sZS5sb2coJ3JpZ2h0YXJyb3cgcHJlc3NlZCcpO1xuICAgICAgdmFyIHNyY1RvcE1lbnVpdGVtID0gJCh0aGlzKS5jbG9zZXN0KCdsaS50b3BUaWVyJyk7XG4gICAgICAvL2NvbnNvbGUubG9nKCdzcmNUb3BNZW51aXRlbT0nLCBzcmNUb3BNZW51aXRlbSk7XG4gICAgICBzcmNUb3BNZW51aXRlbS5jaGlsZHJlbigpLmZpcnN0KCkuZmluZCgnLmZvY3VzYWJsZScpLmF0dHIoJ3RhYkluZGV4JywgJy0xJyk7XG4gICAgICB2YXIgdG9wVGllck1lbnVpdGVtcyA9IGdldFRvcFRpZXJNZW51aXRlbXMoKTtcbiAgICAgIC8vY29uc29sZS5sb2coJ3R0bWkqID0nLCB0b3BUaWVyTWVudWl0ZW1zKTtcbiAgICAgIHZhciB0dG1pTiA9IHRvcFRpZXJNZW51aXRlbXMubGVuZ3RoO1xuICAgICAgdmFyIGogPSB0b3BUaWVyTWVudWl0ZW1zLmluZGV4T2Yoc3JjVG9wTWVudWl0ZW1bMF0pO1xuICAgICAgLy9jb25zb2xlLmxvZygnaiBpbml0aWFsPScsIGopO1xuICAgICAgZm9yICh2YXIgaSA9IChqICsgMSkgJSB0dG1pTjsgaSAhPT0gajsgaSA9IChpICsgMSkgJSB0dG1pTikge1xuICAgICAgICB2YXIgZGVzdFRvcE1lbnVpdGVtID0gJCh0b3BUaWVyTWVudWl0ZW1zW2ldKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnZGVzdFRvcE1lbnVpdGVtKGEpPScsIGRlc3RUb3BNZW51aXRlbSk7XG4gICAgICAgIHZhciBwb3NzRWx0cyA9IGRlc3RUb3BNZW51aXRlbS5maW5kKCcuZm9jdXNhYmxlOm5vdChbZGlzYWJsZWRdKScpLmZpbHRlcignOnZpc2libGUnKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZygncG9zc0VsdHM9JywgcG9zc0VsdHMpXG4gICAgICAgIGlmIChwb3NzRWx0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgLy9jb25zb2xlLmxvZygnZmluYWwgaT0nLCBpKTtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKCdsYW5kaW5nIG9uJywgcG9zc0VsdHMuZmlyc3QoKSk7XG4gICAgICAgICAgc3dpdGNoVG9wTWVudWl0ZW0oZGVzdFRvcE1lbnVpdGVtLCBwb3NzRWx0cy5maXJzdCgpKTtcbiAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChrYyA9PT0gMzcpIHsgLy8gbGVmdGFycm93XG4gICAgICAvL2NvbnNvbGUubG9nKCdsZWZ0YXJyb3cgcHJlc3NlZCcpO1xuICAgICAgdmFyIHNyY1RvcE1lbnVpdGVtID0gJCh0aGlzKS5jbG9zZXN0KCdsaS50b3BUaWVyJyk7XG4gICAgICAvL2NvbnNvbGUubG9nKCdzcmNUb3BNZW51aXRlbT0nLCBzcmNUb3BNZW51aXRlbSk7XG4gICAgICBzcmNUb3BNZW51aXRlbS5jaGlsZHJlbigpLmZpcnN0KCkuZmluZCgnLmZvY3VzYWJsZScpLmF0dHIoJ3RhYkluZGV4JywgJy0xJyk7XG4gICAgICB2YXIgdG9wVGllck1lbnVpdGVtcyA9IGdldFRvcFRpZXJNZW51aXRlbXMoKTtcbiAgICAgIC8vY29uc29sZS5sb2coJ3R0bWkqID0nLCB0b3BUaWVyTWVudWl0ZW1zKTtcbiAgICAgIHZhciB0dG1pTiA9IHRvcFRpZXJNZW51aXRlbXMubGVuZ3RoO1xuICAgICAgdmFyIGogPSB0b3BUaWVyTWVudWl0ZW1zLmluZGV4T2Yoc3JjVG9wTWVudWl0ZW1bMF0pO1xuICAgICAgLy9jb25zb2xlLmxvZygnaiBpbml0aWFsPScsIGopO1xuICAgICAgZm9yICh2YXIgaSA9IChqICsgdHRtaU4gLSAxKSAlIHR0bWlOOyBpICE9PSBqOyBpID0gKGkgKyB0dG1pTiAtIDEpICUgdHRtaU4pIHtcbiAgICAgICAgdmFyIGRlc3RUb3BNZW51aXRlbSA9ICQodG9wVGllck1lbnVpdGVtc1tpXSk7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ2Rlc3RUb3BNZW51aXRlbShiKT0nLCBkZXN0VG9wTWVudWl0ZW0pO1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdpPScsIGkpXG4gICAgICAgIHZhciBwb3NzRWx0cyA9IGRlc3RUb3BNZW51aXRlbS5maW5kKCcuZm9jdXNhYmxlOm5vdChbZGlzYWJsZWRdKScpLmZpbHRlcignOnZpc2libGUnKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZygncG9zc0VsdHM9JywgcG9zc0VsdHMpXG4gICAgICAgIGlmIChwb3NzRWx0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgLy9jb25zb2xlLmxvZygnZmluYWwgaT0nLCBpKTtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKCdsYW5kaW5nIG9uJywgcG9zc0VsdHMuZmlyc3QoKSk7XG4gICAgICAgICAgc3dpdGNoVG9wTWVudWl0ZW0oZGVzdFRvcE1lbnVpdGVtLCBwb3NzRWx0cy5maXJzdCgpKTtcbiAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChrYyA9PT0gMzgpIHsgLy8gdXBhcnJvd1xuICAgICAgLy9jb25zb2xlLmxvZygndXBhcnJvdyBwcmVzc2VkJyk7XG4gICAgICB2YXIgc3VibWVudTtcbiAgICAgIGlmICh3aXRoaW5TZWNvbmRUaWVyVWwpIHtcbiAgICAgICAgdmFyIG5lYXJTaWJzID0gJCh0aGlzKS5jbG9zZXN0KCdkaXYnKS5maW5kKCcuZm9jdXNhYmxlJykuZmlsdGVyKCc6dmlzaWJsZScpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKCduZWFyU2licz0nLCBuZWFyU2licyk7XG4gICAgICAgIHZhciBteUlkID0gJCh0aGlzKVswXS5nZXRBdHRyaWJ1dGUoJ2lkJyk7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ215SWQ9JywgbXlJZCk7XG4gICAgICAgIHN1Ym1lbnUgPSAkKFtdKTtcbiAgICAgICAgdmFyIHRoaXNFbmNvdW50ZXJlZCA9IGZhbHNlO1xuICAgICAgICBmb3IgKHZhciBpID0gbmVhclNpYnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICBpZiAodGhpc0VuY291bnRlcmVkKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdhZGRpbmcnLCBuZWFyU2lic1tpXSk7XG4gICAgICAgICAgICBzdWJtZW51ID0gc3VibWVudS5hZGQoJChuZWFyU2lic1tpXSkpO1xuICAgICAgICAgIH0gZWxzZSBpZiAobmVhclNpYnNbaV0uZ2V0QXR0cmlidXRlKCdpZCcpID09PSBteUlkKSB7XG4gICAgICAgICAgICB0aGlzRW5jb3VudGVyZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvL2NvbnNvbGUubG9nKCdzdWJtZW51IHNvIGZhcj0nLCBzdWJtZW51KTtcbiAgICAgICAgdmFyIGZhclNpYnMgPSAkKHRoaXMpLmNsb3Nlc3QoJ2xpJykucHJldkFsbCgpLmZpbmQoJ2Rpdjpub3QoLmRpc2FibGVkKScpXG4gICAgICAgICAgLmZpbmQoJy5mb2N1c2FibGUnKS5maWx0ZXIoJzp2aXNpYmxlJyk7XG4gICAgICAgIHN1Ym1lbnUgPSBzdWJtZW51LmFkZChmYXJTaWJzKTtcbiAgICAgICAgaWYgKHN1Ym1lbnUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgc3VibWVudSA9ICQodGhpcykuY2xvc2VzdCgnbGknKS5jbG9zZXN0KCd1bCcpLmZpbmQoJ2Rpdjpub3QoLmRpc2FibGVkKScpXG4gICAgICAgICAgLmZpbmQoJy5mb2N1c2FibGUnKS5maWx0ZXIoJzp2aXNpYmxlJykubGFzdCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdWJtZW51Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBzdWJtZW51Lmxhc3QoKS5mb2N1cygpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8qXG4gICAgICAgICAgLy9jb25zb2xlLmxvZygnbm8gYWN0aW9uYWJsZSBzdWJtZW51IGZvdW5kJylcbiAgICAgICAgICB2YXIgdG9wbWVudUl0ZW0gPSAkKHRoaXMpLmNsb3Nlc3QoJ3VsLnN1Ym1lbnUnKS5jbG9zZXN0KCdsaScpXG4gICAgICAgICAgLmNoaWxkcmVuKCkuZmlyc3QoKS5maW5kKCcuZm9jdXNhYmxlOm5vdChbZGlzYWJsZWRdKScpLmZpbHRlcignOnZpc2libGUnKTtcbiAgICAgICAgICBpZiAodG9wbWVudUl0ZW0ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdG9wbWVudUl0ZW0uZmlyc3QoKS5mb2N1cygpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdubyBhY3Rpb25hYmxlIHRvcG1lbnVpdGVtIGZvdW5kIGVpdGhlcicpXG4gICAgICAgICAgfVxuICAgICAgICAgICovXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSBlbHNlIGlmIChrYyA9PT0gNDApIHsgLy8gZG93bmFycm93XG4gICAgICAvL2NvbnNvbGUubG9nKCdkb3duYXJyb3cgcHJlc3NlZCcpO1xuICAgICAgdmFyIHN1Ym1lbnVEaXZzO1xuICAgICAgdmFyIHN1Ym1lbnU7XG4gICAgICBpZiAoIXdpdGhpblNlY29uZFRpZXJVbCkge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCcxc3QgdGllcicpXG4gICAgICAgIHN1Ym1lbnVEaXZzID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpLmNoaWxkcmVuKCd1bCcpLmZpbmQoJ2Rpdjpub3QoLmRpc2FibGVkKScpO1xuICAgICAgICBzdWJtZW51ID0gc3VibWVudURpdnMuZmluZCgnLmZvY3VzYWJsZScpLmZpbHRlcignOnZpc2libGUnKTtcbiAgICAgICAgaW5zZXJ0QXJpYVBvcyhzdWJtZW51KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJzJuZCB0aWVyJylcbiAgICAgICAgdmFyIG5lYXJTaWJzID0gJCh0aGlzKS5jbG9zZXN0KCdkaXYnKS5maW5kKCcuZm9jdXNhYmxlJykuZmlsdGVyKCc6dmlzaWJsZScpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKCduZWFyU2licz0nLCBuZWFyU2licyk7XG4gICAgICAgIHZhciBteUlkID0gJCh0aGlzKVswXS5nZXRBdHRyaWJ1dGUoJ2lkJyk7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ215SWQ9JywgbXlJZCk7XG4gICAgICAgIHN1Ym1lbnUgPSAkKFtdKTtcbiAgICAgICAgdmFyIHRoaXNFbmNvdW50ZXJlZCA9IGZhbHNlO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5lYXJTaWJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHRoaXNFbmNvdW50ZXJlZCkge1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnYWRkaW5nJywgbmVhclNpYnNbaV0pO1xuICAgICAgICAgICAgc3VibWVudSA9IHN1Ym1lbnUuYWRkKCQobmVhclNpYnNbaV0pKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKG5lYXJTaWJzW2ldLmdldEF0dHJpYnV0ZSgnaWQnKSA9PT0gbXlJZCkge1xuICAgICAgICAgICAgdGhpc0VuY291bnRlcmVkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy9jb25zb2xlLmxvZygnc3VibWVudSBzbyBmYXI9Jywgc3VibWVudSk7XG4gICAgICAgIHZhciBmYXJTaWJzID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpLm5leHRBbGwoKS5maW5kKCdkaXY6bm90KC5kaXNhYmxlZCknKVxuICAgICAgICAgIC5maW5kKCcuZm9jdXNhYmxlJykuZmlsdGVyKCc6dmlzaWJsZScpO1xuICAgICAgICBzdWJtZW51ID0gc3VibWVudS5hZGQoZmFyU2licyk7XG4gICAgICAgIGlmIChzdWJtZW51Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHN1Ym1lbnUgPSAkKHRoaXMpLmNsb3Nlc3QoJ2xpJykuY2xvc2VzdCgndWwnKS5maW5kKCdkaXY6bm90KC5kaXNhYmxlZCknKVxuICAgICAgICAgICAgLmZpbmQoJy5mb2N1c2FibGUnKS5maWx0ZXIoJzp2aXNpYmxlJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vY29uc29sZS5sb2coJ3N1Ym1lbnU9Jywgc3VibWVudSlcbiAgICAgIGlmIChzdWJtZW51Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgc3VibWVudS5maXJzdCgpLmZvY3VzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdubyBhY3Rpb25hYmxlIHN1Ym1lbnUgZm91bmQnKVxuICAgICAgfVxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9IGVsc2UgaWYgKGtjID09PSAyNykge1xuICAgICAgLy9jb25zb2xlLmxvZygnZXNjIHByZXNzZWQnKTtcbiAgICAgIGhpZGVBbGxUb3BNZW51aXRlbXMoKTtcbiAgICAgIGlmIChzaG93aW5nSGVscEtleXMpIHtcbiAgICAgICAgc2hvd2luZ0hlbHBLZXlzID0gZmFsc2U7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdjYWxsaW5nIGN5Y2xlRm9jdXMgaWknKVxuICAgICAgICBDUE8uY3ljbGVGb2N1cygpO1xuICAgICAgfVxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIC8vJCh0aGlzKS5jbG9zZXN0KCduYXYnKS5jbG9zZXN0KCdtYWluJykuZm9jdXMoKTtcbiAgICB9IGVsc2UgaWYgKGtjID09PSA5ICkge1xuICAgICAgaWYgKGUuc2hpZnRLZXkpIHtcbiAgICAgICAgaGlkZUFsbFRvcE1lbnVpdGVtcygpO1xuICAgICAgICBDUE8uY3ljbGVGb2N1cyh0cnVlKTtcbiAgICAgIH1cbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgfSBlbHNlIGlmIChrYyA9PT0gMTMgfHwga2MgPT09IDE3IHx8IGtjID09PSAyMCB8fCBrYyA9PT0gMzIpIHtcbiAgICAgIC8vIDEzPWVudGVyIDE3PWN0cmwgMjA9Y2Fwc2xvY2sgMzI9c3BhY2VcbiAgICAgIC8vY29uc29sZS5sb2coJ3N0b3Bwcm9wIDEnKVxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9IGVsc2UgaWYgKGtjID49IDExMiAmJiBrYyA8PSAxMjMpIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ2RvcHJvcCAxJylcbiAgICAgIC8vIGZuIGtleXNcbiAgICAgIC8vIGdvIGFoZWFkLCBwcm9wYWdhdGVcbiAgICB9IGVsc2UgaWYgKGUuY3RybEtleSAmJiBrYyA9PT0gMTkxKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdDLT8gcHJlc3NlZCcpXG4gICAgICBzaG93SGVscEtleXMoKTtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ3N0b3Bwcm9wIDInKVxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9XG4gICAgLy9lLnN0b3BQcm9wYWdhdGlvbigpO1xuICB9KTtcblxuICAvLyBzaGFyZUFQSS5tYWtlSG92ZXJNZW51KCQoXCIjZmlsZW1lbnVcIiksICQoXCIjZmlsZW1lbnVDb250ZW50c1wiKSwgZmFsc2UsIGZ1bmN0aW9uKCl7fSk7XG4gIC8vIHNoYXJlQVBJLm1ha2VIb3Zlck1lbnUoJChcIiNib25uaWVtZW51XCIpLCAkKFwiI2Jvbm5pZW1lbnVDb250ZW50c1wiKSwgZmFsc2UsIGZ1bmN0aW9uKCl7fSk7XG5cblxuICB2YXIgY29kZUNvbnRhaW5lciA9ICQoXCI8ZGl2PlwiKS5hZGRDbGFzcyhcInJlcGxNYWluXCIpO1xuICBjb2RlQ29udGFpbmVyLmF0dHIoXCJyb2xlXCIsIFwicmVnaW9uXCIpLlxuICAgIGF0dHIoXCJhcmlhLWxhYmVsXCIsIFwiRGVmaW5pdGlvbnNcIik7XG4gICAgLy9hdHRyKFwidGFiSW5kZXhcIiwgXCItMVwiKTtcbiAgJChcIiNtYWluXCIpLnByZXBlbmQoY29kZUNvbnRhaW5lcik7XG5cblxuICBpZihwYXJhbXNbXCJnZXRcIl1bXCJoaWRlRGVmaW5pdGlvbnNcIl0pIHtcbiAgICAkKFwiLnJlcGxNYWluXCIpLmF0dHIoXCJhcmlhLWhpZGRlblwiLCB0cnVlKS5hdHRyKFwidGFiaW5kZXhcIiwgJy0xJyk7XG4gIH1cbiAgXG4gIGNvbnN0IGlzQ29udHJvbGxlZCA9IHBhcmFtc1tcImdldFwiXVtcImNvbnRyb2xsZWRcIl07XG4gIGNvbnN0IGhhc1dhcm5PbkV4aXQgPSAoXCJ3YXJuT25FeGl0XCIgaW4gcGFyYW1zW1wiZ2V0XCJdKTtcbiAgY29uc3Qgc2tpcFdhcm5pbmcgPSBoYXNXYXJuT25FeGl0ICYmIChwYXJhbXNbXCJnZXRcIl1bXCJ3YXJuT25FeGl0XCJdID09PSBcImZhbHNlXCIpO1xuXG4gIGlmKCFpc0NvbnRyb2xsZWQgJiYgIXNraXBXYXJuaW5nKSB7XG4gICAgJCh3aW5kb3cpLmJpbmQoXCJiZWZvcmV1bmxvYWRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gXCJCZWNhdXNlIHRoaXMgcGFnZSBjYW4gbG9hZCBzbG93bHksIGFuZCB5b3UgbWF5IGhhdmUgb3V0c3RhbmRpbmcgY2hhbmdlcywgd2UgYXNrIHRoYXQgeW91IGNvbmZpcm0gYmVmb3JlIGxlYXZpbmcgdGhlIGVkaXRvciBpbiBjYXNlIGNsb3Npbmcgd2FzIGFuIGFjY2lkZW50LlwiO1xuICAgIH0pO1xuICB9XG5cbiAgQ1BPLmVkaXRvciA9IENQTy5tYWtlRWRpdG9yKGNvZGVDb250YWluZXIsIHtcbiAgICBydW5CdXR0b246ICQoXCIjcnVuQnV0dG9uXCIpLFxuICAgIHNpbXBsZUVkaXRvcjogZmFsc2UsXG4gICAgcnVuOiBDUE8uUlVOX0NPREUsXG4gICAgaW5pdGlhbEdhczogMTAwLFxuICAgIHNjcm9sbFBhc3RFbmQ6IHRydWUsXG4gIH0pO1xuICBDUE8uZWRpdG9yLmNtLnNldE9wdGlvbihcInJlYWRPbmx5XCIsIFwibm9jdXJzb3JcIik7XG4gIENQTy5lZGl0b3IuY20uc2V0T3B0aW9uKFwibG9uZ0xpbmVzXCIsIG5ldyBNYXAoKSk7XG4gIGZ1bmN0aW9uIHJlbW92ZVNob3J0ZW5lZExpbmUobGluZUhhbmRsZSkge1xuICAgIHZhciBydWxlcnMgPSBDUE8uZWRpdG9yLmNtLmdldE9wdGlvbihcInJ1bGVyc1wiKTtcbiAgICB2YXIgcnVsZXJzTWluQ29sID0gQ1BPLmVkaXRvci5jbS5nZXRPcHRpb24oXCJydWxlcnNNaW5Db2xcIik7XG4gICAgdmFyIGxvbmdMaW5lcyA9IENQTy5lZGl0b3IuY20uZ2V0T3B0aW9uKFwibG9uZ0xpbmVzXCIpO1xuICAgIGlmIChsaW5lSGFuZGxlLnRleHQubGVuZ3RoIDw9IHJ1bGVyc01pbkNvbCkge1xuICAgICAgbGluZUhhbmRsZS5ydWxlckxpc3RlbmVycy5mb3JFYWNoKChmLCBldnQpID0+IGxpbmVIYW5kbGUub2ZmKGV2dCwgZikpO1xuICAgICAgbG9uZ0xpbmVzLmRlbGV0ZShsaW5lSGFuZGxlKTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKFwiUmVtb3ZlZCBcIiwgbGluZUhhbmRsZSk7XG4gICAgICByZWZyZXNoUnVsZXJzKCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGRlbGV0ZUxpbmUobGluZUhhbmRsZSkge1xuICAgIHZhciBsb25nTGluZXMgPSBDUE8uZWRpdG9yLmNtLmdldE9wdGlvbihcImxvbmdMaW5lc1wiKTtcbiAgICBsaW5lSGFuZGxlLnJ1bGVyTGlzdGVuZXJzLmZvckVhY2goKGYsIGV2dCkgPT4gbGluZUhhbmRsZS5vZmYoZXZ0LCBmKSk7XG4gICAgbG9uZ0xpbmVzLmRlbGV0ZShsaW5lSGFuZGxlKTtcbiAgICAvLyBjb25zb2xlLmxvZyhcIlJlbW92ZWQgXCIsIGxpbmVIYW5kbGUpO1xuICAgIHJlZnJlc2hSdWxlcnMoKTtcbiAgfVxuICBmdW5jdGlvbiByZWZyZXNoUnVsZXJzKCkge1xuICAgIHZhciBydWxlcnMgPSBDUE8uZWRpdG9yLmNtLmdldE9wdGlvbihcInJ1bGVyc1wiKTtcbiAgICB2YXIgbG9uZ0xpbmVzID0gQ1BPLmVkaXRvci5jbS5nZXRPcHRpb24oXCJsb25nTGluZXNcIik7XG4gICAgdmFyIG1pbkxlbmd0aDtcbiAgICBpZiAobG9uZ0xpbmVzLnNpemUgPT09IDApIHtcbiAgICAgIG1pbkxlbmd0aCA9IDA7IC8vIGlmIHRoZXJlIGFyZSBubyBsb25nIGxpbmVzLCB0aGVuIHdlIGRvbid0IGNhcmUgYWJvdXQgc2hvd2luZyBhbnkgcnVsZXJzXG4gICAgfSBlbHNlIHtcbiAgICAgIG1pbkxlbmd0aCA9IE51bWJlci5NQVhfVkFMVUU7XG4gICAgICBsb25nTGluZXMuZm9yRWFjaChmdW5jdGlvbihsaW5lTm8sIGxpbmVIYW5kbGUpIHtcbiAgICAgICAgaWYgKGxpbmVIYW5kbGUudGV4dC5sZW5ndGggPCBtaW5MZW5ndGgpIHsgbWluTGVuZ3RoID0gbGluZUhhbmRsZS50ZXh0Lmxlbmd0aDsgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcnVsZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocnVsZXJzW2ldLmNvbHVtbiA+PSBtaW5MZW5ndGgpIHtcbiAgICAgICAgcnVsZXJzW2ldLmNsYXNzTmFtZSA9IFwiaGlkZGVuXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBydWxlcnNbaV0uY2xhc3NOYW1lID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBnb3R0YSBzZXQgdGhlIG9wdGlvbiB0d2ljZSwgb3IgZWxzZSBDTSBzaG9ydC1jaXJjdWl0cyBhbmQgaWdub3JlcyBpdFxuICAgIENQTy5lZGl0b3IuY20uc2V0T3B0aW9uKFwicnVsZXJzXCIsIHVuZGVmaW5lZCk7XG4gICAgQ1BPLmVkaXRvci5jbS5zZXRPcHRpb24oXCJydWxlcnNcIiwgcnVsZXJzKTtcbiAgfVxuICBDUE8uZWRpdG9yLmNtLm9uKCdjaGFuZ2VzJywgZnVuY3Rpb24oaW5zdGFuY2UsIGNoYW5nZU9ianMpIHtcbiAgICB2YXIgbWluTGluZSA9IGluc3RhbmNlLmxhc3RMaW5lKCksIG1heExpbmUgPSAwO1xuICAgIHZhciBydWxlcnNNaW5Db2wgPSBpbnN0YW5jZS5nZXRPcHRpb24oXCJydWxlcnNNaW5Db2xcIik7XG4gICAgdmFyIGxvbmdMaW5lcyA9IGluc3RhbmNlLmdldE9wdGlvbihcImxvbmdMaW5lc1wiKTtcbiAgICBjaGFuZ2VPYmpzLmZvckVhY2goZnVuY3Rpb24oY2hhbmdlKSB7XG4gICAgICBpZiAobWluTGluZSA+IGNoYW5nZS5mcm9tLmxpbmUpIHsgbWluTGluZSA9IGNoYW5nZS5mcm9tLmxpbmU7IH1cbiAgICAgIGlmIChtYXhMaW5lIDwgY2hhbmdlLmZyb20ubGluZSArIGNoYW5nZS50ZXh0Lmxlbmd0aCkgeyBtYXhMaW5lID0gY2hhbmdlLmZyb20ubGluZSArIGNoYW5nZS50ZXh0Lmxlbmd0aDsgfVxuICAgIH0pO1xuICAgIHZhciBjaGFuZ2VkID0gZmFsc2U7XG4gICAgaW5zdGFuY2UuZWFjaExpbmUobWluTGluZSwgbWF4TGluZSwgZnVuY3Rpb24obGluZUhhbmRsZSkge1xuICAgICAgaWYgKGxpbmVIYW5kbGUudGV4dC5sZW5ndGggPiBydWxlcnNNaW5Db2wpIHtcbiAgICAgICAgaWYgKCFsb25nTGluZXMuaGFzKGxpbmVIYW5kbGUpKSB7XG4gICAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgbG9uZ0xpbmVzLnNldChsaW5lSGFuZGxlLCBsaW5lSGFuZGxlLmxpbmVObygpKTtcbiAgICAgICAgICBsaW5lSGFuZGxlLnJ1bGVyTGlzdGVuZXJzID0gbmV3IE1hcChbXG4gICAgICAgICAgICBbXCJjaGFuZ2VcIiwgcmVtb3ZlU2hvcnRlbmVkTGluZV0sXG4gICAgICAgICAgICBbXCJkZWxldGVcIiwgZnVuY3Rpb24oKSB7IC8vIG5lZWRlZCBiZWNhdXNlIHRoZSBkZWxldGUgaGFuZGxlciBnZXRzIG5vIGFyZ3VtZW50cyBhdCBhbGxcbiAgICAgICAgICAgICAgZGVsZXRlTGluZShsaW5lSGFuZGxlKTtcbiAgICAgICAgICAgIH1dXG4gICAgICAgICAgXSk7XG4gICAgICAgICAgbGluZUhhbmRsZS5ydWxlckxpc3RlbmVycy5mb3JFYWNoKChmLCBldnQpID0+IGxpbmVIYW5kbGUub24oZXZ0LCBmKSk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coXCJBZGRlZCBcIiwgbGluZUhhbmRsZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChsb25nTGluZXMuaGFzKGxpbmVIYW5kbGUpKSB7XG4gICAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgbG9uZ0xpbmVzLmRlbGV0ZShsaW5lSGFuZGxlKTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIlJlbW92ZWQgXCIsIGxpbmVIYW5kbGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgIHJlZnJlc2hSdWxlcnMoKTtcbiAgICB9XG4gIH0pO1xuXG4gIHByb2dyYW1Mb2FkZWQudGhlbihmdW5jdGlvbihjKSB7XG4gICAgQ1BPLmRvY3VtZW50cy5zZXQoXCJkZWZpbml0aW9uczovL1wiLCBDUE8uZWRpdG9yLmNtLmdldERvYygpKTtcbiAgICBpZihjID09PSBcIlwiKSB7XG4gICAgICBjID0gQ09OVEVYVF9GT1JfTkVXX0ZJTEVTO1xuICAgIH1cblxuICAgIGlmIChjLnN0YXJ0c1dpdGgoXCI8c2NyaXB0c29ubHlcIikpIHtcbiAgICAgIC8vIHRoaXMgaXMgYmxvY2tzIGZpbGUuIE9wZW4gaXQgd2l0aCAvYmxvY2tzXG4gICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnJlcGxhY2UoJ2VkaXRvcicsICdibG9ja3MnKTtcbiAgICB9XG5cbiAgICBpZighcGFyYW1zW1wiZ2V0XCJdW1wiY29udHJvbGxlZFwiXSkge1xuICAgICAgLy8gTk9URShqb2UpOiBDbGVhcmluZyBoaXN0b3J5IHRvIGFkZHJlc3MgaHR0cHM6Ly9naXRodWIuY29tL2Jyb3ducGx0L3B5cmV0LWxhbmcvaXNzdWVzLzM4NixcbiAgICAgIC8vIGluIHdoaWNoIHVuZG8gY2FuIHJldmVydCB0aGUgcHJvZ3JhbSBiYWNrIHRvIGVtcHR5XG4gICAgICBDUE8uZWRpdG9yLmNtLnNldFZhbHVlKGMpO1xuICAgICAgQ1BPLmVkaXRvci5jbS5jbGVhckhpc3RvcnkoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBjb25zdCBoaWRlV2hlbkNvbnRyb2xsZWQgPSBbXG4gICAgICAgIFwiI2xvZ2dpbmdcIixcbiAgICAgICAgXCIjbG9nb3V0XCJcbiAgICAgIF07XG4gICAgICBjb25zdCByZW1vdmVXaGVuQ29udHJvbGxlZCA9IFtcbiAgICAgICAgXCIjY29ubmVjdEJ1dHRvbmxpXCIsXG4gICAgICBdO1xuICAgICAgaGlkZVdoZW5Db250cm9sbGVkLmZvckVhY2gocyA9PiAkKHMpLmhpZGUoKSk7XG4gICAgICByZW1vdmVXaGVuQ29udHJvbGxlZC5mb3JFYWNoKHMgPT4gJChzKS5yZW1vdmUoKSk7XG4gICAgfVxuXG4gICAgLy8gU3RhbmRhbG9uZSBib290IHNldHRsZXMgaGVyZTsgYSBob3N0LWZlZCBlZGl0b3Igc2V0dGxlcyBhdCB0aGUgZW5kIG9mXG4gICAgLy8gZXZlbnRzLmpzIHJlc2V0KCkgaW5zdGVhZCAoc2VlIEVYUEVDVFNfSE9TVF9SRVNFVCBhYm92ZSkuXG4gICAgaWYoIXdpbmRvdy5FWFBFQ1RTX0hPU1RfUkVTRVQpIHtcbiAgICAgIHdpbmRvdy5FRElUT1JfQ09OVEVOVFNfU0VUVExFRCA9IHRydWU7XG4gICAgfVxuXG4gIH0pO1xuXG4gIHByb2dyYW1Mb2FkZWQuZmFpbChmdW5jdGlvbihlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJQcm9ncmFtIGNvbnRlbnRzIGRpZCBub3QgbG9hZDogXCIsIGVycm9yKTtcbiAgICBDUE8uZG9jdW1lbnRzLnNldChcImRlZmluaXRpb25zOi8vXCIsIENQTy5lZGl0b3IuY20uZ2V0RG9jKCkpO1xuICB9KTtcblxuICBjb25zb2xlLmxvZyhcIkFib3V0IHRvIGxvYWQgUHlyZXQ6IFwiLCBvcmlnaW5hbFBhZ2VMb2FkLCBEYXRlLm5vdygpKTtcblxuICB2YXIgcHlyZXRMb2FkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gIGNvbnNvbGUubG9nKHdpbmRvdy5QWVJFVCk7XG4gIHB5cmV0TG9hZC50eXBlID0gXCJ0ZXh0L2phdmFzY3JpcHRcIjtcbiAgcHlyZXRMb2FkLnNldEF0dHJpYnV0ZShcImNyb3Nzb3JpZ2luXCIsIFwiYW5vbnltb3VzXCIpO1xuXG4gIHZhciBweXJldExvYWQyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cbiAgLypcbiAgICBGZXRjaCBhIC5nei5qcyBhc3NldCBhbmQgaGFuZCBiYWNrIGEgQmxvYiBvZiBydW5uYWJsZSBKYXZhU2NyaXB0LlxuXG4gICAgVGhvc2UgYXNzZXRzIGFyZSBnemlwIGJ5dGVzIGF0IHJlc3QsIGFuZCBob3N0cyBkaXNhZ3JlZSBhYm91dCBob3cgdG8gc2VydmVcbiAgICB0aGVtLiBBIHN0YXRpYyBvciB3ZWJ2aWV3IGhvc3Qgc2VuZHMgdGhlbSB2ZXJiYXRpbSAtLSB0aGF0IGlzIHRoZSB3aG9sZVxuICAgIHJlYXNvbiBQWVJFVF9HWklQUEVEIGV4aXN0cywgc2luY2Ugbm90aGluZyBpbmZsYXRlcyB0aGVtIGZvciB1cy4gQSBob3N0XG4gICAgdGhhdCBrbm93cyB0aGUgY29udmVudGlvbiAoY29kZS5weXJldC5vcmcncyBvd24gc2VydmVyIGhhcyBleHBsaWNpdCByb3V0ZXNcbiAgICBmb3IgZXhhY3RseSB0aGVzZSBmb3VyIGZpbGVzKSBzZW5kcyBDb250ZW50LUVuY29kaW5nOiBnemlwIGluc3RlYWQsIGFuZCBieVxuICAgIHRoZSB0aW1lIGZldGNoIHJlc29sdmVzIHRoZSBicm93c2VyIGhhcyBhbHJlYWR5IGluZmxhdGVkIHRoZSBib2R5LlxuICAgIEluZmxhdGluZyB1bmNvbmRpdGlvbmFsbHkgdHVybnMgdGhhdCBzZWNvbmQgY2FzZSBpbnRvIFwiRmFpbGVkIHRvIGZldGNoXCIsXG4gICAgd2hpY2ggaXMgd2hhdCBzZXJ2aW5nIGVkaXRvci5lbWJlZC5odG1sIGZyb20gdGhlIENQTyBzZXJ2ZXIgdXNlZCB0byBkby5cblxuICAgIFNvIGxvb2sgYXQgdGhlIGJ5dGVzIHJhdGhlciB0aGFuIHRydXN0aW5nIGVpdGhlciBjb252ZW50aW9uOiBhIGd6aXAgbWVtYmVyXG4gICAgc3RhcnRzIHdpdGggMHgxZiAweDhiLCBhbmQgSmF2YVNjcmlwdCBzb3VyY2UgZG9lcyBub3QuIEJ1ZmZlcmluZyB0aGUgYm9keVxuICAgIHRvIGNoZWNrIGNvc3RzIHRoZSBjb21wcmVzc2VkIHNpemUgKH4zTUIgZm9yIHRoZSBqYXJyKSBhbmQgZ2l2ZXMgdXBcbiAgICBvdmVybGFwcGluZyB0aGUgZG93bmxvYWQgd2l0aCB0aGUgaW5mbGF0ZTsgdGhhdCBpcyB3b3J0aCBiZWluZyBhYmxlIHRvXG4gICAgc2VydmUgdGhpcyBwYWdlIGZyb20gYW55IGhvc3QuXG4gICovXG4gIGZ1bmN0aW9uIGZldGNoU2NyaXB0QmxvYih1cmwpIHtcbiAgICByZXR1cm4gZmV0Y2godXJsKVxuICAgICAgLnRoZW4oZnVuY3Rpb24gKHJlc3ApIHtcbiAgICAgICAgaWYgKCFyZXNwLm9rKSB7IHRocm93IG5ldyBFcnJvcihcInN0YXR1cyBcIiArIHJlc3Auc3RhdHVzKTsgfVxuICAgICAgICByZXR1cm4gcmVzcC5hcnJheUJ1ZmZlcigpO1xuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChidWYpIHtcbiAgICAgICAgdmFyIGhlYWQgPSBuZXcgVWludDhBcnJheShidWYsIDAsIE1hdGgubWluKDIsIGJ1Zi5ieXRlTGVuZ3RoKSk7XG4gICAgICAgIGlmICghKGhlYWQubGVuZ3RoID09PSAyICYmIGhlYWRbMF0gPT09IDB4MWYgJiYgaGVhZFsxXSA9PT0gMHg4YikpIHtcbiAgICAgICAgICAvLyBBbHJlYWR5IHBsYWluIEphdmFTY3JpcHQ6IHRoaXMgaG9zdCBkZWNvZGVkIGl0IGZvciB1cy5cbiAgICAgICAgICByZXR1cm4gbmV3IEJsb2IoW2J1Zl0sIHsgdHlwZTogXCJhcHBsaWNhdGlvbi9qYXZhc2NyaXB0XCIgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShcbiAgICAgICAgICBuZXcgQmxvYihbYnVmXSkuc3RyZWFtKCkucGlwZVRocm91Z2gobmV3IERlY29tcHJlc3Npb25TdHJlYW0oXCJnemlwXCIpKVxuICAgICAgICApLmJsb2IoKTtcbiAgICAgIH0pO1xuICB9XG5cbiAgaWYgKHdpbmRvdy5QWVJFVF9HWklQUEVEKSB7XG4gICAgLy8gVGhlIHJ1bnRpbWUgYnVuZGxlIGlzIGd6aXBwZWQgYW5kIHRoaXMgaG9zdCBzZXJ2ZXMgaXQgV0lUSE9VVCBhblxuICAgIC8vIGV4ZWN1dGFibGUgTUlNRSB0eXBlIChlLmcuIGEgdnNjb2RlIHdlYnZpZXcgd2hvc2UgcmVzb3VyY2VzIGNvbWUgZnJvbVxuICAgIC8vIE9wZW4gVlNYIC8gdGhlIEdpdExhYiBXZWIgSURFKS4gZmV0Y2ggaWdub3JlcyBzY3JpcHQgTUlNRSwgc28gcHVsbCB0aGVcbiAgICAvLyAuZ3ouanMsIGluZmxhdGUgaXQgaW4tcGFnZSBpZiB0aGUgaG9zdCBoYXMgbm90IGFscmVhZHkgKHNlZVxuICAgIC8vIGZldGNoU2NyaXB0QmxvYiksIGFuZCBydW4gaXQgZnJvbSBhIEJsb2IgVVJMLiBUaGUgYGVycm9yYCBoYW5kbGVyXG4gICAgLy8gcmVnaXN0ZXJlZCBiZWxvdyAoc3luY2hyb25vdXNseSkgZmlyZXMgYmVmb3JlIHRoaXMgYXN5bmMgYXBwZW5kXG4gICAgLy8gcmVzb2x2ZXMuXG4gICAgLy9cbiAgICAvLyBJbiB0aGUgdHMgYW5kIGludGVycCBmbGF2b3JzIHRoZSBjb21waWxlciBidW5kbGUgaGFzIHRoZSBzYW1lIE1JTUVcbiAgICAvLyBwcm9ibGVtIChpdHMgPHNjcmlwdCBzcmM+IGluIGVkaXRvci5odG1sIGlzIHNraXBwZWQgdW5kZXJcbiAgICAvLyBQWVJFVF9HWklQUEVEKSBhbmQgaXMgdGhlIHNhbWUgZ3ppcC1hdC1yZXN0IGFzc2V0XG4gICAgLy8gKHRzLWNvbXBpbGVyLmd6LmpzKSAtLSBzbyBmZXRjaCBhbmQgQmxvYi1leGVjdXRlIGl0IEZJUlNUOiB0aGUgamFyclxuICAgIC8vIGV4cGVjdHMgd2luZG93LlB5cmV0VFNDb21waWxlciwgbWF0Y2hpbmcgdGhlIHN5bmNocm9ub3VzIHNjcmlwdCBvcmRlclxuICAgIC8vIG9mIHRoZSB1bi1nemlwcGVkIHBhZ2UuXG4gICAgdmFyIHRzQ29tcGlsZXJMb2FkID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgaWYgKHdpbmRvdy5DUE9fVVNFU19UU19BU1NFVFMgJiYgd2luZG93LlBZUkVUX1RTX0NPTVBJTEVSKSB7XG4gICAgICB0c0NvbXBpbGVyTG9hZCA9IGZldGNoU2NyaXB0QmxvYih3aW5kb3cuUFlSRVRfVFNfQ09NUElMRVIpXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uIChibG9iKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgIHZhciB0c0xvYWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgICAgIHRzTG9hZC5vbmxvYWQgPSByZXNvbHZlO1xuICAgICAgICAgICAgdHNMb2FkLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7IHJlamVjdChuZXcgRXJyb3IoXCJleGVjdXRpbmcgdHMtY29tcGlsZXIgYnVuZGxlIGZhaWxlZFwiKSk7IH07XG4gICAgICAgICAgICB0c0xvYWQuc3JjID0gVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbYmxvYl0sIHsgdHlwZTogXCJhcHBsaWNhdGlvbi9qYXZhc2NyaXB0XCIgfSkpO1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0c0xvYWQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgdHNDb21waWxlckxvYWRcbiAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGZldGNoU2NyaXB0QmxvYih3aW5kb3cuUFlSRVQpO1xuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uIChibG9iKSB7XG4gICAgICAgIHB5cmV0TG9hZC5zcmMgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtibG9iXSwgeyB0eXBlOiBcImFwcGxpY2F0aW9uL2phdmFzY3JpcHRcIiB9KSk7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocHlyZXRMb2FkKTtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgbG9nRmFpbHVyZUFuZE1hbnVhbEZldGNoKHdpbmRvdy5QWVJFVCwgZSk7XG4gICAgICAgIGxvYWRCYWNrdXBQeXJldChcImZldGNoaW5nL2RlY29tcHJlc3NpbmcgXCIgKyB3aW5kb3cuUFlSRVQgKyBcIiBmYWlsZWQ6IFwiICsgZS5tZXNzYWdlKTtcbiAgICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHB5cmV0TG9hZC5zcmMgPSB3aW5kb3cuUFlSRVQ7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChweXJldExvYWQpO1xuICB9XG5cbiAgLy8gVGhlIHBhZ2UncyB0ZXJtaW5hbCBzdGF0ZTogbmVpdGhlciB0aGUgcnVudGltZSBidW5kbGUgbm9yIGl0cyBiYWNrdXAgaXNcbiAgLy8gY29taW5nLiBBbG9uZ3NpZGUgdGhlIHVzZXItZmFjaW5nIGJhbm5lciwgc2F5IFdIWSBvbiB0aGUgY29uc29sZSAtLSBpbiBhXG4gIC8vIHZzY29kZSB3ZWJ2aWV3IHRoZXJlIGlzIG5vIGxvZ2dpbmcgc2VydmVyIGJlaGluZCBsb2dnZXIubG9nLCBzbyB0aGVcbiAgLy8gY29uc29sZSBsaW5lIGlzIHRoZSBvbmx5IGRpYWdub3N0aWMgdGhhdCBzdXJ2aXZlcyAoYW5kIHRoZSBicm93c2VyLXRlc3RcbiAgLy8gaGFybmVzcyBub3cgcmVjb3JkcyBpdCkuXG4gIGZ1bmN0aW9uIHRlcm1pbmFsUHlyZXRMb2FkRmFpbHVyZShkZXRhaWwpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiUHlyZXQgZmFpbGVkIHRvIGxvYWQ6IFwiICsgZGV0YWlsKTtcbiAgICAkKFwiI2xvYWRlclwiKS5oaWRlKCk7XG4gICAgJChcIiNydW5QYXJ0XCIpLmhpZGUoKTtcbiAgICAkKFwiI2JyZWFrQnV0dG9uXCIpLmhpZGUoKTtcbiAgICB3aW5kb3cuc3RpY2tFcnJvcihcIlB5cmV0IGZhaWxlZCB0byBsb2FkOyBjaGVjayB5b3VyIGNvbm5lY3Rpb24gb3IgdHJ5IHJlZnJlc2hpbmcgdGhlIHBhZ2UuICBJZiB0aGlzIGhhcHBlbnMgcmVwZWF0ZWRseSwgcGxlYXNlIHJlcG9ydCBpdCBhcyBhIGJ1Zy4gIChcIiArIGRldGFpbCArIFwiKVwiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxvYWRCYWNrdXBQeXJldChwcmltYXJ5RGV0YWlsKSB7XG4gICAgY29uc29sZS5lcnJvcihcIlB5cmV0IHJ1bnRpbWUgYnVuZGxlIGZhaWxlZCB0byBsb2FkOiBcIiArIHByaW1hcnlEZXRhaWwpO1xuICAgIC8vIEJ1aWxkcyB3aXRob3V0IGEgY29uZmlndXJlZCBQWVJFVF9CQUNLVVAgKHRoZSB2c2NvZGUgd2VidmlldywgYW55dGhpbmdcbiAgICAvLyBidWlsdCB3aXRob3V0IHRoZSBlbnYgdmFyKSB1c2VkIHRvIGFzc2lnbiBpdCBhbnl3YXksIHNvIHRoZSBicm93c2VyXG4gICAgLy8gcmVxdWVzdGVkIGEgbGl0ZXJhbCBcInVuZGVmaW5lZFwiIC0tIGFuIGluc3RhbnQgNDA0IHdob3NlIGVycm9yIGV2ZW50XG4gICAgLy8gcmVwbGFjZWQgdGhlIHByaW1hcnkgZmFpbHVyZSdzIHN0b3J5LiBObyBiYWNrdXA6IGdvIHN0cmFpZ2h0IHRvIHRoZVxuICAgIC8vIHRlcm1pbmFsIHN0YXRlLCBjYXJyeWluZyB0aGUgcmVhc29uIHRoZSBwcmltYXJ5IGRpZWQuXG4gICAgaWYgKHByb2Nlc3MuZW52LlBZUkVUX0JBQ0tVUCkge1xuICAgICAgcHlyZXRMb2FkMi5zcmMgPSBwcm9jZXNzLmVudi5QWVJFVF9CQUNLVVA7XG4gICAgICBweXJldExvYWQyLnR5cGUgPSBcInRleHQvamF2YXNjcmlwdFwiO1xuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChweXJldExvYWQyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGVybWluYWxQeXJldExvYWRGYWlsdXJlKHByaW1hcnlEZXRhaWwpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGxvZ0ZhaWx1cmVBbmRNYW51YWxGZXRjaCh1cmwsIGUpIHtcblxuICAgIC8vIE5PVEUoam9lKTogVGhlIGVycm9yIHJlcG9ydGVkIGJ5IHRoZSBcImVycm9yXCIgZXZlbnQgaGFzIGVzc2VudGlhbGx5IG5vXG4gICAgLy8gaW5mb3JtYXRpb24gb24gaXQ7IGl0J3MganVzdCBhIG5vdGlmaWNhdGlvbiB0aGF0IF9zb21ldGhpbmdfIHdlbnQgd3JvbmcuXG4gICAgLy8gU28sIHdlIGxvZyB0aGF0IHNvbWV0aGluZyBoYXBwZW5lZCwgdGhlbiBpbW1lZGlhdGVseSBkbyBhbiBBSkFYIHJlcXVlc3RcbiAgICAvLyBjYWxsIGZvciB0aGUgc2FtZSBVUkwsIHRvIHNlZSBpZiB3ZSBjYW4gZ2V0IG1vcmUgaW5mb3JtYXRpb24uIFRoaXNcbiAgICAvLyBkb2Vzbid0IHBlcmZlY3RseSB0ZWxsIHVzIGFib3V0IHRoZSBvcmlnaW5hbCBmYWlsdXJlLCBidXQgaXQnc1xuICAgIC8vIHNvbWV0aGluZy5cblxuICAgIC8vIEluIGFkZGl0aW9uLCBpZiBzb21lb25lIGlzIHNlZWluZyB0aGUgUHlyZXQgZmFpbGVkIHRvIGxvYWQgZXJyb3IsIGJ1dCB3ZVxuICAgIC8vIGRvbid0IGdldCB0aGVzZSBsb2dnaW5nIGV2ZW50cywgd2UgaGF2ZSBhIHN0cm9uZyBoaW50IHRoYXQgc29tZXRoaW5nIGlzXG4gICAgLy8gdXAgd2l0aCB0aGVpciBuZXR3b3JrLlxuICAgIGxvZ2dlci5sb2coJ3B5cmV0LWxvYWQtZmFpbHVyZScsXG4gICAgICB7XG4gICAgICAgIGV2ZW50IDogJ2luaXRpYWwtZmFpbHVyZScsXG4gICAgICAgIHVybCA6IHVybCxcblxuICAgICAgICAvLyBUaGUgdGltZXN0YW1wIGFwcGVhcnMgdG8gY291bnQgZnJvbSB0aGUgYmVnaW5uaW5nIG9mIHBhZ2UgbG9hZCxcbiAgICAgICAgLy8gd2hpY2ggbWF5IGFwcHJveGltYXRlIGRvd25sb2FkIHRpbWUgaWYsIHNheSwgcmVxdWVzdHMgYXJlIHRpbWluZyBvdXRcbiAgICAgICAgLy8gb3IgZ2V0dGluZyBjdXQgb2ZmLlxuXG4gICAgICAgIHRpbWVTdGFtcCA6IGUudGltZVN0YW1wXG4gICAgICB9KTtcblxuICAgIHZhciBtYW51YWxGZXRjaCA9ICQuYWpheCh1cmwpO1xuICAgIG1hbnVhbEZldGNoLnRoZW4oZnVuY3Rpb24ocmVzKSB7XG4gICAgICAvLyBIZXJlLCB3ZSBsb2cgdGhlIGZpcnN0IDEwMCBjaGFyYWN0ZXJzIG9mIHRoZSByZXNwb25zZSB0byBtYWtlIHN1cmVcbiAgICAgIC8vIHRoZXkgcmVzZW1ibGUgdGhlIFB5cmV0IGJsb2JcbiAgICAgIGxvZ2dlci5sb2coJ3B5cmV0LWxvYWQtZmFpbHVyZScsIHtcbiAgICAgICAgZXZlbnQgOiAnc3VjY2Vzcy13aXRoLWFqYXgnLFxuICAgICAgICBjb250ZW50c1ByZWZpeCA6IHJlcy5zbGljZSgwLCAxMDApXG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBtYW51YWxGZXRjaC5mYWlsKGZ1bmN0aW9uKHJlcykge1xuICAgICAgbG9nZ2VyLmxvZygncHlyZXQtbG9hZC1mYWlsdXJlJywge1xuICAgICAgICBldmVudCA6ICdmYWlsdXJlLXdpdGgtYWpheCcsXG4gICAgICAgIHN0YXR1czogcmVzLnN0YXR1cyxcbiAgICAgICAgc3RhdHVzVGV4dDogcmVzLnN0YXR1c1RleHQsXG4gICAgICAgIC8vIFNpbmNlIHJlc3BvbnNlVGV4dCBjb3VsZCBiZSBhIGxvbmcgZXJyb3IgcGFnZSwgYW5kIHdlIGRvbid0IHdhbnQgdG9cbiAgICAgICAgLy8gbG9nIGh1Z2UgcGFnZXMsIHdlIHNsaWNlIGl0IHRvIDEwMCBjaGFyYWN0ZXJzLCB3aGljaCBpcyBlbm91Z2ggdG9cbiAgICAgICAgLy8gdGVsbCB1cyB3aGF0J3MgZ29pbmcgb24gKGUuZy4gQVdTIGZhaWx1cmUsIG5ldHdvcmsgb3V0YWdlKS5cbiAgICAgICAgcmVzcG9uc2VUZXh0OiByZXMucmVzcG9uc2VUZXh0LnNsaWNlKDAsIDEwMClcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgJChweXJldExvYWQpLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24oZSkge1xuICAgIGxvZ0ZhaWx1cmVBbmRNYW51YWxGZXRjaCh3aW5kb3cuUFlSRVQsIGUpO1xuICAgIGxvYWRCYWNrdXBQeXJldChcInRoZSBzY3JpcHQgdGFnIGZvciBcIiArIHdpbmRvdy5QWVJFVCArIFwiIGZpcmVkIGl0cyBlcnJvciBldmVudFwiKTtcbiAgfSk7XG5cbiAgJChweXJldExvYWQyKS5vbihcImVycm9yXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICB0ZXJtaW5hbFB5cmV0TG9hZEZhaWx1cmUoXCJ0aGUgYmFja3VwIGJ1bmRsZSBcIiArIHByb2Nlc3MuZW52LlBZUkVUX0JBQ0tVUCArIFwiIGFsc28gZmFpbGVkXCIpO1xuICAgIGxvZ0ZhaWx1cmVBbmRNYW51YWxGZXRjaChwcm9jZXNzLmVudi5QWVJFVF9CQUNLVVAsIGUpO1xuICB9KTtcblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImZvY3VzXCIsIChlKSA9PiB7XG4gICAgaWYoYWN0aXZlRWRpdG9yKSB7IGFjdGl2ZUVkaXRvci5mb2N1cygpOyB9XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIG1ha2VFdmVudCgpIHtcbiAgICBjb25zdCBoYW5kbGVycyA9IFtdO1xuICAgIGZ1bmN0aW9uIG9uKGhhbmRsZXIpIHtcbiAgICAgIGhhbmRsZXJzLnB1c2goaGFuZGxlcik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRyaWdnZXIodikge1xuICAgICAgaGFuZGxlcnMuZm9yRWFjaChoID0+IGgodikpO1xuICAgIH1cbiAgICByZXR1cm4gW29uLCB0cmlnZ2VyXTtcbiAgfVxuICBsZXQgWyBvblJ1biwgdHJpZ2dlck9uUnVuIF0gPSBtYWtlRXZlbnQoKTtcbiAgbGV0IFsgb25JbnRlcmFjdGlvbiwgdHJpZ2dlck9uSW50ZXJhY3Rpb24gXSA9IG1ha2VFdmVudCgpO1xuICBsZXQgWyBvbkxvYWQsIHRyaWdnZXJPbkxvYWQgXSA9IG1ha2VFdmVudCgpO1xuXG4gIHByb2dyYW1Mb2FkZWQuZmluKGZ1bmN0aW9uKCkge1xuICAgIENQTy5lZGl0b3IuZm9jdXMoKTtcbiAgICBDUE8uZWRpdG9yLmNtLnNldE9wdGlvbihcInJlYWRPbmx5XCIsIGZhbHNlKTtcbiAgfSk7XG5cbiAgQ1BPLmF1dG9TYXZlID0gYXV0b1NhdmU7XG4gIENQTy5zYXZlID0gc2F2ZTtcbiAgQ1BPLnVwZGF0ZU5hbWUgPSB1cGRhdGVOYW1lO1xuICBDUE8uc2hvd1NoYXJlQ29udGFpbmVyID0gc2hvd1NoYXJlQ29udGFpbmVyO1xuICBDUE8ubG9hZFByb2dyYW0gPSBsb2FkUHJvZ3JhbTtcbiAgQ1BPLnN0b3JhZ2VBUEkgPSBzdG9yYWdlQVBJO1xuICBDUE8uY3ljbGVGb2N1cyA9IGN5Y2xlRm9jdXM7XG4gIENQTy5zYXkgPSBzYXk7XG4gIENQTy5zYXlBbmRGb3JnZXQgPSBzYXlBbmRGb3JnZXQ7XG4gIENQTy5ldmVudHMgPSB7XG4gICAgb25SdW4sXG4gICAgdHJpZ2dlck9uUnVuLFxuICAgIG9uSW50ZXJhY3Rpb24sXG4gICAgdHJpZ2dlck9uSW50ZXJhY3Rpb24sXG4gICAgb25Mb2FkLFxuICAgIHRyaWdnZXJPbkxvYWRcbiAgfTtcblxuICAvLyBXZSBuZXZlciB3YW50IGludGVyYWN0aW9ucyB0byBiZSBoaWRkZW4gKndoZW4gcnVubmluZyBjb2RlKi5cbiAgLy8gU28gaGlkZUludGVyYWN0aW9ucyBzaG91bGQgZ28gYXdheSBhcyBzb29uIGFzIHJ1biBpcyBjbGlja2VkXG4gIENQTy5ldmVudHMub25SdW4oKCkgPT4geyBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRlSW50ZXJhY3Rpb25zXCIpOyB9KTtcblxuICBsZXQgaW5pdGlhbFN0YXRlID0gcGFyYW1zW1wiZ2V0XCJdW1wiaW5pdGlhbFN0YXRlXCJdO1xuXG4gIHdpbmRvdy5QWVJFVF9JU19FTUJFRERFRCA9IGZhbHNlO1xuICB3aW5kb3cuUFlSRVRfSU5fVlNDT0RFID0gZmFsc2U7XG4gIGlmICh0eXBlb2YgYWNxdWlyZVZzQ29kZUFwaSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgd2luZG93Lk1FU1NBR0VTID0gbWFrZUV2ZW50cyh7XG4gICAgICBDUE86IENQTyxcbiAgICAgIHNlbmRQb3J0OiBhY3F1aXJlVnNDb2RlQXBpKCksXG4gICAgICByZWNlaXZlUG9ydDogd2luZG93LFxuICAgICAgaW5pdGlhbFN0YXRlXG4gICAgfSk7XG4gICAgd2luZG93LlBZUkVUX0lTX0VNQkVEREVEID0gdHJ1ZTtcbiAgICB3aW5kb3cuUFlSRVRfSU5fVlNDT0RFID0gdHJ1ZTtcbiAgfVxuICBlbHNlIGlmKCh3aW5kb3cucGFyZW50ICYmICh3aW5kb3cucGFyZW50ICE9PSB3aW5kb3cpKSkge1xuICAgIHdpbmRvdy5NRVNTQUdFUyA9IG1ha2VFdmVudHMoeyBDUE86IENQTywgc2VuZFBvcnQ6IHdpbmRvdy5wYXJlbnQsIHJlY2VpdmVQb3J0OiB3aW5kb3csIGluaXRpYWxTdGF0ZSB9KTtcbiAgICB3aW5kb3cuUFlSRVRfSVNfRU1CRURERUQgPSB0cnVlO1xuICB9XG59KTtcbiJdLCJuYW1lcyI6WyJkZWZpbmUiLCJRIiwiYXV0b0hpZ2hsaWdodEJveCIsInRleHQiLCJ0ZXh0Qm94IiwiJCIsImFkZENsYXNzIiwiYXR0ciIsIm9uIiwic2VsZWN0IiwidmFsIiwicHJvbXB0UXVldWUiLCJzdHlsZXMiLCJ3aW5kb3ciLCJtb2RhbHMiLCJQcm9tcHQiLCJvcHRpb25zIiwicHVzaCIsImluZGV4T2YiLCJzdHlsZSIsImxlbmd0aCIsIkVycm9yIiwibW9kYWwiLCJlbHRzIiwicGFyc2VIVE1MIiwidGl0bGUiLCJtb2RhbENvbnRlbnQiLCJjbG9zZUJ1dHRvbiIsInN1Ym1pdEJ1dHRvbiIsInN1Ym1pdFRleHQiLCJjYW5jZWxUZXh0IiwidG9nZ2xlQ2xhc3MiLCJuYXJyb3ciLCJpc0NvbXBpbGVkIiwiZGVmZXJyZWQiLCJkZWZlciIsInByb21pc2UiLCJwcm90b3R5cGUiLCJzaG93IiwiY2FsbGJhY2siLCJoaWRlU3VibWl0IiwiaGlkZSIsImNsaWNrIiwib25DbG9zZSIsImJpbmQiLCJrZXlwcmVzcyIsImUiLCJ3aGljaCIsIm9uU3VibWl0IiwiZG9jQ2xpY2siLCJ0YXJnZXQiLCJpcyIsImRvY3VtZW50Iiwib2ZmIiwiZG9jS2V5ZG93biIsImtleSIsImtleWRvd24iLCJwb3B1bGF0ZU1vZGFsIiwiY3NzIiwiZm9jdXMiLCJ0aGVuIiwiY2xlYXJNb2RhbCIsImVtcHR5IiwiY3JlYXRlUmFkaW9FbHQiLCJvcHRpb24iLCJpZHgiLCJlbHQiLCJpZCIsInRvU3RyaW5nIiwibGFiZWwiLCJ2YWx1ZSIsIm1lc3NhZ2UiLCJlbHRDb250YWluZXIiLCJhcHBlbmQiLCJsYWJlbENvbnRhaW5lciIsImNvbnRhaW5lciIsImV4YW1wbGUiLCJjbSIsIkNvZGVNaXJyb3IiLCJtb2RlIiwibGluZU51bWJlcnMiLCJyZWFkT25seSIsInNldFRpbWVvdXQiLCJyZWZyZXNoIiwiZXhhbXBsZUNvbnRhaW5lciIsImNyZWF0ZVRpbGVFbHQiLCJkZXRhaWxzIiwiZXZ0IiwiY3JlYXRlVGV4dEVsdCIsImlucHV0IiwiZGVmYXVsdFZhbHVlIiwiZHJhd0VsZW1lbnQiLCJjcmVhdGVDb3B5VGV4dEVsdCIsImJveCIsImNyZWF0ZUNvbmZpcm1FbHQiLCJ0aGF0IiwiY3JlYXRlRWx0IiwiaSIsIm9wdGlvbkVsdHMiLCJtYXAiLCJyZXNvbHZlIiwicmV0dmFsIiwib3JpZ2luYWxQYWdlTG9hZCIsIkRhdGUiLCJub3ciLCJjb25zb2xlIiwibG9nIiwiU0hBUkVVUkxfUFJPWFlfSE9TVFMiLCJTZXQiLCJTSEFSRVVSTF9ESVJFQ1RfVElNRU9VVF9NUyIsIl9vcmlnRmV0Y2giLCJmZXRjaCIsIl9zaGFyZXVybFNob3VsZFByb3h5IiwiTWFwIiwiX3NoYXJldXJsU2hvdWxkUHJveHlJbmZsaWdodCIsIl9zaGFyZXVybFByb3h5VXJsIiwiZmV0Y2hJbnB1dCIsImVuY29kZVVSSUNvbXBvbmVudCIsIl9zaGFyZXVybElucHV0VG9VcmwiLCJSZXF1ZXN0IiwidXJsIiwiU3RyaW5nIiwiX3NoYXJldXJsVmVyaWZ5RGlyZWN0IiwiciIsIm9rIiwiY3QiLCJoZWFkZXJzIiwiZ2V0IiwidG9Mb3dlckNhc2UiLCJzdGFydHNXaXRoIiwiX3NoYXJldXJsRmV0Y2giLCJzaG91bGRQcm94eSIsImZldGNoSW5pdCIsIm1heWJlUHJveHlJbnB1dCIsIl9zaGFyZXVybFJhY2UiLCJwcm94eUN0cmwiLCJBYm9ydENvbnRyb2xsZXIiLCJwcm94eVAiLCJPYmplY3QiLCJhc3NpZ24iLCJzaWduYWwiLCJkaXJlY3RQIiwic2hvdWxkUHJveHlQcm9taXNlIiwiUHJvbWlzZSIsInJhY2UiLCJkaXJlY3RGaW5pc2hlZFN1Y2Nlc3NmdWxseUFuZEZpcnN0UCIsImRpcmVjdEZpcnN0IiwiYWJvcnQiLCJyZXNwb25zZVByb21pc2UiLCJhbnkiLCJfc2hhcmV1cmxSZXNwb25zZSIsImFnZ0VyciIsInByb3h5RXJyIiwiZXJyb3JzIiwicmVqZWN0IiwiaG9zdCIsIlVSTCIsImxvY2F0aW9uIiwiaHJlZiIsImhvc3RuYW1lIiwiXyIsImhhcyIsImluZmxpZ2h0IiwidW5kZWZpbmVkIiwic3AiLCJfc2hhcmV1cmxSYWNlMiIsInNldCIsImlzRW1iZWRkZWQiLCJwYXJlbnQiLCJzaGFyZUFQSSIsIm1ha2VTaGFyZUFQSSIsInByb2Nlc3MiLCJlbnYiLCJDVVJSRU5UX1BZUkVUX1JFTEVBU0UiLCJyZXF1aXJlIiwibW9kYWxQcm9tcHQiLCJMT0ciLCJjdF9sb2ciLCJhcHBseSIsImFyZ3VtZW50cyIsImN0X2Vycm9yIiwiZXJyb3IiLCJpbml0aWFsUGFyYW1zIiwicGFyc2UiLCJwYXJhbXMiLCJFWFBFQ1RTX0hPU1RfUkVTRVQiLCJoaWdobGlnaHRNb2RlIiwiY2xlYXJGbGFzaCIsIndoaXRlVG9CbGFja05vdGlmaWNhdGlvbiIsInN0aWNrRXJyb3IiLCJtb3JlIiwiQ1BPIiwic2F5QW5kRm9yZ2V0IiwiZXJyIiwidG9vbHRpcCIsInByZXBlbmQiLCJmbGFzaEVycm9yIiwiZmFkZU91dCIsImZsYXNoTWVzc2FnZSIsIm1zZyIsInN0aWNrTWVzc2FnZSIsInN0aWNrUmljaE1lc3NhZ2UiLCJjb250ZW50IiwibWtXYXJuaW5nVXBwZXIiLCJta1dhcm5pbmdMb3dlciIsIkRvY3VtZW50cyIsImRvY3VtZW50cyIsIm5hbWUiLCJkb2MiLCJsb2dnZXIiLCJpc0RldGFpbGVkIiwiZ2V0VmFsdWUiLCJmb3JFYWNoIiwiZiIsIlZFUlNJT05fQ0hFQ0tfSU5URVJWQUwiLCJNYXRoIiwicmFuZG9tIiwiY2hlY2tWZXJzaW9uIiwicmVzcCIsIkpTT04iLCJ2ZXJzaW9uIiwic2V0SW50ZXJ2YWwiLCJzYXZlIiwiYXV0b1NhdmUiLCJDT05URVhUX0ZPUl9ORVdfRklMRVMiLCJDT05URVhUX1BSRUZJWCIsIm1lcmdlIiwib2JqIiwiZXh0ZW5zaW9uIiwibmV3b2JqIiwia2V5cyIsImsiLCJhbmltYXRpb25EaXYiLCJjbG9zZUFuaW1hdGlvbklmT3BlbiIsImRpYWxvZyIsImFjdGl2ZUVkaXRvciIsIm1ha2VFZGl0b3IiLCJpbml0aWFsIiwiaGFzT3duUHJvcGVydHkiLCJ0ZXh0YXJlYSIsImpRdWVyeSIsInJ1bkZ1biIsImNvZGUiLCJyZXBsT3B0aW9ucyIsInJ1biIsIkNNIiwidXNlTGluZU51bWJlcnMiLCJzaW1wbGVFZGl0b3IiLCJ1c2VGb2xkaW5nIiwiZ3V0dGVycyIsInJlaW5kZW50QWxsTGluZXMiLCJsYXN0IiwibGluZUNvdW50Iiwib3BlcmF0aW9uIiwiaW5kZW50TGluZSIsIkNPREVfTElORV9XSURUSCIsInJ1bGVycyIsInJ1bGVyc01pbkNvbCIsImNvbG9yIiwiY29sdW1uIiwibGluZVN0eWxlIiwiY2xhc3NOYW1lIiwibWFjIiwia2V5TWFwIiwibWFjRGVmYXVsdCIsIm1vZGlmaWVyIiwiZXh0cmFLZXlzIiwiX2RlZmluZVByb3BlcnR5IiwiU2hpZnRFbnRlciIsIlNoaWZ0Q3RybEVudGVyIiwiY29uY2F0IiwiUFlSRVRfSU5fVlNDT0RFIiwiY21PcHRpb25zIiwibm9ybWFsaXplS2V5TWFwIiwiaW5kZW50VW5pdCIsInRhYlNpemUiLCJ2aWV3cG9ydE1hcmdpbiIsIkluZmluaXR5IiwibWF0Y2hLZXl3b3JkcyIsIm1hdGNoQnJhY2tldHMiLCJzdHlsZVNlbGVjdGVkVGV4dCIsImZvbGRHdXR0ZXIiLCJsaW5lV3JhcHBpbmciLCJsb2dnaW5nIiwic2Nyb2xsUGFzdEVuZCIsImZyb21UZXh0QXJlYSIsImZpcnN0TGluZUlzTmFtZXNwYWNlIiwiZmlyc3RsaW5lIiwiZ2V0TGluZSIsIm1hdGNoIiwibmFtZXNwYWNlbWFyayIsInNldENvbnRleHRMaW5lIiwibmV3Q29udGV4dExpbmUiLCJoYXNOYW1lc3BhY2UiLCJjbGVhciIsInJlcGxhY2VSYW5nZSIsImxpbmUiLCJjaCIsImd1dHRlclF1ZXN0aW9uV3JhcHBlciIsImNyZWF0ZUVsZW1lbnQiLCJndXR0ZXJUb29sdGlwIiwiaW5uZXJUZXh0IiwiZ3V0dGVyUXVlc3Rpb24iLCJzcmMiLCJBUFBfQkFTRV9VUkwiLCJhcHBlbmRDaGlsZCIsInNldEd1dHRlck1hcmtlciIsImdldFdyYXBwZXJFbGVtZW50Iiwib25tb3VzZWxlYXZlIiwiY2xlYXJHdXR0ZXIiLCJvbm1vdXNlbW92ZSIsImxpbmVDaCIsImNvb3Jkc0NoYXIiLCJsZWZ0IiwiY2xpZW50WCIsInRvcCIsImNsaWVudFkiLCJtYXJrZXJzIiwiZmluZE1hcmtzQXQiLCJjaGFuZ2UiLCJkb2VzTm90Q2hhbmdlRmlyc3RMaW5lIiwiYyIsImZyb20iLCJjdXJPcCIsImNoYW5nZU9ianMiLCJldmVyeSIsIm1hcmtUZXh0IiwiYXR0cmlidXRlcyIsInVzZWxpbmUiLCJhdG9taWMiLCJpbmNsdXNpdmVMZWZ0IiwiaW5jbHVzaXZlUmlnaHQiLCJkaXNwbGF5Iiwid3JhcHBlciIsImdldFRvcFRpZXJNZW51aXRlbXMiLCJmb2N1c0Nhcm91c2VsIiwiUlVOX0NPREUiLCJzZXRVc2VybmFtZSIsInRva2VuIiwiZ2FwaSIsImF1dGgiLCJnZXRUb2tlbiIsImFjY2Vzc190b2tlbiIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwiaW5mbyIsImVtYWlsIiwic3RvcmFnZUFQSSIsImFwaSIsImNvbGxlY3Rpb24iLCJmYWlsIiwiY3JlYXRlUHJvZ3JhbUNvbGxlY3Rpb25BUEkiLCJBUFBfTkFNRSIsImFjdGl2ZUVsZW1lbnQiLCJibHVyIiwidG9Mb2FkIiwiZ2V0RmlsZUJ5SWQiLCJsb2FkUHJvZ3JhbSIsInByb2dyYW1Ub1NhdmUiLCJmY2FsbCIsImluaXRpYWxQcm9ncmFtIiwibWFrZVVybEZpbGUiLCJwcm9ncmFtTG9hZCIsImVuYWJsZUZpbGVPcHRpb25zIiwicCIsInNob3dTaGFyZUNvbnRhaW5lciIsImdldFNoYXJlZEZpbGVCeUlkIiwiZmlsZSIsImdldE9yaWdpbmFsIiwicmVzcG9uc2UiLCJvcmlnaW5hbCIsInJlc3VsdCIsInJlbW92ZUNsYXNzIiwib3BlbiIsInNldFRpdGxlIiwicHJvZ05hbWUiLCJmaWxlbmFtZSIsImRvd25sb2FkRWx0IiwiY29udGVudHMiLCJlZGl0b3IiLCJkb3dubG9hZEJsb2IiLCJjcmVhdGVPYmplY3RVUkwiLCJCbG9iIiwidHlwZSIsImRvd25sb2FkIiwic2hvd01vZGFsIiwiY3VycmVudENvbnRleHQiLCJlbGVtZW50IiwiZ3JlZXRpbmciLCJzaGFyZWQiLCJjdXJyZW50Q29udGV4dEVsdCIsImVzc2VudGlhbHMiLCJsaXN0IiwidXNlQ29udGV4dCIsImlucHV0V3JhcHBlciIsImVudHJ5IiwibmFtZXNwYWNlUmVzdWx0IiwidHJpbSIsImZpcnN0TGluZSIsImNvbnRleHRMZW4iLCJzbGljZSIsIlRSVU5DQVRFX0xFTkdUSCIsInRydW5jYXRlTmFtZSIsInVwZGF0ZU5hbWUiLCJnZXROYW1lIiwicHJvZyIsImdldENvbnRlbnRzIiwic2F5IiwiZm9yZ2V0IiwiYW5ub3VuY2VtZW50cyIsImdldEVsZW1lbnRCeUlkIiwibGkiLCJjcmVhdGVUZXh0Tm9kZSIsImluc2VydEJlZm9yZSIsImZpcnN0Q2hpbGQiLCJyZW1vdmVDaGlsZCIsImN5Y2xlQWR2YW5jZSIsImN1cnJJbmRleCIsIm1heEluZGV4IiwicmV2ZXJzZVAiLCJuZXh0SW5kZXgiLCJwb3B1bGF0ZUZvY3VzQ2Fyb3VzZWwiLCJmYyIsImRvY21haW4iLCJ0b29sYmFyIiwiZG9jcmVwbE1haW4iLCJnZXRFbGVtZW50c0J5Q2xhc3NOYW1lIiwiZG9jcmVwbE1haW4wIiwiZG9jcmVwbCIsImRvY3JlcGxjb2RlIiwiY3ljbGVGb2N1cyIsImZDYXJvdXNlbCIsImN1cnJlbnRGb2N1c2VkRWx0IiwiZmluZCIsIm5vZGUiLCJjb250YWlucyIsImN1cnJlbnRGb2N1c0luZGV4IiwibmV4dEZvY3VzSW5kZXgiLCJmb2N1c0VsdCIsImZvY3VzRWx0MCIsImNsYXNzTGlzdCIsInRleHRhcmVhcyIsImdldEVsZW1lbnRzQnlUYWdOYW1lIiwicmVtb3ZlQXR0cmlidXRlIiwicHJvZ3JhbUxvYWRlZCIsIm1ha2VTaGFyZUxpbmsiLCJuYW1lT3JVbnRpdGxlZCIsIm1lbnVJdGVtRGlzYWJsZWQiLCJoYXNDbGFzcyIsIm5ld0V2ZW50Iiwic2F2ZUV2ZW50IiwibmV3RmlsZW5hbWUiLCJ1c2VOYW1lIiwiY3JlYXRlIiwic2F2ZWRQcm9ncmFtIiwiY3JlYXRlRmlsZSIsImhpc3RvcnkiLCJwdXNoU3RhdGUiLCJnZXRVbmlxdWVJZCIsInNhdmVBcyIsInNhdmVBc1Byb21wdCIsIm5ld05hbWUiLCJyZW5hbWUiLCJyZW5hbWVQcm9tcHQiLCJmb2N1c2FibGVFbHRzIiwidGhlVG9vbGJhciIsInRvcFRpZXJNZW51aXRlbXMiLCJ0b0FycmF5IiwiZmlsdGVyIiwiZ2V0QXR0cmlidXRlIiwibnVtVG9wVGllck1lbnVpdGVtcyIsIml0aFRvcFRpZXJNZW51aXRlbSIsImlDaGlsZCIsImNoaWxkcmVuIiwiZmlyc3QiLCJ1cGRhdGVFZGl0b3JIZWlnaHQiLCJ0b29sYmFySGVpZ2h0Iiwib2Zmc2V0SGVpZ2h0IiwicGFkZGluZ1RvcCIsImRvY01haW4iLCJkb2NSZXBsTWFpbiIsImluc2VydEFyaWFQb3MiLCJzdWJtZW51IiwiYXJyIiwibGVuIiwic2V0QXR0cmlidXRlIiwiYWRkRXZlbnRMaXN0ZW5lciIsImhpZGVBbGxUb3BNZW51aXRlbXMiLCJzdG9wUHJvcGFnYXRpb24iLCJrYyIsImtleUNvZGUiLCJjbGlja1RvcE1lbnVpdGVtIiwidGhpc0VsdCIsInRvcFRpZXJVbCIsImNsb3Nlc3QiLCJoYXNBdHRyaWJ1dGUiLCJ0aGlzVG9wTWVudWl0ZW0iLCJ0MSIsInN1Ym1lbnVPcGVuIiwiZXhwYW5kYWJsZUVsdHMiLCJub25leHBhbmRhYmxlRWx0cyIsInN3aXRjaFRvcE1lbnVpdGVtIiwiZGVzdFRvcE1lbnVpdGVtIiwiZGVzdEVsdCIsImVsdElkIiwic2hvd2luZ0hlbHBLZXlzIiwic2hvd0hlbHBLZXlzIiwiZmFkZUluIiwicmVjaXRlSGVscCIsIndpdGhpblNlY29uZFRpZXJVbCIsInNlY29uZFRpZXJVbCIsInBvc3NFbHRzIiwic3JjVG9wTWVudWl0ZW0iLCJ0dG1pTiIsImoiLCJuZWFyU2licyIsIm15SWQiLCJ0aGlzRW5jb3VudGVyZWQiLCJhZGQiLCJmYXJTaWJzIiwicHJldkFsbCIsInN1Ym1lbnVEaXZzIiwibmV4dEFsbCIsInByZXZlbnREZWZhdWx0Iiwic2hpZnRLZXkiLCJjdHJsS2V5IiwiY29kZUNvbnRhaW5lciIsImlzQ29udHJvbGxlZCIsImhhc1dhcm5PbkV4aXQiLCJza2lwV2FybmluZyIsInJ1bkJ1dHRvbiIsImluaXRpYWxHYXMiLCJzZXRPcHRpb24iLCJyZW1vdmVTaG9ydGVuZWRMaW5lIiwibGluZUhhbmRsZSIsImdldE9wdGlvbiIsImxvbmdMaW5lcyIsInJ1bGVyTGlzdGVuZXJzIiwicmVmcmVzaFJ1bGVycyIsImRlbGV0ZUxpbmUiLCJtaW5MZW5ndGgiLCJzaXplIiwiTnVtYmVyIiwiTUFYX1ZBTFVFIiwibGluZU5vIiwiaW5zdGFuY2UiLCJtaW5MaW5lIiwibGFzdExpbmUiLCJtYXhMaW5lIiwiY2hhbmdlZCIsImVhY2hMaW5lIiwiZ2V0RG9jIiwicmVwbGFjZSIsInNldFZhbHVlIiwiY2xlYXJIaXN0b3J5IiwiaGlkZVdoZW5Db250cm9sbGVkIiwicmVtb3ZlV2hlbkNvbnRyb2xsZWQiLCJzIiwicmVtb3ZlIiwiRURJVE9SX0NPTlRFTlRTX1NFVFRMRUQiLCJweXJldExvYWQiLCJQWVJFVCIsInB5cmV0TG9hZDIiLCJmZXRjaFNjcmlwdEJsb2IiLCJzdGF0dXMiLCJhcnJheUJ1ZmZlciIsImJ1ZiIsImhlYWQiLCJVaW50OEFycmF5IiwibWluIiwiYnl0ZUxlbmd0aCIsIlJlc3BvbnNlIiwic3RyZWFtIiwicGlwZVRocm91Z2giLCJEZWNvbXByZXNzaW9uU3RyZWFtIiwiYmxvYiIsIlBZUkVUX0daSVBQRUQiLCJ0c0NvbXBpbGVyTG9hZCIsIkNQT19VU0VTX1RTX0FTU0VUUyIsIlBZUkVUX1RTX0NPTVBJTEVSIiwidHNMb2FkIiwib25sb2FkIiwib25lcnJvciIsImJvZHkiLCJsb2dGYWlsdXJlQW5kTWFudWFsRmV0Y2giLCJsb2FkQmFja3VwUHlyZXQiLCJ0ZXJtaW5hbFB5cmV0TG9hZEZhaWx1cmUiLCJkZXRhaWwiLCJwcmltYXJ5RGV0YWlsIiwiUFlSRVRfQkFDS1VQIiwiZXZlbnQiLCJ0aW1lU3RhbXAiLCJtYW51YWxGZXRjaCIsImFqYXgiLCJyZXMiLCJjb250ZW50c1ByZWZpeCIsInN0YXR1c1RleHQiLCJyZXNwb25zZVRleHQiLCJtYWtlRXZlbnQiLCJoYW5kbGVycyIsImhhbmRsZXIiLCJ0cmlnZ2VyIiwidiIsImgiLCJfbWFrZUV2ZW50IiwiX21ha2VFdmVudDIiLCJfc2xpY2VkVG9BcnJheSIsIm9uUnVuIiwidHJpZ2dlck9uUnVuIiwiX21ha2VFdmVudDMiLCJfbWFrZUV2ZW50NCIsIm9uSW50ZXJhY3Rpb24iLCJ0cmlnZ2VyT25JbnRlcmFjdGlvbiIsIl9tYWtlRXZlbnQ1IiwiX21ha2VFdmVudDYiLCJvbkxvYWQiLCJ0cmlnZ2VyT25Mb2FkIiwiZmluIiwiZXZlbnRzIiwiaW5pdGlhbFN0YXRlIiwiUFlSRVRfSVNfRU1CRURERUQiLCJhY3F1aXJlVnNDb2RlQXBpIiwiTUVTU0FHRVMiLCJtYWtlRXZlbnRzIiwic2VuZFBvcnQiLCJyZWNlaXZlUG9ydCJdLCJzb3VyY2VSb290IjoiIn0=