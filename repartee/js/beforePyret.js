/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "../../pyret/code.pyret.org/node_modules/q/q.js":
/*!******************************************************!*\
  !*** ../../pyret/code.pyret.org/node_modules/q/q.js ***!
  \******************************************************/
/***/ ((module) => {

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
    } else { var previousQ, global; }

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


/***/ }),

/***/ "../../pyret/code.pyret.org/node_modules/url.js/url.js":
/*!*************************************************************!*\
  !*** ../../pyret/code.pyret.org/node_modules/url.js/url.js ***!
  \*************************************************************/
/***/ ((module, exports, __webpack_require__) => {

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
else {}

}();


/***/ }),

/***/ "./src/web/js/modal-prompt.js":
/*!************************************!*\
  !*** ./src/web/js/modal-prompt.js ***!
  \************************************/
/***/ ((module, exports, __webpack_require__) => {

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
!(__WEBPACK_AMD_DEFINE_ARRAY__ = [__webpack_require__(/*! q */ "../../pyret/code.pyret.org/node_modules/q/q.js")], __WEBPACK_AMD_DEFINE_RESULT__ = (function (Q) {
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

/***/ })

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
var shareAPI = makeShareAPI(undefined);
var url = window.url = __webpack_require__(/*! url.js */ "../../pyret/code.pyret.org/node_modules/url.js/url.js");
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
    if (resp.version && resp.version !== undefined) {
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
    return gwrap.load({
      name: 'people',
      version: 'v1'
    }).then(function (api) {
      api.people.get({
        resourceName: "people/me",
        personFields: "names,emailAddresses"
      }).then(function (user) {
        var name = user.names && user.names[0] ? user.names[0].displayName : undefined;
        if (user.emailAddresses && user.emailAddresses[0] && user.emailAddresses[0].value) {
          name = user.emailAddresses[0].value;
        }
        target.text(name);
      });
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
    document.title = progName + " - code.pyret.org";
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianMvYmVmb3JlUHlyZXQuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsTUFBTSxTQUFTLElBQXlEO0FBQ3hFOztBQUVBO0FBQ0EsTUFBTSxLQUFLLDBCQStCTjs7QUFFTCxDQUFDO0FBQ0Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsRUFBRTtBQUNGO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdCQUFnQjtBQUNoQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUEsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUJBQWlCO0FBQ2pCO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTs7QUFFQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0EsZUFBZSxnQkFBZ0I7QUFDL0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSx3QkFBd0IsaUJBQWlCO0FBQ3pDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhCQUE4QixL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O0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxtQ0FBbUMsZUFBZTtBQUNsRDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxtQ0FBbUMsZUFBZTtBQUNsRDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0EsS0FBSztBQUNMLGlCQUFpQjtBQUNqQixLQUFLOztBQUVMO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGNBQWM7QUFDZDtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMLGlCQUFpQjtBQUNqQixLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0EsS0FBSztBQUNMO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCO0FBQ2xCO0FBQ0E7QUFDQSxzQkFBc0I7QUFDdEI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLElBQUk7QUFDSjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQSxXQUFXLFVBQVU7QUFDckIsYUFBYSxVQUFVO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxvQkFBb0IsU0FBUztBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsUUFBUTtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQkFBcUI7QUFDckI7QUFDQTtBQUNBLDBDQUEwQywrQkFBK0I7QUFDekU7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLFFBQVE7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBLEtBQUs7O0FBRUw7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0EsU0FBUztBQUNULEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxhQUFhO0FBQ3hCO0FBQ0EsYUFBYSxjQUFjO0FBQzNCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLE1BQU07QUFDakIsV0FBVyxVQUFVO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxNQUFNO0FBQ2pCLFdBQVcsVUFBVTtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLE1BQU07QUFDakIsV0FBVyxVQUFVO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1QsS0FBSztBQUNMOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsTUFBTTtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxjQUFjO0FBQ2Q7QUFDQTtBQUNBLFNBQVM7QUFDVDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxXQUFXLE1BQU07QUFDakIsV0FBVyxRQUFRO0FBQ25CLFdBQVcsTUFBTTtBQUNqQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7O0FBRUw7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsV0FBVyxNQUFNO0FBQ2pCLFdBQVcsUUFBUTtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQSxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsSUFBSTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsUUFBUTtBQUNuQixXQUFXLE9BQU8sc0NBQXNDO0FBQ3hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsUUFBUTtBQUNuQixtREFBbUQ7QUFDbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsVUFBVTtBQUNyQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYixTQUFTO0FBQ1Q7QUFDQTtBQUNBLGFBQWE7QUFDYixTQUFTO0FBQ1QsTUFBTTtBQUNOO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQSxDQUFDOzs7Ozs7Ozs7OztBQy8vREQ7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw4REFBOEQ7QUFDOUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhDQUE4QyxXQUFXO0FBQ3pELDhDQUE4QyxXQUFXO0FBQ3pELDZDQUE2QyxXQUFXO0FBQ3hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscUNBQXFDLFdBQVcsT0FBTztBQUN2RCxzQ0FBc0MsV0FBVyxNQUFNO0FBQ3ZEO0FBQ0EsV0FBVyxRQUFRO0FBQ25CLFlBQVksMkJBQTJCLEdBQUc7QUFDMUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWSxnQ0FBZ0M7QUFDNUM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EseUJBQXlCLFlBQVk7QUFDckM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQixjQUFjO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBRTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxRQUFRO0FBQ25CLFdBQVcsUUFBUTtBQUNuQjtBQUNBLFlBQVksUUFBUTtBQUNwQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxFQUFFO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsV0FBVyxRQUFRO0FBQ25CLFlBQVksV0FBVyxHQUFHO0FBQzFCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBWSxTQUFTO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFdBQVcsUUFBUTtBQUNuQixXQUFXLFFBQVE7QUFDbkIsWUFBWSxRQUFRO0FBQ3BCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7QUFDRjs7QUFFQSxLQUFLLElBQTZDLEdBQUcsb0NBQU8sSUFBSTtBQUFBO0FBQUE7QUFBQTtBQUFBLGtHQUFDO0FBQ2pFLEtBQUssRUFDcUI7O0FBRTFCLENBQUM7Ozs7Ozs7Ozs7O0FDclZEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBQSxpQ0FBMkIsQ0FBQyw4RUFBRyxDQUFDLG1DQUFFLFVBQVNDLENBQUMsRUFBRTtFQUU1QyxTQUFTQyxnQkFBZ0JBLENBQUNDLElBQUksRUFBRTtJQUM5QixJQUFJQyxPQUFPLEdBQUdDLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDQyxRQUFRLENBQUMsZ0JBQWdCLENBQUM7SUFDakVGLE9BQU8sQ0FBQ0csSUFBSSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUM7SUFDcENILE9BQU8sQ0FBQ0ksRUFBRSxDQUFDLE9BQU8sRUFBRSxZQUFXO01BQUVILENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQ0ksTUFBTSxDQUFDLENBQUM7SUFBRSxDQUFDLENBQUM7SUFDckRMLE9BQU8sQ0FBQ0ksRUFBRSxDQUFDLFNBQVMsRUFBRSxZQUFXO01BQUVILENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQ0ksTUFBTSxDQUFDLENBQUM7SUFBRSxDQUFDLENBQUM7SUFDdkRMLE9BQU8sQ0FBQ00sR0FBRyxDQUFDUCxJQUFJLENBQUM7SUFDakIsT0FBT0MsT0FBTztFQUdoQjs7RUFFQTtFQUNBLElBQUlPLFdBQVcsR0FBR1YsQ0FBQyxDQUFDLENBQUM7RUFDckIsSUFBSVcsTUFBTSxHQUFHLENBQ1gsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FDaEQ7RUFFREMsTUFBTSxDQUFDQyxNQUFNLEdBQUcsRUFBRTs7RUFFbEI7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7RUFFRTtBQUNGO0FBQ0E7QUFDQTtFQUNFLFNBQVNDLE1BQU1BLENBQUNDLE9BQU8sRUFBRTtJQUN2QkgsTUFBTSxDQUFDQyxNQUFNLENBQUNHLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDeEIsSUFBSSxDQUFDRCxPQUFPLElBQ1BKLE1BQU0sQ0FBQ00sT0FBTyxDQUFDRixPQUFPLENBQUNHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBRSxJQUN0QyxDQUFDSCxPQUFPLENBQUNBLE9BQU8sSUFDZixPQUFPQSxPQUFPLENBQUNBLE9BQU8sQ0FBQ0ksTUFBTSxLQUFLLFFBQVMsSUFBS0osT0FBTyxDQUFDQSxPQUFPLENBQUNJLE1BQU0sS0FBSyxDQUFFLEVBQUU7TUFDbEYsTUFBTSxJQUFJQyxLQUFLLENBQUMsd0JBQXdCLEVBQUVMLE9BQU8sQ0FBQztJQUNwRDtJQUNBLElBQUksQ0FBQ0EsT0FBTyxHQUFHQSxPQUFPO0lBQ3RCLElBQUksQ0FBQ00sS0FBSyxHQUFHakIsQ0FBQyxDQUFDLGNBQWMsQ0FBQztJQUM5QixJQUFJLElBQUksQ0FBQ1csT0FBTyxDQUFDRyxLQUFLLEtBQUssT0FBTyxFQUFFO01BQ2xDLElBQUksQ0FBQ0ksSUFBSSxHQUFHbEIsQ0FBQyxDQUFDQSxDQUFDLENBQUNtQixTQUFTLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDbEIsUUFBUSxDQUFDLGlCQUFpQixDQUFDO0lBQzNFLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQ1UsT0FBTyxDQUFDRyxLQUFLLEtBQUssTUFBTSxFQUFFO01BQ3hDLElBQUksQ0FBQ0ksSUFBSSxHQUFHbEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDQyxRQUFRLENBQUMsaUJBQWlCLENBQUM7SUFDcEQsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDVSxPQUFPLENBQUNHLEtBQUssS0FBSyxVQUFVLEVBQUU7TUFDNUMsSUFBSSxDQUFDSSxJQUFJLEdBQUdsQixDQUFDLENBQUMsT0FBTyxDQUFDLENBQUNDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztJQUNwRCxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUNVLE9BQU8sQ0FBQ0csS0FBSyxLQUFLLFNBQVMsRUFBRTtNQUMzQyxJQUFJLENBQUNJLElBQUksR0FBR2xCLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQ0MsUUFBUSxDQUFDLGlCQUFpQixDQUFDO0lBQ3BELENBQUMsTUFBTTtNQUNMLElBQUksQ0FBQ2lCLElBQUksR0FBR2xCLENBQUMsQ0FBQ0EsQ0FBQyxDQUFDbUIsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUNsQixRQUFRLENBQUMsaUJBQWlCLENBQUM7SUFDdkU7SUFDQSxJQUFJLENBQUNtQixLQUFLLEdBQUdwQixDQUFDLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDaUIsS0FBSyxDQUFDO0lBQ2hELElBQUksQ0FBQ0ksWUFBWSxHQUFHckIsQ0FBQyxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQ2lCLEtBQUssQ0FBQztJQUNuRCxJQUFJLENBQUNLLFdBQVcsR0FBR3RCLENBQUMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDaUIsS0FBSyxDQUFDO0lBQzFDLElBQUksQ0FBQ00sWUFBWSxHQUFHdkIsQ0FBQyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUNpQixLQUFLLENBQUM7SUFDNUMsSUFBRyxJQUFJLENBQUNOLE9BQU8sQ0FBQ2EsVUFBVSxFQUFFO01BQzFCLElBQUksQ0FBQ0QsWUFBWSxDQUFDekIsSUFBSSxDQUFDLElBQUksQ0FBQ2EsT0FBTyxDQUFDYSxVQUFVLENBQUM7SUFDakQsQ0FBQyxNQUNJO01BQ0gsSUFBSSxDQUFDRCxZQUFZLENBQUN6QixJQUFJLENBQUMsUUFBUSxDQUFDO0lBQ2xDO0lBQ0EsSUFBRyxJQUFJLENBQUNhLE9BQU8sQ0FBQ2MsVUFBVSxFQUFFO01BQzFCLElBQUksQ0FBQ0gsV0FBVyxDQUFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQ2EsT0FBTyxDQUFDYyxVQUFVLENBQUM7SUFDaEQsQ0FBQyxNQUNJO01BQ0gsSUFBSSxDQUFDSCxXQUFXLENBQUN4QixJQUFJLENBQUMsUUFBUSxDQUFDO0lBQ2pDO0lBQ0EsSUFBSSxDQUFDdUIsWUFBWSxDQUFDSyxXQUFXLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUNmLE9BQU8sQ0FBQ2dCLE1BQU0sQ0FBQztJQUU5RCxJQUFJLENBQUNDLFVBQVUsR0FBRyxLQUFLO0lBQ3ZCLElBQUksQ0FBQ0MsUUFBUSxHQUFHakMsQ0FBQyxDQUFDa0MsS0FBSyxDQUFDLENBQUM7SUFDekIsSUFBSSxDQUFDQyxPQUFPLEdBQUcsSUFBSSxDQUFDRixRQUFRLENBQUNFLE9BQU87RUFDdEM7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTs7RUFFRTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VyQixNQUFNLENBQUNzQixTQUFTLENBQUNDLElBQUksR0FBRyxVQUFTQyxRQUFRLEVBQUU7SUFDekM7SUFDQTtJQUNBLElBQUksSUFBSSxDQUFDdkIsT0FBTyxDQUFDd0IsVUFBVSxFQUFFO01BQzNCLElBQUksQ0FBQ1osWUFBWSxDQUFDYSxJQUFJLENBQUMsQ0FBQztJQUMxQixDQUFDLE1BQU07TUFDTCxJQUFJLENBQUNiLFlBQVksQ0FBQ1UsSUFBSSxDQUFDLENBQUM7SUFDMUI7SUFDQSxJQUFJLENBQUNYLFdBQVcsQ0FBQ2UsS0FBSyxDQUFDLElBQUksQ0FBQ0MsT0FBTyxDQUFDQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDL0MsSUFBSSxDQUFDdEIsS0FBSyxDQUFDdUIsUUFBUSxDQUFDLFVBQVNDLENBQUMsRUFBRTtNQUM5QixJQUFHQSxDQUFDLENBQUNDLEtBQUssSUFBSSxFQUFFLEVBQUU7UUFDaEIsSUFBSSxDQUFDbkIsWUFBWSxDQUFDYyxLQUFLLENBQUMsQ0FBQztRQUN6QixPQUFPLEtBQUs7TUFDZDtJQUNGLENBQUMsQ0FBQ0UsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2IsSUFBSSxDQUFDaEIsWUFBWSxDQUFDYyxLQUFLLENBQUMsSUFBSSxDQUFDTSxRQUFRLENBQUNKLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNqRCxJQUFJSyxRQUFRLEdBQUksVUFBU0gsQ0FBQyxFQUFFO01BQzFCO01BQ0E7TUFDQSxJQUFJekMsQ0FBQyxDQUFDeUMsQ0FBQyxDQUFDSSxNQUFNLENBQUMsQ0FBQ0MsRUFBRSxDQUFDLElBQUksQ0FBQzdCLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQ1ksUUFBUSxFQUFFO1FBQy9DLElBQUksQ0FBQ1MsT0FBTyxDQUFDRyxDQUFDLENBQUM7UUFDZnpDLENBQUMsQ0FBQytDLFFBQVEsQ0FBQyxDQUFDQyxHQUFHLENBQUMsT0FBTyxFQUFFSixRQUFRLENBQUM7TUFDcEM7SUFDRixDQUFDLENBQUVMLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDYnZDLENBQUMsQ0FBQytDLFFBQVEsQ0FBQyxDQUFDVixLQUFLLENBQUNPLFFBQVEsQ0FBQztJQUMzQixJQUFJSyxVQUFVLEdBQUksVUFBU1IsQ0FBQyxFQUFFO01BQzVCLElBQUlBLENBQUMsQ0FBQ1MsR0FBRyxLQUFLLFFBQVEsRUFBRTtRQUN0QixJQUFJLENBQUNaLE9BQU8sQ0FBQ0csQ0FBQyxDQUFDO1FBQ2Z6QyxDQUFDLENBQUMrQyxRQUFRLENBQUMsQ0FBQ0MsR0FBRyxDQUFDLFNBQVMsRUFBRUMsVUFBVSxDQUFDO01BQ3hDO0lBQ0YsQ0FBQyxDQUFFVixJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ2J2QyxDQUFDLENBQUMrQyxRQUFRLENBQUMsQ0FBQ0ksT0FBTyxDQUFDRixVQUFVLENBQUM7SUFDL0IsSUFBSSxDQUFDN0IsS0FBSyxDQUFDdEIsSUFBSSxDQUFDLElBQUksQ0FBQ2EsT0FBTyxDQUFDUyxLQUFLLENBQUM7SUFDbkMsSUFBSSxDQUFDZ0MsYUFBYSxDQUFDLENBQUM7SUFDcEIsSUFBSSxDQUFDbkMsS0FBSyxDQUFDb0MsR0FBRyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUM7SUFDbENyRCxDQUFDLENBQUMsOEJBQThCLEVBQUUsSUFBSSxDQUFDaUIsS0FBSyxDQUFDLENBQUNxQyxLQUFLLENBQUMsQ0FBQyxDQUFDbEQsTUFBTSxDQUFDLENBQUM7SUFFOUQsSUFBSThCLFFBQVEsRUFBRTtNQUNaLE9BQU8sSUFBSSxDQUFDSCxPQUFPLENBQUN3QixJQUFJLENBQUNyQixRQUFRLENBQUM7SUFDcEMsQ0FBQyxNQUFNO01BQ0wsT0FBTyxJQUFJLENBQUNILE9BQU87SUFDckI7RUFDRixDQUFDOztFQUdEO0FBQ0Y7QUFDQTtFQUNFckIsTUFBTSxDQUFDc0IsU0FBUyxDQUFDd0IsVUFBVSxHQUFHLFlBQVc7SUFDdkMsSUFBSSxDQUFDakMsWUFBWSxDQUFDeUIsR0FBRyxDQUFDLENBQUM7SUFDdkIsSUFBSSxDQUFDMUIsV0FBVyxDQUFDMEIsR0FBRyxDQUFDLENBQUM7SUFDdEIsSUFBSSxDQUFDOUIsSUFBSSxDQUFDdUMsS0FBSyxDQUFDLENBQUM7RUFDbkIsQ0FBQzs7RUFFRDtBQUNGO0FBQ0E7QUFDQTtFQUNFL0MsTUFBTSxDQUFDc0IsU0FBUyxDQUFDb0IsYUFBYSxHQUFHLFlBQVc7SUFDMUMsU0FBU00sY0FBY0EsQ0FBQ0MsTUFBTSxFQUFFQyxHQUFHLEVBQUU7TUFDbkMsSUFBSUMsR0FBRyxHQUFHN0QsQ0FBQyxDQUFDQSxDQUFDLENBQUNtQixTQUFTLENBQUMsNkNBQTZDLENBQUMsQ0FBQztNQUN2RSxJQUFJMkMsRUFBRSxHQUFHLEdBQUcsR0FBR0YsR0FBRyxDQUFDRyxRQUFRLENBQUMsQ0FBQztNQUM3QixJQUFJQyxLQUFLLEdBQUdoRSxDQUFDLENBQUNBLENBQUMsQ0FBQ21CLFNBQVMsQ0FBQyxlQUFlLEdBQUcyQyxFQUFFLEdBQUcsYUFBYSxDQUFDLENBQUM7TUFDaEVELEdBQUcsQ0FBQzNELElBQUksQ0FBQyxJQUFJLEVBQUU0RCxFQUFFLENBQUM7TUFDbEJELEdBQUcsQ0FBQzNELElBQUksQ0FBQyxPQUFPLEVBQUV5RCxNQUFNLENBQUNNLEtBQUssQ0FBQztNQUMvQkQsS0FBSyxDQUFDbEUsSUFBSSxDQUFDNkQsTUFBTSxDQUFDTyxPQUFPLENBQUM7TUFDMUIsSUFBSUMsWUFBWSxHQUFHbkUsQ0FBQyxDQUFDQSxDQUFDLENBQUNtQixTQUFTLENBQUMsOENBQThDLENBQUMsQ0FBQztNQUNqRmdELFlBQVksQ0FBQ0MsTUFBTSxDQUFDUCxHQUFHLENBQUM7TUFDeEIsSUFBSVEsY0FBYyxHQUFHckUsQ0FBQyxDQUFDQSxDQUFDLENBQUNtQixTQUFTLENBQUMsZ0RBQWdELENBQUMsQ0FBQztNQUNyRmtELGNBQWMsQ0FBQ0QsTUFBTSxDQUFDSixLQUFLLENBQUM7TUFDNUIsSUFBSU0sU0FBUyxHQUFHdEUsQ0FBQyxDQUFDQSxDQUFDLENBQUNtQixTQUFTLENBQUMsd0NBQXdDLENBQUMsQ0FBQztNQUN4RW1ELFNBQVMsQ0FBQ0YsTUFBTSxDQUFDRCxZQUFZLENBQUM7TUFDOUJHLFNBQVMsQ0FBQ0YsTUFBTSxDQUFDQyxjQUFjLENBQUM7TUFDaEMsSUFBSVYsTUFBTSxDQUFDWSxPQUFPLEVBQUU7UUFDbEIsSUFBSUEsT0FBTyxHQUFHdkUsQ0FBQyxDQUFDQSxDQUFDLENBQUNtQixTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDM0MsSUFBSXFELEVBQUUsR0FBR0MsVUFBVSxDQUFDRixPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7VUFDOUJOLEtBQUssRUFBRU4sTUFBTSxDQUFDWSxPQUFPO1VBQ3JCRyxJQUFJLEVBQUUsT0FBTztVQUNiQyxXQUFXLEVBQUUsS0FBSztVQUNsQkMsUUFBUSxFQUFFLFVBQVUsQ0FBQztRQUN2QixDQUFDLENBQUM7UUFDRkMsVUFBVSxDQUFDLFlBQVU7VUFDbkJMLEVBQUUsQ0FBQ00sT0FBTyxDQUFDLENBQUM7UUFDZCxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ0wsSUFBSUMsZ0JBQWdCLEdBQUcvRSxDQUFDLENBQUNBLENBQUMsQ0FBQ21CLFNBQVMsQ0FBQyxnREFBZ0QsQ0FBQyxDQUFDO1FBQ3ZGNEQsZ0JBQWdCLENBQUNYLE1BQU0sQ0FBQ0csT0FBTyxDQUFDO1FBQ2hDRCxTQUFTLENBQUNGLE1BQU0sQ0FBQ1csZ0JBQWdCLENBQUM7TUFDcEM7TUFFQSxPQUFPVCxTQUFTO0lBQ2xCO0lBQ0EsU0FBU1UsYUFBYUEsQ0FBQ3JCLE1BQU0sRUFBRUMsR0FBRyxFQUFFO01BQ2xDLElBQUlDLEdBQUcsR0FBRzdELENBQUMsQ0FBQ0EsQ0FBQyxDQUFDbUIsU0FBUyxDQUFDLHVEQUF1RCxDQUFDLENBQUM7TUFDakYwQyxHQUFHLENBQUMzRCxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsR0FBRzBELEdBQUcsQ0FBQ0csUUFBUSxDQUFDLENBQUMsQ0FBQztNQUNwQ0YsR0FBRyxDQUFDTyxNQUFNLENBQUNwRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUNGLElBQUksQ0FBQzZELE1BQU0sQ0FBQ08sT0FBTyxDQUFDLENBQUMsQ0FDdENFLE1BQU0sQ0FBQ3BFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQ0YsSUFBSSxDQUFDNkQsTUFBTSxDQUFDc0IsT0FBTyxDQUFDLENBQUM7TUFDeEMsS0FBSyxJQUFJQyxHQUFHLElBQUl2QixNQUFNLENBQUN4RCxFQUFFLEVBQ3ZCMEQsR0FBRyxDQUFDMUQsRUFBRSxDQUFDK0UsR0FBRyxFQUFFdkIsTUFBTSxDQUFDeEQsRUFBRSxDQUFDK0UsR0FBRyxDQUFDLENBQUM7TUFDN0IsT0FBT3JCLEdBQUc7SUFDWjtJQUVBLFNBQVNzQixhQUFhQSxDQUFDeEIsTUFBTSxFQUFFO01BQzdCLElBQUlFLEdBQUcsR0FBRzdELENBQUMsQ0FBQyxrQ0FBa0MsQ0FBQztNQUMvQyxJQUFNb0YsS0FBSyxHQUFHcEYsQ0FBQyxDQUFDLDRDQUE0QyxDQUFDLENBQUNLLEdBQUcsQ0FBQ3NELE1BQU0sQ0FBQzBCLFlBQVksQ0FBQztNQUN0RixJQUFHMUIsTUFBTSxDQUFDMkIsV0FBVyxFQUFFO1FBQ3JCekIsR0FBRyxDQUFDTyxNQUFNLENBQUNULE1BQU0sQ0FBQzJCLFdBQVcsQ0FBQ0YsS0FBSyxDQUFDLENBQUM7TUFDdkMsQ0FBQyxNQUNJO1FBQ0h2QixHQUFHLENBQUNPLE1BQU0sQ0FBQ3BFLENBQUMsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUNILElBQUksQ0FBQzZELE1BQU0sQ0FBQ08sT0FBTyxDQUFDLENBQUM7UUFDM0ZMLEdBQUcsQ0FBQ08sTUFBTSxDQUFDZ0IsS0FBSyxDQUFDO01BQ25CO01BQ0EsT0FBT3ZCLEdBQUc7SUFDWjtJQUVBLFNBQVMwQixpQkFBaUJBLENBQUM1QixNQUFNLEVBQUU7TUFDakMsSUFBSUUsR0FBRyxHQUFHN0QsQ0FBQyxDQUFDLE9BQU8sQ0FBQztNQUNwQjZELEdBQUcsQ0FBQ08sTUFBTSxDQUFDcEUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUNILElBQUksQ0FBQzZELE1BQU0sQ0FBQ08sT0FBTyxDQUFDLENBQUM7TUFDL0QsSUFBR1AsTUFBTSxDQUFDN0QsSUFBSSxFQUFFO1FBQ2QsSUFBSTBGLEdBQUcsR0FBRzNGLGdCQUFnQixDQUFDOEQsTUFBTSxDQUFDN0QsSUFBSSxDQUFDO1FBQzdDO1FBQ00rRCxHQUFHLENBQUNPLE1BQU0sQ0FBQ29CLEdBQUcsQ0FBQztRQUNmQSxHQUFHLENBQUNsQyxLQUFLLENBQUMsQ0FBQztNQUNiO01BQ0EsT0FBT08sR0FBRztJQUNaO0lBRUEsU0FBUzRCLGdCQUFnQkEsQ0FBQzlCLE1BQU0sRUFBRTtNQUNoQyxPQUFPM0QsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDRixJQUFJLENBQUM2RCxNQUFNLENBQUNPLE9BQU8sQ0FBQztJQUN0QztJQUVBLElBQUl3QixJQUFJLEdBQUcsSUFBSTtJQUVmLFNBQVNDLFNBQVNBLENBQUNoQyxNQUFNLEVBQUVpQyxDQUFDLEVBQUU7TUFDNUIsSUFBR0YsSUFBSSxDQUFDL0UsT0FBTyxDQUFDRyxLQUFLLEtBQUssT0FBTyxFQUFFO1FBQ2pDLE9BQU80QyxjQUFjLENBQUNDLE1BQU0sRUFBRWlDLENBQUMsQ0FBQztNQUNsQyxDQUFDLE1BQ0ksSUFBR0YsSUFBSSxDQUFDL0UsT0FBTyxDQUFDRyxLQUFLLEtBQUssT0FBTyxFQUFFO1FBQ3RDLE9BQU9rRSxhQUFhLENBQUNyQixNQUFNLEVBQUVpQyxDQUFDLENBQUM7TUFDakMsQ0FBQyxNQUNJLElBQUdGLElBQUksQ0FBQy9FLE9BQU8sQ0FBQ0csS0FBSyxLQUFLLE1BQU0sRUFBRTtRQUNyQyxPQUFPcUUsYUFBYSxDQUFDeEIsTUFBTSxDQUFDO01BQzlCLENBQUMsTUFDSSxJQUFHK0IsSUFBSSxDQUFDL0UsT0FBTyxDQUFDRyxLQUFLLEtBQUssVUFBVSxFQUFFO1FBQ3pDLE9BQU95RSxpQkFBaUIsQ0FBQzVCLE1BQU0sQ0FBQztNQUNsQyxDQUFDLE1BQ0ksSUFBRytCLElBQUksQ0FBQy9FLE9BQU8sQ0FBQ0csS0FBSyxLQUFLLFNBQVMsRUFBRTtRQUN4QyxPQUFPMkUsZ0JBQWdCLENBQUM5QixNQUFNLENBQUM7TUFDakM7SUFDRjtJQUVBLElBQUlrQyxVQUFVO0lBQ2Q7SUFDSjtJQUNNQSxVQUFVLEdBQUcsSUFBSSxDQUFDbEYsT0FBTyxDQUFDQSxPQUFPLENBQUNtRixHQUFHLENBQUNILFNBQVMsQ0FBQztJQUN0RDtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0kzRixDQUFDLENBQUMscUJBQXFCLEVBQUU2RixVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzNGLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDO0lBQzdELElBQUksQ0FBQ2dCLElBQUksQ0FBQ2tELE1BQU0sQ0FBQ3lCLFVBQVUsQ0FBQztJQUM1QjdGLENBQUMsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDaUIsS0FBSyxDQUFDLENBQUN3QyxLQUFLLENBQUMsQ0FBQyxDQUFDVyxNQUFNLENBQUMsSUFBSSxDQUFDbEQsSUFBSSxDQUFDO0VBQ3hELENBQUM7O0VBRUQ7QUFDRjtBQUNBO0VBQ0VSLE1BQU0sQ0FBQ3NCLFNBQVMsQ0FBQ00sT0FBTyxHQUFHLFVBQVNHLENBQUMsRUFBRTtJQUNyQyxJQUFJLENBQUN4QixLQUFLLENBQUNvQyxHQUFHLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQztJQUNqQyxJQUFJLENBQUNHLFVBQVUsQ0FBQyxDQUFDO0lBQ2pCLElBQUksQ0FBQzNCLFFBQVEsQ0FBQ2tFLE9BQU8sQ0FBQyxJQUFJLENBQUM7SUFDM0IsT0FBTyxJQUFJLENBQUNsRSxRQUFRO0lBQ3BCLE9BQU8sSUFBSSxDQUFDRSxPQUFPO0VBQ3JCLENBQUM7O0VBRUQ7QUFDRjtBQUNBO0VBQ0VyQixNQUFNLENBQUNzQixTQUFTLENBQUNXLFFBQVEsR0FBRyxVQUFTRixDQUFDLEVBQUU7SUFDdEMsSUFBRyxJQUFJLENBQUM5QixPQUFPLENBQUNHLEtBQUssS0FBSyxPQUFPLEVBQUU7TUFDakMsSUFBSWtGLE1BQU0sR0FBR2hHLENBQUMsQ0FBQyw2QkFBNkIsRUFBRSxJQUFJLENBQUNpQixLQUFLLENBQUMsQ0FBQ1osR0FBRyxDQUFDLENBQUM7SUFDakUsQ0FBQyxNQUNJLElBQUcsSUFBSSxDQUFDTSxPQUFPLENBQUNHLEtBQUssS0FBSyxNQUFNLEVBQUU7TUFDckMsSUFBSWtGLE1BQU0sR0FBR2hHLENBQUMsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUNpQixLQUFLLENBQUMsQ0FBQ1osR0FBRyxDQUFDLENBQUM7SUFDeEQsQ0FBQyxNQUNJLElBQUcsSUFBSSxDQUFDTSxPQUFPLENBQUNHLEtBQUssS0FBSyxVQUFVLEVBQUU7TUFDekMsSUFBSWtGLE1BQU0sR0FBRyxJQUFJO0lBQ25CLENBQUMsTUFDSSxJQUFHLElBQUksQ0FBQ3JGLE9BQU8sQ0FBQ0csS0FBSyxLQUFLLFNBQVMsRUFBRTtNQUN4QyxJQUFJa0YsTUFBTSxHQUFHLElBQUk7SUFDbkIsQ0FBQyxNQUNJO01BQ0gsSUFBSUEsTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQ3JCO0lBQ0EsSUFBSSxDQUFDL0UsS0FBSyxDQUFDb0MsR0FBRyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUM7SUFDakMsSUFBSSxDQUFDRyxVQUFVLENBQUMsQ0FBQztJQUNqQixJQUFJLENBQUMzQixRQUFRLENBQUNrRSxPQUFPLENBQUNDLE1BQU0sQ0FBQztJQUM3QixPQUFPLElBQUksQ0FBQ25FLFFBQVE7SUFDcEIsT0FBTyxJQUFJLENBQUNFLE9BQU87RUFDckIsQ0FBQztFQUVELE9BQU9yQixNQUFNO0FBRWYsQ0FBQztBQUFBLGtHQUFDOzs7Ozs7VUNuVEY7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3RCQTs7QUFFQSxJQUFJdUYsZ0JBQWdCLEdBQUdDLElBQUksQ0FBQ0MsR0FBRyxDQUFDLENBQUM7QUFDakNDLE9BQU8sQ0FBQ0MsR0FBRyxDQUFDLG9CQUFvQixFQUFFSixnQkFBZ0IsQ0FBQzs7QUFFbkQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxJQUFNSyxvQkFBb0IsR0FBRyxJQUFJQyxHQUFHLENBQUMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0FBQ25FLElBQU1DLDBCQUEwQixHQUFHLElBQUk7QUFDdkMsSUFBTUMsVUFBVSxHQUFHakcsTUFBTSxDQUFDa0csS0FBSyxDQUFDbkUsSUFBSSxDQUFDL0IsTUFBTSxDQUFDO0FBRTVDLElBQU1tRyxvQkFBb0IsR0FBRyxJQUFJQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQVU7QUFDakQsSUFBTUMsNEJBQTRCLEdBQUcsSUFBSUQsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFFOztBQUVqRCxTQUFTRSxpQkFBaUJBLENBQUNDLFVBQVUsRUFBRTtFQUNyQyxPQUFPLHFCQUFxQixHQUFHQyxrQkFBa0IsQ0FBQ0MsbUJBQW1CLENBQUNGLFVBQVUsQ0FBQyxDQUFDO0FBQ3BGO0FBRUEsU0FBU0UsbUJBQW1CQSxDQUFDRixVQUFVLEVBQUU7RUFDdkMsT0FBUSxPQUFPQSxVQUFVLEtBQUssUUFBUSxHQUFJQSxVQUFVLEdBQzFDLE9BQU9HLE9BQU8sS0FBSyxXQUFXLElBQUlILFVBQVUsWUFBWUcsT0FBTyxHQUFJSCxVQUFVLENBQUNJLEdBQUcsR0FDbEZDLE1BQU0sQ0FBQ0wsVUFBVSxDQUFDO0FBQzdCO0FBRUEsU0FBU00scUJBQXFCQSxDQUFDQyxDQUFDLEVBQUU7RUFDaEMsSUFBSSxDQUFDQSxDQUFDLENBQUNDLEVBQUUsRUFBRSxPQUFPLEtBQUs7RUFDdkIsSUFBTUMsRUFBRSxHQUFHLENBQUNGLENBQUMsQ0FBQ0csT0FBTyxDQUFDQyxHQUFHLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxFQUFFQyxXQUFXLENBQUMsQ0FBQztFQUM5RDtFQUNBO0VBQ0E7RUFDQTtFQUNBLE9BQU9ILEVBQUUsQ0FBQ0ksVUFBVSxDQUFDLFlBQVksQ0FBQztBQUNwQztBQUVBLFNBQVNDLGNBQWNBLENBQUNDLFdBQVcsRUFBRWYsVUFBVSxFQUFFZ0IsU0FBUyxFQUFFO0VBQzFELElBQU1DLGVBQWUsR0FBR0YsV0FBVyxHQUFHaEIsaUJBQWlCLENBQUNDLFVBQVUsQ0FBQyxHQUFHQSxVQUFVO0VBQ2hGLE9BQU9OLFVBQVUsQ0FBQ3VCLGVBQWUsRUFBRUQsU0FBUyxDQUFDO0FBQy9DO0FBRUEsU0FBU0UsYUFBYUEsQ0FBQ2xCLFVBQVUsRUFBRWdCLFNBQVMsRUFBRTtFQUM1QyxJQUFNRyxTQUFTLEdBQUcsSUFBSUMsZUFBZSxDQUFDLENBQUM7RUFDdkM7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0EsSUFBTUMsTUFBTSxHQUFHM0IsVUFBVSxDQUFDSyxpQkFBaUIsQ0FBQ0MsVUFBVSxDQUFDLEVBQ3JEc0IsTUFBTSxDQUFDQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUVQLFNBQVMsRUFBRTtJQUFFUSxNQUFNLEVBQUVMLFNBQVMsQ0FBQ0s7RUFBTyxDQUFDLENBQUMsQ0FBQztFQUM3RCxJQUFNQyxPQUFPLEdBQUcvQixVQUFVLENBQUNNLFVBQVUsRUFBRWdCLFNBQVMsQ0FBQyxDQUFDeEUsSUFBSSxDQUFDLFVBQUErRCxDQUFDLEVBQUk7SUFDMUQsSUFBSSxDQUFDRCxxQkFBcUIsQ0FBQ0MsQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJdEcsS0FBSyxDQUFDLHVCQUF1QixDQUFDO0lBQ3ZFLE9BQU9zRyxDQUFDO0VBQ1YsQ0FBQyxDQUFDOztFQUVGO0VBQ0E7RUFDQSxJQUFNbUIsa0JBQWtCLEdBQUdDLE9BQU8sQ0FBQ0MsSUFBSSxDQUFDLENBQ3RDSCxPQUFPLENBQUNqRixJQUFJLENBQUM7SUFBQSxPQUFNLEtBQUs7RUFBQSxHQUFFO0lBQUEsT0FBTSxJQUFJO0VBQUEsRUFBQyxFQUNyQyxJQUFJbUYsT0FBTyxDQUFDLFVBQUEzQyxPQUFPO0lBQUEsT0FBSWxCLFVBQVUsQ0FBQztNQUFBLE9BQU1rQixPQUFPLENBQUMsSUFBSSxDQUFDO0lBQUEsR0FBRVMsMEJBQTBCLENBQUM7RUFBQSxFQUFDLENBQ3BGLENBQUM7O0VBRUY7RUFDQTtFQUNBO0VBQ0E7RUFDQSxJQUFNb0MsbUNBQW1DLEdBQUdGLE9BQU8sQ0FBQ0MsSUFBSSxDQUFDLENBQ3ZESCxPQUFPLENBQUNqRixJQUFJLENBQUM7SUFBQSxPQUFNLElBQUk7RUFBQSxHQUFFO0lBQUEsT0FBTSxLQUFLO0VBQUEsRUFBQyxFQUNyQzZFLE1BQU0sQ0FBQzdFLElBQUksQ0FBQztJQUFBLE9BQU0sS0FBSztFQUFBLEdBQUU7SUFBQSxPQUFNLEtBQUs7RUFBQSxFQUFDLENBQ3RDLENBQUM7RUFDRnFGLG1DQUFtQyxDQUFDckYsSUFBSSxDQUFDLFVBQUFzRixXQUFXLEVBQUk7SUFDdEQsSUFBSUEsV0FBVyxFQUFFWCxTQUFTLENBQUNZLEtBQUssQ0FBQyxDQUFDO0VBQ3BDLENBQUMsQ0FBQzs7RUFFRjtFQUNBO0VBQ0E7RUFDQSxJQUFNQyxlQUFlLEdBQUdMLE9BQU8sQ0FBQ00sR0FBRyxDQUFDLENBQUNSLE9BQU8sRUFBRUosTUFBTSxDQUFDLENBQUMsU0FBTSxDQUMxRCxVQUFBYSxNQUFNO0lBQUEsT0FBSVAsT0FBTyxDQUFDUSxNQUFNLENBQUNELE1BQU0sQ0FBQ0UsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJRixNQUFNLENBQUNFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUFBLENBQ2hFLENBQUM7RUFFRCxPQUFPO0lBQUVKLGVBQWUsRUFBZkEsZUFBZTtJQUFFTixrQkFBa0IsRUFBbEJBO0VBQW1CLENBQUM7QUFDaEQ7QUFFQWpJLE1BQU0sQ0FBQ2tHLEtBQUssR0FBRyxVQUFTSyxVQUFVLEVBQUVnQixTQUFTLEVBQUU7RUFDN0MsSUFBSXFCLElBQUk7RUFDUixJQUFJO0lBQUVBLElBQUksR0FBRyxJQUFJQyxHQUFHLENBQUNwQyxtQkFBbUIsQ0FBQ0YsVUFBVSxDQUFDLEVBQUV2RyxNQUFNLENBQUM4SSxRQUFRLENBQUNDLElBQUksQ0FBQyxDQUFDQyxRQUFRO0VBQUUsQ0FBQyxDQUN2RixPQUFPQyxDQUFDLEVBQUU7SUFBRSxPQUFPaEQsVUFBVSxDQUFDTSxVQUFVLEVBQUVnQixTQUFTLENBQUM7RUFBRTtFQUN0RCxJQUFJLENBQUN6QixvQkFBb0IsQ0FBQ29ELEdBQUcsQ0FBQ04sSUFBSSxDQUFDLEVBQUUsT0FBTzNDLFVBQVUsQ0FBQ00sVUFBVSxFQUFFZ0IsU0FBUyxDQUFDO0VBRTdFLElBQU1ELFdBQVcsR0FBR25CLG9CQUFvQixDQUFDZSxHQUFHLENBQUMwQixJQUFJLENBQUM7RUFDbEQsSUFBTU8sUUFBUSxHQUFHOUMsNEJBQTRCLENBQUNhLEdBQUcsQ0FBQzBCLElBQUksQ0FBQztFQUN2RCxJQUFJdEIsV0FBVyxLQUFLOEIsU0FBUyxFQUFFO0lBQzdCLE9BQU8vQixjQUFjLENBQUNDLFdBQVcsRUFBRWYsVUFBVSxFQUFFZ0IsU0FBUyxDQUFDO0VBQzNELENBQUMsTUFBTSxJQUFJNEIsUUFBUSxFQUFFO0lBQ25CO0lBQ0E7SUFDQSxPQUFPQSxRQUFRLENBQUNwRyxJQUFJLENBQUMsVUFBQXNHLEVBQUU7TUFBQSxPQUFJaEMsY0FBYyxDQUFDZ0MsRUFBRSxFQUFFOUMsVUFBVSxFQUFFZ0IsU0FBUyxDQUFDO0lBQUEsRUFBQztFQUN2RSxDQUFDLE1BQU07SUFDTDtJQUNBLElBQUErQixjQUFBLEdBQWdEN0IsYUFBYSxDQUFDbEIsVUFBVSxFQUFFZ0IsU0FBUyxDQUFDO01BQTVFZ0IsZUFBZSxHQUFBZSxjQUFBLENBQWZmLGVBQWU7TUFBRU4sa0JBQWtCLEdBQUFxQixjQUFBLENBQWxCckIsa0JBQWtCO0lBQzNDNUIsNEJBQTRCLENBQUNrRCxHQUFHLENBQUNYLElBQUksRUFBRVgsa0JBQWtCLENBQUM7SUFDMURBLGtCQUFrQixDQUFDbEYsSUFBSSxDQUFDLFVBQUFzRyxFQUFFLEVBQUk7TUFDNUJsRCxvQkFBb0IsQ0FBQ29ELEdBQUcsQ0FBQ1gsSUFBSSxFQUFFUyxFQUFFLENBQUM7TUFDbENoRCw0QkFBNEIsVUFBTyxDQUFDdUMsSUFBSSxDQUFDO0lBQzNDLENBQUMsQ0FBQztJQUNGLE9BQU9MLGVBQWU7RUFDeEI7QUFDRixDQUFDO0FBRUQsSUFBTWlCLFVBQVUsR0FBR3hKLE1BQU0sQ0FBQ3lKLE1BQU0sS0FBS3pKLE1BQU07QUFFM0MsSUFBSTBKLFFBQVEsR0FBR0MsWUFBWSxDQUFDQyxTQUFpQyxDQUFDO0FBRTlELElBQUlqRCxHQUFHLEdBQUczRyxNQUFNLENBQUMyRyxHQUFHLEdBQUdvRCxtQkFBTyxDQUFDLHFFQUFRLENBQUM7QUFDeEMsSUFBSUMsV0FBVyxHQUFHRCxtQkFBTyxDQUFDLHVEQUFtQixDQUFDO0FBQzlDL0osTUFBTSxDQUFDZ0ssV0FBVyxHQUFHQSxXQUFXO0FBRWhDLElBQU1DLEdBQUcsR0FBRyxJQUFJO0FBQ2hCakssTUFBTSxDQUFDa0ssTUFBTSxHQUFHLFNBQVM7QUFBQSxHQUFlO0VBQ3RDLElBQUlsSyxNQUFNLENBQUM0RixPQUFPLElBQUlxRSxHQUFHLEVBQUU7SUFDekJyRSxPQUFPLENBQUNDLEdBQUcsQ0FBQ3NFLEtBQUssQ0FBQ3ZFLE9BQU8sRUFBRXdFLFNBQVMsQ0FBQztFQUN2QztBQUNGLENBQUM7QUFFRHBLLE1BQU0sQ0FBQ3FLLFFBQVEsR0FBRyxTQUFTO0FBQUEsR0FBZTtFQUN4QyxJQUFJckssTUFBTSxDQUFDNEYsT0FBTyxJQUFJcUUsR0FBRyxFQUFFO0lBQ3pCckUsT0FBTyxDQUFDMEUsS0FBSyxDQUFDSCxLQUFLLENBQUN2RSxPQUFPLEVBQUV3RSxTQUFTLENBQUM7RUFDekM7QUFDRixDQUFDO0FBQ0QsSUFBSUcsYUFBYSxHQUFHNUQsR0FBRyxDQUFDNkQsS0FBSyxDQUFDakksUUFBUSxDQUFDdUcsUUFBUSxDQUFDQyxJQUFJLENBQUM7QUFDckQsSUFBSTBCLE1BQU0sR0FBRzlELEdBQUcsQ0FBQzZELEtBQUssQ0FBQyxJQUFJLEdBQUdELGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNwRHZLLE1BQU0sQ0FBQzBLLGFBQWEsR0FBRyxNQUFNLENBQUMsQ0FBQztBQUMvQjFLLE1BQU0sQ0FBQzJLLFVBQVUsR0FBRyxZQUFXO0VBQzdCbkwsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUN5RCxLQUFLLENBQUMsQ0FBQztBQUNoQyxDQUFDO0FBQ0RqRCxNQUFNLENBQUM0Syx3QkFBd0IsR0FBRyxZQUFXO0VBQzNDO0FBQ0Y7QUFDQTtBQUNBO0FBSEUsQ0FJRDtBQUNENUssTUFBTSxDQUFDNkssVUFBVSxHQUFHLFVBQVNuSCxPQUFPLEVBQUVvSCxJQUFJLEVBQUU7RUFDMUNDLEdBQUcsQ0FBQ0MsWUFBWSxDQUFDdEgsT0FBTyxDQUFDO0VBQ3pCaUgsVUFBVSxDQUFDLENBQUM7RUFDWixJQUFJTSxHQUFHLEdBQUd6TCxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUNDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQ0gsSUFBSSxDQUFDb0UsT0FBTyxDQUFDO0VBQ3JELElBQUdvSCxJQUFJLEVBQUU7SUFDUEcsR0FBRyxDQUFDdkwsSUFBSSxDQUFDLE9BQU8sRUFBRW9MLElBQUksQ0FBQztFQUN6QjtFQUNBRyxHQUFHLENBQUNDLE9BQU8sQ0FBQyxDQUFDO0VBQ2IxTCxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQzJMLE9BQU8sQ0FBQ0YsR0FBRyxDQUFDO0VBQ25DTCx3QkFBd0IsQ0FBQyxDQUFDO0FBQzVCLENBQUM7QUFDRDVLLE1BQU0sQ0FBQ29MLFVBQVUsR0FBRyxVQUFTMUgsT0FBTyxFQUFFO0VBQ3BDcUgsR0FBRyxDQUFDQyxZQUFZLENBQUN0SCxPQUFPLENBQUM7RUFDekJpSCxVQUFVLENBQUMsQ0FBQztFQUNaLElBQUlNLEdBQUcsR0FBR3pMLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQ0MsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDSCxJQUFJLENBQUNvRSxPQUFPLENBQUM7RUFDckRsRSxDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQzJMLE9BQU8sQ0FBQ0YsR0FBRyxDQUFDO0VBQ25DTCx3QkFBd0IsQ0FBQyxDQUFDO0VBQzFCSyxHQUFHLENBQUNJLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDbkIsQ0FBQztBQUNEckwsTUFBTSxDQUFDc0wsWUFBWSxHQUFHLFVBQVM1SCxPQUFPLEVBQUU7RUFDdENxSCxHQUFHLENBQUNDLFlBQVksQ0FBQ3RILE9BQU8sQ0FBQztFQUN6QmlILFVBQVUsQ0FBQyxDQUFDO0VBQ1osSUFBSVksR0FBRyxHQUFHL0wsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUNILElBQUksQ0FBQ29FLE9BQU8sQ0FBQztFQUN0RGxFLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDMkwsT0FBTyxDQUFDSSxHQUFHLENBQUM7RUFDbkNYLHdCQUF3QixDQUFDLENBQUM7RUFDMUJXLEdBQUcsQ0FBQ0YsT0FBTyxDQUFDLElBQUksQ0FBQztBQUNuQixDQUFDO0FBQ0RyTCxNQUFNLENBQUN3TCxZQUFZLEdBQUcsVUFBUzlILE9BQU8sRUFBRTtFQUN0Q3FILEdBQUcsQ0FBQ0MsWUFBWSxDQUFDdEgsT0FBTyxDQUFDO0VBQ3pCaUgsVUFBVSxDQUFDLENBQUM7RUFDWixJQUFJWSxHQUFHLEdBQUcvTCxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUNDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQ0gsSUFBSSxDQUFDb0UsT0FBTyxDQUFDO0VBQ3REbEUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMyTCxPQUFPLENBQUNJLEdBQUcsQ0FBQztFQUNuQ1gsd0JBQXdCLENBQUMsQ0FBQztBQUM1QixDQUFDO0FBQ0Q1SyxNQUFNLENBQUN5TCxnQkFBZ0IsR0FBRyxVQUFTQyxPQUFPLEVBQUU7RUFDMUNYLEdBQUcsQ0FBQ0MsWUFBWSxDQUFDVSxPQUFPLENBQUNwTSxJQUFJLENBQUMsQ0FBQyxDQUFDO0VBQ2hDcUwsVUFBVSxDQUFDLENBQUM7RUFDWm5MLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDMkwsT0FBTyxDQUFDM0wsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUNtRSxNQUFNLENBQUM4SCxPQUFPLENBQUMsQ0FBQztFQUM5RWQsd0JBQXdCLENBQUMsQ0FBQztBQUM1QixDQUFDO0FBQ0Q1SyxNQUFNLENBQUMyTCxjQUFjLEdBQUcsWUFBVTtFQUFDLE9BQU9uTSxDQUFDLENBQUMsNkJBQTZCLENBQUM7QUFBQyxDQUFDO0FBQzVFUSxNQUFNLENBQUM0TCxjQUFjLEdBQUcsWUFBVTtFQUFDLE9BQU9wTSxDQUFDLENBQUMsNkJBQTZCLENBQUM7QUFBQyxDQUFDO0FBRTVFLElBQUlxTSxTQUFTLEdBQUcsWUFBVztFQUV6QixTQUFTQSxTQUFTQSxDQUFBLEVBQUc7SUFDbkIsSUFBSSxDQUFDQyxTQUFTLEdBQUcsSUFBSTFGLEdBQUcsQ0FBQyxDQUFDO0VBQzVCO0VBRUF5RixTQUFTLENBQUNySyxTQUFTLENBQUMwSCxHQUFHLEdBQUcsVUFBVTZDLElBQUksRUFBRTtJQUN4QyxPQUFPLElBQUksQ0FBQ0QsU0FBUyxDQUFDNUMsR0FBRyxDQUFDNkMsSUFBSSxDQUFDO0VBQ2pDLENBQUM7RUFFREYsU0FBUyxDQUFDckssU0FBUyxDQUFDMEYsR0FBRyxHQUFHLFVBQVU2RSxJQUFJLEVBQUU7SUFDeEMsT0FBTyxJQUFJLENBQUNELFNBQVMsQ0FBQzVFLEdBQUcsQ0FBQzZFLElBQUksQ0FBQztFQUNqQyxDQUFDO0VBRURGLFNBQVMsQ0FBQ3JLLFNBQVMsQ0FBQytILEdBQUcsR0FBRyxVQUFVd0MsSUFBSSxFQUFFQyxHQUFHLEVBQUU7SUFDN0MsSUFBR0MsTUFBTSxDQUFDQyxVQUFVLEVBQ2xCRCxNQUFNLENBQUNwRyxHQUFHLENBQUMsU0FBUyxFQUFFO01BQUNrRyxJQUFJLEVBQUVBLElBQUk7TUFBRXRJLEtBQUssRUFBRXVJLEdBQUcsQ0FBQ0csUUFBUSxDQUFDO0lBQUMsQ0FBQyxDQUFDO0lBQzVELE9BQU8sSUFBSSxDQUFDTCxTQUFTLENBQUN2QyxHQUFHLENBQUN3QyxJQUFJLEVBQUVDLEdBQUcsQ0FBQztFQUN0QyxDQUFDO0VBRURILFNBQVMsQ0FBQ3JLLFNBQVMsVUFBTyxHQUFHLFVBQVV1SyxJQUFJLEVBQUU7SUFDM0MsSUFBR0UsTUFBTSxDQUFDQyxVQUFVLEVBQ2xCRCxNQUFNLENBQUNwRyxHQUFHLENBQUMsU0FBUyxFQUFFO01BQUNrRyxJQUFJLEVBQUVBO0lBQUksQ0FBQyxDQUFDO0lBQ3JDLE9BQU8sSUFBSSxDQUFDRCxTQUFTLFVBQU8sQ0FBQ0MsSUFBSSxDQUFDO0VBQ3BDLENBQUM7RUFFREYsU0FBUyxDQUFDckssU0FBUyxDQUFDNEssT0FBTyxHQUFHLFVBQVVDLENBQUMsRUFBRTtJQUN6QyxPQUFPLElBQUksQ0FBQ1AsU0FBUyxDQUFDTSxPQUFPLENBQUNDLENBQUMsQ0FBQztFQUNsQyxDQUFDO0VBRUQsT0FBT1IsU0FBUztBQUNsQixDQUFDLENBQUMsQ0FBQztBQUVILElBQUlTLHNCQUFzQixHQUFHLE1BQU0sR0FBSSxLQUFLLEdBQUdDLElBQUksQ0FBQ0MsTUFBTSxDQUFDLENBQUU7QUFFN0QsU0FBU0MsWUFBWUEsQ0FBQSxFQUFHO0VBQ3RCak4sQ0FBQyxDQUFDMEgsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUNuRSxJQUFJLENBQUMsVUFBUzJKLElBQUksRUFBRTtJQUM1Q0EsSUFBSSxHQUFHQyxJQUFJLENBQUNuQyxLQUFLLENBQUNrQyxJQUFJLENBQUM7SUFDdkIsSUFBR0EsSUFBSSxDQUFDRSxPQUFPLElBQUlGLElBQUksQ0FBQ0UsT0FBTyxLQUFLaEQsU0FBaUMsRUFBRTtNQUNyRTVKLE1BQU0sQ0FBQ3NMLFlBQVksQ0FBQywwRkFBMEYsQ0FBQztJQUNqSDtFQUNGLENBQUMsQ0FBQztBQUNKO0FBQ0EsSUFBRyxDQUFDOUIsVUFBVSxFQUFFO0VBQ2R4SixNQUFNLENBQUM2TSxXQUFXLENBQUNKLFlBQVksRUFBRUgsc0JBQXNCLENBQUM7QUFDMUQ7QUFFQXRNLE1BQU0sQ0FBQytLLEdBQUcsR0FBRztFQUNYK0IsSUFBSSxFQUFFLFNBQU5BLElBQUlBLENBQUEsRUFBYSxDQUFDLENBQUM7RUFDbkJDLFFBQVEsRUFBRSxTQUFWQSxRQUFRQSxDQUFBLEVBQWEsQ0FBQyxDQUFDO0VBQ3ZCakIsU0FBUyxFQUFHLElBQUlELFNBQVMsQ0FBQztBQUM1QixDQUFDO0FBQ0RyTSxDQUFDLENBQUMsWUFBVztFQUNYLElBQU13TixxQkFBcUIsR0FBRywyQkFBMkI7RUFDekQsSUFBTUMsY0FBYyxHQUFHLGlCQUFpQjtFQUV4QyxTQUFTQyxLQUFLQSxDQUFDQyxHQUFHLEVBQUVDLFNBQVMsRUFBRTtJQUM3QixJQUFJQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ2Z4RixNQUFNLENBQUN5RixJQUFJLENBQUNILEdBQUcsQ0FBQyxDQUFDZixPQUFPLENBQUMsVUFBU21CLENBQUMsRUFBRTtNQUNuQ0YsTUFBTSxDQUFDRSxDQUFDLENBQUMsR0FBR0osR0FBRyxDQUFDSSxDQUFDLENBQUM7SUFDcEIsQ0FBQyxDQUFDO0lBQ0YxRixNQUFNLENBQUN5RixJQUFJLENBQUNGLFNBQVMsQ0FBQyxDQUFDaEIsT0FBTyxDQUFDLFVBQVNtQixDQUFDLEVBQUU7TUFDekNGLE1BQU0sQ0FBQ0UsQ0FBQyxDQUFDLEdBQUdILFNBQVMsQ0FBQ0csQ0FBQyxDQUFDO0lBQzFCLENBQUMsQ0FBQztJQUNGLE9BQU9GLE1BQU07RUFDZjtFQUNBLElBQUlHLFlBQVksR0FBRyxJQUFJO0VBQ3ZCLFNBQVNDLG9CQUFvQkEsQ0FBQSxFQUFHO0lBQzlCLElBQUdELFlBQVksRUFBRTtNQUNmQSxZQUFZLENBQUN2SyxLQUFLLENBQUMsQ0FBQztNQUNwQnVLLFlBQVksQ0FBQ0UsTUFBTSxDQUFDLFNBQVMsQ0FBQztNQUM5QkYsWUFBWSxHQUFHLElBQUk7SUFDckI7RUFDRjtFQUNBLElBQUlHLFlBQVksR0FBRyxJQUFJO0VBQ3ZCNUMsR0FBRyxDQUFDNkMsVUFBVSxHQUFHLFVBQVM5SixTQUFTLEVBQUUzRCxPQUFPLEVBQUU7SUFDNUMsSUFBSTBOLE9BQU8sR0FBRyxFQUFFO0lBQ2hCLElBQUkxTixPQUFPLENBQUMyTixjQUFjLENBQUMsU0FBUyxDQUFDLEVBQUU7TUFDckNELE9BQU8sR0FBRzFOLE9BQU8sQ0FBQzBOLE9BQU87SUFDM0I7SUFFQSxJQUFJRSxRQUFRLEdBQUdDLE1BQU0sQ0FBQywrQkFBK0IsQ0FBQztJQUN0REQsUUFBUSxDQUFDbE8sR0FBRyxDQUFDZ08sT0FBTyxDQUFDO0lBQ3JCL0osU0FBUyxDQUFDRixNQUFNLENBQUNtSyxRQUFRLENBQUM7SUFFMUIsSUFBSUUsTUFBTSxHQUFHLFNBQVRBLE1BQU1BLENBQWFDLElBQUksRUFBRUMsV0FBVyxFQUFFO01BQ3hDaE8sT0FBTyxDQUFDaU8sR0FBRyxDQUFDRixJQUFJLEVBQUU7UUFBQ2xLLEVBQUUsRUFBRXFLO01BQUUsQ0FBQyxFQUFFRixXQUFXLENBQUM7SUFDMUMsQ0FBQztJQUVELElBQUlHLGNBQWMsR0FBRyxDQUFDbk8sT0FBTyxDQUFDb08sWUFBWTtJQUMxQyxJQUFJQyxVQUFVLEdBQUcsQ0FBQ3JPLE9BQU8sQ0FBQ29PLFlBQVk7SUFFdEMsSUFBSUUsT0FBTyxHQUFHLENBQUN0TyxPQUFPLENBQUNvTyxZQUFZLEdBQ2pDLENBQUMsYUFBYSxFQUFFLHdCQUF3QixFQUFFLHVCQUF1QixDQUFDLEdBQ2xFLEVBQUU7SUFFSixTQUFTRyxnQkFBZ0JBLENBQUMxSyxFQUFFLEVBQUU7TUFDNUIsSUFBSTJLLElBQUksR0FBRzNLLEVBQUUsQ0FBQzRLLFNBQVMsQ0FBQyxDQUFDO01BQ3pCNUssRUFBRSxDQUFDNkssU0FBUyxDQUFDLFlBQVc7UUFDdEIsS0FBSyxJQUFJekosQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHdUosSUFBSSxFQUFFLEVBQUV2SixDQUFDLEVBQUVwQixFQUFFLENBQUM4SyxVQUFVLENBQUMxSixDQUFDLENBQUM7TUFDakQsQ0FBQyxDQUFDO0lBQ0o7SUFFQSxJQUFJMkosZUFBZSxHQUFHLEdBQUc7SUFFekIsSUFBSUMsTUFBTSxFQUFFQyxZQUFZOztJQUV4QjtJQUNBLElBQUk5TyxPQUFPLENBQUNvTyxZQUFZLEVBQUU7TUFDeEJTLE1BQU0sR0FBRyxFQUFFO0lBQ2IsQ0FBQyxNQUFLO01BQ0pBLE1BQU0sR0FBRyxDQUFDO1FBQUNFLEtBQUssRUFBRSxTQUFTO1FBQUVDLE1BQU0sRUFBRUosZUFBZTtRQUFFSyxTQUFTLEVBQUUsUUFBUTtRQUFFQyxTQUFTLEVBQUU7TUFBUSxDQUFDLENBQUM7TUFDaEdKLFlBQVksR0FBR0YsZUFBZTtJQUNoQztJQUVBLElBQU1PLEdBQUcsR0FBR3JMLFVBQVUsQ0FBQ3NMLE1BQU0sV0FBUSxLQUFLdEwsVUFBVSxDQUFDc0wsTUFBTSxDQUFDQyxVQUFVO0lBQ3RFNUosT0FBTyxDQUFDQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUU1QixVQUFVLENBQUNzTCxNQUFNLFdBQVEsRUFBRSxjQUFjLEVBQUV0TCxVQUFVLENBQUNzTCxNQUFNLENBQUNDLFVBQVUsRUFBRSxPQUFPLEVBQUVGLEdBQUcsQ0FBQztJQUNwSCxJQUFNRyxRQUFRLEdBQUdILEdBQUcsR0FBRyxLQUFLLEdBQUcsTUFBTTtJQUVyQyxJQUFNSSxTQUFTLEdBQUFDLGVBQUEsQ0FBQUEsZUFBQTtNQUNYLGFBQWEsRUFBRSxTQUFmQyxVQUFhQSxDQUFXNUwsRUFBRSxFQUFFO1FBQUVpSyxNQUFNLENBQUNqSyxFQUFFLENBQUNtSSxRQUFRLENBQUMsQ0FBQyxDQUFDO01BQUUsQ0FBQztNQUN0RCxrQkFBa0IsRUFBRSxTQUFwQjBELGNBQWtCQSxDQUFXN0wsRUFBRSxFQUFFO1FBQUVpSyxNQUFNLENBQUNqSyxFQUFFLENBQUNtSSxRQUFRLENBQUMsQ0FBQyxDQUFDO01BQUUsQ0FBQztNQUMzRCxLQUFLLEVBQUUsWUFBWTtNQUNuQixRQUFRLEVBQUV1QyxnQkFBZ0I7TUFDMUIsVUFBVSxFQUFFLGdCQUFnQjtNQUM1QixVQUFVLEVBQUUsZ0JBQWdCO01BQzVCLFdBQVcsRUFBRSxlQUFlO01BQzVCLFdBQVcsRUFBRSxlQUFlO01BQzVCLFdBQVcsRUFBRSxpQkFBaUI7TUFDOUIsWUFBWSxFQUFFO0lBQWdCLE1BQUFvQixNQUFBLENBQzFCTCxRQUFRLFNBQU8sZ0JBQWdCLE1BQUFLLE1BQUEsQ0FDL0JMLFFBQVEsU0FBTyxlQUFlLENBQ25DO0lBQ0gsSUFBR3pQLE1BQU0sQ0FBQytQLGVBQWUsRUFBRTtNQUN6QjtNQUNBO01BQ0E7TUFDQTlMLFVBQVUsQ0FBQ3NMLE1BQU0sV0FBUSxJQUFBTyxNQUFBLENBQUlMLFFBQVEsUUFBSyxHQUFHLEtBQUs7TUFDbER4TCxVQUFVLENBQUNzTCxNQUFNLFdBQVEsVUFBQU8sTUFBQSxDQUFVTCxRQUFRLFFBQUssR0FBRyxLQUFLO01BQ3hEeEwsVUFBVSxDQUFDc0wsTUFBTSxXQUFRLElBQUFPLE1BQUEsQ0FBSUwsUUFBUSxRQUFLLEdBQUcsS0FBSztNQUNsRDtNQUNBeEwsVUFBVSxDQUFDc0wsTUFBTSxXQUFRLElBQUFPLE1BQUEsQ0FBSUwsUUFBUSxRQUFLLEdBQUcsS0FBSztJQUNwRDtJQUVBLElBQUlPLFNBQVMsR0FBRztNQUNkVCxNQUFNLEVBQUUsU0FBUztNQUNqQkcsU0FBUyxFQUFFekwsVUFBVSxDQUFDZ00sZUFBZSxDQUFDUCxTQUFTLENBQUM7TUFDaERRLFVBQVUsRUFBRSxDQUFDO01BQ2JDLE9BQU8sRUFBRSxDQUFDO01BQ1ZDLGNBQWMsRUFBRUMsUUFBUTtNQUN4QmxNLFdBQVcsRUFBRW1LLGNBQWM7TUFDM0JnQyxhQUFhLEVBQUUsSUFBSTtNQUNuQkMsYUFBYSxFQUFFLElBQUk7TUFDbkJDLGlCQUFpQixFQUFFLElBQUk7TUFDdkJDLFVBQVUsRUFBRWpDLFVBQVU7TUFDdEJDLE9BQU8sRUFBRUEsT0FBTztNQUNoQmlDLFlBQVksRUFBRSxJQUFJO01BQ2xCQyxPQUFPLEVBQUUsSUFBSTtNQUNiM0IsTUFBTSxFQUFFQSxNQUFNO01BQ2RDLFlBQVksRUFBRUEsWUFBWTtNQUMxQjJCLGFBQWEsRUFBRTtJQUNqQixDQUFDO0lBRURaLFNBQVMsR0FBRzlDLEtBQUssQ0FBQzhDLFNBQVMsRUFBRTdQLE9BQU8sQ0FBQzZQLFNBQVMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUVyRCxJQUFJM0IsRUFBRSxHQUFHcEssVUFBVSxDQUFDNE0sWUFBWSxDQUFDOUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFaUMsU0FBUyxDQUFDO0lBQ3hEM0IsRUFBRSxDQUFDMU8sRUFBRSxDQUFDLE9BQU8sRUFBRSxZQUFNO01BQ25CZ08sWUFBWSxHQUFHVSxFQUFFO0lBQ25CLENBQUMsQ0FBQztJQUVGLFNBQVN5QyxvQkFBb0JBLENBQUEsRUFBRztNQUM5QixJQUFNQyxTQUFTLEdBQUcxQyxFQUFFLENBQUMyQyxPQUFPLENBQUMsQ0FBQyxDQUFDO01BQy9CLElBQU1DLEtBQUssR0FBR0YsU0FBUyxDQUFDRSxLQUFLLENBQUNoRSxjQUFjLENBQUM7TUFDN0MsT0FBT2dFLEtBQUssS0FBSyxJQUFJO0lBQ3ZCO0lBRUEsSUFBSUMsYUFBYSxHQUFHLElBQUk7SUFDeEIsU0FBU0MsY0FBY0EsQ0FBQ0MsY0FBYyxFQUFFO01BQ3RDLElBQUlDLFlBQVksR0FBR1Asb0JBQW9CLENBQUMsQ0FBQztNQUN6QyxJQUFHLENBQUNPLFlBQVksSUFBSUgsYUFBYSxLQUFLLElBQUksRUFBRTtRQUMxQ0EsYUFBYSxDQUFDSSxLQUFLLENBQUMsQ0FBQztNQUN2QjtNQUNBLElBQUcsQ0FBQ0QsWUFBWSxFQUFFO1FBQ2hCaEQsRUFBRSxDQUFDa0QsWUFBWSxDQUFDSCxjQUFjLEVBQUU7VUFBRUksSUFBSSxFQUFDLENBQUM7VUFBRUMsRUFBRSxFQUFFO1FBQUMsQ0FBQyxFQUFFO1VBQUNELElBQUksRUFBRSxDQUFDO1VBQUVDLEVBQUUsRUFBRTtRQUFDLENBQUMsQ0FBQztNQUNyRSxDQUFDLE1BQ0k7UUFDSHBELEVBQUUsQ0FBQ2tELFlBQVksQ0FBQ0gsY0FBYyxFQUFFO1VBQUVJLElBQUksRUFBQyxDQUFDO1VBQUVDLEVBQUUsRUFBRTtRQUFDLENBQUMsRUFBRTtVQUFDRCxJQUFJLEVBQUUsQ0FBQztVQUFFQyxFQUFFLEVBQUU7UUFBQyxDQUFDLENBQUM7TUFDckU7SUFDRjtJQUVBLElBQUcsQ0FBQ3RSLE9BQU8sQ0FBQ29PLFlBQVksRUFBRTtNQUV4QixJQUFNbUQscUJBQXFCLEdBQUduUCxRQUFRLENBQUNvUCxhQUFhLENBQUMsS0FBSyxDQUFDO01BQzNERCxxQkFBcUIsQ0FBQ3JDLFNBQVMsR0FBRyx5QkFBeUI7TUFDM0QsSUFBTXVDLGFBQWEsR0FBR3JQLFFBQVEsQ0FBQ29QLGFBQWEsQ0FBQyxNQUFNLENBQUM7TUFDcERDLGFBQWEsQ0FBQ3ZDLFNBQVMsR0FBRyx5QkFBeUI7TUFDbkR1QyxhQUFhLENBQUNDLFNBQVMsR0FBRyxvTEFBb0w7TUFDOU0sSUFBTUMsY0FBYyxHQUFHdlAsUUFBUSxDQUFDb1AsYUFBYSxDQUFDLEtBQUssQ0FBQztNQUNwREcsY0FBYyxDQUFDQyxHQUFHLEdBQUcvUixNQUFNLENBQUNnUyxZQUFZLEdBQUcsbUJBQW1CO01BQzlERixjQUFjLENBQUN6QyxTQUFTLEdBQUcsaUJBQWlCO01BQzVDcUMscUJBQXFCLENBQUNPLFdBQVcsQ0FBQ0gsY0FBYyxDQUFDO01BQ2pESixxQkFBcUIsQ0FBQ08sV0FBVyxDQUFDTCxhQUFhLENBQUM7TUFDaER2RCxFQUFFLENBQUM2RCxlQUFlLENBQUMsQ0FBQyxFQUFFLGFBQWEsRUFBRVIscUJBQXFCLENBQUM7TUFFM0RyRCxFQUFFLENBQUM4RCxpQkFBaUIsQ0FBQyxDQUFDLENBQUNDLFlBQVksR0FBRyxVQUFTblEsQ0FBQyxFQUFFO1FBQ2hEb00sRUFBRSxDQUFDZ0UsV0FBVyxDQUFDLGFBQWEsQ0FBQztNQUMvQixDQUFDOztNQUVEO01BQ0FoRSxFQUFFLENBQUM4RCxpQkFBaUIsQ0FBQyxDQUFDLENBQUNHLFdBQVcsR0FBRyxVQUFTclEsQ0FBQyxFQUFFO1FBQy9DLElBQUlzUSxNQUFNLEdBQUdsRSxFQUFFLENBQUNtRSxVQUFVLENBQUM7VUFBRUMsSUFBSSxFQUFFeFEsQ0FBQyxDQUFDeVEsT0FBTztVQUFFQyxHQUFHLEVBQUUxUSxDQUFDLENBQUMyUTtRQUFRLENBQUMsQ0FBQztRQUMvRCxJQUFJQyxPQUFPLEdBQUd4RSxFQUFFLENBQUN5RSxXQUFXLENBQUNQLE1BQU0sQ0FBQztRQUNwQyxJQUFJTSxPQUFPLENBQUN0UyxNQUFNLEtBQUssQ0FBQyxFQUFFO1VBQ3hCOE4sRUFBRSxDQUFDZ0UsV0FBVyxDQUFDLGFBQWEsQ0FBQztRQUMvQjtRQUNBLElBQUlFLE1BQU0sQ0FBQ2YsSUFBSSxLQUFLLENBQUMsSUFBSXFCLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSzNCLGFBQWEsRUFBRTtVQUNyRDdDLEVBQUUsQ0FBQzZELGVBQWUsQ0FBQyxDQUFDLEVBQUUsYUFBYSxFQUFFUixxQkFBcUIsQ0FBQztRQUM3RCxDQUFDLE1BQ0k7VUFDSHJELEVBQUUsQ0FBQ2dFLFdBQVcsQ0FBQyxhQUFhLENBQUM7UUFDL0I7TUFDRixDQUFDO01BQ0RoRSxFQUFFLENBQUMxTyxFQUFFLENBQUMsUUFBUSxFQUFFLFVBQVNvVCxNQUFNLEVBQUU7UUFDL0IsU0FBU0Msc0JBQXNCQSxDQUFDQyxDQUFDLEVBQUU7VUFBRSxPQUFPQSxDQUFDLENBQUNDLElBQUksQ0FBQzFCLElBQUksS0FBSyxDQUFDO1FBQUU7UUFDL0QsSUFBR3VCLE1BQU0sQ0FBQ0ksS0FBSyxDQUFDQyxVQUFVLElBQUlMLE1BQU0sQ0FBQ0ksS0FBSyxDQUFDQyxVQUFVLENBQUNDLEtBQUssQ0FBQ0wsc0JBQXNCLENBQUMsRUFBRTtVQUFFO1FBQVE7UUFDL0YsSUFBSTNCLFlBQVksR0FBR1Asb0JBQW9CLENBQUMsQ0FBQztRQUN6QyxJQUFHTyxZQUFZLEVBQUU7VUFDZixJQUFHSCxhQUFhLEVBQUU7WUFBRUEsYUFBYSxDQUFDSSxLQUFLLENBQUMsQ0FBQztVQUFFO1VBQzNDSixhQUFhLEdBQUc3QyxFQUFFLENBQUNpRixRQUFRLENBQUM7WUFBQzlCLElBQUksRUFBRSxDQUFDO1lBQUVDLEVBQUUsRUFBRTtVQUFDLENBQUMsRUFBRTtZQUFDRCxJQUFJLEVBQUUsQ0FBQztZQUFFQyxFQUFFLEVBQUU7VUFBQyxDQUFDLEVBQUU7WUFBRThCLFVBQVUsRUFBRTtjQUFFQyxPQUFPLEVBQUU7WUFBSyxDQUFDO1lBQUVuRSxTQUFTLEVBQUUsU0FBUztZQUFFb0UsTUFBTSxFQUFFLElBQUk7WUFBRUMsYUFBYSxFQUFFLElBQUk7WUFBRUMsY0FBYyxFQUFFO1VBQU0sQ0FBQyxDQUFDO1FBQ3BMO01BQ0YsQ0FBQyxDQUFDO0lBQ0o7SUFDQSxJQUFJckYsY0FBYyxFQUFFO01BQ2xCRCxFQUFFLENBQUN1RixPQUFPLENBQUNDLE9BQU8sQ0FBQzVCLFdBQVcsQ0FBQ3RHLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDbkQwQyxFQUFFLENBQUN1RixPQUFPLENBQUNDLE9BQU8sQ0FBQzVCLFdBQVcsQ0FBQ3JHLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDckQ7SUFFQWtJLG1CQUFtQixDQUFDLENBQUM7SUFFckIsT0FBTztNQUNMOVAsRUFBRSxFQUFFcUssRUFBRTtNQUNOOEMsY0FBYyxFQUFFQSxjQUFjO01BQzlCN00sT0FBTyxFQUFFLFNBQVRBLE9BQU9BLENBQUEsRUFBYTtRQUFFK0osRUFBRSxDQUFDL0osT0FBTyxDQUFDLENBQUM7TUFBRSxDQUFDO01BQ3JDOEosR0FBRyxFQUFFLFNBQUxBLEdBQUdBLENBQUEsRUFBYTtRQUNkSCxNQUFNLENBQUNJLEVBQUUsQ0FBQ2xDLFFBQVEsQ0FBQyxDQUFDLENBQUM7TUFDdkIsQ0FBQztNQUNEckosS0FBSyxFQUFFLFNBQVBBLEtBQUtBLENBQUEsRUFBYTtRQUFFdUwsRUFBRSxDQUFDdkwsS0FBSyxDQUFDLENBQUM7TUFBRSxDQUFDO01BQ2pDaVIsYUFBYSxFQUFFLElBQUksQ0FBQztJQUN0QixDQUFDO0VBQ0gsQ0FBQztFQUNEaEosR0FBRyxDQUFDaUosUUFBUSxHQUFHLFlBQVc7SUFDeEJwTyxPQUFPLENBQUNDLEdBQUcsQ0FBQyxzQkFBc0IsRUFBRXVFLFNBQVMsQ0FBQztFQUNoRCxDQUFDO0VBRUQsU0FBUzZKLFdBQVdBLENBQUM1UixNQUFNLEVBQUU7SUFDM0IsT0FBTzZSLEtBQUssQ0FBQ0MsSUFBSSxDQUFDO01BQUNwSSxJQUFJLEVBQUUsUUFBUTtNQUMvQmEsT0FBTyxFQUFFO0lBQ1gsQ0FBQyxDQUFDLENBQUM3SixJQUFJLENBQUMsVUFBQ3FSLEdBQUcsRUFBSztNQUNmQSxHQUFHLENBQUNDLE1BQU0sQ0FBQ25OLEdBQUcsQ0FBQztRQUFFb04sWUFBWSxFQUFFLFdBQVc7UUFBRUMsWUFBWSxFQUFFO01BQXVCLENBQUMsQ0FBQyxDQUFDeFIsSUFBSSxDQUFDLFVBQVN5UixJQUFJLEVBQUU7UUFDdEcsSUFBSXpJLElBQUksR0FBR3lJLElBQUksQ0FBQ0MsS0FBSyxJQUFJRCxJQUFJLENBQUNDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBR0QsSUFBSSxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUNDLFdBQVcsR0FBR3RMLFNBQVM7UUFDOUUsSUFBSW9MLElBQUksQ0FBQ0csY0FBYyxJQUFJSCxJQUFJLENBQUNHLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSUgsSUFBSSxDQUFDRyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUNsUixLQUFLLEVBQUU7VUFDakZzSSxJQUFJLEdBQUd5SSxJQUFJLENBQUNHLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQ2xSLEtBQUs7UUFDckM7UUFDQXBCLE1BQU0sQ0FBQy9DLElBQUksQ0FBQ3lNLElBQUksQ0FBQztNQUNuQixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjtFQUVBNkksVUFBVSxDQUFDN1IsSUFBSSxDQUFDLFVBQVNxUixHQUFHLEVBQUU7SUFDNUJBLEdBQUcsQ0FBQ1MsVUFBVSxDQUFDOVIsSUFBSSxDQUFDLFlBQVc7TUFDN0J2RCxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUNpQyxJQUFJLENBQUMsQ0FBQztNQUN0QmpDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQ29DLElBQUksQ0FBQyxDQUFDO01BQ3ZCcVMsV0FBVyxDQUFDelUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzdCLENBQUMsQ0FBQztJQUNGNFUsR0FBRyxDQUFDUyxVQUFVLENBQUNDLElBQUksQ0FBQyxZQUFXO01BQzdCdFYsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDb0MsSUFBSSxDQUFDLENBQUM7TUFDdEJwQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUNpQyxJQUFJLENBQUMsQ0FBQztJQUN6QixDQUFDLENBQUM7RUFDSixDQUFDLENBQUM7RUFFRm1ULFVBQVUsR0FBR0EsVUFBVSxDQUFDN1IsSUFBSSxDQUFDLFVBQVNxUixHQUFHLEVBQUU7SUFBRSxPQUFPQSxHQUFHLENBQUNBLEdBQUc7RUFBRSxDQUFDLENBQUM7RUFDL0Q1VSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQ3FDLEtBQUssQ0FBQyxZQUFXO0lBQ25DckMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUNGLElBQUksQ0FBQyxlQUFlLENBQUM7SUFDekNFLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDRSxJQUFJLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQztJQUNoREYsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUNFLElBQUksQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDO0lBQ2xERixDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQ0UsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUM7SUFDMUM7SUFDQW9VLG1CQUFtQixDQUFDLENBQUM7SUFDckJjLFVBQVUsR0FBR0csMEJBQTBCLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDO0lBQ2hFSCxVQUFVLENBQUM3UixJQUFJLENBQUMsVUFBU3FSLEdBQUcsRUFBRTtNQUM1QkEsR0FBRyxDQUFDUyxVQUFVLENBQUM5UixJQUFJLENBQUMsWUFBVztRQUM3QnZELENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQ2lDLElBQUksQ0FBQyxDQUFDO1FBQ3RCakMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDb0MsSUFBSSxDQUFDLENBQUM7UUFDdkJXLFFBQVEsQ0FBQ3lTLGFBQWEsQ0FBQ0MsSUFBSSxDQUFDLENBQUM7UUFDN0J6VixDQUFDLENBQUMsbUJBQW1CLENBQUMsQ0FBQ3NELEtBQUssQ0FBQyxDQUFDO1FBQzlCbVIsV0FBVyxDQUFDelUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzNCLElBQUdpTCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUlBLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRTtVQUM1QyxJQUFJeUssTUFBTSxHQUFHZCxHQUFHLENBQUNBLEdBQUcsQ0FBQ2UsV0FBVyxDQUFDMUssTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1VBQzFEN0UsT0FBTyxDQUFDQyxHQUFHLENBQUMscUNBQXFDLEVBQUVxUCxNQUFNLENBQUM7VUFDMURFLFdBQVcsQ0FBQ0YsTUFBTSxDQUFDO1VBQ25CRyxhQUFhLEdBQUdILE1BQU07UUFDeEIsQ0FBQyxNQUFNO1VBQ0xHLGFBQWEsR0FBR2pXLENBQUMsQ0FBQ2tXLEtBQUssQ0FBQyxZQUFXO1lBQUUsT0FBTyxJQUFJO1VBQUUsQ0FBQyxDQUFDO1FBQ3REO01BQ0YsQ0FBQyxDQUFDO01BQ0ZsQixHQUFHLENBQUNTLFVBQVUsQ0FBQ0MsSUFBSSxDQUFDLFlBQVc7UUFDN0J0VixDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQ0YsSUFBSSxDQUFDLHlCQUF5QixDQUFDO1FBQ25ERSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQ0UsSUFBSSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUM7UUFDM0NGLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDRSxJQUFJLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQztRQUM3QztRQUNBNkMsUUFBUSxDQUFDeVMsYUFBYSxDQUFDQyxJQUFJLENBQUMsQ0FBQztRQUM3QnpWLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDc0QsS0FBSyxDQUFDLENBQUM7UUFDM0I7TUFDRixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7SUFDRjhSLFVBQVUsR0FBR0EsVUFBVSxDQUFDN1IsSUFBSSxDQUFDLFVBQVNxUixHQUFHLEVBQUU7TUFBRSxPQUFPQSxHQUFHLENBQUNBLEdBQUc7SUFBRSxDQUFDLENBQUM7RUFDakUsQ0FBQyxDQUFDOztFQUVGO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUdFLElBQUltQixjQUFjO0VBQ2xCLElBQUc5SyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUlBLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRTtJQUM3QzhLLGNBQWMsR0FBR0MsV0FBVyxDQUFDL0ssTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0VBQ3pELENBQUMsTUFDSTtJQUNIOEssY0FBYyxHQUFHWCxVQUFVLENBQUM3UixJQUFJLENBQUMsVUFBU3FSLEdBQUcsRUFBRTtNQUM3QyxJQUFJcUIsV0FBVyxHQUFHLElBQUk7TUFDdEIsSUFBR2hMLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSUEsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFO1FBQzVDaUwsaUJBQWlCLENBQUMsQ0FBQztRQUNuQkQsV0FBVyxHQUFHckIsR0FBRyxDQUFDZSxXQUFXLENBQUMxSyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdkRnTCxXQUFXLENBQUMxUyxJQUFJLENBQUMsVUFBUzRTLENBQUMsRUFBRTtVQUFFQyxrQkFBa0IsQ0FBQ0QsQ0FBQyxDQUFDO1FBQUUsQ0FBQyxDQUFDO01BQzFELENBQUMsTUFDSSxJQUFHbEwsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJQSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUU7UUFDL0N3QixNQUFNLENBQUNwRyxHQUFHLENBQUMscUJBQXFCLEVBQzlCO1VBQ0V2QyxFQUFFLEVBQUVtSCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTztRQUMzQixDQUFDLENBQUM7UUFDSmdMLFdBQVcsR0FBR3JCLEdBQUcsQ0FBQ3lCLGlCQUFpQixDQUFDcEwsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNEZ0wsV0FBVyxDQUFDMVMsSUFBSSxDQUFDLFVBQVMrUyxJQUFJLEVBQUU7VUFDOUI7VUFDQTtVQUNBO1VBQ0FBLElBQUksQ0FBQ0MsV0FBVyxDQUFDLENBQUMsQ0FBQ2hULElBQUksQ0FBQyxVQUFTaVQsUUFBUSxFQUFFO1lBQ3pDcFEsT0FBTyxDQUFDQyxHQUFHLENBQUMseUJBQXlCLEVBQUVtUSxRQUFRLENBQUM7WUFDaEQsSUFBSUMsUUFBUSxHQUFHelcsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUNpQyxJQUFJLENBQUMsQ0FBQyxDQUFDZSxHQUFHLENBQUMsT0FBTyxDQUFDO1lBQ3RELElBQUljLEVBQUUsR0FBRzBTLFFBQVEsQ0FBQ0UsTUFBTSxDQUFDelMsS0FBSztZQUM5QndTLFFBQVEsQ0FBQ0UsV0FBVyxDQUFDLFFBQVEsQ0FBQztZQUM5QkYsUUFBUSxDQUFDcFUsS0FBSyxDQUFDLFlBQVc7Y0FDeEI3QixNQUFNLENBQUNvVyxJQUFJLENBQUNwVyxNQUFNLENBQUNnUyxZQUFZLEdBQUcsa0JBQWtCLEdBQUcxTyxFQUFFLEVBQUUsUUFBUSxDQUFDO1lBQ3RFLENBQUMsQ0FBQztVQUNKLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQztNQUNKLENBQUMsTUFDSTtRQUNIbVMsV0FBVyxHQUFHLElBQUk7TUFDcEI7TUFDQSxJQUFHQSxXQUFXLEVBQUU7UUFDZEEsV0FBVyxDQUFDWCxJQUFJLENBQUMsVUFBUzdKLEdBQUcsRUFBRTtVQUM3QnJGLE9BQU8sQ0FBQzBFLEtBQUssQ0FBQ1csR0FBRyxDQUFDO1VBQ2xCakwsTUFBTSxDQUFDNkssVUFBVSxDQUFDLDZCQUE2QixDQUFDO1FBQ2xELENBQUMsQ0FBQztRQUNGLE9BQU80SyxXQUFXO01BQ3BCLENBQUMsTUFBTTtRQUNMLE9BQU8sSUFBSTtNQUNiO0lBQ0YsQ0FBQyxDQUFDLFNBQU0sQ0FBQyxVQUFBeFQsQ0FBQyxFQUFJO01BQ1oyRCxPQUFPLENBQUMwRSxLQUFLLENBQUMsaUVBQWlFLEVBQUVySSxDQUFDLENBQUM7TUFDbkYsT0FBTyxJQUFJO0lBQ2IsQ0FBQyxDQUFDO0VBQ0o7RUFFQSxTQUFTb1UsUUFBUUEsQ0FBQ0MsUUFBUSxFQUFFO0lBQzFCL1QsUUFBUSxDQUFDM0IsS0FBSyxHQUFHMFYsUUFBUSxHQUFHLG1CQUFtQjtJQUMvQzlXLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQ0YsSUFBSSxDQUFDLFFBQVEsR0FBR2dYLFFBQVEsQ0FBQztFQUM5QztFQUNBdkwsR0FBRyxDQUFDc0wsUUFBUSxHQUFHQSxRQUFRO0VBRXZCLElBQUlFLFFBQVEsR0FBRyxLQUFLO0VBRXBCL1csQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDcUMsS0FBSyxDQUFDLFlBQVc7SUFDaEMsSUFBSTJVLFdBQVcsR0FBR2hYLENBQUMsQ0FBQyxhQUFhLENBQUM7SUFDbEMsSUFBSWlYLFFBQVEsR0FBRzFMLEdBQUcsQ0FBQzJMLE1BQU0sQ0FBQzFTLEVBQUUsQ0FBQ21JLFFBQVEsQ0FBQyxDQUFDO0lBQ3ZDLElBQUl3SyxZQUFZLEdBQUczVyxNQUFNLENBQUM2SSxHQUFHLENBQUMrTixlQUFlLENBQUMsSUFBSUMsSUFBSSxDQUFDLENBQUNKLFFBQVEsQ0FBQyxFQUFFO01BQUNLLElBQUksRUFBRTtJQUFZLENBQUMsQ0FBQyxDQUFDO0lBQ3pGLElBQUcsQ0FBQ1AsUUFBUSxFQUFFO01BQUVBLFFBQVEsR0FBRyxzQkFBc0I7SUFBRTtJQUNuRCxJQUFHQSxRQUFRLENBQUNsVyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQU1rVyxRQUFRLENBQUNoVyxNQUFNLEdBQUcsQ0FBRSxFQUFFO01BQ3JEZ1csUUFBUSxJQUFJLE1BQU07SUFDcEI7SUFDQUMsV0FBVyxDQUFDOVcsSUFBSSxDQUFDO01BQ2ZxWCxRQUFRLEVBQUVSLFFBQVE7TUFDbEJ4TixJQUFJLEVBQUU0TjtJQUNSLENBQUMsQ0FBQztJQUNGblgsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDb0UsTUFBTSxDQUFDNFMsV0FBVyxDQUFDO0VBQ3BDLENBQUMsQ0FBQztFQUVGLFNBQVNRLFNBQVNBLENBQUNDLGNBQWMsRUFBRTtJQUNqQyxTQUFTblMsV0FBV0EsQ0FBQ0YsS0FBSyxFQUFFO01BQzFCLElBQU1zUyxPQUFPLEdBQUcxWCxDQUFDLENBQUMsT0FBTyxDQUFDO01BQzFCLElBQU0yWCxRQUFRLEdBQUczWCxDQUFDLENBQUMsS0FBSyxDQUFDO01BQ3pCLElBQU00WCxNQUFNLEdBQUc1WCxDQUFDLENBQUMsNkJBQTZCLENBQUM7TUFDL0MsSUFBTTZYLGlCQUFpQixHQUFHN1gsQ0FBQyxDQUFDLE1BQU0sR0FBR3lYLGNBQWMsR0FBRyxPQUFPLENBQUM7TUFDOURFLFFBQVEsQ0FBQ3ZULE1BQU0sQ0FBQyw4RkFBOEYsRUFBRXlULGlCQUFpQixFQUFFLEdBQUcsQ0FBQztNQUN2SSxJQUFNQyxVQUFVLEdBQUc5WCxDQUFDLENBQUMsc0JBQXNCLENBQUM7TUFDNUMsSUFBTStYLElBQUksR0FBRy9YLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FDbkJvRSxNQUFNLENBQUNwRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUNvRSxNQUFNLENBQUMsaUJBQWlCLEVBQUUwVCxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FDNUQxVCxNQUFNLENBQUNwRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUNvRSxNQUFNLENBQUMsK0JBQStCLEVBQUV3VCxNQUFNLEVBQUUsMkNBQTJDLENBQUMsQ0FBQztNQUNqSEYsT0FBTyxDQUFDdFQsTUFBTSxDQUFDdVQsUUFBUSxDQUFDO01BQ3hCRCxPQUFPLENBQUN0VCxNQUFNLENBQUNwRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUNvRSxNQUFNLENBQUMyVCxJQUFJLENBQUMsQ0FBQztNQUNyQyxJQUFNQyxVQUFVLEdBQUdoWSxDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FBQ3FELEdBQUcsQ0FBQztRQUFFLFdBQVcsRUFBRSxHQUFHO1FBQUUsZUFBZSxFQUFFO01BQU0sQ0FBQyxDQUFDO01BQzlGLElBQU00VSxZQUFZLEdBQUdqWSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUNvRSxNQUFNLENBQUNnQixLQUFLLENBQUMsQ0FBQy9CLEdBQUcsQ0FBQztRQUFFLFdBQVcsRUFBRTtNQUFJLENBQUMsQ0FBQztNQUN2RSxJQUFNNlUsS0FBSyxHQUFHbFksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDcUQsR0FBRyxDQUFDO1FBQzNCK1EsT0FBTyxFQUFFLE1BQU07UUFDZixnQkFBZ0IsRUFBRSxLQUFLO1FBQ3ZCLGlCQUFpQixFQUFFLFlBQVk7UUFDL0IsYUFBYSxFQUFFO01BQ2pCLENBQUMsQ0FBQztNQUNGOEQsS0FBSyxDQUFDOVQsTUFBTSxDQUFDNFQsVUFBVSxDQUFDLENBQUM1VCxNQUFNLENBQUM2VCxZQUFZLENBQUM7TUFDN0NQLE9BQU8sQ0FBQ3RULE1BQU0sQ0FBQzhULEtBQUssQ0FBQztNQUNyQixPQUFPUixPQUFPO0lBQ2hCO0lBQ0EsSUFBTVMsZUFBZSxHQUFHLElBQUkzTixXQUFXLENBQUM7TUFDcENwSixLQUFLLEVBQUUsa0JBQWtCO01BQ3pCTixLQUFLLEVBQUUsTUFBTTtNQUNiSCxPQUFPLEVBQUUsQ0FDUDtRQUNFMkUsV0FBVyxFQUFFQSxXQUFXO1FBQ3hCOUQsVUFBVSxFQUFFLGtCQUFrQjtRQUM5QjZELFlBQVksRUFBRW9TO01BQ2hCLENBQUM7SUFFTCxDQUFDLENBQUM7SUFDSlUsZUFBZSxDQUFDbFcsSUFBSSxDQUFDLFVBQUN5VSxNQUFNLEVBQUs7TUFDL0IsSUFBRyxDQUFDQSxNQUFNLEVBQUU7UUFBRTtNQUFRO01BQ3RCbkwsR0FBRyxDQUFDMkwsTUFBTSxDQUFDdkYsY0FBYyxDQUFDLGNBQWMsR0FBRytFLE1BQU0sQ0FBQzBCLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQ2xFLENBQUMsQ0FBQztFQUNKO0VBQ0FwWSxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQ0csRUFBRSxDQUFDLE9BQU8sRUFBRSxZQUFXO0lBQzFDLElBQU1rWSxTQUFTLEdBQUc5TSxHQUFHLENBQUMyTCxNQUFNLENBQUMxUyxFQUFFLENBQUNnTixPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQzFDLElBQU04RyxVQUFVLEdBQUdELFNBQVMsQ0FBQzVHLEtBQUssQ0FBQ2hFLGNBQWMsQ0FBQztJQUNsRCtKLFNBQVMsQ0FBQ2MsVUFBVSxLQUFLLElBQUksR0FBRyxFQUFFLEdBQUdELFNBQVMsQ0FBQ0UsS0FBSyxDQUFDRCxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUN2WCxNQUFNLENBQUMsQ0FBQztFQUM3RSxDQUFDLENBQUM7RUFFRixJQUFJeVgsZUFBZSxHQUFHLEVBQUU7RUFFeEIsU0FBU0MsWUFBWUEsQ0FBQ2xNLElBQUksRUFBRTtJQUMxQixJQUFHQSxJQUFJLENBQUN4TCxNQUFNLElBQUl5WCxlQUFlLEdBQUcsQ0FBQyxFQUFFO01BQUUsT0FBT2pNLElBQUk7SUFBRTtJQUN0RCxPQUFPQSxJQUFJLENBQUNnTSxLQUFLLENBQUMsQ0FBQyxFQUFFQyxlQUFlLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHak0sSUFBSSxDQUFDZ00sS0FBSyxDQUFDaE0sSUFBSSxDQUFDeEwsTUFBTSxHQUFHeVgsZUFBZSxHQUFHLENBQUMsRUFBRWpNLElBQUksQ0FBQ3hMLE1BQU0sQ0FBQztFQUM5RztFQUVBLFNBQVMyWCxVQUFVQSxDQUFDdkMsQ0FBQyxFQUFFO0lBQ3JCWSxRQUFRLEdBQUdaLENBQUMsQ0FBQ3dDLE9BQU8sQ0FBQyxDQUFDO0lBQ3RCM1ksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDRixJQUFJLENBQUMsSUFBSSxHQUFHMlksWUFBWSxDQUFDMUIsUUFBUSxDQUFDLEdBQUcsR0FBRyxDQUFDO0lBQ3hEL1csQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDRSxJQUFJLENBQUMsT0FBTyxFQUFFNlcsUUFBUSxDQUFDO0lBQ3RDRixRQUFRLENBQUNFLFFBQVEsQ0FBQztJQUNsQlgsa0JBQWtCLENBQUNELENBQUMsQ0FBQztFQUN2QjtFQUVBLFNBQVNQLFdBQVdBLENBQUNPLENBQUMsRUFBRTtJQUN0Qk4sYUFBYSxHQUFHTSxDQUFDO0lBQ2pCLE9BQU9BLENBQUMsQ0FBQzVTLElBQUksQ0FBQyxVQUFTcVYsSUFBSSxFQUFFO01BQzNCLElBQUdBLElBQUksS0FBSyxJQUFJLEVBQUU7UUFDaEJGLFVBQVUsQ0FBQ0UsSUFBSSxDQUFDO1FBQ2hCLElBQUdBLElBQUksQ0FBQ2hCLE1BQU0sRUFBRTtVQUNkcFgsTUFBTSxDQUFDd0wsWUFBWSxDQUFDLDZKQUE2SixDQUFDO1FBQ3BMO1FBQ0EsT0FBTzRNLElBQUksQ0FBQ0MsV0FBVyxDQUFDLENBQUM7TUFDM0IsQ0FBQyxNQUNJO1FBQ0gsSUFBRzVOLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUVBLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSUEsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUU7VUFDM0YsT0FBT0EsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDO1FBQ3hDLENBQUMsTUFDSTtVQUNILE9BQU91QyxxQkFBcUI7UUFDOUI7TUFDRjtJQUNGLENBQUMsQ0FBQztFQUNKO0VBRUEsU0FBU3NMLEdBQUdBLENBQUMvTSxHQUFHLEVBQUVnTixNQUFNLEVBQUU7SUFDeEIsSUFBSWhOLEdBQUcsS0FBSyxFQUFFLEVBQUU7SUFDaEIsSUFBSWlOLGFBQWEsR0FBR2pXLFFBQVEsQ0FBQ2tXLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQztJQUMvRCxJQUFJQyxFQUFFLEdBQUduVyxRQUFRLENBQUNvUCxhQUFhLENBQUMsSUFBSSxDQUFDO0lBQ3JDK0csRUFBRSxDQUFDekcsV0FBVyxDQUFDMVAsUUFBUSxDQUFDb1csY0FBYyxDQUFDcE4sR0FBRyxDQUFDLENBQUM7SUFDNUNpTixhQUFhLENBQUNJLFlBQVksQ0FBQ0YsRUFBRSxFQUFFRixhQUFhLENBQUNLLFVBQVUsQ0FBQztJQUN4RCxJQUFJTixNQUFNLEVBQUU7TUFDVmxVLFVBQVUsQ0FBQyxZQUFXO1FBQ3BCbVUsYUFBYSxDQUFDTSxXQUFXLENBQUNKLEVBQUUsQ0FBQztNQUMvQixDQUFDLEVBQUUsSUFBSSxDQUFDO0lBQ1Y7RUFDRjtFQUVBLFNBQVMxTixZQUFZQSxDQUFDTyxHQUFHLEVBQUU7SUFDekIzRixPQUFPLENBQUNDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRTBGLEdBQUcsQ0FBQztJQUN0QytNLEdBQUcsQ0FBQy9NLEdBQUcsRUFBRSxJQUFJLENBQUM7RUFDaEI7RUFFQSxTQUFTd04sWUFBWUEsQ0FBQ0MsU0FBUyxFQUFFQyxRQUFRLEVBQUVDLFFBQVEsRUFBRTtJQUNuRCxJQUFJQyxTQUFTLEdBQUdILFNBQVMsSUFBSUUsUUFBUSxHQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQy9DQyxTQUFTLEdBQUcsQ0FBRUEsU0FBUyxHQUFHRixRQUFRLEdBQUlBLFFBQVEsSUFBSUEsUUFBUTtJQUMxRCxPQUFPRSxTQUFTO0VBQ2xCO0VBRUEsU0FBU0MscUJBQXFCQSxDQUFDMUMsTUFBTSxFQUFFO0lBQ3JDLElBQUksQ0FBQ0EsTUFBTSxDQUFDM0MsYUFBYSxFQUFFO01BQ3pCMkMsTUFBTSxDQUFDM0MsYUFBYSxHQUFHLEVBQUU7SUFDM0I7SUFDQSxJQUFJc0YsRUFBRSxHQUFHM0MsTUFBTSxDQUFDM0MsYUFBYTtJQUM3QixJQUFJdUYsT0FBTyxHQUFHL1csUUFBUSxDQUFDa1csY0FBYyxDQUFDLE1BQU0sQ0FBQztJQUM3QyxJQUFJLENBQUNZLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRTtNQUNWLElBQUlFLE9BQU8sR0FBR2hYLFFBQVEsQ0FBQ2tXLGNBQWMsQ0FBQyxTQUFTLENBQUM7TUFDaERZLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBR0UsT0FBTztNQUNmO01BQ0E7TUFDQTtJQUNGO0lBQ0EsSUFBSSxDQUFDRixFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUU7TUFDVixJQUFJRyxXQUFXLEdBQUdGLE9BQU8sQ0FBQ0csc0JBQXNCLENBQUMsVUFBVSxDQUFDO01BQzVELElBQUlDLFlBQVk7TUFDaEIsSUFBSUYsV0FBVyxDQUFDalosTUFBTSxLQUFLLENBQUMsRUFBRTtRQUM1Qm1aLFlBQVksR0FBR3RRLFNBQVM7TUFDMUIsQ0FBQyxNQUFNLElBQUlvUSxXQUFXLENBQUNqWixNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ25DbVosWUFBWSxHQUFHRixXQUFXLENBQUMsQ0FBQyxDQUFDO01BQy9CLENBQUMsTUFBTTtRQUNMLEtBQUssSUFBSXBVLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR29VLFdBQVcsQ0FBQ2paLE1BQU0sRUFBRTZFLENBQUMsRUFBRSxFQUFFO1VBQzNDLElBQUlvVSxXQUFXLENBQUNwVSxDQUFDLENBQUMsQ0FBQ3lNLFNBQVMsS0FBSyxFQUFFLEVBQUU7WUFDbkM2SCxZQUFZLEdBQUdGLFdBQVcsQ0FBQ3BVLENBQUMsQ0FBQztVQUMvQjtRQUNGO01BQ0Y7TUFDQWlVLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBR0ssWUFBWTtJQUN0QjtJQUNBLElBQUksQ0FBQ0wsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFO01BQ1YsSUFBSU0sT0FBTyxHQUFHTCxPQUFPLENBQUNHLHNCQUFzQixDQUFDLE1BQU0sQ0FBQztNQUNwRCxJQUFJRyxXQUFXLEdBQUdELE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQ0Ysc0JBQXNCLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDeEVBLHNCQUFzQixDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUN6Q0osRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHTyxXQUFXO0lBQ3JCO0lBQ0EsSUFBSSxDQUFDUCxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUU7TUFDVkEsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHOVcsUUFBUSxDQUFDa1csY0FBYyxDQUFDLGVBQWUsQ0FBQztJQUNsRDtFQUNGO0VBRUEsU0FBU29CLFVBQVVBLENBQUNYLFFBQVEsRUFBRTtJQUM1QjtJQUNBLElBQUl4QyxNQUFNLEdBQUcsSUFBSSxDQUFDQSxNQUFNO0lBQ3hCMEMscUJBQXFCLENBQUMxQyxNQUFNLENBQUM7SUFDN0IsSUFBSW9ELFNBQVMsR0FBR3BELE1BQU0sQ0FBQzNDLGFBQWE7SUFDcEMsSUFBSWtGLFFBQVEsR0FBR2EsU0FBUyxDQUFDdlosTUFBTTtJQUMvQixJQUFJd1osaUJBQWlCLEdBQUdELFNBQVMsQ0FBQ0UsSUFBSSxDQUFDLFVBQVNDLElBQUksRUFBRTtNQUNwRCxJQUFJLENBQUNBLElBQUksRUFBRTtRQUNULE9BQU8sS0FBSztNQUNkLENBQUMsTUFBTTtRQUNMLE9BQU9BLElBQUksQ0FBQ0MsUUFBUSxDQUFDM1gsUUFBUSxDQUFDeVMsYUFBYSxDQUFDO01BQzlDO0lBQ0YsQ0FBQyxDQUFDO0lBQ0YsSUFBSW1GLGlCQUFpQixHQUFHTCxTQUFTLENBQUN6WixPQUFPLENBQUMwWixpQkFBaUIsQ0FBQztJQUM1RCxJQUFJSyxjQUFjLEdBQUdELGlCQUFpQjtJQUN0QyxJQUFJRSxRQUFRO0lBQ1osR0FBRztNQUNERCxjQUFjLEdBQUdyQixZQUFZLENBQUNxQixjQUFjLEVBQUVuQixRQUFRLEVBQUVDLFFBQVEsQ0FBQztNQUNqRW1CLFFBQVEsR0FBR1AsU0FBUyxDQUFDTSxjQUFjLENBQUM7TUFDcEM7SUFDRixDQUFDLFFBQVEsQ0FBQ0MsUUFBUTtJQUVsQixJQUFJQyxTQUFTO0lBQ2IsSUFBSUQsUUFBUSxDQUFDRSxTQUFTLENBQUNMLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFBRTtNQUNoRDtNQUNBcEcsbUJBQW1CLENBQUMsQ0FBQztNQUNyQndHLFNBQVMsR0FBRy9YLFFBQVEsQ0FBQ2tXLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBQztJQUN6RCxDQUFDLE1BQU0sSUFBSTRCLFFBQVEsQ0FBQ0UsU0FBUyxDQUFDTCxRQUFRLENBQUMsVUFBVSxDQUFDLElBQ2hERyxRQUFRLENBQUNFLFNBQVMsQ0FBQ0wsUUFBUSxDQUFDLFlBQVksQ0FBQyxFQUFFO01BQzNDO01BQ0EsSUFBSU0sU0FBUyxHQUFHSCxRQUFRLENBQUNJLG9CQUFvQixDQUFDLFVBQVUsQ0FBQztNQUN6RDtNQUNBO01BQ0EsSUFBSUQsU0FBUyxDQUFDamEsTUFBTSxLQUFLLENBQUMsRUFBRTtRQUMxQjtRQUNBK1osU0FBUyxHQUFHRCxRQUFRO01BQ3RCLENBQUMsTUFBTSxJQUFJRyxTQUFTLENBQUNqYSxNQUFNLEtBQUssQ0FBQyxFQUFFO1FBQ2pDO1FBQ0ErWixTQUFTLEdBQUdFLFNBQVMsQ0FBQyxDQUFDLENBQUM7TUFDMUIsQ0FBQyxNQUFNO1FBQ0w7UUFDQTtBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtRQUNRRixTQUFTLEdBQUdFLFNBQVMsQ0FBQ0EsU0FBUyxDQUFDamEsTUFBTSxHQUFDLENBQUMsQ0FBQztRQUN6QytaLFNBQVMsQ0FBQ0ksZUFBZSxDQUFDLFVBQVUsQ0FBQztNQUN2QztJQUNGLENBQUMsTUFBTTtNQUNMO01BQ0FKLFNBQVMsR0FBR0QsUUFBUTtJQUN0QjtJQUVBOVgsUUFBUSxDQUFDeVMsYUFBYSxDQUFDQyxJQUFJLENBQUMsQ0FBQztJQUM3QnFGLFNBQVMsQ0FBQ3pZLEtBQUssQ0FBQyxDQUFDO0lBQ2pCeVksU0FBUyxDQUFDeFgsS0FBSyxDQUFDLENBQUM7SUFDakI7RUFDRjtFQUVBLElBQUk2WCxhQUFhLEdBQUd2RixXQUFXLENBQUNHLGNBQWMsQ0FBQztFQUUvQyxJQUFJRixhQUFhLEdBQUdFLGNBQWM7RUFFbEMsU0FBU0ssa0JBQWtCQSxDQUFDRCxDQUFDLEVBQUU7SUFDN0I7SUFDQSxJQUFHLENBQUNBLENBQUMsQ0FBQ3lCLE1BQU0sRUFBRTtNQUNaNVgsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUN5RCxLQUFLLENBQUMsQ0FBQztNQUM1QnpELENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQ2lDLElBQUksQ0FBQyxDQUFDO01BQ3RCakMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUNvRSxNQUFNLENBQUM4RixRQUFRLENBQUNrUixhQUFhLENBQUNqRixDQUFDLENBQUMsQ0FBQztNQUN0RDdCLG1CQUFtQixDQUFDLENBQUM7SUFDdkI7RUFDRjtFQUVBLFNBQVMrRyxjQUFjQSxDQUFBLEVBQUc7SUFDeEIsT0FBT3RFLFFBQVEsSUFBSSxVQUFVO0VBQy9CO0VBQ0EsU0FBU3hKLFFBQVFBLENBQUEsRUFBRztJQUNsQnNJLGFBQWEsQ0FBQ3RTLElBQUksQ0FBQyxVQUFTNFMsQ0FBQyxFQUFFO01BQzdCLElBQUdBLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQ0EsQ0FBQyxDQUFDeUIsTUFBTSxFQUFFO1FBQUV0SyxJQUFJLENBQUMsQ0FBQztNQUFFO0lBQ3hDLENBQUMsQ0FBQztFQUNKO0VBRUEsU0FBUzRJLGlCQUFpQkEsQ0FBQSxFQUFHO0lBQzNCbFcsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMyVyxXQUFXLENBQUMsVUFBVSxDQUFDO0VBQ2xEO0VBRUEsU0FBUzJFLGdCQUFnQkEsQ0FBQ3hYLEVBQUUsRUFBRTtJQUM1QixPQUFPOUQsQ0FBQyxDQUFDLEdBQUcsR0FBRzhELEVBQUUsQ0FBQyxDQUFDeVgsUUFBUSxDQUFDLFVBQVUsQ0FBQztFQUN6QztFQUVBLFNBQVNDLFFBQVFBLENBQUMvWSxDQUFDLEVBQUU7SUFDbkJqQyxNQUFNLENBQUNvVyxJQUFJLENBQUNwVyxNQUFNLENBQUNnUyxZQUFZLEdBQUcsU0FBUyxDQUFDO0VBQzlDO0VBRUEsU0FBU2lKLFNBQVNBLENBQUNoWixDQUFDLEVBQUU7SUFDcEIsSUFBRzZZLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxFQUFFO01BQUU7SUFBUTtJQUN2QyxPQUFPaE8sSUFBSSxDQUFDLENBQUM7RUFDZjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBSUUsU0FBU0EsSUFBSUEsQ0FBQ29PLFdBQVcsRUFBRTtJQUN6QixJQUFJQyxPQUFPLEVBQUVDLE1BQU07SUFDbkIsSUFBR0YsV0FBVyxLQUFLOVIsU0FBUyxFQUFFO01BQzVCK1IsT0FBTyxHQUFHRCxXQUFXO01BQ3JCRSxNQUFNLEdBQUcsSUFBSTtJQUNmLENBQUMsTUFDSSxJQUFHN0UsUUFBUSxLQUFLLEtBQUssRUFBRTtNQUMxQkEsUUFBUSxHQUFHLFVBQVU7TUFDckI2RSxNQUFNLEdBQUcsSUFBSTtJQUNmLENBQUMsTUFDSTtNQUNIRCxPQUFPLEdBQUc1RSxRQUFRLENBQUMsQ0FBQztNQUNwQjZFLE1BQU0sR0FBRyxLQUFLO0lBQ2hCO0lBQ0FwYixNQUFNLENBQUN3TCxZQUFZLENBQUMsV0FBVyxDQUFDO0lBQ2hDLElBQUk2UCxZQUFZLEdBQUdoRyxhQUFhLENBQUN0UyxJQUFJLENBQUMsVUFBUzRTLENBQUMsRUFBRTtNQUNoRCxJQUFHQSxDQUFDLEtBQUssSUFBSSxJQUFJQSxDQUFDLENBQUN5QixNQUFNLElBQUksQ0FBQ2dFLE1BQU0sRUFBRTtRQUNwQyxPQUFPekYsQ0FBQyxDQUFDLENBQUM7TUFDWjtNQUNBLElBQUd5RixNQUFNLEVBQUU7UUFDVC9GLGFBQWEsR0FBR1QsVUFBVSxDQUN2QjdSLElBQUksQ0FBQyxVQUFTcVIsR0FBRyxFQUFFO1VBQUUsT0FBT0EsR0FBRyxDQUFDa0gsVUFBVSxDQUFDSCxPQUFPLENBQUM7UUFBRSxDQUFDLENBQUMsQ0FDdkRwWSxJQUFJLENBQUMsVUFBUzRTLENBQUMsRUFBRTtVQUNoQjtVQUNBNEYsT0FBTyxDQUFDQyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxXQUFXLEdBQUc3RixDQUFDLENBQUM4RixXQUFXLENBQUMsQ0FBQyxDQUFDO1VBQzVEdkQsVUFBVSxDQUFDdkMsQ0FBQyxDQUFDLENBQUMsQ0FBQztVQUNmRCxpQkFBaUIsQ0FBQyxDQUFDO1VBQ25CLE9BQU9DLENBQUM7UUFDVixDQUFDLENBQUM7UUFDSixPQUFPTixhQUFhLENBQUN0UyxJQUFJLENBQUMsVUFBUzRTLENBQUMsRUFBRTtVQUNwQyxPQUFPN0ksSUFBSSxDQUFDLENBQUM7UUFDZixDQUFDLENBQUM7TUFDSixDQUFDLE1BQ0k7UUFDSCxPQUFPdUksYUFBYSxDQUFDdFMsSUFBSSxDQUFDLFVBQVM0UyxDQUFDLEVBQUU7VUFDcEMsSUFBR0EsQ0FBQyxLQUFLLElBQUksRUFBRTtZQUNiLE9BQU8sSUFBSTtVQUNiLENBQUMsTUFDSTtZQUNILE9BQU9BLENBQUMsQ0FBQzdJLElBQUksQ0FBQy9CLEdBQUcsQ0FBQzJMLE1BQU0sQ0FBQzFTLEVBQUUsQ0FBQ21JLFFBQVEsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDO1VBQ2hEO1FBQ0YsQ0FBQyxDQUFDLENBQUNwSixJQUFJLENBQUMsVUFBUzRTLENBQUMsRUFBRTtVQUNsQixJQUFHQSxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ2IzVixNQUFNLENBQUNzTCxZQUFZLENBQUMsbUJBQW1CLEdBQUdxSyxDQUFDLENBQUN3QyxPQUFPLENBQUMsQ0FBQyxDQUFDO1VBQ3hEO1VBQ0EsT0FBT3hDLENBQUM7UUFDVixDQUFDLENBQUM7TUFDSjtJQUNGLENBQUMsQ0FBQztJQUNGMEYsWUFBWSxDQUFDdkcsSUFBSSxDQUFDLFVBQVM3SixHQUFHLEVBQUU7TUFDOUJqTCxNQUFNLENBQUM2SyxVQUFVLENBQUMsZ0JBQWdCLEVBQUUsb1BBQW9QLENBQUM7TUFDelJqRixPQUFPLENBQUMwRSxLQUFLLENBQUNXLEdBQUcsQ0FBQztJQUNwQixDQUFDLENBQUM7SUFDRixPQUFPb1EsWUFBWTtFQUNyQjtFQUVBLFNBQVNLLE1BQU1BLENBQUEsRUFBRztJQUNoQixJQUFHWixnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtNQUFFO0lBQVE7SUFDekN6RixhQUFhLENBQUN0UyxJQUFJLENBQUMsVUFBUzRTLENBQUMsRUFBRTtNQUM3QixJQUFJNUosSUFBSSxHQUFHNEosQ0FBQyxLQUFLLElBQUksR0FBRyxVQUFVLEdBQUdBLENBQUMsQ0FBQ3dDLE9BQU8sQ0FBQyxDQUFDO01BQ2hELElBQUl3RCxZQUFZLEdBQUcsSUFBSTNSLFdBQVcsQ0FBQztRQUNqQ3BKLEtBQUssRUFBRSxhQUFhO1FBQ3BCTixLQUFLLEVBQUUsTUFBTTtRQUNiVSxVQUFVLEVBQUUsTUFBTTtRQUNsQkcsTUFBTSxFQUFFLElBQUk7UUFDWmhCLE9BQU8sRUFBRSxDQUNQO1VBQ0V1RCxPQUFPLEVBQUUsd0JBQXdCO1VBQ2pDbUIsWUFBWSxFQUFFa0g7UUFDaEIsQ0FBQztNQUVMLENBQUMsQ0FBQztNQUNGLE9BQU80UCxZQUFZLENBQUNsYSxJQUFJLENBQUMsQ0FBQyxDQUFDc0IsSUFBSSxDQUFDLFVBQVM2WSxPQUFPLEVBQUU7UUFDaEQsSUFBR0EsT0FBTyxLQUFLLElBQUksRUFBRTtVQUFFLE9BQU8sSUFBSTtRQUFFO1FBQ3BDNWIsTUFBTSxDQUFDd0wsWUFBWSxDQUFDLFdBQVcsQ0FBQztRQUNoQyxPQUFPc0IsSUFBSSxDQUFDOE8sT0FBTyxDQUFDO01BQ3RCLENBQUMsQ0FBQyxDQUNGOUcsSUFBSSxDQUFDLFVBQVM3SixHQUFHLEVBQUU7UUFDakJyRixPQUFPLENBQUMwRSxLQUFLLENBQUMsb0JBQW9CLEVBQUVXLEdBQUcsQ0FBQztRQUN4Q2pMLE1BQU0sQ0FBQ29MLFVBQVUsQ0FBQyx1QkFBdUIsQ0FBQztNQUM1QyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjtFQUVBLFNBQVN5USxNQUFNQSxDQUFBLEVBQUc7SUFDaEJ4RyxhQUFhLENBQUN0UyxJQUFJLENBQUMsVUFBUzRTLENBQUMsRUFBRTtNQUM3QixJQUFJbUcsWUFBWSxHQUFHLElBQUk5UixXQUFXLENBQUM7UUFDakNwSixLQUFLLEVBQUUsa0JBQWtCO1FBQ3pCTixLQUFLLEVBQUUsTUFBTTtRQUNiYSxNQUFNLEVBQUUsSUFBSTtRQUNaSCxVQUFVLEVBQUUsUUFBUTtRQUNwQmIsT0FBTyxFQUFFLENBQ1A7VUFDRXVELE9BQU8sRUFBRSw0QkFBNEI7VUFDckNtQixZQUFZLEVBQUU4USxDQUFDLENBQUN3QyxPQUFPLENBQUM7UUFDMUIsQ0FBQztNQUVMLENBQUMsQ0FBQztNQUNGO01BQ0EsT0FBTzJELFlBQVksQ0FBQ3JhLElBQUksQ0FBQyxDQUFDLENBQUNzQixJQUFJLENBQUMsVUFBUzZZLE9BQU8sRUFBRTtRQUNoRCxJQUFHQSxPQUFPLEtBQUssSUFBSSxFQUFFO1VBQ25CLE9BQU8sSUFBSTtRQUNiO1FBQ0E1YixNQUFNLENBQUN3TCxZQUFZLENBQUMsYUFBYSxDQUFDO1FBQ2xDNkosYUFBYSxHQUFHTSxDQUFDLENBQUNrRyxNQUFNLENBQUNELE9BQU8sQ0FBQztRQUNqQyxPQUFPdkcsYUFBYTtNQUN0QixDQUFDLENBQUMsQ0FDRHRTLElBQUksQ0FBQyxVQUFTNFMsQ0FBQyxFQUFFO1FBQ2hCLElBQUdBLENBQUMsS0FBSyxJQUFJLEVBQUU7VUFDYixPQUFPLElBQUk7UUFDYjtRQUNBdUMsVUFBVSxDQUFDdkMsQ0FBQyxDQUFDO1FBQ2IzVixNQUFNLENBQUNzTCxZQUFZLENBQUMsbUJBQW1CLEdBQUdxSyxDQUFDLENBQUN3QyxPQUFPLENBQUMsQ0FBQyxDQUFDO01BQ3hELENBQUMsQ0FBQyxDQUNEckQsSUFBSSxDQUFDLFVBQVM3SixHQUFHLEVBQUU7UUFDbEJyRixPQUFPLENBQUMwRSxLQUFLLENBQUMsb0JBQW9CLEVBQUVXLEdBQUcsQ0FBQztRQUN4Q2pMLE1BQU0sQ0FBQ29MLFVBQVUsQ0FBQyx1QkFBdUIsQ0FBQztNQUM1QyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FDRDBKLElBQUksQ0FBQyxVQUFTN0osR0FBRyxFQUFFO01BQ2xCckYsT0FBTyxDQUFDMEUsS0FBSyxDQUFDLG9CQUFvQixFQUFFVyxHQUFHLENBQUM7SUFDMUMsQ0FBQyxDQUFDO0VBQ0o7RUFFQXpMLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQ3FDLEtBQUssQ0FBQyxZQUFXO0lBQy9Ca0osR0FBRyxDQUFDZ0MsUUFBUSxDQUFDLENBQUM7RUFDaEIsQ0FBQyxDQUFDO0VBRUZ2TixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUNxQyxLQUFLLENBQUNtWixRQUFRLENBQUM7RUFDekJ4YixDQUFDLENBQUMsT0FBTyxDQUFDLENBQUNxQyxLQUFLLENBQUNvWixTQUFTLENBQUM7RUFDM0J6YixDQUFDLENBQUMsU0FBUyxDQUFDLENBQUNxQyxLQUFLLENBQUNnYSxNQUFNLENBQUM7RUFDMUJyYyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUNxQyxLQUFLLENBQUM2WixNQUFNLENBQUM7RUFFMUIsSUFBSUssYUFBYSxHQUFHdmMsQ0FBQyxDQUFDK0MsUUFBUSxDQUFDLENBQUN5WCxJQUFJLENBQUMsb0JBQW9CLENBQUM7RUFDMUQ7RUFDQSxJQUFJZ0MsVUFBVSxHQUFHeGMsQ0FBQyxDQUFDK0MsUUFBUSxDQUFDLENBQUN5WCxJQUFJLENBQUMsVUFBVSxDQUFDO0VBRTdDLFNBQVNsRyxtQkFBbUJBLENBQUEsRUFBRztJQUM3QjtJQUNBLElBQUltSSxnQkFBZ0IsR0FBR3pjLENBQUMsQ0FBQytDLFFBQVEsQ0FBQyxDQUFDeVgsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUNrQyxPQUFPLENBQUMsQ0FBQztJQUMxRUQsZ0JBQWdCLEdBQUdBLGdCQUFnQixDQUNmRSxNQUFNLENBQUMsVUFBQTlZLEdBQUc7TUFBQSxPQUFJLEVBQUVBLEdBQUcsQ0FBQy9DLEtBQUssQ0FBQ3NULE9BQU8sS0FBSyxNQUFNLElBQzVCdlEsR0FBRyxDQUFDK1ksWUFBWSxDQUFDLFVBQVUsQ0FBQyxLQUFLLFVBQVUsQ0FBQztJQUFBLEVBQUM7SUFDakYsSUFBSUMsbUJBQW1CLEdBQUdKLGdCQUFnQixDQUFDMWIsTUFBTTtJQUNqRCxLQUFLLElBQUk2RSxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdpWCxtQkFBbUIsRUFBRWpYLENBQUMsRUFBRSxFQUFFO01BQzVDLElBQUlrWCxrQkFBa0IsR0FBR0wsZ0JBQWdCLENBQUM3VyxDQUFDLENBQUM7TUFDNUMsSUFBSW1YLE1BQU0sR0FBRy9jLENBQUMsQ0FBQzhjLGtCQUFrQixDQUFDLENBQUNFLFFBQVEsQ0FBQyxDQUFDLENBQUNDLEtBQUssQ0FBQyxDQUFDO01BQ3JEO01BQ0FGLE1BQU0sQ0FBQ3ZDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FDdkJ0YSxJQUFJLENBQUMsY0FBYyxFQUFFMmMsbUJBQW1CLENBQUM5WSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQ3BEN0QsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDMEYsQ0FBQyxHQUFDLENBQUMsRUFBRTdCLFFBQVEsQ0FBQyxDQUFDLENBQUM7SUFDM0M7SUFDQSxPQUFPMFksZ0JBQWdCO0VBQ3pCO0VBRUEsU0FBU1Msa0JBQWtCQSxDQUFBLEVBQUc7SUFDNUIsSUFBSUMsYUFBYSxHQUFHcGEsUUFBUSxDQUFDa1csY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDbUUsWUFBWTtJQUNyRTtJQUNBLElBQUlELGFBQWEsR0FBRyxFQUFFLEVBQUVBLGFBQWEsR0FBRyxFQUFFO0lBQzFDQSxhQUFhLElBQUksSUFBSTtJQUNyQnBhLFFBQVEsQ0FBQ2tXLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQ25ZLEtBQUssQ0FBQ3VjLFVBQVUsR0FBR0YsYUFBYTtJQUNoRSxJQUFJRyxPQUFPLEdBQUd2YSxRQUFRLENBQUNrVyxjQUFjLENBQUMsTUFBTSxDQUFDO0lBQzdDLElBQUlzRSxXQUFXLEdBQUdELE9BQU8sQ0FBQ3JELHNCQUFzQixDQUFDLFVBQVUsQ0FBQztJQUM1RCxJQUFJc0QsV0FBVyxDQUFDeGMsTUFBTSxLQUFLLENBQUMsRUFBRTtNQUM1QndjLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQ3pjLEtBQUssQ0FBQ3VjLFVBQVUsR0FBR0YsYUFBYTtJQUNqRDtFQUNGO0VBRUFuZCxDQUFDLENBQUNRLE1BQU0sQ0FBQyxDQUFDTCxFQUFFLENBQUMsUUFBUSxFQUFFK2Msa0JBQWtCLENBQUM7RUFFMUMsU0FBU00sYUFBYUEsQ0FBQ0MsT0FBTyxFQUFFO0lBQzlCO0lBQ0EsSUFBSUMsR0FBRyxHQUFHRCxPQUFPLENBQUNmLE9BQU8sQ0FBQyxDQUFDO0lBQzNCO0lBQ0EsSUFBSWlCLEdBQUcsR0FBR0QsR0FBRyxDQUFDM2MsTUFBTTtJQUNwQixLQUFLLElBQUk2RSxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUcrWCxHQUFHLEVBQUUvWCxDQUFDLEVBQUUsRUFBRTtNQUM1QixJQUFJL0IsR0FBRyxHQUFHNlosR0FBRyxDQUFDOVgsQ0FBQyxDQUFDO01BQ2hCO01BQ0EvQixHQUFHLENBQUMrWixZQUFZLENBQUMsY0FBYyxFQUFFRCxHQUFHLENBQUM1WixRQUFRLENBQUMsQ0FBQyxDQUFDO01BQ2hERixHQUFHLENBQUMrWixZQUFZLENBQUMsZUFBZSxFQUFFLENBQUNoWSxDQUFDLEdBQUMsQ0FBQyxFQUFFN0IsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUNyRDtFQUNGO0VBR0FoQixRQUFRLENBQUM4YSxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsWUFBWTtJQUM3Q0MsbUJBQW1CLENBQUMsQ0FBQztFQUN2QixDQUFDLENBQUM7RUFFRnRCLFVBQVUsQ0FBQ25hLEtBQUssQ0FBQyxVQUFVSSxDQUFDLEVBQUU7SUFDNUJBLENBQUMsQ0FBQ3NiLGVBQWUsQ0FBQyxDQUFDO0VBQ3JCLENBQUMsQ0FBQztFQUVGdkIsVUFBVSxDQUFDclosT0FBTyxDQUFDLFVBQVVWLENBQUMsRUFBRTtJQUM5QjtJQUNBO0lBQ0EsSUFBSXViLEVBQUUsR0FBR3ZiLENBQUMsQ0FBQ3diLE9BQU87SUFDbEIsSUFBSUQsRUFBRSxLQUFLLEVBQUUsRUFBRTtNQUNiO01BQ0FGLG1CQUFtQixDQUFDLENBQUM7TUFDckI7TUFDQXZTLEdBQUcsQ0FBQzhPLFVBQVUsQ0FBQyxDQUFDO01BQ2hCNVgsQ0FBQyxDQUFDc2IsZUFBZSxDQUFDLENBQUM7SUFDckIsQ0FBQyxNQUFNLElBQUlDLEVBQUUsS0FBSyxDQUFDLElBQUlBLEVBQUUsS0FBSyxFQUFFLElBQUlBLEVBQUUsS0FBSyxFQUFFLElBQUlBLEVBQUUsS0FBSyxFQUFFLElBQUlBLEVBQUUsS0FBSyxFQUFFLEVBQUU7TUFDdkU7TUFDQSxJQUFJbmIsTUFBTSxHQUFHN0MsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDd2EsSUFBSSxDQUFDLGVBQWUsQ0FBQztNQUMxQ2xHLG1CQUFtQixDQUFDLENBQUM7TUFDckJ2UixRQUFRLENBQUN5UyxhQUFhLENBQUNDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUMvQjVTLE1BQU0sQ0FBQ29hLEtBQUssQ0FBQyxDQUFDLENBQUMzWixLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDeEI7TUFDQWIsQ0FBQyxDQUFDc2IsZUFBZSxDQUFDLENBQUM7SUFDckIsQ0FBQyxNQUFNO01BQ0xELG1CQUFtQixDQUFDLENBQUM7SUFDdkI7RUFDRixDQUFDLENBQUM7RUFFRixTQUFTSSxnQkFBZ0JBLENBQUN6YixDQUFDLEVBQUU7SUFDM0JxYixtQkFBbUIsQ0FBQyxDQUFDO0lBQ3JCLElBQUlLLE9BQU8sR0FBR25lLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDckI7SUFDQSxJQUFJb2UsU0FBUyxHQUFHRCxPQUFPLENBQUNFLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQztJQUNuRCxJQUFJRixPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUNHLFlBQVksQ0FBQyxhQUFhLENBQUMsRUFBRTtNQUMxQztJQUNGO0lBQ0EsSUFBSUgsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDdkIsWUFBWSxDQUFDLFVBQVUsQ0FBQyxLQUFLLFVBQVUsRUFBRTtNQUN0RDtJQUNGO0lBQ0E7SUFDQTtJQUNBLElBQUkyQixlQUFlLEdBQUdKLE9BQU8sQ0FBQ0UsT0FBTyxDQUFDLFlBQVksQ0FBQztJQUNuRDtJQUNBLElBQUlHLEVBQUUsR0FBR0QsZUFBZSxDQUFDLENBQUMsQ0FBQztJQUMzQixJQUFJRSxXQUFXLEdBQUlOLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQ3ZCLFlBQVksQ0FBQyxlQUFlLENBQUMsS0FBSyxNQUFPO0lBQ3ZFLElBQUksQ0FBQzZCLFdBQVcsRUFBRTtNQUNoQjtNQUNBWCxtQkFBbUIsQ0FBQyxDQUFDO01BQ3JCUyxlQUFlLENBQUN2QixRQUFRLENBQUMsWUFBWSxDQUFDLENBQUM5YyxJQUFJLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDK0IsSUFBSSxDQUFDLENBQUM7TUFDMUVzYyxlQUFlLENBQUN2QixRQUFRLENBQUMsQ0FBQyxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDekMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUN0YSxJQUFJLENBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQztJQUMxRixDQUFDLE1BQU07TUFDTDtNQUNBcWUsZUFBZSxDQUFDdkIsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDOWMsSUFBSSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQ2tDLElBQUksQ0FBQyxDQUFDO01BQ3pFbWMsZUFBZSxDQUFDdkIsUUFBUSxDQUFDLENBQUMsQ0FBQ0MsS0FBSyxDQUFDLENBQUMsQ0FBQ3pDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDdGEsSUFBSSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUM7SUFDM0Y7SUFDQXVDLENBQUMsQ0FBQ3NiLGVBQWUsQ0FBQyxDQUFDO0VBQ3JCO0VBRUEsSUFBSVcsY0FBYyxHQUFHMWUsQ0FBQyxDQUFDK0MsUUFBUSxDQUFDLENBQUN5WCxJQUFJLENBQUMseUJBQXlCLENBQUM7RUFDaEVrRSxjQUFjLENBQUNyYyxLQUFLLENBQUM2YixnQkFBZ0IsQ0FBQztFQUV0QyxTQUFTSixtQkFBbUJBLENBQUEsRUFBRztJQUM3QjtJQUNBLElBQUlNLFNBQVMsR0FBR3BlLENBQUMsQ0FBQytDLFFBQVEsQ0FBQyxDQUFDeVgsSUFBSSxDQUFDLDBCQUEwQixDQUFDO0lBQzVENEQsU0FBUyxDQUFDNUQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUN0YSxJQUFJLENBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQztJQUNoRWtlLFNBQVMsQ0FBQzVELElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQ3RhLElBQUksQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUNrQyxJQUFJLENBQUMsQ0FBQztFQUNqRTtFQUVBLElBQUl1YyxpQkFBaUIsR0FBRzNlLENBQUMsQ0FBQytDLFFBQVEsQ0FBQyxDQUFDeVgsSUFBSSxDQUFDLHNEQUFzRCxDQUFDO0VBQ2hHbUUsaUJBQWlCLENBQUN0YyxLQUFLLENBQUN5YixtQkFBbUIsQ0FBQztFQUU1QyxTQUFTYyxpQkFBaUJBLENBQUNDLGVBQWUsRUFBRUMsT0FBTyxFQUFFO0lBQ25EO0lBQ0E7SUFDQWhCLG1CQUFtQixDQUFDLENBQUM7SUFDckIsSUFBSWUsZUFBZSxJQUFJQSxlQUFlLENBQUM5ZCxNQUFNLEtBQUssQ0FBQyxFQUFFO01BQ25ELElBQUk4QyxHQUFHLEdBQUdnYixlQUFlLENBQUMsQ0FBQyxDQUFDO01BQzVCLElBQUlFLEtBQUssR0FBR2xiLEdBQUcsQ0FBQytZLFlBQVksQ0FBQyxJQUFJLENBQUM7TUFDbENpQyxlQUFlLENBQUM3QixRQUFRLENBQUMsWUFBWSxDQUFDLENBQUM5YyxJQUFJLENBQUMsYUFBYSxFQUFFLE9BQU8sQ0FBQyxDQUFDK0IsSUFBSSxDQUFDLENBQUM7TUFDMUU0YyxlQUFlLENBQUM3QixRQUFRLENBQUMsQ0FBQyxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDekMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUN0YSxJQUFJLENBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQztJQUMxRjtJQUNBLElBQUk0ZSxPQUFPLEVBQUU7TUFDWDtNQUNBQSxPQUFPLENBQUN4YixLQUFLLENBQUMsQ0FBQztJQUNqQjtFQUNGO0VBRUEsSUFBSTBiLGVBQWUsR0FBRyxLQUFLO0VBRTNCLFNBQVNDLFlBQVlBLENBQUEsRUFBRztJQUN0QkQsZUFBZSxHQUFHLElBQUk7SUFDdEJoZixDQUFDLENBQUMsWUFBWSxDQUFDLENBQUNrZixNQUFNLENBQUMsR0FBRyxDQUFDO0lBQzNCQyxVQUFVLENBQUMsQ0FBQztFQUNkO0VBRUE1QyxhQUFhLENBQUNwWixPQUFPLENBQUMsVUFBVVYsQ0FBQyxFQUFFO0lBQ2pDO0lBQ0EsSUFBSXViLEVBQUUsR0FBR3ZiLENBQUMsQ0FBQ3diLE9BQU87SUFDbEI7SUFDQSxJQUFJbUIsa0JBQWtCLEdBQUcsSUFBSTtJQUM3QixJQUFJaEIsU0FBUyxHQUFHcGUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDcWUsT0FBTyxDQUFDLGtCQUFrQixDQUFDO0lBQ25ELElBQUlnQixZQUFZLEdBQUdyZixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUNxZSxPQUFPLENBQUMsWUFBWSxDQUFDO0lBQ2hELElBQUlnQixZQUFZLENBQUN0ZSxNQUFNLEtBQUssQ0FBQyxFQUFFO01BQzdCcWUsa0JBQWtCLEdBQUcsS0FBSztJQUM1QjtJQUNBLElBQUlwQixFQUFFLEtBQUssRUFBRSxFQUFFO01BQ2I7TUFDQWhlLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQzZMLE9BQU8sQ0FBQyxHQUFHLENBQUM7SUFDOUI7SUFDQSxJQUFJbVMsRUFBRSxLQUFLLEVBQUUsSUFBSW9CLGtCQUFrQixFQUFFO01BQUU7TUFDckMsSUFBSVAsZUFBZSxHQUFHN2UsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDcWUsT0FBTyxDQUFDLFlBQVksQ0FBQztNQUNuRCxJQUFJaUIsUUFBUSxHQUFHVCxlQUFlLENBQUNyRSxJQUFJLENBQUMsNEJBQTRCLENBQUMsQ0FBQ21DLE1BQU0sQ0FBQyxVQUFVLENBQUM7TUFDcEZpQyxpQkFBaUIsQ0FBQ0MsZUFBZSxFQUFFUyxRQUFRLENBQUNyQyxLQUFLLENBQUMsQ0FBQyxDQUFDO01BQ3BEeGEsQ0FBQyxDQUFDc2IsZUFBZSxDQUFDLENBQUM7SUFDckIsQ0FBQyxNQUFNLElBQUlDLEVBQUUsS0FBSyxFQUFFLEVBQUU7TUFBRTtNQUN0QjtNQUNBLElBQUl1QixjQUFjLEdBQUd2ZixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUNxZSxPQUFPLENBQUMsWUFBWSxDQUFDO01BQ2xEO01BQ0FrQixjQUFjLENBQUN2QyxRQUFRLENBQUMsQ0FBQyxDQUFDQyxLQUFLLENBQUMsQ0FBQyxDQUFDekMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDdGEsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUM7TUFDM0UsSUFBSXVjLGdCQUFnQixHQUFHbkksbUJBQW1CLENBQUMsQ0FBQztNQUM1QztNQUNBLElBQUlrTCxLQUFLLEdBQUcvQyxnQkFBZ0IsQ0FBQzFiLE1BQU07TUFDbkMsSUFBSTBlLENBQUMsR0FBR2hELGdCQUFnQixDQUFDNWIsT0FBTyxDQUFDMGUsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ25EO01BQ0EsS0FBSyxJQUFJM1osQ0FBQyxHQUFHLENBQUM2WixDQUFDLEdBQUcsQ0FBQyxJQUFJRCxLQUFLLEVBQUU1WixDQUFDLEtBQUs2WixDQUFDLEVBQUU3WixDQUFDLEdBQUcsQ0FBQ0EsQ0FBQyxHQUFHLENBQUMsSUFBSTRaLEtBQUssRUFBRTtRQUMxRCxJQUFJWCxlQUFlLEdBQUc3ZSxDQUFDLENBQUN5YyxnQkFBZ0IsQ0FBQzdXLENBQUMsQ0FBQyxDQUFDO1FBQzVDO1FBQ0EsSUFBSTBaLFFBQVEsR0FBR1QsZUFBZSxDQUFDckUsSUFBSSxDQUFDLDRCQUE0QixDQUFDLENBQUNtQyxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQ3BGO1FBQ0EsSUFBSTJDLFFBQVEsQ0FBQ3ZlLE1BQU0sR0FBRyxDQUFDLEVBQUU7VUFDdkI7VUFDQTtVQUNBNmQsaUJBQWlCLENBQUNDLGVBQWUsRUFBRVMsUUFBUSxDQUFDckMsS0FBSyxDQUFDLENBQUMsQ0FBQztVQUNwRHhhLENBQUMsQ0FBQ3NiLGVBQWUsQ0FBQyxDQUFDO1VBQ25CO1FBQ0Y7TUFDRjtJQUNGLENBQUMsTUFBTSxJQUFJQyxFQUFFLEtBQUssRUFBRSxFQUFFO01BQUU7TUFDdEI7TUFDQSxJQUFJdUIsY0FBYyxHQUFHdmYsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDcWUsT0FBTyxDQUFDLFlBQVksQ0FBQztNQUNsRDtNQUNBa0IsY0FBYyxDQUFDdkMsUUFBUSxDQUFDLENBQUMsQ0FBQ0MsS0FBSyxDQUFDLENBQUMsQ0FBQ3pDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQ3RhLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDO01BQzNFLElBQUl1YyxnQkFBZ0IsR0FBR25JLG1CQUFtQixDQUFDLENBQUM7TUFDNUM7TUFDQSxJQUFJa0wsS0FBSyxHQUFHL0MsZ0JBQWdCLENBQUMxYixNQUFNO01BQ25DLElBQUkwZSxDQUFDLEdBQUdoRCxnQkFBZ0IsQ0FBQzViLE9BQU8sQ0FBQzBlLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNuRDtNQUNBLEtBQUssSUFBSTNaLENBQUMsR0FBRyxDQUFDNlosQ0FBQyxHQUFHRCxLQUFLLEdBQUcsQ0FBQyxJQUFJQSxLQUFLLEVBQUU1WixDQUFDLEtBQUs2WixDQUFDLEVBQUU3WixDQUFDLEdBQUcsQ0FBQ0EsQ0FBQyxHQUFHNFosS0FBSyxHQUFHLENBQUMsSUFBSUEsS0FBSyxFQUFFO1FBQzFFLElBQUlYLGVBQWUsR0FBRzdlLENBQUMsQ0FBQ3ljLGdCQUFnQixDQUFDN1csQ0FBQyxDQUFDLENBQUM7UUFDNUM7UUFDQTtRQUNBLElBQUkwWixRQUFRLEdBQUdULGVBQWUsQ0FBQ3JFLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDbUMsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUNwRjtRQUNBLElBQUkyQyxRQUFRLENBQUN2ZSxNQUFNLEdBQUcsQ0FBQyxFQUFFO1VBQ3ZCO1VBQ0E7VUFDQTZkLGlCQUFpQixDQUFDQyxlQUFlLEVBQUVTLFFBQVEsQ0FBQ3JDLEtBQUssQ0FBQyxDQUFDLENBQUM7VUFDcER4YSxDQUFDLENBQUNzYixlQUFlLENBQUMsQ0FBQztVQUNuQjtRQUNGO01BQ0Y7SUFDRixDQUFDLE1BQU0sSUFBSUMsRUFBRSxLQUFLLEVBQUUsRUFBRTtNQUFFO01BQ3RCO01BQ0EsSUFBSVAsT0FBTztNQUNYLElBQUkyQixrQkFBa0IsRUFBRTtRQUN0QixJQUFJTSxRQUFRLEdBQUcxZixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUNxZSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM3RCxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUNtQyxNQUFNLENBQUMsVUFBVSxDQUFDO1FBQzNFO1FBQ0EsSUFBSWdELElBQUksR0FBRzNmLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzRjLFlBQVksQ0FBQyxJQUFJLENBQUM7UUFDeEM7UUFDQWEsT0FBTyxHQUFHemQsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNmLElBQUk0ZixlQUFlLEdBQUcsS0FBSztRQUMzQixLQUFLLElBQUloYSxDQUFDLEdBQUc4WixRQUFRLENBQUMzZSxNQUFNLEdBQUcsQ0FBQyxFQUFFNkUsQ0FBQyxJQUFJLENBQUMsRUFBRUEsQ0FBQyxFQUFFLEVBQUU7VUFDN0MsSUFBSWdhLGVBQWUsRUFBRTtZQUNuQjtZQUNBbkMsT0FBTyxHQUFHQSxPQUFPLENBQUNvQyxHQUFHLENBQUM3ZixDQUFDLENBQUMwZixRQUFRLENBQUM5WixDQUFDLENBQUMsQ0FBQyxDQUFDO1VBQ3ZDLENBQUMsTUFBTSxJQUFJOFosUUFBUSxDQUFDOVosQ0FBQyxDQUFDLENBQUNnWCxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUsrQyxJQUFJLEVBQUU7WUFDbERDLGVBQWUsR0FBRyxJQUFJO1VBQ3hCO1FBQ0Y7UUFDQTtRQUNBLElBQUlFLE9BQU8sR0FBRzlmLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQ3FlLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzBCLE9BQU8sQ0FBQyxDQUFDLENBQUN2RixJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FDckVBLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQ21DLE1BQU0sQ0FBQyxVQUFVLENBQUM7UUFDeENjLE9BQU8sR0FBR0EsT0FBTyxDQUFDb0MsR0FBRyxDQUFDQyxPQUFPLENBQUM7UUFDOUIsSUFBSXJDLE9BQU8sQ0FBQzFjLE1BQU0sS0FBSyxDQUFDLEVBQUU7VUFDeEIwYyxPQUFPLEdBQUd6ZCxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUNxZSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUNBLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzdELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUN2RUEsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDbUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDeE4sSUFBSSxDQUFDLENBQUM7UUFDL0M7UUFDQSxJQUFJc08sT0FBTyxDQUFDMWMsTUFBTSxHQUFHLENBQUMsRUFBRTtVQUN0QjBjLE9BQU8sQ0FBQ3RPLElBQUksQ0FBQyxDQUFDLENBQUM3TCxLQUFLLENBQUMsQ0FBQztRQUN4QixDQUFDLE1BQU07VUFDTDtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtRQVRVO01BV0o7TUFDQWIsQ0FBQyxDQUFDc2IsZUFBZSxDQUFDLENBQUM7SUFDckIsQ0FBQyxNQUFNLElBQUlDLEVBQUUsS0FBSyxFQUFFLEVBQUU7TUFBRTtNQUN0QjtNQUNBLElBQUlnQyxXQUFXO01BQ2YsSUFBSXZDLE9BQU87TUFDWCxJQUFJLENBQUMyQixrQkFBa0IsRUFBRTtRQUN2QjtRQUNBWSxXQUFXLEdBQUdoZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDcWUsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDckIsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDeEMsSUFBSSxDQUFDLG9CQUFvQixDQUFDO1FBQzdFaUQsT0FBTyxHQUFHdUMsV0FBVyxDQUFDeEYsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDbUMsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUMzRGEsYUFBYSxDQUFDQyxPQUFPLENBQUM7TUFDeEIsQ0FBQyxNQUFNO1FBQ0w7UUFDQSxJQUFJaUMsUUFBUSxHQUFHMWYsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDcWUsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDN0QsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDbUMsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUMzRTtRQUNBLElBQUlnRCxJQUFJLEdBQUczZixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM0YyxZQUFZLENBQUMsSUFBSSxDQUFDO1FBQ3hDO1FBQ0FhLE9BQU8sR0FBR3pkLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDZixJQUFJNGYsZUFBZSxHQUFHLEtBQUs7UUFDM0IsS0FBSyxJQUFJaGEsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHOFosUUFBUSxDQUFDM2UsTUFBTSxFQUFFNkUsQ0FBQyxFQUFFLEVBQUU7VUFDeEMsSUFBSWdhLGVBQWUsRUFBRTtZQUNuQjtZQUNBbkMsT0FBTyxHQUFHQSxPQUFPLENBQUNvQyxHQUFHLENBQUM3ZixDQUFDLENBQUMwZixRQUFRLENBQUM5WixDQUFDLENBQUMsQ0FBQyxDQUFDO1VBQ3ZDLENBQUMsTUFBTSxJQUFJOFosUUFBUSxDQUFDOVosQ0FBQyxDQUFDLENBQUNnWCxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUsrQyxJQUFJLEVBQUU7WUFDbERDLGVBQWUsR0FBRyxJQUFJO1VBQ3hCO1FBQ0Y7UUFDQTtRQUNBLElBQUlFLE9BQU8sR0FBRzlmLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQ3FlLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzRCLE9BQU8sQ0FBQyxDQUFDLENBQUN6RixJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FDckVBLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQ21DLE1BQU0sQ0FBQyxVQUFVLENBQUM7UUFDeENjLE9BQU8sR0FBR0EsT0FBTyxDQUFDb0MsR0FBRyxDQUFDQyxPQUFPLENBQUM7UUFDOUIsSUFBSXJDLE9BQU8sQ0FBQzFjLE1BQU0sS0FBSyxDQUFDLEVBQUU7VUFDeEIwYyxPQUFPLEdBQUd6ZCxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUNxZSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUNBLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzdELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUNyRUEsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDbUMsTUFBTSxDQUFDLFVBQVUsQ0FBQztRQUMxQztNQUNGO01BQ0E7TUFDQSxJQUFJYyxPQUFPLENBQUMxYyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ3RCMGMsT0FBTyxDQUFDUixLQUFLLENBQUMsQ0FBQyxDQUFDM1osS0FBSyxDQUFDLENBQUM7TUFDekIsQ0FBQyxNQUFNO1FBQ0w7TUFBQTtNQUVGYixDQUFDLENBQUNzYixlQUFlLENBQUMsQ0FBQztJQUNyQixDQUFDLE1BQU0sSUFBSUMsRUFBRSxLQUFLLEVBQUUsRUFBRTtNQUNwQjtNQUNBRixtQkFBbUIsQ0FBQyxDQUFDO01BQ3JCLElBQUlrQixlQUFlLEVBQUU7UUFDbkJBLGVBQWUsR0FBRyxLQUFLO01BQ3pCLENBQUMsTUFBTTtRQUNMO1FBQ0F6VCxHQUFHLENBQUM4TyxVQUFVLENBQUMsQ0FBQztNQUNsQjtNQUNBNVgsQ0FBQyxDQUFDc2IsZUFBZSxDQUFDLENBQUM7TUFDbkJ0YixDQUFDLENBQUN5ZCxjQUFjLENBQUMsQ0FBQztNQUNsQjtJQUNGLENBQUMsTUFBTSxJQUFJbEMsRUFBRSxLQUFLLENBQUMsRUFBRztNQUNwQixJQUFJdmIsQ0FBQyxDQUFDMGQsUUFBUSxFQUFFO1FBQ2RyQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3JCdlMsR0FBRyxDQUFDOE8sVUFBVSxDQUFDLElBQUksQ0FBQztNQUN0QjtNQUNBNVgsQ0FBQyxDQUFDc2IsZUFBZSxDQUFDLENBQUM7TUFDbkJ0YixDQUFDLENBQUN5ZCxjQUFjLENBQUMsQ0FBQztJQUNwQixDQUFDLE1BQU0sSUFBSWxDLEVBQUUsS0FBSyxFQUFFLElBQUlBLEVBQUUsS0FBSyxFQUFFLElBQUlBLEVBQUUsS0FBSyxFQUFFLElBQUlBLEVBQUUsS0FBSyxFQUFFLEVBQUU7TUFDM0Q7TUFDQTtNQUNBdmIsQ0FBQyxDQUFDc2IsZUFBZSxDQUFDLENBQUM7SUFDckIsQ0FBQyxNQUFNLElBQUlDLEVBQUUsSUFBSSxHQUFHLElBQUlBLEVBQUUsSUFBSSxHQUFHLEVBQUU7TUFDakM7TUFDQTtNQUNBO0lBQUEsQ0FDRCxNQUFNLElBQUl2YixDQUFDLENBQUMyZCxPQUFPLElBQUlwQyxFQUFFLEtBQUssR0FBRyxFQUFFO01BQ2xDO01BQ0FpQixZQUFZLENBQUMsQ0FBQztNQUNkeGMsQ0FBQyxDQUFDc2IsZUFBZSxDQUFDLENBQUM7SUFDckIsQ0FBQyxNQUFNO01BQ0w7TUFDQXRiLENBQUMsQ0FBQ3NiLGVBQWUsQ0FBQyxDQUFDO0lBQ3JCO0lBQ0E7RUFDRixDQUFDLENBQUM7O0VBRUY7RUFDQTs7RUFHQSxJQUFJc0MsYUFBYSxHQUFHcmdCLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQ0MsUUFBUSxDQUFDLFVBQVUsQ0FBQztFQUNuRG9nQixhQUFhLENBQUNuZ0IsSUFBSSxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FDbENBLElBQUksQ0FBQyxZQUFZLEVBQUUsYUFBYSxDQUFDO0VBQ2pDO0VBQ0ZGLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQzJMLE9BQU8sQ0FBQzBVLGFBQWEsQ0FBQztFQUdqQyxJQUFHcFYsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLGlCQUFpQixDQUFDLEVBQUU7SUFDbkNqTCxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUNFLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUNBLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDO0VBQ2pFO0VBRUEsSUFBTW9nQixZQUFZLEdBQUdyVixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsWUFBWSxDQUFDO0VBQ2hELElBQU1zVixhQUFhLEdBQUksWUFBWSxJQUFJdFYsTUFBTSxDQUFDLEtBQUssQ0FBRTtFQUNyRCxJQUFNdVYsV0FBVyxHQUFHRCxhQUFhLElBQUt0VixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsWUFBWSxDQUFDLEtBQUssT0FBUTtFQUU5RSxJQUFHLENBQUNxVixZQUFZLElBQUksQ0FBQ0UsV0FBVyxFQUFFO0lBQ2hDeGdCLENBQUMsQ0FBQ1EsTUFBTSxDQUFDLENBQUMrQixJQUFJLENBQUMsY0FBYyxFQUFFLFlBQVc7TUFDeEMsT0FBTyw2SkFBNko7SUFDdEssQ0FBQyxDQUFDO0VBQ0o7RUFFQWdKLEdBQUcsQ0FBQzJMLE1BQU0sR0FBRzNMLEdBQUcsQ0FBQzZDLFVBQVUsQ0FBQ2lTLGFBQWEsRUFBRTtJQUN6Q0ksU0FBUyxFQUFFemdCLENBQUMsQ0FBQyxZQUFZLENBQUM7SUFDMUIrTyxZQUFZLEVBQUUsS0FBSztJQUNuQkgsR0FBRyxFQUFFckQsR0FBRyxDQUFDaUosUUFBUTtJQUNqQmtNLFVBQVUsRUFBRSxHQUFHO0lBQ2Z0UCxhQUFhLEVBQUU7RUFDakIsQ0FBQyxDQUFDO0VBQ0Y3RixHQUFHLENBQUMyTCxNQUFNLENBQUMxUyxFQUFFLENBQUNtYyxTQUFTLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQztFQUMvQ3BWLEdBQUcsQ0FBQzJMLE1BQU0sQ0FBQzFTLEVBQUUsQ0FBQ21jLFNBQVMsQ0FBQyxXQUFXLEVBQUUsSUFBSS9aLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDL0MsU0FBU2dhLG1CQUFtQkEsQ0FBQ0MsVUFBVSxFQUFFO0lBQ3ZDLElBQUlyUixNQUFNLEdBQUdqRSxHQUFHLENBQUMyTCxNQUFNLENBQUMxUyxFQUFFLENBQUNzYyxTQUFTLENBQUMsUUFBUSxDQUFDO0lBQzlDLElBQUlyUixZQUFZLEdBQUdsRSxHQUFHLENBQUMyTCxNQUFNLENBQUMxUyxFQUFFLENBQUNzYyxTQUFTLENBQUMsY0FBYyxDQUFDO0lBQzFELElBQUlDLFNBQVMsR0FBR3hWLEdBQUcsQ0FBQzJMLE1BQU0sQ0FBQzFTLEVBQUUsQ0FBQ3NjLFNBQVMsQ0FBQyxXQUFXLENBQUM7SUFDcEQsSUFBSUQsVUFBVSxDQUFDL2dCLElBQUksQ0FBQ2lCLE1BQU0sSUFBSTBPLFlBQVksRUFBRTtNQUMxQ29SLFVBQVUsQ0FBQ0csY0FBYyxDQUFDcFUsT0FBTyxDQUFDLFVBQUNDLENBQUMsRUFBRTNILEdBQUc7UUFBQSxPQUFLMmIsVUFBVSxDQUFDN2QsR0FBRyxDQUFDa0MsR0FBRyxFQUFFMkgsQ0FBQyxDQUFDO01BQUEsRUFBQztNQUNyRWtVLFNBQVMsVUFBTyxDQUFDRixVQUFVLENBQUM7TUFDNUI7TUFDQUksYUFBYSxDQUFDLENBQUM7SUFDakI7RUFDRjtFQUNBLFNBQVNDLFVBQVVBLENBQUNMLFVBQVUsRUFBRTtJQUM5QixJQUFJRSxTQUFTLEdBQUd4VixHQUFHLENBQUMyTCxNQUFNLENBQUMxUyxFQUFFLENBQUNzYyxTQUFTLENBQUMsV0FBVyxDQUFDO0lBQ3BERCxVQUFVLENBQUNHLGNBQWMsQ0FBQ3BVLE9BQU8sQ0FBQyxVQUFDQyxDQUFDLEVBQUUzSCxHQUFHO01BQUEsT0FBSzJiLFVBQVUsQ0FBQzdkLEdBQUcsQ0FBQ2tDLEdBQUcsRUFBRTJILENBQUMsQ0FBQztJQUFBLEVBQUM7SUFDckVrVSxTQUFTLFVBQU8sQ0FBQ0YsVUFBVSxDQUFDO0lBQzVCO0lBQ0FJLGFBQWEsQ0FBQyxDQUFDO0VBQ2pCO0VBQ0EsU0FBU0EsYUFBYUEsQ0FBQSxFQUFHO0lBQ3ZCLElBQUl6UixNQUFNLEdBQUdqRSxHQUFHLENBQUMyTCxNQUFNLENBQUMxUyxFQUFFLENBQUNzYyxTQUFTLENBQUMsUUFBUSxDQUFDO0lBQzlDLElBQUlDLFNBQVMsR0FBR3hWLEdBQUcsQ0FBQzJMLE1BQU0sQ0FBQzFTLEVBQUUsQ0FBQ3NjLFNBQVMsQ0FBQyxXQUFXLENBQUM7SUFDcEQsSUFBSUssU0FBUztJQUNiLElBQUlKLFNBQVMsQ0FBQ0ssSUFBSSxLQUFLLENBQUMsRUFBRTtNQUN4QkQsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ2pCLENBQUMsTUFBTTtNQUNMQSxTQUFTLEdBQUdFLE1BQU0sQ0FBQ0MsU0FBUztNQUM1QlAsU0FBUyxDQUFDblUsT0FBTyxDQUFDLFVBQVMyVSxNQUFNLEVBQUVWLFVBQVUsRUFBRTtRQUM3QyxJQUFJQSxVQUFVLENBQUMvZ0IsSUFBSSxDQUFDaUIsTUFBTSxHQUFHb2dCLFNBQVMsRUFBRTtVQUFFQSxTQUFTLEdBQUdOLFVBQVUsQ0FBQy9nQixJQUFJLENBQUNpQixNQUFNO1FBQUU7TUFDaEYsQ0FBQyxDQUFDO0lBQ0o7SUFDQSxLQUFLLElBQUk2RSxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUc0SixNQUFNLENBQUN6TyxNQUFNLEVBQUU2RSxDQUFDLEVBQUUsRUFBRTtNQUN0QyxJQUFJNEosTUFBTSxDQUFDNUosQ0FBQyxDQUFDLENBQUMrSixNQUFNLElBQUl3UixTQUFTLEVBQUU7UUFDakMzUixNQUFNLENBQUM1SixDQUFDLENBQUMsQ0FBQ2lLLFNBQVMsR0FBRyxRQUFRO01BQ2hDLENBQUMsTUFBTTtRQUNMTCxNQUFNLENBQUM1SixDQUFDLENBQUMsQ0FBQ2lLLFNBQVMsR0FBR2pHLFNBQVM7TUFDakM7SUFDRjtJQUNBO0lBQ0EyQixHQUFHLENBQUMyTCxNQUFNLENBQUMxUyxFQUFFLENBQUNtYyxTQUFTLENBQUMsUUFBUSxFQUFFL1csU0FBUyxDQUFDO0lBQzVDMkIsR0FBRyxDQUFDMkwsTUFBTSxDQUFDMVMsRUFBRSxDQUFDbWMsU0FBUyxDQUFDLFFBQVEsRUFBRW5SLE1BQU0sQ0FBQztFQUMzQztFQUNBakUsR0FBRyxDQUFDMkwsTUFBTSxDQUFDMVMsRUFBRSxDQUFDckUsRUFBRSxDQUFDLFNBQVMsRUFBRSxVQUFTcWhCLFFBQVEsRUFBRTVOLFVBQVUsRUFBRTtJQUN6RCxJQUFJNk4sT0FBTyxHQUFHRCxRQUFRLENBQUNFLFFBQVEsQ0FBQyxDQUFDO01BQUVDLE9BQU8sR0FBRyxDQUFDO0lBQzlDLElBQUlsUyxZQUFZLEdBQUcrUixRQUFRLENBQUNWLFNBQVMsQ0FBQyxjQUFjLENBQUM7SUFDckQsSUFBSUMsU0FBUyxHQUFHUyxRQUFRLENBQUNWLFNBQVMsQ0FBQyxXQUFXLENBQUM7SUFDL0NsTixVQUFVLENBQUNoSCxPQUFPLENBQUMsVUFBUzJHLE1BQU0sRUFBRTtNQUNsQyxJQUFJa08sT0FBTyxHQUFHbE8sTUFBTSxDQUFDRyxJQUFJLENBQUMxQixJQUFJLEVBQUU7UUFBRXlQLE9BQU8sR0FBR2xPLE1BQU0sQ0FBQ0csSUFBSSxDQUFDMUIsSUFBSTtNQUFFO01BQzlELElBQUkyUCxPQUFPLEdBQUdwTyxNQUFNLENBQUNHLElBQUksQ0FBQzFCLElBQUksR0FBR3VCLE1BQU0sQ0FBQ3pULElBQUksQ0FBQ2lCLE1BQU0sRUFBRTtRQUFFNGdCLE9BQU8sR0FBR3BPLE1BQU0sQ0FBQ0csSUFBSSxDQUFDMUIsSUFBSSxHQUFHdUIsTUFBTSxDQUFDelQsSUFBSSxDQUFDaUIsTUFBTTtNQUFFO0lBQzFHLENBQUMsQ0FBQztJQUNGLElBQUk2Z0IsT0FBTyxHQUFHLEtBQUs7SUFDbkJKLFFBQVEsQ0FBQ0ssUUFBUSxDQUFDSixPQUFPLEVBQUVFLE9BQU8sRUFBRSxVQUFTZCxVQUFVLEVBQUU7TUFDdkQsSUFBSUEsVUFBVSxDQUFDL2dCLElBQUksQ0FBQ2lCLE1BQU0sR0FBRzBPLFlBQVksRUFBRTtRQUN6QyxJQUFJLENBQUNzUixTQUFTLENBQUNyWCxHQUFHLENBQUNtWCxVQUFVLENBQUMsRUFBRTtVQUM5QmUsT0FBTyxHQUFHLElBQUk7VUFDZGIsU0FBUyxDQUFDaFgsR0FBRyxDQUFDOFcsVUFBVSxFQUFFQSxVQUFVLENBQUNVLE1BQU0sQ0FBQyxDQUFDLENBQUM7VUFDOUNWLFVBQVUsQ0FBQ0csY0FBYyxHQUFHLElBQUlwYSxHQUFHLENBQUMsQ0FDbEMsQ0FBQyxRQUFRLEVBQUVnYSxtQkFBbUIsQ0FBQyxFQUMvQixDQUFDLFFBQVEsRUFBRSxZQUFXO1lBQUU7WUFDdEJNLFVBQVUsQ0FBQ0wsVUFBVSxDQUFDO1VBQ3hCLENBQUMsQ0FBQyxDQUNILENBQUM7VUFDRkEsVUFBVSxDQUFDRyxjQUFjLENBQUNwVSxPQUFPLENBQUMsVUFBQ0MsQ0FBQyxFQUFFM0gsR0FBRztZQUFBLE9BQUsyYixVQUFVLENBQUMxZ0IsRUFBRSxDQUFDK0UsR0FBRyxFQUFFMkgsQ0FBQyxDQUFDO1VBQUEsRUFBQztVQUNwRTtRQUNGO01BQ0YsQ0FBQyxNQUFNO1FBQ0wsSUFBSWtVLFNBQVMsQ0FBQ3JYLEdBQUcsQ0FBQ21YLFVBQVUsQ0FBQyxFQUFFO1VBQzdCZSxPQUFPLEdBQUcsSUFBSTtVQUNkYixTQUFTLFVBQU8sQ0FBQ0YsVUFBVSxDQUFDO1VBQzVCO1FBQ0Y7TUFDRjtJQUNGLENBQUMsQ0FBQztJQUNGLElBQUllLE9BQU8sRUFBRTtNQUNYWCxhQUFhLENBQUMsQ0FBQztJQUNqQjtFQUNGLENBQUMsQ0FBQztFQUVGOUYsYUFBYSxDQUFDNVgsSUFBSSxDQUFDLFVBQVNrUSxDQUFDLEVBQUU7SUFDN0JsSSxHQUFHLENBQUNlLFNBQVMsQ0FBQ3ZDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRXdCLEdBQUcsQ0FBQzJMLE1BQU0sQ0FBQzFTLEVBQUUsQ0FBQ3NkLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDM0QsSUFBR3JPLENBQUMsS0FBSyxFQUFFLEVBQUU7TUFDWEEsQ0FBQyxHQUFHakcscUJBQXFCO0lBQzNCO0lBRUEsSUFBSWlHLENBQUMsQ0FBQzdMLFVBQVUsQ0FBQyxjQUFjLENBQUMsRUFBRTtNQUNoQztNQUNBcEgsTUFBTSxDQUFDOEksUUFBUSxDQUFDQyxJQUFJLEdBQUcvSSxNQUFNLENBQUM4SSxRQUFRLENBQUNDLElBQUksQ0FBQ3dZLE9BQU8sQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDO0lBQ3pFO0lBRUEsSUFBRyxDQUFDOVcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLFlBQVksQ0FBQyxFQUFFO01BQy9CO01BQ0E7TUFDQU0sR0FBRyxDQUFDMkwsTUFBTSxDQUFDMVMsRUFBRSxDQUFDd2QsUUFBUSxDQUFDdk8sQ0FBQyxDQUFDO01BQ3pCbEksR0FBRyxDQUFDMkwsTUFBTSxDQUFDMVMsRUFBRSxDQUFDeWQsWUFBWSxDQUFDLENBQUM7SUFDOUIsQ0FBQyxNQUNJO01BQ0gsSUFBTUMsa0JBQWtCLEdBQUcsQ0FDekIsVUFBVSxFQUNWLFNBQVMsQ0FDVjtNQUNELElBQU1DLG9CQUFvQixHQUFHLENBQzNCLGtCQUFrQixDQUNuQjtNQUNERCxrQkFBa0IsQ0FBQ3RWLE9BQU8sQ0FBQyxVQUFBd1YsQ0FBQztRQUFBLE9BQUlwaUIsQ0FBQyxDQUFDb2lCLENBQUMsQ0FBQyxDQUFDaGdCLElBQUksQ0FBQyxDQUFDO01BQUEsRUFBQztNQUM1QytmLG9CQUFvQixDQUFDdlYsT0FBTyxDQUFDLFVBQUF3VixDQUFDO1FBQUEsT0FBSXBpQixDQUFDLENBQUNvaUIsQ0FBQyxDQUFDLENBQUNDLE1BQU0sQ0FBQyxDQUFDO01BQUEsRUFBQztJQUNsRDtFQUVGLENBQUMsQ0FBQztFQUVGbEgsYUFBYSxDQUFDN0YsSUFBSSxDQUFDLFVBQVN4SyxLQUFLLEVBQUU7SUFDakMxRSxPQUFPLENBQUMwRSxLQUFLLENBQUMsaUNBQWlDLEVBQUVBLEtBQUssQ0FBQztJQUN2RFMsR0FBRyxDQUFDZSxTQUFTLENBQUN2QyxHQUFHLENBQUMsZ0JBQWdCLEVBQUV3QixHQUFHLENBQUMyTCxNQUFNLENBQUMxUyxFQUFFLENBQUNzZCxNQUFNLENBQUMsQ0FBQyxDQUFDO0VBQzdELENBQUMsQ0FBQztFQUVGMWIsT0FBTyxDQUFDQyxHQUFHLENBQUMsdUJBQXVCLEVBQUVKLGdCQUFnQixFQUFFQyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFFbEUsSUFBSW1jLFNBQVMsR0FBR3ZmLFFBQVEsQ0FBQ29QLGFBQWEsQ0FBQyxRQUFRLENBQUM7RUFDaEQvTCxPQUFPLENBQUNDLEdBQUcsQ0FBQzdGLE1BQU0sQ0FBQytoQixLQUFLLENBQUM7RUFDekJELFNBQVMsQ0FBQy9QLEdBQUcsR0FBRy9SLE1BQU0sQ0FBQytoQixLQUFLO0VBQzVCRCxTQUFTLENBQUNoTCxJQUFJLEdBQUcsaUJBQWlCO0VBQ2xDZ0wsU0FBUyxDQUFDMUUsWUFBWSxDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUM7RUFDbEQ3YSxRQUFRLENBQUN5ZixJQUFJLENBQUMvUCxXQUFXLENBQUM2UCxTQUFTLENBQUM7RUFFcEMsSUFBSUcsVUFBVSxHQUFHMWYsUUFBUSxDQUFDb1AsYUFBYSxDQUFDLFFBQVEsQ0FBQztFQUVqRCxTQUFTdVEsd0JBQXdCQSxDQUFDdmIsR0FBRyxFQUFFMUUsQ0FBQyxFQUFFO0lBRXhDO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTs7SUFFQTtJQUNBO0lBQ0E7SUFDQWdLLE1BQU0sQ0FBQ3BHLEdBQUcsQ0FBQyxvQkFBb0IsRUFDN0I7TUFDRXNjLEtBQUssRUFBRyxpQkFBaUI7TUFDekJ4YixHQUFHLEVBQUdBLEdBQUc7TUFFVDtNQUNBO01BQ0E7O01BRUF5YixTQUFTLEVBQUduZ0IsQ0FBQyxDQUFDbWdCO0lBQ2hCLENBQUMsQ0FBQztJQUVKLElBQUlDLFdBQVcsR0FBRzdpQixDQUFDLENBQUM4aUIsSUFBSSxDQUFDM2IsR0FBRyxDQUFDO0lBQzdCMGIsV0FBVyxDQUFDdGYsSUFBSSxDQUFDLFVBQVN3ZixHQUFHLEVBQUU7TUFDN0I7TUFDQTtNQUNBdFcsTUFBTSxDQUFDcEcsR0FBRyxDQUFDLG9CQUFvQixFQUFFO1FBQy9Cc2MsS0FBSyxFQUFHLG1CQUFtQjtRQUMzQkssY0FBYyxFQUFHRCxHQUFHLENBQUN4SyxLQUFLLENBQUMsQ0FBQyxFQUFFLEdBQUc7TUFDbkMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0lBQ0ZzSyxXQUFXLENBQUN2TixJQUFJLENBQUMsVUFBU3lOLEdBQUcsRUFBRTtNQUM3QnRXLE1BQU0sQ0FBQ3BHLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRTtRQUMvQnNjLEtBQUssRUFBRyxtQkFBbUI7UUFDM0JNLE1BQU0sRUFBRUYsR0FBRyxDQUFDRSxNQUFNO1FBQ2xCQyxVQUFVLEVBQUVILEdBQUcsQ0FBQ0csVUFBVTtRQUMxQjtRQUNBO1FBQ0E7UUFDQUMsWUFBWSxFQUFFSixHQUFHLENBQUNJLFlBQVksQ0FBQzVLLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRztNQUM3QyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjtFQUVBdlksQ0FBQyxDQUFDc2lCLFNBQVMsQ0FBQyxDQUFDbmlCLEVBQUUsQ0FBQyxPQUFPLEVBQUUsVUFBU3NDLENBQUMsRUFBRTtJQUNuQ2lnQix3QkFBd0IsQ0FBQ2xpQixNQUFNLENBQUMraEIsS0FBSyxFQUFFOWYsQ0FBQyxDQUFDO0lBQ3pDZ2dCLFVBQVUsQ0FBQ2xRLEdBQUcsR0FBR25JLFNBQXdCO0lBQ3pDcVksVUFBVSxDQUFDbkwsSUFBSSxHQUFHLGlCQUFpQjtJQUNuQ3ZVLFFBQVEsQ0FBQ3lmLElBQUksQ0FBQy9QLFdBQVcsQ0FBQ2dRLFVBQVUsQ0FBQztFQUN2QyxDQUFDLENBQUM7RUFFRnppQixDQUFDLENBQUN5aUIsVUFBVSxDQUFDLENBQUN0aUIsRUFBRSxDQUFDLE9BQU8sRUFBRSxVQUFTc0MsQ0FBQyxFQUFFO0lBQ3BDekMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDb0MsSUFBSSxDQUFDLENBQUM7SUFDbkJwQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUNvQyxJQUFJLENBQUMsQ0FBQztJQUNwQnBDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQ29DLElBQUksQ0FBQyxDQUFDO0lBQ3hCNUIsTUFBTSxDQUFDNkssVUFBVSxDQUFDLGlJQUFpSSxDQUFDO0lBQ3BKcVgsd0JBQXdCLENBQUN0WSxTQUF3QixFQUFFM0gsQ0FBQyxDQUFDO0VBRXZELENBQUMsQ0FBQztFQUVGakMsTUFBTSxDQUFDcWQsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFVBQUNwYixDQUFDLEVBQUs7SUFDdEMsSUFBRzBMLFlBQVksRUFBRTtNQUFFQSxZQUFZLENBQUM3SyxLQUFLLENBQUMsQ0FBQztJQUFFO0VBQzNDLENBQUMsQ0FBQztFQUVGLFNBQVMrZixTQUFTQSxDQUFBLEVBQUc7SUFDbkIsSUFBTUMsUUFBUSxHQUFHLEVBQUU7SUFDbkIsU0FBU25qQixFQUFFQSxDQUFDb2pCLE9BQU8sRUFBRTtNQUNuQkQsUUFBUSxDQUFDMWlCLElBQUksQ0FBQzJpQixPQUFPLENBQUM7SUFDeEI7SUFDQSxTQUFTQyxPQUFPQSxDQUFDQyxDQUFDLEVBQUU7TUFDbEJILFFBQVEsQ0FBQzFXLE9BQU8sQ0FBQyxVQUFBOFcsQ0FBQztRQUFBLE9BQUlBLENBQUMsQ0FBQ0QsQ0FBQyxDQUFDO01BQUEsRUFBQztJQUM3QjtJQUNBLE9BQU8sQ0FBQ3RqQixFQUFFLEVBQUVxakIsT0FBTyxDQUFDO0VBQ3RCO0VBQ0EsSUFBQUcsVUFBQSxHQUE4Qk4sU0FBUyxDQUFDLENBQUM7SUFBQU8sV0FBQSxHQUFBQyxjQUFBLENBQUFGLFVBQUE7SUFBbkNHLEtBQUssR0FBQUYsV0FBQTtJQUFFRyxZQUFZLEdBQUFILFdBQUE7RUFDekIsSUFBQUksV0FBQSxHQUE4Q1gsU0FBUyxDQUFDLENBQUM7SUFBQVksV0FBQSxHQUFBSixjQUFBLENBQUFHLFdBQUE7SUFBbkRFLGFBQWEsR0FBQUQsV0FBQTtJQUFFRSxvQkFBb0IsR0FBQUYsV0FBQTtFQUN6QyxJQUFBRyxXQUFBLEdBQWdDZixTQUFTLENBQUMsQ0FBQztJQUFBZ0IsV0FBQSxHQUFBUixjQUFBLENBQUFPLFdBQUE7SUFBckNFLE1BQU0sR0FBQUQsV0FBQTtJQUFFRSxhQUFhLEdBQUFGLFdBQUE7RUFFM0JsSixhQUFhLENBQUNxSixHQUFHLENBQUMsWUFBVztJQUMzQmpaLEdBQUcsQ0FBQzJMLE1BQU0sQ0FBQzVULEtBQUssQ0FBQyxDQUFDO0lBQ2xCaUksR0FBRyxDQUFDMkwsTUFBTSxDQUFDMVMsRUFBRSxDQUFDbWMsU0FBUyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUM7RUFDNUMsQ0FBQyxDQUFDO0VBRUZwVixHQUFHLENBQUNnQyxRQUFRLEdBQUdBLFFBQVE7RUFDdkJoQyxHQUFHLENBQUMrQixJQUFJLEdBQUdBLElBQUk7RUFDZi9CLEdBQUcsQ0FBQ21OLFVBQVUsR0FBR0EsVUFBVTtFQUMzQm5OLEdBQUcsQ0FBQzZLLGtCQUFrQixHQUFHQSxrQkFBa0I7RUFDM0M3SyxHQUFHLENBQUNxSyxXQUFXLEdBQUdBLFdBQVc7RUFDN0JySyxHQUFHLENBQUM2SixVQUFVLEdBQUdBLFVBQVU7RUFDM0I3SixHQUFHLENBQUM4TyxVQUFVLEdBQUdBLFVBQVU7RUFDM0I5TyxHQUFHLENBQUN1TixHQUFHLEdBQUdBLEdBQUc7RUFDYnZOLEdBQUcsQ0FBQ0MsWUFBWSxHQUFHQSxZQUFZO0VBQy9CRCxHQUFHLENBQUNrWixNQUFNLEdBQUc7SUFDWFgsS0FBSyxFQUFMQSxLQUFLO0lBQ0xDLFlBQVksRUFBWkEsWUFBWTtJQUNaRyxhQUFhLEVBQWJBLGFBQWE7SUFDYkMsb0JBQW9CLEVBQXBCQSxvQkFBb0I7SUFDcEJHLE1BQU0sRUFBTkEsTUFBTTtJQUNOQyxhQUFhLEVBQWJBO0VBQ0YsQ0FBQzs7RUFFRDtFQUNBO0VBQ0FoWixHQUFHLENBQUNrWixNQUFNLENBQUNYLEtBQUssQ0FBQyxZQUFNO0lBQUUvZ0IsUUFBUSxDQUFDeWYsSUFBSSxDQUFDekgsU0FBUyxDQUFDc0gsTUFBTSxDQUFDLGtCQUFrQixDQUFDO0VBQUUsQ0FBQyxDQUFDO0VBRS9FLElBQUlxQyxZQUFZLEdBQUd6WixNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsY0FBYyxDQUFDO0VBRWhEekssTUFBTSxDQUFDbWtCLGlCQUFpQixHQUFHLEtBQUs7RUFDaENua0IsTUFBTSxDQUFDK1AsZUFBZSxHQUFHLEtBQUs7RUFDOUIsSUFBSSxPQUFPcVUsZ0JBQWdCLEtBQUssVUFBVSxFQUFFO0lBQzFDcGtCLE1BQU0sQ0FBQ3FrQixRQUFRLEdBQUdDLFVBQVUsQ0FBQztNQUMzQnZaLEdBQUcsRUFBRUEsR0FBRztNQUNSd1osUUFBUSxFQUFFSCxnQkFBZ0IsQ0FBQyxDQUFDO01BQzVCSSxXQUFXLEVBQUV4a0IsTUFBTTtNQUNuQmtrQixZQUFZLEVBQVpBO0lBQ0YsQ0FBQyxDQUFDO0lBQ0Zsa0IsTUFBTSxDQUFDbWtCLGlCQUFpQixHQUFHLElBQUk7SUFDL0Jua0IsTUFBTSxDQUFDK1AsZUFBZSxHQUFHLElBQUk7RUFDL0IsQ0FBQyxNQUNJLElBQUkvUCxNQUFNLENBQUN5SixNQUFNLElBQUt6SixNQUFNLENBQUN5SixNQUFNLEtBQUt6SixNQUFPLEVBQUc7SUFDckRBLE1BQU0sQ0FBQ3FrQixRQUFRLEdBQUdDLFVBQVUsQ0FBQztNQUFFdlosR0FBRyxFQUFFQSxHQUFHO01BQUV3WixRQUFRLEVBQUV2a0IsTUFBTSxDQUFDeUosTUFBTTtNQUFFK2EsV0FBVyxFQUFFeGtCLE1BQU07TUFBRWtrQixZQUFZLEVBQVpBO0lBQWEsQ0FBQyxDQUFDO0lBQ3RHbGtCLE1BQU0sQ0FBQ21rQixpQkFBaUIsR0FBRyxJQUFJO0VBQ2pDO0FBQ0YsQ0FBQyxDQUFDLEMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9jb2RlLnB5cmV0Lm9yZy8uLi8uLi9weXJldC9jb2RlLnB5cmV0Lm9yZy9ub2RlX21vZHVsZXMvcS9xLmpzIiwid2VicGFjazovL2NvZGUucHlyZXQub3JnLy4uLy4uL3B5cmV0L2NvZGUucHlyZXQub3JnL25vZGVfbW9kdWxlcy91cmwuanMvdXJsLmpzIiwid2VicGFjazovL2NvZGUucHlyZXQub3JnLy4vc3JjL3dlYi9qcy9tb2RhbC1wcm9tcHQuanMiLCJ3ZWJwYWNrOi8vY29kZS5weXJldC5vcmcvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vY29kZS5weXJldC5vcmcvLi9zcmMvd2ViL2pzL2JlZm9yZVB5cmV0LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIHZpbTp0cz00OnN0cz00OnN3PTQ6XG4vKiFcbiAqXG4gKiBDb3B5cmlnaHQgMjAwOS0yMDEyIEtyaXMgS293YWwgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBNSVRcbiAqIGxpY2Vuc2UgZm91bmQgYXQgaHR0cDovL2dpdGh1Yi5jb20va3Jpc2tvd2FsL3EvcmF3L21hc3Rlci9MSUNFTlNFXG4gKlxuICogV2l0aCBwYXJ0cyBieSBUeWxlciBDbG9zZVxuICogQ29weXJpZ2h0IDIwMDctMjAwOSBUeWxlciBDbG9zZSB1bmRlciB0aGUgdGVybXMgb2YgdGhlIE1JVCBYIGxpY2Vuc2UgZm91bmRcbiAqIGF0IGh0dHA6Ly93d3cub3BlbnNvdXJjZS5vcmcvbGljZW5zZXMvbWl0LWxpY2Vuc2UuaHRtbFxuICogRm9ya2VkIGF0IHJlZl9zZW5kLmpzIHZlcnNpb246IDIwMDktMDUtMTFcbiAqXG4gKiBXaXRoIHBhcnRzIGJ5IE1hcmsgTWlsbGVyXG4gKiBDb3B5cmlnaHQgKEMpIDIwMTEgR29vZ2xlIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqXG4gKi9cblxuKGZ1bmN0aW9uIChkZWZpbml0aW9uKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAvLyBUaGlzIGZpbGUgd2lsbCBmdW5jdGlvbiBwcm9wZXJseSBhcyBhIDxzY3JpcHQ+IHRhZywgb3IgYSBtb2R1bGVcbiAgICAvLyB1c2luZyBDb21tb25KUyBhbmQgTm9kZUpTIG9yIFJlcXVpcmVKUyBtb2R1bGUgZm9ybWF0cy4gIEluXG4gICAgLy8gQ29tbW9uL05vZGUvUmVxdWlyZUpTLCB0aGUgbW9kdWxlIGV4cG9ydHMgdGhlIFEgQVBJIGFuZCB3aGVuXG4gICAgLy8gZXhlY3V0ZWQgYXMgYSBzaW1wbGUgPHNjcmlwdD4sIGl0IGNyZWF0ZXMgYSBRIGdsb2JhbCBpbnN0ZWFkLlxuXG4gICAgLy8gTW9udGFnZSBSZXF1aXJlXG4gICAgaWYgKHR5cGVvZiBib290c3RyYXAgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBib290c3RyYXAoXCJwcm9taXNlXCIsIGRlZmluaXRpb24pO1xuXG4gICAgLy8gQ29tbW9uSlNcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBtb2R1bGUgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbml0aW9uKCk7XG5cbiAgICAvLyBSZXF1aXJlSlNcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09IFwiZnVuY3Rpb25cIiAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShkZWZpbml0aW9uKTtcblxuICAgIC8vIFNFUyAoU2VjdXJlIEVjbWFTY3JpcHQpXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2VzICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGlmICghc2VzLm9rKCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlcy5tYWtlUSA9IGRlZmluaXRpb247XG4gICAgICAgIH1cblxuICAgIC8vIDxzY3JpcHQ+XG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiIHx8IHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIC8vIFByZWZlciB3aW5kb3cgb3ZlciBzZWxmIGZvciBhZGQtb24gc2NyaXB0cy4gVXNlIHNlbGYgZm9yXG4gICAgICAgIC8vIG5vbi13aW5kb3dlZCBjb250ZXh0cy5cbiAgICAgICAgdmFyIGdsb2JhbCA9IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiBzZWxmO1xuXG4gICAgICAgIC8vIEdldCB0aGUgYHdpbmRvd2Agb2JqZWN0LCBzYXZlIHRoZSBwcmV2aW91cyBRIGdsb2JhbFxuICAgICAgICAvLyBhbmQgaW5pdGlhbGl6ZSBRIGFzIGEgZ2xvYmFsLlxuICAgICAgICB2YXIgcHJldmlvdXNRID0gZ2xvYmFsLlE7XG4gICAgICAgIGdsb2JhbC5RID0gZGVmaW5pdGlvbigpO1xuXG4gICAgICAgIC8vIEFkZCBhIG5vQ29uZmxpY3QgZnVuY3Rpb24gc28gUSBjYW4gYmUgcmVtb3ZlZCBmcm9tIHRoZVxuICAgICAgICAvLyBnbG9iYWwgbmFtZXNwYWNlLlxuICAgICAgICBnbG9iYWwuUS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZ2xvYmFsLlEgPSBwcmV2aW91c1E7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfTtcblxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoaXMgZW52aXJvbm1lbnQgd2FzIG5vdCBhbnRpY2lwYXRlZCBieSBRLiBQbGVhc2UgZmlsZSBhIGJ1Zy5cIik7XG4gICAgfVxuXG59KShmdW5jdGlvbiAoKSB7XG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGhhc1N0YWNrcyA9IGZhbHNlO1xudHJ5IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbn0gY2F0Y2ggKGUpIHtcbiAgICBoYXNTdGFja3MgPSAhIWUuc3RhY2s7XG59XG5cbi8vIEFsbCBjb2RlIGFmdGVyIHRoaXMgcG9pbnQgd2lsbCBiZSBmaWx0ZXJlZCBmcm9tIHN0YWNrIHRyYWNlcyByZXBvcnRlZFxuLy8gYnkgUS5cbnZhciBxU3RhcnRpbmdMaW5lID0gY2FwdHVyZUxpbmUoKTtcbnZhciBxRmlsZU5hbWU7XG5cbi8vIHNoaW1zXG5cbi8vIHVzZWQgZm9yIGZhbGxiYWNrIGluIFwiYWxsUmVzb2x2ZWRcIlxudmFyIG5vb3AgPSBmdW5jdGlvbiAoKSB7fTtcblxuLy8gVXNlIHRoZSBmYXN0ZXN0IHBvc3NpYmxlIG1lYW5zIHRvIGV4ZWN1dGUgYSB0YXNrIGluIGEgZnV0dXJlIHR1cm5cbi8vIG9mIHRoZSBldmVudCBsb29wLlxudmFyIG5leHRUaWNrID0oZnVuY3Rpb24gKCkge1xuICAgIC8vIGxpbmtlZCBsaXN0IG9mIHRhc2tzIChzaW5nbGUsIHdpdGggaGVhZCBub2RlKVxuICAgIHZhciBoZWFkID0ge3Rhc2s6IHZvaWQgMCwgbmV4dDogbnVsbH07XG4gICAgdmFyIHRhaWwgPSBoZWFkO1xuICAgIHZhciBmbHVzaGluZyA9IGZhbHNlO1xuICAgIHZhciByZXF1ZXN0VGljayA9IHZvaWQgMDtcbiAgICB2YXIgaXNOb2RlSlMgPSBmYWxzZTtcbiAgICAvLyBxdWV1ZSBmb3IgbGF0ZSB0YXNrcywgdXNlZCBieSB1bmhhbmRsZWQgcmVqZWN0aW9uIHRyYWNraW5nXG4gICAgdmFyIGxhdGVyUXVldWUgPSBbXTtcblxuICAgIGZ1bmN0aW9uIGZsdXNoKCkge1xuICAgICAgICAvKiBqc2hpbnQgbG9vcGZ1bmM6IHRydWUgKi9cbiAgICAgICAgdmFyIHRhc2ssIGRvbWFpbjtcblxuICAgICAgICB3aGlsZSAoaGVhZC5uZXh0KSB7XG4gICAgICAgICAgICBoZWFkID0gaGVhZC5uZXh0O1xuICAgICAgICAgICAgdGFzayA9IGhlYWQudGFzaztcbiAgICAgICAgICAgIGhlYWQudGFzayA9IHZvaWQgMDtcbiAgICAgICAgICAgIGRvbWFpbiA9IGhlYWQuZG9tYWluO1xuXG4gICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgaGVhZC5kb21haW4gPSB2b2lkIDA7XG4gICAgICAgICAgICAgICAgZG9tYWluLmVudGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBydW5TaW5nbGUodGFzaywgZG9tYWluKTtcblxuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChsYXRlclF1ZXVlLmxlbmd0aCkge1xuICAgICAgICAgICAgdGFzayA9IGxhdGVyUXVldWUucG9wKCk7XG4gICAgICAgICAgICBydW5TaW5nbGUodGFzayk7XG4gICAgICAgIH1cbiAgICAgICAgZmx1c2hpbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgLy8gcnVucyBhIHNpbmdsZSBmdW5jdGlvbiBpbiB0aGUgYXN5bmMgcXVldWVcbiAgICBmdW5jdGlvbiBydW5TaW5nbGUodGFzaywgZG9tYWluKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0YXNrKCk7XG5cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGlzTm9kZUpTKSB7XG4gICAgICAgICAgICAgICAgLy8gSW4gbm9kZSwgdW5jYXVnaHQgZXhjZXB0aW9ucyBhcmUgY29uc2lkZXJlZCBmYXRhbCBlcnJvcnMuXG4gICAgICAgICAgICAgICAgLy8gUmUtdGhyb3cgdGhlbSBzeW5jaHJvbm91c2x5IHRvIGludGVycnVwdCBmbHVzaGluZyFcblxuICAgICAgICAgICAgICAgIC8vIEVuc3VyZSBjb250aW51YXRpb24gaWYgdGhlIHVuY2F1Z2h0IGV4Y2VwdGlvbiBpcyBzdXBwcmVzc2VkXG4gICAgICAgICAgICAgICAgLy8gbGlzdGVuaW5nIFwidW5jYXVnaHRFeGNlcHRpb25cIiBldmVudHMgKGFzIGRvbWFpbnMgZG9lcykuXG4gICAgICAgICAgICAgICAgLy8gQ29udGludWUgaW4gbmV4dCBldmVudCB0byBhdm9pZCB0aWNrIHJlY3Vyc2lvbi5cbiAgICAgICAgICAgICAgICBpZiAoZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICAgICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZG9tYWluLmVudGVyKCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhyb3cgZTtcblxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBJbiBicm93c2VycywgdW5jYXVnaHQgZXhjZXB0aW9ucyBhcmUgbm90IGZhdGFsLlxuICAgICAgICAgICAgICAgIC8vIFJlLXRocm93IHRoZW0gYXN5bmNocm9ub3VzbHkgdG8gYXZvaWQgc2xvdy1kb3ducy5cbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkb21haW4pIHtcbiAgICAgICAgICAgIGRvbWFpbi5leGl0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBuZXh0VGljayA9IGZ1bmN0aW9uICh0YXNrKSB7XG4gICAgICAgIHRhaWwgPSB0YWlsLm5leHQgPSB7XG4gICAgICAgICAgICB0YXNrOiB0YXNrLFxuICAgICAgICAgICAgZG9tYWluOiBpc05vZGVKUyAmJiBwcm9jZXNzLmRvbWFpbixcbiAgICAgICAgICAgIG5leHQ6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoIWZsdXNoaW5nKSB7XG4gICAgICAgICAgICBmbHVzaGluZyA9IHRydWU7XG4gICAgICAgICAgICByZXF1ZXN0VGljaygpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICBwcm9jZXNzLnRvU3RyaW5nKCkgPT09IFwiW29iamVjdCBwcm9jZXNzXVwiICYmIHByb2Nlc3MubmV4dFRpY2spIHtcbiAgICAgICAgLy8gRW5zdXJlIFEgaXMgaW4gYSByZWFsIE5vZGUgZW52aXJvbm1lbnQsIHdpdGggYSBgcHJvY2Vzcy5uZXh0VGlja2AuXG4gICAgICAgIC8vIFRvIHNlZSB0aHJvdWdoIGZha2UgTm9kZSBlbnZpcm9ubWVudHM6XG4gICAgICAgIC8vICogTW9jaGEgdGVzdCBydW5uZXIgLSBleHBvc2VzIGEgYHByb2Nlc3NgIGdsb2JhbCB3aXRob3V0IGEgYG5leHRUaWNrYFxuICAgICAgICAvLyAqIEJyb3dzZXJpZnkgLSBleHBvc2VzIGEgYHByb2Nlc3MubmV4VGlja2AgZnVuY3Rpb24gdGhhdCB1c2VzXG4gICAgICAgIC8vICAgYHNldFRpbWVvdXRgLiBJbiB0aGlzIGNhc2UgYHNldEltbWVkaWF0ZWAgaXMgcHJlZmVycmVkIGJlY2F1c2VcbiAgICAgICAgLy8gICAgaXQgaXMgZmFzdGVyLiBCcm93c2VyaWZ5J3MgYHByb2Nlc3MudG9TdHJpbmcoKWAgeWllbGRzXG4gICAgICAgIC8vICAgXCJbb2JqZWN0IE9iamVjdF1cIiwgd2hpbGUgaW4gYSByZWFsIE5vZGUgZW52aXJvbm1lbnRcbiAgICAgICAgLy8gICBgcHJvY2Vzcy5uZXh0VGljaygpYCB5aWVsZHMgXCJbb2JqZWN0IHByb2Nlc3NdXCIuXG4gICAgICAgIGlzTm9kZUpTID0gdHJ1ZTtcblxuICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHByb2Nlc3MubmV4dFRpY2soZmx1c2gpO1xuICAgICAgICB9O1xuXG4gICAgfSBlbHNlIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgLy8gSW4gSUUxMCwgTm9kZS5qcyAwLjkrLCBvciBodHRwczovL2dpdGh1Yi5jb20vTm9ibGVKUy9zZXRJbW1lZGlhdGVcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrID0gc2V0SW1tZWRpYXRlLmJpbmQod2luZG93LCBmbHVzaCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBzZXRJbW1lZGlhdGUoZmx1c2gpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgfSBlbHNlIGlmICh0eXBlb2YgTWVzc2FnZUNoYW5uZWwgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgLy8gbW9kZXJuIGJyb3dzZXJzXG4gICAgICAgIC8vIGh0dHA6Ly93d3cubm9uYmxvY2tpbmcuaW8vMjAxMS8wNi93aW5kb3duZXh0dGljay5odG1sXG4gICAgICAgIHZhciBjaGFubmVsID0gbmV3IE1lc3NhZ2VDaGFubmVsKCk7XG4gICAgICAgIC8vIEF0IGxlYXN0IFNhZmFyaSBWZXJzaW9uIDYuMC41ICg4NTM2LjMwLjEpIGludGVybWl0dGVudGx5IGNhbm5vdCBjcmVhdGVcbiAgICAgICAgLy8gd29ya2luZyBtZXNzYWdlIHBvcnRzIHRoZSBmaXJzdCB0aW1lIGEgcGFnZSBsb2Fkcy5cbiAgICAgICAgY2hhbm5lbC5wb3J0MS5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXF1ZXN0VGljayA9IHJlcXVlc3RQb3J0VGljaztcbiAgICAgICAgICAgIGNoYW5uZWwucG9ydDEub25tZXNzYWdlID0gZmx1c2g7XG4gICAgICAgICAgICBmbHVzaCgpO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgcmVxdWVzdFBvcnRUaWNrID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gT3BlcmEgcmVxdWlyZXMgdXMgdG8gcHJvdmlkZSBhIG1lc3NhZ2UgcGF5bG9hZCwgcmVnYXJkbGVzcyBvZlxuICAgICAgICAgICAgLy8gd2hldGhlciB3ZSB1c2UgaXQuXG4gICAgICAgICAgICBjaGFubmVsLnBvcnQyLnBvc3RNZXNzYWdlKDApO1xuICAgICAgICB9O1xuICAgICAgICByZXF1ZXN0VGljayA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZmx1c2gsIDApO1xuICAgICAgICAgICAgcmVxdWVzdFBvcnRUaWNrKCk7XG4gICAgICAgIH07XG5cbiAgICB9IGVsc2Uge1xuICAgICAgICAvLyBvbGQgYnJvd3NlcnNcbiAgICAgICAgcmVxdWVzdFRpY2sgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZsdXNoLCAwKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLy8gcnVucyBhIHRhc2sgYWZ0ZXIgYWxsIG90aGVyIHRhc2tzIGhhdmUgYmVlbiBydW5cbiAgICAvLyB0aGlzIGlzIHVzZWZ1bCBmb3IgdW5oYW5kbGVkIHJlamVjdGlvbiB0cmFja2luZyB0aGF0IG5lZWRzIHRvIGhhcHBlblxuICAgIC8vIGFmdGVyIGFsbCBgdGhlbmBkIHRhc2tzIGhhdmUgYmVlbiBydW4uXG4gICAgbmV4dFRpY2sucnVuQWZ0ZXIgPSBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICBsYXRlclF1ZXVlLnB1c2godGFzayk7XG4gICAgICAgIGlmICghZmx1c2hpbmcpIHtcbiAgICAgICAgICAgIGZsdXNoaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlcXVlc3RUaWNrKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBuZXh0VGljaztcbn0pKCk7XG5cbi8vIEF0dGVtcHQgdG8gbWFrZSBnZW5lcmljcyBzYWZlIGluIHRoZSBmYWNlIG9mIGRvd25zdHJlYW1cbi8vIG1vZGlmaWNhdGlvbnMuXG4vLyBUaGVyZSBpcyBubyBzaXR1YXRpb24gd2hlcmUgdGhpcyBpcyBuZWNlc3NhcnkuXG4vLyBJZiB5b3UgbmVlZCBhIHNlY3VyaXR5IGd1YXJhbnRlZSwgdGhlc2UgcHJpbW9yZGlhbHMgbmVlZCB0byBiZVxuLy8gZGVlcGx5IGZyb3plbiBhbnl3YXksIGFuZCBpZiB5b3UgZG9u4oCZdCBuZWVkIGEgc2VjdXJpdHkgZ3VhcmFudGVlLFxuLy8gdGhpcyBpcyBqdXN0IHBsYWluIHBhcmFub2lkLlxuLy8gSG93ZXZlciwgdGhpcyAqKm1pZ2h0KiogaGF2ZSB0aGUgbmljZSBzaWRlLWVmZmVjdCBvZiByZWR1Y2luZyB0aGUgc2l6ZSBvZlxuLy8gdGhlIG1pbmlmaWVkIGNvZGUgYnkgcmVkdWNpbmcgeC5jYWxsKCkgdG8gbWVyZWx5IHgoKVxuLy8gU2VlIE1hcmsgTWlsbGVy4oCZcyBleHBsYW5hdGlvbiBvZiB3aGF0IHRoaXMgZG9lcy5cbi8vIGh0dHA6Ly93aWtpLmVjbWFzY3JpcHQub3JnL2Rva3UucGhwP2lkPWNvbnZlbnRpb25zOnNhZmVfbWV0YV9wcm9ncmFtbWluZ1xudmFyIGNhbGwgPSBGdW5jdGlvbi5jYWxsO1xuZnVuY3Rpb24gdW5jdXJyeVRoaXMoZikge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBjYWxsLmFwcGx5KGYsIGFyZ3VtZW50cyk7XG4gICAgfTtcbn1cbi8vIFRoaXMgaXMgZXF1aXZhbGVudCwgYnV0IHNsb3dlcjpcbi8vIHVuY3VycnlUaGlzID0gRnVuY3Rpb25fYmluZC5iaW5kKEZ1bmN0aW9uX2JpbmQuY2FsbCk7XG4vLyBodHRwOi8vanNwZXJmLmNvbS91bmN1cnJ5dGhpc1xuXG52YXIgYXJyYXlfc2xpY2UgPSB1bmN1cnJ5VGhpcyhBcnJheS5wcm90b3R5cGUuc2xpY2UpO1xuXG52YXIgYXJyYXlfcmVkdWNlID0gdW5jdXJyeVRoaXMoXG4gICAgQXJyYXkucHJvdG90eXBlLnJlZHVjZSB8fCBmdW5jdGlvbiAoY2FsbGJhY2ssIGJhc2lzKSB7XG4gICAgICAgIHZhciBpbmRleCA9IDAsXG4gICAgICAgICAgICBsZW5ndGggPSB0aGlzLmxlbmd0aDtcbiAgICAgICAgLy8gY29uY2VybmluZyB0aGUgaW5pdGlhbCB2YWx1ZSwgaWYgb25lIGlzIG5vdCBwcm92aWRlZFxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgLy8gc2VlayB0byB0aGUgZmlyc3QgdmFsdWUgaW4gdGhlIGFycmF5LCBhY2NvdW50aW5nXG4gICAgICAgICAgICAvLyBmb3IgdGhlIHBvc3NpYmlsaXR5IHRoYXQgaXMgaXMgYSBzcGFyc2UgYXJyYXlcbiAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggaW4gdGhpcykge1xuICAgICAgICAgICAgICAgICAgICBiYXNpcyA9IHRoaXNbaW5kZXgrK107XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoKytpbmRleCA+PSBsZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gd2hpbGUgKDEpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJlZHVjZVxuICAgICAgICBmb3IgKDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIC8vIGFjY291bnQgZm9yIHRoZSBwb3NzaWJpbGl0eSB0aGF0IHRoZSBhcnJheSBpcyBzcGFyc2VcbiAgICAgICAgICAgIGlmIChpbmRleCBpbiB0aGlzKSB7XG4gICAgICAgICAgICAgICAgYmFzaXMgPSBjYWxsYmFjayhiYXNpcywgdGhpc1tpbmRleF0sIGluZGV4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmFzaXM7XG4gICAgfVxuKTtcblxudmFyIGFycmF5X2luZGV4T2YgPSB1bmN1cnJ5VGhpcyhcbiAgICBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiB8fCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgLy8gbm90IGEgdmVyeSBnb29kIHNoaW0sIGJ1dCBnb29kIGVub3VnaCBmb3Igb3VyIG9uZSB1c2Ugb2YgaXRcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpc1tpXSA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfVxuKTtcblxudmFyIGFycmF5X21hcCA9IHVuY3VycnlUaGlzKFxuICAgIEFycmF5LnByb3RvdHlwZS5tYXAgfHwgZnVuY3Rpb24gKGNhbGxiYWNrLCB0aGlzcCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBjb2xsZWN0ID0gW107XG4gICAgICAgIGFycmF5X3JlZHVjZShzZWxmLCBmdW5jdGlvbiAodW5kZWZpbmVkLCB2YWx1ZSwgaW5kZXgpIHtcbiAgICAgICAgICAgIGNvbGxlY3QucHVzaChjYWxsYmFjay5jYWxsKHRoaXNwLCB2YWx1ZSwgaW5kZXgsIHNlbGYpKTtcbiAgICAgICAgfSwgdm9pZCAwKTtcbiAgICAgICAgcmV0dXJuIGNvbGxlY3Q7XG4gICAgfVxuKTtcblxudmFyIG9iamVjdF9jcmVhdGUgPSBPYmplY3QuY3JlYXRlIHx8IGZ1bmN0aW9uIChwcm90b3R5cGUpIHtcbiAgICBmdW5jdGlvbiBUeXBlKCkgeyB9XG4gICAgVHlwZS5wcm90b3R5cGUgPSBwcm90b3R5cGU7XG4gICAgcmV0dXJuIG5ldyBUeXBlKCk7XG59O1xuXG52YXIgb2JqZWN0X2hhc093blByb3BlcnR5ID0gdW5jdXJyeVRoaXMoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eSk7XG5cbnZhciBvYmplY3Rfa2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICB2YXIga2V5cyA9IFtdO1xuICAgIGZvciAodmFyIGtleSBpbiBvYmplY3QpIHtcbiAgICAgICAgaWYgKG9iamVjdF9oYXNPd25Qcm9wZXJ0eShvYmplY3QsIGtleSkpIHtcbiAgICAgICAgICAgIGtleXMucHVzaChrZXkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBrZXlzO1xufTtcblxudmFyIG9iamVjdF90b1N0cmluZyA9IHVuY3VycnlUaGlzKE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcpO1xuXG5mdW5jdGlvbiBpc09iamVjdCh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSA9PT0gT2JqZWN0KHZhbHVlKTtcbn1cblxuLy8gZ2VuZXJhdG9yIHJlbGF0ZWQgc2hpbXNcblxuLy8gRklYTUU6IFJlbW92ZSB0aGlzIGZ1bmN0aW9uIG9uY2UgRVM2IGdlbmVyYXRvcnMgYXJlIGluIFNwaWRlck1vbmtleS5cbmZ1bmN0aW9uIGlzU3RvcEl0ZXJhdGlvbihleGNlcHRpb24pIHtcbiAgICByZXR1cm4gKFxuICAgICAgICBvYmplY3RfdG9TdHJpbmcoZXhjZXB0aW9uKSA9PT0gXCJbb2JqZWN0IFN0b3BJdGVyYXRpb25dXCIgfHxcbiAgICAgICAgZXhjZXB0aW9uIGluc3RhbmNlb2YgUVJldHVyblZhbHVlXG4gICAgKTtcbn1cblxuLy8gRklYTUU6IFJlbW92ZSB0aGlzIGhlbHBlciBhbmQgUS5yZXR1cm4gb25jZSBFUzYgZ2VuZXJhdG9ycyBhcmUgaW5cbi8vIFNwaWRlck1vbmtleS5cbnZhciBRUmV0dXJuVmFsdWU7XG5pZiAodHlwZW9mIFJldHVyblZhbHVlICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgUVJldHVyblZhbHVlID0gUmV0dXJuVmFsdWU7XG59IGVsc2Uge1xuICAgIFFSZXR1cm5WYWx1ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgfTtcbn1cblxuLy8gbG9uZyBzdGFjayB0cmFjZXNcblxudmFyIFNUQUNLX0pVTVBfU0VQQVJBVE9SID0gXCJGcm9tIHByZXZpb3VzIGV2ZW50OlwiO1xuXG5mdW5jdGlvbiBtYWtlU3RhY2tUcmFjZUxvbmcoZXJyb3IsIHByb21pc2UpIHtcbiAgICAvLyBJZiBwb3NzaWJsZSwgdHJhbnNmb3JtIHRoZSBlcnJvciBzdGFjayB0cmFjZSBieSByZW1vdmluZyBOb2RlIGFuZCBRXG4gICAgLy8gY3J1ZnQsIHRoZW4gY29uY2F0ZW5hdGluZyB3aXRoIHRoZSBzdGFjayB0cmFjZSBvZiBgcHJvbWlzZWAuIFNlZSAjNTcuXG4gICAgaWYgKGhhc1N0YWNrcyAmJlxuICAgICAgICBwcm9taXNlLnN0YWNrICYmXG4gICAgICAgIHR5cGVvZiBlcnJvciA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgICBlcnJvciAhPT0gbnVsbCAmJlxuICAgICAgICBlcnJvci5zdGFjayAmJlxuICAgICAgICBlcnJvci5zdGFjay5pbmRleE9mKFNUQUNLX0pVTVBfU0VQQVJBVE9SKSA9PT0gLTFcbiAgICApIHtcbiAgICAgICAgdmFyIHN0YWNrcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBwID0gcHJvbWlzZTsgISFwOyBwID0gcC5zb3VyY2UpIHtcbiAgICAgICAgICAgIGlmIChwLnN0YWNrKSB7XG4gICAgICAgICAgICAgICAgc3RhY2tzLnVuc2hpZnQocC5zdGFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RhY2tzLnVuc2hpZnQoZXJyb3Iuc3RhY2spO1xuXG4gICAgICAgIHZhciBjb25jYXRlZFN0YWNrcyA9IHN0YWNrcy5qb2luKFwiXFxuXCIgKyBTVEFDS19KVU1QX1NFUEFSQVRPUiArIFwiXFxuXCIpO1xuICAgICAgICBlcnJvci5zdGFjayA9IGZpbHRlclN0YWNrU3RyaW5nKGNvbmNhdGVkU3RhY2tzKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGZpbHRlclN0YWNrU3RyaW5nKHN0YWNrU3RyaW5nKSB7XG4gICAgdmFyIGxpbmVzID0gc3RhY2tTdHJpbmcuc3BsaXQoXCJcXG5cIik7XG4gICAgdmFyIGRlc2lyZWRMaW5lcyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGxpbmUgPSBsaW5lc1tpXTtcblxuICAgICAgICBpZiAoIWlzSW50ZXJuYWxGcmFtZShsaW5lKSAmJiAhaXNOb2RlRnJhbWUobGluZSkgJiYgbGluZSkge1xuICAgICAgICAgICAgZGVzaXJlZExpbmVzLnB1c2gobGluZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRlc2lyZWRMaW5lcy5qb2luKFwiXFxuXCIpO1xufVxuXG5mdW5jdGlvbiBpc05vZGVGcmFtZShzdGFja0xpbmUpIHtcbiAgICByZXR1cm4gc3RhY2tMaW5lLmluZGV4T2YoXCIobW9kdWxlLmpzOlwiKSAhPT0gLTEgfHxcbiAgICAgICAgICAgc3RhY2tMaW5lLmluZGV4T2YoXCIobm9kZS5qczpcIikgIT09IC0xO1xufVxuXG5mdW5jdGlvbiBnZXRGaWxlTmFtZUFuZExpbmVOdW1iZXIoc3RhY2tMaW5lKSB7XG4gICAgLy8gTmFtZWQgZnVuY3Rpb25zOiBcImF0IGZ1bmN0aW9uTmFtZSAoZmlsZW5hbWU6bGluZU51bWJlcjpjb2x1bW5OdW1iZXIpXCJcbiAgICAvLyBJbiBJRTEwIGZ1bmN0aW9uIG5hbWUgY2FuIGhhdmUgc3BhY2VzIChcIkFub255bW91cyBmdW5jdGlvblwiKSBPX29cbiAgICB2YXIgYXR0ZW1wdDEgPSAvYXQgLisgXFwoKC4rKTooXFxkKyk6KD86XFxkKylcXCkkLy5leGVjKHN0YWNrTGluZSk7XG4gICAgaWYgKGF0dGVtcHQxKSB7XG4gICAgICAgIHJldHVybiBbYXR0ZW1wdDFbMV0sIE51bWJlcihhdHRlbXB0MVsyXSldO1xuICAgIH1cblxuICAgIC8vIEFub255bW91cyBmdW5jdGlvbnM6IFwiYXQgZmlsZW5hbWU6bGluZU51bWJlcjpjb2x1bW5OdW1iZXJcIlxuICAgIHZhciBhdHRlbXB0MiA9IC9hdCAoW14gXSspOihcXGQrKTooPzpcXGQrKSQvLmV4ZWMoc3RhY2tMaW5lKTtcbiAgICBpZiAoYXR0ZW1wdDIpIHtcbiAgICAgICAgcmV0dXJuIFthdHRlbXB0MlsxXSwgTnVtYmVyKGF0dGVtcHQyWzJdKV07XG4gICAgfVxuXG4gICAgLy8gRmlyZWZveCBzdHlsZTogXCJmdW5jdGlvbkBmaWxlbmFtZTpsaW5lTnVtYmVyIG9yIEBmaWxlbmFtZTpsaW5lTnVtYmVyXCJcbiAgICB2YXIgYXR0ZW1wdDMgPSAvLipAKC4rKTooXFxkKykkLy5leGVjKHN0YWNrTGluZSk7XG4gICAgaWYgKGF0dGVtcHQzKSB7XG4gICAgICAgIHJldHVybiBbYXR0ZW1wdDNbMV0sIE51bWJlcihhdHRlbXB0M1syXSldO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gaXNJbnRlcm5hbEZyYW1lKHN0YWNrTGluZSkge1xuICAgIHZhciBmaWxlTmFtZUFuZExpbmVOdW1iZXIgPSBnZXRGaWxlTmFtZUFuZExpbmVOdW1iZXIoc3RhY2tMaW5lKTtcblxuICAgIGlmICghZmlsZU5hbWVBbmRMaW5lTnVtYmVyKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgZmlsZU5hbWUgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMF07XG4gICAgdmFyIGxpbmVOdW1iZXIgPSBmaWxlTmFtZUFuZExpbmVOdW1iZXJbMV07XG5cbiAgICByZXR1cm4gZmlsZU5hbWUgPT09IHFGaWxlTmFtZSAmJlxuICAgICAgICBsaW5lTnVtYmVyID49IHFTdGFydGluZ0xpbmUgJiZcbiAgICAgICAgbGluZU51bWJlciA8PSBxRW5kaW5nTGluZTtcbn1cblxuLy8gZGlzY292ZXIgb3duIGZpbGUgbmFtZSBhbmQgbGluZSBudW1iZXIgcmFuZ2UgZm9yIGZpbHRlcmluZyBzdGFja1xuLy8gdHJhY2VzXG5mdW5jdGlvbiBjYXB0dXJlTGluZSgpIHtcbiAgICBpZiAoIWhhc1N0YWNrcykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB2YXIgbGluZXMgPSBlLnN0YWNrLnNwbGl0KFwiXFxuXCIpO1xuICAgICAgICB2YXIgZmlyc3RMaW5lID0gbGluZXNbMF0uaW5kZXhPZihcIkBcIikgPiAwID8gbGluZXNbMV0gOiBsaW5lc1syXTtcbiAgICAgICAgdmFyIGZpbGVOYW1lQW5kTGluZU51bWJlciA9IGdldEZpbGVOYW1lQW5kTGluZU51bWJlcihmaXJzdExpbmUpO1xuICAgICAgICBpZiAoIWZpbGVOYW1lQW5kTGluZU51bWJlcikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcUZpbGVOYW1lID0gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzBdO1xuICAgICAgICByZXR1cm4gZmlsZU5hbWVBbmRMaW5lTnVtYmVyWzFdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZGVwcmVjYXRlKGNhbGxiYWNrLCBuYW1lLCBhbHRlcm5hdGl2ZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICAgICAgdHlwZW9mIGNvbnNvbGUud2FybiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4obmFtZSArIFwiIGlzIGRlcHJlY2F0ZWQsIHVzZSBcIiArIGFsdGVybmF0aXZlICtcbiAgICAgICAgICAgICAgICAgICAgICAgICBcIiBpbnN0ZWFkLlwiLCBuZXcgRXJyb3IoXCJcIikuc3RhY2spO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseShjYWxsYmFjaywgYXJndW1lbnRzKTtcbiAgICB9O1xufVxuXG4vLyBlbmQgb2Ygc2hpbXNcbi8vIGJlZ2lubmluZyBvZiByZWFsIHdvcmtcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcHJvbWlzZSBmb3IgYW4gaW1tZWRpYXRlIHJlZmVyZW5jZSwgcGFzc2VzIHByb21pc2VzIHRocm91Z2gsIG9yXG4gKiBjb2VyY2VzIHByb21pc2VzIGZyb20gZGlmZmVyZW50IHN5c3RlbXMuXG4gKiBAcGFyYW0gdmFsdWUgaW1tZWRpYXRlIHJlZmVyZW5jZSBvciBwcm9taXNlXG4gKi9cbmZ1bmN0aW9uIFEodmFsdWUpIHtcbiAgICAvLyBJZiB0aGUgb2JqZWN0IGlzIGFscmVhZHkgYSBQcm9taXNlLCByZXR1cm4gaXQgZGlyZWN0bHkuICBUaGlzIGVuYWJsZXNcbiAgICAvLyB0aGUgcmVzb2x2ZSBmdW5jdGlvbiB0byBib3RoIGJlIHVzZWQgdG8gY3JlYXRlZCByZWZlcmVuY2VzIGZyb20gb2JqZWN0cyxcbiAgICAvLyBidXQgdG8gdG9sZXJhYmx5IGNvZXJjZSBub24tcHJvbWlzZXMgdG8gcHJvbWlzZXMuXG4gICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgLy8gYXNzaW1pbGF0ZSB0aGVuYWJsZXNcbiAgICBpZiAoaXNQcm9taXNlQWxpa2UodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiBjb2VyY2UodmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmdWxmaWxsKHZhbHVlKTtcbiAgICB9XG59XG5RLnJlc29sdmUgPSBRO1xuXG4vKipcbiAqIFBlcmZvcm1zIGEgdGFzayBpbiBhIGZ1dHVyZSB0dXJuIG9mIHRoZSBldmVudCBsb29wLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gdGFza1xuICovXG5RLm5leHRUaWNrID0gbmV4dFRpY2s7XG5cbi8qKlxuICogQ29udHJvbHMgd2hldGhlciBvciBub3QgbG9uZyBzdGFjayB0cmFjZXMgd2lsbCBiZSBvblxuICovXG5RLmxvbmdTdGFja1N1cHBvcnQgPSBmYWxzZTtcblxuLy8gZW5hYmxlIGxvbmcgc3RhY2tzIGlmIFFfREVCVUcgaXMgc2V0XG5pZiAodHlwZW9mIHByb2Nlc3MgPT09IFwib2JqZWN0XCIgJiYgcHJvY2VzcyAmJiBwcm9jZXNzLmVudiAmJiBwcm9jZXNzLmVudi5RX0RFQlVHKSB7XG4gICAgUS5sb25nU3RhY2tTdXBwb3J0ID0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEge3Byb21pc2UsIHJlc29sdmUsIHJlamVjdH0gb2JqZWN0LlxuICpcbiAqIGByZXNvbHZlYCBpcyBhIGNhbGxiYWNrIHRvIGludm9rZSB3aXRoIGEgbW9yZSByZXNvbHZlZCB2YWx1ZSBmb3IgdGhlXG4gKiBwcm9taXNlLiBUbyBmdWxmaWxsIHRoZSBwcm9taXNlLCBpbnZva2UgYHJlc29sdmVgIHdpdGggYW55IHZhbHVlIHRoYXQgaXNcbiAqIG5vdCBhIHRoZW5hYmxlLiBUbyByZWplY3QgdGhlIHByb21pc2UsIGludm9rZSBgcmVzb2x2ZWAgd2l0aCBhIHJlamVjdGVkXG4gKiB0aGVuYWJsZSwgb3IgaW52b2tlIGByZWplY3RgIHdpdGggdGhlIHJlYXNvbiBkaXJlY3RseS4gVG8gcmVzb2x2ZSB0aGVcbiAqIHByb21pc2UgdG8gYW5vdGhlciB0aGVuYWJsZSwgdGh1cyBwdXR0aW5nIGl0IGluIHRoZSBzYW1lIHN0YXRlLCBpbnZva2VcbiAqIGByZXNvbHZlYCB3aXRoIHRoYXQgb3RoZXIgdGhlbmFibGUuXG4gKi9cblEuZGVmZXIgPSBkZWZlcjtcbmZ1bmN0aW9uIGRlZmVyKCkge1xuICAgIC8vIGlmIFwibWVzc2FnZXNcIiBpcyBhbiBcIkFycmF5XCIsIHRoYXQgaW5kaWNhdGVzIHRoYXQgdGhlIHByb21pc2UgaGFzIG5vdCB5ZXRcbiAgICAvLyBiZWVuIHJlc29sdmVkLiAgSWYgaXQgaXMgXCJ1bmRlZmluZWRcIiwgaXQgaGFzIGJlZW4gcmVzb2x2ZWQuICBFYWNoXG4gICAgLy8gZWxlbWVudCBvZiB0aGUgbWVzc2FnZXMgYXJyYXkgaXMgaXRzZWxmIGFuIGFycmF5IG9mIGNvbXBsZXRlIGFyZ3VtZW50cyB0b1xuICAgIC8vIGZvcndhcmQgdG8gdGhlIHJlc29sdmVkIHByb21pc2UuICBXZSBjb2VyY2UgdGhlIHJlc29sdXRpb24gdmFsdWUgdG8gYVxuICAgIC8vIHByb21pc2UgdXNpbmcgdGhlIGByZXNvbHZlYCBmdW5jdGlvbiBiZWNhdXNlIGl0IGhhbmRsZXMgYm90aCBmdWxseVxuICAgIC8vIG5vbi10aGVuYWJsZSB2YWx1ZXMgYW5kIG90aGVyIHRoZW5hYmxlcyBncmFjZWZ1bGx5LlxuICAgIHZhciBtZXNzYWdlcyA9IFtdLCBwcm9ncmVzc0xpc3RlbmVycyA9IFtdLCByZXNvbHZlZFByb21pc2U7XG5cbiAgICB2YXIgZGVmZXJyZWQgPSBvYmplY3RfY3JlYXRlKGRlZmVyLnByb3RvdHlwZSk7XG4gICAgdmFyIHByb21pc2UgPSBvYmplY3RfY3JlYXRlKFByb21pc2UucHJvdG90eXBlKTtcblxuICAgIHByb21pc2UucHJvbWlzZURpc3BhdGNoID0gZnVuY3Rpb24gKHJlc29sdmUsIG9wLCBvcGVyYW5kcykge1xuICAgICAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgICAgIGlmIChtZXNzYWdlcykge1xuICAgICAgICAgICAgbWVzc2FnZXMucHVzaChhcmdzKTtcbiAgICAgICAgICAgIGlmIChvcCA9PT0gXCJ3aGVuXCIgJiYgb3BlcmFuZHNbMV0pIHsgLy8gcHJvZ3Jlc3Mgb3BlcmFuZFxuICAgICAgICAgICAgICAgIHByb2dyZXNzTGlzdGVuZXJzLnB1c2gob3BlcmFuZHNbMV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgUS5uZXh0VGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZWRQcm9taXNlLnByb21pc2VEaXNwYXRjaC5hcHBseShyZXNvbHZlZFByb21pc2UsIGFyZ3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gWFhYIGRlcHJlY2F0ZWRcbiAgICBwcm9taXNlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChtZXNzYWdlcykge1xuICAgICAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5lYXJlclZhbHVlID0gbmVhcmVyKHJlc29sdmVkUHJvbWlzZSk7XG4gICAgICAgIGlmIChpc1Byb21pc2UobmVhcmVyVmFsdWUpKSB7XG4gICAgICAgICAgICByZXNvbHZlZFByb21pc2UgPSBuZWFyZXJWYWx1ZTsgLy8gc2hvcnRlbiBjaGFpblxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZWFyZXJWYWx1ZTtcbiAgICB9O1xuXG4gICAgcHJvbWlzZS5pbnNwZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgc3RhdGU6IFwicGVuZGluZ1wiIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc29sdmVkUHJvbWlzZS5pbnNwZWN0KCk7XG4gICAgfTtcblxuICAgIGlmIChRLmxvbmdTdGFja1N1cHBvcnQgJiYgaGFzU3RhY2tzKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgLy8gTk9URTogZG9uJ3QgdHJ5IHRvIHVzZSBgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2VgIG9yIHRyYW5zZmVyIHRoZVxuICAgICAgICAgICAgLy8gYWNjZXNzb3IgYXJvdW5kOyB0aGF0IGNhdXNlcyBtZW1vcnkgbGVha3MgYXMgcGVyIEdILTExMS4gSnVzdFxuICAgICAgICAgICAgLy8gcmVpZnkgdGhlIHN0YWNrIHRyYWNlIGFzIGEgc3RyaW5nIEFTQVAuXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgLy8gQXQgdGhlIHNhbWUgdGltZSwgY3V0IG9mZiB0aGUgZmlyc3QgbGluZTsgaXQncyBhbHdheXMganVzdFxuICAgICAgICAgICAgLy8gXCJbb2JqZWN0IFByb21pc2VdXFxuXCIsIGFzIHBlciB0aGUgYHRvU3RyaW5nYC5cbiAgICAgICAgICAgIHByb21pc2Uuc3RhY2sgPSBlLnN0YWNrLnN1YnN0cmluZyhlLnN0YWNrLmluZGV4T2YoXCJcXG5cIikgKyAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5PVEU6IHdlIGRvIHRoZSBjaGVja3MgZm9yIGByZXNvbHZlZFByb21pc2VgIGluIGVhY2ggbWV0aG9kLCBpbnN0ZWFkIG9mXG4gICAgLy8gY29uc29saWRhdGluZyB0aGVtIGludG8gYGJlY29tZWAsIHNpbmNlIG90aGVyd2lzZSB3ZSdkIGNyZWF0ZSBuZXdcbiAgICAvLyBwcm9taXNlcyB3aXRoIHRoZSBsaW5lcyBgYmVjb21lKHdoYXRldmVyKHZhbHVlKSlgLiBTZWUgZS5nLiBHSC0yNTIuXG5cbiAgICBmdW5jdGlvbiBiZWNvbWUobmV3UHJvbWlzZSkge1xuICAgICAgICByZXNvbHZlZFByb21pc2UgPSBuZXdQcm9taXNlO1xuICAgICAgICBwcm9taXNlLnNvdXJjZSA9IG5ld1Byb21pc2U7XG5cbiAgICAgICAgYXJyYXlfcmVkdWNlKG1lc3NhZ2VzLCBmdW5jdGlvbiAodW5kZWZpbmVkLCBtZXNzYWdlKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBuZXdQcm9taXNlLnByb21pc2VEaXNwYXRjaC5hcHBseShuZXdQcm9taXNlLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCB2b2lkIDApO1xuXG4gICAgICAgIG1lc3NhZ2VzID0gdm9pZCAwO1xuICAgICAgICBwcm9ncmVzc0xpc3RlbmVycyA9IHZvaWQgMDtcbiAgICB9XG5cbiAgICBkZWZlcnJlZC5wcm9taXNlID0gcHJvbWlzZTtcbiAgICBkZWZlcnJlZC5yZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmIChyZXNvbHZlZFByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGJlY29tZShRKHZhbHVlKSk7XG4gICAgfTtcblxuICAgIGRlZmVycmVkLmZ1bGZpbGwgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVjb21lKGZ1bGZpbGwodmFsdWUpKTtcbiAgICB9O1xuICAgIGRlZmVycmVkLnJlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICAgICAgaWYgKHJlc29sdmVkUHJvbWlzZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgYmVjb21lKHJlamVjdChyZWFzb24pKTtcbiAgICB9O1xuICAgIGRlZmVycmVkLm5vdGlmeSA9IGZ1bmN0aW9uIChwcm9ncmVzcykge1xuICAgICAgICBpZiAocmVzb2x2ZWRQcm9taXNlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBhcnJheV9yZWR1Y2UocHJvZ3Jlc3NMaXN0ZW5lcnMsIGZ1bmN0aW9uICh1bmRlZmluZWQsIHByb2dyZXNzTGlzdGVuZXIpIHtcbiAgICAgICAgICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHByb2dyZXNzTGlzdGVuZXIocHJvZ3Jlc3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIHZvaWQgMCk7XG4gICAgfTtcblxuICAgIHJldHVybiBkZWZlcnJlZDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgTm9kZS1zdHlsZSBjYWxsYmFjayB0aGF0IHdpbGwgcmVzb2x2ZSBvciByZWplY3QgdGhlIGRlZmVycmVkXG4gKiBwcm9taXNlLlxuICogQHJldHVybnMgYSBub2RlYmFja1xuICovXG5kZWZlci5wcm90b3R5cGUubWFrZU5vZGVSZXNvbHZlciA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChlcnJvciwgdmFsdWUpIHtcbiAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICBzZWxmLnJlamVjdChlcnJvcik7XG4gICAgICAgIH0gZWxzZSBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICAgIHNlbGYucmVzb2x2ZShhcnJheV9zbGljZShhcmd1bWVudHMsIDEpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYucmVzb2x2ZSh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuLyoqXG4gKiBAcGFyYW0gcmVzb2x2ZXIge0Z1bmN0aW9ufSBhIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBub3RoaW5nIGFuZCBhY2NlcHRzXG4gKiB0aGUgcmVzb2x2ZSwgcmVqZWN0LCBhbmQgbm90aWZ5IGZ1bmN0aW9ucyBmb3IgYSBkZWZlcnJlZC5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSB0aGF0IG1heSBiZSByZXNvbHZlZCB3aXRoIHRoZSBnaXZlbiByZXNvbHZlIGFuZCByZWplY3RcbiAqIGZ1bmN0aW9ucywgb3IgcmVqZWN0ZWQgYnkgYSB0aHJvd24gZXhjZXB0aW9uIGluIHJlc29sdmVyXG4gKi9cblEuUHJvbWlzZSA9IHByb21pc2U7IC8vIEVTNlxuUS5wcm9taXNlID0gcHJvbWlzZTtcbmZ1bmN0aW9uIHByb21pc2UocmVzb2x2ZXIpIHtcbiAgICBpZiAodHlwZW9mIHJlc29sdmVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcInJlc29sdmVyIG11c3QgYmUgYSBmdW5jdGlvbi5cIik7XG4gICAgfVxuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdHJ5IHtcbiAgICAgICAgcmVzb2x2ZXIoZGVmZXJyZWQucmVzb2x2ZSwgZGVmZXJyZWQucmVqZWN0LCBkZWZlcnJlZC5ub3RpZnkpO1xuICAgIH0gY2F0Y2ggKHJlYXNvbikge1xuICAgICAgICBkZWZlcnJlZC5yZWplY3QocmVhc29uKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59XG5cbnByb21pc2UucmFjZSA9IHJhY2U7IC8vIEVTNlxucHJvbWlzZS5hbGwgPSBhbGw7IC8vIEVTNlxucHJvbWlzZS5yZWplY3QgPSByZWplY3Q7IC8vIEVTNlxucHJvbWlzZS5yZXNvbHZlID0gUTsgLy8gRVM2XG5cbi8vIFhYWCBleHBlcmltZW50YWwuICBUaGlzIG1ldGhvZCBpcyBhIHdheSB0byBkZW5vdGUgdGhhdCBhIGxvY2FsIHZhbHVlIGlzXG4vLyBzZXJpYWxpemFibGUgYW5kIHNob3VsZCBiZSBpbW1lZGlhdGVseSBkaXNwYXRjaGVkIHRvIGEgcmVtb3RlIHVwb24gcmVxdWVzdCxcbi8vIGluc3RlYWQgb2YgcGFzc2luZyBhIHJlZmVyZW5jZS5cblEucGFzc0J5Q29weSA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgICAvL2ZyZWV6ZShvYmplY3QpO1xuICAgIC8vcGFzc0J5Q29waWVzLnNldChvYmplY3QsIHRydWUpO1xuICAgIHJldHVybiBvYmplY3Q7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5wYXNzQnlDb3B5ID0gZnVuY3Rpb24gKCkge1xuICAgIC8vZnJlZXplKG9iamVjdCk7XG4gICAgLy9wYXNzQnlDb3BpZXMuc2V0KG9iamVjdCwgdHJ1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIElmIHR3byBwcm9taXNlcyBldmVudHVhbGx5IGZ1bGZpbGwgdG8gdGhlIHNhbWUgdmFsdWUsIHByb21pc2VzIHRoYXQgdmFsdWUsXG4gKiBidXQgb3RoZXJ3aXNlIHJlamVjdHMuXG4gKiBAcGFyYW0geCB7QW55Kn1cbiAqIEBwYXJhbSB5IHtBbnkqfVxuICogQHJldHVybnMge0FueSp9IGEgcHJvbWlzZSBmb3IgeCBhbmQgeSBpZiB0aGV5IGFyZSB0aGUgc2FtZSwgYnV0IGEgcmVqZWN0aW9uXG4gKiBvdGhlcndpc2UuXG4gKlxuICovXG5RLmpvaW4gPSBmdW5jdGlvbiAoeCwgeSkge1xuICAgIHJldHVybiBRKHgpLmpvaW4oeSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5qb2luID0gZnVuY3Rpb24gKHRoYXQpIHtcbiAgICByZXR1cm4gUShbdGhpcywgdGhhdF0pLnNwcmVhZChmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICBpZiAoeCA9PT0geSkge1xuICAgICAgICAgICAgLy8gVE9ETzogXCI9PT1cIiBzaG91bGQgYmUgT2JqZWN0LmlzIG9yIGVxdWl2XG4gICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IGpvaW46IG5vdCB0aGUgc2FtZTogXCIgKyB4ICsgXCIgXCIgKyB5KTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIGZpcnN0IG9mIGFuIGFycmF5IG9mIHByb21pc2VzIHRvIGJlY29tZSBzZXR0bGVkLlxuICogQHBhcmFtIGFuc3dlcnMge0FycmF5W0FueSpdfSBwcm9taXNlcyB0byByYWNlXG4gKiBAcmV0dXJucyB7QW55Kn0gdGhlIGZpcnN0IHByb21pc2UgdG8gYmUgc2V0dGxlZFxuICovXG5RLnJhY2UgPSByYWNlO1xuZnVuY3Rpb24gcmFjZShhbnN3ZXJQcykge1xuICAgIHJldHVybiBwcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgLy8gU3dpdGNoIHRvIHRoaXMgb25jZSB3ZSBjYW4gYXNzdW1lIGF0IGxlYXN0IEVTNVxuICAgICAgICAvLyBhbnN3ZXJQcy5mb3JFYWNoKGZ1bmN0aW9uIChhbnN3ZXJQKSB7XG4gICAgICAgIC8vICAgICBRKGFuc3dlclApLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgLy8gfSk7XG4gICAgICAgIC8vIFVzZSB0aGlzIGluIHRoZSBtZWFudGltZVxuICAgICAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYW5zd2VyUHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIFEoYW5zd2VyUHNbaV0pLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5yYWNlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oUS5yYWNlKTtcbn07XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIFByb21pc2Ugd2l0aCBhIHByb21pc2UgZGVzY3JpcHRvciBvYmplY3QgYW5kIG9wdGlvbmFsIGZhbGxiYWNrXG4gKiBmdW5jdGlvbi4gIFRoZSBkZXNjcmlwdG9yIGNvbnRhaW5zIG1ldGhvZHMgbGlrZSB3aGVuKHJlamVjdGVkKSwgZ2V0KG5hbWUpLFxuICogc2V0KG5hbWUsIHZhbHVlKSwgcG9zdChuYW1lLCBhcmdzKSwgYW5kIGRlbGV0ZShuYW1lKSwgd2hpY2ggYWxsXG4gKiByZXR1cm4gZWl0aGVyIGEgdmFsdWUsIGEgcHJvbWlzZSBmb3IgYSB2YWx1ZSwgb3IgYSByZWplY3Rpb24uICBUaGUgZmFsbGJhY2tcbiAqIGFjY2VwdHMgdGhlIG9wZXJhdGlvbiBuYW1lLCBhIHJlc29sdmVyLCBhbmQgYW55IGZ1cnRoZXIgYXJndW1lbnRzIHRoYXQgd291bGRcbiAqIGhhdmUgYmVlbiBmb3J3YXJkZWQgdG8gdGhlIGFwcHJvcHJpYXRlIG1ldGhvZCBhYm92ZSBoYWQgYSBtZXRob2QgYmVlblxuICogcHJvdmlkZWQgd2l0aCB0aGUgcHJvcGVyIG5hbWUuICBUaGUgQVBJIG1ha2VzIG5vIGd1YXJhbnRlZXMgYWJvdXQgdGhlIG5hdHVyZVxuICogb2YgdGhlIHJldHVybmVkIG9iamVjdCwgYXBhcnQgZnJvbSB0aGF0IGl0IGlzIHVzYWJsZSB3aGVyZWV2ZXIgcHJvbWlzZXMgYXJlXG4gKiBib3VnaHQgYW5kIHNvbGQuXG4gKi9cblEubWFrZVByb21pc2UgPSBQcm9taXNlO1xuZnVuY3Rpb24gUHJvbWlzZShkZXNjcmlwdG9yLCBmYWxsYmFjaywgaW5zcGVjdCkge1xuICAgIGlmIChmYWxsYmFjayA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGZhbGxiYWNrID0gZnVuY3Rpb24gKG9wKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgICBcIlByb21pc2UgZG9lcyBub3Qgc3VwcG9ydCBvcGVyYXRpb246IFwiICsgb3BcbiAgICAgICAgICAgICkpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAoaW5zcGVjdCA9PT0gdm9pZCAwKSB7XG4gICAgICAgIGluc3BlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4ge3N0YXRlOiBcInVua25vd25cIn07XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIHByb21pc2UgPSBvYmplY3RfY3JlYXRlKFByb21pc2UucHJvdG90eXBlKTtcblxuICAgIHByb21pc2UucHJvbWlzZURpc3BhdGNoID0gZnVuY3Rpb24gKHJlc29sdmUsIG9wLCBhcmdzKSB7XG4gICAgICAgIHZhciByZXN1bHQ7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBpZiAoZGVzY3JpcHRvcltvcF0pIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBkZXNjcmlwdG9yW29wXS5hcHBseShwcm9taXNlLCBhcmdzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gZmFsbGJhY2suY2FsbChwcm9taXNlLCBvcCwgYXJncyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgcmVzdWx0ID0gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlc29sdmUpIHtcbiAgICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBwcm9taXNlLmluc3BlY3QgPSBpbnNwZWN0O1xuXG4gICAgLy8gWFhYIGRlcHJlY2F0ZWQgYHZhbHVlT2ZgIGFuZCBgZXhjZXB0aW9uYCBzdXBwb3J0XG4gICAgaWYgKGluc3BlY3QpIHtcbiAgICAgICAgdmFyIGluc3BlY3RlZCA9IGluc3BlY3QoKTtcbiAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiKSB7XG4gICAgICAgICAgICBwcm9taXNlLmV4Y2VwdGlvbiA9IGluc3BlY3RlZC5yZWFzb247XG4gICAgICAgIH1cblxuICAgICAgICBwcm9taXNlLnZhbHVlT2YgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgaW5zcGVjdGVkID0gaW5zcGVjdCgpO1xuICAgICAgICAgICAgaWYgKGluc3BlY3RlZC5zdGF0ZSA9PT0gXCJwZW5kaW5nXCIgfHxcbiAgICAgICAgICAgICAgICBpbnNwZWN0ZWQuc3RhdGUgPT09IFwicmVqZWN0ZWRcIikge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGluc3BlY3RlZC52YWx1ZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJvbWlzZTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIFwiW29iamVjdCBQcm9taXNlXVwiO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlbiA9IGZ1bmN0aW9uIChmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIGRvbmUgPSBmYWxzZTsgICAvLyBlbnN1cmUgdGhlIHVudHJ1c3RlZCBwcm9taXNlIG1ha2VzIGF0IG1vc3QgYVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2luZ2xlIGNhbGwgdG8gb25lIG9mIHRoZSBjYWxsYmFja3NcblxuICAgIGZ1bmN0aW9uIF9mdWxmaWxsZWQodmFsdWUpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiB0eXBlb2YgZnVsZmlsbGVkID09PSBcImZ1bmN0aW9uXCIgPyBmdWxmaWxsZWQodmFsdWUpIDogdmFsdWU7XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdChleGNlcHRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3JlamVjdGVkKGV4Y2VwdGlvbikge1xuICAgICAgICBpZiAodHlwZW9mIHJlamVjdGVkID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIG1ha2VTdGFja1RyYWNlTG9uZyhleGNlcHRpb24sIHNlbGYpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKG5ld0V4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QobmV3RXhjZXB0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gX3Byb2dyZXNzZWQodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiBwcm9ncmVzc2VkID09PSBcImZ1bmN0aW9uXCIgPyBwcm9ncmVzc2VkKHZhbHVlKSA6IHZhbHVlO1xuICAgIH1cblxuICAgIFEubmV4dFRpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBzZWxmLnByb21pc2VEaXNwYXRjaChmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoX2Z1bGZpbGxlZCh2YWx1ZSkpO1xuICAgICAgICB9LCBcIndoZW5cIiwgW2Z1bmN0aW9uIChleGNlcHRpb24pIHtcbiAgICAgICAgICAgIGlmIChkb25lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoX3JlamVjdGVkKGV4Y2VwdGlvbikpO1xuICAgICAgICB9XSk7XG4gICAgfSk7XG5cbiAgICAvLyBQcm9ncmVzcyBwcm9wYWdhdG9yIG5lZWQgdG8gYmUgYXR0YWNoZWQgaW4gdGhlIGN1cnJlbnQgdGljay5cbiAgICBzZWxmLnByb21pc2VEaXNwYXRjaCh2b2lkIDAsIFwid2hlblwiLCBbdm9pZCAwLCBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIG5ld1ZhbHVlO1xuICAgICAgICB2YXIgdGhyZXcgPSBmYWxzZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIG5ld1ZhbHVlID0gX3Byb2dyZXNzZWQodmFsdWUpO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICB0aHJldyA9IHRydWU7XG4gICAgICAgICAgICBpZiAoUS5vbmVycm9yKSB7XG4gICAgICAgICAgICAgICAgUS5vbmVycm9yKGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aHJldykge1xuICAgICAgICAgICAgZGVmZXJyZWQubm90aWZ5KG5ld1ZhbHVlKTtcbiAgICAgICAgfVxuICAgIH1dKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuUS50YXAgPSBmdW5jdGlvbiAocHJvbWlzZSwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50YXAoY2FsbGJhY2spO1xufTtcblxuLyoqXG4gKiBXb3JrcyBhbG1vc3QgbGlrZSBcImZpbmFsbHlcIiwgYnV0IG5vdCBjYWxsZWQgZm9yIHJlamVjdGlvbnMuXG4gKiBPcmlnaW5hbCByZXNvbHV0aW9uIHZhbHVlIGlzIHBhc3NlZCB0aHJvdWdoIGNhbGxiYWNrIHVuYWZmZWN0ZWQuXG4gKiBDYWxsYmFjayBtYXkgcmV0dXJuIGEgcHJvbWlzZSB0aGF0IHdpbGwgYmUgYXdhaXRlZCBmb3IuXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFja1xuICogQHJldHVybnMge1EuUHJvbWlzZX1cbiAqIEBleGFtcGxlXG4gKiBkb1NvbWV0aGluZygpXG4gKiAgIC50aGVuKC4uLilcbiAqICAgLnRhcChjb25zb2xlLmxvZylcbiAqICAgLnRoZW4oLi4uKTtcbiAqL1xuUHJvbWlzZS5wcm90b3R5cGUudGFwID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgY2FsbGJhY2sgPSBRKGNhbGxiYWNrKTtcblxuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCh2YWx1ZSkudGhlblJlc29sdmUodmFsdWUpO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBSZWdpc3RlcnMgYW4gb2JzZXJ2ZXIgb24gYSBwcm9taXNlLlxuICpcbiAqIEd1YXJhbnRlZXM6XG4gKlxuICogMS4gdGhhdCBmdWxmaWxsZWQgYW5kIHJlamVjdGVkIHdpbGwgYmUgY2FsbGVkIG9ubHkgb25jZS5cbiAqIDIuIHRoYXQgZWl0aGVyIHRoZSBmdWxmaWxsZWQgY2FsbGJhY2sgb3IgdGhlIHJlamVjdGVkIGNhbGxiYWNrIHdpbGwgYmVcbiAqICAgIGNhbGxlZCwgYnV0IG5vdCBib3RoLlxuICogMy4gdGhhdCBmdWxmaWxsZWQgYW5kIHJlamVjdGVkIHdpbGwgbm90IGJlIGNhbGxlZCBpbiB0aGlzIHR1cm4uXG4gKlxuICogQHBhcmFtIHZhbHVlICAgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIHRvIG9ic2VydmVcbiAqIEBwYXJhbSBmdWxmaWxsZWQgIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aXRoIHRoZSBmdWxmaWxsZWQgdmFsdWVcbiAqIEBwYXJhbSByZWplY3RlZCAgIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aXRoIHRoZSByZWplY3Rpb24gZXhjZXB0aW9uXG4gKiBAcGFyYW0gcHJvZ3Jlc3NlZCBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gYW55IHByb2dyZXNzIG5vdGlmaWNhdGlvbnNcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBmcm9tIHRoZSBpbnZva2VkIGNhbGxiYWNrXG4gKi9cblEud2hlbiA9IHdoZW47XG5mdW5jdGlvbiB3aGVuKHZhbHVlLCBmdWxmaWxsZWQsIHJlamVjdGVkLCBwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIFEodmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3NlZCk7XG59XG5cblByb21pc2UucHJvdG90eXBlLnRoZW5SZXNvbHZlID0gZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAoKSB7IHJldHVybiB2YWx1ZTsgfSk7XG59O1xuXG5RLnRoZW5SZXNvbHZlID0gZnVuY3Rpb24gKHByb21pc2UsIHZhbHVlKSB7XG4gICAgcmV0dXJuIFEocHJvbWlzZSkudGhlblJlc29sdmUodmFsdWUpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGhlblJlamVjdCA9IGZ1bmN0aW9uIChyZWFzb24pIHtcbiAgICByZXR1cm4gdGhpcy50aGVuKGZ1bmN0aW9uICgpIHsgdGhyb3cgcmVhc29uOyB9KTtcbn07XG5cblEudGhlblJlamVjdCA9IGZ1bmN0aW9uIChwcm9taXNlLCByZWFzb24pIHtcbiAgICByZXR1cm4gUShwcm9taXNlKS50aGVuUmVqZWN0KHJlYXNvbik7XG59O1xuXG4vKipcbiAqIElmIGFuIG9iamVjdCBpcyBub3QgYSBwcm9taXNlLCBpdCBpcyBhcyBcIm5lYXJcIiBhcyBwb3NzaWJsZS5cbiAqIElmIGEgcHJvbWlzZSBpcyByZWplY3RlZCwgaXQgaXMgYXMgXCJuZWFyXCIgYXMgcG9zc2libGUgdG9vLlxuICogSWYgaXTigJlzIGEgZnVsZmlsbGVkIHByb21pc2UsIHRoZSBmdWxmaWxsbWVudCB2YWx1ZSBpcyBuZWFyZXIuXG4gKiBJZiBpdOKAmXMgYSBkZWZlcnJlZCBwcm9taXNlIGFuZCB0aGUgZGVmZXJyZWQgaGFzIGJlZW4gcmVzb2x2ZWQsIHRoZVxuICogcmVzb2x1dGlvbiBpcyBcIm5lYXJlclwiLlxuICogQHBhcmFtIG9iamVjdFxuICogQHJldHVybnMgbW9zdCByZXNvbHZlZCAobmVhcmVzdCkgZm9ybSBvZiB0aGUgb2JqZWN0XG4gKi9cblxuLy8gWFhYIHNob3VsZCB3ZSByZS1kbyB0aGlzP1xuUS5uZWFyZXIgPSBuZWFyZXI7XG5mdW5jdGlvbiBuZWFyZXIodmFsdWUpIHtcbiAgICBpZiAoaXNQcm9taXNlKHZhbHVlKSkge1xuICAgICAgICB2YXIgaW5zcGVjdGVkID0gdmFsdWUuaW5zcGVjdCgpO1xuICAgICAgICBpZiAoaW5zcGVjdGVkLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5zcGVjdGVkLnZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSBwcm9taXNlLlxuICogT3RoZXJ3aXNlIGl0IGlzIGEgZnVsZmlsbGVkIHZhbHVlLlxuICovXG5RLmlzUHJvbWlzZSA9IGlzUHJvbWlzZTtcbmZ1bmN0aW9uIGlzUHJvbWlzZShvYmplY3QpIHtcbiAgICByZXR1cm4gb2JqZWN0IGluc3RhbmNlb2YgUHJvbWlzZTtcbn1cblxuUS5pc1Byb21pc2VBbGlrZSA9IGlzUHJvbWlzZUFsaWtlO1xuZnVuY3Rpb24gaXNQcm9taXNlQWxpa2Uob2JqZWN0KSB7XG4gICAgcmV0dXJuIGlzT2JqZWN0KG9iamVjdCkgJiYgdHlwZW9mIG9iamVjdC50aGVuID09PSBcImZ1bmN0aW9uXCI7XG59XG5cbi8qKlxuICogQHJldHVybnMgd2hldGhlciB0aGUgZ2l2ZW4gb2JqZWN0IGlzIGEgcGVuZGluZyBwcm9taXNlLCBtZWFuaW5nIG5vdFxuICogZnVsZmlsbGVkIG9yIHJlamVjdGVkLlxuICovXG5RLmlzUGVuZGluZyA9IGlzUGVuZGluZztcbmZ1bmN0aW9uIGlzUGVuZGluZyhvYmplY3QpIHtcbiAgICByZXR1cm4gaXNQcm9taXNlKG9iamVjdCkgJiYgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJwZW5kaW5nXCI7XG59XG5cblByb21pc2UucHJvdG90eXBlLmlzUGVuZGluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnNwZWN0KCkuc3RhdGUgPT09IFwicGVuZGluZ1wiO1xufTtcblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSB2YWx1ZSBvciBmdWxmaWxsZWRcbiAqIHByb21pc2UuXG4gKi9cblEuaXNGdWxmaWxsZWQgPSBpc0Z1bGZpbGxlZDtcbmZ1bmN0aW9uIGlzRnVsZmlsbGVkKG9iamVjdCkge1xuICAgIHJldHVybiAhaXNQcm9taXNlKG9iamVjdCkgfHwgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIjtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuaXNGdWxmaWxsZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW5zcGVjdCgpLnN0YXRlID09PSBcImZ1bGZpbGxlZFwiO1xufTtcblxuLyoqXG4gKiBAcmV0dXJucyB3aGV0aGVyIHRoZSBnaXZlbiBvYmplY3QgaXMgYSByZWplY3RlZCBwcm9taXNlLlxuICovXG5RLmlzUmVqZWN0ZWQgPSBpc1JlamVjdGVkO1xuZnVuY3Rpb24gaXNSZWplY3RlZChvYmplY3QpIHtcbiAgICByZXR1cm4gaXNQcm9taXNlKG9iamVjdCkgJiYgb2JqZWN0Lmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5pc1JlamVjdGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmluc3BlY3QoKS5zdGF0ZSA9PT0gXCJyZWplY3RlZFwiO1xufTtcblxuLy8vLyBCRUdJTiBVTkhBTkRMRUQgUkVKRUNUSU9OIFRSQUNLSU5HXG5cbi8vIFRoaXMgcHJvbWlzZSBsaWJyYXJ5IGNvbnN1bWVzIGV4Y2VwdGlvbnMgdGhyb3duIGluIGhhbmRsZXJzIHNvIHRoZXkgY2FuIGJlXG4vLyBoYW5kbGVkIGJ5IGEgc3Vic2VxdWVudCBwcm9taXNlLiAgVGhlIGV4Y2VwdGlvbnMgZ2V0IGFkZGVkIHRvIHRoaXMgYXJyYXkgd2hlblxuLy8gdGhleSBhcmUgY3JlYXRlZCwgYW5kIHJlbW92ZWQgd2hlbiB0aGV5IGFyZSBoYW5kbGVkLiAgTm90ZSB0aGF0IGluIEVTNiBvclxuLy8gc2hpbW1lZCBlbnZpcm9ubWVudHMsIHRoaXMgd291bGQgbmF0dXJhbGx5IGJlIGEgYFNldGAuXG52YXIgdW5oYW5kbGVkUmVhc29ucyA9IFtdO1xudmFyIHVuaGFuZGxlZFJlamVjdGlvbnMgPSBbXTtcbnZhciByZXBvcnRlZFVuaGFuZGxlZFJlamVjdGlvbnMgPSBbXTtcbnZhciB0cmFja1VuaGFuZGxlZFJlamVjdGlvbnMgPSB0cnVlO1xuXG5mdW5jdGlvbiByZXNldFVuaGFuZGxlZFJlamVjdGlvbnMoKSB7XG4gICAgdW5oYW5kbGVkUmVhc29ucy5sZW5ndGggPSAwO1xuICAgIHVuaGFuZGxlZFJlamVjdGlvbnMubGVuZ3RoID0gMDtcblxuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IHRydWU7XG4gICAgfVxufVxuXG5mdW5jdGlvbiB0cmFja1JlamVjdGlvbihwcm9taXNlLCByZWFzb24pIHtcbiAgICBpZiAoIXRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgcHJvY2Vzcy5lbWl0ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgUS5uZXh0VGljay5ydW5BZnRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoYXJyYXlfaW5kZXhPZih1bmhhbmRsZWRSZWplY3Rpb25zLCBwcm9taXNlKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzLmVtaXQoXCJ1bmhhbmRsZWRSZWplY3Rpb25cIiwgcmVhc29uLCBwcm9taXNlKTtcbiAgICAgICAgICAgICAgICByZXBvcnRlZFVuaGFuZGxlZFJlamVjdGlvbnMucHVzaChwcm9taXNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdW5oYW5kbGVkUmVqZWN0aW9ucy5wdXNoKHByb21pc2UpO1xuICAgIGlmIChyZWFzb24gJiYgdHlwZW9mIHJlYXNvbi5zdGFjayAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2gocmVhc29uLnN0YWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB1bmhhbmRsZWRSZWFzb25zLnB1c2goXCIobm8gc3RhY2spIFwiICsgcmVhc29uKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHVudHJhY2tSZWplY3Rpb24ocHJvbWlzZSkge1xuICAgIGlmICghdHJhY2tVbmhhbmRsZWRSZWplY3Rpb25zKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgYXQgPSBhcnJheV9pbmRleE9mKHVuaGFuZGxlZFJlamVjdGlvbnMsIHByb21pc2UpO1xuICAgIGlmIChhdCAhPT0gLTEpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBwcm9jZXNzLmVtaXQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgUS5uZXh0VGljay5ydW5BZnRlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGF0UmVwb3J0ID0gYXJyYXlfaW5kZXhPZihyZXBvcnRlZFVuaGFuZGxlZFJlamVjdGlvbnMsIHByb21pc2UpO1xuICAgICAgICAgICAgICAgIGlmIChhdFJlcG9ydCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5lbWl0KFwicmVqZWN0aW9uSGFuZGxlZFwiLCB1bmhhbmRsZWRSZWFzb25zW2F0XSwgcHJvbWlzZSk7XG4gICAgICAgICAgICAgICAgICAgIHJlcG9ydGVkVW5oYW5kbGVkUmVqZWN0aW9ucy5zcGxpY2UoYXRSZXBvcnQsIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHVuaGFuZGxlZFJlamVjdGlvbnMuc3BsaWNlKGF0LCAxKTtcbiAgICAgICAgdW5oYW5kbGVkUmVhc29ucy5zcGxpY2UoYXQsIDEpO1xuICAgIH1cbn1cblxuUS5yZXNldFVuaGFuZGxlZFJlamVjdGlvbnMgPSByZXNldFVuaGFuZGxlZFJlamVjdGlvbnM7XG5cblEuZ2V0VW5oYW5kbGVkUmVhc29ucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBNYWtlIGEgY29weSBzbyB0aGF0IGNvbnN1bWVycyBjYW4ndCBpbnRlcmZlcmUgd2l0aCBvdXIgaW50ZXJuYWwgc3RhdGUuXG4gICAgcmV0dXJuIHVuaGFuZGxlZFJlYXNvbnMuc2xpY2UoKTtcbn07XG5cblEuc3RvcFVuaGFuZGxlZFJlamVjdGlvblRyYWNraW5nID0gZnVuY3Rpb24gKCkge1xuICAgIHJlc2V0VW5oYW5kbGVkUmVqZWN0aW9ucygpO1xuICAgIHRyYWNrVW5oYW5kbGVkUmVqZWN0aW9ucyA9IGZhbHNlO1xufTtcblxucmVzZXRVbmhhbmRsZWRSZWplY3Rpb25zKCk7XG5cbi8vLy8gRU5EIFVOSEFORExFRCBSRUpFQ1RJT04gVFJBQ0tJTkdcblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgcmVqZWN0ZWQgcHJvbWlzZS5cbiAqIEBwYXJhbSByZWFzb24gdmFsdWUgZGVzY3JpYmluZyB0aGUgZmFpbHVyZVxuICovXG5RLnJlamVjdCA9IHJlamVjdDtcbmZ1bmN0aW9uIHJlamVjdChyZWFzb24pIHtcbiAgICB2YXIgcmVqZWN0aW9uID0gUHJvbWlzZSh7XG4gICAgICAgIFwid2hlblwiOiBmdW5jdGlvbiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICAgIC8vIG5vdGUgdGhhdCB0aGUgZXJyb3IgaGFzIGJlZW4gaGFuZGxlZFxuICAgICAgICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgICAgICAgICAgdW50cmFja1JlamVjdGlvbih0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZWplY3RlZCA/IHJlamVjdGVkKHJlYXNvbikgOiB0aGlzO1xuICAgICAgICB9XG4gICAgfSwgZnVuY3Rpb24gZmFsbGJhY2soKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sIGZ1bmN0aW9uIGluc3BlY3QoKSB7XG4gICAgICAgIHJldHVybiB7IHN0YXRlOiBcInJlamVjdGVkXCIsIHJlYXNvbjogcmVhc29uIH07XG4gICAgfSk7XG5cbiAgICAvLyBOb3RlIHRoYXQgdGhlIHJlYXNvbiBoYXMgbm90IGJlZW4gaGFuZGxlZC5cbiAgICB0cmFja1JlamVjdGlvbihyZWplY3Rpb24sIHJlYXNvbik7XG5cbiAgICByZXR1cm4gcmVqZWN0aW9uO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBmdWxmaWxsZWQgcHJvbWlzZSBmb3IgYW4gaW1tZWRpYXRlIHJlZmVyZW5jZS5cbiAqIEBwYXJhbSB2YWx1ZSBpbW1lZGlhdGUgcmVmZXJlbmNlXG4gKi9cblEuZnVsZmlsbCA9IGZ1bGZpbGw7XG5mdW5jdGlvbiBmdWxmaWxsKHZhbHVlKSB7XG4gICAgcmV0dXJuIFByb21pc2Uoe1xuICAgICAgICBcIndoZW5cIjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9LFxuICAgICAgICBcImdldFwiOiBmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlW25hbWVdO1xuICAgICAgICB9LFxuICAgICAgICBcInNldFwiOiBmdW5jdGlvbiAobmFtZSwgcmhzKSB7XG4gICAgICAgICAgICB2YWx1ZVtuYW1lXSA9IHJocztcbiAgICAgICAgfSxcbiAgICAgICAgXCJkZWxldGVcIjogZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB2YWx1ZVtuYW1lXTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJwb3N0XCI6IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgICAgICAgICAvLyBNYXJrIE1pbGxlciBwcm9wb3NlcyB0aGF0IHBvc3Qgd2l0aCBubyBuYW1lIHNob3VsZCBhcHBseSBhXG4gICAgICAgICAgICAvLyBwcm9taXNlZCBmdW5jdGlvbi5cbiAgICAgICAgICAgIGlmIChuYW1lID09PSBudWxsIHx8IG5hbWUgPT09IHZvaWQgMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZS5hcHBseSh2b2lkIDAsIGFyZ3MpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVbbmFtZV0uYXBwbHkodmFsdWUsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBcImFwcGx5XCI6IGZ1bmN0aW9uICh0aGlzcCwgYXJncykge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlLmFwcGx5KHRoaXNwLCBhcmdzKTtcbiAgICAgICAgfSxcbiAgICAgICAgXCJrZXlzXCI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBvYmplY3Rfa2V5cyh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICB9LCB2b2lkIDAsIGZ1bmN0aW9uIGluc3BlY3QoKSB7XG4gICAgICAgIHJldHVybiB7IHN0YXRlOiBcImZ1bGZpbGxlZFwiLCB2YWx1ZTogdmFsdWUgfTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyB0aGVuYWJsZXMgdG8gUSBwcm9taXNlcy5cbiAqIEBwYXJhbSBwcm9taXNlIHRoZW5hYmxlIHByb21pc2VcbiAqIEByZXR1cm5zIGEgUSBwcm9taXNlXG4gKi9cbmZ1bmN0aW9uIGNvZXJjZShwcm9taXNlKSB7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHByb21pc2UudGhlbihkZWZlcnJlZC5yZXNvbHZlLCBkZWZlcnJlZC5yZWplY3QsIGRlZmVycmVkLm5vdGlmeSk7XG4gICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn1cblxuLyoqXG4gKiBBbm5vdGF0ZXMgYW4gb2JqZWN0IHN1Y2ggdGhhdCBpdCB3aWxsIG5ldmVyIGJlXG4gKiB0cmFuc2ZlcnJlZCBhd2F5IGZyb20gdGhpcyBwcm9jZXNzIG92ZXIgYW55IHByb21pc2VcbiAqIGNvbW11bmljYXRpb24gY2hhbm5lbC5cbiAqIEBwYXJhbSBvYmplY3RcbiAqIEByZXR1cm5zIHByb21pc2UgYSB3cmFwcGluZyBvZiB0aGF0IG9iamVjdCB0aGF0XG4gKiBhZGRpdGlvbmFsbHkgcmVzcG9uZHMgdG8gdGhlIFwiaXNEZWZcIiBtZXNzYWdlXG4gKiB3aXRob3V0IGEgcmVqZWN0aW9uLlxuICovXG5RLm1hc3RlciA9IG1hc3RlcjtcbmZ1bmN0aW9uIG1hc3RlcihvYmplY3QpIHtcbiAgICByZXR1cm4gUHJvbWlzZSh7XG4gICAgICAgIFwiaXNEZWZcIjogZnVuY3Rpb24gKCkge31cbiAgICB9LCBmdW5jdGlvbiBmYWxsYmFjayhvcCwgYXJncykge1xuICAgICAgICByZXR1cm4gZGlzcGF0Y2gob2JqZWN0LCBvcCwgYXJncyk7XG4gICAgfSwgZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gUShvYmplY3QpLmluc3BlY3QoKTtcbiAgICB9KTtcbn1cblxuLyoqXG4gKiBTcHJlYWRzIHRoZSB2YWx1ZXMgb2YgYSBwcm9taXNlZCBhcnJheSBvZiBhcmd1bWVudHMgaW50byB0aGVcbiAqIGZ1bGZpbGxtZW50IGNhbGxiYWNrLlxuICogQHBhcmFtIGZ1bGZpbGxlZCBjYWxsYmFjayB0aGF0IHJlY2VpdmVzIHZhcmlhZGljIGFyZ3VtZW50cyBmcm9tIHRoZVxuICogcHJvbWlzZWQgYXJyYXlcbiAqIEBwYXJhbSByZWplY3RlZCBjYWxsYmFjayB0aGF0IHJlY2VpdmVzIHRoZSBleGNlcHRpb24gaWYgdGhlIHByb21pc2VcbiAqIGlzIHJlamVjdGVkLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlIG9yIHRocm93biBleGNlcHRpb24gb2ZcbiAqIGVpdGhlciBjYWxsYmFjay5cbiAqL1xuUS5zcHJlYWQgPSBzcHJlYWQ7XG5mdW5jdGlvbiBzcHJlYWQodmFsdWUsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gUSh2YWx1ZSkuc3ByZWFkKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5zcHJlYWQgPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCkge1xuICAgIHJldHVybiB0aGlzLmFsbCgpLnRoZW4oZnVuY3Rpb24gKGFycmF5KSB7XG4gICAgICAgIHJldHVybiBmdWxmaWxsZWQuYXBwbHkodm9pZCAwLCBhcnJheSk7XG4gICAgfSwgcmVqZWN0ZWQpO1xufTtcblxuLyoqXG4gKiBUaGUgYXN5bmMgZnVuY3Rpb24gaXMgYSBkZWNvcmF0b3IgZm9yIGdlbmVyYXRvciBmdW5jdGlvbnMsIHR1cm5pbmdcbiAqIHRoZW0gaW50byBhc3luY2hyb25vdXMgZ2VuZXJhdG9ycy4gIEFsdGhvdWdoIGdlbmVyYXRvcnMgYXJlIG9ubHkgcGFydFxuICogb2YgdGhlIG5ld2VzdCBFQ01BU2NyaXB0IDYgZHJhZnRzLCB0aGlzIGNvZGUgZG9lcyBub3QgY2F1c2Ugc3ludGF4XG4gKiBlcnJvcnMgaW4gb2xkZXIgZW5naW5lcy4gIFRoaXMgY29kZSBzaG91bGQgY29udGludWUgdG8gd29yayBhbmQgd2lsbFxuICogaW4gZmFjdCBpbXByb3ZlIG92ZXIgdGltZSBhcyB0aGUgbGFuZ3VhZ2UgaW1wcm92ZXMuXG4gKlxuICogRVM2IGdlbmVyYXRvcnMgYXJlIGN1cnJlbnRseSBwYXJ0IG9mIFY4IHZlcnNpb24gMy4xOSB3aXRoIHRoZVxuICogLS1oYXJtb255LWdlbmVyYXRvcnMgcnVudGltZSBmbGFnIGVuYWJsZWQuICBTcGlkZXJNb25rZXkgaGFzIGhhZCB0aGVtXG4gKiBmb3IgbG9uZ2VyLCBidXQgdW5kZXIgYW4gb2xkZXIgUHl0aG9uLWluc3BpcmVkIGZvcm0uICBUaGlzIGZ1bmN0aW9uXG4gKiB3b3JrcyBvbiBib3RoIGtpbmRzIG9mIGdlbmVyYXRvcnMuXG4gKlxuICogRGVjb3JhdGVzIGEgZ2VuZXJhdG9yIGZ1bmN0aW9uIHN1Y2ggdGhhdDpcbiAqICAtIGl0IG1heSB5aWVsZCBwcm9taXNlc1xuICogIC0gZXhlY3V0aW9uIHdpbGwgY29udGludWUgd2hlbiB0aGF0IHByb21pc2UgaXMgZnVsZmlsbGVkXG4gKiAgLSB0aGUgdmFsdWUgb2YgdGhlIHlpZWxkIGV4cHJlc3Npb24gd2lsbCBiZSB0aGUgZnVsZmlsbGVkIHZhbHVlXG4gKiAgLSBpdCByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSAod2hlbiB0aGUgZ2VuZXJhdG9yXG4gKiAgICBzdG9wcyBpdGVyYXRpbmcpXG4gKiAgLSB0aGUgZGVjb3JhdGVkIGZ1bmN0aW9uIHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKiAgICBvZiB0aGUgZ2VuZXJhdG9yIG9yIHRoZSBmaXJzdCByZWplY3RlZCBwcm9taXNlIGFtb25nIHRob3NlXG4gKiAgICB5aWVsZGVkLlxuICogIC0gaWYgYW4gZXJyb3IgaXMgdGhyb3duIGluIHRoZSBnZW5lcmF0b3IsIGl0IHByb3BhZ2F0ZXMgdGhyb3VnaFxuICogICAgZXZlcnkgZm9sbG93aW5nIHlpZWxkIHVudGlsIGl0IGlzIGNhdWdodCwgb3IgdW50aWwgaXQgZXNjYXBlc1xuICogICAgdGhlIGdlbmVyYXRvciBmdW5jdGlvbiBhbHRvZ2V0aGVyLCBhbmQgaXMgdHJhbnNsYXRlZCBpbnRvIGFcbiAqICAgIHJlamVjdGlvbiBmb3IgdGhlIHByb21pc2UgcmV0dXJuZWQgYnkgdGhlIGRlY29yYXRlZCBnZW5lcmF0b3IuXG4gKi9cblEuYXN5bmMgPSBhc3luYztcbmZ1bmN0aW9uIGFzeW5jKG1ha2VHZW5lcmF0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyB3aGVuIHZlcmIgaXMgXCJzZW5kXCIsIGFyZyBpcyBhIHZhbHVlXG4gICAgICAgIC8vIHdoZW4gdmVyYiBpcyBcInRocm93XCIsIGFyZyBpcyBhbiBleGNlcHRpb25cbiAgICAgICAgZnVuY3Rpb24gY29udGludWVyKHZlcmIsIGFyZykge1xuICAgICAgICAgICAgdmFyIHJlc3VsdDtcblxuICAgICAgICAgICAgLy8gVW50aWwgVjggMy4xOSAvIENocm9taXVtIDI5IGlzIHJlbGVhc2VkLCBTcGlkZXJNb25rZXkgaXMgdGhlIG9ubHlcbiAgICAgICAgICAgIC8vIGVuZ2luZSB0aGF0IGhhcyBhIGRlcGxveWVkIGJhc2Ugb2YgYnJvd3NlcnMgdGhhdCBzdXBwb3J0IGdlbmVyYXRvcnMuXG4gICAgICAgICAgICAvLyBIb3dldmVyLCBTTSdzIGdlbmVyYXRvcnMgdXNlIHRoZSBQeXRob24taW5zcGlyZWQgc2VtYW50aWNzIG9mXG4gICAgICAgICAgICAvLyBvdXRkYXRlZCBFUzYgZHJhZnRzLiAgV2Ugd291bGQgbGlrZSB0byBzdXBwb3J0IEVTNiwgYnV0IHdlJ2QgYWxzb1xuICAgICAgICAgICAgLy8gbGlrZSB0byBtYWtlIGl0IHBvc3NpYmxlIHRvIHVzZSBnZW5lcmF0b3JzIGluIGRlcGxveWVkIGJyb3dzZXJzLCBzb1xuICAgICAgICAgICAgLy8gd2UgYWxzbyBzdXBwb3J0IFB5dGhvbi1zdHlsZSBnZW5lcmF0b3JzLiAgQXQgc29tZSBwb2ludCB3ZSBjYW4gcmVtb3ZlXG4gICAgICAgICAgICAvLyB0aGlzIGJsb2NrLlxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIFN0b3BJdGVyYXRpb24gPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgICAgICAvLyBFUzYgR2VuZXJhdG9yc1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGdlbmVyYXRvclt2ZXJiXShhcmcpO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQuZG9uZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gUShyZXN1bHQudmFsdWUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3aGVuKHJlc3VsdC52YWx1ZSwgY2FsbGJhY2ssIGVycmJhY2spO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gU3BpZGVyTW9ua2V5IEdlbmVyYXRvcnNcbiAgICAgICAgICAgICAgICAvLyBGSVhNRTogUmVtb3ZlIHRoaXMgY2FzZSB3aGVuIFNNIGRvZXMgRVM2IGdlbmVyYXRvcnMuXG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gZ2VuZXJhdG9yW3ZlcmJdKGFyZyk7XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc1N0b3BJdGVyYXRpb24oZXhjZXB0aW9uKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFEoZXhjZXB0aW9uLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXhjZXB0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gd2hlbihyZXN1bHQsIGNhbGxiYWNrLCBlcnJiYWNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgZ2VuZXJhdG9yID0gbWFrZUdlbmVyYXRvci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB2YXIgY2FsbGJhY2sgPSBjb250aW51ZXIuYmluZChjb250aW51ZXIsIFwibmV4dFwiKTtcbiAgICAgICAgdmFyIGVycmJhY2sgPSBjb250aW51ZXIuYmluZChjb250aW51ZXIsIFwidGhyb3dcIik7XG4gICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgIH07XG59XG5cbi8qKlxuICogVGhlIHNwYXduIGZ1bmN0aW9uIGlzIGEgc21hbGwgd3JhcHBlciBhcm91bmQgYXN5bmMgdGhhdCBpbW1lZGlhdGVseVxuICogY2FsbHMgdGhlIGdlbmVyYXRvciBhbmQgYWxzbyBlbmRzIHRoZSBwcm9taXNlIGNoYWluLCBzbyB0aGF0IGFueVxuICogdW5oYW5kbGVkIGVycm9ycyBhcmUgdGhyb3duIGluc3RlYWQgb2YgZm9yd2FyZGVkIHRvIHRoZSBlcnJvclxuICogaGFuZGxlci4gVGhpcyBpcyB1c2VmdWwgYmVjYXVzZSBpdCdzIGV4dHJlbWVseSBjb21tb24gdG8gcnVuXG4gKiBnZW5lcmF0b3JzIGF0IHRoZSB0b3AtbGV2ZWwgdG8gd29yayB3aXRoIGxpYnJhcmllcy5cbiAqL1xuUS5zcGF3biA9IHNwYXduO1xuZnVuY3Rpb24gc3Bhd24obWFrZUdlbmVyYXRvcikge1xuICAgIFEuZG9uZShRLmFzeW5jKG1ha2VHZW5lcmF0b3IpKCkpO1xufVxuXG4vLyBGSVhNRTogUmVtb3ZlIHRoaXMgaW50ZXJmYWNlIG9uY2UgRVM2IGdlbmVyYXRvcnMgYXJlIGluIFNwaWRlck1vbmtleS5cbi8qKlxuICogVGhyb3dzIGEgUmV0dXJuVmFsdWUgZXhjZXB0aW9uIHRvIHN0b3AgYW4gYXN5bmNocm9ub3VzIGdlbmVyYXRvci5cbiAqXG4gKiBUaGlzIGludGVyZmFjZSBpcyBhIHN0b3AtZ2FwIG1lYXN1cmUgdG8gc3VwcG9ydCBnZW5lcmF0b3IgcmV0dXJuXG4gKiB2YWx1ZXMgaW4gb2xkZXIgRmlyZWZveC9TcGlkZXJNb25rZXkuICBJbiBicm93c2VycyB0aGF0IHN1cHBvcnQgRVM2XG4gKiBnZW5lcmF0b3JzIGxpa2UgQ2hyb21pdW0gMjksIGp1c3QgdXNlIFwicmV0dXJuXCIgaW4geW91ciBnZW5lcmF0b3JcbiAqIGZ1bmN0aW9ucy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgdGhlIHJldHVybiB2YWx1ZSBmb3IgdGhlIHN1cnJvdW5kaW5nIGdlbmVyYXRvclxuICogQHRocm93cyBSZXR1cm5WYWx1ZSBleGNlcHRpb24gd2l0aCB0aGUgdmFsdWUuXG4gKiBAZXhhbXBsZVxuICogLy8gRVM2IHN0eWxlXG4gKiBRLmFzeW5jKGZ1bmN0aW9uKiAoKSB7XG4gKiAgICAgIHZhciBmb28gPSB5aWVsZCBnZXRGb29Qcm9taXNlKCk7XG4gKiAgICAgIHZhciBiYXIgPSB5aWVsZCBnZXRCYXJQcm9taXNlKCk7XG4gKiAgICAgIHJldHVybiBmb28gKyBiYXI7XG4gKiB9KVxuICogLy8gT2xkZXIgU3BpZGVyTW9ua2V5IHN0eWxlXG4gKiBRLmFzeW5jKGZ1bmN0aW9uICgpIHtcbiAqICAgICAgdmFyIGZvbyA9IHlpZWxkIGdldEZvb1Byb21pc2UoKTtcbiAqICAgICAgdmFyIGJhciA9IHlpZWxkIGdldEJhclByb21pc2UoKTtcbiAqICAgICAgUS5yZXR1cm4oZm9vICsgYmFyKTtcbiAqIH0pXG4gKi9cblFbXCJyZXR1cm5cIl0gPSBfcmV0dXJuO1xuZnVuY3Rpb24gX3JldHVybih2YWx1ZSkge1xuICAgIHRocm93IG5ldyBRUmV0dXJuVmFsdWUodmFsdWUpO1xufVxuXG4vKipcbiAqIFRoZSBwcm9taXNlZCBmdW5jdGlvbiBkZWNvcmF0b3IgZW5zdXJlcyB0aGF0IGFueSBwcm9taXNlIGFyZ3VtZW50c1xuICogYXJlIHNldHRsZWQgYW5kIHBhc3NlZCBhcyB2YWx1ZXMgKGB0aGlzYCBpcyBhbHNvIHNldHRsZWQgYW5kIHBhc3NlZFxuICogYXMgYSB2YWx1ZSkuICBJdCB3aWxsIGFsc28gZW5zdXJlIHRoYXQgdGhlIHJlc3VsdCBvZiBhIGZ1bmN0aW9uIGlzXG4gKiBhbHdheXMgYSBwcm9taXNlLlxuICpcbiAqIEBleGFtcGxlXG4gKiB2YXIgYWRkID0gUS5wcm9taXNlZChmdW5jdGlvbiAoYSwgYikge1xuICogICAgIHJldHVybiBhICsgYjtcbiAqIH0pO1xuICogYWRkKFEoYSksIFEoQikpO1xuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIFRoZSBmdW5jdGlvbiB0byBkZWNvcmF0ZVxuICogQHJldHVybnMge2Z1bmN0aW9ufSBhIGZ1bmN0aW9uIHRoYXQgaGFzIGJlZW4gZGVjb3JhdGVkLlxuICovXG5RLnByb21pc2VkID0gcHJvbWlzZWQ7XG5mdW5jdGlvbiBwcm9taXNlZChjYWxsYmFjaykge1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzcHJlYWQoW3RoaXMsIGFsbChhcmd1bWVudHMpXSwgZnVuY3Rpb24gKHNlbGYsIGFyZ3MpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseShzZWxmLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn1cblxuLyoqXG4gKiBzZW5kcyBhIG1lc3NhZ2UgdG8gYSB2YWx1ZSBpbiBhIGZ1dHVyZSB0dXJuXG4gKiBAcGFyYW0gb2JqZWN0KiB0aGUgcmVjaXBpZW50XG4gKiBAcGFyYW0gb3AgdGhlIG5hbWUgb2YgdGhlIG1lc3NhZ2Ugb3BlcmF0aW9uLCBlLmcuLCBcIndoZW5cIixcbiAqIEBwYXJhbSBhcmdzIGZ1cnRoZXIgYXJndW1lbnRzIHRvIGJlIGZvcndhcmRlZCB0byB0aGUgb3BlcmF0aW9uXG4gKiBAcmV0dXJucyByZXN1bHQge1Byb21pc2V9IGEgcHJvbWlzZSBmb3IgdGhlIHJlc3VsdCBvZiB0aGUgb3BlcmF0aW9uXG4gKi9cblEuZGlzcGF0Y2ggPSBkaXNwYXRjaDtcbmZ1bmN0aW9uIGRpc3BhdGNoKG9iamVjdCwgb3AsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKG9wLCBhcmdzKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUuZGlzcGF0Y2ggPSBmdW5jdGlvbiAob3AsIGFyZ3MpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgc2VsZi5wcm9taXNlRGlzcGF0Y2goZGVmZXJyZWQucmVzb2x2ZSwgb3AsIGFyZ3MpO1xuICAgIH0pO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBHZXRzIHRoZSB2YWx1ZSBvZiBhIHByb3BlcnR5IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIHByb3BlcnR5IHRvIGdldFxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcHJvcGVydHkgdmFsdWVcbiAqL1xuUS5nZXQgPSBmdW5jdGlvbiAob2JqZWN0LCBrZXkpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLmRpc3BhdGNoKFwiZ2V0XCIsIFtrZXldKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcImdldFwiLCBba2V5XSk7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIHZhbHVlIG9mIGEgcHJvcGVydHkgaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciBvYmplY3Qgb2JqZWN0XG4gKiBAcGFyYW0gbmFtZSAgICAgIG5hbWUgb2YgcHJvcGVydHkgdG8gc2V0XG4gKiBAcGFyYW0gdmFsdWUgICAgIG5ldyB2YWx1ZSBvZiBwcm9wZXJ0eVxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cblEuc2V0ID0gZnVuY3Rpb24gKG9iamVjdCwga2V5LCB2YWx1ZSkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJzZXRcIiwgW2tleSwgdmFsdWVdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJzZXRcIiwgW2tleSwgdmFsdWVdKTtcbn07XG5cbi8qKlxuICogRGVsZXRlcyBhIHByb3BlcnR5IGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIHByb3BlcnR5IHRvIGRlbGV0ZVxuICogQHJldHVybiBwcm9taXNlIGZvciB0aGUgcmV0dXJuIHZhbHVlXG4gKi9cblEuZGVsID0gLy8gWFhYIGxlZ2FjeVxuUVtcImRlbGV0ZVwiXSA9IGZ1bmN0aW9uIChvYmplY3QsIGtleSkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJkZWxldGVcIiwgW2tleV0pO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUuZGVsID0gLy8gWFhYIGxlZ2FjeVxuUHJvbWlzZS5wcm90b3R5cGVbXCJkZWxldGVcIl0gPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJkZWxldGVcIiwgW2tleV0pO1xufTtcblxuLyoqXG4gKiBJbnZva2VzIGEgbWV0aG9kIGluIGEgZnV0dXJlIHR1cm4uXG4gKiBAcGFyYW0gb2JqZWN0ICAgIHByb21pc2Ugb3IgaW1tZWRpYXRlIHJlZmVyZW5jZSBmb3IgdGFyZ2V0IG9iamVjdFxuICogQHBhcmFtIG5hbWUgICAgICBuYW1lIG9mIG1ldGhvZCB0byBpbnZva2VcbiAqIEBwYXJhbSB2YWx1ZSAgICAgYSB2YWx1ZSB0byBwb3N0LCB0eXBpY2FsbHkgYW4gYXJyYXkgb2ZcbiAqICAgICAgICAgICAgICAgICAgaW52b2NhdGlvbiBhcmd1bWVudHMgZm9yIHByb21pc2VzIHRoYXRcbiAqICAgICAgICAgICAgICAgICAgYXJlIHVsdGltYXRlbHkgYmFja2VkIHdpdGggYHJlc29sdmVgIHZhbHVlcyxcbiAqICAgICAgICAgICAgICAgICAgYXMgb3Bwb3NlZCB0byB0aG9zZSBiYWNrZWQgd2l0aCBVUkxzXG4gKiAgICAgICAgICAgICAgICAgIHdoZXJlaW4gdGhlIHBvc3RlZCB2YWx1ZSBjYW4gYmUgYW55XG4gKiAgICAgICAgICAgICAgICAgIEpTT04gc2VyaWFsaXphYmxlIG9iamVjdC5cbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZVxuICovXG4vLyBib3VuZCBsb2NhbGx5IGJlY2F1c2UgaXQgaXMgdXNlZCBieSBvdGhlciBtZXRob2RzXG5RLm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5RLnBvc3QgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lLCBhcmdzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFyZ3NdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5Qcm9taXNlLnByb3RvdHlwZS5wb3N0ID0gZnVuY3Rpb24gKG5hbWUsIGFyZ3MpIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFyZ3NdKTtcbn07XG5cbi8qKlxuICogSW52b2tlcyBhIG1ldGhvZCBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEBwYXJhbSBuYW1lICAgICAgbmFtZSBvZiBtZXRob2QgdG8gaW52b2tlXG4gKiBAcGFyYW0gLi4uYXJncyAgIGFycmF5IG9mIGludm9jYXRpb24gYXJndW1lbnRzXG4gKiBAcmV0dXJuIHByb21pc2UgZm9yIHRoZSByZXR1cm4gdmFsdWVcbiAqL1xuUS5zZW5kID0gLy8gWFhYIE1hcmsgTWlsbGVyJ3MgcHJvcG9zZWQgcGFybGFuY2VcblEubWNhbGwgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUS5pbnZva2UgPSBmdW5jdGlvbiAob2JqZWN0LCBuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMildKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLnNlbmQgPSAvLyBYWFggTWFyayBNaWxsZXIncyBwcm9wb3NlZCBwYXJsYW5jZVxuUHJvbWlzZS5wcm90b3R5cGUubWNhbGwgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUHJvbWlzZS5wcm90b3R5cGUuaW52b2tlID0gZnVuY3Rpb24gKG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICByZXR1cm4gdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSldKTtcbn07XG5cbi8qKlxuICogQXBwbGllcyB0aGUgcHJvbWlzZWQgZnVuY3Rpb24gaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgZnVuY3Rpb25cbiAqIEBwYXJhbSBhcmdzICAgICAgYXJyYXkgb2YgYXBwbGljYXRpb24gYXJndW1lbnRzXG4gKi9cblEuZmFwcGx5ID0gZnVuY3Rpb24gKG9iamVjdCwgYXJncykge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcmdzXSk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mYXBwbHkgPSBmdW5jdGlvbiAoYXJncykge1xuICAgIHJldHVybiB0aGlzLmRpc3BhdGNoKFwiYXBwbHlcIiwgW3ZvaWQgMCwgYXJnc10pO1xufTtcblxuLyoqXG4gKiBDYWxscyB0aGUgcHJvbWlzZWQgZnVuY3Rpb24gaW4gYSBmdXR1cmUgdHVybi5cbiAqIEBwYXJhbSBvYmplY3QgICAgcHJvbWlzZSBvciBpbW1lZGlhdGUgcmVmZXJlbmNlIGZvciB0YXJnZXQgZnVuY3Rpb25cbiAqIEBwYXJhbSAuLi5hcmdzICAgYXJyYXkgb2YgYXBwbGljYXRpb24gYXJndW1lbnRzXG4gKi9cblFbXCJ0cnlcIl0gPVxuUS5mY2FsbCA9IGZ1bmN0aW9uIChvYmplY3QgLyogLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kaXNwYXRjaChcImFwcGx5XCIsIFt2b2lkIDAsIGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSldKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmZjYWxsID0gZnVuY3Rpb24gKC8qLi4uYXJncyovKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJhcHBseVwiLCBbdm9pZCAwLCBhcnJheV9zbGljZShhcmd1bWVudHMpXSk7XG59O1xuXG4vKipcbiAqIEJpbmRzIHRoZSBwcm9taXNlZCBmdW5jdGlvbiwgdHJhbnNmb3JtaW5nIHJldHVybiB2YWx1ZXMgaW50byBhIGZ1bGZpbGxlZFxuICogcHJvbWlzZSBhbmQgdGhyb3duIGVycm9ycyBpbnRvIGEgcmVqZWN0ZWQgb25lLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBmdW5jdGlvblxuICogQHBhcmFtIC4uLmFyZ3MgICBhcnJheSBvZiBhcHBsaWNhdGlvbiBhcmd1bWVudHNcbiAqL1xuUS5mYmluZCA9IGZ1bmN0aW9uIChvYmplY3QgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgcHJvbWlzZSA9IFEob2JqZWN0KTtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cywgMSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGZib3VuZCgpIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2UuZGlzcGF0Y2goXCJhcHBseVwiLCBbXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgYXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSlcbiAgICAgICAgXSk7XG4gICAgfTtcbn07XG5Qcm9taXNlLnByb3RvdHlwZS5mYmluZCA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHZhciBwcm9taXNlID0gdGhpcztcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGZib3VuZCgpIHtcbiAgICAgICAgcmV0dXJuIHByb21pc2UuZGlzcGF0Y2goXCJhcHBseVwiLCBbXG4gICAgICAgICAgICB0aGlzLFxuICAgICAgICAgICAgYXJncy5jb25jYXQoYXJyYXlfc2xpY2UoYXJndW1lbnRzKSlcbiAgICAgICAgXSk7XG4gICAgfTtcbn07XG5cbi8qKlxuICogUmVxdWVzdHMgdGhlIG5hbWVzIG9mIHRoZSBvd25lZCBwcm9wZXJ0aWVzIG9mIGEgcHJvbWlzZWRcbiAqIG9iamVjdCBpbiBhIGZ1dHVyZSB0dXJuLlxuICogQHBhcmFtIG9iamVjdCAgICBwcm9taXNlIG9yIGltbWVkaWF0ZSByZWZlcmVuY2UgZm9yIHRhcmdldCBvYmplY3RcbiAqIEByZXR1cm4gcHJvbWlzZSBmb3IgdGhlIGtleXMgb2YgdGhlIGV2ZW50dWFsbHkgc2V0dGxlZCBvYmplY3RcbiAqL1xuUS5rZXlzID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICAgIHJldHVybiBRKG9iamVjdCkuZGlzcGF0Y2goXCJrZXlzXCIsIFtdKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmtleXMgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGlzcGF0Y2goXCJrZXlzXCIsIFtdKTtcbn07XG5cbi8qKlxuICogVHVybnMgYW4gYXJyYXkgb2YgcHJvbWlzZXMgaW50byBhIHByb21pc2UgZm9yIGFuIGFycmF5LiAgSWYgYW55IG9mXG4gKiB0aGUgcHJvbWlzZXMgZ2V0cyByZWplY3RlZCwgdGhlIHdob2xlIGFycmF5IGlzIHJlamVjdGVkIGltbWVkaWF0ZWx5LlxuICogQHBhcmFtIHtBcnJheSp9IGFuIGFycmF5IChvciBwcm9taXNlIGZvciBhbiBhcnJheSkgb2YgdmFsdWVzIChvclxuICogcHJvbWlzZXMgZm9yIHZhbHVlcylcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgYW4gYXJyYXkgb2YgdGhlIGNvcnJlc3BvbmRpbmcgdmFsdWVzXG4gKi9cbi8vIEJ5IE1hcmsgTWlsbGVyXG4vLyBodHRwOi8vd2lraS5lY21hc2NyaXB0Lm9yZy9kb2t1LnBocD9pZD1zdHJhd21hbjpjb25jdXJyZW5jeSZyZXY9MTMwODc3NjUyMSNhbGxmdWxmaWxsZWRcblEuYWxsID0gYWxsO1xuZnVuY3Rpb24gYWxsKHByb21pc2VzKSB7XG4gICAgcmV0dXJuIHdoZW4ocHJvbWlzZXMsIGZ1bmN0aW9uIChwcm9taXNlcykge1xuICAgICAgICB2YXIgcGVuZGluZ0NvdW50ID0gMDtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgYXJyYXlfcmVkdWNlKHByb21pc2VzLCBmdW5jdGlvbiAodW5kZWZpbmVkLCBwcm9taXNlLCBpbmRleCkge1xuICAgICAgICAgICAgdmFyIHNuYXBzaG90O1xuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgIGlzUHJvbWlzZShwcm9taXNlKSAmJlxuICAgICAgICAgICAgICAgIChzbmFwc2hvdCA9IHByb21pc2UuaW5zcGVjdCgpKS5zdGF0ZSA9PT0gXCJmdWxmaWxsZWRcIlxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgcHJvbWlzZXNbaW5kZXhdID0gc25hcHNob3QudmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICsrcGVuZGluZ0NvdW50O1xuICAgICAgICAgICAgICAgIHdoZW4oXG4gICAgICAgICAgICAgICAgICAgIHByb21pc2UsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvbWlzZXNbaW5kZXhdID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoLS1wZW5kaW5nQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHByb21pc2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0LFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAocHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLm5vdGlmeSh7IGluZGV4OiBpbmRleCwgdmFsdWU6IHByb2dyZXNzIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdm9pZCAwKTtcbiAgICAgICAgaWYgKHBlbmRpbmdDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfSk7XG59XG5cblByb21pc2UucHJvdG90eXBlLmFsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gYWxsKHRoaXMpO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBmaXJzdCByZXNvbHZlZCBwcm9taXNlIG9mIGFuIGFycmF5LiBQcmlvciByZWplY3RlZCBwcm9taXNlcyBhcmVcbiAqIGlnbm9yZWQuICBSZWplY3RzIG9ubHkgaWYgYWxsIHByb21pc2VzIGFyZSByZWplY3RlZC5cbiAqIEBwYXJhbSB7QXJyYXkqfSBhbiBhcnJheSBjb250YWluaW5nIHZhbHVlcyBvciBwcm9taXNlcyBmb3IgdmFsdWVzXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZnVsZmlsbGVkIHdpdGggdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCByZXNvbHZlZCBwcm9taXNlLFxuICogb3IgYSByZWplY3RlZCBwcm9taXNlIGlmIGFsbCBwcm9taXNlcyBhcmUgcmVqZWN0ZWQuXG4gKi9cblEuYW55ID0gYW55O1xuXG5mdW5jdGlvbiBhbnkocHJvbWlzZXMpIHtcbiAgICBpZiAocHJvbWlzZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiBRLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICB2YXIgZGVmZXJyZWQgPSBRLmRlZmVyKCk7XG4gICAgdmFyIHBlbmRpbmdDb3VudCA9IDA7XG4gICAgYXJyYXlfcmVkdWNlKHByb21pc2VzLCBmdW5jdGlvbiAocHJldiwgY3VycmVudCwgaW5kZXgpIHtcbiAgICAgICAgdmFyIHByb21pc2UgPSBwcm9taXNlc1tpbmRleF07XG5cbiAgICAgICAgcGVuZGluZ0NvdW50Kys7XG5cbiAgICAgICAgd2hlbihwcm9taXNlLCBvbkZ1bGZpbGxlZCwgb25SZWplY3RlZCwgb25Qcm9ncmVzcyk7XG4gICAgICAgIGZ1bmN0aW9uIG9uRnVsZmlsbGVkKHJlc3VsdCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIG9uUmVqZWN0ZWQoKSB7XG4gICAgICAgICAgICBwZW5kaW5nQ291bnQtLTtcbiAgICAgICAgICAgIGlmIChwZW5kaW5nQ291bnQgPT09IDApIHtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QobmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgICBcIkNhbid0IGdldCBmdWxmaWxsbWVudCB2YWx1ZSBmcm9tIGFueSBwcm9taXNlLCBhbGwgXCIgK1xuICAgICAgICAgICAgICAgICAgICBcInByb21pc2VzIHdlcmUgcmVqZWN0ZWQuXCJcbiAgICAgICAgICAgICAgICApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBvblByb2dyZXNzKHByb2dyZXNzKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5ub3RpZnkoe1xuICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcHJvZ3Jlc3NcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSwgdW5kZWZpbmVkKTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufVxuXG5Qcm9taXNlLnByb3RvdHlwZS5hbnkgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGFueSh0aGlzKTtcbn07XG5cbi8qKlxuICogV2FpdHMgZm9yIGFsbCBwcm9taXNlcyB0byBiZSBzZXR0bGVkLCBlaXRoZXIgZnVsZmlsbGVkIG9yXG4gKiByZWplY3RlZC4gIFRoaXMgaXMgZGlzdGluY3QgZnJvbSBgYWxsYCBzaW5jZSB0aGF0IHdvdWxkIHN0b3BcbiAqIHdhaXRpbmcgYXQgdGhlIGZpcnN0IHJlamVjdGlvbi4gIFRoZSBwcm9taXNlIHJldHVybmVkIGJ5XG4gKiBgYWxsUmVzb2x2ZWRgIHdpbGwgbmV2ZXIgYmUgcmVqZWN0ZWQuXG4gKiBAcGFyYW0gcHJvbWlzZXMgYSBwcm9taXNlIGZvciBhbiBhcnJheSAob3IgYW4gYXJyYXkpIG9mIHByb21pc2VzXG4gKiAob3IgdmFsdWVzKVxuICogQHJldHVybiBhIHByb21pc2UgZm9yIGFuIGFycmF5IG9mIHByb21pc2VzXG4gKi9cblEuYWxsUmVzb2x2ZWQgPSBkZXByZWNhdGUoYWxsUmVzb2x2ZWQsIFwiYWxsUmVzb2x2ZWRcIiwgXCJhbGxTZXR0bGVkXCIpO1xuZnVuY3Rpb24gYWxsUmVzb2x2ZWQocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gd2hlbihwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHByb21pc2VzID0gYXJyYXlfbWFwKHByb21pc2VzLCBRKTtcbiAgICAgICAgcmV0dXJuIHdoZW4oYWxsKGFycmF5X21hcChwcm9taXNlcywgZnVuY3Rpb24gKHByb21pc2UpIHtcbiAgICAgICAgICAgIHJldHVybiB3aGVuKHByb21pc2UsIG5vb3AsIG5vb3ApO1xuICAgICAgICB9KSksIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlcztcbiAgICAgICAgfSk7XG4gICAgfSk7XG59XG5cblByb21pc2UucHJvdG90eXBlLmFsbFJlc29sdmVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBhbGxSZXNvbHZlZCh0aGlzKTtcbn07XG5cbi8qKlxuICogQHNlZSBQcm9taXNlI2FsbFNldHRsZWRcbiAqL1xuUS5hbGxTZXR0bGVkID0gYWxsU2V0dGxlZDtcbmZ1bmN0aW9uIGFsbFNldHRsZWQocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gUShwcm9taXNlcykuYWxsU2V0dGxlZCgpO1xufVxuXG4vKipcbiAqIFR1cm5zIGFuIGFycmF5IG9mIHByb21pc2VzIGludG8gYSBwcm9taXNlIGZvciBhbiBhcnJheSBvZiB0aGVpciBzdGF0ZXMgKGFzXG4gKiByZXR1cm5lZCBieSBgaW5zcGVjdGApIHdoZW4gdGhleSBoYXZlIGFsbCBzZXR0bGVkLlxuICogQHBhcmFtIHtBcnJheVtBbnkqXX0gdmFsdWVzIGFuIGFycmF5IChvciBwcm9taXNlIGZvciBhbiBhcnJheSkgb2YgdmFsdWVzIChvclxuICogcHJvbWlzZXMgZm9yIHZhbHVlcylcbiAqIEByZXR1cm5zIHtBcnJheVtTdGF0ZV19IGFuIGFycmF5IG9mIHN0YXRlcyBmb3IgdGhlIHJlc3BlY3RpdmUgdmFsdWVzLlxuICovXG5Qcm9taXNlLnByb3RvdHlwZS5hbGxTZXR0bGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHByb21pc2VzKSB7XG4gICAgICAgIHJldHVybiBhbGwoYXJyYXlfbWFwKHByb21pc2VzLCBmdW5jdGlvbiAocHJvbWlzZSkge1xuICAgICAgICAgICAgcHJvbWlzZSA9IFEocHJvbWlzZSk7XG4gICAgICAgICAgICBmdW5jdGlvbiByZWdhcmRsZXNzKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlLmluc3BlY3QoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwcm9taXNlLnRoZW4ocmVnYXJkbGVzcywgcmVnYXJkbGVzcyk7XG4gICAgICAgIH0pKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogQ2FwdHVyZXMgdGhlIGZhaWx1cmUgb2YgYSBwcm9taXNlLCBnaXZpbmcgYW4gb3BvcnR1bml0eSB0byByZWNvdmVyXG4gKiB3aXRoIGEgY2FsbGJhY2suICBJZiB0aGUgZ2l2ZW4gcHJvbWlzZSBpcyBmdWxmaWxsZWQsIHRoZSByZXR1cm5lZFxuICogcHJvbWlzZSBpcyBmdWxmaWxsZWQuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgZm9yIHNvbWV0aGluZ1xuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gZnVsZmlsbCB0aGUgcmV0dXJuZWQgcHJvbWlzZSBpZiB0aGVcbiAqIGdpdmVuIHByb21pc2UgaXMgcmVqZWN0ZWRcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJldHVybiB2YWx1ZSBvZiB0aGUgY2FsbGJhY2tcbiAqL1xuUS5mYWlsID0gLy8gWFhYIGxlZ2FjeVxuUVtcImNhdGNoXCJdID0gZnVuY3Rpb24gKG9iamVjdCwgcmVqZWN0ZWQpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLnRoZW4odm9pZCAwLCByZWplY3RlZCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5mYWlsID0gLy8gWFhYIGxlZ2FjeVxuUHJvbWlzZS5wcm90b3R5cGVbXCJjYXRjaFwiXSA9IGZ1bmN0aW9uIChyZWplY3RlZCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCByZWplY3RlZCk7XG59O1xuXG4vKipcbiAqIEF0dGFjaGVzIGEgbGlzdGVuZXIgdGhhdCBjYW4gcmVzcG9uZCB0byBwcm9ncmVzcyBub3RpZmljYXRpb25zIGZyb20gYVxuICogcHJvbWlzZSdzIG9yaWdpbmF0aW5nIGRlZmVycmVkLiBUaGlzIGxpc3RlbmVyIHJlY2VpdmVzIHRoZSBleGFjdCBhcmd1bWVudHNcbiAqIHBhc3NlZCB0byBgYGRlZmVycmVkLm5vdGlmeWBgLlxuICogQHBhcmFtIHtBbnkqfSBwcm9taXNlIGZvciBzb21ldGhpbmdcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIHRvIHJlY2VpdmUgYW55IHByb2dyZXNzIG5vdGlmaWNhdGlvbnNcbiAqIEByZXR1cm5zIHRoZSBnaXZlbiBwcm9taXNlLCB1bmNoYW5nZWRcbiAqL1xuUS5wcm9ncmVzcyA9IHByb2dyZXNzO1xuZnVuY3Rpb24gcHJvZ3Jlc3Mob2JqZWN0LCBwcm9ncmVzc2VkKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS50aGVuKHZvaWQgMCwgdm9pZCAwLCBwcm9ncmVzc2VkKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUucHJvZ3Jlc3MgPSBmdW5jdGlvbiAocHJvZ3Jlc3NlZCkge1xuICAgIHJldHVybiB0aGlzLnRoZW4odm9pZCAwLCB2b2lkIDAsIHByb2dyZXNzZWQpO1xufTtcblxuLyoqXG4gKiBQcm92aWRlcyBhbiBvcHBvcnR1bml0eSB0byBvYnNlcnZlIHRoZSBzZXR0bGluZyBvZiBhIHByb21pc2UsXG4gKiByZWdhcmRsZXNzIG9mIHdoZXRoZXIgdGhlIHByb21pc2UgaXMgZnVsZmlsbGVkIG9yIHJlamVjdGVkLiAgRm9yd2FyZHNcbiAqIHRoZSByZXNvbHV0aW9uIHRvIHRoZSByZXR1cm5lZCBwcm9taXNlIHdoZW4gdGhlIGNhbGxiYWNrIGlzIGRvbmUuXG4gKiBUaGUgY2FsbGJhY2sgY2FuIHJldHVybiBhIHByb21pc2UgdG8gZGVmZXIgY29tcGxldGlvbi5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdG8gb2JzZXJ2ZSB0aGUgcmVzb2x1dGlvbiBvZiB0aGUgZ2l2ZW5cbiAqIHByb21pc2UsIHRha2VzIG5vIGFyZ3VtZW50cy5cbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2Ugd2hlblxuICogYGBmaW5gYCBpcyBkb25lLlxuICovXG5RLmZpbiA9IC8vIFhYWCBsZWdhY3lcblFbXCJmaW5hbGx5XCJdID0gZnVuY3Rpb24gKG9iamVjdCwgY2FsbGJhY2spIHtcbiAgICByZXR1cm4gUShvYmplY3QpW1wiZmluYWxseVwiXShjYWxsYmFjayk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5maW4gPSAvLyBYWFggbGVnYWN5XG5Qcm9taXNlLnByb3RvdHlwZVtcImZpbmFsbHlcIl0gPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICBjYWxsYmFjayA9IFEoY2FsbGJhY2spO1xuICAgIHJldHVybiB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjay5mY2FsbCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9KTtcbiAgICB9LCBmdW5jdGlvbiAocmVhc29uKSB7XG4gICAgICAgIC8vIFRPRE8gYXR0ZW1wdCB0byByZWN5Y2xlIHRoZSByZWplY3Rpb24gd2l0aCBcInRoaXNcIi5cbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrLmZjYWxsKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aHJvdyByZWFzb247XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBUZXJtaW5hdGVzIGEgY2hhaW4gb2YgcHJvbWlzZXMsIGZvcmNpbmcgcmVqZWN0aW9ucyB0byBiZVxuICogdGhyb3duIGFzIGV4Y2VwdGlvbnMuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2UgYXQgdGhlIGVuZCBvZiBhIGNoYWluIG9mIHByb21pc2VzXG4gKiBAcmV0dXJucyBub3RoaW5nXG4gKi9cblEuZG9uZSA9IGZ1bmN0aW9uIChvYmplY3QsIGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5kb25lKGZ1bGZpbGxlZCwgcmVqZWN0ZWQsIHByb2dyZXNzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLmRvbmUgPSBmdW5jdGlvbiAoZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIHtcbiAgICB2YXIgb25VbmhhbmRsZWRFcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAvLyBmb3J3YXJkIHRvIGEgZnV0dXJlIHR1cm4gc28gdGhhdCBgYHdoZW5gYFxuICAgICAgICAvLyBkb2VzIG5vdCBjYXRjaCBpdCBhbmQgdHVybiBpdCBpbnRvIGEgcmVqZWN0aW9uLlxuICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG1ha2VTdGFja1RyYWNlTG9uZyhlcnJvciwgcHJvbWlzZSk7XG4gICAgICAgICAgICBpZiAoUS5vbmVycm9yKSB7XG4gICAgICAgICAgICAgICAgUS5vbmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgZXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBBdm9pZCB1bm5lY2Vzc2FyeSBgbmV4dFRpY2tgaW5nIHZpYSBhbiB1bm5lY2Vzc2FyeSBgd2hlbmAuXG4gICAgdmFyIHByb21pc2UgPSBmdWxmaWxsZWQgfHwgcmVqZWN0ZWQgfHwgcHJvZ3Jlc3MgP1xuICAgICAgICB0aGlzLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCwgcHJvZ3Jlc3MpIDpcbiAgICAgICAgdGhpcztcblxuICAgIGlmICh0eXBlb2YgcHJvY2VzcyA9PT0gXCJvYmplY3RcIiAmJiBwcm9jZXNzICYmIHByb2Nlc3MuZG9tYWluKSB7XG4gICAgICAgIG9uVW5oYW5kbGVkRXJyb3IgPSBwcm9jZXNzLmRvbWFpbi5iaW5kKG9uVW5oYW5kbGVkRXJyb3IpO1xuICAgIH1cblxuICAgIHByb21pc2UudGhlbih2b2lkIDAsIG9uVW5oYW5kbGVkRXJyb3IpO1xufTtcblxuLyoqXG4gKiBDYXVzZXMgYSBwcm9taXNlIHRvIGJlIHJlamVjdGVkIGlmIGl0IGRvZXMgbm90IGdldCBmdWxmaWxsZWQgYmVmb3JlXG4gKiBzb21lIG1pbGxpc2Vjb25kcyB0aW1lIG91dC5cbiAqIEBwYXJhbSB7QW55Kn0gcHJvbWlzZVxuICogQHBhcmFtIHtOdW1iZXJ9IG1pbGxpc2Vjb25kcyB0aW1lb3V0XG4gKiBAcGFyYW0ge0FueSp9IGN1c3RvbSBlcnJvciBtZXNzYWdlIG9yIEVycm9yIG9iamVjdCAob3B0aW9uYWwpXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlIGlmIGl0IGlzXG4gKiBmdWxmaWxsZWQgYmVmb3JlIHRoZSB0aW1lb3V0LCBvdGhlcndpc2UgcmVqZWN0ZWQuXG4gKi9cblEudGltZW91dCA9IGZ1bmN0aW9uIChvYmplY3QsIG1zLCBlcnJvcikge1xuICAgIHJldHVybiBRKG9iamVjdCkudGltZW91dChtcywgZXJyb3IpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUudGltZW91dCA9IGZ1bmN0aW9uIChtcywgZXJyb3IpIHtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIHZhciB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFlcnJvciB8fCBcInN0cmluZ1wiID09PSB0eXBlb2YgZXJyb3IpIHtcbiAgICAgICAgICAgIGVycm9yID0gbmV3IEVycm9yKGVycm9yIHx8IFwiVGltZWQgb3V0IGFmdGVyIFwiICsgbXMgKyBcIiBtc1wiKTtcbiAgICAgICAgICAgIGVycm9yLmNvZGUgPSBcIkVUSU1FRE9VVFwiO1xuICAgICAgICB9XG4gICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4gICAgfSwgbXMpO1xuXG4gICAgdGhpcy50aGVuKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh2YWx1ZSk7XG4gICAgfSwgZnVuY3Rpb24gKGV4Y2VwdGlvbikge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgZGVmZXJyZWQucmVqZWN0KGV4Y2VwdGlvbik7XG4gICAgfSwgZGVmZXJyZWQubm90aWZ5KTtcblxuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIGdpdmVuIHZhbHVlIChvciBwcm9taXNlZCB2YWx1ZSksIHNvbWVcbiAqIG1pbGxpc2Vjb25kcyBhZnRlciBpdCByZXNvbHZlZC4gUGFzc2VzIHJlamVjdGlvbnMgaW1tZWRpYXRlbHkuXG4gKiBAcGFyYW0ge0FueSp9IHByb21pc2VcbiAqIEBwYXJhbSB7TnVtYmVyfSBtaWxsaXNlY29uZHNcbiAqIEByZXR1cm5zIGEgcHJvbWlzZSBmb3IgdGhlIHJlc29sdXRpb24gb2YgdGhlIGdpdmVuIHByb21pc2UgYWZ0ZXIgbWlsbGlzZWNvbmRzXG4gKiB0aW1lIGhhcyBlbGFwc2VkIHNpbmNlIHRoZSByZXNvbHV0aW9uIG9mIHRoZSBnaXZlbiBwcm9taXNlLlxuICogSWYgdGhlIGdpdmVuIHByb21pc2UgcmVqZWN0cywgdGhhdCBpcyBwYXNzZWQgaW1tZWRpYXRlbHkuXG4gKi9cblEuZGVsYXkgPSBmdW5jdGlvbiAob2JqZWN0LCB0aW1lb3V0KSB7XG4gICAgaWYgKHRpbWVvdXQgPT09IHZvaWQgMCkge1xuICAgICAgICB0aW1lb3V0ID0gb2JqZWN0O1xuICAgICAgICBvYmplY3QgPSB2b2lkIDA7XG4gICAgfVxuICAgIHJldHVybiBRKG9iamVjdCkuZGVsYXkodGltZW91dCk7XG59O1xuXG5Qcm9taXNlLnByb3RvdHlwZS5kZWxheSA9IGZ1bmN0aW9uICh0aW1lb3V0KSB7XG4gICAgcmV0dXJuIHRoaXMudGhlbihmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHZhbHVlKTtcbiAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH0pO1xufTtcblxuLyoqXG4gKiBQYXNzZXMgYSBjb250aW51YXRpb24gdG8gYSBOb2RlIGZ1bmN0aW9uLCB3aGljaCBpcyBjYWxsZWQgd2l0aCB0aGUgZ2l2ZW5cbiAqIGFyZ3VtZW50cyBwcm92aWRlZCBhcyBhbiBhcnJheSwgYW5kIHJldHVybnMgYSBwcm9taXNlLlxuICpcbiAqICAgICAgUS5uZmFwcGx5KEZTLnJlYWRGaWxlLCBbX19maWxlbmFtZV0pXG4gKiAgICAgIC50aGVuKGZ1bmN0aW9uIChjb250ZW50KSB7XG4gKiAgICAgIH0pXG4gKlxuICovXG5RLm5mYXBwbHkgPSBmdW5jdGlvbiAoY2FsbGJhY2ssIGFyZ3MpIHtcbiAgICByZXR1cm4gUShjYWxsYmFjaykubmZhcHBseShhcmdzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mYXBwbHkgPSBmdW5jdGlvbiAoYXJncykge1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJncyk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIHRoaXMuZmFwcGx5KG5vZGVBcmdzKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIFBhc3NlcyBhIGNvbnRpbnVhdGlvbiB0byBhIE5vZGUgZnVuY3Rpb24sIHdoaWNoIGlzIGNhbGxlZCB3aXRoIHRoZSBnaXZlblxuICogYXJndW1lbnRzIHByb3ZpZGVkIGluZGl2aWR1YWxseSwgYW5kIHJldHVybnMgYSBwcm9taXNlLlxuICogQGV4YW1wbGVcbiAqIFEubmZjYWxsKEZTLnJlYWRGaWxlLCBfX2ZpbGVuYW1lKVxuICogLnRoZW4oZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAqIH0pXG4gKlxuICovXG5RLm5mY2FsbCA9IGZ1bmN0aW9uIChjYWxsYmFjayAvKi4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICByZXR1cm4gUShjYWxsYmFjaykubmZhcHBseShhcmdzKTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mY2FsbCA9IGZ1bmN0aW9uICgvKi4uLmFyZ3MqLykge1xuICAgIHZhciBub2RlQXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbn07XG5cbi8qKlxuICogV3JhcHMgYSBOb2RlSlMgY29udGludWF0aW9uIHBhc3NpbmcgZnVuY3Rpb24gYW5kIHJldHVybnMgYW4gZXF1aXZhbGVudFxuICogdmVyc2lvbiB0aGF0IHJldHVybnMgYSBwcm9taXNlLlxuICogQGV4YW1wbGVcbiAqIFEubmZiaW5kKEZTLnJlYWRGaWxlLCBfX2ZpbGVuYW1lKShcInV0Zi04XCIpXG4gKiAudGhlbihjb25zb2xlLmxvZylcbiAqIC5kb25lKClcbiAqL1xuUS5uZmJpbmQgPVxuUS5kZW5vZGVpZnkgPSBmdW5jdGlvbiAoY2FsbGJhY2sgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYmFzZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDEpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBub2RlQXJncyA9IGJhc2VBcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKTtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgICAgICBRKGNhbGxiYWNrKS5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5mYmluZCA9XG5Qcm9taXNlLnByb3RvdHlwZS5kZW5vZGVpZnkgPSBmdW5jdGlvbiAoLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYXJncyA9IGFycmF5X3NsaWNlKGFyZ3VtZW50cyk7XG4gICAgYXJncy51bnNoaWZ0KHRoaXMpO1xuICAgIHJldHVybiBRLmRlbm9kZWlmeS5hcHBseSh2b2lkIDAsIGFyZ3MpO1xufTtcblxuUS5uYmluZCA9IGZ1bmN0aW9uIChjYWxsYmFjaywgdGhpc3AgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgYmFzZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBub2RlQXJncyA9IGJhc2VBcmdzLmNvbmNhdChhcnJheV9zbGljZShhcmd1bWVudHMpKTtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICAgICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgICAgICBmdW5jdGlvbiBib3VuZCgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjay5hcHBseSh0aGlzcCwgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgICAgICBRKGJvdW5kKS5mYXBwbHkobm9kZUFyZ3MpLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcbn07XG5cblByb21pc2UucHJvdG90eXBlLm5iaW5kID0gZnVuY3Rpb24gKC8qdGhpc3AsIC4uLmFyZ3MqLykge1xuICAgIHZhciBhcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAwKTtcbiAgICBhcmdzLnVuc2hpZnQodGhpcyk7XG4gICAgcmV0dXJuIFEubmJpbmQuYXBwbHkodm9pZCAwLCBhcmdzKTtcbn07XG5cbi8qKlxuICogQ2FsbHMgYSBtZXRob2Qgb2YgYSBOb2RlLXN0eWxlIG9iamVjdCB0aGF0IGFjY2VwdHMgYSBOb2RlLXN0eWxlXG4gKiBjYWxsYmFjayB3aXRoIGEgZ2l2ZW4gYXJyYXkgb2YgYXJndW1lbnRzLCBwbHVzIGEgcHJvdmlkZWQgY2FsbGJhY2suXG4gKiBAcGFyYW0gb2JqZWN0IGFuIG9iamVjdCB0aGF0IGhhcyB0aGUgbmFtZWQgbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBuYW1lIG9mIHRoZSBtZXRob2Qgb2Ygb2JqZWN0XG4gKiBAcGFyYW0ge0FycmF5fSBhcmdzIGFyZ3VtZW50cyB0byBwYXNzIHRvIHRoZSBtZXRob2Q7IHRoZSBjYWxsYmFja1xuICogd2lsbCBiZSBwcm92aWRlZCBieSBRIGFuZCBhcHBlbmRlZCB0byB0aGVzZSBhcmd1bWVudHMuXG4gKiBAcmV0dXJucyBhIHByb21pc2UgZm9yIHRoZSB2YWx1ZSBvciBlcnJvclxuICovXG5RLm5tYXBwbHkgPSAvLyBYWFggQXMgcHJvcG9zZWQgYnkgXCJSZWRzYW5kcm9cIlxuUS5ucG9zdCA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUsIGFyZ3MpIHtcbiAgICByZXR1cm4gUShvYmplY3QpLm5wb3N0KG5hbWUsIGFyZ3MpO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubm1hcHBseSA9IC8vIFhYWCBBcyBwcm9wb3NlZCBieSBcIlJlZHNhbmRyb1wiXG5Qcm9taXNlLnByb3RvdHlwZS5ucG9zdCA9IGZ1bmN0aW9uIChuYW1lLCBhcmdzKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJncyB8fCBbXSk7XG4gICAgdmFyIGRlZmVycmVkID0gZGVmZXIoKTtcbiAgICBub2RlQXJncy5wdXNoKGRlZmVycmVkLm1ha2VOb2RlUmVzb2x2ZXIoKSk7XG4gICAgdGhpcy5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIG5vZGVBcmdzXSkuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuLyoqXG4gKiBDYWxscyBhIG1ldGhvZCBvZiBhIE5vZGUtc3R5bGUgb2JqZWN0IHRoYXQgYWNjZXB0cyBhIE5vZGUtc3R5bGVcbiAqIGNhbGxiYWNrLCBmb3J3YXJkaW5nIHRoZSBnaXZlbiB2YXJpYWRpYyBhcmd1bWVudHMsIHBsdXMgYSBwcm92aWRlZFxuICogY2FsbGJhY2sgYXJndW1lbnQuXG4gKiBAcGFyYW0gb2JqZWN0IGFuIG9iamVjdCB0aGF0IGhhcyB0aGUgbmFtZWQgbWV0aG9kXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBuYW1lIG9mIHRoZSBtZXRob2Qgb2Ygb2JqZWN0XG4gKiBAcGFyYW0gLi4uYXJncyBhcmd1bWVudHMgdG8gcGFzcyB0byB0aGUgbWV0aG9kOyB0aGUgY2FsbGJhY2sgd2lsbFxuICogYmUgcHJvdmlkZWQgYnkgUSBhbmQgYXBwZW5kZWQgdG8gdGhlc2UgYXJndW1lbnRzLlxuICogQHJldHVybnMgYSBwcm9taXNlIGZvciB0aGUgdmFsdWUgb3IgZXJyb3JcbiAqL1xuUS5uc2VuZCA9IC8vIFhYWCBCYXNlZCBvbiBNYXJrIE1pbGxlcidzIHByb3Bvc2VkIFwic2VuZFwiXG5RLm5tY2FsbCA9IC8vIFhYWCBCYXNlZCBvbiBcIlJlZHNhbmRybydzXCIgcHJvcG9zYWxcblEubmludm9rZSA9IGZ1bmN0aW9uIChvYmplY3QsIG5hbWUgLyouLi5hcmdzKi8pIHtcbiAgICB2YXIgbm9kZUFyZ3MgPSBhcnJheV9zbGljZShhcmd1bWVudHMsIDIpO1xuICAgIHZhciBkZWZlcnJlZCA9IGRlZmVyKCk7XG4gICAgbm9kZUFyZ3MucHVzaChkZWZlcnJlZC5tYWtlTm9kZVJlc29sdmVyKCkpO1xuICAgIFEob2JqZWN0KS5kaXNwYXRjaChcInBvc3RcIiwgW25hbWUsIG5vZGVBcmdzXSkuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xufTtcblxuUHJvbWlzZS5wcm90b3R5cGUubnNlbmQgPSAvLyBYWFggQmFzZWQgb24gTWFyayBNaWxsZXIncyBwcm9wb3NlZCBcInNlbmRcIlxuUHJvbWlzZS5wcm90b3R5cGUubm1jYWxsID0gLy8gWFhYIEJhc2VkIG9uIFwiUmVkc2FuZHJvJ3NcIiBwcm9wb3NhbFxuUHJvbWlzZS5wcm90b3R5cGUubmludm9rZSA9IGZ1bmN0aW9uIChuYW1lIC8qLi4uYXJncyovKSB7XG4gICAgdmFyIG5vZGVBcmdzID0gYXJyYXlfc2xpY2UoYXJndW1lbnRzLCAxKTtcbiAgICB2YXIgZGVmZXJyZWQgPSBkZWZlcigpO1xuICAgIG5vZGVBcmdzLnB1c2goZGVmZXJyZWQubWFrZU5vZGVSZXNvbHZlcigpKTtcbiAgICB0aGlzLmRpc3BhdGNoKFwicG9zdFwiLCBbbmFtZSwgbm9kZUFyZ3NdKS5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG59O1xuXG4vKipcbiAqIElmIGEgZnVuY3Rpb24gd291bGQgbGlrZSB0byBzdXBwb3J0IGJvdGggTm9kZSBjb250aW51YXRpb24tcGFzc2luZy1zdHlsZSBhbmRcbiAqIHByb21pc2UtcmV0dXJuaW5nLXN0eWxlLCBpdCBjYW4gZW5kIGl0cyBpbnRlcm5hbCBwcm9taXNlIGNoYWluIHdpdGhcbiAqIGBub2RlaWZ5KG5vZGViYWNrKWAsIGZvcndhcmRpbmcgdGhlIG9wdGlvbmFsIG5vZGViYWNrIGFyZ3VtZW50LiAgSWYgdGhlIHVzZXJcbiAqIGVsZWN0cyB0byB1c2UgYSBub2RlYmFjaywgdGhlIHJlc3VsdCB3aWxsIGJlIHNlbnQgdGhlcmUuICBJZiB0aGV5IGRvIG5vdFxuICogcGFzcyBhIG5vZGViYWNrLCB0aGV5IHdpbGwgcmVjZWl2ZSB0aGUgcmVzdWx0IHByb21pc2UuXG4gKiBAcGFyYW0gb2JqZWN0IGEgcmVzdWx0IChvciBhIHByb21pc2UgZm9yIGEgcmVzdWx0KVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbm9kZWJhY2sgYSBOb2RlLmpzLXN0eWxlIGNhbGxiYWNrXG4gKiBAcmV0dXJucyBlaXRoZXIgdGhlIHByb21pc2Ugb3Igbm90aGluZ1xuICovXG5RLm5vZGVpZnkgPSBub2RlaWZ5O1xuZnVuY3Rpb24gbm9kZWlmeShvYmplY3QsIG5vZGViYWNrKSB7XG4gICAgcmV0dXJuIFEob2JqZWN0KS5ub2RlaWZ5KG5vZGViYWNrKTtcbn1cblxuUHJvbWlzZS5wcm90b3R5cGUubm9kZWlmeSA9IGZ1bmN0aW9uIChub2RlYmFjaykge1xuICAgIGlmIChub2RlYmFjaykge1xuICAgICAgICB0aGlzLnRoZW4oZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBub2RlYmFjayhudWxsLCB2YWx1ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBRLm5leHRUaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBub2RlYmFjayhlcnJvcik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufTtcblxuUS5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiUS5ub0NvbmZsaWN0IG9ubHkgd29ya3Mgd2hlbiBRIGlzIHVzZWQgYXMgYSBnbG9iYWxcIik7XG59O1xuXG4vLyBBbGwgY29kZSBiZWZvcmUgdGhpcyBwb2ludCB3aWxsIGJlIGZpbHRlcmVkIGZyb20gc3RhY2sgdHJhY2VzLlxudmFyIHFFbmRpbmdMaW5lID0gY2FwdHVyZUxpbmUoKTtcblxucmV0dXJuIFE7XG5cbn0pO1xuIiwiLy8gQ29weXJpZ2h0IDIwMTMtMjAxNCBLZXZpbiBDb3hcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4qICBUaGlzIHNvZnR3YXJlIGlzIHByb3ZpZGVkICdhcy1pcycsIHdpdGhvdXQgYW55IGV4cHJlc3Mgb3IgaW1wbGllZCAgICAgICAgICAgKlxuKiAgd2FycmFudHkuIEluIG5vIGV2ZW50IHdpbGwgdGhlIGF1dGhvcnMgYmUgaGVsZCBsaWFibGUgZm9yIGFueSBkYW1hZ2VzICAgICAgICpcbiogIGFyaXNpbmcgZnJvbSB0aGUgdXNlIG9mIHRoaXMgc29mdHdhcmUuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4qICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgUGVybWlzc2lvbiBpcyBncmFudGVkIHRvIGFueW9uZSB0byB1c2UgdGhpcyBzb2Z0d2FyZSBmb3IgYW55IHB1cnBvc2UsICAgICAgICpcbiogIGluY2x1ZGluZyBjb21tZXJjaWFsIGFwcGxpY2F0aW9ucywgYW5kIHRvIGFsdGVyIGl0IGFuZCByZWRpc3RyaWJ1dGUgaXQgICAgICAqXG4qICBmcmVlbHksIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyByZXN0cmljdGlvbnM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcbiogIDEuIFRoZSBvcmlnaW4gb2YgdGhpcyBzb2Z0d2FyZSBtdXN0IG5vdCBiZSBtaXNyZXByZXNlbnRlZDsgeW91IG11c3Qgbm90ICAgICAqXG4qICAgICBjbGFpbSB0aGF0IHlvdSB3cm90ZSB0aGUgb3JpZ2luYWwgc29mdHdhcmUuIElmIHlvdSB1c2UgdGhpcyBzb2Z0d2FyZSBpbiAgKlxuKiAgICAgYSBwcm9kdWN0LCBhbiBhY2tub3dsZWRnbWVudCBpbiB0aGUgcHJvZHVjdCBkb2N1bWVudGF0aW9uIHdvdWxkIGJlICAgICAgICpcbiogICAgIGFwcHJlY2lhdGVkIGJ1dCBpcyBub3QgcmVxdWlyZWQuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4qICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgMi4gQWx0ZXJlZCBzb3VyY2UgdmVyc2lvbnMgbXVzdCBiZSBwbGFpbmx5IG1hcmtlZCBhcyBzdWNoLCBhbmQgbXVzdCBub3QgYmUgICpcbiogICAgIG1pc3JlcHJlc2VudGVkIGFzIGJlaW5nIHRoZSBvcmlnaW5hbCBzb2Z0d2FyZS4gICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4qICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKlxuKiAgMy4gVGhpcyBub3RpY2UgbWF5IG5vdCBiZSByZW1vdmVkIG9yIGFsdGVyZWQgZnJvbSBhbnkgc291cmNlIGRpc3RyaWJ1dGlvbi4gICpcbiogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4rZnVuY3Rpb24oKXtcblwidXNlIHN0cmljdFwiO1xuXG52YXIgYXJyYXkgPSAvXFxbKFteXFxbXSopXFxdJC87XG5cbi8vLyBVUkwgUmVnZXguXG4vKipcbiAqIFRoaXMgcmVnZXggc3BsaXRzIHRoZSBVUkwgaW50byBwYXJ0cy4gIFRoZSBjYXB0dXJlIGdyb3VwcyBjYXRjaCB0aGUgaW1wb3J0YW50XG4gKiBiaXRzLlxuICogXG4gKiBFYWNoIHNlY3Rpb24gaXMgb3B0aW9uYWwsIHNvIHRvIHdvcmsgb24gYW55IHBhcnQgZmluZCB0aGUgY29ycmVjdCB0b3AgbGV2ZWxcbiAqIGAoLi4uKT9gIGFuZCBtZXNzIGFyb3VuZCB3aXRoIGl0LlxuICovXG52YXIgcmVnZXggPSAvXig/OihbYS16XSopOik/KD86XFwvXFwvKT8oPzooW146QF0qKSg/OjooW15AXSopKT9AKT8oW2Etei0uX10rKT8oPzo6KFswLTldKikpPyhcXC9bXj8jXSopPyg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8kL2k7XG4vLyAgICAgICAgICAgICAgIDEgLSBzY2hlbWUgICAgICAgICAgICAgICAgMiAtIHVzZXIgICAgMyA9IHBhc3MgNCAtIGhvc3QgICAgICAgIDUgLSBwb3J0ICA2IC0gcGF0aCAgICAgICAgNyAtIHF1ZXJ5ICAgIDggLSBoYXNoXG5cbnZhciBub3NsYXNoID0gW1wibWFpbHRvXCIsXCJiaXRjb2luXCJdO1xuXG52YXIgc2VsZiA9IHtcblx0LyoqIFBhcnNlIGEgcXVlcnkgc3RyaW5nLlxuXHQgKlxuXHQgKiBUaGlzIGZ1bmN0aW9uIHBhcnNlcyBhIHF1ZXJ5IHN0cmluZyAoc29tZXRpbWVzIGNhbGxlZCB0aGUgc2VhcmNoXG5cdCAqIHN0cmluZykuICBJdCB0YWtlcyBhIHF1ZXJ5IHN0cmluZyBhbmQgcmV0dXJucyBhIG1hcCBvZiB0aGUgcmVzdWx0cy5cblx0ICpcblx0ICogS2V5cyBhcmUgY29uc2lkZXJlZCB0byBiZSBldmVyeXRoaW5nIHVwIHRvIHRoZSBmaXJzdCAnPScgYW5kIHZhbHVlcyBhcmVcblx0ICogZXZlcnl0aGluZyBhZnRlcndvcmRzLiAgU2luY2UgVVJMLWRlY29kaW5nIGlzIGRvbmUgYWZ0ZXIgcGFyc2luZywga2V5c1xuXHQgKiBhbmQgdmFsdWVzIGNhbiBoYXZlIGFueSB2YWx1ZXMsIGhvd2V2ZXIsICc9JyBoYXZlIHRvIGJlIGVuY29kZWQgaW4ga2V5c1xuXHQgKiB3aGlsZSAnPycgYW5kICcmJyBoYXZlIHRvIGJlIGVuY29kZWQgYW55d2hlcmUgKGFzIHRoZXkgZGVsaW1pdCB0aGVcblx0ICoga3YtcGFpcnMpLlxuXHQgKlxuXHQgKiBLZXlzIGFuZCB2YWx1ZXMgd2lsbCBhbHdheXMgYmUgc3RyaW5ncywgZXhjZXB0IGlmIHRoZXJlIGlzIGEga2V5IHdpdGggbm9cblx0ICogJz0nIGluIHdoaWNoIGNhc2UgaXQgd2lsbCBiZSBjb25zaWRlcmVkIGEgZmxhZyBhbmQgd2lsbCBiZSBzZXQgdG8gdHJ1ZS5cblx0ICogTGF0ZXIgdmFsdWVzIHdpbGwgb3ZlcnJpZGUgZWFybGllciB2YWx1ZXMuXG5cdCAqXG5cdCAqIEFycmF5IGtleXMgYXJlIGFsc28gc3VwcG9ydGVkLiAgQnkgZGVmYXVsdCBrZXlzIGluIHRoZSBmb3JtIG9mIGBuYW1lW2ldYFxuXHQgKiB3aWxsIGJlIHJldHVybmVkIGxpa2UgdGhhdCBhcyBzdHJpbmdzLiAgSG93ZXZlciwgaWYgeW91IHNldCB0aGUgYGFycmF5YFxuXHQgKiBmbGFnIGluIHRoZSBvcHRpb25zIG9iamVjdCB0aGV5IHdpbGwgYmUgcGFyc2VkIGludG8gYXJyYXlzLiAgTm90ZSB0aGF0XG5cdCAqIGFsdGhvdWdoIHRoZSBvYmplY3QgcmV0dXJuZWQgaXMgYW4gYEFycmF5YCBvYmplY3QgYWxsIGtleXMgd2lsbCBiZVxuXHQgKiB3cml0dGVuIHRvIGl0LiAgVGhpcyBtZWFucyB0aGF0IGlmIHlvdSBoYXZlIGEga2V5IHN1Y2ggYXMgYGtbZm9yRWFjaF1gXG5cdCAqIGl0IHdpbGwgb3ZlcndyaXRlIHRoZSBgZm9yRWFjaGAgZnVuY3Rpb24gb24gdGhhdCBhcnJheS4gIEFsc28gbm90ZSB0aGF0XG5cdCAqIHN0cmluZyBwcm9wZXJ0aWVzIGFsd2F5cyB0YWtlIHByZWNlZGVuY2Ugb3ZlciBhcnJheSBwcm9wZXJ0aWVzLFxuXHQgKiBpcnJlc3BlY3RpdmUgb2Ygd2hlcmUgdGhleSBhcmUgaW4gdGhlIHF1ZXJ5IHN0cmluZy5cblx0ICpcblx0ICogICB1cmwuZ2V0KFwiYXJyYXlbMV09dGVzdCZhcnJheVtmb29dPWJhclwiLHthcnJheTp0cnVlfSkuYXJyYXlbMV0gID09PSBcInRlc3RcIlxuXHQgKiAgIHVybC5nZXQoXCJhcnJheVsxXT10ZXN0JmFycmF5W2Zvb109YmFyXCIse2FycmF5OnRydWV9KS5hcnJheS5mb28gPT09IFwiYmFyXCJcblx0ICogICB1cmwuZ2V0KFwiYXJyYXk9bm90YW5hcnJheSZhcnJheVswXT0xXCIse2FycmF5OnRydWV9KS5hcnJheSAgICAgID09PSBcIm5vdGFuYXJyYXlcIlxuXHQgKlxuXHQgKiBJZiBhcnJheSBwYXJzaW5nIGlzIGVuYWJsZWQga2V5cyBpbiB0aGUgZm9ybSBvZiBgbmFtZVtdYCB3aWxsXG5cdCAqIGF1dG9tYXRpY2FsbHkgYmUgZ2l2ZW4gdGhlIG5leHQgYXZhaWxhYmxlIGluZGV4LiAgTm90ZSB0aGF0IHRoaXMgY2FuIGJlXG5cdCAqIG92ZXJ3cml0dGVuIHdpdGggbGF0ZXIgdmFsdWVzIGluIHRoZSBxdWVyeSBzdHJpbmcuICBGb3IgdGhpcyByZWFzb24gaXNcblx0ICogaXMgYmVzdCBub3QgdG8gbWl4IHRoZSB0d28gZm9ybWF0cywgYWx0aG91Z2ggaXQgaXMgc2FmZSAoYW5kIG9mdGVuXG5cdCAqIHVzZWZ1bCkgdG8gYWRkIGFuIGF1dG9tYXRpYyBpbmRleCBhcmd1bWVudCB0byB0aGUgZW5kIG9mIGEgcXVlcnkgc3RyaW5nLlxuXHQgKlxuXHQgKiAgIHVybC5nZXQoXCJhW109MCZhW109MSZhWzBdPTJcIiwge2FycmF5OnRydWV9KSAgLT4ge2E6W1wiMlwiLFwiMVwiXX07XG5cdCAqICAgdXJsLmdldChcImFbMF09MCZhWzFdPTEmYVtdPTJcIiwge2FycmF5OnRydWV9KSAtPiB7YTpbXCIwXCIsXCIxXCIsXCIyXCJdfTtcblx0ICpcblx0ICogQHBhcmFte3N0cmluZ30gcSBUaGUgcXVlcnkgc3RyaW5nICh0aGUgcGFydCBhZnRlciB0aGUgJz8nKS5cblx0ICogQHBhcmFte3tmdWxsOmJvb2xlYW4sYXJyYXk6Ym9vbGVhbn09fSBvcHQgT3B0aW9ucy5cblx0ICpcblx0ICogLSBmdWxsOiBJZiBzZXQgYHFgIHdpbGwgYmUgdHJlYXRlZCBhcyBhIGZ1bGwgdXJsIGFuZCBgcWAgd2lsbCBiZSBidWlsdC5cblx0ICogICBieSBjYWxsaW5nICNwYXJzZSB0byByZXRyaWV2ZSB0aGUgcXVlcnkgcG9ydGlvbi5cblx0ICogLSBhcnJheTogSWYgc2V0IGtleXMgaW4gdGhlIGZvcm0gb2YgYGtleVtpXWAgd2lsbCBiZSB0cmVhdGVkXG5cdCAqICAgYXMgYXJyYXlzL21hcHMuXG5cdCAqXG5cdCAqIEByZXR1cm57IU9iamVjdC48c3RyaW5nLCBzdHJpbmd8QXJyYXk+fSBUaGUgcGFyc2VkIHJlc3VsdC5cblx0ICovXG5cdFwiZ2V0XCI6IGZ1bmN0aW9uKHEsIG9wdCl7XG5cdFx0cSA9IHEgfHwgXCJcIjtcblx0XHRpZiAoIHR5cGVvZiBvcHQgICAgICAgICAgPT0gXCJ1bmRlZmluZWRcIiApIG9wdCA9IHt9O1xuXHRcdGlmICggdHlwZW9mIG9wdFtcImZ1bGxcIl0gID09IFwidW5kZWZpbmVkXCIgKSBvcHRbXCJmdWxsXCJdID0gZmFsc2U7XG5cdFx0aWYgKCB0eXBlb2Ygb3B0W1wiYXJyYXlcIl0gPT0gXCJ1bmRlZmluZWRcIiApIG9wdFtcImFycmF5XCJdID0gZmFsc2U7XG5cdFx0XG5cdFx0aWYgKCBvcHRbXCJmdWxsXCJdID09PSB0cnVlIClcblx0XHR7XG5cdFx0XHRxID0gc2VsZltcInBhcnNlXCJdKHEsIHtcImdldFwiOmZhbHNlfSlbXCJxdWVyeVwiXSB8fCBcIlwiO1xuXHRcdH1cblx0XHRcblx0XHR2YXIgbyA9IHt9O1xuXHRcdFxuXHRcdHZhciBjID0gcS5zcGxpdChcIiZcIik7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjLmxlbmd0aDsgaSsrKVxuXHRcdHtcblx0XHRcdGlmICghY1tpXS5sZW5ndGgpIGNvbnRpbnVlO1xuXHRcdFx0XG5cdFx0XHR2YXIgZCA9IGNbaV0uaW5kZXhPZihcIj1cIik7XG5cdFx0XHR2YXIgayA9IGNbaV0sIHYgPSB0cnVlO1xuXHRcdFx0aWYgKCBkID49IDAgKVxuXHRcdFx0e1xuXHRcdFx0XHRrID0gY1tpXS5zdWJzdHIoMCwgZCk7XG5cdFx0XHRcdHYgPSBjW2ldLnN1YnN0cihkKzEpO1xuXHRcdFx0XHRcblx0XHRcdFx0diA9IGRlY29kZVVSSUNvbXBvbmVudCh2KTtcblx0XHRcdH1cblx0XHRcdFxuXHRcdFx0aWYgKG9wdFtcImFycmF5XCJdKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgaW5kcyA9IFtdO1xuXHRcdFx0XHR2YXIgaW5kO1xuXHRcdFx0XHR2YXIgY3VybyA9IG87XG5cdFx0XHRcdHZhciBjdXJrID0gaztcblx0XHRcdFx0d2hpbGUgKGluZCA9IGN1cmsubWF0Y2goYXJyYXkpKSAvLyBBcnJheSFcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGN1cmsgPSBjdXJrLnN1YnN0cigwLCBpbmQuaW5kZXgpO1xuXHRcdFx0XHRcdGluZHMudW5zaGlmdChkZWNvZGVVUklDb21wb25lbnQoaW5kWzFdKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Y3VyayA9IGRlY29kZVVSSUNvbXBvbmVudChjdXJrKTtcblx0XHRcdFx0aWYgKGluZHMuc29tZShmdW5jdGlvbihpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKCB0eXBlb2YgY3Vyb1tjdXJrXSA9PSBcInVuZGVmaW5lZFwiICkgY3Vyb1tjdXJrXSA9IFtdO1xuXHRcdFx0XHRcdGlmICghQXJyYXkuaXNBcnJheShjdXJvW2N1cmtdKSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKFwidXJsLmdldDogQXJyYXkgcHJvcGVydHkgXCIrY3VyaytcIiBhbHJlYWR5IGV4aXN0cyBhcyBzdHJpbmchXCIpO1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGN1cm8gPSBjdXJvW2N1cmtdO1xuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdGlmICggaSA9PT0gXCJcIiApIGkgPSBjdXJvLmxlbmd0aDtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRjdXJrID0gaTtcblx0XHRcdFx0fSkpIGNvbnRpbnVlO1xuXHRcdFx0XHRjdXJvW2N1cmtdID0gdjtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGsgPSBkZWNvZGVVUklDb21wb25lbnQoayk7XG5cdFx0XHRcblx0XHRcdC8vdHlwZW9mIG9ba10gPT0gXCJ1bmRlZmluZWRcIiB8fCBjb25zb2xlLmxvZyhcIlByb3BlcnR5IFwiK2srXCIgYWxyZWFkeSBleGlzdHMhXCIpO1xuXHRcdFx0b1trXSA9IHY7XG5cdFx0fVxuXHRcdFxuXHRcdHJldHVybiBvO1xuXHR9LFxuXHRcblx0LyoqIEJ1aWxkIGEgZ2V0IHF1ZXJ5IGZyb20gYW4gb2JqZWN0LlxuXHQgKlxuXHQgKiBUaGlzIGNvbnN0cnVjdHMgYSBxdWVyeSBzdHJpbmcgZnJvbSB0aGUga3YgcGFpcnMgaW4gYGRhdGFgLiAgQ2FsbGluZ1xuXHQgKiAjZ2V0IG9uIHRoZSBzdHJpbmcgcmV0dXJuZWQgc2hvdWxkIHJldHVybiBhbiBvYmplY3QgaWRlbnRpY2FsIHRvIHRoZSBvbmVcblx0ICogcGFzc2VkIGluIGV4Y2VwdCBhbGwgbm9uLWJvb2xlYW4gc2NhbGFyIHR5cGVzIGJlY29tZSBzdHJpbmdzIGFuZCBhbGxcblx0ICogb2JqZWN0IHR5cGVzIGJlY29tZSBhcnJheXMgKG5vbi1pbnRlZ2VyIGtleXMgYXJlIHN0aWxsIHByZXNlbnQsIHNlZVxuXHQgKiAjZ2V0J3MgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBkZXRhaWxzKS5cblx0ICpcblx0ICogVGhpcyBhbHdheXMgdXNlcyBhcnJheSBzeW50YXggZm9yIGRlc2NyaWJpbmcgYXJyYXlzLiAgSWYgeW91IHdhbnQgdG9cblx0ICogc2VyaWFsaXplIHRoZW0gZGlmZmVyZW50bHkgKGxpa2UgaGF2aW5nIHRoZSB2YWx1ZSBiZSBhIEpTT04gYXJyYXkgYW5kXG5cdCAqIGhhdmUgYSBwbGFpbiBrZXkpIHlvdSB3aWxsIG5lZWQgdG8gZG8gdGhhdCBiZWZvcmUgcGFzc2luZyBpdCBpbi5cblx0ICpcblx0ICogQWxsIGtleXMgYW5kIHZhbHVlcyBhcmUgc3VwcG9ydGVkIChiaW5hcnkgZGF0YSBhbnlvbmU/KSBhcyB0aGV5IGFyZVxuXHQgKiBwcm9wZXJseSBVUkwtZW5jb2RlZCBhbmQgI2dldCBwcm9wZXJseSBkZWNvZGVzLlxuXHQgKlxuXHQgKiBAcGFyYW17T2JqZWN0fSBkYXRhIFRoZSBrdiBwYWlycy5cblx0ICogQHBhcmFte3N0cmluZ30gcHJlZml4IFRoZSBwcm9wZXJseSBlbmNvZGVkIGFycmF5IGtleSB0byBwdXQgdGhlXG5cdCAqICAgcHJvcGVydGllcy4gIE1haW5seSBpbnRlbmRlZCBmb3IgaW50ZXJuYWwgdXNlLlxuXHQgKiBAcmV0dXJue3N0cmluZ30gQSBVUkwtc2FmZSBzdHJpbmcuXG5cdCAqL1xuXHRcImJ1aWxkZ2V0XCI6IGZ1bmN0aW9uKGRhdGEsIHByZWZpeCl7XG5cdFx0dmFyIGl0bXMgPSBbXTtcblx0XHRmb3IgKCB2YXIgayBpbiBkYXRhIClcblx0XHR7XG5cdFx0XHR2YXIgZWsgPSBlbmNvZGVVUklDb21wb25lbnQoayk7XG5cdFx0XHRpZiAoIHR5cGVvZiBwcmVmaXggIT0gXCJ1bmRlZmluZWRcIiApXG5cdFx0XHRcdGVrID0gcHJlZml4K1wiW1wiK2VrK1wiXVwiO1xuXHRcdFx0XG5cdFx0XHR2YXIgdiA9IGRhdGFba107XG5cdFx0XHRcblx0XHRcdHN3aXRjaCAodHlwZW9mIHYpXG5cdFx0XHR7XG5cdFx0XHRcdGNhc2UgJ2Jvb2xlYW4nOlxuXHRcdFx0XHRcdGlmKHYpIGl0bXMucHVzaChlayk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ251bWJlcic6XG5cdFx0XHRcdFx0diA9IHYudG9TdHJpbmcoKTtcblx0XHRcdFx0Y2FzZSAnc3RyaW5nJzpcblx0XHRcdFx0XHRpdG1zLnB1c2goZWsrXCI9XCIrZW5jb2RlVVJJQ29tcG9uZW50KHYpKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnb2JqZWN0Jzpcblx0XHRcdFx0XHRpdG1zLnB1c2goc2VsZltcImJ1aWxkZ2V0XCJdKHYsIGVrKSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBpdG1zLmpvaW4oXCImXCIpO1xuXHR9LFxuXHRcblx0LyoqIFBhcnNlIGEgVVJMXG5cdCAqIFxuXHQgKiBUaGlzIGJyZWFrcyB1cCBhIFVSTCBpbnRvIGNvbXBvbmVudHMuICBJdCBhdHRlbXB0cyB0byBiZSB2ZXJ5IGxpYmVyYWxcblx0ICogYW5kIHJldHVybnMgdGhlIGJlc3QgcmVzdWx0IGluIG1vc3QgY2FzZXMuICBUaGlzIG1lYW5zIHRoYXQgeW91IGNhblxuXHQgKiBvZnRlbiBwYXNzIGluIHBhcnQgb2YgYSBVUkwgYW5kIGdldCBjb3JyZWN0IGNhdGVnb3JpZXMgYmFjay4gIE5vdGFibHksXG5cdCAqIHRoaXMgd29ya3MgZm9yIGVtYWlscyBhbmQgSmFiYmVyIElEcywgYXMgd2VsbCBhcyBhZGRpbmcgYSAnPycgdG8gdGhlXG5cdCAqIGJlZ2lubmluZyBvZiBhIHN0cmluZyB3aWxsIHBhcnNlIHRoZSB3aG9sZSB0aGluZyBhcyBhIHF1ZXJ5IHN0cmluZy4gIElmXG5cdCAqIGFuIGl0ZW0gaXMgbm90IGZvdW5kIHRoZSBwcm9wZXJ0eSB3aWxsIGJlIHVuZGVmaW5lZC4gIEluIHNvbWUgY2FzZXMgYW5cblx0ICogZW1wdHkgc3RyaW5nIHdpbGwgYmUgcmV0dXJuZWQgaWYgdGhlIHN1cnJvdW5kaW5nIHN5bnRheCBidXQgdGhlIGFjdHVhbFxuXHQgKiB2YWx1ZSBpcyBlbXB0eSAoZXhhbXBsZTogXCI6Ly9leGFtcGxlLmNvbVwiIHdpbGwgZ2l2ZSBhIGVtcHR5IHN0cmluZyBmb3Jcblx0ICogc2NoZW1lLikgIE5vdGFibHkgdGhlIGhvc3QgbmFtZSB3aWxsIGFsd2F5cyBiZSBzZXQgdG8gc29tZXRoaW5nLlxuXHQgKiBcblx0ICogUmV0dXJuZWQgcHJvcGVydGllcy5cblx0ICogXG5cdCAqIC0gKipzY2hlbWU6KiogVGhlIHVybCBzY2hlbWUuIChleDogXCJtYWlsdG9cIiBvciBcImh0dHBzXCIpXG5cdCAqIC0gKip1c2VyOioqIFRoZSB1c2VybmFtZS5cblx0ICogLSAqKnBhc3M6KiogVGhlIHBhc3N3b3JkLlxuXHQgKiAtICoqaG9zdDoqKiBUaGUgaG9zdG5hbWUuIChleDogXCJsb2NhbGhvc3RcIiwgXCIxMjMuNDU2LjcuOFwiIG9yIFwiZXhhbXBsZS5jb21cIilcblx0ICogLSAqKnBvcnQ6KiogVGhlIHBvcnQsIGFzIGEgbnVtYmVyLiAoZXg6IDEzMzcpXG5cdCAqIC0gKipwYXRoOioqIFRoZSBwYXRoLiAoZXg6IFwiL1wiIG9yIFwiL2Fib3V0Lmh0bWxcIilcblx0ICogLSAqKnF1ZXJ5OioqIFwiVGhlIHF1ZXJ5IHN0cmluZy4gKGV4OiBcImZvbz1iYXImdj0xNyZmb3JtYXQ9anNvblwiKVxuXHQgKiAtICoqZ2V0OioqIFRoZSBxdWVyeSBzdHJpbmcgcGFyc2VkIHdpdGggZ2V0LiAgSWYgYG9wdC5nZXRgIGlzIGBmYWxzZWAgdGhpc1xuXHQgKiAgIHdpbGwgYmUgYWJzZW50XG5cdCAqIC0gKipoYXNoOioqIFRoZSB2YWx1ZSBhZnRlciB0aGUgaGFzaC4gKGV4OiBcIm15YW5jaG9yXCIpXG5cdCAqICAgYmUgdW5kZWZpbmVkIGV2ZW4gaWYgYHF1ZXJ5YCBpcyBzZXQuXG5cdCAqXG5cdCAqIEBwYXJhbXtzdHJpbmd9IHVybCBUaGUgVVJMIHRvIHBhcnNlLlxuXHQgKiBAcGFyYW17e2dldDpPYmplY3R9PX0gb3B0IE9wdGlvbnM6XG5cdCAqXG5cdCAqIC0gZ2V0OiBBbiBvcHRpb25zIGFyZ3VtZW50IHRvIGJlIHBhc3NlZCB0byAjZ2V0IG9yIGZhbHNlIHRvIG5vdCBjYWxsICNnZXQuXG5cdCAqICAgICoqRE8gTk9UKiogc2V0IGBmdWxsYC5cblx0ICpcblx0ICogQHJldHVybnshT2JqZWN0fSBBbiBvYmplY3Qgd2l0aCB0aGUgcGFyc2VkIHZhbHVlcy5cblx0ICovXG5cdFwicGFyc2VcIjogZnVuY3Rpb24odXJsLCBvcHQpIHtcblx0XHRcblx0XHRpZiAoIHR5cGVvZiBvcHQgPT0gXCJ1bmRlZmluZWRcIiApIG9wdCA9IHt9O1xuXHRcdFxuXHRcdHZhciBtZCA9IHVybC5tYXRjaChyZWdleCkgfHwgW107XG5cdFx0XG5cdFx0dmFyIHIgPSB7XG5cdFx0XHRcInVybFwiOiAgICB1cmwsXG5cdFx0XHRcblx0XHRcdFwic2NoZW1lXCI6IG1kWzFdLFxuXHRcdFx0XCJ1c2VyXCI6ICAgbWRbMl0sXG5cdFx0XHRcInBhc3NcIjogICBtZFszXSxcblx0XHRcdFwiaG9zdFwiOiAgIG1kWzRdLFxuXHRcdFx0XCJwb3J0XCI6ICAgbWRbNV0gJiYgK21kWzVdLFxuXHRcdFx0XCJwYXRoXCI6ICAgbWRbNl0sXG5cdFx0XHRcInF1ZXJ5XCI6ICBtZFs3XSxcblx0XHRcdFwiaGFzaFwiOiAgIG1kWzhdLFxuXHRcdH07XG5cdFx0XG5cdFx0aWYgKCBvcHQuZ2V0ICE9PSBmYWxzZSApXG5cdFx0XHRyW1wiZ2V0XCJdID0gcltcInF1ZXJ5XCJdICYmIHNlbGZbXCJnZXRcIl0ocltcInF1ZXJ5XCJdLCBvcHQuZ2V0KTtcblx0XHRcblx0XHRyZXR1cm4gcjtcblx0fSxcblx0XG5cdC8qKiBCdWlsZCBhIFVSTCBmcm9tIGNvbXBvbmVudHMuXG5cdCAqIFxuXHQgKiBUaGlzIHBpZWNlcyB0b2dldGhlciBhIHVybCBmcm9tIHRoZSBwcm9wZXJ0aWVzIG9mIHRoZSBwYXNzZWQgaW4gb2JqZWN0LlxuXHQgKiBJbiBnZW5lcmFsIHBhc3NpbmcgdGhlIHJlc3VsdCBvZiBgcGFyc2UoKWAgc2hvdWxkIHJldHVybiB0aGUgVVJMLiAgVGhlcmVcblx0ICogbWF5IGRpZmZlcmVuY2VzIGluIHRoZSBnZXQgc3RyaW5nIGFzIHRoZSBrZXlzIGFuZCB2YWx1ZXMgbWlnaHQgYmUgbW9yZVxuXHQgKiBlbmNvZGVkIHRoZW4gdGhleSB3ZXJlIG9yaWdpbmFsbHkgd2VyZS4gIEhvd2V2ZXIsIGNhbGxpbmcgYGdldCgpYCBvbiB0aGVcblx0ICogdHdvIHZhbHVlcyBzaG91bGQgeWllbGQgdGhlIHNhbWUgcmVzdWx0LlxuXHQgKiBcblx0ICogSGVyZSBpcyBob3cgdGhlIHBhcmFtZXRlcnMgYXJlIHVzZWQuXG5cdCAqIFxuXHQgKiAgLSB1cmw6IFVzZWQgb25seSBpZiBubyBvdGhlciB2YWx1ZXMgYXJlIHByb3ZpZGVkLiAgSWYgdGhhdCBpcyB0aGUgY2FzZVxuXHQgKiAgICAgYHVybGAgd2lsbCBiZSByZXR1cm5lZCB2ZXJiYXRpbS5cblx0ICogIC0gc2NoZW1lOiBVc2VkIGlmIGRlZmluZWQuXG5cdCAqICAtIHVzZXI6IFVzZWQgaWYgZGVmaW5lZC5cblx0ICogIC0gcGFzczogVXNlZCBpZiBkZWZpbmVkLlxuXHQgKiAgLSBob3N0OiBVc2VkIGlmIGRlZmluZWQuXG5cdCAqICAtIHBhdGg6IFVzZWQgaWYgZGVmaW5lZC5cblx0ICogIC0gcXVlcnk6IFVzZWQgb25seSBpZiBgZ2V0YCBpcyBub3QgcHJvdmlkZWQgYW5kIG5vbi1lbXB0eS5cblx0ICogIC0gZ2V0OiBVc2VkIGlmIG5vbi1lbXB0eS4gIFBhc3NlZCB0byAjYnVpbGRnZXQgYW5kIHRoZSByZXN1bHQgaXMgdXNlZFxuXHQgKiAgICBhcyB0aGUgcXVlcnkgc3RyaW5nLlxuXHQgKiAgLSBoYXNoOiBVc2VkIGlmIGRlZmluZWQuXG5cdCAqIFxuXHQgKiBUaGVzZSBhcmUgdGhlIG9wdGlvbnMgdGhhdCBhcmUgdmFsaWQgb24gdGhlIG9wdGlvbnMgb2JqZWN0LlxuXHQgKiBcblx0ICogIC0gdXNlZW1wdHlnZXQ6IElmIHRydXRoeSwgYSBxdWVzdGlvbiBtYXJrIHdpbGwgYmUgYXBwZW5kZWQgZm9yIGVtcHR5IGdldFxuXHQgKiAgICBzdHJpbmdzLiAgVGhpcyBub3RhYmx5IG1ha2VzIGBidWlsZCgpYCBhbmQgYHBhcnNlKClgIGZ1bGx5IHN5bW1ldHJpYy5cblx0ICpcblx0ICogQHBhcmFte09iamVjdH0gZGF0YSBUaGUgcGllY2VzIG9mIHRoZSBVUkwuXG5cdCAqIEBwYXJhbXtPYmplY3R9IG9wdCBPcHRpb25zIGZvciBidWlsZGluZyB0aGUgdXJsLlxuXHQgKiBAcmV0dXJue3N0cmluZ30gVGhlIFVSTC5cblx0ICovXG5cdFwiYnVpbGRcIjogZnVuY3Rpb24oZGF0YSwgb3B0KXtcblx0XHRvcHQgPSBvcHQgfHwge307XG5cdFx0XG5cdFx0dmFyIHIgPSBcIlwiO1xuXHRcdFxuXHRcdGlmICggdHlwZW9mIGRhdGFbXCJzY2hlbWVcIl0gIT0gXCJ1bmRlZmluZWRcIiApXG5cdFx0e1xuXHRcdFx0ciArPSBkYXRhW1wic2NoZW1lXCJdO1xuXHRcdFx0ciArPSAobm9zbGFzaC5pbmRleE9mKGRhdGFbXCJzY2hlbWVcIl0pPj0wKT9cIjpcIjpcIjovL1wiO1xuXHRcdH1cblx0XHRpZiAoIHR5cGVvZiBkYXRhW1widXNlclwiXSAhPSBcInVuZGVmaW5lZFwiIClcblx0XHR7XG5cdFx0XHRyICs9IGRhdGFbXCJ1c2VyXCJdO1xuXHRcdFx0aWYgKCB0eXBlb2YgZGF0YVtcInBhc3NcIl0gPT0gXCJ1bmRlZmluZWRcIiApXG5cdFx0XHR7XG5cdFx0XHRcdHIgKz0gXCJAXCI7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmICggdHlwZW9mIGRhdGFbXCJwYXNzXCJdICE9IFwidW5kZWZpbmVkXCIgKSByICs9IFwiOlwiICsgZGF0YVtcInBhc3NcIl0gKyBcIkBcIjtcblx0XHRpZiAoIHR5cGVvZiBkYXRhW1wiaG9zdFwiXSAhPSBcInVuZGVmaW5lZFwiICkgciArPSBkYXRhW1wiaG9zdFwiXTtcblx0XHRpZiAoIHR5cGVvZiBkYXRhW1wicG9ydFwiXSAhPSBcInVuZGVmaW5lZFwiICkgciArPSBcIjpcIiArIGRhdGFbXCJwb3J0XCJdO1xuXHRcdGlmICggdHlwZW9mIGRhdGFbXCJwYXRoXCJdICE9IFwidW5kZWZpbmVkXCIgKSByICs9IGRhdGFbXCJwYXRoXCJdO1xuXHRcdFxuXHRcdGlmIChvcHRbXCJ1c2VlbXB0eWdldFwiXSlcblx0XHR7XG5cdFx0XHRpZiAgICAgICggdHlwZW9mIGRhdGFbXCJnZXRcIl0gICAhPSBcInVuZGVmaW5lZFwiICkgciArPSBcIj9cIiArIHNlbGZbXCJidWlsZGdldFwiXShkYXRhW1wiZ2V0XCJdKTtcblx0XHRcdGVsc2UgaWYgKCB0eXBlb2YgZGF0YVtcInF1ZXJ5XCJdICE9IFwidW5kZWZpbmVkXCIgKSByICs9IFwiP1wiICsgZGF0YVtcInF1ZXJ5XCJdO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0Ly8gSWYgLmdldCB1c2UgaXQuICBJZiAuZ2V0IGxlYWRzIHRvIGVtcHR5LCB1c2UgLnF1ZXJ5LlxuXHRcdFx0dmFyIHEgPSBkYXRhW1wiZ2V0XCJdICYmIHNlbGZbXCJidWlsZGdldFwiXShkYXRhW1wiZ2V0XCJdKSB8fCBkYXRhW1wicXVlcnlcIl07XG5cdFx0XHRpZiAocSkgciArPSBcIj9cIiArIHE7XG5cdFx0fVxuXHRcdFxuXHRcdGlmICggdHlwZW9mIGRhdGFbXCJoYXNoXCJdICE9IFwidW5kZWZpbmVkXCIgKSByICs9IFwiI1wiICsgZGF0YVtcImhhc2hcIl07XG5cdFx0XG5cdFx0cmV0dXJuIHIgfHwgZGF0YVtcInVybFwiXSB8fCBcIlwiO1xuXHR9LFxufTtcblxuaWYgKCB0eXBlb2YgZGVmaW5lICE9IFwidW5kZWZpbmVkXCIgJiYgZGVmaW5lW1wiYW1kXCJdICkgZGVmaW5lKHNlbGYpO1xuZWxzZSBpZiAoIHR5cGVvZiBtb2R1bGUgIT0gXCJ1bmRlZmluZWRcIiApIG1vZHVsZVsnZXhwb3J0cyddID0gc2VsZjtcbmVsc2Ugd2luZG93W1widXJsXCJdID0gc2VsZjtcblxufSgpO1xuIiwiLyoqXG4gKiBNb2R1bGUgZm9yIG1hbmFnaW5nIG1vZGFsIHByb21wdCBpbnN0YW5jZXMuXG4gKiBOT1RFOiBUaGlzIG1vZHVsZSBpcyBjdXJyZW50bHkgbGltaXRlZCBpbiBhIG51bWJlclxuICogICAgICAgb2Ygd2F5cy4gRm9yIG9uZSwgaXQgb25seSBhbGxvd3MgcmFkaW9cbiAqICAgICAgIGlucHV0IG9wdGlvbnMuIEFkZGl0aW9uYWxseSwgaXQgaGFyZC1jb2RlcyBpblxuICogICAgICAgYSBudW1iZXIgb2Ygb3RoZXIgYmVoYXZpb3JzIHdoaWNoIGFyZSBzcGVjaWZpY1xuICogICAgICAgdG8gdGhlIGltYWdlIGltcG9ydCBzdHlsZSBwcm9tcHQgKGZvciB3aGljaFxuICogICAgICAgdGhpcyBtb2R1bGUgd2FzIHdyaXR0ZW4pLlxuICogICAgICAgSWYgZGVzaXJlZCwgdGhpcyBtb2R1bGUgbWF5IGJlIG1hZGUgbW9yZVxuICogICAgICAgZ2VuZXJhbC1wdXJwb3NlIGluIHRoZSBmdXR1cmUsIGJ1dCwgZm9yIG5vdyxcbiAqICAgICAgIGJlIGF3YXJlIG9mIHRoZXNlIGxpbWl0YXRpb25zLlxuICovXG5kZWZpbmUoXCJjcG8vbW9kYWwtcHJvbXB0XCIsIFtcInFcIl0sIGZ1bmN0aW9uKFEpIHtcblxuICBmdW5jdGlvbiBhdXRvSGlnaGxpZ2h0Qm94KHRleHQpIHtcbiAgICB2YXIgdGV4dEJveCA9ICQoXCI8aW5wdXQgdHlwZT0ndGV4dCc+XCIpLmFkZENsYXNzKFwiYXV0by1oaWdobGlnaHRcIik7XG4gICAgdGV4dEJveC5hdHRyKFwicmVhZG9ubHlcIiwgXCJyZWFkb25seVwiKTtcbiAgICB0ZXh0Qm94Lm9uKFwiZm9jdXNcIiwgZnVuY3Rpb24oKSB7ICQodGhpcykuc2VsZWN0KCk7IH0pO1xuICAgIHRleHRCb3gub24oXCJtb3VzZXVwXCIsIGZ1bmN0aW9uKCkgeyAkKHRoaXMpLnNlbGVjdCgpOyB9KTtcbiAgICB0ZXh0Qm94LnZhbCh0ZXh0KTtcbiAgICByZXR1cm4gdGV4dEJveDtcblxuXG4gIH1cblxuICAvLyBBbGxvd3MgYXN5bmNocm9ub3VzIHJlcXVlc3Rpbmcgb2YgcHJvbXB0c1xuICB2YXIgcHJvbXB0UXVldWUgPSBRKCk7XG4gIHZhciBzdHlsZXMgPSBbXG4gICAgXCJyYWRpb1wiLCBcInRpbGVzXCIsIFwidGV4dFwiLCBcImNvcHlUZXh0XCIsIFwiY29uZmlybVwiXG4gIF07XG5cbiAgd2luZG93Lm1vZGFscyA9IFtdO1xuXG4gIC8qKlxuICAgKiBSZXByZXNlbnRzIGFuIG9wdGlvbiB0byBwcmVzZW50IHRoZSB1c2VyXG4gICAqIEB0eXBlZGVmIHtPYmplY3R9IE1vZGFsT3B0aW9uXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBtZXNzYWdlIC0gVGhlIG1lc3NhZ2UgdG8gc2hvdyB0aGUgdXNlciB3aGljaFxuICAgICAgICAgICAgICAgZGVzY3JpYmVzIHRoaXMgb3B0aW9uXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSB2YWx1ZSAtIFRoZSB2YWx1ZSB0byByZXR1cm4gaWYgdGhpcyBvcHRpb24gaXMgY2hvc2VuXG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbZXhhbXBsZV0gLSBBIGNvZGUgc25pcHBldCB0byBzaG93IHdpdGggdGhpcyBvcHRpb25cbiAgICovXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yIGZvciBtb2RhbCBwcm9tcHRzLlxuICAgKiBAcGFyYW0ge01vZGFsT3B0aW9uW119IG9wdGlvbnMgLSBUaGUgb3B0aW9ucyB0byBwcmVzZW50IHRoZSB1c2VyXG4gICAqL1xuICBmdW5jdGlvbiBQcm9tcHQob3B0aW9ucykge1xuICAgIHdpbmRvdy5tb2RhbHMucHVzaCh0aGlzKTtcbiAgICBpZiAoIW9wdGlvbnMgfHxcbiAgICAgICAgKHN0eWxlcy5pbmRleE9mKG9wdGlvbnMuc3R5bGUpID09PSAtMSkgfHxcbiAgICAgICAgIW9wdGlvbnMub3B0aW9ucyB8fFxuICAgICAgICAodHlwZW9mIG9wdGlvbnMub3B0aW9ucy5sZW5ndGggIT09IFwibnVtYmVyXCIpIHx8IChvcHRpb25zLm9wdGlvbnMubGVuZ3RoID09PSAwKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBQcm9tcHQgT3B0aW9uc1wiLCBvcHRpb25zKTtcbiAgICB9XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLm1vZGFsID0gJChcIiNwcm9tcHRNb2RhbFwiKTtcbiAgICBpZiAodGhpcy5vcHRpb25zLnN0eWxlID09PSBcInJhZGlvXCIpIHtcbiAgICAgIHRoaXMuZWx0cyA9ICQoJC5wYXJzZUhUTUwoXCI8dGFibGU+PC90YWJsZT5cIikpLmFkZENsYXNzKFwiY2hvaWNlQ29udGFpbmVyXCIpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnN0eWxlID09PSBcInRleHRcIikge1xuICAgICAgdGhpcy5lbHRzID0gJChcIjxkaXY+XCIpLmFkZENsYXNzKFwiY2hvaWNlQ29udGFpbmVyXCIpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnN0eWxlID09PSBcImNvcHlUZXh0XCIpIHtcbiAgICAgIHRoaXMuZWx0cyA9ICQoXCI8ZGl2PlwiKS5hZGRDbGFzcyhcImNob2ljZUNvbnRhaW5lclwiKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMub3B0aW9ucy5zdHlsZSA9PT0gXCJjb25maXJtXCIpIHtcbiAgICAgIHRoaXMuZWx0cyA9ICQoXCI8ZGl2PlwiKS5hZGRDbGFzcyhcImNob2ljZUNvbnRhaW5lclwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbHRzID0gJCgkLnBhcnNlSFRNTChcIjxkaXY+PC9kaXY+XCIpKS5hZGRDbGFzcyhcImNob2ljZUNvbnRhaW5lclwiKTtcbiAgICB9XG4gICAgdGhpcy50aXRsZSA9ICQoXCIubW9kYWwtaGVhZGVyID4gaDNcIiwgdGhpcy5tb2RhbCk7XG4gICAgdGhpcy5tb2RhbENvbnRlbnQgPSAkKFwiLm1vZGFsLWNvbnRlbnRcIiwgdGhpcy5tb2RhbCk7XG4gICAgdGhpcy5jbG9zZUJ1dHRvbiA9ICQoXCIuY2xvc2VcIiwgdGhpcy5tb2RhbCk7XG4gICAgdGhpcy5zdWJtaXRCdXR0b24gPSAkKFwiLnN1Ym1pdFwiLCB0aGlzLm1vZGFsKTtcbiAgICBpZih0aGlzLm9wdGlvbnMuc3VibWl0VGV4dCkge1xuICAgICAgdGhpcy5zdWJtaXRCdXR0b24udGV4dCh0aGlzLm9wdGlvbnMuc3VibWl0VGV4dCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5zdWJtaXRCdXR0b24udGV4dChcIlN1Ym1pdFwiKTtcbiAgICB9XG4gICAgaWYodGhpcy5vcHRpb25zLmNhbmNlbFRleHQpIHtcbiAgICAgIHRoaXMuY2xvc2VCdXR0b24udGV4dCh0aGlzLm9wdGlvbnMuY2FuY2VsVGV4dCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5jbG9zZUJ1dHRvbi50ZXh0KFwiQ2FuY2VsXCIpO1xuICAgIH1cbiAgICB0aGlzLm1vZGFsQ29udGVudC50b2dnbGVDbGFzcyhcIm5hcnJvd1wiLCAhIXRoaXMub3B0aW9ucy5uYXJyb3cpO1xuXG4gICAgdGhpcy5pc0NvbXBpbGVkID0gZmFsc2U7XG4gICAgdGhpcy5kZWZlcnJlZCA9IFEuZGVmZXIoKTtcbiAgICB0aGlzLnByb21pc2UgPSB0aGlzLmRlZmVycmVkLnByb21pc2U7XG4gIH1cblxuICAvKipcbiAgICogVHlwZSBmb3IgaGFuZGxlcnMgb2YgcmVzcG9uc2VzIGZyb20gbW9kYWwgcHJvbXB0c1xuICAgKiBAY2FsbGJhY2sgcHJvbXB0Q2FsbGJhY2tcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlc3AgLSBUaGUgcmVzcG9uc2UgZnJvbSB0aGUgdXNlclxuICAgKi9cblxuICAvKipcbiAgICogU2hvd3MgdGhpcyBwcm9tcHQgdG8gdGhlIHVzZXIgKHdpbGwgd2FpdCB1bnRpbCBhbnkgYWN0aXZlXG4gICAqIHByb21wdHMgaGF2ZSBmaW5pc2hlZClcbiAgICogQHBhcmFtIHtwcm9tcHRDYWxsYmFja30gW2NhbGxiYWNrXSAtIE9wdGlvbmFsIGNhbGxiYWNrIHdoaWNoIGlzIHBhc3NlZCB0aGVcbiAgICogICAgICAgIHJlc3VsdCBvZiB0aGUgcHJvbXB0XG4gICAqIEByZXR1cm5zIEEgcHJvbWlzZSByZXNvbHZpbmcgdG8gZWl0aGVyIHRoZSByZXN1bHQgb2YgYGNhbGxiYWNrYCwgaWYgcHJvdmlkZWQsXG4gICAqICAgICAgICAgIG9yIHRoZSByZXN1bHQgb2YgdGhlIHByb21wdCwgb3RoZXJ3aXNlLlxuICAgKi9cbiAgUHJvbXB0LnByb3RvdHlwZS5zaG93ID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAvLyBVc2UgdGhlIHByb21pc2UgcXVldWUgdG8gbWFrZSBzdXJlIHRoZXJlJ3Mgbm8gb3RoZXJcbiAgICAvLyBwcm9tcHQgYmVpbmcgc2hvd24gY3VycmVudGx5XG4gICAgaWYgKHRoaXMub3B0aW9ucy5oaWRlU3VibWl0KSB7XG4gICAgICB0aGlzLnN1Ym1pdEJ1dHRvbi5oaWRlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc3VibWl0QnV0dG9uLnNob3coKTtcbiAgICB9XG4gICAgdGhpcy5jbG9zZUJ1dHRvbi5jbGljayh0aGlzLm9uQ2xvc2UuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5tb2RhbC5rZXlwcmVzcyhmdW5jdGlvbihlKSB7XG4gICAgICBpZihlLndoaWNoID09IDEzKSB7XG4gICAgICAgIHRoaXMuc3VibWl0QnV0dG9uLmNsaWNrKCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9LmJpbmQodGhpcykpO1xuICAgIHRoaXMuc3VibWl0QnV0dG9uLmNsaWNrKHRoaXMub25TdWJtaXQuYmluZCh0aGlzKSk7XG4gICAgdmFyIGRvY0NsaWNrID0gKGZ1bmN0aW9uKGUpIHtcbiAgICAgIC8vIElmIHRoZSBwcm9tcHQgaXMgYWN0aXZlIGFuZCB0aGUgYmFja2dyb3VuZCBpcyBjbGlja2VkLFxuICAgICAgLy8gdGhlbiBjbG9zZS5cbiAgICAgIGlmICgkKGUudGFyZ2V0KS5pcyh0aGlzLm1vZGFsKSAmJiB0aGlzLmRlZmVycmVkKSB7XG4gICAgICAgIHRoaXMub25DbG9zZShlKTtcbiAgICAgICAgJChkb2N1bWVudCkub2ZmKFwiY2xpY2tcIiwgZG9jQ2xpY2spO1xuICAgICAgfVxuICAgIH0pLmJpbmQodGhpcyk7XG4gICAgJChkb2N1bWVudCkuY2xpY2soZG9jQ2xpY2spO1xuICAgIHZhciBkb2NLZXlkb3duID0gKGZ1bmN0aW9uKGUpIHtcbiAgICAgIGlmIChlLmtleSA9PT0gXCJFc2NhcGVcIikge1xuICAgICAgICB0aGlzLm9uQ2xvc2UoZSk7XG4gICAgICAgICQoZG9jdW1lbnQpLm9mZihcImtleWRvd25cIiwgZG9jS2V5ZG93bik7XG4gICAgICB9XG4gICAgfSkuYmluZCh0aGlzKTtcbiAgICAkKGRvY3VtZW50KS5rZXlkb3duKGRvY0tleWRvd24pO1xuICAgIHRoaXMudGl0bGUudGV4dCh0aGlzLm9wdGlvbnMudGl0bGUpO1xuICAgIHRoaXMucG9wdWxhdGVNb2RhbCgpO1xuICAgIHRoaXMubW9kYWwuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJyk7XG4gICAgJChcIjppbnB1dDplbmFibGVkOnZpc2libGU6Zmlyc3RcIiwgdGhpcy5tb2RhbCkuZm9jdXMoKS5zZWxlY3QoKVxuXG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICByZXR1cm4gdGhpcy5wcm9taXNlLnRoZW4oY2FsbGJhY2spO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5wcm9taXNlO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBDbGVhcnMgdGhlIGNvbnRlbnRzIG9mIHRoZSBtb2RhbCBwcm9tcHQuXG4gICAqL1xuICBQcm9tcHQucHJvdG90eXBlLmNsZWFyTW9kYWwgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLnN1Ym1pdEJ1dHRvbi5vZmYoKTtcbiAgICB0aGlzLmNsb3NlQnV0dG9uLm9mZigpO1xuICAgIHRoaXMuZWx0cy5lbXB0eSgpO1xuICB9O1xuICBcbiAgLyoqXG4gICAqIFBvcHVsYXRlcyB0aGUgY29udGVudHMgb2YgdGhlIG1vZGFsIHByb21wdCB3aXRoIHRoZVxuICAgKiBvcHRpb25zIGluIHRoaXMgcHJvbXB0LlxuICAgKi9cbiAgUHJvbXB0LnByb3RvdHlwZS5wb3B1bGF0ZU1vZGFsID0gZnVuY3Rpb24oKSB7XG4gICAgZnVuY3Rpb24gY3JlYXRlUmFkaW9FbHQob3B0aW9uLCBpZHgpIHtcbiAgICAgIHZhciBlbHQgPSAkKCQucGFyc2VIVE1MKFwiPGlucHV0IG5hbWU9XFxcInB5cmV0LW1vZGFsXFxcIiB0eXBlPVxcXCJyYWRpb1xcXCI+XCIpKTtcbiAgICAgIHZhciBpZCA9IFwiclwiICsgaWR4LnRvU3RyaW5nKCk7XG4gICAgICB2YXIgbGFiZWwgPSAkKCQucGFyc2VIVE1MKFwiPGxhYmVsIGZvcj1cXFwiXCIgKyBpZCArIFwiXFxcIj48L2xhYmVsPlwiKSk7XG4gICAgICBlbHQuYXR0cihcImlkXCIsIGlkKTtcbiAgICAgIGVsdC5hdHRyKFwidmFsdWVcIiwgb3B0aW9uLnZhbHVlKTtcbiAgICAgIGxhYmVsLnRleHQob3B0aW9uLm1lc3NhZ2UpO1xuICAgICAgdmFyIGVsdENvbnRhaW5lciA9ICQoJC5wYXJzZUhUTUwoXCI8dGQgY2xhc3M9XFxcInB5cmV0LW1vZGFsLW9wdGlvbi1yYWRpb1xcXCI+PC90ZD5cIikpO1xuICAgICAgZWx0Q29udGFpbmVyLmFwcGVuZChlbHQpO1xuICAgICAgdmFyIGxhYmVsQ29udGFpbmVyID0gJCgkLnBhcnNlSFRNTChcIjx0ZCBjbGFzcz1cXFwicHlyZXQtbW9kYWwtb3B0aW9uLW1lc3NhZ2VcXFwiPjwvdGQ+XCIpKTtcbiAgICAgIGxhYmVsQ29udGFpbmVyLmFwcGVuZChsYWJlbCk7XG4gICAgICB2YXIgY29udGFpbmVyID0gJCgkLnBhcnNlSFRNTChcIjx0ciBjbGFzcz1cXFwicHlyZXQtbW9kYWwtb3B0aW9uXFxcIj48L3RyPlwiKSk7XG4gICAgICBjb250YWluZXIuYXBwZW5kKGVsdENvbnRhaW5lcik7XG4gICAgICBjb250YWluZXIuYXBwZW5kKGxhYmVsQ29udGFpbmVyKTtcbiAgICAgIGlmIChvcHRpb24uZXhhbXBsZSkge1xuICAgICAgICB2YXIgZXhhbXBsZSA9ICQoJC5wYXJzZUhUTUwoXCI8ZGl2PjwvZGl2PlwiKSk7XG4gICAgICAgIHZhciBjbSA9IENvZGVNaXJyb3IoZXhhbXBsZVswXSwge1xuICAgICAgICAgIHZhbHVlOiBvcHRpb24uZXhhbXBsZSxcbiAgICAgICAgICBtb2RlOiAncHlyZXQnLFxuICAgICAgICAgIGxpbmVOdW1iZXJzOiBmYWxzZSxcbiAgICAgICAgICByZWFkT25seTogXCJub2N1cnNvclwiIC8vIHRoaXMgbWFrZXMgaXQgcmVhZE9ubHkgJiBub3QgZm9jdXNhYmxlIGFzIGEgZm9ybSBpbnB1dFxuICAgICAgICB9KTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgIGNtLnJlZnJlc2goKTtcbiAgICAgICAgfSwgMSk7XG4gICAgICAgIHZhciBleGFtcGxlQ29udGFpbmVyID0gJCgkLnBhcnNlSFRNTChcIjx0ZCBjbGFzcz1cXFwicHlyZXQtbW9kYWwtb3B0aW9uLWV4YW1wbGVcXFwiPjwvdGQ+XCIpKTtcbiAgICAgICAgZXhhbXBsZUNvbnRhaW5lci5hcHBlbmQoZXhhbXBsZSk7XG4gICAgICAgIGNvbnRhaW5lci5hcHBlbmQoZXhhbXBsZUNvbnRhaW5lcik7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJldHVybiBjb250YWluZXI7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNyZWF0ZVRpbGVFbHQob3B0aW9uLCBpZHgpIHtcbiAgICAgIHZhciBlbHQgPSAkKCQucGFyc2VIVE1MKFwiPGJ1dHRvbiBuYW1lPVxcXCJweXJldC1tb2RhbFxcXCIgY2xhc3M9XFxcInRpbGVcXFwiPjwvYnV0dG9uPlwiKSk7XG4gICAgICBlbHQuYXR0cihcImlkXCIsIFwidFwiICsgaWR4LnRvU3RyaW5nKCkpO1xuICAgICAgZWx0LmFwcGVuZCgkKFwiPGI+XCIpLnRleHQob3B0aW9uLm1lc3NhZ2UpKVxuICAgICAgICAuYXBwZW5kKCQoXCI8cD5cIikudGV4dChvcHRpb24uZGV0YWlscykpO1xuICAgICAgZm9yICh2YXIgZXZ0IGluIG9wdGlvbi5vbilcbiAgICAgICAgZWx0Lm9uKGV2dCwgb3B0aW9uLm9uW2V2dF0pO1xuICAgICAgcmV0dXJuIGVsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVUZXh0RWx0KG9wdGlvbikge1xuICAgICAgdmFyIGVsdCA9ICQoXCI8ZGl2IGNsYXNzPVxcXCJweXJldC1tb2RhbC10ZXh0XFxcIj5cIik7XG4gICAgICBjb25zdCBpbnB1dCA9ICQoXCI8aW5wdXQgaWQ9J21vZGFsLXByb21wdC10ZXh0JyB0eXBlPSd0ZXh0Jz5cIikudmFsKG9wdGlvbi5kZWZhdWx0VmFsdWUpO1xuICAgICAgaWYob3B0aW9uLmRyYXdFbGVtZW50KSB7XG4gICAgICAgIGVsdC5hcHBlbmQob3B0aW9uLmRyYXdFbGVtZW50KGlucHV0KSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgZWx0LmFwcGVuZCgkKFwiPGxhYmVsIGZvcj0nbW9kYWwtcHJvbXB0LXRleHQnPlwiKS5hZGRDbGFzcyhcInRleHRMYWJlbFwiKS50ZXh0KG9wdGlvbi5tZXNzYWdlKSk7XG4gICAgICAgIGVsdC5hcHBlbmQoaW5wdXQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVDb3B5VGV4dEVsdChvcHRpb24pIHtcbiAgICAgIHZhciBlbHQgPSAkKFwiPGRpdj5cIik7XG4gICAgICBlbHQuYXBwZW5kKCQoXCI8cD5cIikuYWRkQ2xhc3MoXCJ0ZXh0TGFiZWxcIikudGV4dChvcHRpb24ubWVzc2FnZSkpO1xuICAgICAgaWYob3B0aW9uLnRleHQpIHtcbiAgICAgICAgdmFyIGJveCA9IGF1dG9IaWdobGlnaHRCb3gob3B0aW9uLnRleHQpO1xuICAvLyAgICAgIGVsdC5hcHBlbmQoJChcIjxzcGFuPlwiKS50ZXh0KFwiKFwiICsgb3B0aW9uLmRldGFpbHMgKyBcIilcIikpO1xuICAgICAgICBlbHQuYXBwZW5kKGJveCk7XG4gICAgICAgIGJveC5mb2N1cygpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVsdDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjcmVhdGVDb25maXJtRWx0KG9wdGlvbikge1xuICAgICAgcmV0dXJuICQoXCI8cD5cIikudGV4dChvcHRpb24ubWVzc2FnZSk7XG4gICAgfVxuXG4gICAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gY3JlYXRlRWx0KG9wdGlvbiwgaSkge1xuICAgICAgaWYodGhhdC5vcHRpb25zLnN0eWxlID09PSBcInJhZGlvXCIpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZVJhZGlvRWx0KG9wdGlvbiwgaSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKHRoYXQub3B0aW9ucy5zdHlsZSA9PT0gXCJ0aWxlc1wiKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVUaWxlRWx0KG9wdGlvbiwgaSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKHRoYXQub3B0aW9ucy5zdHlsZSA9PT0gXCJ0ZXh0XCIpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZVRleHRFbHQob3B0aW9uKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYodGhhdC5vcHRpb25zLnN0eWxlID09PSBcImNvcHlUZXh0XCIpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUNvcHlUZXh0RWx0KG9wdGlvbik7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKHRoYXQub3B0aW9ucy5zdHlsZSA9PT0gXCJjb25maXJtXCIpIHtcbiAgICAgICAgcmV0dXJuIGNyZWF0ZUNvbmZpcm1FbHQob3B0aW9uKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgb3B0aW9uRWx0cztcbiAgICAvLyBDYWNoZSByZXN1bHRzXG4vLyAgICBpZiAodHJ1ZSkge1xuICAgICAgb3B0aW9uRWx0cyA9IHRoaXMub3B0aW9ucy5vcHRpb25zLm1hcChjcmVhdGVFbHQpO1xuLy8gICAgICB0aGlzLmNvbXBpbGVkRWx0cyA9IG9wdGlvbkVsdHM7XG4vLyAgICAgIHRoaXMuaXNDb21waWxlZCA9IHRydWU7XG4vLyAgICB9IGVsc2Uge1xuLy8gICAgICBvcHRpb25FbHRzID0gdGhpcy5jb21waWxlZEVsdHM7XG4vLyAgICB9XG4gICAgJChcImlucHV0W3R5cGU9J3JhZGlvJ11cIiwgb3B0aW9uRWx0c1swXSkuYXR0cignY2hlY2tlZCcsIHRydWUpO1xuICAgIHRoaXMuZWx0cy5hcHBlbmQob3B0aW9uRWx0cyk7XG4gICAgJChcIi5tb2RhbC1ib2R5XCIsIHRoaXMubW9kYWwpLmVtcHR5KCkuYXBwZW5kKHRoaXMuZWx0cyk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEhhbmRsZXIgd2hpY2ggaXMgY2FsbGVkIHdoZW4gdGhlIHVzZXIgZG9lcyBub3Qgc2VsZWN0IGFueXRoaW5nXG4gICAqL1xuICBQcm9tcHQucHJvdG90eXBlLm9uQ2xvc2UgPSBmdW5jdGlvbihlKSB7XG4gICAgdGhpcy5tb2RhbC5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgIHRoaXMuY2xlYXJNb2RhbCgpO1xuICAgIHRoaXMuZGVmZXJyZWQucmVzb2x2ZShudWxsKTtcbiAgICBkZWxldGUgdGhpcy5kZWZlcnJlZDtcbiAgICBkZWxldGUgdGhpcy5wcm9taXNlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBIYW5kbGVyIHdoaWNoIGlzIGNhbGxlZCB3aGVuIHRoZSB1c2VyIHByZXNzZXMgXCJzdWJtaXRcIlxuICAgKi9cbiAgUHJvbXB0LnByb3RvdHlwZS5vblN1Ym1pdCA9IGZ1bmN0aW9uKGUpIHtcbiAgICBpZih0aGlzLm9wdGlvbnMuc3R5bGUgPT09IFwicmFkaW9cIikge1xuICAgICAgdmFyIHJldHZhbCA9ICQoXCJpbnB1dFt0eXBlPSdyYWRpbyddOmNoZWNrZWRcIiwgdGhpcy5tb2RhbCkudmFsKCk7XG4gICAgfVxuICAgIGVsc2UgaWYodGhpcy5vcHRpb25zLnN0eWxlID09PSBcInRleHRcIikge1xuICAgICAgdmFyIHJldHZhbCA9ICQoXCJpbnB1dFt0eXBlPSd0ZXh0J11cIiwgdGhpcy5tb2RhbCkudmFsKCk7XG4gICAgfVxuICAgIGVsc2UgaWYodGhpcy5vcHRpb25zLnN0eWxlID09PSBcImNvcHlUZXh0XCIpIHtcbiAgICAgIHZhciByZXR2YWwgPSB0cnVlO1xuICAgIH1cbiAgICBlbHNlIGlmKHRoaXMub3B0aW9ucy5zdHlsZSA9PT0gXCJjb25maXJtXCIpIHtcbiAgICAgIHZhciByZXR2YWwgPSB0cnVlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHZhciByZXR2YWwgPSB0cnVlOyAvLyBKdXN0IHJldHVybiB0cnVlIGlmIHRoZXkgY2xpY2tlZCBzdWJtaXRcbiAgICB9XG4gICAgdGhpcy5tb2RhbC5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgIHRoaXMuY2xlYXJNb2RhbCgpO1xuICAgIHRoaXMuZGVmZXJyZWQucmVzb2x2ZShyZXR2YWwpO1xuICAgIGRlbGV0ZSB0aGlzLmRlZmVycmVkO1xuICAgIGRlbGV0ZSB0aGlzLnByb21pc2U7XG4gIH07XG5cbiAgcmV0dXJuIFByb21wdDtcblxufSk7XG5cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvKiBnbG9iYWwgJCBqUXVlcnkgQ1BPIENvZGVNaXJyb3Igc3RvcmFnZUFQSSBRIGNyZWF0ZVByb2dyYW1Db2xsZWN0aW9uQVBJIG1ha2VTaGFyZUFQSSAqL1xuXG52YXIgb3JpZ2luYWxQYWdlTG9hZCA9IERhdGUubm93KCk7XG5jb25zb2xlLmxvZyhcIm9yaWdpbmFsUGFnZUxvYWQ6IFwiLCBvcmlnaW5hbFBhZ2VMb2FkKTtcblxuLy8gVHJhbnNwYXJlbnRseSByb3V0ZSBicm93c2VyIGZldGNoZXMgdG8gYWxsb3dsaXN0ZWQgaG9zdHMgdGhyb3VnaCB0aGVcbi8vIHNlcnZlci1zaWRlIHByb3h5IGF0IC9sb2FkLXNoYXJldXJsLCBidXQgb25seSB3aGVuIHRoZSBkaXJlY3QgcGF0aCBkb2Vzbid0XG4vLyB3b3JrLlxuLy9cbi8vIFN0cmF0ZWd5OiB0aGUgRklSU1QgZmV0Y2ggdG8gYW4gYWxsb3dsaXN0ZWQgaG9zdCBmaXJlcyBkaXJlY3QgKyBwcm94aWVkIGluXG4vLyBwYXJhbGxlbC4gV2UgZGVjaWRlIHNob3VsZFByb3h5IGZvciB0aGUgcmVzdCBvZiB0aGUgcGFnZS1sb2FkIGZyb20gZGlyZWN0J3Ncbi8vIHJlc3BvbnNlICpoZWFkZXJzKjpcbi8vICAgLSBkaXJlY3QgcmV0dXJuZWQgMnh4IHdpdGggY29udGVudC10eXBlIHRleHQvcGxhaW4gIC0+IHNob3VsZFByb3h5PWZhbHNlOlxuLy8gICAgIHNlcnZlIGRpcmVjdCdzIHJlc3BvbnNlLCBhYm9ydCB0aGUgaW4tZmxpZ2h0IHByb3h5IGZldGNoLlxuLy8gICAtIGRpcmVjdCBmYWlsZWQsIGh1bmcgcGFzdCB0aW1lb3V0LCBvciByZXR1cm5lZCBhbnl0aGluZyBlbHNlXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLT4gc2hvdWxkUHJveHk9dHJ1ZTpcbi8vICAgICBzZXJ2ZSBwcm94eSdzIHJlc3BvbnNlLlxuLy8gQSBrZXkgaWRlYSBpcyB0aGF0IG5ldHdvcmstYmxvY2t5IHRoaW5ncyBzb21ldGltZXMgcmV0dXJuIDIwMCB3aXRoIGFcbi8vIG1lc3NhZ2UgcGFnZSBhYm91dCBibG9ja2luZyAob3IgYW4gZXJyb3IsIGJ1dCB0aGF0IGNvdW50cyBhcyBhIGZhaWwpLiBXZVxuLy8gZG9uJ3Qgd2FudCB0byBhY2NpZGVudGFsbHkgdGhpbmsgdGhhdCdzIGEgc3VjY2Vzcy5cbi8vIHNob3VsZFByb3h5IHN0YXRlIGlzIGluLW1lbW9yeSBhbmQgcGVyLWhvc3Qg4oCUIG5ldmVyIHBlcnNpc3RlZCwgc2luY2Vcbi8vIHJlYWNoYWJpbGl0eSBjaGFuZ2VzIGJldHdlZW4gbmV0d29ya3MgYW5kIGEgc3RhbGUgdmFsdWUgd291bGQgc2lsZW50bHlcbi8vIGJyZWFrIGxvYWRzLlxuLy9cbi8vIEluc3RhbGxlZCBvbiB0aGUgZ2xvYmFsIGZldGNoIGFzIGVhcmx5IGFzIHBvc3NpYmxlIHNvIGl0IGNhdGNoZXMgZXZlcnkgZmV0Y2hcbi8vIGNhbGxlcjsgc29tZSBvZiB0aGVtIGFyZSBpbiB0aGUgcHlyZXQtbGFuZyBydW50aW1lIGFuZCB3b3VsZCBiZSBvdGhlcndpc2Vcbi8vIGRpZmZpY3VsdCB0byBjb25maWd1cmUuXG5jb25zdCBTSEFSRVVSTF9QUk9YWV9IT1NUUyA9IG5ldyBTZXQoWydyYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tJ10pO1xuY29uc3QgU0hBUkVVUkxfRElSRUNUX1RJTUVPVVRfTVMgPSA1MDAwO1xuY29uc3QgX29yaWdGZXRjaCA9IHdpbmRvdy5mZXRjaC5iaW5kKHdpbmRvdyk7XG5cbmNvbnN0IF9zaGFyZXVybFNob3VsZFByb3h5ID0gbmV3IE1hcCgpOyAgICAgICAgICAvLyBob3N0IC0+IGJvb2xlYW5cbmNvbnN0IF9zaGFyZXVybFNob3VsZFByb3h5SW5mbGlnaHQgPSBuZXcgTWFwKCk7ICAvLyBob3N0IC0+IFByb21pc2U8Ym9vbGVhbj5cblxuZnVuY3Rpb24gX3NoYXJldXJsUHJveHlVcmwoZmV0Y2hJbnB1dCkge1xuICByZXR1cm4gJy9sb2FkLXNoYXJldXJsP3VybD0nICsgZW5jb2RlVVJJQ29tcG9uZW50KF9zaGFyZXVybElucHV0VG9VcmwoZmV0Y2hJbnB1dCkpO1xufVxuXG5mdW5jdGlvbiBfc2hhcmV1cmxJbnB1dFRvVXJsKGZldGNoSW5wdXQpIHtcbiAgcmV0dXJuICh0eXBlb2YgZmV0Y2hJbnB1dCA9PT0gJ3N0cmluZycpID8gZmV0Y2hJbnB1dFxuICAgICAgICAgOiAodHlwZW9mIFJlcXVlc3QgIT09ICd1bmRlZmluZWQnICYmIGZldGNoSW5wdXQgaW5zdGFuY2VvZiBSZXF1ZXN0KSA/IGZldGNoSW5wdXQudXJsXG4gICAgICAgICA6IFN0cmluZyhmZXRjaElucHV0KTtcbn1cblxuZnVuY3Rpb24gX3NoYXJldXJsVmVyaWZ5RGlyZWN0KHIpIHtcbiAgaWYgKCFyLm9rKSByZXR1cm4gZmFsc2U7XG4gIGNvbnN0IGN0ID0gKHIuaGVhZGVycy5nZXQoJ2NvbnRlbnQtdHlwZScpIHx8ICcnKS50b0xvd2VyQ2FzZSgpO1xuICAvLyBTb3VyY2UgZmlsZXMgc2VydmVkIGZyb20gcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSBjb21lIGJhY2sgYXNcbiAgLy8gdGV4dC9wbGFpbiAoLmFyciwgLmpzb24sIC5jc3YsIC5tZCBhbGwgZG8pLiBBbnl0aGluZyBlbHNlIOKAlCBIVE1MIGJsb2NrXG4gIC8vIHBhZ2VzLCBjYXB0aXZlIHBvcnRhbHMsIHN1cnByaXNlIGNvbnRlbnQgdHlwZXMg4oCUIHdlIGRvbid0IHRydXN0IGFzIGFcbiAgLy8gcmVhbCB1cHN0cmVhbSByZXNwb25zZS5cbiAgcmV0dXJuIGN0LnN0YXJ0c1dpdGgoJ3RleHQvcGxhaW4nKTtcbn1cblxuZnVuY3Rpb24gX3NoYXJldXJsRmV0Y2goc2hvdWxkUHJveHksIGZldGNoSW5wdXQsIGZldGNoSW5pdCkge1xuICBjb25zdCBtYXliZVByb3h5SW5wdXQgPSBzaG91bGRQcm94eSA/IF9zaGFyZXVybFByb3h5VXJsKGZldGNoSW5wdXQpIDogZmV0Y2hJbnB1dDtcbiAgcmV0dXJuIF9vcmlnRmV0Y2gobWF5YmVQcm94eUlucHV0LCBmZXRjaEluaXQpO1xufVxuXG5mdW5jdGlvbiBfc2hhcmV1cmxSYWNlKGZldGNoSW5wdXQsIGZldGNoSW5pdCkge1xuICBjb25zdCBwcm94eUN0cmwgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG4gIC8vIE5PVEUoam9lKTogVGhlIHNpZ25hbCBvdmVyd3JpdGUgaXMgdGVjaG5pY2FsbHkgbm90IHRoZSByaWdodCBmZXRjaCgpXG4gIC8vIHBvbHlmaWxsLiBJZiB0aGUgY2FsbGVyIGVsc2V3aGVyZSBpbiB0aGUgY29kZWJhc2UgcHJvdmlkZWQgYSBkaWZmZXJlbnRcbiAgLy8gc2lnbmFsICh3aGljaCBpbiB0aGUgZmV0Y2ggQVBJIGlzIG9ubHkgZm9yIGFib3J0aW5nIGFzIG9mIEFwcmlsICcyNiksIHRoYXRcbiAgLy8gY2FsbGVyIGFib3J0aW5nIHRocm91Z2ggdGhhdCBzaWduYWwgd29uJ3QgY2FuY2VsIHRoZSBwcm94eSBmZXRjaC5cbiAgLy8gSSdtIE9LIGxldHRpbmcgdGhhdCBjYXNlIHNsaXAgdGhyb3VnaCBoZXJlIGluIGV4Y2hhbmdlIGZvciBub3QgaGF2aW5nIGFcbiAgLy8gYnVuY2ggb2YgZXh0cmEgZXZlbnQgaGFuZGxlciBmb3J3YXJkaW5nXG4gIGNvbnN0IHByb3h5UCA9IF9vcmlnRmV0Y2goX3NoYXJldXJsUHJveHlVcmwoZmV0Y2hJbnB1dCksXG4gICAgT2JqZWN0LmFzc2lnbih7fSwgZmV0Y2hJbml0LCB7IHNpZ25hbDogcHJveHlDdHJsLnNpZ25hbCB9KSk7XG4gIGNvbnN0IGRpcmVjdFAgPSBfb3JpZ0ZldGNoKGZldGNoSW5wdXQsIGZldGNoSW5pdCkudGhlbihyID0+IHtcbiAgICBpZiAoIV9zaGFyZXVybFZlcmlmeURpcmVjdChyKSkgdGhyb3cgbmV3IEVycm9yKCdkaXJlY3QgcmVxdWVzdCBmYWlsZWQnKTtcbiAgICByZXR1cm4gcjtcbiAgfSk7XG5cbiAgLy8gc2hvdWxkUHJveHk6IGZhbHNlIGlmZiBkaXJlY3QgdmVyaWZpZWQgYmVmb3JlIHRoZSB0aW1lb3V0LCBlbHNlIHRydWUuXG4gIC8vIFdoZXRoZXIgdG8gcHJveHkgaXMgZGVjaWRlZCBzb2xlbHkgb24gd2hldGhlciBkaXJlY3Qgc3VjY2VlZHMgb3Igbm90XG4gIGNvbnN0IHNob3VsZFByb3h5UHJvbWlzZSA9IFByb21pc2UucmFjZShbXG4gICAgZGlyZWN0UC50aGVuKCgpID0+IGZhbHNlLCAoKSA9PiB0cnVlKSxcbiAgICBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZSh0cnVlKSwgU0hBUkVVUkxfRElSRUNUX1RJTUVPVVRfTVMpKSxcbiAgXSk7XG5cbiAgLy8gU2V0dGxlbWVudC1vcmRlciBjaGVjazogaWYgZGlyZWN0IHZlcmlmaWVzIGJlZm9yZSBwcm94eSByZXR1cm5zLCBhYm9ydFxuICAvLyB0aGUgaW4tZmxpZ2h0IHByb3h5IHRvIHN0b3Agd2FzdGluZyBzZXJ2ZXIgYmFuZHdpZHRoLiBXZSBtdXN0IE5PVFxuICAvLyBhYm9ydCBvbmNlIHByb3h5IGhhcyBhbHJlYWR5IHJldHVybmVkLCBzaW5jZSBieSB0aGVuIHRoZSBjYWxsZXIgaXNcbiAgLy8gcmVhZGluZyBwcm94eSdzIGJvZHkgYW5kIGFib3J0aW5nIHdvdWxkIGVycm9yIGl0cyBzdHJlYW0gbWlkLXJlYWQuXG4gIGNvbnN0IGRpcmVjdEZpbmlzaGVkU3VjY2Vzc2Z1bGx5QW5kRmlyc3RQID0gUHJvbWlzZS5yYWNlKFtcbiAgICBkaXJlY3RQLnRoZW4oKCkgPT4gdHJ1ZSwgKCkgPT4gZmFsc2UpLFxuICAgIHByb3h5UC50aGVuKCgpID0+IGZhbHNlLCAoKSA9PiBmYWxzZSksXG4gIF0pO1xuICBkaXJlY3RGaW5pc2hlZFN1Y2Nlc3NmdWxseUFuZEZpcnN0UC50aGVuKGRpcmVjdEZpcnN0ID0+IHtcbiAgICBpZiAoZGlyZWN0Rmlyc3QpIHByb3h5Q3RybC5hYm9ydCgpO1xuICB9KTtcblxuICAvLyBDYWxsZXIncyByZXNwb25zZTogd2hpY2hldmVyIG9mIGRpcmVjdC12ZXJpZmllZCBvciBwcm94eSBmdWxmaWxsc1xuICAvLyBmaXJzdC4gSWYgYm90aCBmYWlsLCBzdXJmYWNlIHByb3h5J3MgZXJyb3IgKHRoZSBtb3JlIGF1dGhvcml0YXRpdmVcbiAgLy8gdXBzdHJlYW0g4oCUIGRpcmVjdCdzIG1heSBqdXN0IGJlICdkaXJlY3Qtbm90LXZlcmlmaWVkJykuXG4gIGNvbnN0IHJlc3BvbnNlUHJvbWlzZSA9IFByb21pc2UuYW55KFtkaXJlY3RQLCBwcm94eVBdKS5jYXRjaChcbiAgICBhZ2dFcnIgPT4gUHJvbWlzZS5yZWplY3QoYWdnRXJyLmVycm9yc1sxXSB8fCBhZ2dFcnIuZXJyb3JzWzBdKVxuICApO1xuXG4gIHJldHVybiB7IHJlc3BvbnNlUHJvbWlzZSwgc2hvdWxkUHJveHlQcm9taXNlIH07XG59XG5cbndpbmRvdy5mZXRjaCA9IGZ1bmN0aW9uKGZldGNoSW5wdXQsIGZldGNoSW5pdCkge1xuICBsZXQgaG9zdDtcbiAgdHJ5IHsgaG9zdCA9IG5ldyBVUkwoX3NoYXJldXJsSW5wdXRUb1VybChmZXRjaElucHV0KSwgd2luZG93LmxvY2F0aW9uLmhyZWYpLmhvc3RuYW1lOyB9XG4gIGNhdGNoIChfKSB7IHJldHVybiBfb3JpZ0ZldGNoKGZldGNoSW5wdXQsIGZldGNoSW5pdCk7IH1cbiAgaWYgKCFTSEFSRVVSTF9QUk9YWV9IT1NUUy5oYXMoaG9zdCkpIHJldHVybiBfb3JpZ0ZldGNoKGZldGNoSW5wdXQsIGZldGNoSW5pdCk7XG5cbiAgY29uc3Qgc2hvdWxkUHJveHkgPSBfc2hhcmV1cmxTaG91bGRQcm94eS5nZXQoaG9zdCk7XG4gIGNvbnN0IGluZmxpZ2h0ID0gX3NoYXJldXJsU2hvdWxkUHJveHlJbmZsaWdodC5nZXQoaG9zdCk7XG4gIGlmIChzaG91bGRQcm94eSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIF9zaGFyZXVybEZldGNoKHNob3VsZFByb3h5LCBmZXRjaElucHV0LCBmZXRjaEluaXQpO1xuICB9IGVsc2UgaWYgKGluZmxpZ2h0KSB7XG4gICAgLy8gc2hvdWxkUHJveHkgcGVuZGluZzogcXVldWUgdGhpcyBmZXRjaCBvbiBpdCBhbmQgaXNzdWUgYSBzaW5nbGUgZnJlc2hcbiAgICAvLyByZXF1ZXN0IG9uY2Ugc2hvdWxkUHJveHkgaXMgZGVjaWRlZC5cbiAgICByZXR1cm4gaW5mbGlnaHQudGhlbihzcCA9PiBfc2hhcmV1cmxGZXRjaChzcCwgZmV0Y2hJbnB1dCwgZmV0Y2hJbml0KSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gRmlyc3QgZmV0Y2ggdG8gdGhpcyBob3N0IHRoaXMgcGFnZS1sb2FkOiBydW4gdGhlIHJhY2UuXG4gICAgY29uc3QgeyByZXNwb25zZVByb21pc2UsIHNob3VsZFByb3h5UHJvbWlzZSB9ID0gX3NoYXJldXJsUmFjZShmZXRjaElucHV0LCBmZXRjaEluaXQpO1xuICAgIF9zaGFyZXVybFNob3VsZFByb3h5SW5mbGlnaHQuc2V0KGhvc3QsIHNob3VsZFByb3h5UHJvbWlzZSk7XG4gICAgc2hvdWxkUHJveHlQcm9taXNlLnRoZW4oc3AgPT4ge1xuICAgICAgX3NoYXJldXJsU2hvdWxkUHJveHkuc2V0KGhvc3QsIHNwKTtcbiAgICAgIF9zaGFyZXVybFNob3VsZFByb3h5SW5mbGlnaHQuZGVsZXRlKGhvc3QpO1xuICAgIH0pO1xuICAgIHJldHVybiByZXNwb25zZVByb21pc2U7XG4gIH1cbn07XG5cbmNvbnN0IGlzRW1iZWRkZWQgPSB3aW5kb3cucGFyZW50ICE9PSB3aW5kb3c7XG5cbnZhciBzaGFyZUFQSSA9IG1ha2VTaGFyZUFQSShwcm9jZXNzLmVudi5DVVJSRU5UX1BZUkVUX1JFTEVBU0UpO1xuXG52YXIgdXJsID0gd2luZG93LnVybCA9IHJlcXVpcmUoJ3VybC5qcycpO1xudmFyIG1vZGFsUHJvbXB0ID0gcmVxdWlyZSgnLi9tb2RhbC1wcm9tcHQuanMnKTtcbndpbmRvdy5tb2RhbFByb21wdCA9IG1vZGFsUHJvbXB0O1xuXG5jb25zdCBMT0cgPSB0cnVlO1xud2luZG93LmN0X2xvZyA9IGZ1bmN0aW9uKC8qIHZhcmFyZ3MgKi8pIHtcbiAgaWYgKHdpbmRvdy5jb25zb2xlICYmIExPRykge1xuICAgIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIGFyZ3VtZW50cyk7XG4gIH1cbn07XG5cbndpbmRvdy5jdF9lcnJvciA9IGZ1bmN0aW9uKC8qIHZhcmFyZ3MgKi8pIHtcbiAgaWYgKHdpbmRvdy5jb25zb2xlICYmIExPRykge1xuICAgIGNvbnNvbGUuZXJyb3IuYXBwbHkoY29uc29sZSwgYXJndW1lbnRzKTtcbiAgfVxufTtcbnZhciBpbml0aWFsUGFyYW1zID0gdXJsLnBhcnNlKGRvY3VtZW50LmxvY2F0aW9uLmhyZWYpO1xudmFyIHBhcmFtcyA9IHVybC5wYXJzZShcIi8/XCIgKyBpbml0aWFsUGFyYW1zW1wiaGFzaFwiXSk7XG53aW5kb3cuaGlnaGxpZ2h0TW9kZSA9IFwibWNtaFwiOyAvLyB3aGF0IGlzIHRoaXMgZm9yP1xud2luZG93LmNsZWFyRmxhc2ggPSBmdW5jdGlvbigpIHtcbiAgJChcIi5ub3RpZmljYXRpb25BcmVhXCIpLmVtcHR5KCk7XG59XG53aW5kb3cud2hpdGVUb0JsYWNrTm90aWZpY2F0aW9uID0gZnVuY3Rpb24oKSB7XG4gIC8qXG4gICQoXCIubm90aWZpY2F0aW9uQXJlYSAuYWN0aXZlXCIpLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJ3aGl0ZVwiKTtcbiAgJChcIi5ub3RpZmljYXRpb25BcmVhIC5hY3RpdmVcIikuYW5pbWF0ZSh7YmFja2dyb3VuZENvbG9yOiBcIiMxMTExMTFcIiB9LCAxMDAwKTtcbiAgKi9cbn07XG53aW5kb3cuc3RpY2tFcnJvciA9IGZ1bmN0aW9uKG1lc3NhZ2UsIG1vcmUpIHtcbiAgQ1BPLnNheUFuZEZvcmdldChtZXNzYWdlKTtcbiAgY2xlYXJGbGFzaCgpO1xuICB2YXIgZXJyID0gJChcIjxzcGFuPlwiKS5hZGRDbGFzcyhcImVycm9yXCIpLnRleHQobWVzc2FnZSk7XG4gIGlmKG1vcmUpIHtcbiAgICBlcnIuYXR0cihcInRpdGxlXCIsIG1vcmUpO1xuICB9XG4gIGVyci50b29sdGlwKCk7XG4gICQoXCIubm90aWZpY2F0aW9uQXJlYVwiKS5wcmVwZW5kKGVycik7XG4gIHdoaXRlVG9CbGFja05vdGlmaWNhdGlvbigpO1xufTtcbndpbmRvdy5mbGFzaEVycm9yID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICBDUE8uc2F5QW5kRm9yZ2V0KG1lc3NhZ2UpO1xuICBjbGVhckZsYXNoKCk7XG4gIHZhciBlcnIgPSAkKFwiPHNwYW4+XCIpLmFkZENsYXNzKFwiZXJyb3JcIikudGV4dChtZXNzYWdlKTtcbiAgJChcIi5ub3RpZmljYXRpb25BcmVhXCIpLnByZXBlbmQoZXJyKTtcbiAgd2hpdGVUb0JsYWNrTm90aWZpY2F0aW9uKCk7XG4gIGVyci5mYWRlT3V0KDcwMDApO1xufTtcbndpbmRvdy5mbGFzaE1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gIENQTy5zYXlBbmRGb3JnZXQobWVzc2FnZSk7XG4gIGNsZWFyRmxhc2goKTtcbiAgdmFyIG1zZyA9ICQoXCI8c3Bhbj5cIikuYWRkQ2xhc3MoXCJhY3RpdmVcIikudGV4dChtZXNzYWdlKTtcbiAgJChcIi5ub3RpZmljYXRpb25BcmVhXCIpLnByZXBlbmQobXNnKTtcbiAgd2hpdGVUb0JsYWNrTm90aWZpY2F0aW9uKCk7XG4gIG1zZy5mYWRlT3V0KDcwMDApO1xufTtcbndpbmRvdy5zdGlja01lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gIENQTy5zYXlBbmRGb3JnZXQobWVzc2FnZSk7XG4gIGNsZWFyRmxhc2goKTtcbiAgdmFyIG1zZyA9ICQoXCI8c3Bhbj5cIikuYWRkQ2xhc3MoXCJhY3RpdmVcIikudGV4dChtZXNzYWdlKTtcbiAgJChcIi5ub3RpZmljYXRpb25BcmVhXCIpLnByZXBlbmQobXNnKTtcbiAgd2hpdGVUb0JsYWNrTm90aWZpY2F0aW9uKCk7XG59O1xud2luZG93LnN0aWNrUmljaE1lc3NhZ2UgPSBmdW5jdGlvbihjb250ZW50KSB7XG4gIENQTy5zYXlBbmRGb3JnZXQoY29udGVudC50ZXh0KCkpO1xuICBjbGVhckZsYXNoKCk7XG4gICQoXCIubm90aWZpY2F0aW9uQXJlYVwiKS5wcmVwZW5kKCQoXCI8c3Bhbj5cIikuYWRkQ2xhc3MoXCJhY3RpdmVcIikuYXBwZW5kKGNvbnRlbnQpKTtcbiAgd2hpdGVUb0JsYWNrTm90aWZpY2F0aW9uKCk7XG59O1xud2luZG93Lm1rV2FybmluZ1VwcGVyID0gZnVuY3Rpb24oKXtyZXR1cm4gJChcIjxkaXYgY2xhc3M9J3dhcm5pbmctdXBwZXInPlwiKTt9XG53aW5kb3cubWtXYXJuaW5nTG93ZXIgPSBmdW5jdGlvbigpe3JldHVybiAkKFwiPGRpdiBjbGFzcz0nd2FybmluZy1sb3dlcic+XCIpO31cblxudmFyIERvY3VtZW50cyA9IGZ1bmN0aW9uKCkge1xuXG4gIGZ1bmN0aW9uIERvY3VtZW50cygpIHtcbiAgICB0aGlzLmRvY3VtZW50cyA9IG5ldyBNYXAoKTtcbiAgfVxuXG4gIERvY3VtZW50cy5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5kb2N1bWVudHMuaGFzKG5hbWUpO1xuICB9O1xuXG4gIERvY3VtZW50cy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5kb2N1bWVudHMuZ2V0KG5hbWUpO1xuICB9O1xuXG4gIERvY3VtZW50cy5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKG5hbWUsIGRvYykge1xuICAgIGlmKGxvZ2dlci5pc0RldGFpbGVkKVxuICAgICAgbG9nZ2VyLmxvZyhcImRvYy5zZXRcIiwge25hbWU6IG5hbWUsIHZhbHVlOiBkb2MuZ2V0VmFsdWUoKX0pO1xuICAgIHJldHVybiB0aGlzLmRvY3VtZW50cy5zZXQobmFtZSwgZG9jKTtcbiAgfTtcblxuICBEb2N1bWVudHMucHJvdG90eXBlLmRlbGV0ZSA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgaWYobG9nZ2VyLmlzRGV0YWlsZWQpXG4gICAgICBsb2dnZXIubG9nKFwiZG9jLmRlbFwiLCB7bmFtZTogbmFtZX0pO1xuICAgIHJldHVybiB0aGlzLmRvY3VtZW50cy5kZWxldGUobmFtZSk7XG4gIH07XG5cbiAgRG9jdW1lbnRzLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKGYpIHtcbiAgICByZXR1cm4gdGhpcy5kb2N1bWVudHMuZm9yRWFjaChmKTtcbiAgfTtcblxuICByZXR1cm4gRG9jdW1lbnRzO1xufSgpO1xuXG52YXIgVkVSU0lPTl9DSEVDS19JTlRFUlZBTCA9IDEyMDAwMCArICgzMDAwMCAqIE1hdGgucmFuZG9tKCkpO1xuXG5mdW5jdGlvbiBjaGVja1ZlcnNpb24oKSB7XG4gICQuZ2V0KFwiL2N1cnJlbnQtdmVyc2lvblwiKS50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICByZXNwID0gSlNPTi5wYXJzZShyZXNwKTtcbiAgICBpZihyZXNwLnZlcnNpb24gJiYgcmVzcC52ZXJzaW9uICE9PSBwcm9jZXNzLmVudi5DVVJSRU5UX1BZUkVUX1JFTEVBU0UpIHtcbiAgICAgIHdpbmRvdy5mbGFzaE1lc3NhZ2UoXCJBIG5ldyB2ZXJzaW9uIG9mIFB5cmV0IGlzIGF2YWlsYWJsZS4gU2F2ZSBhbmQgcmVsb2FkIHRoZSBwYWdlIHRvIGdldCB0aGUgbmV3ZXN0IHZlcnNpb24uXCIpO1xuICAgIH1cbiAgfSk7XG59XG5pZighaXNFbWJlZGRlZCkge1xuICB3aW5kb3cuc2V0SW50ZXJ2YWwoY2hlY2tWZXJzaW9uLCBWRVJTSU9OX0NIRUNLX0lOVEVSVkFMKTtcbn1cblxud2luZG93LkNQTyA9IHtcbiAgc2F2ZTogZnVuY3Rpb24oKSB7fSxcbiAgYXV0b1NhdmU6IGZ1bmN0aW9uKCkge30sXG4gIGRvY3VtZW50cyA6IG5ldyBEb2N1bWVudHMoKVxufTtcbiQoZnVuY3Rpb24oKSB7XG4gIGNvbnN0IENPTlRFWFRfRk9SX05FV19GSUxFUyA9IFwidXNlIGNvbnRleHQgc3RhcnRlcjIwMjRcXG5cIjtcbiAgY29uc3QgQ09OVEVYVF9QUkVGSVggPSAvXnVzZSBjb250ZXh0XFxzKy87XG5cbiAgZnVuY3Rpb24gbWVyZ2Uob2JqLCBleHRlbnNpb24pIHtcbiAgICB2YXIgbmV3b2JqID0ge307XG4gICAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uKGspIHtcbiAgICAgIG5ld29ialtrXSA9IG9ialtrXTtcbiAgICB9KTtcbiAgICBPYmplY3Qua2V5cyhleHRlbnNpb24pLmZvckVhY2goZnVuY3Rpb24oaykge1xuICAgICAgbmV3b2JqW2tdID0gZXh0ZW5zaW9uW2tdO1xuICAgIH0pO1xuICAgIHJldHVybiBuZXdvYmo7XG4gIH1cbiAgdmFyIGFuaW1hdGlvbkRpdiA9IG51bGw7XG4gIGZ1bmN0aW9uIGNsb3NlQW5pbWF0aW9uSWZPcGVuKCkge1xuICAgIGlmKGFuaW1hdGlvbkRpdikge1xuICAgICAgYW5pbWF0aW9uRGl2LmVtcHR5KCk7XG4gICAgICBhbmltYXRpb25EaXYuZGlhbG9nKFwiZGVzdHJveVwiKTtcbiAgICAgIGFuaW1hdGlvbkRpdiA9IG51bGw7XG4gICAgfVxuICB9XG4gIGxldCBhY3RpdmVFZGl0b3IgPSBudWxsO1xuICBDUE8ubWFrZUVkaXRvciA9IGZ1bmN0aW9uKGNvbnRhaW5lciwgb3B0aW9ucykge1xuICAgIHZhciBpbml0aWFsID0gXCJcIjtcbiAgICBpZiAob3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShcImluaXRpYWxcIikpIHtcbiAgICAgIGluaXRpYWwgPSBvcHRpb25zLmluaXRpYWw7XG4gICAgfVxuXG4gICAgdmFyIHRleHRhcmVhID0galF1ZXJ5KFwiPHRleHRhcmVhIGFyaWEtaGlkZGVuPSd0cnVlJz5cIik7XG4gICAgdGV4dGFyZWEudmFsKGluaXRpYWwpO1xuICAgIGNvbnRhaW5lci5hcHBlbmQodGV4dGFyZWEpO1xuXG4gICAgdmFyIHJ1bkZ1biA9IGZ1bmN0aW9uIChjb2RlLCByZXBsT3B0aW9ucykge1xuICAgICAgb3B0aW9ucy5ydW4oY29kZSwge2NtOiBDTX0sIHJlcGxPcHRpb25zKTtcbiAgICB9O1xuXG4gICAgdmFyIHVzZUxpbmVOdW1iZXJzID0gIW9wdGlvbnMuc2ltcGxlRWRpdG9yO1xuICAgIHZhciB1c2VGb2xkaW5nID0gIW9wdGlvbnMuc2ltcGxlRWRpdG9yO1xuXG4gICAgdmFyIGd1dHRlcnMgPSAhb3B0aW9ucy5zaW1wbGVFZGl0b3IgP1xuICAgICAgW1wiaGVscC1ndXR0ZXJcIiwgXCJDb2RlTWlycm9yLWxpbmVudW1iZXJzXCIsIFwiQ29kZU1pcnJvci1mb2xkZ3V0dGVyXCJdIDpcbiAgICAgIFtdO1xuXG4gICAgZnVuY3Rpb24gcmVpbmRlbnRBbGxMaW5lcyhjbSkge1xuICAgICAgdmFyIGxhc3QgPSBjbS5saW5lQ291bnQoKTtcbiAgICAgIGNtLm9wZXJhdGlvbihmdW5jdGlvbigpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXN0OyArK2kpIGNtLmluZGVudExpbmUoaSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB2YXIgQ09ERV9MSU5FX1dJRFRIID0gMTAwO1xuXG4gICAgdmFyIHJ1bGVycywgcnVsZXJzTWluQ29sO1xuXG4gICAgLy8gcGxhY2UgYSB2ZXJ0aWNhbCBsaW5lIGluIGNvZGUgZWRpdG9yLCBhbmQgbm90IHJlcGxcbiAgICBpZiAob3B0aW9ucy5zaW1wbGVFZGl0b3IpIHtcbiAgICAgIHJ1bGVycyA9IFtdO1xuICAgIH0gZWxzZXtcbiAgICAgIHJ1bGVycyA9IFt7Y29sb3I6IFwiIzMxN0JDRlwiLCBjb2x1bW46IENPREVfTElORV9XSURUSCwgbGluZVN0eWxlOiBcImRhc2hlZFwiLCBjbGFzc05hbWU6IFwiaGlkZGVuXCJ9XTtcbiAgICAgIHJ1bGVyc01pbkNvbCA9IENPREVfTElORV9XSURUSDtcbiAgICB9XG5cbiAgICBjb25zdCBtYWMgPSBDb2RlTWlycm9yLmtleU1hcC5kZWZhdWx0ID09PSBDb2RlTWlycm9yLmtleU1hcC5tYWNEZWZhdWx0O1xuICAgIGNvbnNvbGUubG9nKFwiVXNpbmcga2V5bWFwOiBcIiwgQ29kZU1pcnJvci5rZXlNYXAuZGVmYXVsdCwgXCJtYWNEZWZhdWx0OiBcIiwgQ29kZU1pcnJvci5rZXlNYXAubWFjRGVmYXVsdCwgXCJtYWM6IFwiLCBtYWMpO1xuICAgIGNvbnN0IG1vZGlmaWVyID0gbWFjID8gXCJDbWRcIiA6IFwiQ3RybFwiO1xuXG4gICAgY29uc3QgZXh0cmFLZXlzID0ge1xuICAgICAgICBcIlNoaWZ0LUVudGVyXCI6IGZ1bmN0aW9uKGNtKSB7IHJ1bkZ1bihjbS5nZXRWYWx1ZSgpKTsgfSxcbiAgICAgICAgXCJTaGlmdC1DdHJsLUVudGVyXCI6IGZ1bmN0aW9uKGNtKSB7IHJ1bkZ1bihjbS5nZXRWYWx1ZSgpKTsgfSxcbiAgICAgICAgXCJUYWJcIjogXCJpbmRlbnRBdXRvXCIsXG4gICAgICAgIFwiQ3RybC1JXCI6IHJlaW5kZW50QWxsTGluZXMsXG4gICAgICAgIFwiRXNjIExlZnRcIjogXCJnb0JhY2t3YXJkU2V4cFwiLFxuICAgICAgICBcIkFsdC1MZWZ0XCI6IFwiZ29CYWNrd2FyZFNleHBcIixcbiAgICAgICAgXCJFc2MgUmlnaHRcIjogXCJnb0ZvcndhcmRTZXhwXCIsXG4gICAgICAgIFwiQWx0LVJpZ2h0XCI6IFwiZ29Gb3J3YXJkU2V4cFwiLFxuICAgICAgICBcIkN0cmwtTGVmdFwiOiBcImdvQmFja3dhcmRUb2tlblwiLFxuICAgICAgICBcIkN0cmwtUmlnaHRcIjogXCJnb0ZvcndhcmRUb2tlblwiLFxuICAgICAgICBbYCR7bW9kaWZpZXJ9LUZgXTogXCJmaW5kUGVyc2lzdGVudFwiLFxuICAgICAgICBbYCR7bW9kaWZpZXJ9LS9gXTogXCJ0b2dnbGVDb21tZW50XCIsXG4gICAgICB9O1xuICAgIGlmKHdpbmRvdy5QWVJFVF9JTl9WU0NPREUpIHtcbiAgICAgIC8vIERpc2FibGUgdW5kbyBhbmQgcmVkbyBpbiB2c2NvZGUsIHNpbmNlIHRoZXkgbWVzcyB3aXRoIHRoZSBob3N0IGVkaXRvcidzIHVuZG8vcmVkbyBzdGFja1xuICAgICAgLy8gT2RkbHksIGl0IGRvZXNuJ3Qgc2VlbSB0byB3b3JrIHRvIGFkZCB0aGVzZSB0byBleHRyYUtleXM7IEkgaGF2ZSB0b1xuICAgICAgLy8gb3ZlcnJpZGUgdGhlbSBpbiB0aGUgZGVmYXVsdCBrZXltYXBcbiAgICAgIENvZGVNaXJyb3Iua2V5TWFwLmRlZmF1bHRbYCR7bW9kaWZpZXJ9LVpgXSA9IGZhbHNlO1xuICAgICAgQ29kZU1pcnJvci5rZXlNYXAuZGVmYXVsdFtgU2hpZnQtJHttb2RpZmllcn0tWmBdID0gZmFsc2U7XG4gICAgICBDb2RlTWlycm9yLmtleU1hcC5kZWZhdWx0W2Ake21vZGlmaWVyfS1ZYF0gPSBmYWxzZTtcbiAgICAgIC8vIEN0cmwtVSBpcyBVbmRvIHdpdGhpbiBhIHJhbmdlXG4gICAgICBDb2RlTWlycm9yLmtleU1hcC5kZWZhdWx0W2Ake21vZGlmaWVyfS1VYF0gPSBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgY21PcHRpb25zID0ge1xuICAgICAga2V5TWFwOiAnZGVmYXVsdCcsXG4gICAgICBleHRyYUtleXM6IENvZGVNaXJyb3Iubm9ybWFsaXplS2V5TWFwKGV4dHJhS2V5cyksXG4gICAgICBpbmRlbnRVbml0OiAyLFxuICAgICAgdGFiU2l6ZTogMixcbiAgICAgIHZpZXdwb3J0TWFyZ2luOiBJbmZpbml0eSxcbiAgICAgIGxpbmVOdW1iZXJzOiB1c2VMaW5lTnVtYmVycyxcbiAgICAgIG1hdGNoS2V5d29yZHM6IHRydWUsXG4gICAgICBtYXRjaEJyYWNrZXRzOiB0cnVlLFxuICAgICAgc3R5bGVTZWxlY3RlZFRleHQ6IHRydWUsXG4gICAgICBmb2xkR3V0dGVyOiB1c2VGb2xkaW5nLFxuICAgICAgZ3V0dGVyczogZ3V0dGVycyxcbiAgICAgIGxpbmVXcmFwcGluZzogdHJ1ZSxcbiAgICAgIGxvZ2dpbmc6IHRydWUsXG4gICAgICBydWxlcnM6IHJ1bGVycyxcbiAgICAgIHJ1bGVyc01pbkNvbDogcnVsZXJzTWluQ29sLFxuICAgICAgc2Nyb2xsUGFzdEVuZDogdHJ1ZSxcbiAgICB9O1xuXG4gICAgY21PcHRpb25zID0gbWVyZ2UoY21PcHRpb25zLCBvcHRpb25zLmNtT3B0aW9ucyB8fCB7fSk7XG5cbiAgICB2YXIgQ00gPSBDb2RlTWlycm9yLmZyb21UZXh0QXJlYSh0ZXh0YXJlYVswXSwgY21PcHRpb25zKTtcbiAgICBDTS5vbihcImZvY3VzXCIsICgpID0+IHtcbiAgICAgIGFjdGl2ZUVkaXRvciA9IENNO1xuICAgIH0pO1xuXG4gICAgZnVuY3Rpb24gZmlyc3RMaW5lSXNOYW1lc3BhY2UoKSB7XG4gICAgICBjb25zdCBmaXJzdGxpbmUgPSBDTS5nZXRMaW5lKDApO1xuICAgICAgY29uc3QgbWF0Y2ggPSBmaXJzdGxpbmUubWF0Y2goQ09OVEVYVF9QUkVGSVgpO1xuICAgICAgcmV0dXJuIG1hdGNoICE9PSBudWxsO1xuICAgIH1cblxuICAgIGxldCBuYW1lc3BhY2VtYXJrID0gbnVsbDtcbiAgICBmdW5jdGlvbiBzZXRDb250ZXh0TGluZShuZXdDb250ZXh0TGluZSkge1xuICAgICAgdmFyIGhhc05hbWVzcGFjZSA9IGZpcnN0TGluZUlzTmFtZXNwYWNlKCk7XG4gICAgICBpZighaGFzTmFtZXNwYWNlICYmIG5hbWVzcGFjZW1hcmsgIT09IG51bGwpIHtcbiAgICAgICAgbmFtZXNwYWNlbWFyay5jbGVhcigpO1xuICAgICAgfVxuICAgICAgaWYoIWhhc05hbWVzcGFjZSkge1xuICAgICAgICBDTS5yZXBsYWNlUmFuZ2UobmV3Q29udGV4dExpbmUsIHsgbGluZTowLCBjaDogMH0sIHtsaW5lOiAwLCBjaDogMH0pO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIENNLnJlcGxhY2VSYW5nZShuZXdDb250ZXh0TGluZSwgeyBsaW5lOjAsIGNoOiAwfSwge2xpbmU6IDEsIGNoOiAwfSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYoIW9wdGlvbnMuc2ltcGxlRWRpdG9yKSB7XG5cbiAgICAgIGNvbnN0IGd1dHRlclF1ZXN0aW9uV3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG4gICAgICBndXR0ZXJRdWVzdGlvbldyYXBwZXIuY2xhc3NOYW1lID0gXCJndXR0ZXItcXVlc3Rpb24td3JhcHBlclwiO1xuICAgICAgY29uc3QgZ3V0dGVyVG9vbHRpcCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIpO1xuICAgICAgZ3V0dGVyVG9vbHRpcC5jbGFzc05hbWUgPSBcImd1dHRlci1xdWVzdGlvbi10b29sdGlwXCI7XG4gICAgICBndXR0ZXJUb29sdGlwLmlubmVyVGV4dCA9IFwiVGhlIHVzZSBjb250ZXh0IGxpbmUgdGVsbHMgUHlyZXQgdG8gbG9hZCB0b29scyBmb3IgYSBzcGVjaWZpYyBjbGFzcyBjb250ZXh0LiBJdCBjYW4gYmUgY2hhbmdlZCB0aHJvdWdoIHRoZSBtYWluIFB5cmV0IG1lbnUuIE1vc3Qgb2YgdGhlIHRpbWUgeW91IHdvbid0IG5lZWQgdG8gY2hhbmdlIHRoaXMgYXQgYWxsLlwiO1xuICAgICAgY29uc3QgZ3V0dGVyUXVlc3Rpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuICAgICAgZ3V0dGVyUXVlc3Rpb24uc3JjID0gd2luZG93LkFQUF9CQVNFX1VSTCArIFwiL2ltZy9xdWVzdGlvbi5wbmdcIjtcbiAgICAgIGd1dHRlclF1ZXN0aW9uLmNsYXNzTmFtZSA9IFwiZ3V0dGVyLXF1ZXN0aW9uXCI7XG4gICAgICBndXR0ZXJRdWVzdGlvbldyYXBwZXIuYXBwZW5kQ2hpbGQoZ3V0dGVyUXVlc3Rpb24pO1xuICAgICAgZ3V0dGVyUXVlc3Rpb25XcmFwcGVyLmFwcGVuZENoaWxkKGd1dHRlclRvb2x0aXApO1xuICAgICAgQ00uc2V0R3V0dGVyTWFya2VyKDAsIFwiaGVscC1ndXR0ZXJcIiwgZ3V0dGVyUXVlc3Rpb25XcmFwcGVyKTtcblxuICAgICAgQ00uZ2V0V3JhcHBlckVsZW1lbnQoKS5vbm1vdXNlbGVhdmUgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIENNLmNsZWFyR3V0dGVyKFwiaGVscC1ndXR0ZXJcIik7XG4gICAgICB9XG5cbiAgICAgIC8vIE5PVEUoam9lKTogVGhpcyBzZWVtcyB0byBiZSB0aGUgYmVzdCB3YXkgdG8gZ2V0IGEgaG92ZXIgb24gYSBtYXJrOiBodHRwczovL2dpdGh1Yi5jb20vY29kZW1pcnJvci9Db2RlTWlycm9yL2lzc3Vlcy8zNTI5XG4gICAgICBDTS5nZXRXcmFwcGVyRWxlbWVudCgpLm9ubW91c2Vtb3ZlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgbGluZUNoID0gQ00uY29vcmRzQ2hhcih7IGxlZnQ6IGUuY2xpZW50WCwgdG9wOiBlLmNsaWVudFkgfSk7XG4gICAgICAgIHZhciBtYXJrZXJzID0gQ00uZmluZE1hcmtzQXQobGluZUNoKTtcbiAgICAgICAgaWYgKG1hcmtlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgQ00uY2xlYXJHdXR0ZXIoXCJoZWxwLWd1dHRlclwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobGluZUNoLmxpbmUgPT09IDAgJiYgbWFya2Vyc1swXSA9PT0gbmFtZXNwYWNlbWFyaykge1xuICAgICAgICAgIENNLnNldEd1dHRlck1hcmtlcigwLCBcImhlbHAtZ3V0dGVyXCIsIGd1dHRlclF1ZXN0aW9uV3JhcHBlcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgQ00uY2xlYXJHdXR0ZXIoXCJoZWxwLWd1dHRlclwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgQ00ub24oXCJjaGFuZ2VcIiwgZnVuY3Rpb24oY2hhbmdlKSB7XG4gICAgICAgIGZ1bmN0aW9uIGRvZXNOb3RDaGFuZ2VGaXJzdExpbmUoYykgeyByZXR1cm4gYy5mcm9tLmxpbmUgIT09IDA7IH1cbiAgICAgICAgaWYoY2hhbmdlLmN1ck9wLmNoYW5nZU9ianMgJiYgY2hhbmdlLmN1ck9wLmNoYW5nZU9ianMuZXZlcnkoZG9lc05vdENoYW5nZUZpcnN0TGluZSkpIHsgcmV0dXJuOyB9XG4gICAgICAgIHZhciBoYXNOYW1lc3BhY2UgPSBmaXJzdExpbmVJc05hbWVzcGFjZSgpO1xuICAgICAgICBpZihoYXNOYW1lc3BhY2UpIHtcbiAgICAgICAgICBpZihuYW1lc3BhY2VtYXJrKSB7IG5hbWVzcGFjZW1hcmsuY2xlYXIoKTsgfVxuICAgICAgICAgIG5hbWVzcGFjZW1hcmsgPSBDTS5tYXJrVGV4dCh7bGluZTogMCwgY2g6IDB9LCB7bGluZTogMSwgY2g6IDB9LCB7IGF0dHJpYnV0ZXM6IHsgdXNlbGluZTogdHJ1ZSB9LCBjbGFzc05hbWU6IFwidXNlbGluZVwiLCBhdG9taWM6IHRydWUsIGluY2x1c2l2ZUxlZnQ6IHRydWUsIGluY2x1c2l2ZVJpZ2h0OiBmYWxzZSB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICh1c2VMaW5lTnVtYmVycykge1xuICAgICAgQ00uZGlzcGxheS53cmFwcGVyLmFwcGVuZENoaWxkKG1rV2FybmluZ1VwcGVyKClbMF0pO1xuICAgICAgQ00uZGlzcGxheS53cmFwcGVyLmFwcGVuZENoaWxkKG1rV2FybmluZ0xvd2VyKClbMF0pO1xuICAgIH1cblxuICAgIGdldFRvcFRpZXJNZW51aXRlbXMoKTtcblxuICAgIHJldHVybiB7XG4gICAgICBjbTogQ00sXG4gICAgICBzZXRDb250ZXh0TGluZTogc2V0Q29udGV4dExpbmUsXG4gICAgICByZWZyZXNoOiBmdW5jdGlvbigpIHsgQ00ucmVmcmVzaCgpOyB9LFxuICAgICAgcnVuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcnVuRnVuKENNLmdldFZhbHVlKCkpO1xuICAgICAgfSxcbiAgICAgIGZvY3VzOiBmdW5jdGlvbigpIHsgQ00uZm9jdXMoKTsgfSxcbiAgICAgIGZvY3VzQ2Fyb3VzZWw6IG51bGwgLy9pbml0Rm9jdXNDYXJvdXNlbFxuICAgIH07XG4gIH07XG4gIENQTy5SVU5fQ09ERSA9IGZ1bmN0aW9uKCkge1xuICAgIGNvbnNvbGUubG9nKFwiUnVubmluZyBiZWZvcmUgcmVhZHlcIiwgYXJndW1lbnRzKTtcbiAgfTtcblxuICBmdW5jdGlvbiBzZXRVc2VybmFtZSh0YXJnZXQpIHtcbiAgICByZXR1cm4gZ3dyYXAubG9hZCh7bmFtZTogJ3Blb3BsZScsXG4gICAgICB2ZXJzaW9uOiAndjEnLFxuICAgIH0pLnRoZW4oKGFwaSkgPT4ge1xuICAgICAgYXBpLnBlb3BsZS5nZXQoeyByZXNvdXJjZU5hbWU6IFwicGVvcGxlL21lXCIsIHBlcnNvbkZpZWxkczogXCJuYW1lcyxlbWFpbEFkZHJlc3Nlc1wiIH0pLnRoZW4oZnVuY3Rpb24odXNlcikge1xuICAgICAgICB2YXIgbmFtZSA9IHVzZXIubmFtZXMgJiYgdXNlci5uYW1lc1swXSA/IHVzZXIubmFtZXNbMF0uZGlzcGxheU5hbWUgOiB1bmRlZmluZWQ7XG4gICAgICAgIGlmICh1c2VyLmVtYWlsQWRkcmVzc2VzICYmIHVzZXIuZW1haWxBZGRyZXNzZXNbMF0gJiYgdXNlci5lbWFpbEFkZHJlc3Nlc1swXS52YWx1ZSkge1xuICAgICAgICAgIG5hbWUgPSB1c2VyLmVtYWlsQWRkcmVzc2VzWzBdLnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHRhcmdldC50ZXh0KG5hbWUpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdG9yYWdlQVBJLnRoZW4oZnVuY3Rpb24oYXBpKSB7XG4gICAgYXBpLmNvbGxlY3Rpb24udGhlbihmdW5jdGlvbigpIHtcbiAgICAgICQoXCIubG9naW5Pbmx5XCIpLnNob3coKTtcbiAgICAgICQoXCIubG9nb3V0T25seVwiKS5oaWRlKCk7XG4gICAgICBzZXRVc2VybmFtZSgkKFwiI3VzZXJuYW1lXCIpKTtcbiAgICB9KTtcbiAgICBhcGkuY29sbGVjdGlvbi5mYWlsKGZ1bmN0aW9uKCkge1xuICAgICAgJChcIi5sb2dpbk9ubHlcIikuaGlkZSgpO1xuICAgICAgJChcIi5sb2dvdXRPbmx5XCIpLnNob3coKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgc3RvcmFnZUFQSSA9IHN0b3JhZ2VBUEkudGhlbihmdW5jdGlvbihhcGkpIHsgcmV0dXJuIGFwaS5hcGk7IH0pO1xuICAkKFwiI2Nvbm5lY3RCdXR0b25cIikuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgJChcIiNjb25uZWN0QnV0dG9uXCIpLnRleHQoXCJDb25uZWN0aW5nLi4uXCIpO1xuICAgICQoXCIjY29ubmVjdEJ1dHRvblwiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcbiAgICAkKCcjY29ubmVjdEJ1dHRvbmxpJykuYXR0cignZGlzYWJsZWQnLCAnZGlzYWJsZWQnKTtcbiAgICAkKFwiI2Nvbm5lY3RCdXR0b25cIikuYXR0cihcInRhYkluZGV4XCIsIFwiLTFcIik7XG4gICAgLy8kKFwiI3RvcFRpZXJVbFwiKS5hdHRyKFwidGFiSW5kZXhcIiwgXCIwXCIpO1xuICAgIGdldFRvcFRpZXJNZW51aXRlbXMoKTtcbiAgICBzdG9yYWdlQVBJID0gY3JlYXRlUHJvZ3JhbUNvbGxlY3Rpb25BUEkoXCJjb2RlLnB5cmV0Lm9yZ1wiLCBmYWxzZSk7XG4gICAgc3RvcmFnZUFQSS50aGVuKGZ1bmN0aW9uKGFwaSkge1xuICAgICAgYXBpLmNvbGxlY3Rpb24udGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgJChcIi5sb2dpbk9ubHlcIikuc2hvdygpO1xuICAgICAgICAkKFwiLmxvZ291dE9ubHlcIikuaGlkZSgpO1xuICAgICAgICBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKTtcbiAgICAgICAgJChcIiNib25uaWVtZW51YnV0dG9uXCIpLmZvY3VzKCk7XG4gICAgICAgIHNldFVzZXJuYW1lKCQoXCIjdXNlcm5hbWVcIikpO1xuICAgICAgICBpZihwYXJhbXNbXCJnZXRcIl0gJiYgcGFyYW1zW1wiZ2V0XCJdW1wicHJvZ3JhbVwiXSkge1xuICAgICAgICAgIHZhciB0b0xvYWQgPSBhcGkuYXBpLmdldEZpbGVCeUlkKHBhcmFtc1tcImdldFwiXVtcInByb2dyYW1cIl0pO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiTG9nZ2VkIGluIGFuZCBoYXMgcHJvZ3JhbSB0byBsb2FkOiBcIiwgdG9Mb2FkKTtcbiAgICAgICAgICBsb2FkUHJvZ3JhbSh0b0xvYWQpO1xuICAgICAgICAgIHByb2dyYW1Ub1NhdmUgPSB0b0xvYWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJvZ3JhbVRvU2F2ZSA9IFEuZmNhbGwoZnVuY3Rpb24oKSB7IHJldHVybiBudWxsOyB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBhcGkuY29sbGVjdGlvbi5mYWlsKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKFwiI2Nvbm5lY3RCdXR0b25cIikudGV4dChcIkNvbm5lY3QgdG8gR29vZ2xlIERyaXZlXCIpO1xuICAgICAgICAkKFwiI2Nvbm5lY3RCdXR0b25cIikuYXR0cihcImRpc2FibGVkXCIsIGZhbHNlKTtcbiAgICAgICAgJCgnI2Nvbm5lY3RCdXR0b25saScpLmF0dHIoJ2Rpc2FibGVkJywgZmFsc2UpO1xuICAgICAgICAvLyQoXCIjY29ubmVjdEJ1dHRvblwiKS5hdHRyKFwidGFiSW5kZXhcIiwgXCIwXCIpO1xuICAgICAgICBkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKTtcbiAgICAgICAgJChcIiNjb25uZWN0QnV0dG9uXCIpLmZvY3VzKCk7XG4gICAgICAgIC8vJChcIiN0b3BUaWVyVWxcIikuYXR0cihcInRhYkluZGV4XCIsIFwiLTFcIik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBzdG9yYWdlQVBJID0gc3RvcmFnZUFQSS50aGVuKGZ1bmN0aW9uKGFwaSkgeyByZXR1cm4gYXBpLmFwaTsgfSk7XG4gIH0pO1xuXG4gIC8qXG4gICAgaW5pdGlhbFByb2dyYW0gaG9sZHMgYSBwcm9taXNlIGZvciBhIERyaXZlIEZpbGUgb2JqZWN0IG9yIG51bGxcblxuICAgIEl0J3MgbnVsbCBpZiB0aGUgcGFnZSBkb2Vzbid0IGhhdmUgYSAjc2hhcmUgb3IgI3Byb2dyYW0gdXJsXG5cbiAgICBJZiB0aGUgdXJsIGRvZXMgaGF2ZSBhICNwcm9ncmFtIG9yICNzaGFyZSwgdGhlIHByb21pc2UgaXMgZm9yIHRoZVxuICAgIGNvcnJlc3BvbmRpbmcgb2JqZWN0LlxuICAqL1xuICBsZXQgaW5pdGlhbFByb2dyYW07XG4gIGlmKHBhcmFtc1tcImdldFwiXSAmJiBwYXJhbXNbXCJnZXRcIl1bXCJzaGFyZXVybFwiXSkge1xuICAgIGluaXRpYWxQcm9ncmFtID0gbWFrZVVybEZpbGUocGFyYW1zW1wiZ2V0XCJdW1wic2hhcmV1cmxcIl0pO1xuICB9XG4gIGVsc2Uge1xuICAgIGluaXRpYWxQcm9ncmFtID0gc3RvcmFnZUFQSS50aGVuKGZ1bmN0aW9uKGFwaSkge1xuICAgICAgdmFyIHByb2dyYW1Mb2FkID0gbnVsbDtcbiAgICAgIGlmKHBhcmFtc1tcImdldFwiXSAmJiBwYXJhbXNbXCJnZXRcIl1bXCJwcm9ncmFtXCJdKSB7XG4gICAgICAgIGVuYWJsZUZpbGVPcHRpb25zKCk7XG4gICAgICAgIHByb2dyYW1Mb2FkID0gYXBpLmdldEZpbGVCeUlkKHBhcmFtc1tcImdldFwiXVtcInByb2dyYW1cIl0pO1xuICAgICAgICBwcm9ncmFtTG9hZC50aGVuKGZ1bmN0aW9uKHApIHsgc2hvd1NoYXJlQ29udGFpbmVyKHApOyB9KTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYocGFyYW1zW1wiZ2V0XCJdICYmIHBhcmFtc1tcImdldFwiXVtcInNoYXJlXCJdKSB7XG4gICAgICAgIGxvZ2dlci5sb2coJ3NoYXJlZC1wcm9ncmFtLWxvYWQnLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGlkOiBwYXJhbXNbXCJnZXRcIl1bXCJzaGFyZVwiXVxuICAgICAgICAgIH0pO1xuICAgICAgICBwcm9ncmFtTG9hZCA9IGFwaS5nZXRTaGFyZWRGaWxlQnlJZChwYXJhbXNbXCJnZXRcIl1bXCJzaGFyZVwiXSk7XG4gICAgICAgIHByb2dyYW1Mb2FkLnRoZW4oZnVuY3Rpb24oZmlsZSkge1xuICAgICAgICAgIC8vIE5PVEUoam9lKTogSWYgdGhlIGN1cnJlbnQgdXNlciBkb2Vzbid0IG93biBvciBoYXZlIGFjY2VzcyB0byB0aGlzIGZpbGVcbiAgICAgICAgICAvLyAob3IgaXNuJ3QgbG9nZ2VkIGluKSB0aGlzIHdpbGwgc2ltcGx5IGZhaWwgd2l0aCBhIDQwMSwgc28gd2UgZG9uJ3QgZG9cbiAgICAgICAgICAvLyBhbnkgZnVydGhlciBwZXJtaXNzaW9uIGNoZWNraW5nIGJlZm9yZSBzaG93aW5nIHRoZSBsaW5rLlxuICAgICAgICAgIGZpbGUuZ2V0T3JpZ2luYWwoKS50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc3BvbnNlIGZvciBvcmlnaW5hbDogXCIsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIHZhciBvcmlnaW5hbCA9ICQoXCIjb3Blbi1vcmlnaW5hbFwiKS5zaG93KCkub2ZmKFwiY2xpY2tcIik7XG4gICAgICAgICAgICB2YXIgaWQgPSByZXNwb25zZS5yZXN1bHQudmFsdWU7XG4gICAgICAgICAgICBvcmlnaW5hbC5yZW1vdmVDbGFzcyhcImhpZGRlblwiKTtcbiAgICAgICAgICAgIG9yaWdpbmFsLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICB3aW5kb3cub3Blbih3aW5kb3cuQVBQX0JBU0VfVVJMICsgXCIvZWRpdG9yI3Byb2dyYW09XCIgKyBpZCwgXCJfYmxhbmtcIik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcHJvZ3JhbUxvYWQgPSBudWxsO1xuICAgICAgfVxuICAgICAgaWYocHJvZ3JhbUxvYWQpIHtcbiAgICAgICAgcHJvZ3JhbUxvYWQuZmFpbChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgd2luZG93LnN0aWNrRXJyb3IoXCJUaGUgcHJvZ3JhbSBmYWlsZWQgdG8gbG9hZC5cIik7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcHJvZ3JhbUxvYWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICB9KS5jYXRjaChlID0+IHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJzdG9yYWdlQVBJIGZhaWxlZCB0byBsb2FkLCBwcm9jZWVkaW5nIHdpdGhvdXQgc2F2aW5nIHByb2dyYW1zOiBcIiwgZSk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFRpdGxlKHByb2dOYW1lKSB7XG4gICAgZG9jdW1lbnQudGl0bGUgPSBwcm9nTmFtZSArIFwiIC0gY29kZS5weXJldC5vcmdcIjtcbiAgICAkKFwiI3Nob3dGaWxlbmFtZVwiKS50ZXh0KFwiRmlsZTogXCIgKyBwcm9nTmFtZSk7XG4gIH1cbiAgQ1BPLnNldFRpdGxlID0gc2V0VGl0bGU7XG5cbiAgdmFyIGZpbGVuYW1lID0gZmFsc2U7XG5cbiAgJChcIiNkb3dubG9hZCBhXCIpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgIHZhciBkb3dubG9hZEVsdCA9ICQoXCIjZG93bmxvYWQgYVwiKTtcbiAgICB2YXIgY29udGVudHMgPSBDUE8uZWRpdG9yLmNtLmdldFZhbHVlKCk7XG4gICAgdmFyIGRvd25sb2FkQmxvYiA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtjb250ZW50c10sIHt0eXBlOiAndGV4dC9wbGFpbid9KSk7XG4gICAgaWYoIWZpbGVuYW1lKSB7IGZpbGVuYW1lID0gJ3VudGl0bGVkX3Byb2dyYW0uYXJyJzsgfVxuICAgIGlmKGZpbGVuYW1lLmluZGV4T2YoXCIuYXJyXCIpICE9PSAoZmlsZW5hbWUubGVuZ3RoIC0gNCkpIHtcbiAgICAgIGZpbGVuYW1lICs9IFwiLmFyclwiO1xuICAgIH1cbiAgICBkb3dubG9hZEVsdC5hdHRyKHtcbiAgICAgIGRvd25sb2FkOiBmaWxlbmFtZSxcbiAgICAgIGhyZWY6IGRvd25sb2FkQmxvYlxuICAgIH0pO1xuICAgICQoXCIjZG93bmxvYWRcIikuYXBwZW5kKGRvd25sb2FkRWx0KTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gc2hvd01vZGFsKGN1cnJlbnRDb250ZXh0KSB7XG4gICAgZnVuY3Rpb24gZHJhd0VsZW1lbnQoaW5wdXQpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSAkKFwiPGRpdj5cIik7XG4gICAgICBjb25zdCBncmVldGluZyA9ICQoXCI8cD5cIik7XG4gICAgICBjb25zdCBzaGFyZWQgPSAkKFwiPHR0PnNoYXJlZC1nZHJpdmUoLi4uKTwvdHQ+XCIpO1xuICAgICAgY29uc3QgY3VycmVudENvbnRleHRFbHQgPSAkKFwiPHR0PlwiICsgY3VycmVudENvbnRleHQgKyBcIjwvdHQ+XCIpO1xuICAgICAgZ3JlZXRpbmcuYXBwZW5kKFwiRW50ZXIgdGhlIGNvbnRleHQgdG8gdXNlIGZvciB0aGUgcHJvZ3JhbSwgb3IgY2hvb3NlIOKAnENhbmNlbOKAnSB0byBrZWVwIHRoZSBjdXJyZW50IGNvbnRleHQgb2YgXCIsIGN1cnJlbnRDb250ZXh0RWx0LCBcIi5cIik7XG4gICAgICBjb25zdCBlc3NlbnRpYWxzID0gJChcIjx0dD5zdGFydGVyMjAyNDwvdHQ+XCIpO1xuICAgICAgY29uc3QgbGlzdCA9ICQoXCI8dWw+XCIpXG4gICAgICAgIC5hcHBlbmQoJChcIjxsaT5cIikuYXBwZW5kKFwiVGhlIGRlZmF1bHQgaXMgXCIsIGVzc2VudGlhbHMsIFwiLlwiKSlcbiAgICAgICAgLmFwcGVuZCgkKFwiPGxpPlwiKS5hcHBlbmQoXCJZb3UgbWlnaHQgdXNlIHNvbWV0aGluZyBsaWtlIFwiLCBzaGFyZWQsIFwiIGlmIG9uZSB3YXMgcHJvdmlkZWQgYXMgcGFydCBvZiBhIGNvdXJzZS5cIikpO1xuICAgICAgZWxlbWVudC5hcHBlbmQoZ3JlZXRpbmcpO1xuICAgICAgZWxlbWVudC5hcHBlbmQoJChcIjxwPlwiKS5hcHBlbmQobGlzdCkpO1xuICAgICAgY29uc3QgdXNlQ29udGV4dCA9ICQoXCI8dHQ+dXNlIGNvbnRleHQ8L3R0PlwiKS5jc3MoeyAnZmxleC1ncm93JzogJzAnLCAncGFkZGluZy1yaWdodCc6ICcxZW0nIH0pO1xuICAgICAgY29uc3QgaW5wdXRXcmFwcGVyID0gJChcIjxkaXY+XCIpLmFwcGVuZChpbnB1dCkuY3NzKHsgJ2ZsZXgtZ3Jvdyc6ICcxJyB9KTtcbiAgICAgIGNvbnN0IGVudHJ5ID0gJChcIjxkaXY+XCIpLmNzcyh7XG4gICAgICAgIGRpc3BsYXk6ICdmbGV4JyxcbiAgICAgICAgJ2ZsZXgtZGlyZWN0aW9uJzogJ3JvdycsXG4gICAgICAgICdqdXN0aWZ5LWNvbnRlbnQnOiAnZmxleC1zdGFydCcsXG4gICAgICAgICdhbGlnbi1pdGVtcyc6ICdiYXNlbGluZSdcbiAgICAgIH0pO1xuICAgICAgZW50cnkuYXBwZW5kKHVzZUNvbnRleHQpLmFwcGVuZChpbnB1dFdyYXBwZXIpO1xuICAgICAgZWxlbWVudC5hcHBlbmQoZW50cnkpO1xuICAgICAgcmV0dXJuIGVsZW1lbnQ7XG4gICAgfVxuICAgIGNvbnN0IG5hbWVzcGFjZVJlc3VsdCA9IG5ldyBtb2RhbFByb21wdCh7XG4gICAgICAgIHRpdGxlOiBcIkNob29zZSBhIENvbnRleHRcIixcbiAgICAgICAgc3R5bGU6IFwidGV4dFwiLFxuICAgICAgICBvcHRpb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZHJhd0VsZW1lbnQ6IGRyYXdFbGVtZW50LFxuICAgICAgICAgICAgc3VibWl0VGV4dDogXCJDaGFuZ2UgTmFtZXNwYWNlXCIsXG4gICAgICAgICAgICBkZWZhdWx0VmFsdWU6IGN1cnJlbnRDb250ZXh0XG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9KTtcbiAgICBuYW1lc3BhY2VSZXN1bHQuc2hvdygocmVzdWx0KSA9PiB7XG4gICAgICBpZighcmVzdWx0KSB7IHJldHVybjsgfVxuICAgICAgQ1BPLmVkaXRvci5zZXRDb250ZXh0TGluZShcInVzZSBjb250ZXh0IFwiICsgcmVzdWx0LnRyaW0oKSArIFwiXFxuXCIpO1xuICAgIH0pO1xuICB9XG4gICQoXCIjY2hvb3NlLWNvbnRleHRcIikub24oXCJjbGlja1wiLCBmdW5jdGlvbigpIHtcbiAgICBjb25zdCBmaXJzdExpbmUgPSBDUE8uZWRpdG9yLmNtLmdldExpbmUoMCk7XG4gICAgY29uc3QgY29udGV4dExlbiA9IGZpcnN0TGluZS5tYXRjaChDT05URVhUX1BSRUZJWCk7XG4gICAgc2hvd01vZGFsKGNvbnRleHRMZW4gPT09IG51bGwgPyBcIlwiIDogZmlyc3RMaW5lLnNsaWNlKGNvbnRleHRMZW5bMF0ubGVuZ3RoKSk7XG4gIH0pO1xuXG4gIHZhciBUUlVOQ0FURV9MRU5HVEggPSAyMDtcblxuICBmdW5jdGlvbiB0cnVuY2F0ZU5hbWUobmFtZSkge1xuICAgIGlmKG5hbWUubGVuZ3RoIDw9IFRSVU5DQVRFX0xFTkdUSCArIDEpIHsgcmV0dXJuIG5hbWU7IH1cbiAgICByZXR1cm4gbmFtZS5zbGljZSgwLCBUUlVOQ0FURV9MRU5HVEggLyAyKSArIFwi4oCmXCIgKyBuYW1lLnNsaWNlKG5hbWUubGVuZ3RoIC0gVFJVTkNBVEVfTEVOR1RIIC8gMiwgbmFtZS5sZW5ndGgpO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlTmFtZShwKSB7XG4gICAgZmlsZW5hbWUgPSBwLmdldE5hbWUoKTtcbiAgICAkKFwiI2ZpbGVuYW1lXCIpLnRleHQoXCIgKFwiICsgdHJ1bmNhdGVOYW1lKGZpbGVuYW1lKSArIFwiKVwiKTtcbiAgICAkKFwiI2ZpbGVuYW1lXCIpLmF0dHIoJ3RpdGxlJywgZmlsZW5hbWUpO1xuICAgIHNldFRpdGxlKGZpbGVuYW1lKTtcbiAgICBzaG93U2hhcmVDb250YWluZXIocCk7XG4gIH1cblxuICBmdW5jdGlvbiBsb2FkUHJvZ3JhbShwKSB7XG4gICAgcHJvZ3JhbVRvU2F2ZSA9IHA7XG4gICAgcmV0dXJuIHAudGhlbihmdW5jdGlvbihwcm9nKSB7XG4gICAgICBpZihwcm9nICE9PSBudWxsKSB7XG4gICAgICAgIHVwZGF0ZU5hbWUocHJvZyk7XG4gICAgICAgIGlmKHByb2cuc2hhcmVkKSB7XG4gICAgICAgICAgd2luZG93LnN0aWNrTWVzc2FnZShcIllvdSBhcmUgdmlld2luZyBhIHNoYXJlZCBwcm9ncmFtLiBBbnkgY2hhbmdlcyB5b3UgbWFrZSB3aWxsIG5vdCBiZSBzYXZlZC4gWW91IGNhbiB1c2UgRmlsZSAtPiBTYXZlIGEgY29weSB0byBzYXZlIHlvdXIgb3duIHZlcnNpb24gd2l0aCBhbnkgZWRpdHMgeW91IG1ha2UuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwcm9nLmdldENvbnRlbnRzKCk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgaWYocGFyYW1zW1wiZ2V0XCJdW1wiZWRpdG9yQ29udGVudHNcIl0gJiYgIShwYXJhbXNbXCJnZXRcIl1bXCJwcm9ncmFtXCJdIHx8IHBhcmFtc1tcImdldFwiXVtcInNoYXJlXCJdKSkge1xuICAgICAgICAgIHJldHVybiBwYXJhbXNbXCJnZXRcIl1bXCJlZGl0b3JDb250ZW50c1wiXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gQ09OVEVYVF9GT1JfTkVXX0ZJTEVTO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBzYXkobXNnLCBmb3JnZXQpIHtcbiAgICBpZiAobXNnID09PSBcIlwiKSByZXR1cm47XG4gICAgdmFyIGFubm91bmNlbWVudHMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImFubm91bmNlbWVudGxpc3RcIik7XG4gICAgdmFyIGxpID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIkxJXCIpO1xuICAgIGxpLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG1zZykpO1xuICAgIGFubm91bmNlbWVudHMuaW5zZXJ0QmVmb3JlKGxpLCBhbm5vdW5jZW1lbnRzLmZpcnN0Q2hpbGQpO1xuICAgIGlmIChmb3JnZXQpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGFubm91bmNlbWVudHMucmVtb3ZlQ2hpbGQobGkpO1xuICAgICAgfSwgMTAwMCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc2F5QW5kRm9yZ2V0KG1zZykge1xuICAgIGNvbnNvbGUubG9nKCdkb2luZyBzYXlBbmRGb3JnZXQnLCBtc2cpO1xuICAgIHNheShtc2csIHRydWUpO1xuICB9XG5cbiAgZnVuY3Rpb24gY3ljbGVBZHZhbmNlKGN1cnJJbmRleCwgbWF4SW5kZXgsIHJldmVyc2VQKSB7XG4gICAgdmFyIG5leHRJbmRleCA9IGN1cnJJbmRleCArIChyZXZlcnNlUD8gLTEgOiArMSk7XG4gICAgbmV4dEluZGV4ID0gKChuZXh0SW5kZXggJSBtYXhJbmRleCkgKyBtYXhJbmRleCkgJSBtYXhJbmRleDtcbiAgICByZXR1cm4gbmV4dEluZGV4O1xuICB9XG5cbiAgZnVuY3Rpb24gcG9wdWxhdGVGb2N1c0Nhcm91c2VsKGVkaXRvcikge1xuICAgIGlmICghZWRpdG9yLmZvY3VzQ2Fyb3VzZWwpIHtcbiAgICAgIGVkaXRvci5mb2N1c0Nhcm91c2VsID0gW107XG4gICAgfVxuICAgIHZhciBmYyA9IGVkaXRvci5mb2N1c0Nhcm91c2VsO1xuICAgIHZhciBkb2NtYWluID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJtYWluXCIpO1xuICAgIGlmICghZmNbMF0pIHtcbiAgICAgIHZhciB0b29sYmFyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ1Rvb2xiYXInKTtcbiAgICAgIGZjWzBdID0gdG9vbGJhcjtcbiAgICAgIC8vZmNbMF0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImhlYWRlcm9uZWxlZ2VuZFwiKTtcbiAgICAgIC8vZ2V0VG9wVGllck1lbnVpdGVtcygpO1xuICAgICAgLy9mY1swXSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdib25uaWVtZW51YnV0dG9uJyk7XG4gICAgfVxuICAgIGlmICghZmNbMV0pIHtcbiAgICAgIHZhciBkb2NyZXBsTWFpbiA9IGRvY21haW4uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInJlcGxNYWluXCIpO1xuICAgICAgdmFyIGRvY3JlcGxNYWluMDtcbiAgICAgIGlmIChkb2NyZXBsTWFpbi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgZG9jcmVwbE1haW4wID0gdW5kZWZpbmVkO1xuICAgICAgfSBlbHNlIGlmIChkb2NyZXBsTWFpbi5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgZG9jcmVwbE1haW4wID0gZG9jcmVwbE1haW5bMF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRvY3JlcGxNYWluLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKGRvY3JlcGxNYWluW2ldLmlubmVyVGV4dCAhPT0gXCJcIikge1xuICAgICAgICAgICAgZG9jcmVwbE1haW4wID0gZG9jcmVwbE1haW5baV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmY1sxXSA9IGRvY3JlcGxNYWluMDtcbiAgICB9XG4gICAgaWYgKCFmY1syXSkge1xuICAgICAgdmFyIGRvY3JlcGwgPSBkb2NtYWluLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXCJyZXBsXCIpO1xuICAgICAgdmFyIGRvY3JlcGxjb2RlID0gZG9jcmVwbFswXS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKFwicHJvbXB0LWNvbnRhaW5lclwiKVswXS5cbiAgICAgICAgZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcIkNvZGVNaXJyb3JcIilbMF07XG4gICAgICBmY1syXSA9IGRvY3JlcGxjb2RlO1xuICAgIH1cbiAgICBpZiAoIWZjWzNdKSB7XG4gICAgICBmY1szXSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiYW5ub3VuY2VtZW50c1wiKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBjeWNsZUZvY3VzKHJldmVyc2VQKSB7XG4gICAgLy9jb25zb2xlLmxvZygnZG9pbmcgY3ljbGVGb2N1cycsIHJldmVyc2VQKTtcbiAgICB2YXIgZWRpdG9yID0gdGhpcy5lZGl0b3I7XG4gICAgcG9wdWxhdGVGb2N1c0Nhcm91c2VsKGVkaXRvcik7XG4gICAgdmFyIGZDYXJvdXNlbCA9IGVkaXRvci5mb2N1c0Nhcm91c2VsO1xuICAgIHZhciBtYXhJbmRleCA9IGZDYXJvdXNlbC5sZW5ndGg7XG4gICAgdmFyIGN1cnJlbnRGb2N1c2VkRWx0ID0gZkNhcm91c2VsLmZpbmQoZnVuY3Rpb24obm9kZSkge1xuICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBub2RlLmNvbnRhaW5zKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHZhciBjdXJyZW50Rm9jdXNJbmRleCA9IGZDYXJvdXNlbC5pbmRleE9mKGN1cnJlbnRGb2N1c2VkRWx0KTtcbiAgICB2YXIgbmV4dEZvY3VzSW5kZXggPSBjdXJyZW50Rm9jdXNJbmRleDtcbiAgICB2YXIgZm9jdXNFbHQ7XG4gICAgZG8ge1xuICAgICAgbmV4dEZvY3VzSW5kZXggPSBjeWNsZUFkdmFuY2UobmV4dEZvY3VzSW5kZXgsIG1heEluZGV4LCByZXZlcnNlUCk7XG4gICAgICBmb2N1c0VsdCA9IGZDYXJvdXNlbFtuZXh0Rm9jdXNJbmRleF07XG4gICAgICAvL2NvbnNvbGUubG9nKCd0cnlpbmcgZm9jdXNFbHQnLCBmb2N1c0VsdCk7XG4gICAgfSB3aGlsZSAoIWZvY3VzRWx0KTtcblxuICAgIHZhciBmb2N1c0VsdDA7XG4gICAgaWYgKGZvY3VzRWx0LmNsYXNzTGlzdC5jb250YWlucygndG9vbGJhcnJlZ2lvbicpKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdzZXR0bGluZyBvbiB0b29sYmFyIHJlZ2lvbicpXG4gICAgICBnZXRUb3BUaWVyTWVudWl0ZW1zKCk7XG4gICAgICBmb2N1c0VsdDAgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYm9ubmllbWVudWJ1dHRvbicpO1xuICAgIH0gZWxzZSBpZiAoZm9jdXNFbHQuY2xhc3NMaXN0LmNvbnRhaW5zKFwicmVwbE1haW5cIikgfHxcbiAgICAgIGZvY3VzRWx0LmNsYXNzTGlzdC5jb250YWlucyhcIkNvZGVNaXJyb3JcIikpIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ3NldHRsaW5nIG9uIGRlZm4gd2luZG93JylcbiAgICAgIHZhciB0ZXh0YXJlYXMgPSBmb2N1c0VsdC5nZXRFbGVtZW50c0J5VGFnTmFtZShcInRleHRhcmVhXCIpO1xuICAgICAgLy9jb25zb2xlLmxvZygndHh0YXJlYXM9JywgdGV4dGFyZWFzKVxuICAgICAgLy9jb25zb2xlLmxvZygndHh0YXJlYSBsZW49JywgdGV4dGFyZWFzLmxlbmd0aClcbiAgICAgIGlmICh0ZXh0YXJlYXMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ0knKVxuICAgICAgICBmb2N1c0VsdDAgPSBmb2N1c0VsdDtcbiAgICAgIH0gZWxzZSBpZiAodGV4dGFyZWFzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdzZXR0bGluZyBvbiBpbnRlciB3aW5kb3cnKVxuICAgICAgICBmb2N1c0VsdDAgPSB0ZXh0YXJlYXNbMF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdzZXR0bGluZyBvbiBkZWZuIHdpbmRvdycpXG4gICAgICAgIC8qXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGV4dGFyZWFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKHRleHRhcmVhc1tpXS5nZXRBdHRyaWJ1dGUoJ3RhYkluZGV4JykpIHtcbiAgICAgICAgICAgIGZvY3VzRWx0MCA9IHRleHRhcmVhc1tpXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgKi9cbiAgICAgICAgZm9jdXNFbHQwID0gdGV4dGFyZWFzW3RleHRhcmVhcy5sZW5ndGgtMV07XG4gICAgICAgIGZvY3VzRWx0MC5yZW1vdmVBdHRyaWJ1dGUoJ3RhYkluZGV4Jyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ3NldHRsaW5nIG9uIGFubm91bmNlbWVudCByZWdpb24nLCBmb2N1c0VsdClcbiAgICAgIGZvY3VzRWx0MCA9IGZvY3VzRWx0O1xuICAgIH1cblxuICAgIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuICAgIGZvY3VzRWx0MC5jbGljaygpO1xuICAgIGZvY3VzRWx0MC5mb2N1cygpO1xuICAgIC8vY29uc29sZS5sb2coJyhjZilkb2NhY3RlbHQ9JywgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCk7XG4gIH1cblxuICB2YXIgcHJvZ3JhbUxvYWRlZCA9IGxvYWRQcm9ncmFtKGluaXRpYWxQcm9ncmFtKTtcblxuICB2YXIgcHJvZ3JhbVRvU2F2ZSA9IGluaXRpYWxQcm9ncmFtO1xuXG4gIGZ1bmN0aW9uIHNob3dTaGFyZUNvbnRhaW5lcihwKSB7XG4gICAgLy9jb25zb2xlLmxvZygnY2FsbGVkIHNob3dTaGFyZUNvbnRhaW5lcicpO1xuICAgIGlmKCFwLnNoYXJlZCkge1xuICAgICAgJChcIiNzaGFyZUNvbnRhaW5lclwiKS5lbXB0eSgpO1xuICAgICAgJCgnI3B1Ymxpc2hsaScpLnNob3coKTtcbiAgICAgICQoXCIjc2hhcmVDb250YWluZXJcIikuYXBwZW5kKHNoYXJlQVBJLm1ha2VTaGFyZUxpbmsocCkpO1xuICAgICAgZ2V0VG9wVGllck1lbnVpdGVtcygpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG5hbWVPclVudGl0bGVkKCkge1xuICAgIHJldHVybiBmaWxlbmFtZSB8fCBcIlVudGl0bGVkXCI7XG4gIH1cbiAgZnVuY3Rpb24gYXV0b1NhdmUoKSB7XG4gICAgcHJvZ3JhbVRvU2F2ZS50aGVuKGZ1bmN0aW9uKHApIHtcbiAgICAgIGlmKHAgIT09IG51bGwgJiYgIXAuc2hhcmVkKSB7IHNhdmUoKTsgfVxuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gZW5hYmxlRmlsZU9wdGlvbnMoKSB7XG4gICAgJChcIiNmaWxlbWVudUNvbnRlbnRzICpcIikucmVtb3ZlQ2xhc3MoXCJkaXNhYmxlZFwiKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1lbnVJdGVtRGlzYWJsZWQoaWQpIHtcbiAgICByZXR1cm4gJChcIiNcIiArIGlkKS5oYXNDbGFzcyhcImRpc2FibGVkXCIpO1xuICB9XG5cbiAgZnVuY3Rpb24gbmV3RXZlbnQoZSkge1xuICAgIHdpbmRvdy5vcGVuKHdpbmRvdy5BUFBfQkFTRV9VUkwgKyBcIi9lZGl0b3JcIik7XG4gIH1cblxuICBmdW5jdGlvbiBzYXZlRXZlbnQoZSkge1xuICAgIGlmKG1lbnVJdGVtRGlzYWJsZWQoXCJzYXZlXCIpKSB7IHJldHVybjsgfVxuICAgIHJldHVybiBzYXZlKCk7XG4gIH1cblxuICAvKlxuICAgIHNhdmUgOiBzdHJpbmcgKG9wdGlvbmFsKSAtPiB1bmRlZlxuXG4gICAgSWYgYSBzdHJpbmcgYXJndW1lbnQgaXMgcHJvdmlkZWQsIGNyZWF0ZSBhIG5ldyBmaWxlIHdpdGggdGhhdCBuYW1lIGFuZCBzYXZlXG4gICAgdGhlIGVkaXRvciBjb250ZW50cyBpbiB0aGF0IGZpbGUuXG5cbiAgICBJZiBubyBmaWxlbmFtZSBpcyBwcm92aWRlZCwgc2F2ZSB0aGUgZXhpc3RpbmcgZmlsZSByZWZlcmVuY2VkIGJ5IHRoZSBlZGl0b3JcbiAgICB3aXRoIHRoZSBjdXJyZW50IGVkaXRvciBjb250ZW50cy4gIElmIG5vIGZpbGVuYW1lIGhhcyBiZWVuIHNldCB5ZXQsIGp1c3RcbiAgICBzZXQgdGhlIG5hbWUgdG8gXCJVbnRpdGxlZFwiLlxuXG4gICovXG4gIGZ1bmN0aW9uIHNhdmUobmV3RmlsZW5hbWUpIHtcbiAgICB2YXIgdXNlTmFtZSwgY3JlYXRlO1xuICAgIGlmKG5ld0ZpbGVuYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHVzZU5hbWUgPSBuZXdGaWxlbmFtZTtcbiAgICAgIGNyZWF0ZSA9IHRydWU7XG4gICAgfVxuICAgIGVsc2UgaWYoZmlsZW5hbWUgPT09IGZhbHNlKSB7XG4gICAgICBmaWxlbmFtZSA9IFwiVW50aXRsZWRcIjtcbiAgICAgIGNyZWF0ZSA9IHRydWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdXNlTmFtZSA9IGZpbGVuYW1lOyAvLyBBIGNsb3NlZC1vdmVyIHZhcmlhYmxlXG4gICAgICBjcmVhdGUgPSBmYWxzZTtcbiAgICB9XG4gICAgd2luZG93LnN0aWNrTWVzc2FnZShcIlNhdmluZy4uLlwiKTtcbiAgICB2YXIgc2F2ZWRQcm9ncmFtID0gcHJvZ3JhbVRvU2F2ZS50aGVuKGZ1bmN0aW9uKHApIHtcbiAgICAgIGlmKHAgIT09IG51bGwgJiYgcC5zaGFyZWQgJiYgIWNyZWF0ZSkge1xuICAgICAgICByZXR1cm4gcDsgLy8gRG9uJ3QgdHJ5IHRvIHNhdmUgc2hhcmVkIGZpbGVzXG4gICAgICB9XG4gICAgICBpZihjcmVhdGUpIHtcbiAgICAgICAgcHJvZ3JhbVRvU2F2ZSA9IHN0b3JhZ2VBUElcbiAgICAgICAgICAudGhlbihmdW5jdGlvbihhcGkpIHsgcmV0dXJuIGFwaS5jcmVhdGVGaWxlKHVzZU5hbWUpOyB9KVxuICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHApIHtcbiAgICAgICAgICAgIC8vIHNob3dTaGFyZUNvbnRhaW5lcihwKTsgVE9ETyhqb2UpOiBmaWd1cmUgb3V0IHdoZXJlIHRvIHB1dCB0aGlzXG4gICAgICAgICAgICBoaXN0b3J5LnB1c2hTdGF0ZShudWxsLCBudWxsLCBcIiNwcm9ncmFtPVwiICsgcC5nZXRVbmlxdWVJZCgpKTtcbiAgICAgICAgICAgIHVwZGF0ZU5hbWUocCk7IC8vIHNldHMgZmlsZW5hbWVcbiAgICAgICAgICAgIGVuYWJsZUZpbGVPcHRpb25zKCk7XG4gICAgICAgICAgICByZXR1cm4gcDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHByb2dyYW1Ub1NhdmUudGhlbihmdW5jdGlvbihwKSB7XG4gICAgICAgICAgcmV0dXJuIHNhdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHByb2dyYW1Ub1NhdmUudGhlbihmdW5jdGlvbihwKSB7XG4gICAgICAgICAgaWYocCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHAuc2F2ZShDUE8uZWRpdG9yLmNtLmdldFZhbHVlKCksIGZhbHNlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24ocCkge1xuICAgICAgICAgIGlmKHAgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHdpbmRvdy5mbGFzaE1lc3NhZ2UoXCJQcm9ncmFtIHNhdmVkIGFzIFwiICsgcC5nZXROYW1lKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcDtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgc2F2ZWRQcm9ncmFtLmZhaWwoZnVuY3Rpb24oZXJyKSB7XG4gICAgICB3aW5kb3cuc3RpY2tFcnJvcihcIlVuYWJsZSB0byBzYXZlXCIsIFwiWW91ciBpbnRlcm5ldCBjb25uZWN0aW9uIG1heSBiZSBkb3duLCBvciBzb21ldGhpbmcgZWxzZSBtaWdodCBiZSB3cm9uZyB3aXRoIHRoaXMgc2l0ZSBvciBzYXZpbmcgdG8gR29vZ2xlLiAgWW91IHNob3VsZCBiYWNrIHVwIGFueSBjaGFuZ2VzIHRvIHRoaXMgcHJvZ3JhbSBzb21ld2hlcmUgZWxzZS4gIFlvdSBjYW4gdHJ5IHNhdmluZyBhZ2FpbiB0byBzZWUgaWYgdGhlIHByb2JsZW0gd2FzIHRlbXBvcmFyeSwgYXMgd2VsbC5cIik7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfSk7XG4gICAgcmV0dXJuIHNhdmVkUHJvZ3JhbTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNhdmVBcygpIHtcbiAgICBpZihtZW51SXRlbURpc2FibGVkKFwic2F2ZWFzXCIpKSB7IHJldHVybjsgfVxuICAgIHByb2dyYW1Ub1NhdmUudGhlbihmdW5jdGlvbihwKSB7XG4gICAgICB2YXIgbmFtZSA9IHAgPT09IG51bGwgPyBcIlVudGl0bGVkXCIgOiBwLmdldE5hbWUoKTtcbiAgICAgIHZhciBzYXZlQXNQcm9tcHQgPSBuZXcgbW9kYWxQcm9tcHQoe1xuICAgICAgICB0aXRsZTogXCJTYXZlIGEgY29weVwiLFxuICAgICAgICBzdHlsZTogXCJ0ZXh0XCIsXG4gICAgICAgIHN1Ym1pdFRleHQ6IFwiU2F2ZVwiLFxuICAgICAgICBuYXJyb3c6IHRydWUsXG4gICAgICAgIG9wdGlvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBtZXNzYWdlOiBcIlRoZSBuYW1lIGZvciB0aGUgY29weTpcIixcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZTogbmFtZVxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gc2F2ZUFzUHJvbXB0LnNob3coKS50aGVuKGZ1bmN0aW9uKG5ld05hbWUpIHtcbiAgICAgICAgaWYobmV3TmFtZSA9PT0gbnVsbCkgeyByZXR1cm4gbnVsbDsgfVxuICAgICAgICB3aW5kb3cuc3RpY2tNZXNzYWdlKFwiU2F2aW5nLi4uXCIpO1xuICAgICAgICByZXR1cm4gc2F2ZShuZXdOYW1lKTtcbiAgICAgIH0pLlxuICAgICAgZmFpbChmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byByZW5hbWU6IFwiLCBlcnIpO1xuICAgICAgICB3aW5kb3cuZmxhc2hFcnJvcihcIkZhaWxlZCB0byByZW5hbWUgZmlsZVwiKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVuYW1lKCkge1xuICAgIHByb2dyYW1Ub1NhdmUudGhlbihmdW5jdGlvbihwKSB7XG4gICAgICB2YXIgcmVuYW1lUHJvbXB0ID0gbmV3IG1vZGFsUHJvbXB0KHtcbiAgICAgICAgdGl0bGU6IFwiUmVuYW1lIHRoaXMgZmlsZVwiLFxuICAgICAgICBzdHlsZTogXCJ0ZXh0XCIsXG4gICAgICAgIG5hcnJvdzogdHJ1ZSxcbiAgICAgICAgc3VibWl0VGV4dDogXCJSZW5hbWVcIixcbiAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IFwiVGhlIG5ldyBuYW1lIGZvciB0aGUgZmlsZTpcIixcbiAgICAgICAgICAgIGRlZmF1bHRWYWx1ZTogcC5nZXROYW1lKClcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH0pO1xuICAgICAgLy8gbnVsbCByZXR1cm4gdmFsdWVzIGFyZSBmb3IgdGhlIFwiY2FuY2VsXCIgcGF0aFxuICAgICAgcmV0dXJuIHJlbmFtZVByb21wdC5zaG93KCkudGhlbihmdW5jdGlvbihuZXdOYW1lKSB7XG4gICAgICAgIGlmKG5ld05hbWUgPT09IG51bGwpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB3aW5kb3cuc3RpY2tNZXNzYWdlKFwiUmVuYW1pbmcuLi5cIik7XG4gICAgICAgIHByb2dyYW1Ub1NhdmUgPSBwLnJlbmFtZShuZXdOYW1lKTtcbiAgICAgICAgcmV0dXJuIHByb2dyYW1Ub1NhdmU7XG4gICAgICB9KVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocCkge1xuICAgICAgICBpZihwID09PSBudWxsKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdXBkYXRlTmFtZShwKTtcbiAgICAgICAgd2luZG93LmZsYXNoTWVzc2FnZShcIlByb2dyYW0gc2F2ZWQgYXMgXCIgKyBwLmdldE5hbWUoKSk7XG4gICAgICB9KVxuICAgICAgLmZhaWwoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gcmVuYW1lOiBcIiwgZXJyKTtcbiAgICAgICAgd2luZG93LmZsYXNoRXJyb3IoXCJGYWlsZWQgdG8gcmVuYW1lIGZpbGVcIik7XG4gICAgICB9KTtcbiAgICB9KVxuICAgIC5mYWlsKGZ1bmN0aW9uKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihcIlVuYWJsZSB0byByZW5hbWU6IFwiLCBlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgJChcIiNydW5CdXR0b25cIikuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgQ1BPLmF1dG9TYXZlKCk7XG4gIH0pO1xuXG4gICQoXCIjbmV3XCIpLmNsaWNrKG5ld0V2ZW50KTtcbiAgJChcIiNzYXZlXCIpLmNsaWNrKHNhdmVFdmVudCk7XG4gICQoXCIjcmVuYW1lXCIpLmNsaWNrKHJlbmFtZSk7XG4gICQoXCIjc2F2ZWFzXCIpLmNsaWNrKHNhdmVBcyk7XG5cbiAgdmFyIGZvY3VzYWJsZUVsdHMgPSAkKGRvY3VtZW50KS5maW5kKCcjaGVhZGVyIC5mb2N1c2FibGUnKTtcbiAgLy9jb25zb2xlLmxvZygnZm9jdXNhYmxlRWx0cz0nLCBmb2N1c2FibGVFbHRzKVxuICB2YXIgdGhlVG9vbGJhciA9ICQoZG9jdW1lbnQpLmZpbmQoJyNUb29sYmFyJyk7XG5cbiAgZnVuY3Rpb24gZ2V0VG9wVGllck1lbnVpdGVtcygpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdkb2luZyBnZXRUb3BUaWVyTWVudWl0ZW1zJylcbiAgICB2YXIgdG9wVGllck1lbnVpdGVtcyA9ICQoZG9jdW1lbnQpLmZpbmQoJyNoZWFkZXIgdWwgbGkudG9wVGllcicpLnRvQXJyYXkoKTtcbiAgICB0b3BUaWVyTWVudWl0ZW1zID0gdG9wVGllck1lbnVpdGVtcy5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlcihlbHQgPT4gIShlbHQuc3R5bGUuZGlzcGxheSA9PT0gJ25vbmUnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWx0LmdldEF0dHJpYnV0ZSgnZGlzYWJsZWQnKSA9PT0gJ2Rpc2FibGVkJykpO1xuICAgIHZhciBudW1Ub3BUaWVyTWVudWl0ZW1zID0gdG9wVGllck1lbnVpdGVtcy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBudW1Ub3BUaWVyTWVudWl0ZW1zOyBpKyspIHtcbiAgICAgIHZhciBpdGhUb3BUaWVyTWVudWl0ZW0gPSB0b3BUaWVyTWVudWl0ZW1zW2ldO1xuICAgICAgdmFyIGlDaGlsZCA9ICQoaXRoVG9wVGllck1lbnVpdGVtKS5jaGlsZHJlbigpLmZpcnN0KCk7XG4gICAgICAvL2NvbnNvbGUubG9nKCdpQ2hpbGQ9JywgaUNoaWxkKTtcbiAgICAgIGlDaGlsZC5maW5kKCcuZm9jdXNhYmxlJykuXG4gICAgICAgIGF0dHIoJ2FyaWEtc2V0c2l6ZScsIG51bVRvcFRpZXJNZW51aXRlbXMudG9TdHJpbmcoKSkuXG4gICAgICAgIGF0dHIoJ2FyaWEtcG9zaW5zZXQnLCAoaSsxKS50b1N0cmluZygpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRvcFRpZXJNZW51aXRlbXM7XG4gIH1cblxuICBmdW5jdGlvbiB1cGRhdGVFZGl0b3JIZWlnaHQoKSB7XG4gICAgdmFyIHRvb2xiYXJIZWlnaHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndG9wVGllclVsJykub2Zmc2V0SGVpZ2h0O1xuICAgIC8vIGdldHMgYnVtcGVkIHRvIDY3IG9uIGluaXRpYWwgcmVzaXplIHBlcnR1cmJhdGlvbiwgYnV0IGFjdHVhbCB2YWx1ZSBpcyBpbmRlZWQgNDBcbiAgICBpZiAodG9vbGJhckhlaWdodCA8IDgwKSB0b29sYmFySGVpZ2h0ID0gNDA7XG4gICAgdG9vbGJhckhlaWdodCArPSAncHgnO1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdSRVBMJykuc3R5bGUucGFkZGluZ1RvcCA9IHRvb2xiYXJIZWlnaHQ7XG4gICAgdmFyIGRvY01haW4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFpbicpO1xuICAgIHZhciBkb2NSZXBsTWFpbiA9IGRvY01haW4uZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgncmVwbE1haW4nKTtcbiAgICBpZiAoZG9jUmVwbE1haW4ubGVuZ3RoICE9PSAwKSB7XG4gICAgICBkb2NSZXBsTWFpblswXS5zdHlsZS5wYWRkaW5nVG9wID0gdG9vbGJhckhlaWdodDtcbiAgICB9XG4gIH1cblxuICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsIHVwZGF0ZUVkaXRvckhlaWdodCk7XG5cbiAgZnVuY3Rpb24gaW5zZXJ0QXJpYVBvcyhzdWJtZW51KSB7XG4gICAgLy9jb25zb2xlLmxvZygnZG9pbmcgaW5zZXJ0QXJpYVBvcycsIHN1Ym1lbnUpXG4gICAgdmFyIGFyciA9IHN1Ym1lbnUudG9BcnJheSgpO1xuICAgIC8vY29uc29sZS5sb2coJ2Fycj0nLCBhcnIpO1xuICAgIHZhciBsZW4gPSBhcnIubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIHZhciBlbHQgPSBhcnJbaV07XG4gICAgICAvL2NvbnNvbGUubG9nKCdlbHQnLCBpLCAnPScsIGVsdCk7XG4gICAgICBlbHQuc2V0QXR0cmlidXRlKCdhcmlhLXNldHNpemUnLCBsZW4udG9TdHJpbmcoKSk7XG4gICAgICBlbHQuc2V0QXR0cmlidXRlKCdhcmlhLXBvc2luc2V0JywgKGkrMSkudG9TdHJpbmcoKSk7XG4gICAgfVxuICB9XG5cblxuICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uICgpIHtcbiAgICBoaWRlQWxsVG9wTWVudWl0ZW1zKCk7XG4gIH0pO1xuXG4gIHRoZVRvb2xiYXIuY2xpY2soZnVuY3Rpb24gKGUpIHtcbiAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICB9KTtcblxuICB0aGVUb29sYmFyLmtleWRvd24oZnVuY3Rpb24gKGUpIHtcbiAgICAvL2NvbnNvbGUubG9nKCd0b29sYmFyIGtleWRvd24nLCBlKTtcbiAgICAvL21vc3QgYW55IGtleSBhdCBhbGxcbiAgICB2YXIga2MgPSBlLmtleUNvZGU7XG4gICAgaWYgKGtjID09PSAyNykge1xuICAgICAgLy8gZXNjYXBlXG4gICAgICBoaWRlQWxsVG9wTWVudWl0ZW1zKCk7XG4gICAgICAvL2NvbnNvbGUubG9nKCdjYWxsaW5nIGN5Y2xlRm9jdXMgZnJvbSB0b29sYmFyJylcbiAgICAgIENQTy5jeWNsZUZvY3VzKCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0gZWxzZSBpZiAoa2MgPT09IDkgfHwga2MgPT09IDM3IHx8IGtjID09PSAzOCB8fCBrYyA9PT0gMzkgfHwga2MgPT09IDQwKSB7XG4gICAgICAvLyBhbiBhcnJvd1xuICAgICAgdmFyIHRhcmdldCA9ICQodGhpcykuZmluZCgnW3RhYkluZGV4PS0xXScpO1xuICAgICAgZ2V0VG9wVGllck1lbnVpdGVtcygpO1xuICAgICAgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7IC8vbmVlZGVkP1xuICAgICAgdGFyZ2V0LmZpcnN0KCkuZm9jdXMoKTsgLy9uZWVkZWQ/XG4gICAgICAvL2NvbnNvbGUubG9nKCdkb2NhY3RlbHQ9JywgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBoaWRlQWxsVG9wTWVudWl0ZW1zKCk7XG4gICAgfVxuICB9KTtcblxuICBmdW5jdGlvbiBjbGlja1RvcE1lbnVpdGVtKGUpIHtcbiAgICBoaWRlQWxsVG9wTWVudWl0ZW1zKCk7XG4gICAgdmFyIHRoaXNFbHQgPSAkKHRoaXMpO1xuICAgIC8vY29uc29sZS5sb2coJ2RvaW5nIGNsaWNrVG9wTWVudWl0ZW0gb24nLCB0aGlzRWx0KTtcbiAgICB2YXIgdG9wVGllclVsID0gdGhpc0VsdC5jbG9zZXN0KCd1bFtpZD10b3BUaWVyVWxdJyk7XG4gICAgaWYgKHRoaXNFbHRbMF0uaGFzQXR0cmlidXRlKCdhcmlhLWhpZGRlbicpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzRWx0WzBdLmdldEF0dHJpYnV0ZSgnZGlzYWJsZWQnKSA9PT0gJ2Rpc2FibGVkJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvL3ZhciBoaWRkZW5QID0gKHRoaXNFbHRbMF0uZ2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJykgPT09ICdmYWxzZScpO1xuICAgIC8vaGlkZGVuUCBhbHdheXMgZmFsc2U/XG4gICAgdmFyIHRoaXNUb3BNZW51aXRlbSA9IHRoaXNFbHQuY2xvc2VzdCgnbGkudG9wVGllcicpO1xuICAgIC8vY29uc29sZS5sb2coJ3RoaXNUb3BNZW51aXRlbT0nLCB0aGlzVG9wTWVudWl0ZW0pO1xuICAgIHZhciB0MSA9IHRoaXNUb3BNZW51aXRlbVswXTtcbiAgICB2YXIgc3VibWVudU9wZW4gPSAodGhpc0VsdFswXS5nZXRBdHRyaWJ1dGUoJ2FyaWEtZXhwYW5kZWQnKSA9PT0gJ3RydWUnKTtcbiAgICBpZiAoIXN1Ym1lbnVPcGVuKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdoaWRkZW5wIHRydWUgYnJhbmNoJyk7XG4gICAgICBoaWRlQWxsVG9wTWVudWl0ZW1zKCk7XG4gICAgICB0aGlzVG9wTWVudWl0ZW0uY2hpbGRyZW4oJ3VsLnN1Ym1lbnUnKS5hdHRyKCdhcmlhLWhpZGRlbicsICdmYWxzZScpLnNob3coKTtcbiAgICAgIHRoaXNUb3BNZW51aXRlbS5jaGlsZHJlbigpLmZpcnN0KCkuZmluZCgnW2FyaWEtZXhwYW5kZWRdJykuYXR0cignYXJpYS1leHBhbmRlZCcsICd0cnVlJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ2hpZGRlbnAgZmFsc2UgYnJhbmNoJyk7XG4gICAgICB0aGlzVG9wTWVudWl0ZW0uY2hpbGRyZW4oJ3VsLnN1Ym1lbnUnKS5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJykuaGlkZSgpO1xuICAgICAgdGhpc1RvcE1lbnVpdGVtLmNoaWxkcmVuKCkuZmlyc3QoKS5maW5kKCdbYXJpYS1leHBhbmRlZF0nKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XG4gICAgfVxuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gIH1cblxuICB2YXIgZXhwYW5kYWJsZUVsdHMgPSAkKGRvY3VtZW50KS5maW5kKCcjaGVhZGVyIFthcmlhLWV4cGFuZGVkXScpO1xuICBleHBhbmRhYmxlRWx0cy5jbGljayhjbGlja1RvcE1lbnVpdGVtKTtcblxuICBmdW5jdGlvbiBoaWRlQWxsVG9wTWVudWl0ZW1zKCkge1xuICAgIC8vY29uc29sZS5sb2coJ2RvaW5nIGhpZGVBbGxUb3BNZW51aXRlbXMnKTtcbiAgICB2YXIgdG9wVGllclVsID0gJChkb2N1bWVudCkuZmluZCgnI2hlYWRlciB1bFtpZD10b3BUaWVyVWxdJyk7XG4gICAgdG9wVGllclVsLmZpbmQoJ1thcmlhLWV4cGFuZGVkXScpLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAnZmFsc2UnKTtcbiAgICB0b3BUaWVyVWwuZmluZCgndWwuc3VibWVudScpLmF0dHIoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKS5oaWRlKCk7XG4gIH1cblxuICB2YXIgbm9uZXhwYW5kYWJsZUVsdHMgPSAkKGRvY3VtZW50KS5maW5kKCcjaGVhZGVyIC50b3BUaWVyID4gZGl2ID4gYnV0dG9uOm5vdChbYXJpYS1leHBhbmRlZF0pJyk7XG4gIG5vbmV4cGFuZGFibGVFbHRzLmNsaWNrKGhpZGVBbGxUb3BNZW51aXRlbXMpO1xuXG4gIGZ1bmN0aW9uIHN3aXRjaFRvcE1lbnVpdGVtKGRlc3RUb3BNZW51aXRlbSwgZGVzdEVsdCkge1xuICAgIC8vY29uc29sZS5sb2coJ2RvaW5nIHN3aXRjaFRvcE1lbnVpdGVtJywgZGVzdFRvcE1lbnVpdGVtLCBkZXN0RWx0KTtcbiAgICAvL2NvbnNvbGUubG9nKCdkdG1pbD0nLCBkZXN0VG9wTWVudWl0ZW0ubGVuZ3RoKTtcbiAgICBoaWRlQWxsVG9wTWVudWl0ZW1zKCk7XG4gICAgaWYgKGRlc3RUb3BNZW51aXRlbSAmJiBkZXN0VG9wTWVudWl0ZW0ubGVuZ3RoICE9PSAwKSB7XG4gICAgICB2YXIgZWx0ID0gZGVzdFRvcE1lbnVpdGVtWzBdO1xuICAgICAgdmFyIGVsdElkID0gZWx0LmdldEF0dHJpYnV0ZSgnaWQnKTtcbiAgICAgIGRlc3RUb3BNZW51aXRlbS5jaGlsZHJlbigndWwuc3VibWVudScpLmF0dHIoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJykuc2hvdygpO1xuICAgICAgZGVzdFRvcE1lbnVpdGVtLmNoaWxkcmVuKCkuZmlyc3QoKS5maW5kKCdbYXJpYS1leHBhbmRlZF0nKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ3RydWUnKTtcbiAgICB9XG4gICAgaWYgKGRlc3RFbHQpIHtcbiAgICAgIC8vZGVzdEVsdC5hdHRyKCd0YWJJbmRleCcsICcwJykuZm9jdXMoKTtcbiAgICAgIGRlc3RFbHQuZm9jdXMoKTtcbiAgICB9XG4gIH1cblxuICB2YXIgc2hvd2luZ0hlbHBLZXlzID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gc2hvd0hlbHBLZXlzKCkge1xuICAgIHNob3dpbmdIZWxwS2V5cyA9IHRydWU7XG4gICAgJCgnI2hlbHAta2V5cycpLmZhZGVJbigxMDApO1xuICAgIHJlY2l0ZUhlbHAoKTtcbiAgfVxuXG4gIGZvY3VzYWJsZUVsdHMua2V5ZG93bihmdW5jdGlvbiAoZSkge1xuICAgIC8vY29uc29sZS5sb2coJ2ZvY3VzYWJsZSBlbHQga2V5ZG93bicsIGUpO1xuICAgIHZhciBrYyA9IGUua2V5Q29kZTtcbiAgICAvLyQodGhpcykuYmx1cigpOyAvLyBEZWxldGU/XG4gICAgdmFyIHdpdGhpblNlY29uZFRpZXJVbCA9IHRydWU7XG4gICAgdmFyIHRvcFRpZXJVbCA9ICQodGhpcykuY2xvc2VzdCgndWxbaWQ9dG9wVGllclVsXScpO1xuICAgIHZhciBzZWNvbmRUaWVyVWwgPSAkKHRoaXMpLmNsb3Nlc3QoJ3VsLnN1Ym1lbnUnKTtcbiAgICBpZiAoc2Vjb25kVGllclVsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgd2l0aGluU2Vjb25kVGllclVsID0gZmFsc2U7XG4gICAgfVxuICAgIGlmIChrYyA9PT0gMjcpIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ2VzY2FwZSBwcmVzc2VkIGknKVxuICAgICAgJCgnI2hlbHAta2V5cycpLmZhZGVPdXQoNTAwKTtcbiAgICB9XG4gICAgaWYgKGtjID09PSAyNyAmJiB3aXRoaW5TZWNvbmRUaWVyVWwpIHsgLy8gZXNjYXBlXG4gICAgICB2YXIgZGVzdFRvcE1lbnVpdGVtID0gJCh0aGlzKS5jbG9zZXN0KCdsaS50b3BUaWVyJyk7XG4gICAgICB2YXIgcG9zc0VsdHMgPSBkZXN0VG9wTWVudWl0ZW0uZmluZCgnLmZvY3VzYWJsZTpub3QoW2Rpc2FibGVkXSknKS5maWx0ZXIoJzp2aXNpYmxlJyk7XG4gICAgICBzd2l0Y2hUb3BNZW51aXRlbShkZXN0VG9wTWVudWl0ZW0sIHBvc3NFbHRzLmZpcnN0KCkpO1xuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB9IGVsc2UgaWYgKGtjID09PSAzOSkgeyAvLyByaWdodGFycm93XG4gICAgICAvL2NvbnNvbGUubG9nKCdyaWdodGFycm93IHByZXNzZWQnKTtcbiAgICAgIHZhciBzcmNUb3BNZW51aXRlbSA9ICQodGhpcykuY2xvc2VzdCgnbGkudG9wVGllcicpO1xuICAgICAgLy9jb25zb2xlLmxvZygnc3JjVG9wTWVudWl0ZW09Jywgc3JjVG9wTWVudWl0ZW0pO1xuICAgICAgc3JjVG9wTWVudWl0ZW0uY2hpbGRyZW4oKS5maXJzdCgpLmZpbmQoJy5mb2N1c2FibGUnKS5hdHRyKCd0YWJJbmRleCcsICctMScpO1xuICAgICAgdmFyIHRvcFRpZXJNZW51aXRlbXMgPSBnZXRUb3BUaWVyTWVudWl0ZW1zKCk7XG4gICAgICAvL2NvbnNvbGUubG9nKCd0dG1pKiA9JywgdG9wVGllck1lbnVpdGVtcyk7XG4gICAgICB2YXIgdHRtaU4gPSB0b3BUaWVyTWVudWl0ZW1zLmxlbmd0aDtcbiAgICAgIHZhciBqID0gdG9wVGllck1lbnVpdGVtcy5pbmRleE9mKHNyY1RvcE1lbnVpdGVtWzBdKTtcbiAgICAgIC8vY29uc29sZS5sb2coJ2ogaW5pdGlhbD0nLCBqKTtcbiAgICAgIGZvciAodmFyIGkgPSAoaiArIDEpICUgdHRtaU47IGkgIT09IGo7IGkgPSAoaSArIDEpICUgdHRtaU4pIHtcbiAgICAgICAgdmFyIGRlc3RUb3BNZW51aXRlbSA9ICQodG9wVGllck1lbnVpdGVtc1tpXSk7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ2Rlc3RUb3BNZW51aXRlbShhKT0nLCBkZXN0VG9wTWVudWl0ZW0pO1xuICAgICAgICB2YXIgcG9zc0VsdHMgPSBkZXN0VG9wTWVudWl0ZW0uZmluZCgnLmZvY3VzYWJsZTpub3QoW2Rpc2FibGVkXSknKS5maWx0ZXIoJzp2aXNpYmxlJyk7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ3Bvc3NFbHRzPScsIHBvc3NFbHRzKVxuICAgICAgICBpZiAocG9zc0VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIC8vY29uc29sZS5sb2coJ2ZpbmFsIGk9JywgaSk7XG4gICAgICAgICAgLy9jb25zb2xlLmxvZygnbGFuZGluZyBvbicsIHBvc3NFbHRzLmZpcnN0KCkpO1xuICAgICAgICAgIHN3aXRjaFRvcE1lbnVpdGVtKGRlc3RUb3BNZW51aXRlbSwgcG9zc0VsdHMuZmlyc3QoKSk7XG4gICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoa2MgPT09IDM3KSB7IC8vIGxlZnRhcnJvd1xuICAgICAgLy9jb25zb2xlLmxvZygnbGVmdGFycm93IHByZXNzZWQnKTtcbiAgICAgIHZhciBzcmNUb3BNZW51aXRlbSA9ICQodGhpcykuY2xvc2VzdCgnbGkudG9wVGllcicpO1xuICAgICAgLy9jb25zb2xlLmxvZygnc3JjVG9wTWVudWl0ZW09Jywgc3JjVG9wTWVudWl0ZW0pO1xuICAgICAgc3JjVG9wTWVudWl0ZW0uY2hpbGRyZW4oKS5maXJzdCgpLmZpbmQoJy5mb2N1c2FibGUnKS5hdHRyKCd0YWJJbmRleCcsICctMScpO1xuICAgICAgdmFyIHRvcFRpZXJNZW51aXRlbXMgPSBnZXRUb3BUaWVyTWVudWl0ZW1zKCk7XG4gICAgICAvL2NvbnNvbGUubG9nKCd0dG1pKiA9JywgdG9wVGllck1lbnVpdGVtcyk7XG4gICAgICB2YXIgdHRtaU4gPSB0b3BUaWVyTWVudWl0ZW1zLmxlbmd0aDtcbiAgICAgIHZhciBqID0gdG9wVGllck1lbnVpdGVtcy5pbmRleE9mKHNyY1RvcE1lbnVpdGVtWzBdKTtcbiAgICAgIC8vY29uc29sZS5sb2coJ2ogaW5pdGlhbD0nLCBqKTtcbiAgICAgIGZvciAodmFyIGkgPSAoaiArIHR0bWlOIC0gMSkgJSB0dG1pTjsgaSAhPT0gajsgaSA9IChpICsgdHRtaU4gLSAxKSAlIHR0bWlOKSB7XG4gICAgICAgIHZhciBkZXN0VG9wTWVudWl0ZW0gPSAkKHRvcFRpZXJNZW51aXRlbXNbaV0pO1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdkZXN0VG9wTWVudWl0ZW0oYik9JywgZGVzdFRvcE1lbnVpdGVtKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnaT0nLCBpKVxuICAgICAgICB2YXIgcG9zc0VsdHMgPSBkZXN0VG9wTWVudWl0ZW0uZmluZCgnLmZvY3VzYWJsZTpub3QoW2Rpc2FibGVkXSknKS5maWx0ZXIoJzp2aXNpYmxlJyk7XG4gICAgICAgIC8vY29uc29sZS5sb2coJ3Bvc3NFbHRzPScsIHBvc3NFbHRzKVxuICAgICAgICBpZiAocG9zc0VsdHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgIC8vY29uc29sZS5sb2coJ2ZpbmFsIGk9JywgaSk7XG4gICAgICAgICAgLy9jb25zb2xlLmxvZygnbGFuZGluZyBvbicsIHBvc3NFbHRzLmZpcnN0KCkpO1xuICAgICAgICAgIHN3aXRjaFRvcE1lbnVpdGVtKGRlc3RUb3BNZW51aXRlbSwgcG9zc0VsdHMuZmlyc3QoKSk7XG4gICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoa2MgPT09IDM4KSB7IC8vIHVwYXJyb3dcbiAgICAgIC8vY29uc29sZS5sb2coJ3VwYXJyb3cgcHJlc3NlZCcpO1xuICAgICAgdmFyIHN1Ym1lbnU7XG4gICAgICBpZiAod2l0aGluU2Vjb25kVGllclVsKSB7XG4gICAgICAgIHZhciBuZWFyU2licyA9ICQodGhpcykuY2xvc2VzdCgnZGl2JykuZmluZCgnLmZvY3VzYWJsZScpLmZpbHRlcignOnZpc2libGUnKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnbmVhclNpYnM9JywgbmVhclNpYnMpO1xuICAgICAgICB2YXIgbXlJZCA9ICQodGhpcylbMF0uZ2V0QXR0cmlidXRlKCdpZCcpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdteUlkPScsIG15SWQpO1xuICAgICAgICBzdWJtZW51ID0gJChbXSk7XG4gICAgICAgIHZhciB0aGlzRW5jb3VudGVyZWQgPSBmYWxzZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IG5lYXJTaWJzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgaWYgKHRoaXNFbmNvdW50ZXJlZCkge1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnYWRkaW5nJywgbmVhclNpYnNbaV0pO1xuICAgICAgICAgICAgc3VibWVudSA9IHN1Ym1lbnUuYWRkKCQobmVhclNpYnNbaV0pKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKG5lYXJTaWJzW2ldLmdldEF0dHJpYnV0ZSgnaWQnKSA9PT0gbXlJZCkge1xuICAgICAgICAgICAgdGhpc0VuY291bnRlcmVkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy9jb25zb2xlLmxvZygnc3VibWVudSBzbyBmYXI9Jywgc3VibWVudSk7XG4gICAgICAgIHZhciBmYXJTaWJzID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpLnByZXZBbGwoKS5maW5kKCdkaXY6bm90KC5kaXNhYmxlZCknKVxuICAgICAgICAgIC5maW5kKCcuZm9jdXNhYmxlJykuZmlsdGVyKCc6dmlzaWJsZScpO1xuICAgICAgICBzdWJtZW51ID0gc3VibWVudS5hZGQoZmFyU2licyk7XG4gICAgICAgIGlmIChzdWJtZW51Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIHN1Ym1lbnUgPSAkKHRoaXMpLmNsb3Nlc3QoJ2xpJykuY2xvc2VzdCgndWwnKS5maW5kKCdkaXY6bm90KC5kaXNhYmxlZCknKVxuICAgICAgICAgIC5maW5kKCcuZm9jdXNhYmxlJykuZmlsdGVyKCc6dmlzaWJsZScpLmxhc3QoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3VibWVudS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgc3VibWVudS5sYXN0KCkuZm9jdXMoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvKlxuICAgICAgICAgIC8vY29uc29sZS5sb2coJ25vIGFjdGlvbmFibGUgc3VibWVudSBmb3VuZCcpXG4gICAgICAgICAgdmFyIHRvcG1lbnVJdGVtID0gJCh0aGlzKS5jbG9zZXN0KCd1bC5zdWJtZW51JykuY2xvc2VzdCgnbGknKVxuICAgICAgICAgIC5jaGlsZHJlbigpLmZpcnN0KCkuZmluZCgnLmZvY3VzYWJsZTpub3QoW2Rpc2FibGVkXSknKS5maWx0ZXIoJzp2aXNpYmxlJyk7XG4gICAgICAgICAgaWYgKHRvcG1lbnVJdGVtLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRvcG1lbnVJdGVtLmZpcnN0KCkuZm9jdXMoKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnbm8gYWN0aW9uYWJsZSB0b3BtZW51aXRlbSBmb3VuZCBlaXRoZXInKVxuICAgICAgICAgIH1cbiAgICAgICAgICAqL1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0gZWxzZSBpZiAoa2MgPT09IDQwKSB7IC8vIGRvd25hcnJvd1xuICAgICAgLy9jb25zb2xlLmxvZygnZG93bmFycm93IHByZXNzZWQnKTtcbiAgICAgIHZhciBzdWJtZW51RGl2cztcbiAgICAgIHZhciBzdWJtZW51O1xuICAgICAgaWYgKCF3aXRoaW5TZWNvbmRUaWVyVWwpIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnMXN0IHRpZXInKVxuICAgICAgICBzdWJtZW51RGl2cyA9ICQodGhpcykuY2xvc2VzdCgnbGknKS5jaGlsZHJlbigndWwnKS5maW5kKCdkaXY6bm90KC5kaXNhYmxlZCknKTtcbiAgICAgICAgc3VibWVudSA9IHN1Ym1lbnVEaXZzLmZpbmQoJy5mb2N1c2FibGUnKS5maWx0ZXIoJzp2aXNpYmxlJyk7XG4gICAgICAgIGluc2VydEFyaWFQb3Moc3VibWVudSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvL2NvbnNvbGUubG9nKCcybmQgdGllcicpXG4gICAgICAgIHZhciBuZWFyU2licyA9ICQodGhpcykuY2xvc2VzdCgnZGl2JykuZmluZCgnLmZvY3VzYWJsZScpLmZpbHRlcignOnZpc2libGUnKTtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnbmVhclNpYnM9JywgbmVhclNpYnMpO1xuICAgICAgICB2YXIgbXlJZCA9ICQodGhpcylbMF0uZ2V0QXR0cmlidXRlKCdpZCcpO1xuICAgICAgICAvL2NvbnNvbGUubG9nKCdteUlkPScsIG15SWQpO1xuICAgICAgICBzdWJtZW51ID0gJChbXSk7XG4gICAgICAgIHZhciB0aGlzRW5jb3VudGVyZWQgPSBmYWxzZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuZWFyU2licy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmICh0aGlzRW5jb3VudGVyZWQpIHtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ2FkZGluZycsIG5lYXJTaWJzW2ldKTtcbiAgICAgICAgICAgIHN1Ym1lbnUgPSBzdWJtZW51LmFkZCgkKG5lYXJTaWJzW2ldKSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChuZWFyU2lic1tpXS5nZXRBdHRyaWJ1dGUoJ2lkJykgPT09IG15SWQpIHtcbiAgICAgICAgICAgIHRoaXNFbmNvdW50ZXJlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vY29uc29sZS5sb2coJ3N1Ym1lbnUgc28gZmFyPScsIHN1Ym1lbnUpO1xuICAgICAgICB2YXIgZmFyU2licyA9ICQodGhpcykuY2xvc2VzdCgnbGknKS5uZXh0QWxsKCkuZmluZCgnZGl2Om5vdCguZGlzYWJsZWQpJylcbiAgICAgICAgICAuZmluZCgnLmZvY3VzYWJsZScpLmZpbHRlcignOnZpc2libGUnKTtcbiAgICAgICAgc3VibWVudSA9IHN1Ym1lbnUuYWRkKGZhclNpYnMpO1xuICAgICAgICBpZiAoc3VibWVudS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBzdWJtZW51ID0gJCh0aGlzKS5jbG9zZXN0KCdsaScpLmNsb3Nlc3QoJ3VsJykuZmluZCgnZGl2Om5vdCguZGlzYWJsZWQpJylcbiAgICAgICAgICAgIC5maW5kKCcuZm9jdXNhYmxlJykuZmlsdGVyKCc6dmlzaWJsZScpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvL2NvbnNvbGUubG9nKCdzdWJtZW51PScsIHN1Ym1lbnUpXG4gICAgICBpZiAoc3VibWVudS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHN1Ym1lbnUuZmlyc3QoKS5mb2N1cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnbm8gYWN0aW9uYWJsZSBzdWJtZW51IGZvdW5kJylcbiAgICAgIH1cbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSBlbHNlIGlmIChrYyA9PT0gMjcpIHtcbiAgICAgIC8vY29uc29sZS5sb2coJ2VzYyBwcmVzc2VkJyk7XG4gICAgICBoaWRlQWxsVG9wTWVudWl0ZW1zKCk7XG4gICAgICBpZiAoc2hvd2luZ0hlbHBLZXlzKSB7XG4gICAgICAgIHNob3dpbmdIZWxwS2V5cyA9IGZhbHNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnY2FsbGluZyBjeWNsZUZvY3VzIGlpJylcbiAgICAgICAgQ1BPLmN5Y2xlRm9jdXMoKTtcbiAgICAgIH1cbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAvLyQodGhpcykuY2xvc2VzdCgnbmF2JykuY2xvc2VzdCgnbWFpbicpLmZvY3VzKCk7XG4gICAgfSBlbHNlIGlmIChrYyA9PT0gOSApIHtcbiAgICAgIGlmIChlLnNoaWZ0S2V5KSB7XG4gICAgICAgIGhpZGVBbGxUb3BNZW51aXRlbXMoKTtcbiAgICAgICAgQ1BPLmN5Y2xlRm9jdXModHJ1ZSk7XG4gICAgICB9XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIH0gZWxzZSBpZiAoa2MgPT09IDEzIHx8IGtjID09PSAxNyB8fCBrYyA9PT0gMjAgfHwga2MgPT09IDMyKSB7XG4gICAgICAvLyAxMz1lbnRlciAxNz1jdHJsIDIwPWNhcHNsb2NrIDMyPXNwYWNlXG4gICAgICAvL2NvbnNvbGUubG9nKCdzdG9wcHJvcCAxJylcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfSBlbHNlIGlmIChrYyA+PSAxMTIgJiYga2MgPD0gMTIzKSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdkb3Byb3AgMScpXG4gICAgICAvLyBmbiBrZXlzXG4gICAgICAvLyBnbyBhaGVhZCwgcHJvcGFnYXRlXG4gICAgfSBlbHNlIGlmIChlLmN0cmxLZXkgJiYga2MgPT09IDE5MSkge1xuICAgICAgLy9jb25zb2xlLmxvZygnQy0/IHByZXNzZWQnKVxuICAgICAgc2hvd0hlbHBLZXlzKCk7XG4gICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvL2NvbnNvbGUubG9nKCdzdG9wcHJvcCAyJylcbiAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgfVxuICAgIC8vZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgfSk7XG5cbiAgLy8gc2hhcmVBUEkubWFrZUhvdmVyTWVudSgkKFwiI2ZpbGVtZW51XCIpLCAkKFwiI2ZpbGVtZW51Q29udGVudHNcIiksIGZhbHNlLCBmdW5jdGlvbigpe30pO1xuICAvLyBzaGFyZUFQSS5tYWtlSG92ZXJNZW51KCQoXCIjYm9ubmllbWVudVwiKSwgJChcIiNib25uaWVtZW51Q29udGVudHNcIiksIGZhbHNlLCBmdW5jdGlvbigpe30pO1xuXG5cbiAgdmFyIGNvZGVDb250YWluZXIgPSAkKFwiPGRpdj5cIikuYWRkQ2xhc3MoXCJyZXBsTWFpblwiKTtcbiAgY29kZUNvbnRhaW5lci5hdHRyKFwicm9sZVwiLCBcInJlZ2lvblwiKS5cbiAgICBhdHRyKFwiYXJpYS1sYWJlbFwiLCBcIkRlZmluaXRpb25zXCIpO1xuICAgIC8vYXR0cihcInRhYkluZGV4XCIsIFwiLTFcIik7XG4gICQoXCIjbWFpblwiKS5wcmVwZW5kKGNvZGVDb250YWluZXIpO1xuXG5cbiAgaWYocGFyYW1zW1wiZ2V0XCJdW1wiaGlkZURlZmluaXRpb25zXCJdKSB7XG4gICAgJChcIi5yZXBsTWFpblwiKS5hdHRyKFwiYXJpYS1oaWRkZW5cIiwgdHJ1ZSkuYXR0cihcInRhYmluZGV4XCIsICctMScpO1xuICB9XG4gIFxuICBjb25zdCBpc0NvbnRyb2xsZWQgPSBwYXJhbXNbXCJnZXRcIl1bXCJjb250cm9sbGVkXCJdO1xuICBjb25zdCBoYXNXYXJuT25FeGl0ID0gKFwid2Fybk9uRXhpdFwiIGluIHBhcmFtc1tcImdldFwiXSk7XG4gIGNvbnN0IHNraXBXYXJuaW5nID0gaGFzV2Fybk9uRXhpdCAmJiAocGFyYW1zW1wiZ2V0XCJdW1wid2Fybk9uRXhpdFwiXSA9PT0gXCJmYWxzZVwiKTtcblxuICBpZighaXNDb250cm9sbGVkICYmICFza2lwV2FybmluZykge1xuICAgICQod2luZG93KS5iaW5kKFwiYmVmb3JldW5sb2FkXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIFwiQmVjYXVzZSB0aGlzIHBhZ2UgY2FuIGxvYWQgc2xvd2x5LCBhbmQgeW91IG1heSBoYXZlIG91dHN0YW5kaW5nIGNoYW5nZXMsIHdlIGFzayB0aGF0IHlvdSBjb25maXJtIGJlZm9yZSBsZWF2aW5nIHRoZSBlZGl0b3IgaW4gY2FzZSBjbG9zaW5nIHdhcyBhbiBhY2NpZGVudC5cIjtcbiAgICB9KTtcbiAgfVxuXG4gIENQTy5lZGl0b3IgPSBDUE8ubWFrZUVkaXRvcihjb2RlQ29udGFpbmVyLCB7XG4gICAgcnVuQnV0dG9uOiAkKFwiI3J1bkJ1dHRvblwiKSxcbiAgICBzaW1wbGVFZGl0b3I6IGZhbHNlLFxuICAgIHJ1bjogQ1BPLlJVTl9DT0RFLFxuICAgIGluaXRpYWxHYXM6IDEwMCxcbiAgICBzY3JvbGxQYXN0RW5kOiB0cnVlLFxuICB9KTtcbiAgQ1BPLmVkaXRvci5jbS5zZXRPcHRpb24oXCJyZWFkT25seVwiLCBcIm5vY3Vyc29yXCIpO1xuICBDUE8uZWRpdG9yLmNtLnNldE9wdGlvbihcImxvbmdMaW5lc1wiLCBuZXcgTWFwKCkpO1xuICBmdW5jdGlvbiByZW1vdmVTaG9ydGVuZWRMaW5lKGxpbmVIYW5kbGUpIHtcbiAgICB2YXIgcnVsZXJzID0gQ1BPLmVkaXRvci5jbS5nZXRPcHRpb24oXCJydWxlcnNcIik7XG4gICAgdmFyIHJ1bGVyc01pbkNvbCA9IENQTy5lZGl0b3IuY20uZ2V0T3B0aW9uKFwicnVsZXJzTWluQ29sXCIpO1xuICAgIHZhciBsb25nTGluZXMgPSBDUE8uZWRpdG9yLmNtLmdldE9wdGlvbihcImxvbmdMaW5lc1wiKTtcbiAgICBpZiAobGluZUhhbmRsZS50ZXh0Lmxlbmd0aCA8PSBydWxlcnNNaW5Db2wpIHtcbiAgICAgIGxpbmVIYW5kbGUucnVsZXJMaXN0ZW5lcnMuZm9yRWFjaCgoZiwgZXZ0KSA9PiBsaW5lSGFuZGxlLm9mZihldnQsIGYpKTtcbiAgICAgIGxvbmdMaW5lcy5kZWxldGUobGluZUhhbmRsZSk7XG4gICAgICAvLyBjb25zb2xlLmxvZyhcIlJlbW92ZWQgXCIsIGxpbmVIYW5kbGUpO1xuICAgICAgcmVmcmVzaFJ1bGVycygpO1xuICAgIH1cbiAgfVxuICBmdW5jdGlvbiBkZWxldGVMaW5lKGxpbmVIYW5kbGUpIHtcbiAgICB2YXIgbG9uZ0xpbmVzID0gQ1BPLmVkaXRvci5jbS5nZXRPcHRpb24oXCJsb25nTGluZXNcIik7XG4gICAgbGluZUhhbmRsZS5ydWxlckxpc3RlbmVycy5mb3JFYWNoKChmLCBldnQpID0+IGxpbmVIYW5kbGUub2ZmKGV2dCwgZikpO1xuICAgIGxvbmdMaW5lcy5kZWxldGUobGluZUhhbmRsZSk7XG4gICAgLy8gY29uc29sZS5sb2coXCJSZW1vdmVkIFwiLCBsaW5lSGFuZGxlKTtcbiAgICByZWZyZXNoUnVsZXJzKCk7XG4gIH1cbiAgZnVuY3Rpb24gcmVmcmVzaFJ1bGVycygpIHtcbiAgICB2YXIgcnVsZXJzID0gQ1BPLmVkaXRvci5jbS5nZXRPcHRpb24oXCJydWxlcnNcIik7XG4gICAgdmFyIGxvbmdMaW5lcyA9IENQTy5lZGl0b3IuY20uZ2V0T3B0aW9uKFwibG9uZ0xpbmVzXCIpO1xuICAgIHZhciBtaW5MZW5ndGg7XG4gICAgaWYgKGxvbmdMaW5lcy5zaXplID09PSAwKSB7XG4gICAgICBtaW5MZW5ndGggPSAwOyAvLyBpZiB0aGVyZSBhcmUgbm8gbG9uZyBsaW5lcywgdGhlbiB3ZSBkb24ndCBjYXJlIGFib3V0IHNob3dpbmcgYW55IHJ1bGVyc1xuICAgIH0gZWxzZSB7XG4gICAgICBtaW5MZW5ndGggPSBOdW1iZXIuTUFYX1ZBTFVFO1xuICAgICAgbG9uZ0xpbmVzLmZvckVhY2goZnVuY3Rpb24obGluZU5vLCBsaW5lSGFuZGxlKSB7XG4gICAgICAgIGlmIChsaW5lSGFuZGxlLnRleHQubGVuZ3RoIDwgbWluTGVuZ3RoKSB7IG1pbkxlbmd0aCA9IGxpbmVIYW5kbGUudGV4dC5sZW5ndGg7IH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJ1bGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHJ1bGVyc1tpXS5jb2x1bW4gPj0gbWluTGVuZ3RoKSB7XG4gICAgICAgIHJ1bGVyc1tpXS5jbGFzc05hbWUgPSBcImhpZGRlblwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcnVsZXJzW2ldLmNsYXNzTmFtZSA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gZ290dGEgc2V0IHRoZSBvcHRpb24gdHdpY2UsIG9yIGVsc2UgQ00gc2hvcnQtY2lyY3VpdHMgYW5kIGlnbm9yZXMgaXRcbiAgICBDUE8uZWRpdG9yLmNtLnNldE9wdGlvbihcInJ1bGVyc1wiLCB1bmRlZmluZWQpO1xuICAgIENQTy5lZGl0b3IuY20uc2V0T3B0aW9uKFwicnVsZXJzXCIsIHJ1bGVycyk7XG4gIH1cbiAgQ1BPLmVkaXRvci5jbS5vbignY2hhbmdlcycsIGZ1bmN0aW9uKGluc3RhbmNlLCBjaGFuZ2VPYmpzKSB7XG4gICAgdmFyIG1pbkxpbmUgPSBpbnN0YW5jZS5sYXN0TGluZSgpLCBtYXhMaW5lID0gMDtcbiAgICB2YXIgcnVsZXJzTWluQ29sID0gaW5zdGFuY2UuZ2V0T3B0aW9uKFwicnVsZXJzTWluQ29sXCIpO1xuICAgIHZhciBsb25nTGluZXMgPSBpbnN0YW5jZS5nZXRPcHRpb24oXCJsb25nTGluZXNcIik7XG4gICAgY2hhbmdlT2Jqcy5mb3JFYWNoKGZ1bmN0aW9uKGNoYW5nZSkge1xuICAgICAgaWYgKG1pbkxpbmUgPiBjaGFuZ2UuZnJvbS5saW5lKSB7IG1pbkxpbmUgPSBjaGFuZ2UuZnJvbS5saW5lOyB9XG4gICAgICBpZiAobWF4TGluZSA8IGNoYW5nZS5mcm9tLmxpbmUgKyBjaGFuZ2UudGV4dC5sZW5ndGgpIHsgbWF4TGluZSA9IGNoYW5nZS5mcm9tLmxpbmUgKyBjaGFuZ2UudGV4dC5sZW5ndGg7IH1cbiAgICB9KTtcbiAgICB2YXIgY2hhbmdlZCA9IGZhbHNlO1xuICAgIGluc3RhbmNlLmVhY2hMaW5lKG1pbkxpbmUsIG1heExpbmUsIGZ1bmN0aW9uKGxpbmVIYW5kbGUpIHtcbiAgICAgIGlmIChsaW5lSGFuZGxlLnRleHQubGVuZ3RoID4gcnVsZXJzTWluQ29sKSB7XG4gICAgICAgIGlmICghbG9uZ0xpbmVzLmhhcyhsaW5lSGFuZGxlKSkge1xuICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgIGxvbmdMaW5lcy5zZXQobGluZUhhbmRsZSwgbGluZUhhbmRsZS5saW5lTm8oKSk7XG4gICAgICAgICAgbGluZUhhbmRsZS5ydWxlckxpc3RlbmVycyA9IG5ldyBNYXAoW1xuICAgICAgICAgICAgW1wiY2hhbmdlXCIsIHJlbW92ZVNob3J0ZW5lZExpbmVdLFxuICAgICAgICAgICAgW1wiZGVsZXRlXCIsIGZ1bmN0aW9uKCkgeyAvLyBuZWVkZWQgYmVjYXVzZSB0aGUgZGVsZXRlIGhhbmRsZXIgZ2V0cyBubyBhcmd1bWVudHMgYXQgYWxsXG4gICAgICAgICAgICAgIGRlbGV0ZUxpbmUobGluZUhhbmRsZSk7XG4gICAgICAgICAgICB9XVxuICAgICAgICAgIF0pO1xuICAgICAgICAgIGxpbmVIYW5kbGUucnVsZXJMaXN0ZW5lcnMuZm9yRWFjaCgoZiwgZXZ0KSA9PiBsaW5lSGFuZGxlLm9uKGV2dCwgZikpO1xuICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQWRkZWQgXCIsIGxpbmVIYW5kbGUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAobG9uZ0xpbmVzLmhhcyhsaW5lSGFuZGxlKSkge1xuICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgIGxvbmdMaW5lcy5kZWxldGUobGluZUhhbmRsZSk7XG4gICAgICAgICAgLy8gY29uc29sZS5sb2coXCJSZW1vdmVkIFwiLCBsaW5lSGFuZGxlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIGlmIChjaGFuZ2VkKSB7XG4gICAgICByZWZyZXNoUnVsZXJzKCk7XG4gICAgfVxuICB9KTtcblxuICBwcm9ncmFtTG9hZGVkLnRoZW4oZnVuY3Rpb24oYykge1xuICAgIENQTy5kb2N1bWVudHMuc2V0KFwiZGVmaW5pdGlvbnM6Ly9cIiwgQ1BPLmVkaXRvci5jbS5nZXREb2MoKSk7XG4gICAgaWYoYyA9PT0gXCJcIikge1xuICAgICAgYyA9IENPTlRFWFRfRk9SX05FV19GSUxFUztcbiAgICB9XG5cbiAgICBpZiAoYy5zdGFydHNXaXRoKFwiPHNjcmlwdHNvbmx5XCIpKSB7XG4gICAgICAvLyB0aGlzIGlzIGJsb2NrcyBmaWxlLiBPcGVuIGl0IHdpdGggL2Jsb2Nrc1xuICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5yZXBsYWNlKCdlZGl0b3InLCAnYmxvY2tzJyk7XG4gICAgfVxuXG4gICAgaWYoIXBhcmFtc1tcImdldFwiXVtcImNvbnRyb2xsZWRcIl0pIHtcbiAgICAgIC8vIE5PVEUoam9lKTogQ2xlYXJpbmcgaGlzdG9yeSB0byBhZGRyZXNzIGh0dHBzOi8vZ2l0aHViLmNvbS9icm93bnBsdC9weXJldC1sYW5nL2lzc3Vlcy8zODYsXG4gICAgICAvLyBpbiB3aGljaCB1bmRvIGNhbiByZXZlcnQgdGhlIHByb2dyYW0gYmFjayB0byBlbXB0eVxuICAgICAgQ1BPLmVkaXRvci5jbS5zZXRWYWx1ZShjKTtcbiAgICAgIENQTy5lZGl0b3IuY20uY2xlYXJIaXN0b3J5KCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgY29uc3QgaGlkZVdoZW5Db250cm9sbGVkID0gW1xuICAgICAgICBcIiNsb2dnaW5nXCIsXG4gICAgICAgIFwiI2xvZ291dFwiXG4gICAgICBdO1xuICAgICAgY29uc3QgcmVtb3ZlV2hlbkNvbnRyb2xsZWQgPSBbXG4gICAgICAgIFwiI2Nvbm5lY3RCdXR0b25saVwiLFxuICAgICAgXTtcbiAgICAgIGhpZGVXaGVuQ29udHJvbGxlZC5mb3JFYWNoKHMgPT4gJChzKS5oaWRlKCkpO1xuICAgICAgcmVtb3ZlV2hlbkNvbnRyb2xsZWQuZm9yRWFjaChzID0+ICQocykucmVtb3ZlKCkpO1xuICAgIH1cblxuICB9KTtcblxuICBwcm9ncmFtTG9hZGVkLmZhaWwoZnVuY3Rpb24oZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiUHJvZ3JhbSBjb250ZW50cyBkaWQgbm90IGxvYWQ6IFwiLCBlcnJvcik7XG4gICAgQ1BPLmRvY3VtZW50cy5zZXQoXCJkZWZpbml0aW9uczovL1wiLCBDUE8uZWRpdG9yLmNtLmdldERvYygpKTtcbiAgfSk7XG5cbiAgY29uc29sZS5sb2coXCJBYm91dCB0byBsb2FkIFB5cmV0OiBcIiwgb3JpZ2luYWxQYWdlTG9hZCwgRGF0ZS5ub3coKSk7XG5cbiAgdmFyIHB5cmV0TG9hZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICBjb25zb2xlLmxvZyh3aW5kb3cuUFlSRVQpO1xuICBweXJldExvYWQuc3JjID0gd2luZG93LlBZUkVUO1xuICBweXJldExvYWQudHlwZSA9IFwidGV4dC9qYXZhc2NyaXB0XCI7XG4gIHB5cmV0TG9hZC5zZXRBdHRyaWJ1dGUoXCJjcm9zc29yaWdpblwiLCBcImFub255bW91c1wiKTtcbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChweXJldExvYWQpO1xuXG4gIHZhciBweXJldExvYWQyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG5cbiAgZnVuY3Rpb24gbG9nRmFpbHVyZUFuZE1hbnVhbEZldGNoKHVybCwgZSkge1xuXG4gICAgLy8gTk9URShqb2UpOiBUaGUgZXJyb3IgcmVwb3J0ZWQgYnkgdGhlIFwiZXJyb3JcIiBldmVudCBoYXMgZXNzZW50aWFsbHkgbm9cbiAgICAvLyBpbmZvcm1hdGlvbiBvbiBpdDsgaXQncyBqdXN0IGEgbm90aWZpY2F0aW9uIHRoYXQgX3NvbWV0aGluZ18gd2VudCB3cm9uZy5cbiAgICAvLyBTbywgd2UgbG9nIHRoYXQgc29tZXRoaW5nIGhhcHBlbmVkLCB0aGVuIGltbWVkaWF0ZWx5IGRvIGFuIEFKQVggcmVxdWVzdFxuICAgIC8vIGNhbGwgZm9yIHRoZSBzYW1lIFVSTCwgdG8gc2VlIGlmIHdlIGNhbiBnZXQgbW9yZSBpbmZvcm1hdGlvbi4gVGhpc1xuICAgIC8vIGRvZXNuJ3QgcGVyZmVjdGx5IHRlbGwgdXMgYWJvdXQgdGhlIG9yaWdpbmFsIGZhaWx1cmUsIGJ1dCBpdCdzXG4gICAgLy8gc29tZXRoaW5nLlxuXG4gICAgLy8gSW4gYWRkaXRpb24sIGlmIHNvbWVvbmUgaXMgc2VlaW5nIHRoZSBQeXJldCBmYWlsZWQgdG8gbG9hZCBlcnJvciwgYnV0IHdlXG4gICAgLy8gZG9uJ3QgZ2V0IHRoZXNlIGxvZ2dpbmcgZXZlbnRzLCB3ZSBoYXZlIGEgc3Ryb25nIGhpbnQgdGhhdCBzb21ldGhpbmcgaXNcbiAgICAvLyB1cCB3aXRoIHRoZWlyIG5ldHdvcmsuXG4gICAgbG9nZ2VyLmxvZygncHlyZXQtbG9hZC1mYWlsdXJlJyxcbiAgICAgIHtcbiAgICAgICAgZXZlbnQgOiAnaW5pdGlhbC1mYWlsdXJlJyxcbiAgICAgICAgdXJsIDogdXJsLFxuXG4gICAgICAgIC8vIFRoZSB0aW1lc3RhbXAgYXBwZWFycyB0byBjb3VudCBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgcGFnZSBsb2FkLFxuICAgICAgICAvLyB3aGljaCBtYXkgYXBwcm94aW1hdGUgZG93bmxvYWQgdGltZSBpZiwgc2F5LCByZXF1ZXN0cyBhcmUgdGltaW5nIG91dFxuICAgICAgICAvLyBvciBnZXR0aW5nIGN1dCBvZmYuXG5cbiAgICAgICAgdGltZVN0YW1wIDogZS50aW1lU3RhbXBcbiAgICAgIH0pO1xuXG4gICAgdmFyIG1hbnVhbEZldGNoID0gJC5hamF4KHVybCk7XG4gICAgbWFudWFsRmV0Y2gudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgIC8vIEhlcmUsIHdlIGxvZyB0aGUgZmlyc3QgMTAwIGNoYXJhY3RlcnMgb2YgdGhlIHJlc3BvbnNlIHRvIG1ha2Ugc3VyZVxuICAgICAgLy8gdGhleSByZXNlbWJsZSB0aGUgUHlyZXQgYmxvYlxuICAgICAgbG9nZ2VyLmxvZygncHlyZXQtbG9hZC1mYWlsdXJlJywge1xuICAgICAgICBldmVudCA6ICdzdWNjZXNzLXdpdGgtYWpheCcsXG4gICAgICAgIGNvbnRlbnRzUHJlZml4IDogcmVzLnNsaWNlKDAsIDEwMClcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIG1hbnVhbEZldGNoLmZhaWwoZnVuY3Rpb24ocmVzKSB7XG4gICAgICBsb2dnZXIubG9nKCdweXJldC1sb2FkLWZhaWx1cmUnLCB7XG4gICAgICAgIGV2ZW50IDogJ2ZhaWx1cmUtd2l0aC1hamF4JyxcbiAgICAgICAgc3RhdHVzOiByZXMuc3RhdHVzLFxuICAgICAgICBzdGF0dXNUZXh0OiByZXMuc3RhdHVzVGV4dCxcbiAgICAgICAgLy8gU2luY2UgcmVzcG9uc2VUZXh0IGNvdWxkIGJlIGEgbG9uZyBlcnJvciBwYWdlLCBhbmQgd2UgZG9uJ3Qgd2FudCB0b1xuICAgICAgICAvLyBsb2cgaHVnZSBwYWdlcywgd2Ugc2xpY2UgaXQgdG8gMTAwIGNoYXJhY3RlcnMsIHdoaWNoIGlzIGVub3VnaCB0b1xuICAgICAgICAvLyB0ZWxsIHVzIHdoYXQncyBnb2luZyBvbiAoZS5nLiBBV1MgZmFpbHVyZSwgbmV0d29yayBvdXRhZ2UpLlxuICAgICAgICByZXNwb25zZVRleHQ6IHJlcy5yZXNwb25zZVRleHQuc2xpY2UoMCwgMTAwKVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAkKHB5cmV0TG9hZCkub24oXCJlcnJvclwiLCBmdW5jdGlvbihlKSB7XG4gICAgbG9nRmFpbHVyZUFuZE1hbnVhbEZldGNoKHdpbmRvdy5QWVJFVCwgZSk7XG4gICAgcHlyZXRMb2FkMi5zcmMgPSBwcm9jZXNzLmVudi5QWVJFVF9CQUNLVVA7XG4gICAgcHlyZXRMb2FkMi50eXBlID0gXCJ0ZXh0L2phdmFzY3JpcHRcIjtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHB5cmV0TG9hZDIpO1xuICB9KTtcblxuICAkKHB5cmV0TG9hZDIpLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24oZSkge1xuICAgICQoXCIjbG9hZGVyXCIpLmhpZGUoKTtcbiAgICAkKFwiI3J1blBhcnRcIikuaGlkZSgpO1xuICAgICQoXCIjYnJlYWtCdXR0b25cIikuaGlkZSgpO1xuICAgIHdpbmRvdy5zdGlja0Vycm9yKFwiUHlyZXQgZmFpbGVkIHRvIGxvYWQ7IGNoZWNrIHlvdXIgY29ubmVjdGlvbiBvciB0cnkgcmVmcmVzaGluZyB0aGUgcGFnZS4gIElmIHRoaXMgaGFwcGVucyByZXBlYXRlZGx5LCBwbGVhc2UgcmVwb3J0IGl0IGFzIGEgYnVnLlwiKTtcbiAgICBsb2dGYWlsdXJlQW5kTWFudWFsRmV0Y2gocHJvY2Vzcy5lbnYuUFlSRVRfQkFDS1VQLCBlKTtcblxuICB9KTtcblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImZvY3VzXCIsIChlKSA9PiB7XG4gICAgaWYoYWN0aXZlRWRpdG9yKSB7IGFjdGl2ZUVkaXRvci5mb2N1cygpOyB9XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIG1ha2VFdmVudCgpIHtcbiAgICBjb25zdCBoYW5kbGVycyA9IFtdO1xuICAgIGZ1bmN0aW9uIG9uKGhhbmRsZXIpIHtcbiAgICAgIGhhbmRsZXJzLnB1c2goaGFuZGxlcik7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHRyaWdnZXIodikge1xuICAgICAgaGFuZGxlcnMuZm9yRWFjaChoID0+IGgodikpO1xuICAgIH1cbiAgICByZXR1cm4gW29uLCB0cmlnZ2VyXTtcbiAgfVxuICBsZXQgWyBvblJ1biwgdHJpZ2dlck9uUnVuIF0gPSBtYWtlRXZlbnQoKTtcbiAgbGV0IFsgb25JbnRlcmFjdGlvbiwgdHJpZ2dlck9uSW50ZXJhY3Rpb24gXSA9IG1ha2VFdmVudCgpO1xuICBsZXQgWyBvbkxvYWQsIHRyaWdnZXJPbkxvYWQgXSA9IG1ha2VFdmVudCgpO1xuXG4gIHByb2dyYW1Mb2FkZWQuZmluKGZ1bmN0aW9uKCkge1xuICAgIENQTy5lZGl0b3IuZm9jdXMoKTtcbiAgICBDUE8uZWRpdG9yLmNtLnNldE9wdGlvbihcInJlYWRPbmx5XCIsIGZhbHNlKTtcbiAgfSk7XG5cbiAgQ1BPLmF1dG9TYXZlID0gYXV0b1NhdmU7XG4gIENQTy5zYXZlID0gc2F2ZTtcbiAgQ1BPLnVwZGF0ZU5hbWUgPSB1cGRhdGVOYW1lO1xuICBDUE8uc2hvd1NoYXJlQ29udGFpbmVyID0gc2hvd1NoYXJlQ29udGFpbmVyO1xuICBDUE8ubG9hZFByb2dyYW0gPSBsb2FkUHJvZ3JhbTtcbiAgQ1BPLnN0b3JhZ2VBUEkgPSBzdG9yYWdlQVBJO1xuICBDUE8uY3ljbGVGb2N1cyA9IGN5Y2xlRm9jdXM7XG4gIENQTy5zYXkgPSBzYXk7XG4gIENQTy5zYXlBbmRGb3JnZXQgPSBzYXlBbmRGb3JnZXQ7XG4gIENQTy5ldmVudHMgPSB7XG4gICAgb25SdW4sXG4gICAgdHJpZ2dlck9uUnVuLFxuICAgIG9uSW50ZXJhY3Rpb24sXG4gICAgdHJpZ2dlck9uSW50ZXJhY3Rpb24sXG4gICAgb25Mb2FkLFxuICAgIHRyaWdnZXJPbkxvYWRcbiAgfTtcblxuICAvLyBXZSBuZXZlciB3YW50IGludGVyYWN0aW9ucyB0byBiZSBoaWRkZW4gKndoZW4gcnVubmluZyBjb2RlKi5cbiAgLy8gU28gaGlkZUludGVyYWN0aW9ucyBzaG91bGQgZ28gYXdheSBhcyBzb29uIGFzIHJ1biBpcyBjbGlja2VkXG4gIENQTy5ldmVudHMub25SdW4oKCkgPT4geyBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoXCJoaWRlSW50ZXJhY3Rpb25zXCIpOyB9KTtcblxuICBsZXQgaW5pdGlhbFN0YXRlID0gcGFyYW1zW1wiZ2V0XCJdW1wiaW5pdGlhbFN0YXRlXCJdO1xuXG4gIHdpbmRvdy5QWVJFVF9JU19FTUJFRERFRCA9IGZhbHNlO1xuICB3aW5kb3cuUFlSRVRfSU5fVlNDT0RFID0gZmFsc2U7XG4gIGlmICh0eXBlb2YgYWNxdWlyZVZzQ29kZUFwaSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgd2luZG93Lk1FU1NBR0VTID0gbWFrZUV2ZW50cyh7XG4gICAgICBDUE86IENQTyxcbiAgICAgIHNlbmRQb3J0OiBhY3F1aXJlVnNDb2RlQXBpKCksXG4gICAgICByZWNlaXZlUG9ydDogd2luZG93LFxuICAgICAgaW5pdGlhbFN0YXRlXG4gICAgfSk7XG4gICAgd2luZG93LlBZUkVUX0lTX0VNQkVEREVEID0gdHJ1ZTtcbiAgICB3aW5kb3cuUFlSRVRfSU5fVlNDT0RFID0gdHJ1ZTtcbiAgfVxuICBlbHNlIGlmKCh3aW5kb3cucGFyZW50ICYmICh3aW5kb3cucGFyZW50ICE9PSB3aW5kb3cpKSkge1xuICAgIHdpbmRvdy5NRVNTQUdFUyA9IG1ha2VFdmVudHMoeyBDUE86IENQTywgc2VuZFBvcnQ6IHdpbmRvdy5wYXJlbnQsIHJlY2VpdmVQb3J0OiB3aW5kb3csIGluaXRpYWxTdGF0ZSB9KTtcbiAgICB3aW5kb3cuUFlSRVRfSVNfRU1CRURERUQgPSB0cnVlO1xuICB9XG59KTtcbiJdLCJuYW1lcyI6WyJkZWZpbmUiLCJRIiwiYXV0b0hpZ2hsaWdodEJveCIsInRleHQiLCJ0ZXh0Qm94IiwiJCIsImFkZENsYXNzIiwiYXR0ciIsIm9uIiwic2VsZWN0IiwidmFsIiwicHJvbXB0UXVldWUiLCJzdHlsZXMiLCJ3aW5kb3ciLCJtb2RhbHMiLCJQcm9tcHQiLCJvcHRpb25zIiwicHVzaCIsImluZGV4T2YiLCJzdHlsZSIsImxlbmd0aCIsIkVycm9yIiwibW9kYWwiLCJlbHRzIiwicGFyc2VIVE1MIiwidGl0bGUiLCJtb2RhbENvbnRlbnQiLCJjbG9zZUJ1dHRvbiIsInN1Ym1pdEJ1dHRvbiIsInN1Ym1pdFRleHQiLCJjYW5jZWxUZXh0IiwidG9nZ2xlQ2xhc3MiLCJuYXJyb3ciLCJpc0NvbXBpbGVkIiwiZGVmZXJyZWQiLCJkZWZlciIsInByb21pc2UiLCJwcm90b3R5cGUiLCJzaG93IiwiY2FsbGJhY2siLCJoaWRlU3VibWl0IiwiaGlkZSIsImNsaWNrIiwib25DbG9zZSIsImJpbmQiLCJrZXlwcmVzcyIsImUiLCJ3aGljaCIsIm9uU3VibWl0IiwiZG9jQ2xpY2siLCJ0YXJnZXQiLCJpcyIsImRvY3VtZW50Iiwib2ZmIiwiZG9jS2V5ZG93biIsImtleSIsImtleWRvd24iLCJwb3B1bGF0ZU1vZGFsIiwiY3NzIiwiZm9jdXMiLCJ0aGVuIiwiY2xlYXJNb2RhbCIsImVtcHR5IiwiY3JlYXRlUmFkaW9FbHQiLCJvcHRpb24iLCJpZHgiLCJlbHQiLCJpZCIsInRvU3RyaW5nIiwibGFiZWwiLCJ2YWx1ZSIsIm1lc3NhZ2UiLCJlbHRDb250YWluZXIiLCJhcHBlbmQiLCJsYWJlbENvbnRhaW5lciIsImNvbnRhaW5lciIsImV4YW1wbGUiLCJjbSIsIkNvZGVNaXJyb3IiLCJtb2RlIiwibGluZU51bWJlcnMiLCJyZWFkT25seSIsInNldFRpbWVvdXQiLCJyZWZyZXNoIiwiZXhhbXBsZUNvbnRhaW5lciIsImNyZWF0ZVRpbGVFbHQiLCJkZXRhaWxzIiwiZXZ0IiwiY3JlYXRlVGV4dEVsdCIsImlucHV0IiwiZGVmYXVsdFZhbHVlIiwiZHJhd0VsZW1lbnQiLCJjcmVhdGVDb3B5VGV4dEVsdCIsImJveCIsImNyZWF0ZUNvbmZpcm1FbHQiLCJ0aGF0IiwiY3JlYXRlRWx0IiwiaSIsIm9wdGlvbkVsdHMiLCJtYXAiLCJyZXNvbHZlIiwicmV0dmFsIiwib3JpZ2luYWxQYWdlTG9hZCIsIkRhdGUiLCJub3ciLCJjb25zb2xlIiwibG9nIiwiU0hBUkVVUkxfUFJPWFlfSE9TVFMiLCJTZXQiLCJTSEFSRVVSTF9ESVJFQ1RfVElNRU9VVF9NUyIsIl9vcmlnRmV0Y2giLCJmZXRjaCIsIl9zaGFyZXVybFNob3VsZFByb3h5IiwiTWFwIiwiX3NoYXJldXJsU2hvdWxkUHJveHlJbmZsaWdodCIsIl9zaGFyZXVybFByb3h5VXJsIiwiZmV0Y2hJbnB1dCIsImVuY29kZVVSSUNvbXBvbmVudCIsIl9zaGFyZXVybElucHV0VG9VcmwiLCJSZXF1ZXN0IiwidXJsIiwiU3RyaW5nIiwiX3NoYXJldXJsVmVyaWZ5RGlyZWN0IiwiciIsIm9rIiwiY3QiLCJoZWFkZXJzIiwiZ2V0IiwidG9Mb3dlckNhc2UiLCJzdGFydHNXaXRoIiwiX3NoYXJldXJsRmV0Y2giLCJzaG91bGRQcm94eSIsImZldGNoSW5pdCIsIm1heWJlUHJveHlJbnB1dCIsIl9zaGFyZXVybFJhY2UiLCJwcm94eUN0cmwiLCJBYm9ydENvbnRyb2xsZXIiLCJwcm94eVAiLCJPYmplY3QiLCJhc3NpZ24iLCJzaWduYWwiLCJkaXJlY3RQIiwic2hvdWxkUHJveHlQcm9taXNlIiwiUHJvbWlzZSIsInJhY2UiLCJkaXJlY3RGaW5pc2hlZFN1Y2Nlc3NmdWxseUFuZEZpcnN0UCIsImRpcmVjdEZpcnN0IiwiYWJvcnQiLCJyZXNwb25zZVByb21pc2UiLCJhbnkiLCJhZ2dFcnIiLCJyZWplY3QiLCJlcnJvcnMiLCJob3N0IiwiVVJMIiwibG9jYXRpb24iLCJocmVmIiwiaG9zdG5hbWUiLCJfIiwiaGFzIiwiaW5mbGlnaHQiLCJ1bmRlZmluZWQiLCJzcCIsIl9zaGFyZXVybFJhY2UyIiwic2V0IiwiaXNFbWJlZGRlZCIsInBhcmVudCIsInNoYXJlQVBJIiwibWFrZVNoYXJlQVBJIiwicHJvY2VzcyIsImVudiIsIkNVUlJFTlRfUFlSRVRfUkVMRUFTRSIsInJlcXVpcmUiLCJtb2RhbFByb21wdCIsIkxPRyIsImN0X2xvZyIsImFwcGx5IiwiYXJndW1lbnRzIiwiY3RfZXJyb3IiLCJlcnJvciIsImluaXRpYWxQYXJhbXMiLCJwYXJzZSIsInBhcmFtcyIsImhpZ2hsaWdodE1vZGUiLCJjbGVhckZsYXNoIiwid2hpdGVUb0JsYWNrTm90aWZpY2F0aW9uIiwic3RpY2tFcnJvciIsIm1vcmUiLCJDUE8iLCJzYXlBbmRGb3JnZXQiLCJlcnIiLCJ0b29sdGlwIiwicHJlcGVuZCIsImZsYXNoRXJyb3IiLCJmYWRlT3V0IiwiZmxhc2hNZXNzYWdlIiwibXNnIiwic3RpY2tNZXNzYWdlIiwic3RpY2tSaWNoTWVzc2FnZSIsImNvbnRlbnQiLCJta1dhcm5pbmdVcHBlciIsIm1rV2FybmluZ0xvd2VyIiwiRG9jdW1lbnRzIiwiZG9jdW1lbnRzIiwibmFtZSIsImRvYyIsImxvZ2dlciIsImlzRGV0YWlsZWQiLCJnZXRWYWx1ZSIsImZvckVhY2giLCJmIiwiVkVSU0lPTl9DSEVDS19JTlRFUlZBTCIsIk1hdGgiLCJyYW5kb20iLCJjaGVja1ZlcnNpb24iLCJyZXNwIiwiSlNPTiIsInZlcnNpb24iLCJzZXRJbnRlcnZhbCIsInNhdmUiLCJhdXRvU2F2ZSIsIkNPTlRFWFRfRk9SX05FV19GSUxFUyIsIkNPTlRFWFRfUFJFRklYIiwibWVyZ2UiLCJvYmoiLCJleHRlbnNpb24iLCJuZXdvYmoiLCJrZXlzIiwiayIsImFuaW1hdGlvbkRpdiIsImNsb3NlQW5pbWF0aW9uSWZPcGVuIiwiZGlhbG9nIiwiYWN0aXZlRWRpdG9yIiwibWFrZUVkaXRvciIsImluaXRpYWwiLCJoYXNPd25Qcm9wZXJ0eSIsInRleHRhcmVhIiwialF1ZXJ5IiwicnVuRnVuIiwiY29kZSIsInJlcGxPcHRpb25zIiwicnVuIiwiQ00iLCJ1c2VMaW5lTnVtYmVycyIsInNpbXBsZUVkaXRvciIsInVzZUZvbGRpbmciLCJndXR0ZXJzIiwicmVpbmRlbnRBbGxMaW5lcyIsImxhc3QiLCJsaW5lQ291bnQiLCJvcGVyYXRpb24iLCJpbmRlbnRMaW5lIiwiQ09ERV9MSU5FX1dJRFRIIiwicnVsZXJzIiwicnVsZXJzTWluQ29sIiwiY29sb3IiLCJjb2x1bW4iLCJsaW5lU3R5bGUiLCJjbGFzc05hbWUiLCJtYWMiLCJrZXlNYXAiLCJtYWNEZWZhdWx0IiwibW9kaWZpZXIiLCJleHRyYUtleXMiLCJfZGVmaW5lUHJvcGVydHkiLCJTaGlmdEVudGVyIiwiU2hpZnRDdHJsRW50ZXIiLCJjb25jYXQiLCJQWVJFVF9JTl9WU0NPREUiLCJjbU9wdGlvbnMiLCJub3JtYWxpemVLZXlNYXAiLCJpbmRlbnRVbml0IiwidGFiU2l6ZSIsInZpZXdwb3J0TWFyZ2luIiwiSW5maW5pdHkiLCJtYXRjaEtleXdvcmRzIiwibWF0Y2hCcmFja2V0cyIsInN0eWxlU2VsZWN0ZWRUZXh0IiwiZm9sZEd1dHRlciIsImxpbmVXcmFwcGluZyIsImxvZ2dpbmciLCJzY3JvbGxQYXN0RW5kIiwiZnJvbVRleHRBcmVhIiwiZmlyc3RMaW5lSXNOYW1lc3BhY2UiLCJmaXJzdGxpbmUiLCJnZXRMaW5lIiwibWF0Y2giLCJuYW1lc3BhY2VtYXJrIiwic2V0Q29udGV4dExpbmUiLCJuZXdDb250ZXh0TGluZSIsImhhc05hbWVzcGFjZSIsImNsZWFyIiwicmVwbGFjZVJhbmdlIiwibGluZSIsImNoIiwiZ3V0dGVyUXVlc3Rpb25XcmFwcGVyIiwiY3JlYXRlRWxlbWVudCIsImd1dHRlclRvb2x0aXAiLCJpbm5lclRleHQiLCJndXR0ZXJRdWVzdGlvbiIsInNyYyIsIkFQUF9CQVNFX1VSTCIsImFwcGVuZENoaWxkIiwic2V0R3V0dGVyTWFya2VyIiwiZ2V0V3JhcHBlckVsZW1lbnQiLCJvbm1vdXNlbGVhdmUiLCJjbGVhckd1dHRlciIsIm9ubW91c2Vtb3ZlIiwibGluZUNoIiwiY29vcmRzQ2hhciIsImxlZnQiLCJjbGllbnRYIiwidG9wIiwiY2xpZW50WSIsIm1hcmtlcnMiLCJmaW5kTWFya3NBdCIsImNoYW5nZSIsImRvZXNOb3RDaGFuZ2VGaXJzdExpbmUiLCJjIiwiZnJvbSIsImN1ck9wIiwiY2hhbmdlT2JqcyIsImV2ZXJ5IiwibWFya1RleHQiLCJhdHRyaWJ1dGVzIiwidXNlbGluZSIsImF0b21pYyIsImluY2x1c2l2ZUxlZnQiLCJpbmNsdXNpdmVSaWdodCIsImRpc3BsYXkiLCJ3cmFwcGVyIiwiZ2V0VG9wVGllck1lbnVpdGVtcyIsImZvY3VzQ2Fyb3VzZWwiLCJSVU5fQ09ERSIsInNldFVzZXJuYW1lIiwiZ3dyYXAiLCJsb2FkIiwiYXBpIiwicGVvcGxlIiwicmVzb3VyY2VOYW1lIiwicGVyc29uRmllbGRzIiwidXNlciIsIm5hbWVzIiwiZGlzcGxheU5hbWUiLCJlbWFpbEFkZHJlc3NlcyIsInN0b3JhZ2VBUEkiLCJjb2xsZWN0aW9uIiwiZmFpbCIsImNyZWF0ZVByb2dyYW1Db2xsZWN0aW9uQVBJIiwiYWN0aXZlRWxlbWVudCIsImJsdXIiLCJ0b0xvYWQiLCJnZXRGaWxlQnlJZCIsImxvYWRQcm9ncmFtIiwicHJvZ3JhbVRvU2F2ZSIsImZjYWxsIiwiaW5pdGlhbFByb2dyYW0iLCJtYWtlVXJsRmlsZSIsInByb2dyYW1Mb2FkIiwiZW5hYmxlRmlsZU9wdGlvbnMiLCJwIiwic2hvd1NoYXJlQ29udGFpbmVyIiwiZ2V0U2hhcmVkRmlsZUJ5SWQiLCJmaWxlIiwiZ2V0T3JpZ2luYWwiLCJyZXNwb25zZSIsIm9yaWdpbmFsIiwicmVzdWx0IiwicmVtb3ZlQ2xhc3MiLCJvcGVuIiwic2V0VGl0bGUiLCJwcm9nTmFtZSIsImZpbGVuYW1lIiwiZG93bmxvYWRFbHQiLCJjb250ZW50cyIsImVkaXRvciIsImRvd25sb2FkQmxvYiIsImNyZWF0ZU9iamVjdFVSTCIsIkJsb2IiLCJ0eXBlIiwiZG93bmxvYWQiLCJzaG93TW9kYWwiLCJjdXJyZW50Q29udGV4dCIsImVsZW1lbnQiLCJncmVldGluZyIsInNoYXJlZCIsImN1cnJlbnRDb250ZXh0RWx0IiwiZXNzZW50aWFscyIsImxpc3QiLCJ1c2VDb250ZXh0IiwiaW5wdXRXcmFwcGVyIiwiZW50cnkiLCJuYW1lc3BhY2VSZXN1bHQiLCJ0cmltIiwiZmlyc3RMaW5lIiwiY29udGV4dExlbiIsInNsaWNlIiwiVFJVTkNBVEVfTEVOR1RIIiwidHJ1bmNhdGVOYW1lIiwidXBkYXRlTmFtZSIsImdldE5hbWUiLCJwcm9nIiwiZ2V0Q29udGVudHMiLCJzYXkiLCJmb3JnZXQiLCJhbm5vdW5jZW1lbnRzIiwiZ2V0RWxlbWVudEJ5SWQiLCJsaSIsImNyZWF0ZVRleHROb2RlIiwiaW5zZXJ0QmVmb3JlIiwiZmlyc3RDaGlsZCIsInJlbW92ZUNoaWxkIiwiY3ljbGVBZHZhbmNlIiwiY3VyckluZGV4IiwibWF4SW5kZXgiLCJyZXZlcnNlUCIsIm5leHRJbmRleCIsInBvcHVsYXRlRm9jdXNDYXJvdXNlbCIsImZjIiwiZG9jbWFpbiIsInRvb2xiYXIiLCJkb2NyZXBsTWFpbiIsImdldEVsZW1lbnRzQnlDbGFzc05hbWUiLCJkb2NyZXBsTWFpbjAiLCJkb2NyZXBsIiwiZG9jcmVwbGNvZGUiLCJjeWNsZUZvY3VzIiwiZkNhcm91c2VsIiwiY3VycmVudEZvY3VzZWRFbHQiLCJmaW5kIiwibm9kZSIsImNvbnRhaW5zIiwiY3VycmVudEZvY3VzSW5kZXgiLCJuZXh0Rm9jdXNJbmRleCIsImZvY3VzRWx0IiwiZm9jdXNFbHQwIiwiY2xhc3NMaXN0IiwidGV4dGFyZWFzIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJyZW1vdmVBdHRyaWJ1dGUiLCJwcm9ncmFtTG9hZGVkIiwibWFrZVNoYXJlTGluayIsIm5hbWVPclVudGl0bGVkIiwibWVudUl0ZW1EaXNhYmxlZCIsImhhc0NsYXNzIiwibmV3RXZlbnQiLCJzYXZlRXZlbnQiLCJuZXdGaWxlbmFtZSIsInVzZU5hbWUiLCJjcmVhdGUiLCJzYXZlZFByb2dyYW0iLCJjcmVhdGVGaWxlIiwiaGlzdG9yeSIsInB1c2hTdGF0ZSIsImdldFVuaXF1ZUlkIiwic2F2ZUFzIiwic2F2ZUFzUHJvbXB0IiwibmV3TmFtZSIsInJlbmFtZSIsInJlbmFtZVByb21wdCIsImZvY3VzYWJsZUVsdHMiLCJ0aGVUb29sYmFyIiwidG9wVGllck1lbnVpdGVtcyIsInRvQXJyYXkiLCJmaWx0ZXIiLCJnZXRBdHRyaWJ1dGUiLCJudW1Ub3BUaWVyTWVudWl0ZW1zIiwiaXRoVG9wVGllck1lbnVpdGVtIiwiaUNoaWxkIiwiY2hpbGRyZW4iLCJmaXJzdCIsInVwZGF0ZUVkaXRvckhlaWdodCIsInRvb2xiYXJIZWlnaHQiLCJvZmZzZXRIZWlnaHQiLCJwYWRkaW5nVG9wIiwiZG9jTWFpbiIsImRvY1JlcGxNYWluIiwiaW5zZXJ0QXJpYVBvcyIsInN1Ym1lbnUiLCJhcnIiLCJsZW4iLCJzZXRBdHRyaWJ1dGUiLCJhZGRFdmVudExpc3RlbmVyIiwiaGlkZUFsbFRvcE1lbnVpdGVtcyIsInN0b3BQcm9wYWdhdGlvbiIsImtjIiwia2V5Q29kZSIsImNsaWNrVG9wTWVudWl0ZW0iLCJ0aGlzRWx0IiwidG9wVGllclVsIiwiY2xvc2VzdCIsImhhc0F0dHJpYnV0ZSIsInRoaXNUb3BNZW51aXRlbSIsInQxIiwic3VibWVudU9wZW4iLCJleHBhbmRhYmxlRWx0cyIsIm5vbmV4cGFuZGFibGVFbHRzIiwic3dpdGNoVG9wTWVudWl0ZW0iLCJkZXN0VG9wTWVudWl0ZW0iLCJkZXN0RWx0IiwiZWx0SWQiLCJzaG93aW5nSGVscEtleXMiLCJzaG93SGVscEtleXMiLCJmYWRlSW4iLCJyZWNpdGVIZWxwIiwid2l0aGluU2Vjb25kVGllclVsIiwic2Vjb25kVGllclVsIiwicG9zc0VsdHMiLCJzcmNUb3BNZW51aXRlbSIsInR0bWlOIiwiaiIsIm5lYXJTaWJzIiwibXlJZCIsInRoaXNFbmNvdW50ZXJlZCIsImFkZCIsImZhclNpYnMiLCJwcmV2QWxsIiwic3VibWVudURpdnMiLCJuZXh0QWxsIiwicHJldmVudERlZmF1bHQiLCJzaGlmdEtleSIsImN0cmxLZXkiLCJjb2RlQ29udGFpbmVyIiwiaXNDb250cm9sbGVkIiwiaGFzV2Fybk9uRXhpdCIsInNraXBXYXJuaW5nIiwicnVuQnV0dG9uIiwiaW5pdGlhbEdhcyIsInNldE9wdGlvbiIsInJlbW92ZVNob3J0ZW5lZExpbmUiLCJsaW5lSGFuZGxlIiwiZ2V0T3B0aW9uIiwibG9uZ0xpbmVzIiwicnVsZXJMaXN0ZW5lcnMiLCJyZWZyZXNoUnVsZXJzIiwiZGVsZXRlTGluZSIsIm1pbkxlbmd0aCIsInNpemUiLCJOdW1iZXIiLCJNQVhfVkFMVUUiLCJsaW5lTm8iLCJpbnN0YW5jZSIsIm1pbkxpbmUiLCJsYXN0TGluZSIsIm1heExpbmUiLCJjaGFuZ2VkIiwiZWFjaExpbmUiLCJnZXREb2MiLCJyZXBsYWNlIiwic2V0VmFsdWUiLCJjbGVhckhpc3RvcnkiLCJoaWRlV2hlbkNvbnRyb2xsZWQiLCJyZW1vdmVXaGVuQ29udHJvbGxlZCIsInMiLCJyZW1vdmUiLCJweXJldExvYWQiLCJQWVJFVCIsImJvZHkiLCJweXJldExvYWQyIiwibG9nRmFpbHVyZUFuZE1hbnVhbEZldGNoIiwiZXZlbnQiLCJ0aW1lU3RhbXAiLCJtYW51YWxGZXRjaCIsImFqYXgiLCJyZXMiLCJjb250ZW50c1ByZWZpeCIsInN0YXR1cyIsInN0YXR1c1RleHQiLCJyZXNwb25zZVRleHQiLCJQWVJFVF9CQUNLVVAiLCJtYWtlRXZlbnQiLCJoYW5kbGVycyIsImhhbmRsZXIiLCJ0cmlnZ2VyIiwidiIsImgiLCJfbWFrZUV2ZW50IiwiX21ha2VFdmVudDIiLCJfc2xpY2VkVG9BcnJheSIsIm9uUnVuIiwidHJpZ2dlck9uUnVuIiwiX21ha2VFdmVudDMiLCJfbWFrZUV2ZW50NCIsIm9uSW50ZXJhY3Rpb24iLCJ0cmlnZ2VyT25JbnRlcmFjdGlvbiIsIl9tYWtlRXZlbnQ1IiwiX21ha2VFdmVudDYiLCJvbkxvYWQiLCJ0cmlnZ2VyT25Mb2FkIiwiZmluIiwiZXZlbnRzIiwiaW5pdGlhbFN0YXRlIiwiUFlSRVRfSVNfRU1CRURERUQiLCJhY3F1aXJlVnNDb2RlQXBpIiwiTUVTU0FHRVMiLCJtYWtlRXZlbnRzIiwic2VuZFBvcnQiLCJyZWNlaXZlUG9ydCJdLCJzb3VyY2VSb290IjoiIn0=