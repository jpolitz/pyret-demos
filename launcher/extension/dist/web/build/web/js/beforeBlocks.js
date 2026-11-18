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
/*!************************************!*\
  !*** ./src/web/js/beforeBlocks.js ***!
  \************************************/
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

var shareAPI = makeShareAPI("");
var url = __webpack_require__(/*! url.js */ "./node_modules/url.js/url.js");
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
window.setInterval(checkVersion, VERSION_CHECK_INTERVAL);
window.CPO = {
  save: function save() {},
  autoSave: function autoSave() {},
  documents: new Documents()
};
$(function () {
  var CONTEXT_FOR_NEW_FILES = '<scriptsonly app="Snap! 9.0, https://snap.berkeley.edu" version="2"><script x="0" y="0"><custom-block s="use context starter2024"></custom-block></script></scriptsonly>';
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
    var modifier = mac ? "Cmd" : "Ctrl";
    var cmOptions = {
      extraKeys: CodeMirror.normalizeKeyMap(_defineProperty({
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
      }, "".concat(modifier, "-/"), "toggleComment")),
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
    function firstLineIsNamespace() {
      var firstline = CM.getLine(0);
      var match = firstline.match(/^use context.*/);
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
  var initialProgram = storageAPI.then(function (api) {
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
            window.open(window.APP_BASE_URL + "/blocks#program=" + id, "_blank");
          });
        });
      });
    } else if (params["get"] && params["get"]["shareurl"]) {
      logger.log('shared-program-load', {
        url: params["get"]["shareurl"]
      });
      programLoad = null;
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
  });
  function setTitle(progName) {
    document.title = progName + " - " + "code.pyret.org";
    $("#showFilename").text("File: " + progName);
  }
  CPO.setTitle = setTitle;
  var filename = false;
  $("#download a").click(function () {
    var downloadElt = $("#download a");
    var contents = CPO.blocksIDE.currentSprite.scriptsOnlyXML();
    var downloadBlob = window.URL.createObjectURL(new Blob([contents], {
      type: 'text/plain'
    }));
    if (!filename) {
      filename = 'untitled_program.xml';
    }
    if (filename.indexOf(".xml") !== filename.length - 4) {
      filename += ".xml";
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
      if (result.match(/^use context*/)) {
        result = result.slice("use context ".length);
      }
      CPO.editor.setContextLine("use context " + result + "\n");
    });
  }
  $("#choose-context").on("click", function () {
    showModal(CPO.editor.cm.getLine(0).slice("use context ".length));
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
    window.open(window.APP_BASE_URL + "/blocks");
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
          return api.createFile(useName, {
            fileExtension: "xml"
          });
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
            var toSave = CPO.blocksIDE.getSpriteScriptsXML();
            console.log("Saving ", toSave);
            return p.save(toSave, false);
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

  var codeContainer = $(".replMain");
  if (params["get"]["hideDefinitions"]) {
    $(".replMain").attr("aria-hidden", true).attr("tabindex", '-1');
  }
  if (!("warnOnExit" in params["get"]) || params["get"]["warnOnExit"] !== "false") {
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
  var looksLikeUseContext = new RegExp("^use context.*");
  programLoaded.then(function (c) {
    CPO.documents.set("definitions://", CPO.editor.cm.getDoc());
    if (c === "") {
      c = CONTEXT_FOR_NEW_FILES;
    } else if (c.match(looksLikeUseContext) !== null) {
      window.stickError("Tried to load a plain Pyret file in blocks mode.");
      console.error("Got a plain text file: ", c);
      return;
    }
    CPO.blocksIDELoaded.then(function (blocksIDE) {
      CPO.blocksIDE.loadSpriteScriptsXML(c);
    });
    // NOTE(joe): Clearing history to address https://github.com/brownplt/pyret-lang/issues/386,
    // in which undo can revert the program back to empty
    CPO.editor.cm.clearHistory();
  });
  programLoaded.fail(function () {
    CPO.documents.set("definitions://", CPO.editor.cm.getDoc());
  });

  // If the primary Pyret URL (usually a CDN) fails, we fall back to the
  // same-origin copy at PYRET_BACKUP. The "error" event alone isn't enough
  // to trigger that: school content filters have been seen both silently
  // stalling the request (neither "load" nor "error" ever fires) and
  // answering it with an empty 200 (which fires "load"!). So two extra
  // signals count as failure: going PYRET_LOAD_TIMEOUT_MS with no event,
  // and a "load" after which the bundle's globals aren't actually defined.
  // When the primary fails either way, we record it in localSettings; until
  // that record expires, page loads swap the two URLs and go straight to
  // the backup rather than failing over from scratch again. A successful
  // load from the primary clears the record.
  var PYRET_LOAD_TIMEOUT_MS = 20000;
  var PYRET_FAILED_KEY = "pyret-primary-failed-at";
  var PYRET_FAILED_TTL_MS = 24 * 60 * 60 * 1000;
  function primaryFailedRecently() {
    var stamp = Number(localSettings.getItem(PYRET_FAILED_KEY));
    return stamp > 0 && Date.now() - stamp < PYRET_FAILED_TTL_MS;
  }
  function recordPrimaryFailure() {
    if (primaryPyret === window.PYRET) {
      localSettings.setItem(PYRET_FAILED_KEY, String(Date.now()));
    }
  }

  // The bundle synchronously installs its module loader as `define` and
  // `requirejs`; if neither exists after a script's "load" event, whatever
  // the network handed us was not Pyret (e.g. a filter's empty 200).
  function pyretActuallyLoaded() {
    return !(typeof window.define === "undefined" && typeof window.requirejs === "undefined");
  }
  var primaryPyret = window.PYRET;
  var backupPyret = undefined;
  if (backupPyret && primaryFailedRecently()) {
    console.log("Primary Pyret URL timed out recently; loading from backup first");
    primaryPyret = undefined;
    backupPyret = window.PYRET;
  }
  var pyretLoad = document.createElement('script');
  console.log(primaryPyret);
  pyretLoad.src = primaryPyret;
  pyretLoad.type = "text/javascript";
  document.body.appendChild(pyretLoad);
  var pyretLoad2 = document.createElement('script');
  var backupStarted = false;
  function startBackupLoad() {
    if (backupStarted) {
      return;
    }
    backupStarted = true;
    var backupTimer = setTimeout(function () {
      // Both attempts wedged. Stop the spinner and tell the user; the backup
      // request is left in flight, so if it does eventually finish, the page
      // still becomes usable.
      logger.log('pyret-load-failure', {
        event: 'timeout',
        url: backupPyret,
        timeoutMs: PYRET_LOAD_TIMEOUT_MS
      });
      $("#loader").hide();
      $("#runPart").hide();
      $("#breakButton").hide();
      window.stickError("Pyret failed to load; check your connection or try refreshing the page.  If this happens repeatedly, please report it as a bug.");
    }, PYRET_LOAD_TIMEOUT_MS);
    $(pyretLoad2).on("load", function () {
      clearTimeout(backupTimer);
      if (!pyretActuallyLoaded()) {
        logger.log('pyret-load-failure', {
          event: 'empty-load',
          url: backupPyret
        });
        $("#loader").hide();
        $("#runPart").hide();
        $("#breakButton").hide();
        window.stickError("Pyret failed to load; check your connection or try refreshing the page.  If this happens repeatedly, please report it as a bug.");
      }
    });
    pyretLoad2.src = backupPyret;
    pyretLoad2.type = "text/javascript";
    document.body.appendChild(pyretLoad2);
  }
  var primaryTimer = setTimeout(function () {
    logger.log('pyret-load-failure', {
      event: 'timeout',
      url: primaryPyret,
      timeoutMs: PYRET_LOAD_TIMEOUT_MS
    });
    recordPrimaryFailure();
    // Removing the element abandons the stalled request; a script element
    // that is disconnected before it executes won't run, so a late arrival
    // can't execute a second copy of Pyret alongside the backup.
    pyretLoad.remove();
    startBackupLoad();
  }, PYRET_LOAD_TIMEOUT_MS);
  $(pyretLoad).on("load", function () {
    clearTimeout(primaryTimer);
    if (!pyretActuallyLoaded()) {
      logger.log('pyret-load-failure', {
        event: 'empty-load',
        url: primaryPyret
      });
      recordPrimaryFailure();
      startBackupLoad();
      return;
    }
    if (primaryPyret === window.PYRET && localSettings.getItem(PYRET_FAILED_KEY)) {
      localSettings.setItem(PYRET_FAILED_KEY, "");
    }
  });
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
    clearTimeout(primaryTimer);
    logFailureAndManualFetch(primaryPyret, e);
    startBackupLoad();
  });
  $(pyretLoad2).on("error", function (e) {
    $("#loader").hide();
    $("#runPart").hide();
    $("#breakButton").hide();
    window.stickError("Pyret failed to load; check your connection or try refreshing the page.  If this happens repeatedly, please report it as a bug.");
    logFailureAndManualFetch(backupPyret, e);
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
  var initialState = params["get"]["initialState"];
  if (typeof acquireVsCodeApi === "function") {
    window.MESSAGES = makeEvents({
      CPO: CPO,
      sendPort: acquireVsCodeApi(),
      receivePort: window,
      initialState: initialState
    });
  } else if (window.parent && window.parent !== window || undefined === "development") {
    window.MESSAGES = makeEvents({
      CPO: CPO,
      sendPort: window.parent,
      receivePort: window,
      initialState: initialState
    });
  }
  if (localSettings.getItem("sawSummer2021Message") !== "saw-summer-2021-message") {
    var message = $("<span>");
    var notes = $("<a target='_blank' style='color: white'>").attr("href", "https://www.pyret.org/release-notes/summer-2021.html").text("release notes");
    message.append("Things may look a little different! Check out the ", notes, " for more details.");
    window.stickRichMessage(message);
    localSettings.setItem("sawSummer2021Message", "saw-summer-2021-message");
  }
  if (window.parent !== window) {
    makeEvents({
      CPO: CPO,
      sendPort: window.parent,
      receivePort: window
    });
  }
});
})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsTUFBTSxTQUFTLElBQXlEO0FBQ3hFOztBQUVBO0FBQ0EsTUFBTSxLQUFLO0FBQUEsMEJBK0JOOztBQUVMLENBQUM7QUFDRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsVUFBVTtBQUNWO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBOztBQUVBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQSxlQUFlLGdCQUFnQjtBQUMvQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLHdCQUF3QixpQkFBaUI7QUFDekM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOEJBQThCLEtBQUs7QUFDbkM7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0Isa0JBQWtCO0FBQ3RDOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLFdBQVcsVUFBVTtBQUNyQjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsaUJBQWlCLDBCQUEwQjtBQUMzQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnREFBZ0Q7QUFDaEQ7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQ0FBMkM7QUFDM0M7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBLGdDQUFn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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLG1DQUFtQyxlQUFlO0FBQ2xEOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLG1DQUFtQyxlQUFlO0FBQ2xEOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSxLQUFLO0FBQ0wsaUJBQWlCO0FBQ2pCLEtBQUs7O0FBRUw7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0wsaUJBQWlCO0FBQ2pCLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQSxLQUFLO0FBQ0w7QUFDQSxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBLHNCQUFzQjtBQUN0QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBLFdBQVcsVUFBVTtBQUNyQixhQUFhLFVBQVU7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQixTQUFTO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxRQUFRO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFCQUFxQjtBQUNyQjtBQUNBO0FBQ0EsMENBQTBDLCtCQUErQjtBQUN6RTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsUUFBUTtBQUNuQjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0EsS0FBSzs7QUFFTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxTQUFTO0FBQ1QsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLGFBQWE7QUFDeEI7QUFDQSxhQUFhLGNBQWM7QUFDM0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsTUFBTTtBQUNqQixXQUFXLFVBQVU7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLE1BQU07QUFDakIsV0FBVyxVQUFVO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsTUFBTTtBQUNqQixXQUFXLFVBQVU7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxNQUFNO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0EsU0FBUztBQUNUOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsTUFBTTtBQUNqQixXQUFXLFFBQVE7QUFDbkIsV0FBVyxNQUFNO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSzs7QUFFTDtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLEtBQUs7O0FBRUw7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLE1BQU07QUFDakIsV0FBVyxRQUFRO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxRQUFRO0FBQ25CLFdBQVcsT0FBTyxzQ0FBc0M7QUFDeEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxRQUFRO0FBQ25CLG1EQUFtRDtBQUNuRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxVQUFVO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiLFNBQVM7QUFDVDtBQUNBO0FBQ0EsYUFBYTtBQUNiLFNBQVM7QUFDVCxNQUFNO0FBQ047QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBLENBQUM7Ozs7Ozs7Ozs7O0FDLy9ERDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhEQUE4RDtBQUM5RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOENBQThDLFdBQVc7QUFDekQsOENBQThDLFdBQVc7QUFDekQsNkNBQTZDLFdBQVc7QUFDeEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUMsV0FBVyxPQUFPO0FBQ3ZELHNDQUFzQyxXQUFXLE1BQU07QUFDdkQ7QUFDQSxXQUFXLFFBQVE7QUFDbkIsWUFBWSwyQkFBMkIsR0FBRztBQUMxQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLGdDQUFnQztBQUM1QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5QkFBeUIsWUFBWTtBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLGNBQWM7QUFDaEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFFBQVE7QUFDbkIsV0FBVyxRQUFRO0FBQ25CO0FBQ0EsWUFBWSxRQUFRO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFFBQVE7QUFDbkIsWUFBWSxXQUFXLEdBQUc7QUFDMUI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxZQUFZLFNBQVM7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBRTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxRQUFRO0FBQ25CLFdBQVcsUUFBUTtBQUNuQixZQUFZLFFBQVE7QUFDcEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBRTtBQUNGOztBQUVBLEtBQUssSUFBNkMsR0FBRyxvQ0FBTyxJQUFJO0FBQUE7QUFBQTtBQUFBO0FBQUEsa0dBQUM7QUFDakUsS0FBSztBQUFBLEVBQ3FCOztBQUUxQixDQUFDOzs7Ozs7O1VDclZEO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUM1QkE7O0FBRUEsSUFBSXVGLFFBQVEsR0FBR0MsWUFBWSxDQUFDQyxFQUFpQyxDQUFDO0FBRTlELElBQUlHLEdBQUcsR0FBR0MsbUJBQU8sQ0FBQyw0Q0FBUSxDQUFDO0FBQzNCLElBQUlDLFdBQVcsR0FBR0QsbUJBQU8sQ0FBQyx1REFBbUIsQ0FBQztBQUM5Qy9GLE1BQU0sQ0FBQ2dHLFdBQVcsR0FBR0EsV0FBVztBQUVoQyxJQUFNQyxHQUFHLEdBQUcsSUFBSTtBQUNoQmpHLE1BQU0sQ0FBQ2tHLE1BQU0sR0FBRyxTQUFTO0FBQUEsR0FBZTtFQUN0QyxJQUFJbEcsTUFBTSxDQUFDbUcsT0FBTyxJQUFJRixHQUFHLEVBQUU7SUFDekJFLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDQyxLQUFLLENBQUNGLE9BQU8sRUFBRUcsU0FBUyxDQUFDO0VBQ3ZDO0FBQ0YsQ0FBQztBQUVEdEcsTUFBTSxDQUFDdUcsUUFBUSxHQUFHLFNBQVM7QUFBQSxHQUFlO0VBQ3hDLElBQUl2RyxNQUFNLENBQUNtRyxPQUFPLElBQUlGLEdBQUcsRUFBRTtJQUN6QkUsT0FBTyxDQUFDSyxLQUFLLENBQUNILEtBQUssQ0FBQ0YsT0FBTyxFQUFFRyxTQUFTLENBQUM7RUFDekM7QUFDRixDQUFDO0FBQ0QsSUFBSUcsYUFBYSxHQUFHWCxHQUFHLENBQUNZLEtBQUssQ0FBQ25FLFFBQVEsQ0FBQ29FLFFBQVEsQ0FBQ0MsSUFBSSxDQUFDO0FBQ3JELElBQUlDLE1BQU0sR0FBR2YsR0FBRyxDQUFDWSxLQUFLLENBQUMsSUFBSSxHQUFHRCxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDcER6RyxNQUFNLENBQUM4RyxhQUFhLEdBQUcsTUFBTSxDQUFDLENBQUM7QUFDL0I5RyxNQUFNLENBQUMrRyxVQUFVLEdBQUcsWUFBVztFQUM3QnZILENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDeUQsS0FBSyxDQUFDLENBQUM7QUFDaEMsQ0FBQztBQUNEakQsTUFBTSxDQUFDZ0gsd0JBQXdCLEdBQUcsWUFBVztFQUMzQztBQUNGO0FBQ0E7QUFDQTtBQUhFLENBSUQ7QUFDRGhILE1BQU0sQ0FBQ2lILFVBQVUsR0FBRyxVQUFTdkQsT0FBTyxFQUFFd0QsSUFBSSxFQUFFO0VBQzFDQyxHQUFHLENBQUNDLFlBQVksQ0FBQzFELE9BQU8sQ0FBQztFQUN6QnFELFVBQVUsQ0FBQyxDQUFDO0VBQ1osSUFBSU0sR0FBRyxHQUFHN0gsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUNILElBQUksQ0FBQ29FLE9BQU8sQ0FBQztFQUNyRCxJQUFHd0QsSUFBSSxFQUFFO0lBQ1BHLEdBQUcsQ0FBQzNILElBQUksQ0FBQyxPQUFPLEVBQUV3SCxJQUFJLENBQUM7RUFDekI7RUFDQUcsR0FBRyxDQUFDQyxPQUFPLENBQUMsQ0FBQztFQUNiOUgsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMrSCxPQUFPLENBQUNGLEdBQUcsQ0FBQztFQUNuQ0wsd0JBQXdCLENBQUMsQ0FBQztBQUM1QixDQUFDO0FBQ0RoSCxNQUFNLENBQUN3SCxVQUFVLEdBQUcsVUFBUzlELE9BQU8sRUFBRTtFQUNwQ3lELEdBQUcsQ0FBQ0MsWUFBWSxDQUFDMUQsT0FBTyxDQUFDO0VBQ3pCcUQsVUFBVSxDQUFDLENBQUM7RUFDWixJQUFJTSxHQUFHLEdBQUc3SCxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUNDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQ0gsSUFBSSxDQUFDb0UsT0FBTyxDQUFDO0VBQ3JEbEUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMrSCxPQUFPLENBQUNGLEdBQUcsQ0FBQztFQUNuQ0wsd0JBQXdCLENBQUMsQ0FBQztFQUMxQkssR0FBRyxDQUFDSSxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQ25CLENBQUM7QUFDRHpILE1BQU0sQ0FBQzBILFlBQVksR0FBRyxVQUFTaEUsT0FBTyxFQUFFO0VBQ3RDeUQsR0FBRyxDQUFDQyxZQUFZLENBQUMxRCxPQUFPLENBQUM7RUFDekJxRCxVQUFVLENBQUMsQ0FBQztFQUNaLElBQUlZLEdBQUcsR0FBR25JLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQ0MsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDSCxJQUFJLENBQUNvRSxPQUFPLENBQUM7RUFDdERsRSxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQytILE9BQU8sQ0FBQ0ksR0FBRyxDQUFDO0VBQ25DWCx3QkFBd0IsQ0FBQyxDQUFDO0VBQzFCVyxHQUFHLENBQUNGLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDbkIsQ0FBQztBQUNEekgsTUFBTSxDQUFDNEgsWUFBWSxHQUFHLFVBQVNsRSxPQUFPLEVBQUU7RUFDdEN5RCxHQUFHLENBQUNDLFlBQVksQ0FBQzFELE9BQU8sQ0FBQztFQUN6QnFELFVBQVUsQ0FBQyxDQUFDO0VBQ1osSUFBSVksR0FBRyxHQUFHbkksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUNILElBQUksQ0FBQ29FLE9BQU8sQ0FBQztFQUN0RGxFLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDK0gsT0FBTyxDQUFDSSxHQUFHLENBQUM7RUFDbkNYLHdCQUF3QixDQUFDLENBQUM7QUFDNUIsQ0FBQztBQUNEaEgsTUFBTSxDQUFDNkgsZ0JBQWdCLEdBQUcsVUFBU0MsT0FBTyxFQUFFO0VBQzFDWCxHQUFHLENBQUNDLFlBQVksQ0FBQ1UsT0FBTyxDQUFDeEksSUFBSSxDQUFDLENBQUMsQ0FBQztFQUNoQ3lILFVBQVUsQ0FBQyxDQUFDO0VBQ1p2SCxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQytILE9BQU8sQ0FBQy9ILENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQ0MsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDbUUsTUFBTSxDQUFDa0UsT0FBTyxDQUFDLENBQUM7RUFDOUVkLHdCQUF3QixDQUFDLENBQUM7QUFDNUIsQ0FBQztBQUNEaEgsTUFBTSxDQUFDK0gsY0FBYyxHQUFHLFlBQVU7RUFBQyxPQUFPdkksQ0FBQyxDQUFDLDZCQUE2QixDQUFDO0FBQUMsQ0FBQztBQUM1RVEsTUFBTSxDQUFDZ0ksY0FBYyxHQUFHLFlBQVU7RUFBQyxPQUFPeEksQ0FBQyxDQUFDLDZCQUE2QixDQUFDO0FBQUMsQ0FBQztBQUU1RSxJQUFJeUksU0FBUyxHQUFHLFlBQVc7RUFFekIsU0FBU0EsU0FBU0EsQ0FBQSxFQUFHO0lBQ25CLElBQUksQ0FBQ0MsU0FBUyxHQUFHLElBQUlDLEdBQUcsQ0FBQyxDQUFDO0VBQzVCO0VBRUFGLFNBQVMsQ0FBQ3pHLFNBQVMsQ0FBQzRHLEdBQUcsR0FBRyxVQUFVQyxJQUFJLEVBQUU7SUFDeEMsT0FBTyxJQUFJLENBQUNILFNBQVMsQ0FBQ0UsR0FBRyxDQUFDQyxJQUFJLENBQUM7RUFDakMsQ0FBQztFQUVESixTQUFTLENBQUN6RyxTQUFTLENBQUM4RyxHQUFHLEdBQUcsVUFBVUQsSUFBSSxFQUFFO0lBQ3hDLE9BQU8sSUFBSSxDQUFDSCxTQUFTLENBQUNJLEdBQUcsQ0FBQ0QsSUFBSSxDQUFDO0VBQ2pDLENBQUM7RUFFREosU0FBUyxDQUFDekcsU0FBUyxDQUFDK0csR0FBRyxHQUFHLFVBQVVGLElBQUksRUFBRUcsR0FBRyxFQUFFO0lBQzdDLElBQUdDLE1BQU0sQ0FBQ0MsVUFBVSxFQUNsQkQsTUFBTSxDQUFDckMsR0FBRyxDQUFDLFNBQVMsRUFBRTtNQUFDaUMsSUFBSSxFQUFFQSxJQUFJO01BQUU1RSxLQUFLLEVBQUUrRSxHQUFHLENBQUNHLFFBQVEsQ0FBQztJQUFDLENBQUMsQ0FBQztJQUM1RCxPQUFPLElBQUksQ0FBQ1QsU0FBUyxDQUFDSyxHQUFHLENBQUNGLElBQUksRUFBRUcsR0FBRyxDQUFDO0VBQ3RDLENBQUM7RUFFRFAsU0FBUyxDQUFDekcsU0FBUyxVQUFPLEdBQUcsVUFBVTZHLElBQUksRUFBRTtJQUMzQyxJQUFHSSxNQUFNLENBQUNDLFVBQVUsRUFDbEJELE1BQU0sQ0FBQ3JDLEdBQUcsQ0FBQyxTQUFTLEVBQUU7TUFBQ2lDLElBQUksRUFBRUE7SUFBSSxDQUFDLENBQUM7SUFDckMsT0FBTyxJQUFJLENBQUNILFNBQVMsVUFBTyxDQUFDRyxJQUFJLENBQUM7RUFDcEMsQ0FBQztFQUVESixTQUFTLENBQUN6RyxTQUFTLENBQUNvSCxPQUFPLEdBQUcsVUFBVUMsQ0FBQyxFQUFFO0lBQ3pDLE9BQU8sSUFBSSxDQUFDWCxTQUFTLENBQUNVLE9BQU8sQ0FBQ0MsQ0FBQyxDQUFDO0VBQ2xDLENBQUM7RUFFRCxPQUFPWixTQUFTO0FBQ2xCLENBQUMsQ0FBQyxDQUFDO0FBRUgsSUFBSWEsc0JBQXNCLEdBQUcsTUFBTSxHQUFJLEtBQUssR0FBR0MsSUFBSSxDQUFDQyxNQUFNLENBQUMsQ0FBRTtBQUU3RCxTQUFTQyxZQUFZQSxDQUFBLEVBQUc7RUFDdEJ6SixDQUFDLENBQUM4SSxHQUFHLENBQUMsa0JBQWtCLENBQUMsQ0FBQ3ZGLElBQUksQ0FBQyxVQUFTbUcsSUFBSSxFQUFFO0lBQzVDQSxJQUFJLEdBQUdDLElBQUksQ0FBQ3pDLEtBQUssQ0FBQ3dDLElBQUksQ0FBQztJQUN2QixJQUFHQSxJQUFJLENBQUNFLE9BQU8sSUFBSUYsSUFBSSxDQUFDRSxPQUFPLEtBQUt6RCxFQUFpQyxFQUFFO01BQ3JFM0YsTUFBTSxDQUFDMEgsWUFBWSxDQUFDLDBGQUEwRixDQUFDO0lBQ2pIO0VBQ0YsQ0FBQyxDQUFDO0FBQ0o7QUFDQTFILE1BQU0sQ0FBQ3FKLFdBQVcsQ0FBQ0osWUFBWSxFQUFFSCxzQkFBc0IsQ0FBQztBQUV4RDlJLE1BQU0sQ0FBQ21ILEdBQUcsR0FBRztFQUNYbUMsSUFBSSxFQUFFLFNBQU5BLElBQUlBLENBQUEsRUFBYSxDQUFDLENBQUM7RUFDbkJDLFFBQVEsRUFBRSxTQUFWQSxRQUFRQSxDQUFBLEVBQWEsQ0FBQyxDQUFDO0VBQ3ZCckIsU0FBUyxFQUFHLElBQUlELFNBQVMsQ0FBQztBQUM1QixDQUFDO0FBQ0R6SSxDQUFDLENBQUMsWUFBVztFQUNYLElBQU1nSyxxQkFBcUIsR0FBRywwS0FBMEs7RUFDeE0sU0FBU0MsS0FBS0EsQ0FBQ0MsR0FBRyxFQUFFQyxTQUFTLEVBQUU7SUFDN0IsSUFBSUMsTUFBTSxHQUFHLENBQUMsQ0FBQztJQUNmQyxNQUFNLENBQUNDLElBQUksQ0FBQ0osR0FBRyxDQUFDLENBQUNkLE9BQU8sQ0FBQyxVQUFTbUIsQ0FBQyxFQUFFO01BQ25DSCxNQUFNLENBQUNHLENBQUMsQ0FBQyxHQUFHTCxHQUFHLENBQUNLLENBQUMsQ0FBQztJQUNwQixDQUFDLENBQUM7SUFDRkYsTUFBTSxDQUFDQyxJQUFJLENBQUNILFNBQVMsQ0FBQyxDQUFDZixPQUFPLENBQUMsVUFBU21CLENBQUMsRUFBRTtNQUN6Q0gsTUFBTSxDQUFDRyxDQUFDLENBQUMsR0FBR0osU0FBUyxDQUFDSSxDQUFDLENBQUM7SUFDMUIsQ0FBQyxDQUFDO0lBQ0YsT0FBT0gsTUFBTTtFQUNmO0VBQ0EsSUFBSUksWUFBWSxHQUFHLElBQUk7RUFDdkIsU0FBU0Msb0JBQW9CQSxDQUFBLEVBQUc7SUFDOUIsSUFBR0QsWUFBWSxFQUFFO01BQ2ZBLFlBQVksQ0FBQy9HLEtBQUssQ0FBQyxDQUFDO01BQ3BCK0csWUFBWSxDQUFDRSxNQUFNLENBQUMsU0FBUyxDQUFDO01BQzlCRixZQUFZLEdBQUcsSUFBSTtJQUNyQjtFQUNGO0VBQ0E3QyxHQUFHLENBQUNnRCxVQUFVLEdBQUcsVUFBU3JHLFNBQVMsRUFBRTNELE9BQU8sRUFBRTtJQUM1QyxJQUFJaUssT0FBTyxHQUFHLEVBQUU7SUFDaEIsSUFBSWpLLE9BQU8sQ0FBQ2tLLGNBQWMsQ0FBQyxTQUFTLENBQUMsRUFBRTtNQUNyQ0QsT0FBTyxHQUFHakssT0FBTyxDQUFDaUssT0FBTztJQUMzQjtJQUVBLElBQUlFLFFBQVEsR0FBR0MsTUFBTSxDQUFDLCtCQUErQixDQUFDO0lBQ3RERCxRQUFRLENBQUN6SyxHQUFHLENBQUN1SyxPQUFPLENBQUM7SUFDckJ0RyxTQUFTLENBQUNGLE1BQU0sQ0FBQzBHLFFBQVEsQ0FBQztJQUUxQixJQUFJRSxNQUFNLEdBQUcsU0FBVEEsTUFBTUEsQ0FBYUMsSUFBSSxFQUFFQyxXQUFXLEVBQUU7TUFDeEN2SyxPQUFPLENBQUN3SyxHQUFHLENBQUNGLElBQUksRUFBRTtRQUFDekcsRUFBRSxFQUFFNEc7TUFBRSxDQUFDLEVBQUVGLFdBQVcsQ0FBQztJQUMxQyxDQUFDO0lBRUQsSUFBSUcsY0FBYyxHQUFHLENBQUMxSyxPQUFPLENBQUMySyxZQUFZO0lBQzFDLElBQUlDLFVBQVUsR0FBRyxDQUFDNUssT0FBTyxDQUFDMkssWUFBWTtJQUV0QyxJQUFJRSxPQUFPLEdBQUcsQ0FBQzdLLE9BQU8sQ0FBQzJLLFlBQVksR0FDakMsQ0FBQyxhQUFhLEVBQUUsd0JBQXdCLEVBQUUsdUJBQXVCLENBQUMsR0FDbEUsRUFBRTtJQUVKLFNBQVNHLGdCQUFnQkEsQ0FBQ2pILEVBQUUsRUFBRTtNQUM1QixJQUFJa0gsSUFBSSxHQUFHbEgsRUFBRSxDQUFDbUgsU0FBUyxDQUFDLENBQUM7TUFDekJuSCxFQUFFLENBQUNvSCxTQUFTLENBQUMsWUFBVztRQUN0QixLQUFLLElBQUloRyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUc4RixJQUFJLEVBQUUsRUFBRTlGLENBQUMsRUFBRXBCLEVBQUUsQ0FBQ3FILFVBQVUsQ0FBQ2pHLENBQUMsQ0FBQztNQUNqRCxDQUFDLENBQUM7SUFDSjtJQUVBLElBQUlrRyxlQUFlLEdBQUcsR0FBRztJQUV6QixJQUFJQyxNQUFNLEVBQUVDLFlBQVk7O0lBRXhCO0lBQ0EsSUFBSXJMLE9BQU8sQ0FBQzJLLFlBQVksRUFBRTtNQUN4QlMsTUFBTSxHQUFHLEVBQUU7SUFDYixDQUFDLE1BQUs7TUFDSkEsTUFBTSxHQUFHLENBQUM7UUFBQ0UsS0FBSyxFQUFFLFNBQVM7UUFBRUMsTUFBTSxFQUFFSixlQUFlO1FBQUVLLFNBQVMsRUFBRSxRQUFRO1FBQUVDLFNBQVMsRUFBRTtNQUFRLENBQUMsQ0FBQztNQUNoR0osWUFBWSxHQUFHRixlQUFlO0lBQ2hDO0lBRUEsSUFBTU8sR0FBRyxHQUFHNUgsVUFBVSxDQUFDNkgsTUFBTSxXQUFRLEtBQUs3SCxVQUFVLENBQUM2SCxNQUFNLENBQUNDLFVBQVU7SUFDdEUsSUFBTUMsUUFBUSxHQUFHSCxHQUFHLEdBQUcsS0FBSyxHQUFHLE1BQU07SUFFckMsSUFBSUksU0FBUyxHQUFHO01BQ2RDLFNBQVMsRUFBRWpJLFVBQVUsQ0FBQ2tJLGVBQWUsQ0FBQUMsZUFBQTtRQUNuQyxhQUFhLEVBQUUsU0FBZkMsVUFBYUEsQ0FBV3JJLEVBQUUsRUFBRTtVQUFFd0csTUFBTSxDQUFDeEcsRUFBRSxDQUFDMkUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUFFLENBQUM7UUFDdEQsa0JBQWtCLEVBQUUsU0FBcEIyRCxjQUFrQkEsQ0FBV3RJLEVBQUUsRUFBRTtVQUFFd0csTUFBTSxDQUFDeEcsRUFBRSxDQUFDMkUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUFFLENBQUM7UUFDM0QsS0FBSyxFQUFFLFlBQVk7UUFDbkIsUUFBUSxFQUFFc0MsZ0JBQWdCO1FBQzFCLFVBQVUsRUFBRSxnQkFBZ0I7UUFDNUIsVUFBVSxFQUFFLGdCQUFnQjtRQUM1QixXQUFXLEVBQUUsZUFBZTtRQUM1QixXQUFXLEVBQUUsZUFBZTtRQUM1QixXQUFXLEVBQUUsaUJBQWlCO1FBQzlCLFlBQVksRUFBRTtNQUFnQixNQUFBc0IsTUFBQSxDQUMxQlAsUUFBUSxTQUFPLGVBQWUsQ0FDbkMsQ0FBQztNQUNGUSxVQUFVLEVBQUUsQ0FBQztNQUNiQyxPQUFPLEVBQUUsQ0FBQztNQUNWQyxjQUFjLEVBQUVDLFFBQVE7TUFDeEJ4SSxXQUFXLEVBQUUwRyxjQUFjO01BQzNCK0IsYUFBYSxFQUFFLElBQUk7TUFDbkJDLGFBQWEsRUFBRSxJQUFJO01BQ25CQyxpQkFBaUIsRUFBRSxJQUFJO01BQ3ZCQyxVQUFVLEVBQUVoQyxVQUFVO01BQ3RCQyxPQUFPLEVBQUVBLE9BQU87TUFDaEJnQyxZQUFZLEVBQUUsSUFBSTtNQUNsQkMsT0FBTyxFQUFFLElBQUk7TUFDYjFCLE1BQU0sRUFBRUEsTUFBTTtNQUNkQyxZQUFZLEVBQUVBLFlBQVk7TUFDMUIwQixhQUFhLEVBQUU7SUFDakIsQ0FBQztJQUVEakIsU0FBUyxHQUFHeEMsS0FBSyxDQUFDd0MsU0FBUyxFQUFFOUwsT0FBTyxDQUFDOEwsU0FBUyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBRXJELElBQUlyQixFQUFFLEdBQUczRyxVQUFVLENBQUNrSixZQUFZLENBQUM3QyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUyQixTQUFTLENBQUM7SUFFeEQsU0FBU21CLG9CQUFvQkEsQ0FBQSxFQUFHO01BQzlCLElBQU1DLFNBQVMsR0FBR3pDLEVBQUUsQ0FBQzBDLE9BQU8sQ0FBQyxDQUFDLENBQUM7TUFDL0IsSUFBTUMsS0FBSyxHQUFHRixTQUFTLENBQUNFLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztNQUMvQyxPQUFPQSxLQUFLLEtBQUssSUFBSTtJQUN2QjtJQUVBLElBQUlDLGFBQWEsR0FBRyxJQUFJO0lBQ3hCLFNBQVNDLGNBQWNBLENBQUNDLGNBQWMsRUFBRTtNQUN0QyxJQUFJQyxZQUFZLEdBQUdQLG9CQUFvQixDQUFDLENBQUM7TUFDekMsSUFBRyxDQUFDTyxZQUFZLElBQUlILGFBQWEsS0FBSyxJQUFJLEVBQUU7UUFDMUNBLGFBQWEsQ0FBQ0ksS0FBSyxDQUFDLENBQUM7TUFDdkI7TUFDQSxJQUFHLENBQUNELFlBQVksRUFBRTtRQUNoQi9DLEVBQUUsQ0FBQ2lELFlBQVksQ0FBQ0gsY0FBYyxFQUFFO1VBQUVJLElBQUksRUFBQyxDQUFDO1VBQUVDLEVBQUUsRUFBRTtRQUFDLENBQUMsRUFBRTtVQUFDRCxJQUFJLEVBQUUsQ0FBQztVQUFFQyxFQUFFLEVBQUU7UUFBQyxDQUFDLENBQUM7TUFDckUsQ0FBQyxNQUNJO1FBQ0huRCxFQUFFLENBQUNpRCxZQUFZLENBQUNILGNBQWMsRUFBRTtVQUFFSSxJQUFJLEVBQUMsQ0FBQztVQUFFQyxFQUFFLEVBQUU7UUFBQyxDQUFDLEVBQUU7VUFBQ0QsSUFBSSxFQUFFLENBQUM7VUFBRUMsRUFBRSxFQUFFO1FBQUMsQ0FBQyxDQUFDO01BQ3JFO0lBQ0Y7SUFFQSxJQUFHLENBQUM1TixPQUFPLENBQUMySyxZQUFZLEVBQUU7TUFFeEIsSUFBTWtELHFCQUFxQixHQUFHekwsUUFBUSxDQUFDMEwsYUFBYSxDQUFDLEtBQUssQ0FBQztNQUMzREQscUJBQXFCLENBQUNwQyxTQUFTLEdBQUcseUJBQXlCO01BQzNELElBQU1zQyxhQUFhLEdBQUczTCxRQUFRLENBQUMwTCxhQUFhLENBQUMsTUFBTSxDQUFDO01BQ3BEQyxhQUFhLENBQUN0QyxTQUFTLEdBQUcseUJBQXlCO01BQ25Ec0MsYUFBYSxDQUFDQyxTQUFTLEdBQUcsb0xBQW9MO01BQzlNLElBQU1DLGNBQWMsR0FBRzdMLFFBQVEsQ0FBQzBMLGFBQWEsQ0FBQyxLQUFLLENBQUM7TUFDcERHLGNBQWMsQ0FBQ0MsR0FBRyxHQUFHck8sTUFBTSxDQUFDc08sWUFBWSxHQUFHLG1CQUFtQjtNQUM5REYsY0FBYyxDQUFDeEMsU0FBUyxHQUFHLGlCQUFpQjtNQUM1Q29DLHFCQUFxQixDQUFDTyxXQUFXLENBQUNILGNBQWMsQ0FBQztNQUNqREoscUJBQXFCLENBQUNPLFdBQVcsQ0FBQ0wsYUFBYSxDQUFDO01BQ2hEdEQsRUFBRSxDQUFDNEQsZUFBZSxDQUFDLENBQUMsRUFBRSxhQUFhLEVBQUVSLHFCQUFxQixDQUFDO01BRTNEcEQsRUFBRSxDQUFDNkQsaUJBQWlCLENBQUMsQ0FBQyxDQUFDQyxZQUFZLEdBQUcsVUFBU3pNLENBQUMsRUFBRTtRQUNoRDJJLEVBQUUsQ0FBQytELFdBQVcsQ0FBQyxhQUFhLENBQUM7TUFDL0IsQ0FBQzs7TUFFRDtNQUNBL0QsRUFBRSxDQUFDNkQsaUJBQWlCLENBQUMsQ0FBQyxDQUFDRyxXQUFXLEdBQUcsVUFBUzNNLENBQUMsRUFBRTtRQUMvQyxJQUFJNE0sTUFBTSxHQUFHakUsRUFBRSxDQUFDa0UsVUFBVSxDQUFDO1VBQUVDLElBQUksRUFBRTlNLENBQUMsQ0FBQytNLE9BQU87VUFBRUMsR0FBRyxFQUFFaE4sQ0FBQyxDQUFDaU47UUFBUSxDQUFDLENBQUM7UUFDL0QsSUFBSUMsT0FBTyxHQUFHdkUsRUFBRSxDQUFDd0UsV0FBVyxDQUFDUCxNQUFNLENBQUM7UUFDcEMsSUFBSU0sT0FBTyxDQUFDNU8sTUFBTSxLQUFLLENBQUMsRUFBRTtVQUN4QnFLLEVBQUUsQ0FBQytELFdBQVcsQ0FBQyxhQUFhLENBQUM7UUFDL0I7UUFDQSxJQUFJRSxNQUFNLENBQUNmLElBQUksS0FBSyxDQUFDLElBQUlxQixPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUszQixhQUFhLEVBQUU7VUFDckQ1QyxFQUFFLENBQUM0RCxlQUFlLENBQUMsQ0FBQyxFQUFFLGFBQWEsRUFBRVIscUJBQXFCLENBQUM7UUFDN0QsQ0FBQyxNQUNJO1VBQ0hwRCxFQUFFLENBQUMrRCxXQUFXLENBQUMsYUFBYSxDQUFDO1FBQy9CO01BQ0YsQ0FBQztNQUNEL0QsRUFBRSxDQUFDakwsRUFBRSxDQUFDLFFBQVEsRUFBRSxVQUFTMFAsTUFBTSxFQUFFO1FBQy9CLFNBQVNDLHNCQUFzQkEsQ0FBQ0MsQ0FBQyxFQUFFO1VBQUUsT0FBT0EsQ0FBQyxDQUFDQyxJQUFJLENBQUMxQixJQUFJLEtBQUssQ0FBQztRQUFFO1FBQy9ELElBQUd1QixNQUFNLENBQUNJLEtBQUssQ0FBQ0MsVUFBVSxJQUFJTCxNQUFNLENBQUNJLEtBQUssQ0FBQ0MsVUFBVSxDQUFDQyxLQUFLLENBQUNMLHNCQUFzQixDQUFDLEVBQUU7VUFBRTtRQUFRO1FBQy9GLElBQUkzQixZQUFZLEdBQUdQLG9CQUFvQixDQUFDLENBQUM7UUFDekMsSUFBR08sWUFBWSxFQUFFO1VBQ2YsSUFBR0gsYUFBYSxFQUFFO1lBQUVBLGFBQWEsQ0FBQ0ksS0FBSyxDQUFDLENBQUM7VUFBRTtVQUMzQ0osYUFBYSxHQUFHNUMsRUFBRSxDQUFDZ0YsUUFBUSxDQUFDO1lBQUM5QixJQUFJLEVBQUUsQ0FBQztZQUFFQyxFQUFFLEVBQUU7VUFBQyxDQUFDLEVBQUU7WUFBQ0QsSUFBSSxFQUFFLENBQUM7WUFBRUMsRUFBRSxFQUFFO1VBQUMsQ0FBQyxFQUFFO1lBQUU4QixVQUFVLEVBQUU7Y0FBRUMsT0FBTyxFQUFFO1lBQUssQ0FBQztZQUFFbEUsU0FBUyxFQUFFLFNBQVM7WUFBRW1FLE1BQU0sRUFBRSxJQUFJO1lBQUVDLGFBQWEsRUFBRSxJQUFJO1lBQUVDLGNBQWMsRUFBRTtVQUFNLENBQUMsQ0FBQztRQUNwTDtNQUNGLENBQUMsQ0FBQztJQUNKO0lBQ0EsSUFBSXBGLGNBQWMsRUFBRTtNQUNsQkQsRUFBRSxDQUFDc0YsT0FBTyxDQUFDQyxPQUFPLENBQUM1QixXQUFXLENBQUN4RyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ25ENkMsRUFBRSxDQUFDc0YsT0FBTyxDQUFDQyxPQUFPLENBQUM1QixXQUFXLENBQUN2RyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JEO0lBRUFvSSxtQkFBbUIsQ0FBQyxDQUFDO0lBRXJCLE9BQU87TUFDTHBNLEVBQUUsRUFBRTRHLEVBQUU7TUFDTjZDLGNBQWMsRUFBRUEsY0FBYztNQUM5Qm5KLE9BQU8sRUFBRSxTQUFUQSxPQUFPQSxDQUFBLEVBQWE7UUFBRXNHLEVBQUUsQ0FBQ3RHLE9BQU8sQ0FBQyxDQUFDO01BQUUsQ0FBQztNQUNyQ3FHLEdBQUcsRUFBRSxTQUFMQSxHQUFHQSxDQUFBLEVBQWE7UUFDZEgsTUFBTSxDQUFDSSxFQUFFLENBQUNqQyxRQUFRLENBQUMsQ0FBQyxDQUFDO01BQ3ZCLENBQUM7TUFDRDdGLEtBQUssRUFBRSxTQUFQQSxLQUFLQSxDQUFBLEVBQWE7UUFBRThILEVBQUUsQ0FBQzlILEtBQUssQ0FBQyxDQUFDO01BQUUsQ0FBQztNQUNqQ3VOLGFBQWEsRUFBRSxJQUFJLENBQUM7SUFDdEIsQ0FBQztFQUNILENBQUM7RUFDRGxKLEdBQUcsQ0FBQ21KLFFBQVEsR0FBRyxZQUFXO0lBQ3hCbkssT0FBTyxDQUFDQyxHQUFHLENBQUMsc0JBQXNCLEVBQUVFLFNBQVMsQ0FBQztFQUNoRCxDQUFDO0VBRUQsU0FBU2lLLFdBQVdBLENBQUNsTyxNQUFNLEVBQUU7SUFDM0IsSUFBSW1PLEtBQUssR0FBR3hRLE1BQU0sQ0FBQ3lRLElBQUksQ0FBQ0MsSUFBSSxDQUFDQyxRQUFRLENBQUMsQ0FBQyxDQUFDQyxZQUFZO0lBQ3BELE9BQU9DLEtBQUssQ0FBQyxrREFBa0QsRUFBRTtNQUMvREMsT0FBTyxFQUFFO1FBQUVDLGFBQWEsRUFBRSxTQUFTLEdBQUdQO01BQU07SUFDOUMsQ0FBQyxDQUFDLENBQUN6TixJQUFJLENBQUMsVUFBU21HLElBQUksRUFBRTtNQUNyQixPQUFPQSxJQUFJLENBQUM4SCxJQUFJLENBQUMsQ0FBQztJQUNwQixDQUFDLENBQUMsQ0FBQ2pPLElBQUksQ0FBQyxVQUFTa08sSUFBSSxFQUFFO01BQ3JCNU8sTUFBTSxDQUFDL0MsSUFBSSxDQUFDMlIsSUFBSSxDQUFDQyxLQUFLLENBQUM7SUFDekIsQ0FBQyxDQUFDO0VBQ0o7RUFFQUMsVUFBVSxDQUFDcE8sSUFBSSxDQUFDLFVBQVNxTyxHQUFHLEVBQUU7SUFDNUJBLEdBQUcsQ0FBQ0MsVUFBVSxDQUFDdE8sSUFBSSxDQUFDLFlBQVc7TUFDN0J2RCxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUNpQyxJQUFJLENBQUMsQ0FBQztNQUN0QmpDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQ29DLElBQUksQ0FBQyxDQUFDO01BQ3ZCMk8sV0FBVyxDQUFDL1EsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzdCLENBQUMsQ0FBQztJQUNGNFIsR0FBRyxDQUFDQyxVQUFVLENBQUNDLElBQUksQ0FBQyxZQUFXO01BQzdCOVIsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDb0MsSUFBSSxDQUFDLENBQUM7TUFDdEJwQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUNpQyxJQUFJLENBQUMsQ0FBQztJQUN6QixDQUFDLENBQUM7RUFDSixDQUFDLENBQUM7RUFFRjBQLFVBQVUsR0FBR0EsVUFBVSxDQUFDcE8sSUFBSSxDQUFDLFVBQVNxTyxHQUFHLEVBQUU7SUFBRSxPQUFPQSxHQUFHLENBQUNBLEdBQUc7RUFBRSxDQUFDLENBQUM7RUFDL0Q1UixDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQ3FDLEtBQUssQ0FBQyxZQUFXO0lBQ25DckMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUNGLElBQUksQ0FBQyxlQUFlLENBQUM7SUFDekNFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDRSxJQUFJLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQztJQUNoREYsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUNFLElBQUksQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDO0lBQ2xERixDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQ0UsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUM7SUFDMUM7SUFDQTBRLG1CQUFtQixDQUFDLENBQUM7SUFDckJlLFVBQVUsR0FBR0ksMEJBQTBCLENBQUM1TCxnQkFBb0IsRUFBRSxLQUFLLENBQUM7SUFDcEV3TCxVQUFVLENBQUNwTyxJQUFJLENBQUMsVUFBU3FPLEdBQUcsRUFBRTtNQUM1QkEsR0FBRyxDQUFDQyxVQUFVLENBQUN0TyxJQUFJLENBQUMsWUFBVztRQUM3QnZELENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQ2lDLElBQUksQ0FBQyxDQUFDO1FBQ3RCakMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDb0MsSUFBSSxDQUFDLENBQUM7UUFDdkJXLFFBQVEsQ0FBQ2tQLGFBQWEsQ0FBQ0MsSUFBSSxDQUFDLENBQUM7UUFDN0JsUyxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQ3NELEtBQUssQ0FBQyxDQUFDO1FBQzlCeU4sV0FBVyxDQUFDL1EsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzNCLElBQUdxSCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUlBLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRTtVQUM1QyxJQUFJOEssTUFBTSxHQUFHUCxHQUFHLENBQUNBLEdBQUcsQ0FBQ1EsV0FBVyxDQUFDL0ssTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1VBQzFEVixPQUFPLENBQUNDLEdBQUcsQ0FBQyxxQ0FBcUMsRUFBRXVMLE1BQU0sQ0FBQztVQUMxREUsV0FBVyxDQUFDRixNQUFNLENBQUM7VUFDbkJHLGFBQWEsR0FBR0gsTUFBTTtRQUN4QixDQUFDLE1BQU07VUFDTEcsYUFBYSxHQUFHMVMsQ0FBQyxDQUFDMlMsS0FBSyxDQUFDLFlBQVc7WUFBRSxPQUFPLElBQUk7VUFBRSxDQUFDLENBQUM7UUFDdEQ7TUFDRixDQUFDLENBQUM7TUFDRlgsR0FBRyxDQUFDQyxVQUFVLENBQUNDLElBQUksQ0FBQyxZQUFXO1FBQzdCOVIsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUNGLElBQUksQ0FBQyx5QkFBeUIsQ0FBQztRQUNuREUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUNFLElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDO1FBQzNDRixDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQ0UsSUFBSSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUM7UUFDN0M7UUFDQTZDLFFBQVEsQ0FBQ2tQLGFBQWEsQ0FBQ0MsSUFBSSxDQUFDLENBQUM7UUFDN0JsUyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQ3NELEtBQUssQ0FBQyxDQUFDO1FBQzNCO01BQ0YsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0lBQ0ZxTyxVQUFVLEdBQUdBLFVBQVUsQ0FBQ3BPLElBQUksQ0FBQyxVQUFTcU8sR0FBRyxFQUFFO01BQUUsT0FBT0EsR0FBRyxDQUFDQSxHQUFHO0lBQUUsQ0FBQyxDQUFDO0VBQ2pFLENBQUMsQ0FBQzs7RUFFRjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFHRSxJQUFJWSxjQUFjLEdBQUdiLFVBQVUsQ0FBQ3BPLElBQUksQ0FBQyxVQUFTcU8sR0FBRyxFQUFFO0lBQ2pELElBQUlhLFdBQVcsR0FBRyxJQUFJO0lBQ3RCLElBQUdwTCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUlBLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRTtNQUM1Q3FMLGlCQUFpQixDQUFDLENBQUM7TUFDbkJELFdBQVcsR0FBR2IsR0FBRyxDQUFDUSxXQUFXLENBQUMvSyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7TUFDdkRvTCxXQUFXLENBQUNsUCxJQUFJLENBQUMsVUFBU29QLENBQUMsRUFBRTtRQUFFQyxrQkFBa0IsQ0FBQ0QsQ0FBQyxDQUFDO01BQUUsQ0FBQyxDQUFDO0lBQzFELENBQUMsTUFDSSxJQUFHdEwsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJQSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUU7TUFDL0M0QixNQUFNLENBQUNyQyxHQUFHLENBQUMscUJBQXFCLEVBQzlCO1FBQ0U5QyxFQUFFLEVBQUV1RCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTztNQUMzQixDQUFDLENBQUM7TUFDSm9MLFdBQVcsR0FBR2IsR0FBRyxDQUFDaUIsaUJBQWlCLENBQUN4TCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7TUFDM0RvTCxXQUFXLENBQUNsUCxJQUFJLENBQUMsVUFBU3VQLElBQUksRUFBRTtRQUM5QjtRQUNBO1FBQ0E7UUFDQUEsSUFBSSxDQUFDQyxXQUFXLENBQUMsQ0FBQyxDQUFDeFAsSUFBSSxDQUFDLFVBQVN5UCxRQUFRLEVBQUU7VUFDekNyTSxPQUFPLENBQUNDLEdBQUcsQ0FBQyx5QkFBeUIsRUFBRW9NLFFBQVEsQ0FBQztVQUNoRCxJQUFJQyxRQUFRLEdBQUdqVCxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQ2lDLElBQUksQ0FBQyxDQUFDLENBQUNlLEdBQUcsQ0FBQyxPQUFPLENBQUM7VUFDdEQsSUFBSWMsRUFBRSxHQUFHa1AsUUFBUSxDQUFDRSxNQUFNLENBQUNqUCxLQUFLO1VBQzlCZ1AsUUFBUSxDQUFDRSxXQUFXLENBQUMsUUFBUSxDQUFDO1VBQzlCRixRQUFRLENBQUM1USxLQUFLLENBQUMsWUFBVztZQUN4QjdCLE1BQU0sQ0FBQzRTLElBQUksQ0FBQzVTLE1BQU0sQ0FBQ3NPLFlBQVksR0FBRyxrQkFBa0IsR0FBR2hMLEVBQUUsRUFBRSxRQUFRLENBQUM7VUFDdEUsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxNQUNJLElBQUd1RCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUlBLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRTtNQUNsRDRCLE1BQU0sQ0FBQ3JDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRTtRQUFFTixHQUFHLEVBQUVlLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVO01BQUUsQ0FBQyxDQUFDO01BQ3JFb0wsV0FBVyxHQUFHLElBQUk7SUFDcEIsQ0FBQyxNQUNJO01BQ0hBLFdBQVcsR0FBRyxJQUFJO0lBQ3BCO0lBQ0EsSUFBR0EsV0FBVyxFQUFFO01BQ2RBLFdBQVcsQ0FBQ1gsSUFBSSxDQUFDLFVBQVNqSyxHQUFHLEVBQUU7UUFDN0JsQixPQUFPLENBQUNLLEtBQUssQ0FBQ2EsR0FBRyxDQUFDO1FBQ2xCckgsTUFBTSxDQUFDaUgsVUFBVSxDQUFDLDZCQUE2QixDQUFDO01BQ2xELENBQUMsQ0FBQztNQUNGLE9BQU9nTCxXQUFXO0lBQ3BCLENBQUMsTUFBTTtNQUNMLE9BQU8sSUFBSTtJQUNiO0VBQ0YsQ0FBQyxDQUFDO0VBRUYsU0FBU1ksUUFBUUEsQ0FBQ0MsUUFBUSxFQUFFO0lBQzFCdlEsUUFBUSxDQUFDM0IsS0FBSyxHQUFHa1MsUUFBUSxHQUFHLEtBQUssR0FBR25OLGdCQUFvQjtJQUN4RG5HLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQ0YsSUFBSSxDQUFDLFFBQVEsR0FBR3dULFFBQVEsQ0FBQztFQUM5QztFQUNBM0wsR0FBRyxDQUFDMEwsUUFBUSxHQUFHQSxRQUFRO0VBRXZCLElBQUlFLFFBQVEsR0FBRyxLQUFLO0VBRXBCdlQsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDcUMsS0FBSyxDQUFDLFlBQVc7SUFDaEMsSUFBSW1SLFdBQVcsR0FBR3hULENBQUMsQ0FBQyxhQUFhLENBQUM7SUFDbEMsSUFBSXlULFFBQVEsR0FBRzlMLEdBQUcsQ0FBQytMLFNBQVMsQ0FBQ0MsYUFBYSxDQUFDQyxjQUFjLENBQUMsQ0FBQztJQUMzRCxJQUFJQyxZQUFZLEdBQUdyVCxNQUFNLENBQUNzVCxHQUFHLENBQUNDLGVBQWUsQ0FBQyxJQUFJQyxJQUFJLENBQUMsQ0FBQ1AsUUFBUSxDQUFDLEVBQUU7TUFBQ1EsSUFBSSxFQUFFO0lBQVksQ0FBQyxDQUFDLENBQUM7SUFDekYsSUFBRyxDQUFDVixRQUFRLEVBQUU7TUFBRUEsUUFBUSxHQUFHLHNCQUFzQjtJQUFFO0lBQ25ELElBQUdBLFFBQVEsQ0FBQzFTLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBTTBTLFFBQVEsQ0FBQ3hTLE1BQU0sR0FBRyxDQUFFLEVBQUU7TUFDckR3UyxRQUFRLElBQUksTUFBTTtJQUNwQjtJQUNBQyxXQUFXLENBQUN0VCxJQUFJLENBQUM7TUFDZmdVLFFBQVEsRUFBRVgsUUFBUTtNQUNsQm5NLElBQUksRUFBRXlNO0lBQ1IsQ0FBQyxDQUFDO0lBQ0Y3VCxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUNvRSxNQUFNLENBQUNvUCxXQUFXLENBQUM7RUFDcEMsQ0FBQyxDQUFDO0VBRUYsU0FBU1csU0FBU0EsQ0FBQ0MsY0FBYyxFQUFFO0lBQ2pDLFNBQVM5TyxXQUFXQSxDQUFDRixLQUFLLEVBQUU7TUFDMUIsSUFBTWlQLE9BQU8sR0FBR3JVLENBQUMsQ0FBQyxPQUFPLENBQUM7TUFDMUIsSUFBTXNVLFFBQVEsR0FBR3RVLENBQUMsQ0FBQyxLQUFLLENBQUM7TUFDekIsSUFBTXVVLE1BQU0sR0FBR3ZVLENBQUMsQ0FBQyw2QkFBNkIsQ0FBQztNQUMvQyxJQUFNd1UsaUJBQWlCLEdBQUd4VSxDQUFDLENBQUMsTUFBTSxHQUFHb1UsY0FBYyxHQUFHLE9BQU8sQ0FBQztNQUM5REUsUUFBUSxDQUFDbFEsTUFBTSxDQUFDLDhGQUE4RixFQUFFb1EsaUJBQWlCLEVBQUUsR0FBRyxDQUFDO01BQ3ZJLElBQU1DLFVBQVUsR0FBR3pVLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQztNQUM1QyxJQUFNMFUsSUFBSSxHQUFHMVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUNuQm9FLE1BQU0sQ0FBQ3BFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQ29FLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRXFRLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUM1RHJRLE1BQU0sQ0FBQ3BFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQ29FLE1BQU0sQ0FBQywrQkFBK0IsRUFBRW1RLE1BQU0sRUFBRSwyQ0FBMkMsQ0FBQyxDQUFDO01BQ2pIRixPQUFPLENBQUNqUSxNQUFNLENBQUNrUSxRQUFRLENBQUM7TUFDeEJELE9BQU8sQ0FBQ2pRLE1BQU0sQ0FBQ3BFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQ29FLE1BQU0sQ0FBQ3NRLElBQUksQ0FBQyxDQUFDO01BQ3JDLElBQU1DLFVBQVUsR0FBRzNVLENBQUMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDcUQsR0FBRyxDQUFDO1FBQUUsV0FBVyxFQUFFLEdBQUc7UUFBRSxlQUFlLEVBQUU7TUFBTSxDQUFDLENBQUM7TUFDOUYsSUFBTXVSLFlBQVksR0FBRzVVLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQ29FLE1BQU0sQ0FBQ2dCLEtBQUssQ0FBQyxDQUFDL0IsR0FBRyxDQUFDO1FBQUUsV0FBVyxFQUFFO01BQUksQ0FBQyxDQUFDO01BQ3ZFLElBQU13UixLQUFLLEdBQUc3VSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUNxRCxHQUFHLENBQUM7UUFDM0JxTixPQUFPLEVBQUUsTUFBTTtRQUNmLGdCQUFnQixFQUFFLEtBQUs7UUFDdkIsaUJBQWlCLEVBQUUsWUFBWTtRQUMvQixhQUFhLEVBQUU7TUFDakIsQ0FBQyxDQUFDO01BQ0ZtRSxLQUFLLENBQUN6USxNQUFNLENBQUN1USxVQUFVLENBQUMsQ0FBQ3ZRLE1BQU0sQ0FBQ3dRLFlBQVksQ0FBQztNQUM3Q1AsT0FBTyxDQUFDalEsTUFBTSxDQUFDeVEsS0FBSyxDQUFDO01BQ3JCLE9BQU9SLE9BQU87SUFDaEI7SUFDQSxJQUFNUyxlQUFlLEdBQUcsSUFBSXRPLFdBQVcsQ0FBQztNQUNwQ3BGLEtBQUssRUFBRSxrQkFBa0I7TUFDekJOLEtBQUssRUFBRSxNQUFNO01BQ2JILE9BQU8sRUFBRSxDQUNQO1FBQ0UyRSxXQUFXLEVBQUVBLFdBQVc7UUFDeEI5RCxVQUFVLEVBQUUsa0JBQWtCO1FBQzlCNkQsWUFBWSxFQUFFK087TUFDaEIsQ0FBQztJQUVMLENBQUMsQ0FBQztJQUNKVSxlQUFlLENBQUM3UyxJQUFJLENBQUMsVUFBQ2lSLE1BQU0sRUFBSztNQUMvQixJQUFHLENBQUNBLE1BQU0sRUFBRTtRQUFFO01BQVE7TUFDdEIsSUFBR0EsTUFBTSxDQUFDbkYsS0FBSyxDQUFDLGVBQWUsQ0FBQyxFQUFFO1FBQUVtRixNQUFNLEdBQUdBLE1BQU0sQ0FBQzZCLEtBQUssQ0FBQyxjQUFjLENBQUNoVSxNQUFNLENBQUM7TUFBRTtNQUNsRjRHLEdBQUcsQ0FBQ3FOLE1BQU0sQ0FBQy9HLGNBQWMsQ0FBQyxjQUFjLEdBQUdpRixNQUFNLEdBQUcsSUFBSSxDQUFDO0lBQzNELENBQUMsQ0FBQztFQUNKO0VBQ0FsVCxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQ0csRUFBRSxDQUFDLE9BQU8sRUFBRSxZQUFXO0lBQUVnVSxTQUFTLENBQUN4TSxHQUFHLENBQUNxTixNQUFNLENBQUN4USxFQUFFLENBQUNzSixPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUNpSCxLQUFLLENBQUMsY0FBYyxDQUFDaFUsTUFBTSxDQUFDLENBQUM7RUFBRSxDQUFDLENBQUM7RUFFbEgsSUFBSWtVLGVBQWUsR0FBRyxFQUFFO0VBRXhCLFNBQVNDLFlBQVlBLENBQUNyTSxJQUFJLEVBQUU7SUFDMUIsSUFBR0EsSUFBSSxDQUFDOUgsTUFBTSxJQUFJa1UsZUFBZSxHQUFHLENBQUMsRUFBRTtNQUFFLE9BQU9wTSxJQUFJO0lBQUU7SUFDdEQsT0FBT0EsSUFBSSxDQUFDa00sS0FBSyxDQUFDLENBQUMsRUFBRUUsZUFBZSxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBR3BNLElBQUksQ0FBQ2tNLEtBQUssQ0FBQ2xNLElBQUksQ0FBQzlILE1BQU0sR0FBR2tVLGVBQWUsR0FBRyxDQUFDLEVBQUVwTSxJQUFJLENBQUM5SCxNQUFNLENBQUM7RUFDOUc7RUFFQSxTQUFTb1UsVUFBVUEsQ0FBQ3hDLENBQUMsRUFBRTtJQUNyQlksUUFBUSxHQUFHWixDQUFDLENBQUN5QyxPQUFPLENBQUMsQ0FBQztJQUN0QnBWLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQ0YsSUFBSSxDQUFDLElBQUksR0FBR29WLFlBQVksQ0FBQzNCLFFBQVEsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUN4RHZULENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQ0UsSUFBSSxDQUFDLE9BQU8sRUFBRXFULFFBQVEsQ0FBQztJQUN0Q0YsUUFBUSxDQUFDRSxRQUFRLENBQUM7SUFDbEJYLGtCQUFrQixDQUFDRCxDQUFDLENBQUM7RUFDdkI7RUFFQSxTQUFTTixXQUFXQSxDQUFDTSxDQUFDLEVBQUU7SUFDdEJMLGFBQWEsR0FBR0ssQ0FBQztJQUNqQixPQUFPQSxDQUFDLENBQUNwUCxJQUFJLENBQUMsVUFBUzhSLElBQUksRUFBRTtNQUMzQixJQUFHQSxJQUFJLEtBQUssSUFBSSxFQUFFO1FBQ2hCRixVQUFVLENBQUNFLElBQUksQ0FBQztRQUNoQixJQUFHQSxJQUFJLENBQUNkLE1BQU0sRUFBRTtVQUNkL1QsTUFBTSxDQUFDNEgsWUFBWSxDQUFDLDZKQUE2SixDQUFDO1FBQ3BMO1FBQ0EsT0FBT2lOLElBQUksQ0FBQ0MsV0FBVyxDQUFDLENBQUM7TUFDM0IsQ0FBQyxNQUNJO1FBQ0gsSUFBR2pPLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUVBLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSUEsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUU7VUFDM0YsT0FBT0EsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDO1FBQ3hDLENBQUMsTUFDSTtVQUNILE9BQU8yQyxxQkFBcUI7UUFDOUI7TUFDRjtJQUNGLENBQUMsQ0FBQztFQUNKO0VBRUEsU0FBU3VMLEdBQUdBLENBQUNwTixHQUFHLEVBQUVxTixNQUFNLEVBQUU7SUFDeEIsSUFBSXJOLEdBQUcsS0FBSyxFQUFFLEVBQUU7SUFDaEIsSUFBSXNOLGFBQWEsR0FBRzFTLFFBQVEsQ0FBQzJTLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQztJQUMvRCxJQUFJQyxFQUFFLEdBQUc1UyxRQUFRLENBQUMwTCxhQUFhLENBQUMsSUFBSSxDQUFDO0lBQ3JDa0gsRUFBRSxDQUFDNUcsV0FBVyxDQUFDaE0sUUFBUSxDQUFDNlMsY0FBYyxDQUFDek4sR0FBRyxDQUFDLENBQUM7SUFDNUNzTixhQUFhLENBQUNJLFlBQVksQ0FBQ0YsRUFBRSxFQUFFRixhQUFhLENBQUNLLFVBQVUsQ0FBQztJQUN4RCxJQUFJTixNQUFNLEVBQUU7TUFDVjNRLFVBQVUsQ0FBQyxZQUFXO1FBQ3BCNFEsYUFBYSxDQUFDTSxXQUFXLENBQUNKLEVBQUUsQ0FBQztNQUMvQixDQUFDLEVBQUUsSUFBSSxDQUFDO0lBQ1Y7RUFDRjtFQUVBLFNBQVMvTixZQUFZQSxDQUFDTyxHQUFHLEVBQUU7SUFDekJ4QixPQUFPLENBQUNDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRXVCLEdBQUcsQ0FBQztJQUN0Q29OLEdBQUcsQ0FBQ3BOLEdBQUcsRUFBRSxJQUFJLENBQUM7RUFDaEI7RUFFQSxTQUFTNk4sWUFBWUEsQ0FBQ0MsU0FBUyxFQUFFQyxRQUFRLEVBQUVDLFFBQVEsRUFBRTtJQUNuRCxJQUFJQyxTQUFTLEdBQUdILFNBQVMsSUFBSUUsUUFBUSxHQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQy9DQyxTQUFTLEdBQUcsQ0FBRUEsU0FBUyxHQUFHRixRQUFRLEdBQUlBLFFBQVEsSUFBSUEsUUFBUTtJQUMxRCxPQUFPRSxTQUFTO0VBQ2xCO0VBRUEsU0FBU0MscUJBQXFCQSxDQUFDckIsTUFBTSxFQUFFO0lBQ3JDLElBQUksQ0FBQ0EsTUFBTSxDQUFDbkUsYUFBYSxFQUFFO01BQ3pCbUUsTUFBTSxDQUFDbkUsYUFBYSxHQUFHLEVBQUU7SUFDM0I7SUFDQSxJQUFJeUYsRUFBRSxHQUFHdEIsTUFBTSxDQUFDbkUsYUFBYTtJQUM3QixJQUFJMEYsT0FBTyxHQUFHeFQsUUFBUSxDQUFDMlMsY0FBYyxDQUFDLE1BQU0sQ0FBQztJQUM3QyxJQUFJLENBQUNZLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRTtNQUNWLElBQUlFLE9BQU8sR0FBR3pULFFBQVEsQ0FBQzJTLGNBQWMsQ0FBQyxTQUFTLENBQUM7TUFDaERZLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBR0UsT0FBTztNQUNmO01BQ0E7TUFDQTtJQUNGO0lBQ0EsSUFBSSxDQUFDRixFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUU7TUFDVixJQUFJRyxXQUFXLEdBQUdGLE9BQU8sQ0FBQ0csc0JBQXNCLENBQUMsVUFBVSxDQUFDO01BQzVELElBQUlDLFlBQVk7TUFDaEIsSUFBSUYsV0FBVyxDQUFDMVYsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUM1QjRWLFlBQVksR0FBR0MsU0FBUztNQUMxQixDQUFDLE1BQU0sSUFBSUgsV0FBVyxDQUFDMVYsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUNuQzRWLFlBQVksR0FBR0YsV0FBVyxDQUFDLENBQUMsQ0FBQztNQUMvQixDQUFDLE1BQU07UUFDTCxLQUFLLElBQUk3USxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUc2USxXQUFXLENBQUMxVixNQUFNLEVBQUU2RSxDQUFDLEVBQUUsRUFBRTtVQUMzQyxJQUFJNlEsV0FBVyxDQUFDN1EsQ0FBQyxDQUFDLENBQUMrSSxTQUFTLEtBQUssRUFBRSxFQUFFO1lBQ25DZ0ksWUFBWSxHQUFHRixXQUFXLENBQUM3USxDQUFDLENBQUM7VUFDL0I7UUFDRjtNQUNGO01BQ0EwUSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUdLLFlBQVk7SUFDdEI7SUFDQSxJQUFJLENBQUNMLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRTtNQUNWLElBQUlPLE9BQU8sR0FBR04sT0FBTyxDQUFDRyxzQkFBc0IsQ0FBQyxNQUFNLENBQUM7TUFDcEQsSUFBSUksV0FBVyxHQUFHRCxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUNILHNCQUFzQixDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQ3hFQSxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDekNKLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBR1EsV0FBVztJQUNyQjtJQUNBLElBQUksQ0FBQ1IsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFO01BQ1ZBLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBR3ZULFFBQVEsQ0FBQzJTLGNBQWMsQ0FBQyxlQUFlLENBQUM7SUFDbEQ7RUFDRjtFQUVBLFNBQVNxQixVQUFVQSxDQUFDWixRQUFRLEVBQUU7SUFDNUI7SUFDQSxJQUFJbkIsTUFBTSxHQUFHLElBQUksQ0FBQ0EsTUFBTTtJQUN4QnFCLHFCQUFxQixDQUFDckIsTUFBTSxDQUFDO0lBQzdCLElBQUlnQyxTQUFTLEdBQUdoQyxNQUFNLENBQUNuRSxhQUFhO0lBQ3BDLElBQUlxRixRQUFRLEdBQUdjLFNBQVMsQ0FBQ2pXLE1BQU07SUFDL0IsSUFBSWtXLGlCQUFpQixHQUFHRCxTQUFTLENBQUNFLElBQUksQ0FBQyxVQUFTQyxJQUFJLEVBQUU7TUFDcEQsSUFBSSxDQUFDQSxJQUFJLEVBQUU7UUFDVCxPQUFPLEtBQUs7TUFDZCxDQUFDLE1BQU07UUFDTCxPQUFPQSxJQUFJLENBQUNDLFFBQVEsQ0FBQ3JVLFFBQVEsQ0FBQ2tQLGFBQWEsQ0FBQztNQUM5QztJQUNGLENBQUMsQ0FBQztJQUNGLElBQUlvRixpQkFBaUIsR0FBR0wsU0FBUyxDQUFDblcsT0FBTyxDQUFDb1csaUJBQWlCLENBQUM7SUFDNUQsSUFBSUssY0FBYyxHQUFHRCxpQkFBaUI7SUFDdEMsSUFBSUUsUUFBUTtJQUNaLEdBQUc7TUFDREQsY0FBYyxHQUFHdEIsWUFBWSxDQUFDc0IsY0FBYyxFQUFFcEIsUUFBUSxFQUFFQyxRQUFRLENBQUM7TUFDakVvQixRQUFRLEdBQUdQLFNBQVMsQ0FBQ00sY0FBYyxDQUFDO01BQ3BDO0lBQ0YsQ0FBQyxRQUFRLENBQUNDLFFBQVE7SUFFbEIsSUFBSUMsU0FBUztJQUNiLElBQUlELFFBQVEsQ0FBQ0UsU0FBUyxDQUFDTCxRQUFRLENBQUMsZUFBZSxDQUFDLEVBQUU7TUFDaEQ7TUFDQXhHLG1CQUFtQixDQUFDLENBQUM7TUFDckI0RyxTQUFTLEdBQUd6VSxRQUFRLENBQUMyUyxjQUFjLENBQUMsa0JBQWtCLENBQUM7SUFDekQsQ0FBQyxNQUFNLElBQUk2QixRQUFRLENBQUNFLFNBQVMsQ0FBQ0wsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUNoREcsUUFBUSxDQUFDRSxTQUFTLENBQUNMLFFBQVEsQ0FBQyxZQUFZLENBQUMsRUFBRTtNQUMzQztNQUNBLElBQUlNLFNBQVMsR0FBR0gsUUFBUSxDQUFDSSxvQkFBb0IsQ0FBQyxVQUFVLENBQUM7TUFDekQ7TUFDQTtNQUNBLElBQUlELFNBQVMsQ0FBQzNXLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDMUI7UUFDQXlXLFNBQVMsR0FBR0QsUUFBUTtNQUN0QixDQUFDLE1BQU0sSUFBSUcsU0FBUyxDQUFDM1csTUFBTSxLQUFLLENBQUMsRUFBRTtRQUNqQztRQUNBeVcsU0FBUyxHQUFHRSxTQUFTLENBQUMsQ0FBQyxDQUFDO01BQzFCLENBQUMsTUFBTTtRQUNMO1FBQ0E7QUFDUjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7UUFDUUYsU0FBUyxHQUFHRSxTQUFTLENBQUNBLFNBQVMsQ0FBQzNXLE1BQU0sR0FBQyxDQUFDLENBQUM7UUFDekN5VyxTQUFTLENBQUNJLGVBQWUsQ0FBQyxVQUFVLENBQUM7TUFDdkM7SUFDRixDQUFDLE1BQU07TUFDTDtNQUNBSixTQUFTLEdBQUdELFFBQVE7SUFDdEI7SUFFQXhVLFFBQVEsQ0FBQ2tQLGFBQWEsQ0FBQ0MsSUFBSSxDQUFDLENBQUM7SUFDN0JzRixTQUFTLENBQUNuVixLQUFLLENBQUMsQ0FBQztJQUNqQm1WLFNBQVMsQ0FBQ2xVLEtBQUssQ0FBQyxDQUFDO0lBQ2pCO0VBQ0Y7RUFFQSxJQUFJdVUsYUFBYSxHQUFHeEYsV0FBVyxDQUFDRyxjQUFjLENBQUM7RUFFL0MsSUFBSUYsYUFBYSxHQUFHRSxjQUFjO0VBRWxDLFNBQVNJLGtCQUFrQkEsQ0FBQ0QsQ0FBQyxFQUFFO0lBQzdCO0lBQ0EsSUFBRyxDQUFDQSxDQUFDLENBQUM0QixNQUFNLEVBQUU7TUFDWnZVLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDeUQsS0FBSyxDQUFDLENBQUM7TUFDNUJ6RCxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUNpQyxJQUFJLENBQUMsQ0FBQztNQUN0QmpDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDb0UsTUFBTSxDQUFDNkIsUUFBUSxDQUFDNlIsYUFBYSxDQUFDbkYsQ0FBQyxDQUFDLENBQUM7TUFDdEQvQixtQkFBbUIsQ0FBQyxDQUFDO0lBQ3ZCO0VBQ0Y7RUFFQSxTQUFTbUgsY0FBY0EsQ0FBQSxFQUFHO0lBQ3hCLE9BQU94RSxRQUFRLElBQUksVUFBVTtFQUMvQjtFQUNBLFNBQVN4SixRQUFRQSxDQUFBLEVBQUc7SUFDbEJ1SSxhQUFhLENBQUMvTyxJQUFJLENBQUMsVUFBU29QLENBQUMsRUFBRTtNQUM3QixJQUFHQSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUNBLENBQUMsQ0FBQzRCLE1BQU0sRUFBRTtRQUFFekssSUFBSSxDQUFDLENBQUM7TUFBRTtJQUN4QyxDQUFDLENBQUM7RUFDSjtFQUVBLFNBQVM0SSxpQkFBaUJBLENBQUEsRUFBRztJQUMzQjFTLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDbVQsV0FBVyxDQUFDLFVBQVUsQ0FBQztFQUNsRDtFQUVBLFNBQVM2RSxnQkFBZ0JBLENBQUNsVSxFQUFFLEVBQUU7SUFDNUIsT0FBTzlELENBQUMsQ0FBQyxHQUFHLEdBQUc4RCxFQUFFLENBQUMsQ0FBQ21VLFFBQVEsQ0FBQyxVQUFVLENBQUM7RUFDekM7RUFFQSxTQUFTQyxRQUFRQSxDQUFDelYsQ0FBQyxFQUFFO0lBQ25CakMsTUFBTSxDQUFDNFMsSUFBSSxDQUFDNVMsTUFBTSxDQUFDc08sWUFBWSxHQUFHLFNBQVMsQ0FBQztFQUM5QztFQUVBLFNBQVNxSixTQUFTQSxDQUFDMVYsQ0FBQyxFQUFFO0lBQ3BCLElBQUd1VixnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsRUFBRTtNQUFFO0lBQVE7SUFDdkMsT0FBT2xPLElBQUksQ0FBQyxDQUFDO0VBQ2Y7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUlFLFNBQVNBLElBQUlBLENBQUNzTyxXQUFXLEVBQUU7SUFDekIsSUFBSUMsT0FBTyxFQUFFQyxNQUFNO0lBQ25CLElBQUdGLFdBQVcsS0FBS3hCLFNBQVMsRUFBRTtNQUM1QnlCLE9BQU8sR0FBR0QsV0FBVztNQUNyQkUsTUFBTSxHQUFHLElBQUk7SUFDZixDQUFDLE1BQ0ksSUFBRy9FLFFBQVEsS0FBSyxLQUFLLEVBQUU7TUFDMUJBLFFBQVEsR0FBRyxVQUFVO01BQ3JCK0UsTUFBTSxHQUFHLElBQUk7SUFDZixDQUFDLE1BQ0k7TUFDSEQsT0FBTyxHQUFHOUUsUUFBUSxDQUFDLENBQUM7TUFDcEIrRSxNQUFNLEdBQUcsS0FBSztJQUNoQjtJQUNBOVgsTUFBTSxDQUFDNEgsWUFBWSxDQUFDLFdBQVcsQ0FBQztJQUNoQyxJQUFJbVEsWUFBWSxHQUFHakcsYUFBYSxDQUFDL08sSUFBSSxDQUFDLFVBQVNvUCxDQUFDLEVBQUU7TUFDaEQsSUFBR0EsQ0FBQyxLQUFLLElBQUksSUFBSUEsQ0FBQyxDQUFDNEIsTUFBTSxJQUFJLENBQUMrRCxNQUFNLEVBQUU7UUFDcEMsT0FBTzNGLENBQUMsQ0FBQyxDQUFDO01BQ1o7TUFDQSxJQUFHMkYsTUFBTSxFQUFFO1FBQ1RoRyxhQUFhLEdBQUdYLFVBQVUsQ0FDdkJwTyxJQUFJLENBQUMsVUFBU3FPLEdBQUcsRUFBRTtVQUFFLE9BQU9BLEdBQUcsQ0FBQzRHLFVBQVUsQ0FBQ0gsT0FBTyxFQUFFO1lBQUNJLGFBQWEsRUFBRTtVQUFLLENBQUMsQ0FBQztRQUFFLENBQUMsQ0FBQyxDQUMvRWxWLElBQUksQ0FBQyxVQUFTb1AsQ0FBQyxFQUFFO1VBQ2hCO1VBQ0ErRixPQUFPLENBQUNDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFdBQVcsR0FBR2hHLENBQUMsQ0FBQ2lHLFdBQVcsQ0FBQyxDQUFDLENBQUM7VUFDNUR6RCxVQUFVLENBQUN4QyxDQUFDLENBQUMsQ0FBQyxDQUFDO1VBQ2ZELGlCQUFpQixDQUFDLENBQUM7VUFDbkIsT0FBT0MsQ0FBQztRQUNWLENBQUMsQ0FBQztRQUNKLE9BQU9MLGFBQWEsQ0FBQy9PLElBQUksQ0FBQyxVQUFTb1AsQ0FBQyxFQUFFO1VBQ3BDLE9BQU83SSxJQUFJLENBQUMsQ0FBQztRQUNmLENBQUMsQ0FBQztNQUNKLENBQUMsTUFDSTtRQUNILE9BQU93SSxhQUFhLENBQUMvTyxJQUFJLENBQUMsVUFBU29QLENBQUMsRUFBRTtVQUNwQyxJQUFHQSxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ2IsT0FBTyxJQUFJO1VBQ2IsQ0FBQyxNQUNJO1lBQ0gsSUFBSWtHLE1BQU0sR0FBR2xSLEdBQUcsQ0FBQytMLFNBQVMsQ0FBQ29GLG1CQUFtQixDQUFDLENBQUM7WUFDaERuUyxPQUFPLENBQUNDLEdBQUcsQ0FBQyxTQUFTLEVBQUdpUyxNQUFNLENBQUM7WUFDL0IsT0FBT2xHLENBQUMsQ0FBQzdJLElBQUksQ0FBQytPLE1BQU0sRUFBRSxLQUFLLENBQUM7VUFDOUI7UUFDRixDQUFDLENBQUMsQ0FBQ3RWLElBQUksQ0FBQyxVQUFTb1AsQ0FBQyxFQUFFO1VBQ2xCLElBQUdBLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDYm5TLE1BQU0sQ0FBQzBILFlBQVksQ0FBQyxtQkFBbUIsR0FBR3lLLENBQUMsQ0FBQ3lDLE9BQU8sQ0FBQyxDQUFDLENBQUM7VUFDeEQ7VUFDQSxPQUFPekMsQ0FBQztRQUNWLENBQUMsQ0FBQztNQUNKO0lBQ0YsQ0FBQyxDQUFDO0lBQ0Y0RixZQUFZLENBQUN6RyxJQUFJLENBQUMsVUFBU2pLLEdBQUcsRUFBRTtNQUM5QnJILE1BQU0sQ0FBQ2lILFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRSxvUEFBb1AsQ0FBQztNQUN6UmQsT0FBTyxDQUFDSyxLQUFLLENBQUNhLEdBQUcsQ0FBQztJQUNwQixDQUFDLENBQUM7SUFDRixPQUFPMFEsWUFBWTtFQUNyQjtFQUVBLFNBQVNRLE1BQU1BLENBQUEsRUFBRztJQUNoQixJQUFHZixnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtNQUFFO0lBQVE7SUFDekMxRixhQUFhLENBQUMvTyxJQUFJLENBQUMsVUFBU29QLENBQUMsRUFBRTtNQUM3QixJQUFJOUosSUFBSSxHQUFHOEosQ0FBQyxLQUFLLElBQUksR0FBRyxVQUFVLEdBQUdBLENBQUMsQ0FBQ3lDLE9BQU8sQ0FBQyxDQUFDO01BQ2hELElBQUk0RCxZQUFZLEdBQUcsSUFBSXhTLFdBQVcsQ0FBQztRQUNqQ3BGLEtBQUssRUFBRSxhQUFhO1FBQ3BCTixLQUFLLEVBQUUsTUFBTTtRQUNiVSxVQUFVLEVBQUUsTUFBTTtRQUNsQkcsTUFBTSxFQUFFLElBQUk7UUFDWmhCLE9BQU8sRUFBRSxDQUNQO1VBQ0V1RCxPQUFPLEVBQUUsd0JBQXdCO1VBQ2pDbUIsWUFBWSxFQUFFd0Q7UUFDaEIsQ0FBQztNQUVMLENBQUMsQ0FBQztNQUNGLE9BQU9tUSxZQUFZLENBQUMvVyxJQUFJLENBQUMsQ0FBQyxDQUFDc0IsSUFBSSxDQUFDLFVBQVMwVixPQUFPLEVBQUU7UUFDaEQsSUFBR0EsT0FBTyxLQUFLLElBQUksRUFBRTtVQUFFLE9BQU8sSUFBSTtRQUFFO1FBQ3BDelksTUFBTSxDQUFDNEgsWUFBWSxDQUFDLFdBQVcsQ0FBQztRQUNoQyxPQUFPMEIsSUFBSSxDQUFDbVAsT0FBTyxDQUFDO01BQ3RCLENBQUMsQ0FBQyxDQUNGbkgsSUFBSSxDQUFDLFVBQVNqSyxHQUFHLEVBQUU7UUFDakJsQixPQUFPLENBQUNLLEtBQUssQ0FBQyxvQkFBb0IsRUFBRWEsR0FBRyxDQUFDO1FBQ3hDckgsTUFBTSxDQUFDd0gsVUFBVSxDQUFDLHVCQUF1QixDQUFDO01BQzVDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKO0VBRUEsU0FBU2tSLE1BQU1BLENBQUEsRUFBRztJQUNoQjVHLGFBQWEsQ0FBQy9PLElBQUksQ0FBQyxVQUFTb1AsQ0FBQyxFQUFFO01BQzdCLElBQUl3RyxZQUFZLEdBQUcsSUFBSTNTLFdBQVcsQ0FBQztRQUNqQ3BGLEtBQUssRUFBRSxrQkFBa0I7UUFDekJOLEtBQUssRUFBRSxNQUFNO1FBQ2JhLE1BQU0sRUFBRSxJQUFJO1FBQ1pILFVBQVUsRUFBRSxRQUFRO1FBQ3BCYixPQUFPLEVBQUUsQ0FDUDtVQUNFdUQsT0FBTyxFQUFFLDRCQUE0QjtVQUNyQ21CLFlBQVksRUFBRXNOLENBQUMsQ0FBQ3lDLE9BQU8sQ0FBQztRQUMxQixDQUFDO01BRUwsQ0FBQyxDQUFDO01BQ0Y7TUFDQSxPQUFPK0QsWUFBWSxDQUFDbFgsSUFBSSxDQUFDLENBQUMsQ0FBQ3NCLElBQUksQ0FBQyxVQUFTMFYsT0FBTyxFQUFFO1FBQ2hELElBQUdBLE9BQU8sS0FBSyxJQUFJLEVBQUU7VUFDbkIsT0FBTyxJQUFJO1FBQ2I7UUFDQXpZLE1BQU0sQ0FBQzRILFlBQVksQ0FBQyxhQUFhLENBQUM7UUFDbENrSyxhQUFhLEdBQUdLLENBQUMsQ0FBQ3VHLE1BQU0sQ0FBQ0QsT0FBTyxDQUFDO1FBQ2pDLE9BQU8zRyxhQUFhO01BQ3RCLENBQUMsQ0FBQyxDQUNEL08sSUFBSSxDQUFDLFVBQVNvUCxDQUFDLEVBQUU7UUFDaEIsSUFBR0EsQ0FBQyxLQUFLLElBQUksRUFBRTtVQUNiLE9BQU8sSUFBSTtRQUNiO1FBQ0F3QyxVQUFVLENBQUN4QyxDQUFDLENBQUM7UUFDYm5TLE1BQU0sQ0FBQzBILFlBQVksQ0FBQyxtQkFBbUIsR0FBR3lLLENBQUMsQ0FBQ3lDLE9BQU8sQ0FBQyxDQUFDLENBQUM7TUFDeEQsQ0FBQyxDQUFDLENBQ0R0RCxJQUFJLENBQUMsVUFBU2pLLEdBQUcsRUFBRTtRQUNsQmxCLE9BQU8sQ0FBQ0ssS0FBSyxDQUFDLG9CQUFvQixFQUFFYSxHQUFHLENBQUM7UUFDeENySCxNQUFNLENBQUN3SCxVQUFVLENBQUMsdUJBQXVCLENBQUM7TUFDNUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQ0Q4SixJQUFJLENBQUMsVUFBU2pLLEdBQUcsRUFBRTtNQUNsQmxCLE9BQU8sQ0FBQ0ssS0FBSyxDQUFDLG9CQUFvQixFQUFFYSxHQUFHLENBQUM7SUFDMUMsQ0FBQyxDQUFDO0VBQ0o7RUFFQTdILENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQ3FDLEtBQUssQ0FBQyxZQUFXO0lBQy9Cc0YsR0FBRyxDQUFDb0MsUUFBUSxDQUFDLENBQUM7RUFDaEIsQ0FBQyxDQUFDO0VBRUYvSixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUNxQyxLQUFLLENBQUM2VixRQUFRLENBQUM7RUFDekJsWSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUNxQyxLQUFLLENBQUM4VixTQUFTLENBQUM7RUFDM0JuWSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUNxQyxLQUFLLENBQUM2VyxNQUFNLENBQUM7RUFDMUJsWixDQUFDLENBQUMsU0FBUyxDQUFDLENBQUNxQyxLQUFLLENBQUMwVyxNQUFNLENBQUM7RUFFMUIsSUFBSUssYUFBYSxHQUFHcFosQ0FBQyxDQUFDK0MsUUFBUSxDQUFDLENBQUNtVSxJQUFJLENBQUMsb0JBQW9CLENBQUM7RUFDMUQ7RUFDQSxJQUFJbUMsVUFBVSxHQUFHclosQ0FBQyxDQUFDK0MsUUFBUSxDQUFDLENBQUNtVSxJQUFJLENBQUMsVUFBVSxDQUFDO0VBRTdDLFNBQVN0RyxtQkFBbUJBLENBQUEsRUFBRztJQUM3QjtJQUNBLElBQUkwSSxnQkFBZ0IsR0FBR3RaLENBQUMsQ0FBQytDLFFBQVEsQ0FBQyxDQUFDbVUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUNxQyxPQUFPLENBQUMsQ0FBQztJQUMxRUQsZ0JBQWdCLEdBQUdBLGdCQUFnQixDQUNmRSxNQUFNLENBQUMsVUFBQTNWLEdBQUc7TUFBQSxPQUFJLEVBQUVBLEdBQUcsQ0FBQy9DLEtBQUssQ0FBQzRQLE9BQU8sS0FBSyxNQUFNLElBQzVCN00sR0FBRyxDQUFDNFYsWUFBWSxDQUFDLFVBQVUsQ0FBQyxLQUFLLFVBQVUsQ0FBQztJQUFBLEVBQUM7SUFDakYsSUFBSUMsbUJBQW1CLEdBQUdKLGdCQUFnQixDQUFDdlksTUFBTTtJQUNqRCxLQUFLLElBQUk2RSxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUc4VCxtQkFBbUIsRUFBRTlULENBQUMsRUFBRSxFQUFFO01BQzVDLElBQUkrVCxrQkFBa0IsR0FBR0wsZ0JBQWdCLENBQUMxVCxDQUFDLENBQUM7TUFDNUMsSUFBSWdVLE1BQU0sR0FBRzVaLENBQUMsQ0FBQzJaLGtCQUFrQixDQUFDLENBQUNFLFFBQVEsQ0FBQyxDQUFDLENBQUNDLEtBQUssQ0FBQyxDQUFDO01BQ3JEO01BQ0FGLE1BQU0sQ0FBQzFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FDdkJoWCxJQUFJLENBQUMsY0FBYyxFQUFFd1osbUJBQW1CLENBQUMzVixRQUFRLENBQUMsQ0FBQyxDQUFDLENBQ3BEN0QsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDMEYsQ0FBQyxHQUFDLENBQUMsRUFBRTdCLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDM0M7SUFDQSxPQUFPdVYsZ0JBQWdCO0VBQ3pCO0VBRUEsU0FBU1Msa0JBQWtCQSxDQUFBLEVBQUc7SUFDNUIsSUFBSUMsYUFBYSxHQUFHalgsUUFBUSxDQUFDMlMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDdUUsWUFBWTtJQUNyRTtJQUNBLElBQUlELGFBQWEsR0FBRyxFQUFFLEVBQUVBLGFBQWEsR0FBRyxFQUFFO0lBQzFDQSxhQUFhLElBQUksSUFBSTtJQUNyQmpYLFFBQVEsQ0FBQzJTLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQzVVLEtBQUssQ0FBQ29aLFVBQVUsR0FBR0YsYUFBYTtJQUNoRSxJQUFJRyxPQUFPLEdBQUdwWCxRQUFRLENBQUMyUyxjQUFjLENBQUMsTUFBTSxDQUFDO0lBQzdDLElBQUkwRSxXQUFXLEdBQUdELE9BQU8sQ0FBQ3pELHNCQUFzQixDQUFDLFVBQVUsQ0FBQztJQUM1RCxJQUFJMEQsV0FBVyxDQUFDclosTUFBTSxLQUFLLENBQUMsRUFBRTtNQUM1QnFaLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQ3RaLEtBQUssQ0FBQ29aLFVBQVUsR0FBR0YsYUFBYTtJQUNqRDtFQUNGO0VBRUFoYSxDQUFDLENBQUNRLE1BQU0sQ0FBQyxDQUFDTCxFQUFFLENBQUMsUUFBUSxFQUFFNFosa0JBQWtCLENBQUM7RUFFMUMsU0FBU00sYUFBYUEsQ0FBQ0MsT0FBTyxFQUFFO0lBQzlCO0lBQ0EsSUFBSUMsR0FBRyxHQUFHRCxPQUFPLENBQUNmLE9BQU8sQ0FBQyxDQUFDO0lBQzNCO0lBQ0EsSUFBSWlCLEdBQUcsR0FBR0QsR0FBRyxDQUFDeFosTUFBTTtJQUNwQixLQUFLLElBQUk2RSxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUc0VSxHQUFHLEVBQUU1VSxDQUFDLEVBQUUsRUFBRTtNQUM1QixJQUFJL0IsR0FBRyxHQUFHMFcsR0FBRyxDQUFDM1UsQ0FBQyxDQUFDO01BQ2hCO01BQ0EvQixHQUFHLENBQUM0VyxZQUFZLENBQUMsY0FBYyxFQUFFRCxHQUFHLENBQUN6VyxRQUFRLENBQUMsQ0FBQyxDQUFDO01BQ2hERixHQUFHLENBQUM0VyxZQUFZLENBQUMsZUFBZSxFQUFFLENBQUM3VSxDQUFDLEdBQUMsQ0FBQyxFQUFFN0IsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUNyRDtFQUNGO0VBR0FoQixRQUFRLENBQUMyWCxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsWUFBWTtJQUM3Q0MsbUJBQW1CLENBQUMsQ0FBQztFQUN2QixDQUFDLENBQUM7RUFFRnRCLFVBQVUsQ0FBQ2hYLEtBQUssQ0FBQyxVQUFVSSxDQUFDLEVBQUU7SUFDNUJBLENBQUMsQ0FBQ21ZLGVBQWUsQ0FBQyxDQUFDO0VBQ3JCLENBQUMsQ0FBQztFQUVGdkIsVUFBVSxDQUFDbFcsT0FBTyxDQUFDLFVBQVVWLENBQUMsRUFBRTtJQUM5QjtJQUNBO0lBQ0EsSUFBSW9ZLEVBQUUsR0FBR3BZLENBQUMsQ0FBQ3FZLE9BQU87SUFDbEIsSUFBSUQsRUFBRSxLQUFLLEVBQUUsRUFBRTtNQUNiO01BQ0FGLG1CQUFtQixDQUFDLENBQUM7TUFDckI7TUFDQWhULEdBQUcsQ0FBQ29QLFVBQVUsQ0FBQyxDQUFDO01BQ2hCdFUsQ0FBQyxDQUFDbVksZUFBZSxDQUFDLENBQUM7SUFDckIsQ0FBQyxNQUFNLElBQUlDLEVBQUUsS0FBSyxDQUFDLElBQUlBLEVBQUUsS0FBSyxFQUFFLElBQUlBLEVBQUUsS0FBSyxFQUFFLElBQUlBLEVBQUUsS0FBSyxFQUFFLElBQUlBLEVBQUUsS0FBSyxFQUFFLEVBQUU7TUFDdkU7TUFDQSxJQUFJaFksTUFBTSxHQUFHN0MsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDa1gsSUFBSSxDQUFDLGVBQWUsQ0FBQztNQUMxQ3RHLG1CQUFtQixDQUFDLENBQUM7TUFDckI3TixRQUFRLENBQUNrUCxhQUFhLENBQUNDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUMvQnJQLE1BQU0sQ0FBQ2lYLEtBQUssQ0FBQyxDQUFDLENBQUN4VyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDeEI7TUFDQWIsQ0FBQyxDQUFDbVksZUFBZSxDQUFDLENBQUM7SUFDckIsQ0FBQyxNQUFNO01BQ0xELG1CQUFtQixDQUFDLENBQUM7SUFDdkI7RUFDRixDQUFDLENBQUM7RUFFRixTQUFTSSxnQkFBZ0JBLENBQUN0WSxDQUFDLEVBQUU7SUFDM0JrWSxtQkFBbUIsQ0FBQyxDQUFDO0lBQ3JCLElBQUlLLE9BQU8sR0FBR2hiLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDckI7SUFDQSxJQUFJaWIsU0FBUyxHQUFHRCxPQUFPLENBQUNFLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQztJQUNuRCxJQUFJRixPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUNHLFlBQVksQ0FBQyxhQUFhLENBQUMsRUFBRTtNQUMxQztJQUNGO0lBQ0EsSUFBSUgsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDdkIsWUFBWSxDQUFDLFVBQVUsQ0FBQyxLQUFLLFVBQVUsRUFBRTtNQUN0RDtJQUNGO0lBQ0E7SUFDQTtJQUNBLElBQUkyQixlQUFlLEdBQUdKLE9BQU8sQ0FBQ0UsT0FBTyxDQUFDLFlBQVksQ0FBQztJQUNuRDtJQUNBLElBQUlHLEVBQUUsR0FBR0QsZUFBZSxDQUFDLENBQUMsQ0FBQztJQUMzQixJQUFJRSxXQUFXLEdBQUlOLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQ3ZCLFlBQVksQ0FBQyxlQUFlLENBQUMsS0FBSyxNQUFPO0lBQ3ZFLElBQUksQ0FBQzZCLFdBQVcsRUFBRTtNQUNoQjtNQUNBWCxtQkFBbUIsQ0FBQyxDQUFDO01BQ3JCUyxlQUFlLENBQUN2QixRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMzWixJQUFJLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDK0IsSUFBSSxDQUFDLENBQUM7TUFDMUVtWixlQUFlLENBQUN2QixRQUFRLENBQUMsQ0FBQyxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDNUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUNoWCxJQUFJLENBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQztJQUMxRixDQUFDLE1BQU07TUFDTDtNQUNBa2IsZUFBZSxDQUFDdkIsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDM1osSUFBSSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQ2tDLElBQUksQ0FBQyxDQUFDO01BQ3pFZ1osZUFBZSxDQUFDdkIsUUFBUSxDQUFDLENBQUMsQ0FBQ0MsS0FBSyxDQUFDLENBQUMsQ0FBQzVDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDaFgsSUFBSSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUM7SUFDM0Y7SUFDQXVDLENBQUMsQ0FBQ21ZLGVBQWUsQ0FBQyxDQUFDO0VBQ3JCO0VBRUEsSUFBSVcsY0FBYyxHQUFHdmIsQ0FBQyxDQUFDK0MsUUFBUSxDQUFDLENBQUNtVSxJQUFJLENBQUMseUJBQXlCLENBQUM7RUFDaEVxRSxjQUFjLENBQUNsWixLQUFLLENBQUMwWSxnQkFBZ0IsQ0FBQztFQUV0QyxTQUFTSixtQkFBbUJBLENBQUEsRUFBRztJQUM3QjtJQUNBLElBQUlNLFNBQVMsR0FBR2piLENBQUMsQ0FBQytDLFFBQVEsQ0FBQyxDQUFDbVUsSUFBSSxDQUFDLDBCQUEwQixDQUFDO0lBQzVEK0QsU0FBUyxDQUFDL0QsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUNoWCxJQUFJLENBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQztJQUNoRSthLFNBQVMsQ0FBQy9ELElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQ2hYLElBQUksQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUNrQyxJQUFJLENBQUMsQ0FBQztFQUNqRTtFQUVBLElBQUlvWixpQkFBaUIsR0FBR3hiLENBQUMsQ0FBQytDLFFBQVEsQ0FBQyxDQUFDbVUsSUFBSSxDQUFDLHNEQUFzRCxDQUFDO0VBQ2hHc0UsaUJBQWlCLENBQUNuWixLQUFLLENBQUNzWSxtQkFBbUIsQ0FBQztFQUU1QyxTQUFTYyxpQkFBaUJBLENBQUNDLGVBQWUsRUFBRUMsT0FBTyxFQUFFO0lBQ25EO0lBQ0E7SUFDQWhCLG1CQUFtQixDQUFDLENBQUM7SUFDckIsSUFBSWUsZUFBZSxJQUFJQSxlQUFlLENBQUMzYSxNQUFNLEtBQUssQ0FBQyxFQUFFO01BQ25ELElBQUk4QyxHQUFHLEdBQUc2WCxlQUFlLENBQUMsQ0FBQyxDQUFDO01BQzVCLElBQUlFLEtBQUssR0FBRy9YLEdBQUcsQ0FBQzRWLFlBQVksQ0FBQyxJQUFJLENBQUM7TUFDbENpQyxlQUFlLENBQUM3QixRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMzWixJQUFJLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDK0IsSUFBSSxDQUFDLENBQUM7TUFDMUV5WixlQUFlLENBQUM3QixRQUFRLENBQUMsQ0FBQyxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDNUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUNoWCxJQUFJLENBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQztJQUMxRjtJQUNBLElBQUl5YixPQUFPLEVBQUU7TUFDWDtNQUNBQSxPQUFPLENBQUNyWSxLQUFLLENBQUMsQ0FBQztJQUNqQjtFQUNGO0VBRUEsSUFBSXVZLGVBQWUsR0FBRyxLQUFLO0VBRTNCLFNBQVNDLFlBQVlBLENBQUEsRUFBRztJQUN0QkQsZUFBZSxHQUFHLElBQUk7SUFDdEI3YixDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMrYixNQUFNLENBQUMsR0FBRyxDQUFDO0lBQzNCQyxVQUFVLENBQUMsQ0FBQztFQUNkO0VBRUE1QyxhQUFhLENBQUNqVyxPQUFPLENBQUMsVUFBVVYsQ0FBQyxFQUFFO0lBQ2pDO0lBQ0EsSUFBSW9ZLEVBQUUsR0FBR3BZLENBQUMsQ0FBQ3FZLE9BQU87SUFDbEI7SUFDQSxJQUFJbUIsa0JBQWtCLEdBQUcsSUFBSTtJQUM3QixJQUFJaEIsU0FBUyxHQUFHamIsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDa2IsT0FBTyxDQUFDLGtCQUFrQixDQUFDO0lBQ25ELElBQUlnQixZQUFZLEdBQUdsYyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUNrYixPQUFPLENBQUMsWUFBWSxDQUFDO0lBQ2hELElBQUlnQixZQUFZLENBQUNuYixNQUFNLEtBQUssQ0FBQyxFQUFFO01BQzdCa2Isa0JBQWtCLEdBQUcsS0FBSztJQUM1QjtJQUNBLElBQUlwQixFQUFFLEtBQUssRUFBRSxFQUFFO01BQ2I7TUFDQTdhLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQ2lJLE9BQU8sQ0FBQyxHQUFHLENBQUM7SUFDOUI7SUFDQSxJQUFJNFMsRUFBRSxLQUFLLEVBQUUsSUFBSW9CLGtCQUFrQixFQUFFO01BQUU7TUFDckMsSUFBSVAsZUFBZSxHQUFHMWIsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDa2IsT0FBTyxDQUFDLFlBQVksQ0FBQztNQUNuRCxJQUFJaUIsUUFBUSxHQUFHVCxlQUFlLENBQUN4RSxJQUFJLENBQUMsNEJBQTRCLENBQUMsQ0FBQ3NDLE1BQU0sQ0FBQyxVQUFVLENBQUM7TUFDcEZpQyxpQkFBaUIsQ0FBQ0MsZUFBZSxFQUFFUyxRQUFRLENBQUNyQyxLQUFLLENBQUMsQ0FBQyxDQUFDO01BQ3BEclgsQ0FBQyxDQUFDbVksZUFBZSxDQUFDLENBQUM7SUFDckIsQ0FBQyxNQUFNLElBQUlDLEVBQUUsS0FBSyxFQUFFLEVBQUU7TUFBRTtNQUN0QjtNQUNBLElBQUl1QixjQUFjLEdBQUdwYyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUNrYixPQUFPLENBQUMsWUFBWSxDQUFDO01BQ2xEO01BQ0FrQixjQUFjLENBQUN2QyxRQUFRLENBQUMsQ0FBQyxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDNUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDaFgsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUM7TUFDM0UsSUFBSW9aLGdCQUFnQixHQUFHMUksbUJBQW1CLENBQUMsQ0FBQztNQUM1QztNQUNBLElBQUl5TCxLQUFLLEdBQUcvQyxnQkFBZ0IsQ0FBQ3ZZLE1BQU07TUFDbkMsSUFBSXViLENBQUMsR0FBR2hELGdCQUFnQixDQUFDelksT0FBTyxDQUFDdWIsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ25EO01BQ0EsS0FBSyxJQUFJeFcsQ0FBQyxHQUFHLENBQUMwVyxDQUFDLEdBQUcsQ0FBQyxJQUFJRCxLQUFLLEVBQUV6VyxDQUFDLEtBQUswVyxDQUFDLEVBQUUxVyxDQUFDLEdBQUcsQ0FBQ0EsQ0FBQyxHQUFHLENBQUMsSUFBSXlXLEtBQUssRUFBRTtRQUMxRCxJQUFJWCxlQUFlLEdBQUcxYixDQUFDLENBQUNzWixnQkFBZ0IsQ0FBQzFULENBQUMsQ0FBQyxDQUFDO1FBQzVDO1FBQ0EsSUFBSXVXLFFBQVEsR0FBR1QsZUFBZSxDQUFDeEUsSUFBSSxDQUFDLDRCQUE0QixDQUFDLENBQUNzQyxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQ3BGO1FBQ0EsSUFBSTJDLFFBQVEsQ0FBQ3BiLE1BQU0sR0FBRyxDQUFDLEVBQUU7VUFDdkI7VUFDQTtVQUNBMGEsaUJBQWlCLENBQUNDLGVBQWUsRUFBRVMsUUFBUSxDQUFDckMsS0FBSyxDQUFDLENBQUMsQ0FBQztVQUNwRHJYLENBQUMsQ0FBQ21ZLGVBQWUsQ0FBQyxDQUFDO1VBQ25CO1FBQ0Y7TUFDRjtJQUNGLENBQUMsTUFBTSxJQUFJQyxFQUFFLEtBQUssRUFBRSxFQUFFO01BQUU7TUFDdEI7TUFDQSxJQUFJdUIsY0FBYyxHQUFHcGMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDa2IsT0FBTyxDQUFDLFlBQVksQ0FBQztNQUNsRDtNQUNBa0IsY0FBYyxDQUFDdkMsUUFBUSxDQUFDLENBQUMsQ0FBQ0MsS0FBSyxDQUFDLENBQUMsQ0FBQzVDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQ2hYLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDO01BQzNFLElBQUlvWixnQkFBZ0IsR0FBRzFJLG1CQUFtQixDQUFDLENBQUM7TUFDNUM7TUFDQSxJQUFJeUwsS0FBSyxHQUFHL0MsZ0JBQWdCLENBQUN2WSxNQUFNO01BQ25DLElBQUl1YixDQUFDLEdBQUdoRCxnQkFBZ0IsQ0FBQ3pZLE9BQU8sQ0FBQ3ViLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNuRDtNQUNBLEtBQUssSUFBSXhXLENBQUMsR0FBRyxDQUFDMFcsQ0FBQyxHQUFHRCxLQUFLLEdBQUcsQ0FBQyxJQUFJQSxLQUFLLEVBQUV6VyxDQUFDLEtBQUswVyxDQUFDLEVBQUUxVyxDQUFDLEdBQUcsQ0FBQ0EsQ0FBQyxHQUFHeVcsS0FBSyxHQUFHLENBQUMsSUFBSUEsS0FBSyxFQUFFO1FBQzFFLElBQUlYLGVBQWUsR0FBRzFiLENBQUMsQ0FBQ3NaLGdCQUFnQixDQUFDMVQsQ0FBQyxDQUFDLENBQUM7UUFDNUM7UUFDQTtRQUNBLElBQUl1VyxRQUFRLEdBQUdULGVBQWUsQ0FBQ3hFLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDc0MsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUNwRjtRQUNBLElBQUkyQyxRQUFRLENBQUNwYixNQUFNLEdBQUcsQ0FBQyxFQUFFO1VBQ3ZCO1VBQ0E7VUFDQTBhLGlCQUFpQixDQUFDQyxlQUFlLEVBQUVTLFFBQVEsQ0FBQ3JDLEtBQUssQ0FBQyxDQUFDLENBQUM7VUFDcERyWCxDQUFDLENBQUNtWSxlQUFlLENBQUMsQ0FBQztVQUNuQjtRQUNGO01BQ0Y7SUFDRixDQUFDLE1BQU0sSUFBSUMsRUFBRSxLQUFLLEVBQUUsRUFBRTtNQUFFO01BQ3RCO01BQ0EsSUFBSVAsT0FBTztNQUNYLElBQUkyQixrQkFBa0IsRUFBRTtRQUN0QixJQUFJTSxRQUFRLEdBQUd2YyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUNrYixPQUFPLENBQUMsS0FBSyxDQUFDLENBQUNoRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUNzQyxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQzNFO1FBQ0EsSUFBSWdELElBQUksR0FBR3hjLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ3laLFlBQVksQ0FBQyxJQUFJLENBQUM7UUFDeEM7UUFDQWEsT0FBTyxHQUFHdGEsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNmLElBQUl5YyxlQUFlLEdBQUcsS0FBSztRQUMzQixLQUFLLElBQUk3VyxDQUFDLEdBQUcyVyxRQUFRLENBQUN4YixNQUFNLEdBQUcsQ0FBQyxFQUFFNkUsQ0FBQyxJQUFJLENBQUMsRUFBRUEsQ0FBQyxFQUFFLEVBQUU7VUFDN0MsSUFBSTZXLGVBQWUsRUFBRTtZQUNuQjtZQUNBbkMsT0FBTyxHQUFHQSxPQUFPLENBQUNvQyxHQUFHLENBQUMxYyxDQUFDLENBQUN1YyxRQUFRLENBQUMzVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1VBQ3ZDLENBQUMsTUFBTSxJQUFJMlcsUUFBUSxDQUFDM1csQ0FBQyxDQUFDLENBQUM2VCxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUsrQyxJQUFJLEVBQUU7WUFDbERDLGVBQWUsR0FBRyxJQUFJO1VBQ3hCO1FBQ0Y7UUFDQTtRQUNBLElBQUlFLE9BQU8sR0FBRzNjLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQ2tiLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzBCLE9BQU8sQ0FBQyxDQUFDLENBQUMxRixJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FDckVBLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQ3NDLE1BQU0sQ0FBQyxVQUFVLENBQUM7UUFDeENjLE9BQU8sR0FBR0EsT0FBTyxDQUFDb0MsR0FBRyxDQUFDQyxPQUFPLENBQUM7UUFDOUIsSUFBSXJDLE9BQU8sQ0FBQ3ZaLE1BQU0sS0FBSyxDQUFDLEVBQUU7VUFDeEJ1WixPQUFPLEdBQUd0YSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUNrYixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUNBLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQ2hFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUN2RUEsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDc0MsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDOU4sSUFBSSxDQUFDLENBQUM7UUFDL0M7UUFDQSxJQUFJNE8sT0FBTyxDQUFDdlosTUFBTSxHQUFHLENBQUMsRUFBRTtVQUN0QnVaLE9BQU8sQ0FBQzVPLElBQUksQ0FBQyxDQUFDLENBQUNwSSxLQUFLLENBQUMsQ0FBQztRQUN4QixDQUFDLE1BQU07VUFDTDtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtRQVRVO01BV0o7TUFDQWIsQ0FBQyxDQUFDbVksZUFBZSxDQUFDLENBQUM7SUFDckIsQ0FBQyxNQUFNLElBQUlDLEVBQUUsS0FBSyxFQUFFLEVBQUU7TUFBRTtNQUN0QjtNQUNBLElBQUlnQyxXQUFXO01BQ2YsSUFBSXZDLE9BQU87TUFDWCxJQUFJLENBQUMyQixrQkFBa0IsRUFBRTtRQUN2QjtRQUNBWSxXQUFXLEdBQUc3YyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUNrYixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUNyQixRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMzQyxJQUFJLENBQUMsb0JBQW9CLENBQUM7UUFDN0VvRCxPQUFPLEdBQUd1QyxXQUFXLENBQUMzRixJQUFJLENBQUMsWUFBWSxDQUFDLENBQUNzQyxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQzNEYSxhQUFhLENBQUNDLE9BQU8sQ0FBQztNQUN4QixDQUFDLE1BQU07UUFDTDtRQUNBLElBQUlpQyxRQUFRLEdBQUd2YyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUNrYixPQUFPLENBQUMsS0FBSyxDQUFDLENBQUNoRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUNzQyxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQzNFO1FBQ0EsSUFBSWdELElBQUksR0FBR3hjLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ3laLFlBQVksQ0FBQyxJQUFJLENBQUM7UUFDeEM7UUFDQWEsT0FBTyxHQUFHdGEsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNmLElBQUl5YyxlQUFlLEdBQUcsS0FBSztRQUMzQixLQUFLLElBQUk3VyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUcyVyxRQUFRLENBQUN4YixNQUFNLEVBQUU2RSxDQUFDLEVBQUUsRUFBRTtVQUN4QyxJQUFJNlcsZUFBZSxFQUFFO1lBQ25CO1lBQ0FuQyxPQUFPLEdBQUdBLE9BQU8sQ0FBQ29DLEdBQUcsQ0FBQzFjLENBQUMsQ0FBQ3VjLFFBQVEsQ0FBQzNXLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDdkMsQ0FBQyxNQUFNLElBQUkyVyxRQUFRLENBQUMzVyxDQUFDLENBQUMsQ0FBQzZULFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSytDLElBQUksRUFBRTtZQUNsREMsZUFBZSxHQUFHLElBQUk7VUFDeEI7UUFDRjtRQUNBO1FBQ0EsSUFBSUUsT0FBTyxHQUFHM2MsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDa2IsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDNEIsT0FBTyxDQUFDLENBQUMsQ0FBQzVGLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUNyRUEsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDc0MsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUN4Q2MsT0FBTyxHQUFHQSxPQUFPLENBQUNvQyxHQUFHLENBQUNDLE9BQU8sQ0FBQztRQUM5QixJQUFJckMsT0FBTyxDQUFDdlosTUFBTSxLQUFLLENBQUMsRUFBRTtVQUN4QnVaLE9BQU8sR0FBR3RhLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQ2tiLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQ0EsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDaEUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQ3JFQSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUNzQyxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQzFDO01BQ0Y7TUFDQTtNQUNBLElBQUljLE9BQU8sQ0FBQ3ZaLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDdEJ1WixPQUFPLENBQUNSLEtBQUssQ0FBQyxDQUFDLENBQUN4VyxLQUFLLENBQUMsQ0FBQztNQUN6QixDQUFDLE1BQU07UUFDTDtNQUFBO01BRUZiLENBQUMsQ0FBQ21ZLGVBQWUsQ0FBQyxDQUFDO0lBQ3JCLENBQUMsTUFBTSxJQUFJQyxFQUFFLEtBQUssRUFBRSxFQUFFO01BQ3BCO01BQ0FGLG1CQUFtQixDQUFDLENBQUM7TUFDckIsSUFBSWtCLGVBQWUsRUFBRTtRQUNuQkEsZUFBZSxHQUFHLEtBQUs7TUFDekIsQ0FBQyxNQUFNO1FBQ0w7UUFDQWxVLEdBQUcsQ0FBQ29QLFVBQVUsQ0FBQyxDQUFDO01BQ2xCO01BQ0F0VSxDQUFDLENBQUNtWSxlQUFlLENBQUMsQ0FBQztNQUNuQm5ZLENBQUMsQ0FBQ3NhLGNBQWMsQ0FBQyxDQUFDO01BQ2xCO0lBQ0YsQ0FBQyxNQUFNLElBQUlsQyxFQUFFLEtBQUssQ0FBQyxFQUFHO01BQ3BCLElBQUlwWSxDQUFDLENBQUN1YSxRQUFRLEVBQUU7UUFDZHJDLG1CQUFtQixDQUFDLENBQUM7UUFDckJoVCxHQUFHLENBQUNvUCxVQUFVLENBQUMsSUFBSSxDQUFDO01BQ3RCO01BQ0F0VSxDQUFDLENBQUNtWSxlQUFlLENBQUMsQ0FBQztNQUNuQm5ZLENBQUMsQ0FBQ3NhLGNBQWMsQ0FBQyxDQUFDO0lBQ3BCLENBQUMsTUFBTSxJQUFJbEMsRUFBRSxLQUFLLEVBQUUsSUFBSUEsRUFBRSxLQUFLLEVBQUUsSUFBSUEsRUFBRSxLQUFLLEVBQUUsSUFBSUEsRUFBRSxLQUFLLEVBQUUsRUFBRTtNQUMzRDtNQUNBO01BQ0FwWSxDQUFDLENBQUNtWSxlQUFlLENBQUMsQ0FBQztJQUNyQixDQUFDLE1BQU0sSUFBSUMsRUFBRSxJQUFJLEdBQUcsSUFBSUEsRUFBRSxJQUFJLEdBQUcsRUFBRTtNQUNqQztNQUNBO01BQ0E7SUFBQSxDQUNELE1BQU0sSUFBSXBZLENBQUMsQ0FBQ3dhLE9BQU8sSUFBSXBDLEVBQUUsS0FBSyxHQUFHLEVBQUU7TUFDbEM7TUFDQWlCLFlBQVksQ0FBQyxDQUFDO01BQ2RyWixDQUFDLENBQUNtWSxlQUFlLENBQUMsQ0FBQztJQUNyQixDQUFDLE1BQU07TUFDTDtNQUNBblksQ0FBQyxDQUFDbVksZUFBZSxDQUFDLENBQUM7SUFDckI7SUFDQTtFQUNGLENBQUMsQ0FBQzs7RUFFRjtFQUNBOztFQUdBLElBQUlzQyxhQUFhLEdBQUdsZCxDQUFDLENBQUMsV0FBVyxDQUFDO0VBR2xDLElBQUdxSCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsaUJBQWlCLENBQUMsRUFBRTtJQUNuQ3JILENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQ0UsSUFBSSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQ0EsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUM7RUFDakU7RUFFQSxJQUFHLEVBQUUsWUFBWSxJQUFJbUgsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUtBLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxZQUFZLENBQUMsS0FBSyxPQUFRLEVBQUU7SUFDaEZySCxDQUFDLENBQUNRLE1BQU0sQ0FBQyxDQUFDK0IsSUFBSSxDQUFDLGNBQWMsRUFBRSxZQUFXO01BQ3hDLE9BQU8sNkpBQTZKO0lBQ3RLLENBQUMsQ0FBQztFQUNKO0VBRUFvRixHQUFHLENBQUNxTixNQUFNLEdBQUdyTixHQUFHLENBQUNnRCxVQUFVLENBQUN1UyxhQUFhLEVBQUU7SUFDekNDLFNBQVMsRUFBRW5kLENBQUMsQ0FBQyxZQUFZLENBQUM7SUFDMUJzTCxZQUFZLEVBQUUsS0FBSztJQUNuQkgsR0FBRyxFQUFFeEQsR0FBRyxDQUFDbUosUUFBUTtJQUNqQnNNLFVBQVUsRUFBRSxHQUFHO0lBQ2YxUCxhQUFhLEVBQUU7RUFDakIsQ0FBQyxDQUFDO0VBQ0YvRixHQUFHLENBQUNxTixNQUFNLENBQUN4USxFQUFFLENBQUM2WSxTQUFTLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQztFQUMvQzFWLEdBQUcsQ0FBQ3FOLE1BQU0sQ0FBQ3hRLEVBQUUsQ0FBQzZZLFNBQVMsQ0FBQyxXQUFXLEVBQUUsSUFBSTFVLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDL0MsU0FBUzJVLG1CQUFtQkEsQ0FBQ0MsVUFBVSxFQUFFO0lBQ3ZDLElBQUl4UixNQUFNLEdBQUdwRSxHQUFHLENBQUNxTixNQUFNLENBQUN4USxFQUFFLENBQUNnWixTQUFTLENBQUMsUUFBUSxDQUFDO0lBQzlDLElBQUl4UixZQUFZLEdBQUdyRSxHQUFHLENBQUNxTixNQUFNLENBQUN4USxFQUFFLENBQUNnWixTQUFTLENBQUMsY0FBYyxDQUFDO0lBQzFELElBQUlDLFNBQVMsR0FBRzlWLEdBQUcsQ0FBQ3FOLE1BQU0sQ0FBQ3hRLEVBQUUsQ0FBQ2daLFNBQVMsQ0FBQyxXQUFXLENBQUM7SUFDcEQsSUFBSUQsVUFBVSxDQUFDemQsSUFBSSxDQUFDaUIsTUFBTSxJQUFJaUwsWUFBWSxFQUFFO01BQzFDdVIsVUFBVSxDQUFDRyxjQUFjLENBQUN0VSxPQUFPLENBQUMsVUFBQ0MsQ0FBQyxFQUFFbkUsR0FBRztRQUFBLE9BQUtxWSxVQUFVLENBQUN2YSxHQUFHLENBQUNrQyxHQUFHLEVBQUVtRSxDQUFDLENBQUM7TUFBQSxFQUFDO01BQ3JFb1UsU0FBUyxVQUFPLENBQUNGLFVBQVUsQ0FBQztNQUM1QjtNQUNBSSxhQUFhLENBQUMsQ0FBQztJQUNqQjtFQUNGO0VBQ0EsU0FBU0MsVUFBVUEsQ0FBQ0wsVUFBVSxFQUFFO0lBQzlCLElBQUlFLFNBQVMsR0FBRzlWLEdBQUcsQ0FBQ3FOLE1BQU0sQ0FBQ3hRLEVBQUUsQ0FBQ2daLFNBQVMsQ0FBQyxXQUFXLENBQUM7SUFDcERELFVBQVUsQ0FBQ0csY0FBYyxDQUFDdFUsT0FBTyxDQUFDLFVBQUNDLENBQUMsRUFBRW5FLEdBQUc7TUFBQSxPQUFLcVksVUFBVSxDQUFDdmEsR0FBRyxDQUFDa0MsR0FBRyxFQUFFbUUsQ0FBQyxDQUFDO0lBQUEsRUFBQztJQUNyRW9VLFNBQVMsVUFBTyxDQUFDRixVQUFVLENBQUM7SUFDNUI7SUFDQUksYUFBYSxDQUFDLENBQUM7RUFDakI7RUFDQSxTQUFTQSxhQUFhQSxDQUFBLEVBQUc7SUFDdkIsSUFBSTVSLE1BQU0sR0FBR3BFLEdBQUcsQ0FBQ3FOLE1BQU0sQ0FBQ3hRLEVBQUUsQ0FBQ2daLFNBQVMsQ0FBQyxRQUFRLENBQUM7SUFDOUMsSUFBSUMsU0FBUyxHQUFHOVYsR0FBRyxDQUFDcU4sTUFBTSxDQUFDeFEsRUFBRSxDQUFDZ1osU0FBUyxDQUFDLFdBQVcsQ0FBQztJQUNwRCxJQUFJSyxTQUFTO0lBQ2IsSUFBSUosU0FBUyxDQUFDSyxJQUFJLEtBQUssQ0FBQyxFQUFFO01BQ3hCRCxTQUFTLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDakIsQ0FBQyxNQUFNO01BQ0xBLFNBQVMsR0FBR0UsTUFBTSxDQUFDQyxTQUFTO01BQzVCUCxTQUFTLENBQUNyVSxPQUFPLENBQUMsVUFBUzZVLE1BQU0sRUFBRVYsVUFBVSxFQUFFO1FBQzdDLElBQUlBLFVBQVUsQ0FBQ3pkLElBQUksQ0FBQ2lCLE1BQU0sR0FBRzhjLFNBQVMsRUFBRTtVQUFFQSxTQUFTLEdBQUdOLFVBQVUsQ0FBQ3pkLElBQUksQ0FBQ2lCLE1BQU07UUFBRTtNQUNoRixDQUFDLENBQUM7SUFDSjtJQUNBLEtBQUssSUFBSTZFLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR21HLE1BQU0sQ0FBQ2hMLE1BQU0sRUFBRTZFLENBQUMsRUFBRSxFQUFFO01BQ3RDLElBQUltRyxNQUFNLENBQUNuRyxDQUFDLENBQUMsQ0FBQ3NHLE1BQU0sSUFBSTJSLFNBQVMsRUFBRTtRQUNqQzlSLE1BQU0sQ0FBQ25HLENBQUMsQ0FBQyxDQUFDd0csU0FBUyxHQUFHLFFBQVE7TUFDaEMsQ0FBQyxNQUFNO1FBQ0xMLE1BQU0sQ0FBQ25HLENBQUMsQ0FBQyxDQUFDd0csU0FBUyxHQUFHd0ssU0FBUztNQUNqQztJQUNGO0lBQ0E7SUFDQWpQLEdBQUcsQ0FBQ3FOLE1BQU0sQ0FBQ3hRLEVBQUUsQ0FBQzZZLFNBQVMsQ0FBQyxRQUFRLEVBQUV6RyxTQUFTLENBQUM7SUFDNUNqUCxHQUFHLENBQUNxTixNQUFNLENBQUN4USxFQUFFLENBQUM2WSxTQUFTLENBQUMsUUFBUSxFQUFFdFIsTUFBTSxDQUFDO0VBQzNDO0VBQ0FwRSxHQUFHLENBQUNxTixNQUFNLENBQUN4USxFQUFFLENBQUNyRSxFQUFFLENBQUMsU0FBUyxFQUFFLFVBQVMrZCxRQUFRLEVBQUVoTyxVQUFVLEVBQUU7SUFDekQsSUFBSWlPLE9BQU8sR0FBR0QsUUFBUSxDQUFDRSxRQUFRLENBQUMsQ0FBQztNQUFFQyxPQUFPLEdBQUcsQ0FBQztJQUM5QyxJQUFJclMsWUFBWSxHQUFHa1MsUUFBUSxDQUFDVixTQUFTLENBQUMsY0FBYyxDQUFDO0lBQ3JELElBQUlDLFNBQVMsR0FBR1MsUUFBUSxDQUFDVixTQUFTLENBQUMsV0FBVyxDQUFDO0lBQy9DdE4sVUFBVSxDQUFDOUcsT0FBTyxDQUFDLFVBQVN5RyxNQUFNLEVBQUU7TUFDbEMsSUFBSXNPLE9BQU8sR0FBR3RPLE1BQU0sQ0FBQ0csSUFBSSxDQUFDMUIsSUFBSSxFQUFFO1FBQUU2UCxPQUFPLEdBQUd0TyxNQUFNLENBQUNHLElBQUksQ0FBQzFCLElBQUk7TUFBRTtNQUM5RCxJQUFJK1AsT0FBTyxHQUFHeE8sTUFBTSxDQUFDRyxJQUFJLENBQUMxQixJQUFJLEdBQUd1QixNQUFNLENBQUMvUCxJQUFJLENBQUNpQixNQUFNLEVBQUU7UUFBRXNkLE9BQU8sR0FBR3hPLE1BQU0sQ0FBQ0csSUFBSSxDQUFDMUIsSUFBSSxHQUFHdUIsTUFBTSxDQUFDL1AsSUFBSSxDQUFDaUIsTUFBTTtNQUFFO0lBQzFHLENBQUMsQ0FBQztJQUNGLElBQUl1ZCxPQUFPLEdBQUcsS0FBSztJQUNuQkosUUFBUSxDQUFDSyxRQUFRLENBQUNKLE9BQU8sRUFBRUUsT0FBTyxFQUFFLFVBQVNkLFVBQVUsRUFBRTtNQUN2RCxJQUFJQSxVQUFVLENBQUN6ZCxJQUFJLENBQUNpQixNQUFNLEdBQUdpTCxZQUFZLEVBQUU7UUFDekMsSUFBSSxDQUFDeVIsU0FBUyxDQUFDN1UsR0FBRyxDQUFDMlUsVUFBVSxDQUFDLEVBQUU7VUFDOUJlLE9BQU8sR0FBRyxJQUFJO1VBQ2RiLFNBQVMsQ0FBQzFVLEdBQUcsQ0FBQ3dVLFVBQVUsRUFBRUEsVUFBVSxDQUFDVSxNQUFNLENBQUMsQ0FBQyxDQUFDO1VBQzlDVixVQUFVLENBQUNHLGNBQWMsR0FBRyxJQUFJL1UsR0FBRyxDQUFDLENBQ2xDLENBQUMsUUFBUSxFQUFFMlUsbUJBQW1CLENBQUMsRUFDL0IsQ0FBQyxRQUFRLEVBQUUsWUFBVztZQUFFO1lBQ3RCTSxVQUFVLENBQUNMLFVBQVUsQ0FBQztVQUN4QixDQUFDLENBQUMsQ0FDSCxDQUFDO1VBQ0ZBLFVBQVUsQ0FBQ0csY0FBYyxDQUFDdFUsT0FBTyxDQUFDLFVBQUNDLENBQUMsRUFBRW5FLEdBQUc7WUFBQSxPQUFLcVksVUFBVSxDQUFDcGQsRUFBRSxDQUFDK0UsR0FBRyxFQUFFbUUsQ0FBQyxDQUFDO1VBQUEsRUFBQztVQUNwRTtRQUNGO01BQ0YsQ0FBQyxNQUFNO1FBQ0wsSUFBSW9VLFNBQVMsQ0FBQzdVLEdBQUcsQ0FBQzJVLFVBQVUsQ0FBQyxFQUFFO1VBQzdCZSxPQUFPLEdBQUcsSUFBSTtVQUNkYixTQUFTLFVBQU8sQ0FBQ0YsVUFBVSxDQUFDO1VBQzVCO1FBQ0Y7TUFDRjtJQUNGLENBQUMsQ0FBQztJQUNGLElBQUllLE9BQU8sRUFBRTtNQUNYWCxhQUFhLENBQUMsQ0FBQztJQUNqQjtFQUNGLENBQUMsQ0FBQztFQUVGLElBQU1hLG1CQUFtQixHQUFHLElBQUlDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQztFQUV4RDVHLGFBQWEsQ0FBQ3RVLElBQUksQ0FBQyxVQUFTd00sQ0FBQyxFQUFFO0lBQzdCcEksR0FBRyxDQUFDZSxTQUFTLENBQUNLLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRXBCLEdBQUcsQ0FBQ3FOLE1BQU0sQ0FBQ3hRLEVBQUUsQ0FBQ2thLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDM0QsSUFBRzNPLENBQUMsS0FBSyxFQUFFLEVBQUU7TUFDWEEsQ0FBQyxHQUFHL0YscUJBQXFCO0lBQzNCLENBQUMsTUFDSSxJQUFHK0YsQ0FBQyxDQUFDaEMsS0FBSyxDQUFDeVEsbUJBQW1CLENBQUMsS0FBSyxJQUFJLEVBQUU7TUFDN0NoZSxNQUFNLENBQUNpSCxVQUFVLENBQUMsa0RBQWtELENBQUM7TUFDckVkLE9BQU8sQ0FBQ0ssS0FBSyxDQUFDLHlCQUF5QixFQUFFK0ksQ0FBQyxDQUFDO01BQzNDO0lBQ0Y7SUFFQXBJLEdBQUcsQ0FBQ2dYLGVBQWUsQ0FBQ3BiLElBQUksQ0FBQyxVQUFBbVEsU0FBUyxFQUFJO01BQ3BDL0wsR0FBRyxDQUFDK0wsU0FBUyxDQUFDa0wsb0JBQW9CLENBQUM3TyxDQUFDLENBQUM7SUFDdkMsQ0FBQyxDQUFDO0lBQ0Y7SUFDQTtJQUNBcEksR0FBRyxDQUFDcU4sTUFBTSxDQUFDeFEsRUFBRSxDQUFDcWEsWUFBWSxDQUFDLENBQUM7RUFDOUIsQ0FBQyxDQUFDO0VBRUZoSCxhQUFhLENBQUMvRixJQUFJLENBQUMsWUFBVztJQUM1Qm5LLEdBQUcsQ0FBQ2UsU0FBUyxDQUFDSyxHQUFHLENBQUMsZ0JBQWdCLEVBQUVwQixHQUFHLENBQUNxTixNQUFNLENBQUN4USxFQUFFLENBQUNrYSxNQUFNLENBQUMsQ0FBQyxDQUFDO0VBQzdELENBQUMsQ0FBQzs7RUFFRjtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0EsSUFBSUkscUJBQXFCLEdBQUcsS0FBSztFQUNqQyxJQUFJQyxnQkFBZ0IsR0FBRyx5QkFBeUI7RUFDaEQsSUFBSUMsbUJBQW1CLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSTtFQUU3QyxTQUFTQyxxQkFBcUJBLENBQUEsRUFBRztJQUMvQixJQUFJQyxLQUFLLEdBQUduQixNQUFNLENBQUNvQixhQUFhLENBQUNDLE9BQU8sQ0FBQ0wsZ0JBQWdCLENBQUMsQ0FBQztJQUMzRCxPQUFPRyxLQUFLLEdBQUcsQ0FBQyxJQUFLRyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDLEdBQUdKLEtBQUssR0FBSUYsbUJBQW1CO0VBQ2hFO0VBRUEsU0FBU08sb0JBQW9CQSxDQUFBLEVBQUc7SUFDOUIsSUFBSUMsWUFBWSxLQUFLaGYsTUFBTSxDQUFDaWYsS0FBSyxFQUFFO01BQ2pDTixhQUFhLENBQUNPLE9BQU8sQ0FBQ1gsZ0JBQWdCLEVBQUVZLE1BQU0sQ0FBQ04sSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0Q7RUFDRjs7RUFFQTtFQUNBO0VBQ0E7RUFDQSxTQUFTTSxtQkFBbUJBLENBQUEsRUFBRztJQUM3QixPQUFPLEVBQUUsT0FBT3BmLE1BQU0sQ0FBQ2IsTUFBTSxLQUFLLFdBQVcsSUFBSSxPQUFPYSxNQUFNLENBQUNxZixTQUFTLEtBQUssV0FBVyxDQUFDO0VBQzNGO0VBRUEsSUFBSUwsWUFBWSxHQUFHaGYsTUFBTSxDQUFDaWYsS0FBSztFQUMvQixJQUFJSyxXQUFXLEdBQUczWixTQUF3QjtFQUMxQyxJQUFJMlosV0FBVyxJQUFJYixxQkFBcUIsQ0FBQyxDQUFDLEVBQUU7SUFDMUN0WSxPQUFPLENBQUNDLEdBQUcsQ0FBQyxpRUFBaUUsQ0FBQztJQUM5RTRZLFlBQVksR0FBR3JaLFNBQXdCO0lBQ3ZDMlosV0FBVyxHQUFHdGYsTUFBTSxDQUFDaWYsS0FBSztFQUM1QjtFQUVBLElBQUlPLFNBQVMsR0FBR2pkLFFBQVEsQ0FBQzBMLGFBQWEsQ0FBQyxRQUFRLENBQUM7RUFDaEQ5SCxPQUFPLENBQUNDLEdBQUcsQ0FBQzRZLFlBQVksQ0FBQztFQUN6QlEsU0FBUyxDQUFDblIsR0FBRyxHQUFHMlEsWUFBWTtFQUM1QlEsU0FBUyxDQUFDL0wsSUFBSSxHQUFHLGlCQUFpQjtFQUNsQ2xSLFFBQVEsQ0FBQ2tkLElBQUksQ0FBQ2xSLFdBQVcsQ0FBQ2lSLFNBQVMsQ0FBQztFQUVwQyxJQUFJRSxVQUFVLEdBQUduZCxRQUFRLENBQUMwTCxhQUFhLENBQUMsUUFBUSxDQUFDO0VBRWpELElBQUkwUixhQUFhLEdBQUcsS0FBSztFQUN6QixTQUFTQyxlQUFlQSxDQUFBLEVBQUc7SUFDekIsSUFBSUQsYUFBYSxFQUFFO01BQUU7SUFBUTtJQUM3QkEsYUFBYSxHQUFHLElBQUk7SUFDcEIsSUFBSUUsV0FBVyxHQUFHeGIsVUFBVSxDQUFDLFlBQVc7TUFDdEM7TUFDQTtNQUNBO01BQ0FvRSxNQUFNLENBQUNyQyxHQUFHLENBQUMsb0JBQW9CLEVBQUU7UUFDL0IwWixLQUFLLEVBQUcsU0FBUztRQUNqQmhhLEdBQUcsRUFBR3daLFdBQVc7UUFDakJTLFNBQVMsRUFBR3pCO01BQ2QsQ0FBQyxDQUFDO01BQ0Y5ZSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUNvQyxJQUFJLENBQUMsQ0FBQztNQUNuQnBDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQ29DLElBQUksQ0FBQyxDQUFDO01BQ3BCcEMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDb0MsSUFBSSxDQUFDLENBQUM7TUFDeEI1QixNQUFNLENBQUNpSCxVQUFVLENBQUMsaUlBQWlJLENBQUM7SUFDdEosQ0FBQyxFQUFFcVgscUJBQXFCLENBQUM7SUFDekI5ZSxDQUFDLENBQUNrZ0IsVUFBVSxDQUFDLENBQUMvZixFQUFFLENBQUMsTUFBTSxFQUFFLFlBQVc7TUFDbENxZ0IsWUFBWSxDQUFDSCxXQUFXLENBQUM7TUFDekIsSUFBSSxDQUFDVCxtQkFBbUIsQ0FBQyxDQUFDLEVBQUU7UUFDMUIzVyxNQUFNLENBQUNyQyxHQUFHLENBQUMsb0JBQW9CLEVBQUU7VUFDL0IwWixLQUFLLEVBQUcsWUFBWTtVQUNwQmhhLEdBQUcsRUFBR3daO1FBQ1IsQ0FBQyxDQUFDO1FBQ0Y5ZixDQUFDLENBQUMsU0FBUyxDQUFDLENBQUNvQyxJQUFJLENBQUMsQ0FBQztRQUNuQnBDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQ29DLElBQUksQ0FBQyxDQUFDO1FBQ3BCcEMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDb0MsSUFBSSxDQUFDLENBQUM7UUFDeEI1QixNQUFNLENBQUNpSCxVQUFVLENBQUMsaUlBQWlJLENBQUM7TUFDdEo7SUFDRixDQUFDLENBQUM7SUFDRnlZLFVBQVUsQ0FBQ3JSLEdBQUcsR0FBR2lSLFdBQVc7SUFDNUJJLFVBQVUsQ0FBQ2pNLElBQUksR0FBRyxpQkFBaUI7SUFDbkNsUixRQUFRLENBQUNrZCxJQUFJLENBQUNsUixXQUFXLENBQUNtUixVQUFVLENBQUM7RUFDdkM7RUFFQSxJQUFJTyxZQUFZLEdBQUc1YixVQUFVLENBQUMsWUFBVztJQUN2Q29FLE1BQU0sQ0FBQ3JDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRTtNQUMvQjBaLEtBQUssRUFBRyxTQUFTO01BQ2pCaGEsR0FBRyxFQUFHa1osWUFBWTtNQUNsQmUsU0FBUyxFQUFHekI7SUFDZCxDQUFDLENBQUM7SUFDRlMsb0JBQW9CLENBQUMsQ0FBQztJQUN0QjtJQUNBO0lBQ0E7SUFDQVMsU0FBUyxDQUFDVSxNQUFNLENBQUMsQ0FBQztJQUNsQk4sZUFBZSxDQUFDLENBQUM7RUFDbkIsQ0FBQyxFQUFFdEIscUJBQXFCLENBQUM7RUFFekI5ZSxDQUFDLENBQUNnZ0IsU0FBUyxDQUFDLENBQUM3ZixFQUFFLENBQUMsTUFBTSxFQUFFLFlBQVc7SUFDakNxZ0IsWUFBWSxDQUFDQyxZQUFZLENBQUM7SUFDMUIsSUFBSSxDQUFDYixtQkFBbUIsQ0FBQyxDQUFDLEVBQUU7TUFDMUIzVyxNQUFNLENBQUNyQyxHQUFHLENBQUMsb0JBQW9CLEVBQUU7UUFDL0IwWixLQUFLLEVBQUcsWUFBWTtRQUNwQmhhLEdBQUcsRUFBR2taO01BQ1IsQ0FBQyxDQUFDO01BQ0ZELG9CQUFvQixDQUFDLENBQUM7TUFDdEJhLGVBQWUsQ0FBQyxDQUFDO01BQ2pCO0lBQ0Y7SUFDQSxJQUFJWixZQUFZLEtBQUtoZixNQUFNLENBQUNpZixLQUFLLElBQUlOLGFBQWEsQ0FBQ0MsT0FBTyxDQUFDTCxnQkFBZ0IsQ0FBQyxFQUFFO01BQzVFSSxhQUFhLENBQUNPLE9BQU8sQ0FBQ1gsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDO0lBQzdDO0VBQ0YsQ0FBQyxDQUFDO0VBRUYsU0FBUzRCLHdCQUF3QkEsQ0FBQ3JhLEdBQUcsRUFBRTdELENBQUMsRUFBRTtJQUV4QztJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7O0lBRUE7SUFDQTtJQUNBO0lBQ0F3RyxNQUFNLENBQUNyQyxHQUFHLENBQUMsb0JBQW9CLEVBQzdCO01BQ0UwWixLQUFLLEVBQUcsaUJBQWlCO01BQ3pCaGEsR0FBRyxFQUFHQSxHQUFHO01BRVQ7TUFDQTtNQUNBOztNQUVBc2EsU0FBUyxFQUFHbmUsQ0FBQyxDQUFDbWU7SUFDaEIsQ0FBQyxDQUFDO0lBRUosSUFBSUMsV0FBVyxHQUFHN2dCLENBQUMsQ0FBQzhnQixJQUFJLENBQUN4YSxHQUFHLENBQUM7SUFDN0J1YSxXQUFXLENBQUN0ZCxJQUFJLENBQUMsVUFBU3dkLEdBQUcsRUFBRTtNQUM3QjtNQUNBO01BQ0E5WCxNQUFNLENBQUNyQyxHQUFHLENBQUMsb0JBQW9CLEVBQUU7UUFDL0IwWixLQUFLLEVBQUcsbUJBQW1CO1FBQzNCVSxjQUFjLEVBQUdELEdBQUcsQ0FBQ2hNLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRztNQUNuQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7SUFDRjhMLFdBQVcsQ0FBQy9PLElBQUksQ0FBQyxVQUFTaVAsR0FBRyxFQUFFO01BQzdCOVgsTUFBTSxDQUFDckMsR0FBRyxDQUFDLG9CQUFvQixFQUFFO1FBQy9CMFosS0FBSyxFQUFHLG1CQUFtQjtRQUMzQlcsTUFBTSxFQUFFRixHQUFHLENBQUNFLE1BQU07UUFDbEJDLFVBQVUsRUFBRUgsR0FBRyxDQUFDRyxVQUFVO1FBQzFCO1FBQ0E7UUFDQTtRQUNBQyxZQUFZLEVBQUVKLEdBQUcsQ0FBQ0ksWUFBWSxDQUFDcE0sS0FBSyxDQUFDLENBQUMsRUFBRSxHQUFHO01BQzdDLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKO0VBRUEvVSxDQUFDLENBQUNnZ0IsU0FBUyxDQUFDLENBQUM3ZixFQUFFLENBQUMsT0FBTyxFQUFFLFVBQVNzQyxDQUFDLEVBQUU7SUFDbkMrZCxZQUFZLENBQUNDLFlBQVksQ0FBQztJQUMxQkUsd0JBQXdCLENBQUNuQixZQUFZLEVBQUUvYyxDQUFDLENBQUM7SUFDekMyZCxlQUFlLENBQUMsQ0FBQztFQUNuQixDQUFDLENBQUM7RUFFRnBnQixDQUFDLENBQUNrZ0IsVUFBVSxDQUFDLENBQUMvZixFQUFFLENBQUMsT0FBTyxFQUFFLFVBQVNzQyxDQUFDLEVBQUU7SUFDcEN6QyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUNvQyxJQUFJLENBQUMsQ0FBQztJQUNuQnBDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQ29DLElBQUksQ0FBQyxDQUFDO0lBQ3BCcEMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDb0MsSUFBSSxDQUFDLENBQUM7SUFDeEI1QixNQUFNLENBQUNpSCxVQUFVLENBQUMsaUlBQWlJLENBQUM7SUFDcEprWix3QkFBd0IsQ0FBQ2IsV0FBVyxFQUFFcmQsQ0FBQyxDQUFDO0VBRTFDLENBQUMsQ0FBQztFQUVGLFNBQVMyZSxTQUFTQSxDQUFBLEVBQUc7SUFDbkIsSUFBTUMsUUFBUSxHQUFHLEVBQUU7SUFDbkIsU0FBU2xoQixFQUFFQSxDQUFDbWhCLE9BQU8sRUFBRTtNQUNuQkQsUUFBUSxDQUFDemdCLElBQUksQ0FBQzBnQixPQUFPLENBQUM7SUFDeEI7SUFDQSxTQUFTQyxPQUFPQSxDQUFDQyxDQUFDLEVBQUU7TUFDbEJILFFBQVEsQ0FBQ2pZLE9BQU8sQ0FBQyxVQUFBcVksQ0FBQztRQUFBLE9BQUlBLENBQUMsQ0FBQ0QsQ0FBQyxDQUFDO01BQUEsRUFBQztJQUM3QjtJQUNBLE9BQU8sQ0FBQ3JoQixFQUFFLEVBQUVvaEIsT0FBTyxDQUFDO0VBQ3RCO0VBQ0EsSUFBQUcsVUFBQSxHQUE4Qk4sU0FBUyxDQUFDLENBQUM7SUFBQU8sV0FBQSxHQUFBQyxjQUFBLENBQUFGLFVBQUE7SUFBbkNHLEtBQUssR0FBQUYsV0FBQTtJQUFFRyxZQUFZLEdBQUFILFdBQUE7RUFDekIsSUFBQUksV0FBQSxHQUE4Q1gsU0FBUyxDQUFDLENBQUM7SUFBQVksV0FBQSxHQUFBSixjQUFBLENBQUFHLFdBQUE7SUFBbkRFLGFBQWEsR0FBQUQsV0FBQTtJQUFFRSxvQkFBb0IsR0FBQUYsV0FBQTtFQUN6QyxJQUFBRyxXQUFBLEdBQWdDZixTQUFTLENBQUMsQ0FBQztJQUFBZ0IsV0FBQSxHQUFBUixjQUFBLENBQUFPLFdBQUE7SUFBckNFLE1BQU0sR0FBQUQsV0FBQTtJQUFFRSxhQUFhLEdBQUFGLFdBQUE7RUFFM0J2SyxhQUFhLENBQUMwSyxHQUFHLENBQUMsWUFBVztJQUMzQjVhLEdBQUcsQ0FBQ3FOLE1BQU0sQ0FBQzFSLEtBQUssQ0FBQyxDQUFDO0lBQ2xCcUUsR0FBRyxDQUFDcU4sTUFBTSxDQUFDeFEsRUFBRSxDQUFDNlksU0FBUyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUM7RUFDNUMsQ0FBQyxDQUFDO0VBRUYxVixHQUFHLENBQUNvQyxRQUFRLEdBQUdBLFFBQVE7RUFDdkJwQyxHQUFHLENBQUNtQyxJQUFJLEdBQUdBLElBQUk7RUFDZm5DLEdBQUcsQ0FBQ3dOLFVBQVUsR0FBR0EsVUFBVTtFQUMzQnhOLEdBQUcsQ0FBQ2lMLGtCQUFrQixHQUFHQSxrQkFBa0I7RUFDM0NqTCxHQUFHLENBQUMwSyxXQUFXLEdBQUdBLFdBQVc7RUFDN0IxSyxHQUFHLENBQUNnSyxVQUFVLEdBQUdBLFVBQVU7RUFDM0JoSyxHQUFHLENBQUNvUCxVQUFVLEdBQUdBLFVBQVU7RUFDM0JwUCxHQUFHLENBQUM0TixHQUFHLEdBQUdBLEdBQUc7RUFDYjVOLEdBQUcsQ0FBQ0MsWUFBWSxHQUFHQSxZQUFZO0VBQy9CRCxHQUFHLENBQUM2YSxNQUFNLEdBQUc7SUFDWFgsS0FBSyxFQUFMQSxLQUFLO0lBQ0xDLFlBQVksRUFBWkEsWUFBWTtJQUNaRyxhQUFhLEVBQWJBLGFBQWE7SUFDYkMsb0JBQW9CLEVBQXBCQSxvQkFBb0I7SUFDcEJHLE1BQU0sRUFBTkEsTUFBTTtJQUNOQyxhQUFhLEVBQWJBO0VBQ0YsQ0FBQztFQUVELElBQUlHLFlBQVksR0FBR3BiLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxjQUFjLENBQUM7RUFFaEQsSUFBSSxPQUFPcWIsZ0JBQWdCLEtBQUssVUFBVSxFQUFFO0lBQzFDbGlCLE1BQU0sQ0FBQ21pQixRQUFRLEdBQUdDLFVBQVUsQ0FBQztNQUMzQmpiLEdBQUcsRUFBRUEsR0FBRztNQUNSa2IsUUFBUSxFQUFFSCxnQkFBZ0IsQ0FBQyxDQUFDO01BQzVCSSxXQUFXLEVBQUV0aUIsTUFBTTtNQUNuQmlpQixZQUFZLEVBQVpBO0lBQ0YsQ0FBQyxDQUFDO0VBQ0osQ0FBQyxNQUNJLElBQUlqaUIsTUFBTSxDQUFDdWlCLE1BQU0sSUFBS3ZpQixNQUFNLENBQUN1aUIsTUFBTSxLQUFLdmlCLE1BQU8sSUFBSzJGLFNBQW9CLEtBQUssYUFBYSxFQUFFO0lBQy9GM0YsTUFBTSxDQUFDbWlCLFFBQVEsR0FBR0MsVUFBVSxDQUFDO01BQUVqYixHQUFHLEVBQUVBLEdBQUc7TUFBRWtiLFFBQVEsRUFBRXJpQixNQUFNLENBQUN1aUIsTUFBTTtNQUFFRCxXQUFXLEVBQUV0aUIsTUFBTTtNQUFFaWlCLFlBQVksRUFBWkE7SUFBYSxDQUFDLENBQUM7RUFDeEc7RUFDQSxJQUFHdEQsYUFBYSxDQUFDQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsS0FBSyx5QkFBeUIsRUFBRTtJQUM5RSxJQUFNbGIsT0FBTyxHQUFHbEUsQ0FBQyxDQUFDLFFBQVEsQ0FBQztJQUMzQixJQUFNaWpCLEtBQUssR0FBR2pqQixDQUFDLENBQUMsMENBQTBDLENBQUMsQ0FBQ0UsSUFBSSxDQUFDLE1BQU0sRUFBRSxzREFBc0QsQ0FBQyxDQUFDSixJQUFJLENBQUMsZUFBZSxDQUFDO0lBQ3RKb0UsT0FBTyxDQUFDRSxNQUFNLENBQUMsb0RBQW9ELEVBQUU2ZSxLQUFLLEVBQUUsb0JBQW9CLENBQUM7SUFDakd6aUIsTUFBTSxDQUFDNkgsZ0JBQWdCLENBQUNuRSxPQUFPLENBQUM7SUFDaENpYixhQUFhLENBQUNPLE9BQU8sQ0FBQyxzQkFBc0IsRUFBRSx5QkFBeUIsQ0FBQztFQUMxRTtFQUVBLElBQUdsZixNQUFNLENBQUN1aUIsTUFBTSxLQUFLdmlCLE1BQU0sRUFBRTtJQUMzQm9pQixVQUFVLENBQUM7TUFBRWpiLEdBQUcsRUFBRUEsR0FBRztNQUFFa2IsUUFBUSxFQUFFcmlCLE1BQU0sQ0FBQ3VpQixNQUFNO01BQUVELFdBQVcsRUFBRXRpQjtJQUFPLENBQUMsQ0FBQztFQUN4RTtBQUNGLENBQUMsQ0FBQyxDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY29kZS5weXJldC5vcmcvLi9zcmMvd2ViL2pzL21vZGFsLXByb21wdC5qcyIsIndlYnBhY2s6Ly9jb2RlLnB5cmV0Lm9yZy8uL25vZGVfbW9kdWxlcy9xL3EuanMiLCJ3ZWJwYWNrOi8vY29kZS5weXJldC5vcmcvLi9ub2RlX21vZHVsZXMvdXJsLmpzL3VybC5qcyIsIndlYnBhY2s6Ly9jb2RlLnB5cmV0Lm9yZy93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9jb2RlLnB5cmV0Lm9yZy8uL3NyYy93ZWIvanMvYmVmb3JlQmxvY2tzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTW9kdWxlIGZvciBtYW5hZ2luZyBtb2RhbCBwcm9tcHQgaW5zdGFuY2VzLlxuICogTk9URTogVGhpcyBtb2R1bGUgaXMgY3VycmVudGx5IGxpbWl0ZWQgaW4gYSBudW1iZXJcbiAqICAgICAgIG9mIHdheXMuIEZvciBvbmUsIGl0IG9ubHkgYWxsb3dzIHJhZGlvXG4gKiAgICAgICBpbnB1dCBvcHRpb25zLiBBZGRpdGlvbmFsbHksIGl0IGhhcmQtY29kZXMgaW5cbiAqICAgICAgIGEgbnVtYmVyIG9mIG90aGVyIGJlaGF2aW9ycyB3aGljaCBhcmUgc3BlY2lmaWNcbiAqICAgICAgIHRvIHRoZSBpbWFnZSBpbXBvcnQgc3R5bGUgcHJvbXB0IChmb3Igd2hpY2hcbiAqICAgICAgIHRoaXMgbW9kdWxlIHdhcyB3cml0dGVuKS5cbiAqICAgICAgIElmIGRlc2lyZWQsIHRoaXMgbW9kdWxlIG1heSBiZSBtYWRlIG1vcmVcbiAqICAgICAgIGdlbmVyYWwtcHVycG9zZSBpbiB0aGUgZnV0dXJlLCBidXQsIGZvciBub3csXG4gKiAgICAgICBiZSBhd2FyZSBvZiB0aGVzZSBsaW1pdGF0aW9ucy5cbiAqL1xuZGVmaW5lKFwiY3BvL21vZGFsLXByb21wdFwiLCBbXCJxXCJdLCBmdW5jdGlvbihRKSB7XG5cbiAgZnVuY3Rpb24gYXV0b0hpZ2hsaWdodEJveCh0ZXh0KSB7XG4gICAgdmFyIHRleHRCb3ggPSAkKFwiPGlucHV0IHR5cGU9J3RleHQnPlwiKS5hZGRDbGFzcyhcImF1dG8taGlnaGxpZ2h0XCIpO1xuICAgIHRleHRCb3guYXR0cihcInJlYWRvbmx5XCIsIFwicmVhZG9ubHlcIik7XG4gICAgdGV4dEJveC5vbihcImZvY3VzXCIsIGZ1bmN0aW9uKCkgeyAkKHRoaXMpLnNlbGVjdCgpOyB9KTtcbiAgICB0ZXh0Qm94Lm9uKFwibW91c2V1cFwiLCBmdW5jdGlvbigpIHsgJCh0aGlzKS5zZWxlY3QoKTsgfSk7XG4gICAgdGV4dEJveC52YWwodGV4dCk7XG4gICAgcmV0dXJuIHRleHRCb3g7XG5cblxuICB9XG5cbiAgLy8gQWxsb3dzIGFzeW5jaHJvbm91cyByZXF1ZXN0aW5nIG9mIHByb21wdHNcbiAgdmFyIHByb21wdFF1ZXVlID0gUSgpO1xuICB2YXIgc3R5bGVzID0gW1xuICAgIFwicmFkaW9cIiwgXCJ0aWxlc1wiLCBcInRleHRcIiwgXCJjb3B5VGV4dFwiLCBcImNvbmZpcm1cIlxuICBdO1xuXG4gIHdpbmRvdy5tb2RhbHMgPSBbXTtcblxuICAvKipcbiAgICogUmVwcmVzZW50cyBhbiBvcHRpb24gdG8gcHJlc2VudCB0aGUgdXNlclxuICAgKiBAdHlwZWRlZiB7T2JqZWN0fSBNb2RhbE9wdGlvblxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIHRvIHNob3cgdGhlIHVzZXIgd2hpY2hcbiAgICAgICAgICAgICAgIGRlc2NyaWJlcyB0aGlzIG9wdGlvblxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gdmFsdWUgLSBUaGUgdmFsdWUgdG8gcmV0dXJuIGlmIHRoaXMgb3B0aW9uIGlzIGNob3NlblxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gW2V4YW1wbGVdIC0gQSBjb2RlIHNuaXBwZXQgdG8gc2hvdyB3aXRoIHRoaXMgb3B0aW9uXG4gICAqL1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciBmb3IgbW9kYWwgcHJvbXB0cy5cbiAgICogQHBhcmFtIHtNb2RhbE9wdGlvbltdfSBvcHRpb25zIC0gVGhlIG9wdGlvbnMgdG8gcHJlc2VudCB0aGUgdXNlclxuICAgKi9cbiAgZnVuY3Rpb24gUHJvbXB0KG9wdGlvbnMpIHtcbiAgICB3aW5kb3cubW9kYWxzLnB1c2godGhpcyk7XG4gICAgaWYgKCFvcHRpb25zIHx8XG4gICAgICAgIChzdHlsZXMuaW5kZXhPZihvcHRpb25zLnN0eWxlKSA9PT0gLTEpIHx8XG4gICAgICAgICFvcHRpb25zLm9wdGlvbnMgfHxcbiAgICAgICAgKHR5cGVvZiBvcHRpb25zLm9wdGlvbnMubGVuZ3RoICE9PSBcIm51bWJlclwiKSB8fCAob3B0aW9ucy5vcHRpb25zLmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgUHJvbXB0IE9wdGlvbnNcIiwgb3B0aW9ucyk7XG4gICAgfVxuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5tb2RhbCA9ICQoXCIjcHJvbXB0TW9kYWxcIik7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5zdHlsZSA9PT0gXCJyYWRpb1wiKSB7XG4gICAgICB0aGlzLmVsdHMgPSAkKCQucGFyc2VIVE1MKFwiPHRhYmxlPjwvdGFibGU+XCIpKS5hZGRDbGFzcyhcImNob2ljZUNvbnRhaW5lclwiKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5zdHlsZSA9PT0gXCJ0ZXh0XCIpIHtcbiAgICAgIHRoaXMuZWx0cyA9ICQoXCI8ZGl2PlwiKS5hZGRDbGFzcyhcImNob2ljZUNvbnRhaW5lclwiKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5zdHlsZSA9PT0gXCJjb3B5VGV4dFwiKSB7XG4gICAgICB0aGlzLmVsdHMgPSAkKFwiPGRpdj5cIikuYWRkQ2xhc3MoXCJjaG9pY2VDb250YWluZXJcIik7XG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuc3R5bGUgPT09IFwiY29uZmlybVwiKSB7XG4gICAgICB0aGlzLmVsdHMgPSAkKFwiPGRpdj5cIikuYWRkQ2xhc3MoXCJjaG9pY2VDb250YWluZXJcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWx0cyA9ICQoJC5wYXJzZUhUTUwoXCI8ZGl2PjwvZGl2PlwiKSkuYWRkQ2xhc3MoXCJjaG9pY2VDb250YWluZXJcIik7XG4gICAgfVxuICAgIHRoaXMudGl0bGUgPSAkKFwiLm1vZGFsLWhlYWRlciA+IGgzXCIsIHRoaXMubW9kYWwpO1xuICAgIHRoaXMubW9kYWxDb250ZW50ID0gJChcIi5tb2RhbC1jb250ZW50XCIsIHRoaXMubW9kYWwpO1xuICAgIHRoaXMuY2xvc2VCdXR0b24gPSAkKFwiLmNsb3NlXCIsIHRoaXMubW9kYWwpO1xuICAgIHRoaXMuc3VibWl0QnV0dG9uID0gJChcIi5zdWJtaXRcIiwgdGhpcy5tb2RhbCk7XG4gICAgaWYodGhpcy5vcHRpb25zLnN1Ym1pdFRleHQpIHtcbiAgICAgIHRoaXMuc3VibWl0QnV0dG9uLnRleHQodGhpcy5vcHRpb25zLnN1Ym1pdFRleHQpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuc3VibWl0QnV0dG9uLnRleHQoXCJTdWJtaXRcIik7XG4gICAgfVxuICAgIGlmKHRoaXMub3B0aW9ucy5jYW5jZWxUZXh0KSB7XG4gICAgICB0aGlzLmNsb3NlQnV0dG9uLnRleHQodGhpcy5vcHRpb25zLmNhbmNlbFRleHQpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuY2xvc2VCdXR0b24udGV4dChcIkNhbmNlbFwiKTtcbiAgICB9XG4gICAgdGhpcy5tb2RhbENvbnRlbnQudG9nZ2xlQ2xhc3MoXCJuYXJyb3dcIiwgISF0aGlzLm9wdGlvbnMubmFycm93KTtcblxuICAgIHRoaXMuaXNDb21waWxlZCA9IGZhbHNlO1xuICAgIHRoaXMuZGVmZXJyZWQgPSBRLmRlZmVyKCk7XG4gICAgdGhpcy5wcm9taXNlID0gdGhpcy5kZWZlcnJlZC5wcm9taXNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFR5cGUgZm9yIGhhbmRsZXJzIG9mIHJlc3BvbnNlcyBmcm9tIG1vZGFsIHByb21wdHNcbiAgICogQGNhbGxiYWNrIHByb21wdENhbGxiYWNrXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZXNwIC0gVGhlIHJlc3BvbnNlIGZyb20gdGhlIHVzZXJcbiAgICovXG5cbiAgLyoqXG4gICAqIFNob3dzIHRoaXMgcHJvbXB0IHRvIHRoZSB1c2VyICh3aWxsIHdhaXQgdW50aWwgYW55IGFjdGl2ZVxuICAgKiBwcm9tcHRzIGhhdmUgZmluaXNoZWQpXG4gICAqIEBwYXJhbSB7cHJvbXB0Q2FsbGJhY2t9IFtjYWxsYmFja10gLSBPcHRpb25hbCBjYWxsYmFjayB3aGljaCBpcyBwYXNzZWQgdGhlXG4gICAqICAgICAgICByZXN1bHQgb2YgdGhlIHByb21wdFxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgcmVzb2x2aW5nIHRvIGVpdGhlciB0aGUgcmVzdWx0IG9mIGBjYWxsYmFja2AsIGlmIHByb3ZpZGVkLFxuICAgKiAgICAgICAgICBvciB0aGUgcmVzdWx0IG9mIHRoZSBwcm9tcHQsIG90aGVyd2lzZS5cbiAgICovXG4gIFByb21wdC5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgLy8gVXNlIHRoZSBwcm9taXNlIHF1ZXVlIHRvIG1ha2Ugc3VyZSB0aGVyZSdzIG5vIG90aGVyXG4gICAgLy8gcHJvbXB0IGJlaW5nIHNob3duIGN1cnJlbnRseVxuICAgIGlmICh0aGlzLm9wdGlvbnMuaGlkZVN1Ym1pdCkge1xuICAgICAgdGhpcy5zdWJtaXRCdXR0b24uaGlkZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN1Ym1pdEJ1dHRvbi5zaG93KCk7XG4gICAgfVxuICAgIHRoaXMuY2xvc2VCdXR0b24uY2xpY2sodGhpcy5vbkNsb3NlLmJpbmQodGhpcykpO1xuICAgIHRoaXMubW9kYWwua2V5cHJlc3MoZnVuY3Rpb24oZSkge1xuICAgICAgaWYoZS53aGljaCA9PSAxMykge1xuICAgICAgICB0aGlzLnN1Ym1pdEJ1dHRvbi5jbGljaygpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnN1Ym1pdEJ1dHRvbi5jbGljayh0aGlzLm9uU3VibWl0LmJpbmQodGhpcykpO1xuICAgIHZhciBkb2NDbGljayA9IChmdW5jdGlvbihlKSB7XG4gICAgICAvLyBJZiB0aGUgcHJvbXB0IGlzIGFjdGl2ZSBhbmQgdGhlIGJhY2tncm91bmQgaXMgY2xpY2tlZCxcbiAgICAgIC8vIHRoZW4gY2xvc2UuXG4gICAgICBpZiAoJChlLnRhcmdldCkuaXModGhpcy5tb2RhbCkgJiYgdGhpcy5kZWZlcnJlZCkge1xuICAgICAgICB0aGlzLm9uQ2xvc2UoZSk7XG4gICAgICAgICQoZG9jdW1lbnQpLm9mZihcImNsaWNrXCIsIGRvY0NsaWNrKTtcbiAgICAgIH1cbiAgICB9KS5iaW5kKHRoaXMpO1xuICAgICQoZG9jdW1lbnQpLmNsaWNrKGRvY0NsaWNrKTtcbiAgICB2YXIgZG9jS2V5ZG93biA9IChmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoZS5rZXkgPT09IFwiRXNjYXBlXCIpIHtcbiAgICAgICAgdGhpcy5vbkNsb3NlKGUpO1xuICAgICAgICAkKGRvY3VtZW50KS5vZmYoXCJrZXlkb3duXCIsIGRvY0tleWRvd24pO1xuICAgICAgfVxuICAgIH0pLmJpbmQodGhpcyk7XG4gICAgJChkb2N1bWVudCkua2V5ZG93bihkb2NLZXlkb3duKTtcbiAgICB0aGlzLnRpdGxlLnRleHQodGhpcy5vcHRpb25zLnRpdGxlKTtcbiAgICB0aGlzLnBvcHVsYXRlTW9kYWwoKTtcbiAgICB0aGlzLm1vZGFsLmNzcygnZGlzcGxheScsICdibG9jaycpO1xuICAgICQoXCI6aW5wdXQ6ZW5hYmxlZDp2aXNpYmxlOmZpcnN0XCIsIHRoaXMubW9kYWwpLmZvY3VzKCkuc2VsZWN0KClcblxuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgcmV0dXJuIHRoaXMucHJvbWlzZS50aGVuKGNhbGxiYWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMucHJvbWlzZTtcbiAgICB9XG4gIH07XG5cblxuICAvKipcbiAgICogQ2xlYXJzIHRoZSBjb250ZW50cyBvZiB0aGUgbW9kYWwgcHJvbXB0LlxuICAgKi9cbiAgUHJvbXB0LnByb3RvdHlwZS5jbGVhck1vZGFsID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdWJtaXRCdXR0b24ub2ZmKCk7XG4gICAgdGhpcy5jbG9zZUJ1dHRvbi5vZmYoKTtcbiAgICB0aGlzLmVsdHMuZW1wdHkoKTtcbiAgfTtcbiAgXG4gIC8qKlxuICAgKiBQb3B1bGF0ZXMgdGhlIGNvbnRlbnRzIG9mIHRoZSBtb2RhbCBwcm9tcHQgd2l0aCB0aGVcbiAgICogb3B0aW9ucyBpbiB0aGlzIHByb21wdC5cbiAgICovXG4gIFByb21wdC5wcm90b3R5cGUucG9wdWxhdGVNb2RhbCA9IGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIGNyZWF0ZVJhZGlvRWx0KG9wdGlvbiwgaWR4KSB7XG4gICAgICB2YXIgZWx0ID0gJCgkLnBhcnNlSFRNTChcIjxpbnB1dCBuYW1lPVxcXCJweXJldC1tb2RhbFxcXCIgdHlwZT1cXFwicmFkaW9cXFwiPlwiKSk7XG4gICAgICB2YXIgaWQgPSBcInJcIiArIGlkeC50b1N0cmluZygpO1xuICAgICAgdmFyIGxhYmVsID0gJCgkLnBhcnNlSFRNTChcIjxsYWJlbCBmb3I9XFxcIlwiICsgaWQgKyBcIlxcXCI+PC9sYWJlbD5cIikpO1xuICAgICAgZWx0LmF0dHIoXCJpZFwiLCBpZCk7XG4gICAgICBlbHQuYXR0cihcInZhbHVlXCIsIG9wdGlvbi52YWx1ZSk7XG4gICAgICBsYWJlbC50ZXh0KG9wdGlvbi5tZXNzYWdlKTtcbiAgICAgIHZhciBlbHRDb250YWluZXIgPSAkKCQucGFyc2VIVE1MKFwiPHRkIGNsYXNzPVxcXCJweXJldC1tb2RhbC1vcHRpb24tcmFkaW9cXFwiPjwvdGQ+XCIpKTtcbiAgICAgIGVsdENvbnRhaW5lci5hcHBlbmQoZWx0KTtcbiAgICAgIHZhciBsYWJlbENvbnRhaW5lciA9ICQoJC5wYXJzZUhUTUwoXCI8dGQgY2xhc3M9XFxcInB5cmV0LW1vZGFsLW9wdGlvbi1tZXNzYWdlXFxcIj48L3RkPlwiKSk7XG4gICAgICBsYWJlbENvbnRhaW5lci5hcHBlbmQobGFiZWwpO1xuICAgICAgdmFyIGNvbnRhaW5lciA9ICQoJC5wYXJzZUhUTUwoXCI8dHIgY2xhc3M9XFxcInB5cmV0LW1vZGFsLW9wdGlvblxcXCI+PC90cj5cIikpO1xuICAgICAgY29udGFpbmVyLmFwcGVuZChlbHRDb250YWluZXIpO1xuICAgICAgY29udGFpbmVyLmFwcGVuZChsYWJlbENvbnRhaW5lcik7XG4gICAgICBpZiAob3B0aW9uLmV4YW1wbGUpIHtcbiAgICAgICAgdmFyIGV4YW1wbGUgPSAkKCQucGFyc2VIVE1MKFwiPGRpdj48L2Rpdj5cIikpO1xuICAgICAgICB2YXIgY20gPSBDb2RlTWlycm9yKGV4YW1wbGVbMF0sIHtcbiAgICAgICAgICB2YWx1ZTogb3B0aW9uLmV4YW1wbGUsXG4gICAgICAgICAgbW9kZTogJ3B5cmV0JyxcbiAgICAgICAgICBsaW5lTnVtYmVyczogZmFsc2UsXG4gICAgICAgICAgcmVhZE9ubHk6IFwibm9jdXJzb3JcIiAvLyB0aGlzIG1ha2VzIGl0IHJlYWRPbmx5ICYgbm90IGZvY3VzYWJsZSBhcyBhIGZvcm0gaW5wdXRcbiAgICAgICAgfSk7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICBjbS5yZWZyZXNoKCk7XG4gICAgICAgIH0sIDEpO1xuICAgICAgICB2YXIgZXhhbXBsZUNvbnRhaW5lciA9ICQoJC5wYXJzZUhUTUwoXCI8dGQgY2xhc3M9XFxcInB5cmV0LW1vZGFsLW9wdGlvbi1leGFtcGxlXFxcIj48L3RkPlwiKSk7XG4gICAgICAgIGV4YW1wbGVDb250YWluZXIuYXBwZW5kKGV4YW1wbGUpO1xuICAgICAgICBjb250YWluZXIuYXBwZW5kKGV4YW1wbGVDb250YWluZXIpO1xuICAgICAgfVxuICAgICAgXG4gICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjcmVhdGVUaWxlRWx0KG9wdGlvbiwgaWR4KSB7XG4gICAgICB2YXIgZWx0ID0gJCgkLnBhcnNlSFRNTChcIjxidXR0b24gbmFtZT1cXFwicHlyZXQtbW9kYWxcXFwiIGNsYXNzPVxcXCJ0aWxlXFxcIj48L2J1dHRvbj5cIikpO1xuICAgICAgZWx0LmF0dHIoXCJpZFwiLCBcInRcIiArIGlkeC50b1N0cmluZygpKTtcbiAgICAgIGVsdC5hcHBlbmQoJChcIjxiPlwiKS50ZXh0KG9wdGlvbi5tZXNzYWdlKSlcbiAgICAgICAgLmFwcGVuZCgkKFwiPHA+XCIpLnRleHQob3B0aW9uLmRldGFpbHMpKTtcbiAgICAgIGZvciAodmFyIGV2dCBpbiBvcHRpb24ub24pXG4gICAgICAgIGVsdC5vbihldnQsIG9wdGlvbi5vbltldnRdKTtcbiAgICAgIHJldHVybiBlbHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlVGV4dEVsdChvcHRpb24pIHtcbiAgICAgIHZhciBlbHQgPSAkKFwiPGRpdiBjbGFzcz1cXFwicHlyZXQtbW9kYWwtdGV4dFxcXCI+XCIpO1xuICAgICAgY29uc3QgaW5wdXQgPSAkKFwiPGlucHV0IGlkPSdtb2RhbC1wcm9tcHQtdGV4dCcgdHlwZT0ndGV4dCc+XCIpLnZhbChvcHRpb24uZGVmYXVsdFZhbHVlKTtcbiAgICAgIGlmKG9wdGlvbi5kcmF3RWxlbWVudCkge1xuICAgICAgICBlbHQuYXBwZW5kKG9wdGlvbi5kcmF3RWxlbWVudChpbnB1dCkpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGVsdC5hcHBlbmQoJChcIjxsYWJlbCBmb3I9J21vZGFsLXByb21wdC10ZXh0Jz5cIikuYWRkQ2xhc3MoXCJ0ZXh0TGFiZWxcIikudGV4dChvcHRpb24ubWVzc2FnZSkpO1xuICAgICAgICBlbHQuYXBwZW5kKGlucHV0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlQ29weVRleHRFbHQob3B0aW9uKSB7XG4gICAgICB2YXIgZWx0ID0gJChcIjxkaXY+XCIpO1xuICAgICAgZWx0LmFwcGVuZCgkKFwiPHA+XCIpLmFkZENsYXNzKFwidGV4dExhYmVsXCIpLnRleHQob3B0aW9uLm1lc3NhZ2UpKTtcbiAgICAgIGlmKG9wdGlvbi50ZXh0KSB7XG4gICAgICAgIHZhciBib3ggPSBhdXRvSGlnaGxpZ2h0Qm94KG9wdGlvbi50ZXh0KTtcbiAgLy8gICAgICBlbHQuYXBwZW5kKCQoXCI8c3Bhbj5cIikudGV4dChcIihcIiArIG9wdGlvbi5kZXRhaWxzICsgXCIpXCIpKTtcbiAgICAgICAgZWx0LmFwcGVuZChib3gpO1xuICAgICAgICBib3guZm9jdXMoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlQ29uZmlybUVsdChvcHRpb24pIHtcbiAgICAgIHJldHVybiAkKFwiPHA+XCIpLnRleHQob3B0aW9uLm1lc3NhZ2UpO1xuICAgIH1cblxuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUVsdChvcHRpb24sIGkpIHtcbiAgICAgIGlmKHRoYXQub3B0aW9ucy5zdHlsZSA9PT0gXCJyYWRpb1wiKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVSYWRpb0VsdChvcHRpb24sIGkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZih0aGF0Lm9wdGlvbnMuc3R5bGUgPT09IFwidGlsZXNcIikge1xuICAgICAgICByZXR1cm4gY3JlYXRlVGlsZUVsdChvcHRpb24sIGkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZih0aGF0Lm9wdGlvbnMuc3R5bGUgPT09IFwidGV4dFwiKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVUZXh0RWx0KG9wdGlvbik7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKHRoYXQub3B0aW9ucy5zdHlsZSA9PT0gXCJjb3B5VGV4dFwiKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVDb3B5VGV4dEVsdChvcHRpb24pO1xuICAgICAgfVxuICAgICAgZWxzZSBpZih0aGF0Lm9wdGlvbnMuc3R5bGUgPT09IFwiY29uZmlybVwiKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVDb25maXJtRWx0KG9wdGlvbik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIG9wdGlvbkVsdHM7XG4gICAgLy8gQ2FjaGUgcmVzdWx0c1xuLy8gICAgaWYgKHRydWUpIHtcbiAgICAgIG9wdGlvbkVsdHMgPSB0aGlzLm9wdGlvbnMub3B0aW9ucy5tYXAoY3JlYXRlRWx0KTtcbi8vICAgICAgdGhpcy5jb21waWxlZEVsdHMgPSBvcHRpb25FbHRzO1xuLy8gICAgICB0aGlzLmlzQ29tcGlsZWQgPSB0cnVlO1xuLy8gICAgfSBlbHNlIHtcbi8vICAgICAgb3B0aW9uRWx0cyA9IHRoaXMuY29tcGlsZWRFbHRzO1xuLy8gICAgfVxuICAgICQoXCJpbnB1dFt0eXBlPSdyYWRpbyddXCIsIG9wdGlvbkVsdHNbMF0pLmF0dHIoJ2NoZWNrZWQnLCB0cnVlKTtcbiAgICB0aGlzLmVsdHMuYXBwZW5kKG9wdGlvbkVsdHMpO1xuICAgICQoXCIubW9kYWwtYm9keVwiLCB0aGlzLm1vZGFsKS5lbXB0eSgpLmFwcGVuZCh0aGlzLmVsdHMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBIYW5kbGVyIHdoaWNoIGlzIGNhbGxlZCB3aGVuIHRoZSB1c2VyIGRvZXMgbm90IHNlbGVjdCBhbnl0aGluZ1xuICAgKi9cbiAgUHJvbXB0LnByb3RvdHlwZS5vbkNsb3NlID0gZnVuY3Rpb24oZSkge1xuICAgIHRoaXMubW9kYWwuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICB0aGlzLmNsZWFyTW9kYWwoKTtcbiAgICB0aGlzLmRlZmVycmVkLnJlc29sdmUobnVsbCk7XG4gICAgZGVsZXRlIHRoaXMuZGVmZXJyZWQ7XG4gICAgZGVsZXRlIHRoaXMucHJvbWlzZTtcbiAgfTtcblxuICAvKipcbiAgICogSGFuZGxlciB3aGljaCBpcyBjYWxsZWQgd2hlbiB0aGUgdXNlciBwcmVzc2VzIFwic3VibWl0XCJcbiAgICovXG4gIFByb21wdC5wcm90b3R5cGUub25TdWJtaXQgPSBmdW5jdGlvbihlKSB7XG4gICAgaWYodGhpcy5vcHRpb25zLnN0eWxlID09PSBcInJhZGlvXCIpIHtcbiAgICAgIHZhciByZXR2YWwgPSAkKFwiaW5wdXRbdHlwZT0ncmFkaW8nXTpjaGVja2VkXCIsIHRoaXMubW9kYWwpLnZhbCgpO1xuICAgIH1cbiAgICBlbHNlIGlmKHRoaXMub3B0aW9ucy5zdHlsZSA9PT0gXCJ0ZXh0XCIpIHtcbiAgICAgIHZhciByZXR2YWwgPSAkKFwiaW5wdXRbdHlwZT0ndGV4dCddXCIsIHRoaXMubW9kYWwpLnZhbCgpO1xuICAgIH1cbiAgICBlbHNlIGlmKHRoaXMub3B0aW9ucy5zdHlsZSA9PT0gXCJjb3B5VGV4dFwiKSB7XG4gICAgICB2YXIgcmV0dmFsID0gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSBpZih0aGlzLm9wdGlvbnMuc3R5bGUgPT09IFwiY29uZmlybVwiKSB7XG4gICAgICB2YXIgcmV0dmFsID0gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB2YXIgcmV0dmFsID0gdHJ1ZTsgLy8gSnVzdCByZXR1cm4gdHJ1ZSBpZiB0aGV5IGNsaWNrZWQgc3VibWl0XG4gICAgfVxuICAgIHRoaXMubW9kYWwuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICB0aGlzLmNsZWFyTW9kYWwoKTtcbiAgICB0aGlzLmRlZmVycmVkLnJlc29sdmUocmV0dmFsKTtcbiAgICBkZWxldGUgdGhpcy5kZWZlcnJlZDtcbiAgICBkZWxldGUgdGhpcy5wcm9taXNlO1xuICB9O1xuXG4gIHJldHVybiBQcm9tcHQ7XG5cbn0pO1xuXG4iLCIvLyB2aW06dHM9NDpzdHM9NDpzdz00OlxuLyohXG4gKlxuICogQ29weXJpZ2h0IDIwMDktMjAxMiBLcmlzIEtvd2FsIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTUlUXG4gKiBsaWNlbnNlIGZvdW5kIGF0IGh0dHA6Ly9naXRodWIuY29tL2tyaXNrb3dhbC9xL3Jhdy9tYXN0ZXIvTElDRU5TRVxuICpcbiAqIFdpdGggcGFydHMgYnkgVHlsZXIgQ2xvc2VcbiAqIENvcHlyaWdodCAyMDA3LTIwMDkgVHlsZXIgQ2xvc2UgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBNSVQgWCBsaWNlbnNlIGZvdW5kXG4gKiBhdCBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLmh0bWxcbiAqIEZvcmtlZCBhdCByZWZfc2VuZC5qcyB2ZXJzaW9uOiAyMDA5LTA1LTExXG4gKlxuICogV2l0aCBwYXJ0cyBieSBNYXJrIE1pbGxlclxuICogQ29weXJpZ2h0IChDKSAyMDExIEdvb2dsZSBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKlxuICovXG5cbihmdW5jdGlvbiAoZGVmaW5pdGlvbikge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgLy8gVGhpcyBmaWxlIHdpbGwgZnVuY3Rpb24gcHJvcGVybHkgYXMgYSA8c2NyaXB0PiB0YWcsIG9yIGEgbW9kdWxlXG4gICAgLy8gdXNpbmcgQ29tbW9uSlMgYW5kIE5vZGVKUyBvciBSZXF1aXJlSlMgbW9kdWxlIGZvcm1hdHMuICBJblxuICAgIC8vIENvbW1vbi9Ob2RlL1JlcXVpcmVKUywgdGhlIG1vZHVsZSBleHBvcnRzIHRoZSBRIEFQSSBhbmQgd2hlblxuICAgIC8vIGV4ZWN1dGVkIGFzIGEgc2ltcGxlIDxzY3JpcHQ+LCBpdCBjcmVhdGVzIGEgUSBnbG9iYWwgaW5zdGVhZC5cblxuICAgIC8vIE1vbnRhZ2UgUmVxdWlyZVxuICAgIGlmICh0eXBlb2YgYm9vdHN0cmFwID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgYm9vdHN0cmFwKFwicHJvbWlzZVwiLCBkZWZpbml0aW9uKTtcblxuICAgIC8vIENvbW1vbkpTXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpO1xuXG4gICAgLy8gUmVxdWlyZUpTXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoZGVmaW5pdGlvbik7XG5cbiAgICAvLyBTRVMgKFNlY3VyZSBFY21hU2NyaXB0KVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNlcyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpZiAoIXNlcy5vaygpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZXMubWFrZVEgPSBkZWZpbml0aW9uO1xuICAgICAgICB9XG5cbiAgICAvLyA8c2NyaXB0PlxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiB8fCB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvLyBQcmVmZXIgd2luZG93IG92ZXIgc2VsZiBmb3IgYWRkLW9uIHNjcmlwdHMuIFVzZSBzZWxmIGZvclxuICAgICAgICAvLyBub24td2luZG93ZWQgY29udGV4dHMuXG4gICAgICAgIHZhciBnbG9iYWwgPSB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDogc2VsZjtcblxuICAgICAgICAvLyBHZXQgdGhlIGB3aW5kb3dgIG9iamVjdCwgc2F2ZSB0aGUgcHJldmlvdXMgUSBnbG9iYWxcbiAgICAgICAgLy8gYW5kIGluaXRpYWxpemUgUSBhcyBhIGdsb2JhbC5cbiAgICAgICAgdmFyIHByZXZpb3VzUSA9IGdsb2JhbC5RO1xuICAgICAgICBnbG9iYWwuUSA9IGRlZmluaXRpb24oKTtcblxuICAgICAgICAvLyBBZGQgYSBub0NvbmZsaWN0IGZ1bmN0aW9uIHNvIFEgY2FuIGJlIHJlbW92ZWQgZnJvbSB0aGVcbiAgICAgICAgLy8gZ2xvYmFsIG5hbWVzcGFjZS5cbiAgICAgICAgZ2xvYmFsLlEubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGdsb2JhbC5RID0gcHJldmlvdXNRO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIGVudmlyb25tZW50IHdhcyBub3QgYW50aWNpcGF0ZWQgYnkgUS4gUGxlYXNlIGZpbGUgYSBidWcuXCIpO1xuICAgIH1cblxufSkoZnVuY3Rpb24gKCkge1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBoYXNTdGFja3MgPSBmYWxzZTtcbnRyeSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCk7XG59IGNhdGNoIChlKSB7XG4gICAgaGFzU3RhY2tzID0gISFlLnN0YWNrO1xufVxuXG4vLyBBbGwgY29kZSBhZnRlciB0aGlzIHBvaW50IHdpbGwgYmUgZmlsdGVyZWQgZnJvbSBzdGFjayB0cmFjZXMgcmVwb3J0ZWRcbi8vIGJ5IFEuXG52YXIgcVN0YXJ0aW5nTGluZSA9IGNhcHR1cmVMaW5lKCk7XG52YXIgcUZpbGVOYW1lO1xuXG4vLyBzaGltc1xuXG4vLyB1c2VkIGZvciBmYWxsYmFjayBpbiBcImFsbFJlc29sdmVkXCJcbnZhciBub29wID0gZnVuY3Rpb24gKCkge307XG5cbi8vIFVzZSB0aGUgZmFzdGVzdCBwb3NzaWJsZSBtZWFucyB0byBleGVjdXRlIGEgdGFzayBpbiBhIGZ1dHVyZSB0dXJuXG4vLyBvZiB0aGUgZXZlbnQgbG9vcC5cbnZhciBuZXh0VGljayA9KGZ1bmN0aW9uICgpIHtcbiAgICAvLyBsaW5rZWQgbGlzdCBvZiB0YXNrcyAoc2luZ2xlLCB3aXRoIGhlYWQgbm9kZSlcbiAgICB2YXIgaGVhZCA9IHt0YXNrOiB2b2lkIDAsIG5leHQ6IG51bGx9O1xuICAgIHZhciB0YWlsID0gaGVhZDtcbiAgICB2YXIgZmx1c2hpbmcgPSBmYWxzZTtcbiAgICB2YXIgcmVxdWVzdFRpY2sgPSB2b2lkIDA7XG4gICAgdmFyIGlzTm9kZUpTID0gZmFsc2U7XG4gICAgLy8gcXVldWUgZm9yIGxhdGUgdGFza3MsIHVzZWQgYnkgdW5oYW5kbGVkIHJlamVjdGlvbiB0cmFja2luZ1xuICAgIHZhciBsYXRlclF1ZXVlID0gW107XG5cbiAgICBmdW5jdGlvbiBmbHVzaCgpIHtcbiAgICAgICAgLyoganNoaW50IGxvb3BmdW5jOiB0cnVlICovXG4gICAgICAgIHZhciB0YXNrLCBkb21haW47XG5cbiAgICAgICAgd2hpbGUgKGhlYWQubmV4dCkge1xuICAgICAgICAgICAgaGVhZCA9IGhlYWQubmV4dDtcbiAgICAgICAgICAgIHRhc2sgPSBoZWFkLnRhc2s7XG4gICAgICAgICAgICBoZWFkLnRhc2sgPSB2b2lkIDA7XG4gICAgICAgICAgICBkb21haW4gPSBoZWFkLmRvbWFpbjtcblxuICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgIGhlYWQuZG9tYWluID0gdm9pZCAwO1xuICAgICAgICAgICAgICAgIGRvbWFpbi5lbnRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcnVuU2luZ2xlKHRhc2ssIGRvbWFpbik7XG5cbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAobGF0ZXJRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRhc2sgPSBsYXRlclF1ZXVlLnBvcCgpO1xuICAgICAgICAgICAgcnVuU2luZ2xlKHRhc2spO1xuICAgICAgICB9XG4gICAgICAgIGZsdXNoaW5nID0gZmFsc2U7XG4gICAgfVxuICAgIC8vIHJ1bnMgYSBzaW5nbGUgZnVuY3Rpb24gaW4gdGhlIGFzeW5jIHF1ZXVlXG4gICAgZnVuY3Rpb24gcnVuU2luZ2xlKHRhc2ssIGRvbWFpbikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGFzaygpO1xuXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChpc05vZGVKUykge1xuICAgICAgICAgICAgICAgIC8vIEluIG5vZGUsIHVuY2F1Z2h0IGV4Y2VwdGlvbnMgYXJlIGNvbnNpZGVyZWQgZmF0YWwgZXJyb3JzLlxuICAgICAgICAgICAgICAgIC8vIFJlLXRocm93IHRoZW0gc3luY2hyb25vdXNseSB0byBpbnRlcnJ1cHQgZmx1c2hpbmchXG5cbiAgICAgICAgICAgICAgICAvLyBFbnN1cmUgY29udGludWF0aW9uIGlmIHRoZSB1bmNhdWdodCBleGNlcHRpb24gaXMgc3VwcHJlc3NlZFxuICAgICAgICAgICAgICAgIC8vIGxpc3RlbmluZyBcInVuY2F1Z2h0RXhjZXB0aW9uXCIgZXZlbnRzIChhcyBkb21haW5zIGRvZXMpLlxuICAgICAgICAgICAgICAgIC8vIENvbnRpbnVlIGluIG5leHQgZXZlbnQgdG8gYXZvaWQgdGljayByZWN1cnNpb24uXG4gICAgICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgICAgICBkb21haW4uZXhpdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvbWFpbi5lbnRlcigpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRocm93IGU7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gSW4gYnJvd3NlcnMsIHVuY2F1Z2h0IGV4Y2VwdGlvbnMgYXJlIG5vdCBmYXRhbC5cbiAgICAgICAgICAgICAgICAvLyBSZS10aHJvdyB0aGVtIGFzeW5jaHJvbm91c2x5IHRvIGF2b2lkIHNsb3ctZG93bnMuXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICBkb21haW4uZXhpdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmV4dFRpY2sgPSBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB0YWlsID0gdGFpbC5uZXh0ID0ge1xuICAgICAgICAgICAgdGFzazogdGFzayxcbiAgICAgICAgICAgIGRvbWFpbjogaXNOb2RlSlMgJiYgcHJvY2Vzcy5kb21haW4sXG4gICAgICAgICAgICBuZXh0OiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKCFmbHVzaGluZykge1xuICAgICAgICAgICAgZmx1c2hpbmcgPSB0cnVlO1xuICAgICAgICAgICAgcmVxdWVzdFRpY2soKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgcHJvY2Vzcy50b1N0cmluZygpID09PSBcIltvYmplY3QgcHJvY2Vzc11cIiAmJiBwcm9jZXNzLm5leHRUaWNrKSB7XG4gICAgICAgIC8vIEVuc3VyZSBRIGlzIGluIGEgcmVhbCBOb2RlIGVudmlyb25tZW50LCB3aXRoIGEgYHByb2Nlc3MubmV4dFRpY2tgLlxuICAgICAgICAvLyBUbyBzZWUgdGhyb3VnaCBmYWtlIE5vZGUgZW52aXJvbm1lbnRzOlxuICAgICAgICAvLyAqIE1vY2hhIHRlc3QgcnVubmVyIC0gZXhwb3NlcyBhIGBwcm9jZXNzYCBnbG9iYWwgd2l0aG91dCBhIGBuZXh0VGlja2BcbiAgICAgICAgLy8gKiBCcm93c2VyaWZ5IC0gZXhwb3NlcyBhIGBwcm9jZXNzLm5leFRpY2tgIGZ1bmN0aW9uIHRoYXQgdXNlc1xuICAgICAgICAvLyAgIGBzZXRUaW1lb3V0YC4gSW4gdGhpcyBjYXNlIGBzZXRJbW1lZGlhdGVgIGlzIHByZWZlcnJlZCBiZWNhdXNlXG4gICAgICAgIC8vICAgIGl0IGlzIGZhc3Rlci4gQnJvd3NlcmlmeSdzIGBwcm9jZXNzLnRvU3RyaW5nKClgIHlpZWxkc1xuICAgICAgICAvLyAgIFwiW29iamVjdCBPYmplY3RdXCIsIHdoaWxlIGluIGEgcmVhbCBOb2RlIGVudmlyb25tZW50XG4gICAgICAgIC8vICAgYHByb2Nlc3MubmV4dFRpY2soKWAgeWllbGRzIFwiW29iamVjdCBwcm9jZXNzXVwiLlxuICAgICAgICBpc05vZGVKUyA9IHRydWU7XG5cbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGZsdXNoKTtcbiAgICAgICAgfTtcblxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIC8vIEluIElFMTAsIE5vZGUuanMgMC45Kywgb3IgaHR0cHM6Ly9naXRodWIuY29tL05vYmxlSlMvc2V0SW1tZWRpYXRlXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IHNldEltbWVkaWF0ZS5iaW5kKHdpbmRvdywgZmx1c2gpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2V0SW1tZWRpYXRlKGZsdXNoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAodHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIG1vZGVybiBicm93c2Vyc1xuICAgICAgICAvLyBodHRwOi8vd3d3Lm5vbmJsb2NraW5nLmlvLzIwMTEvMDYvd2luZG93bmV4dHRpY2suaHRtbFxuICAgICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgICAvLyBBdCBsZWFzdCBTYWZhcmkgVmVyc2lvbiA2LjAuNSAoODUzNi4zMC4xKSBpbnRlcm1pdHRlbnRseSBjYW5ub3QgY3JlYXRlXG4gICAgICAgIC8vIHdvcmtpbmcgbWVzc2FnZSBwb3J0cyB0aGUgZmlyc3QgdGltZSBhIHBhZ2UgbG9hZHMuXG4gICAgICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVxdWVzdFRpY2sgPSByZXF1ZXN0UG9ydFRpY2s7XG4gICAgICAgICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZsdXNoO1xuICAgICAgICAgICAgZmx1c2goKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHJlcXVlc3RQb3J0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIE9wZXJhIHJlcXVpcmVzIHVzIHRvIHByb3ZpZGUgYSBtZXNzYWdlIHBheWxvYWQsIHJlZ2FyZGxlc3Mgb2ZcbiAgICAgICAgICAgIC8vIHdoZXRoZXIgd2UgdXNlIGl0LlxuICAgICAgICAgICAgY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZSgwKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgICAgIHJlcXVlc3RQb3J0VGljaygpO1xuICAgICAgICB9O1xuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gb2xkIGJyb3dzZXJzXG4gICAgICAgIHJlcXVlc3RUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8vIHJ1bnMgYSB0YXNrIGFmdGVyIGFsbCBvdGhlciB0YXNrcyBoYXZlIGJlZW4gcnVuXG4gICAgLy8gdGhpcyBpcyB1c2VmdWwgZm9yIHVuaGFuZGxlZCByZWplY3Rpb24gdHJhY2tpbmcgdGhhdCBuZWVkcyB0byBoYXBwZW5cbiAgICAvLyBhZnRlciBhbGwgYHRoZW5gZCB0YXNrcyBoYXZlIGJlZW4gcnVuLlxuICAgIG5leHRUaWNrLnJ1bkFmdGVyID0gZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgbGF0ZXJRdWV1ZS5wdXNoKHRhc2spO1xuICAgICAgICBpZiAoIWZsdXNoaW5nKSB7XG4gICAgICAgICAgICBmbHVzaGluZyA9IHRydWU7XG4gICAgICAgICAgICByZXF1ZXN0VGljaygpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gbmV4dFRpY2s7XG59KSgpO1xuXG4vLyBBdHRlbXB0IHRvIG1ha2UgZ2VuZXJpY3Mgc2FmZSBpbiB0aGUgZmFjZSBvZiBkb3duc3RyZWFtXG4vLyBtb2RpZmljYXRpb25zLlxuLy8gVGhlcmUgaXMgbm8gc2l0dWF0aW9uIHdoZXJlIHRoaXMgaXMgbmVjZXNzYXJ5LlxuLy8gSWYgeW91IG5lZWQgYSBzZWN1cml0eSBndWFyYW50ZWUsIHRoZXNlIHByaW1vcmRpYWxzIG5lZWQgdG8gYmVcbi8vIGRlZXBseSBmcm96ZW4gYW55d2F5LCBhbmQgaWYgeW91IGRvbuKAmXQgbmVlZCBhIHNlY3VyaXR5IGd1YXJhbnRlZSxcbi8vIHRoaXMgaXMganVzdCBwbGFpbiBwYXJhbm9pZC5cbi8vIEhvd2V2ZXIsIHRoaXMgKiptaWdodCoqIGhhdmUgdGhlIG5pY2Ugc2lkZS1lZmZlY3Qgb2YgcmVkdWNpbmcgdGhlIHNpemUgb2Zcbi8vIHRoZSBtaW5pZmllZCBjb2RlIGJ5IHJlZHVjaW5nIHguY2FsbCgpIHRvIG1lcmVseSB4KClcbi8vIFNlZSBNYXJrIE1pbGxlcuKAmXMgZXhwbGFuYXRpb24gb2Ygd2hhdCB0aGlzIGRvZXMuXG4vLyBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1jb252ZW50aW9uczpzYWZlX21ldGFfcHJvZ3JhbW1pbmdcbnZhciBjYWxsID0gRnVuY3Rpb24uY2FsbDtcbmZ1bmN0aW9uIHVuY3VycnlUaGlzKGYpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY2FsbC5hcHBseShmLCBhcmd1bWVudHMpO1xuICAgIH07XG59XG4vLyBUaGlzIGlzIGVxdWl2YWxlbnQsIGJ1dCBzbG93ZXI6XG4vLyB1bmN1cnJ5VGhpcyA9IEZ1bmN0aW9uX2JpbmQuYmluZChGdW5jdGlvbl9iaW5kLmNhbGwpO1xuLy8gaHR0cDovL2pzcGVyZi5jb20vdW5jdXJyeXRoaXNcblxudmFyIGFycmF5X3NsaWNlID0gdW5jdXJyeVRoaXMoQXJyYXkucHJvdG90eXBlLnNsaWNlKTtcblxudmFyIGFycmF5X3JlZHVjZSA9IHVuY3VycnlUaGlzKFxuICAgIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UgfHwgZnVuY3Rpb24gKGNhbGxiYWNrLCBiYXNpcykge1xuICAgICAgICB2YXIgaW5kZXggPSAwLFxuICAgICAgICAgICAgbGVuZ3RoID0gdGhpcy5sZW5ndGg7XG4gICAgICAgIC8vIGNvbmNlcm5pbmcgdGhlIGluaXRpYWwgdmFsdWUsIGlmIG9uZSBpcyBub3QgcHJvdmlkZWRcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIC8vIHNlZWsgdG8gdGhlIGZpcnN0IHZhbHVlIGluIHRoZSBhcnJheSwgYWNjb3VudGluZ1xuICAgICAgICAgICAgLy8gZm9yIHRoZSBwb3NzaWJpbGl0eSB0aGF0IGlzIGlzIGEgc3BhcnNlIGFycmF5XG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4IGluIHRoaXMpIHtcbiAgICAgICAgICAgICAgICAgICAgYmFzaXMgPSB0aGlzW2luZGV4KytdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCsraW5kZXggPj0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IHdoaWxlICgxKTtcbiAgICAgICAgfVxuICAgICAgICAvLyByZWR1Y2VcbiAgICAgICAgZm9yICg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAvLyBhY2NvdW50IGZvciB0aGUgcG9zc2liaWxpdHkgdGhhdCB0aGUgYXJyYXkgaXMgc3BhcnNlXG4gICAgICAgICAgICBpZiAoaW5kZXggaW4gdGhpcykge1xuICAgICAgICAgICAgICAgIGJhc2lzID0gY2FsbGJhY2soYmFzaXMsIHRoaXNbaW5kZXhdLCBpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhc2lzO1xuICAgIH1cbik7XG5cbnZhciBhcnJheV9pbmRleE9mID0gdW5jdXJyeVRoaXMoXG4gICAgQXJyYXkucHJvdG90eXBlLmluZGV4T2YgfHwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIG5vdCBhIHZlcnkgZ29vZCBzaGltLCBidXQgZ29vZCBlbm91Z2ggZm9yIG91ciBvbmUgdXNlIG9mIGl0XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXNbaV0gPT09IHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbik7XG5cbnZhciBhcnJheV9tYXAgPSB1bmN1cnJ5VGhpcyhcbiAgICBBcnJheS5wcm90b3R5cGUubWFwIHx8IGZ1bmN0aW9uIChjYWxsYmFjaywgdGhpc3ApIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgY29sbGVjdCA9IFtdO1xuICAgICAgICBhcnJheV9yZWR1Y2Uoc2VsZiwgZnVuY3Rpb24gKHVuZGVmaW5lZCwgdmFsdWUsIGluZGV4KSB7XG4gICAgICAgICAgICBjb2xsZWN0LnB1c2goY2FsbGJhY2suY2FsbCh0aGlzcCwgdmFsdWUsIGluZGV4LCBzZWxmKSk7XG4gICAgICAgIH0sIHZvaWQgMCk7XG4gICAgICAgIHJldHVybiBjb2xsZWN0O1xuICAgIH1cbik7XG5cbnZhciBvYmplY3RfY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbiAocHJvdG90eXBlKSB7XG4gICAgZnVuY3Rpb24gVHlwZSgpIHsgfVxuICAgIFR5cGUucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgIHJldHVybiBuZXcgVHlwZSgpO1xufTtcblxudmFyIG9iamVjdF9oYXNPd25Qcm9wZXJ0eSA9IHVuY3VycnlUaGlzKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkpO1xuXG52YXIgb2JqZWN0X2tleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSB7XG4gICAgICAgIGlmIChvYmplY3RfaGFzT3duUHJvcGVydHkob2JqZWN0LCBrZXkpKSB7XG4gICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ga2V5cztcbn07XG5cbnZhciBvYmplY3RfdG9TdHJpbmcgPSB1bmN1cnJ5VGhpcyhPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nKTtcblxuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IE9iamVjdCh2YWx1ZSk7XG59XG5cbi8vIGdlbmVyYXRvciByZWxhdGVkIHNoaW1zXG5cbi8vIEZJWE1FOiBSZW1vdmUgdGhpcyBmdW5jdGlvbiBvbmNlIEVTNiBnZW5lcmF0b3JzIGFyZSBpbiBTcGlkZXJNb25rZXkuXG5mdW5jdGlvbiBpc1N0b3BJdGVyYXRpb24oZXhjZXB0aW9uKSB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgb2JqZWN0X3RvU3RyaW5nKGV4Y2VwdGlvbikgPT09IFwiW29iamVjdCBTdG9wSXRlcmF0aW9uXVwiIHx8XG4gICAgICAgIGV4Y2VwdGlvbiBpbnN0YW5jZW9mIFFSZXR1cm5WYWx1ZVxuICAgICk7XG59XG5cbi8vIEZJWE1FOiBSZW1vdmUgdGhpcyBoZWxwZXIgYW5kIFEucmV0dXJuIG9uY2UgRVM2IGdlbmVyYXRvcnMgYXJlIGluXG4vLyBTcGlkZXJNb25rZXkuXG52YXIgUVJldHVyblZhbHVlO1xuaWYgKHR5cGVvZiBSZXR1cm5WYWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIFFSZXR1cm5WYWx1ZSA9IFJldHVyblZhbHVlO1xufSBlbHNlIHtcbiAgICBRUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIH07XG59XG5cbi8vIGxvbmcgc3RhY2sgdHJhY2VzXG5cbnZhciBTVEFDS19KVU1QX1NFUEFSQVRPUiA9IFwiRnJvbSBwcmV2aW91cyBldmVudDpcIjtcblxuZnVuY3Rpb24gbWFrZVN0YWNrVHJhY2VMb25nKGVycm9yLCBwcm9taXNlKSB7XG4gICAgLy8gSWYgcG9zc2libGUsIHRyYW5zZm9ybSB0aGUgZXJyb3Igc3RhY2sgdHJhY2UgYnkgcmVtb3ZpbmcgTm9kZSBhbmQgUVxuICAgIC8vIGNydWZ0LCB0aGVuIGNvbmNhdGVuYXRpbmcgd2l0aCB0aGUgc3RhY2sgdHJhY2Ugb2YgYHByb21pc2VgLiBTZWUgIzU3LlxuICAgIGlmIChoYXNTdGFja3MgJiZcbiAgICAgICAgcHJvbWlzZS5zdGFjayAmJlxuICAgICAgICB0eXBlb2YgZXJyb3IgPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgZXJyb3IgIT09IG51bGwgJiZcbiAgICAgICAgZXJyb3Iuc3RhY2sgJiZcbiAgICAgICAgZXJyb3Iuc3RhY2suaW5kZXhPZihTVEFDS19KVU1QX1NFUEFSQVRPUikgPT09IC0xXG4gICAgKSB7XG4gICAgICAgIHZhciBzdGFja3MgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgcCA9IHByb21pc2U7ICEhcDsgcCA9IHAuc291cmNlKSB7XG4gICAgICAgICAgICBpZiAocC5zdGFjaykge1xuICAgICAgICAgICAgICAgIHN0YWNrcy51bnNoaWZ0KHAuc3RhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN0YWNrcy51bnNoaWZ0KGVycm9yLnN0YWNrKTtcblxuICAgICAgICB2YXIgY29uY2F0ZWRTdGFja3MgPSBzdGFja3Muam9pbihcIlxcblwiICsgU1RBQ0tfSlVNUF9TRVBBUkFUT1IgKyBcIlxcblwiKTtcbiAgICAgICAgZXJyb3Iuc3RhY2sgPSBmaWx0ZXJTdGFja1N0cmluZyhjb25jYXRlZFN0YWNrcyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBmaWx0ZXJTdGFja1N0cmluZyhzdGFja1N0cmluZykge1xuICAgIHZhciBsaW5lcyA9IHN0YWNrU3RyaW5nLnNwbGl0KFwiXFxuXCIpO1xuICAgIHZhciBkZXNpcmVkTGluZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBsaW5lID0gbGluZXNbaV07XG5cbiAgICAgICAgaWYgKCFpc0ludGVybmFsRnJhbWUobGluZSkgJiYgIWlzTm9kZUZyYW1lKGxpbmUpICYmIGxpbmUpIHtcbiAgICAgICAgICAgIGRlc2lyZWRMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkZXNpcmVkTGluZXMuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gaXNOb2RlRnJhbWUoc3RhY2tMaW5lKSB7XG4gICAgcmV0dXJuIHN0YWNrTGluZS5pbmRleE9mKFwiKG1vZHVsZS5qczpcIikgIT09IC0xIHx8XG4gICAgICAgICAgIHN0YWNrTGluZS5pbmRleE9mKFwiKG5vZGUuanM6XCIpICE9PSAtMTtcbn1cblxuZnVuY3Rpb24gZ2V0RmlsZU5hbWVBbmRMaW5lTnVtYmVyKHN0YWNrTGluZSkge1xuICAgIC8vIE5hbWVkIGZ1bmN0aW9uczogXCJhdCBmdW5jdGlvbk5hbWUgKGZpbGVuYW1lOmxpbmVOdW1iZXI6Y29sdW1uTnVtYmVyKVwiXG4gICAgLy8gSW4gSUUxMCBmdW5jdGlvbiBuYW1lIGNhbiBoYXZlIHNwYWNlcyAoXCJBbm9ueW1vdXMgZnVuY3Rpb25cIikgT19vXG4gICAgdmFyIGF0dGVtcHQxID0gL2F0IC4rIFxcKCguKyk6KFxcZCspOig/OlxcZCspXFwpJC8uZXhlYyhzdGFja0xpbmUpO1xuICAgIGlmIChhdHRlbXB0MSkge1xuICAgICAgICByZXR1cm4gW2F0dGVtcHQxWzFdLCBOdW1iZXIoYXR0ZW1wdDFbMl0pXTtcbiAgICB9XG5cbiAgICAvLyBBbm9ueW1vdXMgZnVuY3Rpb25zOiBcImF0IGZpbGVuYW1lOmxpbmVOdW1iZXI6Y29sdW1uTnVtYmVyXCJcbiAgICB2YXIgYXR0ZW1wdDIgPSAvYXQgKFteIF0rKTooXFxkKyk6KD86XFxkKykkLy5leGVjKHN0YWNrTGluZSk7XG4gICAgaWYgKGF0dGVtcHQyKSB7XG4gICAgICAgIHJldHVybiBbYXR0ZW1wdDJbMV0sIE51bWJlcihhdHRlbXB0MlsyXSldO1xuICAgIH1cblxuICAgIC8vIEZpcmVmb3ggc3R5bGU6IFwiZnVuY3Rpb25AZmlsZW5hbWU6bGluZU51bWJlciBvciBAZmlsZW5hbWU6bGluZU51bWJlclwiXG4gICAgdmFyIGF0dGVtcHQzID0gLy4qQCguKyk6KFxcZCspJC8uZXhlYyhzdGFja0xpbmUpO1xuICAgIGlmIChhdHRlbXB0Mykge1xuICAgICAgICByZXR1cm4gW2F0dGVtcHQzWzFdLCBOdW1iZXIoYXR0ZW1wdDNbMl0pXTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzSW50ZXJuYWxGcmFtZShzdGFja0xpbmUpIHtcbiAgICB2YXIgZmlsZU5hbWVBbmRMaW5lTnVtYmVyID0gZ2V0RmlsZU5hbWVBbmRMaW5lTnVtYmVyKHN0YWNrTGluZSk7XG5cbiAgICBpZiAoIWZpbGVOYW1lQW5kTGluZU51bWJlcikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIGZpbGVOYW1lID0gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzBdO1xuICAgIHZhciBsaW5lTnVtYmVyID0gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzFdO1xuXG4gICAgcmV0dXJuIGZpbGVOYW1lID09PSBxRmlsZU5hbWUgJiZcbiAgICAgICAgbGluZU51bWJlciA+PSBxU3RhcnRpbmdMaW5lICYmXG4gICAgICAgIGxpbmVOdW1iZXIgPD0gcUVuZGluZ0xpbmU7XG59XG5cbi8vIGRpc2NvdmVyIG93biBmaWxlIG5hbWUgYW5kIGxpbmUgbnVtYmVyIHJhbmdlIGZvciBmaWx0ZXJpbmcgc3RhY2tcbi8vIHRyYWNlc1xuZnVuY3Rpb24gY2FwdHVyZUxpbmUoKSB7XG4gICAgaWYgKCFoYXNTdGFja3MpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcigpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdmFyIGxpbmVzID0gZS5zdGFjay5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgdmFyIGZpcnN0TGluZSA9IGxpbmVzWzBdLmluZGV4T2YoXCJAXCIpID4gMCA/IGxpbmVzWzFdIDogbGluZXNbMl07XG4gICAgICAgIHZhciBmaWxlTmFtZUFuZExpbmVOdW1iZXIgPSBnZXRGaWxlTmFtZUFuZExpbmVOdW1iZXIoZmlyc3RMaW5lKTtcbiAgICAgICAgaWYgKCFmaWxlTmFtZUFuZExpbmVOdW1iZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHFGaWxlTmFtZSA9IGZpbGVOYW1lQW5kTGluZU51bWJlclswXTtcbiAgICAgICAgcmV0dXJuIGZpbGVOYW1lQW5kTGluZU51bWJlclsxXTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRlcHJlY2F0ZShjYWxsYmFjaywgbmFtZSwgYWx0ZXJuYXRpdmUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgICAgIHR5cGVvZiBjb25zb2xlLndhcm4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKG5hbWUgKyBcIiBpcyBkZXByZWNhdGVkLCB1c2UgXCIgKyBhbHRlcm5hdGl2ZSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgXCIgaW5zdGVhZC5cIiwgbmV3IEVycm9yKFwiXCIpLnN0YWNrKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkoY2FsbGJhY2ssIGFyZ3VtZW50cyk7XG4gICAgfTtcbn1cblxuLy8gZW5kIG9mIHNoaW1zXG4vLyBiZWdpbm5pbmcgb2YgcmVhbCB3b3JrXG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHByb21pc2UgZm9yIGFuIGltbWVkaWF0ZSByZWZlcmVuY2UsIHBhc3NlcyBwcm9taXNlcyB0aHJvdWdoLCBvclxuICogY29lcmNlcyBwcm9taXNlcyBmcm9tIGRpZmZlcmVudCBzeXN0ZW1zLlxuICogQHBhcmFtIHZhbHVlIGltbWVkaWF0ZSByZWZlcmVuY2Ugb3IgcHJvbWlzZVxuICovXG5mdW5jdGlvbiBRKHZhbHVlKSB7XG4gICAgLy8gSWYgdGhlIG9iamVjdCBpcyBhbHJlYWR5IGEgUHJvbWlzZSwgcmV0dXJuIGl0IGRpcmVjdGx5LiAgVGhpcyBlbmFibGVzXG4gICAgLy8gdGhlIHJlc29sdmUgZnVuY3Rpb24gdG8gYm90aCBiZSB1c2VkIHRvIGNyZWF0ZWQgcmVmZXJlbmNlcyBmcm9tIG9iamVjdHMsXG4gICAgLy8gYnV0IHRvIHRvbGVyYWJseSBjb2VyY2Ugbm9uLXByb21pc2VzIHRvIHByb21pc2VzLlxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIC8vIGFzc2ltaWxhdGUgdGhlbmFibGVzXG4gICAgaWYgKGlzUHJvbWlzZUFsaWtlKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gY29lcmNlKHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZnVsZmlsbCh2YWx1ZSk7XG4gICAgfVxufVxuUS5yZXNvbHZlID0gUTtcblxuLyoqXG4gKiBQZXJmb3JtcyBhIHRhc2sgaW4gYSBmdXR1cmUgdHVybiBvZiB0aGUgZXZlbnQgbG9vcC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHRhc2tcbiAqL1xuUS5uZXh0VGljayA9IG5leHRUaWNrO1xuXG4vKipcbiAqIENvbnRyb2xzIHdoZXRoZXIgb3Igbm90IGxvbmcgc3RhY2sgdHJhY2VzIHdpbGwgYmUgb25cbiAqL1xuUS5sb25nU3RhY2tTdXBwb3J0ID0gZmFsc2U7XG5cbi8vIGVuYWJsZSBsb25nIHN0YWNrcyBpZiBRX0RFQlVHIGlzIHNldFxuaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHByb2Nlc3MgJiYgcHJvY2Vzcy5lbnYgJiYgcHJvY2Vzcy5lbnYuUV9ERUJVRykge1xuICAgIFEubG9uZ1N0YWNrU3VwcG9ydCA9IHRydWU7XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHtwcm9taXNlLCByZXNvbHZlLCByZWplY3R9IG9iamVjdC5cbiAqXG4gKiBgcmVzb2x2ZWAgaXMgYSBjYWxsYmFjayB0byBpbnZva2Ugd2l0aCBhIG1vcmUgcmVzb2x2ZWQgdmFsdWUgZm9yIHRoZVxuICogcHJvbWlzZS4gVG8gZnVsZmlsbCB0aGUgcHJvbWlzZSwgaW52b2tlIGByZXNvbHZlYCB3aXRoIGFueSB2YWx1ZSB0aGF0IGlzXG4gKiBub3QgYSB0aGVuYWJsZS4gVG8gcmVqZWN0IHRoZSBwcm9taXNlLCBpbnZva2UgYHJlc29sdmVgIHdpdGggYSByZWplY3RlZFxuICogdGhlbmFibGUsIG9yIGludm9rZSBgcmVqZWN0YCB3aXRoIHRoZSByZWFzb24gZGlyZWN0bHkuIFRvIHJlc29sdmUgdGhlXG4gKiBwcm9taXNlIHRvIGFub3RoZXIgdGhlbmFibGUsIHRodXMgcHV0dGluZyBpdCBpbiB0aGUgc2FtZSBzdGF0ZSwgaW52b2tlXG4gKiBgcmVzb2x2ZWAgd2l0aCB0aGF0IG90aGVyIHRoZW5hYmxlLlxuICovXG5RLmRlZmVyID0gZGVmZXI7XG5mdW5jdGlvbiBkZWZlcigpIHtcbiAgICAvLyBpZiBcIm1lc3NhZ2VzXCIgaXMgYW4gXCJBcnJheVwiLCB0aGF0IGluZGljYXRlcyB0aGF0IHRoZSBwcm9taXNlIGhhcyBub3QgeWV0XG4gICAgLy8gYmVlbiByZXNvbHZlZC4gIElmIGl0IGlzIFwidW5kZWZpbmVkXCIsIGl0IGhhcyBiZWVuIHJlc29sdmVkLiAgRWFjaFxuICAgIC8vIGVsZW1lbnQgb2YgdGhlIG1lc3NhZ2VzIGFycmF5IGlzIGl0c2VsZiBhbiBhcnJheSBvZiBjb21wbGV0ZSBhcmd1bWVudHMgdG9cbiAgICAvLyBmb3J3YXJkIHRvIHRoZSByZXNvbHZlZCBwcm9taXNlLiAgV2UgY29lcmNlIHRoZSByZXNvbHV0aW9uIHZhbHVlIHRvIGFcbiAgICAvLyBwcm9taXNlIHVzaW5nIHRoZSBgcmVzb2x2ZWAgZnVuY3Rpb24gYmVjYXVzZSBpdCBoYW5kbGVzIGJvdGggZnVsbHlcbiAgICAvLyBub24tdGhlbmFibGUgdmFsdWVzIGFuZCBvdGhlciB0aGVuYWJsZXMgZ3JhY2VmdWxseS5cbiAgICB2YXIgbWVzc2FnZXMgPSBbXSwgcHJvZ3Jlc3NMaXN0ZW5lcnMgPSBbXSwgcmVzb2x2ZWRQcm9taXNlO1xuXG4gICAgdmFyIGRlZmVycmVkID0gb2JqZWN0X2NyZWF0ZShkZWZlci5wcm90b3R5cGUpO1xuICAgIHZhciBwcm9taXNlID0gb2JqZWN0X2NyZWF0ZShQcm9taXNlLnByb3RvdHlwZSk7XG5cbiAgICBwcm9taXNlLnByb21pc2VEaXNwYXRjaCA9IGZ1bmN0aW9uIChyZXNvbHZlLCBvcCwgb3BlcmFuZHMpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgICAgICBpZiAobWVzc2FnZXMpIHtcbiAgICAgICAgICAgIG1lc3NhZ2VzLnB1c2goYXJncyk7XG4gICAgICAgICAgICBpZiAob3AgPT09IFwid2hlblwiICYmIG9wZXJhbmRzWzFdKSB7IC8vIHByb2dyZXNzIG9wZXJhbmRcbiAgICAgICAgICAgICAgICBwcm9ncmVzc0xpc3RlbmVycy5wdXNoKG9wZXJhbmRzWzFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmVkUHJvbWlzZS5wcm9taXNlRGlzcGF0Y2guYXBwbHkocmVzb2x2ZWRQcm9taXNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIFhYWCBkZXByZWNhdGVkXG4gICAgcHJvbWlzZS52YWx1ZU9mID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAobWVzc2FnZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBuZWFyZXJWYWx1ZSA9IG5lYXJlcihyZXNvbHZlZFByb21pc2UpO1xuICAgICAgICBpZiAoaXNQcm9taXNlKG5lYXJlclZhbHVlKSkge1xuICAgICAgICAgICAgcmVzb2x2ZWRQcm9taXNlID0gbmVhcmVyVmFsdWU7IC8vIHNob3J0ZW4gY2hhaW5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmVhcmVyVmFsdWU7XG4gICAgfTtcblxuICAgIHByb21pc2UuaW5zcGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN0YXRlOiBcInBlbmRpbmdcIiB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXNvbHZlZFByb21pc2UuaW5zcGVjdCgpO1xuICAgIH07XG5cbiAgICBpZiAoUS5sb25nU3RhY2tTdXBwb3J0ICYmIGhhc1N0YWNrcykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIE5PVEU6IGRvbid0IHRyeSB0byB1c2UgYEVycm9yLmNhcHR1cmVTdGFja1RyYWNlYCBvciB0cmFuc2ZlciB0aGVcbiAgICAgICAgICAgIC8vIGFjY2Vzc29yIGFyb3VuZDsgdGhhdCBjYXVzZXMgbWVtb3J5IGxlYWtzIGFzIHBlciBHSC0xMTEuIEp1c3RcbiAgICAgICAgICAgIC8vIHJlaWZ5IHRoZSBzdGFjayB0cmFjZSBhcyBhIHN0cmluZyBBU0FQLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEF0IHRoZSBzYW1lIHRpbWUsIGN1dCBvZmYgdGhlIGZpcnN0IGxpbmU7IGl0J3MgYWx3YXlzIGp1c3RcbiAgICAgICAgICAgIC8vIFwiW29iamVjdCBQcm9taXNlXVxcblwiLCBhcyBwZXIgdGhlIGB0b1N0cmluZ2AuXG4gICAgICAgICAgICBwcm9taXNlLnN0YWNrID0gZS5zdGFjay5zdWJzdHJpbmcoZS5zdGFjay5pbmRleE9mKFwiXFxuXCIpICsgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBOT1RFOiB3ZSBkbyB0aGUgY2hlY2tzIGZvciBgcmVzb2x2ZWRQcm9taXNlYCBpbiBlYWNoIG1ldGhvZCwgaW5zdGVhZCBvZlxuICAgIC8vIGNvbnNvbGlkYXRpbmcgdGhlbSBpbnRvIGBiZWNvbWVgLCBzaW5jZSBvdGhlcndpc2Ugd2UnZCBjcmVhdGUgbmV3XG4gICAgLy8gcHJvbWlzZXMgd2l0aCB0aGUgbGluZXMgYGJlY29tZSh3aGF0ZXZlcih2YWx1ZSkpYC4gU2VlIGUuZy4gR0gtMjUyLlxuXG4gICAgZnVuY3Rpb24gYmVjb21lKG5ld1Byb21pc2UpIHtcbiAgICAgICAgcmVzb2x2ZWRQcm9taXNlID0gbmV3UHJvbWlzZTtcbiAgICAgICAgcHJvbWlzZS5zb3VyY2UgPSBuZXdQcm9taXNlO1xuXG4gICAgICAgIGFycmF5X3JlZHVjZShtZXNzYWdlcywgZnVuY3Rpb24gKHVuZGVmaW5lZCwgbWVzc2FnZSkge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbmV3UHJvbWlzZS5wcm9taXNlRGlzcGF0Y2guYXBwbHkobmV3UHJvbWlzZSwgbWVzc2FnZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgdm9pZCAwKTtcblxuICAgICAgICBtZXNzYWdlcyA9IHZvaWQgMDtcbiAgICAgICAgcHJvZ3Jlc3NMaXN0ZW5lcnMgPSB2b2lkIDA7XG4gICAgfVxuXG4gICAgZGVmZXJyZWQucHJvbWlzZSA9IHByb21pc2U7XG4gICAgZGVmZXJyZWQucmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBiZWNvbWUoUSh2YWx1ZSkpO1xuICAgIH07XG5cbiAgICBkZWZlcnJlZC5mdWxmaWxsID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlY29tZShmdWxmaWxsKHZhbHVlKSk7XG4gICAgfTtcbiAgICBkZWZlcnJlZC5yZWplY3QgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlY29tZShyZWplY3QocmVhc29uKSk7XG4gICAgfTtcbiAgICBkZWZlcnJlZC5ub3RpZnkgPSBmdW5jdGlvbiAocHJvZ3Jlc3MpIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJyYXlfcmVkdWNlKHByb2dyZXNzTGlzdGVuZXJzLCBmdW5jdGlvbiAodW5kZWZpbmVkLCBwcm9ncmVzc0xpc3RlbmVyKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwcm9ncmVzc0xpc3RlbmVyKHByb2dyZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCB2b2lkIDApO1xuICAgIH07XG5cbiAgICByZXR1cm4gZGVmZXJyZWQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIE5vZGUtc3R5bGUgY2FsbGJhY2sgdGhhdCB3aWxsIHJlc29sdmUgb3IgcmVqZWN0IHRoZSBkZWZlcnJlZFxuICogcHJvbWlzZS5cbiAqIEByZXR1cm5zIGEgbm9kZWJhY2tcbiAqL1xuZGVmZXIucHJvdG90eXBlLm1ha2VOb2RlUmVzb2x2ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXJyb3IsIHZhbHVlKSB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgc2VsZi5yZWplY3QoZXJyb3IpO1xuICAgICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICBzZWxmLnJlc29sdmUoYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLnJlc29sdmUodmFsdWUpO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHJlc29sdmVyIHtGdW5jdGlvbn0gYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgbm90aGluZyBhbmQgYWNjZXB0c1xuICogdGhlIHJlc29sdmUsIHJlamVjdCwgYW5kIG5vdGlmeSBmdW5jdGlvbnMgZm9yIGEgZGVmZXJyZWQuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCBtYXkgYmUgcmVzb2x2ZWQgd2l0aCB0aGUgZ2l2ZW4gcmVzb2x2ZSBhbmQgcmVqZWN0XG4gKiBmdW5jdGlvbnMsIG9yIHJlamVjdGVkIGJ5IGEgdGhyb3duIGV4Y2VwdGlvbiBpbiByZXNvbHZlclxuICovXG5RLlByb21pc2UgPSBwcm9taXNlOyAvLyBFUzZcblEucHJvbWlzZSA9IHByb21pc2U7XG5mdW5jdGlvbiBwcm9taXNlKHJlc29sdmVyKSB7XG4gICAgaWYgKHR5cGVvZiByZXNvbHZlciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJyZXNvbHZlciBtdXN0IGJlIGEgZnVuY3Rpb24uXCIpO1xuICAgIH1cbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHRyeSB7XG4gICAgICAgIHJlc29sdmVyKGRlZmVycmVkLnJlc29sdmUsIGRlZmVycmVkLnJlamVjdCwgZGVmZXJyZWQubm90aWZ5KTtcbiAgICB9IGNhdGNoIChyZWFzb24pIHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlYXNvbik7XG4gICAgfVxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG5wcm9taXNlLnJhY2UgPSByYWNlOyAvLyBFUzZcbnByb21pc2UuYWxsID0gYWxsOyAvLyBFUzZcbnByb21pc2UucmVqZWN0ID0gcmVqZWN0OyAvLyBFUzZcbnByb21pc2UucmVzb2x2ZSA9IFE7IC8vIEVTNlxuXG4vLyBYWFggZXhwZXJpbWVudGFsLiAgVGhpcyBtZXRob2QgaXMgYSB3YXkgdG8gZGVub3RlIHRoYXQgYSBsb2NhbCB2YWx1ZSBpc1xuLy8gc2VyaWFsaXphYmxlIGFuZCBzaG91bGQgYmUgaW1tZWRpYXRlbHkgZGlzcGF0Y2hlZCB0byBhIHJlbW90ZSB1cG9uIHJlcXVlc3QsXG4vLyBpbnN0ZWFkIG9mIHBhc3NpbmcgYSByZWZlcmVuY2UuXG5RLnBhc3NCeUNvcHkgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgLy9mcmVlemUob2JqZWN0KTtcbiAgICAvL3Bhc3NCeUNvcGllcy5zZXQob2JqZWN0LCB0cnVlKTtcbiAgICByZXR1cm4gb2JqZWN0O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUucGFzc0J5Q29weSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvL2ZyZWV6ZShvYmplY3QpO1xuICAgIC8vcGFzc0J5Q29waWVzLnNldChvYmplY3QsIHRydWUpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBJZiB0d28gcHJvbWlzZXMgZXZlbnR1YWxseSBmdWxmaWxsIHRvIHRoZSBzYW1lIHZhbHVlLCBwcm9taXNlcyB0aGF0IHZhbHVlLFxuICogYnV0IG90aGVyd2lzZSByZWplY3RzLlxuICogQHBhcmFtIHgge0FueSp9XG4gKiBAcGFyYW0geSB7QW55Kn1cbiAqIEByZXR1cm5zIHtBbnkqfSBhIHByb21pc2UgZm9yIHggYW5kIHkgaWYgdGhleSBhcmUgdGhlIHNhbWUsIGJ1dCBhIHJlamVjdGlvblxuICogb3RoZXJ3aXNlLlxuICpcbiAqL1xuUS5qb2luID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICByZXR1cm4gUSh4KS5qb2luKHkpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuam9pbiA9IGZ1bmN0aW9uICh0aGF0KSB7XG4gICAgcmV0dXJuIFEoW3RoaXMsIHRoYXRdKS5zcHJlYWQoZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgaWYgKHggPT09IHkpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IFwiPT09XCIgc2hvdWxkIGJlIE9iamVjdC5pcyBvciBlcXVpdlxuICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBqb2luOiBub3QgdGhlIHNhbWU6IFwiICsgeCArIFwiIFwiICsgeSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbi8qKlxuICogUmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSBmaXJzdCBvZiBhbiBhcnJheSBvZiBwcm9taXNlcyB0byBiZWNvbWUgc2V0dGxlZC5cbiAqIEBwYXJhbSBhbnN3ZXJzIHtBcnJheVtBbnkqXX0gcHJvbWlzZXMgdG8gcmFjZVxuICogQHJldHVybnMge0FueSp9IHRoZSBmaXJzdCBwcm9taXNlIHRvIGJlIHNldHRsZWRcbiAqL1xuUS5yYWNlID0gcmFjZTtcbmZ1bmN0aW9uIHJhY2UoYW5zd2VyUHMpIHtcbiAgICByZXR1cm4gcHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIC8vIFN3aXRjaCB0byB0aGlzIG9uY2Ugd2UgY2FuIGFzc3VtZSBhdCBsZWFzdCBFUzVcbiAgICAgICAgLy8gYW5zd2VyUHMuZm9yRWFjaChmdW5jdGlvbiAoYW5zd2VyUCkge1xuICAgICAgICAvLyAgICAgUShhbnN3ZXJQKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIC8vIH0pO1xuICAgICAgICAvLyBVc2UgdGhpcyBpbiB0aGUgbWVhbnRpbWVcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFuc3dlclBzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBRKGFuc3dlclBzW2ldKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUucmFjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKFEucmFjZSk7XG59O1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBQcm9taXNlIHdpdGggYSBwcm9taXNlIGRlc2NyaXB0b3Igb2JqZWN0IGFuZCBvcHRpb25hbCBmYWxsYmFja1xuICogZnVuY3Rpb24uICBUaGUgZGVzY3JpcHRvciBjb250YWlucyBtZXRob2RzIGxpa2Ugd2hlbihyZWplY3RlZCksIGdldChuYW1lKSxcbiAqIHNldChuYW1lLCB2YWx1ZSksIHBvc3QobmFtZSwgYXJncyksIGFuZCBkZWxldGUobmFtZSksIHdoaWNoIGFsbFxuICogcmV0dXJuIGVpdGhlciBhIHZhbHVlLCBhIHByb21pc2UgZm9yIGEgdmFsdWUsIG9yIGEgcmVqZWN0aW9uLiAgVGhlIGZhbGxiYWNrXG4gKiBhY2NlcHRzIHRoZSBvcGVyYXRpb24gbmFtZSwgYSByZXNvbHZlciwgYW5kIGFueSBmdXJ0aGVyIGFyZ3VtZW50cyB0aGF0IHdvdWxkXG4gKiBoYXZlIGJlZW4gZm9yd2FyZGVkIHRvIHRoZSBhcHByb3ByaWF0ZSBtZXRob2QgYWJvdmUgaGFkIGEgbWV0aG9kIGJlZW5cbiAqIHByb3ZpZGVkIHdpdGggdGhlIHByb3BlciBuYW1lLiAgVGhlIEFQSSBtYWtlcyBubyBndWFyYW50ZWVzIGFib3V0IHRoZSBuYXR1cmVcbiAqIG9mIHRoZSByZXR1cm5lZCBvYmplY3QsIGFwYXJ0IGZyb20gdGhhdCBpdCBpcyB1c2FibGUgd2hlcmVldmVyIHByb21pc2VzIGFyZVxuICogYm91Z2h0IGFuZCBzb2xkLlxuICovXG5RLm1ha2VQcm9taXNlID0gUHJvbWlzZTtcbmZ1bmN0aW9uIFByb21pc2UoZGVzY3JpcHRvciwgZmFsbGJhY2ssIGluc3BlY3QpIHtcbiAgICBpZiAoZmFsbGJhY2sgPT09IHZvaWQgMCkge1xuICAgICAgICBmYWxsYmFjayA9IGZ1bmN0aW9uIChvcCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgXCJQcm9taXNlIGRvZXMgbm90IHN1cHBvcnQgb3BlcmF0aW9uOiBcIiArIG9wXG4gICAgICAgICAgICApKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaWYgKGluc3BlY3QgPT09IHZvaWQgMCkge1xuICAgICAgICBpbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtzdGF0ZTogXCJ1bmtub3duXCJ9O1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBwcm9taXNlID0gb2JqZWN0X2NyZWF0ZShQcm9taXNlLnByb3RvdHlwZSk7XG5cbiAgICBwcm9taXNlLnByb21pc2VEaXNwYXRjaCA9IGZ1bmN0aW9uIChyZXNvbHZlLCBvcCwgYXJncykge1xuICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKGRlc2NyaXB0b3Jbb3BdKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZGVzY3JpcHRvcltvcF0uYXBwbHkocHJvbWlzZSwgYXJncyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGZhbGxiYWNrLmNhbGwocHJvbWlzZSwgb3AsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXNvbHZlKSB7XG4gICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcHJvbWlzZS5pbnNwZWN0ID0gaW5zcGVjdDtcblxuICAgIC8vIFhYWCBkZXByZWNhdGVkIGB2YWx1ZU9mYCBhbmQgYGV4Y2VwdGlvbmAgc3VwcG9ydFxuICAgIGlmIChpbnNwZWN0KSB7XG4gICAgICAgIHZhciBpbnNwZWN0ZWQgPSBpbnNwZWN0KCk7XG4gICAgICAgIGlmIChpbnNwZWN0ZWQuc3RhdGUgPT09IFwicmVqZWN0ZWRcIikge1xuICAgICAgICAgICAgcHJvbWlzZS5leGNlcHRpb24gPSBpbnNwZWN0ZWQucmVhc29uO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvbWlzZS52YWx1ZU9mID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGluc3BlY3RlZCA9IGluc3BlY3QoKTtcbiAgICAgICAgICAgIGlmIChpbnNwZWN0ZWQuc3RhdGUgPT09IFwicGVuZGluZ1wiIHx8XG4gICAgICAgICAgICAgICAgaW5zcGVjdGVkLnN0YXRlID09PSBcInJlamVjdGVkXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpbnNwZWN0ZWQudmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb21pc2U7XG59XG5cblByb21pc2UucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBcIltvYmplY3QgUHJvbWlzZV1cIjtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnRoZW4gPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3NlZCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHZhciBkb25lID0gZmFsc2U7ICAgLy8gZW5zdXJlIHRoZSB1bnRydXN0ZWQgcHJvbWlzZSBtYWtlcyBhdCBtb3N0IGFcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNpbmdsZSBjYWxsIHRvIG9uZSBvZiB0aGUgY2FsbGJhY2tzXG5cbiAgICBmdW5jdGlvbiBfZnVsZmlsbGVkKHZhbHVlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIGZ1bGZpbGxlZCA9PT0gXCJmdW5jdGlvblwiID8gZnVsZmlsbGVkKHZhbHVlKSA6IHZhbHVlO1xuICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9yZWplY3RlZChleGNlcHRpb24pIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZWplY3RlZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBtYWtlU3RhY2tUcmFjZUxvbmcoZXhjZXB0aW9uLCBzZWxmKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdGVkKGV4Y2VwdGlvbik7XG4gICAgICAgICAgICB9IGNhdGNoIChuZXdFeGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ld0V4Y2VwdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9wcm9ncmVzc2VkKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgcHJvZ3Jlc3NlZCA9PT0gXCJmdW5jdGlvblwiID8gcHJvZ3Jlc3NlZCh2YWx1ZSkgOiB2YWx1ZTtcbiAgICB9XG5cbiAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5wcm9taXNlRGlzcGF0Y2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoZG9uZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuXG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKF9mdWxmaWxsZWQodmFsdWUpKTtcbiAgICAgICAgfSwgXCJ3aGVuXCIsIFtmdW5jdGlvbiAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICBpZiAoZG9uZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuXG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKF9yZWplY3RlZChleGNlcHRpb24pKTtcbiAgICAgICAgfV0pO1xuICAgIH0pO1xuXG4gICAgLy8gUHJvZ3Jlc3MgcHJvcGFnYXRvciBuZWVkIHRvIGJlIGF0dGFjaGVkIGluIHRoZSBjdXJyZW50IHRpY2suXG4gICAgc2VsZi5wcm9taXNlRGlzcGF0Y2godm9pZCAwLCBcIndoZW5cIiwgW3ZvaWQgMCwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBuZXdWYWx1ZTtcbiAgICAgICAgdmFyIHRocmV3ID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBuZXdWYWx1ZSA9IF9wcm9ncmVzc2VkKHZhbHVlKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhyZXcgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKFEub25lcnJvcikge1xuICAgICAgICAgICAgICAgIFEub25lcnJvcihlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhyZXcpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLm5vdGlmeShuZXdWYWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cblEudGFwID0gZnVuY3Rpb24gKHByb21pc2UsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIFEocHJvbWlzZSkudGFwKGNhbGxiYWNrKTtcbn07XG5cbi8qKlxuICogV29ya3MgYWxtb3N0IGxpa2UgXCJmaW5hbGx5XCIsIGJ1dCBub3QgY2FsbGVkIGZvciByZWplY3Rpb25zLlxuICogT3JpZ2luYWwgcmVzb2x1dGlvbiB2YWx1ZSBpcyBwYXNzZWQgdGhyb3VnaCBjYWxsYmFjayB1bmFmZmVjdGVkLlxuICogQ2FsbGJhY2sgbWF5IHJldHVybiBhIHByb21pc2UgdGhhdCB3aWxsIGJlIGF3YWl0ZWQgZm9yLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm5zIHtRLlByb21pc2V9XG4gKiBAZXhhbXBsZVxuICogZG9Tb21ldGhpbmcoKVxuICogICAudGhlbiguLi4pXG4gKiAgIC50YXAoY29uc29sZS5sb2cpXG4gKiAgIC50aGVuKC4uLik7XG4gKi9cblByb21pc2UucHJvdG90eXBlLnRhcCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIGNhbGxiYWNrID0gUShjYWxsYmFjayk7XG5cbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2suZmNhbGwodmFsdWUpLnRoZW5SZXNvbHZlKHZhbHVlKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXJzIGFuIG9ic2VydmVyIG9uIGEgcHJvbWlzZS5cbiAqXG4gKiBHdWFyYW50ZWVzOlxuICpcbiAqIDEuIHRoYXQgZnVsZmlsbGVkIGFuZCByZWplY3RlZCB3aWxsIGJlIGNhbGxlZCBvbmx5IG9uY2UuXG4gKiAyLiB0aGF0IGVpdGhlciB0aGUgZnVsZmlsbGVkIGNhbGxiYWNrIG9yIHRoZSByZWplY3RlZCBjYWxsYmFjayB3aWxsIGJlXG4gKiAgICBjYWxsZWQsIGJ1dCBub3QgYm90aC5cbiAqIDMuIHRoYXQgZnVsZmlsbGVkIGFuZCByZWplY3RlZCB3aWxsIG5vdCBiZSBjYWxsZWQgaW4gdGhpcyB0dXJuLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSAgICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSB0byBvYnNlcnZlXG4gKiBAcGFyYW0gZnVsZmlsbGVkICBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2l0aCB0aGUgZnVsZmlsbGVkIHZhbHVlXG4gKiBAcGFyYW0gcmVqZWN0ZWQgICBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2l0aCB0aGUgcmVqZWN0aW9uIGV4Y2VwdGlvblxuICogQHBhcmFtIHByb2dyZXNzZWQgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIGFueSBwcm9ncmVzcyBub3RpZmljYXRpb25zXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWUgZnJvbSB0aGUgaW52b2tlZCBjYWxsYmFja1xuICovXG5RLndoZW4gPSB3aGVuO1xuZnVuY3Rpb24gd2hlbih2YWx1ZSwgZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3NlZCkge1xuICAgIHJldHVybiBRKHZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzZWQpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS50aGVuUmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gdmFsdWU7IH0pO1xufTtcblxuUS50aGVuUmVzb2x2ZSA9IGZ1bmN0aW9uIChwcm9taXNlLCB2YWx1ZSkge1xuICAgIHJldHVybiBRKHByb21pc2UpLnRoZW5SZXNvbHZlKHZhbHVlKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnRoZW5SZWplY3QgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAoKSB7IHRocm93IHJlYXNvbjsgfSk7XG59O1xuXG5RLnRoZW5SZWplY3QgPSBmdW5jdGlvbiAocHJvbWlzZSwgcmVhc29uKSB7XG4gICAgcmV0dXJuIFEocHJvbWlzZSkudGhlblJlamVjdChyZWFzb24pO1xufTtcblxuLyoqXG4gKiBJZiBhbiBvYmplY3QgaXMgbm90IGEgcHJvbWlzZSwgaXQgaXMgYXMgXCJuZWFyXCIgYXMgcG9zc2libGUuXG4gKiBJZiBhIHByb21pc2UgaXMgcmVqZWN0ZWQsIGl0IGlzIGFzIFwibmVhclwiIGFzIHBvc3NpYmxlIHRvby5cbiAqIElmIGl04oCZcyBhIGZ1bGZpbGxlZCBwcm9taXNlLCB0aGUgZnVsZmlsbG1lbnQgdmFsdWUgaXMgbmVhcmVyLlxuICogSWYgaXTigJlzIGEgZGVmZXJyZWQgcHJvbWlzZSBhbmQgdGhlIGRlZmVycmVkIGhhcyBiZWVuIHJlc29sdmVkLCB0aGVcbiAqIHJlc29sdXRpb24gaXMgXCJuZWFyZXJcIi5cbiAqIEBwYXJhbSBvYmplY3RcbiAqIEByZXR1cm5zIG1vc3QgcmVzb2x2ZWQgKG5lYXJlc3QpIGZvcm0gb2YgdGhlIG9iamVjdFxuICovXG5cbi8vIFhYWCBzaG91bGQgd2UgcmUtZG8gdGhpcz9cblEubmVhcmVyID0gbmVhcmVyO1xuZnVuY3Rpb24gbmVhcmVyKHZhbHVlKSB7XG4gICAgaWYgKGlzUHJvbWlzZSh2YWx1ZSkpIHtcbiAgICAgICAgdmFyIGluc3BlY3RlZCA9IHZhbHVlLmluc3BlY3QoKTtcbiAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIikge1xuICAgICAgICAgICAgcmV0dXJuIGluc3BlY3RlZC52YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcHJvbWlzZS5cbiAqIE90aGVyd2lzZSBpdCBpcyBhIGZ1bGZpbGxlZCB2YWx1ZS5cbiAqL1xuUS5pc1Byb21pc2UgPSBpc1Byb21pc2U7XG5mdW5jdGlvbiBpc1Byb21pc2Uob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdCBpbnN0YW5jZW9mIFByb21pc2U7XG59XG5cblEuaXNQcm9taXNlQWxpa2UgPSBpc1Byb21pc2VBbGlrZTtcbmZ1bmN0aW9uIGlzUHJvbWlzZUFsaWtlKG9iamVjdCkge1xuICAgIHJldHVybiBpc09iamVjdChvYmplY3QpICYmIHR5cGVvZiBvYmplY3QudGhlbiA9PT0gXCJmdW5jdGlvblwiO1xufVxuXG4vKipcbiAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIHBlbmRpbmcgcHJvbWlzZSwgbWVhbmluZyBub3RcbiAqIGZ1bGZpbGxlZCBvciByZWplY3RlZC5cbiAqL1xuUS5pc1BlbmRpbmcgPSBpc1BlbmRpbmc7XG5mdW5jdGlvbiBpc1BlbmRpbmcob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzUHJvbWlzZShvYmplY3QpICYmIG9iamVjdC5pbnNwZWN0KCkuc3RhdGUgPT09IFwicGVuZGluZ1wiO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5pc1BlbmRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zcGVjdCgpLnN0YXRlID09PSBcInBlbmRpbmdcIjtcbn07XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgdmFsdWUgb3IgZnVsZmlsbGVkXG4gKiBwcm9taXNlLlxuICovXG5RLmlzRnVsZmlsbGVkID0gaXNGdWxmaWxsZWQ7XG5mdW5jdGlvbiBpc0Z1bGZpbGxlZChvYmplY3QpIHtcbiAgICByZXR1cm4gIWlzUHJvbWlzZShvYmplY3QpIHx8IG9iamVjdC5pbnNwZWN0KCkuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCI7XG59XG5cblByb21pc2UucHJvdG90eXBlLmlzRnVsZmlsbGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIjtcbn07XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcmVqZWN0ZWQgcHJvbWlzZS5cbiAqL1xuUS5pc1JlamVjdGVkID0gaXNSZWplY3RlZDtcbmZ1bmN0aW9uIGlzUmVqZWN0ZWQob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzUHJvbWlzZShvYmplY3QpICYmIG9iamVjdC5pbnNwZWN0KCkuc3RhdGUgPT09IFwicmVqZWN0ZWRcIjtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuaXNSZWplY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnNwZWN0KCkuc3RhdGUgPT09IFwicmVqZWN0ZWRcIjtcbn07XG5cbi8vLy8gQkVHSU4gVU5IQU5ETEVEIFJFSkVDVElPTiBUUkFDS0lOR1xuXG4vLyBUaGlzIHByb21pc2UgbGlicmFyeSBjb25zdW1lcyBleGNlcHRpb25zIHRocm93biBpbiBoYW5kbGVycyBzbyB0aGV5IGNhbiBiZVxuLy8gaGFuZGxlZCBieSBhIHN1YnNlcXVlbnQgcHJvbWlzZS4gIFRoZSBleGNlcHRpb25zIGdldCBhZGRlZCB0byB0aGlzIGFycmF5IHdoZW5cbi8vIHRoZXkgYXJlIGNyZWF0ZWQsIGFuZCByZW1vdmVkIHdoZW4gdGhleSBhcmUgaGFuZGxlZC4gIE5vdGUgdGhhdCBpbiBFUzYgb3Jcbi8vIHNoaW1tZWQgZW52aXJvbm1lbnRzLCB0aGlzIHdvdWxkIG5hdHVyYWxseSBiZSBhIGBTZXRgLlxudmFyIHVuaGFuZGxlZFJlYXNvbnMgPSBbXTtcbnZhciB1bmhhbmRsZWRSZWplY3Rpb25zID0gW107XG52YXIgcmVwb3J0ZWRVbmhhbmRsZWRSZWplY3Rpb25zID0gW107XG52YXIgdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zID0gdHJ1ZTtcblxuZnVuY3Rpb24gcmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zKCkge1xuICAgIHVuaGFuZGxlZFJlYXNvbnMubGVuZ3RoID0gMDtcbiAgICB1bmhhbmRsZWRSZWplY3Rpb25zLmxlbmd0aCA9IDA7XG5cbiAgICBpZiAoIXRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucykge1xuICAgICAgICB0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMgPSB0cnVlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdHJhY2tSZWplY3Rpb24ocHJvbWlzZSwgcmVhc29uKSB7XG4gICAgaWYgKCF0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHByb2Nlc3MuZW1pdCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIFEubmV4dFRpY2sucnVuQWZ0ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGFycmF5X2luZGV4T2YodW5oYW5kbGVkUmVqZWN0aW9ucywgcHJvbWlzZSkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5lbWl0KFwidW5oYW5kbGVkUmVqZWN0aW9uXCIsIHJlYXNvbiwgcHJvbWlzZSk7XG4gICAgICAgICAgICAgICAgcmVwb3J0ZWRVbmhhbmRsZWRSZWplY3Rpb25zLnB1c2gocHJvbWlzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHVuaGFuZGxlZFJlamVjdGlvbnMucHVzaChwcm9taXNlKTtcbiAgICBpZiAocmVhc29uICYmIHR5cGVvZiByZWFzb24uc3RhY2sgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgdW5oYW5kbGVkUmVhc29ucy5wdXNoKHJlYXNvbi5zdGFjayk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdW5oYW5kbGVkUmVhc29ucy5wdXNoKFwiKG5vIHN0YWNrKSBcIiArIHJlYXNvbik7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB1bnRyYWNrUmVqZWN0aW9uKHByb21pc2UpIHtcbiAgICBpZiAoIXRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGF0ID0gYXJyYXlfaW5kZXhPZih1bmhhbmRsZWRSZWplY3Rpb25zLCBwcm9taXNlKTtcbiAgICBpZiAoYXQgIT09IC0xKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgcHJvY2Vzcy5lbWl0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2sucnVuQWZ0ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBhdFJlcG9ydCA9IGFycmF5X2luZGV4T2YocmVwb3J0ZWRVbmhhbmRsZWRSZWplY3Rpb25zLCBwcm9taXNlKTtcbiAgICAgICAgICAgICAgICBpZiAoYXRSZXBvcnQgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZW1pdChcInJlamVjdGlvbkhhbmRsZWRcIiwgdW5oYW5kbGVkUmVhc29uc1thdF0sIHByb21pc2UpO1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRlZFVuaGFuZGxlZFJlamVjdGlvbnMuc3BsaWNlKGF0UmVwb3J0LCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB1bmhhbmRsZWRSZWplY3Rpb25zLnNwbGljZShhdCwgMSk7XG4gICAgICAgIHVuaGFuZGxlZFJlYXNvbnMuc3BsaWNlKGF0LCAxKTtcbiAgICB9XG59XG5cblEucmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zID0gcmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zO1xuXG5RLmdldFVuaGFuZGxlZFJlYXNvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gTWFrZSBhIGNvcHkgc28gdGhhdCBjb25zdW1lcnMgY2FuJ3QgaW50ZXJmZXJlIHdpdGggb3VyIGludGVybmFsIHN0YXRlLlxuICAgIHJldHVybiB1bmhhbmRsZWRSZWFzb25zLnNsaWNlKCk7XG59O1xuXG5RLnN0b3BVbmhhbmRsZWRSZWplY3Rpb25UcmFja2luZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKTtcbiAgICB0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMgPSBmYWxzZTtcbn07XG5cbnJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucygpO1xuXG4vLy8vIEVORCBVTkhBTkRMRUQgUkVKRUNUSU9OIFRSQUNLSU5HXG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHJlamVjdGVkIHByb21pc2UuXG4gKiBAcGFyYW0gcmVhc29uIHZhbHVlIGRlc2NyaWJpbmcgdGhlIGZhaWx1cmVcbiAqL1xuUS5yZWplY3QgPSByZWplY3Q7XG5mdW5jdGlvbiByZWplY3QocmVhc29uKSB7XG4gICAgdmFyIHJlamVjdGlvbiA9IFByb21pc2Uoe1xuICAgICAgICBcIndoZW5cIjogZnVuY3Rpb24gKHJlamVjdGVkKSB7XG4gICAgICAgICAgICAvLyBub3RlIHRoYXQgdGhlIGVycm9yIGhhcyBiZWVuIGhhbmRsZWRcbiAgICAgICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgICAgICAgIHVudHJhY2tSZWplY3Rpb24odGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQgPyByZWplY3RlZChyZWFzb24pIDogdGhpcztcbiAgICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uIGZhbGxiYWNrKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LCBmdW5jdGlvbiBpbnNwZWN0KCkge1xuICAgICAgICByZXR1cm4geyBzdGF0ZTogXCJyZWplY3RlZFwiLCByZWFzb246IHJlYXNvbiB9O1xuICAgIH0pO1xuXG4gICAgLy8gTm90ZSB0aGF0IHRoZSByZWFzb24gaGFzIG5vdCBiZWVuIGhhbmRsZWQuXG4gICAgdHJhY2tSZWplY3Rpb24ocmVqZWN0aW9uLCByZWFzb24pO1xuXG4gICAgcmV0dXJuIHJlamVjdGlvbjtcbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgZnVsZmlsbGVkIHByb21pc2UgZm9yIGFuIGltbWVkaWF0ZSByZWZlcmVuY2UuXG4gKiBAcGFyYW0gdmFsdWUgaW1tZWRpYXRlIHJlZmVyZW5jZVxuICovXG5RLmZ1bGZpbGwgPSBmdWxmaWxsO1xuZnVuY3Rpb24gZnVsZmlsbCh2YWx1ZSkge1xuICAgIHJldHVybiBQcm9taXNlKHtcbiAgICAgICAgXCJ3aGVuXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRcIjogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZVtuYW1lXTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXRcIjogZnVuY3Rpb24gKG5hbWUsIHJocykge1xuICAgICAgICAgICAgdmFsdWVbbmFtZV0gPSByaHM7XG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVsZXRlXCI6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICBkZWxldGUgdmFsdWVbbmFtZV07XG4gICAgICAgIH0sXG4gICAgICAgIFwicG9zdFwiOiBmdW5jdGlvbiAobmFtZSwgYXJncykge1xuICAgICAgICAgICAgLy8gTWFyayBNaWxsZXIgcHJvcG9zZXMgdGhhdCBwb3N0IHdpdGggbm8gbmFtZSBzaG91bGQgYXBwbHkgYVxuICAgICAgICAgICAgLy8gcHJvbWlzZWQgZnVuY3Rpb24uXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gbnVsbCB8fCBuYW1lID09PSB2b2lkIDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuYXBwbHkodm9pZCAwLCBhcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlW25hbWVdLmFwcGx5KHZhbHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJhcHBseVwiOiBmdW5jdGlvbiAodGhpc3AsIGFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5hcHBseSh0aGlzcCwgYXJncyk7XG4gICAgICAgIH0sXG4gICAgICAgIFwia2V5c1wiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0X2tleXModmFsdWUpO1xuICAgICAgICB9XG4gICAgfSwgdm9pZCAwLCBmdW5jdGlvbiBpbnNwZWN0KCkge1xuICAgICAgICByZXR1cm4geyBzdGF0ZTogXCJmdWxmaWxsZWRcIiwgdmFsdWU6IHZhbHVlIH07XG4gICAgfSk7XG59XG5cbi8qKlxuICogQ29udmVydHMgdGhlbmFibGVzIHRvIFEgcHJvbWlzZXMuXG4gKiBAcGFyYW0gcHJvbWlzZSB0aGVuYWJsZSBwcm9taXNlXG4gKiBAcmV0dXJucyBhIFEgcHJvbWlzZVxuICovXG5mdW5jdGlvbiBjb2VyY2UocHJvbWlzZSkge1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBwcm9taXNlLnRoZW4oZGVmZXJyZWQucmVzb2x2ZSwgZGVmZXJyZWQucmVqZWN0LCBkZWZlcnJlZC5ub3RpZnkpO1xuICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59XG5cbi8qKlxuICogQW5ub3RhdGVzIGFuIG9iamVjdCBzdWNoIHRoYXQgaXQgd2lsbCBuZXZlciBiZVxuICogdHJhbnNmZXJyZWQgYXdheSBmcm9tIHRoaXMgcHJvY2VzcyBvdmVyIGFueSBwcm9taXNlXG4gKiBjb21tdW5pY2F0aW9uIGNoYW5uZWwuXG4gKiBAcGFyYW0gb2JqZWN0XG4gKiBAcmV0dXJucyBwcm9taXNlIGEgd3JhcHBpbmcgb2YgdGhhdCBvYmplY3QgdGhhdFxuICogYWRkaXRpb25hbGx5IHJlc3BvbmRzIHRvIHRoZSBcImlzRGVmXCIgbWVzc2FnZVxuICogd2l0aG91dCBhIHJlamVjdGlvbi5cbiAqL1xuUS5tYXN0ZXIgPSBtYXN0ZXI7XG5mdW5jdGlvbiBtYXN0ZXIob2JqZWN0KSB7XG4gICAgcmV0dXJuIFByb21pc2Uoe1xuICAgICAgICBcImlzRGVmXCI6IGZ1bmN0aW9uICgpIHt9XG4gICAgfSwgZnVuY3Rpb24gZmFsbGJhY2sob3AsIGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGRpc3BhdGNoKG9iamVjdCwgb3AsIGFyZ3MpO1xuICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFEob2JqZWN0KS5pbnNwZWN0KCk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogU3ByZWFkcyB0aGUgdmFsdWVzIG9mIGEgcHJvbWlzZWQgYXJyYXkgb2YgYXJndW1lbnRzIGludG8gdGhlXG4gKiBmdWxmaWxsbWVudCBjYWxsYmFjay5cbiAqIEBwYXJhbSBmdWxmaWxsZWQgY2FsbGJhY2sgdGhhdCByZWNlaXZlcyB2YXJpYWRpYyBhcmd1bWVudHMgZnJvbSB0aGVcbiAqIHByb21pc2VkIGFycmF5XG4gKiBAcGFyYW0gcmVqZWN0ZWQgY2FsbGJhY2sgdGhhdCByZWNlaXZlcyB0aGUgZXhjZXB0aW9uIGlmIHRoZSBwcm9taXNlXG4gKiBpcyByZWplY3RlZC5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBvciB0aHJvd24gZXhjZXB0aW9uIG9mXG4gKiBlaXRoZXIgY2FsbGJhY2suXG4gKi9cblEuc3ByZWFkID0gc3ByZWFkO1xuZnVuY3Rpb24gc3ByZWFkKHZhbHVlLCBmdWxmaWxsZWQsIHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIFEodmFsdWUpLnNwcmVhZChmdWxmaWxsZWQsIHJlamVjdGVkKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuc3ByZWFkID0gZnVuY3Rpb24gKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gdGhpcy5hbGwoKS50aGVuKGZ1bmN0aW9uIChhcnJheSkge1xuICAgICAgICByZXR1cm4gZnVsZmlsbGVkLmFwcGx5KHZvaWQgMCwgYXJyYXkpO1xuICAgIH0sIHJlamVjdGVkKTtcbn07XG5cbi8qKlxuICogVGhlIGFzeW5jIGZ1bmN0aW9uIGlzIGEgZGVjb3JhdG9yIGZvciBnZW5lcmF0b3IgZnVuY3Rpb25zLCB0dXJuaW5nXG4gKiB0aGVtIGludG8gYXN5bmNocm9ub3VzIGdlbmVyYXRvcnMuICBBbHRob3VnaCBnZW5lcmF0b3JzIGFyZSBvbmx5IHBhcnRcbiAqIG9mIHRoZSBuZXdlc3QgRUNNQVNjcmlwdCA2IGRyYWZ0cywgdGhpcyBjb2RlIGRvZXMgbm90IGNhdXNlIHN5bnRheFxuICogZXJyb3JzIGluIG9sZGVyIGVuZ2luZXMuICBUaGlzIGNvZGUgc2hvdWxkIGNvbnRpbnVlIHRvIHdvcmsgYW5kIHdpbGxcbiAqIGluIGZhY3QgaW1wcm92ZSBvdmVyIHRpbWUgYXMgdGhlIGxhbmd1YWdlIGltcHJvdmVzLlxuICpcbiAqIEVTNiBnZW5lcmF0b3JzIGFyZSBjdXJyZW50bHkgcGFydCBvZiBWOCB2ZXJzaW9uIDMuMTkgd2l0aCB0aGVcbiAqIC0taGFybW9ueS1nZW5lcmF0b3JzIHJ1bnRpbWUgZmxhZyBlbmFibGVkLiAgU3BpZGVyTW9ua2V5IGhhcyBoYWQgdGhlbVxuICogZm9yIGxvbmdlciwgYnV0IHVuZGVyIGFuIG9sZGVyIFB5dGhvbi1pbnNwaXJlZCBmb3JtLiAgVGhpcyBmdW5jdGlvblxuICogd29ya3Mgb24gYm90aCBraW5kcyBvZiBnZW5lcmF0b3JzLlxuICpcbiAqIERlY29yYXRlcyBhIGdlbmVyYXRvciBmdW5jdGlvbiBzdWNoIHRoYXQ6XG4gKiAgLSBpdCBtYXkgeWllbGQgcHJvbWlzZXNcbiAqICAtIGV4ZWN1dGlvbiB3aWxsIGNvbnRpbnVlIHdoZW4gdGhhdCBwcm9taXNlIGlzIGZ1bGZpbGxlZFxuICogIC0gdGhlIHZhbHVlIG9mIHRoZSB5aWVsZCBleHByZXNzaW9uIHdpbGwgYmUgdGhlIGZ1bGZpbGxlZCB2YWx1ZVxuICogIC0gaXQgcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWUgKHdoZW4gdGhlIGdlbmVyYXRvclxuICogICAgc3RvcHMgaXRlcmF0aW5nKVxuICogIC0gdGhlIGRlY29yYXRlZCBmdW5jdGlvbiByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICogICAgb2YgdGhlIGdlbmVyYXRvciBvciB0aGUgZmlyc3QgcmVqZWN0ZWQgcHJvbWlzZSBhbW9uZyB0aG9zZVxuICogICAgeWllbGRlZC5cbiAqICAtIGlmIGFuIGVycm9yIGlzIHRocm93biBpbiB0aGUgZ2VuZXJhdG9yLCBpdCBwcm9wYWdhdGVzIHRocm91Z2hcbiAqICAgIGV2ZXJ5IGZvbGxvd2luZyB5aWVsZCB1bnRpbCBpdCBpcyBjYXVnaHQsIG9yIHVudGlsIGl0IGVzY2FwZXNcbiAqICAgIHRoZSBnZW5lcmF0b3IgZnVuY3Rpb24gYWx0b2dldGhlciwgYW5kIGlzIHRyYW5zbGF0ZWQgaW50byBhXG4gKiAgICByZWplY3Rpb24gZm9yIHRoZSBwcm9taXNlIHJldHVybmVkIGJ5IHRoZSBkZWNvcmF0ZWQgZ2VuZXJhdG9yLlxuICovXG5RLmFzeW5jID0gYXN5bmM7XG5mdW5jdGlvbiBhc3luYyhtYWtlR2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gd2hlbiB2ZXJiIGlzIFwic2VuZFwiLCBhcmcgaXMgYSB2YWx1ZVxuICAgICAgICAvLyB3aGVuIHZlcmIgaXMgXCJ0aHJvd1wiLCBhcmcgaXMgYW4gZXhjZXB0aW9uXG4gICAgICAgIGZ1bmN0aW9uIGNvbnRpbnVlcih2ZXJiLCBhcmcpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQ7XG5cbiAgICAgICAgICAgIC8vIFVudGlsIFY4IDMuMTkgLyBDaHJvbWl1bSAyOSBpcyByZWxlYXNlZCwgU3BpZGVyTW9ua2V5IGlzIHRoZSBvbmx5XG4gICAgICAgICAgICAvLyBlbmdpbmUgdGhhdCBoYXMgYSBkZXBsb3llZCBiYXNlIG9mIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBnZW5lcmF0b3JzLlxuICAgICAgICAgICAgLy8gSG93ZXZlciwgU00ncyBnZW5lcmF0b3JzIHVzZSB0aGUgUHl0aG9uLWluc3BpcmVkIHNlbWFudGljcyBvZlxuICAgICAgICAgICAgLy8gb3V0ZGF0ZWQgRVM2IGRyYWZ0cy4gIFdlIHdvdWxkIGxpa2UgdG8gc3VwcG9ydCBFUzYsIGJ1dCB3ZSdkIGFsc29cbiAgICAgICAgICAgIC8vIGxpa2UgdG8gbWFrZSBpdCBwb3NzaWJsZSB0byB1c2UgZ2VuZXJhdG9ycyBpbiBkZXBsb3llZCBicm93c2Vycywgc29cbiAgICAgICAgICAgIC8vIHdlIGFsc28gc3VwcG9ydCBQeXRob24tc3R5bGUgZ2VuZXJhdG9ycy4gIEF0IHNvbWUgcG9pbnQgd2UgY2FuIHJlbW92ZVxuICAgICAgICAgICAgLy8gdGhpcyBibG9jay5cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBTdG9wSXRlcmF0aW9uID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgLy8gRVM2IEdlbmVyYXRvcnNcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBnZW5lcmF0b3JbdmVyYl0oYXJnKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmRvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFEocmVzdWx0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2hlbihyZXN1bHQudmFsdWUsIGNhbGxiYWNrLCBlcnJiYWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFNwaWRlck1vbmtleSBHZW5lcmF0b3JzXG4gICAgICAgICAgICAgICAgLy8gRklYTUU6IFJlbW92ZSB0aGlzIGNhc2Ugd2hlbiBTTSBkb2VzIEVTNiBnZW5lcmF0b3JzLlxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGdlbmVyYXRvclt2ZXJiXShhcmcpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNTdG9wSXRlcmF0aW9uKGV4Y2VwdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBRKGV4Y2VwdGlvbi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdoZW4ocmVzdWx0LCBjYWxsYmFjaywgZXJyYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGdlbmVyYXRvciA9IG1ha2VHZW5lcmF0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gY29udGludWVyLmJpbmQoY29udGludWVyLCBcIm5leHRcIik7XG4gICAgICAgIHZhciBlcnJiYWNrID0gY29udGludWVyLmJpbmQoY29udGludWVyLCBcInRocm93XCIpO1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICB9O1xufVxuXG4vKipcbiAqIFRoZSBzcGF3biBmdW5jdGlvbiBpcyBhIHNtYWxsIHdyYXBwZXIgYXJvdW5kIGFzeW5jIHRoYXQgaW1tZWRpYXRlbHlcbiAqIGNhbGxzIHRoZSBnZW5lcmF0b3IgYW5kIGFsc28gZW5kcyB0aGUgcHJvbWlzZSBjaGFpbiwgc28gdGhhdCBhbnlcbiAqIHVuaGFuZGxlZCBlcnJvcnMgYXJlIHRocm93biBpbnN0ZWFkIG9mIGZvcndhcmRlZCB0byB0aGUgZXJyb3JcbiAqIGhhbmRsZXIuIFRoaXMgaXMgdXNlZnVsIGJlY2F1c2UgaXQncyBleHRyZW1lbHkgY29tbW9uIHRvIHJ1blxuICogZ2VuZXJhdG9ycyBhdCB0aGUgdG9wLWxldmVsIHRvIHdvcmsgd2l0aCBsaWJyYXJpZXMuXG4gKi9cblEuc3Bhd24gPSBzcGF3bjtcbmZ1bmN0aW9uIHNwYXduKG1ha2VHZW5lcmF0b3IpIHtcbiAgICBRLmRvbmUoUS5hc3luYyhtYWtlR2VuZXJhdG9yKSgpKTtcbn1cblxuLy8gRklYTUU6IFJlbW92ZSB0aGlzIGludGVyZmFjZSBvbmNlIEVTNiBnZW5lcmF0b3JzIGFyZSBpbiBTcGlkZXJNb25rZXkuXG4vKipcbiAqIFRocm93cyBhIFJldHVyblZhbHVlIGV4Y2VwdGlvbiB0byBzdG9wIGFuIGFzeW5jaHJvbm91cyBnZW5lcmF0b3IuXG4gKlxuICogVGhpcyBpbnRlcmZhY2UgaXMgYSBzdG9wLWdhcCBtZWFzdXJlIHRvIHN1cHBvcnQgZ2VuZXJhdG9yIHJldHVyblxuICogdmFsdWVzIGluIG9sZGVyIEZpcmVmb3gvU3BpZGVyTW9ua2V5LiAgSW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEVTNlxuICogZ2VuZXJhdG9ycyBsaWtlIENocm9taXVtIDI5LCBqdXN0IHVzZSBcInJldHVyblwiIGluIHlvdXIgZ2VuZXJhdG9yXG4gKiBmdW5jdGlvbnMuXG4gKlxuICogQHBhcmFtIHZhbHVlIHRoZSByZXR1cm4gdmFsdWUgZm9yIHRoZSBzdXJyb3VuZGluZyBnZW5lcmF0b3JcbiAqIEB0aHJvd3MgUmV0dXJuVmFsdWUgZXhjZXB0aW9uIHdpdGggdGhlIHZhbHVlLlxuICogQGV4YW1wbGVcbiAqIC8vIEVTNiBzdHlsZVxuICogUS5hc3luYyhmdW5jdGlvbiogKCkge1xuICogICAgICB2YXIgZm9vID0geWllbGQgZ2V0Rm9vUHJvbWlzZSgpO1xuICogICAgICB2YXIgYmFyID0geWllbGQgZ2V0QmFyUHJvbWlzZSgpO1xuICogICAgICByZXR1cm4gZm9vICsgYmFyO1xuICogfSlcbiAqIC8vIE9sZGVyIFNwaWRlck1vbmtleSBzdHlsZVxuICogUS5hc3luYyhmdW5jdGlvbiAoKSB7XG4gKiAgICAgIHZhciBmb28gPSB5aWVsZCBnZXRGb29Qcm9taXNlKCk7XG4gKiAgICAgIHZhciBiYXIgPSB5aWVsZCBnZXRCYXJQcm9taXNlKCk7XG4gKiAgICAgIFEucmV0dXJuKGZvbyArIGJhcik7XG4gKiB9KVxuICovXG5RW1wicmV0dXJuXCJdID0gX3JldHVybjtcbmZ1bmN0aW9uIF9yZXR1cm4odmFsdWUpIHtcbiAgICB0aHJvdyBuZXcgUVJldHVyblZhbHVlKHZhbHVlKTtcbn1cblxuLyoqXG4gKiBUaGUgcHJvbWlzZWQgZnVuY3Rpb24gZGVjb3JhdG9yIGVuc3VyZXMgdGhhdCBhbnkgcHJvbWlzZSBhcmd1bWVudHNcbiAqIGFyZSBzZXR0bGVkIGFuZCBwYXNzZWQgYXMgdmFsdWVzIChgdGhpc2AgaXMgYWxzbyBzZXR0bGVkIGFuZCBwYXNzZWRcbiAqIGFzIGEgdmFsdWUpLiAgSXQgd2lsbCBhbHNvIGVuc3VyZSB0aGF0IHRoZSByZXN1bHQgb2YgYSBmdW5jdGlvbiBpc1xuICogYWx3YXlzIGEgcHJvbWlzZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogdmFyIGFkZCA9IFEucHJvbWlzZWQoZnVuY3Rpb24gKGEsIGIpIHtcbiAqICAgICByZXR1cm4gYSArIGI7XG4gKiB9KTtcbiAqIGFkZChRKGEpLCBRKEIpKTtcbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gZGVjb3JhdGVcbiAqIEByZXR1cm5zIHtmdW5jdGlvbn0gYSBmdW5jdGlvbiB0aGF0IGhhcyBiZWVuIGRlY29yYXRlZC5cbiAqL1xuUS5wcm9taXNlZCA9IHByb21pc2VkO1xuZnVuY3Rpb24gcHJvbWlzZWQoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gc3ByZWFkKFt0aGlzLCBhbGwoYXJndW1lbnRzKV0sIGZ1bmN0aW9uIChzZWxmLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgICAgIH0pO1xuICAgIH07XG59XG5cbi8qKlxuICogc2VuZHMgYSBtZXNzYWdlIHRvIGEgdmFsdWUgaW4gYSBmdXR1cmUgdHVyblxuICogQHBhcmFtIG9iamVjdCogdGhlIHJlY2lwaWVudFxuICogQHBhcmFtIG9wIHRoZSBuYW1lIG9mIHRoZSBtZXNzYWdlIG9wZXJhdGlvbiwgZS5nLiwgXCJ3aGVuXCIsXG4gKiBAcGFyYW0gYXJncyBmdXJ0aGVyIGFyZ3VtZW50cyB0byBiZSBmb3J3YXJkZWQgdG8gdGhlIG9wZXJhdGlvblxuICogQHJldHVybnMgcmVzdWx0IHtQcm9taXNlfSBhIHByb21pc2UgZm9yIHRoZSByZXN1bHQgb2YgdGhlIG9wZXJhdGlvblxuICovXG5RLmRpc3BhdGNoID0gZGlzcGF0Y2g7XG5mdW5jdGlvbiBkaXNwYXRjaChvYmplY3QsIG9wLCBhcmdzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChvcCwgYXJncyk7XG59XG5cblByb21pc2UucHJvdG90eXBlLmRpc3BhdGNoID0gZnVuY3Rpb24gKG9wLCBhcmdzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYucHJvbWlzZURpc3BhdGNoKGRlZmVycmVkLnJlc29sdmUsIG9wLCBhcmdzKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBnZXRcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHByb3BlcnR5IHZhbHVlXG4gKi9cblEuZ2V0ID0gZnVuY3Rpb24gKG9iamVjdCwga2V5KSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImdldFwiLCBba2V5XSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJnZXRcIiwgW2tleV0pO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3Igb2JqZWN0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIHByb3BlcnR5IHRvIHNldFxuICogQHBhcmFtIHZhbHVlICAgICBuZXcgdmFsdWUgb2YgcHJvcGVydHlcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RLnNldCA9IGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwic2V0XCIsIFtrZXksIHZhbHVlXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwic2V0XCIsIFtrZXksIHZhbHVlXSk7XG59O1xuXG4vKipcbiAqIERlbGV0ZXMgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBkZWxldGVcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RLmRlbCA9IC8vIFhYWCBsZWdhY3lcblFbXCJkZWxldGVcIl0gPSBmdW5jdGlvbiAob2JqZWN0LCBrZXkpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiZGVsZXRlXCIsIFtrZXldKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRlbCA9IC8vIFhYWCBsZWdhY3lcblByb21pc2UucHJvdG90eXBlW1wiZGVsZXRlXCJdID0gZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiZGVsZXRlXCIsIFtrZXldKTtcbn07XG5cbi8qKlxuICogSW52b2tlcyBhIG1ldGhvZCBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBtZXRob2QgdG8gaW52b2tlXG4gKiBAcGFyYW0gdmFsdWUgICAgIGEgdmFsdWUgdG8gcG9zdCwgdHlwaWNhbGx5IGFuIGFycmF5IG9mXG4gKiAgICAgICAgICAgICAgICAgIGludm9jYXRpb24gYXJndW1lbnRzIGZvciBwcm9taXNlcyB0aGF0XG4gKiAgICAgICAgICAgICAgICAgIGFyZSB1bHRpbWF0ZWx5IGJhY2tlZCB3aXRoIGByZXNvbHZlYCB2YWx1ZXMsXG4gKiAgICAgICAgICAgICAgICAgIGFzIG9wcG9zZWQgdG8gdGhvc2UgYmFja2VkIHdpdGggVVJMc1xuICogICAgICAgICAgICAgICAgICB3aGVyZWluIHRoZSBwb3N0ZWQgdmFsdWUgY2FuIGJlIGFueVxuICogICAgICAgICAgICAgICAgICBKU09OIHNlcmlhbGl6YWJsZSBvYmplY3QuXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuLy8gYm91bmQgbG9jYWxseSBiZWNhdXNlIGl0IGlzIHVzZWQgYnkgb3RoZXIgbWV0aG9kc1xuUS5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUS5wb3N0ID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcmdzXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUHJvbWlzZS5wcm90b3R5cGUucG9zdCA9IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcmdzXSk7XG59O1xuXG4vKipcbiAqIEludm9rZXMgYSBtZXRob2QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgbWV0aG9kIHRvIGludm9rZVxuICogQHBhcmFtIC4uLmFyZ3MgICBhcnJheSBvZiBpbnZvY2F0aW9uIGFyZ3VtZW50c1xuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cblEuc2VuZCA9IC8vIFhYWCBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIHBhcmxhbmNlXG5RLm1jYWxsID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblEuaW52b2tlID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5zZW5kID0gLy8gWFhYIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgcGFybGFuY2VcblByb21pc2UucHJvdG90eXBlLm1jYWxsID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblByb21pc2UucHJvdG90eXBlLmludm9rZSA9IGZ1bmN0aW9uIChuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpXSk7XG59O1xuXG4vKipcbiAqIEFwcGxpZXMgdGhlIHByb21pc2VkIGZ1bmN0aW9uIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IGZ1bmN0aW9uXG4gKiBAcGFyYW0gYXJncyAgICAgIGFycmF5IG9mIGFwcGxpY2F0aW9uIGFyZ3VtZW50c1xuICovXG5RLmZhcHBseSA9IGZ1bmN0aW9uIChvYmplY3QsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJnc10pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmFwcGx5ID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFyZ3NdKTtcbn07XG5cbi8qKlxuICogQ2FsbHMgdGhlIHByb21pc2VkIGZ1bmN0aW9uIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IGZ1bmN0aW9uXG4gKiBAcGFyYW0gLi4uYXJncyAgIGFycmF5IG9mIGFwcGxpY2F0aW9uIGFyZ3VtZW50c1xuICovXG5RW1widHJ5XCJdID1cblEuZmNhbGwgPSBmdW5jdGlvbiAob2JqZWN0IC8qIC4uLmFyZ3MqLykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mY2FsbCA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJyYXlfc2xpY2UoYXJndW1lbnRzKV0pO1xufTtcblxuLyoqXG4gKiBCaW5kcyB0aGUgcHJvbWlzZWQgZnVuY3Rpb24sIHRyYW5zZm9ybWluZyByZXR1cm4gdmFsdWVzIGludG8gYSBmdWxmaWxsZWRcbiAqIHByb21pc2UgYW5kIHRocm93biBlcnJvcnMgaW50byBhIHJlamVjdGVkIG9uZS5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgZnVuY3Rpb25cbiAqIEBwYXJhbSAuLi5hcmdzICAgYXJyYXkgb2YgYXBwbGljYXRpb24gYXJndW1lbnRzXG4gKi9cblEuZmJpbmQgPSBmdW5jdGlvbiAob2JqZWN0IC8qLi4uYXJncyovKSB7XG4gICAgdmFyIHByb21pc2UgPSBRKG9iamVjdCk7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbiBmYm91bmQoKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlLmRpc3BhdGNoKFwiYXBwbHlcIiwgW1xuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIGFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpXG4gICAgICAgIF0pO1xuICAgIH07XG59O1xuUHJvbWlzZS5wcm90b3R5cGUuZmJpbmQgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXM7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgIHJldHVybiBmdW5jdGlvbiBmYm91bmQoKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlLmRpc3BhdGNoKFwiYXBwbHlcIiwgW1xuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIGFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpXG4gICAgICAgIF0pO1xuICAgIH07XG59O1xuXG4vKipcbiAqIFJlcXVlc3RzIHRoZSBuYW1lcyBvZiB0aGUgb3duZWQgcHJvcGVydGllcyBvZiBhIHByb21pc2VkXG4gKiBvYmplY3QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSBrZXlzIG9mIHRoZSBldmVudHVhbGx5IHNldHRsZWQgb2JqZWN0XG4gKi9cblEua2V5cyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwia2V5c1wiLCBbXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwia2V5c1wiLCBbXSk7XG59O1xuXG4vKipcbiAqIFR1cm5zIGFuIGFycmF5IG9mIHByb21pc2VzIGludG8gYSBwcm9taXNlIGZvciBhbiBhcnJheS4gIElmIGFueSBvZlxuICogdGhlIHByb21pc2VzIGdldHMgcmVqZWN0ZWQsIHRoZSB3aG9sZSBhcnJheSBpcyByZWplY3RlZCBpbW1lZGlhdGVseS5cbiAqIEBwYXJhbSB7QXJyYXkqfSBhbiBhcnJheSAob3IgcHJvbWlzZSBmb3IgYW4gYXJyYXkpIG9mIHZhbHVlcyAob3JcbiAqIHByb21pc2VzIGZvciB2YWx1ZXMpXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlc1xuICovXG4vLyBCeSBNYXJrIE1pbGxlclxuLy8gaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9c3RyYXdtYW46Y29uY3VycmVuY3kmcmV2PTEzMDg3NzY1MjEjYWxsZnVsZmlsbGVkXG5RLmFsbCA9IGFsbDtcbmZ1bmN0aW9uIGFsbChwcm9taXNlcykge1xuICAgIHJldHVybiB3aGVuKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICAgICAgdmFyIHBlbmRpbmdDb3VudCA9IDA7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIGFycmF5X3JlZHVjZShwcm9taXNlcywgZnVuY3Rpb24gKHVuZGVmaW5lZCwgcHJvbWlzZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIHZhciBzbmFwc2hvdDtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBpc1Byb21pc2UocHJvbWlzZSkgJiZcbiAgICAgICAgICAgICAgICAoc25hcHNob3QgPSBwcm9taXNlLmluc3BlY3QoKSkuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCJcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHByb21pc2VzW2luZGV4XSA9IHNuYXBzaG90LnZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICArK3BlbmRpbmdDb3VudDtcbiAgICAgICAgICAgICAgICB3aGVuKFxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC0tcGVuZGluZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkoeyBpbmRleDogaW5kZXgsIHZhbHVlOiBwcm9ncmVzcyB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHZvaWQgMCk7XG4gICAgICAgIGlmIChwZW5kaW5nQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocHJvbWlzZXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFsbCh0aGlzKTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmlyc3QgcmVzb2x2ZWQgcHJvbWlzZSBvZiBhbiBhcnJheS4gUHJpb3IgcmVqZWN0ZWQgcHJvbWlzZXMgYXJlXG4gKiBpZ25vcmVkLiAgUmVqZWN0cyBvbmx5IGlmIGFsbCBwcm9taXNlcyBhcmUgcmVqZWN0ZWQuXG4gKiBAcGFyYW0ge0FycmF5Kn0gYW4gYXJyYXkgY29udGFpbmluZyB2YWx1ZXMgb3IgcHJvbWlzZXMgZm9yIHZhbHVlc1xuICogQHJldHVybnMgYSBwcm9taXNlIGZ1bGZpbGxlZCB3aXRoIHRoZSB2YWx1ZSBvZiB0aGUgZmlyc3QgcmVzb2x2ZWQgcHJvbWlzZSxcbiAqIG9yIGEgcmVqZWN0ZWQgcHJvbWlzZSBpZiBhbGwgcHJvbWlzZXMgYXJlIHJlamVjdGVkLlxuICovXG5RLmFueSA9IGFueTtcblxuZnVuY3Rpb24gYW55KHByb21pc2VzKSB7XG4gICAgaWYgKHByb21pc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gUS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgdmFyIGRlZmVycmVkID0gUS5kZWZlcigpO1xuICAgIHZhciBwZW5kaW5nQ291bnQgPSAwO1xuICAgIGFycmF5X3JlZHVjZShwcm9taXNlcywgZnVuY3Rpb24gKHByZXYsIGN1cnJlbnQsIGluZGV4KSB7XG4gICAgICAgIHZhciBwcm9taXNlID0gcHJvbWlzZXNbaW5kZXhdO1xuXG4gICAgICAgIHBlbmRpbmdDb3VudCsrO1xuXG4gICAgICAgIHdoZW4ocHJvbWlzZSwgb25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIG9uUHJvZ3Jlc3MpO1xuICAgICAgICBmdW5jdGlvbiBvbkZ1bGZpbGxlZChyZXN1bHQpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvblJlamVjdGVkKCkge1xuICAgICAgICAgICAgcGVuZGluZ0NvdW50LS07XG4gICAgICAgICAgICBpZiAocGVuZGluZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgXCJDYW4ndCBnZXQgZnVsZmlsbG1lbnQgdmFsdWUgZnJvbSBhbnkgcHJvbWlzZSwgYWxsIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9taXNlcyB3ZXJlIHJlamVjdGVkLlwiXG4gICAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gb25Qcm9ncmVzcyhwcm9ncmVzcykge1xuICAgICAgICAgICAgZGVmZXJyZWQubm90aWZ5KHtcbiAgICAgICAgICAgICAgICBpbmRleDogaW5kZXgsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHByb2dyZXNzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sIHVuZGVmaW5lZCk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuYW55ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhbnkodGhpcyk7XG59O1xuXG4vKipcbiAqIFdhaXRzIGZvciBhbGwgcHJvbWlzZXMgdG8gYmUgc2V0dGxlZCwgZWl0aGVyIGZ1bGZpbGxlZCBvclxuICogcmVqZWN0ZWQuICBUaGlzIGlzIGRpc3RpbmN0IGZyb20gYGFsbGAgc2luY2UgdGhhdCB3b3VsZCBzdG9wXG4gKiB3YWl0aW5nIGF0IHRoZSBmaXJzdCByZWplY3Rpb24uICBUaGUgcHJvbWlzZSByZXR1cm5lZCBieVxuICogYGFsbFJlc29sdmVkYCB3aWxsIG5ldmVyIGJlIHJlamVjdGVkLlxuICogQHBhcmFtIHByb21pc2VzIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkgKG9yIGFuIGFycmF5KSBvZiBwcm9taXNlc1xuICogKG9yIHZhbHVlcylcbiAqIEByZXR1cm4gYSBwcm9taXNlIGZvciBhbiBhcnJheSBvZiBwcm9taXNlc1xuICovXG5RLmFsbFJlc29sdmVkID0gZGVwcmVjYXRlKGFsbFJlc29sdmVkLCBcImFsbFJlc29sdmVkXCIsIFwiYWxsU2V0dGxlZFwiKTtcbmZ1bmN0aW9uIGFsbFJlc29sdmVkKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIHdoZW4ocHJvbWlzZXMsIGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgICAgICBwcm9taXNlcyA9IGFycmF5X21hcChwcm9taXNlcywgUSk7XG4gICAgICAgIHJldHVybiB3aGVuKGFsbChhcnJheV9tYXAocHJvbWlzZXMsIGZ1bmN0aW9uIChwcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm4gd2hlbihwcm9taXNlLCBub29wLCBub29wKTtcbiAgICAgICAgfSkpLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZXM7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hbGxSZXNvbHZlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gYWxsUmVzb2x2ZWQodGhpcyk7XG59O1xuXG4vKipcbiAqIEBzZWUgUHJvbWlzZSNhbGxTZXR0bGVkXG4gKi9cblEuYWxsU2V0dGxlZCA9IGFsbFNldHRsZWQ7XG5mdW5jdGlvbiBhbGxTZXR0bGVkKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIFEocHJvbWlzZXMpLmFsbFNldHRsZWQoKTtcbn1cblxuLyoqXG4gKiBUdXJucyBhbiBhcnJheSBvZiBwcm9taXNlcyBpbnRvIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgdGhlaXIgc3RhdGVzIChhc1xuICogcmV0dXJuZWQgYnkgYGluc3BlY3RgKSB3aGVuIHRoZXkgaGF2ZSBhbGwgc2V0dGxlZC5cbiAqIEBwYXJhbSB7QXJyYXlbQW55Kl19IHZhbHVlcyBhbiBhcnJheSAob3IgcHJvbWlzZSBmb3IgYW4gYXJyYXkpIG9mIHZhbHVlcyAob3JcbiAqIHByb21pc2VzIGZvciB2YWx1ZXMpXG4gKiBAcmV0dXJucyB7QXJyYXlbU3RhdGVdfSBhbiBhcnJheSBvZiBzdGF0ZXMgZm9yIHRoZSByZXNwZWN0aXZlIHZhbHVlcy5cbiAqL1xuUHJvbWlzZS5wcm90b3R5cGUuYWxsU2V0dGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgICAgICByZXR1cm4gYWxsKGFycmF5X21hcChwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICAgICAgICAgIHByb21pc2UgPSBRKHByb21pc2UpO1xuICAgICAgICAgICAgZnVuY3Rpb24gcmVnYXJkbGVzcygpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZS5pbnNwZWN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZS50aGVuKHJlZ2FyZGxlc3MsIHJlZ2FyZGxlc3MpO1xuICAgICAgICB9KSk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIENhcHR1cmVzIHRoZSBmYWlsdXJlIG9mIGEgcHJvbWlzZSwgZ2l2aW5nIGFuIG9wb3J0dW5pdHkgdG8gcmVjb3ZlclxuICogd2l0aCBhIGNhbGxiYWNrLiAgSWYgdGhlIGdpdmVuIHByb21pc2UgaXMgZnVsZmlsbGVkLCB0aGUgcmV0dXJuZWRcbiAqIHByb21pc2UgaXMgZnVsZmlsbGVkLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlIGZvciBzb21ldGhpbmdcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRvIGZ1bGZpbGwgdGhlIHJldHVybmVkIHByb21pc2UgaWYgdGhlXG4gKiBnaXZlbiBwcm9taXNlIGlzIHJlamVjdGVkXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGNhbGxiYWNrXG4gKi9cblEuZmFpbCA9IC8vIFhYWCBsZWdhY3lcblFbXCJjYXRjaFwiXSA9IGZ1bmN0aW9uIChvYmplY3QsIHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS50aGVuKHZvaWQgMCwgcmVqZWN0ZWQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmFpbCA9IC8vIFhYWCBsZWdhY3lcblByb21pc2UucHJvdG90eXBlW1wiY2F0Y2hcIl0gPSBmdW5jdGlvbiAocmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKHZvaWQgMCwgcmVqZWN0ZWQpO1xufTtcblxuLyoqXG4gKiBBdHRhY2hlcyBhIGxpc3RlbmVyIHRoYXQgY2FuIHJlc3BvbmQgdG8gcHJvZ3Jlc3Mgbm90aWZpY2F0aW9ucyBmcm9tIGFcbiAqIHByb21pc2UncyBvcmlnaW5hdGluZyBkZWZlcnJlZC4gVGhpcyBsaXN0ZW5lciByZWNlaXZlcyB0aGUgZXhhY3QgYXJndW1lbnRzXG4gKiBwYXNzZWQgdG8gYGBkZWZlcnJlZC5ub3RpZnlgYC5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZSBmb3Igc29tZXRoaW5nXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0byByZWNlaXZlIGFueSBwcm9ncmVzcyBub3RpZmljYXRpb25zXG4gKiBAcmV0dXJucyB0aGUgZ2l2ZW4gcHJvbWlzZSwgdW5jaGFuZ2VkXG4gKi9cblEucHJvZ3Jlc3MgPSBwcm9ncmVzcztcbmZ1bmN0aW9uIHByb2dyZXNzKG9iamVjdCwgcHJvZ3Jlc3NlZCkge1xuICAgIHJldHVybiBRKG9iamVjdCkudGhlbih2b2lkIDAsIHZvaWQgMCwgcHJvZ3Jlc3NlZCk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnByb2dyZXNzID0gZnVuY3Rpb24gKHByb2dyZXNzZWQpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKHZvaWQgMCwgdm9pZCAwLCBwcm9ncmVzc2VkKTtcbn07XG5cbi8qKlxuICogUHJvdmlkZXMgYW4gb3Bwb3J0dW5pdHkgdG8gb2JzZXJ2ZSB0aGUgc2V0dGxpbmcgb2YgYSBwcm9taXNlLFxuICogcmVnYXJkbGVzcyBvZiB3aGV0aGVyIHRoZSBwcm9taXNlIGlzIGZ1bGZpbGxlZCBvciByZWplY3RlZC4gIEZvcndhcmRzXG4gKiB0aGUgcmVzb2x1dGlvbiB0byB0aGUgcmV0dXJuZWQgcHJvbWlzZSB3aGVuIHRoZSBjYWxsYmFjayBpcyBkb25lLlxuICogVGhlIGNhbGxiYWNrIGNhbiByZXR1cm4gYSBwcm9taXNlIHRvIGRlZmVyIGNvbXBsZXRpb24uXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2VcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRvIG9ic2VydmUgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuXG4gKiBwcm9taXNlLCB0YWtlcyBubyBhcmd1bWVudHMuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlIHdoZW5cbiAqIGBgZmluYGAgaXMgZG9uZS5cbiAqL1xuUS5maW4gPSAvLyBYWFggbGVnYWN5XG5RW1wiZmluYWxseVwiXSA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KVtcImZpbmFsbHlcIl0oY2FsbGJhY2spO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmluID0gLy8gWFhYIGxlZ2FjeVxuUHJvbWlzZS5wcm90b3R5cGVbXCJmaW5hbGx5XCJdID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sgPSBRKGNhbGxiYWNrKTtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2suZmNhbGwoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAvLyBUT0RPIGF0dGVtcHQgdG8gcmVjeWNsZSB0aGUgcmVqZWN0aW9uIHdpdGggXCJ0aGlzXCIuXG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhyb3cgcmVhc29uO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogVGVybWluYXRlcyBhIGNoYWluIG9mIHByb21pc2VzLCBmb3JjaW5nIHJlamVjdGlvbnMgdG8gYmVcbiAqIHRocm93biBhcyBleGNlcHRpb25zLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlIGF0IHRoZSBlbmQgb2YgYSBjaGFpbiBvZiBwcm9taXNlc1xuICogQHJldHVybnMgbm90aGluZ1xuICovXG5RLmRvbmUgPSBmdW5jdGlvbiAob2JqZWN0LCBmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzcykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZG9uZShmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzcyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kb25lID0gZnVuY3Rpb24gKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKSB7XG4gICAgdmFyIG9uVW5oYW5kbGVkRXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgLy8gZm9yd2FyZCB0byBhIGZ1dHVyZSB0dXJuIHNvIHRoYXQgYGB3aGVuYGBcbiAgICAgICAgLy8gZG9lcyBub3QgY2F0Y2ggaXQgYW5kIHR1cm4gaXQgaW50byBhIHJlamVjdGlvbi5cbiAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYWtlU3RhY2tUcmFjZUxvbmcoZXJyb3IsIHByb21pc2UpO1xuICAgICAgICAgICAgaWYgKFEub25lcnJvcikge1xuICAgICAgICAgICAgICAgIFEub25lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gQXZvaWQgdW5uZWNlc3NhcnkgYG5leHRUaWNrYGluZyB2aWEgYW4gdW5uZWNlc3NhcnkgYHdoZW5gLlxuICAgIHZhciBwcm9taXNlID0gZnVsZmlsbGVkIHx8IHJlamVjdGVkIHx8IHByb2dyZXNzID9cbiAgICAgICAgdGhpcy50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKSA6XG4gICAgICAgIHRoaXM7XG5cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiYgcHJvY2VzcyAmJiBwcm9jZXNzLmRvbWFpbikge1xuICAgICAgICBvblVuaGFuZGxlZEVycm9yID0gcHJvY2Vzcy5kb21haW4uYmluZChvblVuaGFuZGxlZEVycm9yKTtcbiAgICB9XG5cbiAgICBwcm9taXNlLnRoZW4odm9pZCAwLCBvblVuaGFuZGxlZEVycm9yKTtcbn07XG5cbi8qKlxuICogQ2F1c2VzIGEgcHJvbWlzZSB0byBiZSByZWplY3RlZCBpZiBpdCBkb2VzIG5vdCBnZXQgZnVsZmlsbGVkIGJlZm9yZVxuICogc29tZSBtaWxsaXNlY29uZHMgdGltZSBvdXQuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2VcbiAqIEBwYXJhbSB7TnVtYmVyfSBtaWxsaXNlY29uZHMgdGltZW91dFxuICogQHBhcmFtIHtBbnkqfSBjdXN0b20gZXJyb3IgbWVzc2FnZSBvciBFcnJvciBvYmplY3QgKG9wdGlvbmFsKVxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZSBpZiBpdCBpc1xuICogZnVsZmlsbGVkIGJlZm9yZSB0aGUgdGltZW91dCwgb3RoZXJ3aXNlIHJlamVjdGVkLlxuICovXG5RLnRpbWVvdXQgPSBmdW5jdGlvbiAob2JqZWN0LCBtcywgZXJyb3IpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLnRpbWVvdXQobXMsIGVycm9yKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnRpbWVvdXQgPSBmdW5jdGlvbiAobXMsIGVycm9yKSB7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB2YXIgdGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghZXJyb3IgfHwgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGVycm9yKSB7XG4gICAgICAgICAgICBlcnJvciA9IG5ldyBFcnJvcihlcnJvciB8fCBcIlRpbWVkIG91dCBhZnRlciBcIiArIG1zICsgXCIgbXNcIik7XG4gICAgICAgICAgICBlcnJvci5jb2RlID0gXCJFVElNRURPVVRcIjtcbiAgICAgICAgfVxuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgIH0sIG1zKTtcblxuICAgIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUodmFsdWUpO1xuICAgIH0sIGZ1bmN0aW9uIChleGNlcHRpb24pIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChleGNlcHRpb24pO1xuICAgIH0sIGRlZmVycmVkLm5vdGlmeSk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogUmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSBnaXZlbiB2YWx1ZSAob3IgcHJvbWlzZWQgdmFsdWUpLCBzb21lXG4gKiBtaWxsaXNlY29uZHMgYWZ0ZXIgaXQgcmVzb2x2ZWQuIFBhc3NlcyByZWplY3Rpb25zIGltbWVkaWF0ZWx5LlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlXG4gKiBAcGFyYW0ge051bWJlcn0gbWlsbGlzZWNvbmRzXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlIGFmdGVyIG1pbGxpc2Vjb25kc1xuICogdGltZSBoYXMgZWxhcHNlZCBzaW5jZSB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZS5cbiAqIElmIHRoZSBnaXZlbiBwcm9taXNlIHJlamVjdHMsIHRoYXQgaXMgcGFzc2VkIGltbWVkaWF0ZWx5LlxuICovXG5RLmRlbGF5ID0gZnVuY3Rpb24gKG9iamVjdCwgdGltZW91dCkge1xuICAgIGlmICh0aW1lb3V0ID09PSB2b2lkIDApIHtcbiAgICAgICAgdGltZW91dCA9IG9iamVjdDtcbiAgICAgICAgb2JqZWN0ID0gdm9pZCAwO1xuICAgIH1cbiAgICByZXR1cm4gUShvYmplY3QpLmRlbGF5KHRpbWVvdXQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZGVsYXkgPSBmdW5jdGlvbiAodGltZW91dCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh2YWx1ZSk7XG4gICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogUGFzc2VzIGEgY29udGludWF0aW9uIHRvIGEgTm9kZSBmdW5jdGlvbiwgd2hpY2ggaXMgY2FsbGVkIHdpdGggdGhlIGdpdmVuXG4gKiBhcmd1bWVudHMgcHJvdmlkZWQgYXMgYW4gYXJyYXksIGFuZCByZXR1cm5zIGEgcHJvbWlzZS5cbiAqXG4gKiAgICAgIFEubmZhcHBseShGUy5yZWFkRmlsZSwgW19fZmlsZW5hbWVdKVxuICogICAgICAudGhlbihmdW5jdGlvbiAoY29udGVudCkge1xuICogICAgICB9KVxuICpcbiAqL1xuUS5uZmFwcGx5ID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBhcmdzKSB7XG4gICAgcmV0dXJuIFEoY2FsbGJhY2spLm5mYXBwbHkoYXJncyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uZmFwcGx5ID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3MpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBQYXNzZXMgYSBjb250aW51YXRpb24gdG8gYSBOb2RlIGZ1bmN0aW9uLCB3aGljaCBpcyBjYWxsZWQgd2l0aCB0aGUgZ2l2ZW5cbiAqIGFyZ3VtZW50cyBwcm92aWRlZCBpbmRpdmlkdWFsbHksIGFuZCByZXR1cm5zIGEgcHJvbWlzZS5cbiAqIEBleGFtcGxlXG4gKiBRLm5mY2FsbChGUy5yZWFkRmlsZSwgX19maWxlbmFtZSlcbiAqIC50aGVuKGZ1bmN0aW9uIChjb250ZW50KSB7XG4gKiB9KVxuICpcbiAqL1xuUS5uZmNhbGwgPSBmdW5jdGlvbiAoY2FsbGJhY2sgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIFEoY2FsbGJhY2spLm5mYXBwbHkoYXJncyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uZmNhbGwgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZmFwcGx5KG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIFdyYXBzIGEgTm9kZUpTIGNvbnRpbnVhdGlvbiBwYXNzaW5nIGZ1bmN0aW9uIGFuZCByZXR1cm5zIGFuIGVxdWl2YWxlbnRcbiAqIHZlcnNpb24gdGhhdCByZXR1cm5zIGEgcHJvbWlzZS5cbiAqIEBleGFtcGxlXG4gKiBRLm5mYmluZChGUy5yZWFkRmlsZSwgX19maWxlbmFtZSkoXCJ1dGYtOFwiKVxuICogLnRoZW4oY29uc29sZS5sb2cpXG4gKiAuZG9uZSgpXG4gKi9cblEubmZiaW5kID1cblEuZGVub2RlaWZ5ID0gZnVuY3Rpb24gKGNhbGxiYWNrIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIGJhc2VBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbm9kZUFyZ3MgPSBiYXNlQXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSk7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICAgICAgUShjYWxsYmFjaykuZmFwcGx5KG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uZmJpbmQgPVxuUHJvbWlzZS5wcm90b3R5cGUuZGVub2RlaWZ5ID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgIGFyZ3MudW5zaGlmdCh0aGlzKTtcbiAgICByZXR1cm4gUS5kZW5vZGVpZnkuYXBwbHkodm9pZCAwLCBhcmdzKTtcbn07XG5cblEubmJpbmQgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIHRoaXNwIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIGJhc2VBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbm9kZUFyZ3MgPSBiYXNlQXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSk7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICAgICAgZnVuY3Rpb24gYm91bmQoKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkodGhpc3AsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICAgICAgUShib3VuZCkuZmFwcGx5KG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uYmluZCA9IGZ1bmN0aW9uICgvKnRoaXNwLCAuLi5hcmdzKi8pIHtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMCk7XG4gICAgYXJncy51bnNoaWZ0KHRoaXMpO1xuICAgIHJldHVybiBRLm5iaW5kLmFwcGx5KHZvaWQgMCwgYXJncyk7XG59O1xuXG4vKipcbiAqIENhbGxzIGEgbWV0aG9kIG9mIGEgTm9kZS1zdHlsZSBvYmplY3QgdGhhdCBhY2NlcHRzIGEgTm9kZS1zdHlsZVxuICogY2FsbGJhY2sgd2l0aCBhIGdpdmVuIGFycmF5IG9mIGFyZ3VtZW50cywgcGx1cyBhIHByb3ZpZGVkIGNhbGxiYWNrLlxuICogQHBhcmFtIG9iamVjdCBhbiBvYmplY3QgdGhhdCBoYXMgdGhlIG5hbWVkIG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgbmFtZSBvZiB0aGUgbWV0aG9kIG9mIG9iamVjdFxuICogQHBhcmFtIHtBcnJheX0gYXJncyBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgbWV0aG9kOyB0aGUgY2FsbGJhY2tcbiAqIHdpbGwgYmUgcHJvdmlkZWQgYnkgUSBhbmQgYXBwZW5kZWQgdG8gdGhlc2UgYXJndW1lbnRzLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgdmFsdWUgb3IgZXJyb3JcbiAqL1xuUS5ubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblEubnBvc3QgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lLCBhcmdzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5ucG9zdChuYW1lLCBhcmdzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUHJvbWlzZS5wcm90b3R5cGUubnBvc3QgPSBmdW5jdGlvbiAobmFtZSwgYXJncykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3MgfHwgW10pO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBub2RlQXJnc10pLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogQ2FsbHMgYSBtZXRob2Qgb2YgYSBOb2RlLXN0eWxlIG9iamVjdCB0aGF0IGFjY2VwdHMgYSBOb2RlLXN0eWxlXG4gKiBjYWxsYmFjaywgZm9yd2FyZGluZyB0aGUgZ2l2ZW4gdmFyaWFkaWMgYXJndW1lbnRzLCBwbHVzIGEgcHJvdmlkZWRcbiAqIGNhbGxiYWNrIGFyZ3VtZW50LlxuICogQHBhcmFtIG9iamVjdCBhbiBvYmplY3QgdGhhdCBoYXMgdGhlIG5hbWVkIG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgbmFtZSBvZiB0aGUgbWV0aG9kIG9mIG9iamVjdFxuICogQHBhcmFtIC4uLmFyZ3MgYXJndW1lbnRzIHRvIHBhc3MgdG8gdGhlIG1ldGhvZDsgdGhlIGNhbGxiYWNrIHdpbGxcbiAqIGJlIHByb3ZpZGVkIGJ5IFEgYW5kIGFwcGVuZGVkIHRvIHRoZXNlIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHZhbHVlIG9yIGVycm9yXG4gKi9cblEubnNlbmQgPSAvLyBYWFggQmFzZWQgb24gTWFyayBNaWxsZXIncyBwcm9wb3NlZCBcInNlbmRcIlxuUS5ubWNhbGwgPSAvLyBYWFggQmFzZWQgb24gXCJSZWRzYW5kcm8nc1wiIHByb3Bvc2FsXG5RLm5pbnZva2UgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAyKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICBRKG9iamVjdCkuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBub2RlQXJnc10pLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5zZW5kID0gLy8gWFhYIEJhc2VkIG9uIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgXCJzZW5kXCJcblByb21pc2UucHJvdG90eXBlLm5tY2FsbCA9IC8vIFhYWCBCYXNlZCBvbiBcIlJlZHNhbmRybydzXCIgcHJvcG9zYWxcblByb21pc2UucHJvdG90eXBlLm5pbnZva2UgPSBmdW5jdGlvbiAobmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIG5vZGVBcmdzXSkuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBJZiBhIGZ1bmN0aW9uIHdvdWxkIGxpa2UgdG8gc3VwcG9ydCBib3RoIE5vZGUgY29udGludWF0aW9uLXBhc3Npbmctc3R5bGUgYW5kXG4gKiBwcm9taXNlLXJldHVybmluZy1zdHlsZSwgaXQgY2FuIGVuZCBpdHMgaW50ZXJuYWwgcHJvbWlzZSBjaGFpbiB3aXRoXG4gKiBgbm9kZWlmeShub2RlYmFjaylgLCBmb3J3YXJkaW5nIHRoZSBvcHRpb25hbCBub2RlYmFjayBhcmd1bWVudC4gIElmIHRoZSB1c2VyXG4gKiBlbGVjdHMgdG8gdXNlIGEgbm9kZWJhY2ssIHRoZSByZXN1bHQgd2lsbCBiZSBzZW50IHRoZXJlLiAgSWYgdGhleSBkbyBub3RcbiAqIHBhc3MgYSBub2RlYmFjaywgdGhleSB3aWxsIHJlY2VpdmUgdGhlIHJlc3VsdCBwcm9taXNlLlxuICogQHBhcmFtIG9iamVjdCBhIHJlc3VsdCAob3IgYSBwcm9taXNlIGZvciBhIHJlc3VsdClcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG5vZGViYWNrIGEgTm9kZS5qcy1zdHlsZSBjYWxsYmFja1xuICogQHJldHVybnMgZWl0aGVyIHRoZSBwcm9taXNlIG9yIG5vdGhpbmdcbiAqL1xuUS5ub2RlaWZ5ID0gbm9kZWlmeTtcbmZ1bmN0aW9uIG5vZGVpZnkob2JqZWN0LCBub2RlYmFjaykge1xuICAgIHJldHVybiBRKG9iamVjdCkubm9kZWlmeShub2RlYmFjayk7XG59XG5cblByb21pc2UucHJvdG90eXBlLm5vZGVpZnkgPSBmdW5jdGlvbiAobm9kZWJhY2spIHtcbiAgICBpZiAobm9kZWJhY2spIHtcbiAgICAgICAgdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbm9kZWJhY2sobnVsbCwgdmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbm9kZWJhY2soZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn07XG5cblEubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlEubm9Db25mbGljdCBvbmx5IHdvcmtzIHdoZW4gUSBpcyB1c2VkIGFzIGEgZ2xvYmFsXCIpO1xufTtcblxuLy8gQWxsIGNvZGUgYmVmb3JlIHRoaXMgcG9pbnQgd2lsbCBiZSBmaWx0ZXJlZCBmcm9tIHN0YWNrIHRyYWNlcy5cbnZhciBxRW5kaW5nTGluZSA9IGNhcHR1cmVMaW5lKCk7XG5cbnJldHVybiBRO1xuXG59KTtcbiIsIi8vIENvcHlyaWdodCAyMDEzLTIwMTQgS2V2aW4gQ294XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4qICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgVGhpcyBzb2Z0d2FyZSBpcyBwcm92aWRlZCAnYXMtaXMnLCB3aXRob3V0IGFueSBleHByZXNzIG9yIGltcGxpZWQgICAgICAgICAgICpcbiogIHdhcnJhbnR5LiBJbiBubyBldmVudCB3aWxsIHRoZSBhdXRob3JzIGJlIGhlbGQgbGlhYmxlIGZvciBhbnkgZGFtYWdlcyAgICAgICAqXG4qICBhcmlzaW5nIGZyb20gdGhlIHVzZSBvZiB0aGlzIHNvZnR3YXJlLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiogIFBlcm1pc3Npb24gaXMgZ3JhbnRlZCB0byBhbnlvbmUgdG8gdXNlIHRoaXMgc29mdHdhcmUgZm9yIGFueSBwdXJwb3NlLCAgICAgICAqXG4qICBpbmNsdWRpbmcgY29tbWVyY2lhbCBhcHBsaWNhdGlvbnMsIGFuZCB0byBhbHRlciBpdCBhbmQgcmVkaXN0cmlidXRlIGl0ICAgICAgKlxuKiAgZnJlZWx5LCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgcmVzdHJpY3Rpb25zOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4qICAxLiBUaGUgb3JpZ2luIG9mIHRoaXMgc29mdHdhcmUgbXVzdCBub3QgYmUgbWlzcmVwcmVzZW50ZWQ7IHlvdSBtdXN0IG5vdCAgICAgKlxuKiAgICAgY2xhaW0gdGhhdCB5b3Ugd3JvdGUgdGhlIG9yaWdpbmFsIHNvZnR3YXJlLiBJZiB5b3UgdXNlIHRoaXMgc29mdHdhcmUgaW4gICpcbiogICAgIGEgcHJvZHVjdCwgYW4gYWNrbm93bGVkZ21lbnQgaW4gdGhlIHByb2R1Y3QgZG9jdW1lbnRhdGlvbiB3b3VsZCBiZSAgICAgICAqXG4qICAgICBhcHByZWNpYXRlZCBidXQgaXMgbm90IHJlcXVpcmVkLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiogIDIuIEFsdGVyZWQgc291cmNlIHZlcnNpb25zIG11c3QgYmUgcGxhaW5seSBtYXJrZWQgYXMgc3VjaCwgYW5kIG11c3Qgbm90IGJlICAqXG4qICAgICBtaXNyZXByZXNlbnRlZCBhcyBiZWluZyB0aGUgb3JpZ2luYWwgc29mdHdhcmUuICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiogIDMuIFRoaXMgbm90aWNlIG1heSBub3QgYmUgcmVtb3ZlZCBvciBhbHRlcmVkIGZyb20gYW55IHNvdXJjZSBkaXN0cmlidXRpb24uICAqXG4qICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuK2Z1bmN0aW9uKCl7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGFycmF5ID0gL1xcWyhbXlxcW10qKVxcXSQvO1xuXG4vLy8gVVJMIFJlZ2V4LlxuLyoqXG4gKiBUaGlzIHJlZ2V4IHNwbGl0cyB0aGUgVVJMIGludG8gcGFydHMuICBUaGUgY2FwdHVyZSBncm91cHMgY2F0Y2ggdGhlIGltcG9ydGFudFxuICogYml0cy5cbiAqIFxuICogRWFjaCBzZWN0aW9uIGlzIG9wdGlvbmFsLCBzbyB0byB3b3JrIG9uIGFueSBwYXJ0IGZpbmQgdGhlIGNvcnJlY3QgdG9wIGxldmVsXG4gKiBgKC4uLik/YCBhbmQgbWVzcyBhcm91bmQgd2l0aCBpdC5cbiAqL1xudmFyIHJlZ2V4ID0gL14oPzooW2Etel0qKTopPyg/OlxcL1xcLyk/KD86KFteOkBdKikoPzo6KFteQF0qKSk/QCk/KFthLXotLl9dKyk/KD86OihbMC05XSopKT8oXFwvW14/I10qKT8oPzpcXD8oW14jXSopKT8oPzojKC4qKSk/JC9pO1xuLy8gICAgICAgICAgICAgICAxIC0gc2NoZW1lICAgICAgICAgICAgICAgIDIgLSB1c2VyICAgIDMgPSBwYXNzIDQgLSBob3N0ICAgICAgICA1IC0gcG9ydCAgNiAtIHBhdGggICAgICAgIDcgLSBxdWVyeSAgICA4IC0gaGFzaFxuXG52YXIgbm9zbGFzaCA9IFtcIm1haWx0b1wiLFwiYml0Y29pblwiXTtcblxudmFyIHNlbGYgPSB7XG5cdC8qKiBQYXJzZSBhIHF1ZXJ5IHN0cmluZy5cblx0ICpcblx0ICogVGhpcyBmdW5jdGlvbiBwYXJzZXMgYSBxdWVyeSBzdHJpbmcgKHNvbWV0aW1lcyBjYWxsZWQgdGhlIHNlYXJjaFxuXHQgKiBzdHJpbmcpLiAgSXQgdGFrZXMgYSBxdWVyeSBzdHJpbmcgYW5kIHJldHVybnMgYSBtYXAgb2YgdGhlIHJlc3VsdHMuXG5cdCAqXG5cdCAqIEtleXMgYXJlIGNvbnNpZGVyZWQgdG8gYmUgZXZlcnl0aGluZyB1cCB0byB0aGUgZmlyc3QgJz0nIGFuZCB2YWx1ZXMgYXJlXG5cdCAqIGV2ZXJ5dGhpbmcgYWZ0ZXJ3b3Jkcy4gIFNpbmNlIFVSTC1kZWNvZGluZyBpcyBkb25lIGFmdGVyIHBhcnNpbmcsIGtleXNcblx0ICogYW5kIHZhbHVlcyBjYW4gaGF2ZSBhbnkgdmFsdWVzLCBob3dldmVyLCAnPScgaGF2ZSB0byBiZSBlbmNvZGVkIGluIGtleXNcblx0ICogd2hpbGUgJz8nIGFuZCAnJicgaGF2ZSB0byBiZSBlbmNvZGVkIGFueXdoZXJlIChhcyB0aGV5IGRlbGltaXQgdGhlXG5cdCAqIGt2LXBhaXJzKS5cblx0ICpcblx0ICogS2V5cyBhbmQgdmFsdWVzIHdpbGwgYWx3YXlzIGJlIHN0cmluZ3MsIGV4Y2VwdCBpZiB0aGVyZSBpcyBhIGtleSB3aXRoIG5vXG5cdCAqICc9JyBpbiB3aGljaCBjYXNlIGl0IHdpbGwgYmUgY29uc2lkZXJlZCBhIGZsYWcgYW5kIHdpbGwgYmUgc2V0IHRvIHRydWUuXG5cdCAqIExhdGVyIHZhbHVlcyB3aWxsIG92ZXJyaWRlIGVhcmxpZXIgdmFsdWVzLlxuXHQgKlxuXHQgKiBBcnJheSBrZXlzIGFyZSBhbHNvIHN1cHBvcnRlZC4gIEJ5IGRlZmF1bHQga2V5cyBpbiB0aGUgZm9ybSBvZiBgbmFtZVtpXWBcblx0ICogd2lsbCBiZSByZXR1cm5lZCBsaWtlIHRoYXQgYXMgc3RyaW5ncy4gIEhvd2V2ZXIsIGlmIHlvdSBzZXQgdGhlIGBhcnJheWBcblx0ICogZmxhZyBpbiB0aGUgb3B0aW9ucyBvYmplY3QgdGhleSB3aWxsIGJlIHBhcnNlZCBpbnRvIGFycmF5cy4gIE5vdGUgdGhhdFxuXHQgKiBhbHRob3VnaCB0aGUgb2JqZWN0IHJldHVybmVkIGlzIGFuIGBBcnJheWAgb2JqZWN0IGFsbCBrZXlzIHdpbGwgYmVcblx0ICogd3JpdHRlbiB0byBpdC4gIFRoaXMgbWVhbnMgdGhhdCBpZiB5b3UgaGF2ZSBhIGtleSBzdWNoIGFzIGBrW2ZvckVhY2hdYFxuXHQgKiBpdCB3aWxsIG92ZXJ3cml0ZSB0aGUgYGZvckVhY2hgIGZ1bmN0aW9uIG9uIHRoYXQgYXJyYXkuICBBbHNvIG5vdGUgdGhhdFxuXHQgKiBzdHJpbmcgcHJvcGVydGllcyBhbHdheXMgdGFrZSBwcmVjZWRlbmNlIG92ZXIgYXJyYXkgcHJvcGVydGllcyxcblx0ICogaXJyZXNwZWN0aXZlIG9mIHdoZXJlIHRoZXkgYXJlIGluIHRoZSBxdWVyeSBzdHJpbmcuXG5cdCAqXG5cdCAqICAgdXJsLmdldChcImFycmF5WzFdPXRlc3QmYXJyYXlbZm9vXT1iYXJcIix7YXJyYXk6dHJ1ZX0pLmFycmF5WzFdICA9PT0gXCJ0ZXN0XCJcblx0ICogICB1cmwuZ2V0KFwiYXJyYXlbMV09dGVzdCZhcnJheVtmb29dPWJhclwiLHthcnJheTp0cnVlfSkuYXJyYXkuZm9vID09PSBcImJhclwiXG5cdCAqICAgdXJsLmdldChcImFycmF5PW5vdGFuYXJyYXkmYXJyYXlbMF09MVwiLHthcnJheTp0cnVlfSkuYXJyYXkgICAgICA9PT0gXCJub3RhbmFycmF5XCJcblx0ICpcblx0ICogSWYgYXJyYXkgcGFyc2luZyBpcyBlbmFibGVkIGtleXMgaW4gdGhlIGZvcm0gb2YgYG5hbWVbXWAgd2lsbFxuXHQgKiBhdXRvbWF0aWNhbGx5IGJlIGdpdmVuIHRoZSBuZXh0IGF2YWlsYWJsZSBpbmRleC4gIE5vdGUgdGhhdCB0aGlzIGNhbiBiZVxuXHQgKiBvdmVyd3JpdHRlbiB3aXRoIGxhdGVyIHZhbHVlcyBpbiB0aGUgcXVlcnkgc3RyaW5nLiAgRm9yIHRoaXMgcmVhc29uIGlzXG5cdCAqIGlzIGJlc3Qgbm90IHRvIG1peCB0aGUgdHdvIGZvcm1hdHMsIGFsdGhvdWdoIGl0IGlzIHNhZmUgKGFuZCBvZnRlblxuXHQgKiB1c2VmdWwpIHRvIGFkZCBhbiBhdXRvbWF0aWMgaW5kZXggYXJndW1lbnQgdG8gdGhlIGVuZCBvZiBhIHF1ZXJ5IHN0cmluZy5cblx0ICpcblx0ICogICB1cmwuZ2V0KFwiYVtdPTAmYVtdPTEmYVswXT0yXCIsIHthcnJheTp0cnVlfSkgIC0+IHthOltcIjJcIixcIjFcIl19O1xuXHQgKiAgIHVybC5nZXQoXCJhWzBdPTAmYVsxXT0xJmFbXT0yXCIsIHthcnJheTp0cnVlfSkgLT4ge2E6W1wiMFwiLFwiMVwiLFwiMlwiXX07XG5cdCAqXG5cdCAqIEBwYXJhbXtzdHJpbmd9IHEgVGhlIHF1ZXJ5IHN0cmluZyAodGhlIHBhcnQgYWZ0ZXIgdGhlICc/JykuXG5cdCAqIEBwYXJhbXt7ZnVsbDpib29sZWFuLGFycmF5OmJvb2xlYW59PX0gb3B0IE9wdGlvbnMuXG5cdCAqXG5cdCAqIC0gZnVsbDogSWYgc2V0IGBxYCB3aWxsIGJlIHRyZWF0ZWQgYXMgYSBmdWxsIHVybCBhbmQgYHFgIHdpbGwgYmUgYnVpbHQuXG5cdCAqICAgYnkgY2FsbGluZyAjcGFyc2UgdG8gcmV0cmlldmUgdGhlIHF1ZXJ5IHBvcnRpb24uXG5cdCAqIC0gYXJyYXk6IElmIHNldCBrZXlzIGluIHRoZSBmb3JtIG9mIGBrZXlbaV1gIHdpbGwgYmUgdHJlYXRlZFxuXHQgKiAgIGFzIGFycmF5cy9tYXBzLlxuXHQgKlxuXHQgKiBAcmV0dXJueyFPYmplY3QuPHN0cmluZywgc3RyaW5nfEFycmF5Pn0gVGhlIHBhcnNlZCByZXN1bHQuXG5cdCAqL1xuXHRcImdldFwiOiBmdW5jdGlvbihxLCBvcHQpe1xuXHRcdHEgPSBxIHx8IFwiXCI7XG5cdFx0aWYgKCB0eXBlb2Ygb3B0ICAgICAgICAgID09IFwidW5kZWZpbmVkXCIgKSBvcHQgPSB7fTtcblx0XHRpZiAoIHR5cGVvZiBvcHRbXCJmdWxsXCJdICA9PSBcInVuZGVmaW5lZFwiICkgb3B0W1wiZnVsbFwiXSA9IGZhbHNlO1xuXHRcdGlmICggdHlwZW9mIG9wdFtcImFycmF5XCJdID09IFwidW5kZWZpbmVkXCIgKSBvcHRbXCJhcnJheVwiXSA9IGZhbHNlO1xuXHRcdFxuXHRcdGlmICggb3B0W1wiZnVsbFwiXSA9PT0gdHJ1ZSApXG5cdFx0e1xuXHRcdFx0cSA9IHNlbGZbXCJwYXJzZVwiXShxLCB7XCJnZXRcIjpmYWxzZX0pW1wicXVlcnlcIl0gfHwgXCJcIjtcblx0XHR9XG5cdFx0XG5cdFx0dmFyIG8gPSB7fTtcblx0XHRcblx0XHR2YXIgYyA9IHEuc3BsaXQoXCImXCIpO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYy5sZW5ndGg7IGkrKylcblx0XHR7XG5cdFx0XHRpZiAoIWNbaV0ubGVuZ3RoKSBjb250aW51ZTtcblx0XHRcdFxuXHRcdFx0dmFyIGQgPSBjW2ldLmluZGV4T2YoXCI9XCIpO1xuXHRcdFx0dmFyIGsgPSBjW2ldLCB2ID0gdHJ1ZTtcblx0XHRcdGlmICggZCA+PSAwIClcblx0XHRcdHtcblx0XHRcdFx0ayA9IGNbaV0uc3Vic3RyKDAsIGQpO1xuXHRcdFx0XHR2ID0gY1tpXS5zdWJzdHIoZCsxKTtcblx0XHRcdFx0XG5cdFx0XHRcdHYgPSBkZWNvZGVVUklDb21wb25lbnQodik7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGlmIChvcHRbXCJhcnJheVwiXSlcblx0XHRcdHtcblx0XHRcdFx0dmFyIGluZHMgPSBbXTtcblx0XHRcdFx0dmFyIGluZDtcblx0XHRcdFx0dmFyIGN1cm8gPSBvO1xuXHRcdFx0XHR2YXIgY3VyayA9IGs7XG5cdFx0XHRcdHdoaWxlIChpbmQgPSBjdXJrLm1hdGNoKGFycmF5KSkgLy8gQXJyYXkhXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjdXJrID0gY3Vyay5zdWJzdHIoMCwgaW5kLmluZGV4KTtcblx0XHRcdFx0XHRpbmRzLnVuc2hpZnQoZGVjb2RlVVJJQ29tcG9uZW50KGluZFsxXSkpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGN1cmsgPSBkZWNvZGVVUklDb21wb25lbnQoY3Vyayk7XG5cdFx0XHRcdGlmIChpbmRzLnNvbWUoZnVuY3Rpb24oaSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmICggdHlwZW9mIGN1cm9bY3Vya10gPT0gXCJ1bmRlZmluZWRcIiApIGN1cm9bY3Vya10gPSBbXTtcblx0XHRcdFx0XHRpZiAoIUFycmF5LmlzQXJyYXkoY3Vyb1tjdXJrXSkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhcInVybC5nZXQ6IEFycmF5IHByb3BlcnR5IFwiK2N1cmsrXCIgYWxyZWFkeSBleGlzdHMgYXMgc3RyaW5nIVwiKTtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0XHRjdXJvID0gY3Vyb1tjdXJrXTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRpZiAoIGkgPT09IFwiXCIgKSBpID0gY3Vyby5sZW5ndGg7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Y3VyayA9IGk7XG5cdFx0XHRcdH0pKSBjb250aW51ZTtcblx0XHRcdFx0Y3Vyb1tjdXJrXSA9IHY7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRrID0gZGVjb2RlVVJJQ29tcG9uZW50KGspO1xuXHRcdFx0XG5cdFx0XHQvL3R5cGVvZiBvW2tdID09IFwidW5kZWZpbmVkXCIgfHwgY29uc29sZS5sb2coXCJQcm9wZXJ0eSBcIitrK1wiIGFscmVhZHkgZXhpc3RzIVwiKTtcblx0XHRcdG9ba10gPSB2O1xuXHRcdH1cblx0XHRcblx0XHRyZXR1cm4gbztcblx0fSxcblx0XG5cdC8qKiBCdWlsZCBhIGdldCBxdWVyeSBmcm9tIGFuIG9iamVjdC5cblx0ICpcblx0ICogVGhpcyBjb25zdHJ1Y3RzIGEgcXVlcnkgc3RyaW5nIGZyb20gdGhlIGt2IHBhaXJzIGluIGBkYXRhYC4gIENhbGxpbmdcblx0ICogI2dldCBvbiB0aGUgc3RyaW5nIHJldHVybmVkIHNob3VsZCByZXR1cm4gYW4gb2JqZWN0IGlkZW50aWNhbCB0byB0aGUgb25lXG5cdCAqIHBhc3NlZCBpbiBleGNlcHQgYWxsIG5vbi1ib29sZWFuIHNjYWxhciB0eXBlcyBiZWNvbWUgc3RyaW5ncyBhbmQgYWxsXG5cdCAqIG9iamVjdCB0eXBlcyBiZWNvbWUgYXJyYXlzIChub24taW50ZWdlciBrZXlzIGFyZSBzdGlsbCBwcmVzZW50LCBzZWVcblx0ICogI2dldCdzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgZGV0YWlscykuXG5cdCAqXG5cdCAqIFRoaXMgYWx3YXlzIHVzZXMgYXJyYXkgc3ludGF4IGZvciBkZXNjcmliaW5nIGFycmF5cy4gIElmIHlvdSB3YW50IHRvXG5cdCAqIHNlcmlhbGl6ZSB0aGVtIGRpZmZlcmVudGx5IChsaWtlIGhhdmluZyB0aGUgdmFsdWUgYmUgYSBKU09OIGFycmF5IGFuZFxuXHQgKiBoYXZlIGEgcGxhaW4ga2V5KSB5b3Ugd2lsbCBuZWVkIHRvIGRvIHRoYXQgYmVmb3JlIHBhc3NpbmcgaXQgaW4uXG5cdCAqXG5cdCAqIEFsbCBrZXlzIGFuZCB2YWx1ZXMgYXJlIHN1cHBvcnRlZCAoYmluYXJ5IGRhdGEgYW55b25lPykgYXMgdGhleSBhcmVcblx0ICogcHJvcGVybHkgVVJMLWVuY29kZWQgYW5kICNnZXQgcHJvcGVybHkgZGVjb2Rlcy5cblx0ICpcblx0ICogQHBhcmFte09iamVjdH0gZGF0YSBUaGUga3YgcGFpcnMuXG5cdCAqIEBwYXJhbXtzdHJpbmd9IHByZWZpeCBUaGUgcHJvcGVybHkgZW5jb2RlZCBhcnJheSBrZXkgdG8gcHV0IHRoZVxuXHQgKiAgIHByb3BlcnRpZXMuICBNYWlubHkgaW50ZW5kZWQgZm9yIGludGVybmFsIHVzZS5cblx0ICogQHJldHVybntzdHJpbmd9IEEgVVJMLXNhZmUgc3RyaW5nLlxuXHQgKi9cblx0XCJidWlsZGdldFwiOiBmdW5jdGlvbihkYXRhLCBwcmVmaXgpe1xuXHRcdHZhciBpdG1zID0gW107XG5cdFx0Zm9yICggdmFyIGsgaW4gZGF0YSApXG5cdFx0e1xuXHRcdFx0dmFyIGVrID0gZW5jb2RlVVJJQ29tcG9uZW50KGspO1xuXHRcdFx0aWYgKCB0eXBlb2YgcHJlZml4ICE9IFwidW5kZWZpbmVkXCIgKVxuXHRcdFx0XHRlayA9IHByZWZpeCtcIltcIitlaytcIl1cIjtcblx0XHRcdFxuXHRcdFx0dmFyIHYgPSBkYXRhW2tdO1xuXHRcdFx0XG5cdFx0XHRzd2l0Y2ggKHR5cGVvZiB2KVxuXHRcdFx0e1xuXHRcdFx0XHRjYXNlICdib29sZWFuJzpcblx0XHRcdFx0XHRpZih2KSBpdG1zLnB1c2goZWspO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdudW1iZXInOlxuXHRcdFx0XHRcdHYgPSB2LnRvU3RyaW5nKCk7XG5cdFx0XHRcdGNhc2UgJ3N0cmluZyc6XG5cdFx0XHRcdFx0aXRtcy5wdXNoKGVrK1wiPVwiK2VuY29kZVVSSUNvbXBvbmVudCh2KSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ29iamVjdCc6XG5cdFx0XHRcdFx0aXRtcy5wdXNoKHNlbGZbXCJidWlsZGdldFwiXSh2LCBlaykpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gaXRtcy5qb2luKFwiJlwiKTtcblx0fSxcblx0XG5cdC8qKiBQYXJzZSBhIFVSTFxuXHQgKiBcblx0ICogVGhpcyBicmVha3MgdXAgYSBVUkwgaW50byBjb21wb25lbnRzLiAgSXQgYXR0ZW1wdHMgdG8gYmUgdmVyeSBsaWJlcmFsXG5cdCAqIGFuZCByZXR1cm5zIHRoZSBiZXN0IHJlc3VsdCBpbiBtb3N0IGNhc2VzLiAgVGhpcyBtZWFucyB0aGF0IHlvdSBjYW5cblx0ICogb2Z0ZW4gcGFzcyBpbiBwYXJ0IG9mIGEgVVJMIGFuZCBnZXQgY29ycmVjdCBjYXRlZ29yaWVzIGJhY2suICBOb3RhYmx5LFxuXHQgKiB0aGlzIHdvcmtzIGZvciBlbWFpbHMgYW5kIEphYmJlciBJRHMsIGFzIHdlbGwgYXMgYWRkaW5nIGEgJz8nIHRvIHRoZVxuXHQgKiBiZWdpbm5pbmcgb2YgYSBzdHJpbmcgd2lsbCBwYXJzZSB0aGUgd2hvbGUgdGhpbmcgYXMgYSBxdWVyeSBzdHJpbmcuICBJZlxuXHQgKiBhbiBpdGVtIGlzIG5vdCBmb3VuZCB0aGUgcHJvcGVydHkgd2lsbCBiZSB1bmRlZmluZWQuICBJbiBzb21lIGNhc2VzIGFuXG5cdCAqIGVtcHR5IHN0cmluZyB3aWxsIGJlIHJldHVybmVkIGlmIHRoZSBzdXJyb3VuZGluZyBzeW50YXggYnV0IHRoZSBhY3R1YWxcblx0ICogdmFsdWUgaXMgZW1wdHkgKGV4YW1wbGU6IFwiOi8vZXhhbXBsZS5jb21cIiB3aWxsIGdpdmUgYSBlbXB0eSBzdHJpbmcgZm9yXG5cdCAqIHNjaGVtZS4pICBOb3RhYmx5IHRoZSBob3N0IG5hbWUgd2lsbCBhbHdheXMgYmUgc2V0IHRvIHNvbWV0aGluZy5cblx0ICogXG5cdCAqIFJldHVybmVkIHByb3BlcnRpZXMuXG5cdCAqIFxuXHQgKiAtICoqc2NoZW1lOioqIFRoZSB1cmwgc2NoZW1lLiAoZXg6IFwibWFpbHRvXCIgb3IgXCJodHRwc1wiKVxuXHQgKiAtICoqdXNlcjoqKiBUaGUgdXNlcm5hbWUuXG5cdCAqIC0gKipwYXNzOioqIFRoZSBwYXNzd29yZC5cblx0ICogLSAqKmhvc3Q6KiogVGhlIGhvc3RuYW1lLiAoZXg6IFwibG9jYWxob3N0XCIsIFwiMTIzLjQ1Ni43LjhcIiBvciBcImV4YW1wbGUuY29tXCIpXG5cdCAqIC0gKipwb3J0OioqIFRoZSBwb3J0LCBhcyBhIG51bWJlci4gKGV4OiAxMzM3KVxuXHQgKiAtICoqcGF0aDoqKiBUaGUgcGF0aC4gKGV4OiBcIi9cIiBvciBcIi9hYm91dC5odG1sXCIpXG5cdCAqIC0gKipxdWVyeToqKiBcIlRoZSBxdWVyeSBzdHJpbmcuIChleDogXCJmb289YmFyJnY9MTcmZm9ybWF0PWpzb25cIilcblx0ICogLSAqKmdldDoqKiBUaGUgcXVlcnkgc3RyaW5nIHBhcnNlZCB3aXRoIGdldC4gIElmIGBvcHQuZ2V0YCBpcyBgZmFsc2VgIHRoaXNcblx0ICogICB3aWxsIGJlIGFic2VudFxuXHQgKiAtICoqaGFzaDoqKiBUaGUgdmFsdWUgYWZ0ZXIgdGhlIGhhc2guIChleDogXCJteWFuY2hvclwiKVxuXHQgKiAgIGJlIHVuZGVmaW5lZCBldmVuIGlmIGBxdWVyeWAgaXMgc2V0LlxuXHQgKlxuXHQgKiBAcGFyYW17c3RyaW5nfSB1cmwgVGhlIFVSTCB0byBwYXJzZS5cblx0ICogQHBhcmFte3tnZXQ6T2JqZWN0fT19IG9wdCBPcHRpb25zOlxuXHQgKlxuXHQgKiAtIGdldDogQW4gb3B0aW9ucyBhcmd1bWVudCB0byBiZSBwYXNzZWQgdG8gI2dldCBvciBmYWxzZSB0byBub3QgY2FsbCAjZ2V0LlxuXHQgKiAgICAqKkRPIE5PVCoqIHNldCBgZnVsbGAuXG5cdCAqXG5cdCAqIEByZXR1cm57IU9iamVjdH0gQW4gb2JqZWN0IHdpdGggdGhlIHBhcnNlZCB2YWx1ZXMuXG5cdCAqL1xuXHRcInBhcnNlXCI6IGZ1bmN0aW9uKHVybCwgb3B0KSB7XG5cdFx0XG5cdFx0aWYgKCB0eXBlb2Ygb3B0ID09IFwidW5kZWZpbmVkXCIgKSBvcHQgPSB7fTtcblx0XHRcblx0XHR2YXIgbWQgPSB1cmwubWF0Y2gocmVnZXgpIHx8IFtdO1xuXHRcdFxuXHRcdHZhciByID0ge1xuXHRcdFx0XCJ1cmxcIjogICAgdXJsLFxuXHRcdFx0XG5cdFx0XHRcInNjaGVtZVwiOiBtZFsxXSxcblx0XHRcdFwidXNlclwiOiAgIG1kWzJdLFxuXHRcdFx0XCJwYXNzXCI6ICAgbWRbM10sXG5cdFx0XHRcImhvc3RcIjogICBtZFs0XSxcblx0XHRcdFwicG9ydFwiOiAgIG1kWzVdICYmICttZFs1XSxcblx0XHRcdFwicGF0aFwiOiAgIG1kWzZdLFxuXHRcdFx0XCJxdWVyeVwiOiAgbWRbN10sXG5cdFx0XHRcImhhc2hcIjogICBtZFs4XSxcblx0XHR9O1xuXHRcdFxuXHRcdGlmICggb3B0LmdldCAhPT0gZmFsc2UgKVxuXHRcdFx0cltcImdldFwiXSA9IHJbXCJxdWVyeVwiXSAmJiBzZWxmW1wiZ2V0XCJdKHJbXCJxdWVyeVwiXSwgb3B0LmdldCk7XG5cdFx0XG5cdFx0cmV0dXJuIHI7XG5cdH0sXG5cdFxuXHQvKiogQnVpbGQgYSBVUkwgZnJvbSBjb21wb25lbnRzLlxuXHQgKiBcblx0ICogVGhpcyBwaWVjZXMgdG9nZXRoZXIgYSB1cmwgZnJvbSB0aGUgcHJvcGVydGllcyBvZiB0aGUgcGFzc2VkIGluIG9iamVjdC5cblx0ICogSW4gZ2VuZXJhbCBwYXNzaW5nIHRoZSByZXN1bHQgb2YgYHBhcnNlKClgIHNob3VsZCByZXR1cm4gdGhlIFVSTC4gIFRoZXJlXG5cdCAqIG1heSBkaWZmZXJlbmNlcyBpbiB0aGUgZ2V0IHN0cmluZyBhcyB0aGUga2V5cyBhbmQgdmFsdWVzIG1pZ2h0IGJlIG1vcmVcblx0ICogZW5jb2RlZCB0aGVuIHRoZXkgd2VyZSBvcmlnaW5hbGx5IHdlcmUuICBIb3dldmVyLCBjYWxsaW5nIGBnZXQoKWAgb24gdGhlXG5cdCAqIHR3byB2YWx1ZXMgc2hvdWxkIHlpZWxkIHRoZSBzYW1lIHJlc3VsdC5cblx0ICogXG5cdCAqIEhlcmUgaXMgaG93IHRoZSBwYXJhbWV0ZXJzIGFyZSB1c2VkLlxuXHQgKiBcblx0ICogIC0gdXJsOiBVc2VkIG9ubHkgaWYgbm8gb3RoZXIgdmFsdWVzIGFyZSBwcm92aWRlZC4gIElmIHRoYXQgaXMgdGhlIGNhc2Vcblx0ICogICAgIGB1cmxgIHdpbGwgYmUgcmV0dXJuZWQgdmVyYmF0aW0uXG5cdCAqICAtIHNjaGVtZTogVXNlZCBpZiBkZWZpbmVkLlxuXHQgKiAgLSB1c2VyOiBVc2VkIGlmIGRlZmluZWQuXG5cdCAqICAtIHBhc3M6IFVzZWQgaWYgZGVmaW5lZC5cblx0ICogIC0gaG9zdDogVXNlZCBpZiBkZWZpbmVkLlxuXHQgKiAgLSBwYXRoOiBVc2VkIGlmIGRlZmluZWQuXG5cdCAqICAtIHF1ZXJ5OiBVc2VkIG9ubHkgaWYgYGdldGAgaXMgbm90IHByb3ZpZGVkIGFuZCBub24tZW1wdHkuXG5cdCAqICAtIGdldDogVXNlZCBpZiBub24tZW1wdHkuICBQYXNzZWQgdG8gI2J1aWxkZ2V0IGFuZCB0aGUgcmVzdWx0IGlzIHVzZWRcblx0ICogICAgYXMgdGhlIHF1ZXJ5IHN0cmluZy5cblx0ICogIC0gaGFzaDogVXNlZCBpZiBkZWZpbmVkLlxuXHQgKiBcblx0ICogVGhlc2UgYXJlIHRoZSBvcHRpb25zIHRoYXQgYXJlIHZhbGlkIG9uIHRoZSBvcHRpb25zIG9iamVjdC5cblx0ICogXG5cdCAqICAtIHVzZWVtcHR5Z2V0OiBJZiB0cnV0aHksIGEgcXVlc3Rpb24gbWFyayB3aWxsIGJlIGFwcGVuZGVkIGZvciBlbXB0eSBnZXRcblx0ICogICAgc3RyaW5ncy4gIFRoaXMgbm90YWJseSBtYWtlcyBgYnVpbGQoKWAgYW5kIGBwYXJzZSgpYCBmdWxseSBzeW1tZXRyaWMuXG5cdCAqXG5cdCAqIEBwYXJhbXtPYmplY3R9IGRhdGEgVGhlIHBpZWNlcyBvZiB0aGUgVVJMLlxuXHQgKiBAcGFyYW17T2JqZWN0fSBvcHQgT3B0aW9ucyBmb3IgYnVpbGRpbmcgdGhlIHVybC5cblx0ICogQHJldHVybntzdHJpbmd9IFRoZSBVUkwuXG5cdCAqL1xuXHRcImJ1aWxkXCI6IGZ1bmN0aW9uKGRhdGEsIG9wdCl7XG5cdFx0b3B0ID0gb3B0IHx8IHt9O1xuXHRcdFxuXHRcdHZhciByID0gXCJcIjtcblx0XHRcblx0XHRpZiAoIHR5cGVvZiBkYXRhW1wic2NoZW1lXCJdICE9IFwidW5kZWZpbmVkXCIgKVxuXHRcdHtcblx0XHRcdHIgKz0gZGF0YVtcInNjaGVtZVwiXTtcblx0XHRcdHIgKz0gKG5vc2xhc2guaW5kZXhPZihkYXRhW1wic2NoZW1lXCJdKT49MCk/XCI6XCI6XCI6Ly9cIjtcblx0XHR9XG5cdFx0aWYgKCB0eXBlb2YgZGF0YVtcInVzZXJcIl0gIT0gXCJ1bmRlZmluZWRcIiApXG5cdFx0e1xuXHRcdFx0ciArPSBkYXRhW1widXNlclwiXTtcblx0XHRcdGlmICggdHlwZW9mIGRhdGFbXCJwYXNzXCJdID09IFwidW5kZWZpbmVkXCIgKVxuXHRcdFx0e1xuXHRcdFx0XHRyICs9IFwiQFwiO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAoIHR5cGVvZiBkYXRhW1wicGFzc1wiXSAhPSBcInVuZGVmaW5lZFwiICkgciArPSBcIjpcIiArIGRhdGFbXCJwYXNzXCJdICsgXCJAXCI7XG5cdFx0aWYgKCB0eXBlb2YgZGF0YVtcImhvc3RcIl0gIT0gXCJ1bmRlZmluZWRcIiApIHIgKz0gZGF0YVtcImhvc3RcIl07XG5cdFx0aWYgKCB0eXBlb2YgZGF0YVtcInBvcnRcIl0gIT0gXCJ1bmRlZmluZWRcIiApIHIgKz0gXCI6XCIgKyBkYXRhW1wicG9ydFwiXTtcblx0XHRpZiAoIHR5cGVvZiBkYXRhW1wicGF0aFwiXSAhPSBcInVuZGVmaW5lZFwiICkgciArPSBkYXRhW1wicGF0aFwiXTtcblx0XHRcblx0XHRpZiAob3B0W1widXNlZW1wdHlnZXRcIl0pXG5cdFx0e1xuXHRcdFx0aWYgICAgICAoIHR5cGVvZiBkYXRhW1wiZ2V0XCJdICAgIT0gXCJ1bmRlZmluZWRcIiApIHIgKz0gXCI/XCIgKyBzZWxmW1wiYnVpbGRnZXRcIl0oZGF0YVtcImdldFwiXSk7XG5cdFx0XHRlbHNlIGlmICggdHlwZW9mIGRhdGFbXCJxdWVyeVwiXSAhPSBcInVuZGVmaW5lZFwiICkgciArPSBcIj9cIiArIGRhdGFbXCJxdWVyeVwiXTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdC8vIElmIC5nZXQgdXNlIGl0LiAgSWYgLmdldCBsZWFkcyB0byBlbXB0eSwgdXNlIC5xdWVyeS5cblx0XHRcdHZhciBxID0gZGF0YVtcImdldFwiXSAmJiBzZWxmW1wiYnVpbGRnZXRcIl0oZGF0YVtcImdldFwiXSkgfHwgZGF0YVtcInF1ZXJ5XCJdO1xuXHRcdFx0aWYgKHEpIHIgKz0gXCI/XCIgKyBxO1xuXHRcdH1cblx0XHRcblx0XHRpZiAoIHR5cGVvZiBkYXRhW1wiaGFzaFwiXSAhPSBcInVuZGVmaW5lZFwiICkgciArPSBcIiNcIiArIGRhdGFbXCJoYXNoXCJdO1xuXHRcdFxuXHRcdHJldHVybiByIHx8IGRhdGFbXCJ1cmxcIl0gfHwgXCJcIjtcblx0fSxcbn07XG5cbmlmICggdHlwZW9mIGRlZmluZSAhPSBcInVuZGVmaW5lZFwiICYmIGRlZmluZVtcImFtZFwiXSApIGRlZmluZShzZWxmKTtcbmVsc2UgaWYgKCB0eXBlb2YgbW9kdWxlICE9IFwidW5kZWZpbmVkXCIgKSBtb2R1bGVbJ2V4cG9ydHMnXSA9IHNlbGY7XG5lbHNlIHdpbmRvd1tcInVybFwiXSA9IHNlbGY7XG5cbn0oKTtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0aWYgKCEobW9kdWxlSWQgaW4gX193ZWJwYWNrX21vZHVsZXNfXykpIHtcblx0XHRkZWxldGUgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0XHR2YXIgZSA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyBtb2R1bGVJZCArIFwiJ1wiKTtcblx0XHRlLmNvZGUgPSAnTU9EVUxFX05PVF9GT1VORCc7XG5cdFx0dGhyb3cgZTtcblx0fVxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8qIGdsb2JhbCAkIGpRdWVyeSBDUE8gQ29kZU1pcnJvciBzdG9yYWdlQVBJIFEgY3JlYXRlUHJvZ3JhbUNvbGxlY3Rpb25BUEkgbWFrZVNoYXJlQVBJICovXG5cbnZhciBzaGFyZUFQSSA9IG1ha2VTaGFyZUFQSShwcm9jZXNzLmVudi5DVVJSRU5UX1BZUkVUX1JFTEVBU0UpO1xuXG52YXIgdXJsID0gcmVxdWlyZSgndXJsLmpzJyk7XG52YXIgbW9kYWxQcm9tcHQgPSByZXF1aXJlKCcuL21vZGFsLXByb21wdC5qcycpO1xud2luZG93Lm1vZGFsUHJvbXB0ID0gbW9kYWxQcm9tcHQ7XG5cbmNvbnN0IExPRyA9IHRydWU7XG53aW5kb3cuY3RfbG9nID0gZnVuY3Rpb24oLyogdmFyYXJncyAqLykge1xuICBpZiAod2luZG93LmNvbnNvbGUgJiYgTE9HKSB7XG4gICAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKTtcbiAgfVxufTtcblxud2luZG93LmN0X2Vycm9yID0gZnVuY3Rpb24oLyogdmFyYXJncyAqLykge1xuICBpZiAod2luZG93LmNvbnNvbGUgJiYgTE9HKSB7XG4gICAgY29uc29sZS5lcnJvci5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpO1xuICB9XG59O1xudmFyIGluaXRpYWxQYXJhbXMgPSB1cmwucGFyc2UoZG9jdW1lbnQubG9jYXRpb24uaHJlZik7XG52YXIgcGFyYW1zID0gdXJsLnBhcnNlKFwiLz9cIiArIGluaXRpYWxQYXJhbXNbXCJoYXNoXCJdKTtcbndpbmRvdy5oaWdobGlnaHRNb2RlID0gXCJtY21oXCI7IC8vIHdoYXQgaXMgdGhpcyBmb3I/XG53aW5kb3cuY2xlYXJGbGFzaCA9IGZ1bmN0aW9uKCkge1xuICAkKFwiLm5vdGlmaWNhdGlvbkFyZWFcIikuZW1wdHkoKTtcbn1cbndpbmRvdy53aGl0ZVRvQmxhY2tOb3RpZmljYXRpb24gPSBmdW5jdGlvbigpIHtcbiAgLypcbiAgJChcIi5ub3RpZmljYXRpb25BcmVhIC5hY3RpdmVcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcIndoaXRlXCIpO1xuICAkKFwiLm5vdGlmaWNhdGlvbkFyZWEgLmFjdGl2ZVwiKS5hbmltYXRlKHtiYWNrZ3JvdW5kQ29sb3I6IFwiIzExMTExMVwiIH0sIDEwMDApO1xuICAqL1xufTtcbndpbmRvdy5zdGlja0Vycm9yID0gZnVuY3Rpb24obWVzc2FnZSwgbW9yZSkge1xuICBDUE8uc2F5QW5kRm9yZ2V0KG1lc3NhZ2UpO1xuICBjbGVhckZsYXNoKCk7XG4gIHZhciBlcnIgPSAkKFwiPHNwYW4+XCIpLmFkZENsYXNzKFwiZXJyb3JcIikudGV4dChtZXNzYWdlKTtcbiAgaWYobW9yZSkge1xuICAgIGVyci5hdHRyKFwidGl0bGVcIiwgbW9yZSk7XG4gIH1cbiAgZXJyLnRvb2x0aXAoKTtcbiAgJChcIi5ub3RpZmljYXRpb25BcmVhXCIpLnByZXBlbmQoZXJyKTtcbiAgd2hpdGVUb0JsYWNrTm90aWZpY2F0aW9uKCk7XG59O1xud2luZG93LmZsYXNoRXJyb3IgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gIENQTy5zYXlBbmRGb3JnZXQobWVzc2FnZSk7XG4gIGNsZWFyRmxhc2goKTtcbiAgdmFyIGVyciA9ICQoXCI8c3Bhbj5cIikuYWRkQ2xhc3MoXCJlcnJvclwiKS50ZXh0KG1lc3NhZ2UpO1xuICAkKFwiLm5vdGlmaWNhdGlvbkFyZWFcIikucHJlcGVuZChlcnIpO1xuICB3aGl0ZVRvQmxhY2tOb3RpZmljYXRpb24oKTtcbiAgZXJyLmZhZGVPdXQoNzAwMCk7XG59O1xud2luZG93LmZsYXNoTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgQ1BPLnNheUFuZEZvcmdldChtZXNzYWdlKTtcbiAgY2xlYXJGbGFzaCgpO1xuICB2YXIgbXNnID0gJChcIjxzcGFuPlwiKS5hZGRDbGFzcyhcImFjdGl2ZVwiKS50ZXh0KG1lc3NhZ2UpO1xuICAkKFwiLm5vdGlmaWNhdGlvbkFyZWFcIikucHJlcGVuZChtc2cpO1xuICB3aGl0ZVRvQmxhY2tOb3RpZmljYXRpb24oKTtcbiAgbXNnLmZhZGVPdXQoNzAwMCk7XG59O1xud2luZG93LnN0aWNrTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgQ1BPLnNheUFuZEZvcmdldChtZXNzYWdlKTtcbiAgY2xlYXJGbGFzaCgpO1xuICB2YXIgbXNnID0gJChcIjxzcGFuPlwiKS5hZGRDbGFzcyhcImFjdGl2ZVwiKS50ZXh0KG1lc3NhZ2UpO1xuICAkKFwiLm5vdGlmaWNhdGlvbkFyZWFcIikucHJlcGVuZChtc2cpO1xuICB3aGl0ZVRvQmxhY2tOb3RpZmljYXRpb24oKTtcbn07XG53aW5kb3cuc3RpY2tSaWNoTWVzc2FnZSA9IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgQ1BPLnNheUFuZEZvcmdldChjb250ZW50LnRleHQoKSk7XG4gIGNsZWFyRmxhc2goKTtcbiAgJChcIi5ub3RpZmljYXRpb25BcmVhXCIpLnByZXBlbmQoJChcIjxzcGFuPlwiKS5hZGRDbGFzcyhcImFjdGl2ZVwiKS5hcHBlbmQoY29udGVudCkpO1xuICB3aGl0ZVRvQmxhY2tOb3RpZmljYXRpb24oKTtcbn07XG53aW5kb3cubWtXYXJuaW5nVXBwZXIgPSBmdW5jdGlvbigpe3JldHVybiAkKFwiPGRpdiBjbGFzcz0nd2FybmluZy11cHBlcic+XCIpO31cbndpbmRvdy5ta1dhcm5pbmdMb3dlciA9IGZ1bmN0aW9uKCl7cmV0dXJuICQoXCI8ZGl2IGNsYXNzPSd3YXJuaW5nLWxvd2VyJz5cIik7fVxuXG52YXIgRG9jdW1lbnRzID0gZnVuY3Rpb24oKSB7XG5cbiAgZnVuY3Rpb24gRG9jdW1lbnRzKCkge1xuICAgIHRoaXMuZG9jdW1lbnRzID0gbmV3IE1hcCgpO1xuICB9XG5cbiAgRG9jdW1lbnRzLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHJldHVybiB0aGlzLmRvY3VtZW50cy5oYXMobmFtZSk7XG4gIH07XG5cbiAgRG9jdW1lbnRzLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHJldHVybiB0aGlzLmRvY3VtZW50cy5nZXQobmFtZSk7XG4gIH07XG5cbiAgRG9jdW1lbnRzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAobmFtZSwgZG9jKSB7XG4gICAgaWYobG9nZ2VyLmlzRGV0YWlsZWQpXG4gICAgICBsb2dnZXIubG9nKFwiZG9jLnNldFwiLCB7bmFtZTogbmFtZSwgdmFsdWU6IGRvYy5nZXRWYWx1ZSgpfSk7XG4gICAgcmV0dXJuIHRoaXMuZG9jdW1lbnRzLnNldChuYW1lLCBkb2MpO1xuICB9O1xuXG4gIERvY3VtZW50cy5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBpZihsb2dnZXIuaXNEZXRhaWxlZClcbiAgICAgIGxvZ2dlci5sb2coXCJkb2MuZGVsXCIsIHtuYW1lOiBuYW1lfSk7XG4gICAgcmV0dXJuIHRoaXMuZG9jdW1lbnRzLmRlbGV0ZShuYW1lKTtcbiAgfTtcblxuICBEb2N1bWVudHMucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiAoZikge1xuICAgIHJldHVybiB0aGlzLmRvY3VtZW50cy5mb3JFYWNoKGYpO1xuICB9O1xuXG4gIHJldHVybiBEb2N1bWVudHM7XG59KCk7XG5cbnZhciBWRVJTSU9OX0NIRUNLX0lOVEVSVkFMID0gMTIwMDAwICsgKDMwMDAwICogTWF0aC5yYW5kb20oKSk7XG5cbmZ1bmN0aW9uIGNoZWNrVmVyc2lvbigpIHtcbiAgJC5nZXQoXCIvY3VycmVudC12ZXJzaW9uXCIpLnRoZW4oZnVuY3Rpb24ocmVzcCkge1xuICAgIHJlc3AgPSBKU09OLnBhcnNlKHJlc3ApO1xuICAgIGlmKHJlc3AudmVyc2lvbiAmJiByZXNwLnZlcnNpb24gIT09IHByb2Nlc3MuZW52LkNVUlJFTlRfUFlSRVRfUkVMRUFTRSkge1xuICAgICAgd2luZG93LmZsYXNoTWVzc2FnZShcIkEgbmV3IHZlcnNpb24gb2YgUHlyZXQgaXMgYXZhaWxhYmxlLiBTYXZlIGFuZCByZWxvYWQgdGhlIHBhZ2UgdG8gZ2V0IHRoZSBuZXdlc3QgdmVyc2lvbi5cIik7XG4gICAgfVxuICB9KTtcbn1cbndpbmRvdy5zZXRJbnRlcnZhbChjaGVja1ZlcnNpb24sIFZFUlNJT05fQ0hFQ0tfSU5URVJWQUwpO1xuXG53aW5kb3cuQ1BPID0ge1xuICBzYXZlOiBmdW5jdGlvbigpIHt9LFxuICBhdXRvU2F2ZTogZnVuY3Rpb24oKSB7fSxcbiAgZG9jdW1lbnRzIDogbmV3IERvY3VtZW50cygpXG59O1xuJChmdW5jdGlvbigpIHtcbiAgY29uc3QgQ09OVEVYVF9GT1JfTkVXX0ZJTEVTID0gJzxzY3JpcHRzb25seSBhcHA9XCJTbmFwISA5LjAsIGh0dHBzOi8vc25hcC5iZXJrZWxleS5lZHVcIiB2ZXJzaW9uPVwiMlwiPjxzY3JpcHQgeD1cIjBcIiB5PVwiMFwiPjxjdXN0b20tYmxvY2sgcz1cInVzZSBjb250ZXh0IHN0YXJ0ZXIyMDI0XCI+PC9jdXN0b20tYmxvY2s+PC9zY3JpcHQ+PC9zY3JpcHRzb25seT4nO1xuICBmdW5jdGlvbiBtZXJnZShvYmosIGV4dGVuc2lvbikge1xuICAgIHZhciBuZXdvYmogPSB7fTtcbiAgICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgbmV3b2JqW2tdID0gb2JqW2tdO1xuICAgIH0pO1xuICAgIE9iamVjdC5rZXlzKGV4dGVuc2lvbikuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgICBuZXdvYmpba10gPSBleHRlbnNpb25ba107XG4gICAgfSk7XG4gICAgcmV0dXJuIG5ld29iajtcbiAgfVxuICB2YXIgYW5pbWF0aW9uRGl2ID0gbnVsbDtcbiAgZnVuY3Rpb24gY2xvc2VBbmltYXRpb25JZk9wZW4oKSB7XG4gICAgaWYoYW5pbWF0aW9uRGl2KSB7XG4gICAgICBhbmltYXRpb25EaXYuZW1wdHkoKTtcbiAgICAgIGFuaW1hdGlvbkRpdi5kaWFsb2coXCJkZXN0cm95XCIpO1xuICAgICAgYW5pbWF0aW9uRGl2ID0gbnVsbDtcbiAgICB9XG4gIH1cbiAgQ1BPLm1ha2VFZGl0b3IgPSBmdW5jdGlvbihjb250YWluZXIsIG9wdGlvbnMpIHtcbiAgICB2YXIgaW5pdGlhbCA9IFwiXCI7XG4gICAgaWYgKG9wdGlvbnMuaGFzT3duUHJvcGVydHkoXCJpbml0aWFsXCIpKSB7XG4gICAgICBpbml0aWFsID0gb3B0aW9ucy5pbml0aWFsO1xuICAgIH1cblxuICAgIHZhciB0ZXh0YXJlYSA9IGpRdWVyeShcIjx0ZXh0YXJlYSBhcmlhLWhpZGRlbj0ndHJ1ZSc+XCIpO1xuICAgIHRleHRhcmVhLnZhbChpbml0aWFsKTtcbiAgICBjb250YWluZXIuYXBwZW5kKHRleHRhcmVhKTtcblxuICAgIHZhciBydW5GdW4gPSBmdW5jdGlvbiAoY29kZSwgcmVwbE9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMucnVuKGNvZGUsIHtjbTogQ019LCByZXBsT3B0aW9ucyk7XG4gICAgfTtcblxuICAgIHZhciB1c2VMaW5lTnVtYmVycyA9ICFvcHRpb25zLnNpbXBsZUVkaXRvcjtcbiAgICB2YXIgdXNlRm9sZGluZyA9ICFvcHRpb25zLnNpbXBsZUVkaXRvcjtcblxuICAgIHZhciBndXR0ZXJzID0gIW9wdGlvbnMuc2ltcGxlRWRpdG9yID9cbiAgICAgIFtcImhlbHAtZ3V0dGVyXCIsIFwiQ29kZU1pcnJvci1saW5lbnVtYmVyc1wiLCBcIkNvZGVNaXJyb3ItZm9sZGd1dHRlclwiXSA6XG4gICAgICBbXTtcblxuICAgIGZ1bmN0aW9uIHJlaW5kZW50QWxsTGluZXMoY20pIHtcbiAgICAgIHZhciBsYXN0ID0gY20ubGluZUNvdW50KCk7XG4gICAgICBjbS5vcGVyYXRpb24oZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGFzdDsgKytpKSBjbS5pbmRlbnRMaW5lKGkpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgdmFyIENPREVfTElORV9XSURUSCA9IDEwMDtcblxuICAgIHZhciBydWxlcnMsIHJ1bGVyc01pbkNvbDtcblxuICAgIC8vIHBsYWNlIGEgdmVydGljYWwgbGluZSBpbiBjb2RlIGVkaXRvciwgYW5kIG5vdCByZXBsXG4gICAgaWYgKG9wdGlvbnMuc2ltcGxlRWRpdG9yKSB7XG4gICAgICBydWxlcnMgPSBbXTtcbiAgICB9IGVsc2V7XG4gICAgICBydWxlcnMgPSBbe2NvbG9yOiBcIiMzMTdCQ0ZcIiwgY29sdW1uOiBDT0RFX0xJTkVfV0lEVEgsIGxpbmVTdHlsZTogXCJkYXNoZWRcIiwgY2xhc3NOYW1lOiBcImhpZGRlblwifV07XG4gICAgICBydWxlcnNNaW5Db2wgPSBDT0RFX0xJTkVfV0lEVEg7XG4gICAgfVxuXG4gICAgY29uc3QgbWFjID0gQ29kZU1pcnJvci5rZXlNYXAuZGVmYXVsdCA9PT0gQ29kZU1pcnJvci5rZXlNYXAubWFjRGVmYXVsdDtcbiAgICBjb25zdCBtb2RpZmllciA9IG1hYyA/IFwiQ21kXCIgOiBcIkN0cmxcIjtcblxuICAgIHZhciBjbU9wdGlvbnMgPSB7XG4gICAgICBleHRyYUtleXM6IENvZGVNaXJyb3Iubm9ybWFsaXplS2V5TWFwKHtcbiAgICAgICAgXCJTaGlmdC1FbnRlclwiOiBmdW5jdGlvbihjbSkgeyBydW5GdW4oY20uZ2V0VmFsdWUoKSk7IH0sXG4gICAgICAgIFwiU2hpZnQtQ3RybC1FbnRlclwiOiBmdW5jdGlvbihjbSkgeyBydW5GdW4oY20uZ2V0VmFsdWUoKSk7IH0sXG4gICAgICAgIFwiVGFiXCI6IFwiaW5kZW50QXV0b1wiLFxuICAgICAgICBcIkN0cmwtSVwiOiByZWluZGVudEFsbExpbmVzLFxuICAgICAgICBcIkVzYyBMZWZ0XCI6IFwiZ29CYWNrd2FyZFNleHBcIixcbiAgICAgICAgXCJBbHQtTGVmdFwiOiBcImdvQmFja3dhcmRTZXhwXCIsXG4gICAgICAgIFwiRXNjIFJpZ2h0XCI6IFwiZ29Gb3J3YXJkU2V4cFwiLFxuICAgICAgICBcIkFsdC1SaWdodFwiOiBcImdvRm9yd2FyZFNleHBcIixcbiAgICAgICAgXCJDdHJsLUxlZnRcIjogXCJnb0JhY2t3YXJkVG9rZW5cIixcbiAgICAgICAgXCJDdHJsLVJpZ2h0XCI6IFwiZ29Gb3J3YXJkVG9rZW5cIixcbiAgICAgICAgW2Ake21vZGlmaWVyfS0vYF06IFwidG9nZ2xlQ29tbWVudFwiLFxuICAgICAgfSksXG4gICAgICBpbmRlbnRVbml0OiAyLFxuICAgICAgdGFiU2l6ZTogMixcbiAgICAgIHZpZXdwb3J0TWFyZ2luOiBJbmZpbml0eSxcbiAgICAgIGxpbmVOdW1iZXJzOiB1c2VMaW5lTnVtYmVycyxcbiAgICAgIG1hdGNoS2V5d29yZHM6IHRydWUsXG4gICAgICBtYXRjaEJyYWNrZXRzOiB0cnVlLFxuICAgICAgc3R5bGVTZWxlY3RlZFRleHQ6IHRydWUsXG4gICAgICBmb2xkR3V0dGVyOiB1c2VGb2xkaW5nLFxuICAgICAgZ3V0dGVyczogZ3V0dGVycyxcbiAgICAgIGxpbmVXcmFwcGluZzogdHJ1ZSxcbiAgICAgIGxvZ2dpbmc6IHRydWUsXG4gICAgICBydWxlcnM6IHJ1bGVycyxcbiAgICAgIHJ1bGVyc01pbkNvbDogcnVsZXJzTWluQ29sLFxuICAgICAgc2Nyb2xsUGFzdEVuZDogdHJ1ZSxcbiAgICB9O1xuXG4gICAgY21PcHRpb25zID0gbWVyZ2UoY21PcHRpb25zLCBvcHRpb25zLmNtT3B0aW9ucyB8fCB7fSk7XG5cbiAgICB2YXIgQ00gPSBDb2RlTWlycm9yLmZyb21UZXh0QXJlYSh0ZXh0YXJlYVswXSwgY21PcHRpb25zKTtcblxuICAgIGZ1bmN0aW9uIGZpcnN0TGluZUlzTmFtZXNwYWNlKCkge1xuICAgICAgY29uc3QgZmlyc3RsaW5lID0gQ00uZ2V0TGluZSgwKTtcbiAgICAgIGNvbnN0IG1hdGNoID0gZmlyc3RsaW5lLm1hdGNoKC9edXNlIGNvbnRleHQuKi8pO1xuICAgICAgcmV0dXJuIG1hdGNoICE9PSBudWxsO1xuICAgIH1cblxuICAgIGxldCBuYW1lc3BhY2VtYXJrID0gbnVsbDtcbiAgICBmdW5jdGlvbiBzZXRDb250ZXh0TGluZShuZXdDb250ZXh0TGluZSkge1xuICAgICAgdmFyIGhhc05hbWVzcGFjZSA9IGZpcnN0TGluZUlzTmFtZXNwYWNlKCk7XG4gICAgICBpZighaGFzTmFtZXNwYWNlICYmIG5hbWVzcGFjZW1hcmsgIT09IG51bGwpIHtcbiAgICAgICAgbmFtZXNwYWNlbWFyay5jbGVhcigpO1xuICAgICAgfVxuICAgICAgaWYoIWhhc05hbWVzcGFjZSkge1xuICAgICAgICBDTS5yZXBsYWNlUmFuZ2UobmV3Q29udGV4dExpbmUsIHsgbGluZTowLCBjaDogMH0sIHtsaW5lOiAwLCBjaDogMH0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIENNLnJlcGxhY2VSYW5nZShuZXdDb250ZXh0TGluZSwgeyBsaW5lOjAsIGNoOiAwfSwge2xpbmU6IDEsIGNoOiAwfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYoIW9wdGlvbnMuc2ltcGxlRWRpdG9yKSB7XG5cbiAgICAgIGNvbnN0IGd1dHRlclF1ZXN0aW9uV3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBndXR0ZXJRdWVzdGlvbldyYXBwZXIuY2xhc3NOYW1lID0gXCJndXR0ZXItcXVlc3Rpb24td3JhcHBlclwiO1xuICAgICAgY29uc3QgZ3V0dGVyVG9vbHRpcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgZ3V0dGVyVG9vbHRpcC5jbGFzc05hbWUgPSBcImd1dHRlci1xdWVzdGlvbi10b29sdGlwXCI7XG4gICAgICBndXR0ZXJUb29sdGlwLmlubmVyVGV4dCA9IFwiVGhlIHVzZSBjb250ZXh0IGxpbmUgdGVsbHMgUHlyZXQgdG8gbG9hZCB0b29scyBmb3IgYSBzcGVjaWZpYyBjbGFzcyBjb250ZXh0LiBJdCBjYW4gYmUgY2hhbmdlZCB0aHJvdWdoIHRoZSBtYWluIFB5cmV0IG1lbnUuIE1vc3Qgb2YgdGhlIHRpbWUgeW91IHdvbid0IG5lZWQgdG8gY2hhbmdlIHRoaXMgYXQgYWxsLlwiO1xuICAgICAgY29uc3QgZ3V0dGVyUXVlc3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuICAgICAgZ3V0dGVyUXVlc3Rpb24uc3JjID0gd2luZG93LkFQUF9CQVNFX1VSTCArIFwiL2ltZy9xdWVzdGlvbi5wbmdcIjtcbiAgICAgIGd1dHRlclF1ZXN0aW9uLmNsYXNzTmFtZSA9IFwiZ3V0dGVyLXF1ZXN0aW9uXCI7XG4gICAgICBndXR0ZXJRdWVzdGlvbldyYXBwZXIuYXBwZW5kQ2hpbGQoZ3V0dGVyUXVlc3Rpb24pO1xuICAgICAgZ3V0dGVyUXVlc3Rpb25XcmFwcGVyLmFwcGVuZENoaWxkKGd1dHRlclRvb2x0aXApO1xuICAgICAgQ00uc2V0R3V0dGVyTWFya2VyKDAsIFwiaGVscC1ndXR0ZXJcIiwgZ3V0dGVyUXVlc3Rpb25XcmFwcGVyKTtcblxuICAgICAgQ00uZ2V0V3JhcHBlckVsZW1lbnQoKS5vbm1vdXNlbGVhdmUgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIENNLmNsZWFyR3V0dGVyKFwiaGVscC1ndXR0ZXJcIik7XG4gICAgICB9XG5cbiAgICAgIC8vIE5PVEUoam9lKTogVGhpcyBzZWVtcyB0byBiZSB0aGUgYmVzdCB3YXkgdG8gZ2V0IGEgaG92ZXIgb24gYSBtYXJrOiBodHRwczovL2dpdGh1Yi5jb20vY29kZW1pcnJvci9Db2RlTWlycm9yL2lzc3Vlcy8zNTI5XG4gICAgICBDTS5nZXRXcmFwcGVyRWxlbWVudCgpLm9ubW91c2Vtb3ZlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgbGluZUNoID0gQ00uY29vcmRzQ2hhcih7IGxlZnQ6IGUuY2xpZW50WCwgdG9wOiBlLmNsaWVudFkgfSk7XG4gICAgICAgIHZhciBtYXJrZXJzID0gQ00uZmluZE1hcmtzQXQobGluZUNoKTtcbiAgICAgICAgaWYgKG1hcmtlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgQ00uY2xlYXJHdXR0ZXIoXCJoZWxwLWd1dHRlclwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGluZUNoLmxpbmUgPT09IDAgJiYgbWFya2Vyc1swXSA9PT0gbmFtZXNwYWNlbWFyaykge1xuICAgICAgICAgIENNLnNldEd1dHRlck1hcmtlcigwLCBcImhlbHAtZ3V0dGVyXCIsIGd1dHRlclF1ZXN0aW9uV3JhcHBlcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgQ00uY2xlYXJHdXR0ZXIoXCJoZWxwLWd1dHRlclwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgQ00ub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24oY2hhbmdlKSB7XG4gICAgICAgIGZ1bmN0aW9uIGRvZXNOb3RDaGFuZ2VGaXJzdExpbmUoYykgeyByZXR1cm4gYy5mcm9tLmxpbmUgIT09IDA7IH1cbiAgICAgICAgaWYoY2hhbmdlLmN1ck9wLmNoYW5nZU9ianMgJiYgY2hhbmdlLmN1ck9wLmNoYW5nZU9ianMuZXZlcnkoZG9lc05vdENoYW5nZUZpcnN0TGluZSkpIHsgcmV0dXJuOyB9XG4gICAgICAgIHZhciBoYXNOYW1lc3BhY2UgPSBmaXJzdExpbmVJc05hbWVzcGFjZSgpO1xuICAgICAgICBpZihoYXNOYW1lc3BhY2UpIHtcbiAgICAgICAgICBpZihuYW1lc3BhY2VtYXJrKSB7IG5hbWVzcGFjZW1hcmsuY2xlYXIoKTsgfVxuICAgICAgICAgIG5hbWVzcGFjZW1hcmsgPSBDTS5tYXJrVGV4dCh7bGluZTogMCwgY2g6IDB9LCB7bGluZTogMSwgY2g6IDB9LCB7IGF0dHJpYnV0ZXM6IHsgdXNlbGluZTogdHJ1ZSB9LCBjbGFzc05hbWU6IFwidXNlbGluZVwiLCBhdG9taWM6IHRydWUsIGluY2x1c2l2ZUxlZnQ6IHRydWUsIGluY2x1c2l2ZVJpZ2h0OiBmYWxzZSB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICh1c2VMaW5lTnVtYmVycykge1xuICAgICAgQ00uZGlzcGxheS53cmFwcGVyLmFwcGVuZENoaWxkKG1rV2FybmluZ1VwcGVyKClbMF0pO1xuICAgICAgQ00uZGlzcGxheS53cmFwcGVyLmFwcGVuZENoaWxkKG1rV2FybmluZ0xvd2VyKClbMF0pO1xuICAgIH1cblxuICAgIGdldFRvcFRpZXJNZW51aXRlbXMoKTtcblxuICAgIHJldHVybiB7XG4gICAgICBjbTogQ00sXG4gICAgICBzZXRDb250ZXh0TGluZTogc2V0Q29udGV4dExpbmUsXG4gICAgICByZWZyZXNoOiBmdW5jdGlvbigpIHsgQ00ucmVmcmVzaCgpOyB9LFxuICAgICAgcnVuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcnVuRnVuKENNLmdldFZhbHVlKCkpO1xuICAgICAgfSxcbiAgICAgIGZvY3VzOiBmdW5jdGlvbigpIHsgQ00uZm9jdXMoKTsgfSxcbiAgICAgIGZvY3VzQ2Fyb3VzZWw6IG51bGwgLy9pbml0Rm9jdXNDYXJvdXNlbFxuICAgIH07XG4gIH07XG4gIENQTy5SVU5fQ09ERSA9IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKFwiUnVubmluZyBiZWZvcmUgcmVhZHlcIiwgYXJndW1lbnRzKTtcbiAgfTtcblxuICBmdW5jdGlvbiBzZXRVc2VybmFtZSh0YXJnZXQpIHtcbiAgICB2YXIgdG9rZW4gPSB3aW5kb3cuZ2FwaS5hdXRoLmdldFRva2VuKCkuYWNjZXNzX3Rva2VuO1xuICAgIHJldHVybiBmZXRjaCgnaHR0cHM6Ly9vcGVuaWRjb25uZWN0Lmdvb2dsZWFwaXMuY29tL3YxL3VzZXJpbmZvJywge1xuICAgICAgaGVhZGVyczogeyBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyB0b2tlbiB9XG4gICAgfSkudGhlbihmdW5jdGlvbihyZXNwKSB7XG4gICAgICByZXR1cm4gcmVzcC5qc29uKCk7XG4gICAgfSkudGhlbihmdW5jdGlvbihpbmZvKSB7XG4gICAgICB0YXJnZXQudGV4dChpbmZvLmVtYWlsKTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0b3JhZ2VBUEkudGhlbihmdW5jdGlvbihhcGkpIHtcbiAgICBhcGkuY29sbGVjdGlvbi50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgJChcIi5sb2dpbk9ubHlcIikuc2hvdygpO1xuICAgICAgJChcIi5sb2dvdXRPbmx5XCIpLmhpZGUoKTtcbiAgICAgIHNldFVzZXJuYW1lKCQoXCIjdXNlcm5hbWVcIikpO1xuICAgIH0pO1xuICAgIGFwaS5jb2xsZWN0aW9uLmZhaWwoZnVuY3Rpb24oKSB7XG4gICAgICAkKFwiLmxvZ2luT25seVwiKS5oaWRlKCk7XG4gICAgICAkKFwiLmxvZ291dE9ubHlcIikuc2hvdygpO1xuICAgIH0pO1xuICB9KTtcblxuICBzdG9yYWdlQVBJID0gc3RvcmFnZUFQSS50aGVuKGZ1bmN0aW9uKGFwaSkgeyByZXR1cm4gYXBpLmFwaTsgfSk7XG4gICQoXCIjY29ubmVjdEJ1dHRvblwiKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAkKFwiI2Nvbm5lY3RCdXR0b25cIikudGV4dChcIkNvbm5lY3RpbmcuLi5cIik7XG4gICAgJChcIiNjb25uZWN0QnV0dG9uXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuICAgICQoJyNjb25uZWN0QnV0dG9ubGknKS5hdHRyKCdkaXNhYmxlZCcsICdkaXNhYmxlZCcpO1xuICAgICQoXCIjY29ubmVjdEJ1dHRvblwiKS5hdHRyKFwidGFiSW5kZXhcIiwgXCItMVwiKTtcbiAgICAvLyQoXCIjdG9wVGllclVsXCIpLmF0dHIoXCJ0YWJJbmRleFwiLCBcIjBcIik7XG4gICAgZ2V0VG9wVGllck1lbnVpdGVtcygpO1xuICAgIHN0b3JhZ2VBUEkgPSBjcmVhdGVQcm9ncmFtQ29sbGVjdGlvbkFQSShwcm9jZXNzLmVudi5BUFBfTkFNRSwgZmFsc2UpO1xuICAgIHN0b3JhZ2VBUEkudGhlbihmdW5jdGlvbihhcGkpIHtcbiAgICAgIGFwaS5jb2xsZWN0aW9uLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAgICQoXCIubG9naW5Pbmx5XCIpLnNob3coKTtcbiAgICAgICAgJChcIi5sb2dvdXRPbmx5XCIpLmhpZGUoKTtcbiAgICAgICAgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7XG4gICAgICAgICQoXCIjYm9ubmllbWVudWJ1dHRvblwiKS5mb2N1cygpO1xuICAgICAgICBzZXRVc2VybmFtZSgkKFwiI3VzZXJuYW1lXCIpKTtcbiAgICAgICAgaWYocGFyYW1zW1wiZ2V0XCJdICYmIHBhcmFtc1tcImdldFwiXVtcInByb2dyYW1cIl0pIHtcbiAgICAgICAgICB2YXIgdG9Mb2FkID0gYXBpLmFwaS5nZXRGaWxlQnlJZChwYXJhbXNbXCJnZXRcIl1bXCJwcm9ncmFtXCJdKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkxvZ2dlZCBpbiBhbmQgaGFzIHByb2dyYW0gdG8gbG9hZDogXCIsIHRvTG9hZCk7XG4gICAgICAgICAgbG9hZFByb2dyYW0odG9Mb2FkKTtcbiAgICAgICAgICBwcm9ncmFtVG9TYXZlID0gdG9Mb2FkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByb2dyYW1Ub1NhdmUgPSBRLmZjYWxsKGZ1bmN0aW9uKCkgeyByZXR1cm4gbnVsbDsgfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgYXBpLmNvbGxlY3Rpb24uZmFpbChmdW5jdGlvbigpIHtcbiAgICAgICAgJChcIiNjb25uZWN0QnV0dG9uXCIpLnRleHQoXCJDb25uZWN0IHRvIEdvb2dsZSBEcml2ZVwiKTtcbiAgICAgICAgJChcIiNjb25uZWN0QnV0dG9uXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBmYWxzZSk7XG4gICAgICAgICQoJyNjb25uZWN0QnV0dG9ubGknKS5hdHRyKCdkaXNhYmxlZCcsIGZhbHNlKTtcbiAgICAgICAgLy8kKFwiI2Nvbm5lY3RCdXR0b25cIikuYXR0cihcInRhYkluZGV4XCIsIFwiMFwiKTtcbiAgICAgICAgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7XG4gICAgICAgICQoXCIjY29ubmVjdEJ1dHRvblwiKS5mb2N1cygpO1xuICAgICAgICAvLyQoXCIjdG9wVGllclVsXCIpLmF0dHIoXCJ0YWJJbmRleFwiLCBcIi0xXCIpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgc3RvcmFnZUFQSSA9IHN0b3JhZ2VBUEkudGhlbihmdW5jdGlvbihhcGkpIHsgcmV0dXJuIGFwaS5hcGk7IH0pO1xuICB9KTtcblxuICAvKlxuICAgIGluaXRpYWxQcm9ncmFtIGhvbGRzIGEgcHJvbWlzZSBmb3IgYSBEcml2ZSBGaWxlIG9iamVjdCBvciBudWxsXG5cbiAgICBJdCdzIG51bGwgaWYgdGhlIHBhZ2UgZG9lc24ndCBoYXZlIGEgI3NoYXJlIG9yICNwcm9ncmFtIHVybFxuXG4gICAgSWYgdGhlIHVybCBkb2VzIGhhdmUgYSAjcHJvZ3JhbSBvciAjc2hhcmUsIHRoZSBwcm9taXNlIGlzIGZvciB0aGVcbiAgICBjb3JyZXNwb25kaW5nIG9iamVjdC5cbiAgKi9cbiAgdmFyIGluaXRpYWxQcm9ncmFtID0gc3RvcmFnZUFQSS50aGVuKGZ1bmN0aW9uKGFwaSkge1xuICAgIHZhciBwcm9ncmFtTG9hZCA9IG51bGw7XG4gICAgaWYocGFyYW1zW1wiZ2V0XCJdICYmIHBhcmFtc1tcImdldFwiXVtcInByb2dyYW1cIl0pIHtcbiAgICAgIGVuYWJsZUZpbGVPcHRpb25zKCk7XG4gICAgICBwcm9ncmFtTG9hZCA9IGFwaS5nZXRGaWxlQnlJZChwYXJhbXNbXCJnZXRcIl1bXCJwcm9ncmFtXCJdKTtcbiAgICAgIHByb2dyYW1Mb2FkLnRoZW4oZnVuY3Rpb24ocCkgeyBzaG93U2hhcmVDb250YWluZXIocCk7IH0pO1xuICAgIH1cbiAgICBlbHNlIGlmKHBhcmFtc1tcImdldFwiXSAmJiBwYXJhbXNbXCJnZXRcIl1bXCJzaGFyZVwiXSkge1xuICAgICAgbG9nZ2VyLmxvZygnc2hhcmVkLXByb2dyYW0tbG9hZCcsXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogcGFyYW1zW1wiZ2V0XCJdW1wic2hhcmVcIl1cbiAgICAgICAgfSk7XG4gICAgICBwcm9ncmFtTG9hZCA9IGFwaS5nZXRTaGFyZWRGaWxlQnlJZChwYXJhbXNbXCJnZXRcIl1bXCJzaGFyZVwiXSk7XG4gICAgICBwcm9ncmFtTG9hZC50aGVuKGZ1bmN0aW9uKGZpbGUpIHtcbiAgICAgICAgLy8gTk9URShqb2UpOiBJZiB0aGUgY3VycmVudCB1c2VyIGRvZXNuJ3Qgb3duIG9yIGhhdmUgYWNjZXNzIHRvIHRoaXMgZmlsZVxuICAgICAgICAvLyAob3IgaXNuJ3QgbG9nZ2VkIGluKSB0aGlzIHdpbGwgc2ltcGx5IGZhaWwgd2l0aCBhIDQwMSwgc28gd2UgZG9uJ3QgZG9cbiAgICAgICAgLy8gYW55IGZ1cnRoZXIgcGVybWlzc2lvbiBjaGVja2luZyBiZWZvcmUgc2hvd2luZyB0aGUgbGluay5cbiAgICAgICAgZmlsZS5nZXRPcmlnaW5hbCgpLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc3BvbnNlIGZvciBvcmlnaW5hbDogXCIsIHJlc3BvbnNlKTtcbiAgICAgICAgICB2YXIgb3JpZ2luYWwgPSAkKFwiI29wZW4tb3JpZ2luYWxcIikuc2hvdygpLm9mZihcImNsaWNrXCIpO1xuICAgICAgICAgIHZhciBpZCA9IHJlc3BvbnNlLnJlc3VsdC52YWx1ZTtcbiAgICAgICAgICBvcmlnaW5hbC5yZW1vdmVDbGFzcyhcImhpZGRlblwiKTtcbiAgICAgICAgICBvcmlnaW5hbC5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHdpbmRvdy5vcGVuKHdpbmRvdy5BUFBfQkFTRV9VUkwgKyBcIi9ibG9ja3MjcHJvZ3JhbT1cIiArIGlkLCBcIl9ibGFua1wiKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSBpZihwYXJhbXNbXCJnZXRcIl0gJiYgcGFyYW1zW1wiZ2V0XCJdW1wic2hhcmV1cmxcIl0pIHtcbiAgICAgIGxvZ2dlci5sb2coJ3NoYXJlZC1wcm9ncmFtLWxvYWQnLCB7IHVybDogcGFyYW1zW1wiZ2V0XCJdW1wic2hhcmV1cmxcIl0gfSk7XG4gICAgICBwcm9ncmFtTG9hZCA9IG51bGw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcHJvZ3JhbUxvYWQgPSBudWxsO1xuICAgIH1cbiAgICBpZihwcm9ncmFtTG9hZCkge1xuICAgICAgcHJvZ3JhbUxvYWQuZmFpbChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB3aW5kb3cuc3RpY2tFcnJvcihcIlRoZSBwcm9ncmFtIGZhaWxlZCB0byBsb2FkLlwiKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHByb2dyYW1Mb2FkO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIHNldFRpdGxlKHByb2dOYW1lKSB7XG4gICAgZG9jdW1lbnQudGl0bGUgPSBwcm9nTmFtZSArIFwiIC0gXCIgKyBwcm9jZXNzLmVudi5BUFBfTkFNRTtcbiAgICAkKFwiI3Nob3dGaWxlbmFtZVwiKS50ZXh0KFwiRmlsZTogXCIgKyBwcm9nTmFtZSk7XG4gIH1cbiAgQ1BPLnNldFRpdGxlID0gc2V0VGl0bGU7XG5cbiAgdmFyIGZpbGVuYW1lID0gZmFsc2U7XG5cbiAgJChcIiNkb3dubG9hZCBhXCIpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgIHZhciBkb3dubG9hZEVsdCA9ICQoXCIjZG93bmxvYWQgYVwiKTtcbiAgICB2YXIgY29udGVudHMgPSBDUE8uYmxvY2tzSURFLmN1cnJlbnRTcHJpdGUuc2NyaXB0c09ubHlYTUwoKTtcbiAgICB2YXIgZG93bmxvYWRCbG9iID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW2NvbnRlbnRzXSwge3R5cGU6ICd0ZXh0L3BsYWluJ30pKTtcbiAgICBpZighZmlsZW5hbWUpIHsgZmlsZW5hbWUgPSAndW50aXRsZWRfcHJvZ3JhbS54bWwnOyB9XG4gICAgaWYoZmlsZW5hbWUuaW5kZXhPZihcIi54bWxcIikgIT09IChmaWxlbmFtZS5sZW5ndGggLSA0KSkge1xuICAgICAgZmlsZW5hbWUgKz0gXCIueG1sXCI7XG4gICAgfVxuICAgIGRvd25sb2FkRWx0LmF0dHIoe1xuICAgICAgZG93bmxvYWQ6IGZpbGVuYW1lLFxuICAgICAgaHJlZjogZG93bmxvYWRCbG9iXG4gICAgfSk7XG4gICAgJChcIiNkb3dubG9hZFwiKS5hcHBlbmQoZG93bmxvYWRFbHQpO1xuICB9KTtcblxuICBmdW5jdGlvbiBzaG93TW9kYWwoY3VycmVudENvbnRleHQpIHtcbiAgICBmdW5jdGlvbiBkcmF3RWxlbWVudChpbnB1dCkge1xuICAgICAgY29uc3QgZWxlbWVudCA9ICQoXCI8ZGl2PlwiKTtcbiAgICAgIGNvbnN0IGdyZWV0aW5nID0gJChcIjxwPlwiKTtcbiAgICAgIGNvbnN0IHNoYXJlZCA9ICQoXCI8dHQ+c2hhcmVkLWdkcml2ZSguLi4pPC90dD5cIik7XG4gICAgICBjb25zdCBjdXJyZW50Q29udGV4dEVsdCA9ICQoXCI8dHQ+XCIgKyBjdXJyZW50Q29udGV4dCArIFwiPC90dD5cIik7XG4gICAgICBncmVldGluZy5hcHBlbmQoXCJFbnRlciB0aGUgY29udGV4dCB0byB1c2UgZm9yIHRoZSBwcm9ncmFtLCBvciBjaG9vc2Ug4oCcQ2FuY2Vs4oCdIHRvIGtlZXAgdGhlIGN1cnJlbnQgY29udGV4dCBvZiBcIiwgY3VycmVudENvbnRleHRFbHQsIFwiLlwiKTtcbiAgICAgIGNvbnN0IGVzc2VudGlhbHMgPSAkKFwiPHR0PnN0YXJ0ZXIyMDI0PC90dD5cIik7XG4gICAgICBjb25zdCBsaXN0ID0gJChcIjx1bD5cIilcbiAgICAgICAgLmFwcGVuZCgkKFwiPGxpPlwiKS5hcHBlbmQoXCJUaGUgZGVmYXVsdCBpcyBcIiwgZXNzZW50aWFscywgXCIuXCIpKVxuICAgICAgICAuYXBwZW5kKCQoXCI8bGk+XCIpLmFwcGVuZChcIllvdSBtaWdodCB1c2Ugc29tZXRoaW5nIGxpa2UgXCIsIHNoYXJlZCwgXCIgaWYgb25lIHdhcyBwcm92aWRlZCBhcyBwYXJ0IG9mIGEgY291cnNlLlwiKSk7XG4gICAgICBlbGVtZW50LmFwcGVuZChncmVldGluZyk7XG4gICAgICBlbGVtZW50LmFwcGVuZCgkKFwiPHA+XCIpLmFwcGVuZChsaXN0KSk7XG4gICAgICBjb25zdCB1c2VDb250ZXh0ID0gJChcIjx0dD51c2UgY29udGV4dDwvdHQ+XCIpLmNzcyh7ICdmbGV4LWdyb3cnOiAnMCcsICdwYWRkaW5nLXJpZ2h0JzogJzFlbScgfSk7XG4gICAgICBjb25zdCBpbnB1dFdyYXBwZXIgPSAkKFwiPGRpdj5cIikuYXBwZW5kKGlucHV0KS5jc3MoeyAnZmxleC1ncm93JzogJzEnIH0pO1xuICAgICAgY29uc3QgZW50cnkgPSAkKFwiPGRpdj5cIikuY3NzKHtcbiAgICAgICAgZGlzcGxheTogJ2ZsZXgnLFxuICAgICAgICAnZmxleC1kaXJlY3Rpb24nOiAncm93JyxcbiAgICAgICAgJ2p1c3RpZnktY29udGVudCc6ICdmbGV4LXN0YXJ0JyxcbiAgICAgICAgJ2FsaWduLWl0ZW1zJzogJ2Jhc2VsaW5lJ1xuICAgICAgfSk7XG4gICAgICBlbnRyeS5hcHBlbmQodXNlQ29udGV4dCkuYXBwZW5kKGlucHV0V3JhcHBlcik7XG4gICAgICBlbGVtZW50LmFwcGVuZChlbnRyeSk7XG4gICAgICByZXR1cm4gZWxlbWVudDtcbiAgICB9XG4gICAgY29uc3QgbmFtZXNwYWNlUmVzdWx0ID0gbmV3IG1vZGFsUHJvbXB0KHtcbiAgICAgICAgdGl0bGU6IFwiQ2hvb3NlIGEgQ29udGV4dFwiLFxuICAgICAgICBzdHlsZTogXCJ0ZXh0XCIsXG4gICAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBkcmF3RWxlbWVudDogZHJhd0VsZW1lbnQsXG4gICAgICAgICAgICBzdWJtaXRUZXh0OiBcIkNoYW5nZSBOYW1lc3BhY2VcIixcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZTogY3VycmVudENvbnRleHRcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH0pO1xuICAgIG5hbWVzcGFjZVJlc3VsdC5zaG93KChyZXN1bHQpID0+IHtcbiAgICAgIGlmKCFyZXN1bHQpIHsgcmV0dXJuOyB9XG4gICAgICBpZihyZXN1bHQubWF0Y2goL151c2UgY29udGV4dCovKSkgeyByZXN1bHQgPSByZXN1bHQuc2xpY2UoXCJ1c2UgY29udGV4dCBcIi5sZW5ndGgpOyB9XG4gICAgICBDUE8uZWRpdG9yLnNldENvbnRleHRMaW5lKFwidXNlIGNvbnRleHQgXCIgKyByZXN1bHQgKyBcIlxcblwiKTtcbiAgICB9KTtcbiAgfVxuICAkKFwiI2Nob29zZS1jb250ZXh0XCIpLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24oKSB7IHNob3dNb2RhbChDUE8uZWRpdG9yLmNtLmdldExpbmUoMCkuc2xpY2UoXCJ1c2UgY29udGV4dCBcIi5sZW5ndGgpKTsgfSk7XG5cbiAgdmFyIFRSVU5DQVRFX0xFTkdUSCA9IDIwO1xuXG4gIGZ1bmN0aW9uIHRydW5jYXRlTmFtZShuYW1lKSB7XG4gICAgaWYobmFtZS5sZW5ndGggPD0gVFJVTkNBVEVfTEVOR1RIICsgMSkgeyByZXR1cm4gbmFtZTsgfVxuICAgIHJldHVybiBuYW1lLnNsaWNlKDAsIFRSVU5DQVRFX0xFTkdUSCAvIDIpICsgXCLigKZcIiArIG5hbWUuc2xpY2UobmFtZS5sZW5ndGggLSBUUlVOQ0FURV9MRU5HVEggLyAyLCBuYW1lLmxlbmd0aCk7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVOYW1lKHApIHtcbiAgICBmaWxlbmFtZSA9IHAuZ2V0TmFtZSgpO1xuICAgICQoXCIjZmlsZW5hbWVcIikudGV4dChcIiAoXCIgKyB0cnVuY2F0ZU5hbWUoZmlsZW5hbWUpICsgXCIpXCIpO1xuICAgICQoXCIjZmlsZW5hbWVcIikuYXR0cigndGl0bGUnLCBmaWxlbmFtZSk7XG4gICAgc2V0VGl0bGUoZmlsZW5hbWUpO1xuICAgIHNob3dTaGFyZUNvbnRhaW5lcihwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxvYWRQcm9ncmFtKHApIHtcbiAgICBwcm9ncmFtVG9TYXZlID0gcDtcbiAgICByZXR1cm4gcC50aGVuKGZ1bmN0aW9uKHByb2cpIHtcbiAgICAgIGlmKHByb2cgIT09IG51bGwpIHtcbiAgICAgICAgdXBkYXRlTmFtZShwcm9nKTtcbiAgICAgICAgaWYocHJvZy5zaGFyZWQpIHtcbiAgICAgICAgICB3aW5kb3cuc3RpY2tNZXNzYWdlKFwiWW91IGFyZSB2aWV3aW5nIGEgc2hhcmVkIHByb2dyYW0uIEFueSBjaGFuZ2VzIHlvdSBtYWtlIHdpbGwgbm90IGJlIHNhdmVkLiBZb3UgY2FuIHVzZSBGaWxlIC0+IFNhdmUgYSBjb3B5IHRvIHNhdmUgeW91ciBvd24gdmVyc2lvbiB3aXRoIGFueSBlZGl0cyB5b3UgbWFrZS5cIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByb2cuZ2V0Q29udGVudHMoKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBpZihwYXJhbXNbXCJnZXRcIl1bXCJlZGl0b3JDb250ZW50c1wiXSAmJiAhKHBhcmFtc1tcImdldFwiXVtcInByb2dyYW1cIl0gfHwgcGFyYW1zW1wiZ2V0XCJdW1wic2hhcmVcIl0pKSB7XG4gICAgICAgICAgcmV0dXJuIHBhcmFtc1tcImdldFwiXVtcImVkaXRvckNvbnRlbnRzXCJdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHJldHVybiBDT05URVhUX0ZPUl9ORVdfRklMRVM7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNheShtc2csIGZvcmdldCkge1xuICAgIGlmIChtc2cgPT09IFwiXCIpIHJldHVybjtcbiAgICB2YXIgYW5ub3VuY2VtZW50cyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYW5ub3VuY2VtZW50bGlzdFwiKTtcbiAgICB2YXIgbGkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiTElcIik7XG4gICAgbGkuYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobXNnKSk7XG4gICAgYW5ub3VuY2VtZW50cy5pbnNlcnRCZWZvcmUobGksIGFubm91bmNlbWVudHMuZmlyc3RDaGlsZCk7XG4gICAgaWYgKGZvcmdldCkge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgYW5ub3VuY2VtZW50cy5yZW1vdmVDaGlsZChsaSk7XG4gICAgICB9LCAxMDAwKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzYXlBbmRGb3JnZXQobXNnKSB7XG4gICAgY29uc29sZS5sb2coJ2RvaW5nIHNheUFuZEZvcmdldCcsIG1zZyk7XG4gICAgc2F5KG1zZywgdHJ1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBjeWNsZUFkdmFuY2UoY3VyckluZGV4LCBtYXhJbmRleCwgcmV2ZXJzZVApIHtcbiAgICB2YXIgbmV4dEluZGV4ID0gY3VyckluZGV4ICsgKHJldmVyc2VQPyAtMSA6ICsxKTtcbiAgICBuZXh0SW5kZXggPSAoKG5leHRJbmRleCAlIG1heEluZGV4KSArIG1heEluZGV4KSAlIG1heEluZGV4O1xuICAgIHJldHVybiBuZXh0SW5kZXg7XG4gIH1cblxuICBmdW5jdGlvbiBwb3B1bGF0ZUZvY3VzQ2Fyb3VzZWwoZWRpdG9yKSB7XG4gICAgaWYgKCFlZGl0b3IuZm9jdXNDYXJvdXNlbCkge1xuICAgICAgZWRpdG9yLmZvY3VzQ2Fyb3VzZWwgPSBbXTtcbiAgICB9XG4gICAgdmFyIGZjID0gZWRpdG9yLmZvY3VzQ2Fyb3VzZWw7XG4gICAgdmFyIGRvY21haW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm1haW5cIik7XG4gICAgaWYgKCFmY1swXSkge1xuICAgICAgdmFyIHRvb2xiYXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnVG9vbGJhcicpO1xuICAgICAgZmNbMF0gPSB0b29sYmFyO1xuICAgICAgLy9mY1swXSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiaGVhZGVyb25lbGVnZW5kXCIpO1xuICAgICAgLy9nZXRUb3BUaWVyTWVudWl0ZW1zKCk7XG4gICAgICAvL2ZjWzBdID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Jvbm5pZW1lbnVidXR0b24nKTtcbiAgICB9XG4gICAgaWYgKCFmY1sxXSkge1xuICAgICAgdmFyIGRvY3JlcGxNYWluID0gZG9jbWFpbi5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwicmVwbE1haW5cIik7XG4gICAgICB2YXIgZG9jcmVwbE1haW4wO1xuICAgICAgaWYgKGRvY3JlcGxNYWluLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBkb2NyZXBsTWFpbjAgPSB1bmRlZmluZWQ7XG4gICAgICB9IGVsc2UgaWYgKGRvY3JlcGxNYWluLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICBkb2NyZXBsTWFpbjAgPSBkb2NyZXBsTWFpblswXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZG9jcmVwbE1haW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoZG9jcmVwbE1haW5baV0uaW5uZXJUZXh0ICE9PSBcIlwiKSB7XG4gICAgICAgICAgICBkb2NyZXBsTWFpbjAgPSBkb2NyZXBsTWFpbltpXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGZjWzFdID0gZG9jcmVwbE1haW4wO1xuICAgIH1cbiAgICBpZiAoIWZjWzJdKSB7XG4gICAgICB2YXIgZG9jcmVwbCA9IGRvY21haW4uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInJlcGxcIik7XG4gICAgICB2YXIgZG9jcmVwbGNvZGUgPSBkb2NyZXBsWzBdLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJwcm9tcHQtY29udGFpbmVyXCIpWzBdLlxuICAgICAgICBnZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwiQ29kZU1pcnJvclwiKVswXTtcbiAgICAgIGZjWzJdID0gZG9jcmVwbGNvZGU7XG4gICAgfVxuICAgIGlmICghZmNbM10pIHtcbiAgICAgIGZjWzNdID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJhbm5vdW5jZW1lbnRzXCIpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGN5Y2xlRm9jdXMocmV2ZXJzZVApIHtcbiAgICAvL2NvbnNvbGUubG9nKCdkb2luZyBjeWNsZUZvY3VzJywgcmV2ZXJzZVApO1xuICAgIHZhciBlZGl0b3IgPSB0aGlzLmVkaXRvcjtcbiAgICBwb3B1bGF0ZUZvY3VzQ2Fyb3VzZWwoZWRpdG9yKTtcbiAgICB2YXIgZkNhcm91c2VsID0gZWRpdG9yLmZvY3VzQ2Fyb3VzZWw7XG4gICAgdmFyIG1heEluZGV4ID0gZkNhcm91c2VsLmxlbmd0aDtcbiAgICB2YXIgY3VycmVudEZvY3VzZWRFbHQgPSBmQ2Fyb3VzZWwuZmluZChmdW5jdGlvbihub2RlKSB7XG4gICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5vZGUuY29udGFpbnMoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdmFyIGN1cnJlbnRGb2N1c0luZGV4ID0gZkNhcm91c2VsLmluZGV4T2YoY3VycmVudEZvY3VzZWRFbHQpO1xuICAgIHZhciBuZXh0Rm9jdXNJbmRleCA9IGN1cnJlbnRGb2N1c0luZGV4O1xuICAgIHZhciBmb2N1c0VsdDtcbiAgICBkbyB7XG4gICAgICBuZXh0Rm9jdXNJbmRleCA9IGN5Y2xlQWR2YW5jZShuZXh0Rm9jdXNJbmRleCwgbWF4SW5kZXgsIHJldmVyc2VQKTtcbiAgICAgIGZvY3VzRWx0ID0gZkNhcm91c2VsW25leHRGb2N1c0luZGV4XTtcbiAgICAgIC8vY29uc29sZS5sb2coJ3RyeWluZyBmb2N1c0VsdCcsIGZvY3VzRWx0KTtcbiAgICB9IHdoaWxlICghZm9jdXNFbHQpO1xuXG4gICAgdmFyIGZvY3VzRWx0MDtcbiAgICBpZiAoZm9jdXNFbHQuY2xhc3NMaXN0LmNvbnRhaW5zKCd0b29sYmFycmVnaW9uJykpIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ3NldHRsaW5nIG9uIHRvb2xiYXIgcmVnaW9uJylcbiAgICAgIGdldFRvcFRpZXJNZW51aXRlbXMoKTtcbiAgICAgIGZvY3VzRWx0MCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdib25uaWVtZW51YnV0dG9uJyk7XG4gICAgfSBlbHNlIGlmIChmb2N1c0VsdC5jbGFzc0xpc3QuY29udGFpbnMoXCJyZXBsTWFpblwiKSB8fFxuICAgICAgZm9jdXNFbHQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiQ29kZU1pcnJvclwiKSkge1xuICAgICAgLy9jb25zb2xlLmxvZygnc2V0dGxpbmcgb24gZGVmbiB3aW5kb3cnKVxuICAgICAgdmFyIHRleHRhcmVhcyA9IGZvY3VzRWx0LmdldEVsZW1lbnRzQnlUYWdOYW1lKFwidGV4dGFyZWFcIik7XG4gICAgICAvL2NvbnNvbGUubG9nKCd0eHRhcmVhcz0nLCB0ZXh0YXJlYXMpXG4gICAgICAvL2NvbnNvbGUubG9nKCd0eHRhcmVhIGxlbj0nLCB0ZXh0YXJlYXMubGVuZ3RoKVxuICAgICAgaWYgKHRleHRhcmVhcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnSScpXG4gICAgICAgIGZvY3VzRWx0MCA9IGZvY3VzRWx0O1xuICAgICAgfSBlbHNlIGlmICh0ZXh0YXJlYXMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ3NldHRsaW5nIG9uIGludGVyIHdpbmRvdycpXG4gICAgICAgIGZvY3VzRWx0MCA9IHRleHRhcmVhc1swXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ3NldHRsaW5nIG9uIGRlZm4gd2luZG93JylcbiAgICAgICAgLypcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0ZXh0YXJlYXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAodGV4dGFyZWFzW2ldLmdldEF0dHJpYnV0ZSgndGFiSW5kZXgnKSkge1xuICAgICAgICAgICAgZm9jdXNFbHQwID0gdGV4dGFyZWFzW2ldO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAqL1xuICAgICAgICBmb2N1c0VsdDAgPSB0ZXh0YXJlYXNbdGV4dGFyZWFzLmxlbmd0aC0xXTtcbiAgICAgICAgZm9jdXNFbHQwLnJlbW92ZUF0dHJpYnV0ZSgndGFiSW5kZXgnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy9jb25zb2xlLmxvZygnc2V0dGxpbmcgb24gYW5ub3VuY2VtZW50IHJlZ2lvbicsIGZvY3VzRWx0KVxuICAgICAgZm9jdXNFbHQwID0gZm9jdXNFbHQ7XG4gICAgfVxuXG4gICAgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7XG4gICAgZm9jdXNFbHQwLmNsaWNrKCk7XG4gICAgZm9jdXNFbHQwLmZvY3VzKCk7XG4gICAgLy9jb25zb2xlLmxvZygnKGNmKWRvY2FjdGVsdD0nLCBkb2N1bWVudC5hY3RpdmVFbGVtZW50KTtcbiAgfVxuXG4gIHZhciBwcm9ncmFtTG9hZGVkID0gbG9hZFByb2dyYW0oaW5pdGlhbFByb2dyYW0pO1xuXG4gIHZhciBwcm9ncmFtVG9TYXZlID0gaW5pdGlhbFByb2dyYW07XG5cbiAgZnVuY3Rpb24gc2hvd1NoYXJlQ29udGFpbmVyKHApIHtcbiAgICAvL2NvbnNvbGUubG9nKCdjYWxsZWQgc2hvd1NoYXJlQ29udGFpbmVyJyk7XG4gICAgaWYoIXAuc2hhcmVkKSB7XG4gICAgICAkKFwiI3NoYXJlQ29udGFpbmVyXCIpLmVtcHR5KCk7XG4gICAgICAkKCcjcHVibGlzaGxpJykuc2hvdygpO1xuICAgICAgJChcIiNzaGFyZUNvbnRhaW5lclwiKS5hcHBlbmQoc2hhcmVBUEkubWFrZVNoYXJlTGluayhwKSk7XG4gICAgICBnZXRUb3BUaWVyTWVudWl0ZW1zKCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbmFtZU9yVW50aXRsZWQoKSB7XG4gICAgcmV0dXJuIGZpbGVuYW1lIHx8IFwiVW50aXRsZWRcIjtcbiAgfVxuICBmdW5jdGlvbiBhdXRvU2F2ZSgpIHtcbiAgICBwcm9ncmFtVG9TYXZlLnRoZW4oZnVuY3Rpb24ocCkge1xuICAgICAgaWYocCAhPT0gbnVsbCAmJiAhcC5zaGFyZWQpIHsgc2F2ZSgpOyB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBlbmFibGVGaWxlT3B0aW9ucygpIHtcbiAgICAkKFwiI2ZpbGVtZW51Q29udGVudHMgKlwiKS5yZW1vdmVDbGFzcyhcImRpc2FibGVkXCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gbWVudUl0ZW1EaXNhYmxlZChpZCkge1xuICAgIHJldHVybiAkKFwiI1wiICsgaWQpLmhhc0NsYXNzKFwiZGlzYWJsZWRcIik7XG4gIH1cblxuICBmdW5jdGlvbiBuZXdFdmVudChlKSB7XG4gICAgd2luZG93Lm9wZW4od2luZG93LkFQUF9CQVNFX1VSTCArIFwiL2Jsb2Nrc1wiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNhdmVFdmVudChlKSB7XG4gICAgaWYobWVudUl0ZW1EaXNhYmxlZChcInNhdmVcIikpIHsgcmV0dXJuOyB9XG4gICAgcmV0dXJuIHNhdmUoKTtcbiAgfVxuXG4gIC8qXG4gICAgc2F2ZSA6IHN0cmluZyAob3B0aW9uYWwpIC0+IHVuZGVmXG5cbiAgICBJZiBhIHN0cmluZyBhcmd1bWVudCBpcyBwcm92aWRlZCwgY3JlYXRlIGEgbmV3IGZpbGUgd2l0aCB0aGF0IG5hbWUgYW5kIHNhdmVcbiAgICB0aGUgZWRpdG9yIGNvbnRlbnRzIGluIHRoYXQgZmlsZS5cblxuICAgIElmIG5vIGZpbGVuYW1lIGlzIHByb3ZpZGVkLCBzYXZlIHRoZSBleGlzdGluZyBmaWxlIHJlZmVyZW5jZWQgYnkgdGhlIGVkaXRvclxuICAgIHdpdGggdGhlIGN1cnJlbnQgZWRpdG9yIGNvbnRlbnRzLiAgSWYgbm8gZmlsZW5hbWUgaGFzIGJlZW4gc2V0IHlldCwganVzdFxuICAgIHNldCB0aGUgbmFtZSB0byBcIlVudGl0bGVkXCIuXG5cbiAgKi9cbiAgZnVuY3Rpb24gc2F2ZShuZXdGaWxlbmFtZSkge1xuICAgIHZhciB1c2VOYW1lLCBjcmVhdGU7XG4gICAgaWYobmV3RmlsZW5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdXNlTmFtZSA9IG5ld0ZpbGVuYW1lO1xuICAgICAgY3JlYXRlID0gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSBpZihmaWxlbmFtZSA9PT0gZmFsc2UpIHtcbiAgICAgIGZpbGVuYW1lID0gXCJVbnRpdGxlZFwiO1xuICAgICAgY3JlYXRlID0gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB1c2VOYW1lID0gZmlsZW5hbWU7IC8vIEEgY2xvc2VkLW92ZXIgdmFyaWFibGVcbiAgICAgIGNyZWF0ZSA9IGZhbHNlO1xuICAgIH1cbiAgICB3aW5kb3cuc3RpY2tNZXNzYWdlKFwiU2F2aW5nLi4uXCIpO1xuICAgIHZhciBzYXZlZFByb2dyYW0gPSBwcm9ncmFtVG9TYXZlLnRoZW4oZnVuY3Rpb24ocCkge1xuICAgICAgaWYocCAhPT0gbnVsbCAmJiBwLnNoYXJlZCAmJiAhY3JlYXRlKSB7XG4gICAgICAgIHJldHVybiBwOyAvLyBEb24ndCB0cnkgdG8gc2F2ZSBzaGFyZWQgZmlsZXNcbiAgICAgIH1cbiAgICAgIGlmKGNyZWF0ZSkge1xuICAgICAgICBwcm9ncmFtVG9TYXZlID0gc3RvcmFnZUFQSVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGFwaSkgeyByZXR1cm4gYXBpLmNyZWF0ZUZpbGUodXNlTmFtZSwge2ZpbGVFeHRlbnNpb246IFwieG1sXCJ9KTsgfSlcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihwKSB7XG4gICAgICAgICAgICAvLyBzaG93U2hhcmVDb250YWluZXIocCk7IFRPRE8oam9lKTogZmlndXJlIG91dCB3aGVyZSB0byBwdXQgdGhpc1xuICAgICAgICAgICAgaGlzdG9yeS5wdXNoU3RhdGUobnVsbCwgbnVsbCwgXCIjcHJvZ3JhbT1cIiArIHAuZ2V0VW5pcXVlSWQoKSk7XG4gICAgICAgICAgICB1cGRhdGVOYW1lKHApOyAvLyBzZXRzIGZpbGVuYW1lXG4gICAgICAgICAgICBlbmFibGVGaWxlT3B0aW9ucygpO1xuICAgICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBwcm9ncmFtVG9TYXZlLnRoZW4oZnVuY3Rpb24ocCkge1xuICAgICAgICAgIHJldHVybiBzYXZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBwcm9ncmFtVG9TYXZlLnRoZW4oZnVuY3Rpb24ocCkge1xuICAgICAgICAgIGlmKHAgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCB0b1NhdmUgPSBDUE8uYmxvY2tzSURFLmdldFNwcml0ZVNjcmlwdHNYTUwoKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU2F2aW5nIFwiICwgdG9TYXZlKTtcbiAgICAgICAgICAgIHJldHVybiBwLnNhdmUodG9TYXZlLCBmYWxzZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKHApIHtcbiAgICAgICAgICBpZihwICE9PSBudWxsKSB7XG4gICAgICAgICAgICB3aW5kb3cuZmxhc2hNZXNzYWdlKFwiUHJvZ3JhbSBzYXZlZCBhcyBcIiArIHAuZ2V0TmFtZSgpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHA7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHNhdmVkUHJvZ3JhbS5mYWlsKGZ1bmN0aW9uKGVycikge1xuICAgICAgd2luZG93LnN0aWNrRXJyb3IoXCJVbmFibGUgdG8gc2F2ZVwiLCBcIllvdXIgaW50ZXJuZXQgY29ubmVjdGlvbiBtYXkgYmUgZG93biwgb3Igc29tZXRoaW5nIGVsc2UgbWlnaHQgYmUgd3Jvbmcgd2l0aCB0aGlzIHNpdGUgb3Igc2F2aW5nIHRvIEdvb2dsZS4gIFlvdSBzaG91bGQgYmFjayB1cCBhbnkgY2hhbmdlcyB0byB0aGlzIHByb2dyYW0gc29tZXdoZXJlIGVsc2UuICBZb3UgY2FuIHRyeSBzYXZpbmcgYWdhaW4gdG8gc2VlIGlmIHRoZSBwcm9ibGVtIHdhcyB0ZW1wb3JhcnksIGFzIHdlbGwuXCIpO1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH0pO1xuICAgIHJldHVybiBzYXZlZFByb2dyYW07XG4gIH1cblxuICBmdW5jdGlvbiBzYXZlQXMoKSB7XG4gICAgaWYobWVudUl0ZW1EaXNhYmxlZChcInNhdmVhc1wiKSkgeyByZXR1cm47IH1cbiAgICBwcm9ncmFtVG9TYXZlLnRoZW4oZnVuY3Rpb24ocCkge1xuICAgICAgdmFyIG5hbWUgPSBwID09PSBudWxsID8gXCJVbnRpdGxlZFwiIDogcC5nZXROYW1lKCk7XG4gICAgICB2YXIgc2F2ZUFzUHJvbXB0ID0gbmV3IG1vZGFsUHJvbXB0KHtcbiAgICAgICAgdGl0bGU6IFwiU2F2ZSBhIGNvcHlcIixcbiAgICAgICAgc3R5bGU6IFwidGV4dFwiLFxuICAgICAgICBzdWJtaXRUZXh0OiBcIlNhdmVcIixcbiAgICAgICAgbmFycm93OiB0cnVlLFxuICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbWVzc2FnZTogXCJUaGUgbmFtZSBmb3IgdGhlIGNvcHk6XCIsXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU6IG5hbWVcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHNhdmVBc1Byb21wdC5zaG93KCkudGhlbihmdW5jdGlvbihuZXdOYW1lKSB7XG4gICAgICAgIGlmKG5ld05hbWUgPT09IG51bGwpIHsgcmV0dXJuIG51bGw7IH1cbiAgICAgICAgd2luZG93LnN0aWNrTWVzc2FnZShcIlNhdmluZy4uLlwiKTtcbiAgICAgICAgcmV0dXJuIHNhdmUobmV3TmFtZSk7XG4gICAgICB9KS5cbiAgICAgIGZhaWwoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gcmVuYW1lOiBcIiwgZXJyKTtcbiAgICAgICAgd2luZG93LmZsYXNoRXJyb3IoXCJGYWlsZWQgdG8gcmVuYW1lIGZpbGVcIik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmFtZSgpIHtcbiAgICBwcm9ncmFtVG9TYXZlLnRoZW4oZnVuY3Rpb24ocCkge1xuICAgICAgdmFyIHJlbmFtZVByb21wdCA9IG5ldyBtb2RhbFByb21wdCh7XG4gICAgICAgIHRpdGxlOiBcIlJlbmFtZSB0aGlzIGZpbGVcIixcbiAgICAgICAgc3R5bGU6IFwidGV4dFwiLFxuICAgICAgICBuYXJyb3c6IHRydWUsXG4gICAgICAgIHN1Ym1pdFRleHQ6IFwiUmVuYW1lXCIsXG4gICAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBtZXNzYWdlOiBcIlRoZSBuZXcgbmFtZSBmb3IgdGhlIGZpbGU6XCIsXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU6IHAuZ2V0TmFtZSgpXG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9KTtcbiAgICAgIC8vIG51bGwgcmV0dXJuIHZhbHVlcyBhcmUgZm9yIHRoZSBcImNhbmNlbFwiIHBhdGhcbiAgICAgIHJldHVybiByZW5hbWVQcm9tcHQuc2hvdygpLnRoZW4oZnVuY3Rpb24obmV3TmFtZSkge1xuICAgICAgICBpZihuZXdOYW1lID09PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgd2luZG93LnN0aWNrTWVzc2FnZShcIlJlbmFtaW5nLi4uXCIpO1xuICAgICAgICBwcm9ncmFtVG9TYXZlID0gcC5yZW5hbWUobmV3TmFtZSk7XG4gICAgICAgIHJldHVybiBwcm9ncmFtVG9TYXZlO1xuICAgICAgfSlcbiAgICAgIC50aGVuKGZ1bmN0aW9uKHApIHtcbiAgICAgICAgaWYocCA9PT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHVwZGF0ZU5hbWUocCk7XG4gICAgICAgIHdpbmRvdy5mbGFzaE1lc3NhZ2UoXCJQcm9ncmFtIHNhdmVkIGFzIFwiICsgcC5nZXROYW1lKCkpO1xuICAgICAgfSlcbiAgICAgIC5mYWlsKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIHJlbmFtZTogXCIsIGVycik7XG4gICAgICAgIHdpbmRvdy5mbGFzaEVycm9yKFwiRmFpbGVkIHRvIHJlbmFtZSBmaWxlXCIpO1xuICAgICAgfSk7XG4gICAgfSlcbiAgICAuZmFpbChmdW5jdGlvbihlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmFibGUgdG8gcmVuYW1lOiBcIiwgZXJyKTtcbiAgICB9KTtcbiAgfVxuXG4gICQoXCIjcnVuQnV0dG9uXCIpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgIENQTy5hdXRvU2F2ZSgpO1xuICB9KTtcblxuICAkKFwiI25ld1wiKS5jbGljayhuZXdFdmVudCk7XG4gICQoXCIjc2F2ZVwiKS5jbGljayhzYXZlRXZlbnQpO1xuICAkKFwiI3JlbmFtZVwiKS5jbGljayhyZW5hbWUpO1xuICAkKFwiI3NhdmVhc1wiKS5jbGljayhzYXZlQXMpO1xuXG4gIHZhciBmb2N1c2FibGVFbHRzID0gJChkb2N1bWVudCkuZmluZCgnI2hlYWRlciAuZm9jdXNhYmxlJyk7XG4gIC8vY29uc29sZS5sb2coJ2ZvY3VzYWJsZUVsdHM9JywgZm9jdXNhYmxlRWx0cylcbiAgdmFyIHRoZVRvb2xiYXIgPSAkKGRvY3VtZW50KS5maW5kKCcjVG9vbGJhcicpO1xuXG4gIGZ1bmN0aW9uIGdldFRvcFRpZXJNZW51aXRlbXMoKSB7XG4gICAgLy9jb25zb2xlLmxvZygnZG9pbmcgZ2V0VG9wVGllck1lbnVpdGVtcycpXG4gICAgdmFyIHRvcFRpZXJNZW51aXRlbXMgPSAkKGRvY3VtZW50KS5maW5kKCcjaGVhZGVyIHVsIGxpLnRvcFRpZXInKS50b0FycmF5KCk7XG4gICAgdG9wVGllck1lbnVpdGVtcyA9IHRvcFRpZXJNZW51aXRlbXMuXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXIoZWx0ID0+ICEoZWx0LnN0eWxlLmRpc3BsYXkgPT09ICdub25lJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsdC5nZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJykgPT09ICdkaXNhYmxlZCcpKTtcbiAgICB2YXIgbnVtVG9wVGllck1lbnVpdGVtcyA9IHRvcFRpZXJNZW51aXRlbXMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbnVtVG9wVGllck1lbnVpdGVtczsgaSsrKSB7XG4gICAgICB2YXIgaXRoVG9wVGllck1lbnVpdGVtID0gdG9wVGllck1lbnVpdGVtc1tpXTtcbiAgICAgIHZhciBpQ2hpbGQgPSAkKGl0aFRvcFRpZXJNZW51aXRlbSkuY2hpbGRyZW4oKS5maXJzdCgpO1xuICAgICAgLy9jb25zb2xlLmxvZygnaUNoaWxkPScsIGlDaGlsZCk7XG4gICAgICBpQ2hpbGQuZmluZCgnLmZvY3VzYWJsZScpLlxuICAgICAgICBhdHRyKCdhcmlhLXNldHNpemUnLCBudW1Ub3BUaWVyTWVudWl0ZW1zLnRvU3RyaW5nKCkpLlxuICAgICAgICBhdHRyKCdhcmlhLXBvc2luc2V0JywgKGkrMSkudG9TdHJpbmcoKSk7XG4gICAgfVxuICAgIHJldHVybiB0b3BUaWVyTWVudWl0ZW1zO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlRWRpdG9ySGVpZ2h0KCkge1xuICAgIHZhciB0b29sYmFySGVpZ2h0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3RvcFRpZXJVbCcpLm9mZnNldEhlaWdodDtcbiAgICAvLyBnZXRzIGJ1bXBlZCB0byA2NyBvbiBpbml0aWFsIHJlc2l6ZSBwZXJ0dXJiYXRpb24sIGJ1dCBhY3R1YWwgdmFsdWUgaXMgaW5kZWVkIDQwXG4gICAgaWYgKHRvb2xiYXJIZWlnaHQgPCA4MCkgdG9vbGJhckhlaWdodCA9IDQwO1xuICAgIHRvb2xiYXJIZWlnaHQgKz0gJ3B4JztcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnUkVQTCcpLnN0eWxlLnBhZGRpbmdUb3AgPSB0b29sYmFySGVpZ2h0O1xuICAgIHZhciBkb2NNYWluID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21haW4nKTtcbiAgICB2YXIgZG9jUmVwbE1haW4gPSBkb2NNYWluLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3JlcGxNYWluJyk7XG4gICAgaWYgKGRvY1JlcGxNYWluLmxlbmd0aCAhPT0gMCkge1xuICAgICAgZG9jUmVwbE1haW5bMF0uc3R5bGUucGFkZGluZ1RvcCA9IHRvb2xiYXJIZWlnaHQ7XG4gICAgfVxuICB9XG5cbiAgJCh3aW5kb3cpLm9uKCdyZXNpemUnLCB1cGRhdGVFZGl0b3JIZWlnaHQpO1xuXG4gIGZ1bmN0aW9uIGluc2VydEFyaWFQb3Moc3VibWVudSkge1xuICAgIC8vY29uc29sZS5sb2coJ2RvaW5nIGluc2VydEFyaWFQb3MnLCBzdWJtZW51KVxuICAgIHZhciBhcnIgPSBzdWJtZW51LnRvQXJyYXkoKTtcbiAgICAvL2NvbnNvbGUubG9nKCdhcnI9JywgYXJyKTtcbiAgICB2YXIgbGVuID0gYXJyLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICB2YXIgZWx0ID0gYXJyW2ldO1xuICAgICAgLy9jb25zb2xlLmxvZygnZWx0JywgaSwgJz0nLCBlbHQpO1xuICAgICAgZWx0LnNldEF0dHJpYnV0ZSgnYXJpYS1zZXRzaXplJywgbGVuLnRvU3RyaW5nKCkpO1xuICAgICAgZWx0LnNldEF0dHJpYnV0ZSgnYXJpYS1wb3NpbnNldCcsIChpKzEpLnRvU3RyaW5nKCkpO1xuICAgIH1cbiAgfVxuXG5cbiAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbiAoKSB7XG4gICAgaGlkZUFsbFRvcE1lbnVpdGVtcygpO1xuICB9KTtcblxuICB0aGVUb29sYmFyLmNsaWNrKGZ1bmN0aW9uIChlKSB7XG4gICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfSk7XG5cbiAgdGhlVG9vbGJhci5rZXlkb3duKGZ1bmN0aW9uIChlKSB7XG4gICAgLy9jb25zb2xlLmxvZygndG9vbGJhciBrZXlkb3duJywgZSk7XG4gICAgLy9tb3N0IGFueSBrZXkgYXQgYWxsXG4gICAgdmFyIGtjID0gZS5rZXlDb2RlO1xuICAgIGlmIChrYyA9PT0gMjcpIHtcbiAgICAgIC8vIGVzY2FwZVxuICAgICAgaGlkZUFsbFRvcE1lbnVpdGVtcygpO1xuICAgICAgLy9jb25zb2xlLmxvZygnY2FsbGluZyBjeWNsZUZvY3VzIGZyb20gdG9vbGJhcicpXG4gICAgICBDUE8uY3ljbGVGb2N1cygpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9IGVsc2UgaWYgKGtjID09PSA5IHx8IGtjID09PSAzNyB8fCBrYyA9PT0gMzggfHwga2MgPT09IDM5IHx8IGtjID09PSA0MCkge1xuICAgICAgLy8gYW4gYXJyb3dcbiAgICAgIHZhciB0YXJnZXQgPSAkKHRoaXMpLmZpbmQoJ1t0YWJJbmRleD0tMV0nKTtcbiAgICAgIGdldFRvcFRpZXJNZW51aXRlbXMoKTtcbiAgICAgIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpOyAvL25lZWRlZD9cbiAgICAgIHRhcmdldC5maXJzdCgpLmZvY3VzKCk7IC8vbmVlZGVkP1xuICAgICAgLy9jb25zb2xlLmxvZygnZG9jYWN0ZWx0PScsIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaGlkZUFsbFRvcE1lbnVpdGVtcygpO1xuICAgIH1cbiAgfSk7XG5cbiAgZnVuY3Rpb24gY2xpY2tUb3BNZW51aXRlbShlKSB7XG4gICAgaGlkZUFsbFRvcE1lbnVpdGVtcygpO1xuICAgIHZhciB0aGlzRWx0ID0gJCh0aGlzKTtcbiAgICAvL2NvbnNvbGUubG9nKCdkb2luZyBjbGlja1RvcE1lbnVpdGVtIG9uJywgdGhpc0VsdCk7XG4gICAgdmFyIHRvcFRpZXJVbCA9IHRoaXNFbHQuY2xvc2VzdCgndWxbaWQ9dG9wVGllclVsXScpO1xuICAgIGlmICh0aGlzRWx0WzBdLmhhc0F0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpc0VsdFswXS5nZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJykgPT09ICdkaXNhYmxlZCcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy92YXIgaGlkZGVuUCA9ICh0aGlzRWx0WzBdLmdldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcpID09PSAnZmFsc2UnKTtcbiAgICAvL2hpZGRlblAgYWx3YXlzIGZhbHNlP1xuICAgIHZhciB0aGlzVG9wTWVudWl0ZW0gPSB0aGlzRWx0LmNsb3Nlc3QoJ2xpLnRvcFRpZXInKTtcbiAgICAvL2NvbnNvbGUubG9nKCd0aGlzVG9wTWVudWl0ZW09JywgdGhpc1RvcE1lbnVpdGVtKTtcbiAgICB2YXIgdDEgPSB0aGlzVG9wTWVudWl0ZW1bMF07XG4gICAgdmFyIHN1Ym1lbnVPcGVuID0gKHRoaXNFbHRbMF0uZ2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJykgPT09ICd0cnVlJyk7XG4gICAgaWYgKCFzdWJtZW51T3Blbikge1xuICAgICAgLy9jb25zb2xlLmxvZygnaGlkZGVucCB0cnVlIGJyYW5jaCcpO1xuICAgICAgaGlkZUFsbFRvcE1lbnVpdGVtcygpO1xuICAgICAgdGhpc1RvcE1lbnVpdGVtLmNoaWxkcmVuKCd1bC5zdWJtZW51JykuYXR0cignYXJpYS1oaWRkZW4nLCAnZmFsc2UnKS5zaG93KCk7XG4gICAgICB0aGlzVG9wTWVudWl0ZW0uY2hpbGRyZW4oKS5maXJzdCgpLmZpbmQoJ1thcmlhLWV4cGFuZGVkXScpLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAndHJ1ZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdoaWRkZW5wIGZhbHNlIGJyYW5jaCcpO1xuICAgICAgdGhpc1RvcE1lbnVpdGVtLmNoaWxkcmVuKCd1bC5zdWJtZW51JykuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpLmhpZGUoKTtcbiAgICAgIHRoaXNUb3BNZW51aXRlbS5jaGlsZHJlbigpLmZpcnN0KCkuZmluZCgnW2FyaWEtZXhwYW5kZWRdJykuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xuICAgIH1cbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICB9XG5cbiAgdmFyIGV4cGFuZGFibGVFbHRzID0gJChkb2N1bWVudCkuZmluZCgnI2hlYWRlciBbYXJpYS1leHBhbmRlZF0nKTtcbiAgZXhwYW5kYWJsZUVsdHMuY2xpY2soY2xpY2tUb3BNZW51aXRlbSk7XG5cbiAgZnVuY3Rpb24gaGlkZUFsbFRvcE1lbnVpdGVtcygpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdkb2luZyBoaWRlQWxsVG9wTWVudWl0ZW1zJyk7XG4gICAgdmFyIHRvcFRpZXJVbCA9ICQoZG9jdW1lbnQpLmZpbmQoJyNoZWFkZXIgdWxbaWQ9dG9wVGllclVsXScpO1xuICAgIHRvcFRpZXJVbC5maW5kKCdbYXJpYS1leHBhbmRlZF0nKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgdG9wVGllclVsLmZpbmQoJ3VsLnN1Ym1lbnUnKS5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJykuaGlkZSgpO1xuICB9XG5cbiAgdmFyIG5vbmV4cGFuZGFibGVFbHRzID0gJChkb2N1bWVudCkuZmluZCgnI2hlYWRlciAudG9wVGllciA+IGRpdiA+IGJ1dHRvbjpub3QoW2FyaWEtZXhwYW5kZWRdKScpO1xuICBub25leHBhbmRhYmxlRWx0cy5jbGljayhoaWRlQWxsVG9wTWVudWl0ZW1zKTtcblxuICBmdW5jdGlvbiBzd2l0Y2hUb3BNZW51aXRlbShkZXN0VG9wTWVudWl0ZW0sIGRlc3RFbHQpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdkb2luZyBzd2l0Y2hUb3BNZW51aXRlbScsIGRlc3RUb3BNZW51aXRlbSwgZGVzdEVsdCk7XG4gICAgLy9jb25zb2xlLmxvZygnZHRtaWw9JywgZGVzdFRvcE1lbnVpdGVtLmxlbmd0aCk7XG4gICAgaGlkZUFsbFRvcE1lbnVpdGVtcygpO1xuICAgIGlmIChkZXN0VG9wTWVudWl0ZW0gJiYgZGVzdFRvcE1lbnVpdGVtLmxlbmd0aCAhPT0gMCkge1xuICAgICAgdmFyIGVsdCA9IGRlc3RUb3BNZW51aXRlbVswXTtcbiAgICAgIHZhciBlbHRJZCA9IGVsdC5nZXRBdHRyaWJ1dGUoJ2lkJyk7XG4gICAgICBkZXN0VG9wTWVudWl0ZW0uY2hpbGRyZW4oJ3VsLnN1Ym1lbnUnKS5hdHRyKCdhcmlhLWhpZGRlbicsICdmYWxzZScpLnNob3coKTtcbiAgICAgIGRlc3RUb3BNZW51aXRlbS5jaGlsZHJlbigpLmZpcnN0KCkuZmluZCgnW2FyaWEtZXhwYW5kZWRdJykuYXR0cignYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgfVxuICAgIGlmIChkZXN0RWx0KSB7XG4gICAgICAvL2Rlc3RFbHQuYXR0cigndGFiSW5kZXgnLCAnMCcpLmZvY3VzKCk7XG4gICAgICBkZXN0RWx0LmZvY3VzKCk7XG4gICAgfVxuICB9XG5cbiAgdmFyIHNob3dpbmdIZWxwS2V5cyA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIHNob3dIZWxwS2V5cygpIHtcbiAgICBzaG93aW5nSGVscEtleXMgPSB0cnVlO1xuICAgICQoJyNoZWxwLWtleXMnKS5mYWRlSW4oMTAwKTtcbiAgICByZWNpdGVIZWxwKCk7XG4gIH1cblxuICBmb2N1c2FibGVFbHRzLmtleWRvd24oZnVuY3Rpb24gKGUpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdmb2N1c2FibGUgZWx0IGtleWRvd24nLCBlKTtcbiAgICB2YXIga2MgPSBlLmtleUNvZGU7XG4gICAgLy8kKHRoaXMpLmJsdXIoKTsgLy8gRGVsZXRlP1xuICAgIHZhciB3aXRoaW5TZWNvbmRUaWVyVWwgPSB0cnVlO1xuICAgIHZhciB0b3BUaWVyVWwgPSAkKHRoaXMpLmNsb3Nlc3QoJ3VsW2lkPXRvcFRpZXJVbF0nKTtcbiAgICB2YXIgc2Vjb25kVGllclVsID0gJCh0aGlzKS5jbG9zZXN0KCd1bC5zdWJtZW51Jyk7XG4gICAgaWYgKHNlY29uZFRpZXJVbC5sZW5ndGggPT09IDApIHtcbiAgICAgIHdpdGhpblNlY29uZFRpZXJVbCA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAoa2MgPT09IDI3KSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdlc2NhcGUgcHJlc3NlZCBpJylcbiAgICAgICQoJyNoZWxwLWtleXMnKS5mYWRlT3V0KDUwMCk7XG4gICAgfVxuICAgIGlmIChrYyA9PT0gMjcgJiYgd2l0aGluU2Vjb25kVGllclVsKSB7IC8vIGVzY2FwZVxuICAgICAgdmFyIGRlc3RUb3BNZW51aXRlbSA9ICQodGhpcykuY2xvc2VzdCgnbGkudG9wVGllcicpO1xuICAgICAgdmFyIHBvc3NFbHRzID0gZGVzdFRvcE1lbnVpdGVtLmZpbmQoJy5mb2N1c2FibGU6bm90KFtkaXNhYmxlZF0pJykuZmlsdGVyKCc6dmlzaWJsZScpO1xuICAgICAgc3dpdGNoVG9wTWVudWl0ZW0oZGVzdFRvcE1lbnVpdGVtLCBwb3NzRWx0cy5maXJzdCgpKTtcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSBlbHNlIGlmIChrYyA9PT0gMzkpIHsgLy8gcmlnaHRhcnJvd1xuICAgICAgLy9jb25zb2xlLmxvZygncmlnaHRhcnJvdyBwcmVzc2VkJyk7XG4gICAgICB2YXIgc3JjVG9wTWVudWl0ZW0gPSAkKHRoaXMpLmNsb3Nlc3QoJ2xpLnRvcFRpZXInKTtcbiAgICAgIC8vY29uc29sZS5sb2coJ3NyY1RvcE1lbnVpdGVtPScsIHNyY1RvcE1lbnVpdGVtKTtcbiAgICAgIHNyY1RvcE1lbnVpdGVtLmNoaWxkcmVuKCkuZmlyc3QoKS5maW5kKCcuZm9jdXNhYmxlJykuYXR0cigndGFiSW5kZXgnLCAnLTEnKTtcbiAgICAgIHZhciB0b3BUaWVyTWVudWl0ZW1zID0gZ2V0VG9wVGllck1lbnVpdGVtcygpO1xuICAgICAgLy9jb25zb2xlLmxvZygndHRtaSogPScsIHRvcFRpZXJNZW51aXRlbXMpO1xuICAgICAgdmFyIHR0bWlOID0gdG9wVGllck1lbnVpdGVtcy5sZW5ndGg7XG4gICAgICB2YXIgaiA9IHRvcFRpZXJNZW51aXRlbXMuaW5kZXhPZihzcmNUb3BNZW51aXRlbVswXSk7XG4gICAgICAvL2NvbnNvbGUubG9nKCdqIGluaXRpYWw9Jywgaik7XG4gICAgICBmb3IgKHZhciBpID0gKGogKyAxKSAlIHR0bWlOOyBpICE9PSBqOyBpID0gKGkgKyAxKSAlIHR0bWlOKSB7XG4gICAgICAgIHZhciBkZXN0VG9wTWVudWl0ZW0gPSAkKHRvcFRpZXJNZW51aXRlbXNbaV0pO1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdkZXN0VG9wTWVudWl0ZW0oYSk9JywgZGVzdFRvcE1lbnVpdGVtKTtcbiAgICAgICAgdmFyIHBvc3NFbHRzID0gZGVzdFRvcE1lbnVpdGVtLmZpbmQoJy5mb2N1c2FibGU6bm90KFtkaXNhYmxlZF0pJykuZmlsdGVyKCc6dmlzaWJsZScpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdwb3NzRWx0cz0nLCBwb3NzRWx0cylcbiAgICAgICAgaWYgKHBvc3NFbHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKCdmaW5hbCBpPScsIGkpO1xuICAgICAgICAgIC8vY29uc29sZS5sb2coJ2xhbmRpbmcgb24nLCBwb3NzRWx0cy5maXJzdCgpKTtcbiAgICAgICAgICBzd2l0Y2hUb3BNZW51aXRlbShkZXN0VG9wTWVudWl0ZW0sIHBvc3NFbHRzLmZpcnN0KCkpO1xuICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGtjID09PSAzNykgeyAvLyBsZWZ0YXJyb3dcbiAgICAgIC8vY29uc29sZS5sb2coJ2xlZnRhcnJvdyBwcmVzc2VkJyk7XG4gICAgICB2YXIgc3JjVG9wTWVudWl0ZW0gPSAkKHRoaXMpLmNsb3Nlc3QoJ2xpLnRvcFRpZXInKTtcbiAgICAgIC8vY29uc29sZS5sb2coJ3NyY1RvcE1lbnVpdGVtPScsIHNyY1RvcE1lbnVpdGVtKTtcbiAgICAgIHNyY1RvcE1lbnVpdGVtLmNoaWxkcmVuKCkuZmlyc3QoKS5maW5kKCcuZm9jdXNhYmxlJykuYXR0cigndGFiSW5kZXgnLCAnLTEnKTtcbiAgICAgIHZhciB0b3BUaWVyTWVudWl0ZW1zID0gZ2V0VG9wVGllck1lbnVpdGVtcygpO1xuICAgICAgLy9jb25zb2xlLmxvZygndHRtaSogPScsIHRvcFRpZXJNZW51aXRlbXMpO1xuICAgICAgdmFyIHR0bWlOID0gdG9wVGllck1lbnVpdGVtcy5sZW5ndGg7XG4gICAgICB2YXIgaiA9IHRvcFRpZXJNZW51aXRlbXMuaW5kZXhPZihzcmNUb3BNZW51aXRlbVswXSk7XG4gICAgICAvL2NvbnNvbGUubG9nKCdqIGluaXRpYWw9Jywgaik7XG4gICAgICBmb3IgKHZhciBpID0gKGogKyB0dG1pTiAtIDEpICUgdHRtaU47IGkgIT09IGo7IGkgPSAoaSArIHR0bWlOIC0gMSkgJSB0dG1pTikge1xuICAgICAgICB2YXIgZGVzdFRvcE1lbnVpdGVtID0gJCh0b3BUaWVyTWVudWl0ZW1zW2ldKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnZGVzdFRvcE1lbnVpdGVtKGIpPScsIGRlc3RUb3BNZW51aXRlbSk7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ2k9JywgaSlcbiAgICAgICAgdmFyIHBvc3NFbHRzID0gZGVzdFRvcE1lbnVpdGVtLmZpbmQoJy5mb2N1c2FibGU6bm90KFtkaXNhYmxlZF0pJykuZmlsdGVyKCc6dmlzaWJsZScpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdwb3NzRWx0cz0nLCBwb3NzRWx0cylcbiAgICAgICAgaWYgKHBvc3NFbHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKCdmaW5hbCBpPScsIGkpO1xuICAgICAgICAgIC8vY29uc29sZS5sb2coJ2xhbmRpbmcgb24nLCBwb3NzRWx0cy5maXJzdCgpKTtcbiAgICAgICAgICBzd2l0Y2hUb3BNZW51aXRlbShkZXN0VG9wTWVudWl0ZW0sIHBvc3NFbHRzLmZpcnN0KCkpO1xuICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGtjID09PSAzOCkgeyAvLyB1cGFycm93XG4gICAgICAvL2NvbnNvbGUubG9nKCd1cGFycm93IHByZXNzZWQnKTtcbiAgICAgIHZhciBzdWJtZW51O1xuICAgICAgaWYgKHdpdGhpblNlY29uZFRpZXJVbCkge1xuICAgICAgICB2YXIgbmVhclNpYnMgPSAkKHRoaXMpLmNsb3Nlc3QoJ2RpdicpLmZpbmQoJy5mb2N1c2FibGUnKS5maWx0ZXIoJzp2aXNpYmxlJyk7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ25lYXJTaWJzPScsIG5lYXJTaWJzKTtcbiAgICAgICAgdmFyIG15SWQgPSAkKHRoaXMpWzBdLmdldEF0dHJpYnV0ZSgnaWQnKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnbXlJZD0nLCBteUlkKTtcbiAgICAgICAgc3VibWVudSA9ICQoW10pO1xuICAgICAgICB2YXIgdGhpc0VuY291bnRlcmVkID0gZmFsc2U7XG4gICAgICAgIGZvciAodmFyIGkgPSBuZWFyU2licy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgIGlmICh0aGlzRW5jb3VudGVyZWQpIHtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ2FkZGluZycsIG5lYXJTaWJzW2ldKTtcbiAgICAgICAgICAgIHN1Ym1lbnUgPSBzdWJtZW51LmFkZCgkKG5lYXJTaWJzW2ldKSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChuZWFyU2lic1tpXS5nZXRBdHRyaWJ1dGUoJ2lkJykgPT09IG15SWQpIHtcbiAgICAgICAgICAgIHRoaXNFbmNvdW50ZXJlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vY29uc29sZS5sb2coJ3N1Ym1lbnUgc28gZmFyPScsIHN1Ym1lbnUpO1xuICAgICAgICB2YXIgZmFyU2licyA9ICQodGhpcykuY2xvc2VzdCgnbGknKS5wcmV2QWxsKCkuZmluZCgnZGl2Om5vdCguZGlzYWJsZWQpJylcbiAgICAgICAgICAuZmluZCgnLmZvY3VzYWJsZScpLmZpbHRlcignOnZpc2libGUnKTtcbiAgICAgICAgc3VibWVudSA9IHN1Ym1lbnUuYWRkKGZhclNpYnMpO1xuICAgICAgICBpZiAoc3VibWVudS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBzdWJtZW51ID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpLmNsb3Nlc3QoJ3VsJykuZmluZCgnZGl2Om5vdCguZGlzYWJsZWQpJylcbiAgICAgICAgICAuZmluZCgnLmZvY3VzYWJsZScpLmZpbHRlcignOnZpc2libGUnKS5sYXN0KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN1Ym1lbnUubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHN1Ym1lbnUubGFzdCgpLmZvY3VzKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLypcbiAgICAgICAgICAvL2NvbnNvbGUubG9nKCdubyBhY3Rpb25hYmxlIHN1Ym1lbnUgZm91bmQnKVxuICAgICAgICAgIHZhciB0b3BtZW51SXRlbSA9ICQodGhpcykuY2xvc2VzdCgndWwuc3VibWVudScpLmNsb3Nlc3QoJ2xpJylcbiAgICAgICAgICAuY2hpbGRyZW4oKS5maXJzdCgpLmZpbmQoJy5mb2N1c2FibGU6bm90KFtkaXNhYmxlZF0pJykuZmlsdGVyKCc6dmlzaWJsZScpO1xuICAgICAgICAgIGlmICh0b3BtZW51SXRlbS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0b3BtZW51SXRlbS5maXJzdCgpLmZvY3VzKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ25vIGFjdGlvbmFibGUgdG9wbWVudWl0ZW0gZm91bmQgZWl0aGVyJylcbiAgICAgICAgICB9XG4gICAgICAgICAgKi9cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9IGVsc2UgaWYgKGtjID09PSA0MCkgeyAvLyBkb3duYXJyb3dcbiAgICAgIC8vY29uc29sZS5sb2coJ2Rvd25hcnJvdyBwcmVzc2VkJyk7XG4gICAgICB2YXIgc3VibWVudURpdnM7XG4gICAgICB2YXIgc3VibWVudTtcbiAgICAgIGlmICghd2l0aGluU2Vjb25kVGllclVsKSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJzFzdCB0aWVyJylcbiAgICAgICAgc3VibWVudURpdnMgPSAkKHRoaXMpLmNsb3Nlc3QoJ2xpJykuY2hpbGRyZW4oJ3VsJykuZmluZCgnZGl2Om5vdCguZGlzYWJsZWQpJyk7XG4gICAgICAgIHN1Ym1lbnUgPSBzdWJtZW51RGl2cy5maW5kKCcuZm9jdXNhYmxlJykuZmlsdGVyKCc6dmlzaWJsZScpO1xuICAgICAgICBpbnNlcnRBcmlhUG9zKHN1Ym1lbnUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnMm5kIHRpZXInKVxuICAgICAgICB2YXIgbmVhclNpYnMgPSAkKHRoaXMpLmNsb3Nlc3QoJ2RpdicpLmZpbmQoJy5mb2N1c2FibGUnKS5maWx0ZXIoJzp2aXNpYmxlJyk7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ25lYXJTaWJzPScsIG5lYXJTaWJzKTtcbiAgICAgICAgdmFyIG15SWQgPSAkKHRoaXMpWzBdLmdldEF0dHJpYnV0ZSgnaWQnKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnbXlJZD0nLCBteUlkKTtcbiAgICAgICAgc3VibWVudSA9ICQoW10pO1xuICAgICAgICB2YXIgdGhpc0VuY291bnRlcmVkID0gZmFsc2U7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmVhclNpYnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAodGhpc0VuY291bnRlcmVkKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdhZGRpbmcnLCBuZWFyU2lic1tpXSk7XG4gICAgICAgICAgICBzdWJtZW51ID0gc3VibWVudS5hZGQoJChuZWFyU2lic1tpXSkpO1xuICAgICAgICAgIH0gZWxzZSBpZiAobmVhclNpYnNbaV0uZ2V0QXR0cmlidXRlKCdpZCcpID09PSBteUlkKSB7XG4gICAgICAgICAgICB0aGlzRW5jb3VudGVyZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvL2NvbnNvbGUubG9nKCdzdWJtZW51IHNvIGZhcj0nLCBzdWJtZW51KTtcbiAgICAgICAgdmFyIGZhclNpYnMgPSAkKHRoaXMpLmNsb3Nlc3QoJ2xpJykubmV4dEFsbCgpLmZpbmQoJ2Rpdjpub3QoLmRpc2FibGVkKScpXG4gICAgICAgICAgLmZpbmQoJy5mb2N1c2FibGUnKS5maWx0ZXIoJzp2aXNpYmxlJyk7XG4gICAgICAgIHN1Ym1lbnUgPSBzdWJtZW51LmFkZChmYXJTaWJzKTtcbiAgICAgICAgaWYgKHN1Ym1lbnUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgc3VibWVudSA9ICQodGhpcykuY2xvc2VzdCgnbGknKS5jbG9zZXN0KCd1bCcpLmZpbmQoJ2Rpdjpub3QoLmRpc2FibGVkKScpXG4gICAgICAgICAgICAuZmluZCgnLmZvY3VzYWJsZScpLmZpbHRlcignOnZpc2libGUnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy9jb25zb2xlLmxvZygnc3VibWVudT0nLCBzdWJtZW51KVxuICAgICAgaWYgKHN1Ym1lbnUubGVuZ3RoID4gMCkge1xuICAgICAgICBzdWJtZW51LmZpcnN0KCkuZm9jdXMoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ25vIGFjdGlvbmFibGUgc3VibWVudSBmb3VuZCcpXG4gICAgICB9XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0gZWxzZSBpZiAoa2MgPT09IDI3KSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdlc2MgcHJlc3NlZCcpO1xuICAgICAgaGlkZUFsbFRvcE1lbnVpdGVtcygpO1xuICAgICAgaWYgKHNob3dpbmdIZWxwS2V5cykge1xuICAgICAgICBzaG93aW5nSGVscEtleXMgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ2NhbGxpbmcgY3ljbGVGb2N1cyBpaScpXG4gICAgICAgIENQTy5jeWNsZUZvY3VzKCk7XG4gICAgICB9XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgLy8kKHRoaXMpLmNsb3Nlc3QoJ25hdicpLmNsb3Nlc3QoJ21haW4nKS5mb2N1cygpO1xuICAgIH0gZWxzZSBpZiAoa2MgPT09IDkgKSB7XG4gICAgICBpZiAoZS5zaGlmdEtleSkge1xuICAgICAgICBoaWRlQWxsVG9wTWVudWl0ZW1zKCk7XG4gICAgICAgIENQTy5jeWNsZUZvY3VzKHRydWUpO1xuICAgICAgfVxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB9IGVsc2UgaWYgKGtjID09PSAxMyB8fCBrYyA9PT0gMTcgfHwga2MgPT09IDIwIHx8IGtjID09PSAzMikge1xuICAgICAgLy8gMTM9ZW50ZXIgMTc9Y3RybCAyMD1jYXBzbG9jayAzMj1zcGFjZVxuICAgICAgLy9jb25zb2xlLmxvZygnc3RvcHByb3AgMScpXG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0gZWxzZSBpZiAoa2MgPj0gMTEyICYmIGtjIDw9IDEyMykge1xuICAgICAgLy9jb25zb2xlLmxvZygnZG9wcm9wIDEnKVxuICAgICAgLy8gZm4ga2V5c1xuICAgICAgLy8gZ28gYWhlYWQsIHByb3BhZ2F0ZVxuICAgIH0gZWxzZSBpZiAoZS5jdHJsS2V5ICYmIGtjID09PSAxOTEpIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ0MtPyBwcmVzc2VkJylcbiAgICAgIHNob3dIZWxwS2V5cygpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy9jb25zb2xlLmxvZygnc3RvcHByb3AgMicpXG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH1cbiAgICAvL2Uuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH0pO1xuXG4gIC8vIHNoYXJlQVBJLm1ha2VIb3Zlck1lbnUoJChcIiNmaWxlbWVudVwiKSwgJChcIiNmaWxlbWVudUNvbnRlbnRzXCIpLCBmYWxzZSwgZnVuY3Rpb24oKXt9KTtcbiAgLy8gc2hhcmVBUEkubWFrZUhvdmVyTWVudSgkKFwiI2Jvbm5pZW1lbnVcIiksICQoXCIjYm9ubmllbWVudUNvbnRlbnRzXCIpLCBmYWxzZSwgZnVuY3Rpb24oKXt9KTtcblxuXG4gIHZhciBjb2RlQ29udGFpbmVyID0gJChcIi5yZXBsTWFpblwiKVxuXG5cbiAgaWYocGFyYW1zW1wiZ2V0XCJdW1wiaGlkZURlZmluaXRpb25zXCJdKSB7XG4gICAgJChcIi5yZXBsTWFpblwiKS5hdHRyKFwiYXJpYS1oaWRkZW5cIiwgdHJ1ZSkuYXR0cihcInRhYmluZGV4XCIsICctMScpO1xuICB9XG5cbiAgaWYoIShcIndhcm5PbkV4aXRcIiBpbiBwYXJhbXNbXCJnZXRcIl0pIHx8IChwYXJhbXNbXCJnZXRcIl1bXCJ3YXJuT25FeGl0XCJdICE9PSBcImZhbHNlXCIpKSB7XG4gICAgJCh3aW5kb3cpLmJpbmQoXCJiZWZvcmV1bmxvYWRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gXCJCZWNhdXNlIHRoaXMgcGFnZSBjYW4gbG9hZCBzbG93bHksIGFuZCB5b3UgbWF5IGhhdmUgb3V0c3RhbmRpbmcgY2hhbmdlcywgd2UgYXNrIHRoYXQgeW91IGNvbmZpcm0gYmVmb3JlIGxlYXZpbmcgdGhlIGVkaXRvciBpbiBjYXNlIGNsb3Npbmcgd2FzIGFuIGFjY2lkZW50LlwiO1xuICAgIH0pO1xuICB9XG5cbiAgQ1BPLmVkaXRvciA9IENQTy5tYWtlRWRpdG9yKGNvZGVDb250YWluZXIsIHtcbiAgICBydW5CdXR0b246ICQoXCIjcnVuQnV0dG9uXCIpLFxuICAgIHNpbXBsZUVkaXRvcjogZmFsc2UsXG4gICAgcnVuOiBDUE8uUlVOX0NPREUsXG4gICAgaW5pdGlhbEdhczogMTAwLFxuICAgIHNjcm9sbFBhc3RFbmQ6IHRydWUsXG4gIH0pO1xuICBDUE8uZWRpdG9yLmNtLnNldE9wdGlvbihcInJlYWRPbmx5XCIsIFwibm9jdXJzb3JcIik7XG4gIENQTy5lZGl0b3IuY20uc2V0T3B0aW9uKFwibG9uZ0xpbmVzXCIsIG5ldyBNYXAoKSk7XG4gIGZ1bmN0aW9uIHJlbW92ZVNob3J0ZW5lZExpbmUobGluZUhhbmRsZSkge1xuICAgIHZhciBydWxlcnMgPSBDUE8uZWRpdG9yLmNtLmdldE9wdGlvbihcInJ1bGVyc1wiKTtcbiAgICB2YXIgcnVsZXJzTWluQ29sID0gQ1BPLmVkaXRvci5jbS5nZXRPcHRpb24oXCJydWxlcnNNaW5Db2xcIik7XG4gICAgdmFyIGxvbmdMaW5lcyA9IENQTy5lZGl0b3IuY20uZ2V0T3B0aW9uKFwibG9uZ0xpbmVzXCIpO1xuICAgIGlmIChsaW5lSGFuZGxlLnRleHQubGVuZ3RoIDw9IHJ1bGVyc01pbkNvbCkge1xuICAgICAgbGluZUhhbmRsZS5ydWxlckxpc3RlbmVycy5mb3JFYWNoKChmLCBldnQpID0+IGxpbmVIYW5kbGUub2ZmKGV2dCwgZikpO1xuICAgICAgbG9uZ0xpbmVzLmRlbGV0ZShsaW5lSGFuZGxlKTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKFwiUmVtb3ZlZCBcIiwgbGluZUhhbmRsZSk7XG4gICAgICByZWZyZXNoUnVsZXJzKCk7XG4gICAgfVxuICB9XG4gIGZ1bmN0aW9uIGRlbGV0ZUxpbmUobGluZUhhbmRsZSkge1xuICAgIHZhciBsb25nTGluZXMgPSBDUE8uZWRpdG9yLmNtLmdldE9wdGlvbihcImxvbmdMaW5lc1wiKTtcbiAgICBsaW5lSGFuZGxlLnJ1bGVyTGlzdGVuZXJzLmZvckVhY2goKGYsIGV2dCkgPT4gbGluZUhhbmRsZS5vZmYoZXZ0LCBmKSk7XG4gICAgbG9uZ0xpbmVzLmRlbGV0ZShsaW5lSGFuZGxlKTtcbiAgICAvLyBjb25zb2xlLmxvZyhcIlJlbW92ZWQgXCIsIGxpbmVIYW5kbGUpO1xuICAgIHJlZnJlc2hSdWxlcnMoKTtcbiAgfVxuICBmdW5jdGlvbiByZWZyZXNoUnVsZXJzKCkge1xuICAgIHZhciBydWxlcnMgPSBDUE8uZWRpdG9yLmNtLmdldE9wdGlvbihcInJ1bGVyc1wiKTtcbiAgICB2YXIgbG9uZ0xpbmVzID0gQ1BPLmVkaXRvci5jbS5nZXRPcHRpb24oXCJsb25nTGluZXNcIik7XG4gICAgdmFyIG1pbkxlbmd0aDtcbiAgICBpZiAobG9uZ0xpbmVzLnNpemUgPT09IDApIHtcbiAgICAgIG1pbkxlbmd0aCA9IDA7IC8vIGlmIHRoZXJlIGFyZSBubyBsb25nIGxpbmVzLCB0aGVuIHdlIGRvbid0IGNhcmUgYWJvdXQgc2hvd2luZyBhbnkgcnVsZXJzXG4gICAgfSBlbHNlIHtcbiAgICAgIG1pbkxlbmd0aCA9IE51bWJlci5NQVhfVkFMVUU7XG4gICAgICBsb25nTGluZXMuZm9yRWFjaChmdW5jdGlvbihsaW5lTm8sIGxpbmVIYW5kbGUpIHtcbiAgICAgICAgaWYgKGxpbmVIYW5kbGUudGV4dC5sZW5ndGggPCBtaW5MZW5ndGgpIHsgbWluTGVuZ3RoID0gbGluZUhhbmRsZS50ZXh0Lmxlbmd0aDsgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcnVsZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocnVsZXJzW2ldLmNvbHVtbiA+PSBtaW5MZW5ndGgpIHtcbiAgICAgICAgcnVsZXJzW2ldLmNsYXNzTmFtZSA9IFwiaGlkZGVuXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBydWxlcnNbaV0uY2xhc3NOYW1lID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH1cbiAgICAvLyBnb3R0YSBzZXQgdGhlIG9wdGlvbiB0d2ljZSwgb3IgZWxzZSBDTSBzaG9ydC1jaXJjdWl0cyBhbmQgaWdub3JlcyBpdFxuICAgIENQTy5lZGl0b3IuY20uc2V0T3B0aW9uKFwicnVsZXJzXCIsIHVuZGVmaW5lZCk7XG4gICAgQ1BPLmVkaXRvci5jbS5zZXRPcHRpb24oXCJydWxlcnNcIiwgcnVsZXJzKTtcbiAgfVxuICBDUE8uZWRpdG9yLmNtLm9uKCdjaGFuZ2VzJywgZnVuY3Rpb24oaW5zdGFuY2UsIGNoYW5nZU9ianMpIHtcbiAgICB2YXIgbWluTGluZSA9IGluc3RhbmNlLmxhc3RMaW5lKCksIG1heExpbmUgPSAwO1xuICAgIHZhciBydWxlcnNNaW5Db2wgPSBpbnN0YW5jZS5nZXRPcHRpb24oXCJydWxlcnNNaW5Db2xcIik7XG4gICAgdmFyIGxvbmdMaW5lcyA9IGluc3RhbmNlLmdldE9wdGlvbihcImxvbmdMaW5lc1wiKTtcbiAgICBjaGFuZ2VPYmpzLmZvckVhY2goZnVuY3Rpb24oY2hhbmdlKSB7XG4gICAgICBpZiAobWluTGluZSA+IGNoYW5nZS5mcm9tLmxpbmUpIHsgbWluTGluZSA9IGNoYW5nZS5mcm9tLmxpbmU7IH1cbiAgICAgIGlmIChtYXhMaW5lIDwgY2hhbmdlLmZyb20ubGluZSArIGNoYW5nZS50ZXh0Lmxlbmd0aCkgeyBtYXhMaW5lID0gY2hhbmdlLmZyb20ubGluZSArIGNoYW5nZS50ZXh0Lmxlbmd0aDsgfVxuICAgIH0pO1xuICAgIHZhciBjaGFuZ2VkID0gZmFsc2U7XG4gICAgaW5zdGFuY2UuZWFjaExpbmUobWluTGluZSwgbWF4TGluZSwgZnVuY3Rpb24obGluZUhhbmRsZSkge1xuICAgICAgaWYgKGxpbmVIYW5kbGUudGV4dC5sZW5ndGggPiBydWxlcnNNaW5Db2wpIHtcbiAgICAgICAgaWYgKCFsb25nTGluZXMuaGFzKGxpbmVIYW5kbGUpKSB7XG4gICAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgbG9uZ0xpbmVzLnNldChsaW5lSGFuZGxlLCBsaW5lSGFuZGxlLmxpbmVObygpKTtcbiAgICAgICAgICBsaW5lSGFuZGxlLnJ1bGVyTGlzdGVuZXJzID0gbmV3IE1hcChbXG4gICAgICAgICAgICBbXCJjaGFuZ2VcIiwgcmVtb3ZlU2hvcnRlbmVkTGluZV0sXG4gICAgICAgICAgICBbXCJkZWxldGVcIiwgZnVuY3Rpb24oKSB7IC8vIG5lZWRlZCBiZWNhdXNlIHRoZSBkZWxldGUgaGFuZGxlciBnZXRzIG5vIGFyZ3VtZW50cyBhdCBhbGxcbiAgICAgICAgICAgICAgZGVsZXRlTGluZShsaW5lSGFuZGxlKTtcbiAgICAgICAgICAgIH1dXG4gICAgICAgICAgXSk7XG4gICAgICAgICAgbGluZUhhbmRsZS5ydWxlckxpc3RlbmVycy5mb3JFYWNoKChmLCBldnQpID0+IGxpbmVIYW5kbGUub24oZXZ0LCBmKSk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coXCJBZGRlZCBcIiwgbGluZUhhbmRsZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChsb25nTGluZXMuaGFzKGxpbmVIYW5kbGUpKSB7XG4gICAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgbG9uZ0xpbmVzLmRlbGV0ZShsaW5lSGFuZGxlKTtcbiAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIlJlbW92ZWQgXCIsIGxpbmVIYW5kbGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKGNoYW5nZWQpIHtcbiAgICAgIHJlZnJlc2hSdWxlcnMoKTtcbiAgICB9XG4gIH0pO1xuXG4gIGNvbnN0IGxvb2tzTGlrZVVzZUNvbnRleHQgPSBuZXcgUmVnRXhwKFwiXnVzZSBjb250ZXh0LipcIik7XG5cbiAgcHJvZ3JhbUxvYWRlZC50aGVuKGZ1bmN0aW9uKGMpIHtcbiAgICBDUE8uZG9jdW1lbnRzLnNldChcImRlZmluaXRpb25zOi8vXCIsIENQTy5lZGl0b3IuY20uZ2V0RG9jKCkpO1xuICAgIGlmKGMgPT09IFwiXCIpIHsgXG4gICAgICBjID0gQ09OVEVYVF9GT1JfTkVXX0ZJTEVTO1xuICAgIH1cbiAgICBlbHNlIGlmKGMubWF0Y2gobG9va3NMaWtlVXNlQ29udGV4dCkgIT09IG51bGwpIHtcbiAgICAgIHdpbmRvdy5zdGlja0Vycm9yKFwiVHJpZWQgdG8gbG9hZCBhIHBsYWluIFB5cmV0IGZpbGUgaW4gYmxvY2tzIG1vZGUuXCIpO1xuICAgICAgY29uc29sZS5lcnJvcihcIkdvdCBhIHBsYWluIHRleHQgZmlsZTogXCIsIGMpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIENQTy5ibG9ja3NJREVMb2FkZWQudGhlbihibG9ja3NJREUgPT4ge1xuICAgICAgQ1BPLmJsb2Nrc0lERS5sb2FkU3ByaXRlU2NyaXB0c1hNTChjKTtcbiAgICB9KVxuICAgIC8vIE5PVEUoam9lKTogQ2xlYXJpbmcgaGlzdG9yeSB0byBhZGRyZXNzIGh0dHBzOi8vZ2l0aHViLmNvbS9icm93bnBsdC9weXJldC1sYW5nL2lzc3Vlcy8zODYsXG4gICAgLy8gaW4gd2hpY2ggdW5kbyBjYW4gcmV2ZXJ0IHRoZSBwcm9ncmFtIGJhY2sgdG8gZW1wdHlcbiAgICBDUE8uZWRpdG9yLmNtLmNsZWFySGlzdG9yeSgpO1xuICB9KTtcblxuICBwcm9ncmFtTG9hZGVkLmZhaWwoZnVuY3Rpb24oKSB7XG4gICAgQ1BPLmRvY3VtZW50cy5zZXQoXCJkZWZpbml0aW9uczovL1wiLCBDUE8uZWRpdG9yLmNtLmdldERvYygpKTtcbiAgfSk7XG5cbiAgLy8gSWYgdGhlIHByaW1hcnkgUHlyZXQgVVJMICh1c3VhbGx5IGEgQ0ROKSBmYWlscywgd2UgZmFsbCBiYWNrIHRvIHRoZVxuICAvLyBzYW1lLW9yaWdpbiBjb3B5IGF0IFBZUkVUX0JBQ0tVUC4gVGhlIFwiZXJyb3JcIiBldmVudCBhbG9uZSBpc24ndCBlbm91Z2hcbiAgLy8gdG8gdHJpZ2dlciB0aGF0OiBzY2hvb2wgY29udGVudCBmaWx0ZXJzIGhhdmUgYmVlbiBzZWVuIGJvdGggc2lsZW50bHlcbiAgLy8gc3RhbGxpbmcgdGhlIHJlcXVlc3QgKG5laXRoZXIgXCJsb2FkXCIgbm9yIFwiZXJyb3JcIiBldmVyIGZpcmVzKSBhbmRcbiAgLy8gYW5zd2VyaW5nIGl0IHdpdGggYW4gZW1wdHkgMjAwICh3aGljaCBmaXJlcyBcImxvYWRcIiEpLiBTbyB0d28gZXh0cmFcbiAgLy8gc2lnbmFscyBjb3VudCBhcyBmYWlsdXJlOiBnb2luZyBQWVJFVF9MT0FEX1RJTUVPVVRfTVMgd2l0aCBubyBldmVudCxcbiAgLy8gYW5kIGEgXCJsb2FkXCIgYWZ0ZXIgd2hpY2ggdGhlIGJ1bmRsZSdzIGdsb2JhbHMgYXJlbid0IGFjdHVhbGx5IGRlZmluZWQuXG4gIC8vIFdoZW4gdGhlIHByaW1hcnkgZmFpbHMgZWl0aGVyIHdheSwgd2UgcmVjb3JkIGl0IGluIGxvY2FsU2V0dGluZ3M7IHVudGlsXG4gIC8vIHRoYXQgcmVjb3JkIGV4cGlyZXMsIHBhZ2UgbG9hZHMgc3dhcCB0aGUgdHdvIFVSTHMgYW5kIGdvIHN0cmFpZ2h0IHRvXG4gIC8vIHRoZSBiYWNrdXAgcmF0aGVyIHRoYW4gZmFpbGluZyBvdmVyIGZyb20gc2NyYXRjaCBhZ2Fpbi4gQSBzdWNjZXNzZnVsXG4gIC8vIGxvYWQgZnJvbSB0aGUgcHJpbWFyeSBjbGVhcnMgdGhlIHJlY29yZC5cbiAgdmFyIFBZUkVUX0xPQURfVElNRU9VVF9NUyA9IDIwMDAwO1xuICB2YXIgUFlSRVRfRkFJTEVEX0tFWSA9IFwicHlyZXQtcHJpbWFyeS1mYWlsZWQtYXRcIjtcbiAgdmFyIFBZUkVUX0ZBSUxFRF9UVExfTVMgPSAyNCAqIDYwICogNjAgKiAxMDAwO1xuXG4gIGZ1bmN0aW9uIHByaW1hcnlGYWlsZWRSZWNlbnRseSgpIHtcbiAgICB2YXIgc3RhbXAgPSBOdW1iZXIobG9jYWxTZXR0aW5ncy5nZXRJdGVtKFBZUkVUX0ZBSUxFRF9LRVkpKTtcbiAgICByZXR1cm4gc3RhbXAgPiAwICYmIChEYXRlLm5vdygpIC0gc3RhbXApIDwgUFlSRVRfRkFJTEVEX1RUTF9NUztcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlY29yZFByaW1hcnlGYWlsdXJlKCkge1xuICAgIGlmIChwcmltYXJ5UHlyZXQgPT09IHdpbmRvdy5QWVJFVCkge1xuICAgICAgbG9jYWxTZXR0aW5ncy5zZXRJdGVtKFBZUkVUX0ZBSUxFRF9LRVksIFN0cmluZyhEYXRlLm5vdygpKSk7XG4gICAgfVxuICB9XG5cbiAgLy8gVGhlIGJ1bmRsZSBzeW5jaHJvbm91c2x5IGluc3RhbGxzIGl0cyBtb2R1bGUgbG9hZGVyIGFzIGBkZWZpbmVgIGFuZFxuICAvLyBgcmVxdWlyZWpzYDsgaWYgbmVpdGhlciBleGlzdHMgYWZ0ZXIgYSBzY3JpcHQncyBcImxvYWRcIiBldmVudCwgd2hhdGV2ZXJcbiAgLy8gdGhlIG5ldHdvcmsgaGFuZGVkIHVzIHdhcyBub3QgUHlyZXQgKGUuZy4gYSBmaWx0ZXIncyBlbXB0eSAyMDApLlxuICBmdW5jdGlvbiBweXJldEFjdHVhbGx5TG9hZGVkKCkge1xuICAgIHJldHVybiAhKHR5cGVvZiB3aW5kb3cuZGVmaW5lID09PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiB3aW5kb3cucmVxdWlyZWpzID09PSBcInVuZGVmaW5lZFwiKTtcbiAgfVxuXG4gIHZhciBwcmltYXJ5UHlyZXQgPSB3aW5kb3cuUFlSRVQ7XG4gIHZhciBiYWNrdXBQeXJldCA9IHByb2Nlc3MuZW52LlBZUkVUX0JBQ0tVUDtcbiAgaWYgKGJhY2t1cFB5cmV0ICYmIHByaW1hcnlGYWlsZWRSZWNlbnRseSgpKSB7XG4gICAgY29uc29sZS5sb2coXCJQcmltYXJ5IFB5cmV0IFVSTCB0aW1lZCBvdXQgcmVjZW50bHk7IGxvYWRpbmcgZnJvbSBiYWNrdXAgZmlyc3RcIik7XG4gICAgcHJpbWFyeVB5cmV0ID0gcHJvY2Vzcy5lbnYuUFlSRVRfQkFDS1VQO1xuICAgIGJhY2t1cFB5cmV0ID0gd2luZG93LlBZUkVUO1xuICB9XG5cbiAgdmFyIHB5cmV0TG9hZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICBjb25zb2xlLmxvZyhwcmltYXJ5UHlyZXQpO1xuICBweXJldExvYWQuc3JjID0gcHJpbWFyeVB5cmV0O1xuICBweXJldExvYWQudHlwZSA9IFwidGV4dC9qYXZhc2NyaXB0XCI7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocHlyZXRMb2FkKTtcblxuICB2YXIgcHlyZXRMb2FkMiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuXG4gIHZhciBiYWNrdXBTdGFydGVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIHN0YXJ0QmFja3VwTG9hZCgpIHtcbiAgICBpZiAoYmFja3VwU3RhcnRlZCkgeyByZXR1cm47IH1cbiAgICBiYWNrdXBTdGFydGVkID0gdHJ1ZTtcbiAgICB2YXIgYmFja3VwVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgLy8gQm90aCBhdHRlbXB0cyB3ZWRnZWQuIFN0b3AgdGhlIHNwaW5uZXIgYW5kIHRlbGwgdGhlIHVzZXI7IHRoZSBiYWNrdXBcbiAgICAgIC8vIHJlcXVlc3QgaXMgbGVmdCBpbiBmbGlnaHQsIHNvIGlmIGl0IGRvZXMgZXZlbnR1YWxseSBmaW5pc2gsIHRoZSBwYWdlXG4gICAgICAvLyBzdGlsbCBiZWNvbWVzIHVzYWJsZS5cbiAgICAgIGxvZ2dlci5sb2coJ3B5cmV0LWxvYWQtZmFpbHVyZScsIHtcbiAgICAgICAgZXZlbnQgOiAndGltZW91dCcsXG4gICAgICAgIHVybCA6IGJhY2t1cFB5cmV0LFxuICAgICAgICB0aW1lb3V0TXMgOiBQWVJFVF9MT0FEX1RJTUVPVVRfTVNcbiAgICAgIH0pO1xuICAgICAgJChcIiNsb2FkZXJcIikuaGlkZSgpO1xuICAgICAgJChcIiNydW5QYXJ0XCIpLmhpZGUoKTtcbiAgICAgICQoXCIjYnJlYWtCdXR0b25cIikuaGlkZSgpO1xuICAgICAgd2luZG93LnN0aWNrRXJyb3IoXCJQeXJldCBmYWlsZWQgdG8gbG9hZDsgY2hlY2sgeW91ciBjb25uZWN0aW9uIG9yIHRyeSByZWZyZXNoaW5nIHRoZSBwYWdlLiAgSWYgdGhpcyBoYXBwZW5zIHJlcGVhdGVkbHksIHBsZWFzZSByZXBvcnQgaXQgYXMgYSBidWcuXCIpO1xuICAgIH0sIFBZUkVUX0xPQURfVElNRU9VVF9NUyk7XG4gICAgJChweXJldExvYWQyKS5vbihcImxvYWRcIiwgZnVuY3Rpb24oKSB7XG4gICAgICBjbGVhclRpbWVvdXQoYmFja3VwVGltZXIpO1xuICAgICAgaWYgKCFweXJldEFjdHVhbGx5TG9hZGVkKCkpIHtcbiAgICAgICAgbG9nZ2VyLmxvZygncHlyZXQtbG9hZC1mYWlsdXJlJywge1xuICAgICAgICAgIGV2ZW50IDogJ2VtcHR5LWxvYWQnLFxuICAgICAgICAgIHVybCA6IGJhY2t1cFB5cmV0XG4gICAgICAgIH0pO1xuICAgICAgICAkKFwiI2xvYWRlclwiKS5oaWRlKCk7XG4gICAgICAgICQoXCIjcnVuUGFydFwiKS5oaWRlKCk7XG4gICAgICAgICQoXCIjYnJlYWtCdXR0b25cIikuaGlkZSgpO1xuICAgICAgICB3aW5kb3cuc3RpY2tFcnJvcihcIlB5cmV0IGZhaWxlZCB0byBsb2FkOyBjaGVjayB5b3VyIGNvbm5lY3Rpb24gb3IgdHJ5IHJlZnJlc2hpbmcgdGhlIHBhZ2UuICBJZiB0aGlzIGhhcHBlbnMgcmVwZWF0ZWRseSwgcGxlYXNlIHJlcG9ydCBpdCBhcyBhIGJ1Zy5cIik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcHlyZXRMb2FkMi5zcmMgPSBiYWNrdXBQeXJldDtcbiAgICBweXJldExvYWQyLnR5cGUgPSBcInRleHQvamF2YXNjcmlwdFwiO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQocHlyZXRMb2FkMik7XG4gIH1cblxuICB2YXIgcHJpbWFyeVRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICBsb2dnZXIubG9nKCdweXJldC1sb2FkLWZhaWx1cmUnLCB7XG4gICAgICBldmVudCA6ICd0aW1lb3V0JyxcbiAgICAgIHVybCA6IHByaW1hcnlQeXJldCxcbiAgICAgIHRpbWVvdXRNcyA6IFBZUkVUX0xPQURfVElNRU9VVF9NU1xuICAgIH0pO1xuICAgIHJlY29yZFByaW1hcnlGYWlsdXJlKCk7XG4gICAgLy8gUmVtb3ZpbmcgdGhlIGVsZW1lbnQgYWJhbmRvbnMgdGhlIHN0YWxsZWQgcmVxdWVzdDsgYSBzY3JpcHQgZWxlbWVudFxuICAgIC8vIHRoYXQgaXMgZGlzY29ubmVjdGVkIGJlZm9yZSBpdCBleGVjdXRlcyB3b24ndCBydW4sIHNvIGEgbGF0ZSBhcnJpdmFsXG4gICAgLy8gY2FuJ3QgZXhlY3V0ZSBhIHNlY29uZCBjb3B5IG9mIFB5cmV0IGFsb25nc2lkZSB0aGUgYmFja3VwLlxuICAgIHB5cmV0TG9hZC5yZW1vdmUoKTtcbiAgICBzdGFydEJhY2t1cExvYWQoKTtcbiAgfSwgUFlSRVRfTE9BRF9USU1FT1VUX01TKTtcblxuICAkKHB5cmV0TG9hZCkub24oXCJsb2FkXCIsIGZ1bmN0aW9uKCkge1xuICAgIGNsZWFyVGltZW91dChwcmltYXJ5VGltZXIpO1xuICAgIGlmICghcHlyZXRBY3R1YWxseUxvYWRlZCgpKSB7XG4gICAgICBsb2dnZXIubG9nKCdweXJldC1sb2FkLWZhaWx1cmUnLCB7XG4gICAgICAgIGV2ZW50IDogJ2VtcHR5LWxvYWQnLFxuICAgICAgICB1cmwgOiBwcmltYXJ5UHlyZXRcbiAgICAgIH0pO1xuICAgICAgcmVjb3JkUHJpbWFyeUZhaWx1cmUoKTtcbiAgICAgIHN0YXJ0QmFja3VwTG9hZCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAocHJpbWFyeVB5cmV0ID09PSB3aW5kb3cuUFlSRVQgJiYgbG9jYWxTZXR0aW5ncy5nZXRJdGVtKFBZUkVUX0ZBSUxFRF9LRVkpKSB7XG4gICAgICBsb2NhbFNldHRpbmdzLnNldEl0ZW0oUFlSRVRfRkFJTEVEX0tFWSwgXCJcIik7XG4gICAgfVxuICB9KTtcblxuICBmdW5jdGlvbiBsb2dGYWlsdXJlQW5kTWFudWFsRmV0Y2godXJsLCBlKSB7XG5cbiAgICAvLyBOT1RFKGpvZSk6IFRoZSBlcnJvciByZXBvcnRlZCBieSB0aGUgXCJlcnJvclwiIGV2ZW50IGhhcyBlc3NlbnRpYWxseSBub1xuICAgIC8vIGluZm9ybWF0aW9uIG9uIGl0OyBpdCdzIGp1c3QgYSBub3RpZmljYXRpb24gdGhhdCBfc29tZXRoaW5nXyB3ZW50IHdyb25nLlxuICAgIC8vIFNvLCB3ZSBsb2cgdGhhdCBzb21ldGhpbmcgaGFwcGVuZWQsIHRoZW4gaW1tZWRpYXRlbHkgZG8gYW4gQUpBWCByZXF1ZXN0XG4gICAgLy8gY2FsbCBmb3IgdGhlIHNhbWUgVVJMLCB0byBzZWUgaWYgd2UgY2FuIGdldCBtb3JlIGluZm9ybWF0aW9uLiBUaGlzXG4gICAgLy8gZG9lc24ndCBwZXJmZWN0bHkgdGVsbCB1cyBhYm91dCB0aGUgb3JpZ2luYWwgZmFpbHVyZSwgYnV0IGl0J3NcbiAgICAvLyBzb21ldGhpbmcuXG5cbiAgICAvLyBJbiBhZGRpdGlvbiwgaWYgc29tZW9uZSBpcyBzZWVpbmcgdGhlIFB5cmV0IGZhaWxlZCB0byBsb2FkIGVycm9yLCBidXQgd2VcbiAgICAvLyBkb24ndCBnZXQgdGhlc2UgbG9nZ2luZyBldmVudHMsIHdlIGhhdmUgYSBzdHJvbmcgaGludCB0aGF0IHNvbWV0aGluZyBpc1xuICAgIC8vIHVwIHdpdGggdGhlaXIgbmV0d29yay5cbiAgICBsb2dnZXIubG9nKCdweXJldC1sb2FkLWZhaWx1cmUnLFxuICAgICAge1xuICAgICAgICBldmVudCA6ICdpbml0aWFsLWZhaWx1cmUnLFxuICAgICAgICB1cmwgOiB1cmwsXG5cbiAgICAgICAgLy8gVGhlIHRpbWVzdGFtcCBhcHBlYXJzIHRvIGNvdW50IGZyb20gdGhlIGJlZ2lubmluZyBvZiBwYWdlIGxvYWQsXG4gICAgICAgIC8vIHdoaWNoIG1heSBhcHByb3hpbWF0ZSBkb3dubG9hZCB0aW1lIGlmLCBzYXksIHJlcXVlc3RzIGFyZSB0aW1pbmcgb3V0XG4gICAgICAgIC8vIG9yIGdldHRpbmcgY3V0IG9mZi5cblxuICAgICAgICB0aW1lU3RhbXAgOiBlLnRpbWVTdGFtcFxuICAgICAgfSk7XG5cbiAgICB2YXIgbWFudWFsRmV0Y2ggPSAkLmFqYXgodXJsKTtcbiAgICBtYW51YWxGZXRjaC50aGVuKGZ1bmN0aW9uKHJlcykge1xuICAgICAgLy8gSGVyZSwgd2UgbG9nIHRoZSBmaXJzdCAxMDAgY2hhcmFjdGVycyBvZiB0aGUgcmVzcG9uc2UgdG8gbWFrZSBzdXJlXG4gICAgICAvLyB0aGV5IHJlc2VtYmxlIHRoZSBQeXJldCBibG9iXG4gICAgICBsb2dnZXIubG9nKCdweXJldC1sb2FkLWZhaWx1cmUnLCB7XG4gICAgICAgIGV2ZW50IDogJ3N1Y2Nlc3Mtd2l0aC1hamF4JyxcbiAgICAgICAgY29udGVudHNQcmVmaXggOiByZXMuc2xpY2UoMCwgMTAwKVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgbWFudWFsRmV0Y2guZmFpbChmdW5jdGlvbihyZXMpIHtcbiAgICAgIGxvZ2dlci5sb2coJ3B5cmV0LWxvYWQtZmFpbHVyZScsIHtcbiAgICAgICAgZXZlbnQgOiAnZmFpbHVyZS13aXRoLWFqYXgnLFxuICAgICAgICBzdGF0dXM6IHJlcy5zdGF0dXMsXG4gICAgICAgIHN0YXR1c1RleHQ6IHJlcy5zdGF0dXNUZXh0LFxuICAgICAgICAvLyBTaW5jZSByZXNwb25zZVRleHQgY291bGQgYmUgYSBsb25nIGVycm9yIHBhZ2UsIGFuZCB3ZSBkb24ndCB3YW50IHRvXG4gICAgICAgIC8vIGxvZyBodWdlIHBhZ2VzLCB3ZSBzbGljZSBpdCB0byAxMDAgY2hhcmFjdGVycywgd2hpY2ggaXMgZW5vdWdoIHRvXG4gICAgICAgIC8vIHRlbGwgdXMgd2hhdCdzIGdvaW5nIG9uIChlLmcuIEFXUyBmYWlsdXJlLCBuZXR3b3JrIG91dGFnZSkuXG4gICAgICAgIHJlc3BvbnNlVGV4dDogcmVzLnJlc3BvbnNlVGV4dC5zbGljZSgwLCAxMDApXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gICQocHlyZXRMb2FkKS5vbihcImVycm9yXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICBjbGVhclRpbWVvdXQocHJpbWFyeVRpbWVyKTtcbiAgICBsb2dGYWlsdXJlQW5kTWFudWFsRmV0Y2gocHJpbWFyeVB5cmV0LCBlKTtcbiAgICBzdGFydEJhY2t1cExvYWQoKTtcbiAgfSk7XG5cbiAgJChweXJldExvYWQyKS5vbihcImVycm9yXCIsIGZ1bmN0aW9uKGUpIHtcbiAgICAkKFwiI2xvYWRlclwiKS5oaWRlKCk7XG4gICAgJChcIiNydW5QYXJ0XCIpLmhpZGUoKTtcbiAgICAkKFwiI2JyZWFrQnV0dG9uXCIpLmhpZGUoKTtcbiAgICB3aW5kb3cuc3RpY2tFcnJvcihcIlB5cmV0IGZhaWxlZCB0byBsb2FkOyBjaGVjayB5b3VyIGNvbm5lY3Rpb24gb3IgdHJ5IHJlZnJlc2hpbmcgdGhlIHBhZ2UuICBJZiB0aGlzIGhhcHBlbnMgcmVwZWF0ZWRseSwgcGxlYXNlIHJlcG9ydCBpdCBhcyBhIGJ1Zy5cIik7XG4gICAgbG9nRmFpbHVyZUFuZE1hbnVhbEZldGNoKGJhY2t1cFB5cmV0LCBlKTtcblxuICB9KTtcblxuICBmdW5jdGlvbiBtYWtlRXZlbnQoKSB7XG4gICAgY29uc3QgaGFuZGxlcnMgPSBbXTtcbiAgICBmdW5jdGlvbiBvbihoYW5kbGVyKSB7XG4gICAgICBoYW5kbGVycy5wdXNoKGhhbmRsZXIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiB0cmlnZ2VyKHYpIHtcbiAgICAgIGhhbmRsZXJzLmZvckVhY2goaCA9PiBoKHYpKTtcbiAgICB9XG4gICAgcmV0dXJuIFtvbiwgdHJpZ2dlcl07XG4gIH1cbiAgbGV0IFsgb25SdW4sIHRyaWdnZXJPblJ1biBdID0gbWFrZUV2ZW50KCk7XG4gIGxldCBbIG9uSW50ZXJhY3Rpb24sIHRyaWdnZXJPbkludGVyYWN0aW9uIF0gPSBtYWtlRXZlbnQoKTtcbiAgbGV0IFsgb25Mb2FkLCB0cmlnZ2VyT25Mb2FkIF0gPSBtYWtlRXZlbnQoKTtcblxuICBwcm9ncmFtTG9hZGVkLmZpbihmdW5jdGlvbigpIHtcbiAgICBDUE8uZWRpdG9yLmZvY3VzKCk7XG4gICAgQ1BPLmVkaXRvci5jbS5zZXRPcHRpb24oXCJyZWFkT25seVwiLCBmYWxzZSk7XG4gIH0pO1xuXG4gIENQTy5hdXRvU2F2ZSA9IGF1dG9TYXZlO1xuICBDUE8uc2F2ZSA9IHNhdmU7XG4gIENQTy51cGRhdGVOYW1lID0gdXBkYXRlTmFtZTtcbiAgQ1BPLnNob3dTaGFyZUNvbnRhaW5lciA9IHNob3dTaGFyZUNvbnRhaW5lcjtcbiAgQ1BPLmxvYWRQcm9ncmFtID0gbG9hZFByb2dyYW07XG4gIENQTy5zdG9yYWdlQVBJID0gc3RvcmFnZUFQSTtcbiAgQ1BPLmN5Y2xlRm9jdXMgPSBjeWNsZUZvY3VzO1xuICBDUE8uc2F5ID0gc2F5O1xuICBDUE8uc2F5QW5kRm9yZ2V0ID0gc2F5QW5kRm9yZ2V0O1xuICBDUE8uZXZlbnRzID0ge1xuICAgIG9uUnVuLFxuICAgIHRyaWdnZXJPblJ1bixcbiAgICBvbkludGVyYWN0aW9uLFxuICAgIHRyaWdnZXJPbkludGVyYWN0aW9uLFxuICAgIG9uTG9hZCxcbiAgICB0cmlnZ2VyT25Mb2FkXG4gIH07XG5cbiAgbGV0IGluaXRpYWxTdGF0ZSA9IHBhcmFtc1tcImdldFwiXVtcImluaXRpYWxTdGF0ZVwiXTtcblxuICBpZiAodHlwZW9mIGFjcXVpcmVWc0NvZGVBcGkgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHdpbmRvdy5NRVNTQUdFUyA9IG1ha2VFdmVudHMoe1xuICAgICAgQ1BPOiBDUE8sXG4gICAgICBzZW5kUG9ydDogYWNxdWlyZVZzQ29kZUFwaSgpLFxuICAgICAgcmVjZWl2ZVBvcnQ6IHdpbmRvdyxcbiAgICAgIGluaXRpYWxTdGF0ZVxuICAgIH0pO1xuICB9XG4gIGVsc2UgaWYoKHdpbmRvdy5wYXJlbnQgJiYgKHdpbmRvdy5wYXJlbnQgIT09IHdpbmRvdykpIHx8IHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSBcImRldmVsb3BtZW50XCIpIHtcbiAgICB3aW5kb3cuTUVTU0FHRVMgPSBtYWtlRXZlbnRzKHsgQ1BPOiBDUE8sIHNlbmRQb3J0OiB3aW5kb3cucGFyZW50LCByZWNlaXZlUG9ydDogd2luZG93LCBpbml0aWFsU3RhdGUgfSk7XG4gIH1cbiAgaWYobG9jYWxTZXR0aW5ncy5nZXRJdGVtKFwic2F3U3VtbWVyMjAyMU1lc3NhZ2VcIikgIT09IFwic2F3LXN1bW1lci0yMDIxLW1lc3NhZ2VcIikge1xuICAgIGNvbnN0IG1lc3NhZ2UgPSAkKFwiPHNwYW4+XCIpO1xuICAgIGNvbnN0IG5vdGVzID0gJChcIjxhIHRhcmdldD0nX2JsYW5rJyBzdHlsZT0nY29sb3I6IHdoaXRlJz5cIikuYXR0cihcImhyZWZcIiwgXCJodHRwczovL3d3dy5weXJldC5vcmcvcmVsZWFzZS1ub3Rlcy9zdW1tZXItMjAyMS5odG1sXCIpLnRleHQoXCJyZWxlYXNlIG5vdGVzXCIpO1xuICAgIG1lc3NhZ2UuYXBwZW5kKFwiVGhpbmdzIG1heSBsb29rIGEgbGl0dGxlIGRpZmZlcmVudCEgQ2hlY2sgb3V0IHRoZSBcIiwgbm90ZXMsIFwiIGZvciBtb3JlIGRldGFpbHMuXCIpO1xuICAgIHdpbmRvdy5zdGlja1JpY2hNZXNzYWdlKG1lc3NhZ2UpO1xuICAgIGxvY2FsU2V0dGluZ3Muc2V0SXRlbShcInNhd1N1bW1lcjIwMjFNZXNzYWdlXCIsIFwic2F3LXN1bW1lci0yMDIxLW1lc3NhZ2VcIik7XG4gIH1cblxuICBpZih3aW5kb3cucGFyZW50ICE9PSB3aW5kb3cpIHtcbiAgICBtYWtlRXZlbnRzKHsgQ1BPOiBDUE8sIHNlbmRQb3J0OiB3aW5kb3cucGFyZW50LCByZWNlaXZlUG9ydDogd2luZG93IH0pO1xuICB9XG59KTtcbiJdLCJuYW1lcyI6WyJkZWZpbmUiLCJRIiwiYXV0b0hpZ2hsaWdodEJveCIsInRleHQiLCJ0ZXh0Qm94IiwiJCIsImFkZENsYXNzIiwiYXR0ciIsIm9uIiwic2VsZWN0IiwidmFsIiwicHJvbXB0UXVldWUiLCJzdHlsZXMiLCJ3aW5kb3ciLCJtb2RhbHMiLCJQcm9tcHQiLCJvcHRpb25zIiwicHVzaCIsImluZGV4T2YiLCJzdHlsZSIsImxlbmd0aCIsIkVycm9yIiwibW9kYWwiLCJlbHRzIiwicGFyc2VIVE1MIiwidGl0bGUiLCJtb2RhbENvbnRlbnQiLCJjbG9zZUJ1dHRvbiIsInN1Ym1pdEJ1dHRvbiIsInN1Ym1pdFRleHQiLCJjYW5jZWxUZXh0IiwidG9nZ2xlQ2xhc3MiLCJuYXJyb3ciLCJpc0NvbXBpbGVkIiwiZGVmZXJyZWQiLCJkZWZlciIsInByb21pc2UiLCJwcm90b3R5cGUiLCJzaG93IiwiY2FsbGJhY2siLCJoaWRlU3VibWl0IiwiaGlkZSIsImNsaWNrIiwib25DbG9zZSIsImJpbmQiLCJrZXlwcmVzcyIsImUiLCJ3aGljaCIsIm9uU3VibWl0IiwiZG9jQ2xpY2siLCJ0YXJnZXQiLCJpcyIsImRvY3VtZW50Iiwib2ZmIiwiZG9jS2V5ZG93biIsImtleSIsImtleWRvd24iLCJwb3B1bGF0ZU1vZGFsIiwiY3NzIiwiZm9jdXMiLCJ0aGVuIiwiY2xlYXJNb2RhbCIsImVtcHR5IiwiY3JlYXRlUmFkaW9FbHQiLCJvcHRpb24iLCJpZHgiLCJlbHQiLCJpZCIsInRvU3RyaW5nIiwibGFiZWwiLCJ2YWx1ZSIsIm1lc3NhZ2UiLCJlbHRDb250YWluZXIiLCJhcHBlbmQiLCJsYWJlbENvbnRhaW5lciIsImNvbnRhaW5lciIsImV4YW1wbGUiLCJjbSIsIkNvZGVNaXJyb3IiLCJtb2RlIiwibGluZU51bWJlcnMiLCJyZWFkT25seSIsInNldFRpbWVvdXQiLCJyZWZyZXNoIiwiZXhhbXBsZUNvbnRhaW5lciIsImNyZWF0ZVRpbGVFbHQiLCJkZXRhaWxzIiwiZXZ0IiwiY3JlYXRlVGV4dEVsdCIsImlucHV0IiwiZGVmYXVsdFZhbHVlIiwiZHJhd0VsZW1lbnQiLCJjcmVhdGVDb3B5VGV4dEVsdCIsImJveCIsImNyZWF0ZUNvbmZpcm1FbHQiLCJ0aGF0IiwiY3JlYXRlRWx0IiwiaSIsIm9wdGlvbkVsdHMiLCJtYXAiLCJyZXNvbHZlIiwicmV0dmFsIiwic2hhcmVBUEkiLCJtYWtlU2hhcmVBUEkiLCJwcm9jZXNzIiwiZW52IiwiQ1VSUkVOVF9QWVJFVF9SRUxFQVNFIiwidXJsIiwicmVxdWlyZSIsIm1vZGFsUHJvbXB0IiwiTE9HIiwiY3RfbG9nIiwiY29uc29sZSIsImxvZyIsImFwcGx5IiwiYXJndW1lbnRzIiwiY3RfZXJyb3IiLCJlcnJvciIsImluaXRpYWxQYXJhbXMiLCJwYXJzZSIsImxvY2F0aW9uIiwiaHJlZiIsInBhcmFtcyIsImhpZ2hsaWdodE1vZGUiLCJjbGVhckZsYXNoIiwid2hpdGVUb0JsYWNrTm90aWZpY2F0aW9uIiwic3RpY2tFcnJvciIsIm1vcmUiLCJDUE8iLCJzYXlBbmRGb3JnZXQiLCJlcnIiLCJ0b29sdGlwIiwicHJlcGVuZCIsImZsYXNoRXJyb3IiLCJmYWRlT3V0IiwiZmxhc2hNZXNzYWdlIiwibXNnIiwic3RpY2tNZXNzYWdlIiwic3RpY2tSaWNoTWVzc2FnZSIsImNvbnRlbnQiLCJta1dhcm5pbmdVcHBlciIsIm1rV2FybmluZ0xvd2VyIiwiRG9jdW1lbnRzIiwiZG9jdW1lbnRzIiwiTWFwIiwiaGFzIiwibmFtZSIsImdldCIsInNldCIsImRvYyIsImxvZ2dlciIsImlzRGV0YWlsZWQiLCJnZXRWYWx1ZSIsImZvckVhY2giLCJmIiwiVkVSU0lPTl9DSEVDS19JTlRFUlZBTCIsIk1hdGgiLCJyYW5kb20iLCJjaGVja1ZlcnNpb24iLCJyZXNwIiwiSlNPTiIsInZlcnNpb24iLCJzZXRJbnRlcnZhbCIsInNhdmUiLCJhdXRvU2F2ZSIsIkNPTlRFWFRfRk9SX05FV19GSUxFUyIsIm1lcmdlIiwib2JqIiwiZXh0ZW5zaW9uIiwibmV3b2JqIiwiT2JqZWN0Iiwia2V5cyIsImsiLCJhbmltYXRpb25EaXYiLCJjbG9zZUFuaW1hdGlvbklmT3BlbiIsImRpYWxvZyIsIm1ha2VFZGl0b3IiLCJpbml0aWFsIiwiaGFzT3duUHJvcGVydHkiLCJ0ZXh0YXJlYSIsImpRdWVyeSIsInJ1bkZ1biIsImNvZGUiLCJyZXBsT3B0aW9ucyIsInJ1biIsIkNNIiwidXNlTGluZU51bWJlcnMiLCJzaW1wbGVFZGl0b3IiLCJ1c2VGb2xkaW5nIiwiZ3V0dGVycyIsInJlaW5kZW50QWxsTGluZXMiLCJsYXN0IiwibGluZUNvdW50Iiwib3BlcmF0aW9uIiwiaW5kZW50TGluZSIsIkNPREVfTElORV9XSURUSCIsInJ1bGVycyIsInJ1bGVyc01pbkNvbCIsImNvbG9yIiwiY29sdW1uIiwibGluZVN0eWxlIiwiY2xhc3NOYW1lIiwibWFjIiwia2V5TWFwIiwibWFjRGVmYXVsdCIsIm1vZGlmaWVyIiwiY21PcHRpb25zIiwiZXh0cmFLZXlzIiwibm9ybWFsaXplS2V5TWFwIiwiX2RlZmluZVByb3BlcnR5IiwiU2hpZnRFbnRlciIsIlNoaWZ0Q3RybEVudGVyIiwiY29uY2F0IiwiaW5kZW50VW5pdCIsInRhYlNpemUiLCJ2aWV3cG9ydE1hcmdpbiIsIkluZmluaXR5IiwibWF0Y2hLZXl3b3JkcyIsIm1hdGNoQnJhY2tldHMiLCJzdHlsZVNlbGVjdGVkVGV4dCIsImZvbGRHdXR0ZXIiLCJsaW5lV3JhcHBpbmciLCJsb2dnaW5nIiwic2Nyb2xsUGFzdEVuZCIsImZyb21UZXh0QXJlYSIsImZpcnN0TGluZUlzTmFtZXNwYWNlIiwiZmlyc3RsaW5lIiwiZ2V0TGluZSIsIm1hdGNoIiwibmFtZXNwYWNlbWFyayIsInNldENvbnRleHRMaW5lIiwibmV3Q29udGV4dExpbmUiLCJoYXNOYW1lc3BhY2UiLCJjbGVhciIsInJlcGxhY2VSYW5nZSIsImxpbmUiLCJjaCIsImd1dHRlclF1ZXN0aW9uV3JhcHBlciIsImNyZWF0ZUVsZW1lbnQiLCJndXR0ZXJUb29sdGlwIiwiaW5uZXJUZXh0IiwiZ3V0dGVyUXVlc3Rpb24iLCJzcmMiLCJBUFBfQkFTRV9VUkwiLCJhcHBlbmRDaGlsZCIsInNldEd1dHRlck1hcmtlciIsImdldFdyYXBwZXJFbGVtZW50Iiwib25tb3VzZWxlYXZlIiwiY2xlYXJHdXR0ZXIiLCJvbm1vdXNlbW92ZSIsImxpbmVDaCIsImNvb3Jkc0NoYXIiLCJsZWZ0IiwiY2xpZW50WCIsInRvcCIsImNsaWVudFkiLCJtYXJrZXJzIiwiZmluZE1hcmtzQXQiLCJjaGFuZ2UiLCJkb2VzTm90Q2hhbmdlRmlyc3RMaW5lIiwiYyIsImZyb20iLCJjdXJPcCIsImNoYW5nZU9ianMiLCJldmVyeSIsIm1hcmtUZXh0IiwiYXR0cmlidXRlcyIsInVzZWxpbmUiLCJhdG9taWMiLCJpbmNsdXNpdmVMZWZ0IiwiaW5jbHVzaXZlUmlnaHQiLCJkaXNwbGF5Iiwid3JhcHBlciIsImdldFRvcFRpZXJNZW51aXRlbXMiLCJmb2N1c0Nhcm91c2VsIiwiUlVOX0NPREUiLCJzZXRVc2VybmFtZSIsInRva2VuIiwiZ2FwaSIsImF1dGgiLCJnZXRUb2tlbiIsImFjY2Vzc190b2tlbiIsImZldGNoIiwiaGVhZGVycyIsIkF1dGhvcml6YXRpb24iLCJqc29uIiwiaW5mbyIsImVtYWlsIiwic3RvcmFnZUFQSSIsImFwaSIsImNvbGxlY3Rpb24iLCJmYWlsIiwiY3JlYXRlUHJvZ3JhbUNvbGxlY3Rpb25BUEkiLCJBUFBfTkFNRSIsImFjdGl2ZUVsZW1lbnQiLCJibHVyIiwidG9Mb2FkIiwiZ2V0RmlsZUJ5SWQiLCJsb2FkUHJvZ3JhbSIsInByb2dyYW1Ub1NhdmUiLCJmY2FsbCIsImluaXRpYWxQcm9ncmFtIiwicHJvZ3JhbUxvYWQiLCJlbmFibGVGaWxlT3B0aW9ucyIsInAiLCJzaG93U2hhcmVDb250YWluZXIiLCJnZXRTaGFyZWRGaWxlQnlJZCIsImZpbGUiLCJnZXRPcmlnaW5hbCIsInJlc3BvbnNlIiwib3JpZ2luYWwiLCJyZXN1bHQiLCJyZW1vdmVDbGFzcyIsIm9wZW4iLCJzZXRUaXRsZSIsInByb2dOYW1lIiwiZmlsZW5hbWUiLCJkb3dubG9hZEVsdCIsImNvbnRlbnRzIiwiYmxvY2tzSURFIiwiY3VycmVudFNwcml0ZSIsInNjcmlwdHNPbmx5WE1MIiwiZG93bmxvYWRCbG9iIiwiVVJMIiwiY3JlYXRlT2JqZWN0VVJMIiwiQmxvYiIsInR5cGUiLCJkb3dubG9hZCIsInNob3dNb2RhbCIsImN1cnJlbnRDb250ZXh0IiwiZWxlbWVudCIsImdyZWV0aW5nIiwic2hhcmVkIiwiY3VycmVudENvbnRleHRFbHQiLCJlc3NlbnRpYWxzIiwibGlzdCIsInVzZUNvbnRleHQiLCJpbnB1dFdyYXBwZXIiLCJlbnRyeSIsIm5hbWVzcGFjZVJlc3VsdCIsInNsaWNlIiwiZWRpdG9yIiwiVFJVTkNBVEVfTEVOR1RIIiwidHJ1bmNhdGVOYW1lIiwidXBkYXRlTmFtZSIsImdldE5hbWUiLCJwcm9nIiwiZ2V0Q29udGVudHMiLCJzYXkiLCJmb3JnZXQiLCJhbm5vdW5jZW1lbnRzIiwiZ2V0RWxlbWVudEJ5SWQiLCJsaSIsImNyZWF0ZVRleHROb2RlIiwiaW5zZXJ0QmVmb3JlIiwiZmlyc3RDaGlsZCIsInJlbW92ZUNoaWxkIiwiY3ljbGVBZHZhbmNlIiwiY3VyckluZGV4IiwibWF4SW5kZXgiLCJyZXZlcnNlUCIsIm5leHRJbmRleCIsInBvcHVsYXRlRm9jdXNDYXJvdXNlbCIsImZjIiwiZG9jbWFpbiIsInRvb2xiYXIiLCJkb2NyZXBsTWFpbiIsImdldEVsZW1lbnRzQnlDbGFzc05hbWUiLCJkb2NyZXBsTWFpbjAiLCJ1bmRlZmluZWQiLCJkb2NyZXBsIiwiZG9jcmVwbGNvZGUiLCJjeWNsZUZvY3VzIiwiZkNhcm91c2VsIiwiY3VycmVudEZvY3VzZWRFbHQiLCJmaW5kIiwibm9kZSIsImNvbnRhaW5zIiwiY3VycmVudEZvY3VzSW5kZXgiLCJuZXh0Rm9jdXNJbmRleCIsImZvY3VzRWx0IiwiZm9jdXNFbHQwIiwiY2xhc3NMaXN0IiwidGV4dGFyZWFzIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJyZW1vdmVBdHRyaWJ1dGUiLCJwcm9ncmFtTG9hZGVkIiwibWFrZVNoYXJlTGluayIsIm5hbWVPclVudGl0bGVkIiwibWVudUl0ZW1EaXNhYmxlZCIsImhhc0NsYXNzIiwibmV3RXZlbnQiLCJzYXZlRXZlbnQiLCJuZXdGaWxlbmFtZSIsInVzZU5hbWUiLCJjcmVhdGUiLCJzYXZlZFByb2dyYW0iLCJjcmVhdGVGaWxlIiwiZmlsZUV4dGVuc2lvbiIsImhpc3RvcnkiLCJwdXNoU3RhdGUiLCJnZXRVbmlxdWVJZCIsInRvU2F2ZSIsImdldFNwcml0ZVNjcmlwdHNYTUwiLCJzYXZlQXMiLCJzYXZlQXNQcm9tcHQiLCJuZXdOYW1lIiwicmVuYW1lIiwicmVuYW1lUHJvbXB0IiwiZm9jdXNhYmxlRWx0cyIsInRoZVRvb2xiYXIiLCJ0b3BUaWVyTWVudWl0ZW1zIiwidG9BcnJheSIsImZpbHRlciIsImdldEF0dHJpYnV0ZSIsIm51bVRvcFRpZXJNZW51aXRlbXMiLCJpdGhUb3BUaWVyTWVudWl0ZW0iLCJpQ2hpbGQiLCJjaGlsZHJlbiIsImZpcnN0IiwidXBkYXRlRWRpdG9ySGVpZ2h0IiwidG9vbGJhckhlaWdodCIsIm9mZnNldEhlaWdodCIsInBhZGRpbmdUb3AiLCJkb2NNYWluIiwiZG9jUmVwbE1haW4iLCJpbnNlcnRBcmlhUG9zIiwic3VibWVudSIsImFyciIsImxlbiIsInNldEF0dHJpYnV0ZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJoaWRlQWxsVG9wTWVudWl0ZW1zIiwic3RvcFByb3BhZ2F0aW9uIiwia2MiLCJrZXlDb2RlIiwiY2xpY2tUb3BNZW51aXRlbSIsInRoaXNFbHQiLCJ0b3BUaWVyVWwiLCJjbG9zZXN0IiwiaGFzQXR0cmlidXRlIiwidGhpc1RvcE1lbnVpdGVtIiwidDEiLCJzdWJtZW51T3BlbiIsImV4cGFuZGFibGVFbHRzIiwibm9uZXhwYW5kYWJsZUVsdHMiLCJzd2l0Y2hUb3BNZW51aXRlbSIsImRlc3RUb3BNZW51aXRlbSIsImRlc3RFbHQiLCJlbHRJZCIsInNob3dpbmdIZWxwS2V5cyIsInNob3dIZWxwS2V5cyIsImZhZGVJbiIsInJlY2l0ZUhlbHAiLCJ3aXRoaW5TZWNvbmRUaWVyVWwiLCJzZWNvbmRUaWVyVWwiLCJwb3NzRWx0cyIsInNyY1RvcE1lbnVpdGVtIiwidHRtaU4iLCJqIiwibmVhclNpYnMiLCJteUlkIiwidGhpc0VuY291bnRlcmVkIiwiYWRkIiwiZmFyU2licyIsInByZXZBbGwiLCJzdWJtZW51RGl2cyIsIm5leHRBbGwiLCJwcmV2ZW50RGVmYXVsdCIsInNoaWZ0S2V5IiwiY3RybEtleSIsImNvZGVDb250YWluZXIiLCJydW5CdXR0b24iLCJpbml0aWFsR2FzIiwic2V0T3B0aW9uIiwicmVtb3ZlU2hvcnRlbmVkTGluZSIsImxpbmVIYW5kbGUiLCJnZXRPcHRpb24iLCJsb25nTGluZXMiLCJydWxlckxpc3RlbmVycyIsInJlZnJlc2hSdWxlcnMiLCJkZWxldGVMaW5lIiwibWluTGVuZ3RoIiwic2l6ZSIsIk51bWJlciIsIk1BWF9WQUxVRSIsImxpbmVObyIsImluc3RhbmNlIiwibWluTGluZSIsImxhc3RMaW5lIiwibWF4TGluZSIsImNoYW5nZWQiLCJlYWNoTGluZSIsImxvb2tzTGlrZVVzZUNvbnRleHQiLCJSZWdFeHAiLCJnZXREb2MiLCJibG9ja3NJREVMb2FkZWQiLCJsb2FkU3ByaXRlU2NyaXB0c1hNTCIsImNsZWFySGlzdG9yeSIsIlBZUkVUX0xPQURfVElNRU9VVF9NUyIsIlBZUkVUX0ZBSUxFRF9LRVkiLCJQWVJFVF9GQUlMRURfVFRMX01TIiwicHJpbWFyeUZhaWxlZFJlY2VudGx5Iiwic3RhbXAiLCJsb2NhbFNldHRpbmdzIiwiZ2V0SXRlbSIsIkRhdGUiLCJub3ciLCJyZWNvcmRQcmltYXJ5RmFpbHVyZSIsInByaW1hcnlQeXJldCIsIlBZUkVUIiwic2V0SXRlbSIsIlN0cmluZyIsInB5cmV0QWN0dWFsbHlMb2FkZWQiLCJyZXF1aXJlanMiLCJiYWNrdXBQeXJldCIsIlBZUkVUX0JBQ0tVUCIsInB5cmV0TG9hZCIsImJvZHkiLCJweXJldExvYWQyIiwiYmFja3VwU3RhcnRlZCIsInN0YXJ0QmFja3VwTG9hZCIsImJhY2t1cFRpbWVyIiwiZXZlbnQiLCJ0aW1lb3V0TXMiLCJjbGVhclRpbWVvdXQiLCJwcmltYXJ5VGltZXIiLCJyZW1vdmUiLCJsb2dGYWlsdXJlQW5kTWFudWFsRmV0Y2giLCJ0aW1lU3RhbXAiLCJtYW51YWxGZXRjaCIsImFqYXgiLCJyZXMiLCJjb250ZW50c1ByZWZpeCIsInN0YXR1cyIsInN0YXR1c1RleHQiLCJyZXNwb25zZVRleHQiLCJtYWtlRXZlbnQiLCJoYW5kbGVycyIsImhhbmRsZXIiLCJ0cmlnZ2VyIiwidiIsImgiLCJfbWFrZUV2ZW50IiwiX21ha2VFdmVudDIiLCJfc2xpY2VkVG9BcnJheSIsIm9uUnVuIiwidHJpZ2dlck9uUnVuIiwiX21ha2VFdmVudDMiLCJfbWFrZUV2ZW50NCIsIm9uSW50ZXJhY3Rpb24iLCJ0cmlnZ2VyT25JbnRlcmFjdGlvbiIsIl9tYWtlRXZlbnQ1IiwiX21ha2VFdmVudDYiLCJvbkxvYWQiLCJ0cmlnZ2VyT25Mb2FkIiwiZmluIiwiZXZlbnRzIiwiaW5pdGlhbFN0YXRlIiwiYWNxdWlyZVZzQ29kZUFwaSIsIk1FU1NBR0VTIiwibWFrZUV2ZW50cyIsInNlbmRQb3J0IiwicmVjZWl2ZVBvcnQiLCJwYXJlbnQiLCJOT0RFX0VOViIsIm5vdGVzIl0sInNvdXJjZVJvb3QiOiIifQ==