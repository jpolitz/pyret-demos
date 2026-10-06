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

  // Caller's response: whichever of direct-verified or proxy fulfills
  // first. If both fail, surface proxy's error (the more authoritative
  // upstream — direct's may just be 'direct-not-verified').
  var responsePromise = Promise.any([directP, proxyP])["catch"](function (aggErr) {
    return Promise.reject(aggErr.errors[1] || aggErr.errors[0]);
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
  });
  programLoaded.fail(function (error) {
    console.error("Program contents did not load: ", error);
    CPO.documents.set("definitions://", CPO.editor.cm.getDoc());
  });
  console.log("About to load Pyret: ", originalPageLoad, Date.now());
  var pyretLoad = document.createElement('script');
  console.log(window.PYRET);
  pyretLoad.src = window.PYRET;
  pyretLoad.type = "text/javascript";
  pyretLoad.setAttribute("crossorigin", "anonymous");
  document.body.appendChild(pyretLoad);
  var pyretLoad2 = document.createElement('script');
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
    pyretLoad2.src = undefined;
    pyretLoad2.type = "text/javascript";
    document.body.appendChild(pyretLoad2);
  });
  $(pyretLoad2).on("error", function (e) {
    $("#loader").hide();
    $("#runPart").hide();
    $("#breakButton").hide();
    window.stickError("Pyret failed to load; check your connection or try refreshing the page.  If this happens repeatedly, please report it as a bug.");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianMvYmVmb3JlUHlyZXQuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0FBLGlDQUEyQixDQUFDLHFEQUFHLENBQUMsbUNBQUUsVUFBU0MsQ0FBQyxFQUFFO0VBRTVDLFNBQVNDLGdCQUFnQkEsQ0FBQ0MsSUFBSSxFQUFFO0lBQzlCLElBQUlDLE9BQU8sR0FBR0MsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUNDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQztJQUNqRUYsT0FBTyxDQUFDRyxJQUFJLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQztJQUNwQ0gsT0FBTyxDQUFDSSxFQUFFLENBQUMsT0FBTyxFQUFFLFlBQVc7TUFBRUgsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDSSxNQUFNLENBQUMsQ0FBQztJQUFFLENBQUMsQ0FBQztJQUNyREwsT0FBTyxDQUFDSSxFQUFFLENBQUMsU0FBUyxFQUFFLFlBQVc7TUFBRUgsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDSSxNQUFNLENBQUMsQ0FBQztJQUFFLENBQUMsQ0FBQztJQUN2REwsT0FBTyxDQUFDTSxHQUFHLENBQUNQLElBQUksQ0FBQztJQUNqQixPQUFPQyxPQUFPO0VBR2hCOztFQUVBO0VBQ0EsSUFBSU8sV0FBVyxHQUFHVixDQUFDLENBQUMsQ0FBQztFQUNyQixJQUFJVyxNQUFNLEdBQUcsQ0FDWCxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsU0FBUyxDQUNoRDtFQUVEQyxNQUFNLENBQUNDLE1BQU0sR0FBRyxFQUFFOztFQUVsQjtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztFQUVFO0FBQ0Y7QUFDQTtBQUNBO0VBQ0UsU0FBU0MsTUFBTUEsQ0FBQ0MsT0FBTyxFQUFFO0lBQ3ZCSCxNQUFNLENBQUNDLE1BQU0sQ0FBQ0csSUFBSSxDQUFDLElBQUksQ0FBQztJQUN4QixJQUFJLENBQUNELE9BQU8sSUFDUEosTUFBTSxDQUFDTSxPQUFPLENBQUNGLE9BQU8sQ0FBQ0csS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFFLElBQ3RDLENBQUNILE9BQU8sQ0FBQ0EsT0FBTyxJQUNmLE9BQU9BLE9BQU8sQ0FBQ0EsT0FBTyxDQUFDSSxNQUFNLEtBQUssUUFBUyxJQUFLSixPQUFPLENBQUNBLE9BQU8sQ0FBQ0ksTUFBTSxLQUFLLENBQUUsRUFBRTtNQUNsRixNQUFNLElBQUlDLEtBQUssQ0FBQyx3QkFBd0IsRUFBRUwsT0FBTyxDQUFDO0lBQ3BEO0lBQ0EsSUFBSSxDQUFDQSxPQUFPLEdBQUdBLE9BQU87SUFDdEIsSUFBSSxDQUFDTSxLQUFLLEdBQUdqQixDQUFDLENBQUMsY0FBYyxDQUFDO0lBQzlCLElBQUksSUFBSSxDQUFDVyxPQUFPLENBQUNHLEtBQUssS0FBSyxPQUFPLEVBQUU7TUFDbEMsSUFBSSxDQUFDSSxJQUFJLEdBQUdsQixDQUFDLENBQUNBLENBQUMsQ0FBQ21CLFNBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUNsQixRQUFRLENBQUMsaUJBQWlCLENBQUM7SUFDM0UsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDVSxPQUFPLENBQUNHLEtBQUssS0FBSyxNQUFNLEVBQUU7TUFDeEMsSUFBSSxDQUFDSSxJQUFJLEdBQUdsQixDQUFDLENBQUMsT0FBTyxDQUFDLENBQUNDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztJQUNwRCxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUNVLE9BQU8sQ0FBQ0csS0FBSyxLQUFLLFVBQVUsRUFBRTtNQUM1QyxJQUFJLENBQUNJLElBQUksR0FBR2xCLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQ0MsUUFBUSxDQUFDLGlCQUFpQixDQUFDO0lBQ3BELENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQ1UsT0FBTyxDQUFDRyxLQUFLLEtBQUssU0FBUyxFQUFFO01BQzNDLElBQUksQ0FBQ0ksSUFBSSxHQUFHbEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDQyxRQUFRLENBQUMsaUJBQWlCLENBQUM7SUFDcEQsQ0FBQyxNQUFNO01BQ0wsSUFBSSxDQUFDaUIsSUFBSSxHQUFHbEIsQ0FBQyxDQUFDQSxDQUFDLENBQUNtQixTQUFTLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQ2xCLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztJQUN2RTtJQUNBLElBQUksQ0FBQ21CLEtBQUssR0FBR3BCLENBQUMsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUNpQixLQUFLLENBQUM7SUFDaEQsSUFBSSxDQUFDSSxZQUFZLEdBQUdyQixDQUFDLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDaUIsS0FBSyxDQUFDO0lBQ25ELElBQUksQ0FBQ0ssV0FBVyxHQUFHdEIsQ0FBQyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUNpQixLQUFLLENBQUM7SUFDMUMsSUFBSSxDQUFDTSxZQUFZLEdBQUd2QixDQUFDLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQ2lCLEtBQUssQ0FBQztJQUM1QyxJQUFHLElBQUksQ0FBQ04sT0FBTyxDQUFDYSxVQUFVLEVBQUU7TUFDMUIsSUFBSSxDQUFDRCxZQUFZLENBQUN6QixJQUFJLENBQUMsSUFBSSxDQUFDYSxPQUFPLENBQUNhLFVBQVUsQ0FBQztJQUNqRCxDQUFDLE1BQ0k7TUFDSCxJQUFJLENBQUNELFlBQVksQ0FBQ3pCLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDbEM7SUFDQSxJQUFHLElBQUksQ0FBQ2EsT0FBTyxDQUFDYyxVQUFVLEVBQUU7TUFDMUIsSUFBSSxDQUFDSCxXQUFXLENBQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDYSxPQUFPLENBQUNjLFVBQVUsQ0FBQztJQUNoRCxDQUFDLE1BQ0k7TUFDSCxJQUFJLENBQUNILFdBQVcsQ0FBQ3hCLElBQUksQ0FBQyxRQUFRLENBQUM7SUFDakM7SUFDQSxJQUFJLENBQUN1QixZQUFZLENBQUNLLFdBQVcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQ2YsT0FBTyxDQUFDZ0IsTUFBTSxDQUFDO0lBRTlELElBQUksQ0FBQ0MsVUFBVSxHQUFHLEtBQUs7SUFDdkIsSUFBSSxDQUFDQyxRQUFRLEdBQUdqQyxDQUFDLENBQUNrQyxLQUFLLENBQUMsQ0FBQztJQUN6QixJQUFJLENBQUNDLE9BQU8sR0FBRyxJQUFJLENBQUNGLFFBQVEsQ0FBQ0UsT0FBTztFQUN0Qzs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBOztFQUVFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRXJCLE1BQU0sQ0FBQ3NCLFNBQVMsQ0FBQ0MsSUFBSSxHQUFHLFVBQVNDLFFBQVEsRUFBRTtJQUN6QztJQUNBO0lBQ0EsSUFBSSxJQUFJLENBQUN2QixPQUFPLENBQUN3QixVQUFVLEVBQUU7TUFDM0IsSUFBSSxDQUFDWixZQUFZLENBQUNhLElBQUksQ0FBQyxDQUFDO0lBQzFCLENBQUMsTUFBTTtNQUNMLElBQUksQ0FBQ2IsWUFBWSxDQUFDVSxJQUFJLENBQUMsQ0FBQztJQUMxQjtJQUNBLElBQUksQ0FBQ1gsV0FBVyxDQUFDZSxLQUFLLENBQUMsSUFBSSxDQUFDQyxPQUFPLENBQUNDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUMvQyxJQUFJLENBQUN0QixLQUFLLENBQUN1QixRQUFRLENBQUMsVUFBU0MsQ0FBQyxFQUFFO01BQzlCLElBQUdBLENBQUMsQ0FBQ0MsS0FBSyxJQUFJLEVBQUUsRUFBRTtRQUNoQixJQUFJLENBQUNuQixZQUFZLENBQUNjLEtBQUssQ0FBQyxDQUFDO1FBQ3pCLE9BQU8sS0FBSztNQUNkO0lBQ0YsQ0FBQyxDQUFDRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDYixJQUFJLENBQUNoQixZQUFZLENBQUNjLEtBQUssQ0FBQyxJQUFJLENBQUNNLFFBQVEsQ0FBQ0osSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pELElBQUlLLFFBQVEsR0FBSSxVQUFTSCxDQUFDLEVBQUU7TUFDMUI7TUFDQTtNQUNBLElBQUl6QyxDQUFDLENBQUN5QyxDQUFDLENBQUNJLE1BQU0sQ0FBQyxDQUFDQyxFQUFFLENBQUMsSUFBSSxDQUFDN0IsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDWSxRQUFRLEVBQUU7UUFDL0MsSUFBSSxDQUFDUyxPQUFPLENBQUNHLENBQUMsQ0FBQztRQUNmekMsQ0FBQyxDQUFDK0MsUUFBUSxDQUFDLENBQUNDLEdBQUcsQ0FBQyxPQUFPLEVBQUVKLFFBQVEsQ0FBQztNQUNwQztJQUNGLENBQUMsQ0FBRUwsSUFBSSxDQUFDLElBQUksQ0FBQztJQUNidkMsQ0FBQyxDQUFDK0MsUUFBUSxDQUFDLENBQUNWLEtBQUssQ0FBQ08sUUFBUSxDQUFDO0lBQzNCLElBQUlLLFVBQVUsR0FBSSxVQUFTUixDQUFDLEVBQUU7TUFDNUIsSUFBSUEsQ0FBQyxDQUFDUyxHQUFHLEtBQUssUUFBUSxFQUFFO1FBQ3RCLElBQUksQ0FBQ1osT0FBTyxDQUFDRyxDQUFDLENBQUM7UUFDZnpDLENBQUMsQ0FBQytDLFFBQVEsQ0FBQyxDQUFDQyxHQUFHLENBQUMsU0FBUyxFQUFFQyxVQUFVLENBQUM7TUFDeEM7SUFDRixDQUFDLENBQUVWLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDYnZDLENBQUMsQ0FBQytDLFFBQVEsQ0FBQyxDQUFDSSxPQUFPLENBQUNGLFVBQVUsQ0FBQztJQUMvQixJQUFJLENBQUM3QixLQUFLLENBQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDYSxPQUFPLENBQUNTLEtBQUssQ0FBQztJQUNuQyxJQUFJLENBQUNnQyxhQUFhLENBQUMsQ0FBQztJQUNwQixJQUFJLENBQUNuQyxLQUFLLENBQUNvQyxHQUFHLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQztJQUNsQ3JELENBQUMsQ0FBQyw4QkFBOEIsRUFBRSxJQUFJLENBQUNpQixLQUFLLENBQUMsQ0FBQ3FDLEtBQUssQ0FBQyxDQUFDLENBQUNsRCxNQUFNLENBQUMsQ0FBQztJQUU5RCxJQUFJOEIsUUFBUSxFQUFFO01BQ1osT0FBTyxJQUFJLENBQUNILE9BQU8sQ0FBQ3dCLElBQUksQ0FBQ3JCLFFBQVEsQ0FBQztJQUNwQyxDQUFDLE1BQU07TUFDTCxPQUFPLElBQUksQ0FBQ0gsT0FBTztJQUNyQjtFQUNGLENBQUM7O0VBR0Q7QUFDRjtBQUNBO0VBQ0VyQixNQUFNLENBQUNzQixTQUFTLENBQUN3QixVQUFVLEdBQUcsWUFBVztJQUN2QyxJQUFJLENBQUNqQyxZQUFZLENBQUN5QixHQUFHLENBQUMsQ0FBQztJQUN2QixJQUFJLENBQUMxQixXQUFXLENBQUMwQixHQUFHLENBQUMsQ0FBQztJQUN0QixJQUFJLENBQUM5QixJQUFJLENBQUN1QyxLQUFLLENBQUMsQ0FBQztFQUNuQixDQUFDOztFQUVEO0FBQ0Y7QUFDQTtBQUNBO0VBQ0UvQyxNQUFNLENBQUNzQixTQUFTLENBQUNvQixhQUFhLEdBQUcsWUFBVztJQUMxQyxTQUFTTSxjQUFjQSxDQUFDQyxNQUFNLEVBQUVDLEdBQUcsRUFBRTtNQUNuQyxJQUFJQyxHQUFHLEdBQUc3RCxDQUFDLENBQUNBLENBQUMsQ0FBQ21CLFNBQVMsQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFDO01BQ3ZFLElBQUkyQyxFQUFFLEdBQUcsR0FBRyxHQUFHRixHQUFHLENBQUNHLFFBQVEsQ0FBQyxDQUFDO01BQzdCLElBQUlDLEtBQUssR0FBR2hFLENBQUMsQ0FBQ0EsQ0FBQyxDQUFDbUIsU0FBUyxDQUFDLGVBQWUsR0FBRzJDLEVBQUUsR0FBRyxhQUFhLENBQUMsQ0FBQztNQUNoRUQsR0FBRyxDQUFDM0QsSUFBSSxDQUFDLElBQUksRUFBRTRELEVBQUUsQ0FBQztNQUNsQkQsR0FBRyxDQUFDM0QsSUFBSSxDQUFDLE9BQU8sRUFBRXlELE1BQU0sQ0FBQ00sS0FBSyxDQUFDO01BQy9CRCxLQUFLLENBQUNsRSxJQUFJLENBQUM2RCxNQUFNLENBQUNPLE9BQU8sQ0FBQztNQUMxQixJQUFJQyxZQUFZLEdBQUduRSxDQUFDLENBQUNBLENBQUMsQ0FBQ21CLFNBQVMsQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDO01BQ2pGZ0QsWUFBWSxDQUFDQyxNQUFNLENBQUNQLEdBQUcsQ0FBQztNQUN4QixJQUFJUSxjQUFjLEdBQUdyRSxDQUFDLENBQUNBLENBQUMsQ0FBQ21CLFNBQVMsQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO01BQ3JGa0QsY0FBYyxDQUFDRCxNQUFNLENBQUNKLEtBQUssQ0FBQztNQUM1QixJQUFJTSxTQUFTLEdBQUd0RSxDQUFDLENBQUNBLENBQUMsQ0FBQ21CLFNBQVMsQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO01BQ3hFbUQsU0FBUyxDQUFDRixNQUFNLENBQUNELFlBQVksQ0FBQztNQUM5QkcsU0FBUyxDQUFDRixNQUFNLENBQUNDLGNBQWMsQ0FBQztNQUNoQyxJQUFJVixNQUFNLENBQUNZLE9BQU8sRUFBRTtRQUNsQixJQUFJQSxPQUFPLEdBQUd2RSxDQUFDLENBQUNBLENBQUMsQ0FBQ21CLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUMzQyxJQUFJcUQsRUFBRSxHQUFHQyxVQUFVLENBQUNGLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtVQUM5Qk4sS0FBSyxFQUFFTixNQUFNLENBQUNZLE9BQU87VUFDckJHLElBQUksRUFBRSxPQUFPO1VBQ2JDLFdBQVcsRUFBRSxLQUFLO1VBQ2xCQyxRQUFRLEVBQUUsVUFBVSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQztRQUNGQyxVQUFVLENBQUMsWUFBVTtVQUNuQkwsRUFBRSxDQUFDTSxPQUFPLENBQUMsQ0FBQztRQUNkLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDTCxJQUFJQyxnQkFBZ0IsR0FBRy9FLENBQUMsQ0FBQ0EsQ0FBQyxDQUFDbUIsU0FBUyxDQUFDLGdEQUFnRCxDQUFDLENBQUM7UUFDdkY0RCxnQkFBZ0IsQ0FBQ1gsTUFBTSxDQUFDRyxPQUFPLENBQUM7UUFDaENELFNBQVMsQ0FBQ0YsTUFBTSxDQUFDVyxnQkFBZ0IsQ0FBQztNQUNwQztNQUVBLE9BQU9ULFNBQVM7SUFDbEI7SUFDQSxTQUFTVSxhQUFhQSxDQUFDckIsTUFBTSxFQUFFQyxHQUFHLEVBQUU7TUFDbEMsSUFBSUMsR0FBRyxHQUFHN0QsQ0FBQyxDQUFDQSxDQUFDLENBQUNtQixTQUFTLENBQUMsdURBQXVELENBQUMsQ0FBQztNQUNqRjBDLEdBQUcsQ0FBQzNELElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxHQUFHMEQsR0FBRyxDQUFDRyxRQUFRLENBQUMsQ0FBQyxDQUFDO01BQ3BDRixHQUFHLENBQUNPLE1BQU0sQ0FBQ3BFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQ0YsSUFBSSxDQUFDNkQsTUFBTSxDQUFDTyxPQUFPLENBQUMsQ0FBQyxDQUN0Q0UsTUFBTSxDQUFDcEUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDRixJQUFJLENBQUM2RCxNQUFNLENBQUNzQixPQUFPLENBQUMsQ0FBQztNQUN4QyxLQUFLLElBQUlDLEdBQUcsSUFBSXZCLE1BQU0sQ0FBQ3hELEVBQUUsRUFDdkIwRCxHQUFHLENBQUMxRCxFQUFFLENBQUMrRSxHQUFHLEVBQUV2QixNQUFNLENBQUN4RCxFQUFFLENBQUMrRSxHQUFHLENBQUMsQ0FBQztNQUM3QixPQUFPckIsR0FBRztJQUNaO0lBRUEsU0FBU3NCLGFBQWFBLENBQUN4QixNQUFNLEVBQUU7TUFDN0IsSUFBSUUsR0FBRyxHQUFHN0QsQ0FBQyxDQUFDLGtDQUFrQyxDQUFDO01BQy9DLElBQU1vRixLQUFLLEdBQUdwRixDQUFDLENBQUMsNENBQTRDLENBQUMsQ0FBQ0ssR0FBRyxDQUFDc0QsTUFBTSxDQUFDMEIsWUFBWSxDQUFDO01BQ3RGLElBQUcxQixNQUFNLENBQUMyQixXQUFXLEVBQUU7UUFDckJ6QixHQUFHLENBQUNPLE1BQU0sQ0FBQ1QsTUFBTSxDQUFDMkIsV0FBVyxDQUFDRixLQUFLLENBQUMsQ0FBQztNQUN2QyxDQUFDLE1BQ0k7UUFDSHZCLEdBQUcsQ0FBQ08sTUFBTSxDQUFDcEUsQ0FBQyxDQUFDLGlDQUFpQyxDQUFDLENBQUNDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQ0gsSUFBSSxDQUFDNkQsTUFBTSxDQUFDTyxPQUFPLENBQUMsQ0FBQztRQUMzRkwsR0FBRyxDQUFDTyxNQUFNLENBQUNnQixLQUFLLENBQUM7TUFDbkI7TUFDQSxPQUFPdkIsR0FBRztJQUNaO0lBRUEsU0FBUzBCLGlCQUFpQkEsQ0FBQzVCLE1BQU0sRUFBRTtNQUNqQyxJQUFJRSxHQUFHLEdBQUc3RCxDQUFDLENBQUMsT0FBTyxDQUFDO01BQ3BCNkQsR0FBRyxDQUFDTyxNQUFNLENBQUNwRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUNDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQ0gsSUFBSSxDQUFDNkQsTUFBTSxDQUFDTyxPQUFPLENBQUMsQ0FBQztNQUMvRCxJQUFHUCxNQUFNLENBQUM3RCxJQUFJLEVBQUU7UUFDZCxJQUFJMEYsR0FBRyxHQUFHM0YsZ0JBQWdCLENBQUM4RCxNQUFNLENBQUM3RCxJQUFJLENBQUM7UUFDN0M7UUFDTStELEdBQUcsQ0FBQ08sTUFBTSxDQUFDb0IsR0FBRyxDQUFDO1FBQ2ZBLEdBQUcsQ0FBQ2xDLEtBQUssQ0FBQyxDQUFDO01BQ2I7TUFDQSxPQUFPTyxHQUFHO0lBQ1o7SUFFQSxTQUFTNEIsZ0JBQWdCQSxDQUFDOUIsTUFBTSxFQUFFO01BQ2hDLE9BQU8zRCxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUNGLElBQUksQ0FBQzZELE1BQU0sQ0FBQ08sT0FBTyxDQUFDO0lBQ3RDO0lBRUEsSUFBSXdCLElBQUksR0FBRyxJQUFJO0lBRWYsU0FBU0MsU0FBU0EsQ0FBQ2hDLE1BQU0sRUFBRWlDLENBQUMsRUFBRTtNQUM1QixJQUFHRixJQUFJLENBQUMvRSxPQUFPLENBQUNHLEtBQUssS0FBSyxPQUFPLEVBQUU7UUFDakMsT0FBTzRDLGNBQWMsQ0FBQ0MsTUFBTSxFQUFFaUMsQ0FBQyxDQUFDO01BQ2xDLENBQUMsTUFDSSxJQUFHRixJQUFJLENBQUMvRSxPQUFPLENBQUNHLEtBQUssS0FBSyxPQUFPLEVBQUU7UUFDdEMsT0FBT2tFLGFBQWEsQ0FBQ3JCLE1BQU0sRUFBRWlDLENBQUMsQ0FBQztNQUNqQyxDQUFDLE1BQ0ksSUFBR0YsSUFBSSxDQUFDL0UsT0FBTyxDQUFDRyxLQUFLLEtBQUssTUFBTSxFQUFFO1FBQ3JDLE9BQU9xRSxhQUFhLENBQUN4QixNQUFNLENBQUM7TUFDOUIsQ0FBQyxNQUNJLElBQUcrQixJQUFJLENBQUMvRSxPQUFPLENBQUNHLEtBQUssS0FBSyxVQUFVLEVBQUU7UUFDekMsT0FBT3lFLGlCQUFpQixDQUFDNUIsTUFBTSxDQUFDO01BQ2xDLENBQUMsTUFDSSxJQUFHK0IsSUFBSSxDQUFDL0UsT0FBTyxDQUFDRyxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3hDLE9BQU8yRSxnQkFBZ0IsQ0FBQzlCLE1BQU0sQ0FBQztNQUNqQztJQUNGO0lBRUEsSUFBSWtDLFVBQVU7SUFDZDtJQUNKO0lBQ01BLFVBQVUsR0FBRyxJQUFJLENBQUNsRixPQUFPLENBQUNBLE9BQU8sQ0FBQ21GLEdBQUcsQ0FBQ0gsU0FBUyxDQUFDO0lBQ3REO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDSTNGLENBQUMsQ0FBQyxxQkFBcUIsRUFBRTZGLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDM0YsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUM7SUFDN0QsSUFBSSxDQUFDZ0IsSUFBSSxDQUFDa0QsTUFBTSxDQUFDeUIsVUFBVSxDQUFDO0lBQzVCN0YsQ0FBQyxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUNpQixLQUFLLENBQUMsQ0FBQ3dDLEtBQUssQ0FBQyxDQUFDLENBQUNXLE1BQU0sQ0FBQyxJQUFJLENBQUNsRCxJQUFJLENBQUM7RUFDeEQsQ0FBQzs7RUFFRDtBQUNGO0FBQ0E7RUFDRVIsTUFBTSxDQUFDc0IsU0FBUyxDQUFDTSxPQUFPLEdBQUcsVUFBU0csQ0FBQyxFQUFFO0lBQ3JDLElBQUksQ0FBQ3hCLEtBQUssQ0FBQ29DLEdBQUcsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDO0lBQ2pDLElBQUksQ0FBQ0csVUFBVSxDQUFDLENBQUM7SUFDakIsSUFBSSxDQUFDM0IsUUFBUSxDQUFDa0UsT0FBTyxDQUFDLElBQUksQ0FBQztJQUMzQixPQUFPLElBQUksQ0FBQ2xFLFFBQVE7SUFDcEIsT0FBTyxJQUFJLENBQUNFLE9BQU87RUFDckIsQ0FBQzs7RUFFRDtBQUNGO0FBQ0E7RUFDRXJCLE1BQU0sQ0FBQ3NCLFNBQVMsQ0FBQ1csUUFBUSxHQUFHLFVBQVNGLENBQUMsRUFBRTtJQUN0QyxJQUFHLElBQUksQ0FBQzlCLE9BQU8sQ0FBQ0csS0FBSyxLQUFLLE9BQU8sRUFBRTtNQUNqQyxJQUFJa0YsTUFBTSxHQUFHaEcsQ0FBQyxDQUFDLDZCQUE2QixFQUFFLElBQUksQ0FBQ2lCLEtBQUssQ0FBQyxDQUFDWixHQUFHLENBQUMsQ0FBQztJQUNqRSxDQUFDLE1BQ0ksSUFBRyxJQUFJLENBQUNNLE9BQU8sQ0FBQ0csS0FBSyxLQUFLLE1BQU0sRUFBRTtNQUNyQyxJQUFJa0YsTUFBTSxHQUFHaEcsQ0FBQyxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQ2lCLEtBQUssQ0FBQyxDQUFDWixHQUFHLENBQUMsQ0FBQztJQUN4RCxDQUFDLE1BQ0ksSUFBRyxJQUFJLENBQUNNLE9BQU8sQ0FBQ0csS0FBSyxLQUFLLFVBQVUsRUFBRTtNQUN6QyxJQUFJa0YsTUFBTSxHQUFHLElBQUk7SUFDbkIsQ0FBQyxNQUNJLElBQUcsSUFBSSxDQUFDckYsT0FBTyxDQUFDRyxLQUFLLEtBQUssU0FBUyxFQUFFO01BQ3hDLElBQUlrRixNQUFNLEdBQUcsSUFBSTtJQUNuQixDQUFDLE1BQ0k7TUFDSCxJQUFJQSxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDckI7SUFDQSxJQUFJLENBQUMvRSxLQUFLLENBQUNvQyxHQUFHLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQztJQUNqQyxJQUFJLENBQUNHLFVBQVUsQ0FBQyxDQUFDO0lBQ2pCLElBQUksQ0FBQzNCLFFBQVEsQ0FBQ2tFLE9BQU8sQ0FBQ0MsTUFBTSxDQUFDO0lBQzdCLE9BQU8sSUFBSSxDQUFDbkUsUUFBUTtJQUNwQixPQUFPLElBQUksQ0FBQ0UsT0FBTztFQUNyQixDQUFDO0VBRUQsT0FBT3JCLE1BQU07QUFFZixDQUFDO0FBQUEsa0dBQUMsQzs7Ozs7Ozs7OztBQ25URjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxNQUFNLFNBQVMsSUFBeUQ7QUFDeEU7O0FBRUE7QUFDQSxNQUFNLEtBQUs7QUFBQSwwQkErQk47O0FBRUwsQ0FBQztBQUNEOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxnQkFBZ0I7QUFDaEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtB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QUN4RDtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9CQUFvQjtBQUNwQjtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0I7QUFDeEI7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLFNBQVM7QUFDVCxLQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7O0FBRUw7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFVBQVU7QUFDckIsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0EsbUNBQW1DLGVBQWU7QUFDbEQ7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsbUNBQW1DLGVBQWU7QUFDbEQ7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUOztBQUVBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsYUFBYTtBQUNiO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBLEtBQUs7QUFDTCxpQkFBaUI7QUFDakIsS0FBSzs7QUFFTDtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTCxpQkFBaUI7QUFDakIsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBLEtBQUs7QUFDTDtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0I7QUFDbEI7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFJO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0EsV0FBVyxVQUFVO0FBQ3JCLGFBQWEsVUFBVTtBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0JBQW9CLFNBQVM7QUFDN0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFFBQVE7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUJBQXFCO0FBQ3JCO0FBQ0E7QUFDQSwwQ0FBMEMsK0JBQStCO0FBQ3pFO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxRQUFRO0FBQ25CO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQSxLQUFLOztBQUVMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBLFNBQVM7QUFDVCxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsYUFBYTtBQUN4QjtBQUNBLGFBQWEsY0FBYztBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxNQUFNO0FBQ2pCLFdBQVcsVUFBVTtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsTUFBTTtBQUNqQixXQUFXLFVBQVU7QUFDckI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxNQUFNO0FBQ2pCLFdBQVcsVUFBVTtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLE1BQU07QUFDakI7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNB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QU8sRUFBRztJQUNyREEsTUFBTSxDQUFDc2tCLFFBQVEsR0FBR0MsVUFBVSxDQUFDO01BQUV4WixHQUFHLEVBQUVBLEdBQUc7TUFBRXlaLFFBQVEsRUFBRXhrQixNQUFNLENBQUN5SixNQUFNO01BQUVnYixXQUFXLEVBQUV6a0IsTUFBTTtNQUFFbWtCLFlBQVksRUFBWkE7SUFBYSxDQUFDLENBQUM7SUFDdEdua0IsTUFBTSxDQUFDb2tCLGlCQUFpQixHQUFHLElBQUk7RUFDakM7QUFDRixDQUFDLENBQUMsQyIsInNvdXJjZXMiOlsid2VicGFjazovL2NvZGUucHlyZXQub3JnLy4vc3JjL3dlYi9qcy9tb2RhbC1wcm9tcHQuanMiLCJ3ZWJwYWNrOi8vY29kZS5weXJldC5vcmcvLi9ub2RlX21vZHVsZXMvcS9xLmpzIiwid2VicGFjazovL2NvZGUucHlyZXQub3JnLy4vbm9kZV9tb2R1bGVzL3VybC5qcy91cmwuanMiLCJ3ZWJwYWNrOi8vY29kZS5weXJldC5vcmcvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vY29kZS5weXJldC5vcmcvLi9zcmMvd2ViL2pzL2JlZm9yZVB5cmV0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTW9kdWxlIGZvciBtYW5hZ2luZyBtb2RhbCBwcm9tcHQgaW5zdGFuY2VzLlxuICogTk9URTogVGhpcyBtb2R1bGUgaXMgY3VycmVudGx5IGxpbWl0ZWQgaW4gYSBudW1iZXJcbiAqICAgICAgIG9mIHdheXMuIEZvciBvbmUsIGl0IG9ubHkgYWxsb3dzIHJhZGlvXG4gKiAgICAgICBpbnB1dCBvcHRpb25zLiBBZGRpdGlvbmFsbHksIGl0IGhhcmQtY29kZXMgaW5cbiAqICAgICAgIGEgbnVtYmVyIG9mIG90aGVyIGJlaGF2aW9ycyB3aGljaCBhcmUgc3BlY2lmaWNcbiAqICAgICAgIHRvIHRoZSBpbWFnZSBpbXBvcnQgc3R5bGUgcHJvbXB0IChmb3Igd2hpY2hcbiAqICAgICAgIHRoaXMgbW9kdWxlIHdhcyB3cml0dGVuKS5cbiAqICAgICAgIElmIGRlc2lyZWQsIHRoaXMgbW9kdWxlIG1heSBiZSBtYWRlIG1vcmVcbiAqICAgICAgIGdlbmVyYWwtcHVycG9zZSBpbiB0aGUgZnV0dXJlLCBidXQsIGZvciBub3csXG4gKiAgICAgICBiZSBhd2FyZSBvZiB0aGVzZSBsaW1pdGF0aW9ucy5cbiAqL1xuZGVmaW5lKFwiY3BvL21vZGFsLXByb21wdFwiLCBbXCJxXCJdLCBmdW5jdGlvbihRKSB7XG5cbiAgZnVuY3Rpb24gYXV0b0hpZ2hsaWdodEJveCh0ZXh0KSB7XG4gICAgdmFyIHRleHRCb3ggPSAkKFwiPGlucHV0IHR5cGU9J3RleHQnPlwiKS5hZGRDbGFzcyhcImF1dG8taGlnaGxpZ2h0XCIpO1xuICAgIHRleHRCb3guYXR0cihcInJlYWRvbmx5XCIsIFwicmVhZG9ubHlcIik7XG4gICAgdGV4dEJveC5vbihcImZvY3VzXCIsIGZ1bmN0aW9uKCkgeyAkKHRoaXMpLnNlbGVjdCgpOyB9KTtcbiAgICB0ZXh0Qm94Lm9uKFwibW91c2V1cFwiLCBmdW5jdGlvbigpIHsgJCh0aGlzKS5zZWxlY3QoKTsgfSk7XG4gICAgdGV4dEJveC52YWwodGV4dCk7XG4gICAgcmV0dXJuIHRleHRCb3g7XG5cblxuICB9XG5cbiAgLy8gQWxsb3dzIGFzeW5jaHJvbm91cyByZXF1ZXN0aW5nIG9mIHByb21wdHNcbiAgdmFyIHByb21wdFF1ZXVlID0gUSgpO1xuICB2YXIgc3R5bGVzID0gW1xuICAgIFwicmFkaW9cIiwgXCJ0aWxlc1wiLCBcInRleHRcIiwgXCJjb3B5VGV4dFwiLCBcImNvbmZpcm1cIlxuICBdO1xuXG4gIHdpbmRvdy5tb2RhbHMgPSBbXTtcblxuICAvKipcbiAgICogUmVwcmVzZW50cyBhbiBvcHRpb24gdG8gcHJlc2VudCB0aGUgdXNlclxuICAgKiBAdHlwZWRlZiB7T2JqZWN0fSBNb2RhbE9wdGlvblxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gbWVzc2FnZSAtIFRoZSBtZXNzYWdlIHRvIHNob3cgdGhlIHVzZXIgd2hpY2hcbiAgICAgICAgICAgICAgIGRlc2NyaWJlcyB0aGlzIG9wdGlvblxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gdmFsdWUgLSBUaGUgdmFsdWUgdG8gcmV0dXJuIGlmIHRoaXMgb3B0aW9uIGlzIGNob3NlblxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gW2V4YW1wbGVdIC0gQSBjb2RlIHNuaXBwZXQgdG8gc2hvdyB3aXRoIHRoaXMgb3B0aW9uXG4gICAqL1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvciBmb3IgbW9kYWwgcHJvbXB0cy5cbiAgICogQHBhcmFtIHtNb2RhbE9wdGlvbltdfSBvcHRpb25zIC0gVGhlIG9wdGlvbnMgdG8gcHJlc2VudCB0aGUgdXNlclxuICAgKi9cbiAgZnVuY3Rpb24gUHJvbXB0KG9wdGlvbnMpIHtcbiAgICB3aW5kb3cubW9kYWxzLnB1c2godGhpcyk7XG4gICAgaWYgKCFvcHRpb25zIHx8XG4gICAgICAgIChzdHlsZXMuaW5kZXhPZihvcHRpb25zLnN0eWxlKSA9PT0gLTEpIHx8XG4gICAgICAgICFvcHRpb25zLm9wdGlvbnMgfHxcbiAgICAgICAgKHR5cGVvZiBvcHRpb25zLm9wdGlvbnMubGVuZ3RoICE9PSBcIm51bWJlclwiKSB8fCAob3B0aW9ucy5vcHRpb25zLmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgUHJvbXB0IE9wdGlvbnNcIiwgb3B0aW9ucyk7XG4gICAgfVxuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5tb2RhbCA9ICQoXCIjcHJvbXB0TW9kYWxcIik7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5zdHlsZSA9PT0gXCJyYWRpb1wiKSB7XG4gICAgICB0aGlzLmVsdHMgPSAkKCQucGFyc2VIVE1MKFwiPHRhYmxlPjwvdGFibGU+XCIpKS5hZGRDbGFzcyhcImNob2ljZUNvbnRhaW5lclwiKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5zdHlsZSA9PT0gXCJ0ZXh0XCIpIHtcbiAgICAgIHRoaXMuZWx0cyA9ICQoXCI8ZGl2PlwiKS5hZGRDbGFzcyhcImNob2ljZUNvbnRhaW5lclwiKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5zdHlsZSA9PT0gXCJjb3B5VGV4dFwiKSB7XG4gICAgICB0aGlzLmVsdHMgPSAkKFwiPGRpdj5cIikuYWRkQ2xhc3MoXCJjaG9pY2VDb250YWluZXJcIik7XG4gICAgfSBlbHNlIGlmICh0aGlzLm9wdGlvbnMuc3R5bGUgPT09IFwiY29uZmlybVwiKSB7XG4gICAgICB0aGlzLmVsdHMgPSAkKFwiPGRpdj5cIikuYWRkQ2xhc3MoXCJjaG9pY2VDb250YWluZXJcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZWx0cyA9ICQoJC5wYXJzZUhUTUwoXCI8ZGl2PjwvZGl2PlwiKSkuYWRkQ2xhc3MoXCJjaG9pY2VDb250YWluZXJcIik7XG4gICAgfVxuICAgIHRoaXMudGl0bGUgPSAkKFwiLm1vZGFsLWhlYWRlciA+IGgzXCIsIHRoaXMubW9kYWwpO1xuICAgIHRoaXMubW9kYWxDb250ZW50ID0gJChcIi5tb2RhbC1jb250ZW50XCIsIHRoaXMubW9kYWwpO1xuICAgIHRoaXMuY2xvc2VCdXR0b24gPSAkKFwiLmNsb3NlXCIsIHRoaXMubW9kYWwpO1xuICAgIHRoaXMuc3VibWl0QnV0dG9uID0gJChcIi5zdWJtaXRcIiwgdGhpcy5tb2RhbCk7XG4gICAgaWYodGhpcy5vcHRpb25zLnN1Ym1pdFRleHQpIHtcbiAgICAgIHRoaXMuc3VibWl0QnV0dG9uLnRleHQodGhpcy5vcHRpb25zLnN1Ym1pdFRleHQpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuc3VibWl0QnV0dG9uLnRleHQoXCJTdWJtaXRcIik7XG4gICAgfVxuICAgIGlmKHRoaXMub3B0aW9ucy5jYW5jZWxUZXh0KSB7XG4gICAgICB0aGlzLmNsb3NlQnV0dG9uLnRleHQodGhpcy5vcHRpb25zLmNhbmNlbFRleHQpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuY2xvc2VCdXR0b24udGV4dChcIkNhbmNlbFwiKTtcbiAgICB9XG4gICAgdGhpcy5tb2RhbENvbnRlbnQudG9nZ2xlQ2xhc3MoXCJuYXJyb3dcIiwgISF0aGlzLm9wdGlvbnMubmFycm93KTtcblxuICAgIHRoaXMuaXNDb21waWxlZCA9IGZhbHNlO1xuICAgIHRoaXMuZGVmZXJyZWQgPSBRLmRlZmVyKCk7XG4gICAgdGhpcy5wcm9taXNlID0gdGhpcy5kZWZlcnJlZC5wcm9taXNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFR5cGUgZm9yIGhhbmRsZXJzIG9mIHJlc3BvbnNlcyBmcm9tIG1vZGFsIHByb21wdHNcbiAgICogQGNhbGxiYWNrIHByb21wdENhbGxiYWNrXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZXNwIC0gVGhlIHJlc3BvbnNlIGZyb20gdGhlIHVzZXJcbiAgICovXG5cbiAgLyoqXG4gICAqIFNob3dzIHRoaXMgcHJvbXB0IHRvIHRoZSB1c2VyICh3aWxsIHdhaXQgdW50aWwgYW55IGFjdGl2ZVxuICAgKiBwcm9tcHRzIGhhdmUgZmluaXNoZWQpXG4gICAqIEBwYXJhbSB7cHJvbXB0Q2FsbGJhY2t9IFtjYWxsYmFja10gLSBPcHRpb25hbCBjYWxsYmFjayB3aGljaCBpcyBwYXNzZWQgdGhlXG4gICAqICAgICAgICByZXN1bHQgb2YgdGhlIHByb21wdFxuICAgKiBAcmV0dXJucyBBIHByb21pc2UgcmVzb2x2aW5nIHRvIGVpdGhlciB0aGUgcmVzdWx0IG9mIGBjYWxsYmFja2AsIGlmIHByb3ZpZGVkLFxuICAgKiAgICAgICAgICBvciB0aGUgcmVzdWx0IG9mIHRoZSBwcm9tcHQsIG90aGVyd2lzZS5cbiAgICovXG4gIFByb21wdC5wcm90b3R5cGUuc2hvdyA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgLy8gVXNlIHRoZSBwcm9taXNlIHF1ZXVlIHRvIG1ha2Ugc3VyZSB0aGVyZSdzIG5vIG90aGVyXG4gICAgLy8gcHJvbXB0IGJlaW5nIHNob3duIGN1cnJlbnRseVxuICAgIGlmICh0aGlzLm9wdGlvbnMuaGlkZVN1Ym1pdCkge1xuICAgICAgdGhpcy5zdWJtaXRCdXR0b24uaGlkZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnN1Ym1pdEJ1dHRvbi5zaG93KCk7XG4gICAgfVxuICAgIHRoaXMuY2xvc2VCdXR0b24uY2xpY2sodGhpcy5vbkNsb3NlLmJpbmQodGhpcykpO1xuICAgIHRoaXMubW9kYWwua2V5cHJlc3MoZnVuY3Rpb24oZSkge1xuICAgICAgaWYoZS53aGljaCA9PSAxMykge1xuICAgICAgICB0aGlzLnN1Ym1pdEJ1dHRvbi5jbGljaygpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLnN1Ym1pdEJ1dHRvbi5jbGljayh0aGlzLm9uU3VibWl0LmJpbmQodGhpcykpO1xuICAgIHZhciBkb2NDbGljayA9IChmdW5jdGlvbihlKSB7XG4gICAgICAvLyBJZiB0aGUgcHJvbXB0IGlzIGFjdGl2ZSBhbmQgdGhlIGJhY2tncm91bmQgaXMgY2xpY2tlZCxcbiAgICAgIC8vIHRoZW4gY2xvc2UuXG4gICAgICBpZiAoJChlLnRhcmdldCkuaXModGhpcy5tb2RhbCkgJiYgdGhpcy5kZWZlcnJlZCkge1xuICAgICAgICB0aGlzLm9uQ2xvc2UoZSk7XG4gICAgICAgICQoZG9jdW1lbnQpLm9mZihcImNsaWNrXCIsIGRvY0NsaWNrKTtcbiAgICAgIH1cbiAgICB9KS5iaW5kKHRoaXMpO1xuICAgICQoZG9jdW1lbnQpLmNsaWNrKGRvY0NsaWNrKTtcbiAgICB2YXIgZG9jS2V5ZG93biA9IChmdW5jdGlvbihlKSB7XG4gICAgICBpZiAoZS5rZXkgPT09IFwiRXNjYXBlXCIpIHtcbiAgICAgICAgdGhpcy5vbkNsb3NlKGUpO1xuICAgICAgICAkKGRvY3VtZW50KS5vZmYoXCJrZXlkb3duXCIsIGRvY0tleWRvd24pO1xuICAgICAgfVxuICAgIH0pLmJpbmQodGhpcyk7XG4gICAgJChkb2N1bWVudCkua2V5ZG93bihkb2NLZXlkb3duKTtcbiAgICB0aGlzLnRpdGxlLnRleHQodGhpcy5vcHRpb25zLnRpdGxlKTtcbiAgICB0aGlzLnBvcHVsYXRlTW9kYWwoKTtcbiAgICB0aGlzLm1vZGFsLmNzcygnZGlzcGxheScsICdibG9jaycpO1xuICAgICQoXCI6aW5wdXQ6ZW5hYmxlZDp2aXNpYmxlOmZpcnN0XCIsIHRoaXMubW9kYWwpLmZvY3VzKCkuc2VsZWN0KClcblxuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgcmV0dXJuIHRoaXMucHJvbWlzZS50aGVuKGNhbGxiYWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMucHJvbWlzZTtcbiAgICB9XG4gIH07XG5cblxuICAvKipcbiAgICogQ2xlYXJzIHRoZSBjb250ZW50cyBvZiB0aGUgbW9kYWwgcHJvbXB0LlxuICAgKi9cbiAgUHJvbXB0LnByb3RvdHlwZS5jbGVhck1vZGFsID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5zdWJtaXRCdXR0b24ub2ZmKCk7XG4gICAgdGhpcy5jbG9zZUJ1dHRvbi5vZmYoKTtcbiAgICB0aGlzLmVsdHMuZW1wdHkoKTtcbiAgfTtcbiAgXG4gIC8qKlxuICAgKiBQb3B1bGF0ZXMgdGhlIGNvbnRlbnRzIG9mIHRoZSBtb2RhbCBwcm9tcHQgd2l0aCB0aGVcbiAgICogb3B0aW9ucyBpbiB0aGlzIHByb21wdC5cbiAgICovXG4gIFByb21wdC5wcm90b3R5cGUucG9wdWxhdGVNb2RhbCA9IGZ1bmN0aW9uKCkge1xuICAgIGZ1bmN0aW9uIGNyZWF0ZVJhZGlvRWx0KG9wdGlvbiwgaWR4KSB7XG4gICAgICB2YXIgZWx0ID0gJCgkLnBhcnNlSFRNTChcIjxpbnB1dCBuYW1lPVxcXCJweXJldC1tb2RhbFxcXCIgdHlwZT1cXFwicmFkaW9cXFwiPlwiKSk7XG4gICAgICB2YXIgaWQgPSBcInJcIiArIGlkeC50b1N0cmluZygpO1xuICAgICAgdmFyIGxhYmVsID0gJCgkLnBhcnNlSFRNTChcIjxsYWJlbCBmb3I9XFxcIlwiICsgaWQgKyBcIlxcXCI+PC9sYWJlbD5cIikpO1xuICAgICAgZWx0LmF0dHIoXCJpZFwiLCBpZCk7XG4gICAgICBlbHQuYXR0cihcInZhbHVlXCIsIG9wdGlvbi52YWx1ZSk7XG4gICAgICBsYWJlbC50ZXh0KG9wdGlvbi5tZXNzYWdlKTtcbiAgICAgIHZhciBlbHRDb250YWluZXIgPSAkKCQucGFyc2VIVE1MKFwiPHRkIGNsYXNzPVxcXCJweXJldC1tb2RhbC1vcHRpb24tcmFkaW9cXFwiPjwvdGQ+XCIpKTtcbiAgICAgIGVsdENvbnRhaW5lci5hcHBlbmQoZWx0KTtcbiAgICAgIHZhciBsYWJlbENvbnRhaW5lciA9ICQoJC5wYXJzZUhUTUwoXCI8dGQgY2xhc3M9XFxcInB5cmV0LW1vZGFsLW9wdGlvbi1tZXNzYWdlXFxcIj48L3RkPlwiKSk7XG4gICAgICBsYWJlbENvbnRhaW5lci5hcHBlbmQobGFiZWwpO1xuICAgICAgdmFyIGNvbnRhaW5lciA9ICQoJC5wYXJzZUhUTUwoXCI8dHIgY2xhc3M9XFxcInB5cmV0LW1vZGFsLW9wdGlvblxcXCI+PC90cj5cIikpO1xuICAgICAgY29udGFpbmVyLmFwcGVuZChlbHRDb250YWluZXIpO1xuICAgICAgY29udGFpbmVyLmFwcGVuZChsYWJlbENvbnRhaW5lcik7XG4gICAgICBpZiAob3B0aW9uLmV4YW1wbGUpIHtcbiAgICAgICAgdmFyIGV4YW1wbGUgPSAkKCQucGFyc2VIVE1MKFwiPGRpdj48L2Rpdj5cIikpO1xuICAgICAgICB2YXIgY20gPSBDb2RlTWlycm9yKGV4YW1wbGVbMF0sIHtcbiAgICAgICAgICB2YWx1ZTogb3B0aW9uLmV4YW1wbGUsXG4gICAgICAgICAgbW9kZTogJ3B5cmV0JyxcbiAgICAgICAgICBsaW5lTnVtYmVyczogZmFsc2UsXG4gICAgICAgICAgcmVhZE9ubHk6IFwibm9jdXJzb3JcIiAvLyB0aGlzIG1ha2VzIGl0IHJlYWRPbmx5ICYgbm90IGZvY3VzYWJsZSBhcyBhIGZvcm0gaW5wdXRcbiAgICAgICAgfSk7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICBjbS5yZWZyZXNoKCk7XG4gICAgICAgIH0sIDEpO1xuICAgICAgICB2YXIgZXhhbXBsZUNvbnRhaW5lciA9ICQoJC5wYXJzZUhUTUwoXCI8dGQgY2xhc3M9XFxcInB5cmV0LW1vZGFsLW9wdGlvbi1leGFtcGxlXFxcIj48L3RkPlwiKSk7XG4gICAgICAgIGV4YW1wbGVDb250YWluZXIuYXBwZW5kKGV4YW1wbGUpO1xuICAgICAgICBjb250YWluZXIuYXBwZW5kKGV4YW1wbGVDb250YWluZXIpO1xuICAgICAgfVxuICAgICAgXG4gICAgICByZXR1cm4gY29udGFpbmVyO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjcmVhdGVUaWxlRWx0KG9wdGlvbiwgaWR4KSB7XG4gICAgICB2YXIgZWx0ID0gJCgkLnBhcnNlSFRNTChcIjxidXR0b24gbmFtZT1cXFwicHlyZXQtbW9kYWxcXFwiIGNsYXNzPVxcXCJ0aWxlXFxcIj48L2J1dHRvbj5cIikpO1xuICAgICAgZWx0LmF0dHIoXCJpZFwiLCBcInRcIiArIGlkeC50b1N0cmluZygpKTtcbiAgICAgIGVsdC5hcHBlbmQoJChcIjxiPlwiKS50ZXh0KG9wdGlvbi5tZXNzYWdlKSlcbiAgICAgICAgLmFwcGVuZCgkKFwiPHA+XCIpLnRleHQob3B0aW9uLmRldGFpbHMpKTtcbiAgICAgIGZvciAodmFyIGV2dCBpbiBvcHRpb24ub24pXG4gICAgICAgIGVsdC5vbihldnQsIG9wdGlvbi5vbltldnRdKTtcbiAgICAgIHJldHVybiBlbHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlVGV4dEVsdChvcHRpb24pIHtcbiAgICAgIHZhciBlbHQgPSAkKFwiPGRpdiBjbGFzcz1cXFwicHlyZXQtbW9kYWwtdGV4dFxcXCI+XCIpO1xuICAgICAgY29uc3QgaW5wdXQgPSAkKFwiPGlucHV0IGlkPSdtb2RhbC1wcm9tcHQtdGV4dCcgdHlwZT0ndGV4dCc+XCIpLnZhbChvcHRpb24uZGVmYXVsdFZhbHVlKTtcbiAgICAgIGlmKG9wdGlvbi5kcmF3RWxlbWVudCkge1xuICAgICAgICBlbHQuYXBwZW5kKG9wdGlvbi5kcmF3RWxlbWVudChpbnB1dCkpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGVsdC5hcHBlbmQoJChcIjxsYWJlbCBmb3I9J21vZGFsLXByb21wdC10ZXh0Jz5cIikuYWRkQ2xhc3MoXCJ0ZXh0TGFiZWxcIikudGV4dChvcHRpb24ubWVzc2FnZSkpO1xuICAgICAgICBlbHQuYXBwZW5kKGlucHV0KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlQ29weVRleHRFbHQob3B0aW9uKSB7XG4gICAgICB2YXIgZWx0ID0gJChcIjxkaXY+XCIpO1xuICAgICAgZWx0LmFwcGVuZCgkKFwiPHA+XCIpLmFkZENsYXNzKFwidGV4dExhYmVsXCIpLnRleHQob3B0aW9uLm1lc3NhZ2UpKTtcbiAgICAgIGlmKG9wdGlvbi50ZXh0KSB7XG4gICAgICAgIHZhciBib3ggPSBhdXRvSGlnaGxpZ2h0Qm94KG9wdGlvbi50ZXh0KTtcbiAgLy8gICAgICBlbHQuYXBwZW5kKCQoXCI8c3Bhbj5cIikudGV4dChcIihcIiArIG9wdGlvbi5kZXRhaWxzICsgXCIpXCIpKTtcbiAgICAgICAgZWx0LmFwcGVuZChib3gpO1xuICAgICAgICBib3guZm9jdXMoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbHQ7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY3JlYXRlQ29uZmlybUVsdChvcHRpb24pIHtcbiAgICAgIHJldHVybiAkKFwiPHA+XCIpLnRleHQob3B0aW9uLm1lc3NhZ2UpO1xuICAgIH1cblxuICAgIHZhciB0aGF0ID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGNyZWF0ZUVsdChvcHRpb24sIGkpIHtcbiAgICAgIGlmKHRoYXQub3B0aW9ucy5zdHlsZSA9PT0gXCJyYWRpb1wiKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVSYWRpb0VsdChvcHRpb24sIGkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZih0aGF0Lm9wdGlvbnMuc3R5bGUgPT09IFwidGlsZXNcIikge1xuICAgICAgICByZXR1cm4gY3JlYXRlVGlsZUVsdChvcHRpb24sIGkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZih0aGF0Lm9wdGlvbnMuc3R5bGUgPT09IFwidGV4dFwiKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVUZXh0RWx0KG9wdGlvbik7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKHRoYXQub3B0aW9ucy5zdHlsZSA9PT0gXCJjb3B5VGV4dFwiKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVDb3B5VGV4dEVsdChvcHRpb24pO1xuICAgICAgfVxuICAgICAgZWxzZSBpZih0aGF0Lm9wdGlvbnMuc3R5bGUgPT09IFwiY29uZmlybVwiKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVDb25maXJtRWx0KG9wdGlvbik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdmFyIG9wdGlvbkVsdHM7XG4gICAgLy8gQ2FjaGUgcmVzdWx0c1xuLy8gICAgaWYgKHRydWUpIHtcbiAgICAgIG9wdGlvbkVsdHMgPSB0aGlzLm9wdGlvbnMub3B0aW9ucy5tYXAoY3JlYXRlRWx0KTtcbi8vICAgICAgdGhpcy5jb21waWxlZEVsdHMgPSBvcHRpb25FbHRzO1xuLy8gICAgICB0aGlzLmlzQ29tcGlsZWQgPSB0cnVlO1xuLy8gICAgfSBlbHNlIHtcbi8vICAgICAgb3B0aW9uRWx0cyA9IHRoaXMuY29tcGlsZWRFbHRzO1xuLy8gICAgfVxuICAgICQoXCJpbnB1dFt0eXBlPSdyYWRpbyddXCIsIG9wdGlvbkVsdHNbMF0pLmF0dHIoJ2NoZWNrZWQnLCB0cnVlKTtcbiAgICB0aGlzLmVsdHMuYXBwZW5kKG9wdGlvbkVsdHMpO1xuICAgICQoXCIubW9kYWwtYm9keVwiLCB0aGlzLm1vZGFsKS5lbXB0eSgpLmFwcGVuZCh0aGlzLmVsdHMpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBIYW5kbGVyIHdoaWNoIGlzIGNhbGxlZCB3aGVuIHRoZSB1c2VyIGRvZXMgbm90IHNlbGVjdCBhbnl0aGluZ1xuICAgKi9cbiAgUHJvbXB0LnByb3RvdHlwZS5vbkNsb3NlID0gZnVuY3Rpb24oZSkge1xuICAgIHRoaXMubW9kYWwuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICB0aGlzLmNsZWFyTW9kYWwoKTtcbiAgICB0aGlzLmRlZmVycmVkLnJlc29sdmUobnVsbCk7XG4gICAgZGVsZXRlIHRoaXMuZGVmZXJyZWQ7XG4gICAgZGVsZXRlIHRoaXMucHJvbWlzZTtcbiAgfTtcblxuICAvKipcbiAgICogSGFuZGxlciB3aGljaCBpcyBjYWxsZWQgd2hlbiB0aGUgdXNlciBwcmVzc2VzIFwic3VibWl0XCJcbiAgICovXG4gIFByb21wdC5wcm90b3R5cGUub25TdWJtaXQgPSBmdW5jdGlvbihlKSB7XG4gICAgaWYodGhpcy5vcHRpb25zLnN0eWxlID09PSBcInJhZGlvXCIpIHtcbiAgICAgIHZhciByZXR2YWwgPSAkKFwiaW5wdXRbdHlwZT0ncmFkaW8nXTpjaGVja2VkXCIsIHRoaXMubW9kYWwpLnZhbCgpO1xuICAgIH1cbiAgICBlbHNlIGlmKHRoaXMub3B0aW9ucy5zdHlsZSA9PT0gXCJ0ZXh0XCIpIHtcbiAgICAgIHZhciByZXR2YWwgPSAkKFwiaW5wdXRbdHlwZT0ndGV4dCddXCIsIHRoaXMubW9kYWwpLnZhbCgpO1xuICAgIH1cbiAgICBlbHNlIGlmKHRoaXMub3B0aW9ucy5zdHlsZSA9PT0gXCJjb3B5VGV4dFwiKSB7XG4gICAgICB2YXIgcmV0dmFsID0gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSBpZih0aGlzLm9wdGlvbnMuc3R5bGUgPT09IFwiY29uZmlybVwiKSB7XG4gICAgICB2YXIgcmV0dmFsID0gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB2YXIgcmV0dmFsID0gdHJ1ZTsgLy8gSnVzdCByZXR1cm4gdHJ1ZSBpZiB0aGV5IGNsaWNrZWQgc3VibWl0XG4gICAgfVxuICAgIHRoaXMubW9kYWwuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICB0aGlzLmNsZWFyTW9kYWwoKTtcbiAgICB0aGlzLmRlZmVycmVkLnJlc29sdmUocmV0dmFsKTtcbiAgICBkZWxldGUgdGhpcy5kZWZlcnJlZDtcbiAgICBkZWxldGUgdGhpcy5wcm9taXNlO1xuICB9O1xuXG4gIHJldHVybiBQcm9tcHQ7XG5cbn0pO1xuXG4iLCIvLyB2aW06dHM9NDpzdHM9NDpzdz00OlxuLyohXG4gKlxuICogQ29weXJpZ2h0IDIwMDktMjAxMiBLcmlzIEtvd2FsIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgTUlUXG4gKiBsaWNlbnNlIGZvdW5kIGF0IGh0dHA6Ly9naXRodWIuY29tL2tyaXNrb3dhbC9xL3Jhdy9tYXN0ZXIvTElDRU5TRVxuICpcbiAqIFdpdGggcGFydHMgYnkgVHlsZXIgQ2xvc2VcbiAqIENvcHlyaWdodCAyMDA3LTIwMDkgVHlsZXIgQ2xvc2UgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBNSVQgWCBsaWNlbnNlIGZvdW5kXG4gKiBhdCBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLmh0bWxcbiAqIEZvcmtlZCBhdCByZWZfc2VuZC5qcyB2ZXJzaW9uOiAyMDA5LTA1LTExXG4gKlxuICogV2l0aCBwYXJ0cyBieSBNYXJrIE1pbGxlclxuICogQ29weXJpZ2h0IChDKSAyMDExIEdvb2dsZSBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKlxuICovXG5cbihmdW5jdGlvbiAoZGVmaW5pdGlvbikge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgLy8gVGhpcyBmaWxlIHdpbGwgZnVuY3Rpb24gcHJvcGVybHkgYXMgYSA8c2NyaXB0PiB0YWcsIG9yIGEgbW9kdWxlXG4gICAgLy8gdXNpbmcgQ29tbW9uSlMgYW5kIE5vZGVKUyBvciBSZXF1aXJlSlMgbW9kdWxlIGZvcm1hdHMuICBJblxuICAgIC8vIENvbW1vbi9Ob2RlL1JlcXVpcmVKUywgdGhlIG1vZHVsZSBleHBvcnRzIHRoZSBRIEFQSSBhbmQgd2hlblxuICAgIC8vIGV4ZWN1dGVkIGFzIGEgc2ltcGxlIDxzY3JpcHQ+LCBpdCBjcmVhdGVzIGEgUSBnbG9iYWwgaW5zdGVhZC5cblxuICAgIC8vIE1vbnRhZ2UgUmVxdWlyZVxuICAgIGlmICh0eXBlb2YgYm9vdHN0cmFwID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgYm9vdHN0cmFwKFwicHJvbWlzZVwiLCBkZWZpbml0aW9uKTtcblxuICAgIC8vIENvbW1vbkpTXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgbW9kdWxlID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gZGVmaW5pdGlvbigpO1xuXG4gICAgLy8gUmVxdWlyZUpTXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoZGVmaW5pdGlvbik7XG5cbiAgICAvLyBTRVMgKFNlY3VyZSBFY21hU2NyaXB0KVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNlcyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpZiAoIXNlcy5vaygpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZXMubWFrZVEgPSBkZWZpbml0aW9uO1xuICAgICAgICB9XG5cbiAgICAvLyA8c2NyaXB0PlxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiB8fCB0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAvLyBQcmVmZXIgd2luZG93IG92ZXIgc2VsZiBmb3IgYWRkLW9uIHNjcmlwdHMuIFVzZSBzZWxmIGZvclxuICAgICAgICAvLyBub24td2luZG93ZWQgY29udGV4dHMuXG4gICAgICAgIHZhciBnbG9iYWwgPSB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDogc2VsZjtcblxuICAgICAgICAvLyBHZXQgdGhlIGB3aW5kb3dgIG9iamVjdCwgc2F2ZSB0aGUgcHJldmlvdXMgUSBnbG9iYWxcbiAgICAgICAgLy8gYW5kIGluaXRpYWxpemUgUSBhcyBhIGdsb2JhbC5cbiAgICAgICAgdmFyIHByZXZpb3VzUSA9IGdsb2JhbC5RO1xuICAgICAgICBnbG9iYWwuUSA9IGRlZmluaXRpb24oKTtcblxuICAgICAgICAvLyBBZGQgYSBub0NvbmZsaWN0IGZ1bmN0aW9uIHNvIFEgY2FuIGJlIHJlbW92ZWQgZnJvbSB0aGVcbiAgICAgICAgLy8gZ2xvYmFsIG5hbWVzcGFjZS5cbiAgICAgICAgZ2xvYmFsLlEubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGdsb2JhbC5RID0gcHJldmlvdXNRO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH07XG5cbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGlzIGVudmlyb25tZW50IHdhcyBub3QgYW50aWNpcGF0ZWQgYnkgUS4gUGxlYXNlIGZpbGUgYSBidWcuXCIpO1xuICAgIH1cblxufSkoZnVuY3Rpb24gKCkge1xuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBoYXNTdGFja3MgPSBmYWxzZTtcbnRyeSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCk7XG59IGNhdGNoIChlKSB7XG4gICAgaGFzU3RhY2tzID0gISFlLnN0YWNrO1xufVxuXG4vLyBBbGwgY29kZSBhZnRlciB0aGlzIHBvaW50IHdpbGwgYmUgZmlsdGVyZWQgZnJvbSBzdGFjayB0cmFjZXMgcmVwb3J0ZWRcbi8vIGJ5IFEuXG52YXIgcVN0YXJ0aW5nTGluZSA9IGNhcHR1cmVMaW5lKCk7XG52YXIgcUZpbGVOYW1lO1xuXG4vLyBzaGltc1xuXG4vLyB1c2VkIGZvciBmYWxsYmFjayBpbiBcImFsbFJlc29sdmVkXCJcbnZhciBub29wID0gZnVuY3Rpb24gKCkge307XG5cbi8vIFVzZSB0aGUgZmFzdGVzdCBwb3NzaWJsZSBtZWFucyB0byBleGVjdXRlIGEgdGFzayBpbiBhIGZ1dHVyZSB0dXJuXG4vLyBvZiB0aGUgZXZlbnQgbG9vcC5cbnZhciBuZXh0VGljayA9KGZ1bmN0aW9uICgpIHtcbiAgICAvLyBsaW5rZWQgbGlzdCBvZiB0YXNrcyAoc2luZ2xlLCB3aXRoIGhlYWQgbm9kZSlcbiAgICB2YXIgaGVhZCA9IHt0YXNrOiB2b2lkIDAsIG5leHQ6IG51bGx9O1xuICAgIHZhciB0YWlsID0gaGVhZDtcbiAgICB2YXIgZmx1c2hpbmcgPSBmYWxzZTtcbiAgICB2YXIgcmVxdWVzdFRpY2sgPSB2b2lkIDA7XG4gICAgdmFyIGlzTm9kZUpTID0gZmFsc2U7XG4gICAgLy8gcXVldWUgZm9yIGxhdGUgdGFza3MsIHVzZWQgYnkgdW5oYW5kbGVkIHJlamVjdGlvbiB0cmFja2luZ1xuICAgIHZhciBsYXRlclF1ZXVlID0gW107XG5cbiAgICBmdW5jdGlvbiBmbHVzaCgpIHtcbiAgICAgICAgLyoganNoaW50IGxvb3BmdW5jOiB0cnVlICovXG4gICAgICAgIHZhciB0YXNrLCBkb21haW47XG5cbiAgICAgICAgd2hpbGUgKGhlYWQubmV4dCkge1xuICAgICAgICAgICAgaGVhZCA9IGhlYWQubmV4dDtcbiAgICAgICAgICAgIHRhc2sgPSBoZWFkLnRhc2s7XG4gICAgICAgICAgICBoZWFkLnRhc2sgPSB2b2lkIDA7XG4gICAgICAgICAgICBkb21haW4gPSBoZWFkLmRvbWFpbjtcblxuICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgIGhlYWQuZG9tYWluID0gdm9pZCAwO1xuICAgICAgICAgICAgICAgIGRvbWFpbi5lbnRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcnVuU2luZ2xlKHRhc2ssIGRvbWFpbik7XG5cbiAgICAgICAgfVxuICAgICAgICB3aGlsZSAobGF0ZXJRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRhc2sgPSBsYXRlclF1ZXVlLnBvcCgpO1xuICAgICAgICAgICAgcnVuU2luZ2xlKHRhc2spO1xuICAgICAgICB9XG4gICAgICAgIGZsdXNoaW5nID0gZmFsc2U7XG4gICAgfVxuICAgIC8vIHJ1bnMgYSBzaW5nbGUgZnVuY3Rpb24gaW4gdGhlIGFzeW5jIHF1ZXVlXG4gICAgZnVuY3Rpb24gcnVuU2luZ2xlKHRhc2ssIGRvbWFpbikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGFzaygpO1xuXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChpc05vZGVKUykge1xuICAgICAgICAgICAgICAgIC8vIEluIG5vZGUsIHVuY2F1Z2h0IGV4Y2VwdGlvbnMgYXJlIGNvbnNpZGVyZWQgZmF0YWwgZXJyb3JzLlxuICAgICAgICAgICAgICAgIC8vIFJlLXRocm93IHRoZW0gc3luY2hyb25vdXNseSB0byBpbnRlcnJ1cHQgZmx1c2hpbmchXG5cbiAgICAgICAgICAgICAgICAvLyBFbnN1cmUgY29udGludWF0aW9uIGlmIHRoZSB1bmNhdWdodCBleGNlcHRpb24gaXMgc3VwcHJlc3NlZFxuICAgICAgICAgICAgICAgIC8vIGxpc3RlbmluZyBcInVuY2F1Z2h0RXhjZXB0aW9uXCIgZXZlbnRzIChhcyBkb21haW5zIGRvZXMpLlxuICAgICAgICAgICAgICAgIC8vIENvbnRpbnVlIGluIG5leHQgZXZlbnQgdG8gYXZvaWQgdGljayByZWN1cnNpb24uXG4gICAgICAgICAgICAgICAgaWYgKGRvbWFpbikge1xuICAgICAgICAgICAgICAgICAgICBkb21haW4uZXhpdCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvbWFpbi5lbnRlcigpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRocm93IGU7XG5cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gSW4gYnJvd3NlcnMsIHVuY2F1Z2h0IGV4Y2VwdGlvbnMgYXJlIG5vdCBmYXRhbC5cbiAgICAgICAgICAgICAgICAvLyBSZS10aHJvdyB0aGVtIGFzeW5jaHJvbm91c2x5IHRvIGF2b2lkIHNsb3ctZG93bnMuXG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IGU7XG4gICAgICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICBkb21haW4uZXhpdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbmV4dFRpY2sgPSBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICB0YWlsID0gdGFpbC5uZXh0ID0ge1xuICAgICAgICAgICAgdGFzazogdGFzayxcbiAgICAgICAgICAgIGRvbWFpbjogaXNOb2RlSlMgJiYgcHJvY2Vzcy5kb21haW4sXG4gICAgICAgICAgICBuZXh0OiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKCFmbHVzaGluZykge1xuICAgICAgICAgICAgZmx1c2hpbmcgPSB0cnVlO1xuICAgICAgICAgICAgcmVxdWVzdFRpY2soKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgcHJvY2Vzcy50b1N0cmluZygpID09PSBcIltvYmplY3QgcHJvY2Vzc11cIiAmJiBwcm9jZXNzLm5leHRUaWNrKSB7XG4gICAgICAgIC8vIEVuc3VyZSBRIGlzIGluIGEgcmVhbCBOb2RlIGVudmlyb25tZW50LCB3aXRoIGEgYHByb2Nlc3MubmV4dFRpY2tgLlxuICAgICAgICAvLyBUbyBzZWUgdGhyb3VnaCBmYWtlIE5vZGUgZW52aXJvbm1lbnRzOlxuICAgICAgICAvLyAqIE1vY2hhIHRlc3QgcnVubmVyIC0gZXhwb3NlcyBhIGBwcm9jZXNzYCBnbG9iYWwgd2l0aG91dCBhIGBuZXh0VGlja2BcbiAgICAgICAgLy8gKiBCcm93c2VyaWZ5IC0gZXhwb3NlcyBhIGBwcm9jZXNzLm5leFRpY2tgIGZ1bmN0aW9uIHRoYXQgdXNlc1xuICAgICAgICAvLyAgIGBzZXRUaW1lb3V0YC4gSW4gdGhpcyBjYXNlIGBzZXRJbW1lZGlhdGVgIGlzIHByZWZlcnJlZCBiZWNhdXNlXG4gICAgICAgIC8vICAgIGl0IGlzIGZhc3Rlci4gQnJvd3NlcmlmeSdzIGBwcm9jZXNzLnRvU3RyaW5nKClgIHlpZWxkc1xuICAgICAgICAvLyAgIFwiW29iamVjdCBPYmplY3RdXCIsIHdoaWxlIGluIGEgcmVhbCBOb2RlIGVudmlyb25tZW50XG4gICAgICAgIC8vICAgYHByb2Nlc3MubmV4dFRpY2soKWAgeWllbGRzIFwiW29iamVjdCBwcm9jZXNzXVwiLlxuICAgICAgICBpc05vZGVKUyA9IHRydWU7XG5cbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBwcm9jZXNzLm5leHRUaWNrKGZsdXNoKTtcbiAgICAgICAgfTtcblxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIC8vIEluIElFMTAsIE5vZGUuanMgMC45Kywgb3IgaHR0cHM6Ly9naXRodWIuY29tL05vYmxlSlMvc2V0SW1tZWRpYXRlXG4gICAgICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IHNldEltbWVkaWF0ZS5iaW5kKHdpbmRvdywgZmx1c2gpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgc2V0SW1tZWRpYXRlKGZsdXNoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAodHlwZW9mIE1lc3NhZ2VDaGFubmVsICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIG1vZGVybiBicm93c2Vyc1xuICAgICAgICAvLyBodHRwOi8vd3d3Lm5vbmJsb2NraW5nLmlvLzIwMTEvMDYvd2luZG93bmV4dHRpY2suaHRtbFxuICAgICAgICB2YXIgY2hhbm5lbCA9IG5ldyBNZXNzYWdlQ2hhbm5lbCgpO1xuICAgICAgICAvLyBBdCBsZWFzdCBTYWZhcmkgVmVyc2lvbiA2LjAuNSAoODUzNi4zMC4xKSBpbnRlcm1pdHRlbnRseSBjYW5ub3QgY3JlYXRlXG4gICAgICAgIC8vIHdvcmtpbmcgbWVzc2FnZSBwb3J0cyB0aGUgZmlyc3QgdGltZSBhIHBhZ2UgbG9hZHMuXG4gICAgICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmVxdWVzdFRpY2sgPSByZXF1ZXN0UG9ydFRpY2s7XG4gICAgICAgICAgICBjaGFubmVsLnBvcnQxLm9ubWVzc2FnZSA9IGZsdXNoO1xuICAgICAgICAgICAgZmx1c2goKTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHJlcXVlc3RQb3J0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIE9wZXJhIHJlcXVpcmVzIHVzIHRvIHByb3ZpZGUgYSBtZXNzYWdlIHBheWxvYWQsIHJlZ2FyZGxlc3Mgb2ZcbiAgICAgICAgICAgIC8vIHdoZXRoZXIgd2UgdXNlIGl0LlxuICAgICAgICAgICAgY2hhbm5lbC5wb3J0Mi5wb3N0TWVzc2FnZSgwKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgICAgIHJlcXVlc3RQb3J0VGljaygpO1xuICAgICAgICB9O1xuXG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gb2xkIGJyb3dzZXJzXG4gICAgICAgIHJlcXVlc3RUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2V0VGltZW91dChmbHVzaCwgMCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIC8vIHJ1bnMgYSB0YXNrIGFmdGVyIGFsbCBvdGhlciB0YXNrcyBoYXZlIGJlZW4gcnVuXG4gICAgLy8gdGhpcyBpcyB1c2VmdWwgZm9yIHVuaGFuZGxlZCByZWplY3Rpb24gdHJhY2tpbmcgdGhhdCBuZWVkcyB0byBoYXBwZW5cbiAgICAvLyBhZnRlciBhbGwgYHRoZW5gZCB0YXNrcyBoYXZlIGJlZW4gcnVuLlxuICAgIG5leHRUaWNrLnJ1bkFmdGVyID0gZnVuY3Rpb24gKHRhc2spIHtcbiAgICAgICAgbGF0ZXJRdWV1ZS5wdXNoKHRhc2spO1xuICAgICAgICBpZiAoIWZsdXNoaW5nKSB7XG4gICAgICAgICAgICBmbHVzaGluZyA9IHRydWU7XG4gICAgICAgICAgICByZXF1ZXN0VGljaygpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gbmV4dFRpY2s7XG59KSgpO1xuXG4vLyBBdHRlbXB0IHRvIG1ha2UgZ2VuZXJpY3Mgc2FmZSBpbiB0aGUgZmFjZSBvZiBkb3duc3RyZWFtXG4vLyBtb2RpZmljYXRpb25zLlxuLy8gVGhlcmUgaXMgbm8gc2l0dWF0aW9uIHdoZXJlIHRoaXMgaXMgbmVjZXNzYXJ5LlxuLy8gSWYgeW91IG5lZWQgYSBzZWN1cml0eSBndWFyYW50ZWUsIHRoZXNlIHByaW1vcmRpYWxzIG5lZWQgdG8gYmVcbi8vIGRlZXBseSBmcm96ZW4gYW55d2F5LCBhbmQgaWYgeW91IGRvbuKAmXQgbmVlZCBhIHNlY3VyaXR5IGd1YXJhbnRlZSxcbi8vIHRoaXMgaXMganVzdCBwbGFpbiBwYXJhbm9pZC5cbi8vIEhvd2V2ZXIsIHRoaXMgKiptaWdodCoqIGhhdmUgdGhlIG5pY2Ugc2lkZS1lZmZlY3Qgb2YgcmVkdWNpbmcgdGhlIHNpemUgb2Zcbi8vIHRoZSBtaW5pZmllZCBjb2RlIGJ5IHJlZHVjaW5nIHguY2FsbCgpIHRvIG1lcmVseSB4KClcbi8vIFNlZSBNYXJrIE1pbGxlcuKAmXMgZXhwbGFuYXRpb24gb2Ygd2hhdCB0aGlzIGRvZXMuXG4vLyBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1jb252ZW50aW9uczpzYWZlX21ldGFfcHJvZ3JhbW1pbmdcbnZhciBjYWxsID0gRnVuY3Rpb24uY2FsbDtcbmZ1bmN0aW9uIHVuY3VycnlUaGlzKGYpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY2FsbC5hcHBseShmLCBhcmd1bWVudHMpO1xuICAgIH07XG59XG4vLyBUaGlzIGlzIGVxdWl2YWxlbnQsIGJ1dCBzbG93ZXI6XG4vLyB1bmN1cnJ5VGhpcyA9IEZ1bmN0aW9uX2JpbmQuYmluZChGdW5jdGlvbl9iaW5kLmNhbGwpO1xuLy8gaHR0cDovL2pzcGVyZi5jb20vdW5jdXJyeXRoaXNcblxudmFyIGFycmF5X3NsaWNlID0gdW5jdXJyeVRoaXMoQXJyYXkucHJvdG90eXBlLnNsaWNlKTtcblxudmFyIGFycmF5X3JlZHVjZSA9IHVuY3VycnlUaGlzKFxuICAgIEFycmF5LnByb3RvdHlwZS5yZWR1Y2UgfHwgZnVuY3Rpb24gKGNhbGxiYWNrLCBiYXNpcykge1xuICAgICAgICB2YXIgaW5kZXggPSAwLFxuICAgICAgICAgICAgbGVuZ3RoID0gdGhpcy5sZW5ndGg7XG4gICAgICAgIC8vIGNvbmNlcm5pbmcgdGhlIGluaXRpYWwgdmFsdWUsIGlmIG9uZSBpcyBub3QgcHJvdmlkZWRcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIC8vIHNlZWsgdG8gdGhlIGZpcnN0IHZhbHVlIGluIHRoZSBhcnJheSwgYWNjb3VudGluZ1xuICAgICAgICAgICAgLy8gZm9yIHRoZSBwb3NzaWJpbGl0eSB0aGF0IGlzIGlzIGEgc3BhcnNlIGFycmF5XG4gICAgICAgICAgICBkbyB7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4IGluIHRoaXMpIHtcbiAgICAgICAgICAgICAgICAgICAgYmFzaXMgPSB0aGlzW2luZGV4KytdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCsraW5kZXggPj0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IHdoaWxlICgxKTtcbiAgICAgICAgfVxuICAgICAgICAvLyByZWR1Y2VcbiAgICAgICAgZm9yICg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAvLyBhY2NvdW50IGZvciB0aGUgcG9zc2liaWxpdHkgdGhhdCB0aGUgYXJyYXkgaXMgc3BhcnNlXG4gICAgICAgICAgICBpZiAoaW5kZXggaW4gdGhpcykge1xuICAgICAgICAgICAgICAgIGJhc2lzID0gY2FsbGJhY2soYmFzaXMsIHRoaXNbaW5kZXhdLCBpbmRleCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGJhc2lzO1xuICAgIH1cbik7XG5cbnZhciBhcnJheV9pbmRleE9mID0gdW5jdXJyeVRoaXMoXG4gICAgQXJyYXkucHJvdG90eXBlLmluZGV4T2YgfHwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIC8vIG5vdCBhIHZlcnkgZ29vZCBzaGltLCBidXQgZ29vZCBlbm91Z2ggZm9yIG91ciBvbmUgdXNlIG9mIGl0XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXNbaV0gPT09IHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbik7XG5cbnZhciBhcnJheV9tYXAgPSB1bmN1cnJ5VGhpcyhcbiAgICBBcnJheS5wcm90b3R5cGUubWFwIHx8IGZ1bmN0aW9uIChjYWxsYmFjaywgdGhpc3ApIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgY29sbGVjdCA9IFtdO1xuICAgICAgICBhcnJheV9yZWR1Y2Uoc2VsZiwgZnVuY3Rpb24gKHVuZGVmaW5lZCwgdmFsdWUsIGluZGV4KSB7XG4gICAgICAgICAgICBjb2xsZWN0LnB1c2goY2FsbGJhY2suY2FsbCh0aGlzcCwgdmFsdWUsIGluZGV4LCBzZWxmKSk7XG4gICAgICAgIH0sIHZvaWQgMCk7XG4gICAgICAgIHJldHVybiBjb2xsZWN0O1xuICAgIH1cbik7XG5cbnZhciBvYmplY3RfY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSB8fCBmdW5jdGlvbiAocHJvdG90eXBlKSB7XG4gICAgZnVuY3Rpb24gVHlwZSgpIHsgfVxuICAgIFR5cGUucHJvdG90eXBlID0gcHJvdG90eXBlO1xuICAgIHJldHVybiBuZXcgVHlwZSgpO1xufTtcblxudmFyIG9iamVjdF9oYXNPd25Qcm9wZXJ0eSA9IHVuY3VycnlUaGlzKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkpO1xuXG52YXIgb2JqZWN0X2tleXMgPSBPYmplY3Qua2V5cyB8fCBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgdmFyIGtleXMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSB7XG4gICAgICAgIGlmIChvYmplY3RfaGFzT3duUHJvcGVydHkob2JqZWN0LCBrZXkpKSB7XG4gICAgICAgICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ga2V5cztcbn07XG5cbnZhciBvYmplY3RfdG9TdHJpbmcgPSB1bmN1cnJ5VGhpcyhPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nKTtcblxuZnVuY3Rpb24gaXNPYmplY3QodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWUgPT09IE9iamVjdCh2YWx1ZSk7XG59XG5cbi8vIGdlbmVyYXRvciByZWxhdGVkIHNoaW1zXG5cbi8vIEZJWE1FOiBSZW1vdmUgdGhpcyBmdW5jdGlvbiBvbmNlIEVTNiBnZW5lcmF0b3JzIGFyZSBpbiBTcGlkZXJNb25rZXkuXG5mdW5jdGlvbiBpc1N0b3BJdGVyYXRpb24oZXhjZXB0aW9uKSB7XG4gICAgcmV0dXJuIChcbiAgICAgICAgb2JqZWN0X3RvU3RyaW5nKGV4Y2VwdGlvbikgPT09IFwiW29iamVjdCBTdG9wSXRlcmF0aW9uXVwiIHx8XG4gICAgICAgIGV4Y2VwdGlvbiBpbnN0YW5jZW9mIFFSZXR1cm5WYWx1ZVxuICAgICk7XG59XG5cbi8vIEZJWE1FOiBSZW1vdmUgdGhpcyBoZWxwZXIgYW5kIFEucmV0dXJuIG9uY2UgRVM2IGdlbmVyYXRvcnMgYXJlIGluXG4vLyBTcGlkZXJNb25rZXkuXG52YXIgUVJldHVyblZhbHVlO1xuaWYgKHR5cGVvZiBSZXR1cm5WYWx1ZSAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgIFFSZXR1cm5WYWx1ZSA9IFJldHVyblZhbHVlO1xufSBlbHNlIHtcbiAgICBRUmV0dXJuVmFsdWUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgIH07XG59XG5cbi8vIGxvbmcgc3RhY2sgdHJhY2VzXG5cbnZhciBTVEFDS19KVU1QX1NFUEFSQVRPUiA9IFwiRnJvbSBwcmV2aW91cyBldmVudDpcIjtcblxuZnVuY3Rpb24gbWFrZVN0YWNrVHJhY2VMb25nKGVycm9yLCBwcm9taXNlKSB7XG4gICAgLy8gSWYgcG9zc2libGUsIHRyYW5zZm9ybSB0aGUgZXJyb3Igc3RhY2sgdHJhY2UgYnkgcmVtb3ZpbmcgTm9kZSBhbmQgUVxuICAgIC8vIGNydWZ0LCB0aGVuIGNvbmNhdGVuYXRpbmcgd2l0aCB0aGUgc3RhY2sgdHJhY2Ugb2YgYHByb21pc2VgLiBTZWUgIzU3LlxuICAgIGlmIChoYXNTdGFja3MgJiZcbiAgICAgICAgcHJvbWlzZS5zdGFjayAmJlxuICAgICAgICB0eXBlb2YgZXJyb3IgPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICAgZXJyb3IgIT09IG51bGwgJiZcbiAgICAgICAgZXJyb3Iuc3RhY2sgJiZcbiAgICAgICAgZXJyb3Iuc3RhY2suaW5kZXhPZihTVEFDS19KVU1QX1NFUEFSQVRPUikgPT09IC0xXG4gICAgKSB7XG4gICAgICAgIHZhciBzdGFja3MgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgcCA9IHByb21pc2U7ICEhcDsgcCA9IHAuc291cmNlKSB7XG4gICAgICAgICAgICBpZiAocC5zdGFjaykge1xuICAgICAgICAgICAgICAgIHN0YWNrcy51bnNoaWZ0KHAuc3RhY2spO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN0YWNrcy51bnNoaWZ0KGVycm9yLnN0YWNrKTtcblxuICAgICAgICB2YXIgY29uY2F0ZWRTdGFja3MgPSBzdGFja3Muam9pbihcIlxcblwiICsgU1RBQ0tfSlVNUF9TRVBBUkFUT1IgKyBcIlxcblwiKTtcbiAgICAgICAgZXJyb3Iuc3RhY2sgPSBmaWx0ZXJTdGFja1N0cmluZyhjb25jYXRlZFN0YWNrcyk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBmaWx0ZXJTdGFja1N0cmluZyhzdGFja1N0cmluZykge1xuICAgIHZhciBsaW5lcyA9IHN0YWNrU3RyaW5nLnNwbGl0KFwiXFxuXCIpO1xuICAgIHZhciBkZXNpcmVkTGluZXMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBsaW5lID0gbGluZXNbaV07XG5cbiAgICAgICAgaWYgKCFpc0ludGVybmFsRnJhbWUobGluZSkgJiYgIWlzTm9kZUZyYW1lKGxpbmUpICYmIGxpbmUpIHtcbiAgICAgICAgICAgIGRlc2lyZWRMaW5lcy5wdXNoKGxpbmUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkZXNpcmVkTGluZXMuam9pbihcIlxcblwiKTtcbn1cblxuZnVuY3Rpb24gaXNOb2RlRnJhbWUoc3RhY2tMaW5lKSB7XG4gICAgcmV0dXJuIHN0YWNrTGluZS5pbmRleE9mKFwiKG1vZHVsZS5qczpcIikgIT09IC0xIHx8XG4gICAgICAgICAgIHN0YWNrTGluZS5pbmRleE9mKFwiKG5vZGUuanM6XCIpICE9PSAtMTtcbn1cblxuZnVuY3Rpb24gZ2V0RmlsZU5hbWVBbmRMaW5lTnVtYmVyKHN0YWNrTGluZSkge1xuICAgIC8vIE5hbWVkIGZ1bmN0aW9uczogXCJhdCBmdW5jdGlvbk5hbWUgKGZpbGVuYW1lOmxpbmVOdW1iZXI6Y29sdW1uTnVtYmVyKVwiXG4gICAgLy8gSW4gSUUxMCBmdW5jdGlvbiBuYW1lIGNhbiBoYXZlIHNwYWNlcyAoXCJBbm9ueW1vdXMgZnVuY3Rpb25cIikgT19vXG4gICAgdmFyIGF0dGVtcHQxID0gL2F0IC4rIFxcKCguKyk6KFxcZCspOig/OlxcZCspXFwpJC8uZXhlYyhzdGFja0xpbmUpO1xuICAgIGlmIChhdHRlbXB0MSkge1xuICAgICAgICByZXR1cm4gW2F0dGVtcHQxWzFdLCBOdW1iZXIoYXR0ZW1wdDFbMl0pXTtcbiAgICB9XG5cbiAgICAvLyBBbm9ueW1vdXMgZnVuY3Rpb25zOiBcImF0IGZpbGVuYW1lOmxpbmVOdW1iZXI6Y29sdW1uTnVtYmVyXCJcbiAgICB2YXIgYXR0ZW1wdDIgPSAvYXQgKFteIF0rKTooXFxkKyk6KD86XFxkKykkLy5leGVjKHN0YWNrTGluZSk7XG4gICAgaWYgKGF0dGVtcHQyKSB7XG4gICAgICAgIHJldHVybiBbYXR0ZW1wdDJbMV0sIE51bWJlcihhdHRlbXB0MlsyXSldO1xuICAgIH1cblxuICAgIC8vIEZpcmVmb3ggc3R5bGU6IFwiZnVuY3Rpb25AZmlsZW5hbWU6bGluZU51bWJlciBvciBAZmlsZW5hbWU6bGluZU51bWJlclwiXG4gICAgdmFyIGF0dGVtcHQzID0gLy4qQCguKyk6KFxcZCspJC8uZXhlYyhzdGFja0xpbmUpO1xuICAgIGlmIChhdHRlbXB0Mykge1xuICAgICAgICByZXR1cm4gW2F0dGVtcHQzWzFdLCBOdW1iZXIoYXR0ZW1wdDNbMl0pXTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGlzSW50ZXJuYWxGcmFtZShzdGFja0xpbmUpIHtcbiAgICB2YXIgZmlsZU5hbWVBbmRMaW5lTnVtYmVyID0gZ2V0RmlsZU5hbWVBbmRMaW5lTnVtYmVyKHN0YWNrTGluZSk7XG5cbiAgICBpZiAoIWZpbGVOYW1lQW5kTGluZU51bWJlcikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdmFyIGZpbGVOYW1lID0gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzBdO1xuICAgIHZhciBsaW5lTnVtYmVyID0gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzFdO1xuXG4gICAgcmV0dXJuIGZpbGVOYW1lID09PSBxRmlsZU5hbWUgJiZcbiAgICAgICAgbGluZU51bWJlciA+PSBxU3RhcnRpbmdMaW5lICYmXG4gICAgICAgIGxpbmVOdW1iZXIgPD0gcUVuZGluZ0xpbmU7XG59XG5cbi8vIGRpc2NvdmVyIG93biBmaWxlIG5hbWUgYW5kIGxpbmUgbnVtYmVyIHJhbmdlIGZvciBmaWx0ZXJpbmcgc3RhY2tcbi8vIHRyYWNlc1xuZnVuY3Rpb24gY2FwdHVyZUxpbmUoKSB7XG4gICAgaWYgKCFoYXNTdGFja3MpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcigpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdmFyIGxpbmVzID0gZS5zdGFjay5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgdmFyIGZpcnN0TGluZSA9IGxpbmVzWzBdLmluZGV4T2YoXCJAXCIpID4gMCA/IGxpbmVzWzFdIDogbGluZXNbMl07XG4gICAgICAgIHZhciBmaWxlTmFtZUFuZExpbmVOdW1iZXIgPSBnZXRGaWxlTmFtZUFuZExpbmVOdW1iZXIoZmlyc3RMaW5lKTtcbiAgICAgICAgaWYgKCFmaWxlTmFtZUFuZExpbmVOdW1iZXIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHFGaWxlTmFtZSA9IGZpbGVOYW1lQW5kTGluZU51bWJlclswXTtcbiAgICAgICAgcmV0dXJuIGZpbGVOYW1lQW5kTGluZU51bWJlclsxXTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRlcHJlY2F0ZShjYWxsYmFjaywgbmFtZSwgYWx0ZXJuYXRpdmUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgICAgIHR5cGVvZiBjb25zb2xlLndhcm4gPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKG5hbWUgKyBcIiBpcyBkZXByZWNhdGVkLCB1c2UgXCIgKyBhbHRlcm5hdGl2ZSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgXCIgaW5zdGVhZC5cIiwgbmV3IEVycm9yKFwiXCIpLnN0YWNrKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkoY2FsbGJhY2ssIGFyZ3VtZW50cyk7XG4gICAgfTtcbn1cblxuLy8gZW5kIG9mIHNoaW1zXG4vLyBiZWdpbm5pbmcgb2YgcmVhbCB3b3JrXG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHByb21pc2UgZm9yIGFuIGltbWVkaWF0ZSByZWZlcmVuY2UsIHBhc3NlcyBwcm9taXNlcyB0aHJvdWdoLCBvclxuICogY29lcmNlcyBwcm9taXNlcyBmcm9tIGRpZmZlcmVudCBzeXN0ZW1zLlxuICogQHBhcmFtIHZhbHVlIGltbWVkaWF0ZSByZWZlcmVuY2Ugb3IgcHJvbWlzZVxuICovXG5mdW5jdGlvbiBRKHZhbHVlKSB7XG4gICAgLy8gSWYgdGhlIG9iamVjdCBpcyBhbHJlYWR5IGEgUHJvbWlzZSwgcmV0dXJuIGl0IGRpcmVjdGx5LiAgVGhpcyBlbmFibGVzXG4gICAgLy8gdGhlIHJlc29sdmUgZnVuY3Rpb24gdG8gYm90aCBiZSB1c2VkIHRvIGNyZWF0ZWQgcmVmZXJlbmNlcyBmcm9tIG9iamVjdHMsXG4gICAgLy8gYnV0IHRvIHRvbGVyYWJseSBjb2VyY2Ugbm9uLXByb21pc2VzIHRvIHByb21pc2VzLlxuICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIFByb21pc2UpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIC8vIGFzc2ltaWxhdGUgdGhlbmFibGVzXG4gICAgaWYgKGlzUHJvbWlzZUFsaWtlKHZhbHVlKSkge1xuICAgICAgICByZXR1cm4gY29lcmNlKHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZnVsZmlsbCh2YWx1ZSk7XG4gICAgfVxufVxuUS5yZXNvbHZlID0gUTtcblxuLyoqXG4gKiBQZXJmb3JtcyBhIHRhc2sgaW4gYSBmdXR1cmUgdHVybiBvZiB0aGUgZXZlbnQgbG9vcC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IHRhc2tcbiAqL1xuUS5uZXh0VGljayA9IG5leHRUaWNrO1xuXG4vKipcbiAqIENvbnRyb2xzIHdoZXRoZXIgb3Igbm90IGxvbmcgc3RhY2sgdHJhY2VzIHdpbGwgYmUgb25cbiAqL1xuUS5sb25nU3RhY2tTdXBwb3J0ID0gZmFsc2U7XG5cbi8vIGVuYWJsZSBsb25nIHN0YWNrcyBpZiBRX0RFQlVHIGlzIHNldFxuaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHByb2Nlc3MgJiYgcHJvY2Vzcy5lbnYgJiYgcHJvY2Vzcy5lbnYuUV9ERUJVRykge1xuICAgIFEubG9uZ1N0YWNrU3VwcG9ydCA9IHRydWU7XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHtwcm9taXNlLCByZXNvbHZlLCByZWplY3R9IG9iamVjdC5cbiAqXG4gKiBgcmVzb2x2ZWAgaXMgYSBjYWxsYmFjayB0byBpbnZva2Ugd2l0aCBhIG1vcmUgcmVzb2x2ZWQgdmFsdWUgZm9yIHRoZVxuICogcHJvbWlzZS4gVG8gZnVsZmlsbCB0aGUgcHJvbWlzZSwgaW52b2tlIGByZXNvbHZlYCB3aXRoIGFueSB2YWx1ZSB0aGF0IGlzXG4gKiBub3QgYSB0aGVuYWJsZS4gVG8gcmVqZWN0IHRoZSBwcm9taXNlLCBpbnZva2UgYHJlc29sdmVgIHdpdGggYSByZWplY3RlZFxuICogdGhlbmFibGUsIG9yIGludm9rZSBgcmVqZWN0YCB3aXRoIHRoZSByZWFzb24gZGlyZWN0bHkuIFRvIHJlc29sdmUgdGhlXG4gKiBwcm9taXNlIHRvIGFub3RoZXIgdGhlbmFibGUsIHRodXMgcHV0dGluZyBpdCBpbiB0aGUgc2FtZSBzdGF0ZSwgaW52b2tlXG4gKiBgcmVzb2x2ZWAgd2l0aCB0aGF0IG90aGVyIHRoZW5hYmxlLlxuICovXG5RLmRlZmVyID0gZGVmZXI7XG5mdW5jdGlvbiBkZWZlcigpIHtcbiAgICAvLyBpZiBcIm1lc3NhZ2VzXCIgaXMgYW4gXCJBcnJheVwiLCB0aGF0IGluZGljYXRlcyB0aGF0IHRoZSBwcm9taXNlIGhhcyBub3QgeWV0XG4gICAgLy8gYmVlbiByZXNvbHZlZC4gIElmIGl0IGlzIFwidW5kZWZpbmVkXCIsIGl0IGhhcyBiZWVuIHJlc29sdmVkLiAgRWFjaFxuICAgIC8vIGVsZW1lbnQgb2YgdGhlIG1lc3NhZ2VzIGFycmF5IGlzIGl0c2VsZiBhbiBhcnJheSBvZiBjb21wbGV0ZSBhcmd1bWVudHMgdG9cbiAgICAvLyBmb3J3YXJkIHRvIHRoZSByZXNvbHZlZCBwcm9taXNlLiAgV2UgY29lcmNlIHRoZSByZXNvbHV0aW9uIHZhbHVlIHRvIGFcbiAgICAvLyBwcm9taXNlIHVzaW5nIHRoZSBgcmVzb2x2ZWAgZnVuY3Rpb24gYmVjYXVzZSBpdCBoYW5kbGVzIGJvdGggZnVsbHlcbiAgICAvLyBub24tdGhlbmFibGUgdmFsdWVzIGFuZCBvdGhlciB0aGVuYWJsZXMgZ3JhY2VmdWxseS5cbiAgICB2YXIgbWVzc2FnZXMgPSBbXSwgcHJvZ3Jlc3NMaXN0ZW5lcnMgPSBbXSwgcmVzb2x2ZWRQcm9taXNlO1xuXG4gICAgdmFyIGRlZmVycmVkID0gb2JqZWN0X2NyZWF0ZShkZWZlci5wcm90b3R5cGUpO1xuICAgIHZhciBwcm9taXNlID0gb2JqZWN0X2NyZWF0ZShQcm9taXNlLnByb3RvdHlwZSk7XG5cbiAgICBwcm9taXNlLnByb21pc2VEaXNwYXRjaCA9IGZ1bmN0aW9uIChyZXNvbHZlLCBvcCwgb3BlcmFuZHMpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgICAgICBpZiAobWVzc2FnZXMpIHtcbiAgICAgICAgICAgIG1lc3NhZ2VzLnB1c2goYXJncyk7XG4gICAgICAgICAgICBpZiAob3AgPT09IFwid2hlblwiICYmIG9wZXJhbmRzWzFdKSB7IC8vIHByb2dyZXNzIG9wZXJhbmRcbiAgICAgICAgICAgICAgICBwcm9ncmVzc0xpc3RlbmVycy5wdXNoKG9wZXJhbmRzWzFdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJlc29sdmVkUHJvbWlzZS5wcm9taXNlRGlzcGF0Y2guYXBwbHkocmVzb2x2ZWRQcm9taXNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIFhYWCBkZXByZWNhdGVkXG4gICAgcHJvbWlzZS52YWx1ZU9mID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAobWVzc2FnZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBuZWFyZXJWYWx1ZSA9IG5lYXJlcihyZXNvbHZlZFByb21pc2UpO1xuICAgICAgICBpZiAoaXNQcm9taXNlKG5lYXJlclZhbHVlKSkge1xuICAgICAgICAgICAgcmVzb2x2ZWRQcm9taXNlID0gbmVhcmVyVmFsdWU7IC8vIHNob3J0ZW4gY2hhaW5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmVhcmVyVmFsdWU7XG4gICAgfTtcblxuICAgIHByb21pc2UuaW5zcGVjdCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybiB7IHN0YXRlOiBcInBlbmRpbmdcIiB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXNvbHZlZFByb21pc2UuaW5zcGVjdCgpO1xuICAgIH07XG5cbiAgICBpZiAoUS5sb25nU3RhY2tTdXBwb3J0ICYmIGhhc1N0YWNrcykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIE5PVEU6IGRvbid0IHRyeSB0byB1c2UgYEVycm9yLmNhcHR1cmVTdGFja1RyYWNlYCBvciB0cmFuc2ZlciB0aGVcbiAgICAgICAgICAgIC8vIGFjY2Vzc29yIGFyb3VuZDsgdGhhdCBjYXVzZXMgbWVtb3J5IGxlYWtzIGFzIHBlciBHSC0xMTEuIEp1c3RcbiAgICAgICAgICAgIC8vIHJlaWZ5IHRoZSBzdGFjayB0cmFjZSBhcyBhIHN0cmluZyBBU0FQLlxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIEF0IHRoZSBzYW1lIHRpbWUsIGN1dCBvZmYgdGhlIGZpcnN0IGxpbmU7IGl0J3MgYWx3YXlzIGp1c3RcbiAgICAgICAgICAgIC8vIFwiW29iamVjdCBQcm9taXNlXVxcblwiLCBhcyBwZXIgdGhlIGB0b1N0cmluZ2AuXG4gICAgICAgICAgICBwcm9taXNlLnN0YWNrID0gZS5zdGFjay5zdWJzdHJpbmcoZS5zdGFjay5pbmRleE9mKFwiXFxuXCIpICsgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBOT1RFOiB3ZSBkbyB0aGUgY2hlY2tzIGZvciBgcmVzb2x2ZWRQcm9taXNlYCBpbiBlYWNoIG1ldGhvZCwgaW5zdGVhZCBvZlxuICAgIC8vIGNvbnNvbGlkYXRpbmcgdGhlbSBpbnRvIGBiZWNvbWVgLCBzaW5jZSBvdGhlcndpc2Ugd2UnZCBjcmVhdGUgbmV3XG4gICAgLy8gcHJvbWlzZXMgd2l0aCB0aGUgbGluZXMgYGJlY29tZSh3aGF0ZXZlcih2YWx1ZSkpYC4gU2VlIGUuZy4gR0gtMjUyLlxuXG4gICAgZnVuY3Rpb24gYmVjb21lKG5ld1Byb21pc2UpIHtcbiAgICAgICAgcmVzb2x2ZWRQcm9taXNlID0gbmV3UHJvbWlzZTtcbiAgICAgICAgcHJvbWlzZS5zb3VyY2UgPSBuZXdQcm9taXNlO1xuXG4gICAgICAgIGFycmF5X3JlZHVjZShtZXNzYWdlcywgZnVuY3Rpb24gKHVuZGVmaW5lZCwgbWVzc2FnZSkge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbmV3UHJvbWlzZS5wcm9taXNlRGlzcGF0Y2guYXBwbHkobmV3UHJvbWlzZSwgbWVzc2FnZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgdm9pZCAwKTtcblxuICAgICAgICBtZXNzYWdlcyA9IHZvaWQgMDtcbiAgICAgICAgcHJvZ3Jlc3NMaXN0ZW5lcnMgPSB2b2lkIDA7XG4gICAgfVxuXG4gICAgZGVmZXJyZWQucHJvbWlzZSA9IHByb21pc2U7XG4gICAgZGVmZXJyZWQucmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBiZWNvbWUoUSh2YWx1ZSkpO1xuICAgIH07XG5cbiAgICBkZWZlcnJlZC5mdWxmaWxsID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlY29tZShmdWxmaWxsKHZhbHVlKSk7XG4gICAgfTtcbiAgICBkZWZlcnJlZC5yZWplY3QgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlY29tZShyZWplY3QocmVhc29uKSk7XG4gICAgfTtcbiAgICBkZWZlcnJlZC5ub3RpZnkgPSBmdW5jdGlvbiAocHJvZ3Jlc3MpIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYXJyYXlfcmVkdWNlKHByb2dyZXNzTGlzdGVuZXJzLCBmdW5jdGlvbiAodW5kZWZpbmVkLCBwcm9ncmVzc0xpc3RlbmVyKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBwcm9ncmVzc0xpc3RlbmVyKHByb2dyZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCB2b2lkIDApO1xuICAgIH07XG5cbiAgICByZXR1cm4gZGVmZXJyZWQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIE5vZGUtc3R5bGUgY2FsbGJhY2sgdGhhdCB3aWxsIHJlc29sdmUgb3IgcmVqZWN0IHRoZSBkZWZlcnJlZFxuICogcHJvbWlzZS5cbiAqIEByZXR1cm5zIGEgbm9kZWJhY2tcbiAqL1xuZGVmZXIucHJvdG90eXBlLm1ha2VOb2RlUmVzb2x2ZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiBmdW5jdGlvbiAoZXJyb3IsIHZhbHVlKSB7XG4gICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgc2VsZi5yZWplY3QoZXJyb3IpO1xuICAgICAgICB9IGVsc2UgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICBzZWxmLnJlc29sdmUoYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLnJlc29sdmUodmFsdWUpO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHJlc29sdmVyIHtGdW5jdGlvbn0gYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgbm90aGluZyBhbmQgYWNjZXB0c1xuICogdGhlIHJlc29sdmUsIHJlamVjdCwgYW5kIG5vdGlmeSBmdW5jdGlvbnMgZm9yIGEgZGVmZXJyZWQuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgdGhhdCBtYXkgYmUgcmVzb2x2ZWQgd2l0aCB0aGUgZ2l2ZW4gcmVzb2x2ZSBhbmQgcmVqZWN0XG4gKiBmdW5jdGlvbnMsIG9yIHJlamVjdGVkIGJ5IGEgdGhyb3duIGV4Y2VwdGlvbiBpbiByZXNvbHZlclxuICovXG5RLlByb21pc2UgPSBwcm9taXNlOyAvLyBFUzZcblEucHJvbWlzZSA9IHByb21pc2U7XG5mdW5jdGlvbiBwcm9taXNlKHJlc29sdmVyKSB7XG4gICAgaWYgKHR5cGVvZiByZXNvbHZlciAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJyZXNvbHZlciBtdXN0IGJlIGEgZnVuY3Rpb24uXCIpO1xuICAgIH1cbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHRyeSB7XG4gICAgICAgIHJlc29sdmVyKGRlZmVycmVkLnJlc29sdmUsIGRlZmVycmVkLnJlamVjdCwgZGVmZXJyZWQubm90aWZ5KTtcbiAgICB9IGNhdGNoIChyZWFzb24pIHtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KHJlYXNvbik7XG4gICAgfVxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG5wcm9taXNlLnJhY2UgPSByYWNlOyAvLyBFUzZcbnByb21pc2UuYWxsID0gYWxsOyAvLyBFUzZcbnByb21pc2UucmVqZWN0ID0gcmVqZWN0OyAvLyBFUzZcbnByb21pc2UucmVzb2x2ZSA9IFE7IC8vIEVTNlxuXG4vLyBYWFggZXhwZXJpbWVudGFsLiAgVGhpcyBtZXRob2QgaXMgYSB3YXkgdG8gZGVub3RlIHRoYXQgYSBsb2NhbCB2YWx1ZSBpc1xuLy8gc2VyaWFsaXphYmxlIGFuZCBzaG91bGQgYmUgaW1tZWRpYXRlbHkgZGlzcGF0Y2hlZCB0byBhIHJlbW90ZSB1cG9uIHJlcXVlc3QsXG4vLyBpbnN0ZWFkIG9mIHBhc3NpbmcgYSByZWZlcmVuY2UuXG5RLnBhc3NCeUNvcHkgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gICAgLy9mcmVlemUob2JqZWN0KTtcbiAgICAvL3Bhc3NCeUNvcGllcy5zZXQob2JqZWN0LCB0cnVlKTtcbiAgICByZXR1cm4gb2JqZWN0O1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUucGFzc0J5Q29weSA9IGZ1bmN0aW9uICgpIHtcbiAgICAvL2ZyZWV6ZShvYmplY3QpO1xuICAgIC8vcGFzc0J5Q29waWVzLnNldChvYmplY3QsIHRydWUpO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuLyoqXG4gKiBJZiB0d28gcHJvbWlzZXMgZXZlbnR1YWxseSBmdWxmaWxsIHRvIHRoZSBzYW1lIHZhbHVlLCBwcm9taXNlcyB0aGF0IHZhbHVlLFxuICogYnV0IG90aGVyd2lzZSByZWplY3RzLlxuICogQHBhcmFtIHgge0FueSp9XG4gKiBAcGFyYW0geSB7QW55Kn1cbiAqIEByZXR1cm5zIHtBbnkqfSBhIHByb21pc2UgZm9yIHggYW5kIHkgaWYgdGhleSBhcmUgdGhlIHNhbWUsIGJ1dCBhIHJlamVjdGlvblxuICogb3RoZXJ3aXNlLlxuICpcbiAqL1xuUS5qb2luID0gZnVuY3Rpb24gKHgsIHkpIHtcbiAgICByZXR1cm4gUSh4KS5qb2luKHkpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuam9pbiA9IGZ1bmN0aW9uICh0aGF0KSB7XG4gICAgcmV0dXJuIFEoW3RoaXMsIHRoYXRdKS5zcHJlYWQoZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgaWYgKHggPT09IHkpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IFwiPT09XCIgc2hvdWxkIGJlIE9iamVjdC5pcyBvciBlcXVpdlxuICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBqb2luOiBub3QgdGhlIHNhbWU6IFwiICsgeCArIFwiIFwiICsgeSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbi8qKlxuICogUmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSBmaXJzdCBvZiBhbiBhcnJheSBvZiBwcm9taXNlcyB0byBiZWNvbWUgc2V0dGxlZC5cbiAqIEBwYXJhbSBhbnN3ZXJzIHtBcnJheVtBbnkqXX0gcHJvbWlzZXMgdG8gcmFjZVxuICogQHJldHVybnMge0FueSp9IHRoZSBmaXJzdCBwcm9taXNlIHRvIGJlIHNldHRsZWRcbiAqL1xuUS5yYWNlID0gcmFjZTtcbmZ1bmN0aW9uIHJhY2UoYW5zd2VyUHMpIHtcbiAgICByZXR1cm4gcHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIC8vIFN3aXRjaCB0byB0aGlzIG9uY2Ugd2UgY2FuIGFzc3VtZSBhdCBsZWFzdCBFUzVcbiAgICAgICAgLy8gYW5zd2VyUHMuZm9yRWFjaChmdW5jdGlvbiAoYW5zd2VyUCkge1xuICAgICAgICAvLyAgICAgUShhbnN3ZXJQKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIC8vIH0pO1xuICAgICAgICAvLyBVc2UgdGhpcyBpbiB0aGUgbWVhbnRpbWVcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFuc3dlclBzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBRKGFuc3dlclBzW2ldKS50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUucmFjZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKFEucmFjZSk7XG59O1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBQcm9taXNlIHdpdGggYSBwcm9taXNlIGRlc2NyaXB0b3Igb2JqZWN0IGFuZCBvcHRpb25hbCBmYWxsYmFja1xuICogZnVuY3Rpb24uICBUaGUgZGVzY3JpcHRvciBjb250YWlucyBtZXRob2RzIGxpa2Ugd2hlbihyZWplY3RlZCksIGdldChuYW1lKSxcbiAqIHNldChuYW1lLCB2YWx1ZSksIHBvc3QobmFtZSwgYXJncyksIGFuZCBkZWxldGUobmFtZSksIHdoaWNoIGFsbFxuICogcmV0dXJuIGVpdGhlciBhIHZhbHVlLCBhIHByb21pc2UgZm9yIGEgdmFsdWUsIG9yIGEgcmVqZWN0aW9uLiAgVGhlIGZhbGxiYWNrXG4gKiBhY2NlcHRzIHRoZSBvcGVyYXRpb24gbmFtZSwgYSByZXNvbHZlciwgYW5kIGFueSBmdXJ0aGVyIGFyZ3VtZW50cyB0aGF0IHdvdWxkXG4gKiBoYXZlIGJlZW4gZm9yd2FyZGVkIHRvIHRoZSBhcHByb3ByaWF0ZSBtZXRob2QgYWJvdmUgaGFkIGEgbWV0aG9kIGJlZW5cbiAqIHByb3ZpZGVkIHdpdGggdGhlIHByb3BlciBuYW1lLiAgVGhlIEFQSSBtYWtlcyBubyBndWFyYW50ZWVzIGFib3V0IHRoZSBuYXR1cmVcbiAqIG9mIHRoZSByZXR1cm5lZCBvYmplY3QsIGFwYXJ0IGZyb20gdGhhdCBpdCBpcyB1c2FibGUgd2hlcmVldmVyIHByb21pc2VzIGFyZVxuICogYm91Z2h0IGFuZCBzb2xkLlxuICovXG5RLm1ha2VQcm9taXNlID0gUHJvbWlzZTtcbmZ1bmN0aW9uIFByb21pc2UoZGVzY3JpcHRvciwgZmFsbGJhY2ssIGluc3BlY3QpIHtcbiAgICBpZiAoZmFsbGJhY2sgPT09IHZvaWQgMCkge1xuICAgICAgICBmYWxsYmFjayA9IGZ1bmN0aW9uIChvcCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICAgXCJQcm9taXNlIGRvZXMgbm90IHN1cHBvcnQgb3BlcmF0aW9uOiBcIiArIG9wXG4gICAgICAgICAgICApKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgaWYgKGluc3BlY3QgPT09IHZvaWQgMCkge1xuICAgICAgICBpbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHtzdGF0ZTogXCJ1bmtub3duXCJ9O1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBwcm9taXNlID0gb2JqZWN0X2NyZWF0ZShQcm9taXNlLnByb3RvdHlwZSk7XG5cbiAgICBwcm9taXNlLnByb21pc2VEaXNwYXRjaCA9IGZ1bmN0aW9uIChyZXNvbHZlLCBvcCwgYXJncykge1xuICAgICAgICB2YXIgcmVzdWx0O1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKGRlc2NyaXB0b3Jbb3BdKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZGVzY3JpcHRvcltvcF0uYXBwbHkocHJvbWlzZSwgYXJncyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IGZhbGxiYWNrLmNhbGwocHJvbWlzZSwgb3AsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXNvbHZlKSB7XG4gICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcHJvbWlzZS5pbnNwZWN0ID0gaW5zcGVjdDtcblxuICAgIC8vIFhYWCBkZXByZWNhdGVkIGB2YWx1ZU9mYCBhbmQgYGV4Y2VwdGlvbmAgc3VwcG9ydFxuICAgIGlmIChpbnNwZWN0KSB7XG4gICAgICAgIHZhciBpbnNwZWN0ZWQgPSBpbnNwZWN0KCk7XG4gICAgICAgIGlmIChpbnNwZWN0ZWQuc3RhdGUgPT09IFwicmVqZWN0ZWRcIikge1xuICAgICAgICAgICAgcHJvbWlzZS5leGNlcHRpb24gPSBpbnNwZWN0ZWQucmVhc29uO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvbWlzZS52YWx1ZU9mID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGluc3BlY3RlZCA9IGluc3BlY3QoKTtcbiAgICAgICAgICAgIGlmIChpbnNwZWN0ZWQuc3RhdGUgPT09IFwicGVuZGluZ1wiIHx8XG4gICAgICAgICAgICAgICAgaW5zcGVjdGVkLnN0YXRlID09PSBcInJlamVjdGVkXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBpbnNwZWN0ZWQudmFsdWU7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb21pc2U7XG59XG5cblByb21pc2UucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBcIltvYmplY3QgUHJvbWlzZV1cIjtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnRoZW4gPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3NlZCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHZhciBkb25lID0gZmFsc2U7ICAgLy8gZW5zdXJlIHRoZSB1bnRydXN0ZWQgcHJvbWlzZSBtYWtlcyBhdCBtb3N0IGFcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNpbmdsZSBjYWxsIHRvIG9uZSBvZiB0aGUgY2FsbGJhY2tzXG5cbiAgICBmdW5jdGlvbiBfZnVsZmlsbGVkKHZhbHVlKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIGZ1bGZpbGxlZCA9PT0gXCJmdW5jdGlvblwiID8gZnVsZmlsbGVkKHZhbHVlKSA6IHZhbHVlO1xuICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9yZWplY3RlZChleGNlcHRpb24pIHtcbiAgICAgICAgaWYgKHR5cGVvZiByZWplY3RlZCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBtYWtlU3RhY2tUcmFjZUxvbmcoZXhjZXB0aW9uLCBzZWxmKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdGVkKGV4Y2VwdGlvbik7XG4gICAgICAgICAgICB9IGNhdGNoIChuZXdFeGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ld0V4Y2VwdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9wcm9ncmVzc2VkKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgcHJvZ3Jlc3NlZCA9PT0gXCJmdW5jdGlvblwiID8gcHJvZ3Jlc3NlZCh2YWx1ZSkgOiB2YWx1ZTtcbiAgICB9XG5cbiAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5wcm9taXNlRGlzcGF0Y2goZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoZG9uZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuXG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKF9mdWxmaWxsZWQodmFsdWUpKTtcbiAgICAgICAgfSwgXCJ3aGVuXCIsIFtmdW5jdGlvbiAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICBpZiAoZG9uZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xuXG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKF9yZWplY3RlZChleGNlcHRpb24pKTtcbiAgICAgICAgfV0pO1xuICAgIH0pO1xuXG4gICAgLy8gUHJvZ3Jlc3MgcHJvcGFnYXRvciBuZWVkIHRvIGJlIGF0dGFjaGVkIGluIHRoZSBjdXJyZW50IHRpY2suXG4gICAgc2VsZi5wcm9taXNlRGlzcGF0Y2godm9pZCAwLCBcIndoZW5cIiwgW3ZvaWQgMCwgZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBuZXdWYWx1ZTtcbiAgICAgICAgdmFyIHRocmV3ID0gZmFsc2U7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBuZXdWYWx1ZSA9IF9wcm9ncmVzc2VkKHZhbHVlKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgdGhyZXcgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKFEub25lcnJvcikge1xuICAgICAgICAgICAgICAgIFEub25lcnJvcihlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhyZXcpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLm5vdGlmeShuZXdWYWx1ZSk7XG4gICAgICAgIH1cbiAgICB9XSk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cblEudGFwID0gZnVuY3Rpb24gKHByb21pc2UsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIFEocHJvbWlzZSkudGFwKGNhbGxiYWNrKTtcbn07XG5cbi8qKlxuICogV29ya3MgYWxtb3N0IGxpa2UgXCJmaW5hbGx5XCIsIGJ1dCBub3QgY2FsbGVkIGZvciByZWplY3Rpb25zLlxuICogT3JpZ2luYWwgcmVzb2x1dGlvbiB2YWx1ZSBpcyBwYXNzZWQgdGhyb3VnaCBjYWxsYmFjayB1bmFmZmVjdGVkLlxuICogQ2FsbGJhY2sgbWF5IHJldHVybiBhIHByb21pc2UgdGhhdCB3aWxsIGJlIGF3YWl0ZWQgZm9yLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcbiAqIEByZXR1cm5zIHtRLlByb21pc2V9XG4gKiBAZXhhbXBsZVxuICogZG9Tb21ldGhpbmcoKVxuICogICAudGhlbiguLi4pXG4gKiAgIC50YXAoY29uc29sZS5sb2cpXG4gKiAgIC50aGVuKC4uLik7XG4gKi9cblByb21pc2UucHJvdG90eXBlLnRhcCA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xuICAgIGNhbGxiYWNrID0gUShjYWxsYmFjayk7XG5cbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2suZmNhbGwodmFsdWUpLnRoZW5SZXNvbHZlKHZhbHVlKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXJzIGFuIG9ic2VydmVyIG9uIGEgcHJvbWlzZS5cbiAqXG4gKiBHdWFyYW50ZWVzOlxuICpcbiAqIDEuIHRoYXQgZnVsZmlsbGVkIGFuZCByZWplY3RlZCB3aWxsIGJlIGNhbGxlZCBvbmx5IG9uY2UuXG4gKiAyLiB0aGF0IGVpdGhlciB0aGUgZnVsZmlsbGVkIGNhbGxiYWNrIG9yIHRoZSByZWplY3RlZCBjYWxsYmFjayB3aWxsIGJlXG4gKiAgICBjYWxsZWQsIGJ1dCBub3QgYm90aC5cbiAqIDMuIHRoYXQgZnVsZmlsbGVkIGFuZCByZWplY3RlZCB3aWxsIG5vdCBiZSBjYWxsZWQgaW4gdGhpcyB0dXJuLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSAgICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSB0byBvYnNlcnZlXG4gKiBAcGFyYW0gZnVsZmlsbGVkICBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2l0aCB0aGUgZnVsZmlsbGVkIHZhbHVlXG4gKiBAcGFyYW0gcmVqZWN0ZWQgICBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2l0aCB0aGUgcmVqZWN0aW9uIGV4Y2VwdGlvblxuICogQHBhcmFtIHByb2dyZXNzZWQgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIG9uIGFueSBwcm9ncmVzcyBub3RpZmljYXRpb25zXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWUgZnJvbSB0aGUgaW52b2tlZCBjYWxsYmFja1xuICovXG5RLndoZW4gPSB3aGVuO1xuZnVuY3Rpb24gd2hlbih2YWx1ZSwgZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3NlZCkge1xuICAgIHJldHVybiBRKHZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzZWQpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS50aGVuUmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKCkgeyByZXR1cm4gdmFsdWU7IH0pO1xufTtcblxuUS50aGVuUmVzb2x2ZSA9IGZ1bmN0aW9uIChwcm9taXNlLCB2YWx1ZSkge1xuICAgIHJldHVybiBRKHByb21pc2UpLnRoZW5SZXNvbHZlKHZhbHVlKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnRoZW5SZWplY3QgPSBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAoKSB7IHRocm93IHJlYXNvbjsgfSk7XG59O1xuXG5RLnRoZW5SZWplY3QgPSBmdW5jdGlvbiAocHJvbWlzZSwgcmVhc29uKSB7XG4gICAgcmV0dXJuIFEocHJvbWlzZSkudGhlblJlamVjdChyZWFzb24pO1xufTtcblxuLyoqXG4gKiBJZiBhbiBvYmplY3QgaXMgbm90IGEgcHJvbWlzZSwgaXQgaXMgYXMgXCJuZWFyXCIgYXMgcG9zc2libGUuXG4gKiBJZiBhIHByb21pc2UgaXMgcmVqZWN0ZWQsIGl0IGlzIGFzIFwibmVhclwiIGFzIHBvc3NpYmxlIHRvby5cbiAqIElmIGl04oCZcyBhIGZ1bGZpbGxlZCBwcm9taXNlLCB0aGUgZnVsZmlsbG1lbnQgdmFsdWUgaXMgbmVhcmVyLlxuICogSWYgaXTigJlzIGEgZGVmZXJyZWQgcHJvbWlzZSBhbmQgdGhlIGRlZmVycmVkIGhhcyBiZWVuIHJlc29sdmVkLCB0aGVcbiAqIHJlc29sdXRpb24gaXMgXCJuZWFyZXJcIi5cbiAqIEBwYXJhbSBvYmplY3RcbiAqIEByZXR1cm5zIG1vc3QgcmVzb2x2ZWQgKG5lYXJlc3QpIGZvcm0gb2YgdGhlIG9iamVjdFxuICovXG5cbi8vIFhYWCBzaG91bGQgd2UgcmUtZG8gdGhpcz9cblEubmVhcmVyID0gbmVhcmVyO1xuZnVuY3Rpb24gbmVhcmVyKHZhbHVlKSB7XG4gICAgaWYgKGlzUHJvbWlzZSh2YWx1ZSkpIHtcbiAgICAgICAgdmFyIGluc3BlY3RlZCA9IHZhbHVlLmluc3BlY3QoKTtcbiAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIikge1xuICAgICAgICAgICAgcmV0dXJuIGluc3BlY3RlZC52YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcHJvbWlzZS5cbiAqIE90aGVyd2lzZSBpdCBpcyBhIGZ1bGZpbGxlZCB2YWx1ZS5cbiAqL1xuUS5pc1Byb21pc2UgPSBpc1Byb21pc2U7XG5mdW5jdGlvbiBpc1Byb21pc2Uob2JqZWN0KSB7XG4gICAgcmV0dXJuIG9iamVjdCBpbnN0YW5jZW9mIFByb21pc2U7XG59XG5cblEuaXNQcm9taXNlQWxpa2UgPSBpc1Byb21pc2VBbGlrZTtcbmZ1bmN0aW9uIGlzUHJvbWlzZUFsaWtlKG9iamVjdCkge1xuICAgIHJldHVybiBpc09iamVjdChvYmplY3QpICYmIHR5cGVvZiBvYmplY3QudGhlbiA9PT0gXCJmdW5jdGlvblwiO1xufVxuXG4vKipcbiAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIGdpdmVuIG9iamVjdCBpcyBhIHBlbmRpbmcgcHJvbWlzZSwgbWVhbmluZyBub3RcbiAqIGZ1bGZpbGxlZCBvciByZWplY3RlZC5cbiAqL1xuUS5pc1BlbmRpbmcgPSBpc1BlbmRpbmc7XG5mdW5jdGlvbiBpc1BlbmRpbmcob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzUHJvbWlzZShvYmplY3QpICYmIG9iamVjdC5pbnNwZWN0KCkuc3RhdGUgPT09IFwicGVuZGluZ1wiO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5pc1BlbmRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zcGVjdCgpLnN0YXRlID09PSBcInBlbmRpbmdcIjtcbn07XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgdmFsdWUgb3IgZnVsZmlsbGVkXG4gKiBwcm9taXNlLlxuICovXG5RLmlzRnVsZmlsbGVkID0gaXNGdWxmaWxsZWQ7XG5mdW5jdGlvbiBpc0Z1bGZpbGxlZChvYmplY3QpIHtcbiAgICByZXR1cm4gIWlzUHJvbWlzZShvYmplY3QpIHx8IG9iamVjdC5pbnNwZWN0KCkuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCI7XG59XG5cblByb21pc2UucHJvdG90eXBlLmlzRnVsZmlsbGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIjtcbn07XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcmVqZWN0ZWQgcHJvbWlzZS5cbiAqL1xuUS5pc1JlamVjdGVkID0gaXNSZWplY3RlZDtcbmZ1bmN0aW9uIGlzUmVqZWN0ZWQob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzUHJvbWlzZShvYmplY3QpICYmIG9iamVjdC5pbnNwZWN0KCkuc3RhdGUgPT09IFwicmVqZWN0ZWRcIjtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuaXNSZWplY3RlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnNwZWN0KCkuc3RhdGUgPT09IFwicmVqZWN0ZWRcIjtcbn07XG5cbi8vLy8gQkVHSU4gVU5IQU5ETEVEIFJFSkVDVElPTiBUUkFDS0lOR1xuXG4vLyBUaGlzIHByb21pc2UgbGlicmFyeSBjb25zdW1lcyBleGNlcHRpb25zIHRocm93biBpbiBoYW5kbGVycyBzbyB0aGV5IGNhbiBiZVxuLy8gaGFuZGxlZCBieSBhIHN1YnNlcXVlbnQgcHJvbWlzZS4gIFRoZSBleGNlcHRpb25zIGdldCBhZGRlZCB0byB0aGlzIGFycmF5IHdoZW5cbi8vIHRoZXkgYXJlIGNyZWF0ZWQsIGFuZCByZW1vdmVkIHdoZW4gdGhleSBhcmUgaGFuZGxlZC4gIE5vdGUgdGhhdCBpbiBFUzYgb3Jcbi8vIHNoaW1tZWQgZW52aXJvbm1lbnRzLCB0aGlzIHdvdWxkIG5hdHVyYWxseSBiZSBhIGBTZXRgLlxudmFyIHVuaGFuZGxlZFJlYXNvbnMgPSBbXTtcbnZhciB1bmhhbmRsZWRSZWplY3Rpb25zID0gW107XG52YXIgcmVwb3J0ZWRVbmhhbmRsZWRSZWplY3Rpb25zID0gW107XG52YXIgdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zID0gdHJ1ZTtcblxuZnVuY3Rpb24gcmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zKCkge1xuICAgIHVuaGFuZGxlZFJlYXNvbnMubGVuZ3RoID0gMDtcbiAgICB1bmhhbmRsZWRSZWplY3Rpb25zLmxlbmd0aCA9IDA7XG5cbiAgICBpZiAoIXRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucykge1xuICAgICAgICB0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMgPSB0cnVlO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gdHJhY2tSZWplY3Rpb24ocHJvbWlzZSwgcmVhc29uKSB7XG4gICAgaWYgKCF0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIHByb2Nlc3MuZW1pdCA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIFEubmV4dFRpY2sucnVuQWZ0ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKGFycmF5X2luZGV4T2YodW5oYW5kbGVkUmVqZWN0aW9ucywgcHJvbWlzZSkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcHJvY2Vzcy5lbWl0KFwidW5oYW5kbGVkUmVqZWN0aW9uXCIsIHJlYXNvbiwgcHJvbWlzZSk7XG4gICAgICAgICAgICAgICAgcmVwb3J0ZWRVbmhhbmRsZWRSZWplY3Rpb25zLnB1c2gocHJvbWlzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHVuaGFuZGxlZFJlamVjdGlvbnMucHVzaChwcm9taXNlKTtcbiAgICBpZiAocmVhc29uICYmIHR5cGVvZiByZWFzb24uc3RhY2sgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgdW5oYW5kbGVkUmVhc29ucy5wdXNoKHJlYXNvbi5zdGFjayk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdW5oYW5kbGVkUmVhc29ucy5wdXNoKFwiKG5vIHN0YWNrKSBcIiArIHJlYXNvbik7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB1bnRyYWNrUmVqZWN0aW9uKHByb21pc2UpIHtcbiAgICBpZiAoIXRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGF0ID0gYXJyYXlfaW5kZXhPZih1bmhhbmRsZWRSZWplY3Rpb25zLCBwcm9taXNlKTtcbiAgICBpZiAoYXQgIT09IC0xKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgcHJvY2Vzcy5lbWl0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2sucnVuQWZ0ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBhdFJlcG9ydCA9IGFycmF5X2luZGV4T2YocmVwb3J0ZWRVbmhhbmRsZWRSZWplY3Rpb25zLCBwcm9taXNlKTtcbiAgICAgICAgICAgICAgICBpZiAoYXRSZXBvcnQgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZW1pdChcInJlamVjdGlvbkhhbmRsZWRcIiwgdW5oYW5kbGVkUmVhc29uc1thdF0sIHByb21pc2UpO1xuICAgICAgICAgICAgICAgICAgICByZXBvcnRlZFVuaGFuZGxlZFJlamVjdGlvbnMuc3BsaWNlKGF0UmVwb3J0LCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB1bmhhbmRsZWRSZWplY3Rpb25zLnNwbGljZShhdCwgMSk7XG4gICAgICAgIHVuaGFuZGxlZFJlYXNvbnMuc3BsaWNlKGF0LCAxKTtcbiAgICB9XG59XG5cblEucmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zID0gcmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zO1xuXG5RLmdldFVuaGFuZGxlZFJlYXNvbnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgLy8gTWFrZSBhIGNvcHkgc28gdGhhdCBjb25zdW1lcnMgY2FuJ3QgaW50ZXJmZXJlIHdpdGggb3VyIGludGVybmFsIHN0YXRlLlxuICAgIHJldHVybiB1bmhhbmRsZWRSZWFzb25zLnNsaWNlKCk7XG59O1xuXG5RLnN0b3BVbmhhbmRsZWRSZWplY3Rpb25UcmFja2luZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKTtcbiAgICB0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMgPSBmYWxzZTtcbn07XG5cbnJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucygpO1xuXG4vLy8vIEVORCBVTkhBTkRMRUQgUkVKRUNUSU9OIFRSQUNLSU5HXG5cbi8qKlxuICogQ29uc3RydWN0cyBhIHJlamVjdGVkIHByb21pc2UuXG4gKiBAcGFyYW0gcmVhc29uIHZhbHVlIGRlc2NyaWJpbmcgdGhlIGZhaWx1cmVcbiAqL1xuUS5yZWplY3QgPSByZWplY3Q7XG5mdW5jdGlvbiByZWplY3QocmVhc29uKSB7XG4gICAgdmFyIHJlamVjdGlvbiA9IFByb21pc2Uoe1xuICAgICAgICBcIndoZW5cIjogZnVuY3Rpb24gKHJlamVjdGVkKSB7XG4gICAgICAgICAgICAvLyBub3RlIHRoYXQgdGhlIGVycm9yIGhhcyBiZWVuIGhhbmRsZWRcbiAgICAgICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgICAgICAgIHVudHJhY2tSZWplY3Rpb24odGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQgPyByZWplY3RlZChyZWFzb24pIDogdGhpcztcbiAgICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uIGZhbGxiYWNrKCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LCBmdW5jdGlvbiBpbnNwZWN0KCkge1xuICAgICAgICByZXR1cm4geyBzdGF0ZTogXCJyZWplY3RlZFwiLCByZWFzb246IHJlYXNvbiB9O1xuICAgIH0pO1xuXG4gICAgLy8gTm90ZSB0aGF0IHRoZSByZWFzb24gaGFzIG5vdCBiZWVuIGhhbmRsZWQuXG4gICAgdHJhY2tSZWplY3Rpb24ocmVqZWN0aW9uLCByZWFzb24pO1xuXG4gICAgcmV0dXJuIHJlamVjdGlvbjtcbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgZnVsZmlsbGVkIHByb21pc2UgZm9yIGFuIGltbWVkaWF0ZSByZWZlcmVuY2UuXG4gKiBAcGFyYW0gdmFsdWUgaW1tZWRpYXRlIHJlZmVyZW5jZVxuICovXG5RLmZ1bGZpbGwgPSBmdWxmaWxsO1xuZnVuY3Rpb24gZnVsZmlsbCh2YWx1ZSkge1xuICAgIHJldHVybiBQcm9taXNlKHtcbiAgICAgICAgXCJ3aGVuXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJnZXRcIjogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZVtuYW1lXTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJzZXRcIjogZnVuY3Rpb24gKG5hbWUsIHJocykge1xuICAgICAgICAgICAgdmFsdWVbbmFtZV0gPSByaHM7XG4gICAgICAgIH0sXG4gICAgICAgIFwiZGVsZXRlXCI6IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICBkZWxldGUgdmFsdWVbbmFtZV07XG4gICAgICAgIH0sXG4gICAgICAgIFwicG9zdFwiOiBmdW5jdGlvbiAobmFtZSwgYXJncykge1xuICAgICAgICAgICAgLy8gTWFyayBNaWxsZXIgcHJvcG9zZXMgdGhhdCBwb3N0IHdpdGggbm8gbmFtZSBzaG91bGQgYXBwbHkgYVxuICAgICAgICAgICAgLy8gcHJvbWlzZWQgZnVuY3Rpb24uXG4gICAgICAgICAgICBpZiAobmFtZSA9PT0gbnVsbCB8fCBuYW1lID09PSB2b2lkIDApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWUuYXBwbHkodm9pZCAwLCBhcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlW25hbWVdLmFwcGx5KHZhbHVlLCBhcmdzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJhcHBseVwiOiBmdW5jdGlvbiAodGhpc3AsIGFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5hcHBseSh0aGlzcCwgYXJncyk7XG4gICAgICAgIH0sXG4gICAgICAgIFwia2V5c1wiOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqZWN0X2tleXModmFsdWUpO1xuICAgICAgICB9XG4gICAgfSwgdm9pZCAwLCBmdW5jdGlvbiBpbnNwZWN0KCkge1xuICAgICAgICByZXR1cm4geyBzdGF0ZTogXCJmdWxmaWxsZWRcIiwgdmFsdWU6IHZhbHVlIH07XG4gICAgfSk7XG59XG5cbi8qKlxuICogQ29udmVydHMgdGhlbmFibGVzIHRvIFEgcHJvbWlzZXMuXG4gKiBAcGFyYW0gcHJvbWlzZSB0aGVuYWJsZSBwcm9taXNlXG4gKiBAcmV0dXJucyBhIFEgcHJvbWlzZVxuICovXG5mdW5jdGlvbiBjb2VyY2UocHJvbWlzZSkge1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBwcm9taXNlLnRoZW4oZGVmZXJyZWQucmVzb2x2ZSwgZGVmZXJyZWQucmVqZWN0LCBkZWZlcnJlZC5ub3RpZnkpO1xuICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59XG5cbi8qKlxuICogQW5ub3RhdGVzIGFuIG9iamVjdCBzdWNoIHRoYXQgaXQgd2lsbCBuZXZlciBiZVxuICogdHJhbnNmZXJyZWQgYXdheSBmcm9tIHRoaXMgcHJvY2VzcyBvdmVyIGFueSBwcm9taXNlXG4gKiBjb21tdW5pY2F0aW9uIGNoYW5uZWwuXG4gKiBAcGFyYW0gb2JqZWN0XG4gKiBAcmV0dXJucyBwcm9taXNlIGEgd3JhcHBpbmcgb2YgdGhhdCBvYmplY3QgdGhhdFxuICogYWRkaXRpb25hbGx5IHJlc3BvbmRzIHRvIHRoZSBcImlzRGVmXCIgbWVzc2FnZVxuICogd2l0aG91dCBhIHJlamVjdGlvbi5cbiAqL1xuUS5tYXN0ZXIgPSBtYXN0ZXI7XG5mdW5jdGlvbiBtYXN0ZXIob2JqZWN0KSB7XG4gICAgcmV0dXJuIFByb21pc2Uoe1xuICAgICAgICBcImlzRGVmXCI6IGZ1bmN0aW9uICgpIHt9XG4gICAgfSwgZnVuY3Rpb24gZmFsbGJhY2sob3AsIGFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIGRpc3BhdGNoKG9iamVjdCwgb3AsIGFyZ3MpO1xuICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIFEob2JqZWN0KS5pbnNwZWN0KCk7XG4gICAgfSk7XG59XG5cbi8qKlxuICogU3ByZWFkcyB0aGUgdmFsdWVzIG9mIGEgcHJvbWlzZWQgYXJyYXkgb2YgYXJndW1lbnRzIGludG8gdGhlXG4gKiBmdWxmaWxsbWVudCBjYWxsYmFjay5cbiAqIEBwYXJhbSBmdWxmaWxsZWQgY2FsbGJhY2sgdGhhdCByZWNlaXZlcyB2YXJpYWRpYyBhcmd1bWVudHMgZnJvbSB0aGVcbiAqIHByb21pc2VkIGFycmF5XG4gKiBAcGFyYW0gcmVqZWN0ZWQgY2FsbGJhY2sgdGhhdCByZWNlaXZlcyB0aGUgZXhjZXB0aW9uIGlmIHRoZSBwcm9taXNlXG4gKiBpcyByZWplY3RlZC5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBvciB0aHJvd24gZXhjZXB0aW9uIG9mXG4gKiBlaXRoZXIgY2FsbGJhY2suXG4gKi9cblEuc3ByZWFkID0gc3ByZWFkO1xuZnVuY3Rpb24gc3ByZWFkKHZhbHVlLCBmdWxmaWxsZWQsIHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIFEodmFsdWUpLnNwcmVhZChmdWxmaWxsZWQsIHJlamVjdGVkKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuc3ByZWFkID0gZnVuY3Rpb24gKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gdGhpcy5hbGwoKS50aGVuKGZ1bmN0aW9uIChhcnJheSkge1xuICAgICAgICByZXR1cm4gZnVsZmlsbGVkLmFwcGx5KHZvaWQgMCwgYXJyYXkpO1xuICAgIH0sIHJlamVjdGVkKTtcbn07XG5cbi8qKlxuICogVGhlIGFzeW5jIGZ1bmN0aW9uIGlzIGEgZGVjb3JhdG9yIGZvciBnZW5lcmF0b3IgZnVuY3Rpb25zLCB0dXJuaW5nXG4gKiB0aGVtIGludG8gYXN5bmNocm9ub3VzIGdlbmVyYXRvcnMuICBBbHRob3VnaCBnZW5lcmF0b3JzIGFyZSBvbmx5IHBhcnRcbiAqIG9mIHRoZSBuZXdlc3QgRUNNQVNjcmlwdCA2IGRyYWZ0cywgdGhpcyBjb2RlIGRvZXMgbm90IGNhdXNlIHN5bnRheFxuICogZXJyb3JzIGluIG9sZGVyIGVuZ2luZXMuICBUaGlzIGNvZGUgc2hvdWxkIGNvbnRpbnVlIHRvIHdvcmsgYW5kIHdpbGxcbiAqIGluIGZhY3QgaW1wcm92ZSBvdmVyIHRpbWUgYXMgdGhlIGxhbmd1YWdlIGltcHJvdmVzLlxuICpcbiAqIEVTNiBnZW5lcmF0b3JzIGFyZSBjdXJyZW50bHkgcGFydCBvZiBWOCB2ZXJzaW9uIDMuMTkgd2l0aCB0aGVcbiAqIC0taGFybW9ueS1nZW5lcmF0b3JzIHJ1bnRpbWUgZmxhZyBlbmFibGVkLiAgU3BpZGVyTW9ua2V5IGhhcyBoYWQgdGhlbVxuICogZm9yIGxvbmdlciwgYnV0IHVuZGVyIGFuIG9sZGVyIFB5dGhvbi1pbnNwaXJlZCBmb3JtLiAgVGhpcyBmdW5jdGlvblxuICogd29ya3Mgb24gYm90aCBraW5kcyBvZiBnZW5lcmF0b3JzLlxuICpcbiAqIERlY29yYXRlcyBhIGdlbmVyYXRvciBmdW5jdGlvbiBzdWNoIHRoYXQ6XG4gKiAgLSBpdCBtYXkgeWllbGQgcHJvbWlzZXNcbiAqICAtIGV4ZWN1dGlvbiB3aWxsIGNvbnRpbnVlIHdoZW4gdGhhdCBwcm9taXNlIGlzIGZ1bGZpbGxlZFxuICogIC0gdGhlIHZhbHVlIG9mIHRoZSB5aWVsZCBleHByZXNzaW9uIHdpbGwgYmUgdGhlIGZ1bGZpbGxlZCB2YWx1ZVxuICogIC0gaXQgcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWUgKHdoZW4gdGhlIGdlbmVyYXRvclxuICogICAgc3RvcHMgaXRlcmF0aW5nKVxuICogIC0gdGhlIGRlY29yYXRlZCBmdW5jdGlvbiByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICogICAgb2YgdGhlIGdlbmVyYXRvciBvciB0aGUgZmlyc3QgcmVqZWN0ZWQgcHJvbWlzZSBhbW9uZyB0aG9zZVxuICogICAgeWllbGRlZC5cbiAqICAtIGlmIGFuIGVycm9yIGlzIHRocm93biBpbiB0aGUgZ2VuZXJhdG9yLCBpdCBwcm9wYWdhdGVzIHRocm91Z2hcbiAqICAgIGV2ZXJ5IGZvbGxvd2luZyB5aWVsZCB1bnRpbCBpdCBpcyBjYXVnaHQsIG9yIHVudGlsIGl0IGVzY2FwZXNcbiAqICAgIHRoZSBnZW5lcmF0b3IgZnVuY3Rpb24gYWx0b2dldGhlciwgYW5kIGlzIHRyYW5zbGF0ZWQgaW50byBhXG4gKiAgICByZWplY3Rpb24gZm9yIHRoZSBwcm9taXNlIHJldHVybmVkIGJ5IHRoZSBkZWNvcmF0ZWQgZ2VuZXJhdG9yLlxuICovXG5RLmFzeW5jID0gYXN5bmM7XG5mdW5jdGlvbiBhc3luYyhtYWtlR2VuZXJhdG9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gd2hlbiB2ZXJiIGlzIFwic2VuZFwiLCBhcmcgaXMgYSB2YWx1ZVxuICAgICAgICAvLyB3aGVuIHZlcmIgaXMgXCJ0aHJvd1wiLCBhcmcgaXMgYW4gZXhjZXB0aW9uXG4gICAgICAgIGZ1bmN0aW9uIGNvbnRpbnVlcih2ZXJiLCBhcmcpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQ7XG5cbiAgICAgICAgICAgIC8vIFVudGlsIFY4IDMuMTkgLyBDaHJvbWl1bSAyOSBpcyByZWxlYXNlZCwgU3BpZGVyTW9ua2V5IGlzIHRoZSBvbmx5XG4gICAgICAgICAgICAvLyBlbmdpbmUgdGhhdCBoYXMgYSBkZXBsb3llZCBiYXNlIG9mIGJyb3dzZXJzIHRoYXQgc3VwcG9ydCBnZW5lcmF0b3JzLlxuICAgICAgICAgICAgLy8gSG93ZXZlciwgU00ncyBnZW5lcmF0b3JzIHVzZSB0aGUgUHl0aG9uLWluc3BpcmVkIHNlbWFudGljcyBvZlxuICAgICAgICAgICAgLy8gb3V0ZGF0ZWQgRVM2IGRyYWZ0cy4gIFdlIHdvdWxkIGxpa2UgdG8gc3VwcG9ydCBFUzYsIGJ1dCB3ZSdkIGFsc29cbiAgICAgICAgICAgIC8vIGxpa2UgdG8gbWFrZSBpdCBwb3NzaWJsZSB0byB1c2UgZ2VuZXJhdG9ycyBpbiBkZXBsb3llZCBicm93c2Vycywgc29cbiAgICAgICAgICAgIC8vIHdlIGFsc28gc3VwcG9ydCBQeXRob24tc3R5bGUgZ2VuZXJhdG9ycy4gIEF0IHNvbWUgcG9pbnQgd2UgY2FuIHJlbW92ZVxuICAgICAgICAgICAgLy8gdGhpcyBibG9jay5cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBTdG9wSXRlcmF0aW9uID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAgICAgLy8gRVM2IEdlbmVyYXRvcnNcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBnZW5lcmF0b3JbdmVyYl0oYXJnKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmRvbmUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFEocmVzdWx0LnZhbHVlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2hlbihyZXN1bHQudmFsdWUsIGNhbGxiYWNrLCBlcnJiYWNrKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIFNwaWRlck1vbmtleSBHZW5lcmF0b3JzXG4gICAgICAgICAgICAgICAgLy8gRklYTUU6IFJlbW92ZSB0aGlzIGNhc2Ugd2hlbiBTTSBkb2VzIEVTNiBnZW5lcmF0b3JzLlxuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGdlbmVyYXRvclt2ZXJiXShhcmcpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNTdG9wSXRlcmF0aW9uKGV4Y2VwdGlvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBRKGV4Y2VwdGlvbi52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdoZW4ocmVzdWx0LCBjYWxsYmFjaywgZXJyYmFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGdlbmVyYXRvciA9IG1ha2VHZW5lcmF0b3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gY29udGludWVyLmJpbmQoY29udGludWVyLCBcIm5leHRcIik7XG4gICAgICAgIHZhciBlcnJiYWNrID0gY29udGludWVyLmJpbmQoY29udGludWVyLCBcInRocm93XCIpO1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soKTtcbiAgICB9O1xufVxuXG4vKipcbiAqIFRoZSBzcGF3biBmdW5jdGlvbiBpcyBhIHNtYWxsIHdyYXBwZXIgYXJvdW5kIGFzeW5jIHRoYXQgaW1tZWRpYXRlbHlcbiAqIGNhbGxzIHRoZSBnZW5lcmF0b3IgYW5kIGFsc28gZW5kcyB0aGUgcHJvbWlzZSBjaGFpbiwgc28gdGhhdCBhbnlcbiAqIHVuaGFuZGxlZCBlcnJvcnMgYXJlIHRocm93biBpbnN0ZWFkIG9mIGZvcndhcmRlZCB0byB0aGUgZXJyb3JcbiAqIGhhbmRsZXIuIFRoaXMgaXMgdXNlZnVsIGJlY2F1c2UgaXQncyBleHRyZW1lbHkgY29tbW9uIHRvIHJ1blxuICogZ2VuZXJhdG9ycyBhdCB0aGUgdG9wLWxldmVsIHRvIHdvcmsgd2l0aCBsaWJyYXJpZXMuXG4gKi9cblEuc3Bhd24gPSBzcGF3bjtcbmZ1bmN0aW9uIHNwYXduKG1ha2VHZW5lcmF0b3IpIHtcbiAgICBRLmRvbmUoUS5hc3luYyhtYWtlR2VuZXJhdG9yKSgpKTtcbn1cblxuLy8gRklYTUU6IFJlbW92ZSB0aGlzIGludGVyZmFjZSBvbmNlIEVTNiBnZW5lcmF0b3JzIGFyZSBpbiBTcGlkZXJNb25rZXkuXG4vKipcbiAqIFRocm93cyBhIFJldHVyblZhbHVlIGV4Y2VwdGlvbiB0byBzdG9wIGFuIGFzeW5jaHJvbm91cyBnZW5lcmF0b3IuXG4gKlxuICogVGhpcyBpbnRlcmZhY2UgaXMgYSBzdG9wLWdhcCBtZWFzdXJlIHRvIHN1cHBvcnQgZ2VuZXJhdG9yIHJldHVyblxuICogdmFsdWVzIGluIG9sZGVyIEZpcmVmb3gvU3BpZGVyTW9ua2V5LiAgSW4gYnJvd3NlcnMgdGhhdCBzdXBwb3J0IEVTNlxuICogZ2VuZXJhdG9ycyBsaWtlIENocm9taXVtIDI5LCBqdXN0IHVzZSBcInJldHVyblwiIGluIHlvdXIgZ2VuZXJhdG9yXG4gKiBmdW5jdGlvbnMuXG4gKlxuICogQHBhcmFtIHZhbHVlIHRoZSByZXR1cm4gdmFsdWUgZm9yIHRoZSBzdXJyb3VuZGluZyBnZW5lcmF0b3JcbiAqIEB0aHJvd3MgUmV0dXJuVmFsdWUgZXhjZXB0aW9uIHdpdGggdGhlIHZhbHVlLlxuICogQGV4YW1wbGVcbiAqIC8vIEVTNiBzdHlsZVxuICogUS5hc3luYyhmdW5jdGlvbiogKCkge1xuICogICAgICB2YXIgZm9vID0geWllbGQgZ2V0Rm9vUHJvbWlzZSgpO1xuICogICAgICB2YXIgYmFyID0geWllbGQgZ2V0QmFyUHJvbWlzZSgpO1xuICogICAgICByZXR1cm4gZm9vICsgYmFyO1xuICogfSlcbiAqIC8vIE9sZGVyIFNwaWRlck1vbmtleSBzdHlsZVxuICogUS5hc3luYyhmdW5jdGlvbiAoKSB7XG4gKiAgICAgIHZhciBmb28gPSB5aWVsZCBnZXRGb29Qcm9taXNlKCk7XG4gKiAgICAgIHZhciBiYXIgPSB5aWVsZCBnZXRCYXJQcm9taXNlKCk7XG4gKiAgICAgIFEucmV0dXJuKGZvbyArIGJhcik7XG4gKiB9KVxuICovXG5RW1wicmV0dXJuXCJdID0gX3JldHVybjtcbmZ1bmN0aW9uIF9yZXR1cm4odmFsdWUpIHtcbiAgICB0aHJvdyBuZXcgUVJldHVyblZhbHVlKHZhbHVlKTtcbn1cblxuLyoqXG4gKiBUaGUgcHJvbWlzZWQgZnVuY3Rpb24gZGVjb3JhdG9yIGVuc3VyZXMgdGhhdCBhbnkgcHJvbWlzZSBhcmd1bWVudHNcbiAqIGFyZSBzZXR0bGVkIGFuZCBwYXNzZWQgYXMgdmFsdWVzIChgdGhpc2AgaXMgYWxzbyBzZXR0bGVkIGFuZCBwYXNzZWRcbiAqIGFzIGEgdmFsdWUpLiAgSXQgd2lsbCBhbHNvIGVuc3VyZSB0aGF0IHRoZSByZXN1bHQgb2YgYSBmdW5jdGlvbiBpc1xuICogYWx3YXlzIGEgcHJvbWlzZS5cbiAqXG4gKiBAZXhhbXBsZVxuICogdmFyIGFkZCA9IFEucHJvbWlzZWQoZnVuY3Rpb24gKGEsIGIpIHtcbiAqICAgICByZXR1cm4gYSArIGI7XG4gKiB9KTtcbiAqIGFkZChRKGEpLCBRKEIpKTtcbiAqXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBUaGUgZnVuY3Rpb24gdG8gZGVjb3JhdGVcbiAqIEByZXR1cm5zIHtmdW5jdGlvbn0gYSBmdW5jdGlvbiB0aGF0IGhhcyBiZWVuIGRlY29yYXRlZC5cbiAqL1xuUS5wcm9taXNlZCA9IHByb21pc2VkO1xuZnVuY3Rpb24gcHJvbWlzZWQoY2FsbGJhY2spIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gc3ByZWFkKFt0aGlzLCBhbGwoYXJndW1lbnRzKV0sIGZ1bmN0aW9uIChzZWxmLCBhcmdzKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkoc2VsZiwgYXJncyk7XG4gICAgICAgIH0pO1xuICAgIH07XG59XG5cbi8qKlxuICogc2VuZHMgYSBtZXNzYWdlIHRvIGEgdmFsdWUgaW4gYSBmdXR1cmUgdHVyblxuICogQHBhcmFtIG9iamVjdCogdGhlIHJlY2lwaWVudFxuICogQHBhcmFtIG9wIHRoZSBuYW1lIG9mIHRoZSBtZXNzYWdlIG9wZXJhdGlvbiwgZS5nLiwgXCJ3aGVuXCIsXG4gKiBAcGFyYW0gYXJncyBmdXJ0aGVyIGFyZ3VtZW50cyB0byBiZSBmb3J3YXJkZWQgdG8gdGhlIG9wZXJhdGlvblxuICogQHJldHVybnMgcmVzdWx0IHtQcm9taXNlfSBhIHByb21pc2UgZm9yIHRoZSByZXN1bHQgb2YgdGhlIG9wZXJhdGlvblxuICovXG5RLmRpc3BhdGNoID0gZGlzcGF0Y2g7XG5mdW5jdGlvbiBkaXNwYXRjaChvYmplY3QsIG9wLCBhcmdzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChvcCwgYXJncyk7XG59XG5cblByb21pc2UucHJvdG90eXBlLmRpc3BhdGNoID0gZnVuY3Rpb24gKG9wLCBhcmdzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNlbGYucHJvbWlzZURpc3BhdGNoKGRlZmVycmVkLnJlc29sdmUsIG9wLCBhcmdzKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgdmFsdWUgb2YgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBnZXRcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHByb3BlcnR5IHZhbHVlXG4gKi9cblEuZ2V0ID0gZnVuY3Rpb24gKG9iamVjdCwga2V5KSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImdldFwiLCBba2V5XSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJnZXRcIiwgW2tleV0pO1xufTtcblxuLyoqXG4gKiBTZXRzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3Igb2JqZWN0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIHByb3BlcnR5IHRvIHNldFxuICogQHBhcmFtIHZhbHVlICAgICBuZXcgdmFsdWUgb2YgcHJvcGVydHlcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RLnNldCA9IGZ1bmN0aW9uIChvYmplY3QsIGtleSwgdmFsdWUpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwic2V0XCIsIFtrZXksIHZhbHVlXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwic2V0XCIsIFtrZXksIHZhbHVlXSk7XG59O1xuXG4vKipcbiAqIERlbGV0ZXMgYSBwcm9wZXJ0eSBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBwcm9wZXJ0eSB0byBkZWxldGVcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG5RLmRlbCA9IC8vIFhYWCBsZWdhY3lcblFbXCJkZWxldGVcIl0gPSBmdW5jdGlvbiAob2JqZWN0LCBrZXkpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiZGVsZXRlXCIsIFtrZXldKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRlbCA9IC8vIFhYWCBsZWdhY3lcblByb21pc2UucHJvdG90eXBlW1wiZGVsZXRlXCJdID0gZnVuY3Rpb24gKGtleSkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiZGVsZXRlXCIsIFtrZXldKTtcbn07XG5cbi8qKlxuICogSW52b2tlcyBhIG1ldGhvZCBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBtZXRob2QgdG8gaW52b2tlXG4gKiBAcGFyYW0gdmFsdWUgICAgIGEgdmFsdWUgdG8gcG9zdCwgdHlwaWNhbGx5IGFuIGFycmF5IG9mXG4gKiAgICAgICAgICAgICAgICAgIGludm9jYXRpb24gYXJndW1lbnRzIGZvciBwcm9taXNlcyB0aGF0XG4gKiAgICAgICAgICAgICAgICAgIGFyZSB1bHRpbWF0ZWx5IGJhY2tlZCB3aXRoIGByZXNvbHZlYCB2YWx1ZXMsXG4gKiAgICAgICAgICAgICAgICAgIGFzIG9wcG9zZWQgdG8gdGhvc2UgYmFja2VkIHdpdGggVVJMc1xuICogICAgICAgICAgICAgICAgICB3aGVyZWluIHRoZSBwb3N0ZWQgdmFsdWUgY2FuIGJlIGFueVxuICogICAgICAgICAgICAgICAgICBKU09OIHNlcmlhbGl6YWJsZSBvYmplY3QuXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuLy8gYm91bmQgbG9jYWxseSBiZWNhdXNlIGl0IGlzIHVzZWQgYnkgb3RoZXIgbWV0aG9kc1xuUS5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUS5wb3N0ID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcmdzXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUHJvbWlzZS5wcm90b3R5cGUucG9zdCA9IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcmdzXSk7XG59O1xuXG4vKipcbiAqIEludm9rZXMgYSBtZXRob2QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgbWV0aG9kIHRvIGludm9rZVxuICogQHBhcmFtIC4uLmFyZ3MgICBhcnJheSBvZiBpbnZvY2F0aW9uIGFyZ3VtZW50c1xuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cblEuc2VuZCA9IC8vIFhYWCBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIHBhcmxhbmNlXG5RLm1jYWxsID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblEuaW52b2tlID0gZnVuY3Rpb24gKG9iamVjdCwgbmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5zZW5kID0gLy8gWFhYIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgcGFybGFuY2VcblByb21pc2UucHJvdG90eXBlLm1jYWxsID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblByb21pc2UucHJvdG90eXBlLmludm9rZSA9IGZ1bmN0aW9uIChuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpXSk7XG59O1xuXG4vKipcbiAqIEFwcGxpZXMgdGhlIHByb21pc2VkIGZ1bmN0aW9uIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IGZ1bmN0aW9uXG4gKiBAcGFyYW0gYXJncyAgICAgIGFycmF5IG9mIGFwcGxpY2F0aW9uIGFyZ3VtZW50c1xuICovXG5RLmZhcHBseSA9IGZ1bmN0aW9uIChvYmplY3QsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJnc10pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmFwcGx5ID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFyZ3NdKTtcbn07XG5cbi8qKlxuICogQ2FsbHMgdGhlIHByb21pc2VkIGZ1bmN0aW9uIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IGZ1bmN0aW9uXG4gKiBAcGFyYW0gLi4uYXJncyAgIGFycmF5IG9mIGFwcGxpY2F0aW9uIGFyZ3VtZW50c1xuICovXG5RW1widHJ5XCJdID1cblEuZmNhbGwgPSBmdW5jdGlvbiAob2JqZWN0IC8qIC4uLmFyZ3MqLykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mY2FsbCA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJyYXlfc2xpY2UoYXJndW1lbnRzKV0pO1xufTtcblxuLyoqXG4gKiBCaW5kcyB0aGUgcHJvbWlzZWQgZnVuY3Rpb24sIHRyYW5zZm9ybWluZyByZXR1cm4gdmFsdWVzIGludG8gYSBmdWxmaWxsZWRcbiAqIHByb21pc2UgYW5kIHRocm93biBlcnJvcnMgaW50byBhIHJlamVjdGVkIG9uZS5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgZnVuY3Rpb25cbiAqIEBwYXJhbSAuLi5hcmdzICAgYXJyYXkgb2YgYXBwbGljYXRpb24gYXJndW1lbnRzXG4gKi9cblEuZmJpbmQgPSBmdW5jdGlvbiAob2JqZWN0IC8qLi4uYXJncyovKSB7XG4gICAgdmFyIHByb21pc2UgPSBRKG9iamVjdCk7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbiBmYm91bmQoKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlLmRpc3BhdGNoKFwiYXBwbHlcIiwgW1xuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIGFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpXG4gICAgICAgIF0pO1xuICAgIH07XG59O1xuUHJvbWlzZS5wcm90b3R5cGUuZmJpbmQgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgcHJvbWlzZSA9IHRoaXM7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgIHJldHVybiBmdW5jdGlvbiBmYm91bmQoKSB7XG4gICAgICAgIHJldHVybiBwcm9taXNlLmRpc3BhdGNoKFwiYXBwbHlcIiwgW1xuICAgICAgICAgICAgdGhpcyxcbiAgICAgICAgICAgIGFyZ3MuY29uY2F0KGFycmF5X3NsaWNlKGFyZ3VtZW50cykpXG4gICAgICAgIF0pO1xuICAgIH07XG59O1xuXG4vKipcbiAqIFJlcXVlc3RzIHRoZSBuYW1lcyBvZiB0aGUgb3duZWQgcHJvcGVydGllcyBvZiBhIHByb21pc2VkXG4gKiBvYmplY3QgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgb2JqZWN0XG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSBrZXlzIG9mIHRoZSBldmVudHVhbGx5IHNldHRsZWQgb2JqZWN0XG4gKi9cblEua2V5cyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwia2V5c1wiLCBbXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwia2V5c1wiLCBbXSk7XG59O1xuXG4vKipcbiAqIFR1cm5zIGFuIGFycmF5IG9mIHByb21pc2VzIGludG8gYSBwcm9taXNlIGZvciBhbiBhcnJheS4gIElmIGFueSBvZlxuICogdGhlIHByb21pc2VzIGdldHMgcmVqZWN0ZWQsIHRoZSB3aG9sZSBhcnJheSBpcyByZWplY3RlZCBpbW1lZGlhdGVseS5cbiAqIEBwYXJhbSB7QXJyYXkqfSBhbiBhcnJheSAob3IgcHJvbWlzZSBmb3IgYW4gYXJyYXkpIG9mIHZhbHVlcyAob3JcbiAqIHByb21pc2VzIGZvciB2YWx1ZXMpXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHRoZSBjb3JyZXNwb25kaW5nIHZhbHVlc1xuICovXG4vLyBCeSBNYXJrIE1pbGxlclxuLy8gaHR0cDovL3dpa2kuZWNtYXNjcmlwdC5vcmcvZG9rdS5waHA/aWQ9c3RyYXdtYW46Y29uY3VycmVuY3kmcmV2PTEzMDg3NzY1MjEjYWxsZnVsZmlsbGVkXG5RLmFsbCA9IGFsbDtcbmZ1bmN0aW9uIGFsbChwcm9taXNlcykge1xuICAgIHJldHVybiB3aGVuKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZXMpIHtcbiAgICAgICAgdmFyIHBlbmRpbmdDb3VudCA9IDA7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIGFycmF5X3JlZHVjZShwcm9taXNlcywgZnVuY3Rpb24gKHVuZGVmaW5lZCwgcHJvbWlzZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIHZhciBzbmFwc2hvdDtcbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBpc1Byb21pc2UocHJvbWlzZSkgJiZcbiAgICAgICAgICAgICAgICAoc25hcHNob3QgPSBwcm9taXNlLmluc3BlY3QoKSkuc3RhdGUgPT09IFwiZnVsZmlsbGVkXCJcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHByb21pc2VzW2luZGV4XSA9IHNuYXBzaG90LnZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICArK3BlbmRpbmdDb3VudDtcbiAgICAgICAgICAgICAgICB3aGVuKFxuICAgICAgICAgICAgICAgICAgICBwcm9taXNlLFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2VzW2luZGV4XSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKC0tcGVuZGluZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHByb2dyZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkoeyBpbmRleDogaW5kZXgsIHZhbHVlOiBwcm9ncmVzcyB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHZvaWQgMCk7XG4gICAgICAgIGlmIChwZW5kaW5nQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocHJvbWlzZXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFsbCh0aGlzKTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgZmlyc3QgcmVzb2x2ZWQgcHJvbWlzZSBvZiBhbiBhcnJheS4gUHJpb3IgcmVqZWN0ZWQgcHJvbWlzZXMgYXJlXG4gKiBpZ25vcmVkLiAgUmVqZWN0cyBvbmx5IGlmIGFsbCBwcm9taXNlcyBhcmUgcmVqZWN0ZWQuXG4gKiBAcGFyYW0ge0FycmF5Kn0gYW4gYXJyYXkgY29udGFpbmluZyB2YWx1ZXMgb3IgcHJvbWlzZXMgZm9yIHZhbHVlc1xuICogQHJldHVybnMgYSBwcm9taXNlIGZ1bGZpbGxlZCB3aXRoIHRoZSB2YWx1ZSBvZiB0aGUgZmlyc3QgcmVzb2x2ZWQgcHJvbWlzZSxcbiAqIG9yIGEgcmVqZWN0ZWQgcHJvbWlzZSBpZiBhbGwgcHJvbWlzZXMgYXJlIHJlamVjdGVkLlxuICovXG5RLmFueSA9IGFueTtcblxuZnVuY3Rpb24gYW55KHByb21pc2VzKSB7XG4gICAgaWYgKHByb21pc2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gUS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgdmFyIGRlZmVycmVkID0gUS5kZWZlcigpO1xuICAgIHZhciBwZW5kaW5nQ291bnQgPSAwO1xuICAgIGFycmF5X3JlZHVjZShwcm9taXNlcywgZnVuY3Rpb24gKHByZXYsIGN1cnJlbnQsIGluZGV4KSB7XG4gICAgICAgIHZhciBwcm9taXNlID0gcHJvbWlzZXNbaW5kZXhdO1xuXG4gICAgICAgIHBlbmRpbmdDb3VudCsrO1xuXG4gICAgICAgIHdoZW4ocHJvbWlzZSwgb25GdWxmaWxsZWQsIG9uUmVqZWN0ZWQsIG9uUHJvZ3Jlc3MpO1xuICAgICAgICBmdW5jdGlvbiBvbkZ1bGZpbGxlZChyZXN1bHQpIHtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvblJlamVjdGVkKCkge1xuICAgICAgICAgICAgcGVuZGluZ0NvdW50LS07XG4gICAgICAgICAgICBpZiAocGVuZGluZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgXCJDYW4ndCBnZXQgZnVsZmlsbG1lbnQgdmFsdWUgZnJvbSBhbnkgcHJvbWlzZSwgYWxsIFwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9taXNlcyB3ZXJlIHJlamVjdGVkLlwiXG4gICAgICAgICAgICAgICAgKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gb25Qcm9ncmVzcyhwcm9ncmVzcykge1xuICAgICAgICAgICAgZGVmZXJyZWQubm90aWZ5KHtcbiAgICAgICAgICAgICAgICBpbmRleDogaW5kZXgsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHByb2dyZXNzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sIHVuZGVmaW5lZCk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuYW55ID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhbnkodGhpcyk7XG59O1xuXG4vKipcbiAqIFdhaXRzIGZvciBhbGwgcHJvbWlzZXMgdG8gYmUgc2V0dGxlZCwgZWl0aGVyIGZ1bGZpbGxlZCBvclxuICogcmVqZWN0ZWQuICBUaGlzIGlzIGRpc3RpbmN0IGZyb20gYGFsbGAgc2luY2UgdGhhdCB3b3VsZCBzdG9wXG4gKiB3YWl0aW5nIGF0IHRoZSBmaXJzdCByZWplY3Rpb24uICBUaGUgcHJvbWlzZSByZXR1cm5lZCBieVxuICogYGFsbFJlc29sdmVkYCB3aWxsIG5ldmVyIGJlIHJlamVjdGVkLlxuICogQHBhcmFtIHByb21pc2VzIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkgKG9yIGFuIGFycmF5KSBvZiBwcm9taXNlc1xuICogKG9yIHZhbHVlcylcbiAqIEByZXR1cm4gYSBwcm9taXNlIGZvciBhbiBhcnJheSBvZiBwcm9taXNlc1xuICovXG5RLmFsbFJlc29sdmVkID0gZGVwcmVjYXRlKGFsbFJlc29sdmVkLCBcImFsbFJlc29sdmVkXCIsIFwiYWxsU2V0dGxlZFwiKTtcbmZ1bmN0aW9uIGFsbFJlc29sdmVkKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIHdoZW4ocHJvbWlzZXMsIGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgICAgICBwcm9taXNlcyA9IGFycmF5X21hcChwcm9taXNlcywgUSk7XG4gICAgICAgIHJldHVybiB3aGVuKGFsbChhcnJheV9tYXAocHJvbWlzZXMsIGZ1bmN0aW9uIChwcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm4gd2hlbihwcm9taXNlLCBub29wLCBub29wKTtcbiAgICAgICAgfSkpLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZXM7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hbGxSZXNvbHZlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gYWxsUmVzb2x2ZWQodGhpcyk7XG59O1xuXG4vKipcbiAqIEBzZWUgUHJvbWlzZSNhbGxTZXR0bGVkXG4gKi9cblEuYWxsU2V0dGxlZCA9IGFsbFNldHRsZWQ7XG5mdW5jdGlvbiBhbGxTZXR0bGVkKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIFEocHJvbWlzZXMpLmFsbFNldHRsZWQoKTtcbn1cblxuLyoqXG4gKiBUdXJucyBhbiBhcnJheSBvZiBwcm9taXNlcyBpbnRvIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgdGhlaXIgc3RhdGVzIChhc1xuICogcmV0dXJuZWQgYnkgYGluc3BlY3RgKSB3aGVuIHRoZXkgaGF2ZSBhbGwgc2V0dGxlZC5cbiAqIEBwYXJhbSB7QXJyYXlbQW55Kl19IHZhbHVlcyBhbiBhcnJheSAob3IgcHJvbWlzZSBmb3IgYW4gYXJyYXkpIG9mIHZhbHVlcyAob3JcbiAqIHByb21pc2VzIGZvciB2YWx1ZXMpXG4gKiBAcmV0dXJucyB7QXJyYXlbU3RhdGVdfSBhbiBhcnJheSBvZiBzdGF0ZXMgZm9yIHRoZSByZXNwZWN0aXZlIHZhbHVlcy5cbiAqL1xuUHJvbWlzZS5wcm90b3R5cGUuYWxsU2V0dGxlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgICAgICByZXR1cm4gYWxsKGFycmF5X21hcChwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICAgICAgICAgIHByb21pc2UgPSBRKHByb21pc2UpO1xuICAgICAgICAgICAgZnVuY3Rpb24gcmVnYXJkbGVzcygpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvbWlzZS5pbnNwZWN0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZS50aGVuKHJlZ2FyZGxlc3MsIHJlZ2FyZGxlc3MpO1xuICAgICAgICB9KSk7XG4gICAgfSk7XG59O1xuXG4vKipcbiAqIENhcHR1cmVzIHRoZSBmYWlsdXJlIG9mIGEgcHJvbWlzZSwgZ2l2aW5nIGFuIG9wb3J0dW5pdHkgdG8gcmVjb3ZlclxuICogd2l0aCBhIGNhbGxiYWNrLiAgSWYgdGhlIGdpdmVuIHByb21pc2UgaXMgZnVsZmlsbGVkLCB0aGUgcmV0dXJuZWRcbiAqIHByb21pc2UgaXMgZnVsZmlsbGVkLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlIGZvciBzb21ldGhpbmdcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRvIGZ1bGZpbGwgdGhlIHJldHVybmVkIHByb21pc2UgaWYgdGhlXG4gKiBnaXZlbiBwcm9taXNlIGlzIHJlamVjdGVkXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIGNhbGxiYWNrXG4gKi9cblEuZmFpbCA9IC8vIFhYWCBsZWdhY3lcblFbXCJjYXRjaFwiXSA9IGZ1bmN0aW9uIChvYmplY3QsIHJlamVjdGVkKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS50aGVuKHZvaWQgMCwgcmVqZWN0ZWQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmFpbCA9IC8vIFhYWCBsZWdhY3lcblByb21pc2UucHJvdG90eXBlW1wiY2F0Y2hcIl0gPSBmdW5jdGlvbiAocmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKHZvaWQgMCwgcmVqZWN0ZWQpO1xufTtcblxuLyoqXG4gKiBBdHRhY2hlcyBhIGxpc3RlbmVyIHRoYXQgY2FuIHJlc3BvbmQgdG8gcHJvZ3Jlc3Mgbm90aWZpY2F0aW9ucyBmcm9tIGFcbiAqIHByb21pc2UncyBvcmlnaW5hdGluZyBkZWZlcnJlZC4gVGhpcyBsaXN0ZW5lciByZWNlaXZlcyB0aGUgZXhhY3QgYXJndW1lbnRzXG4gKiBwYXNzZWQgdG8gYGBkZWZlcnJlZC5ub3RpZnlgYC5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZSBmb3Igc29tZXRoaW5nXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayB0byByZWNlaXZlIGFueSBwcm9ncmVzcyBub3RpZmljYXRpb25zXG4gKiBAcmV0dXJucyB0aGUgZ2l2ZW4gcHJvbWlzZSwgdW5jaGFuZ2VkXG4gKi9cblEucHJvZ3Jlc3MgPSBwcm9ncmVzcztcbmZ1bmN0aW9uIHByb2dyZXNzKG9iamVjdCwgcHJvZ3Jlc3NlZCkge1xuICAgIHJldHVybiBRKG9iamVjdCkudGhlbih2b2lkIDAsIHZvaWQgMCwgcHJvZ3Jlc3NlZCk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnByb2dyZXNzID0gZnVuY3Rpb24gKHByb2dyZXNzZWQpIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKHZvaWQgMCwgdm9pZCAwLCBwcm9ncmVzc2VkKTtcbn07XG5cbi8qKlxuICogUHJvdmlkZXMgYW4gb3Bwb3J0dW5pdHkgdG8gb2JzZXJ2ZSB0aGUgc2V0dGxpbmcgb2YgYSBwcm9taXNlLFxuICogcmVnYXJkbGVzcyBvZiB3aGV0aGVyIHRoZSBwcm9taXNlIGlzIGZ1bGZpbGxlZCBvciByZWplY3RlZC4gIEZvcndhcmRzXG4gKiB0aGUgcmVzb2x1dGlvbiB0byB0aGUgcmV0dXJuZWQgcHJvbWlzZSB3aGVuIHRoZSBjYWxsYmFjayBpcyBkb25lLlxuICogVGhlIGNhbGxiYWNrIGNhbiByZXR1cm4gYSBwcm9taXNlIHRvIGRlZmVyIGNvbXBsZXRpb24uXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2VcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRvIG9ic2VydmUgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuXG4gKiBwcm9taXNlLCB0YWtlcyBubyBhcmd1bWVudHMuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlIHdoZW5cbiAqIGBgZmluYGAgaXMgZG9uZS5cbiAqL1xuUS5maW4gPSAvLyBYWFggbGVnYWN5XG5RW1wiZmluYWxseVwiXSA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KVtcImZpbmFsbHlcIl0oY2FsbGJhY2spO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZmluID0gLy8gWFhYIGxlZ2FjeVxuUHJvbWlzZS5wcm90b3R5cGVbXCJmaW5hbGx5XCJdID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sgPSBRKGNhbGxiYWNrKTtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2suZmNhbGwoKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgfSwgZnVuY3Rpb24gKHJlYXNvbikge1xuICAgICAgICAvLyBUT0RPIGF0dGVtcHQgdG8gcmVjeWNsZSB0aGUgcmVqZWN0aW9uIHdpdGggXCJ0aGlzXCIuXG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhyb3cgcmVhc29uO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogVGVybWluYXRlcyBhIGNoYWluIG9mIHByb21pc2VzLCBmb3JjaW5nIHJlamVjdGlvbnMgdG8gYmVcbiAqIHRocm93biBhcyBleGNlcHRpb25zLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlIGF0IHRoZSBlbmQgb2YgYSBjaGFpbiBvZiBwcm9taXNlc1xuICogQHJldHVybnMgbm90aGluZ1xuICovXG5RLmRvbmUgPSBmdW5jdGlvbiAob2JqZWN0LCBmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzcykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZG9uZShmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzcyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kb25lID0gZnVuY3Rpb24gKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKSB7XG4gICAgdmFyIG9uVW5oYW5kbGVkRXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgLy8gZm9yd2FyZCB0byBhIGZ1dHVyZSB0dXJuIHNvIHRoYXQgYGB3aGVuYGBcbiAgICAgICAgLy8gZG9lcyBub3QgY2F0Y2ggaXQgYW5kIHR1cm4gaXQgaW50byBhIHJlamVjdGlvbi5cbiAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYWtlU3RhY2tUcmFjZUxvbmcoZXJyb3IsIHByb21pc2UpO1xuICAgICAgICAgICAgaWYgKFEub25lcnJvcikge1xuICAgICAgICAgICAgICAgIFEub25lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IGVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgLy8gQXZvaWQgdW5uZWNlc3NhcnkgYG5leHRUaWNrYGluZyB2aWEgYW4gdW5uZWNlc3NhcnkgYHdoZW5gLlxuICAgIHZhciBwcm9taXNlID0gZnVsZmlsbGVkIHx8IHJlamVjdGVkIHx8IHByb2dyZXNzID9cbiAgICAgICAgdGhpcy50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKSA6XG4gICAgICAgIHRoaXM7XG5cbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiYgcHJvY2VzcyAmJiBwcm9jZXNzLmRvbWFpbikge1xuICAgICAgICBvblVuaGFuZGxlZEVycm9yID0gcHJvY2Vzcy5kb21haW4uYmluZChvblVuaGFuZGxlZEVycm9yKTtcbiAgICB9XG5cbiAgICBwcm9taXNlLnRoZW4odm9pZCAwLCBvblVuaGFuZGxlZEVycm9yKTtcbn07XG5cbi8qKlxuICogQ2F1c2VzIGEgcHJvbWlzZSB0byBiZSByZWplY3RlZCBpZiBpdCBkb2VzIG5vdCBnZXQgZnVsZmlsbGVkIGJlZm9yZVxuICogc29tZSBtaWxsaXNlY29uZHMgdGltZSBvdXQuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2VcbiAqIEBwYXJhbSB7TnVtYmVyfSBtaWxsaXNlY29uZHMgdGltZW91dFxuICogQHBhcmFtIHtBbnkqfSBjdXN0b20gZXJyb3IgbWVzc2FnZSBvciBFcnJvciBvYmplY3QgKG9wdGlvbmFsKVxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZSBpZiBpdCBpc1xuICogZnVsZmlsbGVkIGJlZm9yZSB0aGUgdGltZW91dCwgb3RoZXJ3aXNlIHJlamVjdGVkLlxuICovXG5RLnRpbWVvdXQgPSBmdW5jdGlvbiAob2JqZWN0LCBtcywgZXJyb3IpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLnRpbWVvdXQobXMsIGVycm9yKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnRpbWVvdXQgPSBmdW5jdGlvbiAobXMsIGVycm9yKSB7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICB2YXIgdGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghZXJyb3IgfHwgXCJzdHJpbmdcIiA9PT0gdHlwZW9mIGVycm9yKSB7XG4gICAgICAgICAgICBlcnJvciA9IG5ldyBFcnJvcihlcnJvciB8fCBcIlRpbWVkIG91dCBhZnRlciBcIiArIG1zICsgXCIgbXNcIik7XG4gICAgICAgICAgICBlcnJvci5jb2RlID0gXCJFVElNRURPVVRcIjtcbiAgICAgICAgfVxuICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgIH0sIG1zKTtcblxuICAgIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICAgIGRlZmVycmVkLnJlc29sdmUodmFsdWUpO1xuICAgIH0sIGZ1bmN0aW9uIChleGNlcHRpb24pIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChleGNlcHRpb24pO1xuICAgIH0sIGRlZmVycmVkLm5vdGlmeSk7XG5cbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogUmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSBnaXZlbiB2YWx1ZSAob3IgcHJvbWlzZWQgdmFsdWUpLCBzb21lXG4gKiBtaWxsaXNlY29uZHMgYWZ0ZXIgaXQgcmVzb2x2ZWQuIFBhc3NlcyByZWplY3Rpb25zIGltbWVkaWF0ZWx5LlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlXG4gKiBAcGFyYW0ge051bWJlcn0gbWlsbGlzZWNvbmRzXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlIGFmdGVyIG1pbGxpc2Vjb25kc1xuICogdGltZSBoYXMgZWxhcHNlZCBzaW5jZSB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW4gcHJvbWlzZS5cbiAqIElmIHRoZSBnaXZlbiBwcm9taXNlIHJlamVjdHMsIHRoYXQgaXMgcGFzc2VkIGltbWVkaWF0ZWx5LlxuICovXG5RLmRlbGF5ID0gZnVuY3Rpb24gKG9iamVjdCwgdGltZW91dCkge1xuICAgIGlmICh0aW1lb3V0ID09PSB2b2lkIDApIHtcbiAgICAgICAgdGltZW91dCA9IG9iamVjdDtcbiAgICAgICAgb2JqZWN0ID0gdm9pZCAwO1xuICAgIH1cbiAgICByZXR1cm4gUShvYmplY3QpLmRlbGF5KHRpbWVvdXQpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZGVsYXkgPSBmdW5jdGlvbiAodGltZW91dCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh2YWx1ZSk7XG4gICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogUGFzc2VzIGEgY29udGludWF0aW9uIHRvIGEgTm9kZSBmdW5jdGlvbiwgd2hpY2ggaXMgY2FsbGVkIHdpdGggdGhlIGdpdmVuXG4gKiBhcmd1bWVudHMgcHJvdmlkZWQgYXMgYW4gYXJyYXksIGFuZCByZXR1cm5zIGEgcHJvbWlzZS5cbiAqXG4gKiAgICAgIFEubmZhcHBseShGUy5yZWFkRmlsZSwgW19fZmlsZW5hbWVdKVxuICogICAgICAudGhlbihmdW5jdGlvbiAoY29udGVudCkge1xuICogICAgICB9KVxuICpcbiAqL1xuUS5uZmFwcGx5ID0gZnVuY3Rpb24gKGNhbGxiYWNrLCBhcmdzKSB7XG4gICAgcmV0dXJuIFEoY2FsbGJhY2spLm5mYXBwbHkoYXJncyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uZmFwcGx5ID0gZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3MpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmZhcHBseShub2RlQXJncykuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBQYXNzZXMgYSBjb250aW51YXRpb24gdG8gYSBOb2RlIGZ1bmN0aW9uLCB3aGljaCBpcyBjYWxsZWQgd2l0aCB0aGUgZ2l2ZW5cbiAqIGFyZ3VtZW50cyBwcm92aWRlZCBpbmRpdmlkdWFsbHksIGFuZCByZXR1cm5zIGEgcHJvbWlzZS5cbiAqIEBleGFtcGxlXG4gKiBRLm5mY2FsbChGUy5yZWFkRmlsZSwgX19maWxlbmFtZSlcbiAqIC50aGVuKGZ1bmN0aW9uIChjb250ZW50KSB7XG4gKiB9KVxuICpcbiAqL1xuUS5uZmNhbGwgPSBmdW5jdGlvbiAoY2FsbGJhY2sgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIFEoY2FsbGJhY2spLm5mYXBwbHkoYXJncyk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uZmNhbGwgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZmFwcGx5KG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIFdyYXBzIGEgTm9kZUpTIGNvbnRpbnVhdGlvbiBwYXNzaW5nIGZ1bmN0aW9uIGFuZCByZXR1cm5zIGFuIGVxdWl2YWxlbnRcbiAqIHZlcnNpb24gdGhhdCByZXR1cm5zIGEgcHJvbWlzZS5cbiAqIEBleGFtcGxlXG4gKiBRLm5mYmluZChGUy5yZWFkRmlsZSwgX19maWxlbmFtZSkoXCJ1dGYtOFwiKVxuICogLnRoZW4oY29uc29sZS5sb2cpXG4gKiAuZG9uZSgpXG4gKi9cblEubmZiaW5kID1cblEuZGVub2RlaWZ5ID0gZnVuY3Rpb24gKGNhbGxiYWNrIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIGJhc2VBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbm9kZUFyZ3MgPSBiYXNlQXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSk7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICAgICAgUShjYWxsYmFjaykuZmFwcGx5KG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uZmJpbmQgPVxuUHJvbWlzZS5wcm90b3R5cGUuZGVub2RlaWZ5ID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgdmFyIGFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMpO1xuICAgIGFyZ3MudW5zaGlmdCh0aGlzKTtcbiAgICByZXR1cm4gUS5kZW5vZGVpZnkuYXBwbHkodm9pZCAwLCBhcmdzKTtcbn07XG5cblEubmJpbmQgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIHRoaXNwIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIGJhc2VBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAyKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbm9kZUFyZ3MgPSBiYXNlQXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSk7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICAgICAgZnVuY3Rpb24gYm91bmQoKSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2suYXBwbHkodGhpc3AsIGFyZ3VtZW50cyk7XG4gICAgICAgIH1cbiAgICAgICAgUShib3VuZCkuZmFwcGx5KG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5uYmluZCA9IGZ1bmN0aW9uICgvKnRoaXNwLCAuLi5hcmdzKi8pIHtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMCk7XG4gICAgYXJncy51bnNoaWZ0KHRoaXMpO1xuICAgIHJldHVybiBRLm5iaW5kLmFwcGx5KHZvaWQgMCwgYXJncyk7XG59O1xuXG4vKipcbiAqIENhbGxzIGEgbWV0aG9kIG9mIGEgTm9kZS1zdHlsZSBvYmplY3QgdGhhdCBhY2NlcHRzIGEgTm9kZS1zdHlsZVxuICogY2FsbGJhY2sgd2l0aCBhIGdpdmVuIGFycmF5IG9mIGFyZ3VtZW50cywgcGx1cyBhIHByb3ZpZGVkIGNhbGxiYWNrLlxuICogQHBhcmFtIG9iamVjdCBhbiBvYmplY3QgdGhhdCBoYXMgdGhlIG5hbWVkIG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgbmFtZSBvZiB0aGUgbWV0aG9kIG9mIG9iamVjdFxuICogQHBhcmFtIHtBcnJheX0gYXJncyBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgbWV0aG9kOyB0aGUgY2FsbGJhY2tcbiAqIHdpbGwgYmUgcHJvdmlkZWQgYnkgUSBhbmQgYXBwZW5kZWQgdG8gdGhlc2UgYXJndW1lbnRzLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgdmFsdWUgb3IgZXJyb3JcbiAqL1xuUS5ubWFwcGx5ID0gLy8gWFhYIEFzIHByb3Bvc2VkIGJ5IFwiUmVkc2FuZHJvXCJcblEubnBvc3QgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lLCBhcmdzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5ucG9zdChuYW1lLCBhcmdzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUHJvbWlzZS5wcm90b3R5cGUubnBvc3QgPSBmdW5jdGlvbiAobmFtZSwgYXJncykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3MgfHwgW10pO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBub2RlQXJnc10pLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogQ2FsbHMgYSBtZXRob2Qgb2YgYSBOb2RlLXN0eWxlIG9iamVjdCB0aGF0IGFjY2VwdHMgYSBOb2RlLXN0eWxlXG4gKiBjYWxsYmFjaywgZm9yd2FyZGluZyB0aGUgZ2l2ZW4gdmFyaWFkaWMgYXJndW1lbnRzLCBwbHVzIGEgcHJvdmlkZWRcbiAqIGNhbGxiYWNrIGFyZ3VtZW50LlxuICogQHBhcmFtIG9iamVjdCBhbiBvYmplY3QgdGhhdCBoYXMgdGhlIG5hbWVkIG1ldGhvZFxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgbmFtZSBvZiB0aGUgbWV0aG9kIG9mIG9iamVjdFxuICogQHBhcmFtIC4uLmFyZ3MgYXJndW1lbnRzIHRvIHBhc3MgdG8gdGhlIG1ldGhvZDsgdGhlIGNhbGxiYWNrIHdpbGxcbiAqIGJlIHByb3ZpZGVkIGJ5IFEgYW5kIGFwcGVuZGVkIHRvIHRoZXNlIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHZhbHVlIG9yIGVycm9yXG4gKi9cblEubnNlbmQgPSAvLyBYWFggQmFzZWQgb24gTWFyayBNaWxsZXIncyBwcm9wb3NlZCBcInNlbmRcIlxuUS5ubWNhbGwgPSAvLyBYWFggQmFzZWQgb24gXCJSZWRzYW5kcm8nc1wiIHByb3Bvc2FsXG5RLm5pbnZva2UgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAyKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICBRKG9iamVjdCkuZGlzcGF0Y2goXCJwb3N0XCIsIFtuYW1lLCBub2RlQXJnc10pLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5zZW5kID0gLy8gWFhYIEJhc2VkIG9uIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgXCJzZW5kXCJcblByb21pc2UucHJvdG90eXBlLm5tY2FsbCA9IC8vIFhYWCBCYXNlZCBvbiBcIlJlZHNhbmRybydzXCIgcHJvcG9zYWxcblByb21pc2UucHJvdG90eXBlLm5pbnZva2UgPSBmdW5jdGlvbiAobmFtZSAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIG5vZGVBcmdzXSkuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBJZiBhIGZ1bmN0aW9uIHdvdWxkIGxpa2UgdG8gc3VwcG9ydCBib3RoIE5vZGUgY29udGludWF0aW9uLXBhc3Npbmctc3R5bGUgYW5kXG4gKiBwcm9taXNlLXJldHVybmluZy1zdHlsZSwgaXQgY2FuIGVuZCBpdHMgaW50ZXJuYWwgcHJvbWlzZSBjaGFpbiB3aXRoXG4gKiBgbm9kZWlmeShub2RlYmFjaylgLCBmb3J3YXJkaW5nIHRoZSBvcHRpb25hbCBub2RlYmFjayBhcmd1bWVudC4gIElmIHRoZSB1c2VyXG4gKiBlbGVjdHMgdG8gdXNlIGEgbm9kZWJhY2ssIHRoZSByZXN1bHQgd2lsbCBiZSBzZW50IHRoZXJlLiAgSWYgdGhleSBkbyBub3RcbiAqIHBhc3MgYSBub2RlYmFjaywgdGhleSB3aWxsIHJlY2VpdmUgdGhlIHJlc3VsdCBwcm9taXNlLlxuICogQHBhcmFtIG9iamVjdCBhIHJlc3VsdCAob3IgYSBwcm9taXNlIGZvciBhIHJlc3VsdClcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG5vZGViYWNrIGEgTm9kZS5qcy1zdHlsZSBjYWxsYmFja1xuICogQHJldHVybnMgZWl0aGVyIHRoZSBwcm9taXNlIG9yIG5vdGhpbmdcbiAqL1xuUS5ub2RlaWZ5ID0gbm9kZWlmeTtcbmZ1bmN0aW9uIG5vZGVpZnkob2JqZWN0LCBub2RlYmFjaykge1xuICAgIHJldHVybiBRKG9iamVjdCkubm9kZWlmeShub2RlYmFjayk7XG59XG5cblByb21pc2UucHJvdG90eXBlLm5vZGVpZnkgPSBmdW5jdGlvbiAobm9kZWJhY2spIHtcbiAgICBpZiAobm9kZWJhY2spIHtcbiAgICAgICAgdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbm9kZWJhY2sobnVsbCwgdmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbm9kZWJhY2soZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn07XG5cblEubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlEubm9Db25mbGljdCBvbmx5IHdvcmtzIHdoZW4gUSBpcyB1c2VkIGFzIGEgZ2xvYmFsXCIpO1xufTtcblxuLy8gQWxsIGNvZGUgYmVmb3JlIHRoaXMgcG9pbnQgd2lsbCBiZSBmaWx0ZXJlZCBmcm9tIHN0YWNrIHRyYWNlcy5cbnZhciBxRW5kaW5nTGluZSA9IGNhcHR1cmVMaW5lKCk7XG5cbnJldHVybiBRO1xuXG59KTtcbiIsIi8vIENvcHlyaWdodCAyMDEzLTIwMTQgS2V2aW4gQ294XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4qICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgVGhpcyBzb2Z0d2FyZSBpcyBwcm92aWRlZCAnYXMtaXMnLCB3aXRob3V0IGFueSBleHByZXNzIG9yIGltcGxpZWQgICAgICAgICAgICpcbiogIHdhcnJhbnR5LiBJbiBubyBldmVudCB3aWxsIHRoZSBhdXRob3JzIGJlIGhlbGQgbGlhYmxlIGZvciBhbnkgZGFtYWdlcyAgICAgICAqXG4qICBhcmlzaW5nIGZyb20gdGhlIHVzZSBvZiB0aGlzIHNvZnR3YXJlLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiogIFBlcm1pc3Npb24gaXMgZ3JhbnRlZCB0byBhbnlvbmUgdG8gdXNlIHRoaXMgc29mdHdhcmUgZm9yIGFueSBwdXJwb3NlLCAgICAgICAqXG4qICBpbmNsdWRpbmcgY29tbWVyY2lhbCBhcHBsaWNhdGlvbnMsIGFuZCB0byBhbHRlciBpdCBhbmQgcmVkaXN0cmlidXRlIGl0ICAgICAgKlxuKiAgZnJlZWx5LCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgcmVzdHJpY3Rpb25zOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4qICAxLiBUaGUgb3JpZ2luIG9mIHRoaXMgc29mdHdhcmUgbXVzdCBub3QgYmUgbWlzcmVwcmVzZW50ZWQ7IHlvdSBtdXN0IG5vdCAgICAgKlxuKiAgICAgY2xhaW0gdGhhdCB5b3Ugd3JvdGUgdGhlIG9yaWdpbmFsIHNvZnR3YXJlLiBJZiB5b3UgdXNlIHRoaXMgc29mdHdhcmUgaW4gICpcbiogICAgIGEgcHJvZHVjdCwgYW4gYWNrbm93bGVkZ21lbnQgaW4gdGhlIHByb2R1Y3QgZG9jdW1lbnRhdGlvbiB3b3VsZCBiZSAgICAgICAqXG4qICAgICBhcHByZWNpYXRlZCBidXQgaXMgbm90IHJlcXVpcmVkLiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiogIDIuIEFsdGVyZWQgc291cmNlIHZlcnNpb25zIG11c3QgYmUgcGxhaW5seSBtYXJrZWQgYXMgc3VjaCwgYW5kIG11c3Qgbm90IGJlICAqXG4qICAgICBtaXNyZXByZXNlbnRlZCBhcyBiZWluZyB0aGUgb3JpZ2luYWwgc29mdHdhcmUuICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiogIDMuIFRoaXMgbm90aWNlIG1heSBub3QgYmUgcmVtb3ZlZCBvciBhbHRlcmVkIGZyb20gYW55IHNvdXJjZSBkaXN0cmlidXRpb24uICAqXG4qICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuK2Z1bmN0aW9uKCl7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGFycmF5ID0gL1xcWyhbXlxcW10qKVxcXSQvO1xuXG4vLy8gVVJMIFJlZ2V4LlxuLyoqXG4gKiBUaGlzIHJlZ2V4IHNwbGl0cyB0aGUgVVJMIGludG8gcGFydHMuICBUaGUgY2FwdHVyZSBncm91cHMgY2F0Y2ggdGhlIGltcG9ydGFudFxuICogYml0cy5cbiAqIFxuICogRWFjaCBzZWN0aW9uIGlzIG9wdGlvbmFsLCBzbyB0byB3b3JrIG9uIGFueSBwYXJ0IGZpbmQgdGhlIGNvcnJlY3QgdG9wIGxldmVsXG4gKiBgKC4uLik/YCBhbmQgbWVzcyBhcm91bmQgd2l0aCBpdC5cbiAqL1xudmFyIHJlZ2V4ID0gL14oPzooW2Etel0qKTopPyg/OlxcL1xcLyk/KD86KFteOkBdKikoPzo6KFteQF0qKSk/QCk/KFthLXotLl9dKyk/KD86OihbMC05XSopKT8oXFwvW14/I10qKT8oPzpcXD8oW14jXSopKT8oPzojKC4qKSk/JC9pO1xuLy8gICAgICAgICAgICAgICAxIC0gc2NoZW1lICAgICAgICAgICAgICAgIDIgLSB1c2VyICAgIDMgPSBwYXNzIDQgLSBob3N0ICAgICAgICA1IC0gcG9ydCAgNiAtIHBhdGggICAgICAgIDcgLSBxdWVyeSAgICA4IC0gaGFzaFxuXG52YXIgbm9zbGFzaCA9IFtcIm1haWx0b1wiLFwiYml0Y29pblwiXTtcblxudmFyIHNlbGYgPSB7XG5cdC8qKiBQYXJzZSBhIHF1ZXJ5IHN0cmluZy5cblx0ICpcblx0ICogVGhpcyBmdW5jdGlvbiBwYXJzZXMgYSBxdWVyeSBzdHJpbmcgKHNvbWV0aW1lcyBjYWxsZWQgdGhlIHNlYXJjaFxuXHQgKiBzdHJpbmcpLiAgSXQgdGFrZXMgYSBxdWVyeSBzdHJpbmcgYW5kIHJldHVybnMgYSBtYXAgb2YgdGhlIHJlc3VsdHMuXG5cdCAqXG5cdCAqIEtleXMgYXJlIGNvbnNpZGVyZWQgdG8gYmUgZXZlcnl0aGluZyB1cCB0byB0aGUgZmlyc3QgJz0nIGFuZCB2YWx1ZXMgYXJlXG5cdCAqIGV2ZXJ5dGhpbmcgYWZ0ZXJ3b3Jkcy4gIFNpbmNlIFVSTC1kZWNvZGluZyBpcyBkb25lIGFmdGVyIHBhcnNpbmcsIGtleXNcblx0ICogYW5kIHZhbHVlcyBjYW4gaGF2ZSBhbnkgdmFsdWVzLCBob3dldmVyLCAnPScgaGF2ZSB0byBiZSBlbmNvZGVkIGluIGtleXNcblx0ICogd2hpbGUgJz8nIGFuZCAnJicgaGF2ZSB0byBiZSBlbmNvZGVkIGFueXdoZXJlIChhcyB0aGV5IGRlbGltaXQgdGhlXG5cdCAqIGt2LXBhaXJzKS5cblx0ICpcblx0ICogS2V5cyBhbmQgdmFsdWVzIHdpbGwgYWx3YXlzIGJlIHN0cmluZ3MsIGV4Y2VwdCBpZiB0aGVyZSBpcyBhIGtleSB3aXRoIG5vXG5cdCAqICc9JyBpbiB3aGljaCBjYXNlIGl0IHdpbGwgYmUgY29uc2lkZXJlZCBhIGZsYWcgYW5kIHdpbGwgYmUgc2V0IHRvIHRydWUuXG5cdCAqIExhdGVyIHZhbHVlcyB3aWxsIG92ZXJyaWRlIGVhcmxpZXIgdmFsdWVzLlxuXHQgKlxuXHQgKiBBcnJheSBrZXlzIGFyZSBhbHNvIHN1cHBvcnRlZC4gIEJ5IGRlZmF1bHQga2V5cyBpbiB0aGUgZm9ybSBvZiBgbmFtZVtpXWBcblx0ICogd2lsbCBiZSByZXR1cm5lZCBsaWtlIHRoYXQgYXMgc3RyaW5ncy4gIEhvd2V2ZXIsIGlmIHlvdSBzZXQgdGhlIGBhcnJheWBcblx0ICogZmxhZyBpbiB0aGUgb3B0aW9ucyBvYmplY3QgdGhleSB3aWxsIGJlIHBhcnNlZCBpbnRvIGFycmF5cy4gIE5vdGUgdGhhdFxuXHQgKiBhbHRob3VnaCB0aGUgb2JqZWN0IHJldHVybmVkIGlzIGFuIGBBcnJheWAgb2JqZWN0IGFsbCBrZXlzIHdpbGwgYmVcblx0ICogd3JpdHRlbiB0byBpdC4gIFRoaXMgbWVhbnMgdGhhdCBpZiB5b3UgaGF2ZSBhIGtleSBzdWNoIGFzIGBrW2ZvckVhY2hdYFxuXHQgKiBpdCB3aWxsIG92ZXJ3cml0ZSB0aGUgYGZvckVhY2hgIGZ1bmN0aW9uIG9uIHRoYXQgYXJyYXkuICBBbHNvIG5vdGUgdGhhdFxuXHQgKiBzdHJpbmcgcHJvcGVydGllcyBhbHdheXMgdGFrZSBwcmVjZWRlbmNlIG92ZXIgYXJyYXkgcHJvcGVydGllcyxcblx0ICogaXJyZXNwZWN0aXZlIG9mIHdoZXJlIHRoZXkgYXJlIGluIHRoZSBxdWVyeSBzdHJpbmcuXG5cdCAqXG5cdCAqICAgdXJsLmdldChcImFycmF5WzFdPXRlc3QmYXJyYXlbZm9vXT1iYXJcIix7YXJyYXk6dHJ1ZX0pLmFycmF5WzFdICA9PT0gXCJ0ZXN0XCJcblx0ICogICB1cmwuZ2V0KFwiYXJyYXlbMV09dGVzdCZhcnJheVtmb29dPWJhclwiLHthcnJheTp0cnVlfSkuYXJyYXkuZm9vID09PSBcImJhclwiXG5cdCAqICAgdXJsLmdldChcImFycmF5PW5vdGFuYXJyYXkmYXJyYXlbMF09MVwiLHthcnJheTp0cnVlfSkuYXJyYXkgICAgICA9PT0gXCJub3RhbmFycmF5XCJcblx0ICpcblx0ICogSWYgYXJyYXkgcGFyc2luZyBpcyBlbmFibGVkIGtleXMgaW4gdGhlIGZvcm0gb2YgYG5hbWVbXWAgd2lsbFxuXHQgKiBhdXRvbWF0aWNhbGx5IGJlIGdpdmVuIHRoZSBuZXh0IGF2YWlsYWJsZSBpbmRleC4gIE5vdGUgdGhhdCB0aGlzIGNhbiBiZVxuXHQgKiBvdmVyd3JpdHRlbiB3aXRoIGxhdGVyIHZhbHVlcyBpbiB0aGUgcXVlcnkgc3RyaW5nLiAgRm9yIHRoaXMgcmVhc29uIGlzXG5cdCAqIGlzIGJlc3Qgbm90IHRvIG1peCB0aGUgdHdvIGZvcm1hdHMsIGFsdGhvdWdoIGl0IGlzIHNhZmUgKGFuZCBvZnRlblxuXHQgKiB1c2VmdWwpIHRvIGFkZCBhbiBhdXRvbWF0aWMgaW5kZXggYXJndW1lbnQgdG8gdGhlIGVuZCBvZiBhIHF1ZXJ5IHN0cmluZy5cblx0ICpcblx0ICogICB1cmwuZ2V0KFwiYVtdPTAmYVtdPTEmYVswXT0yXCIsIHthcnJheTp0cnVlfSkgIC0+IHthOltcIjJcIixcIjFcIl19O1xuXHQgKiAgIHVybC5nZXQoXCJhWzBdPTAmYVsxXT0xJmFbXT0yXCIsIHthcnJheTp0cnVlfSkgLT4ge2E6W1wiMFwiLFwiMVwiLFwiMlwiXX07XG5cdCAqXG5cdCAqIEBwYXJhbXtzdHJpbmd9IHEgVGhlIHF1ZXJ5IHN0cmluZyAodGhlIHBhcnQgYWZ0ZXIgdGhlICc/JykuXG5cdCAqIEBwYXJhbXt7ZnVsbDpib29sZWFuLGFycmF5OmJvb2xlYW59PX0gb3B0IE9wdGlvbnMuXG5cdCAqXG5cdCAqIC0gZnVsbDogSWYgc2V0IGBxYCB3aWxsIGJlIHRyZWF0ZWQgYXMgYSBmdWxsIHVybCBhbmQgYHFgIHdpbGwgYmUgYnVpbHQuXG5cdCAqICAgYnkgY2FsbGluZyAjcGFyc2UgdG8gcmV0cmlldmUgdGhlIHF1ZXJ5IHBvcnRpb24uXG5cdCAqIC0gYXJyYXk6IElmIHNldCBrZXlzIGluIHRoZSBmb3JtIG9mIGBrZXlbaV1gIHdpbGwgYmUgdHJlYXRlZFxuXHQgKiAgIGFzIGFycmF5cy9tYXBzLlxuXHQgKlxuXHQgKiBAcmV0dXJueyFPYmplY3QuPHN0cmluZywgc3RyaW5nfEFycmF5Pn0gVGhlIHBhcnNlZCByZXN1bHQuXG5cdCAqL1xuXHRcImdldFwiOiBmdW5jdGlvbihxLCBvcHQpe1xuXHRcdHEgPSBxIHx8IFwiXCI7XG5cdFx0aWYgKCB0eXBlb2Ygb3B0ICAgICAgICAgID09IFwidW5kZWZpbmVkXCIgKSBvcHQgPSB7fTtcblx0XHRpZiAoIHR5cGVvZiBvcHRbXCJmdWxsXCJdICA9PSBcInVuZGVmaW5lZFwiICkgb3B0W1wiZnVsbFwiXSA9IGZhbHNlO1xuXHRcdGlmICggdHlwZW9mIG9wdFtcImFycmF5XCJdID09IFwidW5kZWZpbmVkXCIgKSBvcHRbXCJhcnJheVwiXSA9IGZhbHNlO1xuXHRcdFxuXHRcdGlmICggb3B0W1wiZnVsbFwiXSA9PT0gdHJ1ZSApXG5cdFx0e1xuXHRcdFx0cSA9IHNlbGZbXCJwYXJzZVwiXShxLCB7XCJnZXRcIjpmYWxzZX0pW1wicXVlcnlcIl0gfHwgXCJcIjtcblx0XHR9XG5cdFx0XG5cdFx0dmFyIG8gPSB7fTtcblx0XHRcblx0XHR2YXIgYyA9IHEuc3BsaXQoXCImXCIpO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYy5sZW5ndGg7IGkrKylcblx0XHR7XG5cdFx0XHRpZiAoIWNbaV0ubGVuZ3RoKSBjb250aW51ZTtcblx0XHRcdFxuXHRcdFx0dmFyIGQgPSBjW2ldLmluZGV4T2YoXCI9XCIpO1xuXHRcdFx0dmFyIGsgPSBjW2ldLCB2ID0gdHJ1ZTtcblx0XHRcdGlmICggZCA+PSAwIClcblx0XHRcdHtcblx0XHRcdFx0ayA9IGNbaV0uc3Vic3RyKDAsIGQpO1xuXHRcdFx0XHR2ID0gY1tpXS5zdWJzdHIoZCsxKTtcblx0XHRcdFx0XG5cdFx0XHRcdHYgPSBkZWNvZGVVUklDb21wb25lbnQodik7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGlmIChvcHRbXCJhcnJheVwiXSlcblx0XHRcdHtcblx0XHRcdFx0dmFyIGluZHMgPSBbXTtcblx0XHRcdFx0dmFyIGluZDtcblx0XHRcdFx0dmFyIGN1cm8gPSBvO1xuXHRcdFx0XHR2YXIgY3VyayA9IGs7XG5cdFx0XHRcdHdoaWxlIChpbmQgPSBjdXJrLm1hdGNoKGFycmF5KSkgLy8gQXJyYXkhXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjdXJrID0gY3Vyay5zdWJzdHIoMCwgaW5kLmluZGV4KTtcblx0XHRcdFx0XHRpbmRzLnVuc2hpZnQoZGVjb2RlVVJJQ29tcG9uZW50KGluZFsxXSkpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGN1cmsgPSBkZWNvZGVVUklDb21wb25lbnQoY3Vyayk7XG5cdFx0XHRcdGlmIChpbmRzLnNvbWUoZnVuY3Rpb24oaSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmICggdHlwZW9mIGN1cm9bY3Vya10gPT0gXCJ1bmRlZmluZWRcIiApIGN1cm9bY3Vya10gPSBbXTtcblx0XHRcdFx0XHRpZiAoIUFycmF5LmlzQXJyYXkoY3Vyb1tjdXJrXSkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhcInVybC5nZXQ6IEFycmF5IHByb3BlcnR5IFwiK2N1cmsrXCIgYWxyZWFkeSBleGlzdHMgYXMgc3RyaW5nIVwiKTtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcblx0XHRcdFx0XHRjdXJvID0gY3Vyb1tjdXJrXTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRpZiAoIGkgPT09IFwiXCIgKSBpID0gY3Vyby5sZW5ndGg7XG5cdFx0XHRcdFx0XG5cdFx0XHRcdFx0Y3VyayA9IGk7XG5cdFx0XHRcdH0pKSBjb250aW51ZTtcblx0XHRcdFx0Y3Vyb1tjdXJrXSA9IHY7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXHRcdFx0XG5cdFx0XHRrID0gZGVjb2RlVVJJQ29tcG9uZW50KGspO1xuXHRcdFx0XG5cdFx0XHQvL3R5cGVvZiBvW2tdID09IFwidW5kZWZpbmVkXCIgfHwgY29uc29sZS5sb2coXCJQcm9wZXJ0eSBcIitrK1wiIGFscmVhZHkgZXhpc3RzIVwiKTtcblx0XHRcdG9ba10gPSB2O1xuXHRcdH1cblx0XHRcblx0XHRyZXR1cm4gbztcblx0fSxcblx0XG5cdC8qKiBCdWlsZCBhIGdldCBxdWVyeSBmcm9tIGFuIG9iamVjdC5cblx0ICpcblx0ICogVGhpcyBjb25zdHJ1Y3RzIGEgcXVlcnkgc3RyaW5nIGZyb20gdGhlIGt2IHBhaXJzIGluIGBkYXRhYC4gIENhbGxpbmdcblx0ICogI2dldCBvbiB0aGUgc3RyaW5nIHJldHVybmVkIHNob3VsZCByZXR1cm4gYW4gb2JqZWN0IGlkZW50aWNhbCB0byB0aGUgb25lXG5cdCAqIHBhc3NlZCBpbiBleGNlcHQgYWxsIG5vbi1ib29sZWFuIHNjYWxhciB0eXBlcyBiZWNvbWUgc3RyaW5ncyBhbmQgYWxsXG5cdCAqIG9iamVjdCB0eXBlcyBiZWNvbWUgYXJyYXlzIChub24taW50ZWdlciBrZXlzIGFyZSBzdGlsbCBwcmVzZW50LCBzZWVcblx0ICogI2dldCdzIGRvY3VtZW50YXRpb24gZm9yIG1vcmUgZGV0YWlscykuXG5cdCAqXG5cdCAqIFRoaXMgYWx3YXlzIHVzZXMgYXJyYXkgc3ludGF4IGZvciBkZXNjcmliaW5nIGFycmF5cy4gIElmIHlvdSB3YW50IHRvXG5cdCAqIHNlcmlhbGl6ZSB0aGVtIGRpZmZlcmVudGx5IChsaWtlIGhhdmluZyB0aGUgdmFsdWUgYmUgYSBKU09OIGFycmF5IGFuZFxuXHQgKiBoYXZlIGEgcGxhaW4ga2V5KSB5b3Ugd2lsbCBuZWVkIHRvIGRvIHRoYXQgYmVmb3JlIHBhc3NpbmcgaXQgaW4uXG5cdCAqXG5cdCAqIEFsbCBrZXlzIGFuZCB2YWx1ZXMgYXJlIHN1cHBvcnRlZCAoYmluYXJ5IGRhdGEgYW55b25lPykgYXMgdGhleSBhcmVcblx0ICogcHJvcGVybHkgVVJMLWVuY29kZWQgYW5kICNnZXQgcHJvcGVybHkgZGVjb2Rlcy5cblx0ICpcblx0ICogQHBhcmFte09iamVjdH0gZGF0YSBUaGUga3YgcGFpcnMuXG5cdCAqIEBwYXJhbXtzdHJpbmd9IHByZWZpeCBUaGUgcHJvcGVybHkgZW5jb2RlZCBhcnJheSBrZXkgdG8gcHV0IHRoZVxuXHQgKiAgIHByb3BlcnRpZXMuICBNYWlubHkgaW50ZW5kZWQgZm9yIGludGVybmFsIHVzZS5cblx0ICogQHJldHVybntzdHJpbmd9IEEgVVJMLXNhZmUgc3RyaW5nLlxuXHQgKi9cblx0XCJidWlsZGdldFwiOiBmdW5jdGlvbihkYXRhLCBwcmVmaXgpe1xuXHRcdHZhciBpdG1zID0gW107XG5cdFx0Zm9yICggdmFyIGsgaW4gZGF0YSApXG5cdFx0e1xuXHRcdFx0dmFyIGVrID0gZW5jb2RlVVJJQ29tcG9uZW50KGspO1xuXHRcdFx0aWYgKCB0eXBlb2YgcHJlZml4ICE9IFwidW5kZWZpbmVkXCIgKVxuXHRcdFx0XHRlayA9IHByZWZpeCtcIltcIitlaytcIl1cIjtcblx0XHRcdFxuXHRcdFx0dmFyIHYgPSBkYXRhW2tdO1xuXHRcdFx0XG5cdFx0XHRzd2l0Y2ggKHR5cGVvZiB2KVxuXHRcdFx0e1xuXHRcdFx0XHRjYXNlICdib29sZWFuJzpcblx0XHRcdFx0XHRpZih2KSBpdG1zLnB1c2goZWspO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICdudW1iZXInOlxuXHRcdFx0XHRcdHYgPSB2LnRvU3RyaW5nKCk7XG5cdFx0XHRcdGNhc2UgJ3N0cmluZyc6XG5cdFx0XHRcdFx0aXRtcy5wdXNoKGVrK1wiPVwiK2VuY29kZVVSSUNvbXBvbmVudCh2KSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ29iamVjdCc6XG5cdFx0XHRcdFx0aXRtcy5wdXNoKHNlbGZbXCJidWlsZGdldFwiXSh2LCBlaykpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gaXRtcy5qb2luKFwiJlwiKTtcblx0fSxcblx0XG5cdC8qKiBQYXJzZSBhIFVSTFxuXHQgKiBcblx0ICogVGhpcyBicmVha3MgdXAgYSBVUkwgaW50byBjb21wb25lbnRzLiAgSXQgYXR0ZW1wdHMgdG8gYmUgdmVyeSBsaWJlcmFsXG5cdCAqIGFuZCByZXR1cm5zIHRoZSBiZXN0IHJlc3VsdCBpbiBtb3N0IGNhc2VzLiAgVGhpcyBtZWFucyB0aGF0IHlvdSBjYW5cblx0ICogb2Z0ZW4gcGFzcyBpbiBwYXJ0IG9mIGEgVVJMIGFuZCBnZXQgY29ycmVjdCBjYXRlZ29yaWVzIGJhY2suICBOb3RhYmx5LFxuXHQgKiB0aGlzIHdvcmtzIGZvciBlbWFpbHMgYW5kIEphYmJlciBJRHMsIGFzIHdlbGwgYXMgYWRkaW5nIGEgJz8nIHRvIHRoZVxuXHQgKiBiZWdpbm5pbmcgb2YgYSBzdHJpbmcgd2lsbCBwYXJzZSB0aGUgd2hvbGUgdGhpbmcgYXMgYSBxdWVyeSBzdHJpbmcuICBJZlxuXHQgKiBhbiBpdGVtIGlzIG5vdCBmb3VuZCB0aGUgcHJvcGVydHkgd2lsbCBiZSB1bmRlZmluZWQuICBJbiBzb21lIGNhc2VzIGFuXG5cdCAqIGVtcHR5IHN0cmluZyB3aWxsIGJlIHJldHVybmVkIGlmIHRoZSBzdXJyb3VuZGluZyBzeW50YXggYnV0IHRoZSBhY3R1YWxcblx0ICogdmFsdWUgaXMgZW1wdHkgKGV4YW1wbGU6IFwiOi8vZXhhbXBsZS5jb21cIiB3aWxsIGdpdmUgYSBlbXB0eSBzdHJpbmcgZm9yXG5cdCAqIHNjaGVtZS4pICBOb3RhYmx5IHRoZSBob3N0IG5hbWUgd2lsbCBhbHdheXMgYmUgc2V0IHRvIHNvbWV0aGluZy5cblx0ICogXG5cdCAqIFJldHVybmVkIHByb3BlcnRpZXMuXG5cdCAqIFxuXHQgKiAtICoqc2NoZW1lOioqIFRoZSB1cmwgc2NoZW1lLiAoZXg6IFwibWFpbHRvXCIgb3IgXCJodHRwc1wiKVxuXHQgKiAtICoqdXNlcjoqKiBUaGUgdXNlcm5hbWUuXG5cdCAqIC0gKipwYXNzOioqIFRoZSBwYXNzd29yZC5cblx0ICogLSAqKmhvc3Q6KiogVGhlIGhvc3RuYW1lLiAoZXg6IFwibG9jYWxob3N0XCIsIFwiMTIzLjQ1Ni43LjhcIiBvciBcImV4YW1wbGUuY29tXCIpXG5cdCAqIC0gKipwb3J0OioqIFRoZSBwb3J0LCBhcyBhIG51bWJlci4gKGV4OiAxMzM3KVxuXHQgKiAtICoqcGF0aDoqKiBUaGUgcGF0aC4gKGV4OiBcIi9cIiBvciBcIi9hYm91dC5odG1sXCIpXG5cdCAqIC0gKipxdWVyeToqKiBcIlRoZSBxdWVyeSBzdHJpbmcuIChleDogXCJmb289YmFyJnY9MTcmZm9ybWF0PWpzb25cIilcblx0ICogLSAqKmdldDoqKiBUaGUgcXVlcnkgc3RyaW5nIHBhcnNlZCB3aXRoIGdldC4gIElmIGBvcHQuZ2V0YCBpcyBgZmFsc2VgIHRoaXNcblx0ICogICB3aWxsIGJlIGFic2VudFxuXHQgKiAtICoqaGFzaDoqKiBUaGUgdmFsdWUgYWZ0ZXIgdGhlIGhhc2guIChleDogXCJteWFuY2hvclwiKVxuXHQgKiAgIGJlIHVuZGVmaW5lZCBldmVuIGlmIGBxdWVyeWAgaXMgc2V0LlxuXHQgKlxuXHQgKiBAcGFyYW17c3RyaW5nfSB1cmwgVGhlIFVSTCB0byBwYXJzZS5cblx0ICogQHBhcmFte3tnZXQ6T2JqZWN0fT19IG9wdCBPcHRpb25zOlxuXHQgKlxuXHQgKiAtIGdldDogQW4gb3B0aW9ucyBhcmd1bWVudCB0byBiZSBwYXNzZWQgdG8gI2dldCBvciBmYWxzZSB0byBub3QgY2FsbCAjZ2V0LlxuXHQgKiAgICAqKkRPIE5PVCoqIHNldCBgZnVsbGAuXG5cdCAqXG5cdCAqIEByZXR1cm57IU9iamVjdH0gQW4gb2JqZWN0IHdpdGggdGhlIHBhcnNlZCB2YWx1ZXMuXG5cdCAqL1xuXHRcInBhcnNlXCI6IGZ1bmN0aW9uKHVybCwgb3B0KSB7XG5cdFx0XG5cdFx0aWYgKCB0eXBlb2Ygb3B0ID09IFwidW5kZWZpbmVkXCIgKSBvcHQgPSB7fTtcblx0XHRcblx0XHR2YXIgbWQgPSB1cmwubWF0Y2gocmVnZXgpIHx8IFtdO1xuXHRcdFxuXHRcdHZhciByID0ge1xuXHRcdFx0XCJ1cmxcIjogICAgdXJsLFxuXHRcdFx0XG5cdFx0XHRcInNjaGVtZVwiOiBtZFsxXSxcblx0XHRcdFwidXNlclwiOiAgIG1kWzJdLFxuXHRcdFx0XCJwYXNzXCI6ICAgbWRbM10sXG5cdFx0XHRcImhvc3RcIjogICBtZFs0XSxcblx0XHRcdFwicG9ydFwiOiAgIG1kWzVdICYmICttZFs1XSxcblx0XHRcdFwicGF0aFwiOiAgIG1kWzZdLFxuXHRcdFx0XCJxdWVyeVwiOiAgbWRbN10sXG5cdFx0XHRcImhhc2hcIjogICBtZFs4XSxcblx0XHR9O1xuXHRcdFxuXHRcdGlmICggb3B0LmdldCAhPT0gZmFsc2UgKVxuXHRcdFx0cltcImdldFwiXSA9IHJbXCJxdWVyeVwiXSAmJiBzZWxmW1wiZ2V0XCJdKHJbXCJxdWVyeVwiXSwgb3B0LmdldCk7XG5cdFx0XG5cdFx0cmV0dXJuIHI7XG5cdH0sXG5cdFxuXHQvKiogQnVpbGQgYSBVUkwgZnJvbSBjb21wb25lbnRzLlxuXHQgKiBcblx0ICogVGhpcyBwaWVjZXMgdG9nZXRoZXIgYSB1cmwgZnJvbSB0aGUgcHJvcGVydGllcyBvZiB0aGUgcGFzc2VkIGluIG9iamVjdC5cblx0ICogSW4gZ2VuZXJhbCBwYXNzaW5nIHRoZSByZXN1bHQgb2YgYHBhcnNlKClgIHNob3VsZCByZXR1cm4gdGhlIFVSTC4gIFRoZXJlXG5cdCAqIG1heSBkaWZmZXJlbmNlcyBpbiB0aGUgZ2V0IHN0cmluZyBhcyB0aGUga2V5cyBhbmQgdmFsdWVzIG1pZ2h0IGJlIG1vcmVcblx0ICogZW5jb2RlZCB0aGVuIHRoZXkgd2VyZSBvcmlnaW5hbGx5IHdlcmUuICBIb3dldmVyLCBjYWxsaW5nIGBnZXQoKWAgb24gdGhlXG5cdCAqIHR3byB2YWx1ZXMgc2hvdWxkIHlpZWxkIHRoZSBzYW1lIHJlc3VsdC5cblx0ICogXG5cdCAqIEhlcmUgaXMgaG93IHRoZSBwYXJhbWV0ZXJzIGFyZSB1c2VkLlxuXHQgKiBcblx0ICogIC0gdXJsOiBVc2VkIG9ubHkgaWYgbm8gb3RoZXIgdmFsdWVzIGFyZSBwcm92aWRlZC4gIElmIHRoYXQgaXMgdGhlIGNhc2Vcblx0ICogICAgIGB1cmxgIHdpbGwgYmUgcmV0dXJuZWQgdmVyYmF0aW0uXG5cdCAqICAtIHNjaGVtZTogVXNlZCBpZiBkZWZpbmVkLlxuXHQgKiAgLSB1c2VyOiBVc2VkIGlmIGRlZmluZWQuXG5cdCAqICAtIHBhc3M6IFVzZWQgaWYgZGVmaW5lZC5cblx0ICogIC0gaG9zdDogVXNlZCBpZiBkZWZpbmVkLlxuXHQgKiAgLSBwYXRoOiBVc2VkIGlmIGRlZmluZWQuXG5cdCAqICAtIHF1ZXJ5OiBVc2VkIG9ubHkgaWYgYGdldGAgaXMgbm90IHByb3ZpZGVkIGFuZCBub24tZW1wdHkuXG5cdCAqICAtIGdldDogVXNlZCBpZiBub24tZW1wdHkuICBQYXNzZWQgdG8gI2J1aWxkZ2V0IGFuZCB0aGUgcmVzdWx0IGlzIHVzZWRcblx0ICogICAgYXMgdGhlIHF1ZXJ5IHN0cmluZy5cblx0ICogIC0gaGFzaDogVXNlZCBpZiBkZWZpbmVkLlxuXHQgKiBcblx0ICogVGhlc2UgYXJlIHRoZSBvcHRpb25zIHRoYXQgYXJlIHZhbGlkIG9uIHRoZSBvcHRpb25zIG9iamVjdC5cblx0ICogXG5cdCAqICAtIHVzZWVtcHR5Z2V0OiBJZiB0cnV0aHksIGEgcXVlc3Rpb24gbWFyayB3aWxsIGJlIGFwcGVuZGVkIGZvciBlbXB0eSBnZXRcblx0ICogICAgc3RyaW5ncy4gIFRoaXMgbm90YWJseSBtYWtlcyBgYnVpbGQoKWAgYW5kIGBwYXJzZSgpYCBmdWxseSBzeW1tZXRyaWMuXG5cdCAqXG5cdCAqIEBwYXJhbXtPYmplY3R9IGRhdGEgVGhlIHBpZWNlcyBvZiB0aGUgVVJMLlxuXHQgKiBAcGFyYW17T2JqZWN0fSBvcHQgT3B0aW9ucyBmb3IgYnVpbGRpbmcgdGhlIHVybC5cblx0ICogQHJldHVybntzdHJpbmd9IFRoZSBVUkwuXG5cdCAqL1xuXHRcImJ1aWxkXCI6IGZ1bmN0aW9uKGRhdGEsIG9wdCl7XG5cdFx0b3B0ID0gb3B0IHx8IHt9O1xuXHRcdFxuXHRcdHZhciByID0gXCJcIjtcblx0XHRcblx0XHRpZiAoIHR5cGVvZiBkYXRhW1wic2NoZW1lXCJdICE9IFwidW5kZWZpbmVkXCIgKVxuXHRcdHtcblx0XHRcdHIgKz0gZGF0YVtcInNjaGVtZVwiXTtcblx0XHRcdHIgKz0gKG5vc2xhc2guaW5kZXhPZihkYXRhW1wic2NoZW1lXCJdKT49MCk/XCI6XCI6XCI6Ly9cIjtcblx0XHR9XG5cdFx0aWYgKCB0eXBlb2YgZGF0YVtcInVzZXJcIl0gIT0gXCJ1bmRlZmluZWRcIiApXG5cdFx0e1xuXHRcdFx0ciArPSBkYXRhW1widXNlclwiXTtcblx0XHRcdGlmICggdHlwZW9mIGRhdGFbXCJwYXNzXCJdID09IFwidW5kZWZpbmVkXCIgKVxuXHRcdFx0e1xuXHRcdFx0XHRyICs9IFwiQFwiO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAoIHR5cGVvZiBkYXRhW1wicGFzc1wiXSAhPSBcInVuZGVmaW5lZFwiICkgciArPSBcIjpcIiArIGRhdGFbXCJwYXNzXCJdICsgXCJAXCI7XG5cdFx0aWYgKCB0eXBlb2YgZGF0YVtcImhvc3RcIl0gIT0gXCJ1bmRlZmluZWRcIiApIHIgKz0gZGF0YVtcImhvc3RcIl07XG5cdFx0aWYgKCB0eXBlb2YgZGF0YVtcInBvcnRcIl0gIT0gXCJ1bmRlZmluZWRcIiApIHIgKz0gXCI6XCIgKyBkYXRhW1wicG9ydFwiXTtcblx0XHRpZiAoIHR5cGVvZiBkYXRhW1wicGF0aFwiXSAhPSBcInVuZGVmaW5lZFwiICkgciArPSBkYXRhW1wicGF0aFwiXTtcblx0XHRcblx0XHRpZiAob3B0W1widXNlZW1wdHlnZXRcIl0pXG5cdFx0e1xuXHRcdFx0aWYgICAgICAoIHR5cGVvZiBkYXRhW1wiZ2V0XCJdICAgIT0gXCJ1bmRlZmluZWRcIiApIHIgKz0gXCI/XCIgKyBzZWxmW1wiYnVpbGRnZXRcIl0oZGF0YVtcImdldFwiXSk7XG5cdFx0XHRlbHNlIGlmICggdHlwZW9mIGRhdGFbXCJxdWVyeVwiXSAhPSBcInVuZGVmaW5lZFwiICkgciArPSBcIj9cIiArIGRhdGFbXCJxdWVyeVwiXTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdC8vIElmIC5nZXQgdXNlIGl0LiAgSWYgLmdldCBsZWFkcyB0byBlbXB0eSwgdXNlIC5xdWVyeS5cblx0XHRcdHZhciBxID0gZGF0YVtcImdldFwiXSAmJiBzZWxmW1wiYnVpbGRnZXRcIl0oZGF0YVtcImdldFwiXSkgfHwgZGF0YVtcInF1ZXJ5XCJdO1xuXHRcdFx0aWYgKHEpIHIgKz0gXCI/XCIgKyBxO1xuXHRcdH1cblx0XHRcblx0XHRpZiAoIHR5cGVvZiBkYXRhW1wiaGFzaFwiXSAhPSBcInVuZGVmaW5lZFwiICkgciArPSBcIiNcIiArIGRhdGFbXCJoYXNoXCJdO1xuXHRcdFxuXHRcdHJldHVybiByIHx8IGRhdGFbXCJ1cmxcIl0gfHwgXCJcIjtcblx0fSxcbn07XG5cbmlmICggdHlwZW9mIGRlZmluZSAhPSBcInVuZGVmaW5lZFwiICYmIGRlZmluZVtcImFtZFwiXSApIGRlZmluZShzZWxmKTtcbmVsc2UgaWYgKCB0eXBlb2YgbW9kdWxlICE9IFwidW5kZWZpbmVkXCIgKSBtb2R1bGVbJ2V4cG9ydHMnXSA9IHNlbGY7XG5lbHNlIHdpbmRvd1tcInVybFwiXSA9IHNlbGY7XG5cbn0oKTtcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0aWYgKCEobW9kdWxlSWQgaW4gX193ZWJwYWNrX21vZHVsZXNfXykpIHtcblx0XHRkZWxldGUgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0XHR2YXIgZSA9IG5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIgKyBtb2R1bGVJZCArIFwiJ1wiKTtcblx0XHRlLmNvZGUgPSAnTU9EVUxFX05PVF9GT1VORCc7XG5cdFx0dGhyb3cgZTtcblx0fVxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8qIGdsb2JhbCAkIGpRdWVyeSBDUE8gQ29kZU1pcnJvciBzdG9yYWdlQVBJIFEgY3JlYXRlUHJvZ3JhbUNvbGxlY3Rpb25BUEkgbWFrZVNoYXJlQVBJICovXG5cbnZhciBvcmlnaW5hbFBhZ2VMb2FkID0gRGF0ZS5ub3coKTtcbmNvbnNvbGUubG9nKFwib3JpZ2luYWxQYWdlTG9hZDogXCIsIG9yaWdpbmFsUGFnZUxvYWQpO1xuXG4vLyBUcmFuc3BhcmVudGx5IHJvdXRlIGJyb3dzZXIgZmV0Y2hlcyB0byBhbGxvd2xpc3RlZCBob3N0cyB0aHJvdWdoIHRoZVxuLy8gc2VydmVyLXNpZGUgcHJveHkgYXQgL2xvYWQtc2hhcmV1cmwsIGJ1dCBvbmx5IHdoZW4gdGhlIGRpcmVjdCBwYXRoIGRvZXNuJ3Rcbi8vIHdvcmsuXG4vL1xuLy8gU3RyYXRlZ3k6IHRoZSBGSVJTVCBmZXRjaCB0byBhbiBhbGxvd2xpc3RlZCBob3N0IGZpcmVzIGRpcmVjdCArIHByb3hpZWQgaW5cbi8vIHBhcmFsbGVsLiBXZSBkZWNpZGUgc2hvdWxkUHJveHkgZm9yIHRoZSByZXN0IG9mIHRoZSBwYWdlLWxvYWQgZnJvbSBkaXJlY3Qnc1xuLy8gcmVzcG9uc2UgKmhlYWRlcnMqOlxuLy8gICAtIGRpcmVjdCByZXR1cm5lZCAyeHggd2l0aCBjb250ZW50LXR5cGUgdGV4dC9wbGFpbiAgLT4gc2hvdWxkUHJveHk9ZmFsc2U6XG4vLyAgICAgc2VydmUgZGlyZWN0J3MgcmVzcG9uc2UsIGFib3J0IHRoZSBpbi1mbGlnaHQgcHJveHkgZmV0Y2guXG4vLyAgIC0gZGlyZWN0IGZhaWxlZCwgaHVuZyBwYXN0IHRpbWVvdXQsIG9yIHJldHVybmVkIGFueXRoaW5nIGVsc2Vcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtPiBzaG91bGRQcm94eT10cnVlOlxuLy8gICAgIHNlcnZlIHByb3h5J3MgcmVzcG9uc2UuXG4vLyBBIGtleSBpZGVhIGlzIHRoYXQgbmV0d29yay1ibG9ja3kgdGhpbmdzIHNvbWV0aW1lcyByZXR1cm4gMjAwIHdpdGggYVxuLy8gbWVzc2FnZSBwYWdlIGFib3V0IGJsb2NraW5nIChvciBhbiBlcnJvciwgYnV0IHRoYXQgY291bnRzIGFzIGEgZmFpbCkuIFdlXG4vLyBkb24ndCB3YW50IHRvIGFjY2lkZW50YWxseSB0aGluayB0aGF0J3MgYSBzdWNjZXNzLlxuLy8gc2hvdWxkUHJveHkgc3RhdGUgaXMgaW4tbWVtb3J5IGFuZCBwZXItaG9zdCDigJQgbmV2ZXIgcGVyc2lzdGVkLCBzaW5jZVxuLy8gcmVhY2hhYmlsaXR5IGNoYW5nZXMgYmV0d2VlbiBuZXR3b3JrcyBhbmQgYSBzdGFsZSB2YWx1ZSB3b3VsZCBzaWxlbnRseVxuLy8gYnJlYWsgbG9hZHMuXG4vL1xuLy8gSW5zdGFsbGVkIG9uIHRoZSBnbG9iYWwgZmV0Y2ggYXMgZWFybHkgYXMgcG9zc2libGUgc28gaXQgY2F0Y2hlcyBldmVyeSBmZXRjaFxuLy8gY2FsbGVyOyBzb21lIG9mIHRoZW0gYXJlIGluIHRoZSBweXJldC1sYW5nIHJ1bnRpbWUgYW5kIHdvdWxkIGJlIG90aGVyd2lzZVxuLy8gZGlmZmljdWx0IHRvIGNvbmZpZ3VyZS5cbmNvbnN0IFNIQVJFVVJMX1BST1hZX0hPU1RTID0gbmV3IFNldChbJ3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20nXSk7XG5jb25zdCBTSEFSRVVSTF9ESVJFQ1RfVElNRU9VVF9NUyA9IDUwMDA7XG5jb25zdCBfb3JpZ0ZldGNoID0gd2luZG93LmZldGNoLmJpbmQod2luZG93KTtcblxuY29uc3QgX3NoYXJldXJsU2hvdWxkUHJveHkgPSBuZXcgTWFwKCk7ICAgICAgICAgIC8vIGhvc3QgLT4gYm9vbGVhblxuY29uc3QgX3NoYXJldXJsU2hvdWxkUHJveHlJbmZsaWdodCA9IG5ldyBNYXAoKTsgIC8vIGhvc3QgLT4gUHJvbWlzZTxib29sZWFuPlxuXG5mdW5jdGlvbiBfc2hhcmV1cmxQcm94eVVybChmZXRjaElucHV0KSB7XG4gIHJldHVybiAnL2xvYWQtc2hhcmV1cmw/dXJsPScgKyBlbmNvZGVVUklDb21wb25lbnQoX3NoYXJldXJsSW5wdXRUb1VybChmZXRjaElucHV0KSk7XG59XG5cbmZ1bmN0aW9uIF9zaGFyZXVybElucHV0VG9VcmwoZmV0Y2hJbnB1dCkge1xuICByZXR1cm4gKHR5cGVvZiBmZXRjaElucHV0ID09PSAnc3RyaW5nJykgPyBmZXRjaElucHV0XG4gICAgICAgICA6ICh0eXBlb2YgUmVxdWVzdCAhPT0gJ3VuZGVmaW5lZCcgJiYgZmV0Y2hJbnB1dCBpbnN0YW5jZW9mIFJlcXVlc3QpID8gZmV0Y2hJbnB1dC51cmxcbiAgICAgICAgIDogU3RyaW5nKGZldGNoSW5wdXQpO1xufVxuXG5mdW5jdGlvbiBfc2hhcmV1cmxWZXJpZnlEaXJlY3Qocikge1xuICBpZiAoIXIub2spIHJldHVybiBmYWxzZTtcbiAgY29uc3QgY3QgPSAoci5oZWFkZXJzLmdldCgnY29udGVudC10eXBlJykgfHwgJycpLnRvTG93ZXJDYXNlKCk7XG4gIC8vIFNvdXJjZSBmaWxlcyBzZXJ2ZWQgZnJvbSByYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tIGNvbWUgYmFjayBhc1xuICAvLyB0ZXh0L3BsYWluICguYXJyLCAuanNvbiwgLmNzdiwgLm1kIGFsbCBkbykuIEFueXRoaW5nIGVsc2Ug4oCUIEhUTUwgYmxvY2tcbiAgLy8gcGFnZXMsIGNhcHRpdmUgcG9ydGFscywgc3VycHJpc2UgY29udGVudCB0eXBlcyDigJQgd2UgZG9uJ3QgdHJ1c3QgYXMgYVxuICAvLyByZWFsIHVwc3RyZWFtIHJlc3BvbnNlLlxuICByZXR1cm4gY3Quc3RhcnRzV2l0aCgndGV4dC9wbGFpbicpO1xufVxuXG5mdW5jdGlvbiBfc2hhcmV1cmxGZXRjaChzaG91bGRQcm94eSwgZmV0Y2hJbnB1dCwgZmV0Y2hJbml0KSB7XG4gIGNvbnN0IG1heWJlUHJveHlJbnB1dCA9IHNob3VsZFByb3h5ID8gX3NoYXJldXJsUHJveHlVcmwoZmV0Y2hJbnB1dCkgOiBmZXRjaElucHV0O1xuICByZXR1cm4gX29yaWdGZXRjaChtYXliZVByb3h5SW5wdXQsIGZldGNoSW5pdCk7XG59XG5cbmZ1bmN0aW9uIF9zaGFyZXVybFJhY2UoZmV0Y2hJbnB1dCwgZmV0Y2hJbml0KSB7XG4gIGNvbnN0IHByb3h5Q3RybCA9IG5ldyBBYm9ydENvbnRyb2xsZXIoKTtcbiAgLy8gTk9URShqb2UpOiBUaGUgc2lnbmFsIG92ZXJ3cml0ZSBpcyB0ZWNobmljYWxseSBub3QgdGhlIHJpZ2h0IGZldGNoKClcbiAgLy8gcG9seWZpbGwuIElmIHRoZSBjYWxsZXIgZWxzZXdoZXJlIGluIHRoZSBjb2RlYmFzZSBwcm92aWRlZCBhIGRpZmZlcmVudFxuICAvLyBzaWduYWwgKHdoaWNoIGluIHRoZSBmZXRjaCBBUEkgaXMgb25seSBmb3IgYWJvcnRpbmcgYXMgb2YgQXByaWwgJzI2KSwgdGhhdFxuICAvLyBjYWxsZXIgYWJvcnRpbmcgdGhyb3VnaCB0aGF0IHNpZ25hbCB3b24ndCBjYW5jZWwgdGhlIHByb3h5IGZldGNoLlxuICAvLyBJJ20gT0sgbGV0dGluZyB0aGF0IGNhc2Ugc2xpcCB0aHJvdWdoIGhlcmUgaW4gZXhjaGFuZ2UgZm9yIG5vdCBoYXZpbmcgYVxuICAvLyBidW5jaCBvZiBleHRyYSBldmVudCBoYW5kbGVyIGZvcndhcmRpbmdcbiAgY29uc3QgcHJveHlQID0gX29yaWdGZXRjaChfc2hhcmV1cmxQcm94eVVybChmZXRjaElucHV0KSxcbiAgICBPYmplY3QuYXNzaWduKHt9LCBmZXRjaEluaXQsIHsgc2lnbmFsOiBwcm94eUN0cmwuc2lnbmFsIH0pKTtcbiAgY29uc3QgZGlyZWN0UCA9IF9vcmlnRmV0Y2goZmV0Y2hJbnB1dCwgZmV0Y2hJbml0KS50aGVuKHIgPT4ge1xuICAgIGlmICghX3NoYXJldXJsVmVyaWZ5RGlyZWN0KHIpKSB0aHJvdyBuZXcgRXJyb3IoJ2RpcmVjdCByZXF1ZXN0IGZhaWxlZCcpO1xuICAgIHJldHVybiByO1xuICB9KTtcblxuICAvLyBzaG91bGRQcm94eTogZmFsc2UgaWZmIGRpcmVjdCB2ZXJpZmllZCBiZWZvcmUgdGhlIHRpbWVvdXQsIGVsc2UgdHJ1ZS5cbiAgLy8gV2hldGhlciB0byBwcm94eSBpcyBkZWNpZGVkIHNvbGVseSBvbiB3aGV0aGVyIGRpcmVjdCBzdWNjZWVkcyBvciBub3RcbiAgY29uc3Qgc2hvdWxkUHJveHlQcm9taXNlID0gUHJvbWlzZS5yYWNlKFtcbiAgICBkaXJlY3RQLnRoZW4oKCkgPT4gZmFsc2UsICgpID0+IHRydWUpLFxuICAgIG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dCgoKSA9PiByZXNvbHZlKHRydWUpLCBTSEFSRVVSTF9ESVJFQ1RfVElNRU9VVF9NUykpLFxuICBdKTtcblxuICAvLyBTZXR0bGVtZW50LW9yZGVyIGNoZWNrOiBpZiBkaXJlY3QgdmVyaWZpZXMgYmVmb3JlIHByb3h5IHJldHVybnMsIGFib3J0XG4gIC8vIHRoZSBpbi1mbGlnaHQgcHJveHkgdG8gc3RvcCB3YXN0aW5nIHNlcnZlciBiYW5kd2lkdGguIFdlIG11c3QgTk9UXG4gIC8vIGFib3J0IG9uY2UgcHJveHkgaGFzIGFscmVhZHkgcmV0dXJuZWQsIHNpbmNlIGJ5IHRoZW4gdGhlIGNhbGxlciBpc1xuICAvLyByZWFkaW5nIHByb3h5J3MgYm9keSBhbmQgYWJvcnRpbmcgd291bGQgZXJyb3IgaXRzIHN0cmVhbSBtaWQtcmVhZC5cbiAgY29uc3QgZGlyZWN0RmluaXNoZWRTdWNjZXNzZnVsbHlBbmRGaXJzdFAgPSBQcm9taXNlLnJhY2UoW1xuICAgIGRpcmVjdFAudGhlbigoKSA9PiB0cnVlLCAoKSA9PiBmYWxzZSksXG4gICAgcHJveHlQLnRoZW4oKCkgPT4gZmFsc2UsICgpID0+IGZhbHNlKSxcbiAgXSk7XG4gIGRpcmVjdEZpbmlzaGVkU3VjY2Vzc2Z1bGx5QW5kRmlyc3RQLnRoZW4oZGlyZWN0Rmlyc3QgPT4ge1xuICAgIGlmIChkaXJlY3RGaXJzdCkgcHJveHlDdHJsLmFib3J0KCk7XG4gIH0pO1xuXG4gIC8vIENhbGxlcidzIHJlc3BvbnNlOiB3aGljaGV2ZXIgb2YgZGlyZWN0LXZlcmlmaWVkIG9yIHByb3h5IGZ1bGZpbGxzXG4gIC8vIGZpcnN0LiBJZiBib3RoIGZhaWwsIHN1cmZhY2UgcHJveHkncyBlcnJvciAodGhlIG1vcmUgYXV0aG9yaXRhdGl2ZVxuICAvLyB1cHN0cmVhbSDigJQgZGlyZWN0J3MgbWF5IGp1c3QgYmUgJ2RpcmVjdC1ub3QtdmVyaWZpZWQnKS5cbiAgY29uc3QgcmVzcG9uc2VQcm9taXNlID0gUHJvbWlzZS5hbnkoW2RpcmVjdFAsIHByb3h5UF0pLmNhdGNoKFxuICAgIGFnZ0VyciA9PiBQcm9taXNlLnJlamVjdChhZ2dFcnIuZXJyb3JzWzFdIHx8IGFnZ0Vyci5lcnJvcnNbMF0pXG4gICk7XG5cbiAgcmV0dXJuIHsgcmVzcG9uc2VQcm9taXNlLCBzaG91bGRQcm94eVByb21pc2UgfTtcbn1cblxud2luZG93LmZldGNoID0gZnVuY3Rpb24oZmV0Y2hJbnB1dCwgZmV0Y2hJbml0KSB7XG4gIGxldCBob3N0O1xuICB0cnkgeyBob3N0ID0gbmV3IFVSTChfc2hhcmV1cmxJbnB1dFRvVXJsKGZldGNoSW5wdXQpLCB3aW5kb3cubG9jYXRpb24uaHJlZikuaG9zdG5hbWU7IH1cbiAgY2F0Y2ggKF8pIHsgcmV0dXJuIF9vcmlnRmV0Y2goZmV0Y2hJbnB1dCwgZmV0Y2hJbml0KTsgfVxuICBpZiAoIVNIQVJFVVJMX1BST1hZX0hPU1RTLmhhcyhob3N0KSkgcmV0dXJuIF9vcmlnRmV0Y2goZmV0Y2hJbnB1dCwgZmV0Y2hJbml0KTtcblxuICBjb25zdCBzaG91bGRQcm94eSA9IF9zaGFyZXVybFNob3VsZFByb3h5LmdldChob3N0KTtcbiAgY29uc3QgaW5mbGlnaHQgPSBfc2hhcmV1cmxTaG91bGRQcm94eUluZmxpZ2h0LmdldChob3N0KTtcbiAgaWYgKHNob3VsZFByb3h5ICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gX3NoYXJldXJsRmV0Y2goc2hvdWxkUHJveHksIGZldGNoSW5wdXQsIGZldGNoSW5pdCk7XG4gIH0gZWxzZSBpZiAoaW5mbGlnaHQpIHtcbiAgICAvLyBzaG91bGRQcm94eSBwZW5kaW5nOiBxdWV1ZSB0aGlzIGZldGNoIG9uIGl0IGFuZCBpc3N1ZSBhIHNpbmdsZSBmcmVzaFxuICAgIC8vIHJlcXVlc3Qgb25jZSBzaG91bGRQcm94eSBpcyBkZWNpZGVkLlxuICAgIHJldHVybiBpbmZsaWdodC50aGVuKHNwID0+IF9zaGFyZXVybEZldGNoKHNwLCBmZXRjaElucHV0LCBmZXRjaEluaXQpKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBGaXJzdCBmZXRjaCB0byB0aGlzIGhvc3QgdGhpcyBwYWdlLWxvYWQ6IHJ1biB0aGUgcmFjZS5cbiAgICBjb25zdCB7IHJlc3BvbnNlUHJvbWlzZSwgc2hvdWxkUHJveHlQcm9taXNlIH0gPSBfc2hhcmV1cmxSYWNlKGZldGNoSW5wdXQsIGZldGNoSW5pdCk7XG4gICAgX3NoYXJldXJsU2hvdWxkUHJveHlJbmZsaWdodC5zZXQoaG9zdCwgc2hvdWxkUHJveHlQcm9taXNlKTtcbiAgICBzaG91bGRQcm94eVByb21pc2UudGhlbihzcCA9PiB7XG4gICAgICBfc2hhcmV1cmxTaG91bGRQcm94eS5zZXQoaG9zdCwgc3ApO1xuICAgICAgX3NoYXJldXJsU2hvdWxkUHJveHlJbmZsaWdodC5kZWxldGUoaG9zdCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlc3BvbnNlUHJvbWlzZTtcbiAgfVxufTtcblxuY29uc3QgaXNFbWJlZGRlZCA9IHdpbmRvdy5wYXJlbnQgIT09IHdpbmRvdztcblxudmFyIHNoYXJlQVBJID0gbWFrZVNoYXJlQVBJKHByb2Nlc3MuZW52LkNVUlJFTlRfUFlSRVRfUkVMRUFTRSk7XG5cbnZhciB1cmwgPSB3aW5kb3cudXJsID0gcmVxdWlyZSgndXJsLmpzJyk7XG52YXIgbW9kYWxQcm9tcHQgPSByZXF1aXJlKCcuL21vZGFsLXByb21wdC5qcycpO1xud2luZG93Lm1vZGFsUHJvbXB0ID0gbW9kYWxQcm9tcHQ7XG5cbmNvbnN0IExPRyA9IHRydWU7XG53aW5kb3cuY3RfbG9nID0gZnVuY3Rpb24oLyogdmFyYXJncyAqLykge1xuICBpZiAod2luZG93LmNvbnNvbGUgJiYgTE9HKSB7XG4gICAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKTtcbiAgfVxufTtcblxud2luZG93LmN0X2Vycm9yID0gZnVuY3Rpb24oLyogdmFyYXJncyAqLykge1xuICBpZiAod2luZG93LmNvbnNvbGUgJiYgTE9HKSB7XG4gICAgY29uc29sZS5lcnJvci5hcHBseShjb25zb2xlLCBhcmd1bWVudHMpO1xuICB9XG59O1xudmFyIGluaXRpYWxQYXJhbXMgPSB1cmwucGFyc2UoZG9jdW1lbnQubG9jYXRpb24uaHJlZik7XG52YXIgcGFyYW1zID0gdXJsLnBhcnNlKFwiLz9cIiArIGluaXRpYWxQYXJhbXNbXCJoYXNoXCJdKTtcbndpbmRvdy5oaWdobGlnaHRNb2RlID0gXCJtY21oXCI7IC8vIHdoYXQgaXMgdGhpcyBmb3I/XG53aW5kb3cuY2xlYXJGbGFzaCA9IGZ1bmN0aW9uKCkge1xuICAkKFwiLm5vdGlmaWNhdGlvbkFyZWFcIikuZW1wdHkoKTtcbn1cbndpbmRvdy53aGl0ZVRvQmxhY2tOb3RpZmljYXRpb24gPSBmdW5jdGlvbigpIHtcbiAgLypcbiAgJChcIi5ub3RpZmljYXRpb25BcmVhIC5hY3RpdmVcIikuY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcIndoaXRlXCIpO1xuICAkKFwiLm5vdGlmaWNhdGlvbkFyZWEgLmFjdGl2ZVwiKS5hbmltYXRlKHtiYWNrZ3JvdW5kQ29sb3I6IFwiIzExMTExMVwiIH0sIDEwMDApO1xuICAqL1xufTtcbndpbmRvdy5zdGlja0Vycm9yID0gZnVuY3Rpb24obWVzc2FnZSwgbW9yZSkge1xuICBDUE8uc2F5QW5kRm9yZ2V0KG1lc3NhZ2UpO1xuICBjbGVhckZsYXNoKCk7XG4gIHZhciBlcnIgPSAkKFwiPHNwYW4+XCIpLmFkZENsYXNzKFwiZXJyb3JcIikudGV4dChtZXNzYWdlKTtcbiAgaWYobW9yZSkge1xuICAgIGVyci5hdHRyKFwidGl0bGVcIiwgbW9yZSk7XG4gIH1cbiAgZXJyLnRvb2x0aXAoKTtcbiAgJChcIi5ub3RpZmljYXRpb25BcmVhXCIpLnByZXBlbmQoZXJyKTtcbiAgd2hpdGVUb0JsYWNrTm90aWZpY2F0aW9uKCk7XG59O1xud2luZG93LmZsYXNoRXJyb3IgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gIENQTy5zYXlBbmRGb3JnZXQobWVzc2FnZSk7XG4gIGNsZWFyRmxhc2goKTtcbiAgdmFyIGVyciA9ICQoXCI8c3Bhbj5cIikuYWRkQ2xhc3MoXCJlcnJvclwiKS50ZXh0KG1lc3NhZ2UpO1xuICAkKFwiLm5vdGlmaWNhdGlvbkFyZWFcIikucHJlcGVuZChlcnIpO1xuICB3aGl0ZVRvQmxhY2tOb3RpZmljYXRpb24oKTtcbiAgZXJyLmZhZGVPdXQoNzAwMCk7XG59O1xud2luZG93LmZsYXNoTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgQ1BPLnNheUFuZEZvcmdldChtZXNzYWdlKTtcbiAgY2xlYXJGbGFzaCgpO1xuICB2YXIgbXNnID0gJChcIjxzcGFuPlwiKS5hZGRDbGFzcyhcImFjdGl2ZVwiKS50ZXh0KG1lc3NhZ2UpO1xuICAkKFwiLm5vdGlmaWNhdGlvbkFyZWFcIikucHJlcGVuZChtc2cpO1xuICB3aGl0ZVRvQmxhY2tOb3RpZmljYXRpb24oKTtcbiAgbXNnLmZhZGVPdXQoNzAwMCk7XG59O1xud2luZG93LnN0aWNrTWVzc2FnZSA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgQ1BPLnNheUFuZEZvcmdldChtZXNzYWdlKTtcbiAgY2xlYXJGbGFzaCgpO1xuICB2YXIgbXNnID0gJChcIjxzcGFuPlwiKS5hZGRDbGFzcyhcImFjdGl2ZVwiKS50ZXh0KG1lc3NhZ2UpO1xuICAkKFwiLm5vdGlmaWNhdGlvbkFyZWFcIikucHJlcGVuZChtc2cpO1xuICB3aGl0ZVRvQmxhY2tOb3RpZmljYXRpb24oKTtcbn07XG53aW5kb3cuc3RpY2tSaWNoTWVzc2FnZSA9IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgQ1BPLnNheUFuZEZvcmdldChjb250ZW50LnRleHQoKSk7XG4gIGNsZWFyRmxhc2goKTtcbiAgJChcIi5ub3RpZmljYXRpb25BcmVhXCIpLnByZXBlbmQoJChcIjxzcGFuPlwiKS5hZGRDbGFzcyhcImFjdGl2ZVwiKS5hcHBlbmQoY29udGVudCkpO1xuICB3aGl0ZVRvQmxhY2tOb3RpZmljYXRpb24oKTtcbn07XG53aW5kb3cubWtXYXJuaW5nVXBwZXIgPSBmdW5jdGlvbigpe3JldHVybiAkKFwiPGRpdiBjbGFzcz0nd2FybmluZy11cHBlcic+XCIpO31cbndpbmRvdy5ta1dhcm5pbmdMb3dlciA9IGZ1bmN0aW9uKCl7cmV0dXJuICQoXCI8ZGl2IGNsYXNzPSd3YXJuaW5nLWxvd2VyJz5cIik7fVxuXG52YXIgRG9jdW1lbnRzID0gZnVuY3Rpb24oKSB7XG5cbiAgZnVuY3Rpb24gRG9jdW1lbnRzKCkge1xuICAgIHRoaXMuZG9jdW1lbnRzID0gbmV3IE1hcCgpO1xuICB9XG5cbiAgRG9jdW1lbnRzLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHJldHVybiB0aGlzLmRvY3VtZW50cy5oYXMobmFtZSk7XG4gIH07XG5cbiAgRG9jdW1lbnRzLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHJldHVybiB0aGlzLmRvY3VtZW50cy5nZXQobmFtZSk7XG4gIH07XG5cbiAgRG9jdW1lbnRzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAobmFtZSwgZG9jKSB7XG4gICAgaWYobG9nZ2VyLmlzRGV0YWlsZWQpXG4gICAgICBsb2dnZXIubG9nKFwiZG9jLnNldFwiLCB7bmFtZTogbmFtZSwgdmFsdWU6IGRvYy5nZXRWYWx1ZSgpfSk7XG4gICAgcmV0dXJuIHRoaXMuZG9jdW1lbnRzLnNldChuYW1lLCBkb2MpO1xuICB9O1xuXG4gIERvY3VtZW50cy5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICBpZihsb2dnZXIuaXNEZXRhaWxlZClcbiAgICAgIGxvZ2dlci5sb2coXCJkb2MuZGVsXCIsIHtuYW1lOiBuYW1lfSk7XG4gICAgcmV0dXJuIHRoaXMuZG9jdW1lbnRzLmRlbGV0ZShuYW1lKTtcbiAgfTtcblxuICBEb2N1bWVudHMucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiAoZikge1xuICAgIHJldHVybiB0aGlzLmRvY3VtZW50cy5mb3JFYWNoKGYpO1xuICB9O1xuXG4gIHJldHVybiBEb2N1bWVudHM7XG59KCk7XG5cbnZhciBWRVJTSU9OX0NIRUNLX0lOVEVSVkFMID0gMTIwMDAwICsgKDMwMDAwICogTWF0aC5yYW5kb20oKSk7XG5cbmZ1bmN0aW9uIGNoZWNrVmVyc2lvbigpIHtcbiAgJC5nZXQoXCIvY3VycmVudC12ZXJzaW9uXCIpLnRoZW4oZnVuY3Rpb24ocmVzcCkge1xuICAgIHJlc3AgPSBKU09OLnBhcnNlKHJlc3ApO1xuICAgIGlmKHJlc3AudmVyc2lvbiAmJiByZXNwLnZlcnNpb24gIT09IHByb2Nlc3MuZW52LkNVUlJFTlRfUFlSRVRfUkVMRUFTRSkge1xuICAgICAgd2luZG93LmZsYXNoTWVzc2FnZShcIkEgbmV3IHZlcnNpb24gb2YgUHlyZXQgaXMgYXZhaWxhYmxlLiBTYXZlIGFuZCByZWxvYWQgdGhlIHBhZ2UgdG8gZ2V0IHRoZSBuZXdlc3QgdmVyc2lvbi5cIik7XG4gICAgfVxuICB9KTtcbn1cbmlmKCFpc0VtYmVkZGVkKSB7XG4gIHdpbmRvdy5zZXRJbnRlcnZhbChjaGVja1ZlcnNpb24sIFZFUlNJT05fQ0hFQ0tfSU5URVJWQUwpO1xufVxuXG53aW5kb3cuQ1BPID0ge1xuICBzYXZlOiBmdW5jdGlvbigpIHt9LFxuICBhdXRvU2F2ZTogZnVuY3Rpb24oKSB7fSxcbiAgZG9jdW1lbnRzIDogbmV3IERvY3VtZW50cygpXG59O1xuJChmdW5jdGlvbigpIHtcbiAgY29uc3QgQ09OVEVYVF9GT1JfTkVXX0ZJTEVTID0gXCJ1c2UgY29udGV4dCBzdGFydGVyMjAyNFxcblwiO1xuICBjb25zdCBDT05URVhUX1BSRUZJWCA9IC9edXNlIGNvbnRleHRcXHMrLztcblxuICBmdW5jdGlvbiBtZXJnZShvYmosIGV4dGVuc2lvbikge1xuICAgIHZhciBuZXdvYmogPSB7fTtcbiAgICBPYmplY3Qua2V5cyhvYmopLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgbmV3b2JqW2tdID0gb2JqW2tdO1xuICAgIH0pO1xuICAgIE9iamVjdC5rZXlzKGV4dGVuc2lvbikuZm9yRWFjaChmdW5jdGlvbihrKSB7XG4gICAgICBuZXdvYmpba10gPSBleHRlbnNpb25ba107XG4gICAgfSk7XG4gICAgcmV0dXJuIG5ld29iajtcbiAgfVxuICB2YXIgYW5pbWF0aW9uRGl2ID0gbnVsbDtcbiAgZnVuY3Rpb24gY2xvc2VBbmltYXRpb25JZk9wZW4oKSB7XG4gICAgaWYoYW5pbWF0aW9uRGl2KSB7XG4gICAgICBhbmltYXRpb25EaXYuZW1wdHkoKTtcbiAgICAgIGFuaW1hdGlvbkRpdi5kaWFsb2coXCJkZXN0cm95XCIpO1xuICAgICAgYW5pbWF0aW9uRGl2ID0gbnVsbDtcbiAgICB9XG4gIH1cbiAgbGV0IGFjdGl2ZUVkaXRvciA9IG51bGw7XG4gIENQTy5tYWtlRWRpdG9yID0gZnVuY3Rpb24oY29udGFpbmVyLCBvcHRpb25zKSB7XG4gICAgdmFyIGluaXRpYWwgPSBcIlwiO1xuICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KFwiaW5pdGlhbFwiKSkge1xuICAgICAgaW5pdGlhbCA9IG9wdGlvbnMuaW5pdGlhbDtcbiAgICB9XG5cbiAgICB2YXIgdGV4dGFyZWEgPSBqUXVlcnkoXCI8dGV4dGFyZWEgYXJpYS1oaWRkZW49J3RydWUnPlwiKTtcbiAgICB0ZXh0YXJlYS52YWwoaW5pdGlhbCk7XG4gICAgY29udGFpbmVyLmFwcGVuZCh0ZXh0YXJlYSk7XG5cbiAgICB2YXIgcnVuRnVuID0gZnVuY3Rpb24gKGNvZGUsIHJlcGxPcHRpb25zKSB7XG4gICAgICBvcHRpb25zLnJ1bihjb2RlLCB7Y206IENNfSwgcmVwbE9wdGlvbnMpO1xuICAgIH07XG5cbiAgICB2YXIgdXNlTGluZU51bWJlcnMgPSAhb3B0aW9ucy5zaW1wbGVFZGl0b3I7XG4gICAgdmFyIHVzZUZvbGRpbmcgPSAhb3B0aW9ucy5zaW1wbGVFZGl0b3I7XG5cbiAgICB2YXIgZ3V0dGVycyA9ICFvcHRpb25zLnNpbXBsZUVkaXRvciA/XG4gICAgICBbXCJoZWxwLWd1dHRlclwiLCBcIkNvZGVNaXJyb3ItbGluZW51bWJlcnNcIiwgXCJDb2RlTWlycm9yLWZvbGRndXR0ZXJcIl0gOlxuICAgICAgW107XG5cbiAgICBmdW5jdGlvbiByZWluZGVudEFsbExpbmVzKGNtKSB7XG4gICAgICB2YXIgbGFzdCA9IGNtLmxpbmVDb3VudCgpO1xuICAgICAgY20ub3BlcmF0aW9uKGZ1bmN0aW9uKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhc3Q7ICsraSkgY20uaW5kZW50TGluZShpKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciBDT0RFX0xJTkVfV0lEVEggPSAxMDA7XG5cbiAgICB2YXIgcnVsZXJzLCBydWxlcnNNaW5Db2w7XG5cbiAgICAvLyBwbGFjZSBhIHZlcnRpY2FsIGxpbmUgaW4gY29kZSBlZGl0b3IsIGFuZCBub3QgcmVwbFxuICAgIGlmIChvcHRpb25zLnNpbXBsZUVkaXRvcikge1xuICAgICAgcnVsZXJzID0gW107XG4gICAgfSBlbHNle1xuICAgICAgcnVsZXJzID0gW3tjb2xvcjogXCIjMzE3QkNGXCIsIGNvbHVtbjogQ09ERV9MSU5FX1dJRFRILCBsaW5lU3R5bGU6IFwiZGFzaGVkXCIsIGNsYXNzTmFtZTogXCJoaWRkZW5cIn1dO1xuICAgICAgcnVsZXJzTWluQ29sID0gQ09ERV9MSU5FX1dJRFRIO1xuICAgIH1cblxuICAgIGNvbnN0IG1hYyA9IENvZGVNaXJyb3Iua2V5TWFwLmRlZmF1bHQgPT09IENvZGVNaXJyb3Iua2V5TWFwLm1hY0RlZmF1bHQ7XG4gICAgY29uc29sZS5sb2coXCJVc2luZyBrZXltYXA6IFwiLCBDb2RlTWlycm9yLmtleU1hcC5kZWZhdWx0LCBcIm1hY0RlZmF1bHQ6IFwiLCBDb2RlTWlycm9yLmtleU1hcC5tYWNEZWZhdWx0LCBcIm1hYzogXCIsIG1hYyk7XG4gICAgY29uc3QgbW9kaWZpZXIgPSBtYWMgPyBcIkNtZFwiIDogXCJDdHJsXCI7XG5cbiAgICBjb25zdCBleHRyYUtleXMgPSB7XG4gICAgICAgIFwiU2hpZnQtRW50ZXJcIjogZnVuY3Rpb24oY20pIHsgcnVuRnVuKGNtLmdldFZhbHVlKCkpOyB9LFxuICAgICAgICBcIlNoaWZ0LUN0cmwtRW50ZXJcIjogZnVuY3Rpb24oY20pIHsgcnVuRnVuKGNtLmdldFZhbHVlKCkpOyB9LFxuICAgICAgICBcIlRhYlwiOiBcImluZGVudEF1dG9cIixcbiAgICAgICAgXCJDdHJsLUlcIjogcmVpbmRlbnRBbGxMaW5lcyxcbiAgICAgICAgXCJFc2MgTGVmdFwiOiBcImdvQmFja3dhcmRTZXhwXCIsXG4gICAgICAgIFwiQWx0LUxlZnRcIjogXCJnb0JhY2t3YXJkU2V4cFwiLFxuICAgICAgICBcIkVzYyBSaWdodFwiOiBcImdvRm9yd2FyZFNleHBcIixcbiAgICAgICAgXCJBbHQtUmlnaHRcIjogXCJnb0ZvcndhcmRTZXhwXCIsXG4gICAgICAgIFwiQ3RybC1MZWZ0XCI6IFwiZ29CYWNrd2FyZFRva2VuXCIsXG4gICAgICAgIFwiQ3RybC1SaWdodFwiOiBcImdvRm9yd2FyZFRva2VuXCIsXG4gICAgICAgIFtgJHttb2RpZmllcn0tRmBdOiBcImZpbmRQZXJzaXN0ZW50XCIsXG4gICAgICAgIFtgJHttb2RpZmllcn0tL2BdOiBcInRvZ2dsZUNvbW1lbnRcIixcbiAgICAgIH07XG4gICAgaWYod2luZG93LlBZUkVUX0lOX1ZTQ09ERSkge1xuICAgICAgLy8gRGlzYWJsZSB1bmRvIGFuZCByZWRvIGluIHZzY29kZSwgc2luY2UgdGhleSBtZXNzIHdpdGggdGhlIGhvc3QgZWRpdG9yJ3MgdW5kby9yZWRvIHN0YWNrXG4gICAgICAvLyBPZGRseSwgaXQgZG9lc24ndCBzZWVtIHRvIHdvcmsgdG8gYWRkIHRoZXNlIHRvIGV4dHJhS2V5czsgSSBoYXZlIHRvXG4gICAgICAvLyBvdmVycmlkZSB0aGVtIGluIHRoZSBkZWZhdWx0IGtleW1hcFxuICAgICAgQ29kZU1pcnJvci5rZXlNYXAuZGVmYXVsdFtgJHttb2RpZmllcn0tWmBdID0gZmFsc2U7XG4gICAgICBDb2RlTWlycm9yLmtleU1hcC5kZWZhdWx0W2BTaGlmdC0ke21vZGlmaWVyfS1aYF0gPSBmYWxzZTtcbiAgICAgIENvZGVNaXJyb3Iua2V5TWFwLmRlZmF1bHRbYCR7bW9kaWZpZXJ9LVlgXSA9IGZhbHNlO1xuICAgICAgLy8gQ3RybC1VIGlzIFVuZG8gd2l0aGluIGEgcmFuZ2VcbiAgICAgIENvZGVNaXJyb3Iua2V5TWFwLmRlZmF1bHRbYCR7bW9kaWZpZXJ9LVVgXSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBjbU9wdGlvbnMgPSB7XG4gICAgICBrZXlNYXA6ICdkZWZhdWx0JyxcbiAgICAgIGV4dHJhS2V5czogQ29kZU1pcnJvci5ub3JtYWxpemVLZXlNYXAoZXh0cmFLZXlzKSxcbiAgICAgIGluZGVudFVuaXQ6IDIsXG4gICAgICB0YWJTaXplOiAyLFxuICAgICAgdmlld3BvcnRNYXJnaW46IEluZmluaXR5LFxuICAgICAgbGluZU51bWJlcnM6IHVzZUxpbmVOdW1iZXJzLFxuICAgICAgbWF0Y2hLZXl3b3JkczogdHJ1ZSxcbiAgICAgIG1hdGNoQnJhY2tldHM6IHRydWUsXG4gICAgICBzdHlsZVNlbGVjdGVkVGV4dDogdHJ1ZSxcbiAgICAgIGZvbGRHdXR0ZXI6IHVzZUZvbGRpbmcsXG4gICAgICBndXR0ZXJzOiBndXR0ZXJzLFxuICAgICAgbGluZVdyYXBwaW5nOiB0cnVlLFxuICAgICAgbG9nZ2luZzogdHJ1ZSxcbiAgICAgIHJ1bGVyczogcnVsZXJzLFxuICAgICAgcnVsZXJzTWluQ29sOiBydWxlcnNNaW5Db2wsXG4gICAgICBzY3JvbGxQYXN0RW5kOiB0cnVlLFxuICAgIH07XG5cbiAgICBjbU9wdGlvbnMgPSBtZXJnZShjbU9wdGlvbnMsIG9wdGlvbnMuY21PcHRpb25zIHx8IHt9KTtcblxuICAgIHZhciBDTSA9IENvZGVNaXJyb3IuZnJvbVRleHRBcmVhKHRleHRhcmVhWzBdLCBjbU9wdGlvbnMpO1xuICAgIENNLm9uKFwiZm9jdXNcIiwgKCkgPT4ge1xuICAgICAgYWN0aXZlRWRpdG9yID0gQ007XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiBmaXJzdExpbmVJc05hbWVzcGFjZSgpIHtcbiAgICAgIGNvbnN0IGZpcnN0bGluZSA9IENNLmdldExpbmUoMCk7XG4gICAgICBjb25zdCBtYXRjaCA9IGZpcnN0bGluZS5tYXRjaChDT05URVhUX1BSRUZJWCk7XG4gICAgICByZXR1cm4gbWF0Y2ggIT09IG51bGw7XG4gICAgfVxuXG4gICAgbGV0IG5hbWVzcGFjZW1hcmsgPSBudWxsO1xuICAgIGZ1bmN0aW9uIHNldENvbnRleHRMaW5lKG5ld0NvbnRleHRMaW5lKSB7XG4gICAgICB2YXIgaGFzTmFtZXNwYWNlID0gZmlyc3RMaW5lSXNOYW1lc3BhY2UoKTtcbiAgICAgIGlmKCFoYXNOYW1lc3BhY2UgJiYgbmFtZXNwYWNlbWFyayAhPT0gbnVsbCkge1xuICAgICAgICBuYW1lc3BhY2VtYXJrLmNsZWFyKCk7XG4gICAgICB9XG4gICAgICBpZighaGFzTmFtZXNwYWNlKSB7XG4gICAgICAgIENNLnJlcGxhY2VSYW5nZShuZXdDb250ZXh0TGluZSwgeyBsaW5lOjAsIGNoOiAwfSwge2xpbmU6IDAsIGNoOiAwfSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgQ00ucmVwbGFjZVJhbmdlKG5ld0NvbnRleHRMaW5lLCB7IGxpbmU6MCwgY2g6IDB9LCB7bGluZTogMSwgY2g6IDB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZighb3B0aW9ucy5zaW1wbGVFZGl0b3IpIHtcblxuICAgICAgY29uc3QgZ3V0dGVyUXVlc3Rpb25XcmFwcGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIGd1dHRlclF1ZXN0aW9uV3JhcHBlci5jbGFzc05hbWUgPSBcImd1dHRlci1xdWVzdGlvbi13cmFwcGVyXCI7XG4gICAgICBjb25zdCBndXR0ZXJUb29sdGlwID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNwYW5cIik7XG4gICAgICBndXR0ZXJUb29sdGlwLmNsYXNzTmFtZSA9IFwiZ3V0dGVyLXF1ZXN0aW9uLXRvb2x0aXBcIjtcbiAgICAgIGd1dHRlclRvb2x0aXAuaW5uZXJUZXh0ID0gXCJUaGUgdXNlIGNvbnRleHQgbGluZSB0ZWxscyBQeXJldCB0byBsb2FkIHRvb2xzIGZvciBhIHNwZWNpZmljIGNsYXNzIGNvbnRleHQuIEl0IGNhbiBiZSBjaGFuZ2VkIHRocm91Z2ggdGhlIG1haW4gUHlyZXQgbWVudS4gTW9zdCBvZiB0aGUgdGltZSB5b3Ugd29uJ3QgbmVlZCB0byBjaGFuZ2UgdGhpcyBhdCBhbGwuXCI7XG4gICAgICBjb25zdCBndXR0ZXJRdWVzdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIik7XG4gICAgICBndXR0ZXJRdWVzdGlvbi5zcmMgPSB3aW5kb3cuQVBQX0JBU0VfVVJMICsgXCIvaW1nL3F1ZXN0aW9uLnBuZ1wiO1xuICAgICAgZ3V0dGVyUXVlc3Rpb24uY2xhc3NOYW1lID0gXCJndXR0ZXItcXVlc3Rpb25cIjtcbiAgICAgIGd1dHRlclF1ZXN0aW9uV3JhcHBlci5hcHBlbmRDaGlsZChndXR0ZXJRdWVzdGlvbik7XG4gICAgICBndXR0ZXJRdWVzdGlvbldyYXBwZXIuYXBwZW5kQ2hpbGQoZ3V0dGVyVG9vbHRpcCk7XG4gICAgICBDTS5zZXRHdXR0ZXJNYXJrZXIoMCwgXCJoZWxwLWd1dHRlclwiLCBndXR0ZXJRdWVzdGlvbldyYXBwZXIpO1xuXG4gICAgICBDTS5nZXRXcmFwcGVyRWxlbWVudCgpLm9ubW91c2VsZWF2ZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgQ00uY2xlYXJHdXR0ZXIoXCJoZWxwLWd1dHRlclwiKTtcbiAgICAgIH1cblxuICAgICAgLy8gTk9URShqb2UpOiBUaGlzIHNlZW1zIHRvIGJlIHRoZSBiZXN0IHdheSB0byBnZXQgYSBob3ZlciBvbiBhIG1hcms6IGh0dHBzOi8vZ2l0aHViLmNvbS9jb2RlbWlycm9yL0NvZGVNaXJyb3IvaXNzdWVzLzM1MjlcbiAgICAgIENNLmdldFdyYXBwZXJFbGVtZW50KCkub25tb3VzZW1vdmUgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciBsaW5lQ2ggPSBDTS5jb29yZHNDaGFyKHsgbGVmdDogZS5jbGllbnRYLCB0b3A6IGUuY2xpZW50WSB9KTtcbiAgICAgICAgdmFyIG1hcmtlcnMgPSBDTS5maW5kTWFya3NBdChsaW5lQ2gpO1xuICAgICAgICBpZiAobWFya2Vycy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBDTS5jbGVhckd1dHRlcihcImhlbHAtZ3V0dGVyXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsaW5lQ2gubGluZSA9PT0gMCAmJiBtYXJrZXJzWzBdID09PSBuYW1lc3BhY2VtYXJrKSB7XG4gICAgICAgICAgQ00uc2V0R3V0dGVyTWFya2VyKDAsIFwiaGVscC1ndXR0ZXJcIiwgZ3V0dGVyUXVlc3Rpb25XcmFwcGVyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBDTS5jbGVhckd1dHRlcihcImhlbHAtZ3V0dGVyXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBDTS5vbihcImNoYW5nZVwiLCBmdW5jdGlvbihjaGFuZ2UpIHtcbiAgICAgICAgZnVuY3Rpb24gZG9lc05vdENoYW5nZUZpcnN0TGluZShjKSB7IHJldHVybiBjLmZyb20ubGluZSAhPT0gMDsgfVxuICAgICAgICBpZihjaGFuZ2UuY3VyT3AuY2hhbmdlT2JqcyAmJiBjaGFuZ2UuY3VyT3AuY2hhbmdlT2Jqcy5ldmVyeShkb2VzTm90Q2hhbmdlRmlyc3RMaW5lKSkgeyByZXR1cm47IH1cbiAgICAgICAgdmFyIGhhc05hbWVzcGFjZSA9IGZpcnN0TGluZUlzTmFtZXNwYWNlKCk7XG4gICAgICAgIGlmKGhhc05hbWVzcGFjZSkge1xuICAgICAgICAgIGlmKG5hbWVzcGFjZW1hcmspIHsgbmFtZXNwYWNlbWFyay5jbGVhcigpOyB9XG4gICAgICAgICAgbmFtZXNwYWNlbWFyayA9IENNLm1hcmtUZXh0KHtsaW5lOiAwLCBjaDogMH0sIHtsaW5lOiAxLCBjaDogMH0sIHsgYXR0cmlidXRlczogeyB1c2VsaW5lOiB0cnVlIH0sIGNsYXNzTmFtZTogXCJ1c2VsaW5lXCIsIGF0b21pYzogdHJ1ZSwgaW5jbHVzaXZlTGVmdDogdHJ1ZSwgaW5jbHVzaXZlUmlnaHQ6IGZhbHNlIH0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKHVzZUxpbmVOdW1iZXJzKSB7XG4gICAgICBDTS5kaXNwbGF5LndyYXBwZXIuYXBwZW5kQ2hpbGQobWtXYXJuaW5nVXBwZXIoKVswXSk7XG4gICAgICBDTS5kaXNwbGF5LndyYXBwZXIuYXBwZW5kQ2hpbGQobWtXYXJuaW5nTG93ZXIoKVswXSk7XG4gICAgfVxuXG4gICAgZ2V0VG9wVGllck1lbnVpdGVtcygpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNtOiBDTSxcbiAgICAgIHNldENvbnRleHRMaW5lOiBzZXRDb250ZXh0TGluZSxcbiAgICAgIHJlZnJlc2g6IGZ1bmN0aW9uKCkgeyBDTS5yZWZyZXNoKCk7IH0sXG4gICAgICBydW46IGZ1bmN0aW9uKCkge1xuICAgICAgICBydW5GdW4oQ00uZ2V0VmFsdWUoKSk7XG4gICAgICB9LFxuICAgICAgZm9jdXM6IGZ1bmN0aW9uKCkgeyBDTS5mb2N1cygpOyB9LFxuICAgICAgZm9jdXNDYXJvdXNlbDogbnVsbCAvL2luaXRGb2N1c0Nhcm91c2VsXG4gICAgfTtcbiAgfTtcbiAgQ1BPLlJVTl9DT0RFID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc29sZS5sb2coXCJSdW5uaW5nIGJlZm9yZSByZWFkeVwiLCBhcmd1bWVudHMpO1xuICB9O1xuXG4gIGZ1bmN0aW9uIHNldFVzZXJuYW1lKHRhcmdldCkge1xuICAgIHZhciB0b2tlbiA9IHdpbmRvdy5nYXBpLmF1dGguZ2V0VG9rZW4oKS5hY2Nlc3NfdG9rZW47XG4gICAgcmV0dXJuIGZldGNoKCdodHRwczovL29wZW5pZGNvbm5lY3QuZ29vZ2xlYXBpcy5jb20vdjEvdXNlcmluZm8nLCB7XG4gICAgICBoZWFkZXJzOiB7IEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHRva2VuIH1cbiAgICB9KS50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgIHJldHVybiByZXNwLmpzb24oKTtcbiAgICB9KS50aGVuKGZ1bmN0aW9uKGluZm8pIHtcbiAgICAgIHRhcmdldC50ZXh0KGluZm8uZW1haWwpO1xuICAgIH0pO1xuICB9XG5cbiAgc3RvcmFnZUFQSS50aGVuKGZ1bmN0aW9uKGFwaSkge1xuICAgIGFwaS5jb2xsZWN0aW9uLnRoZW4oZnVuY3Rpb24oKSB7XG4gICAgICAkKFwiLmxvZ2luT25seVwiKS5zaG93KCk7XG4gICAgICAkKFwiLmxvZ291dE9ubHlcIikuaGlkZSgpO1xuICAgICAgc2V0VXNlcm5hbWUoJChcIiN1c2VybmFtZVwiKSk7XG4gICAgfSk7XG4gICAgYXBpLmNvbGxlY3Rpb24uZmFpbChmdW5jdGlvbigpIHtcbiAgICAgICQoXCIubG9naW5Pbmx5XCIpLmhpZGUoKTtcbiAgICAgICQoXCIubG9nb3V0T25seVwiKS5zaG93KCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIHN0b3JhZ2VBUEkgPSBzdG9yYWdlQVBJLnRoZW4oZnVuY3Rpb24oYXBpKSB7IHJldHVybiBhcGkuYXBpOyB9KTtcbiAgJChcIiNjb25uZWN0QnV0dG9uXCIpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICQoXCIjY29ubmVjdEJ1dHRvblwiKS50ZXh0KFwiQ29ubmVjdGluZy4uLlwiKTtcbiAgICAkKFwiI2Nvbm5lY3RCdXR0b25cIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG4gICAgJCgnI2Nvbm5lY3RCdXR0b25saScpLmF0dHIoJ2Rpc2FibGVkJywgJ2Rpc2FibGVkJyk7XG4gICAgJChcIiNjb25uZWN0QnV0dG9uXCIpLmF0dHIoXCJ0YWJJbmRleFwiLCBcIi0xXCIpO1xuICAgIC8vJChcIiN0b3BUaWVyVWxcIikuYXR0cihcInRhYkluZGV4XCIsIFwiMFwiKTtcbiAgICBnZXRUb3BUaWVyTWVudWl0ZW1zKCk7XG4gICAgc3RvcmFnZUFQSSA9IGNyZWF0ZVByb2dyYW1Db2xsZWN0aW9uQVBJKHByb2Nlc3MuZW52LkFQUF9OQU1FLCBmYWxzZSk7XG4gICAgc3RvcmFnZUFQSS50aGVuKGZ1bmN0aW9uKGFwaSkge1xuICAgICAgYXBpLmNvbGxlY3Rpb24udGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgJChcIi5sb2dpbk9ubHlcIikuc2hvdygpO1xuICAgICAgICAkKFwiLmxvZ291dE9ubHlcIikuaGlkZSgpO1xuICAgICAgICBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKTtcbiAgICAgICAgJChcIiNib25uaWVtZW51YnV0dG9uXCIpLmZvY3VzKCk7XG4gICAgICAgIHNldFVzZXJuYW1lKCQoXCIjdXNlcm5hbWVcIikpO1xuICAgICAgICBpZihwYXJhbXNbXCJnZXRcIl0gJiYgcGFyYW1zW1wiZ2V0XCJdW1wicHJvZ3JhbVwiXSkge1xuICAgICAgICAgIHZhciB0b0xvYWQgPSBhcGkuYXBpLmdldEZpbGVCeUlkKHBhcmFtc1tcImdldFwiXVtcInByb2dyYW1cIl0pO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiTG9nZ2VkIGluIGFuZCBoYXMgcHJvZ3JhbSB0byBsb2FkOiBcIiwgdG9Mb2FkKTtcbiAgICAgICAgICBsb2FkUHJvZ3JhbSh0b0xvYWQpO1xuICAgICAgICAgIHByb2dyYW1Ub1NhdmUgPSB0b0xvYWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvZ3JhbVRvU2F2ZSA9IFEuZmNhbGwoZnVuY3Rpb24oKSB7IHJldHVybiBudWxsOyB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBhcGkuY29sbGVjdGlvbi5mYWlsKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKFwiI2Nvbm5lY3RCdXR0b25cIikudGV4dChcIkNvbm5lY3QgdG8gR29vZ2xlIERyaXZlXCIpO1xuICAgICAgICAkKFwiI2Nvbm5lY3RCdXR0b25cIikuYXR0cihcImRpc2FibGVkXCIsIGZhbHNlKTtcbiAgICAgICAgJCgnI2Nvbm5lY3RCdXR0b25saScpLmF0dHIoJ2Rpc2FibGVkJywgZmFsc2UpO1xuICAgICAgICAvLyQoXCIjY29ubmVjdEJ1dHRvblwiKS5hdHRyKFwidGFiSW5kZXhcIiwgXCIwXCIpO1xuICAgICAgICBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKTtcbiAgICAgICAgJChcIiNjb25uZWN0QnV0dG9uXCIpLmZvY3VzKCk7XG4gICAgICAgIC8vJChcIiN0b3BUaWVyVWxcIikuYXR0cihcInRhYkluZGV4XCIsIFwiLTFcIik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBzdG9yYWdlQVBJID0gc3RvcmFnZUFQSS50aGVuKGZ1bmN0aW9uKGFwaSkgeyByZXR1cm4gYXBpLmFwaTsgfSk7XG4gIH0pO1xuXG4gIC8qXG4gICAgaW5pdGlhbFByb2dyYW0gaG9sZHMgYSBwcm9taXNlIGZvciBhIERyaXZlIEZpbGUgb2JqZWN0IG9yIG51bGxcblxuICAgIEl0J3MgbnVsbCBpZiB0aGUgcGFnZSBkb2Vzbid0IGhhdmUgYSAjc2hhcmUgb3IgI3Byb2dyYW0gdXJsXG5cbiAgICBJZiB0aGUgdXJsIGRvZXMgaGF2ZSBhICNwcm9ncmFtIG9yICNzaGFyZSwgdGhlIHByb21pc2UgaXMgZm9yIHRoZVxuICAgIGNvcnJlc3BvbmRpbmcgb2JqZWN0LlxuICAqL1xuICBsZXQgaW5pdGlhbFByb2dyYW07XG4gIGlmKHBhcmFtc1tcImdldFwiXSAmJiBwYXJhbXNbXCJnZXRcIl1bXCJzaGFyZXVybFwiXSkge1xuICAgIGluaXRpYWxQcm9ncmFtID0gbWFrZVVybEZpbGUocGFyYW1zW1wiZ2V0XCJdW1wic2hhcmV1cmxcIl0pO1xuICB9XG4gIGVsc2Uge1xuICAgIGluaXRpYWxQcm9ncmFtID0gc3RvcmFnZUFQSS50aGVuKGZ1bmN0aW9uKGFwaSkge1xuICAgICAgdmFyIHByb2dyYW1Mb2FkID0gbnVsbDtcbiAgICAgIGlmKHBhcmFtc1tcImdldFwiXSAmJiBwYXJhbXNbXCJnZXRcIl1bXCJwcm9ncmFtXCJdKSB7XG4gICAgICAgIGVuYWJsZUZpbGVPcHRpb25zKCk7XG4gICAgICAgIHByb2dyYW1Mb2FkID0gYXBpLmdldEZpbGVCeUlkKHBhcmFtc1tcImdldFwiXVtcInByb2dyYW1cIl0pO1xuICAgICAgICBwcm9ncmFtTG9hZC50aGVuKGZ1bmN0aW9uKHApIHsgc2hvd1NoYXJlQ29udGFpbmVyKHApOyB9KTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYocGFyYW1zW1wiZ2V0XCJdICYmIHBhcmFtc1tcImdldFwiXVtcInNoYXJlXCJdKSB7XG4gICAgICAgIGxvZ2dlci5sb2coJ3NoYXJlZC1wcm9ncmFtLWxvYWQnLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGlkOiBwYXJhbXNbXCJnZXRcIl1bXCJzaGFyZVwiXVxuICAgICAgICAgIH0pO1xuICAgICAgICBwcm9ncmFtTG9hZCA9IGFwaS5nZXRTaGFyZWRGaWxlQnlJZChwYXJhbXNbXCJnZXRcIl1bXCJzaGFyZVwiXSk7XG4gICAgICAgIHByb2dyYW1Mb2FkLnRoZW4oZnVuY3Rpb24oZmlsZSkge1xuICAgICAgICAgIC8vIE5PVEUoam9lKTogSWYgdGhlIGN1cnJlbnQgdXNlciBkb2Vzbid0IG93biBvciBoYXZlIGFjY2VzcyB0byB0aGlzIGZpbGVcbiAgICAgICAgICAvLyAob3IgaXNuJ3QgbG9nZ2VkIGluKSB0aGlzIHdpbGwgc2ltcGx5IGZhaWwgd2l0aCBhIDQwMSwgc28gd2UgZG9uJ3QgZG9cbiAgICAgICAgICAvLyBhbnkgZnVydGhlciBwZXJtaXNzaW9uIGNoZWNraW5nIGJlZm9yZSBzaG93aW5nIHRoZSBsaW5rLlxuICAgICAgICAgIGZpbGUuZ2V0T3JpZ2luYWwoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc3BvbnNlIGZvciBvcmlnaW5hbDogXCIsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIHZhciBvcmlnaW5hbCA9ICQoXCIjb3Blbi1vcmlnaW5hbFwiKS5zaG93KCkub2ZmKFwiY2xpY2tcIik7XG4gICAgICAgICAgICB2YXIgaWQgPSByZXNwb25zZS5yZXN1bHQudmFsdWU7XG4gICAgICAgICAgICBvcmlnaW5hbC5yZW1vdmVDbGFzcyhcImhpZGRlblwiKTtcbiAgICAgICAgICAgIG9yaWdpbmFsLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICB3aW5kb3cub3Blbih3aW5kb3cuQVBQX0JBU0VfVVJMICsgXCIvZWRpdG9yI3Byb2dyYW09XCIgKyBpZCwgXCJfYmxhbmtcIik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcHJvZ3JhbUxvYWQgPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYocHJvZ3JhbUxvYWQpIHtcbiAgICAgICAgcHJvZ3JhbUxvYWQuZmFpbChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgd2luZG93LnN0aWNrRXJyb3IoXCJUaGUgcHJvZ3JhbSBmYWlsZWQgdG8gbG9hZC5cIik7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcHJvZ3JhbUxvYWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9KS5jYXRjaChlID0+IHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJzdG9yYWdlQVBJIGZhaWxlZCB0byBsb2FkLCBwcm9jZWVkaW5nIHdpdGhvdXQgc2F2aW5nIHByb2dyYW1zOiBcIiwgZSk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFRpdGxlKHByb2dOYW1lKSB7XG4gICAgZG9jdW1lbnQudGl0bGUgPSBwcm9nTmFtZSArIFwiIC0gXCIgKyBwcm9jZXNzLmVudi5BUFBfTkFNRTtcbiAgICAkKFwiI3Nob3dGaWxlbmFtZVwiKS50ZXh0KFwiRmlsZTogXCIgKyBwcm9nTmFtZSk7XG4gIH1cbiAgQ1BPLnNldFRpdGxlID0gc2V0VGl0bGU7XG5cbiAgdmFyIGZpbGVuYW1lID0gZmFsc2U7XG5cbiAgJChcIiNkb3dubG9hZCBhXCIpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgIHZhciBkb3dubG9hZEVsdCA9ICQoXCIjZG93bmxvYWQgYVwiKTtcbiAgICB2YXIgY29udGVudHMgPSBDUE8uZWRpdG9yLmNtLmdldFZhbHVlKCk7XG4gICAgdmFyIGRvd25sb2FkQmxvYiA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtjb250ZW50c10sIHt0eXBlOiAndGV4dC9wbGFpbid9KSk7XG4gICAgaWYoIWZpbGVuYW1lKSB7IGZpbGVuYW1lID0gJ3VudGl0bGVkX3Byb2dyYW0uYXJyJzsgfVxuICAgIGlmKGZpbGVuYW1lLmluZGV4T2YoXCIuYXJyXCIpICE9PSAoZmlsZW5hbWUubGVuZ3RoIC0gNCkpIHtcbiAgICAgIGZpbGVuYW1lICs9IFwiLmFyclwiO1xuICAgIH1cbiAgICBkb3dubG9hZEVsdC5hdHRyKHtcbiAgICAgIGRvd25sb2FkOiBmaWxlbmFtZSxcbiAgICAgIGhyZWY6IGRvd25sb2FkQmxvYlxuICAgIH0pO1xuICAgICQoXCIjZG93bmxvYWRcIikuYXBwZW5kKGRvd25sb2FkRWx0KTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gc2hvd01vZGFsKGN1cnJlbnRDb250ZXh0KSB7XG4gICAgZnVuY3Rpb24gZHJhd0VsZW1lbnQoaW5wdXQpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSAkKFwiPGRpdj5cIik7XG4gICAgICBjb25zdCBncmVldGluZyA9ICQoXCI8cD5cIik7XG4gICAgICBjb25zdCBzaGFyZWQgPSAkKFwiPHR0PnNoYXJlZC1nZHJpdmUoLi4uKTwvdHQ+XCIpO1xuICAgICAgY29uc3QgY3VycmVudENvbnRleHRFbHQgPSAkKFwiPHR0PlwiICsgY3VycmVudENvbnRleHQgKyBcIjwvdHQ+XCIpO1xuICAgICAgZ3JlZXRpbmcuYXBwZW5kKFwiRW50ZXIgdGhlIGNvbnRleHQgdG8gdXNlIGZvciB0aGUgcHJvZ3JhbSwgb3IgY2hvb3NlIOKAnENhbmNlbOKAnSB0byBrZWVwIHRoZSBjdXJyZW50IGNvbnRleHQgb2YgXCIsIGN1cnJlbnRDb250ZXh0RWx0LCBcIi5cIik7XG4gICAgICBjb25zdCBlc3NlbnRpYWxzID0gJChcIjx0dD5zdGFydGVyMjAyNDwvdHQ+XCIpO1xuICAgICAgY29uc3QgbGlzdCA9ICQoXCI8dWw+XCIpXG4gICAgICAgIC5hcHBlbmQoJChcIjxsaT5cIikuYXBwZW5kKFwiVGhlIGRlZmF1bHQgaXMgXCIsIGVzc2VudGlhbHMsIFwiLlwiKSlcbiAgICAgICAgLmFwcGVuZCgkKFwiPGxpPlwiKS5hcHBlbmQoXCJZb3UgbWlnaHQgdXNlIHNvbWV0aGluZyBsaWtlIFwiLCBzaGFyZWQsIFwiIGlmIG9uZSB3YXMgcHJvdmlkZWQgYXMgcGFydCBvZiBhIGNvdXJzZS5cIikpO1xuICAgICAgZWxlbWVudC5hcHBlbmQoZ3JlZXRpbmcpO1xuICAgICAgZWxlbWVudC5hcHBlbmQoJChcIjxwPlwiKS5hcHBlbmQobGlzdCkpO1xuICAgICAgY29uc3QgdXNlQ29udGV4dCA9ICQoXCI8dHQ+dXNlIGNvbnRleHQ8L3R0PlwiKS5jc3MoeyAnZmxleC1ncm93JzogJzAnLCAncGFkZGluZy1yaWdodCc6ICcxZW0nIH0pO1xuICAgICAgY29uc3QgaW5wdXRXcmFwcGVyID0gJChcIjxkaXY+XCIpLmFwcGVuZChpbnB1dCkuY3NzKHsgJ2ZsZXgtZ3Jvdyc6ICcxJyB9KTtcbiAgICAgIGNvbnN0IGVudHJ5ID0gJChcIjxkaXY+XCIpLmNzcyh7XG4gICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ3JvdycsXG4gICAgICAgICdqdXN0aWZ5LWNvbnRlbnQnOiAnZmxleC1zdGFydCcsXG4gICAgICAgICdhbGlnbi1pdGVtcyc6ICdiYXNlbGluZSdcbiAgICAgIH0pO1xuICAgICAgZW50cnkuYXBwZW5kKHVzZUNvbnRleHQpLmFwcGVuZChpbnB1dFdyYXBwZXIpO1xuICAgICAgZWxlbWVudC5hcHBlbmQoZW50cnkpO1xuICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuICAgIGNvbnN0IG5hbWVzcGFjZVJlc3VsdCA9IG5ldyBtb2RhbFByb21wdCh7XG4gICAgICAgIHRpdGxlOiBcIkNob29zZSBhIENvbnRleHRcIixcbiAgICAgICAgc3R5bGU6IFwidGV4dFwiLFxuICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZHJhd0VsZW1lbnQ6IGRyYXdFbGVtZW50LFxuICAgICAgICAgICAgc3VibWl0VGV4dDogXCJDaGFuZ2UgTmFtZXNwYWNlXCIsXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU6IGN1cnJlbnRDb250ZXh0XG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9KTtcbiAgICBuYW1lc3BhY2VSZXN1bHQuc2hvdygocmVzdWx0KSA9PiB7XG4gICAgICBpZighcmVzdWx0KSB7IHJldHVybjsgfVxuICAgICAgQ1BPLmVkaXRvci5zZXRDb250ZXh0TGluZShcInVzZSBjb250ZXh0IFwiICsgcmVzdWx0LnRyaW0oKSArIFwiXFxuXCIpO1xuICAgIH0pO1xuICB9XG4gICQoXCIjY2hvb3NlLWNvbnRleHRcIikub24oXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcbiAgICBjb25zdCBmaXJzdExpbmUgPSBDUE8uZWRpdG9yLmNtLmdldExpbmUoMCk7XG4gICAgY29uc3QgY29udGV4dExlbiA9IGZpcnN0TGluZS5tYXRjaChDT05URVhUX1BSRUZJWCk7XG4gICAgc2hvd01vZGFsKGNvbnRleHRMZW4gPT09IG51bGwgPyBcIlwiIDogZmlyc3RMaW5lLnNsaWNlKGNvbnRleHRMZW5bMF0ubGVuZ3RoKSk7XG4gIH0pO1xuXG4gIHZhciBUUlVOQ0FURV9MRU5HVEggPSAyMDtcblxuICBmdW5jdGlvbiB0cnVuY2F0ZU5hbWUobmFtZSkge1xuICAgIGlmKG5hbWUubGVuZ3RoIDw9IFRSVU5DQVRFX0xFTkdUSCArIDEpIHsgcmV0dXJuIG5hbWU7IH1cbiAgICByZXR1cm4gbmFtZS5zbGljZSgwLCBUUlVOQ0FURV9MRU5HVEggLyAyKSArIFwi4oCmXCIgKyBuYW1lLnNsaWNlKG5hbWUubGVuZ3RoIC0gVFJVTkNBVEVfTEVOR1RIIC8gMiwgbmFtZS5sZW5ndGgpO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlTmFtZShwKSB7XG4gICAgZmlsZW5hbWUgPSBwLmdldE5hbWUoKTtcbiAgICAkKFwiI2ZpbGVuYW1lXCIpLnRleHQoXCIgKFwiICsgdHJ1bmNhdGVOYW1lKGZpbGVuYW1lKSArIFwiKVwiKTtcbiAgICAkKFwiI2ZpbGVuYW1lXCIpLmF0dHIoJ3RpdGxlJywgZmlsZW5hbWUpO1xuICAgIHNldFRpdGxlKGZpbGVuYW1lKTtcbiAgICBzaG93U2hhcmVDb250YWluZXIocCk7XG4gIH1cblxuICBmdW5jdGlvbiBsb2FkUHJvZ3JhbShwKSB7XG4gICAgcHJvZ3JhbVRvU2F2ZSA9IHA7XG4gICAgcmV0dXJuIHAudGhlbihmdW5jdGlvbihwcm9nKSB7XG4gICAgICBpZihwcm9nICE9PSBudWxsKSB7XG4gICAgICAgIHVwZGF0ZU5hbWUocHJvZyk7XG4gICAgICAgIGlmKHByb2cuc2hhcmVkKSB7XG4gICAgICAgICAgd2luZG93LnN0aWNrTWVzc2FnZShcIllvdSBhcmUgdmlld2luZyBhIHNoYXJlZCBwcm9ncmFtLiBBbnkgY2hhbmdlcyB5b3UgbWFrZSB3aWxsIG5vdCBiZSBzYXZlZC4gWW91IGNhbiB1c2UgRmlsZSAtPiBTYXZlIGEgY29weSB0byBzYXZlIHlvdXIgb3duIHZlcnNpb24gd2l0aCBhbnkgZWRpdHMgeW91IG1ha2UuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcm9nLmdldENvbnRlbnRzKCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgaWYocGFyYW1zW1wiZ2V0XCJdW1wiZWRpdG9yQ29udGVudHNcIl0gJiYgIShwYXJhbXNbXCJnZXRcIl1bXCJwcm9ncmFtXCJdIHx8IHBhcmFtc1tcImdldFwiXVtcInNoYXJlXCJdKSkge1xuICAgICAgICAgIHJldHVybiBwYXJhbXNbXCJnZXRcIl1bXCJlZGl0b3JDb250ZW50c1wiXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gQ09OVEVYVF9GT1JfTkVXX0ZJTEVTO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBzYXkobXNnLCBmb3JnZXQpIHtcbiAgICBpZiAobXNnID09PSBcIlwiKSByZXR1cm47XG4gICAgdmFyIGFubm91bmNlbWVudHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFubm91bmNlbWVudGxpc3RcIik7XG4gICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkxJXCIpO1xuICAgIGxpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG1zZykpO1xuICAgIGFubm91bmNlbWVudHMuaW5zZXJ0QmVmb3JlKGxpLCBhbm5vdW5jZW1lbnRzLmZpcnN0Q2hpbGQpO1xuICAgIGlmIChmb3JnZXQpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGFubm91bmNlbWVudHMucmVtb3ZlQ2hpbGQobGkpO1xuICAgICAgfSwgMTAwMCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2F5QW5kRm9yZ2V0KG1zZykge1xuICAgIGNvbnNvbGUubG9nKCdkb2luZyBzYXlBbmRGb3JnZXQnLCBtc2cpO1xuICAgIHNheShtc2csIHRydWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gY3ljbGVBZHZhbmNlKGN1cnJJbmRleCwgbWF4SW5kZXgsIHJldmVyc2VQKSB7XG4gICAgdmFyIG5leHRJbmRleCA9IGN1cnJJbmRleCArIChyZXZlcnNlUD8gLTEgOiArMSk7XG4gICAgbmV4dEluZGV4ID0gKChuZXh0SW5kZXggJSBtYXhJbmRleCkgKyBtYXhJbmRleCkgJSBtYXhJbmRleDtcbiAgICByZXR1cm4gbmV4dEluZGV4O1xuICB9XG5cbiAgZnVuY3Rpb24gcG9wdWxhdGVGb2N1c0Nhcm91c2VsKGVkaXRvcikge1xuICAgIGlmICghZWRpdG9yLmZvY3VzQ2Fyb3VzZWwpIHtcbiAgICAgIGVkaXRvci5mb2N1c0Nhcm91c2VsID0gW107XG4gICAgfVxuICAgIHZhciBmYyA9IGVkaXRvci5mb2N1c0Nhcm91c2VsO1xuICAgIHZhciBkb2NtYWluID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYWluXCIpO1xuICAgIGlmICghZmNbMF0pIHtcbiAgICAgIHZhciB0b29sYmFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ1Rvb2xiYXInKTtcbiAgICAgIGZjWzBdID0gdG9vbGJhcjtcbiAgICAgIC8vZmNbMF0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYWRlcm9uZWxlZ2VuZFwiKTtcbiAgICAgIC8vZ2V0VG9wVGllck1lbnVpdGVtcygpO1xuICAgICAgLy9mY1swXSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdib25uaWVtZW51YnV0dG9uJyk7XG4gICAgfVxuICAgIGlmICghZmNbMV0pIHtcbiAgICAgIHZhciBkb2NyZXBsTWFpbiA9IGRvY21haW4uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInJlcGxNYWluXCIpO1xuICAgICAgdmFyIGRvY3JlcGxNYWluMDtcbiAgICAgIGlmIChkb2NyZXBsTWFpbi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgZG9jcmVwbE1haW4wID0gdW5kZWZpbmVkO1xuICAgICAgfSBlbHNlIGlmIChkb2NyZXBsTWFpbi5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgZG9jcmVwbE1haW4wID0gZG9jcmVwbE1haW5bMF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRvY3JlcGxNYWluLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKGRvY3JlcGxNYWluW2ldLmlubmVyVGV4dCAhPT0gXCJcIikge1xuICAgICAgICAgICAgZG9jcmVwbE1haW4wID0gZG9jcmVwbE1haW5baV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmY1sxXSA9IGRvY3JlcGxNYWluMDtcbiAgICB9XG4gICAgaWYgKCFmY1syXSkge1xuICAgICAgdmFyIGRvY3JlcGwgPSBkb2NtYWluLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJyZXBsXCIpO1xuICAgICAgdmFyIGRvY3JlcGxjb2RlID0gZG9jcmVwbFswXS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwicHJvbXB0LWNvbnRhaW5lclwiKVswXS5cbiAgICAgICAgZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIkNvZGVNaXJyb3JcIilbMF07XG4gICAgICBmY1syXSA9IGRvY3JlcGxjb2RlO1xuICAgIH1cbiAgICBpZiAoIWZjWzNdKSB7XG4gICAgICBmY1szXSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYW5ub3VuY2VtZW50c1wiKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjeWNsZUZvY3VzKHJldmVyc2VQKSB7XG4gICAgLy9jb25zb2xlLmxvZygnZG9pbmcgY3ljbGVGb2N1cycsIHJldmVyc2VQKTtcbiAgICB2YXIgZWRpdG9yID0gdGhpcy5lZGl0b3I7XG4gICAgcG9wdWxhdGVGb2N1c0Nhcm91c2VsKGVkaXRvcik7XG4gICAgdmFyIGZDYXJvdXNlbCA9IGVkaXRvci5mb2N1c0Nhcm91c2VsO1xuICAgIHZhciBtYXhJbmRleCA9IGZDYXJvdXNlbC5sZW5ndGg7XG4gICAgdmFyIGN1cnJlbnRGb2N1c2VkRWx0ID0gZkNhcm91c2VsLmZpbmQoZnVuY3Rpb24obm9kZSkge1xuICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBub2RlLmNvbnRhaW5zKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHZhciBjdXJyZW50Rm9jdXNJbmRleCA9IGZDYXJvdXNlbC5pbmRleE9mKGN1cnJlbnRGb2N1c2VkRWx0KTtcbiAgICB2YXIgbmV4dEZvY3VzSW5kZXggPSBjdXJyZW50Rm9jdXNJbmRleDtcbiAgICB2YXIgZm9jdXNFbHQ7XG4gICAgZG8ge1xuICAgICAgbmV4dEZvY3VzSW5kZXggPSBjeWNsZUFkdmFuY2UobmV4dEZvY3VzSW5kZXgsIG1heEluZGV4LCByZXZlcnNlUCk7XG4gICAgICBmb2N1c0VsdCA9IGZDYXJvdXNlbFtuZXh0Rm9jdXNJbmRleF07XG4gICAgICAvL2NvbnNvbGUubG9nKCd0cnlpbmcgZm9jdXNFbHQnLCBmb2N1c0VsdCk7XG4gICAgfSB3aGlsZSAoIWZvY3VzRWx0KTtcblxuICAgIHZhciBmb2N1c0VsdDA7XG4gICAgaWYgKGZvY3VzRWx0LmNsYXNzTGlzdC5jb250YWlucygndG9vbGJhcnJlZ2lvbicpKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdzZXR0bGluZyBvbiB0b29sYmFyIHJlZ2lvbicpXG4gICAgICBnZXRUb3BUaWVyTWVudWl0ZW1zKCk7XG4gICAgICBmb2N1c0VsdDAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYm9ubmllbWVudWJ1dHRvbicpO1xuICAgIH0gZWxzZSBpZiAoZm9jdXNFbHQuY2xhc3NMaXN0LmNvbnRhaW5zKFwicmVwbE1haW5cIikgfHxcbiAgICAgIGZvY3VzRWx0LmNsYXNzTGlzdC5jb250YWlucyhcIkNvZGVNaXJyb3JcIikpIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ3NldHRsaW5nIG9uIGRlZm4gd2luZG93JylcbiAgICAgIHZhciB0ZXh0YXJlYXMgPSBmb2N1c0VsdC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRleHRhcmVhXCIpO1xuICAgICAgLy9jb25zb2xlLmxvZygndHh0YXJlYXM9JywgdGV4dGFyZWFzKVxuICAgICAgLy9jb25zb2xlLmxvZygndHh0YXJlYSBsZW49JywgdGV4dGFyZWFzLmxlbmd0aClcbiAgICAgIGlmICh0ZXh0YXJlYXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ0knKVxuICAgICAgICBmb2N1c0VsdDAgPSBmb2N1c0VsdDtcbiAgICAgIH0gZWxzZSBpZiAodGV4dGFyZWFzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdzZXR0bGluZyBvbiBpbnRlciB3aW5kb3cnKVxuICAgICAgICBmb2N1c0VsdDAgPSB0ZXh0YXJlYXNbMF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdzZXR0bGluZyBvbiBkZWZuIHdpbmRvdycpXG4gICAgICAgIC8qXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGV4dGFyZWFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHRleHRhcmVhc1tpXS5nZXRBdHRyaWJ1dGUoJ3RhYkluZGV4JykpIHtcbiAgICAgICAgICAgIGZvY3VzRWx0MCA9IHRleHRhcmVhc1tpXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgKi9cbiAgICAgICAgZm9jdXNFbHQwID0gdGV4dGFyZWFzW3RleHRhcmVhcy5sZW5ndGgtMV07XG4gICAgICAgIGZvY3VzRWx0MC5yZW1vdmVBdHRyaWJ1dGUoJ3RhYkluZGV4Jyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ3NldHRsaW5nIG9uIGFubm91bmNlbWVudCByZWdpb24nLCBmb2N1c0VsdClcbiAgICAgIGZvY3VzRWx0MCA9IGZvY3VzRWx0O1xuICAgIH1cblxuICAgIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuICAgIGZvY3VzRWx0MC5jbGljaygpO1xuICAgIGZvY3VzRWx0MC5mb2N1cygpO1xuICAgIC8vY29uc29sZS5sb2coJyhjZilkb2NhY3RlbHQ9JywgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCk7XG4gIH1cblxuICB2YXIgcHJvZ3JhbUxvYWRlZCA9IGxvYWRQcm9ncmFtKGluaXRpYWxQcm9ncmFtKTtcblxuICB2YXIgcHJvZ3JhbVRvU2F2ZSA9IGluaXRpYWxQcm9ncmFtO1xuXG4gIGZ1bmN0aW9uIHNob3dTaGFyZUNvbnRhaW5lcihwKSB7XG4gICAgLy9jb25zb2xlLmxvZygnY2FsbGVkIHNob3dTaGFyZUNvbnRhaW5lcicpO1xuICAgIGlmKCFwLnNoYXJlZCkge1xuICAgICAgJChcIiNzaGFyZUNvbnRhaW5lclwiKS5lbXB0eSgpO1xuICAgICAgJCgnI3B1Ymxpc2hsaScpLnNob3coKTtcbiAgICAgICQoXCIjc2hhcmVDb250YWluZXJcIikuYXBwZW5kKHNoYXJlQVBJLm1ha2VTaGFyZUxpbmsocCkpO1xuICAgICAgZ2V0VG9wVGllck1lbnVpdGVtcygpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG5hbWVPclVudGl0bGVkKCkge1xuICAgIHJldHVybiBmaWxlbmFtZSB8fCBcIlVudGl0bGVkXCI7XG4gIH1cbiAgZnVuY3Rpb24gYXV0b1NhdmUoKSB7XG4gICAgcHJvZ3JhbVRvU2F2ZS50aGVuKGZ1bmN0aW9uKHApIHtcbiAgICAgIGlmKHAgIT09IG51bGwgJiYgIXAuc2hhcmVkKSB7IHNhdmUoKTsgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gZW5hYmxlRmlsZU9wdGlvbnMoKSB7XG4gICAgJChcIiNmaWxlbWVudUNvbnRlbnRzICpcIikucmVtb3ZlQ2xhc3MoXCJkaXNhYmxlZFwiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1lbnVJdGVtRGlzYWJsZWQoaWQpIHtcbiAgICByZXR1cm4gJChcIiNcIiArIGlkKS5oYXNDbGFzcyhcImRpc2FibGVkXCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gbmV3RXZlbnQoZSkge1xuICAgIHdpbmRvdy5vcGVuKHdpbmRvdy5BUFBfQkFTRV9VUkwgKyBcIi9lZGl0b3JcIik7XG4gIH1cblxuICBmdW5jdGlvbiBzYXZlRXZlbnQoZSkge1xuICAgIGlmKG1lbnVJdGVtRGlzYWJsZWQoXCJzYXZlXCIpKSB7IHJldHVybjsgfVxuICAgIHJldHVybiBzYXZlKCk7XG4gIH1cblxuICAvKlxuICAgIHNhdmUgOiBzdHJpbmcgKG9wdGlvbmFsKSAtPiB1bmRlZlxuXG4gICAgSWYgYSBzdHJpbmcgYXJndW1lbnQgaXMgcHJvdmlkZWQsIGNyZWF0ZSBhIG5ldyBmaWxlIHdpdGggdGhhdCBuYW1lIGFuZCBzYXZlXG4gICAgdGhlIGVkaXRvciBjb250ZW50cyBpbiB0aGF0IGZpbGUuXG5cbiAgICBJZiBubyBmaWxlbmFtZSBpcyBwcm92aWRlZCwgc2F2ZSB0aGUgZXhpc3RpbmcgZmlsZSByZWZlcmVuY2VkIGJ5IHRoZSBlZGl0b3JcbiAgICB3aXRoIHRoZSBjdXJyZW50IGVkaXRvciBjb250ZW50cy4gIElmIG5vIGZpbGVuYW1lIGhhcyBiZWVuIHNldCB5ZXQsIGp1c3RcbiAgICBzZXQgdGhlIG5hbWUgdG8gXCJVbnRpdGxlZFwiLlxuXG4gICovXG4gIGZ1bmN0aW9uIHNhdmUobmV3RmlsZW5hbWUpIHtcbiAgICB2YXIgdXNlTmFtZSwgY3JlYXRlO1xuICAgIGlmKG5ld0ZpbGVuYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHVzZU5hbWUgPSBuZXdGaWxlbmFtZTtcbiAgICAgIGNyZWF0ZSA9IHRydWU7XG4gICAgfVxuICAgIGVsc2UgaWYoZmlsZW5hbWUgPT09IGZhbHNlKSB7XG4gICAgICBmaWxlbmFtZSA9IFwiVW50aXRsZWRcIjtcbiAgICAgIGNyZWF0ZSA9IHRydWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdXNlTmFtZSA9IGZpbGVuYW1lOyAvLyBBIGNsb3NlZC1vdmVyIHZhcmlhYmxlXG4gICAgICBjcmVhdGUgPSBmYWxzZTtcbiAgICB9XG4gICAgd2luZG93LnN0aWNrTWVzc2FnZShcIlNhdmluZy4uLlwiKTtcbiAgICB2YXIgc2F2ZWRQcm9ncmFtID0gcHJvZ3JhbVRvU2F2ZS50aGVuKGZ1bmN0aW9uKHApIHtcbiAgICAgIGlmKHAgIT09IG51bGwgJiYgcC5zaGFyZWQgJiYgIWNyZWF0ZSkge1xuICAgICAgICByZXR1cm4gcDsgLy8gRG9uJ3QgdHJ5IHRvIHNhdmUgc2hhcmVkIGZpbGVzXG4gICAgICB9XG4gICAgICBpZihjcmVhdGUpIHtcbiAgICAgICAgcHJvZ3JhbVRvU2F2ZSA9IHN0b3JhZ2VBUElcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihhcGkpIHsgcmV0dXJuIGFwaS5jcmVhdGVGaWxlKHVzZU5hbWUpOyB9KVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHApIHtcbiAgICAgICAgICAgIC8vIHNob3dTaGFyZUNvbnRhaW5lcihwKTsgVE9ETyhqb2UpOiBmaWd1cmUgb3V0IHdoZXJlIHRvIHB1dCB0aGlzXG4gICAgICAgICAgICBoaXN0b3J5LnB1c2hTdGF0ZShudWxsLCBudWxsLCBcIiNwcm9ncmFtPVwiICsgcC5nZXRVbmlxdWVJZCgpKTtcbiAgICAgICAgICAgIHVwZGF0ZU5hbWUocCk7IC8vIHNldHMgZmlsZW5hbWVcbiAgICAgICAgICAgIGVuYWJsZUZpbGVPcHRpb25zKCk7XG4gICAgICAgICAgICByZXR1cm4gcDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHByb2dyYW1Ub1NhdmUudGhlbihmdW5jdGlvbihwKSB7XG4gICAgICAgICAgcmV0dXJuIHNhdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHByb2dyYW1Ub1NhdmUudGhlbihmdW5jdGlvbihwKSB7XG4gICAgICAgICAgaWYocCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHAuc2F2ZShDUE8uZWRpdG9yLmNtLmdldFZhbHVlKCksIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24ocCkge1xuICAgICAgICAgIGlmKHAgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHdpbmRvdy5mbGFzaE1lc3NhZ2UoXCJQcm9ncmFtIHNhdmVkIGFzIFwiICsgcC5nZXROYW1lKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcDtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgc2F2ZWRQcm9ncmFtLmZhaWwoZnVuY3Rpb24oZXJyKSB7XG4gICAgICB3aW5kb3cuc3RpY2tFcnJvcihcIlVuYWJsZSB0byBzYXZlXCIsIFwiWW91ciBpbnRlcm5ldCBjb25uZWN0aW9uIG1heSBiZSBkb3duLCBvciBzb21ldGhpbmcgZWxzZSBtaWdodCBiZSB3cm9uZyB3aXRoIHRoaXMgc2l0ZSBvciBzYXZpbmcgdG8gR29vZ2xlLiAgWW91IHNob3VsZCBiYWNrIHVwIGFueSBjaGFuZ2VzIHRvIHRoaXMgcHJvZ3JhbSBzb21ld2hlcmUgZWxzZS4gIFlvdSBjYW4gdHJ5IHNhdmluZyBhZ2FpbiB0byBzZWUgaWYgdGhlIHByb2JsZW0gd2FzIHRlbXBvcmFyeSwgYXMgd2VsbC5cIik7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfSk7XG4gICAgcmV0dXJuIHNhdmVkUHJvZ3JhbTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNhdmVBcygpIHtcbiAgICBpZihtZW51SXRlbURpc2FibGVkKFwic2F2ZWFzXCIpKSB7IHJldHVybjsgfVxuICAgIHByb2dyYW1Ub1NhdmUudGhlbihmdW5jdGlvbihwKSB7XG4gICAgICB2YXIgbmFtZSA9IHAgPT09IG51bGwgPyBcIlVudGl0bGVkXCIgOiBwLmdldE5hbWUoKTtcbiAgICAgIHZhciBzYXZlQXNQcm9tcHQgPSBuZXcgbW9kYWxQcm9tcHQoe1xuICAgICAgICB0aXRsZTogXCJTYXZlIGEgY29weVwiLFxuICAgICAgICBzdHlsZTogXCJ0ZXh0XCIsXG4gICAgICAgIHN1Ym1pdFRleHQ6IFwiU2F2ZVwiLFxuICAgICAgICBuYXJyb3c6IHRydWUsXG4gICAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBtZXNzYWdlOiBcIlRoZSBuYW1lIGZvciB0aGUgY29weTpcIixcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZTogbmFtZVxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gc2F2ZUFzUHJvbXB0LnNob3coKS50aGVuKGZ1bmN0aW9uKG5ld05hbWUpIHtcbiAgICAgICAgaWYobmV3TmFtZSA9PT0gbnVsbCkgeyByZXR1cm4gbnVsbDsgfVxuICAgICAgICB3aW5kb3cuc3RpY2tNZXNzYWdlKFwiU2F2aW5nLi4uXCIpO1xuICAgICAgICByZXR1cm4gc2F2ZShuZXdOYW1lKTtcbiAgICAgIH0pLlxuICAgICAgZmFpbChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byByZW5hbWU6IFwiLCBlcnIpO1xuICAgICAgICB3aW5kb3cuZmxhc2hFcnJvcihcIkZhaWxlZCB0byByZW5hbWUgZmlsZVwiKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVuYW1lKCkge1xuICAgIHByb2dyYW1Ub1NhdmUudGhlbihmdW5jdGlvbihwKSB7XG4gICAgICB2YXIgcmVuYW1lUHJvbXB0ID0gbmV3IG1vZGFsUHJvbXB0KHtcbiAgICAgICAgdGl0bGU6IFwiUmVuYW1lIHRoaXMgZmlsZVwiLFxuICAgICAgICBzdHlsZTogXCJ0ZXh0XCIsXG4gICAgICAgIG5hcnJvdzogdHJ1ZSxcbiAgICAgICAgc3VibWl0VGV4dDogXCJSZW5hbWVcIixcbiAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiVGhlIG5ldyBuYW1lIGZvciB0aGUgZmlsZTpcIixcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZTogcC5nZXROYW1lKClcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH0pO1xuICAgICAgLy8gbnVsbCByZXR1cm4gdmFsdWVzIGFyZSBmb3IgdGhlIFwiY2FuY2VsXCIgcGF0aFxuICAgICAgcmV0dXJuIHJlbmFtZVByb21wdC5zaG93KCkudGhlbihmdW5jdGlvbihuZXdOYW1lKSB7XG4gICAgICAgIGlmKG5ld05hbWUgPT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB3aW5kb3cuc3RpY2tNZXNzYWdlKFwiUmVuYW1pbmcuLi5cIik7XG4gICAgICAgIHByb2dyYW1Ub1NhdmUgPSBwLnJlbmFtZShuZXdOYW1lKTtcbiAgICAgICAgcmV0dXJuIHByb2dyYW1Ub1NhdmU7XG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocCkge1xuICAgICAgICBpZihwID09PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdXBkYXRlTmFtZShwKTtcbiAgICAgICAgd2luZG93LmZsYXNoTWVzc2FnZShcIlByb2dyYW0gc2F2ZWQgYXMgXCIgKyBwLmdldE5hbWUoKSk7XG4gICAgICB9KVxuICAgICAgLmZhaWwoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gcmVuYW1lOiBcIiwgZXJyKTtcbiAgICAgICAgd2luZG93LmZsYXNoRXJyb3IoXCJGYWlsZWQgdG8gcmVuYW1lIGZpbGVcIik7XG4gICAgICB9KTtcbiAgICB9KVxuICAgIC5mYWlsKGZ1bmN0aW9uKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihcIlVuYWJsZSB0byByZW5hbWU6IFwiLCBlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgJChcIiNydW5CdXR0b25cIikuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgQ1BPLmF1dG9TYXZlKCk7XG4gIH0pO1xuXG4gICQoXCIjbmV3XCIpLmNsaWNrKG5ld0V2ZW50KTtcbiAgJChcIiNzYXZlXCIpLmNsaWNrKHNhdmVFdmVudCk7XG4gICQoXCIjcmVuYW1lXCIpLmNsaWNrKHJlbmFtZSk7XG4gICQoXCIjc2F2ZWFzXCIpLmNsaWNrKHNhdmVBcyk7XG5cbiAgdmFyIGZvY3VzYWJsZUVsdHMgPSAkKGRvY3VtZW50KS5maW5kKCcjaGVhZGVyIC5mb2N1c2FibGUnKTtcbiAgLy9jb25zb2xlLmxvZygnZm9jdXNhYmxlRWx0cz0nLCBmb2N1c2FibGVFbHRzKVxuICB2YXIgdGhlVG9vbGJhciA9ICQoZG9jdW1lbnQpLmZpbmQoJyNUb29sYmFyJyk7XG5cbiAgZnVuY3Rpb24gZ2V0VG9wVGllck1lbnVpdGVtcygpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdkb2luZyBnZXRUb3BUaWVyTWVudWl0ZW1zJylcbiAgICB2YXIgdG9wVGllck1lbnVpdGVtcyA9ICQoZG9jdW1lbnQpLmZpbmQoJyNoZWFkZXIgdWwgbGkudG9wVGllcicpLnRvQXJyYXkoKTtcbiAgICB0b3BUaWVyTWVudWl0ZW1zID0gdG9wVGllck1lbnVpdGVtcy5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcihlbHQgPT4gIShlbHQuc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWx0LmdldEF0dHJpYnV0ZSgnZGlzYWJsZWQnKSA9PT0gJ2Rpc2FibGVkJykpO1xuICAgIHZhciBudW1Ub3BUaWVyTWVudWl0ZW1zID0gdG9wVGllck1lbnVpdGVtcy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1Ub3BUaWVyTWVudWl0ZW1zOyBpKyspIHtcbiAgICAgIHZhciBpdGhUb3BUaWVyTWVudWl0ZW0gPSB0b3BUaWVyTWVudWl0ZW1zW2ldO1xuICAgICAgdmFyIGlDaGlsZCA9ICQoaXRoVG9wVGllck1lbnVpdGVtKS5jaGlsZHJlbigpLmZpcnN0KCk7XG4gICAgICAvL2NvbnNvbGUubG9nKCdpQ2hpbGQ9JywgaUNoaWxkKTtcbiAgICAgIGlDaGlsZC5maW5kKCcuZm9jdXNhYmxlJykuXG4gICAgICAgIGF0dHIoJ2FyaWEtc2V0c2l6ZScsIG51bVRvcFRpZXJNZW51aXRlbXMudG9TdHJpbmcoKSkuXG4gICAgICAgIGF0dHIoJ2FyaWEtcG9zaW5zZXQnLCAoaSsxKS50b1N0cmluZygpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRvcFRpZXJNZW51aXRlbXM7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVFZGl0b3JIZWlnaHQoKSB7XG4gICAgdmFyIHRvb2xiYXJIZWlnaHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9wVGllclVsJykub2Zmc2V0SGVpZ2h0O1xuICAgIC8vIGdldHMgYnVtcGVkIHRvIDY3IG9uIGluaXRpYWwgcmVzaXplIHBlcnR1cmJhdGlvbiwgYnV0IGFjdHVhbCB2YWx1ZSBpcyBpbmRlZWQgNDBcbiAgICBpZiAodG9vbGJhckhlaWdodCA8IDgwKSB0b29sYmFySGVpZ2h0ID0gNDA7XG4gICAgdG9vbGJhckhlaWdodCArPSAncHgnO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdSRVBMJykuc3R5bGUucGFkZGluZ1RvcCA9IHRvb2xiYXJIZWlnaHQ7XG4gICAgdmFyIGRvY01haW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFpbicpO1xuICAgIHZhciBkb2NSZXBsTWFpbiA9IGRvY01haW4uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgncmVwbE1haW4nKTtcbiAgICBpZiAoZG9jUmVwbE1haW4ubGVuZ3RoICE9PSAwKSB7XG4gICAgICBkb2NSZXBsTWFpblswXS5zdHlsZS5wYWRkaW5nVG9wID0gdG9vbGJhckhlaWdodDtcbiAgICB9XG4gIH1cblxuICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsIHVwZGF0ZUVkaXRvckhlaWdodCk7XG5cbiAgZnVuY3Rpb24gaW5zZXJ0QXJpYVBvcyhzdWJtZW51KSB7XG4gICAgLy9jb25zb2xlLmxvZygnZG9pbmcgaW5zZXJ0QXJpYVBvcycsIHN1Ym1lbnUpXG4gICAgdmFyIGFyciA9IHN1Ym1lbnUudG9BcnJheSgpO1xuICAgIC8vY29uc29sZS5sb2coJ2Fycj0nLCBhcnIpO1xuICAgIHZhciBsZW4gPSBhcnIubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHZhciBlbHQgPSBhcnJbaV07XG4gICAgICAvL2NvbnNvbGUubG9nKCdlbHQnLCBpLCAnPScsIGVsdCk7XG4gICAgICBlbHQuc2V0QXR0cmlidXRlKCdhcmlhLXNldHNpemUnLCBsZW4udG9TdHJpbmcoKSk7XG4gICAgICBlbHQuc2V0QXR0cmlidXRlKCdhcmlhLXBvc2luc2V0JywgKGkrMSkudG9TdHJpbmcoKSk7XG4gICAgfVxuICB9XG5cblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICBoaWRlQWxsVG9wTWVudWl0ZW1zKCk7XG4gIH0pO1xuXG4gIHRoZVRvb2xiYXIuY2xpY2soZnVuY3Rpb24gKGUpIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICB9KTtcblxuICB0aGVUb29sYmFyLmtleWRvd24oZnVuY3Rpb24gKGUpIHtcbiAgICAvL2NvbnNvbGUubG9nKCd0b29sYmFyIGtleWRvd24nLCBlKTtcbiAgICAvL21vc3QgYW55IGtleSBhdCBhbGxcbiAgICB2YXIga2MgPSBlLmtleUNvZGU7XG4gICAgaWYgKGtjID09PSAyNykge1xuICAgICAgLy8gZXNjYXBlXG4gICAgICBoaWRlQWxsVG9wTWVudWl0ZW1zKCk7XG4gICAgICAvL2NvbnNvbGUubG9nKCdjYWxsaW5nIGN5Y2xlRm9jdXMgZnJvbSB0b29sYmFyJylcbiAgICAgIENQTy5jeWNsZUZvY3VzKCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0gZWxzZSBpZiAoa2MgPT09IDkgfHwga2MgPT09IDM3IHx8IGtjID09PSAzOCB8fCBrYyA9PT0gMzkgfHwga2MgPT09IDQwKSB7XG4gICAgICAvLyBhbiBhcnJvd1xuICAgICAgdmFyIHRhcmdldCA9ICQodGhpcykuZmluZCgnW3RhYkluZGV4PS0xXScpO1xuICAgICAgZ2V0VG9wVGllck1lbnVpdGVtcygpO1xuICAgICAgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7IC8vbmVlZGVkP1xuICAgICAgdGFyZ2V0LmZpcnN0KCkuZm9jdXMoKTsgLy9uZWVkZWQ/XG4gICAgICAvL2NvbnNvbGUubG9nKCdkb2NhY3RlbHQ9JywgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBoaWRlQWxsVG9wTWVudWl0ZW1zKCk7XG4gICAgfVxuICB9KTtcblxuICBmdW5jdGlvbiBjbGlja1RvcE1lbnVpdGVtKGUpIHtcbiAgICBoaWRlQWxsVG9wTWVudWl0ZW1zKCk7XG4gICAgdmFyIHRoaXNFbHQgPSAkKHRoaXMpO1xuICAgIC8vY29uc29sZS5sb2coJ2RvaW5nIGNsaWNrVG9wTWVudWl0ZW0gb24nLCB0aGlzRWx0KTtcbiAgICB2YXIgdG9wVGllclVsID0gdGhpc0VsdC5jbG9zZXN0KCd1bFtpZD10b3BUaWVyVWxdJyk7XG4gICAgaWYgKHRoaXNFbHRbMF0uaGFzQXR0cmlidXRlKCdhcmlhLWhpZGRlbicpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzRWx0WzBdLmdldEF0dHJpYnV0ZSgnZGlzYWJsZWQnKSA9PT0gJ2Rpc2FibGVkJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvL3ZhciBoaWRkZW5QID0gKHRoaXNFbHRbMF0uZ2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJykgPT09ICdmYWxzZScpO1xuICAgIC8vaGlkZGVuUCBhbHdheXMgZmFsc2U/XG4gICAgdmFyIHRoaXNUb3BNZW51aXRlbSA9IHRoaXNFbHQuY2xvc2VzdCgnbGkudG9wVGllcicpO1xuICAgIC8vY29uc29sZS5sb2coJ3RoaXNUb3BNZW51aXRlbT0nLCB0aGlzVG9wTWVudWl0ZW0pO1xuICAgIHZhciB0MSA9IHRoaXNUb3BNZW51aXRlbVswXTtcbiAgICB2YXIgc3VibWVudU9wZW4gPSAodGhpc0VsdFswXS5nZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnKSA9PT0gJ3RydWUnKTtcbiAgICBpZiAoIXN1Ym1lbnVPcGVuKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdoaWRkZW5wIHRydWUgYnJhbmNoJyk7XG4gICAgICBoaWRlQWxsVG9wTWVudWl0ZW1zKCk7XG4gICAgICB0aGlzVG9wTWVudWl0ZW0uY2hpbGRyZW4oJ3VsLnN1Ym1lbnUnKS5hdHRyKCdhcmlhLWhpZGRlbicsICdmYWxzZScpLnNob3coKTtcbiAgICAgIHRoaXNUb3BNZW51aXRlbS5jaGlsZHJlbigpLmZpcnN0KCkuZmluZCgnW2FyaWEtZXhwYW5kZWRdJykuYXR0cignYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ2hpZGRlbnAgZmFsc2UgYnJhbmNoJyk7XG4gICAgICB0aGlzVG9wTWVudWl0ZW0uY2hpbGRyZW4oJ3VsLnN1Ym1lbnUnKS5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJykuaGlkZSgpO1xuICAgICAgdGhpc1RvcE1lbnVpdGVtLmNoaWxkcmVuKCkuZmlyc3QoKS5maW5kKCdbYXJpYS1leHBhbmRlZF0nKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgfVxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH1cblxuICB2YXIgZXhwYW5kYWJsZUVsdHMgPSAkKGRvY3VtZW50KS5maW5kKCcjaGVhZGVyIFthcmlhLWV4cGFuZGVkXScpO1xuICBleHBhbmRhYmxlRWx0cy5jbGljayhjbGlja1RvcE1lbnVpdGVtKTtcblxuICBmdW5jdGlvbiBoaWRlQWxsVG9wTWVudWl0ZW1zKCkge1xuICAgIC8vY29uc29sZS5sb2coJ2RvaW5nIGhpZGVBbGxUb3BNZW51aXRlbXMnKTtcbiAgICB2YXIgdG9wVGllclVsID0gJChkb2N1bWVudCkuZmluZCgnI2hlYWRlciB1bFtpZD10b3BUaWVyVWxdJyk7XG4gICAgdG9wVGllclVsLmZpbmQoJ1thcmlhLWV4cGFuZGVkXScpLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcbiAgICB0b3BUaWVyVWwuZmluZCgndWwuc3VibWVudScpLmF0dHIoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKS5oaWRlKCk7XG4gIH1cblxuICB2YXIgbm9uZXhwYW5kYWJsZUVsdHMgPSAkKGRvY3VtZW50KS5maW5kKCcjaGVhZGVyIC50b3BUaWVyID4gZGl2ID4gYnV0dG9uOm5vdChbYXJpYS1leHBhbmRlZF0pJyk7XG4gIG5vbmV4cGFuZGFibGVFbHRzLmNsaWNrKGhpZGVBbGxUb3BNZW51aXRlbXMpO1xuXG4gIGZ1bmN0aW9uIHN3aXRjaFRvcE1lbnVpdGVtKGRlc3RUb3BNZW51aXRlbSwgZGVzdEVsdCkge1xuICAgIC8vY29uc29sZS5sb2coJ2RvaW5nIHN3aXRjaFRvcE1lbnVpdGVtJywgZGVzdFRvcE1lbnVpdGVtLCBkZXN0RWx0KTtcbiAgICAvL2NvbnNvbGUubG9nKCdkdG1pbD0nLCBkZXN0VG9wTWVudWl0ZW0ubGVuZ3RoKTtcbiAgICBoaWRlQWxsVG9wTWVudWl0ZW1zKCk7XG4gICAgaWYgKGRlc3RUb3BNZW51aXRlbSAmJiBkZXN0VG9wTWVudWl0ZW0ubGVuZ3RoICE9PSAwKSB7XG4gICAgICB2YXIgZWx0ID0gZGVzdFRvcE1lbnVpdGVtWzBdO1xuICAgICAgdmFyIGVsdElkID0gZWx0LmdldEF0dHJpYnV0ZSgnaWQnKTtcbiAgICAgIGRlc3RUb3BNZW51aXRlbS5jaGlsZHJlbigndWwuc3VibWVudScpLmF0dHIoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJykuc2hvdygpO1xuICAgICAgZGVzdFRvcE1lbnVpdGVtLmNoaWxkcmVuKCkuZmlyc3QoKS5maW5kKCdbYXJpYS1leHBhbmRlZF0nKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ3RydWUnKTtcbiAgICB9XG4gICAgaWYgKGRlc3RFbHQpIHtcbiAgICAgIC8vZGVzdEVsdC5hdHRyKCd0YWJJbmRleCcsICcwJykuZm9jdXMoKTtcbiAgICAgIGRlc3RFbHQuZm9jdXMoKTtcbiAgICB9XG4gIH1cblxuICB2YXIgc2hvd2luZ0hlbHBLZXlzID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gc2hvd0hlbHBLZXlzKCkge1xuICAgIHNob3dpbmdIZWxwS2V5cyA9IHRydWU7XG4gICAgJCgnI2hlbHAta2V5cycpLmZhZGVJbigxMDApO1xuICAgIHJlY2l0ZUhlbHAoKTtcbiAgfVxuXG4gIGZvY3VzYWJsZUVsdHMua2V5ZG93bihmdW5jdGlvbiAoZSkge1xuICAgIC8vY29uc29sZS5sb2coJ2ZvY3VzYWJsZSBlbHQga2V5ZG93bicsIGUpO1xuICAgIHZhciBrYyA9IGUua2V5Q29kZTtcbiAgICAvLyQodGhpcykuYmx1cigpOyAvLyBEZWxldGU/XG4gICAgdmFyIHdpdGhpblNlY29uZFRpZXJVbCA9IHRydWU7XG4gICAgdmFyIHRvcFRpZXJVbCA9ICQodGhpcykuY2xvc2VzdCgndWxbaWQ9dG9wVGllclVsXScpO1xuICAgIHZhciBzZWNvbmRUaWVyVWwgPSAkKHRoaXMpLmNsb3Nlc3QoJ3VsLnN1Ym1lbnUnKTtcbiAgICBpZiAoc2Vjb25kVGllclVsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgd2l0aGluU2Vjb25kVGllclVsID0gZmFsc2U7XG4gICAgfVxuICAgIGlmIChrYyA9PT0gMjcpIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ2VzY2FwZSBwcmVzc2VkIGknKVxuICAgICAgJCgnI2hlbHAta2V5cycpLmZhZGVPdXQoNTAwKTtcbiAgICB9XG4gICAgaWYgKGtjID09PSAyNyAmJiB3aXRoaW5TZWNvbmRUaWVyVWwpIHsgLy8gZXNjYXBlXG4gICAgICB2YXIgZGVzdFRvcE1lbnVpdGVtID0gJCh0aGlzKS5jbG9zZXN0KCdsaS50b3BUaWVyJyk7XG4gICAgICB2YXIgcG9zc0VsdHMgPSBkZXN0VG9wTWVudWl0ZW0uZmluZCgnLmZvY3VzYWJsZTpub3QoW2Rpc2FibGVkXSknKS5maWx0ZXIoJzp2aXNpYmxlJyk7XG4gICAgICBzd2l0Y2hUb3BNZW51aXRlbShkZXN0VG9wTWVudWl0ZW0sIHBvc3NFbHRzLmZpcnN0KCkpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9IGVsc2UgaWYgKGtjID09PSAzOSkgeyAvLyByaWdodGFycm93XG4gICAgICAvL2NvbnNvbGUubG9nKCdyaWdodGFycm93IHByZXNzZWQnKTtcbiAgICAgIHZhciBzcmNUb3BNZW51aXRlbSA9ICQodGhpcykuY2xvc2VzdCgnbGkudG9wVGllcicpO1xuICAgICAgLy9jb25zb2xlLmxvZygnc3JjVG9wTWVudWl0ZW09Jywgc3JjVG9wTWVudWl0ZW0pO1xuICAgICAgc3JjVG9wTWVudWl0ZW0uY2hpbGRyZW4oKS5maXJzdCgpLmZpbmQoJy5mb2N1c2FibGUnKS5hdHRyKCd0YWJJbmRleCcsICctMScpO1xuICAgICAgdmFyIHRvcFRpZXJNZW51aXRlbXMgPSBnZXRUb3BUaWVyTWVudWl0ZW1zKCk7XG4gICAgICAvL2NvbnNvbGUubG9nKCd0dG1pKiA9JywgdG9wVGllck1lbnVpdGVtcyk7XG4gICAgICB2YXIgdHRtaU4gPSB0b3BUaWVyTWVudWl0ZW1zLmxlbmd0aDtcbiAgICAgIHZhciBqID0gdG9wVGllck1lbnVpdGVtcy5pbmRleE9mKHNyY1RvcE1lbnVpdGVtWzBdKTtcbiAgICAgIC8vY29uc29sZS5sb2coJ2ogaW5pdGlhbD0nLCBqKTtcbiAgICAgIGZvciAodmFyIGkgPSAoaiArIDEpICUgdHRtaU47IGkgIT09IGo7IGkgPSAoaSArIDEpICUgdHRtaU4pIHtcbiAgICAgICAgdmFyIGRlc3RUb3BNZW51aXRlbSA9ICQodG9wVGllck1lbnVpdGVtc1tpXSk7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ2Rlc3RUb3BNZW51aXRlbShhKT0nLCBkZXN0VG9wTWVudWl0ZW0pO1xuICAgICAgICB2YXIgcG9zc0VsdHMgPSBkZXN0VG9wTWVudWl0ZW0uZmluZCgnLmZvY3VzYWJsZTpub3QoW2Rpc2FibGVkXSknKS5maWx0ZXIoJzp2aXNpYmxlJyk7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ3Bvc3NFbHRzPScsIHBvc3NFbHRzKVxuICAgICAgICBpZiAocG9zc0VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIC8vY29uc29sZS5sb2coJ2ZpbmFsIGk9JywgaSk7XG4gICAgICAgICAgLy9jb25zb2xlLmxvZygnbGFuZGluZyBvbicsIHBvc3NFbHRzLmZpcnN0KCkpO1xuICAgICAgICAgIHN3aXRjaFRvcE1lbnVpdGVtKGRlc3RUb3BNZW51aXRlbSwgcG9zc0VsdHMuZmlyc3QoKSk7XG4gICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoa2MgPT09IDM3KSB7IC8vIGxlZnRhcnJvd1xuICAgICAgLy9jb25zb2xlLmxvZygnbGVmdGFycm93IHByZXNzZWQnKTtcbiAgICAgIHZhciBzcmNUb3BNZW51aXRlbSA9ICQodGhpcykuY2xvc2VzdCgnbGkudG9wVGllcicpO1xuICAgICAgLy9jb25zb2xlLmxvZygnc3JjVG9wTWVudWl0ZW09Jywgc3JjVG9wTWVudWl0ZW0pO1xuICAgICAgc3JjVG9wTWVudWl0ZW0uY2hpbGRyZW4oKS5maXJzdCgpLmZpbmQoJy5mb2N1c2FibGUnKS5hdHRyKCd0YWJJbmRleCcsICctMScpO1xuICAgICAgdmFyIHRvcFRpZXJNZW51aXRlbXMgPSBnZXRUb3BUaWVyTWVudWl0ZW1zKCk7XG4gICAgICAvL2NvbnNvbGUubG9nKCd0dG1pKiA9JywgdG9wVGllck1lbnVpdGVtcyk7XG4gICAgICB2YXIgdHRtaU4gPSB0b3BUaWVyTWVudWl0ZW1zLmxlbmd0aDtcbiAgICAgIHZhciBqID0gdG9wVGllck1lbnVpdGVtcy5pbmRleE9mKHNyY1RvcE1lbnVpdGVtWzBdKTtcbiAgICAgIC8vY29uc29sZS5sb2coJ2ogaW5pdGlhbD0nLCBqKTtcbiAgICAgIGZvciAodmFyIGkgPSAoaiArIHR0bWlOIC0gMSkgJSB0dG1pTjsgaSAhPT0gajsgaSA9IChpICsgdHRtaU4gLSAxKSAlIHR0bWlOKSB7XG4gICAgICAgIHZhciBkZXN0VG9wTWVudWl0ZW0gPSAkKHRvcFRpZXJNZW51aXRlbXNbaV0pO1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdkZXN0VG9wTWVudWl0ZW0oYik9JywgZGVzdFRvcE1lbnVpdGVtKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnaT0nLCBpKVxuICAgICAgICB2YXIgcG9zc0VsdHMgPSBkZXN0VG9wTWVudWl0ZW0uZmluZCgnLmZvY3VzYWJsZTpub3QoW2Rpc2FibGVkXSknKS5maWx0ZXIoJzp2aXNpYmxlJyk7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ3Bvc3NFbHRzPScsIHBvc3NFbHRzKVxuICAgICAgICBpZiAocG9zc0VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIC8vY29uc29sZS5sb2coJ2ZpbmFsIGk9JywgaSk7XG4gICAgICAgICAgLy9jb25zb2xlLmxvZygnbGFuZGluZyBvbicsIHBvc3NFbHRzLmZpcnN0KCkpO1xuICAgICAgICAgIHN3aXRjaFRvcE1lbnVpdGVtKGRlc3RUb3BNZW51aXRlbSwgcG9zc0VsdHMuZmlyc3QoKSk7XG4gICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoa2MgPT09IDM4KSB7IC8vIHVwYXJyb3dcbiAgICAgIC8vY29uc29sZS5sb2coJ3VwYXJyb3cgcHJlc3NlZCcpO1xuICAgICAgdmFyIHN1Ym1lbnU7XG4gICAgICBpZiAod2l0aGluU2Vjb25kVGllclVsKSB7XG4gICAgICAgIHZhciBuZWFyU2licyA9ICQodGhpcykuY2xvc2VzdCgnZGl2JykuZmluZCgnLmZvY3VzYWJsZScpLmZpbHRlcignOnZpc2libGUnKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnbmVhclNpYnM9JywgbmVhclNpYnMpO1xuICAgICAgICB2YXIgbXlJZCA9ICQodGhpcylbMF0uZ2V0QXR0cmlidXRlKCdpZCcpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdteUlkPScsIG15SWQpO1xuICAgICAgICBzdWJtZW51ID0gJChbXSk7XG4gICAgICAgIHZhciB0aGlzRW5jb3VudGVyZWQgPSBmYWxzZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IG5lYXJTaWJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgaWYgKHRoaXNFbmNvdW50ZXJlZCkge1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnYWRkaW5nJywgbmVhclNpYnNbaV0pO1xuICAgICAgICAgICAgc3VibWVudSA9IHN1Ym1lbnUuYWRkKCQobmVhclNpYnNbaV0pKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKG5lYXJTaWJzW2ldLmdldEF0dHJpYnV0ZSgnaWQnKSA9PT0gbXlJZCkge1xuICAgICAgICAgICAgdGhpc0VuY291bnRlcmVkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy9jb25zb2xlLmxvZygnc3VibWVudSBzbyBmYXI9Jywgc3VibWVudSk7XG4gICAgICAgIHZhciBmYXJTaWJzID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpLnByZXZBbGwoKS5maW5kKCdkaXY6bm90KC5kaXNhYmxlZCknKVxuICAgICAgICAgIC5maW5kKCcuZm9jdXNhYmxlJykuZmlsdGVyKCc6dmlzaWJsZScpO1xuICAgICAgICBzdWJtZW51ID0gc3VibWVudS5hZGQoZmFyU2licyk7XG4gICAgICAgIGlmIChzdWJtZW51Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHN1Ym1lbnUgPSAkKHRoaXMpLmNsb3Nlc3QoJ2xpJykuY2xvc2VzdCgndWwnKS5maW5kKCdkaXY6bm90KC5kaXNhYmxlZCknKVxuICAgICAgICAgIC5maW5kKCcuZm9jdXNhYmxlJykuZmlsdGVyKCc6dmlzaWJsZScpLmxhc3QoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3VibWVudS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgc3VibWVudS5sYXN0KCkuZm9jdXMoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvKlxuICAgICAgICAgIC8vY29uc29sZS5sb2coJ25vIGFjdGlvbmFibGUgc3VibWVudSBmb3VuZCcpXG4gICAgICAgICAgdmFyIHRvcG1lbnVJdGVtID0gJCh0aGlzKS5jbG9zZXN0KCd1bC5zdWJtZW51JykuY2xvc2VzdCgnbGknKVxuICAgICAgICAgIC5jaGlsZHJlbigpLmZpcnN0KCkuZmluZCgnLmZvY3VzYWJsZTpub3QoW2Rpc2FibGVkXSknKS5maWx0ZXIoJzp2aXNpYmxlJyk7XG4gICAgICAgICAgaWYgKHRvcG1lbnVJdGVtLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRvcG1lbnVJdGVtLmZpcnN0KCkuZm9jdXMoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnbm8gYWN0aW9uYWJsZSB0b3BtZW51aXRlbSBmb3VuZCBlaXRoZXInKVxuICAgICAgICAgIH1cbiAgICAgICAgICAqL1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0gZWxzZSBpZiAoa2MgPT09IDQwKSB7IC8vIGRvd25hcnJvd1xuICAgICAgLy9jb25zb2xlLmxvZygnZG93bmFycm93IHByZXNzZWQnKTtcbiAgICAgIHZhciBzdWJtZW51RGl2cztcbiAgICAgIHZhciBzdWJtZW51O1xuICAgICAgaWYgKCF3aXRoaW5TZWNvbmRUaWVyVWwpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnMXN0IHRpZXInKVxuICAgICAgICBzdWJtZW51RGl2cyA9ICQodGhpcykuY2xvc2VzdCgnbGknKS5jaGlsZHJlbigndWwnKS5maW5kKCdkaXY6bm90KC5kaXNhYmxlZCknKTtcbiAgICAgICAgc3VibWVudSA9IHN1Ym1lbnVEaXZzLmZpbmQoJy5mb2N1c2FibGUnKS5maWx0ZXIoJzp2aXNpYmxlJyk7XG4gICAgICAgIGluc2VydEFyaWFQb3Moc3VibWVudSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCcybmQgdGllcicpXG4gICAgICAgIHZhciBuZWFyU2licyA9ICQodGhpcykuY2xvc2VzdCgnZGl2JykuZmluZCgnLmZvY3VzYWJsZScpLmZpbHRlcignOnZpc2libGUnKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnbmVhclNpYnM9JywgbmVhclNpYnMpO1xuICAgICAgICB2YXIgbXlJZCA9ICQodGhpcylbMF0uZ2V0QXR0cmlidXRlKCdpZCcpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdteUlkPScsIG15SWQpO1xuICAgICAgICBzdWJtZW51ID0gJChbXSk7XG4gICAgICAgIHZhciB0aGlzRW5jb3VudGVyZWQgPSBmYWxzZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuZWFyU2licy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICh0aGlzRW5jb3VudGVyZWQpIHtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ2FkZGluZycsIG5lYXJTaWJzW2ldKTtcbiAgICAgICAgICAgIHN1Ym1lbnUgPSBzdWJtZW51LmFkZCgkKG5lYXJTaWJzW2ldKSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChuZWFyU2lic1tpXS5nZXRBdHRyaWJ1dGUoJ2lkJykgPT09IG15SWQpIHtcbiAgICAgICAgICAgIHRoaXNFbmNvdW50ZXJlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vY29uc29sZS5sb2coJ3N1Ym1lbnUgc28gZmFyPScsIHN1Ym1lbnUpO1xuICAgICAgICB2YXIgZmFyU2licyA9ICQodGhpcykuY2xvc2VzdCgnbGknKS5uZXh0QWxsKCkuZmluZCgnZGl2Om5vdCguZGlzYWJsZWQpJylcbiAgICAgICAgICAuZmluZCgnLmZvY3VzYWJsZScpLmZpbHRlcignOnZpc2libGUnKTtcbiAgICAgICAgc3VibWVudSA9IHN1Ym1lbnUuYWRkKGZhclNpYnMpO1xuICAgICAgICBpZiAoc3VibWVudS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBzdWJtZW51ID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpLmNsb3Nlc3QoJ3VsJykuZmluZCgnZGl2Om5vdCguZGlzYWJsZWQpJylcbiAgICAgICAgICAgIC5maW5kKCcuZm9jdXNhYmxlJykuZmlsdGVyKCc6dmlzaWJsZScpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvL2NvbnNvbGUubG9nKCdzdWJtZW51PScsIHN1Ym1lbnUpXG4gICAgICBpZiAoc3VibWVudS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHN1Ym1lbnUuZmlyc3QoKS5mb2N1cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnbm8gYWN0aW9uYWJsZSBzdWJtZW51IGZvdW5kJylcbiAgICAgIH1cbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSBlbHNlIGlmIChrYyA9PT0gMjcpIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ2VzYyBwcmVzc2VkJyk7XG4gICAgICBoaWRlQWxsVG9wTWVudWl0ZW1zKCk7XG4gICAgICBpZiAoc2hvd2luZ0hlbHBLZXlzKSB7XG4gICAgICAgIHNob3dpbmdIZWxwS2V5cyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnY2FsbGluZyBjeWNsZUZvY3VzIGlpJylcbiAgICAgICAgQ1BPLmN5Y2xlRm9jdXMoKTtcbiAgICAgIH1cbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAvLyQodGhpcykuY2xvc2VzdCgnbmF2JykuY2xvc2VzdCgnbWFpbicpLmZvY3VzKCk7XG4gICAgfSBlbHNlIGlmIChrYyA9PT0gOSApIHtcbiAgICAgIGlmIChlLnNoaWZ0S2V5KSB7XG4gICAgICAgIGhpZGVBbGxUb3BNZW51aXRlbXMoKTtcbiAgICAgICAgQ1BPLmN5Y2xlRm9jdXModHJ1ZSk7XG4gICAgICB9XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0gZWxzZSBpZiAoa2MgPT09IDEzIHx8IGtjID09PSAxNyB8fCBrYyA9PT0gMjAgfHwga2MgPT09IDMyKSB7XG4gICAgICAvLyAxMz1lbnRlciAxNz1jdHJsIDIwPWNhcHNsb2NrIDMyPXNwYWNlXG4gICAgICAvL2NvbnNvbGUubG9nKCdzdG9wcHJvcCAxJylcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSBlbHNlIGlmIChrYyA+PSAxMTIgJiYga2MgPD0gMTIzKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdkb3Byb3AgMScpXG4gICAgICAvLyBmbiBrZXlzXG4gICAgICAvLyBnbyBhaGVhZCwgcHJvcGFnYXRlXG4gICAgfSBlbHNlIGlmIChlLmN0cmxLZXkgJiYga2MgPT09IDE5MSkge1xuICAgICAgLy9jb25zb2xlLmxvZygnQy0/IHByZXNzZWQnKVxuICAgICAgc2hvd0hlbHBLZXlzKCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdzdG9wcHJvcCAyJylcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfVxuICAgIC8vZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfSk7XG5cbiAgLy8gc2hhcmVBUEkubWFrZUhvdmVyTWVudSgkKFwiI2ZpbGVtZW51XCIpLCAkKFwiI2ZpbGVtZW51Q29udGVudHNcIiksIGZhbHNlLCBmdW5jdGlvbigpe30pO1xuICAvLyBzaGFyZUFQSS5tYWtlSG92ZXJNZW51KCQoXCIjYm9ubmllbWVudVwiKSwgJChcIiNib25uaWVtZW51Q29udGVudHNcIiksIGZhbHNlLCBmdW5jdGlvbigpe30pO1xuXG5cbiAgdmFyIGNvZGVDb250YWluZXIgPSAkKFwiPGRpdj5cIikuYWRkQ2xhc3MoXCJyZXBsTWFpblwiKTtcbiAgY29kZUNvbnRhaW5lci5hdHRyKFwicm9sZVwiLCBcInJlZ2lvblwiKS5cbiAgICBhdHRyKFwiYXJpYS1sYWJlbFwiLCBcIkRlZmluaXRpb25zXCIpO1xuICAgIC8vYXR0cihcInRhYkluZGV4XCIsIFwiLTFcIik7XG4gICQoXCIjbWFpblwiKS5wcmVwZW5kKGNvZGVDb250YWluZXIpO1xuXG5cbiAgaWYocGFyYW1zW1wiZ2V0XCJdW1wiaGlkZURlZmluaXRpb25zXCJdKSB7XG4gICAgJChcIi5yZXBsTWFpblwiKS5hdHRyKFwiYXJpYS1oaWRkZW5cIiwgdHJ1ZSkuYXR0cihcInRhYmluZGV4XCIsICctMScpO1xuICB9XG4gIFxuICBjb25zdCBpc0NvbnRyb2xsZWQgPSBwYXJhbXNbXCJnZXRcIl1bXCJjb250cm9sbGVkXCJdO1xuICBjb25zdCBoYXNXYXJuT25FeGl0ID0gKFwid2Fybk9uRXhpdFwiIGluIHBhcmFtc1tcImdldFwiXSk7XG4gIGNvbnN0IHNraXBXYXJuaW5nID0gaGFzV2Fybk9uRXhpdCAmJiAocGFyYW1zW1wiZ2V0XCJdW1wid2Fybk9uRXhpdFwiXSA9PT0gXCJmYWxzZVwiKTtcblxuICBpZighaXNDb250cm9sbGVkICYmICFza2lwV2FybmluZykge1xuICAgICQod2luZG93KS5iaW5kKFwiYmVmb3JldW5sb2FkXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFwiQmVjYXVzZSB0aGlzIHBhZ2UgY2FuIGxvYWQgc2xvd2x5LCBhbmQgeW91IG1heSBoYXZlIG91dHN0YW5kaW5nIGNoYW5nZXMsIHdlIGFzayB0aGF0IHlvdSBjb25maXJtIGJlZm9yZSBsZWF2aW5nIHRoZSBlZGl0b3IgaW4gY2FzZSBjbG9zaW5nIHdhcyBhbiBhY2NpZGVudC5cIjtcbiAgICB9KTtcbiAgfVxuXG4gIENQTy5lZGl0b3IgPSBDUE8ubWFrZUVkaXRvcihjb2RlQ29udGFpbmVyLCB7XG4gICAgcnVuQnV0dG9uOiAkKFwiI3J1bkJ1dHRvblwiKSxcbiAgICBzaW1wbGVFZGl0b3I6IGZhbHNlLFxuICAgIHJ1bjogQ1BPLlJVTl9DT0RFLFxuICAgIGluaXRpYWxHYXM6IDEwMCxcbiAgICBzY3JvbGxQYXN0RW5kOiB0cnVlLFxuICB9KTtcbiAgQ1BPLmVkaXRvci5jbS5zZXRPcHRpb24oXCJyZWFkT25seVwiLCBcIm5vY3Vyc29yXCIpO1xuICBDUE8uZWRpdG9yLmNtLnNldE9wdGlvbihcImxvbmdMaW5lc1wiLCBuZXcgTWFwKCkpO1xuICBmdW5jdGlvbiByZW1vdmVTaG9ydGVuZWRMaW5lKGxpbmVIYW5kbGUpIHtcbiAgICB2YXIgcnVsZXJzID0gQ1BPLmVkaXRvci5jbS5nZXRPcHRpb24oXCJydWxlcnNcIik7XG4gICAgdmFyIHJ1bGVyc01pbkNvbCA9IENQTy5lZGl0b3IuY20uZ2V0T3B0aW9uKFwicnVsZXJzTWluQ29sXCIpO1xuICAgIHZhciBsb25nTGluZXMgPSBDUE8uZWRpdG9yLmNtLmdldE9wdGlvbihcImxvbmdMaW5lc1wiKTtcbiAgICBpZiAobGluZUhhbmRsZS50ZXh0Lmxlbmd0aCA8PSBydWxlcnNNaW5Db2wpIHtcbiAgICAgIGxpbmVIYW5kbGUucnVsZXJMaXN0ZW5lcnMuZm9yRWFjaCgoZiwgZXZ0KSA9PiBsaW5lSGFuZGxlLm9mZihldnQsIGYpKTtcbiAgICAgIGxvbmdMaW5lcy5kZWxldGUobGluZUhhbmRsZSk7XG4gICAgICAvLyBjb25zb2xlLmxvZyhcIlJlbW92ZWQgXCIsIGxpbmVIYW5kbGUpO1xuICAgICAgcmVmcmVzaFJ1bGVycygpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBkZWxldGVMaW5lKGxpbmVIYW5kbGUpIHtcbiAgICB2YXIgbG9uZ0xpbmVzID0gQ1BPLmVkaXRvci5jbS5nZXRPcHRpb24oXCJsb25nTGluZXNcIik7XG4gICAgbGluZUhhbmRsZS5ydWxlckxpc3RlbmVycy5mb3JFYWNoKChmLCBldnQpID0+IGxpbmVIYW5kbGUub2ZmKGV2dCwgZikpO1xuICAgIGxvbmdMaW5lcy5kZWxldGUobGluZUhhbmRsZSk7XG4gICAgLy8gY29uc29sZS5sb2coXCJSZW1vdmVkIFwiLCBsaW5lSGFuZGxlKTtcbiAgICByZWZyZXNoUnVsZXJzKCk7XG4gIH1cbiAgZnVuY3Rpb24gcmVmcmVzaFJ1bGVycygpIHtcbiAgICB2YXIgcnVsZXJzID0gQ1BPLmVkaXRvci5jbS5nZXRPcHRpb24oXCJydWxlcnNcIik7XG4gICAgdmFyIGxvbmdMaW5lcyA9IENQTy5lZGl0b3IuY20uZ2V0T3B0aW9uKFwibG9uZ0xpbmVzXCIpO1xuICAgIHZhciBtaW5MZW5ndGg7XG4gICAgaWYgKGxvbmdMaW5lcy5zaXplID09PSAwKSB7XG4gICAgICBtaW5MZW5ndGggPSAwOyAvLyBpZiB0aGVyZSBhcmUgbm8gbG9uZyBsaW5lcywgdGhlbiB3ZSBkb24ndCBjYXJlIGFib3V0IHNob3dpbmcgYW55IHJ1bGVyc1xuICAgIH0gZWxzZSB7XG4gICAgICBtaW5MZW5ndGggPSBOdW1iZXIuTUFYX1ZBTFVFO1xuICAgICAgbG9uZ0xpbmVzLmZvckVhY2goZnVuY3Rpb24obGluZU5vLCBsaW5lSGFuZGxlKSB7XG4gICAgICAgIGlmIChsaW5lSGFuZGxlLnRleHQubGVuZ3RoIDwgbWluTGVuZ3RoKSB7IG1pbkxlbmd0aCA9IGxpbmVIYW5kbGUudGV4dC5sZW5ndGg7IH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJ1bGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHJ1bGVyc1tpXS5jb2x1bW4gPj0gbWluTGVuZ3RoKSB7XG4gICAgICAgIHJ1bGVyc1tpXS5jbGFzc05hbWUgPSBcImhpZGRlblwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcnVsZXJzW2ldLmNsYXNzTmFtZSA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gZ290dGEgc2V0IHRoZSBvcHRpb24gdHdpY2UsIG9yIGVsc2UgQ00gc2hvcnQtY2lyY3VpdHMgYW5kIGlnbm9yZXMgaXRcbiAgICBDUE8uZWRpdG9yLmNtLnNldE9wdGlvbihcInJ1bGVyc1wiLCB1bmRlZmluZWQpO1xuICAgIENQTy5lZGl0b3IuY20uc2V0T3B0aW9uKFwicnVsZXJzXCIsIHJ1bGVycyk7XG4gIH1cbiAgQ1BPLmVkaXRvci5jbS5vbignY2hhbmdlcycsIGZ1bmN0aW9uKGluc3RhbmNlLCBjaGFuZ2VPYmpzKSB7XG4gICAgdmFyIG1pbkxpbmUgPSBpbnN0YW5jZS5sYXN0TGluZSgpLCBtYXhMaW5lID0gMDtcbiAgICB2YXIgcnVsZXJzTWluQ29sID0gaW5zdGFuY2UuZ2V0T3B0aW9uKFwicnVsZXJzTWluQ29sXCIpO1xuICAgIHZhciBsb25nTGluZXMgPSBpbnN0YW5jZS5nZXRPcHRpb24oXCJsb25nTGluZXNcIik7XG4gICAgY2hhbmdlT2Jqcy5mb3JFYWNoKGZ1bmN0aW9uKGNoYW5nZSkge1xuICAgICAgaWYgKG1pbkxpbmUgPiBjaGFuZ2UuZnJvbS5saW5lKSB7IG1pbkxpbmUgPSBjaGFuZ2UuZnJvbS5saW5lOyB9XG4gICAgICBpZiAobWF4TGluZSA8IGNoYW5nZS5mcm9tLmxpbmUgKyBjaGFuZ2UudGV4dC5sZW5ndGgpIHsgbWF4TGluZSA9IGNoYW5nZS5mcm9tLmxpbmUgKyBjaGFuZ2UudGV4dC5sZW5ndGg7IH1cbiAgICB9KTtcbiAgICB2YXIgY2hhbmdlZCA9IGZhbHNlO1xuICAgIGluc3RhbmNlLmVhY2hMaW5lKG1pbkxpbmUsIG1heExpbmUsIGZ1bmN0aW9uKGxpbmVIYW5kbGUpIHtcbiAgICAgIGlmIChsaW5lSGFuZGxlLnRleHQubGVuZ3RoID4gcnVsZXJzTWluQ29sKSB7XG4gICAgICAgIGlmICghbG9uZ0xpbmVzLmhhcyhsaW5lSGFuZGxlKSkge1xuICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgIGxvbmdMaW5lcy5zZXQobGluZUhhbmRsZSwgbGluZUhhbmRsZS5saW5lTm8oKSk7XG4gICAgICAgICAgbGluZUhhbmRsZS5ydWxlckxpc3RlbmVycyA9IG5ldyBNYXAoW1xuICAgICAgICAgICAgW1wiY2hhbmdlXCIsIHJlbW92ZVNob3J0ZW5lZExpbmVdLFxuICAgICAgICAgICAgW1wiZGVsZXRlXCIsIGZ1bmN0aW9uKCkgeyAvLyBuZWVkZWQgYmVjYXVzZSB0aGUgZGVsZXRlIGhhbmRsZXIgZ2V0cyBubyBhcmd1bWVudHMgYXQgYWxsXG4gICAgICAgICAgICAgIGRlbGV0ZUxpbmUobGluZUhhbmRsZSk7XG4gICAgICAgICAgICB9XVxuICAgICAgICAgIF0pO1xuICAgICAgICAgIGxpbmVIYW5kbGUucnVsZXJMaXN0ZW5lcnMuZm9yRWFjaCgoZiwgZXZ0KSA9PiBsaW5lSGFuZGxlLm9uKGV2dCwgZikpO1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQWRkZWQgXCIsIGxpbmVIYW5kbGUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobG9uZ0xpbmVzLmhhcyhsaW5lSGFuZGxlKSkge1xuICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgIGxvbmdMaW5lcy5kZWxldGUobGluZUhhbmRsZSk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coXCJSZW1vdmVkIFwiLCBsaW5lSGFuZGxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICByZWZyZXNoUnVsZXJzKCk7XG4gICAgfVxuICB9KTtcblxuICBwcm9ncmFtTG9hZGVkLnRoZW4oZnVuY3Rpb24oYykge1xuICAgIENQTy5kb2N1bWVudHMuc2V0KFwiZGVmaW5pdGlvbnM6Ly9cIiwgQ1BPLmVkaXRvci5jbS5nZXREb2MoKSk7XG4gICAgaWYoYyA9PT0gXCJcIikge1xuICAgICAgYyA9IENPTlRFWFRfRk9SX05FV19GSUxFUztcbiAgICB9XG5cbiAgICBpZiAoYy5zdGFydHNXaXRoKFwiPHNjcmlwdHNvbmx5XCIpKSB7XG4gICAgICAvLyB0aGlzIGlzIGJsb2NrcyBmaWxlLiBPcGVuIGl0IHdpdGggL2Jsb2Nrc1xuICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5yZXBsYWNlKCdlZGl0b3InLCAnYmxvY2tzJyk7XG4gICAgfVxuXG4gICAgaWYoIXBhcmFtc1tcImdldFwiXVtcImNvbnRyb2xsZWRcIl0pIHtcbiAgICAgIC8vIE5PVEUoam9lKTogQ2xlYXJpbmcgaGlzdG9yeSB0byBhZGRyZXNzIGh0dHBzOi8vZ2l0aHViLmNvbS9icm93bnBsdC9weXJldC1sYW5nL2lzc3Vlcy8zODYsXG4gICAgICAvLyBpbiB3aGljaCB1bmRvIGNhbiByZXZlcnQgdGhlIHByb2dyYW0gYmFjayB0byBlbXB0eVxuICAgICAgQ1BPLmVkaXRvci5jbS5zZXRWYWx1ZShjKTtcbiAgICAgIENQTy5lZGl0b3IuY20uY2xlYXJIaXN0b3J5KCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29uc3QgaGlkZVdoZW5Db250cm9sbGVkID0gW1xuICAgICAgICBcIiNsb2dnaW5nXCIsXG4gICAgICAgIFwiI2xvZ291dFwiXG4gICAgICBdO1xuICAgICAgY29uc3QgcmVtb3ZlV2hlbkNvbnRyb2xsZWQgPSBbXG4gICAgICAgIFwiI2Nvbm5lY3RCdXR0b25saVwiLFxuICAgICAgXTtcbiAgICAgIGhpZGVXaGVuQ29udHJvbGxlZC5mb3JFYWNoKHMgPT4gJChzKS5oaWRlKCkpO1xuICAgICAgcmVtb3ZlV2hlbkNvbnRyb2xsZWQuZm9yRWFjaChzID0+ICQocykucmVtb3ZlKCkpO1xuICAgIH1cblxuICB9KTtcblxuICBwcm9ncmFtTG9hZGVkLmZhaWwoZnVuY3Rpb24oZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiUHJvZ3JhbSBjb250ZW50cyBkaWQgbm90IGxvYWQ6IFwiLCBlcnJvcik7XG4gICAgQ1BPLmRvY3VtZW50cy5zZXQoXCJkZWZpbml0aW9uczovL1wiLCBDUE8uZWRpdG9yLmNtLmdldERvYygpKTtcbiAgfSk7XG5cbiAgY29uc29sZS5sb2coXCJBYm91dCB0byBsb2FkIFB5cmV0OiBcIiwgb3JpZ2luYWxQYWdlTG9hZCwgRGF0ZS5ub3coKSk7XG5cbiAgdmFyIHB5cmV0TG9hZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICBjb25zb2xlLmxvZyh3aW5kb3cuUFlSRVQpO1xuICBweXJldExvYWQuc3JjID0gd2luZG93LlBZUkVUO1xuICBweXJldExvYWQudHlwZSA9IFwidGV4dC9qYXZhc2NyaXB0XCI7XG4gIHB5cmV0TG9hZC5zZXRBdHRyaWJ1dGUoXCJjcm9zc29yaWdpblwiLCBcImFub255bW91c1wiKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChweXJldExvYWQpO1xuXG4gIHZhciBweXJldExvYWQyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cbiAgZnVuY3Rpb24gbG9nRmFpbHVyZUFuZE1hbnVhbEZldGNoKHVybCwgZSkge1xuXG4gICAgLy8gTk9URShqb2UpOiBUaGUgZXJyb3IgcmVwb3J0ZWQgYnkgdGhlIFwiZXJyb3JcIiBldmVudCBoYXMgZXNzZW50aWFsbHkgbm9cbiAgICAvLyBpbmZvcm1hdGlvbiBvbiBpdDsgaXQncyBqdXN0IGEgbm90aWZpY2F0aW9uIHRoYXQgX3NvbWV0aGluZ18gd2VudCB3cm9uZy5cbiAgICAvLyBTbywgd2UgbG9nIHRoYXQgc29tZXRoaW5nIGhhcHBlbmVkLCB0aGVuIGltbWVkaWF0ZWx5IGRvIGFuIEFKQVggcmVxdWVzdFxuICAgIC8vIGNhbGwgZm9yIHRoZSBzYW1lIFVSTCwgdG8gc2VlIGlmIHdlIGNhbiBnZXQgbW9yZSBpbmZvcm1hdGlvbi4gVGhpc1xuICAgIC8vIGRvZXNuJ3QgcGVyZmVjdGx5IHRlbGwgdXMgYWJvdXQgdGhlIG9yaWdpbmFsIGZhaWx1cmUsIGJ1dCBpdCdzXG4gICAgLy8gc29tZXRoaW5nLlxuXG4gICAgLy8gSW4gYWRkaXRpb24sIGlmIHNvbWVvbmUgaXMgc2VlaW5nIHRoZSBQeXJldCBmYWlsZWQgdG8gbG9hZCBlcnJvciwgYnV0IHdlXG4gICAgLy8gZG9uJ3QgZ2V0IHRoZXNlIGxvZ2dpbmcgZXZlbnRzLCB3ZSBoYXZlIGEgc3Ryb25nIGhpbnQgdGhhdCBzb21ldGhpbmcgaXNcbiAgICAvLyB1cCB3aXRoIHRoZWlyIG5ldHdvcmsuXG4gICAgbG9nZ2VyLmxvZygncHlyZXQtbG9hZC1mYWlsdXJlJyxcbiAgICAgIHtcbiAgICAgICAgZXZlbnQgOiAnaW5pdGlhbC1mYWlsdXJlJyxcbiAgICAgICAgdXJsIDogdXJsLFxuXG4gICAgICAgIC8vIFRoZSB0aW1lc3RhbXAgYXBwZWFycyB0byBjb3VudCBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgcGFnZSBsb2FkLFxuICAgICAgICAvLyB3aGljaCBtYXkgYXBwcm94aW1hdGUgZG93bmxvYWQgdGltZSBpZiwgc2F5LCByZXF1ZXN0cyBhcmUgdGltaW5nIG91dFxuICAgICAgICAvLyBvciBnZXR0aW5nIGN1dCBvZmYuXG5cbiAgICAgICAgdGltZVN0YW1wIDogZS50aW1lU3RhbXBcbiAgICAgIH0pO1xuXG4gICAgdmFyIG1hbnVhbEZldGNoID0gJC5hamF4KHVybCk7XG4gICAgbWFudWFsRmV0Y2gudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgIC8vIEhlcmUsIHdlIGxvZyB0aGUgZmlyc3QgMTAwIGNoYXJhY3RlcnMgb2YgdGhlIHJlc3BvbnNlIHRvIG1ha2Ugc3VyZVxuICAgICAgLy8gdGhleSByZXNlbWJsZSB0aGUgUHlyZXQgYmxvYlxuICAgICAgbG9nZ2VyLmxvZygncHlyZXQtbG9hZC1mYWlsdXJlJywge1xuICAgICAgICBldmVudCA6ICdzdWNjZXNzLXdpdGgtYWpheCcsXG4gICAgICAgIGNvbnRlbnRzUHJlZml4IDogcmVzLnNsaWNlKDAsIDEwMClcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIG1hbnVhbEZldGNoLmZhaWwoZnVuY3Rpb24ocmVzKSB7XG4gICAgICBsb2dnZXIubG9nKCdweXJldC1sb2FkLWZhaWx1cmUnLCB7XG4gICAgICAgIGV2ZW50IDogJ2ZhaWx1cmUtd2l0aC1hamF4JyxcbiAgICAgICAgc3RhdHVzOiByZXMuc3RhdHVzLFxuICAgICAgICBzdGF0dXNUZXh0OiByZXMuc3RhdHVzVGV4dCxcbiAgICAgICAgLy8gU2luY2UgcmVzcG9uc2VUZXh0IGNvdWxkIGJlIGEgbG9uZyBlcnJvciBwYWdlLCBhbmQgd2UgZG9uJ3Qgd2FudCB0b1xuICAgICAgICAvLyBsb2cgaHVnZSBwYWdlcywgd2Ugc2xpY2UgaXQgdG8gMTAwIGNoYXJhY3RlcnMsIHdoaWNoIGlzIGVub3VnaCB0b1xuICAgICAgICAvLyB0ZWxsIHVzIHdoYXQncyBnb2luZyBvbiAoZS5nLiBBV1MgZmFpbHVyZSwgbmV0d29yayBvdXRhZ2UpLlxuICAgICAgICByZXNwb25zZVRleHQ6IHJlcy5yZXNwb25zZVRleHQuc2xpY2UoMCwgMTAwKVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAkKHB5cmV0TG9hZCkub24oXCJlcnJvclwiLCBmdW5jdGlvbihlKSB7XG4gICAgbG9nRmFpbHVyZUFuZE1hbnVhbEZldGNoKHdpbmRvdy5QWVJFVCwgZSk7XG4gICAgcHlyZXRMb2FkMi5zcmMgPSBwcm9jZXNzLmVudi5QWVJFVF9CQUNLVVA7XG4gICAgcHlyZXRMb2FkMi50eXBlID0gXCJ0ZXh0L2phdmFzY3JpcHRcIjtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHB5cmV0TG9hZDIpO1xuICB9KTtcblxuICAkKHB5cmV0TG9hZDIpLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24oZSkge1xuICAgICQoXCIjbG9hZGVyXCIpLmhpZGUoKTtcbiAgICAkKFwiI3J1blBhcnRcIikuaGlkZSgpO1xuICAgICQoXCIjYnJlYWtCdXR0b25cIikuaGlkZSgpO1xuICAgIHdpbmRvdy5zdGlja0Vycm9yKFwiUHlyZXQgZmFpbGVkIHRvIGxvYWQ7IGNoZWNrIHlvdXIgY29ubmVjdGlvbiBvciB0cnkgcmVmcmVzaGluZyB0aGUgcGFnZS4gIElmIHRoaXMgaGFwcGVucyByZXBlYXRlZGx5LCBwbGVhc2UgcmVwb3J0IGl0IGFzIGEgYnVnLlwiKTtcbiAgICBsb2dGYWlsdXJlQW5kTWFudWFsRmV0Y2gocHJvY2Vzcy5lbnYuUFlSRVRfQkFDS1VQLCBlKTtcblxuICB9KTtcblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImZvY3VzXCIsIChlKSA9PiB7XG4gICAgaWYoYWN0aXZlRWRpdG9yKSB7IGFjdGl2ZUVkaXRvci5mb2N1cygpOyB9XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIG1ha2VFdmVudCgpIHtcbiAgICBjb25zdCBoYW5kbGVycyA9IFtdO1xuICAgIGZ1bmN0aW9uIG9uKGhhbmRsZXIpIHtcbiAgICAgIGhhbmRsZXJzLnB1c2goaGFuZGxlcik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRyaWdnZXIodikge1xuICAgICAgaGFuZGxlcnMuZm9yRWFjaChoID0+IGgodikpO1xuICAgIH1cbiAgICByZXR1cm4gW29uLCB0cmlnZ2VyXTtcbiAgfVxuICBsZXQgWyBvblJ1biwgdHJpZ2dlck9uUnVuIF0gPSBtYWtlRXZlbnQoKTtcbiAgbGV0IFsgb25JbnRlcmFjdGlvbiwgdHJpZ2dlck9uSW50ZXJhY3Rpb24gXSA9IG1ha2VFdmVudCgpO1xuICBsZXQgWyBvbkxvYWQsIHRyaWdnZXJPbkxvYWQgXSA9IG1ha2VFdmVudCgpO1xuXG4gIHByb2dyYW1Mb2FkZWQuZmluKGZ1bmN0aW9uKCkge1xuICAgIENQTy5lZGl0b3IuZm9jdXMoKTtcbiAgICBDUE8uZWRpdG9yLmNtLnNldE9wdGlvbihcInJlYWRPbmx5XCIsIGZhbHNlKTtcbiAgfSk7XG5cbiAgQ1BPLmF1dG9TYXZlID0gYXV0b1NhdmU7XG4gIENQTy5zYXZlID0gc2F2ZTtcbiAgQ1BPLnVwZGF0ZU5hbWUgPSB1cGRhdGVOYW1lO1xuICBDUE8uc2hvd1NoYXJlQ29udGFpbmVyID0gc2hvd1NoYXJlQ29udGFpbmVyO1xuICBDUE8ubG9hZFByb2dyYW0gPSBsb2FkUHJvZ3JhbTtcbiAgQ1BPLnN0b3JhZ2VBUEkgPSBzdG9yYWdlQVBJO1xuICBDUE8uY3ljbGVGb2N1cyA9IGN5Y2xlRm9jdXM7XG4gIENQTy5zYXkgPSBzYXk7XG4gIENQTy5zYXlBbmRGb3JnZXQgPSBzYXlBbmRGb3JnZXQ7XG4gIENQTy5ldmVudHMgPSB7XG4gICAgb25SdW4sXG4gICAgdHJpZ2dlck9uUnVuLFxuICAgIG9uSW50ZXJhY3Rpb24sXG4gICAgdHJpZ2dlck9uSW50ZXJhY3Rpb24sXG4gICAgb25Mb2FkLFxuICAgIHRyaWdnZXJPbkxvYWRcbiAgfTtcblxuICAvLyBXZSBuZXZlciB3YW50IGludGVyYWN0aW9ucyB0byBiZSBoaWRkZW4gKndoZW4gcnVubmluZyBjb2RlKi5cbiAgLy8gU28gaGlkZUludGVyYWN0aW9ucyBzaG91bGQgZ28gYXdheSBhcyBzb29uIGFzIHJ1biBpcyBjbGlja2VkXG4gIENQTy5ldmVudHMub25SdW4oKCkgPT4geyBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRlSW50ZXJhY3Rpb25zXCIpOyB9KTtcblxuICBsZXQgaW5pdGlhbFN0YXRlID0gcGFyYW1zW1wiZ2V0XCJdW1wiaW5pdGlhbFN0YXRlXCJdO1xuXG4gIHdpbmRvdy5QWVJFVF9JU19FTUJFRERFRCA9IGZhbHNlO1xuICB3aW5kb3cuUFlSRVRfSU5fVlNDT0RFID0gZmFsc2U7XG4gIGlmICh0eXBlb2YgYWNxdWlyZVZzQ29kZUFwaSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgd2luZG93Lk1FU1NBR0VTID0gbWFrZUV2ZW50cyh7XG4gICAgICBDUE86IENQTyxcbiAgICAgIHNlbmRQb3J0OiBhY3F1aXJlVnNDb2RlQXBpKCksXG4gICAgICByZWNlaXZlUG9ydDogd2luZG93LFxuICAgICAgaW5pdGlhbFN0YXRlXG4gICAgfSk7XG4gICAgd2luZG93LlBZUkVUX0lTX0VNQkVEREVEID0gdHJ1ZTtcbiAgICB3aW5kb3cuUFlSRVRfSU5fVlNDT0RFID0gdHJ1ZTtcbiAgfVxuICBlbHNlIGlmKCh3aW5kb3cucGFyZW50ICYmICh3aW5kb3cucGFyZW50ICE9PSB3aW5kb3cpKSkge1xuICAgIHdpbmRvdy5NRVNTQUdFUyA9IG1ha2VFdmVudHMoeyBDUE86IENQTywgc2VuZFBvcnQ6IHdpbmRvdy5wYXJlbnQsIHJlY2VpdmVQb3J0OiB3aW5kb3csIGluaXRpYWxTdGF0ZSB9KTtcbiAgICB3aW5kb3cuUFlSRVRfSVNfRU1CRURERUQgPSB0cnVlO1xuICB9XG59KTtcbiJdLCJuYW1lcyI6WyJkZWZpbmUiLCJRIiwiYXV0b0hpZ2hsaWdodEJveCIsInRleHQiLCJ0ZXh0Qm94IiwiJCIsImFkZENsYXNzIiwiYXR0ciIsIm9uIiwic2VsZWN0IiwidmFsIiwicHJvbXB0UXVldWUiLCJzdHlsZXMiLCJ3aW5kb3ciLCJtb2RhbHMiLCJQcm9tcHQiLCJvcHRpb25zIiwicHVzaCIsImluZGV4T2YiLCJzdHlsZSIsImxlbmd0aCIsIkVycm9yIiwibW9kYWwiLCJlbHRzIiwicGFyc2VIVE1MIiwidGl0bGUiLCJtb2RhbENvbnRlbnQiLCJjbG9zZUJ1dHRvbiIsInN1Ym1pdEJ1dHRvbiIsInN1Ym1pdFRleHQiLCJjYW5jZWxUZXh0IiwidG9nZ2xlQ2xhc3MiLCJuYXJyb3ciLCJpc0NvbXBpbGVkIiwiZGVmZXJyZWQiLCJkZWZlciIsInByb21pc2UiLCJwcm90b3R5cGUiLCJzaG93IiwiY2FsbGJhY2siLCJoaWRlU3VibWl0IiwiaGlkZSIsImNsaWNrIiwib25DbG9zZSIsImJpbmQiLCJrZXlwcmVzcyIsImUiLCJ3aGljaCIsIm9uU3VibWl0IiwiZG9jQ2xpY2siLCJ0YXJnZXQiLCJpcyIsImRvY3VtZW50Iiwib2ZmIiwiZG9jS2V5ZG93biIsImtleSIsImtleWRvd24iLCJwb3B1bGF0ZU1vZGFsIiwiY3NzIiwiZm9jdXMiLCJ0aGVuIiwiY2xlYXJNb2RhbCIsImVtcHR5IiwiY3JlYXRlUmFkaW9FbHQiLCJvcHRpb24iLCJpZHgiLCJlbHQiLCJpZCIsInRvU3RyaW5nIiwibGFiZWwiLCJ2YWx1ZSIsIm1lc3NhZ2UiLCJlbHRDb250YWluZXIiLCJhcHBlbmQiLCJsYWJlbENvbnRhaW5lciIsImNvbnRhaW5lciIsImV4YW1wbGUiLCJjbSIsIkNvZGVNaXJyb3IiLCJtb2RlIiwibGluZU51bWJlcnMiLCJyZWFkT25seSIsInNldFRpbWVvdXQiLCJyZWZyZXNoIiwiZXhhbXBsZUNvbnRhaW5lciIsImNyZWF0ZVRpbGVFbHQiLCJkZXRhaWxzIiwiZXZ0IiwiY3JlYXRlVGV4dEVsdCIsImlucHV0IiwiZGVmYXVsdFZhbHVlIiwiZHJhd0VsZW1lbnQiLCJjcmVhdGVDb3B5VGV4dEVsdCIsImJveCIsImNyZWF0ZUNvbmZpcm1FbHQiLCJ0aGF0IiwiY3JlYXRlRWx0IiwiaSIsIm9wdGlvbkVsdHMiLCJtYXAiLCJyZXNvbHZlIiwicmV0dmFsIiwib3JpZ2luYWxQYWdlTG9hZCIsIkRhdGUiLCJub3ciLCJjb25zb2xlIiwibG9nIiwiU0hBUkVVUkxfUFJPWFlfSE9TVFMiLCJTZXQiLCJTSEFSRVVSTF9ESVJFQ1RfVElNRU9VVF9NUyIsIl9vcmlnRmV0Y2giLCJmZXRjaCIsIl9zaGFyZXVybFNob3VsZFByb3h5IiwiTWFwIiwiX3NoYXJldXJsU2hvdWxkUHJveHlJbmZsaWdodCIsIl9zaGFyZXVybFByb3h5VXJsIiwiZmV0Y2hJbnB1dCIsImVuY29kZVVSSUNvbXBvbmVudCIsIl9zaGFyZXVybElucHV0VG9VcmwiLCJSZXF1ZXN0IiwidXJsIiwiU3RyaW5nIiwiX3NoYXJldXJsVmVyaWZ5RGlyZWN0IiwiciIsIm9rIiwiY3QiLCJoZWFkZXJzIiwiZ2V0IiwidG9Mb3dlckNhc2UiLCJzdGFydHNXaXRoIiwiX3NoYXJldXJsRmV0Y2giLCJzaG91bGRQcm94eSIsImZldGNoSW5pdCIsIm1heWJlUHJveHlJbnB1dCIsIl9zaGFyZXVybFJhY2UiLCJwcm94eUN0cmwiLCJBYm9ydENvbnRyb2xsZXIiLCJwcm94eVAiLCJPYmplY3QiLCJhc3NpZ24iLCJzaWduYWwiLCJkaXJlY3RQIiwic2hvdWxkUHJveHlQcm9taXNlIiwiUHJvbWlzZSIsInJhY2UiLCJkaXJlY3RGaW5pc2hlZFN1Y2Nlc3NmdWxseUFuZEZpcnN0UCIsImRpcmVjdEZpcnN0IiwiYWJvcnQiLCJyZXNwb25zZVByb21pc2UiLCJhbnkiLCJhZ2dFcnIiLCJyZWplY3QiLCJlcnJvcnMiLCJob3N0IiwiVVJMIiwibG9jYXRpb24iLCJocmVmIiwiaG9zdG5hbWUiLCJfIiwiaGFzIiwiaW5mbGlnaHQiLCJ1bmRlZmluZWQiLCJzcCIsIl9zaGFyZXVybFJhY2UyIiwic2V0IiwiaXNFbWJlZGRlZCIsInBhcmVudCIsInNoYXJlQVBJIiwibWFrZVNoYXJlQVBJIiwicHJvY2VzcyIsImVudiIsIkNVUlJFTlRfUFlSRVRfUkVMRUFTRSIsInJlcXVpcmUiLCJtb2RhbFByb21wdCIsIkxPRyIsImN0X2xvZyIsImFwcGx5IiwiYXJndW1lbnRzIiwiY3RfZXJyb3IiLCJlcnJvciIsImluaXRpYWxQYXJhbXMiLCJwYXJzZSIsInBhcmFtcyIsImhpZ2hsaWdodE1vZGUiLCJjbGVhckZsYXNoIiwid2hpdGVUb0JsYWNrTm90aWZpY2F0aW9uIiwic3RpY2tFcnJvciIsIm1vcmUiLCJDUE8iLCJzYXlBbmRGb3JnZXQiLCJlcnIiLCJ0b29sdGlwIiwicHJlcGVuZCIsImZsYXNoRXJyb3IiLCJmYWRlT3V0IiwiZmxhc2hNZXNzYWdlIiwibXNnIiwic3RpY2tNZXNzYWdlIiwic3RpY2tSaWNoTWVzc2FnZSIsImNvbnRlbnQiLCJta1dhcm5pbmdVcHBlciIsIm1rV2FybmluZ0xvd2VyIiwiRG9jdW1lbnRzIiwiZG9jdW1lbnRzIiwibmFtZSIsImRvYyIsImxvZ2dlciIsImlzRGV0YWlsZWQiLCJnZXRWYWx1ZSIsImZvckVhY2giLCJmIiwiVkVSU0lPTl9DSEVDS19JTlRFUlZBTCIsIk1hdGgiLCJyYW5kb20iLCJjaGVja1ZlcnNpb24iLCJyZXNwIiwiSlNPTiIsInZlcnNpb24iLCJzZXRJbnRlcnZhbCIsInNhdmUiLCJhdXRvU2F2ZSIsIkNPTlRFWFRfRk9SX05FV19GSUxFUyIsIkNPTlRFWFRfUFJFRklYIiwibWVyZ2UiLCJvYmoiLCJleHRlbnNpb24iLCJuZXdvYmoiLCJrZXlzIiwiayIsImFuaW1hdGlvbkRpdiIsImNsb3NlQW5pbWF0aW9uSWZPcGVuIiwiZGlhbG9nIiwiYWN0aXZlRWRpdG9yIiwibWFrZUVkaXRvciIsImluaXRpYWwiLCJoYXNPd25Qcm9wZXJ0eSIsInRleHRhcmVhIiwialF1ZXJ5IiwicnVuRnVuIiwiY29kZSIsInJlcGxPcHRpb25zIiwicnVuIiwiQ00iLCJ1c2VMaW5lTnVtYmVycyIsInNpbXBsZUVkaXRvciIsInVzZUZvbGRpbmciLCJndXR0ZXJzIiwicmVpbmRlbnRBbGxMaW5lcyIsImxhc3QiLCJsaW5lQ291bnQiLCJvcGVyYXRpb24iLCJpbmRlbnRMaW5lIiwiQ09ERV9MSU5FX1dJRFRIIiwicnVsZXJzIiwicnVsZXJzTWluQ29sIiwiY29sb3IiLCJjb2x1bW4iLCJsaW5lU3R5bGUiLCJjbGFzc05hbWUiLCJtYWMiLCJrZXlNYXAiLCJtYWNEZWZhdWx0IiwibW9kaWZpZXIiLCJleHRyYUtleXMiLCJfZGVmaW5lUHJvcGVydHkiLCJTaGlmdEVudGVyIiwiU2hpZnRDdHJsRW50ZXIiLCJjb25jYXQiLCJQWVJFVF9JTl9WU0NPREUiLCJjbU9wdGlvbnMiLCJub3JtYWxpemVLZXlNYXAiLCJpbmRlbnRVbml0IiwidGFiU2l6ZSIsInZpZXdwb3J0TWFyZ2luIiwiSW5maW5pdHkiLCJtYXRjaEtleXdvcmRzIiwibWF0Y2hCcmFja2V0cyIsInN0eWxlU2VsZWN0ZWRUZXh0IiwiZm9sZEd1dHRlciIsImxpbmVXcmFwcGluZyIsImxvZ2dpbmciLCJzY3JvbGxQYXN0RW5kIiwiZnJvbVRleHRBcmVhIiwiZmlyc3RMaW5lSXNOYW1lc3BhY2UiLCJmaXJzdGxpbmUiLCJnZXRMaW5lIiwibWF0Y2giLCJuYW1lc3BhY2VtYXJrIiwic2V0Q29udGV4dExpbmUiLCJuZXdDb250ZXh0TGluZSIsImhhc05hbWVzcGFjZSIsImNsZWFyIiwicmVwbGFjZVJhbmdlIiwibGluZSIsImNoIiwiZ3V0dGVyUXVlc3Rpb25XcmFwcGVyIiwiY3JlYXRlRWxlbWVudCIsImd1dHRlclRvb2x0aXAiLCJpbm5lclRleHQiLCJndXR0ZXJRdWVzdGlvbiIsInNyYyIsIkFQUF9CQVNFX1VSTCIsImFwcGVuZENoaWxkIiwic2V0R3V0dGVyTWFya2VyIiwiZ2V0V3JhcHBlckVsZW1lbnQiLCJvbm1vdXNlbGVhdmUiLCJjbGVhckd1dHRlciIsIm9ubW91c2Vtb3ZlIiwibGluZUNoIiwiY29vcmRzQ2hhciIsImxlZnQiLCJjbGllbnRYIiwidG9wIiwiY2xpZW50WSIsIm1hcmtlcnMiLCJmaW5kTWFya3NBdCIsImNoYW5nZSIsImRvZXNOb3RDaGFuZ2VGaXJzdExpbmUiLCJjIiwiZnJvbSIsImN1ck9wIiwiY2hhbmdlT2JqcyIsImV2ZXJ5IiwibWFya1RleHQiLCJhdHRyaWJ1dGVzIiwidXNlbGluZSIsImF0b21pYyIsImluY2x1c2l2ZUxlZnQiLCJpbmNsdXNpdmVSaWdodCIsImRpc3BsYXkiLCJ3cmFwcGVyIiwiZ2V0VG9wVGllck1lbnVpdGVtcyIsImZvY3VzQ2Fyb3VzZWwiLCJSVU5fQ09ERSIsInNldFVzZXJuYW1lIiwidG9rZW4iLCJnYXBpIiwiYXV0aCIsImdldFRva2VuIiwiYWNjZXNzX3Rva2VuIiwiQXV0aG9yaXphdGlvbiIsImpzb24iLCJpbmZvIiwiZW1haWwiLCJzdG9yYWdlQVBJIiwiYXBpIiwiY29sbGVjdGlvbiIsImZhaWwiLCJjcmVhdGVQcm9ncmFtQ29sbGVjdGlvbkFQSSIsIkFQUF9OQU1FIiwiYWN0aXZlRWxlbWVudCIsImJsdXIiLCJ0b0xvYWQiLCJnZXRGaWxlQnlJZCIsImxvYWRQcm9ncmFtIiwicHJvZ3JhbVRvU2F2ZSIsImZjYWxsIiwiaW5pdGlhbFByb2dyYW0iLCJtYWtlVXJsRmlsZSIsInByb2dyYW1Mb2FkIiwiZW5hYmxlRmlsZU9wdGlvbnMiLCJwIiwic2hvd1NoYXJlQ29udGFpbmVyIiwiZ2V0U2hhcmVkRmlsZUJ5SWQiLCJmaWxlIiwiZ2V0T3JpZ2luYWwiLCJyZXNwb25zZSIsIm9yaWdpbmFsIiwicmVzdWx0IiwicmVtb3ZlQ2xhc3MiLCJvcGVuIiwic2V0VGl0bGUiLCJwcm9nTmFtZSIsImZpbGVuYW1lIiwiZG93bmxvYWRFbHQiLCJjb250ZW50cyIsImVkaXRvciIsImRvd25sb2FkQmxvYiIsImNyZWF0ZU9iamVjdFVSTCIsIkJsb2IiLCJ0eXBlIiwiZG93bmxvYWQiLCJzaG93TW9kYWwiLCJjdXJyZW50Q29udGV4dCIsImVsZW1lbnQiLCJncmVldGluZyIsInNoYXJlZCIsImN1cnJlbnRDb250ZXh0RWx0IiwiZXNzZW50aWFscyIsImxpc3QiLCJ1c2VDb250ZXh0IiwiaW5wdXRXcmFwcGVyIiwiZW50cnkiLCJuYW1lc3BhY2VSZXN1bHQiLCJ0cmltIiwiZmlyc3RMaW5lIiwiY29udGV4dExlbiIsInNsaWNlIiwiVFJVTkNBVEVfTEVOR1RIIiwidHJ1bmNhdGVOYW1lIiwidXBkYXRlTmFtZSIsImdldE5hbWUiLCJwcm9nIiwiZ2V0Q29udGVudHMiLCJzYXkiLCJmb3JnZXQiLCJhbm5vdW5jZW1lbnRzIiwiZ2V0RWxlbWVudEJ5SWQiLCJsaSIsImNyZWF0ZVRleHROb2RlIiwiaW5zZXJ0QmVmb3JlIiwiZmlyc3RDaGlsZCIsInJlbW92ZUNoaWxkIiwiY3ljbGVBZHZhbmNlIiwiY3VyckluZGV4IiwibWF4SW5kZXgiLCJyZXZlcnNlUCIsIm5leHRJbmRleCIsInBvcHVsYXRlRm9jdXNDYXJvdXNlbCIsImZjIiwiZG9jbWFpbiIsInRvb2xiYXIiLCJkb2NyZXBsTWFpbiIsImdldEVsZW1lbnRzQnlDbGFzc05hbWUiLCJkb2NyZXBsTWFpbjAiLCJkb2NyZXBsIiwiZG9jcmVwbGNvZGUiLCJjeWNsZUZvY3VzIiwiZkNhcm91c2VsIiwiY3VycmVudEZvY3VzZWRFbHQiLCJmaW5kIiwibm9kZSIsImNvbnRhaW5zIiwiY3VycmVudEZvY3VzSW5kZXgiLCJuZXh0Rm9jdXNJbmRleCIsImZvY3VzRWx0IiwiZm9jdXNFbHQwIiwiY2xhc3NMaXN0IiwidGV4dGFyZWFzIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJyZW1vdmVBdHRyaWJ1dGUiLCJwcm9ncmFtTG9hZGVkIiwibWFrZVNoYXJlTGluayIsIm5hbWVPclVudGl0bGVkIiwibWVudUl0ZW1EaXNhYmxlZCIsImhhc0NsYXNzIiwibmV3RXZlbnQiLCJzYXZlRXZlbnQiLCJuZXdGaWxlbmFtZSIsInVzZU5hbWUiLCJjcmVhdGUiLCJzYXZlZFByb2dyYW0iLCJjcmVhdGVGaWxlIiwiaGlzdG9yeSIsInB1c2hTdGF0ZSIsImdldFVuaXF1ZUlkIiwic2F2ZUFzIiwic2F2ZUFzUHJvbXB0IiwibmV3TmFtZSIsInJlbmFtZSIsInJlbmFtZVByb21wdCIsImZvY3VzYWJsZUVsdHMiLCJ0aGVUb29sYmFyIiwidG9wVGllck1lbnVpdGVtcyIsInRvQXJyYXkiLCJmaWx0ZXIiLCJnZXRBdHRyaWJ1dGUiLCJudW1Ub3BUaWVyTWVudWl0ZW1zIiwiaXRoVG9wVGllck1lbnVpdGVtIiwiaUNoaWxkIiwiY2hpbGRyZW4iLCJmaXJzdCIsInVwZGF0ZUVkaXRvckhlaWdodCIsInRvb2xiYXJIZWlnaHQiLCJvZmZzZXRIZWlnaHQiLCJwYWRkaW5nVG9wIiwiZG9jTWFpbiIsImRvY1JlcGxNYWluIiwiaW5zZXJ0QXJpYVBvcyIsInN1Ym1lbnUiLCJhcnIiLCJsZW4iLCJzZXRBdHRyaWJ1dGUiLCJhZGRFdmVudExpc3RlbmVyIiwiaGlkZUFsbFRvcE1lbnVpdGVtcyIsInN0b3BQcm9wYWdhdGlvbiIsImtjIiwia2V5Q29kZSIsImNsaWNrVG9wTWVudWl0ZW0iLCJ0aGlzRWx0IiwidG9wVGllclVsIiwiY2xvc2VzdCIsImhhc0F0dHJpYnV0ZSIsInRoaXNUb3BNZW51aXRlbSIsInQxIiwic3VibWVudU9wZW4iLCJleHBhbmRhYmxlRWx0cyIsIm5vbmV4cGFuZGFibGVFbHRzIiwic3dpdGNoVG9wTWVudWl0ZW0iLCJkZXN0VG9wTWVudWl0ZW0iLCJkZXN0RWx0IiwiZWx0SWQiLCJzaG93aW5nSGVscEtleXMiLCJzaG93SGVscEtleXMiLCJmYWRlSW4iLCJyZWNpdGVIZWxwIiwid2l0aGluU2Vjb25kVGllclVsIiwic2Vjb25kVGllclVsIiwicG9zc0VsdHMiLCJzcmNUb3BNZW51aXRlbSIsInR0bWlOIiwiaiIsIm5lYXJTaWJzIiwibXlJZCIsInRoaXNFbmNvdW50ZXJlZCIsImFkZCIsImZhclNpYnMiLCJwcmV2QWxsIiwic3VibWVudURpdnMiLCJuZXh0QWxsIiwicHJldmVudERlZmF1bHQiLCJzaGlmdEtleSIsImN0cmxLZXkiLCJjb2RlQ29udGFpbmVyIiwiaXNDb250cm9sbGVkIiwiaGFzV2Fybk9uRXhpdCIsInNraXBXYXJuaW5nIiwicnVuQnV0dG9uIiwiaW5pdGlhbEdhcyIsInNldE9wdGlvbiIsInJlbW92ZVNob3J0ZW5lZExpbmUiLCJsaW5lSGFuZGxlIiwiZ2V0T3B0aW9uIiwibG9uZ0xpbmVzIiwicnVsZXJMaXN0ZW5lcnMiLCJyZWZyZXNoUnVsZXJzIiwiZGVsZXRlTGluZSIsIm1pbkxlbmd0aCIsInNpemUiLCJOdW1iZXIiLCJNQVhfVkFMVUUiLCJsaW5lTm8iLCJpbnN0YW5jZSIsIm1pbkxpbmUiLCJsYXN0TGluZSIsIm1heExpbmUiLCJjaGFuZ2VkIiwiZWFjaExpbmUiLCJnZXREb2MiLCJyZXBsYWNlIiwic2V0VmFsdWUiLCJjbGVhckhpc3RvcnkiLCJoaWRlV2hlbkNvbnRyb2xsZWQiLCJyZW1vdmVXaGVuQ29udHJvbGxlZCIsInMiLCJyZW1vdmUiLCJweXJldExvYWQiLCJQWVJFVCIsImJvZHkiLCJweXJldExvYWQyIiwibG9nRmFpbHVyZUFuZE1hbnVhbEZldGNoIiwiZXZlbnQiLCJ0aW1lU3RhbXAiLCJtYW51YWxGZXRjaCIsImFqYXgiLCJyZXMiLCJjb250ZW50c1ByZWZpeCIsInN0YXR1cyIsInN0YXR1c1RleHQiLCJyZXNwb25zZVRleHQiLCJQWVJFVF9CQUNLVVAiLCJtYWtlRXZlbnQiLCJoYW5kbGVycyIsImhhbmRsZXIiLCJ0cmlnZ2VyIiwidiIsImgiLCJfbWFrZUV2ZW50IiwiX21ha2VFdmVudDIiLCJfc2xpY2VkVG9BcnJheSIsIm9uUnVuIiwidHJpZ2dlck9uUnVuIiwiX21ha2VFdmVudDMiLCJfbWFrZUV2ZW50NCIsIm9uSW50ZXJhY3Rpb24iLCJ0cmlnZ2VyT25JbnRlcmFjdGlvbiIsIl9tYWtlRXZlbnQ1IiwiX21ha2VFdmVudDYiLCJvbkxvYWQiLCJ0cmlnZ2VyT25Mb2FkIiwiZmluIiwiZXZlbnRzIiwiaW5pdGlhbFN0YXRlIiwiUFlSRVRfSVNfRU1CRURERUQiLCJhY3F1aXJlVnNDb2RlQXBpIiwiTUVTU0FHRVMiLCJtYWtlRXZlbnRzIiwic2VuZFBvcnQiLCJyZWNlaXZlUG9ydCJdLCJzb3VyY2VSb290IjoiIn0=