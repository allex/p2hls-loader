/**
 * @hitv/hls-loader v0.0.3 - P2P loader for hls.js integration.
 *
 * @author Allex Wang <allex.wxn@gmail.com>
 * Released under the MIT license.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.P2Hls = {}));
}(this, function (exports) { 'use strict';

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.

  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** */

  /* global Reflect, Promise */
  var extendStatics = function (d, b) {
    extendStatics = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (d, b) {
      d.__proto__ = b;
    } || function (d, b) {
      for (var p in b) {
        if (b.hasOwnProperty(p)) d[p] = b[p];
      }
    };

    return extendStatics(d, b);
  };

  function __extends(d, b) {
    extendStatics(d, b);

    function __() {
      this.constructor = d;
    }

    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }
  var __assign = function () {
    __assign = Object.assign || function __assign(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];

        for (var p in s) {
          if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
      }

      return t;
    };

    return __assign.apply(this, arguments);
  };

  var domain; // This constructor is used to store event handlers. Instantiating this is
  // faster than explicitly calling `Object.create(null)` to get a "clean" empty
  // object (tested with v8 v4.9).

  function EventHandlers() {}

  EventHandlers.prototype = Object.create(null);

  function EventEmitter() {
    EventEmitter.init.call(this);
  }
  // require('events') === require('events').EventEmitter

  EventEmitter.EventEmitter = EventEmitter;
  EventEmitter.usingDomains = false;
  EventEmitter.prototype.domain = undefined;
  EventEmitter.prototype._events = undefined;
  EventEmitter.prototype._maxListeners = undefined; // By default EventEmitters will print a warning if more than 10 listeners are
  // added to it. This is a useful default which helps finding memory leaks.

  EventEmitter.defaultMaxListeners = 10;

  EventEmitter.init = function () {
    this.domain = null;

    if (EventEmitter.usingDomains) {
      // if there is an active domain, then attach to it.
      if (domain.active && !(this instanceof domain.Domain)) ;
    }

    if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
      this._events = new EventHandlers();
      this._eventsCount = 0;
    }

    this._maxListeners = this._maxListeners || undefined;
  }; // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.


  EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
    if (typeof n !== 'number' || n < 0 || isNaN(n)) throw new TypeError('"n" argument must be a positive number');
    this._maxListeners = n;
    return this;
  };

  function $getMaxListeners(that) {
    if (that._maxListeners === undefined) return EventEmitter.defaultMaxListeners;
    return that._maxListeners;
  }

  EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
    return $getMaxListeners(this);
  }; // These standalone emit* functions are used to optimize calling of event
  // handlers for fast cases because emit() itself often has a variable number of
  // arguments and can be deoptimized because of that. These functions always have
  // the same number of arguments and thus do not get deoptimized, so the code
  // inside them can execute faster.


  function emitNone(handler, isFn, self) {
    if (isFn) handler.call(self);else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);

      for (var i = 0; i < len; ++i) {
        listeners[i].call(self);
      }
    }
  }

  function emitOne(handler, isFn, self, arg1) {
    if (isFn) handler.call(self, arg1);else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);

      for (var i = 0; i < len; ++i) {
        listeners[i].call(self, arg1);
      }
    }
  }

  function emitTwo(handler, isFn, self, arg1, arg2) {
    if (isFn) handler.call(self, arg1, arg2);else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);

      for (var i = 0; i < len; ++i) {
        listeners[i].call(self, arg1, arg2);
      }
    }
  }

  function emitThree(handler, isFn, self, arg1, arg2, arg3) {
    if (isFn) handler.call(self, arg1, arg2, arg3);else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);

      for (var i = 0; i < len; ++i) {
        listeners[i].call(self, arg1, arg2, arg3);
      }
    }
  }

  function emitMany(handler, isFn, self, args) {
    if (isFn) handler.apply(self, args);else {
      var len = handler.length;
      var listeners = arrayClone(handler, len);

      for (var i = 0; i < len; ++i) {
        listeners[i].apply(self, args);
      }
    }
  }

  EventEmitter.prototype.emit = function emit(type) {
    var er, handler, len, args, i, events, domain;
    var doError = type === 'error';
    events = this._events;
    if (events) doError = doError && events.error == null;else if (!doError) return false;
    domain = this.domain; // If there is no 'error' event listener then throw.

    if (doError) {
      er = arguments[1];

      if (domain) {
        if (!er) er = new Error('Uncaught, unspecified "error" event');
        er.domainEmitter = this;
        er.domain = domain;
        er.domainThrown = false;
        domain.emit('error', er);
      } else if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }

      return false;
    }

    handler = events[type];
    if (!handler) return false;
    var isFn = typeof handler === 'function';
    len = arguments.length;

    switch (len) {
      // fast cases
      case 1:
        emitNone(handler, isFn, this);
        break;

      case 2:
        emitOne(handler, isFn, this, arguments[1]);
        break;

      case 3:
        emitTwo(handler, isFn, this, arguments[1], arguments[2]);
        break;

      case 4:
        emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
        break;
      // slower

      default:
        args = new Array(len - 1);

        for (i = 1; i < len; i++) {
          args[i - 1] = arguments[i];
        }

        emitMany(handler, isFn, this, args);
    }
    return true;
  };

  function _addListener(target, type, listener, prepend) {
    var m;
    var events;
    var existing;
    if (typeof listener !== 'function') throw new TypeError('"listener" argument must be a function');
    events = target._events;

    if (!events) {
      events = target._events = new EventHandlers();
      target._eventsCount = 0;
    } else {
      // To avoid recursion in the case that type === "newListener"! Before
      // adding it to the listeners, first emit "newListener".
      if (events.newListener) {
        target.emit('newListener', type, listener.listener ? listener.listener : listener); // Re-assign `events` because a newListener handler could have caused the
        // this._events to be assigned to a new object

        events = target._events;
      }

      existing = events[type];
    }

    if (!existing) {
      // Optimize the case of one listener. Don't need the extra array object.
      existing = events[type] = listener;
      ++target._eventsCount;
    } else {
      if (typeof existing === 'function') {
        // Adding the second element, need to change to array.
        existing = events[type] = prepend ? [listener, existing] : [existing, listener];
      } else {
        // If we've already got an array, just append.
        if (prepend) {
          existing.unshift(listener);
        } else {
          existing.push(listener);
        }
      } // Check for listener leak


      if (!existing.warned) {
        m = $getMaxListeners(target);

        if (m && m > 0 && existing.length > m) {
          existing.warned = true;
          var w = new Error('Possible EventEmitter memory leak detected. ' + existing.length + ' ' + type + ' listeners added. ' + 'Use emitter.setMaxListeners() to increase limit');
          w.name = 'MaxListenersExceededWarning';
          w.emitter = target;
          w.type = type;
          w.count = existing.length;
          emitWarning(w);
        }
      }
    }

    return target;
  }

  function emitWarning(e) {
    typeof console.warn === 'function' ? console.warn(e) : console.log(e);
  }

  EventEmitter.prototype.addListener = function addListener(type, listener) {
    return _addListener(this, type, listener, false);
  };

  EventEmitter.prototype.on = EventEmitter.prototype.addListener;

  EventEmitter.prototype.prependListener = function prependListener(type, listener) {
    return _addListener(this, type, listener, true);
  };

  function _onceWrap(target, type, listener) {
    var fired = false;

    function g() {
      target.removeListener(type, g);

      if (!fired) {
        fired = true;
        listener.apply(target, arguments);
      }
    }

    g.listener = listener;
    return g;
  }

  EventEmitter.prototype.once = function once(type, listener) {
    if (typeof listener !== 'function') throw new TypeError('"listener" argument must be a function');
    this.on(type, _onceWrap(this, type, listener));
    return this;
  };

  EventEmitter.prototype.prependOnceListener = function prependOnceListener(type, listener) {
    if (typeof listener !== 'function') throw new TypeError('"listener" argument must be a function');
    this.prependListener(type, _onceWrap(this, type, listener));
    return this;
  }; // emits a 'removeListener' event iff the listener was removed


  EventEmitter.prototype.removeListener = function removeListener(type, listener) {
    var list, events, position, i, originalListener;
    if (typeof listener !== 'function') throw new TypeError('"listener" argument must be a function');
    events = this._events;
    if (!events) return this;
    list = events[type];
    if (!list) return this;

    if (list === listener || list.listener && list.listener === listener) {
      if (--this._eventsCount === 0) this._events = new EventHandlers();else {
        delete events[type];
        if (events.removeListener) this.emit('removeListener', type, list.listener || listener);
      }
    } else if (typeof list !== 'function') {
      position = -1;

      for (i = list.length; i-- > 0;) {
        if (list[i] === listener || list[i].listener && list[i].listener === listener) {
          originalListener = list[i].listener;
          position = i;
          break;
        }
      }

      if (position < 0) return this;

      if (list.length === 1) {
        list[0] = undefined;

        if (--this._eventsCount === 0) {
          this._events = new EventHandlers();
          return this;
        } else {
          delete events[type];
        }
      } else {
        spliceOne(list, position);
      }

      if (events.removeListener) this.emit('removeListener', type, originalListener || listener);
    }

    return this;
  };

  EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
    var listeners, events;
    events = this._events;
    if (!events) return this; // not listening for removeListener, no need to emit

    if (!events.removeListener) {
      if (arguments.length === 0) {
        this._events = new EventHandlers();
        this._eventsCount = 0;
      } else if (events[type]) {
        if (--this._eventsCount === 0) this._events = new EventHandlers();else delete events[type];
      }

      return this;
    } // emit removeListener for all listeners on all events


    if (arguments.length === 0) {
      var keys = Object.keys(events);

      for (var i = 0, key; i < keys.length; ++i) {
        key = keys[i];
        if (key === 'removeListener') continue;
        this.removeAllListeners(key);
      }

      this.removeAllListeners('removeListener');
      this._events = new EventHandlers();
      this._eventsCount = 0;
      return this;
    }

    listeners = events[type];

    if (typeof listeners === 'function') {
      this.removeListener(type, listeners);
    } else if (listeners) {
      // LIFO order
      do {
        this.removeListener(type, listeners[listeners.length - 1]);
      } while (listeners[0]);
    }

    return this;
  };

  EventEmitter.prototype.listeners = function listeners(type) {
    var evlistener;
    var ret;
    var events = this._events;
    if (!events) ret = [];else {
      evlistener = events[type];
      if (!evlistener) ret = [];else if (typeof evlistener === 'function') ret = [evlistener.listener || evlistener];else ret = unwrapListeners(evlistener);
    }
    return ret;
  };

  EventEmitter.listenerCount = function (emitter, type) {
    if (typeof emitter.listenerCount === 'function') {
      return emitter.listenerCount(type);
    } else {
      return listenerCount.call(emitter, type);
    }
  };

  EventEmitter.prototype.listenerCount = listenerCount;

  function listenerCount(type) {
    var events = this._events;

    if (events) {
      var evlistener = events[type];

      if (typeof evlistener === 'function') {
        return 1;
      } else if (evlistener) {
        return evlistener.length;
      }
    }

    return 0;
  }

  EventEmitter.prototype.eventNames = function eventNames() {
    return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
  }; // About 1.5x faster than the two-arg version of Array#splice().


  function spliceOne(list, index) {
    for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1) {
      list[i] = list[k];
    }

    list.pop();
  }

  function arrayClone(arr, i) {
    var copy = new Array(i);

    while (i--) {
      copy[i] = arr[i];
    }

    return copy;
  }

  function unwrapListeners(arr) {
    var ret = new Array(arr.length);

    for (var i = 0; i < ret.length; ++i) {
      ret[i] = arr[i].listener || arr[i];
    }

    return ret;
  }

  var global$1 = typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};

  var lookup = [];
  var revLookup = [];
  var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
  var inited = false;

  function init() {
    inited = true;
    var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    for (var i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    }

    revLookup['-'.charCodeAt(0)] = 62;
    revLookup['_'.charCodeAt(0)] = 63;
  }

  function toByteArray(b64) {
    if (!inited) {
      init();
    }

    var i, j, l, tmp, placeHolders, arr;
    var len = b64.length;

    if (len % 4 > 0) {
      throw new Error('Invalid string. Length must be a multiple of 4');
    } // the number of equal signs (place holders)
    // if there are two placeholders, than the two characters before it
    // represent one byte
    // if there is only one, then the three characters before it represent 2 bytes
    // this is just a cheap hack to not do indexOf twice


    placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0; // base64 is 4/3 + up to two characters of the original data

    arr = new Arr(len * 3 / 4 - placeHolders); // if there are placeholders, only get up to the last complete 4 chars

    l = placeHolders > 0 ? len - 4 : len;
    var L = 0;

    for (i = 0, j = 0; i < l; i += 4, j += 3) {
      tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
      arr[L++] = tmp >> 16 & 0xFF;
      arr[L++] = tmp >> 8 & 0xFF;
      arr[L++] = tmp & 0xFF;
    }

    if (placeHolders === 2) {
      tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
      arr[L++] = tmp & 0xFF;
    } else if (placeHolders === 1) {
      tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
      arr[L++] = tmp >> 8 & 0xFF;
      arr[L++] = tmp & 0xFF;
    }

    return arr;
  }

  function tripletToBase64(num) {
    return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
  }

  function encodeChunk(uint8, start, end) {
    var tmp;
    var output = [];

    for (var i = start; i < end; i += 3) {
      tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2];
      output.push(tripletToBase64(tmp));
    }

    return output.join('');
  }

  function fromByteArray(uint8) {
    if (!inited) {
      init();
    }

    var tmp;
    var len = uint8.length;
    var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes

    var output = '';
    var parts = [];
    var maxChunkLength = 16383; // must be multiple of 3
    // go through the array every three bytes, we'll deal with trailing stuff later

    for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
      parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
    } // pad the end with zeros, but make sure to not forget the extra bytes


    if (extraBytes === 1) {
      tmp = uint8[len - 1];
      output += lookup[tmp >> 2];
      output += lookup[tmp << 4 & 0x3F];
      output += '==';
    } else if (extraBytes === 2) {
      tmp = (uint8[len - 2] << 8) + uint8[len - 1];
      output += lookup[tmp >> 10];
      output += lookup[tmp >> 4 & 0x3F];
      output += lookup[tmp << 2 & 0x3F];
      output += '=';
    }

    parts.push(output);
    return parts.join('');
  }

  function read(buffer, offset, isLE, mLen, nBytes) {
    var e, m;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var nBits = -7;
    var i = isLE ? nBytes - 1 : 0;
    var d = isLE ? -1 : 1;
    var s = buffer[offset + i];
    i += d;
    e = s & (1 << -nBits) - 1;
    s >>= -nBits;
    nBits += eLen;

    for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    m = e & (1 << -nBits) - 1;
    e >>= -nBits;
    nBits += mLen;

    for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    if (e === 0) {
      e = 1 - eBias;
    } else if (e === eMax) {
      return m ? NaN : (s ? -1 : 1) * Infinity;
    } else {
      m = m + Math.pow(2, mLen);
      e = e - eBias;
    }

    return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
  }
  function write(buffer, value, offset, isLE, mLen, nBytes) {
    var e, m, c;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
    var i = isLE ? 0 : nBytes - 1;
    var d = isLE ? 1 : -1;
    var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
    value = Math.abs(value);

    if (isNaN(value) || value === Infinity) {
      m = isNaN(value) ? 1 : 0;
      e = eMax;
    } else {
      e = Math.floor(Math.log(value) / Math.LN2);

      if (value * (c = Math.pow(2, -e)) < 1) {
        e--;
        c *= 2;
      }

      if (e + eBias >= 1) {
        value += rt / c;
      } else {
        value += rt * Math.pow(2, 1 - eBias);
      }

      if (value * c >= 2) {
        e++;
        c /= 2;
      }

      if (e + eBias >= eMax) {
        m = 0;
        e = eMax;
      } else if (e + eBias >= 1) {
        m = (value * c - 1) * Math.pow(2, mLen);
        e = e + eBias;
      } else {
        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
        e = 0;
      }
    }

    for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

    e = e << mLen | m;
    eLen += mLen;

    for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

    buffer[offset + i - d] |= s * 128;
  }

  var toString$1 = {}.toString;
  var isArray = Array.isArray || function (arr) {
    return toString$1.call(arr) == '[object Array]';
  };

  var INSPECT_MAX_BYTES = 50;
  /**
   * If `Buffer.TYPED_ARRAY_SUPPORT`:
   *   === true    Use Uint8Array implementation (fastest)
   *   === false   Use Object implementation (most compatible, even IE6)
   *
   * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
   * Opera 11.6+, iOS 4.2+.
   *
   * Due to various browser bugs, sometimes the Object implementation will be used even
   * when the browser supports typed arrays.
   *
   * Note:
   *
   *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
   *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
   *
   *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
   *
   *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
   *     incorrect length in some situations.

   * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
   * get the Object implementation, which is slower but behaves correctly.
   */

  Buffer.TYPED_ARRAY_SUPPORT = global$1.TYPED_ARRAY_SUPPORT !== undefined ? global$1.TYPED_ARRAY_SUPPORT : true;
  /*
   * Export kMaxLength after typed array support is determined.
   */

  var _kMaxLength = kMaxLength();

  function kMaxLength() {
    return Buffer.TYPED_ARRAY_SUPPORT ? 0x7fffffff : 0x3fffffff;
  }

  function createBuffer(that, length) {
    if (kMaxLength() < length) {
      throw new RangeError('Invalid typed array length');
    }

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      // Return an augmented `Uint8Array` instance, for best performance
      that = new Uint8Array(length);
      that.__proto__ = Buffer.prototype;
    } else {
      // Fallback: Return an object instance of the Buffer class
      if (that === null) {
        that = new Buffer(length);
      }

      that.length = length;
    }

    return that;
  }
  /**
   * The Buffer constructor returns instances of `Uint8Array` that have their
   * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
   * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
   * and the `Uint8Array` methods. Square bracket notation works as expected -- it
   * returns a single octet.
   *
   * The `Uint8Array` prototype remains unmodified.
   */


  function Buffer(arg, encodingOrOffset, length) {
    if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
      return new Buffer(arg, encodingOrOffset, length);
    } // Common case.


    if (typeof arg === 'number') {
      if (typeof encodingOrOffset === 'string') {
        throw new Error('If encoding is specified then the first argument must be a string');
      }

      return allocUnsafe(this, arg);
    }

    return from(this, arg, encodingOrOffset, length);
  }
  Buffer.poolSize = 8192; // not used by this implementation
  // TODO: Legacy, not needed anymore. Remove in next major version.

  Buffer._augment = function (arr) {
    arr.__proto__ = Buffer.prototype;
    return arr;
  };

  function from(that, value, encodingOrOffset, length) {
    if (typeof value === 'number') {
      throw new TypeError('"value" argument must not be a number');
    }

    if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
      return fromArrayBuffer(that, value, encodingOrOffset, length);
    }

    if (typeof value === 'string') {
      return fromString(that, value, encodingOrOffset);
    }

    return fromObject(that, value);
  }
  /**
   * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
   * if value is a number.
   * Buffer.from(str[, encoding])
   * Buffer.from(array)
   * Buffer.from(buffer)
   * Buffer.from(arrayBuffer[, byteOffset[, length]])
   **/


  Buffer.from = function (value, encodingOrOffset, length) {
    return from(null, value, encodingOrOffset, length);
  };

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    Buffer.prototype.__proto__ = Uint8Array.prototype;
    Buffer.__proto__ = Uint8Array;
  }

  function assertSize(size) {
    if (typeof size !== 'number') {
      throw new TypeError('"size" argument must be a number');
    } else if (size < 0) {
      throw new RangeError('"size" argument must not be negative');
    }
  }

  function alloc(that, size, fill, encoding) {
    assertSize(size);

    if (size <= 0) {
      return createBuffer(that, size);
    }

    if (fill !== undefined) {
      // Only pay attention to encoding if it's a string. This
      // prevents accidentally sending in a number that would
      // be interpretted as a start offset.
      return typeof encoding === 'string' ? createBuffer(that, size).fill(fill, encoding) : createBuffer(that, size).fill(fill);
    }

    return createBuffer(that, size);
  }
  /**
   * Creates a new filled Buffer instance.
   * alloc(size[, fill[, encoding]])
   **/


  Buffer.alloc = function (size, fill, encoding) {
    return alloc(null, size, fill, encoding);
  };

  function allocUnsafe(that, size) {
    assertSize(size);
    that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);

    if (!Buffer.TYPED_ARRAY_SUPPORT) {
      for (var i = 0; i < size; ++i) {
        that[i] = 0;
      }
    }

    return that;
  }
  /**
   * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
   * */


  Buffer.allocUnsafe = function (size) {
    return allocUnsafe(null, size);
  };
  /**
   * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
   */


  Buffer.allocUnsafeSlow = function (size) {
    return allocUnsafe(null, size);
  };

  function fromString(that, string, encoding) {
    if (typeof encoding !== 'string' || encoding === '') {
      encoding = 'utf8';
    }

    if (!Buffer.isEncoding(encoding)) {
      throw new TypeError('"encoding" must be a valid string encoding');
    }

    var length = byteLength(string, encoding) | 0;
    that = createBuffer(that, length);
    var actual = that.write(string, encoding);

    if (actual !== length) {
      // Writing a hex string, for example, that contains invalid characters will
      // cause everything after the first invalid character to be ignored. (e.g.
      // 'abxxcd' will be treated as 'ab')
      that = that.slice(0, actual);
    }

    return that;
  }

  function fromArrayLike(that, array) {
    var length = array.length < 0 ? 0 : checked(array.length) | 0;
    that = createBuffer(that, length);

    for (var i = 0; i < length; i += 1) {
      that[i] = array[i] & 255;
    }

    return that;
  }

  function fromArrayBuffer(that, array, byteOffset, length) {
    array.byteLength; // this throws if `array` is not a valid ArrayBuffer

    if (byteOffset < 0 || array.byteLength < byteOffset) {
      throw new RangeError('\'offset\' is out of bounds');
    }

    if (array.byteLength < byteOffset + (length || 0)) {
      throw new RangeError('\'length\' is out of bounds');
    }

    if (byteOffset === undefined && length === undefined) {
      array = new Uint8Array(array);
    } else if (length === undefined) {
      array = new Uint8Array(array, byteOffset);
    } else {
      array = new Uint8Array(array, byteOffset, length);
    }

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      // Return an augmented `Uint8Array` instance, for best performance
      that = array;
      that.__proto__ = Buffer.prototype;
    } else {
      // Fallback: Return an object instance of the Buffer class
      that = fromArrayLike(that, array);
    }

    return that;
  }

  function fromObject(that, obj) {
    if (internalIsBuffer(obj)) {
      var len = checked(obj.length) | 0;
      that = createBuffer(that, len);

      if (that.length === 0) {
        return that;
      }

      obj.copy(that, 0, 0, len);
      return that;
    }

    if (obj) {
      if (typeof ArrayBuffer !== 'undefined' && obj.buffer instanceof ArrayBuffer || 'length' in obj) {
        if (typeof obj.length !== 'number' || isnan(obj.length)) {
          return createBuffer(that, 0);
        }

        return fromArrayLike(that, obj);
      }

      if (obj.type === 'Buffer' && isArray(obj.data)) {
        return fromArrayLike(that, obj.data);
      }
    }

    throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.');
  }

  function checked(length) {
    // Note: cannot use `length < kMaxLength()` here because that fails when
    // length is NaN (which is otherwise coerced to zero.)
    if (length >= kMaxLength()) {
      throw new RangeError('Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + kMaxLength().toString(16) + ' bytes');
    }

    return length | 0;
  }

  function SlowBuffer(length) {
    if (+length != length) {
      // eslint-disable-line eqeqeq
      length = 0;
    }

    return Buffer.alloc(+length);
  }
  Buffer.isBuffer = isBuffer;

  function internalIsBuffer(b) {
    return !!(b != null && b._isBuffer);
  }

  Buffer.compare = function compare(a, b) {
    if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
      throw new TypeError('Arguments must be Buffers');
    }

    if (a === b) return 0;
    var x = a.length;
    var y = b.length;

    for (var i = 0, len = Math.min(x, y); i < len; ++i) {
      if (a[i] !== b[i]) {
        x = a[i];
        y = b[i];
        break;
      }
    }

    if (x < y) return -1;
    if (y < x) return 1;
    return 0;
  };

  Buffer.isEncoding = function isEncoding(encoding) {
    switch (String(encoding).toLowerCase()) {
      case 'hex':
      case 'utf8':
      case 'utf-8':
      case 'ascii':
      case 'latin1':
      case 'binary':
      case 'base64':
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return true;

      default:
        return false;
    }
  };

  Buffer.concat = function concat(list, length) {
    if (!isArray(list)) {
      throw new TypeError('"list" argument must be an Array of Buffers');
    }

    if (list.length === 0) {
      return Buffer.alloc(0);
    }

    var i;

    if (length === undefined) {
      length = 0;

      for (i = 0; i < list.length; ++i) {
        length += list[i].length;
      }
    }

    var buffer = Buffer.allocUnsafe(length);
    var pos = 0;

    for (i = 0; i < list.length; ++i) {
      var buf = list[i];

      if (!internalIsBuffer(buf)) {
        throw new TypeError('"list" argument must be an Array of Buffers');
      }

      buf.copy(buffer, pos);
      pos += buf.length;
    }

    return buffer;
  };

  function byteLength(string, encoding) {
    if (internalIsBuffer(string)) {
      return string.length;
    }

    if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' && (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
      return string.byteLength;
    }

    if (typeof string !== 'string') {
      string = '' + string;
    }

    var len = string.length;
    if (len === 0) return 0; // Use a for loop to avoid recursion

    var loweredCase = false;

    for (;;) {
      switch (encoding) {
        case 'ascii':
        case 'latin1':
        case 'binary':
          return len;

        case 'utf8':
        case 'utf-8':
        case undefined:
          return utf8ToBytes(string).length;

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return len * 2;

        case 'hex':
          return len >>> 1;

        case 'base64':
          return base64ToBytes(string).length;

        default:
          if (loweredCase) return utf8ToBytes(string).length; // assume utf8

          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  }

  Buffer.byteLength = byteLength;

  function slowToString(encoding, start, end) {
    var loweredCase = false; // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
    // property of a typed array.
    // This behaves neither like String nor Uint8Array in that we set start/end
    // to their upper/lower bounds if the value passed is out of range.
    // undefined is handled specially as per ECMA-262 6th Edition,
    // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.

    if (start === undefined || start < 0) {
      start = 0;
    } // Return early if start > this.length. Done here to prevent potential uint32
    // coercion fail below.


    if (start > this.length) {
      return '';
    }

    if (end === undefined || end > this.length) {
      end = this.length;
    }

    if (end <= 0) {
      return '';
    } // Force coersion to uint32. This will also coerce falsey/NaN values to 0.


    end >>>= 0;
    start >>>= 0;

    if (end <= start) {
      return '';
    }

    if (!encoding) encoding = 'utf8';

    while (true) {
      switch (encoding) {
        case 'hex':
          return hexSlice(this, start, end);

        case 'utf8':
        case 'utf-8':
          return utf8Slice(this, start, end);

        case 'ascii':
          return asciiSlice(this, start, end);

        case 'latin1':
        case 'binary':
          return latin1Slice(this, start, end);

        case 'base64':
          return base64Slice(this, start, end);

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return utf16leSlice(this, start, end);

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
          encoding = (encoding + '').toLowerCase();
          loweredCase = true;
      }
    }
  } // The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
  // Buffer instances.


  Buffer.prototype._isBuffer = true;

  function swap(b, n, m) {
    var i = b[n];
    b[n] = b[m];
    b[m] = i;
  }

  Buffer.prototype.swap16 = function swap16() {
    var len = this.length;

    if (len % 2 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 16-bits');
    }

    for (var i = 0; i < len; i += 2) {
      swap(this, i, i + 1);
    }

    return this;
  };

  Buffer.prototype.swap32 = function swap32() {
    var len = this.length;

    if (len % 4 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 32-bits');
    }

    for (var i = 0; i < len; i += 4) {
      swap(this, i, i + 3);
      swap(this, i + 1, i + 2);
    }

    return this;
  };

  Buffer.prototype.swap64 = function swap64() {
    var len = this.length;

    if (len % 8 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 64-bits');
    }

    for (var i = 0; i < len; i += 8) {
      swap(this, i, i + 7);
      swap(this, i + 1, i + 6);
      swap(this, i + 2, i + 5);
      swap(this, i + 3, i + 4);
    }

    return this;
  };

  Buffer.prototype.toString = function toString() {
    var length = this.length | 0;
    if (length === 0) return '';
    if (arguments.length === 0) return utf8Slice(this, 0, length);
    return slowToString.apply(this, arguments);
  };

  Buffer.prototype.equals = function equals(b) {
    if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer');
    if (this === b) return true;
    return Buffer.compare(this, b) === 0;
  };

  Buffer.prototype.inspect = function inspect() {
    var str = '';
    var max = INSPECT_MAX_BYTES;

    if (this.length > 0) {
      str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
      if (this.length > max) str += ' ... ';
    }

    return '<Buffer ' + str + '>';
  };

  Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
    if (!internalIsBuffer(target)) {
      throw new TypeError('Argument must be a Buffer');
    }

    if (start === undefined) {
      start = 0;
    }

    if (end === undefined) {
      end = target ? target.length : 0;
    }

    if (thisStart === undefined) {
      thisStart = 0;
    }

    if (thisEnd === undefined) {
      thisEnd = this.length;
    }

    if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
      throw new RangeError('out of range index');
    }

    if (thisStart >= thisEnd && start >= end) {
      return 0;
    }

    if (thisStart >= thisEnd) {
      return -1;
    }

    if (start >= end) {
      return 1;
    }

    start >>>= 0;
    end >>>= 0;
    thisStart >>>= 0;
    thisEnd >>>= 0;
    if (this === target) return 0;
    var x = thisEnd - thisStart;
    var y = end - start;
    var len = Math.min(x, y);
    var thisCopy = this.slice(thisStart, thisEnd);
    var targetCopy = target.slice(start, end);

    for (var i = 0; i < len; ++i) {
      if (thisCopy[i] !== targetCopy[i]) {
        x = thisCopy[i];
        y = targetCopy[i];
        break;
      }
    }

    if (x < y) return -1;
    if (y < x) return 1;
    return 0;
  }; // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
  // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
  //
  // Arguments:
  // - buffer - a Buffer to search
  // - val - a string, Buffer, or number
  // - byteOffset - an index into `buffer`; will be clamped to an int32
  // - encoding - an optional encoding, relevant is val is a string
  // - dir - true for indexOf, false for lastIndexOf


  function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
    // Empty buffer means no match
    if (buffer.length === 0) return -1; // Normalize byteOffset

    if (typeof byteOffset === 'string') {
      encoding = byteOffset;
      byteOffset = 0;
    } else if (byteOffset > 0x7fffffff) {
      byteOffset = 0x7fffffff;
    } else if (byteOffset < -0x80000000) {
      byteOffset = -0x80000000;
    }

    byteOffset = +byteOffset; // Coerce to Number.

    if (isNaN(byteOffset)) {
      // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
      byteOffset = dir ? 0 : buffer.length - 1;
    } // Normalize byteOffset: negative offsets start from the end of the buffer


    if (byteOffset < 0) byteOffset = buffer.length + byteOffset;

    if (byteOffset >= buffer.length) {
      if (dir) return -1;else byteOffset = buffer.length - 1;
    } else if (byteOffset < 0) {
      if (dir) byteOffset = 0;else return -1;
    } // Normalize val


    if (typeof val === 'string') {
      val = Buffer.from(val, encoding);
    } // Finally, search either indexOf (if dir is true) or lastIndexOf


    if (internalIsBuffer(val)) {
      // Special case: looking for empty string/buffer always fails
      if (val.length === 0) {
        return -1;
      }

      return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
    } else if (typeof val === 'number') {
      val = val & 0xFF; // Search for a byte value [0-255]

      if (Buffer.TYPED_ARRAY_SUPPORT && typeof Uint8Array.prototype.indexOf === 'function') {
        if (dir) {
          return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
        } else {
          return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
        }
      }

      return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
    }

    throw new TypeError('val must be string, number or Buffer');
  }

  function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
    var indexSize = 1;
    var arrLength = arr.length;
    var valLength = val.length;

    if (encoding !== undefined) {
      encoding = String(encoding).toLowerCase();

      if (encoding === 'ucs2' || encoding === 'ucs-2' || encoding === 'utf16le' || encoding === 'utf-16le') {
        if (arr.length < 2 || val.length < 2) {
          return -1;
        }

        indexSize = 2;
        arrLength /= 2;
        valLength /= 2;
        byteOffset /= 2;
      }
    }

    function read$$1(buf, i) {
      if (indexSize === 1) {
        return buf[i];
      } else {
        return buf.readUInt16BE(i * indexSize);
      }
    }

    var i;

    if (dir) {
      var foundIndex = -1;

      for (i = byteOffset; i < arrLength; i++) {
        if (read$$1(arr, i) === read$$1(val, foundIndex === -1 ? 0 : i - foundIndex)) {
          if (foundIndex === -1) foundIndex = i;
          if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
        } else {
          if (foundIndex !== -1) i -= i - foundIndex;
          foundIndex = -1;
        }
      }
    } else {
      if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;

      for (i = byteOffset; i >= 0; i--) {
        var found = true;

        for (var j = 0; j < valLength; j++) {
          if (read$$1(arr, i + j) !== read$$1(val, j)) {
            found = false;
            break;
          }
        }

        if (found) return i;
      }
    }

    return -1;
  }

  Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1;
  };

  Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
  };

  Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
  };

  function hexWrite(buf, string, offset, length) {
    offset = Number(offset) || 0;
    var remaining = buf.length - offset;

    if (!length) {
      length = remaining;
    } else {
      length = Number(length);

      if (length > remaining) {
        length = remaining;
      }
    } // must be an even number of digits


    var strLen = string.length;
    if (strLen % 2 !== 0) throw new TypeError('Invalid hex string');

    if (length > strLen / 2) {
      length = strLen / 2;
    }

    for (var i = 0; i < length; ++i) {
      var parsed = parseInt(string.substr(i * 2, 2), 16);
      if (isNaN(parsed)) return i;
      buf[offset + i] = parsed;
    }

    return i;
  }

  function utf8Write(buf, string, offset, length) {
    return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
  }

  function asciiWrite(buf, string, offset, length) {
    return blitBuffer(asciiToBytes(string), buf, offset, length);
  }

  function latin1Write(buf, string, offset, length) {
    return asciiWrite(buf, string, offset, length);
  }

  function base64Write(buf, string, offset, length) {
    return blitBuffer(base64ToBytes(string), buf, offset, length);
  }

  function ucs2Write(buf, string, offset, length) {
    return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
  }

  Buffer.prototype.write = function write$$1(string, offset, length, encoding) {
    // Buffer#write(string)
    if (offset === undefined) {
      encoding = 'utf8';
      length = this.length;
      offset = 0; // Buffer#write(string, encoding)
    } else if (length === undefined && typeof offset === 'string') {
      encoding = offset;
      length = this.length;
      offset = 0; // Buffer#write(string, offset[, length][, encoding])
    } else if (isFinite(offset)) {
      offset = offset | 0;

      if (isFinite(length)) {
        length = length | 0;
        if (encoding === undefined) encoding = 'utf8';
      } else {
        encoding = length;
        length = undefined;
      } // legacy write(string, encoding, offset, length) - remove in v0.13

    } else {
      throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported');
    }

    var remaining = this.length - offset;
    if (length === undefined || length > remaining) length = remaining;

    if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
      throw new RangeError('Attempt to write outside buffer bounds');
    }

    if (!encoding) encoding = 'utf8';
    var loweredCase = false;

    for (;;) {
      switch (encoding) {
        case 'hex':
          return hexWrite(this, string, offset, length);

        case 'utf8':
        case 'utf-8':
          return utf8Write(this, string, offset, length);

        case 'ascii':
          return asciiWrite(this, string, offset, length);

        case 'latin1':
        case 'binary':
          return latin1Write(this, string, offset, length);

        case 'base64':
          // Warning: maxLength not taken into account in base64Write
          return base64Write(this, string, offset, length);

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return ucs2Write(this, string, offset, length);

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  };

  Buffer.prototype.toJSON = function toJSON() {
    return {
      type: 'Buffer',
      data: Array.prototype.slice.call(this._arr || this, 0)
    };
  };

  function base64Slice(buf, start, end) {
    if (start === 0 && end === buf.length) {
      return fromByteArray(buf);
    } else {
      return fromByteArray(buf.slice(start, end));
    }
  }

  function utf8Slice(buf, start, end) {
    end = Math.min(buf.length, end);
    var res = [];
    var i = start;

    while (i < end) {
      var firstByte = buf[i];
      var codePoint = null;
      var bytesPerSequence = firstByte > 0xEF ? 4 : firstByte > 0xDF ? 3 : firstByte > 0xBF ? 2 : 1;

      if (i + bytesPerSequence <= end) {
        var secondByte, thirdByte, fourthByte, tempCodePoint;

        switch (bytesPerSequence) {
          case 1:
            if (firstByte < 0x80) {
              codePoint = firstByte;
            }

            break;

          case 2:
            secondByte = buf[i + 1];

            if ((secondByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0x1F) << 0x6 | secondByte & 0x3F;

              if (tempCodePoint > 0x7F) {
                codePoint = tempCodePoint;
              }
            }

            break;

          case 3:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];

            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | thirdByte & 0x3F;

              if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                codePoint = tempCodePoint;
              }
            }

            break;

          case 4:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            fourthByte = buf[i + 3];

            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | fourthByte & 0x3F;

              if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                codePoint = tempCodePoint;
              }
            }

        }
      }

      if (codePoint === null) {
        // we did not generate a valid codePoint so insert a
        // replacement char (U+FFFD) and advance only 1 byte
        codePoint = 0xFFFD;
        bytesPerSequence = 1;
      } else if (codePoint > 0xFFFF) {
        // encode to utf16 (surrogate pair dance)
        codePoint -= 0x10000;
        res.push(codePoint >>> 10 & 0x3FF | 0xD800);
        codePoint = 0xDC00 | codePoint & 0x3FF;
      }

      res.push(codePoint);
      i += bytesPerSequence;
    }

    return decodeCodePointsArray(res);
  } // Based on http://stackoverflow.com/a/22747272/680742, the browser with
  // the lowest limit is Chrome, with 0x10000 args.
  // We go 1 magnitude less, for safety


  var MAX_ARGUMENTS_LENGTH = 0x1000;

  function decodeCodePointsArray(codePoints) {
    var len = codePoints.length;

    if (len <= MAX_ARGUMENTS_LENGTH) {
      return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
    } // Decode in chunks to avoid "call stack size exceeded".


    var res = '';
    var i = 0;

    while (i < len) {
      res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
    }

    return res;
  }

  function asciiSlice(buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i] & 0x7F);
    }

    return ret;
  }

  function latin1Slice(buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i]);
    }

    return ret;
  }

  function hexSlice(buf, start, end) {
    var len = buf.length;
    if (!start || start < 0) start = 0;
    if (!end || end < 0 || end > len) end = len;
    var out = '';

    for (var i = start; i < end; ++i) {
      out += toHex(buf[i]);
    }

    return out;
  }

  function utf16leSlice(buf, start, end) {
    var bytes = buf.slice(start, end);
    var res = '';

    for (var i = 0; i < bytes.length; i += 2) {
      res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
    }

    return res;
  }

  Buffer.prototype.slice = function slice(start, end) {
    var len = this.length;
    start = ~~start;
    end = end === undefined ? len : ~~end;

    if (start < 0) {
      start += len;
      if (start < 0) start = 0;
    } else if (start > len) {
      start = len;
    }

    if (end < 0) {
      end += len;
      if (end < 0) end = 0;
    } else if (end > len) {
      end = len;
    }

    if (end < start) end = start;
    var newBuf;

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      newBuf = this.subarray(start, end);
      newBuf.__proto__ = Buffer.prototype;
    } else {
      var sliceLen = end - start;
      newBuf = new Buffer(sliceLen, undefined);

      for (var i = 0; i < sliceLen; ++i) {
        newBuf[i] = this[i + start];
      }
    }

    return newBuf;
  };
  /*
   * Need to make sure that buffer isn't trying to write out of bounds.
   */


  function checkOffset(offset, ext, length) {
    if (offset % 1 !== 0 || offset < 0) throw new RangeError('offset is not uint');
    if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length');
  }

  Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);
    var val = this[offset];
    var mul = 1;
    var i = 0;

    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }

    return val;
  };

  Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;

    if (!noAssert) {
      checkOffset(offset, byteLength, this.length);
    }

    var val = this[offset + --byteLength];
    var mul = 1;

    while (byteLength > 0 && (mul *= 0x100)) {
      val += this[offset + --byteLength] * mul;
    }

    return val;
  };

  Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    return this[offset];
  };

  Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] | this[offset + 1] << 8;
  };

  Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] << 8 | this[offset + 1];
  };

  Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 0x1000000;
  };

  Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] * 0x1000000 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
  };

  Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);
    var val = this[offset];
    var mul = 1;
    var i = 0;

    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }

    mul *= 0x80;
    if (val >= mul) val -= Math.pow(2, 8 * byteLength);
    return val;
  };

  Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);
    var i = byteLength;
    var mul = 1;
    var val = this[offset + --i];

    while (i > 0 && (mul *= 0x100)) {
      val += this[offset + --i] * mul;
    }

    mul *= 0x80;
    if (val >= mul) val -= Math.pow(2, 8 * byteLength);
    return val;
  };

  Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    if (!(this[offset] & 0x80)) return this[offset];
    return (0xff - this[offset] + 1) * -1;
  };

  Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset] | this[offset + 1] << 8;
    return val & 0x8000 ? val | 0xFFFF0000 : val;
  };

  Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset + 1] | this[offset] << 8;
    return val & 0x8000 ? val | 0xFFFF0000 : val;
  };

  Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
  };

  Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
  };

  Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return read(this, offset, true, 23, 4);
  };

  Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return read(this, offset, false, 23, 4);
  };

  Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return read(this, offset, true, 52, 8);
  };

  Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return read(this, offset, false, 52, 8);
  };

  function checkInt(buf, value, offset, ext, max, min) {
    if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
    if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
    if (offset + ext > buf.length) throw new RangeError('Index out of range');
  }

  Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;

    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var mul = 1;
    var i = 0;
    this[offset] = value & 0xFF;

    while (++i < byteLength && (mul *= 0x100)) {
      this[offset + i] = value / mul & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;

    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var i = byteLength - 1;
    var mul = 1;
    this[offset + i] = value & 0xFF;

    while (--i >= 0 && (mul *= 0x100)) {
      this[offset + i] = value / mul & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
    if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    this[offset] = value & 0xff;
    return offset + 1;
  };

  function objectWriteUInt16(buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffff + value + 1;

    for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
      buf[offset + i] = (value & 0xff << 8 * (littleEndian ? i : 1 - i)) >>> (littleEndian ? i : 1 - i) * 8;
    }
  }

  Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value & 0xff;
      this[offset + 1] = value >>> 8;
    } else {
      objectWriteUInt16(this, value, offset, true);
    }

    return offset + 2;
  };

  Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 8;
      this[offset + 1] = value & 0xff;
    } else {
      objectWriteUInt16(this, value, offset, false);
    }

    return offset + 2;
  };

  function objectWriteUInt32(buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffffffff + value + 1;

    for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
      buf[offset + i] = value >>> (littleEndian ? i : 3 - i) * 8 & 0xff;
    }
  }

  Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset + 3] = value >>> 24;
      this[offset + 2] = value >>> 16;
      this[offset + 1] = value >>> 8;
      this[offset] = value & 0xff;
    } else {
      objectWriteUInt32(this, value, offset, true);
    }

    return offset + 4;
  };

  Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 0xff;
    } else {
      objectWriteUInt32(this, value, offset, false);
    }

    return offset + 4;
  };

  Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;

    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);
      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = 0;
    var mul = 1;
    var sub = 0;
    this[offset] = value & 0xFF;

    while (++i < byteLength && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
        sub = 1;
      }

      this[offset + i] = (value / mul >> 0) - sub & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;

    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);
      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = byteLength - 1;
    var mul = 1;
    var sub = 0;
    this[offset + i] = value & 0xFF;

    while (--i >= 0 && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
        sub = 1;
      }

      this[offset + i] = (value / mul >> 0) - sub & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
    if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    if (value < 0) value = 0xff + value + 1;
    this[offset] = value & 0xff;
    return offset + 1;
  };

  Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value & 0xff;
      this[offset + 1] = value >>> 8;
    } else {
      objectWriteUInt16(this, value, offset, true);
    }

    return offset + 2;
  };

  Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 8;
      this[offset + 1] = value & 0xff;
    } else {
      objectWriteUInt16(this, value, offset, false);
    }

    return offset + 2;
  };

  Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value & 0xff;
      this[offset + 1] = value >>> 8;
      this[offset + 2] = value >>> 16;
      this[offset + 3] = value >>> 24;
    } else {
      objectWriteUInt32(this, value, offset, true);
    }

    return offset + 4;
  };

  Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (value < 0) value = 0xffffffff + value + 1;

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 0xff;
    } else {
      objectWriteUInt32(this, value, offset, false);
    }

    return offset + 4;
  };

  function checkIEEE754(buf, value, offset, ext, max, min) {
    if (offset + ext > buf.length) throw new RangeError('Index out of range');
    if (offset < 0) throw new RangeError('Index out of range');
  }

  function writeFloat(buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
    }

    write(buf, value, offset, littleEndian, 23, 4);
    return offset + 4;
  }

  Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert);
  };

  Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert);
  };

  function writeDouble(buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
    }

    write(buf, value, offset, littleEndian, 52, 8);
    return offset + 8;
  }

  Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert);
  };

  Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert);
  }; // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)


  Buffer.prototype.copy = function copy(target, targetStart, start, end) {
    if (!start) start = 0;
    if (!end && end !== 0) end = this.length;
    if (targetStart >= target.length) targetStart = target.length;
    if (!targetStart) targetStart = 0;
    if (end > 0 && end < start) end = start; // Copy 0 bytes; we're done

    if (end === start) return 0;
    if (target.length === 0 || this.length === 0) return 0; // Fatal error conditions

    if (targetStart < 0) {
      throw new RangeError('targetStart out of bounds');
    }

    if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds');
    if (end < 0) throw new RangeError('sourceEnd out of bounds'); // Are we oob?

    if (end > this.length) end = this.length;

    if (target.length - targetStart < end - start) {
      end = target.length - targetStart + start;
    }

    var len = end - start;
    var i;

    if (this === target && start < targetStart && targetStart < end) {
      // descending copy from end
      for (i = len - 1; i >= 0; --i) {
        target[i + targetStart] = this[i + start];
      }
    } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
      // ascending copy from start
      for (i = 0; i < len; ++i) {
        target[i + targetStart] = this[i + start];
      }
    } else {
      Uint8Array.prototype.set.call(target, this.subarray(start, start + len), targetStart);
    }

    return len;
  }; // Usage:
  //    buffer.fill(number[, offset[, end]])
  //    buffer.fill(buffer[, offset[, end]])
  //    buffer.fill(string[, offset[, end]][, encoding])


  Buffer.prototype.fill = function fill(val, start, end, encoding) {
    // Handle string cases:
    if (typeof val === 'string') {
      if (typeof start === 'string') {
        encoding = start;
        start = 0;
        end = this.length;
      } else if (typeof end === 'string') {
        encoding = end;
        end = this.length;
      }

      if (val.length === 1) {
        var code = val.charCodeAt(0);

        if (code < 256) {
          val = code;
        }
      }

      if (encoding !== undefined && typeof encoding !== 'string') {
        throw new TypeError('encoding must be a string');
      }

      if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
        throw new TypeError('Unknown encoding: ' + encoding);
      }
    } else if (typeof val === 'number') {
      val = val & 255;
    } // Invalid ranges are not set to a default, so can range check early.


    if (start < 0 || this.length < start || this.length < end) {
      throw new RangeError('Out of range index');
    }

    if (end <= start) {
      return this;
    }

    start = start >>> 0;
    end = end === undefined ? this.length : end >>> 0;
    if (!val) val = 0;
    var i;

    if (typeof val === 'number') {
      for (i = start; i < end; ++i) {
        this[i] = val;
      }
    } else {
      var bytes = internalIsBuffer(val) ? val : utf8ToBytes(new Buffer(val, encoding).toString());
      var len = bytes.length;

      for (i = 0; i < end - start; ++i) {
        this[i + start] = bytes[i % len];
      }
    }

    return this;
  }; // HELPER FUNCTIONS
  // ================


  var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

  function base64clean(str) {
    // Node strips out invalid characters like \n and \t from the string, base64-js does not
    str = stringtrim(str).replace(INVALID_BASE64_RE, ''); // Node converts strings with length < 2 to ''

    if (str.length < 2) return ''; // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not

    while (str.length % 4 !== 0) {
      str = str + '=';
    }

    return str;
  }

  function stringtrim(str) {
    if (str.trim) return str.trim();
    return str.replace(/^\s+|\s+$/g, '');
  }

  function toHex(n) {
    if (n < 16) return '0' + n.toString(16);
    return n.toString(16);
  }

  function utf8ToBytes(string, units) {
    units = units || Infinity;
    var codePoint;
    var length = string.length;
    var leadSurrogate = null;
    var bytes = [];

    for (var i = 0; i < length; ++i) {
      codePoint = string.charCodeAt(i); // is surrogate component

      if (codePoint > 0xD7FF && codePoint < 0xE000) {
        // last char was a lead
        if (!leadSurrogate) {
          // no lead yet
          if (codePoint > 0xDBFF) {
            // unexpected trail
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue;
          } else if (i + 1 === length) {
            // unpaired lead
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue;
          } // valid lead


          leadSurrogate = codePoint;
          continue;
        } // 2 leads in a row


        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          leadSurrogate = codePoint;
          continue;
        } // valid surrogate pair


        codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
      } else if (leadSurrogate) {
        // valid bmp char, but last char was a lead
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
      }

      leadSurrogate = null; // encode utf8

      if (codePoint < 0x80) {
        if ((units -= 1) < 0) break;
        bytes.push(codePoint);
      } else if (codePoint < 0x800) {
        if ((units -= 2) < 0) break;
        bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
      } else if (codePoint < 0x10000) {
        if ((units -= 3) < 0) break;
        bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
      } else if (codePoint < 0x110000) {
        if ((units -= 4) < 0) break;
        bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
      } else {
        throw new Error('Invalid code point');
      }
    }

    return bytes;
  }

  function asciiToBytes(str) {
    var byteArray = [];

    for (var i = 0; i < str.length; ++i) {
      // Node's code seems to be doing this and not & 0x7F..
      byteArray.push(str.charCodeAt(i) & 0xFF);
    }

    return byteArray;
  }

  function utf16leToBytes(str, units) {
    var c, hi, lo;
    var byteArray = [];

    for (var i = 0; i < str.length; ++i) {
      if ((units -= 2) < 0) break;
      c = str.charCodeAt(i);
      hi = c >> 8;
      lo = c % 256;
      byteArray.push(lo);
      byteArray.push(hi);
    }

    return byteArray;
  }

  function base64ToBytes(str) {
    return toByteArray(base64clean(str));
  }

  function blitBuffer(src, dst, offset, length) {
    for (var i = 0; i < length; ++i) {
      if (i + offset >= dst.length || i >= src.length) break;
      dst[i + offset] = src[i];
    }

    return i;
  }

  function isnan(val) {
    return val !== val; // eslint-disable-line no-self-compare
  } // the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
  // The _isBuffer check is for Safari 5-7 support, because it's missing
  // Object.prototype.constructor. Remove this eventually


  function isBuffer(obj) {
    return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj));
  }

  function isFastBuffer(obj) {
    return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj);
  } // For Node v0.10 support. Remove this eventually.


  function isSlowBuffer(obj) {
    return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0));
  }

  var bufferEs6 = /*#__PURE__*/Object.freeze({
    INSPECT_MAX_BYTES: INSPECT_MAX_BYTES,
    kMaxLength: _kMaxLength,
    Buffer: Buffer,
    SlowBuffer: SlowBuffer,
    isBuffer: isBuffer
  });

  var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  /*
   *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
   *
   *  Use of this source code is governed by a BSD-style license
   *  that can be found in the LICENSE file in the root of the source
   *  tree.
   */

  var logDisabled_ = true;
  var deprecationWarnings_ = true;
  /**
   * Extract browser version out of the provided user agent string.
   *
   * @param {!string} uastring userAgent string.
   * @param {!string} expr Regular expression used as match criteria.
   * @param {!number} pos position in the version string to be returned.
   * @return {!number} browser version.
   */

  function extractVersion(uastring, expr, pos) {
    var match = uastring.match(expr);
    return match && match.length >= pos && parseInt(match[pos], 10);
  } // Wraps the peerconnection event eventNameToWrap in a function
  // which returns the modified event object (or false to prevent
  // the event).


  function wrapPeerConnectionEvent(window, eventNameToWrap, wrapper) {
    if (!window.RTCPeerConnection) {
      return;
    }

    var proto = window.RTCPeerConnection.prototype;
    var nativeAddEventListener = proto.addEventListener;

    proto.addEventListener = function (nativeEventName, cb) {
      if (nativeEventName !== eventNameToWrap) {
        return nativeAddEventListener.apply(this, arguments);
      }

      var wrappedCallback = function (e) {
        var modifiedEvent = wrapper(e);

        if (modifiedEvent) {
          cb(modifiedEvent);
        }
      };

      this._eventMap = this._eventMap || {};
      this._eventMap[cb] = wrappedCallback;
      return nativeAddEventListener.apply(this, [nativeEventName, wrappedCallback]);
    };

    var nativeRemoveEventListener = proto.removeEventListener;

    proto.removeEventListener = function (nativeEventName, cb) {
      if (nativeEventName !== eventNameToWrap || !this._eventMap || !this._eventMap[cb]) {
        return nativeRemoveEventListener.apply(this, arguments);
      }

      var unwrappedCb = this._eventMap[cb];
      delete this._eventMap[cb];
      return nativeRemoveEventListener.apply(this, [nativeEventName, unwrappedCb]);
    };

    Object.defineProperty(proto, 'on' + eventNameToWrap, {
      get: function () {
        return this['_on' + eventNameToWrap];
      },
      set: function (cb) {
        if (this['_on' + eventNameToWrap]) {
          this.removeEventListener(eventNameToWrap, this['_on' + eventNameToWrap]);
          delete this['_on' + eventNameToWrap];
        }

        if (cb) {
          this.addEventListener(eventNameToWrap, this['_on' + eventNameToWrap] = cb);
        }
      },
      enumerable: true,
      configurable: true
    });
  } // Utility methods.


  var utils = {
    extractVersion: extractVersion,
    wrapPeerConnectionEvent: wrapPeerConnectionEvent,
    disableLog: function (bool) {
      if (typeof bool !== 'boolean') {
        return new Error('Argument type: ' + typeof bool + '. Please use a boolean.');
      }

      logDisabled_ = bool;
      return bool ? 'adapter.js logging disabled' : 'adapter.js logging enabled';
    },

    /**
     * Disable or enable deprecation warnings
     * @param {!boolean} bool set to true to disable warnings.
     */
    disableWarnings: function (bool) {
      if (typeof bool !== 'boolean') {
        return new Error('Argument type: ' + typeof bool + '. Please use a boolean.');
      }

      deprecationWarnings_ = !bool;
      return 'adapter.js deprecation warnings ' + (bool ? 'disabled' : 'enabled');
    },
    log: function () {
      if (typeof window === 'object') {
        if (logDisabled_) {
          return;
        }

        if (typeof console !== 'undefined' && typeof console.log === 'function') {
          console.log.apply(console, arguments);
        }
      }
    },

    /**
     * Shows a deprecation warning suggesting the modern and spec-compatible API.
     */
    deprecated: function (oldMethod, newMethod) {
      if (!deprecationWarnings_) {
        return;
      }

      console.warn(oldMethod + ' is deprecated, please use ' + newMethod + ' instead.');
    },

    /**
     * Browser detector.
     *
     * @return {object} result containing browser and version
     *     properties.
     */
    detectBrowser: function (window) {
      var navigator = window && window.navigator; // Returned result object.

      var result = {};
      result.browser = null;
      result.version = null; // Fail early if it's not a browser

      if (typeof window === 'undefined' || !window.navigator) {
        result.browser = 'Not a browser.';
        return result;
      }

      if (navigator.mozGetUserMedia) {
        // Firefox.
        result.browser = 'firefox';
        result.version = extractVersion(navigator.userAgent, /Firefox\/(\d+)\./, 1);
      } else if (navigator.webkitGetUserMedia) {
        // Chrome, Chromium, Webview, Opera.
        // Version matches Chrome/WebRTC version.
        result.browser = 'chrome';
        result.version = extractVersion(navigator.userAgent, /Chrom(e|ium)\/(\d+)\./, 2);
      } else if (navigator.mediaDevices && navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
        // Edge.
        result.browser = 'edge';
        result.version = extractVersion(navigator.userAgent, /Edge\/(\d+).(\d+)$/, 2);
      } else if (window.RTCPeerConnection && navigator.userAgent.match(/AppleWebKit\/(\d+)\./)) {
        // Safari.
        result.browser = 'safari';
        result.version = extractVersion(navigator.userAgent, /AppleWebKit\/(\d+)\./, 1);
      } else {
        // Default fallthrough: not supported.
        result.browser = 'Not a supported browser.';
        return result;
      }

      return result;
    },
    // Fix urls not supports in some older browsers. (by @allex_wang)
    wrapPeerConnectionCtor: function (window) {
      var RTCPeerConnection = window.RTCPeerConnection;

      if (!RTCPeerConnection) {
        return;
      }

      var test = function (F, pcConfig) {
        try {
          new F(pcConfig);
        } catch (e) {
          return false;
        }

        return true;
      };

      var testIceServers = {
        iceServers: [{
          urls: 'stun:stun.iallex.com'
        }]
      };

      if (!test(RTCPeerConnection, testIceServers)) {
        var T = function (pcConfig, pcConstraints) {
          // .urls is not supported in FF < 38 and chrome < 31.
          // create RTCIceServers with a single url.
          if (pcConfig && pcConfig.iceServers) {
            var newIceServers = [];

            for (var i = 0; i < pcConfig.iceServers.length; i++) {
              var server = pcConfig.iceServers[i];

              if (server.hasOwnProperty('urls')) {
                // https://developer.mozilla.org/en-US/docs/Web/API/RTCIceServer/urls
                var urls = server.urls;
                urls = typeof urls === 'string' ? [urls] : urls;

                for (var j = 0; j < urls.length; j++) {
                  var newServer = {
                    url: urls[j]
                  };

                  if (urls[j].indexOf('turn') === 0) {
                    newServer.username = server.username;
                    newServer.credential = server.credential;
                  }

                  newIceServers.push(newServer);
                }
              } else {
                newIceServers.push(pcConfig.iceServers[i]);
              }
            }

            pcConfig.iceServers = newIceServers;
          }

          return new RTCPeerConnection(pcConfig, pcConstraints);
        };

        if (test(T, testIceServers)) {
          T.prototype = RTCPeerConnection.prototype;
          T.prototype.constructor = T;
          window.RTCPeerConnection = T;
        }
      }

      return window.RTCPeerConnection;
    }
  };

  var logging = utils.log; // Expose public methods.

  var getusermedia = function (window) {
    var browserDetails = utils.detectBrowser(window);
    var navigator = window && window.navigator;

    var constraintsToChrome_ = function (c) {
      if (typeof c !== 'object' || c.mandatory || c.optional) {
        return c;
      }

      var cc = {};
      Object.keys(c).forEach(function (key) {
        if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
          return;
        }

        var r = typeof c[key] === 'object' ? c[key] : {
          ideal: c[key]
        };

        if (r.exact !== undefined && typeof r.exact === 'number') {
          r.min = r.max = r.exact;
        }

        var oldname_ = function (prefix, name) {
          if (prefix) {
            return prefix + name.charAt(0).toUpperCase() + name.slice(1);
          }

          return name === 'deviceId' ? 'sourceId' : name;
        };

        if (r.ideal !== undefined) {
          cc.optional = cc.optional || [];
          var oc = {};

          if (typeof r.ideal === 'number') {
            oc[oldname_('min', key)] = r.ideal;
            cc.optional.push(oc);
            oc = {};
            oc[oldname_('max', key)] = r.ideal;
            cc.optional.push(oc);
          } else {
            oc[oldname_('', key)] = r.ideal;
            cc.optional.push(oc);
          }
        }

        if (r.exact !== undefined && typeof r.exact !== 'number') {
          cc.mandatory = cc.mandatory || {};
          cc.mandatory[oldname_('', key)] = r.exact;
        } else {
          ['min', 'max'].forEach(function (mix) {
            if (r[mix] !== undefined) {
              cc.mandatory = cc.mandatory || {};
              cc.mandatory[oldname_(mix, key)] = r[mix];
            }
          });
        }
      });

      if (c.advanced) {
        cc.optional = (cc.optional || []).concat(c.advanced);
      }

      return cc;
    };

    var shimConstraints_ = function (constraints, func) {
      if (browserDetails.version >= 61) {
        return func(constraints);
      }

      constraints = JSON.parse(JSON.stringify(constraints));

      if (constraints && typeof constraints.audio === 'object') {
        var remap = function (obj, a, b) {
          if (a in obj && !(b in obj)) {
            obj[b] = obj[a];
            delete obj[a];
          }
        };

        constraints = JSON.parse(JSON.stringify(constraints));
        remap(constraints.audio, 'autoGainControl', 'googAutoGainControl');
        remap(constraints.audio, 'noiseSuppression', 'googNoiseSuppression');
        constraints.audio = constraintsToChrome_(constraints.audio);
      }

      if (constraints && typeof constraints.video === 'object') {
        // Shim facingMode for mobile & surface pro.
        var face = constraints.video.facingMode;
        face = face && (typeof face === 'object' ? face : {
          ideal: face
        });
        var getSupportedFacingModeLies = browserDetails.version < 66;

        if (face && (face.exact === 'user' || face.exact === 'environment' || face.ideal === 'user' || face.ideal === 'environment') && !(navigator.mediaDevices.getSupportedConstraints && navigator.mediaDevices.getSupportedConstraints().facingMode && !getSupportedFacingModeLies)) {
          delete constraints.video.facingMode;
          var matches;

          if (face.exact === 'environment' || face.ideal === 'environment') {
            matches = ['back', 'rear'];
          } else if (face.exact === 'user' || face.ideal === 'user') {
            matches = ['front'];
          }

          if (matches) {
            // Look for matches in label, or use last cam for back (typical).
            return navigator.mediaDevices.enumerateDevices().then(function (devices) {
              devices = devices.filter(function (d) {
                return d.kind === 'videoinput';
              });
              var dev = devices.find(function (d) {
                return matches.some(function (match) {
                  return d.label.toLowerCase().indexOf(match) !== -1;
                });
              });

              if (!dev && devices.length && matches.indexOf('back') !== -1) {
                dev = devices[devices.length - 1]; // more likely the back cam
              }

              if (dev) {
                constraints.video.deviceId = face.exact ? {
                  exact: dev.deviceId
                } : {
                  ideal: dev.deviceId
                };
              }

              constraints.video = constraintsToChrome_(constraints.video);
              logging('chrome: ' + JSON.stringify(constraints));
              return func(constraints);
            });
          }
        }

        constraints.video = constraintsToChrome_(constraints.video);
      }

      logging('chrome: ' + JSON.stringify(constraints));
      return func(constraints);
    };

    var shimError_ = function (e) {
      if (browserDetails.version >= 64) {
        return e;
      }

      return {
        name: {
          PermissionDeniedError: 'NotAllowedError',
          PermissionDismissedError: 'NotAllowedError',
          InvalidStateError: 'NotAllowedError',
          DevicesNotFoundError: 'NotFoundError',
          ConstraintNotSatisfiedError: 'OverconstrainedError',
          TrackStartError: 'NotReadableError',
          MediaDeviceFailedDueToShutdown: 'NotAllowedError',
          MediaDeviceKillSwitchOn: 'NotAllowedError',
          TabCaptureError: 'AbortError',
          ScreenCaptureError: 'AbortError',
          DeviceCaptureError: 'AbortError'
        }[e.name] || e.name,
        message: e.message,
        constraint: e.constraint || e.constraintName,
        toString: function () {
          return this.name + (this.message && ': ') + this.message;
        }
      };
    };

    var getUserMedia_ = function (constraints, onSuccess, onError) {
      shimConstraints_(constraints, function (c) {
        navigator.webkitGetUserMedia(c, onSuccess, function (e) {
          if (onError) {
            onError(shimError_(e));
          }
        });
      });
    };

    navigator.getUserMedia = getUserMedia_; // Returns the result of getUserMedia as a Promise.

    var getUserMediaPromise_ = function (constraints) {
      return new Promise(function (resolve, reject) {
        navigator.getUserMedia(constraints, resolve, reject);
      });
    };

    if (!navigator.mediaDevices) {
      navigator.mediaDevices = {
        getUserMedia: getUserMediaPromise_,
        enumerateDevices: function () {
          return new Promise(function (resolve) {
            var kinds = {
              audio: 'audioinput',
              video: 'videoinput'
            };
            return window.MediaStreamTrack.getSources(function (devices) {
              resolve(devices.map(function (device) {
                return {
                  label: device.label,
                  kind: kinds[device.kind],
                  deviceId: device.id,
                  groupId: ''
                };
              }));
            });
          });
        },
        getSupportedConstraints: function () {
          return {
            deviceId: true,
            echoCancellation: true,
            facingMode: true,
            frameRate: true,
            height: true,
            width: true
          };
        }
      };
    } // A shim for getUserMedia method on the mediaDevices object.
    // TODO(KaptenJansson) remove once implemented in Chrome stable.


    if (!navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia = function (constraints) {
        return getUserMediaPromise_(constraints);
      };
    } else {
      // Even though Chrome 45 has navigator.mediaDevices and a getUserMedia
      // function which returns a Promise, it does not accept spec-style
      // constraints.
      var origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

      navigator.mediaDevices.getUserMedia = function (cs) {
        return shimConstraints_(cs, function (c) {
          return origGetUserMedia(c).then(function (stream) {
            if (c.audio && !stream.getAudioTracks().length || c.video && !stream.getVideoTracks().length) {
              stream.getTracks().forEach(function (track) {
                track.stop();
              });
              throw new DOMException('', 'NotFoundError');
            }

            return stream;
          }, function (e) {
            return Promise.reject(shimError_(e));
          });
        });
      };
    } // Dummy devicechange event methods.
    // TODO(KaptenJansson) remove once implemented in Chrome stable.


    if (typeof navigator.mediaDevices.addEventListener === 'undefined') {
      navigator.mediaDevices.addEventListener = function () {
        logging('Dummy mediaDevices.addEventListener called.');
      };
    }

    if (typeof navigator.mediaDevices.removeEventListener === 'undefined') {
      navigator.mediaDevices.removeEventListener = function () {
        logging('Dummy mediaDevices.removeEventListener called.');
      };
    }
  };

  var logging$1 = utils.log;
  /* iterates the stats graph recursively. */

  function walkStats(stats, base, resultSet) {
    if (!base || resultSet.has(base.id)) {
      return;
    }

    resultSet.set(base.id, base);
    Object.keys(base).forEach(function (name) {
      if (name.endsWith('Id')) {
        walkStats(stats, stats.get(base[name]), resultSet);
      } else if (name.endsWith('Ids')) {
        base[name].forEach(function (id) {
          walkStats(stats, stats.get(id), resultSet);
        });
      }
    });
  }
  /* filter getStats for a sender/receiver track. */


  function filterStats(result, track, outbound) {
    var streamStatsType = outbound ? 'outbound-rtp' : 'inbound-rtp';
    var filteredResult = new Map();

    if (track === null) {
      return filteredResult;
    }

    var trackStats = [];
    result.forEach(function (value) {
      if (value.type === 'track' && value.trackIdentifier === track.id) {
        trackStats.push(value);
      }
    });
    trackStats.forEach(function (trackStat) {
      result.forEach(function (stats) {
        if (stats.type === streamStatsType && stats.trackId === trackStat.id) {
          walkStats(result, stats, filteredResult);
        }
      });
    });
    return filteredResult;
  }

  var chrome_shim = {
    shimGetUserMedia: getusermedia,
    shimMediaStream: function (window) {
      window.MediaStream = window.MediaStream || window.webkitMediaStream;
    },
    shimOnTrack: function (window) {
      if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in window.RTCPeerConnection.prototype)) {
        Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
          get: function () {
            return this._ontrack;
          },
          set: function (f) {
            if (this._ontrack) {
              this.removeEventListener('track', this._ontrack);
            }

            this.addEventListener('track', this._ontrack = f);
          },
          enumerable: true,
          configurable: true
        });
        var origSetRemoteDescription = window.RTCPeerConnection.prototype.setRemoteDescription;

        window.RTCPeerConnection.prototype.setRemoteDescription = function () {
          var pc = this;

          if (!pc._ontrackpoly) {
            pc._ontrackpoly = function (e) {
              // onaddstream does not fire when a track is added to an existing
              // stream. But stream.onaddtrack is implemented so we use that.
              e.stream.addEventListener('addtrack', function (te) {
                var receiver;

                if (window.RTCPeerConnection.prototype.getReceivers) {
                  receiver = pc.getReceivers().find(function (r) {
                    return r.track && r.track.id === te.track.id;
                  });
                } else {
                  receiver = {
                    track: te.track
                  };
                }

                var event = new Event('track');
                event.track = te.track;
                event.receiver = receiver;
                event.transceiver = {
                  receiver: receiver
                };
                event.streams = [e.stream];
                pc.dispatchEvent(event);
              });
              e.stream.getTracks().forEach(function (track) {
                var receiver;

                if (window.RTCPeerConnection.prototype.getReceivers) {
                  receiver = pc.getReceivers().find(function (r) {
                    return r.track && r.track.id === track.id;
                  });
                } else {
                  receiver = {
                    track: track
                  };
                }

                var event = new Event('track');
                event.track = track;
                event.receiver = receiver;
                event.transceiver = {
                  receiver: receiver
                };
                event.streams = [e.stream];
                pc.dispatchEvent(event);
              });
            };

            pc.addEventListener('addstream', pc._ontrackpoly);
          }

          return origSetRemoteDescription.apply(pc, arguments);
        };
      } else {
        // even if RTCRtpTransceiver is in window, it is only used and
        // emitted in unified-plan. Unfortunately this means we need
        // to unconditionally wrap the event.
        utils.wrapPeerConnectionEvent(window, 'track', function (e) {
          if (!e.transceiver) {
            Object.defineProperty(e, 'transceiver', {
              value: {
                receiver: e.receiver
              }
            });
          }

          return e;
        });
      }
    },
    shimGetSendersWithDtmf: function (window) {
      // Overrides addTrack/removeTrack, depends on shimAddTrackRemoveTrack.
      if (typeof window === 'object' && window.RTCPeerConnection && !('getSenders' in window.RTCPeerConnection.prototype) && 'createDTMFSender' in window.RTCPeerConnection.prototype) {
        var shimSenderWithDtmf = function (pc, track) {
          return {
            track: track,

            get dtmf() {
              if (this._dtmf === undefined) {
                if (track.kind === 'audio') {
                  this._dtmf = pc.createDTMFSender(track);
                } else {
                  this._dtmf = null;
                }
              }

              return this._dtmf;
            },

            _pc: pc
          };
        }; // augment addTrack when getSenders is not available.


        if (!window.RTCPeerConnection.prototype.getSenders) {
          window.RTCPeerConnection.prototype.getSenders = function () {
            this._senders = this._senders || [];
            return this._senders.slice(); // return a copy of the internal state.
          };

          var origAddTrack = window.RTCPeerConnection.prototype.addTrack;

          window.RTCPeerConnection.prototype.addTrack = function (track, stream) {
            var pc = this;
            var sender = origAddTrack.apply(pc, arguments);

            if (!sender) {
              sender = shimSenderWithDtmf(pc, track);

              pc._senders.push(sender);
            }

            return sender;
          };

          var origRemoveTrack = window.RTCPeerConnection.prototype.removeTrack;

          window.RTCPeerConnection.prototype.removeTrack = function (sender) {
            var pc = this;
            origRemoveTrack.apply(pc, arguments);

            var idx = pc._senders.indexOf(sender);

            if (idx !== -1) {
              pc._senders.splice(idx, 1);
            }
          };
        }

        var origAddStream = window.RTCPeerConnection.prototype.addStream;

        window.RTCPeerConnection.prototype.addStream = function (stream) {
          var pc = this;
          pc._senders = pc._senders || [];
          origAddStream.apply(pc, [stream]);
          stream.getTracks().forEach(function (track) {
            pc._senders.push(shimSenderWithDtmf(pc, track));
          });
        };

        var origRemoveStream = window.RTCPeerConnection.prototype.removeStream;

        window.RTCPeerConnection.prototype.removeStream = function (stream) {
          var pc = this;
          pc._senders = pc._senders || [];
          origRemoveStream.apply(pc, [stream]);
          stream.getTracks().forEach(function (track) {
            var sender = pc._senders.find(function (s) {
              return s.track === track;
            });

            if (sender) {
              pc._senders.splice(pc._senders.indexOf(sender), 1); // remove sender

            }
          });
        };
      } else if (typeof window === 'object' && window.RTCPeerConnection && 'getSenders' in window.RTCPeerConnection.prototype && 'createDTMFSender' in window.RTCPeerConnection.prototype && window.RTCRtpSender && !('dtmf' in window.RTCRtpSender.prototype)) {
        var origGetSenders = window.RTCPeerConnection.prototype.getSenders;

        window.RTCPeerConnection.prototype.getSenders = function () {
          var pc = this;
          var senders = origGetSenders.apply(pc, []);
          senders.forEach(function (sender) {
            sender._pc = pc;
          });
          return senders;
        };

        Object.defineProperty(window.RTCRtpSender.prototype, 'dtmf', {
          get: function () {
            if (this._dtmf === undefined) {
              if (this.track.kind === 'audio') {
                this._dtmf = this._pc.createDTMFSender(this.track);
              } else {
                this._dtmf = null;
              }
            }

            return this._dtmf;
          }
        });
      }
    },
    shimSenderReceiverGetStats: function (window) {
      if (!(typeof window === 'object' && window.RTCPeerConnection && window.RTCRtpSender && window.RTCRtpReceiver)) {
        return;
      } // shim sender stats.


      if (!('getStats' in window.RTCRtpSender.prototype)) {
        var origGetSenders = window.RTCPeerConnection.prototype.getSenders;

        if (origGetSenders) {
          window.RTCPeerConnection.prototype.getSenders = function () {
            var pc = this;
            var senders = origGetSenders.apply(pc, []);
            senders.forEach(function (sender) {
              sender._pc = pc;
            });
            return senders;
          };
        }

        var origAddTrack = window.RTCPeerConnection.prototype.addTrack;

        if (origAddTrack) {
          window.RTCPeerConnection.prototype.addTrack = function () {
            var sender = origAddTrack.apply(this, arguments);
            sender._pc = this;
            return sender;
          };
        }

        window.RTCRtpSender.prototype.getStats = function () {
          var sender = this;
          return this._pc.getStats().then(function (result) {
            /* Note: this will include stats of all senders that
             *   send a track with the same id as sender.track as
             *   it is not possible to identify the RTCRtpSender.
             */
            return filterStats(result, sender.track, true);
          });
        };
      } // shim receiver stats.


      if (!('getStats' in window.RTCRtpReceiver.prototype)) {
        var origGetReceivers = window.RTCPeerConnection.prototype.getReceivers;

        if (origGetReceivers) {
          window.RTCPeerConnection.prototype.getReceivers = function () {
            var pc = this;
            var receivers = origGetReceivers.apply(pc, []);
            receivers.forEach(function (receiver) {
              receiver._pc = pc;
            });
            return receivers;
          };
        }

        utils.wrapPeerConnectionEvent(window, 'track', function (e) {
          e.receiver._pc = e.srcElement;
          return e;
        });

        window.RTCRtpReceiver.prototype.getStats = function () {
          var receiver = this;
          return this._pc.getStats().then(function (result) {
            return filterStats(result, receiver.track, false);
          });
        };
      }

      if (!('getStats' in window.RTCRtpSender.prototype && 'getStats' in window.RTCRtpReceiver.prototype)) {
        return;
      } // shim RTCPeerConnection.getStats(track).


      var origGetStats = window.RTCPeerConnection.prototype.getStats;

      window.RTCPeerConnection.prototype.getStats = function () {
        var pc = this;

        if (arguments.length > 0 && arguments[0] instanceof window.MediaStreamTrack) {
          var track = arguments[0];
          var sender;
          var receiver;
          var err;
          pc.getSenders().forEach(function (s) {
            if (s.track === track) {
              if (sender) {
                err = true;
              } else {
                sender = s;
              }
            }
          });
          pc.getReceivers().forEach(function (r) {
            if (r.track === track) {
              if (receiver) {
                err = true;
              } else {
                receiver = r;
              }
            }

            return r.track === track;
          });

          if (err || sender && receiver) {
            return Promise.reject(new DOMException('There are more than one sender or receiver for the track.', 'InvalidAccessError'));
          } else if (sender) {
            return sender.getStats();
          } else if (receiver) {
            return receiver.getStats();
          }

          return Promise.reject(new DOMException('There is no sender or receiver for the track.', 'InvalidAccessError'));
        }

        return origGetStats.apply(pc, arguments);
      };
    },
    shimSourceObject: function (window) {
      var URL = window && window.URL;

      if (typeof window === 'object') {
        if (window.HTMLMediaElement && !('srcObject' in window.HTMLMediaElement.prototype)) {
          // Shim the srcObject property, once, when HTMLMediaElement is found.
          Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
            get: function () {
              return this._srcObject;
            },
            set: function (stream) {
              var self = this; // Use _srcObject as a private property for this shim

              this._srcObject = stream;

              if (this.src) {
                URL.revokeObjectURL(this.src);
              }

              if (!stream) {
                this.src = '';
                return undefined;
              }

              this.src = URL.createObjectURL(stream); // We need to recreate the blob url when a track is added or
              // removed. Doing it manually since we want to avoid a recursion.

              stream.addEventListener('addtrack', function () {
                if (self.src) {
                  URL.revokeObjectURL(self.src);
                }

                self.src = URL.createObjectURL(stream);
              });
              stream.addEventListener('removetrack', function () {
                if (self.src) {
                  URL.revokeObjectURL(self.src);
                }

                self.src = URL.createObjectURL(stream);
              });
            }
          });
        }
      }
    },
    shimAddTrackRemoveTrackWithNative: function (window) {
      // shim addTrack/removeTrack with native variants in order to make
      // the interactions with legacy getLocalStreams behave as in other browsers.
      // Keeps a mapping stream.id => [stream, rtpsenders...]
      window.RTCPeerConnection.prototype.getLocalStreams = function () {
        var pc = this;
        this._shimmedLocalStreams = this._shimmedLocalStreams || {};
        return Object.keys(this._shimmedLocalStreams).map(function (streamId) {
          return pc._shimmedLocalStreams[streamId][0];
        });
      };

      var origAddTrack = window.RTCPeerConnection.prototype.addTrack;

      window.RTCPeerConnection.prototype.addTrack = function (track, stream) {
        if (!stream) {
          return origAddTrack.apply(this, arguments);
        }

        this._shimmedLocalStreams = this._shimmedLocalStreams || {};
        var sender = origAddTrack.apply(this, arguments);

        if (!this._shimmedLocalStreams[stream.id]) {
          this._shimmedLocalStreams[stream.id] = [stream, sender];
        } else if (this._shimmedLocalStreams[stream.id].indexOf(sender) === -1) {
          this._shimmedLocalStreams[stream.id].push(sender);
        }

        return sender;
      };

      var origAddStream = window.RTCPeerConnection.prototype.addStream;

      window.RTCPeerConnection.prototype.addStream = function (stream) {
        var pc = this;
        this._shimmedLocalStreams = this._shimmedLocalStreams || {};
        stream.getTracks().forEach(function (track) {
          var alreadyExists = pc.getSenders().find(function (s) {
            return s.track === track;
          });

          if (alreadyExists) {
            throw new DOMException('Track already exists.', 'InvalidAccessError');
          }
        });
        var existingSenders = pc.getSenders();
        origAddStream.apply(this, arguments);
        var newSenders = pc.getSenders().filter(function (newSender) {
          return existingSenders.indexOf(newSender) === -1;
        });
        this._shimmedLocalStreams[stream.id] = [stream].concat(newSenders);
      };

      var origRemoveStream = window.RTCPeerConnection.prototype.removeStream;

      window.RTCPeerConnection.prototype.removeStream = function (stream) {
        this._shimmedLocalStreams = this._shimmedLocalStreams || {};
        delete this._shimmedLocalStreams[stream.id];
        return origRemoveStream.apply(this, arguments);
      };

      var origRemoveTrack = window.RTCPeerConnection.prototype.removeTrack;

      window.RTCPeerConnection.prototype.removeTrack = function (sender) {
        var pc = this;
        this._shimmedLocalStreams = this._shimmedLocalStreams || {};

        if (sender) {
          Object.keys(this._shimmedLocalStreams).forEach(function (streamId) {
            var idx = pc._shimmedLocalStreams[streamId].indexOf(sender);

            if (idx !== -1) {
              pc._shimmedLocalStreams[streamId].splice(idx, 1);
            }

            if (pc._shimmedLocalStreams[streamId].length === 1) {
              delete pc._shimmedLocalStreams[streamId];
            }
          });
        }

        return origRemoveTrack.apply(this, arguments);
      };
    },
    shimAddTrackRemoveTrack: function (window) {
      var browserDetails = utils.detectBrowser(window); // shim addTrack and removeTrack.

      if (window.RTCPeerConnection.prototype.addTrack && browserDetails.version >= 65) {
        return this.shimAddTrackRemoveTrackWithNative(window);
      } // also shim pc.getLocalStreams when addTrack is shimmed
      // to return the original streams.


      var origGetLocalStreams = window.RTCPeerConnection.prototype.getLocalStreams;

      window.RTCPeerConnection.prototype.getLocalStreams = function () {
        var pc = this;
        var nativeStreams = origGetLocalStreams.apply(this);
        pc._reverseStreams = pc._reverseStreams || {};
        return nativeStreams.map(function (stream) {
          return pc._reverseStreams[stream.id];
        });
      };

      var origAddStream = window.RTCPeerConnection.prototype.addStream;

      window.RTCPeerConnection.prototype.addStream = function (stream) {
        var pc = this;
        pc._streams = pc._streams || {};
        pc._reverseStreams = pc._reverseStreams || {};
        stream.getTracks().forEach(function (track) {
          var alreadyExists = pc.getSenders().find(function (s) {
            return s.track === track;
          });

          if (alreadyExists) {
            throw new DOMException('Track already exists.', 'InvalidAccessError');
          }
        }); // Add identity mapping for consistency with addTrack.
        // Unless this is being used with a stream from addTrack.

        if (!pc._reverseStreams[stream.id]) {
          var newStream = new window.MediaStream(stream.getTracks());
          pc._streams[stream.id] = newStream;
          pc._reverseStreams[newStream.id] = stream;
          stream = newStream;
        }

        origAddStream.apply(pc, [stream]);
      };

      var origRemoveStream = window.RTCPeerConnection.prototype.removeStream;

      window.RTCPeerConnection.prototype.removeStream = function (stream) {
        var pc = this;
        pc._streams = pc._streams || {};
        pc._reverseStreams = pc._reverseStreams || {};
        origRemoveStream.apply(pc, [pc._streams[stream.id] || stream]);
        delete pc._reverseStreams[pc._streams[stream.id] ? pc._streams[stream.id].id : stream.id];
        delete pc._streams[stream.id];
      };

      window.RTCPeerConnection.prototype.addTrack = function (track, stream) {
        var pc = this;

        if (pc.signalingState === 'closed') {
          throw new DOMException('The RTCPeerConnection\'s signalingState is \'closed\'.', 'InvalidStateError');
        }

        var streams = [].slice.call(arguments, 1);

        if (streams.length !== 1 || !streams[0].getTracks().find(function (t) {
          return t === track;
        })) {
          // this is not fully correct but all we can manage without
          // [[associated MediaStreams]] internal slot.
          throw new DOMException('The adapter.js addTrack polyfill only supports a single ' + ' stream which is associated with the specified track.', 'NotSupportedError');
        }

        var alreadyExists = pc.getSenders().find(function (s) {
          return s.track === track;
        });

        if (alreadyExists) {
          throw new DOMException('Track already exists.', 'InvalidAccessError');
        }

        pc._streams = pc._streams || {};
        pc._reverseStreams = pc._reverseStreams || {};
        var oldStream = pc._streams[stream.id];

        if (oldStream) {
          // this is using odd Chrome behaviour, use with caution:
          // https://bugs.chromium.org/p/webrtc/issues/detail?id=7815
          // Note: we rely on the high-level addTrack/dtmf shim to
          // create the sender with a dtmf sender.
          oldStream.addTrack(track); // Trigger ONN async.

          Promise.resolve().then(function () {
            pc.dispatchEvent(new Event('negotiationneeded'));
          });
        } else {
          var newStream = new window.MediaStream([track]);
          pc._streams[stream.id] = newStream;
          pc._reverseStreams[newStream.id] = stream;
          pc.addStream(newStream);
        }

        return pc.getSenders().find(function (s) {
          return s.track === track;
        });
      }; // replace the internal stream id with the external one and
      // vice versa.


      function replaceInternalStreamId(pc, description) {
        var sdp = description.sdp;
        Object.keys(pc._reverseStreams || []).forEach(function (internalId) {
          var externalStream = pc._reverseStreams[internalId];
          var internalStream = pc._streams[externalStream.id];
          sdp = sdp.replace(new RegExp(internalStream.id, 'g'), externalStream.id);
        });
        return new RTCSessionDescription({
          type: description.type,
          sdp: sdp
        });
      }

      function replaceExternalStreamId(pc, description) {
        var sdp = description.sdp;
        Object.keys(pc._reverseStreams || []).forEach(function (internalId) {
          var externalStream = pc._reverseStreams[internalId];
          var internalStream = pc._streams[externalStream.id];
          sdp = sdp.replace(new RegExp(externalStream.id, 'g'), internalStream.id);
        });
        return new RTCSessionDescription({
          type: description.type,
          sdp: sdp
        });
      }

      ['createOffer', 'createAnswer'].forEach(function (method) {
        var nativeMethod = window.RTCPeerConnection.prototype[method];

        window.RTCPeerConnection.prototype[method] = function () {
          var pc = this;
          var args = arguments;
          var isLegacyCall = arguments.length && typeof arguments[0] === 'function';

          if (isLegacyCall) {
            return nativeMethod.apply(pc, [function (description) {
              var desc = replaceInternalStreamId(pc, description);
              args[0].apply(null, [desc]);
            }, function (err) {
              if (args[1]) {
                args[1].apply(null, [err]);
              }
            }, arguments[2]]);
          }

          return nativeMethod.apply(pc, arguments).then(function (description) {
            return replaceInternalStreamId(pc, description);
          });
        };
      });
      var origSetLocalDescription = window.RTCPeerConnection.prototype.setLocalDescription;

      window.RTCPeerConnection.prototype.setLocalDescription = function () {
        var pc = this;

        if (!arguments.length || !arguments[0].type) {
          return origSetLocalDescription.apply(pc, arguments);
        }

        arguments[0] = replaceExternalStreamId(pc, arguments[0]);
        return origSetLocalDescription.apply(pc, arguments);
      }; // TODO: mangle getStats: https://w3c.github.io/webrtc-stats/#dom-rtcmediastreamstats-streamidentifier


      var origLocalDescription = Object.getOwnPropertyDescriptor(window.RTCPeerConnection.prototype, 'localDescription');
      Object.defineProperty(window.RTCPeerConnection.prototype, 'localDescription', {
        get: function () {
          var pc = this;
          var description = origLocalDescription.get.apply(this);

          if (description.type === '') {
            return description;
          }

          return replaceInternalStreamId(pc, description);
        }
      });

      window.RTCPeerConnection.prototype.removeTrack = function (sender) {
        var pc = this;

        if (pc.signalingState === 'closed') {
          throw new DOMException('The RTCPeerConnection\'s signalingState is \'closed\'.', 'InvalidStateError');
        } // We can not yet check for sender instanceof RTCRtpSender
        // since we shim RTPSender. So we check if sender._pc is set.


        if (!sender._pc) {
          throw new DOMException('Argument 1 of RTCPeerConnection.removeTrack ' + 'does not implement interface RTCRtpSender.', 'TypeError');
        }

        var isLocal = sender._pc === pc;

        if (!isLocal) {
          throw new DOMException('Sender was not created by this connection.', 'InvalidAccessError');
        } // Search for the native stream the senders track belongs to.


        pc._streams = pc._streams || {};
        var stream;
        Object.keys(pc._streams).forEach(function (streamid) {
          var hasTrack = pc._streams[streamid].getTracks().find(function (track) {
            return sender.track === track;
          });

          if (hasTrack) {
            stream = pc._streams[streamid];
          }
        });

        if (stream) {
          if (stream.getTracks().length === 1) {
            // if this is the last track of the stream, remove the stream. This
            // takes care of any shimmed _senders.
            pc.removeStream(pc._reverseStreams[stream.id]);
          } else {
            // relying on the same odd chrome behaviour as above.
            stream.removeTrack(sender.track);
          }

          pc.dispatchEvent(new Event('negotiationneeded'));
        }
      };
    },
    shimPeerConnection: function (window) {
      var browserDetails = utils.detectBrowser(window); // The RTCPeerConnection object.

      if (!window.RTCPeerConnection && window.webkitRTCPeerConnection) {
        window.RTCPeerConnection = function (pcConfig, pcConstraints) {
          // Translate iceTransportPolicy to iceTransports,
          // see https://code.google.com/p/webrtc/issues/detail?id=4869
          // this was fixed in M56 along with unprefixing RTCPeerConnection.
          logging$1('PeerConnection');

          if (pcConfig && pcConfig.iceTransportPolicy) {
            pcConfig.iceTransports = pcConfig.iceTransportPolicy;
          }

          return new window.webkitRTCPeerConnection(pcConfig, pcConstraints);
        };

        window.RTCPeerConnection.prototype = window.webkitRTCPeerConnection.prototype; // wrap static methods. Currently just generateCertificate.

        if (window.webkitRTCPeerConnection.generateCertificate) {
          Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
            get: function () {
              return window.webkitRTCPeerConnection.generateCertificate;
            }
          });
        }
      }

      var origGetStats = window.RTCPeerConnection.prototype.getStats;

      window.RTCPeerConnection.prototype.getStats = function (selector, successCallback, errorCallback) {
        var pc = this;
        var args = arguments; // If selector is a function then we are in the old style stats so just
        // pass back the original getStats format to avoid breaking old users.

        if (arguments.length > 0 && typeof selector === 'function') {
          return origGetStats.apply(this, arguments);
        } // When spec-style getStats is supported, return those when called with
        // either no arguments or the selector argument is null.


        if (origGetStats.length === 0 && (arguments.length === 0 || typeof arguments[0] !== 'function')) {
          return origGetStats.apply(this, []);
        }

        var fixChromeStats_ = function (response) {
          var standardReport = {};
          var reports = response.result();
          reports.forEach(function (report) {
            var standardStats = {
              id: report.id,
              timestamp: report.timestamp,
              type: {
                localcandidate: 'local-candidate',
                remotecandidate: 'remote-candidate'
              }[report.type] || report.type
            };
            report.names().forEach(function (name) {
              standardStats[name] = report.stat(name);
            });
            standardReport[standardStats.id] = standardStats;
          });
          return standardReport;
        }; // shim getStats with maplike support


        var makeMapStats = function (stats) {
          return new Map(Object.keys(stats).map(function (key) {
            return [key, stats[key]];
          }));
        };

        if (arguments.length >= 2) {
          var successCallbackWrapper_ = function (response) {
            args[1](makeMapStats(fixChromeStats_(response)));
          };

          return origGetStats.apply(this, [successCallbackWrapper_, arguments[0]]);
        } // promise-support


        return new Promise(function (resolve, reject) {
          origGetStats.apply(pc, [function (response) {
            resolve(makeMapStats(fixChromeStats_(response)));
          }, reject]);
        }).then(successCallback, errorCallback);
      }; // add promise support -- natively available in Chrome 51


      if (browserDetails.version < 51) {
        ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate'].forEach(function (method) {
          var nativeMethod = window.RTCPeerConnection.prototype[method];

          window.RTCPeerConnection.prototype[method] = function () {
            var args = arguments;
            var pc = this;
            var promise = new Promise(function (resolve, reject) {
              nativeMethod.apply(pc, [args[0], resolve, reject]);
            });

            if (args.length < 2) {
              return promise;
            }

            return promise.then(function () {
              args[1].apply(null, []);
            }, function (err) {
              if (args.length >= 3) {
                args[2].apply(null, [err]);
              }
            });
          };
        });
      } // promise support for createOffer and createAnswer. Available (without
      // bugs) since M52: crbug/619289


      if (browserDetails.version < 52) {
        ['createOffer', 'createAnswer'].forEach(function (method) {
          var nativeMethod = window.RTCPeerConnection.prototype[method];

          window.RTCPeerConnection.prototype[method] = function () {
            var pc = this;

            if (arguments.length < 1 || arguments.length === 1 && typeof arguments[0] === 'object') {
              var opts = arguments.length === 1 ? arguments[0] : undefined;
              return new Promise(function (resolve, reject) {
                nativeMethod.apply(pc, [resolve, reject, opts]);
              });
            }

            return nativeMethod.apply(this, arguments);
          };
        });
      } // shim implicit creation of RTCSessionDescription/RTCIceCandidate


      ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate'].forEach(function (method) {
        var nativeMethod = window.RTCPeerConnection.prototype[method];

        window.RTCPeerConnection.prototype[method] = function () {
          arguments[0] = new (method === 'addIceCandidate' ? window.RTCIceCandidate : window.RTCSessionDescription)(arguments[0]);
          return nativeMethod.apply(this, arguments);
        };
      }); // support for addIceCandidate(null or undefined)

      var nativeAddIceCandidate = window.RTCPeerConnection.prototype.addIceCandidate;

      window.RTCPeerConnection.prototype.addIceCandidate = function () {
        if (!arguments[0]) {
          if (arguments[1]) {
            arguments[1].apply(null);
          }

          return Promise.resolve();
        }

        return nativeAddIceCandidate.apply(this, arguments);
      };
    },
    fixNegotiationNeeded: function (window) {
      utils.wrapPeerConnectionEvent(window, 'negotiationneeded', function (e) {
        var pc = e.target;

        if (pc.signalingState !== 'stable') {
          return;
        }

        return e;
      });
    },
    shimGetDisplayMedia: function (window, getSourceId) {
      if ('getDisplayMedia' in window.navigator) {
        return;
      } // getSourceId is a function that returns a promise resolving with
      // the sourceId of the screen/window/tab to be shared.


      if (typeof getSourceId !== 'function') {
        console.error('shimGetDisplayMedia: getSourceId argument is not ' + 'a function');
        return;
      }

      navigator.getDisplayMedia = function (constraints) {
        return getSourceId(constraints).then(function (sourceId) {
          var widthSpecified = constraints.video && constraints.video.width;
          var heightSpecified = constraints.video && constraints.video.height;
          var frameRateSpecified = constraints.video && constraints.video.frameRate;
          constraints.video = {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId,
              maxFrameRate: frameRateSpecified || 3
            }
          };

          if (widthSpecified) {
            constraints.video.mandatory.maxWidth = widthSpecified;
          }

          if (heightSpecified) {
            constraints.video.mandatory.maxHeight = heightSpecified;
          }

          return navigator.mediaDevices.getUserMedia(constraints);
        });
      };
    }
  };

  // 1) stun: filtered after 14393 unless ?transport=udp is present
  // 2) turn: that does not have all of turn:host:port?transport=udp
  // 3) turn: with ipv6 addresses
  // 4) turn: occurring muliple times


  var filtericeservers = function (iceServers, edgeVersion) {
    var hasTurn = false;
    iceServers = JSON.parse(JSON.stringify(iceServers));
    return iceServers.filter(function (server) {
      if (server && (server.urls || server.url)) {
        var urls = server.urls || server.url;

        if (server.url && !server.urls) {
          utils.deprecated('RTCIceServer.url', 'RTCIceServer.urls');
        }

        var isString = typeof urls === 'string';

        if (isString) {
          urls = [urls];
        }

        urls = urls.filter(function (url) {
          var validTurn = url.indexOf('turn:') === 0 && url.indexOf('transport=udp') !== -1 && url.indexOf('turn:[') === -1 && !hasTurn;

          if (validTurn) {
            hasTurn = true;
            return true;
          }

          return url.indexOf('stun:') === 0 && edgeVersion >= 14393 && url.indexOf('?transport=udp') === -1;
        });
        delete server.url;
        server.urls = isString ? urls[0] : urls;
        return !!urls.length;
      }
    });
  };

  var sdp = createCommonjsModule(function (module) {

    var SDPUtils = {}; // Generate an alphanumeric identifier for cname or mids.
    // TODO: use UUIDs instead? https://gist.github.com/jed/982883

    SDPUtils.generateIdentifier = function () {
      return Math.random().toString(36).substr(2, 10);
    }; // The RTCP CNAME used by all peerconnections from the same JS.


    SDPUtils.localCName = SDPUtils.generateIdentifier(); // Splits SDP into lines, dealing with both CRLF and LF.

    SDPUtils.splitLines = function (blob) {
      return blob.trim().split('\n').map(function (line) {
        return line.trim();
      });
    }; // Splits SDP into sessionpart and mediasections. Ensures CRLF.


    SDPUtils.splitSections = function (blob) {
      var parts = blob.split('\nm=');
      return parts.map(function (part, index) {
        return (index > 0 ? 'm=' + part : part).trim() + '\r\n';
      });
    }; // returns the session description.


    SDPUtils.getDescription = function (blob) {
      var sections = SDPUtils.splitSections(blob);
      return sections && sections[0];
    }; // returns the individual media sections.


    SDPUtils.getMediaSections = function (blob) {
      var sections = SDPUtils.splitSections(blob);
      sections.shift();
      return sections;
    }; // Returns lines that start with a certain prefix.


    SDPUtils.matchPrefix = function (blob, prefix) {
      return SDPUtils.splitLines(blob).filter(function (line) {
        return line.indexOf(prefix) === 0;
      });
    }; // Parses an ICE candidate line. Sample input:
    // candidate:702786350 2 udp 41819902 8.8.8.8 60769 typ relay raddr 8.8.8.8
    // rport 55996"


    SDPUtils.parseCandidate = function (line) {
      var parts; // Parse both variants.

      if (line.indexOf('a=candidate:') === 0) {
        parts = line.substring(12).split(' ');
      } else {
        parts = line.substring(10).split(' ');
      }

      var candidate = {
        foundation: parts[0],
        component: parseInt(parts[1], 10),
        protocol: parts[2].toLowerCase(),
        priority: parseInt(parts[3], 10),
        ip: parts[4],
        address: parts[4],
        // address is an alias for ip.
        port: parseInt(parts[5], 10),
        // skip parts[6] == 'typ'
        type: parts[7]
      };

      for (var i = 8; i < parts.length; i += 2) {
        switch (parts[i]) {
          case 'raddr':
            candidate.relatedAddress = parts[i + 1];
            break;

          case 'rport':
            candidate.relatedPort = parseInt(parts[i + 1], 10);
            break;

          case 'tcptype':
            candidate.tcpType = parts[i + 1];
            break;

          case 'ufrag':
            candidate.ufrag = parts[i + 1]; // for backward compability.

            candidate.usernameFragment = parts[i + 1];
            break;

          default:
            // extension handling, in particular ufrag
            candidate[parts[i]] = parts[i + 1];
            break;
        }
      }

      return candidate;
    }; // Translates a candidate object into SDP candidate attribute.


    SDPUtils.writeCandidate = function (candidate) {
      var sdp = [];
      sdp.push(candidate.foundation);
      sdp.push(candidate.component);
      sdp.push(candidate.protocol.toUpperCase());
      sdp.push(candidate.priority);
      sdp.push(candidate.address || candidate.ip);
      sdp.push(candidate.port);
      var type = candidate.type;
      sdp.push('typ');
      sdp.push(type);

      if (type !== 'host' && candidate.relatedAddress && candidate.relatedPort) {
        sdp.push('raddr');
        sdp.push(candidate.relatedAddress);
        sdp.push('rport');
        sdp.push(candidate.relatedPort);
      }

      if (candidate.tcpType && candidate.protocol.toLowerCase() === 'tcp') {
        sdp.push('tcptype');
        sdp.push(candidate.tcpType);
      }

      if (candidate.usernameFragment || candidate.ufrag) {
        sdp.push('ufrag');
        sdp.push(candidate.usernameFragment || candidate.ufrag);
      }

      return 'candidate:' + sdp.join(' ');
    }; // Parses an ice-options line, returns an array of option tags.
    // a=ice-options:foo bar


    SDPUtils.parseIceOptions = function (line) {
      return line.substr(14).split(' ');
    }; // Parses an rtpmap line, returns RTCRtpCoddecParameters. Sample input:
    // a=rtpmap:111 opus/48000/2


    SDPUtils.parseRtpMap = function (line) {
      var parts = line.substr(9).split(' ');
      var parsed = {
        payloadType: parseInt(parts.shift(), 10) // was: id

      };
      parts = parts[0].split('/');
      parsed.name = parts[0];
      parsed.clockRate = parseInt(parts[1], 10); // was: clockrate

      parsed.channels = parts.length === 3 ? parseInt(parts[2], 10) : 1; // legacy alias, got renamed back to channels in ORTC.

      parsed.numChannels = parsed.channels;
      return parsed;
    }; // Generate an a=rtpmap line from RTCRtpCodecCapability or
    // RTCRtpCodecParameters.


    SDPUtils.writeRtpMap = function (codec) {
      var pt = codec.payloadType;

      if (codec.preferredPayloadType !== undefined) {
        pt = codec.preferredPayloadType;
      }

      var channels = codec.channels || codec.numChannels || 1;
      return 'a=rtpmap:' + pt + ' ' + codec.name + '/' + codec.clockRate + (channels !== 1 ? '/' + channels : '') + '\r\n';
    }; // Parses an a=extmap line (headerextension from RFC 5285). Sample input:
    // a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
    // a=extmap:2/sendonly urn:ietf:params:rtp-hdrext:toffset


    SDPUtils.parseExtmap = function (line) {
      var parts = line.substr(9).split(' ');
      return {
        id: parseInt(parts[0], 10),
        direction: parts[0].indexOf('/') > 0 ? parts[0].split('/')[1] : 'sendrecv',
        uri: parts[1]
      };
    }; // Generates a=extmap line from RTCRtpHeaderExtensionParameters or
    // RTCRtpHeaderExtension.


    SDPUtils.writeExtmap = function (headerExtension) {
      return 'a=extmap:' + (headerExtension.id || headerExtension.preferredId) + (headerExtension.direction && headerExtension.direction !== 'sendrecv' ? '/' + headerExtension.direction : '') + ' ' + headerExtension.uri + '\r\n';
    }; // Parses an ftmp line, returns dictionary. Sample input:
    // a=fmtp:96 vbr=on;cng=on
    // Also deals with vbr=on; cng=on


    SDPUtils.parseFmtp = function (line) {
      var parsed = {};
      var kv;
      var parts = line.substr(line.indexOf(' ') + 1).split(';');

      for (var j = 0; j < parts.length; j++) {
        kv = parts[j].trim().split('=');
        parsed[kv[0].trim()] = kv[1];
      }

      return parsed;
    }; // Generates an a=ftmp line from RTCRtpCodecCapability or RTCRtpCodecParameters.


    SDPUtils.writeFmtp = function (codec) {
      var line = '';
      var pt = codec.payloadType;

      if (codec.preferredPayloadType !== undefined) {
        pt = codec.preferredPayloadType;
      }

      if (codec.parameters && Object.keys(codec.parameters).length) {
        var params = [];
        Object.keys(codec.parameters).forEach(function (param) {
          if (codec.parameters[param]) {
            params.push(param + '=' + codec.parameters[param]);
          } else {
            params.push(param);
          }
        });
        line += 'a=fmtp:' + pt + ' ' + params.join(';') + '\r\n';
      }

      return line;
    }; // Parses an rtcp-fb line, returns RTCPRtcpFeedback object. Sample input:
    // a=rtcp-fb:98 nack rpsi


    SDPUtils.parseRtcpFb = function (line) {
      var parts = line.substr(line.indexOf(' ') + 1).split(' ');
      return {
        type: parts.shift(),
        parameter: parts.join(' ')
      };
    }; // Generate a=rtcp-fb lines from RTCRtpCodecCapability or RTCRtpCodecParameters.


    SDPUtils.writeRtcpFb = function (codec) {
      var lines = '';
      var pt = codec.payloadType;

      if (codec.preferredPayloadType !== undefined) {
        pt = codec.preferredPayloadType;
      }

      if (codec.rtcpFeedback && codec.rtcpFeedback.length) {
        // FIXME: special handling for trr-int?
        codec.rtcpFeedback.forEach(function (fb) {
          lines += 'a=rtcp-fb:' + pt + ' ' + fb.type + (fb.parameter && fb.parameter.length ? ' ' + fb.parameter : '') + '\r\n';
        });
      }

      return lines;
    }; // Parses an RFC 5576 ssrc media attribute. Sample input:
    // a=ssrc:3735928559 cname:something


    SDPUtils.parseSsrcMedia = function (line) {
      var sp = line.indexOf(' ');
      var parts = {
        ssrc: parseInt(line.substr(7, sp - 7), 10)
      };
      var colon = line.indexOf(':', sp);

      if (colon > -1) {
        parts.attribute = line.substr(sp + 1, colon - sp - 1);
        parts.value = line.substr(colon + 1);
      } else {
        parts.attribute = line.substr(sp + 1);
      }

      return parts;
    };

    SDPUtils.parseSsrcGroup = function (line) {
      var parts = line.substr(13).split(' ');
      return {
        semantics: parts.shift(),
        ssrcs: parts.map(function (ssrc) {
          return parseInt(ssrc, 10);
        })
      };
    }; // Extracts the MID (RFC 5888) from a media section.
    // returns the MID or undefined if no mid line was found.


    SDPUtils.getMid = function (mediaSection) {
      var mid = SDPUtils.matchPrefix(mediaSection, 'a=mid:')[0];

      if (mid) {
        return mid.substr(6);
      }
    };

    SDPUtils.parseFingerprint = function (line) {
      var parts = line.substr(14).split(' ');
      return {
        algorithm: parts[0].toLowerCase(),
        // algorithm is case-sensitive in Edge.
        value: parts[1]
      };
    }; // Extracts DTLS parameters from SDP media section or sessionpart.
    // FIXME: for consistency with other functions this should only
    //   get the fingerprint line as input. See also getIceParameters.


    SDPUtils.getDtlsParameters = function (mediaSection, sessionpart) {
      var lines = SDPUtils.matchPrefix(mediaSection + sessionpart, 'a=fingerprint:'); // Note: a=setup line is ignored since we use the 'auto' role.
      // Note2: 'algorithm' is not case sensitive except in Edge.

      return {
        role: 'auto',
        fingerprints: lines.map(SDPUtils.parseFingerprint)
      };
    }; // Serializes DTLS parameters to SDP.


    SDPUtils.writeDtlsParameters = function (params, setupType) {
      var sdp = 'a=setup:' + setupType + '\r\n';
      params.fingerprints.forEach(function (fp) {
        sdp += 'a=fingerprint:' + fp.algorithm + ' ' + fp.value + '\r\n';
      });
      return sdp;
    }; // Parses ICE information from SDP media section or sessionpart.
    // FIXME: for consistency with other functions this should only
    //   get the ice-ufrag and ice-pwd lines as input.


    SDPUtils.getIceParameters = function (mediaSection, sessionpart) {
      var lines = SDPUtils.splitLines(mediaSection); // Search in session part, too.

      lines = lines.concat(SDPUtils.splitLines(sessionpart));
      var iceParameters = {
        usernameFragment: lines.filter(function (line) {
          return line.indexOf('a=ice-ufrag:') === 0;
        })[0].substr(12),
        password: lines.filter(function (line) {
          return line.indexOf('a=ice-pwd:') === 0;
        })[0].substr(10)
      };
      return iceParameters;
    }; // Serializes ICE parameters to SDP.


    SDPUtils.writeIceParameters = function (params) {
      return 'a=ice-ufrag:' + params.usernameFragment + '\r\n' + 'a=ice-pwd:' + params.password + '\r\n';
    }; // Parses the SDP media section and returns RTCRtpParameters.


    SDPUtils.parseRtpParameters = function (mediaSection) {
      var description = {
        codecs: [],
        headerExtensions: [],
        fecMechanisms: [],
        rtcp: []
      };
      var lines = SDPUtils.splitLines(mediaSection);
      var mline = lines[0].split(' ');

      for (var i = 3; i < mline.length; i++) {
        // find all codecs from mline[3..]
        var pt = mline[i];
        var rtpmapline = SDPUtils.matchPrefix(mediaSection, 'a=rtpmap:' + pt + ' ')[0];

        if (rtpmapline) {
          var codec = SDPUtils.parseRtpMap(rtpmapline);
          var fmtps = SDPUtils.matchPrefix(mediaSection, 'a=fmtp:' + pt + ' '); // Only the first a=fmtp:<pt> is considered.

          codec.parameters = fmtps.length ? SDPUtils.parseFmtp(fmtps[0]) : {};
          codec.rtcpFeedback = SDPUtils.matchPrefix(mediaSection, 'a=rtcp-fb:' + pt + ' ').map(SDPUtils.parseRtcpFb);
          description.codecs.push(codec); // parse FEC mechanisms from rtpmap lines.

          switch (codec.name.toUpperCase()) {
            case 'RED':
            case 'ULPFEC':
              description.fecMechanisms.push(codec.name.toUpperCase());
              break;

            default:
              // only RED and ULPFEC are recognized as FEC mechanisms.
              break;
          }
        }
      }

      SDPUtils.matchPrefix(mediaSection, 'a=extmap:').forEach(function (line) {
        description.headerExtensions.push(SDPUtils.parseExtmap(line));
      }); // FIXME: parse rtcp.

      return description;
    }; // Generates parts of the SDP media section describing the capabilities /
    // parameters.


    SDPUtils.writeRtpDescription = function (kind, caps) {
      var sdp = ''; // Build the mline.

      sdp += 'm=' + kind + ' ';
      sdp += caps.codecs.length > 0 ? '9' : '0'; // reject if no codecs.

      sdp += ' UDP/TLS/RTP/SAVPF ';
      sdp += caps.codecs.map(function (codec) {
        if (codec.preferredPayloadType !== undefined) {
          return codec.preferredPayloadType;
        }

        return codec.payloadType;
      }).join(' ') + '\r\n';
      sdp += 'c=IN IP4 0.0.0.0\r\n';
      sdp += 'a=rtcp:9 IN IP4 0.0.0.0\r\n'; // Add a=rtpmap lines for each codec. Also fmtp and rtcp-fb.

      caps.codecs.forEach(function (codec) {
        sdp += SDPUtils.writeRtpMap(codec);
        sdp += SDPUtils.writeFmtp(codec);
        sdp += SDPUtils.writeRtcpFb(codec);
      });
      var maxptime = 0;
      caps.codecs.forEach(function (codec) {
        if (codec.maxptime > maxptime) {
          maxptime = codec.maxptime;
        }
      });

      if (maxptime > 0) {
        sdp += 'a=maxptime:' + maxptime + '\r\n';
      }

      sdp += 'a=rtcp-mux\r\n';

      if (caps.headerExtensions) {
        caps.headerExtensions.forEach(function (extension) {
          sdp += SDPUtils.writeExtmap(extension);
        });
      } // FIXME: write fecMechanisms.


      return sdp;
    }; // Parses the SDP media section and returns an array of
    // RTCRtpEncodingParameters.


    SDPUtils.parseRtpEncodingParameters = function (mediaSection) {
      var encodingParameters = [];
      var description = SDPUtils.parseRtpParameters(mediaSection);
      var hasRed = description.fecMechanisms.indexOf('RED') !== -1;
      var hasUlpfec = description.fecMechanisms.indexOf('ULPFEC') !== -1; // filter a=ssrc:... cname:, ignore PlanB-msid

      var ssrcs = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:').map(function (line) {
        return SDPUtils.parseSsrcMedia(line);
      }).filter(function (parts) {
        return parts.attribute === 'cname';
      });
      var primarySsrc = ssrcs.length > 0 && ssrcs[0].ssrc;
      var secondarySsrc;
      var flows = SDPUtils.matchPrefix(mediaSection, 'a=ssrc-group:FID').map(function (line) {
        var parts = line.substr(17).split(' ');
        return parts.map(function (part) {
          return parseInt(part, 10);
        });
      });

      if (flows.length > 0 && flows[0].length > 1 && flows[0][0] === primarySsrc) {
        secondarySsrc = flows[0][1];
      }

      description.codecs.forEach(function (codec) {
        if (codec.name.toUpperCase() === 'RTX' && codec.parameters.apt) {
          var encParam = {
            ssrc: primarySsrc,
            codecPayloadType: parseInt(codec.parameters.apt, 10)
          };

          if (primarySsrc && secondarySsrc) {
            encParam.rtx = {
              ssrc: secondarySsrc
            };
          }

          encodingParameters.push(encParam);

          if (hasRed) {
            encParam = JSON.parse(JSON.stringify(encParam));
            encParam.fec = {
              ssrc: primarySsrc,
              mechanism: hasUlpfec ? 'red+ulpfec' : 'red'
            };
            encodingParameters.push(encParam);
          }
        }
      });

      if (encodingParameters.length === 0 && primarySsrc) {
        encodingParameters.push({
          ssrc: primarySsrc
        });
      } // we support both b=AS and b=TIAS but interpret AS as TIAS.


      var bandwidth = SDPUtils.matchPrefix(mediaSection, 'b=');

      if (bandwidth.length) {
        if (bandwidth[0].indexOf('b=TIAS:') === 0) {
          bandwidth = parseInt(bandwidth[0].substr(7), 10);
        } else if (bandwidth[0].indexOf('b=AS:') === 0) {
          // use formula from JSEP to convert b=AS to TIAS value.
          bandwidth = parseInt(bandwidth[0].substr(5), 10) * 1000 * 0.95 - 50 * 40 * 8;
        } else {
          bandwidth = undefined;
        }

        encodingParameters.forEach(function (params) {
          params.maxBitrate = bandwidth;
        });
      }

      return encodingParameters;
    }; // parses http://draft.ortc.org/#rtcrtcpparameters*


    SDPUtils.parseRtcpParameters = function (mediaSection) {
      var rtcpParameters = {}; // Gets the first SSRC. Note tha with RTX there might be multiple
      // SSRCs.

      var remoteSsrc = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:').map(function (line) {
        return SDPUtils.parseSsrcMedia(line);
      }).filter(function (obj) {
        return obj.attribute === 'cname';
      })[0];

      if (remoteSsrc) {
        rtcpParameters.cname = remoteSsrc.value;
        rtcpParameters.ssrc = remoteSsrc.ssrc;
      } // Edge uses the compound attribute instead of reducedSize
      // compound is !reducedSize


      var rsize = SDPUtils.matchPrefix(mediaSection, 'a=rtcp-rsize');
      rtcpParameters.reducedSize = rsize.length > 0;
      rtcpParameters.compound = rsize.length === 0; // parses the rtcp-mux attrіbute.
      // Note that Edge does not support unmuxed RTCP.

      var mux = SDPUtils.matchPrefix(mediaSection, 'a=rtcp-mux');
      rtcpParameters.mux = mux.length > 0;
      return rtcpParameters;
    }; // parses either a=msid: or a=ssrc:... msid lines and returns
    // the id of the MediaStream and MediaStreamTrack.


    SDPUtils.parseMsid = function (mediaSection) {
      var parts;
      var spec = SDPUtils.matchPrefix(mediaSection, 'a=msid:');

      if (spec.length === 1) {
        parts = spec[0].substr(7).split(' ');
        return {
          stream: parts[0],
          track: parts[1]
        };
      }

      var planB = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:').map(function (line) {
        return SDPUtils.parseSsrcMedia(line);
      }).filter(function (msidParts) {
        return msidParts.attribute === 'msid';
      });

      if (planB.length > 0) {
        parts = planB[0].value.split(' ');
        return {
          stream: parts[0],
          track: parts[1]
        };
      }
    }; // Generate a session ID for SDP.
    // https://tools.ietf.org/html/draft-ietf-rtcweb-jsep-20#section-5.2.1
    // recommends using a cryptographically random +ve 64-bit value
    // but right now this should be acceptable and within the right range


    SDPUtils.generateSessionId = function () {
      return Math.random().toString().substr(2, 21);
    }; // Write boilder plate for start of SDP
    // sessId argument is optional - if not supplied it will
    // be generated randomly
    // sessVersion is optional and defaults to 2
    // sessUser is optional and defaults to 'thisisadapterortc'


    SDPUtils.writeSessionBoilerplate = function (sessId, sessVer, sessUser) {
      var sessionId;
      var version = sessVer !== undefined ? sessVer : 2;

      if (sessId) {
        sessionId = sessId;
      } else {
        sessionId = SDPUtils.generateSessionId();
      }

      var user = sessUser || 'thisisadapterortc'; // FIXME: sess-id should be an NTP timestamp.

      return 'v=0\r\n' + 'o=' + user + ' ' + sessionId + ' ' + version + ' IN IP4 127.0.0.1\r\n' + 's=-\r\n' + 't=0 0\r\n';
    };

    SDPUtils.writeMediaSection = function (transceiver, caps, type, stream) {
      var sdp = SDPUtils.writeRtpDescription(transceiver.kind, caps); // Map ICE parameters (ufrag, pwd) to SDP.

      sdp += SDPUtils.writeIceParameters(transceiver.iceGatherer.getLocalParameters()); // Map DTLS parameters to SDP.

      sdp += SDPUtils.writeDtlsParameters(transceiver.dtlsTransport.getLocalParameters(), type === 'offer' ? 'actpass' : 'active');
      sdp += 'a=mid:' + transceiver.mid + '\r\n';

      if (transceiver.direction) {
        sdp += 'a=' + transceiver.direction + '\r\n';
      } else if (transceiver.rtpSender && transceiver.rtpReceiver) {
        sdp += 'a=sendrecv\r\n';
      } else if (transceiver.rtpSender) {
        sdp += 'a=sendonly\r\n';
      } else if (transceiver.rtpReceiver) {
        sdp += 'a=recvonly\r\n';
      } else {
        sdp += 'a=inactive\r\n';
      }

      if (transceiver.rtpSender) {
        // spec.
        var msid = 'msid:' + stream.id + ' ' + transceiver.rtpSender.track.id + '\r\n';
        sdp += 'a=' + msid; // for Chrome.

        sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc + ' ' + msid;

        if (transceiver.sendEncodingParameters[0].rtx) {
          sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc + ' ' + msid;
          sdp += 'a=ssrc-group:FID ' + transceiver.sendEncodingParameters[0].ssrc + ' ' + transceiver.sendEncodingParameters[0].rtx.ssrc + '\r\n';
        }
      } // FIXME: this should be written by writeRtpDescription.


      sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc + ' cname:' + SDPUtils.localCName + '\r\n';

      if (transceiver.rtpSender && transceiver.sendEncodingParameters[0].rtx) {
        sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc + ' cname:' + SDPUtils.localCName + '\r\n';
      }

      return sdp;
    }; // Gets the direction from the mediaSection or the sessionpart.


    SDPUtils.getDirection = function (mediaSection, sessionpart) {
      // Look for sendrecv, sendonly, recvonly, inactive, default to sendrecv.
      var lines = SDPUtils.splitLines(mediaSection);

      for (var i = 0; i < lines.length; i++) {
        switch (lines[i]) {
          case 'a=sendrecv':
          case 'a=sendonly':
          case 'a=recvonly':
          case 'a=inactive':
            return lines[i].substr(2);

          default: // FIXME: What should happen here?

        }
      }

      if (sessionpart) {
        return SDPUtils.getDirection(sessionpart);
      }

      return 'sendrecv';
    };

    SDPUtils.getKind = function (mediaSection) {
      var lines = SDPUtils.splitLines(mediaSection);
      var mline = lines[0].split(' ');
      return mline[0].substr(2);
    };

    SDPUtils.isRejected = function (mediaSection) {
      return mediaSection.split(' ', 2)[1] === '0';
    };

    SDPUtils.parseMLine = function (mediaSection) {
      var lines = SDPUtils.splitLines(mediaSection);
      var parts = lines[0].substr(2).split(' ');
      return {
        kind: parts[0],
        port: parseInt(parts[1], 10),
        protocol: parts[2],
        fmt: parts.slice(3).join(' ')
      };
    };

    SDPUtils.parseOLine = function (mediaSection) {
      var line = SDPUtils.matchPrefix(mediaSection, 'o=')[0];
      var parts = line.substr(2).split(' ');
      return {
        username: parts[0],
        sessionId: parts[1],
        sessionVersion: parseInt(parts[2], 10),
        netType: parts[3],
        addressType: parts[4],
        address: parts[5]
      };
    }; // a very naive interpretation of a valid SDP.


    SDPUtils.isValidSDP = function (blob) {
      if (typeof blob !== 'string' || blob.length === 0) {
        return false;
      }

      var lines = SDPUtils.splitLines(blob);

      for (var i = 0; i < lines.length; i++) {
        if (lines[i].length < 2 || lines[i].charAt(1) !== '=') {
          return false;
        } // TODO: check the modifier a bit more.

      }

      return true;
    }; // Expose public methods.


    {
      module.exports = SDPUtils;
    }
  });

  function fixStatsType(stat) {
    return {
      inboundrtp: 'inbound-rtp',
      outboundrtp: 'outbound-rtp',
      candidatepair: 'candidate-pair',
      localcandidate: 'local-candidate',
      remotecandidate: 'remote-candidate'
    }[stat.type] || stat.type;
  }

  function writeMediaSection(transceiver, caps, type, stream, dtlsRole) {
    var sdp$$1 = sdp.writeRtpDescription(transceiver.kind, caps); // Map ICE parameters (ufrag, pwd) to SDP.

    sdp$$1 += sdp.writeIceParameters(transceiver.iceGatherer.getLocalParameters()); // Map DTLS parameters to SDP.

    sdp$$1 += sdp.writeDtlsParameters(transceiver.dtlsTransport.getLocalParameters(), type === 'offer' ? 'actpass' : dtlsRole || 'active');
    sdp$$1 += 'a=mid:' + transceiver.mid + '\r\n';

    if (transceiver.rtpSender && transceiver.rtpReceiver) {
      sdp$$1 += 'a=sendrecv\r\n';
    } else if (transceiver.rtpSender) {
      sdp$$1 += 'a=sendonly\r\n';
    } else if (transceiver.rtpReceiver) {
      sdp$$1 += 'a=recvonly\r\n';
    } else {
      sdp$$1 += 'a=inactive\r\n';
    }

    if (transceiver.rtpSender) {
      var trackId = transceiver.rtpSender._initialTrackId || transceiver.rtpSender.track.id;
      transceiver.rtpSender._initialTrackId = trackId; // spec.

      var msid = 'msid:' + (stream ? stream.id : '-') + ' ' + trackId + '\r\n';
      sdp$$1 += 'a=' + msid; // for Chrome. Legacy should no longer be required.

      sdp$$1 += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc + ' ' + msid; // RTX

      if (transceiver.sendEncodingParameters[0].rtx) {
        sdp$$1 += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc + ' ' + msid;
        sdp$$1 += 'a=ssrc-group:FID ' + transceiver.sendEncodingParameters[0].ssrc + ' ' + transceiver.sendEncodingParameters[0].rtx.ssrc + '\r\n';
      }
    } // FIXME: this should be written by writeRtpDescription.


    sdp$$1 += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc + ' cname:' + sdp.localCName + '\r\n';

    if (transceiver.rtpSender && transceiver.sendEncodingParameters[0].rtx) {
      sdp$$1 += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc + ' cname:' + sdp.localCName + '\r\n';
    }

    return sdp$$1;
  } // Edge does not like
  // 1) stun: filtered after 14393 unless ?transport=udp is present
  // 2) turn: that does not have all of turn:host:port?transport=udp
  // 3) turn: with ipv6 addresses
  // 4) turn: occurring muliple times


  function filterIceServers(iceServers, edgeVersion) {
    var hasTurn = false;
    iceServers = JSON.parse(JSON.stringify(iceServers));
    return iceServers.filter(function (server) {
      if (server && (server.urls || server.url)) {
        var urls = server.urls || server.url;

        if (server.url && !server.urls) {
          console.warn('RTCIceServer.url is deprecated! Use urls instead.');
        }

        var isString = typeof urls === 'string';

        if (isString) {
          urls = [urls];
        }

        urls = urls.filter(function (url) {
          var validTurn = url.indexOf('turn:') === 0 && url.indexOf('transport=udp') !== -1 && url.indexOf('turn:[') === -1 && !hasTurn;

          if (validTurn) {
            hasTurn = true;
            return true;
          }

          return url.indexOf('stun:') === 0 && edgeVersion >= 14393 && url.indexOf('?transport=udp') === -1;
        });
        delete server.url;
        server.urls = isString ? urls[0] : urls;
        return !!urls.length;
      }
    });
  } // Determines the intersection of local and remote capabilities.


  function getCommonCapabilities(localCapabilities, remoteCapabilities) {
    var commonCapabilities = {
      codecs: [],
      headerExtensions: [],
      fecMechanisms: []
    };

    var findCodecByPayloadType = function (pt, codecs) {
      pt = parseInt(pt, 10);

      for (var i = 0; i < codecs.length; i++) {
        if (codecs[i].payloadType === pt || codecs[i].preferredPayloadType === pt) {
          return codecs[i];
        }
      }
    };

    var rtxCapabilityMatches = function (lRtx, rRtx, lCodecs, rCodecs) {
      var lCodec = findCodecByPayloadType(lRtx.parameters.apt, lCodecs);
      var rCodec = findCodecByPayloadType(rRtx.parameters.apt, rCodecs);
      return lCodec && rCodec && lCodec.name.toLowerCase() === rCodec.name.toLowerCase();
    };

    localCapabilities.codecs.forEach(function (lCodec) {
      for (var i = 0; i < remoteCapabilities.codecs.length; i++) {
        var rCodec = remoteCapabilities.codecs[i];

        if (lCodec.name.toLowerCase() === rCodec.name.toLowerCase() && lCodec.clockRate === rCodec.clockRate) {
          if (lCodec.name.toLowerCase() === 'rtx' && lCodec.parameters && rCodec.parameters.apt) {
            // for RTX we need to find the local rtx that has a apt
            // which points to the same local codec as the remote one.
            if (!rtxCapabilityMatches(lCodec, rCodec, localCapabilities.codecs, remoteCapabilities.codecs)) {
              continue;
            }
          }

          rCodec = JSON.parse(JSON.stringify(rCodec)); // deepcopy
          // number of channels is the highest common number of channels

          rCodec.numChannels = Math.min(lCodec.numChannels, rCodec.numChannels); // push rCodec so we reply with offerer payload type

          commonCapabilities.codecs.push(rCodec); // determine common feedback mechanisms

          rCodec.rtcpFeedback = rCodec.rtcpFeedback.filter(function (fb) {
            for (var j = 0; j < lCodec.rtcpFeedback.length; j++) {
              if (lCodec.rtcpFeedback[j].type === fb.type && lCodec.rtcpFeedback[j].parameter === fb.parameter) {
                return true;
              }
            }

            return false;
          }); // FIXME: also need to determine .parameters
          //  see https://github.com/openpeer/ortc/issues/569

          break;
        }
      }
    });
    localCapabilities.headerExtensions.forEach(function (lHeaderExtension) {
      for (var i = 0; i < remoteCapabilities.headerExtensions.length; i++) {
        var rHeaderExtension = remoteCapabilities.headerExtensions[i];

        if (lHeaderExtension.uri === rHeaderExtension.uri) {
          commonCapabilities.headerExtensions.push(rHeaderExtension);
          break;
        }
      }
    }); // FIXME: fecMechanisms

    return commonCapabilities;
  } // is action=setLocalDescription with type allowed in signalingState


  function isActionAllowedInSignalingState(action, type, signalingState) {
    return {
      offer: {
        setLocalDescription: ['stable', 'have-local-offer'],
        setRemoteDescription: ['stable', 'have-remote-offer']
      },
      answer: {
        setLocalDescription: ['have-remote-offer', 'have-local-pranswer'],
        setRemoteDescription: ['have-local-offer', 'have-remote-pranswer']
      }
    }[type][action].indexOf(signalingState) !== -1;
  }

  function maybeAddCandidate(iceTransport, candidate) {
    // Edge's internal representation adds some fields therefore
    // not all fieldѕ are taken into account.
    var alreadyAdded = iceTransport.getRemoteCandidates().find(function (remoteCandidate) {
      return candidate.foundation === remoteCandidate.foundation && candidate.ip === remoteCandidate.ip && candidate.port === remoteCandidate.port && candidate.priority === remoteCandidate.priority && candidate.protocol === remoteCandidate.protocol && candidate.type === remoteCandidate.type;
    });

    if (!alreadyAdded) {
      iceTransport.addRemoteCandidate(candidate);
    }

    return !alreadyAdded;
  }

  function makeError(name, description) {
    var e = new Error(description);
    e.name = name; // legacy error codes from https://heycam.github.io/webidl/#idl-DOMException-error-names

    e.code = {
      NotSupportedError: 9,
      InvalidStateError: 11,
      InvalidAccessError: 15,
      TypeError: undefined,
      OperationError: undefined
    }[name];
    return e;
  }

  var rtcpeerconnection = function (window, edgeVersion) {
    // https://w3c.github.io/mediacapture-main/#mediastream
    // Helper function to add the track to the stream and
    // dispatch the event ourselves.
    function addTrackToStreamAndFireEvent(track, stream) {
      stream.addTrack(track);
      stream.dispatchEvent(new window.MediaStreamTrackEvent('addtrack', {
        track: track
      }));
    }

    function removeTrackFromStreamAndFireEvent(track, stream) {
      stream.removeTrack(track);
      stream.dispatchEvent(new window.MediaStreamTrackEvent('removetrack', {
        track: track
      }));
    }

    function fireAddTrack(pc, track, receiver, streams) {
      var trackEvent = new Event('track');
      trackEvent.track = track;
      trackEvent.receiver = receiver;
      trackEvent.transceiver = {
        receiver: receiver
      };
      trackEvent.streams = streams;
      window.setTimeout(function () {
        pc._dispatchEvent('track', trackEvent);
      });
    }

    var RTCPeerConnection = function (config) {
      var pc = this;

      var _eventTarget = document.createDocumentFragment();

      ['addEventListener', 'removeEventListener', 'dispatchEvent'].forEach(function (method) {
        pc[method] = _eventTarget[method].bind(_eventTarget);
      });
      this.canTrickleIceCandidates = null;
      this.needNegotiation = false;
      this.localStreams = [];
      this.remoteStreams = [];
      this._localDescription = null;
      this._remoteDescription = null;
      this.signalingState = 'stable';
      this.iceConnectionState = 'new';
      this.connectionState = 'new';
      this.iceGatheringState = 'new';
      config = JSON.parse(JSON.stringify(config || {}));
      this.usingBundle = config.bundlePolicy === 'max-bundle';

      if (config.rtcpMuxPolicy === 'negotiate') {
        throw makeError('NotSupportedError', 'rtcpMuxPolicy \'negotiate\' is not supported');
      } else if (!config.rtcpMuxPolicy) {
        config.rtcpMuxPolicy = 'require';
      }

      switch (config.iceTransportPolicy) {
        case 'all':
        case 'relay':
          break;

        default:
          config.iceTransportPolicy = 'all';
          break;
      }

      switch (config.bundlePolicy) {
        case 'balanced':
        case 'max-compat':
        case 'max-bundle':
          break;

        default:
          config.bundlePolicy = 'balanced';
          break;
      }

      config.iceServers = filterIceServers(config.iceServers || [], edgeVersion);
      this._iceGatherers = [];

      if (config.iceCandidatePoolSize) {
        for (var i = config.iceCandidatePoolSize; i > 0; i--) {
          this._iceGatherers.push(new window.RTCIceGatherer({
            iceServers: config.iceServers,
            gatherPolicy: config.iceTransportPolicy
          }));
        }
      } else {
        config.iceCandidatePoolSize = 0;
      }

      this._config = config; // per-track iceGathers, iceTransports, dtlsTransports, rtpSenders, ...
      // everything that is needed to describe a SDP m-line.

      this.transceivers = [];
      this._sdpSessionId = sdp.generateSessionId();
      this._sdpSessionVersion = 0;
      this._dtlsRole = undefined; // role for a=setup to use in answers.

      this._isClosed = false;
    };

    Object.defineProperty(RTCPeerConnection.prototype, 'localDescription', {
      configurable: true,
      get: function () {
        return this._localDescription;
      }
    });
    Object.defineProperty(RTCPeerConnection.prototype, 'remoteDescription', {
      configurable: true,
      get: function () {
        return this._remoteDescription;
      }
    }); // set up event handlers on prototype

    RTCPeerConnection.prototype.onicecandidate = null;
    RTCPeerConnection.prototype.onaddstream = null;
    RTCPeerConnection.prototype.ontrack = null;
    RTCPeerConnection.prototype.onremovestream = null;
    RTCPeerConnection.prototype.onsignalingstatechange = null;
    RTCPeerConnection.prototype.oniceconnectionstatechange = null;
    RTCPeerConnection.prototype.onconnectionstatechange = null;
    RTCPeerConnection.prototype.onicegatheringstatechange = null;
    RTCPeerConnection.prototype.onnegotiationneeded = null;
    RTCPeerConnection.prototype.ondatachannel = null;

    RTCPeerConnection.prototype._dispatchEvent = function (name, event) {
      if (this._isClosed) {
        return;
      }

      this.dispatchEvent(event);

      if (typeof this['on' + name] === 'function') {
        this['on' + name](event);
      }
    };

    RTCPeerConnection.prototype._emitGatheringStateChange = function () {
      var event = new Event('icegatheringstatechange');

      this._dispatchEvent('icegatheringstatechange', event);
    };

    RTCPeerConnection.prototype.getConfiguration = function () {
      return this._config;
    };

    RTCPeerConnection.prototype.getLocalStreams = function () {
      return this.localStreams;
    };

    RTCPeerConnection.prototype.getRemoteStreams = function () {
      return this.remoteStreams;
    }; // internal helper to create a transceiver object.
    // (which is not yet the same as the WebRTC 1.0 transceiver)


    RTCPeerConnection.prototype._createTransceiver = function (kind, doNotAdd) {
      var hasBundleTransport = this.transceivers.length > 0;
      var transceiver = {
        track: null,
        iceGatherer: null,
        iceTransport: null,
        dtlsTransport: null,
        localCapabilities: null,
        remoteCapabilities: null,
        rtpSender: null,
        rtpReceiver: null,
        kind: kind,
        mid: null,
        sendEncodingParameters: null,
        recvEncodingParameters: null,
        stream: null,
        associatedRemoteMediaStreams: [],
        wantReceive: true
      };

      if (this.usingBundle && hasBundleTransport) {
        transceiver.iceTransport = this.transceivers[0].iceTransport;
        transceiver.dtlsTransport = this.transceivers[0].dtlsTransport;
      } else {
        var transports = this._createIceAndDtlsTransports();

        transceiver.iceTransport = transports.iceTransport;
        transceiver.dtlsTransport = transports.dtlsTransport;
      }

      if (!doNotAdd) {
        this.transceivers.push(transceiver);
      }

      return transceiver;
    };

    RTCPeerConnection.prototype.addTrack = function (track, stream) {
      if (this._isClosed) {
        throw makeError('InvalidStateError', 'Attempted to call addTrack on a closed peerconnection.');
      }

      var alreadyExists = this.transceivers.find(function (s) {
        return s.track === track;
      });

      if (alreadyExists) {
        throw makeError('InvalidAccessError', 'Track already exists.');
      }

      var transceiver;

      for (var i = 0; i < this.transceivers.length; i++) {
        if (!this.transceivers[i].track && this.transceivers[i].kind === track.kind) {
          transceiver = this.transceivers[i];
        }
      }

      if (!transceiver) {
        transceiver = this._createTransceiver(track.kind);
      }

      this._maybeFireNegotiationNeeded();

      if (this.localStreams.indexOf(stream) === -1) {
        this.localStreams.push(stream);
      }

      transceiver.track = track;
      transceiver.stream = stream;
      transceiver.rtpSender = new window.RTCRtpSender(track, transceiver.dtlsTransport);
      return transceiver.rtpSender;
    };

    RTCPeerConnection.prototype.addStream = function (stream) {
      var pc = this;

      if (edgeVersion >= 15025) {
        stream.getTracks().forEach(function (track) {
          pc.addTrack(track, stream);
        });
      } else {
        // Clone is necessary for local demos mostly, attaching directly
        // to two different senders does not work (build 10547).
        // Fixed in 15025 (or earlier)
        var clonedStream = stream.clone();
        stream.getTracks().forEach(function (track, idx) {
          var clonedTrack = clonedStream.getTracks()[idx];
          track.addEventListener('enabled', function (event) {
            clonedTrack.enabled = event.enabled;
          });
        });
        clonedStream.getTracks().forEach(function (track) {
          pc.addTrack(track, clonedStream);
        });
      }
    };

    RTCPeerConnection.prototype.removeTrack = function (sender) {
      if (this._isClosed) {
        throw makeError('InvalidStateError', 'Attempted to call removeTrack on a closed peerconnection.');
      }

      if (!(sender instanceof window.RTCRtpSender)) {
        throw new TypeError('Argument 1 of RTCPeerConnection.removeTrack ' + 'does not implement interface RTCRtpSender.');
      }

      var transceiver = this.transceivers.find(function (t) {
        return t.rtpSender === sender;
      });

      if (!transceiver) {
        throw makeError('InvalidAccessError', 'Sender was not created by this connection.');
      }

      var stream = transceiver.stream;
      transceiver.rtpSender.stop();
      transceiver.rtpSender = null;
      transceiver.track = null;
      transceiver.stream = null; // remove the stream from the set of local streams

      var localStreams = this.transceivers.map(function (t) {
        return t.stream;
      });

      if (localStreams.indexOf(stream) === -1 && this.localStreams.indexOf(stream) > -1) {
        this.localStreams.splice(this.localStreams.indexOf(stream), 1);
      }

      this._maybeFireNegotiationNeeded();
    };

    RTCPeerConnection.prototype.removeStream = function (stream) {
      var pc = this;
      stream.getTracks().forEach(function (track) {
        var sender = pc.getSenders().find(function (s) {
          return s.track === track;
        });

        if (sender) {
          pc.removeTrack(sender);
        }
      });
    };

    RTCPeerConnection.prototype.getSenders = function () {
      return this.transceivers.filter(function (transceiver) {
        return !!transceiver.rtpSender;
      }).map(function (transceiver) {
        return transceiver.rtpSender;
      });
    };

    RTCPeerConnection.prototype.getReceivers = function () {
      return this.transceivers.filter(function (transceiver) {
        return !!transceiver.rtpReceiver;
      }).map(function (transceiver) {
        return transceiver.rtpReceiver;
      });
    };

    RTCPeerConnection.prototype._createIceGatherer = function (sdpMLineIndex, usingBundle) {
      var pc = this;

      if (usingBundle && sdpMLineIndex > 0) {
        return this.transceivers[0].iceGatherer;
      } else if (this._iceGatherers.length) {
        return this._iceGatherers.shift();
      }

      var iceGatherer = new window.RTCIceGatherer({
        iceServers: this._config.iceServers,
        gatherPolicy: this._config.iceTransportPolicy
      });
      Object.defineProperty(iceGatherer, 'state', {
        value: 'new',
        writable: true
      });
      this.transceivers[sdpMLineIndex].bufferedCandidateEvents = [];

      this.transceivers[sdpMLineIndex].bufferCandidates = function (event) {
        var end = !event.candidate || Object.keys(event.candidate).length === 0; // polyfill since RTCIceGatherer.state is not implemented in
        // Edge 10547 yet.

        iceGatherer.state = end ? 'completed' : 'gathering';

        if (pc.transceivers[sdpMLineIndex].bufferedCandidateEvents !== null) {
          pc.transceivers[sdpMLineIndex].bufferedCandidateEvents.push(event);
        }
      };

      iceGatherer.addEventListener('localcandidate', this.transceivers[sdpMLineIndex].bufferCandidates);
      return iceGatherer;
    }; // start gathering from an RTCIceGatherer.


    RTCPeerConnection.prototype._gather = function (mid, sdpMLineIndex) {
      var pc = this;
      var iceGatherer = this.transceivers[sdpMLineIndex].iceGatherer;

      if (iceGatherer.onlocalcandidate) {
        return;
      }

      var bufferedCandidateEvents = this.transceivers[sdpMLineIndex].bufferedCandidateEvents;
      this.transceivers[sdpMLineIndex].bufferedCandidateEvents = null;
      iceGatherer.removeEventListener('localcandidate', this.transceivers[sdpMLineIndex].bufferCandidates);

      iceGatherer.onlocalcandidate = function (evt) {
        if (pc.usingBundle && sdpMLineIndex > 0) {
          // if we know that we use bundle we can drop candidates with
          // ѕdpMLineIndex > 0. If we don't do this then our state gets
          // confused since we dispose the extra ice gatherer.
          return;
        }

        var event = new Event('icecandidate');
        event.candidate = {
          sdpMid: mid,
          sdpMLineIndex: sdpMLineIndex
        };
        var cand = evt.candidate; // Edge emits an empty object for RTCIceCandidateComplete‥

        var end = !cand || Object.keys(cand).length === 0;

        if (end) {
          // polyfill since RTCIceGatherer.state is not implemented in
          // Edge 10547 yet.
          if (iceGatherer.state === 'new' || iceGatherer.state === 'gathering') {
            iceGatherer.state = 'completed';
          }
        } else {
          if (iceGatherer.state === 'new') {
            iceGatherer.state = 'gathering';
          } // RTCIceCandidate doesn't have a component, needs to be added


          cand.component = 1; // also the usernameFragment. TODO: update SDP to take both variants.

          cand.ufrag = iceGatherer.getLocalParameters().usernameFragment;
          var serializedCandidate = sdp.writeCandidate(cand);
          event.candidate = Object.assign(event.candidate, sdp.parseCandidate(serializedCandidate));
          event.candidate.candidate = serializedCandidate;

          event.candidate.toJSON = function () {
            return {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
              usernameFragment: event.candidate.usernameFragment
            };
          };
        } // update local description.


        var sections = sdp.getMediaSections(pc._localDescription.sdp);

        if (!end) {
          sections[event.candidate.sdpMLineIndex] += 'a=' + event.candidate.candidate + '\r\n';
        } else {
          sections[event.candidate.sdpMLineIndex] += 'a=end-of-candidates\r\n';
        }

        pc._localDescription.sdp = sdp.getDescription(pc._localDescription.sdp) + sections.join('');
        var complete = pc.transceivers.every(function (transceiver) {
          return transceiver.iceGatherer && transceiver.iceGatherer.state === 'completed';
        });

        if (pc.iceGatheringState !== 'gathering') {
          pc.iceGatheringState = 'gathering';

          pc._emitGatheringStateChange();
        } // Emit candidate. Also emit null candidate when all gatherers are
        // complete.


        if (!end) {
          pc._dispatchEvent('icecandidate', event);
        }

        if (complete) {
          pc._dispatchEvent('icecandidate', new Event('icecandidate'));

          pc.iceGatheringState = 'complete';

          pc._emitGatheringStateChange();
        }
      }; // emit already gathered candidates.


      window.setTimeout(function () {
        bufferedCandidateEvents.forEach(function (e) {
          iceGatherer.onlocalcandidate(e);
        });
      }, 0);
    }; // Create ICE transport and DTLS transport.


    RTCPeerConnection.prototype._createIceAndDtlsTransports = function () {
      var pc = this;
      var iceTransport = new window.RTCIceTransport(null);

      iceTransport.onicestatechange = function () {
        pc._updateIceConnectionState();

        pc._updateConnectionState();
      };

      var dtlsTransport = new window.RTCDtlsTransport(iceTransport);

      dtlsTransport.ondtlsstatechange = function () {
        pc._updateConnectionState();
      };

      dtlsTransport.onerror = function () {
        // onerror does not set state to failed by itself.
        Object.defineProperty(dtlsTransport, 'state', {
          value: 'failed',
          writable: true
        });

        pc._updateConnectionState();
      };

      return {
        iceTransport: iceTransport,
        dtlsTransport: dtlsTransport
      };
    }; // Destroy ICE gatherer, ICE transport and DTLS transport.
    // Without triggering the callbacks.


    RTCPeerConnection.prototype._disposeIceAndDtlsTransports = function (sdpMLineIndex) {
      var iceGatherer = this.transceivers[sdpMLineIndex].iceGatherer;

      if (iceGatherer) {
        delete iceGatherer.onlocalcandidate;
        delete this.transceivers[sdpMLineIndex].iceGatherer;
      }

      var iceTransport = this.transceivers[sdpMLineIndex].iceTransport;

      if (iceTransport) {
        delete iceTransport.onicestatechange;
        delete this.transceivers[sdpMLineIndex].iceTransport;
      }

      var dtlsTransport = this.transceivers[sdpMLineIndex].dtlsTransport;

      if (dtlsTransport) {
        delete dtlsTransport.ondtlsstatechange;
        delete dtlsTransport.onerror;
        delete this.transceivers[sdpMLineIndex].dtlsTransport;
      }
    }; // Start the RTP Sender and Receiver for a transceiver.


    RTCPeerConnection.prototype._transceive = function (transceiver, send, recv) {
      var params = getCommonCapabilities(transceiver.localCapabilities, transceiver.remoteCapabilities);

      if (send && transceiver.rtpSender) {
        params.encodings = transceiver.sendEncodingParameters;
        params.rtcp = {
          cname: sdp.localCName,
          compound: transceiver.rtcpParameters.compound
        };

        if (transceiver.recvEncodingParameters.length) {
          params.rtcp.ssrc = transceiver.recvEncodingParameters[0].ssrc;
        }

        transceiver.rtpSender.send(params);
      }

      if (recv && transceiver.rtpReceiver && params.codecs.length > 0) {
        // remove RTX field in Edge 14942
        if (transceiver.kind === 'video' && transceiver.recvEncodingParameters && edgeVersion < 15019) {
          transceiver.recvEncodingParameters.forEach(function (p) {
            delete p.rtx;
          });
        }

        if (transceiver.recvEncodingParameters.length) {
          params.encodings = transceiver.recvEncodingParameters;
        } else {
          params.encodings = [{}];
        }

        params.rtcp = {
          compound: transceiver.rtcpParameters.compound
        };

        if (transceiver.rtcpParameters.cname) {
          params.rtcp.cname = transceiver.rtcpParameters.cname;
        }

        if (transceiver.sendEncodingParameters.length) {
          params.rtcp.ssrc = transceiver.sendEncodingParameters[0].ssrc;
        }

        transceiver.rtpReceiver.receive(params);
      }
    };

    RTCPeerConnection.prototype.setLocalDescription = function (description) {
      var pc = this; // Note: pranswer is not supported.

      if (['offer', 'answer'].indexOf(description.type) === -1) {
        return Promise.reject(makeError('TypeError', 'Unsupported type "' + description.type + '"'));
      }

      if (!isActionAllowedInSignalingState('setLocalDescription', description.type, pc.signalingState) || pc._isClosed) {
        return Promise.reject(makeError('InvalidStateError', 'Can not set local ' + description.type + ' in state ' + pc.signalingState));
      }

      var sections;
      var sessionpart;

      if (description.type === 'offer') {
        // VERY limited support for SDP munging. Limited to:
        // * changing the order of codecs
        sections = sdp.splitSections(description.sdp);
        sessionpart = sections.shift();
        sections.forEach(function (mediaSection, sdpMLineIndex) {
          var caps = sdp.parseRtpParameters(mediaSection);
          pc.transceivers[sdpMLineIndex].localCapabilities = caps;
        });
        pc.transceivers.forEach(function (transceiver, sdpMLineIndex) {
          pc._gather(transceiver.mid, sdpMLineIndex);
        });
      } else if (description.type === 'answer') {
        sections = sdp.splitSections(pc._remoteDescription.sdp);
        sessionpart = sections.shift();
        var isIceLite = sdp.matchPrefix(sessionpart, 'a=ice-lite').length > 0;
        sections.forEach(function (mediaSection, sdpMLineIndex) {
          var transceiver = pc.transceivers[sdpMLineIndex];
          var iceGatherer = transceiver.iceGatherer;
          var iceTransport = transceiver.iceTransport;
          var dtlsTransport = transceiver.dtlsTransport;
          var localCapabilities = transceiver.localCapabilities;
          var remoteCapabilities = transceiver.remoteCapabilities; // treat bundle-only as not-rejected.

          var rejected = sdp.isRejected(mediaSection) && sdp.matchPrefix(mediaSection, 'a=bundle-only').length === 0;

          if (!rejected && !transceiver.rejected) {
            var remoteIceParameters = sdp.getIceParameters(mediaSection, sessionpart);
            var remoteDtlsParameters = sdp.getDtlsParameters(mediaSection, sessionpart);

            if (isIceLite) {
              remoteDtlsParameters.role = 'server';
            }

            if (!pc.usingBundle || sdpMLineIndex === 0) {
              pc._gather(transceiver.mid, sdpMLineIndex);

              if (iceTransport.state === 'new') {
                iceTransport.start(iceGatherer, remoteIceParameters, isIceLite ? 'controlling' : 'controlled');
              }

              if (dtlsTransport.state === 'new') {
                dtlsTransport.start(remoteDtlsParameters);
              }
            } // Calculate intersection of capabilities.


            var params = getCommonCapabilities(localCapabilities, remoteCapabilities); // Start the RTCRtpSender. The RTCRtpReceiver for this
            // transceiver has already been started in setRemoteDescription.

            pc._transceive(transceiver, params.codecs.length > 0, false);
          }
        });
      }

      pc._localDescription = {
        type: description.type,
        sdp: description.sdp
      };

      if (description.type === 'offer') {
        pc._updateSignalingState('have-local-offer');
      } else {
        pc._updateSignalingState('stable');
      }

      return Promise.resolve();
    };

    RTCPeerConnection.prototype.setRemoteDescription = function (description) {
      var pc = this; // Note: pranswer is not supported.

      if (['offer', 'answer'].indexOf(description.type) === -1) {
        return Promise.reject(makeError('TypeError', 'Unsupported type "' + description.type + '"'));
      }

      if (!isActionAllowedInSignalingState('setRemoteDescription', description.type, pc.signalingState) || pc._isClosed) {
        return Promise.reject(makeError('InvalidStateError', 'Can not set remote ' + description.type + ' in state ' + pc.signalingState));
      }

      var streams = {};
      pc.remoteStreams.forEach(function (stream) {
        streams[stream.id] = stream;
      });
      var receiverList = [];
      var sections = sdp.splitSections(description.sdp);
      var sessionpart = sections.shift();
      var isIceLite = sdp.matchPrefix(sessionpart, 'a=ice-lite').length > 0;
      var usingBundle = sdp.matchPrefix(sessionpart, 'a=group:BUNDLE ').length > 0;
      pc.usingBundle = usingBundle;
      var iceOptions = sdp.matchPrefix(sessionpart, 'a=ice-options:')[0];

      if (iceOptions) {
        pc.canTrickleIceCandidates = iceOptions.substr(14).split(' ').indexOf('trickle') >= 0;
      } else {
        pc.canTrickleIceCandidates = false;
      }

      sections.forEach(function (mediaSection, sdpMLineIndex) {
        var lines = sdp.splitLines(mediaSection);
        var kind = sdp.getKind(mediaSection); // treat bundle-only as not-rejected.

        var rejected = sdp.isRejected(mediaSection) && sdp.matchPrefix(mediaSection, 'a=bundle-only').length === 0;
        var protocol = lines[0].substr(2).split(' ')[2];
        var direction = sdp.getDirection(mediaSection, sessionpart);
        var remoteMsid = sdp.parseMsid(mediaSection);
        var mid = sdp.getMid(mediaSection) || sdp.generateIdentifier(); // Reject datachannels which are not implemented yet.

        if (rejected || kind === 'application' && (protocol === 'DTLS/SCTP' || protocol === 'UDP/DTLS/SCTP')) {
          // TODO: this is dangerous in the case where a non-rejected m-line
          //     becomes rejected.
          pc.transceivers[sdpMLineIndex] = {
            mid: mid,
            kind: kind,
            protocol: protocol,
            rejected: true
          };
          return;
        }

        if (!rejected && pc.transceivers[sdpMLineIndex] && pc.transceivers[sdpMLineIndex].rejected) {
          // recycle a rejected transceiver.
          pc.transceivers[sdpMLineIndex] = pc._createTransceiver(kind, true);
        }

        var transceiver;
        var iceGatherer;
        var iceTransport;
        var dtlsTransport;
        var rtpReceiver;
        var sendEncodingParameters;
        var recvEncodingParameters;
        var localCapabilities;
        var track; // FIXME: ensure the mediaSection has rtcp-mux set.

        var remoteCapabilities = sdp.parseRtpParameters(mediaSection);
        var remoteIceParameters;
        var remoteDtlsParameters;

        if (!rejected) {
          remoteIceParameters = sdp.getIceParameters(mediaSection, sessionpart);
          remoteDtlsParameters = sdp.getDtlsParameters(mediaSection, sessionpart);
          remoteDtlsParameters.role = 'client';
        }

        recvEncodingParameters = sdp.parseRtpEncodingParameters(mediaSection);
        var rtcpParameters = sdp.parseRtcpParameters(mediaSection);
        var isComplete = sdp.matchPrefix(mediaSection, 'a=end-of-candidates', sessionpart).length > 0;
        var cands = sdp.matchPrefix(mediaSection, 'a=candidate:').map(function (cand) {
          return sdp.parseCandidate(cand);
        }).filter(function (cand) {
          return cand.component === 1;
        }); // Check if we can use BUNDLE and dispose transports.

        if ((description.type === 'offer' || description.type === 'answer') && !rejected && usingBundle && sdpMLineIndex > 0 && pc.transceivers[sdpMLineIndex]) {
          pc._disposeIceAndDtlsTransports(sdpMLineIndex);

          pc.transceivers[sdpMLineIndex].iceGatherer = pc.transceivers[0].iceGatherer;
          pc.transceivers[sdpMLineIndex].iceTransport = pc.transceivers[0].iceTransport;
          pc.transceivers[sdpMLineIndex].dtlsTransport = pc.transceivers[0].dtlsTransport;

          if (pc.transceivers[sdpMLineIndex].rtpSender) {
            pc.transceivers[sdpMLineIndex].rtpSender.setTransport(pc.transceivers[0].dtlsTransport);
          }

          if (pc.transceivers[sdpMLineIndex].rtpReceiver) {
            pc.transceivers[sdpMLineIndex].rtpReceiver.setTransport(pc.transceivers[0].dtlsTransport);
          }
        }

        if (description.type === 'offer' && !rejected) {
          transceiver = pc.transceivers[sdpMLineIndex] || pc._createTransceiver(kind);
          transceiver.mid = mid;

          if (!transceiver.iceGatherer) {
            transceiver.iceGatherer = pc._createIceGatherer(sdpMLineIndex, usingBundle);
          }

          if (cands.length && transceiver.iceTransport.state === 'new') {
            if (isComplete && (!usingBundle || sdpMLineIndex === 0)) {
              transceiver.iceTransport.setRemoteCandidates(cands);
            } else {
              cands.forEach(function (candidate) {
                maybeAddCandidate(transceiver.iceTransport, candidate);
              });
            }
          }

          localCapabilities = window.RTCRtpReceiver.getCapabilities(kind); // filter RTX until additional stuff needed for RTX is implemented
          // in adapter.js

          if (edgeVersion < 15019) {
            localCapabilities.codecs = localCapabilities.codecs.filter(function (codec) {
              return codec.name !== 'rtx';
            });
          }

          sendEncodingParameters = transceiver.sendEncodingParameters || [{
            ssrc: (2 * sdpMLineIndex + 2) * 1001
          }]; // TODO: rewrite to use http://w3c.github.io/webrtc-pc/#set-associated-remote-streams

          var isNewTrack = false;

          if (direction === 'sendrecv' || direction === 'sendonly') {
            isNewTrack = !transceiver.rtpReceiver;
            rtpReceiver = transceiver.rtpReceiver || new window.RTCRtpReceiver(transceiver.dtlsTransport, kind);

            if (isNewTrack) {
              var stream;
              track = rtpReceiver.track; // FIXME: does not work with Plan B.

              if (remoteMsid && remoteMsid.stream === '-') ; else if (remoteMsid) {
                if (!streams[remoteMsid.stream]) {
                  streams[remoteMsid.stream] = new window.MediaStream();
                  Object.defineProperty(streams[remoteMsid.stream], 'id', {
                    get: function () {
                      return remoteMsid.stream;
                    }
                  });
                }

                Object.defineProperty(track, 'id', {
                  get: function () {
                    return remoteMsid.track;
                  }
                });
                stream = streams[remoteMsid.stream];
              } else {
                if (!streams.default) {
                  streams.default = new window.MediaStream();
                }

                stream = streams.default;
              }

              if (stream) {
                addTrackToStreamAndFireEvent(track, stream);
                transceiver.associatedRemoteMediaStreams.push(stream);
              }

              receiverList.push([track, rtpReceiver, stream]);
            }
          } else if (transceiver.rtpReceiver && transceiver.rtpReceiver.track) {
            transceiver.associatedRemoteMediaStreams.forEach(function (s) {
              var nativeTrack = s.getTracks().find(function (t) {
                return t.id === transceiver.rtpReceiver.track.id;
              });

              if (nativeTrack) {
                removeTrackFromStreamAndFireEvent(nativeTrack, s);
              }
            });
            transceiver.associatedRemoteMediaStreams = [];
          }

          transceiver.localCapabilities = localCapabilities;
          transceiver.remoteCapabilities = remoteCapabilities;
          transceiver.rtpReceiver = rtpReceiver;
          transceiver.rtcpParameters = rtcpParameters;
          transceiver.sendEncodingParameters = sendEncodingParameters;
          transceiver.recvEncodingParameters = recvEncodingParameters; // Start the RTCRtpReceiver now. The RTPSender is started in
          // setLocalDescription.

          pc._transceive(pc.transceivers[sdpMLineIndex], false, isNewTrack);
        } else if (description.type === 'answer' && !rejected) {
          transceiver = pc.transceivers[sdpMLineIndex];
          iceGatherer = transceiver.iceGatherer;
          iceTransport = transceiver.iceTransport;
          dtlsTransport = transceiver.dtlsTransport;
          rtpReceiver = transceiver.rtpReceiver;
          sendEncodingParameters = transceiver.sendEncodingParameters;
          localCapabilities = transceiver.localCapabilities;
          pc.transceivers[sdpMLineIndex].recvEncodingParameters = recvEncodingParameters;
          pc.transceivers[sdpMLineIndex].remoteCapabilities = remoteCapabilities;
          pc.transceivers[sdpMLineIndex].rtcpParameters = rtcpParameters;

          if (cands.length && iceTransport.state === 'new') {
            if ((isIceLite || isComplete) && (!usingBundle || sdpMLineIndex === 0)) {
              iceTransport.setRemoteCandidates(cands);
            } else {
              cands.forEach(function (candidate) {
                maybeAddCandidate(transceiver.iceTransport, candidate);
              });
            }
          }

          if (!usingBundle || sdpMLineIndex === 0) {
            if (iceTransport.state === 'new') {
              iceTransport.start(iceGatherer, remoteIceParameters, 'controlling');
            }

            if (dtlsTransport.state === 'new') {
              dtlsTransport.start(remoteDtlsParameters);
            }
          } // If the offer contained RTX but the answer did not,
          // remove RTX from sendEncodingParameters.


          var commonCapabilities = getCommonCapabilities(transceiver.localCapabilities, transceiver.remoteCapabilities);
          var hasRtx = commonCapabilities.codecs.filter(function (c) {
            return c.name.toLowerCase() === 'rtx';
          }).length;

          if (!hasRtx && transceiver.sendEncodingParameters[0].rtx) {
            delete transceiver.sendEncodingParameters[0].rtx;
          }

          pc._transceive(transceiver, direction === 'sendrecv' || direction === 'recvonly', direction === 'sendrecv' || direction === 'sendonly'); // TODO: rewrite to use http://w3c.github.io/webrtc-pc/#set-associated-remote-streams


          if (rtpReceiver && (direction === 'sendrecv' || direction === 'sendonly')) {
            track = rtpReceiver.track;

            if (remoteMsid) {
              if (!streams[remoteMsid.stream]) {
                streams[remoteMsid.stream] = new window.MediaStream();
              }

              addTrackToStreamAndFireEvent(track, streams[remoteMsid.stream]);
              receiverList.push([track, rtpReceiver, streams[remoteMsid.stream]]);
            } else {
              if (!streams.default) {
                streams.default = new window.MediaStream();
              }

              addTrackToStreamAndFireEvent(track, streams.default);
              receiverList.push([track, rtpReceiver, streams.default]);
            }
          } else {
            // FIXME: actually the receiver should be created later.
            delete transceiver.rtpReceiver;
          }
        }
      });

      if (pc._dtlsRole === undefined) {
        pc._dtlsRole = description.type === 'offer' ? 'active' : 'passive';
      }

      pc._remoteDescription = {
        type: description.type,
        sdp: description.sdp
      };

      if (description.type === 'offer') {
        pc._updateSignalingState('have-remote-offer');
      } else {
        pc._updateSignalingState('stable');
      }

      Object.keys(streams).forEach(function (sid) {
        var stream = streams[sid];

        if (stream.getTracks().length) {
          if (pc.remoteStreams.indexOf(stream) === -1) {
            pc.remoteStreams.push(stream);
            var event = new Event('addstream');
            event.stream = stream;
            window.setTimeout(function () {
              pc._dispatchEvent('addstream', event);
            });
          }

          receiverList.forEach(function (item) {
            var track = item[0];
            var receiver = item[1];

            if (stream.id !== item[2].id) {
              return;
            }

            fireAddTrack(pc, track, receiver, [stream]);
          });
        }
      });
      receiverList.forEach(function (item) {
        if (item[2]) {
          return;
        }

        fireAddTrack(pc, item[0], item[1], []);
      }); // check whether addIceCandidate({}) was called within four seconds after
      // setRemoteDescription.

      window.setTimeout(function () {
        if (!(pc && pc.transceivers)) {
          return;
        }

        pc.transceivers.forEach(function (transceiver) {
          if (transceiver.iceTransport && transceiver.iceTransport.state === 'new' && transceiver.iceTransport.getRemoteCandidates().length > 0) {
            console.warn('Timeout for addRemoteCandidate. Consider sending ' + 'an end-of-candidates notification');
            transceiver.iceTransport.addRemoteCandidate({});
          }
        });
      }, 4000);
      return Promise.resolve();
    };

    RTCPeerConnection.prototype.close = function () {
      this.transceivers.forEach(function (transceiver) {
        /* not yet
        if (transceiver.iceGatherer) {
          transceiver.iceGatherer.close();
        }
        */
        if (transceiver.iceTransport) {
          transceiver.iceTransport.stop();
        }

        if (transceiver.dtlsTransport) {
          transceiver.dtlsTransport.stop();
        }

        if (transceiver.rtpSender) {
          transceiver.rtpSender.stop();
        }

        if (transceiver.rtpReceiver) {
          transceiver.rtpReceiver.stop();
        }
      }); // FIXME: clean up tracks, local streams, remote streams, etc

      this._isClosed = true;

      this._updateSignalingState('closed');
    }; // Update the signaling state.


    RTCPeerConnection.prototype._updateSignalingState = function (newState) {
      this.signalingState = newState;
      var event = new Event('signalingstatechange');

      this._dispatchEvent('signalingstatechange', event);
    }; // Determine whether to fire the negotiationneeded event.


    RTCPeerConnection.prototype._maybeFireNegotiationNeeded = function () {
      var pc = this;

      if (this.signalingState !== 'stable' || this.needNegotiation === true) {
        return;
      }

      this.needNegotiation = true;
      window.setTimeout(function () {
        if (pc.needNegotiation) {
          pc.needNegotiation = false;
          var event = new Event('negotiationneeded');

          pc._dispatchEvent('negotiationneeded', event);
        }
      }, 0);
    }; // Update the ice connection state.


    RTCPeerConnection.prototype._updateIceConnectionState = function () {
      var newState;
      var states = {
        'new': 0,
        closed: 0,
        checking: 0,
        connected: 0,
        completed: 0,
        disconnected: 0,
        failed: 0
      };
      this.transceivers.forEach(function (transceiver) {
        if (transceiver.iceTransport && !transceiver.rejected) {
          states[transceiver.iceTransport.state]++;
        }
      });
      newState = 'new';

      if (states.failed > 0) {
        newState = 'failed';
      } else if (states.checking > 0) {
        newState = 'checking';
      } else if (states.disconnected > 0) {
        newState = 'disconnected';
      } else if (states.new > 0) {
        newState = 'new';
      } else if (states.connected > 0) {
        newState = 'connected';
      } else if (states.completed > 0) {
        newState = 'completed';
      }

      if (newState !== this.iceConnectionState) {
        this.iceConnectionState = newState;
        var event = new Event('iceconnectionstatechange');

        this._dispatchEvent('iceconnectionstatechange', event);
      }
    }; // Update the connection state.


    RTCPeerConnection.prototype._updateConnectionState = function () {
      var newState;
      var states = {
        'new': 0,
        closed: 0,
        connecting: 0,
        connected: 0,
        completed: 0,
        disconnected: 0,
        failed: 0
      };
      this.transceivers.forEach(function (transceiver) {
        if (transceiver.iceTransport && transceiver.dtlsTransport && !transceiver.rejected) {
          states[transceiver.iceTransport.state]++;
          states[transceiver.dtlsTransport.state]++;
        }
      }); // ICETransport.completed and connected are the same for this purpose.

      states.connected += states.completed;
      newState = 'new';

      if (states.failed > 0) {
        newState = 'failed';
      } else if (states.connecting > 0) {
        newState = 'connecting';
      } else if (states.disconnected > 0) {
        newState = 'disconnected';
      } else if (states.new > 0) {
        newState = 'new';
      } else if (states.connected > 0) {
        newState = 'connected';
      }

      if (newState !== this.connectionState) {
        this.connectionState = newState;
        var event = new Event('connectionstatechange');

        this._dispatchEvent('connectionstatechange', event);
      }
    };

    RTCPeerConnection.prototype.createOffer = function () {
      var pc = this;

      if (pc._isClosed) {
        return Promise.reject(makeError('InvalidStateError', 'Can not call createOffer after close'));
      }

      var numAudioTracks = pc.transceivers.filter(function (t) {
        return t.kind === 'audio';
      }).length;
      var numVideoTracks = pc.transceivers.filter(function (t) {
        return t.kind === 'video';
      }).length; // Determine number of audio and video tracks we need to send/recv.

      var offerOptions = arguments[0];

      if (offerOptions) {
        // Reject Chrome legacy constraints.
        if (offerOptions.mandatory || offerOptions.optional) {
          throw new TypeError('Legacy mandatory/optional constraints not supported.');
        }

        if (offerOptions.offerToReceiveAudio !== undefined) {
          if (offerOptions.offerToReceiveAudio === true) {
            numAudioTracks = 1;
          } else if (offerOptions.offerToReceiveAudio === false) {
            numAudioTracks = 0;
          } else {
            numAudioTracks = offerOptions.offerToReceiveAudio;
          }
        }

        if (offerOptions.offerToReceiveVideo !== undefined) {
          if (offerOptions.offerToReceiveVideo === true) {
            numVideoTracks = 1;
          } else if (offerOptions.offerToReceiveVideo === false) {
            numVideoTracks = 0;
          } else {
            numVideoTracks = offerOptions.offerToReceiveVideo;
          }
        }
      }

      pc.transceivers.forEach(function (transceiver) {
        if (transceiver.kind === 'audio') {
          numAudioTracks--;

          if (numAudioTracks < 0) {
            transceiver.wantReceive = false;
          }
        } else if (transceiver.kind === 'video') {
          numVideoTracks--;

          if (numVideoTracks < 0) {
            transceiver.wantReceive = false;
          }
        }
      }); // Create M-lines for recvonly streams.

      while (numAudioTracks > 0 || numVideoTracks > 0) {
        if (numAudioTracks > 0) {
          pc._createTransceiver('audio');

          numAudioTracks--;
        }

        if (numVideoTracks > 0) {
          pc._createTransceiver('video');

          numVideoTracks--;
        }
      }

      var sdp$$1 = sdp.writeSessionBoilerplate(pc._sdpSessionId, pc._sdpSessionVersion++);
      pc.transceivers.forEach(function (transceiver, sdpMLineIndex) {
        // For each track, create an ice gatherer, ice transport,
        // dtls transport, potentially rtpsender and rtpreceiver.
        var track = transceiver.track;
        var kind = transceiver.kind;
        var mid = transceiver.mid || sdp.generateIdentifier();
        transceiver.mid = mid;

        if (!transceiver.iceGatherer) {
          transceiver.iceGatherer = pc._createIceGatherer(sdpMLineIndex, pc.usingBundle);
        }

        var localCapabilities = window.RTCRtpSender.getCapabilities(kind); // filter RTX until additional stuff needed for RTX is implemented
        // in adapter.js

        if (edgeVersion < 15019) {
          localCapabilities.codecs = localCapabilities.codecs.filter(function (codec) {
            return codec.name !== 'rtx';
          });
        }

        localCapabilities.codecs.forEach(function (codec) {
          // work around https://bugs.chromium.org/p/webrtc/issues/detail?id=6552
          // by adding level-asymmetry-allowed=1
          if (codec.name === 'H264' && codec.parameters['level-asymmetry-allowed'] === undefined) {
            codec.parameters['level-asymmetry-allowed'] = '1';
          } // for subsequent offers, we might have to re-use the payload
          // type of the last offer.


          if (transceiver.remoteCapabilities && transceiver.remoteCapabilities.codecs) {
            transceiver.remoteCapabilities.codecs.forEach(function (remoteCodec) {
              if (codec.name.toLowerCase() === remoteCodec.name.toLowerCase() && codec.clockRate === remoteCodec.clockRate) {
                codec.preferredPayloadType = remoteCodec.payloadType;
              }
            });
          }
        });
        localCapabilities.headerExtensions.forEach(function (hdrExt) {
          var remoteExtensions = transceiver.remoteCapabilities && transceiver.remoteCapabilities.headerExtensions || [];
          remoteExtensions.forEach(function (rHdrExt) {
            if (hdrExt.uri === rHdrExt.uri) {
              hdrExt.id = rHdrExt.id;
            }
          });
        }); // generate an ssrc now, to be used later in rtpSender.send

        var sendEncodingParameters = transceiver.sendEncodingParameters || [{
          ssrc: (2 * sdpMLineIndex + 1) * 1001
        }];

        if (track) {
          // add RTX
          if (edgeVersion >= 15019 && kind === 'video' && !sendEncodingParameters[0].rtx) {
            sendEncodingParameters[0].rtx = {
              ssrc: sendEncodingParameters[0].ssrc + 1
            };
          }
        }

        if (transceiver.wantReceive) {
          transceiver.rtpReceiver = new window.RTCRtpReceiver(transceiver.dtlsTransport, kind);
        }

        transceiver.localCapabilities = localCapabilities;
        transceiver.sendEncodingParameters = sendEncodingParameters;
      }); // always offer BUNDLE and dispose on return if not supported.

      if (pc._config.bundlePolicy !== 'max-compat') {
        sdp$$1 += 'a=group:BUNDLE ' + pc.transceivers.map(function (t) {
          return t.mid;
        }).join(' ') + '\r\n';
      }

      sdp$$1 += 'a=ice-options:trickle\r\n';
      pc.transceivers.forEach(function (transceiver, sdpMLineIndex) {
        sdp$$1 += writeMediaSection(transceiver, transceiver.localCapabilities, 'offer', transceiver.stream, pc._dtlsRole);
        sdp$$1 += 'a=rtcp-rsize\r\n';

        if (transceiver.iceGatherer && pc.iceGatheringState !== 'new' && (sdpMLineIndex === 0 || !pc.usingBundle)) {
          transceiver.iceGatherer.getLocalCandidates().forEach(function (cand) {
            cand.component = 1;
            sdp$$1 += 'a=' + sdp.writeCandidate(cand) + '\r\n';
          });

          if (transceiver.iceGatherer.state === 'completed') {
            sdp$$1 += 'a=end-of-candidates\r\n';
          }
        }
      });
      var desc = new window.RTCSessionDescription({
        type: 'offer',
        sdp: sdp$$1
      });
      return Promise.resolve(desc);
    };

    RTCPeerConnection.prototype.createAnswer = function () {
      var pc = this;

      if (pc._isClosed) {
        return Promise.reject(makeError('InvalidStateError', 'Can not call createAnswer after close'));
      }

      if (!(pc.signalingState === 'have-remote-offer' || pc.signalingState === 'have-local-pranswer')) {
        return Promise.reject(makeError('InvalidStateError', 'Can not call createAnswer in signalingState ' + pc.signalingState));
      }

      var sdp$$1 = sdp.writeSessionBoilerplate(pc._sdpSessionId, pc._sdpSessionVersion++);

      if (pc.usingBundle) {
        sdp$$1 += 'a=group:BUNDLE ' + pc.transceivers.map(function (t) {
          return t.mid;
        }).join(' ') + '\r\n';
      }

      sdp$$1 += 'a=ice-options:trickle\r\n';
      var mediaSectionsInOffer = sdp.getMediaSections(pc._remoteDescription.sdp).length;
      pc.transceivers.forEach(function (transceiver, sdpMLineIndex) {
        if (sdpMLineIndex + 1 > mediaSectionsInOffer) {
          return;
        }

        if (transceiver.rejected) {
          if (transceiver.kind === 'application') {
            if (transceiver.protocol === 'DTLS/SCTP') {
              // legacy fmt
              sdp$$1 += 'm=application 0 DTLS/SCTP 5000\r\n';
            } else {
              sdp$$1 += 'm=application 0 ' + transceiver.protocol + ' webrtc-datachannel\r\n';
            }
          } else if (transceiver.kind === 'audio') {
            sdp$$1 += 'm=audio 0 UDP/TLS/RTP/SAVPF 0\r\n' + 'a=rtpmap:0 PCMU/8000\r\n';
          } else if (transceiver.kind === 'video') {
            sdp$$1 += 'm=video 0 UDP/TLS/RTP/SAVPF 120\r\n' + 'a=rtpmap:120 VP8/90000\r\n';
          }

          sdp$$1 += 'c=IN IP4 0.0.0.0\r\n' + 'a=inactive\r\n' + 'a=mid:' + transceiver.mid + '\r\n';
          return;
        } // FIXME: look at direction.


        if (transceiver.stream) {
          var localTrack;

          if (transceiver.kind === 'audio') {
            localTrack = transceiver.stream.getAudioTracks()[0];
          } else if (transceiver.kind === 'video') {
            localTrack = transceiver.stream.getVideoTracks()[0];
          }

          if (localTrack) {
            // add RTX
            if (edgeVersion >= 15019 && transceiver.kind === 'video' && !transceiver.sendEncodingParameters[0].rtx) {
              transceiver.sendEncodingParameters[0].rtx = {
                ssrc: transceiver.sendEncodingParameters[0].ssrc + 1
              };
            }
          }
        } // Calculate intersection of capabilities.


        var commonCapabilities = getCommonCapabilities(transceiver.localCapabilities, transceiver.remoteCapabilities);
        var hasRtx = commonCapabilities.codecs.filter(function (c) {
          return c.name.toLowerCase() === 'rtx';
        }).length;

        if (!hasRtx && transceiver.sendEncodingParameters[0].rtx) {
          delete transceiver.sendEncodingParameters[0].rtx;
        }

        sdp$$1 += writeMediaSection(transceiver, commonCapabilities, 'answer', transceiver.stream, pc._dtlsRole);

        if (transceiver.rtcpParameters && transceiver.rtcpParameters.reducedSize) {
          sdp$$1 += 'a=rtcp-rsize\r\n';
        }
      });
      var desc = new window.RTCSessionDescription({
        type: 'answer',
        sdp: sdp$$1
      });
      return Promise.resolve(desc);
    };

    RTCPeerConnection.prototype.addIceCandidate = function (candidate) {
      var pc = this;
      var sections;

      if (candidate && !(candidate.sdpMLineIndex !== undefined || candidate.sdpMid)) {
        return Promise.reject(new TypeError('sdpMLineIndex or sdpMid required'));
      } // TODO: needs to go into ops queue.


      return new Promise(function (resolve, reject) {
        if (!pc._remoteDescription) {
          return reject(makeError('InvalidStateError', 'Can not add ICE candidate without a remote description'));
        } else if (!candidate || candidate.candidate === '') {
          for (var j = 0; j < pc.transceivers.length; j++) {
            if (pc.transceivers[j].rejected) {
              continue;
            }

            pc.transceivers[j].iceTransport.addRemoteCandidate({});
            sections = sdp.getMediaSections(pc._remoteDescription.sdp);
            sections[j] += 'a=end-of-candidates\r\n';
            pc._remoteDescription.sdp = sdp.getDescription(pc._remoteDescription.sdp) + sections.join('');

            if (pc.usingBundle) {
              break;
            }
          }
        } else {
          var sdpMLineIndex = candidate.sdpMLineIndex;

          if (candidate.sdpMid) {
            for (var i = 0; i < pc.transceivers.length; i++) {
              if (pc.transceivers[i].mid === candidate.sdpMid) {
                sdpMLineIndex = i;
                break;
              }
            }
          }

          var transceiver = pc.transceivers[sdpMLineIndex];

          if (transceiver) {
            if (transceiver.rejected) {
              return resolve();
            }

            var cand = Object.keys(candidate.candidate).length > 0 ? sdp.parseCandidate(candidate.candidate) : {}; // Ignore Chrome's invalid candidates since Edge does not like them.

            if (cand.protocol === 'tcp' && (cand.port === 0 || cand.port === 9)) {
              return resolve();
            } // Ignore RTCP candidates, we assume RTCP-MUX.


            if (cand.component && cand.component !== 1) {
              return resolve();
            } // when using bundle, avoid adding candidates to the wrong
            // ice transport. And avoid adding candidates added in the SDP.


            if (sdpMLineIndex === 0 || sdpMLineIndex > 0 && transceiver.iceTransport !== pc.transceivers[0].iceTransport) {
              if (!maybeAddCandidate(transceiver.iceTransport, cand)) {
                return reject(makeError('OperationError', 'Can not add ICE candidate'));
              }
            } // update the remoteDescription.


            var candidateString = candidate.candidate.trim();

            if (candidateString.indexOf('a=') === 0) {
              candidateString = candidateString.substr(2);
            }

            sections = sdp.getMediaSections(pc._remoteDescription.sdp);
            sections[sdpMLineIndex] += 'a=' + (cand.type ? candidateString : 'end-of-candidates') + '\r\n';
            pc._remoteDescription.sdp = sdp.getDescription(pc._remoteDescription.sdp) + sections.join('');
          } else {
            return reject(makeError('OperationError', 'Can not add ICE candidate'));
          }
        }

        resolve();
      });
    };

    RTCPeerConnection.prototype.getStats = function (selector) {
      if (selector && selector instanceof window.MediaStreamTrack) {
        var senderOrReceiver = null;
        this.transceivers.forEach(function (transceiver) {
          if (transceiver.rtpSender && transceiver.rtpSender.track === selector) {
            senderOrReceiver = transceiver.rtpSender;
          } else if (transceiver.rtpReceiver && transceiver.rtpReceiver.track === selector) {
            senderOrReceiver = transceiver.rtpReceiver;
          }
        });

        if (!senderOrReceiver) {
          throw makeError('InvalidAccessError', 'Invalid selector.');
        }

        return senderOrReceiver.getStats();
      }

      var promises = [];
      this.transceivers.forEach(function (transceiver) {
        ['rtpSender', 'rtpReceiver', 'iceGatherer', 'iceTransport', 'dtlsTransport'].forEach(function (method) {
          if (transceiver[method]) {
            promises.push(transceiver[method].getStats());
          }
        });
      });
      return Promise.all(promises).then(function (allStats) {
        var results = new Map();
        allStats.forEach(function (stats) {
          stats.forEach(function (stat) {
            results.set(stat.id, stat);
          });
        });
        return results;
      });
    }; // fix low-level stat names and return Map instead of object.


    var ortcObjects = ['RTCRtpSender', 'RTCRtpReceiver', 'RTCIceGatherer', 'RTCIceTransport', 'RTCDtlsTransport'];
    ortcObjects.forEach(function (ortcObjectName) {
      var obj = window[ortcObjectName];

      if (obj && obj.prototype && obj.prototype.getStats) {
        var nativeGetstats = obj.prototype.getStats;

        obj.prototype.getStats = function () {
          return nativeGetstats.apply(this).then(function (nativeStats) {
            var mapStats = new Map();
            Object.keys(nativeStats).forEach(function (id) {
              nativeStats[id].type = fixStatsType(nativeStats[id]);
              mapStats.set(id, nativeStats[id]);
            });
            return mapStats;
          });
        };
      }
    }); // legacy callback shims. Should be moved to adapter.js some days.

    var methods = ['createOffer', 'createAnswer'];
    methods.forEach(function (method) {
      var nativeMethod = RTCPeerConnection.prototype[method];

      RTCPeerConnection.prototype[method] = function () {
        var args = arguments;

        if (typeof args[0] === 'function' || typeof args[1] === 'function') {
          // legacy
          return nativeMethod.apply(this, [arguments[2]]).then(function (description) {
            if (typeof args[0] === 'function') {
              args[0].apply(null, [description]);
            }
          }, function (error) {
            if (typeof args[1] === 'function') {
              args[1].apply(null, [error]);
            }
          });
        }

        return nativeMethod.apply(this, arguments);
      };
    });
    methods = ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate'];
    methods.forEach(function (method) {
      var nativeMethod = RTCPeerConnection.prototype[method];

      RTCPeerConnection.prototype[method] = function () {
        var args = arguments;

        if (typeof args[1] === 'function' || typeof args[2] === 'function') {
          // legacy
          return nativeMethod.apply(this, arguments).then(function () {
            if (typeof args[1] === 'function') {
              args[1].apply(null);
            }
          }, function (error) {
            if (typeof args[2] === 'function') {
              args[2].apply(null, [error]);
            }
          });
        }

        return nativeMethod.apply(this, arguments);
      };
    }); // getStats is special. It doesn't have a spec legacy method yet we support
    // getStats(something, cb) without error callbacks.

    ['getStats'].forEach(function (method) {
      var nativeMethod = RTCPeerConnection.prototype[method];

      RTCPeerConnection.prototype[method] = function () {
        var args = arguments;

        if (typeof args[1] === 'function') {
          return nativeMethod.apply(this, arguments).then(function () {
            if (typeof args[1] === 'function') {
              args[1].apply(null);
            }
          });
        }

        return nativeMethod.apply(this, arguments);
      };
    });
    return RTCPeerConnection;
  };

  /*
   *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
   *
   *  Use of this source code is governed by a BSD-style license
   *  that can be found in the LICENSE file in the root of the source
   *  tree.
   */

  var getusermedia$1 = function (window) {
    var navigator = window && window.navigator;

    var shimError_ = function (e) {
      return {
        name: {
          PermissionDeniedError: 'NotAllowedError'
        }[e.name] || e.name,
        message: e.message,
        constraint: e.constraint,
        toString: function () {
          return this.name;
        }
      };
    }; // getUserMedia error shim.


    var origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

    navigator.mediaDevices.getUserMedia = function (c) {
      return origGetUserMedia(c).catch(function (e) {
        return Promise.reject(shimError_(e));
      });
    };
  };

  var edge_shim = {
    shimGetUserMedia: getusermedia$1,
    shimPeerConnection: function (window) {
      var browserDetails = utils.detectBrowser(window);

      if (window.RTCIceGatherer) {
        if (!window.RTCIceCandidate) {
          window.RTCIceCandidate = function (args) {
            return args;
          };
        }

        if (!window.RTCSessionDescription) {
          window.RTCSessionDescription = function (args) {
            return args;
          };
        } // this adds an additional event listener to MediaStrackTrack that signals
        // when a tracks enabled property was changed. Workaround for a bug in
        // addStream, see below. No longer required in 15025+


        if (browserDetails.version < 15025) {
          var origMSTEnabled = Object.getOwnPropertyDescriptor(window.MediaStreamTrack.prototype, 'enabled');
          Object.defineProperty(window.MediaStreamTrack.prototype, 'enabled', {
            set: function (value) {
              origMSTEnabled.set.call(this, value);
              var ev = new Event('enabled');
              ev.enabled = value;
              this.dispatchEvent(ev);
            }
          });
        }
      } // ORTC defines the DTMF sender a bit different.
      // https://github.com/w3c/ortc/issues/714


      if (window.RTCRtpSender && !('dtmf' in window.RTCRtpSender.prototype)) {
        Object.defineProperty(window.RTCRtpSender.prototype, 'dtmf', {
          get: function () {
            if (this._dtmf === undefined) {
              if (this.track.kind === 'audio') {
                this._dtmf = new window.RTCDtmfSender(this);
              } else if (this.track.kind === 'video') {
                this._dtmf = null;
              }
            }

            return this._dtmf;
          }
        });
      } // Edge currently only implements the RTCDtmfSender, not the
      // RTCDTMFSender alias. See http://draft.ortc.org/#rtcdtmfsender2*


      if (window.RTCDtmfSender && !window.RTCDTMFSender) {
        window.RTCDTMFSender = window.RTCDtmfSender;
      }

      var RTCPeerConnectionShim = rtcpeerconnection(window, browserDetails.version);

      window.RTCPeerConnection = function (config) {
        if (config && config.iceServers) {
          config.iceServers = filtericeservers(config.iceServers);
        }

        return new RTCPeerConnectionShim(config);
      };

      window.RTCPeerConnection.prototype = RTCPeerConnectionShim.prototype;
    },
    shimReplaceTrack: function (window) {
      // ORTC has replaceTrack -- https://github.com/w3c/ortc/issues/614
      if (window.RTCRtpSender && !('replaceTrack' in window.RTCRtpSender.prototype)) {
        window.RTCRtpSender.prototype.replaceTrack = window.RTCRtpSender.prototype.setTrack;
      }
    }
  };

  var logging$2 = utils.log; // Expose public methods.

  var getusermedia$2 = function (window) {
    var browserDetails = utils.detectBrowser(window);
    var navigator = window && window.navigator;
    var MediaStreamTrack = window && window.MediaStreamTrack;

    var shimError_ = function (e) {
      return {
        name: {
          InternalError: 'NotReadableError',
          NotSupportedError: 'TypeError',
          PermissionDeniedError: 'NotAllowedError',
          SecurityError: 'NotAllowedError'
        }[e.name] || e.name,
        message: {
          'The operation is insecure.': 'The request is not allowed by the ' + 'user agent or the platform in the current context.'
        }[e.message] || e.message,
        constraint: e.constraint,
        toString: function () {
          return this.name + (this.message && ': ') + this.message;
        }
      };
    }; // getUserMedia constraints shim.


    var getUserMedia_ = function (constraints, onSuccess, onError) {
      var constraintsToFF37_ = function (c) {
        if (typeof c !== 'object' || c.require) {
          return c;
        }

        var require = [];
        Object.keys(c).forEach(function (key) {
          if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
            return;
          }

          var r = c[key] = typeof c[key] === 'object' ? c[key] : {
            ideal: c[key]
          };

          if (r.min !== undefined || r.max !== undefined || r.exact !== undefined) {
            require.push(key);
          }

          if (r.exact !== undefined) {
            if (typeof r.exact === 'number') {
              r.min = r.max = r.exact;
            } else {
              c[key] = r.exact;
            }

            delete r.exact;
          }

          if (r.ideal !== undefined) {
            c.advanced = c.advanced || [];
            var oc = {};

            if (typeof r.ideal === 'number') {
              oc[key] = {
                min: r.ideal,
                max: r.ideal
              };
            } else {
              oc[key] = r.ideal;
            }

            c.advanced.push(oc);
            delete r.ideal;

            if (!Object.keys(r).length) {
              delete c[key];
            }
          }
        });

        if (require.length) {
          c.require = require;
        }

        return c;
      };

      constraints = JSON.parse(JSON.stringify(constraints));

      if (browserDetails.version < 38) {
        logging$2('spec: ' + JSON.stringify(constraints));

        if (constraints.audio) {
          constraints.audio = constraintsToFF37_(constraints.audio);
        }

        if (constraints.video) {
          constraints.video = constraintsToFF37_(constraints.video);
        }

        logging$2('ff37: ' + JSON.stringify(constraints));
      }

      return navigator.mozGetUserMedia(constraints, onSuccess, function (e) {
        onError(shimError_(e));
      });
    }; // Returns the result of getUserMedia as a Promise.


    var getUserMediaPromise_ = function (constraints) {
      return new Promise(function (resolve, reject) {
        getUserMedia_(constraints, resolve, reject);
      });
    }; // Shim for mediaDevices on older versions.


    if (!navigator.mediaDevices) {
      navigator.mediaDevices = {
        getUserMedia: getUserMediaPromise_,
        addEventListener: function () {},
        removeEventListener: function () {}
      };
    }

    navigator.mediaDevices.enumerateDevices = navigator.mediaDevices.enumerateDevices || function () {
      return new Promise(function (resolve) {
        var infos = [{
          kind: 'audioinput',
          deviceId: 'default',
          label: '',
          groupId: ''
        }, {
          kind: 'videoinput',
          deviceId: 'default',
          label: '',
          groupId: ''
        }];
        resolve(infos);
      });
    };

    if (browserDetails.version < 41) {
      // Work around http://bugzil.la/1169665
      var orgEnumerateDevices = navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);

      navigator.mediaDevices.enumerateDevices = function () {
        return orgEnumerateDevices().then(undefined, function (e) {
          if (e.name === 'NotFoundError') {
            return [];
          }

          throw e;
        });
      };
    }

    if (browserDetails.version < 49) {
      var origGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

      navigator.mediaDevices.getUserMedia = function (c) {
        return origGetUserMedia(c).then(function (stream) {
          // Work around https://bugzil.la/802326
          if (c.audio && !stream.getAudioTracks().length || c.video && !stream.getVideoTracks().length) {
            stream.getTracks().forEach(function (track) {
              track.stop();
            });
            throw new DOMException('The object can not be found here.', 'NotFoundError');
          }

          return stream;
        }, function (e) {
          return Promise.reject(shimError_(e));
        });
      };
    }

    if (!(browserDetails.version > 55 && 'autoGainControl' in navigator.mediaDevices.getSupportedConstraints())) {
      var remap = function (obj, a, b) {
        if (a in obj && !(b in obj)) {
          obj[b] = obj[a];
          delete obj[a];
        }
      };

      var nativeGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

      navigator.mediaDevices.getUserMedia = function (c) {
        if (typeof c === 'object' && typeof c.audio === 'object') {
          c = JSON.parse(JSON.stringify(c));
          remap(c.audio, 'autoGainControl', 'mozAutoGainControl');
          remap(c.audio, 'noiseSuppression', 'mozNoiseSuppression');
        }

        return nativeGetUserMedia(c);
      };

      if (MediaStreamTrack && MediaStreamTrack.prototype.getSettings) {
        var nativeGetSettings = MediaStreamTrack.prototype.getSettings;

        MediaStreamTrack.prototype.getSettings = function () {
          var obj = nativeGetSettings.apply(this, arguments);
          remap(obj, 'mozAutoGainControl', 'autoGainControl');
          remap(obj, 'mozNoiseSuppression', 'noiseSuppression');
          return obj;
        };
      }

      if (MediaStreamTrack && MediaStreamTrack.prototype.applyConstraints) {
        var nativeApplyConstraints = MediaStreamTrack.prototype.applyConstraints;

        MediaStreamTrack.prototype.applyConstraints = function (c) {
          if (this.kind === 'audio' && typeof c === 'object') {
            c = JSON.parse(JSON.stringify(c));
            remap(c, 'autoGainControl', 'mozAutoGainControl');
            remap(c, 'noiseSuppression', 'mozNoiseSuppression');
          }

          return nativeApplyConstraints.apply(this, [c]);
        };
      }
    }

    navigator.getUserMedia = function (constraints, onSuccess, onError) {
      if (browserDetails.version < 44) {
        return getUserMedia_(constraints, onSuccess, onError);
      } // Replace Firefox 44+'s deprecation warning with unprefixed version.


      utils.deprecated('navigator.getUserMedia', 'navigator.mediaDevices.getUserMedia');
      navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
    };
  };

  var firefox_shim = {
    shimGetUserMedia: getusermedia$2,
    shimOnTrack: function (window) {
      if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in window.RTCPeerConnection.prototype)) {
        Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
          get: function () {
            return this._ontrack;
          },
          set: function (f) {
            if (this._ontrack) {
              this.removeEventListener('track', this._ontrack);
              this.removeEventListener('addstream', this._ontrackpoly);
            }

            this.addEventListener('track', this._ontrack = f);
            this.addEventListener('addstream', this._ontrackpoly = function (e) {
              e.stream.getTracks().forEach(function (track) {
                var event = new Event('track');
                event.track = track;
                event.receiver = {
                  track: track
                };
                event.transceiver = {
                  receiver: event.receiver
                };
                event.streams = [e.stream];
                this.dispatchEvent(event);
              }.bind(this));
            }.bind(this));
          },
          enumerable: true,
          configurable: true
        });
      }

      if (typeof window === 'object' && window.RTCTrackEvent && 'receiver' in window.RTCTrackEvent.prototype && !('transceiver' in window.RTCTrackEvent.prototype)) {
        Object.defineProperty(window.RTCTrackEvent.prototype, 'transceiver', {
          get: function () {
            return {
              receiver: this.receiver
            };
          }
        });
      }
    },
    shimSourceObject: function (window) {
      // Firefox has supported mozSrcObject since FF22, unprefixed in 42.
      if (typeof window === 'object') {
        if (window.HTMLMediaElement && !('srcObject' in window.HTMLMediaElement.prototype)) {
          // Shim the srcObject property, once, when HTMLMediaElement is found.
          Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
            get: function () {
              return this.mozSrcObject;
            },
            set: function (stream) {
              this.mozSrcObject = stream;
            }
          });
        }
      }
    },
    shimPeerConnection: function (window) {
      var browserDetails = utils.detectBrowser(window);

      if (typeof window !== 'object' || !(window.RTCPeerConnection || window.mozRTCPeerConnection)) {
        return; // probably media.peerconnection.enabled=false in about:config
      } // The RTCPeerConnection object.


      if (!window.RTCPeerConnection) {
        window.RTCPeerConnection = window.mozRTCPeerConnection; // wrap static methods. Currently just generateCertificate.

        if (window.mozRTCPeerConnection.generateCertificate) {
          Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
            get: function () {
              return window.mozRTCPeerConnection.generateCertificate;
            }
          });
        }

        window.RTCSessionDescription = window.mozRTCSessionDescription;
        window.RTCIceCandidate = window.mozRTCIceCandidate;
      } // shim away need for obsolete RTCIceCandidate/RTCSessionDescription.


      ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate'].forEach(function (method) {
        var nativeMethod = window.RTCPeerConnection.prototype[method];

        window.RTCPeerConnection.prototype[method] = function () {
          arguments[0] = new (method === 'addIceCandidate' ? window.RTCIceCandidate : window.RTCSessionDescription)(arguments[0]);
          return nativeMethod.apply(this, arguments);
        };
      }); // support for addIceCandidate(null or undefined)

      var nativeAddIceCandidate = window.RTCPeerConnection.prototype.addIceCandidate;

      window.RTCPeerConnection.prototype.addIceCandidate = function () {
        if (!arguments[0]) {
          if (arguments[1]) {
            arguments[1].apply(null);
          }

          return Promise.resolve();
        }

        return nativeAddIceCandidate.apply(this, arguments);
      }; // shim getStats with maplike support


      var makeMapStats = function (stats) {
        var map = new Map();
        Object.keys(stats).forEach(function (key) {
          map.set(key, stats[key]);
          map[key] = stats[key];
        });
        return map;
      };

      var modernStatsTypes = {
        inboundrtp: 'inbound-rtp',
        outboundrtp: 'outbound-rtp',
        candidatepair: 'candidate-pair',
        localcandidate: 'local-candidate',
        remotecandidate: 'remote-candidate'
      };
      var nativeGetStats = window.RTCPeerConnection.prototype.getStats;

      window.RTCPeerConnection.prototype.getStats = function (selector, onSucc, onErr) {
        return nativeGetStats.apply(this, [selector || null]).then(function (stats) {
          if (browserDetails.version < 48) {
            stats = makeMapStats(stats);
          }

          if (browserDetails.version < 53 && !onSucc) {
            // Shim only promise getStats with spec-hyphens in type names
            // Leave callback version alone; misc old uses of forEach before Map
            try {
              stats.forEach(function (stat) {
                stat.type = modernStatsTypes[stat.type] || stat.type;
              });
            } catch (e) {
              if (e.name !== 'TypeError') {
                throw e;
              } // Avoid TypeError: "type" is read-only, in old versions. 34-43ish


              stats.forEach(function (stat, i) {
                stats.set(i, Object.assign({}, stat, {
                  type: modernStatsTypes[stat.type] || stat.type
                }));
              });
            }
          }

          return stats;
        }).then(onSucc, onErr);
      };
    },
    shimSenderGetStats: function (window) {
      if (!(typeof window === 'object' && window.RTCPeerConnection && window.RTCRtpSender)) {
        return;
      }

      if (window.RTCRtpSender && 'getStats' in window.RTCRtpSender.prototype) {
        return;
      }

      var origGetSenders = window.RTCPeerConnection.prototype.getSenders;

      if (origGetSenders) {
        window.RTCPeerConnection.prototype.getSenders = function () {
          var pc = this;
          var senders = origGetSenders.apply(pc, []);
          senders.forEach(function (sender) {
            sender._pc = pc;
          });
          return senders;
        };
      }

      var origAddTrack = window.RTCPeerConnection.prototype.addTrack;

      if (origAddTrack) {
        window.RTCPeerConnection.prototype.addTrack = function () {
          var sender = origAddTrack.apply(this, arguments);
          sender._pc = this;
          return sender;
        };
      }

      window.RTCRtpSender.prototype.getStats = function () {
        return this.track ? this._pc.getStats(this.track) : Promise.resolve(new Map());
      };
    },
    shimReceiverGetStats: function (window) {
      if (!(typeof window === 'object' && window.RTCPeerConnection && window.RTCRtpSender)) {
        return;
      }

      if (window.RTCRtpSender && 'getStats' in window.RTCRtpReceiver.prototype) {
        return;
      }

      var origGetReceivers = window.RTCPeerConnection.prototype.getReceivers;

      if (origGetReceivers) {
        window.RTCPeerConnection.prototype.getReceivers = function () {
          var pc = this;
          var receivers = origGetReceivers.apply(pc, []);
          receivers.forEach(function (receiver) {
            receiver._pc = pc;
          });
          return receivers;
        };
      }

      utils.wrapPeerConnectionEvent(window, 'track', function (e) {
        e.receiver._pc = e.srcElement;
        return e;
      });

      window.RTCRtpReceiver.prototype.getStats = function () {
        return this._pc.getStats(this.track);
      };
    },
    shimRemoveStream: function (window) {
      if (!window.RTCPeerConnection || 'removeStream' in window.RTCPeerConnection.prototype) {
        return;
      }

      window.RTCPeerConnection.prototype.removeStream = function (stream) {
        var pc = this;
        utils.deprecated('removeStream', 'removeTrack');
        this.getSenders().forEach(function (sender) {
          if (sender.track && stream.getTracks().indexOf(sender.track) !== -1) {
            pc.removeTrack(sender);
          }
        });
      };
    },
    shimRTCDataChannel: function (window) {
      // rename DataChannel to RTCDataChannel (native fix in FF60):
      // https://bugzilla.mozilla.org/show_bug.cgi?id=1173851
      if (window.DataChannel && !window.RTCDataChannel) {
        window.RTCDataChannel = window.DataChannel;
      }
    },
    shimGetDisplayMedia: function (window, preferredMediaSource) {
      if ('getDisplayMedia' in window.navigator) {
        return;
      }

      navigator.getDisplayMedia = function (constraints) {
        if (!(constraints && constraints.video)) {
          var err = new DOMException('getDisplayMedia without video ' + 'constraints is undefined');
          err.name = 'NotFoundError'; // from https://heycam.github.io/webidl/#idl-DOMException-error-names

          err.code = 8;
          return Promise.reject(err);
        }

        if (constraints.video === true) {
          constraints.video = {
            mediaSource: preferredMediaSource
          };
        } else {
          constraints.video.mediaSource = preferredMediaSource;
        }

        return navigator.mediaDevices.getUserMedia(constraints);
      };
    }
  };

  var safari_shim = {
    shimLocalStreamsAPI: function (window) {
      if (typeof window !== 'object' || !window.RTCPeerConnection) {
        return;
      }

      if (!('getLocalStreams' in window.RTCPeerConnection.prototype)) {
        window.RTCPeerConnection.prototype.getLocalStreams = function () {
          if (!this._localStreams) {
            this._localStreams = [];
          }

          return this._localStreams;
        };
      }

      if (!('getStreamById' in window.RTCPeerConnection.prototype)) {
        window.RTCPeerConnection.prototype.getStreamById = function (id) {
          var result = null;

          if (this._localStreams) {
            this._localStreams.forEach(function (stream) {
              if (stream.id === id) {
                result = stream;
              }
            });
          }

          if (this._remoteStreams) {
            this._remoteStreams.forEach(function (stream) {
              if (stream.id === id) {
                result = stream;
              }
            });
          }

          return result;
        };
      }

      if (!('addStream' in window.RTCPeerConnection.prototype)) {
        var _addTrack = window.RTCPeerConnection.prototype.addTrack;

        window.RTCPeerConnection.prototype.addStream = function (stream) {
          if (!this._localStreams) {
            this._localStreams = [];
          }

          if (this._localStreams.indexOf(stream) === -1) {
            this._localStreams.push(stream);
          }

          var pc = this;
          stream.getTracks().forEach(function (track) {
            _addTrack.call(pc, track, stream);
          });
        };

        window.RTCPeerConnection.prototype.addTrack = function (track, stream) {
          if (stream) {
            if (!this._localStreams) {
              this._localStreams = [stream];
            } else if (this._localStreams.indexOf(stream) === -1) {
              this._localStreams.push(stream);
            }
          }

          return _addTrack.call(this, track, stream);
        };
      }

      if (!('removeStream' in window.RTCPeerConnection.prototype)) {
        window.RTCPeerConnection.prototype.removeStream = function (stream) {
          if (!this._localStreams) {
            this._localStreams = [];
          }

          var index = this._localStreams.indexOf(stream);

          if (index === -1) {
            return;
          }

          this._localStreams.splice(index, 1);

          var pc = this;
          var tracks = stream.getTracks();
          this.getSenders().forEach(function (sender) {
            if (tracks.indexOf(sender.track) !== -1) {
              pc.removeTrack(sender);
            }
          });
        };
      }
    },
    shimRemoteStreamsAPI: function (window) {
      if (typeof window !== 'object' || !window.RTCPeerConnection) {
        return;
      }

      if (!('getRemoteStreams' in window.RTCPeerConnection.prototype)) {
        window.RTCPeerConnection.prototype.getRemoteStreams = function () {
          return this._remoteStreams ? this._remoteStreams : [];
        };
      }

      if (!('onaddstream' in window.RTCPeerConnection.prototype)) {
        Object.defineProperty(window.RTCPeerConnection.prototype, 'onaddstream', {
          get: function () {
            return this._onaddstream;
          },
          set: function (f) {
            if (this._onaddstream) {
              this.removeEventListener('addstream', this._onaddstream);
            }

            this.addEventListener('addstream', this._onaddstream = f);
          }
        });
        var origSetRemoteDescription = window.RTCPeerConnection.prototype.setRemoteDescription;

        window.RTCPeerConnection.prototype.setRemoteDescription = function () {
          var pc = this;

          if (!this._onaddstreampoly) {
            this.addEventListener('track', this._onaddstreampoly = function (e) {
              e.streams.forEach(function (stream) {
                if (!pc._remoteStreams) {
                  pc._remoteStreams = [];
                }

                if (pc._remoteStreams.indexOf(stream) >= 0) {
                  return;
                }

                pc._remoteStreams.push(stream);

                var event = new Event('addstream');
                event.stream = stream;
                pc.dispatchEvent(event);
              });
            });
          }

          return origSetRemoteDescription.apply(pc, arguments);
        };
      }
    },
    shimCallbacksAPI: function (window) {
      if (typeof window !== 'object' || !window.RTCPeerConnection) {
        return;
      }

      var prototype = window.RTCPeerConnection.prototype;
      var createOffer = prototype.createOffer;
      var createAnswer = prototype.createAnswer;
      var setLocalDescription = prototype.setLocalDescription;
      var setRemoteDescription = prototype.setRemoteDescription;
      var addIceCandidate = prototype.addIceCandidate;

      prototype.createOffer = function (successCallback, failureCallback) {
        var options = arguments.length >= 2 ? arguments[2] : arguments[0];
        var promise = createOffer.apply(this, [options]);

        if (!failureCallback) {
          return promise;
        }

        promise.then(successCallback, failureCallback);
        return Promise.resolve();
      };

      prototype.createAnswer = function (successCallback, failureCallback) {
        var options = arguments.length >= 2 ? arguments[2] : arguments[0];
        var promise = createAnswer.apply(this, [options]);

        if (!failureCallback) {
          return promise;
        }

        promise.then(successCallback, failureCallback);
        return Promise.resolve();
      };

      var withCallback = function (description, successCallback, failureCallback) {
        var promise = setLocalDescription.apply(this, [description]);

        if (!failureCallback) {
          return promise;
        }

        promise.then(successCallback, failureCallback);
        return Promise.resolve();
      };

      prototype.setLocalDescription = withCallback;

      withCallback = function (description, successCallback, failureCallback) {
        var promise = setRemoteDescription.apply(this, [description]);

        if (!failureCallback) {
          return promise;
        }

        promise.then(successCallback, failureCallback);
        return Promise.resolve();
      };

      prototype.setRemoteDescription = withCallback;

      withCallback = function (candidate, successCallback, failureCallback) {
        var promise = addIceCandidate.apply(this, [candidate]);

        if (!failureCallback) {
          return promise;
        }

        promise.then(successCallback, failureCallback);
        return Promise.resolve();
      };

      prototype.addIceCandidate = withCallback;
    },
    shimGetUserMedia: function (window) {
      var navigator = window && window.navigator;

      if (!navigator.getUserMedia) {
        if (navigator.webkitGetUserMedia) {
          navigator.getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
        } else if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.getUserMedia = function (constraints, cb, errcb) {
            navigator.mediaDevices.getUserMedia(constraints).then(cb, errcb);
          }.bind(navigator);
        }
      }
    },
    shimRTCIceServerUrls: function (window) {
      // migrate from non-spec RTCIceServer.url to RTCIceServer.urls
      var OrigPeerConnection = window.RTCPeerConnection;

      window.RTCPeerConnection = function (pcConfig, pcConstraints) {
        if (pcConfig && pcConfig.iceServers) {
          var newIceServers = [];

          for (var i = 0; i < pcConfig.iceServers.length; i++) {
            var server = pcConfig.iceServers[i];

            if (!server.hasOwnProperty('urls') && server.hasOwnProperty('url')) {
              utils.deprecated('RTCIceServer.url', 'RTCIceServer.urls');
              server = JSON.parse(JSON.stringify(server));
              server.urls = server.url;
              delete server.url;
              newIceServers.push(server);
            } else {
              newIceServers.push(pcConfig.iceServers[i]);
            }
          }

          pcConfig.iceServers = newIceServers;
        }

        return new OrigPeerConnection(pcConfig, pcConstraints);
      };

      window.RTCPeerConnection.prototype = OrigPeerConnection.prototype; // wrap static methods. Currently just generateCertificate.

      if ('generateCertificate' in window.RTCPeerConnection) {
        Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
          get: function () {
            return OrigPeerConnection.generateCertificate;
          }
        });
      }
    },
    shimTrackEventTransceiver: function (window) {
      // Add event.transceiver member over deprecated event.receiver
      if (typeof window === 'object' && window.RTCPeerConnection && 'receiver' in window.RTCTrackEvent.prototype && // can't check 'transceiver' in window.RTCTrackEvent.prototype, as it is
      // defined for some reason even when window.RTCTransceiver is not.
      !window.RTCTransceiver) {
        Object.defineProperty(window.RTCTrackEvent.prototype, 'transceiver', {
          get: function () {
            return {
              receiver: this.receiver
            };
          }
        });
      }
    },
    shimCreateOfferLegacy: function (window) {
      var origCreateOffer = window.RTCPeerConnection.prototype.createOffer;

      window.RTCPeerConnection.prototype.createOffer = function (offerOptions) {
        var pc = this;

        if (offerOptions) {
          if (typeof offerOptions.offerToReceiveAudio !== 'undefined') {
            // support bit values
            offerOptions.offerToReceiveAudio = !!offerOptions.offerToReceiveAudio;
          }

          var audioTransceiver = pc.getTransceivers().find(function (transceiver) {
            return transceiver.sender.track && transceiver.sender.track.kind === 'audio';
          });

          if (offerOptions.offerToReceiveAudio === false && audioTransceiver) {
            if (audioTransceiver.direction === 'sendrecv') {
              if (audioTransceiver.setDirection) {
                audioTransceiver.setDirection('sendonly');
              } else {
                audioTransceiver.direction = 'sendonly';
              }
            } else if (audioTransceiver.direction === 'recvonly') {
              if (audioTransceiver.setDirection) {
                audioTransceiver.setDirection('inactive');
              } else {
                audioTransceiver.direction = 'inactive';
              }
            }
          } else if (offerOptions.offerToReceiveAudio === true && !audioTransceiver) {
            pc.addTransceiver('audio');
          }

          if (typeof offerOptions.offerToReceiveVideo !== 'undefined') {
            // support bit values
            offerOptions.offerToReceiveVideo = !!offerOptions.offerToReceiveVideo;
          }

          var videoTransceiver = pc.getTransceivers().find(function (transceiver) {
            return transceiver.sender.track && transceiver.sender.track.kind === 'video';
          });

          if (offerOptions.offerToReceiveVideo === false && videoTransceiver) {
            if (videoTransceiver.direction === 'sendrecv') {
              videoTransceiver.setDirection('sendonly');
            } else if (videoTransceiver.direction === 'recvonly') {
              videoTransceiver.setDirection('inactive');
            }
          } else if (offerOptions.offerToReceiveVideo === true && !videoTransceiver) {
            pc.addTransceiver('video');
          }
        }

        return origCreateOffer.apply(pc, arguments);
      };
    }
  };

  var common_shim = {
    shimRTCIceCandidate: function (window) {
      // foundation is arbitrarily chosen as an indicator for full support for
      // https://w3c.github.io/webrtc-pc/#rtcicecandidate-interface
      if (!window.RTCIceCandidate || window.RTCIceCandidate && 'foundation' in window.RTCIceCandidate.prototype) {
        return;
      }

      var NativeRTCIceCandidate = window.RTCIceCandidate;

      window.RTCIceCandidate = function (args) {
        // Remove the a= which shouldn't be part of the candidate string.
        if (typeof args === 'object' && args.candidate && args.candidate.indexOf('a=') === 0) {
          args = JSON.parse(JSON.stringify(args));
          args.candidate = args.candidate.substr(2);
        }

        if (args.candidate && args.candidate.length) {
          // Augment the native candidate with the parsed fields.
          var nativeCandidate = new NativeRTCIceCandidate(args);
          var parsedCandidate = sdp.parseCandidate(args.candidate);
          var augmentedCandidate = Object.assign(nativeCandidate, parsedCandidate); // Add a serializer that does not serialize the extra attributes.

          augmentedCandidate.toJSON = function () {
            return {
              candidate: augmentedCandidate.candidate,
              sdpMid: augmentedCandidate.sdpMid,
              sdpMLineIndex: augmentedCandidate.sdpMLineIndex,
              usernameFragment: augmentedCandidate.usernameFragment
            };
          };

          return augmentedCandidate;
        }

        return new NativeRTCIceCandidate(args);
      };

      window.RTCIceCandidate.prototype = NativeRTCIceCandidate.prototype; // Hook up the augmented candidate in onicecandidate and
      // addEventListener('icecandidate', ...)

      utils.wrapPeerConnectionEvent(window, 'icecandidate', function (e) {
        if (e.candidate) {
          Object.defineProperty(e, 'candidate', {
            value: new window.RTCIceCandidate(e.candidate),
            writable: 'false'
          });
        }

        return e;
      });
    },
    // shimCreateObjectURL must be called before shimSourceObject to avoid loop.
    shimCreateObjectURL: function (window) {
      var URL = window && window.URL;

      if (!(typeof window === 'object' && window.HTMLMediaElement && 'srcObject' in window.HTMLMediaElement.prototype && URL.createObjectURL && URL.revokeObjectURL)) {
        // Only shim CreateObjectURL using srcObject if srcObject exists.
        return undefined;
      }

      var nativeCreateObjectURL = URL.createObjectURL.bind(URL);
      var nativeRevokeObjectURL = URL.revokeObjectURL.bind(URL);
      var streams = new Map(),
          newId = 0;

      URL.createObjectURL = function (stream) {
        if ('getTracks' in stream) {
          var url = 'polyblob:' + ++newId;
          streams.set(url, stream);
          utils.deprecated('URL.createObjectURL(stream)', 'elem.srcObject = stream');
          return url;
        }

        return nativeCreateObjectURL(stream);
      };

      URL.revokeObjectURL = function (url) {
        nativeRevokeObjectURL(url);
        streams.delete(url);
      };

      var dsc = Object.getOwnPropertyDescriptor(window.HTMLMediaElement.prototype, 'src');
      Object.defineProperty(window.HTMLMediaElement.prototype, 'src', {
        get: function () {
          return dsc.get.apply(this);
        },
        set: function (url) {
          this.srcObject = streams.get(url) || null;
          return dsc.set.apply(this, [url]);
        }
      });
      var nativeSetAttribute = window.HTMLMediaElement.prototype.setAttribute;

      window.HTMLMediaElement.prototype.setAttribute = function () {
        if (arguments.length === 2 && ('' + arguments[0]).toLowerCase() === 'src') {
          this.srcObject = streams.get(arguments[1]) || null;
        }

        return nativeSetAttribute.apply(this, arguments);
      };
    },
    shimMaxMessageSize: function (window) {
      if (window.RTCSctpTransport || !window.RTCPeerConnection) {
        return;
      }

      var browserDetails = utils.detectBrowser(window);

      if (!('sctp' in window.RTCPeerConnection.prototype)) {
        Object.defineProperty(window.RTCPeerConnection.prototype, 'sctp', {
          get: function () {
            return typeof this._sctp === 'undefined' ? null : this._sctp;
          }
        });
      }

      var sctpInDescription = function (description) {
        var sections = sdp.splitSections(description.sdp);
        sections.shift();
        return sections.some(function (mediaSection) {
          var mLine = sdp.parseMLine(mediaSection);
          return mLine && mLine.kind === 'application' && mLine.protocol.indexOf('SCTP') !== -1;
        });
      };

      var getRemoteFirefoxVersion = function (description) {
        // TODO: Is there a better solution for detecting Firefox?
        var match = description.sdp.match(/mozilla...THIS_IS_SDPARTA-(\d+)/);

        if (match === null || match.length < 2) {
          return -1;
        }

        var version = parseInt(match[1], 10); // Test for NaN (yes, this is ugly)

        return version !== version ? -1 : version;
      };

      var getCanSendMaxMessageSize = function (remoteIsFirefox) {
        // Every implementation we know can send at least 64 KiB.
        // Note: Although Chrome is technically able to send up to 256 KiB, the
        //       data does not reach the other peer reliably.
        //       See: https://bugs.chromium.org/p/webrtc/issues/detail?id=8419
        var canSendMaxMessageSize = 65536;

        if (browserDetails.browser === 'firefox') {
          if (browserDetails.version < 57) {
            if (remoteIsFirefox === -1) {
              // FF < 57 will send in 16 KiB chunks using the deprecated PPID
              // fragmentation.
              canSendMaxMessageSize = 16384;
            } else {
              // However, other FF (and RAWRTC) can reassemble PPID-fragmented
              // messages. Thus, supporting ~2 GiB when sending.
              canSendMaxMessageSize = 2147483637;
            }
          } else if (browserDetails.version < 60) {
            // Currently, all FF >= 57 will reset the remote maximum message size
            // to the default value when a data channel is created at a later
            // stage. :(
            // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1426831
            canSendMaxMessageSize = browserDetails.version === 57 ? 65535 : 65536;
          } else {
            // FF >= 60 supports sending ~2 GiB
            canSendMaxMessageSize = 2147483637;
          }
        }

        return canSendMaxMessageSize;
      };

      var getMaxMessageSize = function (description, remoteIsFirefox) {
        // Note: 65536 bytes is the default value from the SDP spec. Also,
        //       every implementation we know supports receiving 65536 bytes.
        var maxMessageSize = 65536; // FF 57 has a slightly incorrect default remote max message size, so
        // we need to adjust it here to avoid a failure when sending.
        // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1425697

        if (browserDetails.browser === 'firefox' && browserDetails.version === 57) {
          maxMessageSize = 65535;
        }

        var match = sdp.matchPrefix(description.sdp, 'a=max-message-size:');

        if (match.length > 0) {
          maxMessageSize = parseInt(match[0].substr(19), 10);
        } else if (browserDetails.browser === 'firefox' && remoteIsFirefox !== -1) {
          // If the maximum message size is not present in the remote SDP and
          // both local and remote are Firefox, the remote peer can receive
          // ~2 GiB.
          maxMessageSize = 2147483637;
        }

        return maxMessageSize;
      };

      var origSetRemoteDescription = window.RTCPeerConnection.prototype.setRemoteDescription;

      window.RTCPeerConnection.prototype.setRemoteDescription = function () {
        var pc = this;
        pc._sctp = null;

        if (sctpInDescription(arguments[0])) {
          // Check if the remote is FF.
          var isFirefox = getRemoteFirefoxVersion(arguments[0]); // Get the maximum message size the local peer is capable of sending

          var canSendMMS = getCanSendMaxMessageSize(isFirefox); // Get the maximum message size of the remote peer.

          var remoteMMS = getMaxMessageSize(arguments[0], isFirefox); // Determine final maximum message size

          var maxMessageSize;

          if (canSendMMS === 0 && remoteMMS === 0) {
            maxMessageSize = Number.POSITIVE_INFINITY;
          } else if (canSendMMS === 0 || remoteMMS === 0) {
            maxMessageSize = Math.max(canSendMMS, remoteMMS);
          } else {
            maxMessageSize = Math.min(canSendMMS, remoteMMS);
          } // Create a dummy RTCSctpTransport object and the 'maxMessageSize'
          // attribute.


          var sctp = {};
          Object.defineProperty(sctp, 'maxMessageSize', {
            get: function () {
              return maxMessageSize;
            }
          });
          pc._sctp = sctp;
        }

        return origSetRemoteDescription.apply(pc, arguments);
      };
    },
    shimSendThrowTypeError: function (window) {
      if (!(window.RTCPeerConnection && 'createDataChannel' in window.RTCPeerConnection.prototype)) {
        return;
      } // Note: Although Firefox >= 57 has a native implementation, the maximum
      //       message size can be reset for all data channels at a later stage.
      //       See: https://bugzilla.mozilla.org/show_bug.cgi?id=1426831


      function wrapDcSend(dc, pc) {
        var origDataChannelSend = dc.send;

        dc.send = function () {
          var data = arguments[0];
          var length = data.length || data.size || data.byteLength;

          if (dc.readyState === 'open' && pc.sctp && length > pc.sctp.maxMessageSize) {
            throw new TypeError('Message too large (can send a maximum of ' + pc.sctp.maxMessageSize + ' bytes)');
          }

          return origDataChannelSend.apply(dc, arguments);
        };
      }

      var origCreateDataChannel = window.RTCPeerConnection.prototype.createDataChannel;

      window.RTCPeerConnection.prototype.createDataChannel = function () {
        var pc = this;
        var dataChannel = origCreateDataChannel.apply(pc, arguments);
        wrapDcSend(dataChannel, pc);
        return dataChannel;
      };

      utils.wrapPeerConnectionEvent(window, 'datachannel', function (e) {
        wrapDcSend(e.channel, e.target);
        return e;
      });
    }
  };

  var adapter_factory = function (dependencies, opts) {
    var window = dependencies && dependencies.window;
    var options = {
      shimChrome: true,
      shimFirefox: true,
      shimEdge: true,
      shimSafari: true
    };

    for (var key in opts) {
      if (hasOwnProperty.call(opts, key)) {
        options[key] = opts[key];
      }
    } // Utils.


    var logging = utils.log;
    var browserDetails = utils.detectBrowser(window); // Uncomment the line below if you want logging to occur, including logging
    // for the switch statement below. Can also be turned on in the browser via
    // adapter.disableLog(false), but then logging from the switch statement below
    // will not appear.
    // require('./utils').disableLog(false);
    // Browser shims.

    var chromeShim = chrome_shim || null;
    var edgeShim = edge_shim || null;
    var firefoxShim = firefox_shim || null;
    var safariShim = safari_shim || null;
    var commonShim = common_shim || null; // Export to the adapter global object visible in the browser.

    var adapter = {
      browserDetails: browserDetails,
      commonShim: commonShim,
      extractVersion: utils.extractVersion,
      disableLog: utils.disableLog,
      disableWarnings: utils.disableWarnings
    }; // Shim browser if found.

    switch (browserDetails.browser) {
      case 'chrome':
        if (!chromeShim || !chromeShim.shimPeerConnection || !options.shimChrome) {
          logging('Chrome shim is not included in this adapter release.');
          return adapter;
        }

        logging('adapter.js shimming chrome.'); // Export to the adapter global object visible in the browser.

        adapter.browserShim = chromeShim;
        commonShim.shimCreateObjectURL(window);
        chromeShim.shimGetUserMedia(window);
        chromeShim.shimMediaStream(window);
        chromeShim.shimSourceObject(window);
        chromeShim.shimPeerConnection(window);
        chromeShim.shimOnTrack(window);
        chromeShim.shimAddTrackRemoveTrack(window);
        chromeShim.shimGetSendersWithDtmf(window);
        chromeShim.shimSenderReceiverGetStats(window);
        chromeShim.fixNegotiationNeeded(window);
        commonShim.shimRTCIceCandidate(window);
        commonShim.shimMaxMessageSize(window);
        commonShim.shimSendThrowTypeError(window);
        break;

      case 'firefox':
        if (!firefoxShim || !firefoxShim.shimPeerConnection || !options.shimFirefox) {
          logging('Firefox shim is not included in this adapter release.');
          return adapter;
        }

        logging('adapter.js shimming firefox.'); // Export to the adapter global object visible in the browser.

        adapter.browserShim = firefoxShim;
        commonShim.shimCreateObjectURL(window);
        firefoxShim.shimGetUserMedia(window);
        firefoxShim.shimSourceObject(window);
        firefoxShim.shimPeerConnection(window);
        firefoxShim.shimOnTrack(window);
        firefoxShim.shimRemoveStream(window);
        firefoxShim.shimSenderGetStats(window);
        firefoxShim.shimReceiverGetStats(window);
        firefoxShim.shimRTCDataChannel(window);
        commonShim.shimRTCIceCandidate(window);
        commonShim.shimMaxMessageSize(window);
        commonShim.shimSendThrowTypeError(window);
        break;

      case 'edge':
        if (!edgeShim || !edgeShim.shimPeerConnection || !options.shimEdge) {
          logging('MS edge shim is not included in this adapter release.');
          return adapter;
        }

        logging('adapter.js shimming edge.'); // Export to the adapter global object visible in the browser.

        adapter.browserShim = edgeShim;
        commonShim.shimCreateObjectURL(window);
        edgeShim.shimGetUserMedia(window);
        edgeShim.shimPeerConnection(window);
        edgeShim.shimReplaceTrack(window); // the edge shim implements the full RTCIceCandidate object.

        commonShim.shimMaxMessageSize(window);
        commonShim.shimSendThrowTypeError(window);
        break;

      case 'safari':
        if (!safariShim || !options.shimSafari) {
          logging('Safari shim is not included in this adapter release.');
          return adapter;
        }

        logging('adapter.js shimming safari.'); // Export to the adapter global object visible in the browser.

        adapter.browserShim = safariShim;
        commonShim.shimCreateObjectURL(window);
        safariShim.shimRTCIceServerUrls(window);
        safariShim.shimCreateOfferLegacy(window);
        safariShim.shimCallbacksAPI(window);
        safariShim.shimLocalStreamsAPI(window);
        safariShim.shimRemoteStreamsAPI(window);
        safariShim.shimTrackEventTransceiver(window);
        safariShim.shimGetUserMedia(window);
        commonShim.shimRTCIceCandidate(window);
        commonShim.shimMaxMessageSize(window);
        commonShim.shimSendThrowTypeError(window);
        break;

      default:
        logging('Unsupported browser!');
        break;
    }

    utils.wrapPeerConnectionCtor(window);
    return adapter;
  };

  var adapter_core = adapter_factory({
    window: commonjsGlobal.window
  });

  // originally pulled out of simple-peer
  var getBrowserRtc = function getBrowserRTC() {
    if (typeof window === 'undefined') return null;
    var wrtc = {
      RTCPeerConnection: window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection,
      RTCSessionDescription: window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription,
      RTCIceCandidate: window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate
    };
    if (!wrtc.RTCPeerConnection) return null;
    return wrtc;
  };

  // shim for using process in browser
  // based off https://github.com/defunctzombie/node-process/blob/master/browser.js
  function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
  }

  function defaultClearTimeout() {
    throw new Error('clearTimeout has not been defined');
  }

  var cachedSetTimeout = defaultSetTimout;
  var cachedClearTimeout = defaultClearTimeout;

  if (typeof global$1.setTimeout === 'function') {
    cachedSetTimeout = setTimeout;
  }

  if (typeof global$1.clearTimeout === 'function') {
    cachedClearTimeout = clearTimeout;
  }

  function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
      //normal enviroments in sane situations
      return setTimeout(fun, 0);
    } // if setTimeout wasn't available but was latter defined


    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
      cachedSetTimeout = setTimeout;
      return setTimeout(fun, 0);
    }

    try {
      // when when somebody has screwed with setTimeout but no I.E. maddness
      return cachedSetTimeout(fun, 0);
    } catch (e) {
      try {
        // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
        return cachedSetTimeout.call(null, fun, 0);
      } catch (e) {
        // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
        return cachedSetTimeout.call(this, fun, 0);
      }
    }
  }

  function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
      //normal enviroments in sane situations
      return clearTimeout(marker);
    } // if clearTimeout wasn't available but was latter defined


    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
      cachedClearTimeout = clearTimeout;
      return clearTimeout(marker);
    }

    try {
      // when when somebody has screwed with setTimeout but no I.E. maddness
      return cachedClearTimeout(marker);
    } catch (e) {
      try {
        // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
        return cachedClearTimeout.call(null, marker);
      } catch (e) {
        // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
        // Some versions of I.E. have different rules for clearTimeout vs setTimeout
        return cachedClearTimeout.call(this, marker);
      }
    }
  }

  var queue = [];
  var draining = false;
  var currentQueue;
  var queueIndex = -1;

  function cleanUpNextTick() {
    if (!draining || !currentQueue) {
      return;
    }

    draining = false;

    if (currentQueue.length) {
      queue = currentQueue.concat(queue);
    } else {
      queueIndex = -1;
    }

    if (queue.length) {
      drainQueue();
    }
  }

  function drainQueue() {
    if (draining) {
      return;
    }

    var timeout = runTimeout(cleanUpNextTick);
    draining = true;
    var len = queue.length;

    while (len) {
      currentQueue = queue;
      queue = [];

      while (++queueIndex < len) {
        if (currentQueue) {
          currentQueue[queueIndex].run();
        }
      }

      queueIndex = -1;
      len = queue.length;
    }

    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
  }

  function nextTick(fun) {
    var args = new Array(arguments.length - 1);

    if (arguments.length > 1) {
      for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }
    }

    queue.push(new Item(fun, args));

    if (queue.length === 1 && !draining) {
      runTimeout(drainQueue);
    }
  } // v8 likes predictible objects

  function Item(fun, array) {
    this.fun = fun;
    this.array = array;
  }

  Item.prototype.run = function () {
    this.fun.apply(null, this.array);
  };

  var title = 'browser';
  var platform = 'browser';
  var browser = true;
  var env = {};
  var argv = [];
  var version = ''; // empty string to avoid regexp issues

  var versions = {};
  var release = {};
  var config = {};

  function noop() {}

  var on = noop;
  var addListener = noop;
  var once = noop;
  var off = noop;
  var removeListener = noop;
  var removeAllListeners = noop;
  var emit = noop;
  function binding(name) {
    throw new Error('process.binding is not supported');
  }
  function cwd() {
    return '/';
  }
  function chdir(dir) {
    throw new Error('process.chdir is not supported');
  }
  function umask() {
    return 0;
  } // from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js

  var performance$1 = global$1.performance || {};

  var performanceNow = performance$1.now || performance$1.mozNow || performance$1.msNow || performance$1.oNow || performance$1.webkitNow || function () {
    return new Date().getTime();
  }; // generate timestamp or delta
  // see http://nodejs.org/api/process.html#process_process_hrtime


  function hrtime(previousTimestamp) {
    var clocktime = performanceNow.call(performance$1) * 1e-3;
    var seconds = Math.floor(clocktime);
    var nanoseconds = Math.floor(clocktime % 1 * 1e9);

    if (previousTimestamp) {
      seconds = seconds - previousTimestamp[0];
      nanoseconds = nanoseconds - previousTimestamp[1];

      if (nanoseconds < 0) {
        seconds--;
        nanoseconds += 1e9;
      }
    }

    return [seconds, nanoseconds];
  }
  var startTime = new Date();
  function uptime() {
    var currentTime = new Date();
    var dif = currentTime - startTime;
    return dif / 1000;
  }
  var process = {
    nextTick: nextTick,
    title: title,
    browser: browser,
    env: env,
    argv: argv,
    version: version,
    versions: versions,
    on: on,
    addListener: addListener,
    once: once,
    off: off,
    removeListener: removeListener,
    removeAllListeners: removeAllListeners,
    emit: emit,
    binding: binding,
    cwd: cwd,
    chdir: chdir,
    umask: umask,
    hrtime: hrtime,
    platform: platform,
    release: release,
    config: config,
    uptime: uptime
  };

  /**
   * Helpers.
   */
  var s = 1000;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var y = d * 365.25;
  /**
   * Parse or format the given `val`.
   *
   * Options:
   *
   *  - `long` verbose formatting [false]
   *
   * @param {String|Number} val
   * @param {Object} [options]
   * @throws {Error} throw an error if val is not a non-empty string or a number
   * @return {String|Number}
   * @api public
   */

  var ms = function (val, options) {
    options = options || {};
    var type = typeof val;

    if (type === 'string' && val.length > 0) {
      return parse(val);
    } else if (type === 'number' && isNaN(val) === false) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }

    throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val));
  };
  /**
   * Parse the given `str` and return milliseconds.
   *
   * @param {String} str
   * @return {Number}
   * @api private
   */


  function parse(str) {
    str = String(str);

    if (str.length > 100) {
      return;
    }

    var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);

    if (!match) {
      return;
    }

    var n = parseFloat(match[1]);
    var type = (match[2] || 'ms').toLowerCase();

    switch (type) {
      case 'years':
      case 'year':
      case 'yrs':
      case 'yr':
      case 'y':
        return n * y;

      case 'days':
      case 'day':
      case 'd':
        return n * d;

      case 'hours':
      case 'hour':
      case 'hrs':
      case 'hr':
      case 'h':
        return n * h;

      case 'minutes':
      case 'minute':
      case 'mins':
      case 'min':
      case 'm':
        return n * m;

      case 'seconds':
      case 'second':
      case 'secs':
      case 'sec':
      case 's':
        return n * s;

      case 'milliseconds':
      case 'millisecond':
      case 'msecs':
      case 'msec':
      case 'ms':
        return n;

      default:
        return undefined;
    }
  }
  /**
   * Short format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */


  function fmtShort(ms) {
    if (ms >= d) {
      return Math.round(ms / d) + 'd';
    }

    if (ms >= h) {
      return Math.round(ms / h) + 'h';
    }

    if (ms >= m) {
      return Math.round(ms / m) + 'm';
    }

    if (ms >= s) {
      return Math.round(ms / s) + 's';
    }

    return ms + 'ms';
  }
  /**
   * Long format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */


  function fmtLong(ms) {
    return plural(ms, d, 'day') || plural(ms, h, 'hour') || plural(ms, m, 'minute') || plural(ms, s, 'second') || ms + ' ms';
  }
  /**
   * Pluralization helper.
   */


  function plural(ms, n, name) {
    if (ms < n) {
      return;
    }

    if (ms < n * 1.5) {
      return Math.floor(ms / n) + ' ' + name;
    }

    return Math.ceil(ms / n) + ' ' + name + 's';
  }

  var debug = createCommonjsModule(function (module, exports) {
    /**
     * This is the common logic for both the Node.js and web browser
     * implementations of `debug()`.
     *
     * Expose `debug()` as the module.
     */
    exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
    exports.coerce = coerce;
    exports.disable = disable;
    exports.enable = enable;
    exports.enabled = enabled;
    exports.humanize = ms;
    /**
     * The currently active debug mode names, and names to skip.
     */

    exports.names = [];
    exports.skips = [];
    /**
     * Map of special "%n" handling functions, for the debug "format" argument.
     *
     * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
     */

    exports.formatters = {};
    /**
     * Previous log timestamp.
     */

    var prevTime;
    /**
     * Select a color.
     * @param {String} namespace
     * @return {Number}
     * @api private
     */

    function selectColor(namespace) {
      var hash = 0,
          i;

      for (i in namespace) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }

      return exports.colors[Math.abs(hash) % exports.colors.length];
    }
    /**
     * Create a debugger with the given `namespace`.
     *
     * @param {String} namespace
     * @return {Function}
     * @api public
     */


    function createDebug(namespace) {
      function debug() {
        // disabled?
        if (!debug.enabled) return;
        var self = debug; // set `diff` timestamp

        var curr = +new Date();
        var ms$$1 = curr - (prevTime || curr);
        self.diff = ms$$1;
        self.prev = prevTime;
        self.curr = curr;
        prevTime = curr; // turn the `arguments` into a proper Array

        var args = new Array(arguments.length);

        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }

        args[0] = exports.coerce(args[0]);

        if ('string' !== typeof args[0]) {
          // anything else let's inspect with %O
          args.unshift('%O');
        } // apply any `formatters` transformations


        var index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, function (match, format) {
          // if we encounter an escaped % then don't increase the array index
          if (match === '%%') return match;
          index++;
          var formatter = exports.formatters[format];

          if ('function' === typeof formatter) {
            var val = args[index];
            match = formatter.call(self, val); // now we need to remove `args[index]` since it's inlined in the `format`

            args.splice(index, 1);
            index--;
          }

          return match;
        }); // apply env-specific formatting (colors, etc.)

        exports.formatArgs.call(self, args);
        var logFn = debug.log || exports.log || console.log.bind(console);
        logFn.apply(self, args);
      }

      debug.namespace = namespace;
      debug.enabled = exports.enabled(namespace);
      debug.useColors = exports.useColors();
      debug.color = selectColor(namespace); // env-specific initialization logic for debug instances

      if ('function' === typeof exports.init) {
        exports.init(debug);
      }

      return debug;
    }
    /**
     * Enables a debug mode by namespaces. This can include modes
     * separated by a colon and wildcards.
     *
     * @param {String} namespaces
     * @api public
     */


    function enable(namespaces) {
      exports.save(namespaces);
      exports.names = [];
      exports.skips = [];
      var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
      var len = split.length;

      for (var i = 0; i < len; i++) {
        if (!split[i]) continue; // ignore empty strings

        namespaces = split[i].replace(/\*/g, '.*?');

        if (namespaces[0] === '-') {
          exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
        } else {
          exports.names.push(new RegExp('^' + namespaces + '$'));
        }
      }
    }
    /**
     * Disable debug output.
     *
     * @api public
     */


    function disable() {
      exports.enable('');
    }
    /**
     * Returns true if the given mode name is enabled, false otherwise.
     *
     * @param {String} name
     * @return {Boolean}
     * @api public
     */


    function enabled(name) {
      var i, len;

      for (i = 0, len = exports.skips.length; i < len; i++) {
        if (exports.skips[i].test(name)) {
          return false;
        }
      }

      for (i = 0, len = exports.names.length; i < len; i++) {
        if (exports.names[i].test(name)) {
          return true;
        }
      }

      return false;
    }
    /**
     * Coerce `val`.
     *
     * @param {Mixed} val
     * @return {Mixed}
     * @api private
     */


    function coerce(val) {
      if (val instanceof Error) return val.stack || val.message;
      return val;
    }
  });
  var debug_1 = debug.coerce;
  var debug_2 = debug.disable;
  var debug_3 = debug.enable;
  var debug_4 = debug.enabled;
  var debug_5 = debug.humanize;
  var debug_6 = debug.names;
  var debug_7 = debug.skips;
  var debug_8 = debug.formatters;

  var browser$1 = createCommonjsModule(function (module, exports) {
    /**
     * This is the web browser implementation of `debug()`.
     *
     * Expose `debug()` as the module.
     */
    exports = module.exports = debug;
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = 'undefined' != typeof chrome && 'undefined' != typeof chrome.storage ? chrome.storage.local : localstorage();
    /**
     * Colors.
     */

    exports.colors = ['lightseagreen', 'forestgreen', 'goldenrod', 'dodgerblue', 'darkorchid', 'crimson'];
    /**
     * Currently only WebKit-based Web Inspectors, Firefox >= v31,
     * and the Firebug extension (any Firefox version) are known
     * to support "%c" CSS customizations.
     *
     * TODO: add a `localStorage` variable to explicitly enable/disable colors
     */

    function useColors() {
      // NB: In an Electron preload script, document will be defined but not fully
      // initialized. Since we know we're in Chrome, we'll just detect this case
      // explicitly
      if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
        return true;
      } // is webkit? http://stackoverflow.com/a/16459606/376773
      // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632


      return typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== 'undefined' && window.console && (window.console.firebug || window.console.exception && window.console.table) || // is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || // double check webkit in userAgent just in case we are in a worker
      typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    /**
     * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
     */


    exports.formatters.j = function (v) {
      try {
        return JSON.stringify(v);
      } catch (err) {
        return '[UnexpectedJSONParseError]: ' + err.message;
      }
    };
    /**
     * Colorize log arguments if enabled.
     *
     * @api public
     */


    function formatArgs(args) {
      var useColors = this.useColors;
      args[0] = (useColors ? '%c' : '') + this.namespace + (useColors ? ' %c' : ' ') + args[0] + (useColors ? '%c ' : ' ') + '+' + exports.humanize(this.diff);
      if (!useColors) return;
      var c = 'color: ' + this.color;
      args.splice(1, 0, c, 'color: inherit'); // the final "%c" is somewhat tricky, because there could be other
      // arguments passed either before or after the %c, so we need to
      // figure out the correct index to insert the CSS into

      var index = 0;
      var lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, function (match) {
        if ('%%' === match) return;
        index++;

        if ('%c' === match) {
          // we only are interested in the *last* %c
          // (the user may have provided their own)
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    /**
     * Invokes `console.log()` when available.
     * No-op when `console.log` is not a "function".
     *
     * @api public
     */


    function log() {
      // this hackery is required for IE8/9, where
      // the `console.log` function doesn't have 'apply'
      return 'object' === typeof console && console.log && Function.prototype.apply.call(console.log, console, arguments);
    }
    /**
     * Save `namespaces`.
     *
     * @param {String} namespaces
     * @api private
     */


    function save(namespaces) {
      try {
        if (null == namespaces) {
          exports.storage.removeItem('debug');
        } else {
          exports.storage.debug = namespaces;
        }
      } catch (e) {}
    }
    /**
     * Load `namespaces`.
     *
     * @return {String} returns the previously persisted debug modes
     * @api private
     */


    function load() {
      var r;

      try {
        r = exports.storage.debug;
      } catch (e) {} // If debug isn't set in LS, and we're in Electron, try to load $DEBUG


      if (!r && typeof process !== 'undefined' && 'env' in process) {
        r = process.env.DEBUG;
      }

      return r;
    }
    /**
     * Enable namespaces listed in `localStorage.debug` initially.
     */


    exports.enable(load());
    /**
     * Localstorage attempts to return the localstorage.
     *
     * This is necessary because safari throws
     * when a user disables cookies/localstorage
     * and you attempt to access it.
     *
     * @return {LocalStorage}
     * @api private
     */

    function localstorage() {
      try {
        return window.localStorage;
      } catch (e) {}
    }
  });
  var browser_1 = browser$1.log;
  var browser_2 = browser$1.formatArgs;
  var browser_3 = browser$1.save;
  var browser_4 = browser$1.load;
  var browser_5 = browser$1.useColors;
  var browser_6 = browser$1.storage;
  var browser_7 = browser$1.colors;

  /*! @allex/composite-key-weakmap v1.0.0 | MIT licensed | allex <allex.wxn@gmail.com> (http://iallex.com/) */
  var isUndefined = function (v) {
    return v === undefined || v === null;
  };
  /**
   * A map for weakly holding nested references.
   *
   * @private
   * @export
   * @class CompositeKeyWeakMap
   * @template T
   * @author Allex Wang (allex.wxn@gmail.com) <http://fedor.io/>
   * MIT Licensed
   */


  var CompositeKeyWeakMap =
  /** @class */
  function () {
    function CompositeKeyWeakMap() {
      this._weakMap = new WeakMap();
    }

    var _a = CompositeKeyWeakMap.prototype;

    _a.set = function (keys, value) {
      var map = this._weakMap;

      for (var i = 0, len = keys.length - 1; i < len; i++) {
        var key = keys[i];
        var next = map.get(key);

        if (!next) {
          next = new Map();
          map.set(key, next);
        }

        map = next;
      }

      map.set(keys[keys.length - 1], value);
    };

    _a.get = function (keys) {
      var next = this._weakMap;

      for (var i = 0, len = keys.length; i < len; i++) {
        next = next.get(keys[i]);

        if (isUndefined(next)) {
          break;
        }
      }

      return next;
    };

    _a.has = function (keys) {
      return !isUndefined(this.get(keys));
    };

    _a.delete = function (keys) {
      var map = this._weakMap;
      var paths = [map];

      for (var i = 0, len = keys.length - 1; i < len; i++) {
        var next = map.get(keys[i]);
        if (!next) return;
        paths.push(next);
        map = next;
      }

      var key, p;

      while (p = paths.pop(), key = keys.pop()) {
        if (!p) break;
        p.delete(key);
        if (p.size) break;
      }
    };

    return CompositeKeyWeakMap;
  }();

  /* @allex/crypto-util v1.0.0 | MIT licensed | allex <allex.wxn@gmail.com> (http://iallex.com/) */
  var HEX_CHARS = '0123456789abcdef'.split('');

  var safeAdd = function (x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return msw << 16 | lsw & 0xFFFF;
  };

  var ROTL = function (x, n) {
    return x << n | x >>> 32 - n;
  };

  var ensureBuffer = function (s) {
    if (typeof s !== 'string') {
      if (isInstance(s, ArrayBuffer) || s && isInstance(s.buffer, ArrayBuffer)) {
        s = fromArrayBuffer$1(s);
      }
    } else {
      s = str2utf8b(s);
    }

    return s;
  };

  function fromArrayBuffer$1(array) {
    var buf = new Uint8Array(array);
    return buf;
  }

  function str2utf8b(str) {
    var binstr = unescape(encodeURIComponent(str)),
        arr = new Uint8Array(binstr.length),
        split = binstr.split('');
    var l = split.length;

    while (l--) {
      arr[l] = split[l].charCodeAt(0);
    }

    return arr;
  }

  function isInstance(obj, type) {
    return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
  }

  /*! @allex/sha1 v1.0.4 | MIT licensed | allex <allex.wxn@gmail.com> (http://iallex.com/) */

  var _f = function (s, x, y, z) {
    switch (s) {
      case 0:
        return x & y ^ ~x & z;

      case 1:
        return x ^ y ^ z;

      case 2:
        return x & y ^ x & z ^ y & z;

      case 3:
      default:
        return x ^ y ^ z;
    }
  };

  var calcHash = function (blockArray) {
    var x = blockArray;
    var W = Array(80);
    var K = [0x5a827999, 0x6ed9eba1, 0x8f1bbcdc, 0xca62c1d6];
    var H = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];

    for (var i = 0, N = x.length; i < N; i += 16) {
      var a = H[0],
          b = H[1],
          c = H[2],
          d = H[3],
          e = H[4];

      for (var t = 0; t < 80; t += 1) {
        var s = t / 20 >> 0;

        if (t < 16) {
          W[t] = x[i + t];
        } else {
          W[t] = ROTL(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1) >>> 0;
        }

        var T = safeAdd(safeAdd(ROTL(a, 5), _f(s, b, c, d)), safeAdd(safeAdd(e, W[t]), K[s]));
        e = d;
        d = c;
        c = ROTL(b, 30) >>> 0;
        b = a;
        a = T;
      }

      H[0] = safeAdd(H[0] + a) >>> 0;
      H[1] = safeAdd(H[1] + b) >>> 0;
      H[2] = safeAdd(H[2] + c) >>> 0;
      H[3] = safeAdd(H[3] + d) >>> 0;
      H[4] = safeAdd(H[4] + e) >>> 0;
    }

    return H;
  };

  var alignSHA1 = function (buffer) {
    var l = buffer.length,
        nblk = (l + 8 >> 6) + 1,
        blks = new Array(nblk * 16);
    var i = 0;

    for (i = 0; i < nblk * 16; i += 1) {
      blks[i] = 0;
    }

    for (i = 0; i < l; i += 1) {
      blks[i >> 2] |= buffer[i] << 24 - (i & 3) * 8;
    }

    blks[i >> 2] |= 0x80 << 24 - (i & 3) * 8;
    blks[nblk * 16 - 1] = l * 8;
    return blks;
  };

  var binb2hex = function (H) {
    var chars = HEX_CHARS;
    var str = '';

    for (var i = 0, l = H.length * 4; i < l; i += 1) {
      str += chars[H[i >> 2] >> (3 - i % 4) * 8 + 4 & 0xF] + chars[H[i >> 2] >> (3 - i % 4) * 8 & 0xF];
    }

    return str;
  };

  var sha1 = function (s) {
    return binb2hex(calcHash(alignSHA1(ensureBuffer(s))));
  };

  /* @allex/crc32 v1.0.4 | MIT licensed | allex <allex.wxn@gmail.com> (http://iallex.com/) */
  var crc32b = function () {
    var table = new Uint32Array(256);

    for (var i = 256; i--;) {
      var c = i;

      for (var k = 8; k--;) {
        c = c & 1 ? 0xEDB88320 ^ c >>> 1 : c >>> 1;
      }

      table[i] = c;
    }

    return function (data) {
      var crc = -1;

      if (typeof data === 'string') {
        data = function (d) {
          var l = d.length,
              data = new Array(l);

          for (var i = -1; ++i < l;) {
            data[i] = d.charCodeAt(i);
          }

          return data;
        }(data);
      }

      for (var i = 0, l = data.length; i < l; i++) {
        crc = crc >>> 8 ^ table[crc & 0xFF ^ data[i]];
      }

      return (crc ^ -1) >>> 0;
    };
  }();

  var hex = function (what) {
    if (what < 0) what = 0xFFFFFFFF + what + 1;
    return ('0000000' + what.toString(16)).slice(-8);
  };

  var crc32 = function (data, encoding) {
    var crc = crc32b(data);

    if (encoding) {
      return hex(crc);
    }

    return crc;
  };

  var e = Array.isArray || function (t) {
    return "[object Array]" === toString.call(t);
  },
      o = void 0,
      u = ["Boolean", "Number", "String", "Function", "Array", "Date", "RegExp", "Undefined", "Null", "Object"].reduce(function (t, n, r) {
    return t["[object " + n + "]"] = n.toLowerCase(), t;
  }, {});

  function c(t) {
    return "string" == typeof t;
  }

  function s$1(t) {
    return "function" == typeof t;
  }

  function l(t) {
    return null !== t && "object" == typeof t;
  }

  function y$1(t, n) {
    return t === o || null === t && !n;
  }
  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0
   THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.
   See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** */


  var d$1 = function (t, n) {
    return (d$1 = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (t, n) {
      t.__proto__ = n;
    } || function (t, n) {
      for (var r in n) {
        n.hasOwnProperty(r) && (t[r] = n[r]);
      }
    })(t, n);
  };

  function _(t, n) {
    function r() {
      this.constructor = t;
    }

    d$1(t, n), t.prototype = null === n ? Object.create(n) : (r.prototype = n.prototype, new r());
  }

  var b = function (t) {
    function n() {
      return null !== t && t.apply(this, arguments) || this;
    }

    _(n, t);

    var r = n.prototype;
    return r.on = function (n, r) {
      return t.prototype.on.call(this, n, r);
    }, r.off = function (n, r) {
      return t.prototype.off.call(this, n, r);
    }, r.emit = function (n) {
      for (var r = [], e = 1; e < arguments.length; e++) {
        r[e - 1] = arguments[e];
      }

      return t.prototype.emit.apply(this, [n].concat(r));
    }, n;
  }(EventEmitter),
      g = function (t) {
    function n() {
      var n = null !== t && t.apply(this, arguments) || this;
      return n._q = new Map(), n;
    }

    _(n, t);

    var r = n.prototype;
    return Object.defineProperty(r, "size", {
      get: function () {
        return this._q.size;
      },
      enumerable: !0,
      configurable: !0
    }), r.set = function (t, n) {
      this._q.set(t, n), this.emit("queue/set", t, n);
    }, r.get = function (t) {
      return this._q.get(t);
    }, r.keys = function () {
      return Array.from(this._q.keys());
    }, r.values = function () {
      return Array.from(this._q.values());
    }, r["delete"] = function (t) {
      return this._q["delete"](t);
    }, r.forEach = function (t) {
      this._q.forEach(t);
    }, r.clear = function () {
      this._q.clear();
    }, r.has = function (t) {
      return this._q.has(t);
    }, r.isEmpty = function () {
      return 0 === this._q.size;
    }, n;
  }(b),
      w = function (t) {
    return String(crc32(t, "hex"));
  },
      x = function (t) {
    return sha1(t);
  },
      j = function () {},
      A = function () {
    var t = {},
        n = new Promise(function (n, r) {
      t.f = n, t.r = r;
    });
    return n.resolve = t.f, n.reject = t.r, n.destroy = function () {
      n.destroy = j, t = n.resolve = n.reject = t.f = t.r = null;
    }, n;
  },
      E = function (t) {
    return function () {
      for (var n = [], r = 0; r < arguments.length; r++) {
        n[r] = arguments[r];
      }

      var e = n,
          o = function (n, r, o) {
        var u = function (t, n, r) {
          return r || Object.getOwnPropertyDescriptor(t, n) || {};
        }(n, r, o),
            i = u.value;

        return u.value = t.apply(void 0, [i].concat(e)), u;
      };

      return function (t) {
        return t.length >= 2 && l(t[0]) && c(t[1]) && s$1(t[0].constructor) && t[0].constructor.prototype === t[0];
      }(n) ? (e = [], o(n[0], n[1], n[2])) : o;
    };
  };

  var k = window.setTimeout,
      P = window.clearTimeout,
      D = function (t, n) {
    return n.reduce(function (n, r) {
      return n[r] = t[r], n;
    }, {});
  },
      F = function (t) {
    return 0 === t.indexOf("http://") || 0 === t.indexOf("https://");
  },
      N = function () {
    return performance.now();
  },
      S = window.setImmediate || nextTick;

  function C(t, n, r, e) {
    var o;
    return void 0 === n && (n = 0), function () {
      var u = e || this,
          i = arguments,
          c = r && !o;
      P(o), o = k(function () {
        o = 0, r || t.apply(u, i);
      }, n), c && t.apply(u, i);
    };
  }

  function M(t, n, r, e) {
    var o = e || function () {
      var n = [].slice.call(arguments, 0);
      return t.emit.apply(t, n);
    };

    r.forEach(function (r) {
      return n.on(r, o.bind(t, r));
    });
  }

  function B(t, n) {
    var r = new Error(t);
    return y$1(n) || (r.code = n), r;
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  var createClass = _createClass;

  var runtime = createCommonjsModule(function (module) {
    /**
     * Copyright (c) 2014-present, Facebook, Inc.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     */
    !function (global) {

      var Op = Object.prototype;
      var hasOwn = Op.hasOwnProperty;
      var undefined; // More compressible than void 0.

      var $Symbol = typeof Symbol === "function" ? Symbol : {};
      var iteratorSymbol = $Symbol.iterator || "@@iterator";
      var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
      var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
      var runtime = global.regeneratorRuntime;

      if (runtime) {
        {
          // If regeneratorRuntime is defined globally and we're in a module,
          // make the exports object identical to regeneratorRuntime.
          module.exports = runtime;
        } // Don't bother evaluating the rest of this file if the runtime was
        // already defined globally.


        return;
      } // Define the runtime globally (as expected by generated code) as either
      // module.exports (if we're in a module) or a new, empty object.


      runtime = global.regeneratorRuntime = module.exports;

      function wrap(innerFn, outerFn, self, tryLocsList) {
        // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
        var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
        var generator = Object.create(protoGenerator.prototype);
        var context = new Context(tryLocsList || []); // The ._invoke method unifies the implementations of the .next,
        // .throw, and .return methods.

        generator._invoke = makeInvokeMethod(innerFn, self, context);
        return generator;
      }

      runtime.wrap = wrap; // Try/catch helper to minimize deoptimizations. Returns a completion
      // record like context.tryEntries[i].completion. This interface could
      // have been (and was previously) designed to take a closure to be
      // invoked without arguments, but in all the cases we care about we
      // already have an existing method we want to call, so there's no need
      // to create a new function object. We can even get away with assuming
      // the method takes exactly one argument, since that happens to be true
      // in every case, so we don't have to touch the arguments object. The
      // only additional allocation required is the completion record, which
      // has a stable shape and so hopefully should be cheap to allocate.

      function tryCatch(fn, obj, arg) {
        try {
          return {
            type: "normal",
            arg: fn.call(obj, arg)
          };
        } catch (err) {
          return {
            type: "throw",
            arg: err
          };
        }
      }

      var GenStateSuspendedStart = "suspendedStart";
      var GenStateSuspendedYield = "suspendedYield";
      var GenStateExecuting = "executing";
      var GenStateCompleted = "completed"; // Returning this object from the innerFn has the same effect as
      // breaking out of the dispatch switch statement.

      var ContinueSentinel = {}; // Dummy constructor functions that we use as the .constructor and
      // .constructor.prototype properties for functions that return Generator
      // objects. For full spec compliance, you may wish to configure your
      // minifier not to mangle the names of these two functions.

      function Generator() {}

      function GeneratorFunction() {}

      function GeneratorFunctionPrototype() {} // This is a polyfill for %IteratorPrototype% for environments that
      // don't natively support it.


      var IteratorPrototype = {};

      IteratorPrototype[iteratorSymbol] = function () {
        return this;
      };

      var getProto = Object.getPrototypeOf;
      var NativeIteratorPrototype = getProto && getProto(getProto(values([])));

      if (NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
        // This environment has a native %IteratorPrototype%; use it instead
        // of the polyfill.
        IteratorPrototype = NativeIteratorPrototype;
      }

      var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype);
      GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
      GeneratorFunctionPrototype.constructor = GeneratorFunction;
      GeneratorFunctionPrototype[toStringTagSymbol] = GeneratorFunction.displayName = "GeneratorFunction"; // Helper for defining the .next, .throw, and .return methods of the
      // Iterator interface in terms of a single ._invoke method.

      function defineIteratorMethods(prototype) {
        ["next", "throw", "return"].forEach(function (method) {
          prototype[method] = function (arg) {
            return this._invoke(method, arg);
          };
        });
      }

      runtime.isGeneratorFunction = function (genFun) {
        var ctor = typeof genFun === "function" && genFun.constructor;
        return ctor ? ctor === GeneratorFunction || // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction" : false;
      };

      runtime.mark = function (genFun) {
        if (Object.setPrototypeOf) {
          Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
        } else {
          genFun.__proto__ = GeneratorFunctionPrototype;

          if (!(toStringTagSymbol in genFun)) {
            genFun[toStringTagSymbol] = "GeneratorFunction";
          }
        }

        genFun.prototype = Object.create(Gp);
        return genFun;
      }; // Within the body of any async function, `await x` is transformed to
      // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
      // `hasOwn.call(value, "__await")` to determine if the yielded value is
      // meant to be awaited.


      runtime.awrap = function (arg) {
        return {
          __await: arg
        };
      };

      function AsyncIterator(generator) {
        function invoke(method, arg, resolve, reject) {
          var record = tryCatch(generator[method], generator, arg);

          if (record.type === "throw") {
            reject(record.arg);
          } else {
            var result = record.arg;
            var value = result.value;

            if (value && typeof value === "object" && hasOwn.call(value, "__await")) {
              return Promise.resolve(value.__await).then(function (value) {
                invoke("next", value, resolve, reject);
              }, function (err) {
                invoke("throw", err, resolve, reject);
              });
            }

            return Promise.resolve(value).then(function (unwrapped) {
              // When a yielded Promise is resolved, its final value becomes
              // the .value of the Promise<{value,done}> result for the
              // current iteration.
              result.value = unwrapped;
              resolve(result);
            }, function (error) {
              // If a rejected Promise was yielded, throw the rejection back
              // into the async generator function so it can be handled there.
              return invoke("throw", error, resolve, reject);
            });
          }
        }

        var previousPromise;

        function enqueue(method, arg) {
          function callInvokeWithMethodAndArg() {
            return new Promise(function (resolve, reject) {
              invoke(method, arg, resolve, reject);
            });
          }

          return previousPromise = // If enqueue has been called before, then we want to wait until
          // all previous Promises have been resolved before calling invoke,
          // so that results are always delivered in the correct order. If
          // enqueue has not been called before, then it is important to
          // call invoke immediately, without waiting on a callback to fire,
          // so that the async generator function has the opportunity to do
          // any necessary setup in a predictable way. This predictability
          // is why the Promise constructor synchronously invokes its
          // executor callback, and why async functions synchronously
          // execute code before the first await. Since we implement simple
          // async functions in terms of async generators, it is especially
          // important to get this right, even though it requires care.
          previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
        } // Define the unified helper method that is used to implement .next,
        // .throw, and .return (see defineIteratorMethods).


        this._invoke = enqueue;
      }

      defineIteratorMethods(AsyncIterator.prototype);

      AsyncIterator.prototype[asyncIteratorSymbol] = function () {
        return this;
      };

      runtime.AsyncIterator = AsyncIterator; // Note that simple async functions are implemented on top of
      // AsyncIterator objects; they just return a Promise for the value of
      // the final result produced by the iterator.

      runtime.async = function (innerFn, outerFn, self, tryLocsList) {
        var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList));
        return runtime.isGeneratorFunction(outerFn) ? iter // If outerFn is a generator, return the full iterator.
        : iter.next().then(function (result) {
          return result.done ? result.value : iter.next();
        });
      };

      function makeInvokeMethod(innerFn, self, context) {
        var state = GenStateSuspendedStart;
        return function invoke(method, arg) {
          if (state === GenStateExecuting) {
            throw new Error("Generator is already running");
          }

          if (state === GenStateCompleted) {
            if (method === "throw") {
              throw arg;
            } // Be forgiving, per 25.3.3.3.3 of the spec:
            // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume


            return doneResult();
          }

          context.method = method;
          context.arg = arg;

          while (true) {
            var delegate = context.delegate;

            if (delegate) {
              var delegateResult = maybeInvokeDelegate(delegate, context);

              if (delegateResult) {
                if (delegateResult === ContinueSentinel) continue;
                return delegateResult;
              }
            }

            if (context.method === "next") {
              // Setting context._sent for legacy support of Babel's
              // function.sent implementation.
              context.sent = context._sent = context.arg;
            } else if (context.method === "throw") {
              if (state === GenStateSuspendedStart) {
                state = GenStateCompleted;
                throw context.arg;
              }

              context.dispatchException(context.arg);
            } else if (context.method === "return") {
              context.abrupt("return", context.arg);
            }

            state = GenStateExecuting;
            var record = tryCatch(innerFn, self, context);

            if (record.type === "normal") {
              // If an exception is thrown from innerFn, we leave state ===
              // GenStateExecuting and loop back for another invocation.
              state = context.done ? GenStateCompleted : GenStateSuspendedYield;

              if (record.arg === ContinueSentinel) {
                continue;
              }

              return {
                value: record.arg,
                done: context.done
              };
            } else if (record.type === "throw") {
              state = GenStateCompleted; // Dispatch the exception by looping back around to the
              // context.dispatchException(context.arg) call above.

              context.method = "throw";
              context.arg = record.arg;
            }
          }
        };
      } // Call delegate.iterator[context.method](context.arg) and handle the
      // result, either by returning a { value, done } result from the
      // delegate iterator, or by modifying context.method and context.arg,
      // setting context.delegate to null, and returning the ContinueSentinel.


      function maybeInvokeDelegate(delegate, context) {
        var method = delegate.iterator[context.method];

        if (method === undefined) {
          // A .throw or .return when the delegate iterator has no .throw
          // method always terminates the yield* loop.
          context.delegate = null;

          if (context.method === "throw") {
            if (delegate.iterator.return) {
              // If the delegate iterator has a return method, give it a
              // chance to clean up.
              context.method = "return";
              context.arg = undefined;
              maybeInvokeDelegate(delegate, context);

              if (context.method === "throw") {
                // If maybeInvokeDelegate(context) changed context.method from
                // "return" to "throw", let that override the TypeError below.
                return ContinueSentinel;
              }
            }

            context.method = "throw";
            context.arg = new TypeError("The iterator does not provide a 'throw' method");
          }

          return ContinueSentinel;
        }

        var record = tryCatch(method, delegate.iterator, context.arg);

        if (record.type === "throw") {
          context.method = "throw";
          context.arg = record.arg;
          context.delegate = null;
          return ContinueSentinel;
        }

        var info = record.arg;

        if (!info) {
          context.method = "throw";
          context.arg = new TypeError("iterator result is not an object");
          context.delegate = null;
          return ContinueSentinel;
        }

        if (info.done) {
          // Assign the result of the finished delegate to the temporary
          // variable specified by delegate.resultName (see delegateYield).
          context[delegate.resultName] = info.value; // Resume execution at the desired location (see delegateYield).

          context.next = delegate.nextLoc; // If context.method was "throw" but the delegate handled the
          // exception, let the outer generator proceed normally. If
          // context.method was "next", forget context.arg since it has been
          // "consumed" by the delegate iterator. If context.method was
          // "return", allow the original .return call to continue in the
          // outer generator.

          if (context.method !== "return") {
            context.method = "next";
            context.arg = undefined;
          }
        } else {
          // Re-yield the result returned by the delegate method.
          return info;
        } // The delegate iterator is finished, so forget it and continue with
        // the outer generator.


        context.delegate = null;
        return ContinueSentinel;
      } // Define Generator.prototype.{next,throw,return} in terms of the
      // unified ._invoke helper method.


      defineIteratorMethods(Gp);
      Gp[toStringTagSymbol] = "Generator"; // A Generator should always return itself as the iterator object when the
      // @@iterator function is called on it. Some browsers' implementations of the
      // iterator prototype chain incorrectly implement this, causing the Generator
      // object to not be returned from this call. This ensures that doesn't happen.
      // See https://github.com/facebook/regenerator/issues/274 for more details.

      Gp[iteratorSymbol] = function () {
        return this;
      };

      Gp.toString = function () {
        return "[object Generator]";
      };

      function pushTryEntry(locs) {
        var entry = {
          tryLoc: locs[0]
        };

        if (1 in locs) {
          entry.catchLoc = locs[1];
        }

        if (2 in locs) {
          entry.finallyLoc = locs[2];
          entry.afterLoc = locs[3];
        }

        this.tryEntries.push(entry);
      }

      function resetTryEntry(entry) {
        var record = entry.completion || {};
        record.type = "normal";
        delete record.arg;
        entry.completion = record;
      }

      function Context(tryLocsList) {
        // The root entry object (effectively a try statement without a catch
        // or a finally block) gives us a place to store values thrown from
        // locations where there is no enclosing try statement.
        this.tryEntries = [{
          tryLoc: "root"
        }];
        tryLocsList.forEach(pushTryEntry, this);
        this.reset(true);
      }

      runtime.keys = function (object) {
        var keys = [];

        for (var key in object) {
          keys.push(key);
        }

        keys.reverse(); // Rather than returning an object with a next method, we keep
        // things simple and return the next function itself.

        return function next() {
          while (keys.length) {
            var key = keys.pop();

            if (key in object) {
              next.value = key;
              next.done = false;
              return next;
            }
          } // To avoid creating an additional object, we just hang the .value
          // and .done properties off the next function object itself. This
          // also ensures that the minifier will not anonymize the function.


          next.done = true;
          return next;
        };
      };

      function values(iterable) {
        if (iterable) {
          var iteratorMethod = iterable[iteratorSymbol];

          if (iteratorMethod) {
            return iteratorMethod.call(iterable);
          }

          if (typeof iterable.next === "function") {
            return iterable;
          }

          if (!isNaN(iterable.length)) {
            var i = -1,
                next = function next() {
              while (++i < iterable.length) {
                if (hasOwn.call(iterable, i)) {
                  next.value = iterable[i];
                  next.done = false;
                  return next;
                }
              }

              next.value = undefined;
              next.done = true;
              return next;
            };

            return next.next = next;
          }
        } // Return an iterator with no values.


        return {
          next: doneResult
        };
      }

      runtime.values = values;

      function doneResult() {
        return {
          value: undefined,
          done: true
        };
      }

      Context.prototype = {
        constructor: Context,
        reset: function (skipTempReset) {
          this.prev = 0;
          this.next = 0; // Resetting context._sent for legacy support of Babel's
          // function.sent implementation.

          this.sent = this._sent = undefined;
          this.done = false;
          this.delegate = null;
          this.method = "next";
          this.arg = undefined;
          this.tryEntries.forEach(resetTryEntry);

          if (!skipTempReset) {
            for (var name in this) {
              // Not sure about the optimal order of these conditions:
              if (name.charAt(0) === "t" && hasOwn.call(this, name) && !isNaN(+name.slice(1))) {
                this[name] = undefined;
              }
            }
          }
        },
        stop: function () {
          this.done = true;
          var rootEntry = this.tryEntries[0];
          var rootRecord = rootEntry.completion;

          if (rootRecord.type === "throw") {
            throw rootRecord.arg;
          }

          return this.rval;
        },
        dispatchException: function (exception) {
          if (this.done) {
            throw exception;
          }

          var context = this;

          function handle(loc, caught) {
            record.type = "throw";
            record.arg = exception;
            context.next = loc;

            if (caught) {
              // If the dispatched exception was caught by a catch block,
              // then let that catch block handle the exception normally.
              context.method = "next";
              context.arg = undefined;
            }

            return !!caught;
          }

          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];
            var record = entry.completion;

            if (entry.tryLoc === "root") {
              // Exception thrown outside of any try block that could handle
              // it, so set the completion value of the entire function to
              // throw the exception.
              return handle("end");
            }

            if (entry.tryLoc <= this.prev) {
              var hasCatch = hasOwn.call(entry, "catchLoc");
              var hasFinally = hasOwn.call(entry, "finallyLoc");

              if (hasCatch && hasFinally) {
                if (this.prev < entry.catchLoc) {
                  return handle(entry.catchLoc, true);
                } else if (this.prev < entry.finallyLoc) {
                  return handle(entry.finallyLoc);
                }
              } else if (hasCatch) {
                if (this.prev < entry.catchLoc) {
                  return handle(entry.catchLoc, true);
                }
              } else if (hasFinally) {
                if (this.prev < entry.finallyLoc) {
                  return handle(entry.finallyLoc);
                }
              } else {
                throw new Error("try statement without catch or finally");
              }
            }
          }
        },
        abrupt: function (type, arg) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];

            if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
              var finallyEntry = entry;
              break;
            }
          }

          if (finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc) {
            // Ignore the finally entry if control is not jumping to a
            // location outside the try/catch block.
            finallyEntry = null;
          }

          var record = finallyEntry ? finallyEntry.completion : {};
          record.type = type;
          record.arg = arg;

          if (finallyEntry) {
            this.method = "next";
            this.next = finallyEntry.finallyLoc;
            return ContinueSentinel;
          }

          return this.complete(record);
        },
        complete: function (record, afterLoc) {
          if (record.type === "throw") {
            throw record.arg;
          }

          if (record.type === "break" || record.type === "continue") {
            this.next = record.arg;
          } else if (record.type === "return") {
            this.rval = this.arg = record.arg;
            this.method = "return";
            this.next = "end";
          } else if (record.type === "normal" && afterLoc) {
            this.next = afterLoc;
          }

          return ContinueSentinel;
        },
        finish: function (finallyLoc) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];

            if (entry.finallyLoc === finallyLoc) {
              this.complete(entry.completion, entry.afterLoc);
              resetTryEntry(entry);
              return ContinueSentinel;
            }
          }
        },
        "catch": function (tryLoc) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];

            if (entry.tryLoc === tryLoc) {
              var record = entry.completion;

              if (record.type === "throw") {
                var thrown = record.arg;
                resetTryEntry(entry);
              }

              return thrown;
            }
          } // The context.catch method must only be called with a location
          // argument that corresponds to a known catch block.


          throw new Error("illegal catch attempt");
        },
        delegateYield: function (iterable, resultName, nextLoc) {
          this.delegate = {
            iterator: values(iterable),
            resultName: resultName,
            nextLoc: nextLoc
          };

          if (this.method === "next") {
            // Deliberately forget the last sent value so that we don't
            // accidentally pass it on to the delegate.
            this.arg = undefined;
          }

          return ContinueSentinel;
        }
      };
    }( // In sloppy mode, unbound `this` refers to the global object, fallback to
    // Function constructor if we're in global strict mode. That is sadly a form
    // of indirect eval which violates Content Security Policy.
    function () {
      return this || typeof self === "object" && self;
    }() || Function("return this")());
  });

  /**
   * Copyright (c) 2014-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
  // This method of obtaining a reference to the global object needs to be
  // kept identical to the way it is obtained in runtime.js

  var g$1 = function () {
    return this || typeof self === "object" && self;
  }() || Function("return this")(); // Use `getOwnPropertyNames` because not all browsers support calling
  // `hasOwnProperty` on the global `self` object in a worker. See #183.


  var hadRuntime = g$1.regeneratorRuntime && Object.getOwnPropertyNames(g$1).indexOf("regeneratorRuntime") >= 0; // Save the old regeneratorRuntime in case it needs to be restored later.

  var oldRuntime = hadRuntime && g$1.regeneratorRuntime; // Force reevalutation of runtime.js.

  g$1.regeneratorRuntime = undefined;
  var runtimeModule = runtime;

  if (hadRuntime) {
    // Restore the original runtime.
    g$1.regeneratorRuntime = oldRuntime;
  } else {
    // Remove the global property added by runtime.js.
    try {
      delete g$1.regeneratorRuntime;
    } catch (e) {
      g$1.regeneratorRuntime = undefined;
    }
  }

  var regenerator = runtimeModule;

  var iterator = function (Yallist) {
    Yallist.prototype[Symbol.iterator] =
    /*#__PURE__*/
    regenerator.mark(function _callee() {
      var walker;
      return regenerator.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              walker = this.head;

            case 1:
              if (!walker) {
                _context.next = 7;
                break;
              }

              _context.next = 4;
              return walker.value;

            case 4:
              walker = walker.next;
              _context.next = 1;
              break;

            case 7:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    });
  };

  var yallist = Yallist;
  Yallist.Node = Node;
  Yallist.create = Yallist;

  function Yallist(list) {
    var self = this;

    if (!(self instanceof Yallist)) {
      self = new Yallist();
    }

    self.tail = null;
    self.head = null;
    self.length = 0;

    if (list && typeof list.forEach === 'function') {
      list.forEach(function (item) {
        self.push(item);
      });
    } else if (arguments.length > 0) {
      for (var i = 0, l = arguments.length; i < l; i++) {
        self.push(arguments[i]);
      }
    }

    return self;
  }

  Yallist.prototype.removeNode = function (node) {
    if (node.list !== this) {
      throw new Error('removing node which does not belong to this list');
    }

    var next = node.next;
    var prev = node.prev;

    if (next) {
      next.prev = prev;
    }

    if (prev) {
      prev.next = next;
    }

    if (node === this.head) {
      this.head = next;
    }

    if (node === this.tail) {
      this.tail = prev;
    }

    node.list.length--;
    node.next = null;
    node.prev = null;
    node.list = null;
  };

  Yallist.prototype.unshiftNode = function (node) {
    if (node === this.head) {
      return;
    }

    if (node.list) {
      node.list.removeNode(node);
    }

    var head = this.head;
    node.list = this;
    node.next = head;

    if (head) {
      head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node;
    }

    this.length++;
  };

  Yallist.prototype.pushNode = function (node) {
    if (node === this.tail) {
      return;
    }

    if (node.list) {
      node.list.removeNode(node);
    }

    var tail = this.tail;
    node.list = this;
    node.prev = tail;

    if (tail) {
      tail.next = node;
    }

    this.tail = node;

    if (!this.head) {
      this.head = node;
    }

    this.length++;
  };

  Yallist.prototype.push = function () {
    for (var i = 0, l = arguments.length; i < l; i++) {
      push(this, arguments[i]);
    }

    return this.length;
  };

  Yallist.prototype.unshift = function () {
    for (var i = 0, l = arguments.length; i < l; i++) {
      unshift(this, arguments[i]);
    }

    return this.length;
  };

  Yallist.prototype.pop = function () {
    if (!this.tail) {
      return undefined;
    }

    var res = this.tail.value;
    this.tail = this.tail.prev;

    if (this.tail) {
      this.tail.next = null;
    } else {
      this.head = null;
    }

    this.length--;
    return res;
  };

  Yallist.prototype.shift = function () {
    if (!this.head) {
      return undefined;
    }

    var res = this.head.value;
    this.head = this.head.next;

    if (this.head) {
      this.head.prev = null;
    } else {
      this.tail = null;
    }

    this.length--;
    return res;
  };

  Yallist.prototype.forEach = function (fn, thisp) {
    thisp = thisp || this;

    for (var walker = this.head, i = 0; walker !== null; i++) {
      fn.call(thisp, walker.value, i, this);
      walker = walker.next;
    }
  };

  Yallist.prototype.forEachReverse = function (fn, thisp) {
    thisp = thisp || this;

    for (var walker = this.tail, i = this.length - 1; walker !== null; i--) {
      fn.call(thisp, walker.value, i, this);
      walker = walker.prev;
    }
  };

  Yallist.prototype.get = function (n) {
    for (var i = 0, walker = this.head; walker !== null && i < n; i++) {
      // abort out of the list early if we hit a cycle
      walker = walker.next;
    }

    if (i === n && walker !== null) {
      return walker.value;
    }
  };

  Yallist.prototype.getReverse = function (n) {
    for (var i = 0, walker = this.tail; walker !== null && i < n; i++) {
      // abort out of the list early if we hit a cycle
      walker = walker.prev;
    }

    if (i === n && walker !== null) {
      return walker.value;
    }
  };

  Yallist.prototype.map = function (fn, thisp) {
    thisp = thisp || this;
    var res = new Yallist();

    for (var walker = this.head; walker !== null;) {
      res.push(fn.call(thisp, walker.value, this));
      walker = walker.next;
    }

    return res;
  };

  Yallist.prototype.mapReverse = function (fn, thisp) {
    thisp = thisp || this;
    var res = new Yallist();

    for (var walker = this.tail; walker !== null;) {
      res.push(fn.call(thisp, walker.value, this));
      walker = walker.prev;
    }

    return res;
  };

  Yallist.prototype.reduce = function (fn, initial) {
    var acc;
    var walker = this.head;

    if (arguments.length > 1) {
      acc = initial;
    } else if (this.head) {
      walker = this.head.next;
      acc = this.head.value;
    } else {
      throw new TypeError('Reduce of empty list with no initial value');
    }

    for (var i = 0; walker !== null; i++) {
      acc = fn(acc, walker.value, i);
      walker = walker.next;
    }

    return acc;
  };

  Yallist.prototype.reduceReverse = function (fn, initial) {
    var acc;
    var walker = this.tail;

    if (arguments.length > 1) {
      acc = initial;
    } else if (this.tail) {
      walker = this.tail.prev;
      acc = this.tail.value;
    } else {
      throw new TypeError('Reduce of empty list with no initial value');
    }

    for (var i = this.length - 1; walker !== null; i--) {
      acc = fn(acc, walker.value, i);
      walker = walker.prev;
    }

    return acc;
  };

  Yallist.prototype.toArray = function () {
    var arr = new Array(this.length);

    for (var i = 0, walker = this.head; walker !== null; i++) {
      arr[i] = walker.value;
      walker = walker.next;
    }

    return arr;
  };

  Yallist.prototype.toArrayReverse = function () {
    var arr = new Array(this.length);

    for (var i = 0, walker = this.tail; walker !== null; i++) {
      arr[i] = walker.value;
      walker = walker.prev;
    }

    return arr;
  };

  Yallist.prototype.slice = function (from, to) {
    to = to || this.length;

    if (to < 0) {
      to += this.length;
    }

    from = from || 0;

    if (from < 0) {
      from += this.length;
    }

    var ret = new Yallist();

    if (to < from || to < 0) {
      return ret;
    }

    if (from < 0) {
      from = 0;
    }

    if (to > this.length) {
      to = this.length;
    }

    for (var i = 0, walker = this.head; walker !== null && i < from; i++) {
      walker = walker.next;
    }

    for (; walker !== null && i < to; i++, walker = walker.next) {
      ret.push(walker.value);
    }

    return ret;
  };

  Yallist.prototype.sliceReverse = function (from, to) {
    to = to || this.length;

    if (to < 0) {
      to += this.length;
    }

    from = from || 0;

    if (from < 0) {
      from += this.length;
    }

    var ret = new Yallist();

    if (to < from || to < 0) {
      return ret;
    }

    if (from < 0) {
      from = 0;
    }

    if (to > this.length) {
      to = this.length;
    }

    for (var i = this.length, walker = this.tail; walker !== null && i > to; i--) {
      walker = walker.prev;
    }

    for (; walker !== null && i > from; i--, walker = walker.prev) {
      ret.push(walker.value);
    }

    return ret;
  };

  Yallist.prototype.reverse = function () {
    var head = this.head;
    var tail = this.tail;

    for (var walker = head; walker !== null; walker = walker.prev) {
      var p = walker.prev;
      walker.prev = walker.next;
      walker.next = p;
    }

    this.head = tail;
    this.tail = head;
    return this;
  };

  function push(self, item) {
    self.tail = new Node(item, self.tail, null, self);

    if (!self.head) {
      self.head = self.tail;
    }

    self.length++;
  }

  function unshift(self, item) {
    self.head = new Node(item, null, self.head, self);

    if (!self.tail) {
      self.tail = self.head;
    }

    self.length++;
  }

  function Node(value, prev, next, list) {
    if (!(this instanceof Node)) {
      return new Node(value, prev, next, list);
    }

    this.list = list;
    this.value = value;

    if (prev) {
      prev.next = this;
      this.prev = prev;
    } else {
      this.prev = null;
    }

    if (next) {
      next.prev = this;
      this.next = next;
    } else {
      this.next = null;
    }
  }

  try {
    // add if support for Symbol.iterator is present
    iterator(Yallist);
  } catch (er) {}

  var MAX = Symbol('max');
  var LENGTH = Symbol('length');
  var LENGTH_CALCULATOR = Symbol('lengthCalculator');
  var ALLOW_STALE = Symbol('allowStale');
  var MAX_AGE = Symbol('maxAge');
  var DISPOSE = Symbol('dispose');
  var NO_DISPOSE_ON_SET = Symbol('noDisposeOnSet');
  var LRU_LIST = Symbol('lruList');
  var CACHE = Symbol('cache');
  var UPDATE_AGE_ON_GET = Symbol('updateAgeOnGet');

  var naiveLength = function () {
    return 1;
  }; // lruList is a yallist where the head is the youngest
  // item, and the tail is the oldest.  the list contains the Hit
  // objects as the entries.
  // Each Hit object has a reference to its Yallist.Node.  This
  // never changes.
  //
  // cache is a Map (or PseudoMap) that matches the keys to
  // the Yallist.Node object.


  var LRUCache =
  /*#__PURE__*/
  function () {
    function LRUCache(options) {
      if (typeof options === 'number') options = {
        max: options
      };
      if (!options) options = {};
      if (options.max && (typeof options.max !== 'number' || options.max < 0)) throw new TypeError('max must be a non-negative number'); // Kind of weird to have a default max of Infinity, but oh well.

      var max = this[MAX] = options.max || Infinity;
      var lc = options.length || naiveLength;
      this[LENGTH_CALCULATOR] = typeof lc !== 'function' ? naiveLength : lc;
      this[ALLOW_STALE] = options.stale || false;
      if (options.maxAge && typeof options.maxAge !== 'number') throw new TypeError('maxAge must be a number');
      this[MAX_AGE] = options.maxAge || 0;
      this[DISPOSE] = options.dispose;
      this[NO_DISPOSE_ON_SET] = options.noDisposeOnSet || false;
      this[UPDATE_AGE_ON_GET] = options.updateAgeOnGet || false;
      this.reset();
    } // resize the cache when the max changes.


    var _proto = LRUCache.prototype;

    _proto.rforEach = function rforEach(fn, thisp) {
      thisp = thisp || this;

      for (var walker = this[LRU_LIST].tail; walker !== null;) {
        var prev = walker.prev;
        forEachStep(this, fn, walker, thisp);
        walker = prev;
      }
    };

    _proto.forEach = function forEach(fn, thisp) {
      thisp = thisp || this;

      for (var walker = this[LRU_LIST].head; walker !== null;) {
        var next = walker.next;
        forEachStep(this, fn, walker, thisp);
        walker = next;
      }
    };

    _proto.keys = function keys() {
      return this[LRU_LIST].toArray().map(function (k) {
        return k.key;
      });
    };

    _proto.values = function values() {
      return this[LRU_LIST].toArray().map(function (k) {
        return k.value;
      });
    };

    _proto.reset = function reset() {
      var _this = this;

      if (this[DISPOSE] && this[LRU_LIST] && this[LRU_LIST].length) {
        this[LRU_LIST].forEach(function (hit) {
          return _this[DISPOSE](hit.key, hit.value);
        });
      }

      this[CACHE] = new Map(); // hash of items by key

      this[LRU_LIST] = new yallist(); // list of items in order of use recency

      this[LENGTH] = 0; // length of items in the list
    };

    _proto.dump = function dump() {
      var _this2 = this;

      return this[LRU_LIST].map(function (hit) {
        return isStale(_this2, hit) ? false : {
          k: hit.key,
          v: hit.value,
          e: hit.now + (hit.maxAge || 0)
        };
      }).toArray().filter(function (h) {
        return h;
      });
    };

    _proto.dumpLru = function dumpLru() {
      return this[LRU_LIST];
    };

    _proto.set = function set(key, value, maxAge) {
      maxAge = maxAge || this[MAX_AGE];
      if (maxAge && typeof maxAge !== 'number') throw new TypeError('maxAge must be a number');
      var now = maxAge ? Date.now() : 0;
      var len = this[LENGTH_CALCULATOR](value, key);

      if (this[CACHE].has(key)) {
        if (len > this[MAX]) {
          _del(this, this[CACHE].get(key));

          return false;
        }

        var node = this[CACHE].get(key);
        var item = node.value; // dispose of the old one before overwriting
        // split out into 2 ifs for better coverage tracking

        if (this[DISPOSE]) {
          if (!this[NO_DISPOSE_ON_SET]) this[DISPOSE](key, item.value);
        }

        item.now = now;
        item.maxAge = maxAge;
        item.value = value;
        this[LENGTH] += len - item.length;
        item.length = len;
        this.get(key);
        trim(this);
        return true;
      }

      var hit = new Entry(key, value, len, now, maxAge); // oversized objects fall out of cache automatically.

      if (hit.length > this[MAX]) {
        if (this[DISPOSE]) this[DISPOSE](key, value);
        return false;
      }

      this[LENGTH] += hit.length;
      this[LRU_LIST].unshift(hit);
      this[CACHE].set(key, this[LRU_LIST].head);
      trim(this);
      return true;
    };

    _proto.has = function has(key) {
      if (!this[CACHE].has(key)) return false;
      var hit = this[CACHE].get(key).value;
      return !isStale(this, hit);
    };

    _proto.get = function get(key) {
      return _get(this, key, true);
    };

    _proto.peek = function peek(key) {
      return _get(this, key, false);
    };

    _proto.pop = function pop() {
      var node = this[LRU_LIST].tail;
      if (!node) return null;

      _del(this, node);

      return node.value;
    };

    _proto.del = function del(key) {
      _del(this, this[CACHE].get(key));
    };

    _proto.load = function load(arr) {
      // reset the cache
      this.reset();
      var now = Date.now(); // A previous serialized cache has the most recent items first

      for (var l = arr.length - 1; l >= 0; l--) {
        var hit = arr[l];
        var expiresAt = hit.e || 0;
        if (expiresAt === 0) // the item was created without expiration in a non aged cache
          this.set(hit.k, hit.v);else {
          var maxAge = expiresAt - now; // dont add already expired items

          if (maxAge > 0) {
            this.set(hit.k, hit.v, maxAge);
          }
        }
      }
    };

    _proto.prune = function prune() {
      var _this3 = this;

      this[CACHE].forEach(function (value, key) {
        return _get(_this3, key, false);
      });
    };

    createClass(LRUCache, [{
      key: "max",
      set: function (mL) {
        if (typeof mL !== 'number' || mL < 0) throw new TypeError('max must be a non-negative number');
        this[MAX] = mL || Infinity;
        trim(this);
      },
      get: function () {
        return this[MAX];
      }
    }, {
      key: "allowStale",
      set: function (allowStale) {
        this[ALLOW_STALE] = !!allowStale;
      },
      get: function () {
        return this[ALLOW_STALE];
      }
    }, {
      key: "maxAge",
      set: function (mA) {
        if (typeof mA !== 'number') throw new TypeError('maxAge must be a non-negative number');
        this[MAX_AGE] = mA;
        trim(this);
      },
      get: function () {
        return this[MAX_AGE];
      } // resize the cache when the lengthCalculator changes.

    }, {
      key: "lengthCalculator",
      set: function (lC) {
        var _this4 = this;

        if (typeof lC !== 'function') lC = naiveLength;

        if (lC !== this[LENGTH_CALCULATOR]) {
          this[LENGTH_CALCULATOR] = lC;
          this[LENGTH] = 0;
          this[LRU_LIST].forEach(function (hit) {
            hit.length = _this4[LENGTH_CALCULATOR](hit.value, hit.key);
            _this4[LENGTH] += hit.length;
          });
        }

        trim(this);
      },
      get: function () {
        return this[LENGTH_CALCULATOR];
      }
    }, {
      key: "length",
      get: function () {
        return this[LENGTH];
      }
    }, {
      key: "size",
      get: function () {
        return this[LENGTH];
      }
    }, {
      key: "itemCount",
      get: function () {
        return this[LRU_LIST].length;
      }
    }]);

    return LRUCache;
  }();

  var _get = function (self, key, doUse) {
    var node = self[CACHE].get(key);

    if (node) {
      var hit = node.value;

      if (isStale(self, hit)) {
        _del(self, node);

        if (!self[ALLOW_STALE]) return undefined;
      } else {
        if (doUse) {
          if (self[UPDATE_AGE_ON_GET]) node.value.now = Date.now();
          self[LRU_LIST].unshiftNode(node);
        }
      }

      return hit.value;
    }
  };

  var isStale = function (self, hit) {
    if (!hit || !hit.maxAge && !self[MAX_AGE]) return false;
    var diff = Date.now() - hit.now;
    return hit.maxAge ? diff > hit.maxAge : self[MAX_AGE] && diff > self[MAX_AGE];
  };

  var trim = function (self) {
    if (self[LENGTH] > self[MAX]) {
      for (var walker = self[LRU_LIST].tail; self[LENGTH] > self[MAX] && walker !== null;) {
        // We know that we're about to delete this one, and also
        // what the next least recently used key will be, so just
        // go ahead and set it now.
        var prev = walker.prev;

        _del(self, walker);

        walker = prev;
      }
    }
  };

  var _del = function (self, node) {
    if (node) {
      var hit = node.value;
      if (self[DISPOSE]) self[DISPOSE](hit.key, hit.value);
      self[LENGTH] -= hit.length;
      self[CACHE].delete(hit.key);
      self[LRU_LIST].removeNode(node);
    }
  };

  var Entry = function Entry(key, value, length, now, maxAge) {
    this.key = key;
    this.value = value;
    this.length = length;
    this.now = now;
    this.maxAge = maxAge || 0;
  };

  var forEachStep = function (self, fn, node, thisp) {
    var hit = node.value;

    if (isStale(self, hit)) {
      _del(self, node);

      if (!self[ALLOW_STALE]) hit = undefined;
    }

    if (hit) fn.call(thisp, hit.value, hit.key, self);
  }; // build some APIs imitates that of Map


  var __proto__ = LRUCache.prototype;
  [['clear', 'reset'], ['delete', 'del']].forEach(function (_ref) {
    var k = _ref[0],
        n = _ref[1];
    __proto__[k] = __proto__[n];
  });
  var lruCache = LRUCache;

  /*!
   * bytes
   * Copyright(c) 2012-2014 TJ Holowaychuk
   * Copyright(c) 2015 Jed Watson
   * MIT Licensed
   */
  var parse_1 = parse$1;
  var map = {
    b: 1,
    kb: 1 << 10,
    mb: 1 << 20,
    gb: 1 << 30,
    tb: Math.pow(1024, 4),
    pb: Math.pow(1024, 5)
  };
  var parseRegExp = /^((-|\+)?(\d+(?:\.\d+)?)) *(kb|mb|gb|tb|pb)$/i;
  /**
   * Parse the string value into an integer in bytes.
   *
   * If no unit is given, it is assumed the value is in bytes.
   *
   * @param {number|string} val
   *
   * @returns {number|null}
   * @public
   */


  function parse$1(val) {
    if (typeof val === 'number' && !isNaN(val)) {
      return val;
    }

    if (typeof val !== 'string') {
      return null;
    } // Test if the string passed is valid


    var results = parseRegExp.exec(val);
    var floatValue;
    var unit = 'b';

    if (!results) {
      // Nothing could be extracted from the given string
      floatValue = parseInt(val, 10);
      unit = 'b';
    } else {
      // Retrieve the value and the unit
      floatValue = parseFloat(results[1]);
      unit = results[4].toLowerCase();
    }

    return Math.floor(map[unit] * floatValue);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  var assertThisInitialized = _assertThisInitialized;

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }

  var inheritsLoose = _inheritsLoose;

  var safeBuffer = createCommonjsModule(function (module, exports) {
    /* eslint-disable node/no-deprecated-api */
    var Buffer = bufferEs6.Buffer; // alternative to using Object.keys for old browsers

    function copyProps(src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }

    if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
      module.exports = bufferEs6;
    } else {
      // Copy properties from require('buffer')
      copyProps(bufferEs6, exports);
      exports.Buffer = SafeBuffer;
    }

    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer(arg, encodingOrOffset, length);
    } // Copy static methods from Buffer


    copyProps(Buffer, SafeBuffer);

    SafeBuffer.from = function (arg, encodingOrOffset, length) {
      if (typeof arg === 'number') {
        throw new TypeError('Argument must not be a number');
      }

      return Buffer(arg, encodingOrOffset, length);
    };

    SafeBuffer.alloc = function (size, fill, encoding) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number');
      }

      var buf = Buffer(size);

      if (fill !== undefined) {
        if (typeof encoding === 'string') {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }

      return buf;
    };

    SafeBuffer.allocUnsafe = function (size) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number');
      }

      return Buffer(size);
    };

    SafeBuffer.allocUnsafeSlow = function (size) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number');
      }

      return bufferEs6.SlowBuffer(size);
    };
  });
  var safeBuffer_1 = safeBuffer.Buffer;

  // Returns a wrapper function that returns a wrapped callback
  // The wrapper function should do some stuff, and return a
  // presumably different callback function.
  // This makes sure that own properties are retained, so that
  // decorations and such are not lost along the way.
  var wrappy_1 = wrappy;

  function wrappy(fn, cb) {
    if (fn && cb) return wrappy(fn)(cb);
    if (typeof fn !== 'function') throw new TypeError('need wrapper function');
    Object.keys(fn).forEach(function (k) {
      wrapper[k] = fn[k];
    });
    return wrapper;

    function wrapper() {
      var args = new Array(arguments.length);

      for (var i = 0; i < args.length; i++) {
        args[i] = arguments[i];
      }

      var ret = fn.apply(this, args);
      var cb = args[args.length - 1];

      if (typeof ret === 'function' && ret !== cb) {
        Object.keys(cb).forEach(function (k) {
          ret[k] = cb[k];
        });
      }

      return ret;
    }
  }

  var once_1 = wrappy_1(once$1);
  var strict = wrappy_1(onceStrict);
  once$1.proto = once$1(function () {
    Object.defineProperty(Function.prototype, 'once', {
      value: function () {
        return once$1(this);
      },
      configurable: true
    });
    Object.defineProperty(Function.prototype, 'onceStrict', {
      value: function () {
        return onceStrict(this);
      },
      configurable: true
    });
  });

  function once$1(fn) {
    var f = function () {
      if (f.called) return f.value;
      f.called = true;
      return f.value = fn.apply(this, arguments);
    };

    f.called = false;
    return f;
  }

  function onceStrict(fn) {
    var f = function () {
      if (f.called) throw new Error(f.onceError);
      f.called = true;
      return f.value = fn.apply(this, arguments);
    };

    var name = fn.name || 'Function wrapped with `once`';
    f.onceError = name + " shouldn't be called more than once";
    f.called = false;
    return f;
  }
  once_1.strict = strict;

  var runParallel_1 = runParallel;

  function runParallel(tasks, cb) {
    var results, pending, keys;
    var isSync = true;

    if (Array.isArray(tasks)) {
      results = [];
      pending = tasks.length;
    } else {
      keys = Object.keys(tasks);
      results = {};
      pending = keys.length;
    }

    function done(err) {
      function end() {
        if (cb) cb(err, results);
        cb = null;
      }

      if (isSync) nextTick(end);else end();
    }

    function each(i, err, result) {
      results[i] = result;

      if (--pending === 0 || err) {
        done(err);
      }
    }

    if (!pending) {
      // empty
      done(null);
    } else if (keys) {
      // object
      keys.forEach(function (key) {
        tasks[key](function (err, result) {
          each(key, err, result);
        });
      });
    } else {
      // array
      tasks.forEach(function (task, i) {
        task(function (err, result) {
          each(i, err, result);
        });
      });
    }

    isSync = false;
  }

  var runtime$1 = createCommonjsModule(function (module) {
    /**
     * Copyright (c) 2014-present, Facebook, Inc.
     *
     * This source code is licensed under the MIT license found in the
     * LICENSE file in the root directory of this source tree.
     */
    !function (global) {

      var Op = Object.prototype;
      var hasOwn = Op.hasOwnProperty;
      var undefined; // More compressible than void 0.

      var $Symbol = typeof Symbol === "function" ? Symbol : {};
      var iteratorSymbol = $Symbol.iterator || "@@iterator";
      var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
      var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
      var runtime = global.regeneratorRuntime;

      if (runtime) {
        {
          // If regeneratorRuntime is defined globally and we're in a module,
          // make the exports object identical to regeneratorRuntime.
          module.exports = runtime;
        } // Don't bother evaluating the rest of this file if the runtime was
        // already defined globally.


        return;
      } // Define the runtime globally (as expected by generated code) as either
      // module.exports (if we're in a module) or a new, empty object.


      runtime = global.regeneratorRuntime = module.exports;

      function wrap(innerFn, outerFn, self, tryLocsList) {
        // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
        var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
        var generator = Object.create(protoGenerator.prototype);
        var context = new Context(tryLocsList || []); // The ._invoke method unifies the implementations of the .next,
        // .throw, and .return methods.

        generator._invoke = makeInvokeMethod(innerFn, self, context);
        return generator;
      }

      runtime.wrap = wrap; // Try/catch helper to minimize deoptimizations. Returns a completion
      // record like context.tryEntries[i].completion. This interface could
      // have been (and was previously) designed to take a closure to be
      // invoked without arguments, but in all the cases we care about we
      // already have an existing method we want to call, so there's no need
      // to create a new function object. We can even get away with assuming
      // the method takes exactly one argument, since that happens to be true
      // in every case, so we don't have to touch the arguments object. The
      // only additional allocation required is the completion record, which
      // has a stable shape and so hopefully should be cheap to allocate.

      function tryCatch(fn, obj, arg) {
        try {
          return {
            type: "normal",
            arg: fn.call(obj, arg)
          };
        } catch (err) {
          return {
            type: "throw",
            arg: err
          };
        }
      }

      var GenStateSuspendedStart = "suspendedStart";
      var GenStateSuspendedYield = "suspendedYield";
      var GenStateExecuting = "executing";
      var GenStateCompleted = "completed"; // Returning this object from the innerFn has the same effect as
      // breaking out of the dispatch switch statement.

      var ContinueSentinel = {}; // Dummy constructor functions that we use as the .constructor and
      // .constructor.prototype properties for functions that return Generator
      // objects. For full spec compliance, you may wish to configure your
      // minifier not to mangle the names of these two functions.

      function Generator() {}

      function GeneratorFunction() {}

      function GeneratorFunctionPrototype() {} // This is a polyfill for %IteratorPrototype% for environments that
      // don't natively support it.


      var IteratorPrototype = {};

      IteratorPrototype[iteratorSymbol] = function () {
        return this;
      };

      var getProto = Object.getPrototypeOf;
      var NativeIteratorPrototype = getProto && getProto(getProto(values([])));

      if (NativeIteratorPrototype && NativeIteratorPrototype !== Op && hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
        // This environment has a native %IteratorPrototype%; use it instead
        // of the polyfill.
        IteratorPrototype = NativeIteratorPrototype;
      }

      var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(IteratorPrototype);
      GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
      GeneratorFunctionPrototype.constructor = GeneratorFunction;
      GeneratorFunctionPrototype[toStringTagSymbol] = GeneratorFunction.displayName = "GeneratorFunction"; // Helper for defining the .next, .throw, and .return methods of the
      // Iterator interface in terms of a single ._invoke method.

      function defineIteratorMethods(prototype) {
        ["next", "throw", "return"].forEach(function (method) {
          prototype[method] = function (arg) {
            return this._invoke(method, arg);
          };
        });
      }

      runtime.isGeneratorFunction = function (genFun) {
        var ctor = typeof genFun === "function" && genFun.constructor;
        return ctor ? ctor === GeneratorFunction || // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction" : false;
      };

      runtime.mark = function (genFun) {
        if (Object.setPrototypeOf) {
          Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
        } else {
          genFun.__proto__ = GeneratorFunctionPrototype;

          if (!(toStringTagSymbol in genFun)) {
            genFun[toStringTagSymbol] = "GeneratorFunction";
          }
        }

        genFun.prototype = Object.create(Gp);
        return genFun;
      }; // Within the body of any async function, `await x` is transformed to
      // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
      // `hasOwn.call(value, "__await")` to determine if the yielded value is
      // meant to be awaited.


      runtime.awrap = function (arg) {
        return {
          __await: arg
        };
      };

      function AsyncIterator(generator) {
        function invoke(method, arg, resolve, reject) {
          var record = tryCatch(generator[method], generator, arg);

          if (record.type === "throw") {
            reject(record.arg);
          } else {
            var result = record.arg;
            var value = result.value;

            if (value && typeof value === "object" && hasOwn.call(value, "__await")) {
              return Promise.resolve(value.__await).then(function (value) {
                invoke("next", value, resolve, reject);
              }, function (err) {
                invoke("throw", err, resolve, reject);
              });
            }

            return Promise.resolve(value).then(function (unwrapped) {
              // When a yielded Promise is resolved, its final value becomes
              // the .value of the Promise<{value,done}> result for the
              // current iteration.
              result.value = unwrapped;
              resolve(result);
            }, function (error) {
              // If a rejected Promise was yielded, throw the rejection back
              // into the async generator function so it can be handled there.
              return invoke("throw", error, resolve, reject);
            });
          }
        }

        var previousPromise;

        function enqueue(method, arg) {
          function callInvokeWithMethodAndArg() {
            return new Promise(function (resolve, reject) {
              invoke(method, arg, resolve, reject);
            });
          }

          return previousPromise = // If enqueue has been called before, then we want to wait until
          // all previous Promises have been resolved before calling invoke,
          // so that results are always delivered in the correct order. If
          // enqueue has not been called before, then it is important to
          // call invoke immediately, without waiting on a callback to fire,
          // so that the async generator function has the opportunity to do
          // any necessary setup in a predictable way. This predictability
          // is why the Promise constructor synchronously invokes its
          // executor callback, and why async functions synchronously
          // execute code before the first await. Since we implement simple
          // async functions in terms of async generators, it is especially
          // important to get this right, even though it requires care.
          previousPromise ? previousPromise.then(callInvokeWithMethodAndArg, // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
        } // Define the unified helper method that is used to implement .next,
        // .throw, and .return (see defineIteratorMethods).


        this._invoke = enqueue;
      }

      defineIteratorMethods(AsyncIterator.prototype);

      AsyncIterator.prototype[asyncIteratorSymbol] = function () {
        return this;
      };

      runtime.AsyncIterator = AsyncIterator; // Note that simple async functions are implemented on top of
      // AsyncIterator objects; they just return a Promise for the value of
      // the final result produced by the iterator.

      runtime.async = function (innerFn, outerFn, self, tryLocsList) {
        var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList));
        return runtime.isGeneratorFunction(outerFn) ? iter // If outerFn is a generator, return the full iterator.
        : iter.next().then(function (result) {
          return result.done ? result.value : iter.next();
        });
      };

      function makeInvokeMethod(innerFn, self, context) {
        var state = GenStateSuspendedStart;
        return function invoke(method, arg) {
          if (state === GenStateExecuting) {
            throw new Error("Generator is already running");
          }

          if (state === GenStateCompleted) {
            if (method === "throw") {
              throw arg;
            } // Be forgiving, per 25.3.3.3.3 of the spec:
            // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume


            return doneResult();
          }

          context.method = method;
          context.arg = arg;

          while (true) {
            var delegate = context.delegate;

            if (delegate) {
              var delegateResult = maybeInvokeDelegate(delegate, context);

              if (delegateResult) {
                if (delegateResult === ContinueSentinel) continue;
                return delegateResult;
              }
            }

            if (context.method === "next") {
              // Setting context._sent for legacy support of Babel's
              // function.sent implementation.
              context.sent = context._sent = context.arg;
            } else if (context.method === "throw") {
              if (state === GenStateSuspendedStart) {
                state = GenStateCompleted;
                throw context.arg;
              }

              context.dispatchException(context.arg);
            } else if (context.method === "return") {
              context.abrupt("return", context.arg);
            }

            state = GenStateExecuting;
            var record = tryCatch(innerFn, self, context);

            if (record.type === "normal") {
              // If an exception is thrown from innerFn, we leave state ===
              // GenStateExecuting and loop back for another invocation.
              state = context.done ? GenStateCompleted : GenStateSuspendedYield;

              if (record.arg === ContinueSentinel) {
                continue;
              }

              return {
                value: record.arg,
                done: context.done
              };
            } else if (record.type === "throw") {
              state = GenStateCompleted; // Dispatch the exception by looping back around to the
              // context.dispatchException(context.arg) call above.

              context.method = "throw";
              context.arg = record.arg;
            }
          }
        };
      } // Call delegate.iterator[context.method](context.arg) and handle the
      // result, either by returning a { value, done } result from the
      // delegate iterator, or by modifying context.method and context.arg,
      // setting context.delegate to null, and returning the ContinueSentinel.


      function maybeInvokeDelegate(delegate, context) {
        var method = delegate.iterator[context.method];

        if (method === undefined) {
          // A .throw or .return when the delegate iterator has no .throw
          // method always terminates the yield* loop.
          context.delegate = null;

          if (context.method === "throw") {
            if (delegate.iterator.return) {
              // If the delegate iterator has a return method, give it a
              // chance to clean up.
              context.method = "return";
              context.arg = undefined;
              maybeInvokeDelegate(delegate, context);

              if (context.method === "throw") {
                // If maybeInvokeDelegate(context) changed context.method from
                // "return" to "throw", let that override the TypeError below.
                return ContinueSentinel;
              }
            }

            context.method = "throw";
            context.arg = new TypeError("The iterator does not provide a 'throw' method");
          }

          return ContinueSentinel;
        }

        var record = tryCatch(method, delegate.iterator, context.arg);

        if (record.type === "throw") {
          context.method = "throw";
          context.arg = record.arg;
          context.delegate = null;
          return ContinueSentinel;
        }

        var info = record.arg;

        if (!info) {
          context.method = "throw";
          context.arg = new TypeError("iterator result is not an object");
          context.delegate = null;
          return ContinueSentinel;
        }

        if (info.done) {
          // Assign the result of the finished delegate to the temporary
          // variable specified by delegate.resultName (see delegateYield).
          context[delegate.resultName] = info.value; // Resume execution at the desired location (see delegateYield).

          context.next = delegate.nextLoc; // If context.method was "throw" but the delegate handled the
          // exception, let the outer generator proceed normally. If
          // context.method was "next", forget context.arg since it has been
          // "consumed" by the delegate iterator. If context.method was
          // "return", allow the original .return call to continue in the
          // outer generator.

          if (context.method !== "return") {
            context.method = "next";
            context.arg = undefined;
          }
        } else {
          // Re-yield the result returned by the delegate method.
          return info;
        } // The delegate iterator is finished, so forget it and continue with
        // the outer generator.


        context.delegate = null;
        return ContinueSentinel;
      } // Define Generator.prototype.{next,throw,return} in terms of the
      // unified ._invoke helper method.


      defineIteratorMethods(Gp);
      Gp[toStringTagSymbol] = "Generator"; // A Generator should always return itself as the iterator object when the
      // @@iterator function is called on it. Some browsers' implementations of the
      // iterator prototype chain incorrectly implement this, causing the Generator
      // object to not be returned from this call. This ensures that doesn't happen.
      // See https://github.com/facebook/regenerator/issues/274 for more details.

      Gp[iteratorSymbol] = function () {
        return this;
      };

      Gp.toString = function () {
        return "[object Generator]";
      };

      function pushTryEntry(locs) {
        var entry = {
          tryLoc: locs[0]
        };

        if (1 in locs) {
          entry.catchLoc = locs[1];
        }

        if (2 in locs) {
          entry.finallyLoc = locs[2];
          entry.afterLoc = locs[3];
        }

        this.tryEntries.push(entry);
      }

      function resetTryEntry(entry) {
        var record = entry.completion || {};
        record.type = "normal";
        delete record.arg;
        entry.completion = record;
      }

      function Context(tryLocsList) {
        // The root entry object (effectively a try statement without a catch
        // or a finally block) gives us a place to store values thrown from
        // locations where there is no enclosing try statement.
        this.tryEntries = [{
          tryLoc: "root"
        }];
        tryLocsList.forEach(pushTryEntry, this);
        this.reset(true);
      }

      runtime.keys = function (object) {
        var keys = [];

        for (var key in object) {
          keys.push(key);
        }

        keys.reverse(); // Rather than returning an object with a next method, we keep
        // things simple and return the next function itself.

        return function next() {
          while (keys.length) {
            var key = keys.pop();

            if (key in object) {
              next.value = key;
              next.done = false;
              return next;
            }
          } // To avoid creating an additional object, we just hang the .value
          // and .done properties off the next function object itself. This
          // also ensures that the minifier will not anonymize the function.


          next.done = true;
          return next;
        };
      };

      function values(iterable) {
        if (iterable) {
          var iteratorMethod = iterable[iteratorSymbol];

          if (iteratorMethod) {
            return iteratorMethod.call(iterable);
          }

          if (typeof iterable.next === "function") {
            return iterable;
          }

          if (!isNaN(iterable.length)) {
            var i = -1,
                next = function next() {
              while (++i < iterable.length) {
                if (hasOwn.call(iterable, i)) {
                  next.value = iterable[i];
                  next.done = false;
                  return next;
                }
              }

              next.value = undefined;
              next.done = true;
              return next;
            };

            return next.next = next;
          }
        } // Return an iterator with no values.


        return {
          next: doneResult
        };
      }

      runtime.values = values;

      function doneResult() {
        return {
          value: undefined,
          done: true
        };
      }

      Context.prototype = {
        constructor: Context,
        reset: function (skipTempReset) {
          this.prev = 0;
          this.next = 0; // Resetting context._sent for legacy support of Babel's
          // function.sent implementation.

          this.sent = this._sent = undefined;
          this.done = false;
          this.delegate = null;
          this.method = "next";
          this.arg = undefined;
          this.tryEntries.forEach(resetTryEntry);

          if (!skipTempReset) {
            for (var name in this) {
              // Not sure about the optimal order of these conditions:
              if (name.charAt(0) === "t" && hasOwn.call(this, name) && !isNaN(+name.slice(1))) {
                this[name] = undefined;
              }
            }
          }
        },
        stop: function () {
          this.done = true;
          var rootEntry = this.tryEntries[0];
          var rootRecord = rootEntry.completion;

          if (rootRecord.type === "throw") {
            throw rootRecord.arg;
          }

          return this.rval;
        },
        dispatchException: function (exception) {
          if (this.done) {
            throw exception;
          }

          var context = this;

          function handle(loc, caught) {
            record.type = "throw";
            record.arg = exception;
            context.next = loc;

            if (caught) {
              // If the dispatched exception was caught by a catch block,
              // then let that catch block handle the exception normally.
              context.method = "next";
              context.arg = undefined;
            }

            return !!caught;
          }

          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];
            var record = entry.completion;

            if (entry.tryLoc === "root") {
              // Exception thrown outside of any try block that could handle
              // it, so set the completion value of the entire function to
              // throw the exception.
              return handle("end");
            }

            if (entry.tryLoc <= this.prev) {
              var hasCatch = hasOwn.call(entry, "catchLoc");
              var hasFinally = hasOwn.call(entry, "finallyLoc");

              if (hasCatch && hasFinally) {
                if (this.prev < entry.catchLoc) {
                  return handle(entry.catchLoc, true);
                } else if (this.prev < entry.finallyLoc) {
                  return handle(entry.finallyLoc);
                }
              } else if (hasCatch) {
                if (this.prev < entry.catchLoc) {
                  return handle(entry.catchLoc, true);
                }
              } else if (hasFinally) {
                if (this.prev < entry.finallyLoc) {
                  return handle(entry.finallyLoc);
                }
              } else {
                throw new Error("try statement without catch or finally");
              }
            }
          }
        },
        abrupt: function (type, arg) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];

            if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
              var finallyEntry = entry;
              break;
            }
          }

          if (finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc) {
            // Ignore the finally entry if control is not jumping to a
            // location outside the try/catch block.
            finallyEntry = null;
          }

          var record = finallyEntry ? finallyEntry.completion : {};
          record.type = type;
          record.arg = arg;

          if (finallyEntry) {
            this.method = "next";
            this.next = finallyEntry.finallyLoc;
            return ContinueSentinel;
          }

          return this.complete(record);
        },
        complete: function (record, afterLoc) {
          if (record.type === "throw") {
            throw record.arg;
          }

          if (record.type === "break" || record.type === "continue") {
            this.next = record.arg;
          } else if (record.type === "return") {
            this.rval = this.arg = record.arg;
            this.method = "return";
            this.next = "end";
          } else if (record.type === "normal" && afterLoc) {
            this.next = afterLoc;
          }

          return ContinueSentinel;
        },
        finish: function (finallyLoc) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];

            if (entry.finallyLoc === finallyLoc) {
              this.complete(entry.completion, entry.afterLoc);
              resetTryEntry(entry);
              return ContinueSentinel;
            }
          }
        },
        "catch": function (tryLoc) {
          for (var i = this.tryEntries.length - 1; i >= 0; --i) {
            var entry = this.tryEntries[i];

            if (entry.tryLoc === tryLoc) {
              var record = entry.completion;

              if (record.type === "throw") {
                var thrown = record.arg;
                resetTryEntry(entry);
              }

              return thrown;
            }
          } // The context.catch method must only be called with a location
          // argument that corresponds to a known catch block.


          throw new Error("illegal catch attempt");
        },
        delegateYield: function (iterable, resultName, nextLoc) {
          this.delegate = {
            iterator: values(iterable),
            resultName: resultName,
            nextLoc: nextLoc
          };

          if (this.method === "next") {
            // Deliberately forget the last sent value so that we don't
            // accidentally pass it on to the delegate.
            this.arg = undefined;
          }

          return ContinueSentinel;
        }
      };
    }( // In sloppy mode, unbound `this` refers to the global object, fallback to
    // Function constructor if we're in global strict mode. That is sadly a form
    // of indirect eval which violates Content Security Policy.
    function () {
      return this || typeof self === "object" && self;
    }() || Function("return this")());
  });

  /**
   * Copyright (c) 2014-present, Facebook, Inc.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   */
  // This method of obtaining a reference to the global object needs to be
  // kept identical to the way it is obtained in runtime.js

  var g$2 = function () {
    return this || typeof self === "object" && self;
  }() || Function("return this")(); // Use `getOwnPropertyNames` because not all browsers support calling
  // `hasOwnProperty` on the global `self` object in a worker. See #183.


  var hadRuntime$1 = g$2.regeneratorRuntime && Object.getOwnPropertyNames(g$2).indexOf("regeneratorRuntime") >= 0; // Save the old regeneratorRuntime in case it needs to be restored later.

  var oldRuntime$1 = hadRuntime$1 && g$2.regeneratorRuntime; // Force reevalutation of runtime.js.

  g$2.regeneratorRuntime = undefined;
  var runtimeModule$1 = runtime$1;

  if (hadRuntime$1) {
    // Restore the original runtime.
    g$2.regeneratorRuntime = oldRuntime$1;
  } else {
    // Remove the global property added by runtime.js.
    try {
      delete g$2.regeneratorRuntime;
    } catch (e) {
      g$2.regeneratorRuntime = undefined;
    }
  }

  var regenerator$1 = runtimeModule$1;

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg);
      var value = info.value;
    } catch (error) {
      reject(error);
      return;
    }

    if (info.done) {
      resolve(value);
    } else {
      Promise.resolve(value).then(_next, _throw);
    }
  }

  function _asyncToGenerator(fn) {
    return function () {
      var self = this,
          args = arguments;
      return new Promise(function (resolve, reject) {
        var gen = fn.apply(self, args);

        function _next(value) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
        }

        function _throw(err) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
        }

        _next(undefined);
      });
    };
  }

  var asyncToGenerator = _asyncToGenerator;

  // originally pulled out of simple-peer
  var getBrowserRtc$1 = function getBrowserRTC() {
    if (typeof window === 'undefined') return null;
    var wrtc = {
      RTCPeerConnection: window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection,
      RTCSessionDescription: window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription,
      RTCIceCandidate: window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate
    };
    if (!wrtc.RTCPeerConnection) return null;
    return wrtc;
  };

  var inherits_browser = createCommonjsModule(function (module) {
    if (typeof Object.create === 'function') {
      // implementation from standard node.js 'util' module
      module.exports = function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
      };
    } else {
      // old school shim for old browsers
      module.exports = function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;

        var TempCtor = function () {};

        TempCtor.prototype = superCtor.prototype;
        ctor.prototype = new TempCtor();
        ctor.prototype.constructor = ctor;
      };
    }
  });

  var browser$3 = createCommonjsModule(function (module) {
    // https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues

    var MAX_BYTES = 65536; // Node supports requesting up to this number of bytes
    // https://github.com/nodejs/node/blob/master/lib/internal/crypto/random.js#L48

    var MAX_UINT32 = 4294967295;

    function oldBrowser() {
      throw new Error('Secure random number generation is not supported by this browser.\nUse Chrome, Firefox or Internet Explorer 11');
    }

    var Buffer = safeBuffer.Buffer;
    var crypto = commonjsGlobal.crypto || commonjsGlobal.msCrypto;

    if (crypto && crypto.getRandomValues) {
      module.exports = randomBytes;
    } else {
      module.exports = oldBrowser;
    }

    function randomBytes(size, cb) {
      // phantomjs needs to throw
      if (size > MAX_UINT32) throw new RangeError('requested too many random bytes');
      var bytes = Buffer.allocUnsafe(size);

      if (size > 0) {
        // getRandomValues fails on IE if size == 0
        if (size > MAX_BYTES) {
          // this is the max bytes crypto.getRandomValues
          // can do at once see https://developer.mozilla.org/en-US/docs/Web/API/window.crypto.getRandomValues
          for (var generated = 0; generated < size; generated += MAX_BYTES) {
            // buffer.slice automatically checks if the end is past the end of
            // the buffer so we don't have to here
            crypto.getRandomValues(bytes.slice(generated, generated + MAX_BYTES));
          }
        } else {
          crypto.getRandomValues(bytes);
        }
      }

      if (typeof cb === 'function') {
        return nextTick(function () {
          cb(null, bytes);
        });
      }

      return bytes;
    }
  });

  var inherits;

  if (typeof Object.create === 'function') {
    inherits = function inherits(ctor, superCtor) {
      // implementation from standard node.js 'util' module
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
    };
  } else {
    inherits = function inherits(ctor, superCtor) {
      ctor.super_ = superCtor;

      var TempCtor = function () {};

      TempCtor.prototype = superCtor.prototype;
      ctor.prototype = new TempCtor();
      ctor.prototype.constructor = ctor;
    };
  }

  var inherits$1 = inherits;

  var formatRegExp = /%[sdj%]/g;
  function format$1(f) {
    if (!isString(f)) {
      var objects = [];

      for (var i = 0; i < arguments.length; i++) {
        objects.push(inspect(arguments[i]));
      }

      return objects.join(' ');
    }

    var i = 1;
    var args = arguments;
    var len = args.length;
    var str = String(f).replace(formatRegExp, function (x) {
      if (x === '%%') return '%';
      if (i >= len) return x;

      switch (x) {
        case '%s':
          return String(args[i++]);

        case '%d':
          return Number(args[i++]);

        case '%j':
          try {
            return JSON.stringify(args[i++]);
          } catch (_) {
            return '[Circular]';
          }

        default:
          return x;
      }
    });

    for (var x = args[i]; i < len; x = args[++i]) {
      if (isNull(x) || !isObject(x)) {
        str += ' ' + x;
      } else {
        str += ' ' + inspect(x);
      }
    }

    return str;
  }
  // Returns a modified function which warns once by default.
  // If --no-deprecation is set, then it is a no-op.

  function deprecate(fn, msg) {
    // Allow for deprecating things in the process of starting up.
    if (isUndefined$1(global$1.process)) {
      return function () {
        return deprecate(fn, msg).apply(this, arguments);
      };
    }

    var warned = false;

    function deprecated() {
      if (!warned) {
        {
          console.error(msg);
        }

        warned = true;
      }

      return fn.apply(this, arguments);
    }

    return deprecated;
  }
  var debugs = {};
  var debugEnviron;
  function debuglog(set) {
    if (isUndefined$1(debugEnviron)) debugEnviron = '';
    set = set.toUpperCase();

    if (!debugs[set]) {
      if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
        var pid = 0;

        debugs[set] = function () {
          var msg = format$1.apply(null, arguments);
          console.error('%s %d: %s', set, pid, msg);
        };
      } else {
        debugs[set] = function () {};
      }
    }

    return debugs[set];
  }
  /**
   * Echos the value of a value. Trys to print the value out
   * in the best way possible given the different types.
   *
   * @param {Object} obj The object to print out.
   * @param {Object} opts Optional options object that alters the output.
   */

  /* legacy: obj, showHidden, depth, colors*/

  function inspect(obj, opts) {
    // default options
    var ctx = {
      seen: [],
      stylize: stylizeNoColor
    }; // legacy...

    if (arguments.length >= 3) ctx.depth = arguments[2];
    if (arguments.length >= 4) ctx.colors = arguments[3];

    if (isBoolean(opts)) {
      // legacy...
      ctx.showHidden = opts;
    } else if (opts) {
      // got an "options" object
      _extend(ctx, opts);
    } // set default options


    if (isUndefined$1(ctx.showHidden)) ctx.showHidden = false;
    if (isUndefined$1(ctx.depth)) ctx.depth = 2;
    if (isUndefined$1(ctx.colors)) ctx.colors = false;
    if (isUndefined$1(ctx.customInspect)) ctx.customInspect = true;
    if (ctx.colors) ctx.stylize = stylizeWithColor;
    return formatValue(ctx, obj, ctx.depth);
  } // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics

  inspect.colors = {
    'bold': [1, 22],
    'italic': [3, 23],
    'underline': [4, 24],
    'inverse': [7, 27],
    'white': [37, 39],
    'grey': [90, 39],
    'black': [30, 39],
    'blue': [34, 39],
    'cyan': [36, 39],
    'green': [32, 39],
    'magenta': [35, 39],
    'red': [31, 39],
    'yellow': [33, 39]
  }; // Don't use 'blue' not visible on cmd.exe

  inspect.styles = {
    'special': 'cyan',
    'number': 'yellow',
    'boolean': 'yellow',
    'undefined': 'grey',
    'null': 'bold',
    'string': 'green',
    'date': 'magenta',
    // "name": intentionally not styling
    'regexp': 'red'
  };

  function stylizeWithColor(str, styleType) {
    var style = inspect.styles[styleType];

    if (style) {
      return "\x1B[" + inspect.colors[style][0] + 'm' + str + "\x1B[" + inspect.colors[style][1] + 'm';
    } else {
      return str;
    }
  }

  function stylizeNoColor(str, styleType) {
    return str;
  }

  function arrayToHash(array) {
    var hash = {};
    array.forEach(function (val, idx) {
      hash[val] = true;
    });
    return hash;
  }

  function formatValue(ctx, value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (ctx.customInspect && value && isFunction(value.inspect) && // Filter out the util module, it's inspect function is special
    value.inspect !== inspect && // Also filter out any prototype objects using the circular check.
    !(value.constructor && value.constructor.prototype === value)) {
      var ret = value.inspect(recurseTimes, ctx);

      if (!isString(ret)) {
        ret = formatValue(ctx, ret, recurseTimes);
      }

      return ret;
    } // Primitive types cannot have properties


    var primitive = formatPrimitive(ctx, value);

    if (primitive) {
      return primitive;
    } // Look up the keys of the object.


    var keys = Object.keys(value);
    var visibleKeys = arrayToHash(keys);

    if (ctx.showHidden) {
      keys = Object.getOwnPropertyNames(value);
    } // IE doesn't make error fields non-enumerable
    // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx


    if (isError(value) && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
      return formatError(value);
    } // Some type of object without properties can be shortcutted.


    if (keys.length === 0) {
      if (isFunction(value)) {
        var name = value.name ? ': ' + value.name : '';
        return ctx.stylize('[Function' + name + ']', 'special');
      }

      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
      }

      if (isDate(value)) {
        return ctx.stylize(Date.prototype.toString.call(value), 'date');
      }

      if (isError(value)) {
        return formatError(value);
      }
    }

    var base = '',
        array = false,
        braces = ['{', '}']; // Make Array say that they are Array

    if (isArray$1(value)) {
      array = true;
      braces = ['[', ']'];
    } // Make functions say that they are functions


    if (isFunction(value)) {
      var n = value.name ? ': ' + value.name : '';
      base = ' [Function' + n + ']';
    } // Make RegExps say that they are RegExps


    if (isRegExp(value)) {
      base = ' ' + RegExp.prototype.toString.call(value);
    } // Make dates with properties first say the date


    if (isDate(value)) {
      base = ' ' + Date.prototype.toUTCString.call(value);
    } // Make error with message first say the error


    if (isError(value)) {
      base = ' ' + formatError(value);
    }

    if (keys.length === 0 && (!array || value.length == 0)) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
      } else {
        return ctx.stylize('[Object]', 'special');
      }
    }

    ctx.seen.push(value);
    var output;

    if (array) {
      output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
    } else {
      output = keys.map(function (key) {
        return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
      });
    }

    ctx.seen.pop();
    return reduceToSingleString(output, base, braces);
  }

  function formatPrimitive(ctx, value) {
    if (isUndefined$1(value)) return ctx.stylize('undefined', 'undefined');

    if (isString(value)) {
      var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '').replace(/'/g, "\\'").replace(/\\"/g, '"') + '\'';
      return ctx.stylize(simple, 'string');
    }

    if (isNumber(value)) return ctx.stylize('' + value, 'number');
    if (isBoolean(value)) return ctx.stylize('' + value, 'boolean'); // For some reason typeof null is "object", so special case here.

    if (isNull(value)) return ctx.stylize('null', 'null');
  }

  function formatError(value) {
    return '[' + Error.prototype.toString.call(value) + ']';
  }

  function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
    var output = [];

    for (var i = 0, l = value.length; i < l; ++i) {
      if (hasOwnProperty$1(value, String(i))) {
        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
      } else {
        output.push('');
      }
    }

    keys.forEach(function (key) {
      if (!key.match(/^\d+$/)) {
        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
      }
    });
    return output;
  }

  function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
    var name, str, desc;
    desc = Object.getOwnPropertyDescriptor(value, key) || {
      value: value[key]
    };

    if (desc.get) {
      if (desc.set) {
        str = ctx.stylize('[Getter/Setter]', 'special');
      } else {
        str = ctx.stylize('[Getter]', 'special');
      }
    } else {
      if (desc.set) {
        str = ctx.stylize('[Setter]', 'special');
      }
    }

    if (!hasOwnProperty$1(visibleKeys, key)) {
      name = '[' + key + ']';
    }

    if (!str) {
      if (ctx.seen.indexOf(desc.value) < 0) {
        if (isNull(recurseTimes)) {
          str = formatValue(ctx, desc.value, null);
        } else {
          str = formatValue(ctx, desc.value, recurseTimes - 1);
        }

        if (str.indexOf('\n') > -1) {
          if (array) {
            str = str.split('\n').map(function (line) {
              return '  ' + line;
            }).join('\n').substr(2);
          } else {
            str = '\n' + str.split('\n').map(function (line) {
              return '   ' + line;
            }).join('\n');
          }
        }
      } else {
        str = ctx.stylize('[Circular]', 'special');
      }
    }

    if (isUndefined$1(name)) {
      if (array && key.match(/^\d+$/)) {
        return str;
      }

      name = JSON.stringify('' + key);

      if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
        name = name.substr(1, name.length - 2);
        name = ctx.stylize(name, 'name');
      } else {
        name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
        name = ctx.stylize(name, 'string');
      }
    }

    return name + ': ' + str;
  }

  function reduceToSingleString(output, base, braces) {
    var length = output.reduce(function (prev, cur) {
      if (cur.indexOf('\n') >= 0) ;
      return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
    }, 0);

    if (length > 60) {
      return braces[0] + (base === '' ? '' : base + '\n ') + ' ' + output.join(',\n  ') + ' ' + braces[1];
    }

    return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
  } // NOTE: These type checking functions intentionally don't use `instanceof`
  // because it is fragile and can be easily faked with `Object.create()`.


  function isArray$1(ar) {
    return Array.isArray(ar);
  }
  function isBoolean(arg) {
    return typeof arg === 'boolean';
  }
  function isNull(arg) {
    return arg === null;
  }
  function isNullOrUndefined(arg) {
    return arg == null;
  }
  function isNumber(arg) {
    return typeof arg === 'number';
  }
  function isString(arg) {
    return typeof arg === 'string';
  }
  function isUndefined$1(arg) {
    return arg === void 0;
  }
  function isRegExp(re) {
    return isObject(re) && objectToString(re) === '[object RegExp]';
  }
  function isObject(arg) {
    return typeof arg === 'object' && arg !== null;
  }
  function isDate(d) {
    return isObject(d) && objectToString(d) === '[object Date]';
  }
  function isError(e) {
    return isObject(e) && (objectToString(e) === '[object Error]' || e instanceof Error);
  }
  function isFunction(arg) {
    return typeof arg === 'function';
  }

  function objectToString(o) {
    return Object.prototype.toString.call(o);
  }
  function _extend(origin, add) {
    // Don't do anything if add isn't an object
    if (!add || !isObject(add)) return origin;
    var keys = Object.keys(add);
    var i = keys.length;

    while (i--) {
      origin[keys[i]] = add[keys[i]];
    }

    return origin;
  }

  function hasOwnProperty$1(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  function BufferList() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function (v) {
    var entry = {
      data: v,
      next: null
    };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function (v) {
    var entry = {
      data: v,
      next: this.head
    };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function () {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function () {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function (s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;

    while (p = p.next) {
      ret += s + p.data;
    }

    return ret;
  };

  BufferList.prototype.concat = function (n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;

    while (p) {
      p.data.copy(ret, i);
      i += p.data.length;
      p = p.next;
    }

    return ret;
  };

  // Copyright Joyent, Inc. and other Node contributors.

  var isBufferEncoding = Buffer.isEncoding || function (encoding) {
    switch (encoding && encoding.toLowerCase()) {
      case 'hex':
      case 'utf8':
      case 'utf-8':
      case 'ascii':
      case 'binary':
      case 'base64':
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
      case 'raw':
        return true;

      default:
        return false;
    }
  };

  function assertEncoding(encoding) {
    if (encoding && !isBufferEncoding(encoding)) {
      throw new Error('Unknown encoding: ' + encoding);
    }
  } // StringDecoder provides an interface for efficiently splitting a series of
  // buffers into a series of JS strings without breaking apart multi-byte
  // characters. CESU-8 is handled as part of the UTF-8 encoding.
  //
  // @TODO Handling all encodings inside a single object makes it very difficult
  // to reason about this code, so it should be split up in the future.
  // @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
  // points as used by CESU-8.


  function StringDecoder(encoding) {
    this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
    assertEncoding(encoding);

    switch (this.encoding) {
      case 'utf8':
        // CESU-8 represents each of Surrogate Pair by 3-bytes
        this.surrogateSize = 3;
        break;

      case 'ucs2':
      case 'utf16le':
        // UTF-16 represents each of Surrogate Pair by 2-bytes
        this.surrogateSize = 2;
        this.detectIncompleteChar = utf16DetectIncompleteChar;
        break;

      case 'base64':
        // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
        this.surrogateSize = 3;
        this.detectIncompleteChar = base64DetectIncompleteChar;
        break;

      default:
        this.write = passThroughWrite;
        return;
    } // Enough space to store all bytes of a single character. UTF-8 needs 4
    // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).


    this.charBuffer = new Buffer(6); // Number of bytes received for the current incomplete multi-byte character.

    this.charReceived = 0; // Number of bytes expected for the current incomplete multi-byte character.

    this.charLength = 0;
  }
  // guaranteed to not contain any partial multi-byte characters. Any partial
  // character found at the end of the buffer is buffered up, and will be
  // returned when calling write again with the remaining bytes.
  //
  // Note: Converting a Buffer containing an orphan surrogate to a String
  // currently works, but converting a String to a Buffer (via `new Buffer`, or
  // Buffer#write) will replace incomplete surrogates with the unicode
  // replacement character. See https://codereview.chromium.org/121173009/ .

  StringDecoder.prototype.write = function (buffer) {
    var charStr = ''; // if our last write ended with an incomplete multibyte character

    while (this.charLength) {
      // determine how many remaining bytes this buffer has to offer for this char
      var available = buffer.length >= this.charLength - this.charReceived ? this.charLength - this.charReceived : buffer.length; // add the new bytes to the char buffer

      buffer.copy(this.charBuffer, this.charReceived, 0, available);
      this.charReceived += available;

      if (this.charReceived < this.charLength) {
        // still not enough chars in this buffer? wait for more ...
        return '';
      } // remove bytes belonging to the current character from the buffer


      buffer = buffer.slice(available, buffer.length); // get the character that was split

      charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding); // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character

      var charCode = charStr.charCodeAt(charStr.length - 1);

      if (charCode >= 0xD800 && charCode <= 0xDBFF) {
        this.charLength += this.surrogateSize;
        charStr = '';
        continue;
      }

      this.charReceived = this.charLength = 0; // if there are no more bytes in this buffer, just emit our char

      if (buffer.length === 0) {
        return charStr;
      }

      break;
    } // determine and set charLength / charReceived


    this.detectIncompleteChar(buffer);
    var end = buffer.length;

    if (this.charLength) {
      // buffer the incomplete character bytes we got
      buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
      end -= this.charReceived;
    }

    charStr += buffer.toString(this.encoding, 0, end);
    var end = charStr.length - 1;
    var charCode = charStr.charCodeAt(end); // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character

    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      var size = this.surrogateSize;
      this.charLength += size;
      this.charReceived += size;
      this.charBuffer.copy(this.charBuffer, size, 0, size);
      buffer.copy(this.charBuffer, 0, 0, size);
      return charStr.substring(0, end);
    } // or just emit the charStr


    return charStr;
  }; // detectIncompleteChar determines if there is an incomplete UTF-8 character at
  // the end of the given buffer. If so, it sets this.charLength to the byte
  // length that character, and sets this.charReceived to the number of bytes
  // that are available for this character.


  StringDecoder.prototype.detectIncompleteChar = function (buffer) {
    // determine how many bytes we have to check at the end of this buffer
    var i = buffer.length >= 3 ? 3 : buffer.length; // Figure out if one of the last i bytes of our buffer announces an
    // incomplete char.

    for (; i > 0; i--) {
      var c = buffer[buffer.length - i]; // See http://en.wikipedia.org/wiki/UTF-8#Description
      // 110XXXXX

      if (i == 1 && c >> 5 == 0x06) {
        this.charLength = 2;
        break;
      } // 1110XXXX


      if (i <= 2 && c >> 4 == 0x0E) {
        this.charLength = 3;
        break;
      } // 11110XXX


      if (i <= 3 && c >> 3 == 0x1E) {
        this.charLength = 4;
        break;
      }
    }

    this.charReceived = i;
  };

  StringDecoder.prototype.end = function (buffer) {
    var res = '';
    if (buffer && buffer.length) res = this.write(buffer);

    if (this.charReceived) {
      var cr = this.charReceived;
      var buf = this.charBuffer;
      var enc = this.encoding;
      res += buf.slice(0, cr).toString(enc);
    }

    return res;
  };

  function passThroughWrite(buffer) {
    return buffer.toString(this.encoding);
  }

  function utf16DetectIncompleteChar(buffer) {
    this.charReceived = buffer.length % 2;
    this.charLength = this.charReceived ? 2 : 0;
  }

  function base64DetectIncompleteChar(buffer) {
    this.charReceived = buffer.length % 3;
    this.charLength = this.charReceived ? 3 : 0;
  }

  Readable.ReadableState = ReadableState;
  var debug$1 = debuglog('stream');
  inherits$1(Readable, EventEmitter);

  function prependListener(emitter, event, fn) {
    // Sadly this is not cacheable as some libraries bundle their own
    // event emitter implementation with them.
    if (typeof emitter.prependListener === 'function') {
      return emitter.prependListener(event, fn);
    } else {
      // This is a hack to make sure that our error handler is attached before any
      // userland ones.  NEVER DO THIS. This is here only because this code needs
      // to continue to work with older versions of Node.js that do not include
      // the prependListener() method. The goal is to eventually remove this hack.
      if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (Array.isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
    }
  }

  function listenerCount$1(emitter, type) {
    return emitter.listeners(type).length;
  }

  function ReadableState(options, stream) {
    options = options || {}; // object stream flag. Used to make read(n) ignore n and to
    // make all the buffer merging and length checks go away

    this.objectMode = !!options.objectMode;
    if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode; // the point at which it stops calling _read() to fill the buffer
    // Note: 0 is a valid value, means "don't call _read preemptively ever"

    var hwm = options.highWaterMark;
    var defaultHwm = this.objectMode ? 16 : 16 * 1024;
    this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm; // cast to ints.

    this.highWaterMark = ~~this.highWaterMark; // A linked list is used to store data chunks instead of an array because the
    // linked list can remove elements from the beginning faster than
    // array.shift()

    this.buffer = new BufferList();
    this.length = 0;
    this.pipes = null;
    this.pipesCount = 0;
    this.flowing = null;
    this.ended = false;
    this.endEmitted = false;
    this.reading = false; // a flag to be able to tell if the onwrite cb is called immediately,
    // or on a later tick.  We set this to true at first, because any
    // actions that shouldn't happen until "later" should generally also
    // not happen before the first write call.

    this.sync = true; // whenever we return null, then we set a flag to say
    // that we're awaiting a 'readable' event emission.

    this.needReadable = false;
    this.emittedReadable = false;
    this.readableListening = false;
    this.resumeScheduled = false; // Crypto is kind of old and crusty.  Historically, its default string
    // encoding is 'binary' so we have to make this configurable.
    // Everything else in the universe uses 'utf8', though.

    this.defaultEncoding = options.defaultEncoding || 'utf8'; // when piping, we only care about 'readable' events that happen
    // after read()ing all the bytes and not getting any pushback.

    this.ranOut = false; // the number of writers that are awaiting a drain event in .pipe()s

    this.awaitDrain = 0; // if true, a maybeReadMore has been scheduled

    this.readingMore = false;
    this.decoder = null;
    this.encoding = null;

    if (options.encoding) {
      this.decoder = new StringDecoder(options.encoding);
      this.encoding = options.encoding;
    }
  }
  function Readable(options) {
    if (!(this instanceof Readable)) return new Readable(options);
    this._readableState = new ReadableState(options, this); // legacy

    this.readable = true;
    if (options && typeof options.read === 'function') this._read = options.read;
    EventEmitter.call(this);
  } // Manually shove something into the read() buffer.
  // This returns true if the highWaterMark has not been hit yet,
  // similar to how Writable.write() returns true if you should
  // write() some more.

  Readable.prototype.push = function (chunk, encoding) {
    var state = this._readableState;

    if (!state.objectMode && typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;

      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
    }

    return readableAddChunk(this, state, chunk, encoding, false);
  }; // Unshift should *always* be something directly out of read()


  Readable.prototype.unshift = function (chunk) {
    var state = this._readableState;
    return readableAddChunk(this, state, chunk, '', true);
  };

  Readable.prototype.isPaused = function () {
    return this._readableState.flowing === false;
  };

  function readableAddChunk(stream, state, chunk, encoding, addToFront) {
    var er = chunkInvalid(state, chunk);

    if (er) {
      stream.emit('error', er);
    } else if (chunk === null) {
      state.reading = false;
      onEofChunk(stream, state);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (state.ended && !addToFront) {
        var e = new Error('stream.push() after EOF');
        stream.emit('error', e);
      } else if (state.endEmitted && addToFront) {
        var _e = new Error('stream.unshift() after end event');

        stream.emit('error', _e);
      } else {
        var skipAdd;

        if (state.decoder && !addToFront && !encoding) {
          chunk = state.decoder.write(chunk);
          skipAdd = !state.objectMode && chunk.length === 0;
        }

        if (!addToFront) state.reading = false; // Don't add to the buffer if we've decoded to an empty string chunk and
        // we're not in object mode

        if (!skipAdd) {
          // if we want the data now, just emit it.
          if (state.flowing && state.length === 0 && !state.sync) {
            stream.emit('data', chunk);
            stream.read(0);
          } else {
            // update the buffer info.
            state.length += state.objectMode ? 1 : chunk.length;
            if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);
            if (state.needReadable) emitReadable(stream);
          }
        }

        maybeReadMore(stream, state);
      }
    } else if (!addToFront) {
      state.reading = false;
    }

    return needMoreData(state);
  } // if it's past the high water mark, we can push in some more.
  // Also, if we have no data yet, we can stand some
  // more bytes.  This is to work around cases where hwm=0,
  // such as the repl.  Also, if the push() triggered a
  // readable event, and the user called read(largeNumber) such that
  // needReadable was set, then we ought to push more, so that another
  // 'readable' event will be triggered.


  function needMoreData(state) {
    return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
  } // backwards compatibility.


  Readable.prototype.setEncoding = function (enc) {
    this._readableState.decoder = new StringDecoder(enc);
    this._readableState.encoding = enc;
    return this;
  }; // Don't raise the hwm > 8MB


  var MAX_HWM = 0x800000;

  function computeNewHighWaterMark(n) {
    if (n >= MAX_HWM) {
      n = MAX_HWM;
    } else {
      // Get the next highest power of 2 to prevent increasing hwm excessively in
      // tiny amounts
      n--;
      n |= n >>> 1;
      n |= n >>> 2;
      n |= n >>> 4;
      n |= n >>> 8;
      n |= n >>> 16;
      n++;
    }

    return n;
  } // This function is designed to be inlinable, so please take care when making
  // changes to the function body.


  function howMuchToRead(n, state) {
    if (n <= 0 || state.length === 0 && state.ended) return 0;
    if (state.objectMode) return 1;

    if (n !== n) {
      // Only flow one buffer at a time
      if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
    } // If we're asking for more than the current hwm, then raise the hwm.


    if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
    if (n <= state.length) return n; // Don't have enough

    if (!state.ended) {
      state.needReadable = true;
      return 0;
    }

    return state.length;
  } // you can override either this method, or the async _read(n) below.


  Readable.prototype.read = function (n) {
    debug$1('read', n);
    n = parseInt(n, 10);
    var state = this._readableState;
    var nOrig = n;
    if (n !== 0) state.emittedReadable = false; // if we're doing read(0) to trigger a readable event, but we
    // already have a bunch of data in the buffer, then just trigger
    // the 'readable' event and move on.

    if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
      debug$1('read: emitReadable', state.length, state.ended);
      if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
      return null;
    }

    n = howMuchToRead(n, state); // if we've ended, and we're now clear, then finish it up.

    if (n === 0 && state.ended) {
      if (state.length === 0) endReadable(this);
      return null;
    } // All the actual chunk generation logic needs to be
    // *below* the call to _read.  The reason is that in certain
    // synthetic stream cases, such as passthrough streams, _read
    // may be a completely synchronous operation which may change
    // the state of the read buffer, providing enough data when
    // before there was *not* enough.
    //
    // So, the steps are:
    // 1. Figure out what the state of things will be after we do
    // a read from the buffer.
    //
    // 2. If that resulting state will trigger a _read, then call _read.
    // Note that this may be asynchronous, or synchronous.  Yes, it is
    // deeply ugly to write APIs this way, but that still doesn't mean
    // that the Readable class should behave improperly, as streams are
    // designed to be sync/async agnostic.
    // Take note if the _read call is sync or async (ie, if the read call
    // has returned yet), so that we know whether or not it's safe to emit
    // 'readable' etc.
    //
    // 3. Actually pull the requested chunks out of the buffer and return.
    // if we need a readable event, then we need to do some reading.


    var doRead = state.needReadable;
    debug$1('need readable', doRead); // if we currently have less than the highWaterMark, then also read some

    if (state.length === 0 || state.length - n < state.highWaterMark) {
      doRead = true;
      debug$1('length less than watermark', doRead);
    } // however, if we've ended, then there's no point, and if we're already
    // reading, then it's unnecessary.


    if (state.ended || state.reading) {
      doRead = false;
      debug$1('reading or ended', doRead);
    } else if (doRead) {
      debug$1('do read');
      state.reading = true;
      state.sync = true; // if the length is currently zero, then we *need* a readable event.

      if (state.length === 0) state.needReadable = true; // call internal read method

      this._read(state.highWaterMark);

      state.sync = false; // If _read pushed data synchronously, then `reading` will be false,
      // and we need to re-evaluate how much data we can return to the user.

      if (!state.reading) n = howMuchToRead(nOrig, state);
    }

    var ret;
    if (n > 0) ret = fromList(n, state);else ret = null;

    if (ret === null) {
      state.needReadable = true;
      n = 0;
    } else {
      state.length -= n;
    }

    if (state.length === 0) {
      // If we have nothing in the buffer, then we want to know
      // as soon as we *do* get something into the buffer.
      if (!state.ended) state.needReadable = true; // If we tried to read() past the EOF, then emit end on the next tick.

      if (nOrig !== n && state.ended) endReadable(this);
    }

    if (ret !== null) this.emit('data', ret);
    return ret;
  };

  function chunkInvalid(state, chunk) {
    var er = null;

    if (!isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
      er = new TypeError('Invalid non-string/buffer chunk');
    }

    return er;
  }

  function onEofChunk(stream, state) {
    if (state.ended) return;

    if (state.decoder) {
      var chunk = state.decoder.end();

      if (chunk && chunk.length) {
        state.buffer.push(chunk);
        state.length += state.objectMode ? 1 : chunk.length;
      }
    }

    state.ended = true; // emit 'readable' now to make sure it gets picked up.

    emitReadable(stream);
  } // Don't emit readable right away in sync mode, because this can trigger
  // another read() call => stack overflow.  This way, it might trigger
  // a nextTick recursion warning, but that's not so bad.


  function emitReadable(stream) {
    var state = stream._readableState;
    state.needReadable = false;

    if (!state.emittedReadable) {
      debug$1('emitReadable', state.flowing);
      state.emittedReadable = true;
      if (state.sync) nextTick(emitReadable_, stream);else emitReadable_(stream);
    }
  }

  function emitReadable_(stream) {
    debug$1('emit readable');
    stream.emit('readable');
    flow(stream);
  } // at this point, the user has presumably seen the 'readable' event,
  // and called read() to consume some data.  that may have triggered
  // in turn another _read(n) call, in which case reading = true if
  // it's in progress.
  // However, if we're not ended, or reading, and the length < hwm,
  // then go ahead and try to read some more preemptively.


  function maybeReadMore(stream, state) {
    if (!state.readingMore) {
      state.readingMore = true;
      nextTick(maybeReadMore_, stream, state);
    }
  }

  function maybeReadMore_(stream, state) {
    var len = state.length;

    while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
      debug$1('maybeReadMore read 0');
      stream.read(0);
      if (len === state.length) // didn't get any data, stop spinning.
        break;else len = state.length;
    }

    state.readingMore = false;
  } // abstract method.  to be overridden in specific implementation classes.
  // call cb(er, data) where data is <= n in length.
  // for virtual (non-string, non-buffer) streams, "length" is somewhat
  // arbitrary, and perhaps not very meaningful.


  Readable.prototype._read = function (n) {
    this.emit('error', new Error('not implemented'));
  };

  Readable.prototype.pipe = function (dest, pipeOpts) {
    var src = this;
    var state = this._readableState;

    switch (state.pipesCount) {
      case 0:
        state.pipes = dest;
        break;

      case 1:
        state.pipes = [state.pipes, dest];
        break;

      default:
        state.pipes.push(dest);
        break;
    }

    state.pipesCount += 1;
    debug$1('pipe count=%d opts=%j', state.pipesCount, pipeOpts);
    var doEnd = !pipeOpts || pipeOpts.end !== false;
    var endFn = doEnd ? onend : cleanup;
    if (state.endEmitted) nextTick(endFn);else src.once('end', endFn);
    dest.on('unpipe', onunpipe);

    function onunpipe(readable) {
      debug$1('onunpipe');

      if (readable === src) {
        cleanup();
      }
    }

    function onend() {
      debug$1('onend');
      dest.end();
    } // when the dest drains, it reduces the awaitDrain counter
    // on the source.  This would be more elegant with a .once()
    // handler in flow(), but adding and removing repeatedly is
    // too slow.


    var ondrain = pipeOnDrain(src);
    dest.on('drain', ondrain);
    var cleanedUp = false;

    function cleanup() {
      debug$1('cleanup'); // cleanup event handlers once the pipe is broken

      dest.removeListener('close', onclose);
      dest.removeListener('finish', onfinish);
      dest.removeListener('drain', ondrain);
      dest.removeListener('error', onerror);
      dest.removeListener('unpipe', onunpipe);
      src.removeListener('end', onend);
      src.removeListener('end', cleanup);
      src.removeListener('data', ondata);
      cleanedUp = true; // if the reader is waiting for a drain event from this
      // specific writer, then it would cause it to never start
      // flowing again.
      // So, if this is awaiting a drain, then we just call it now.
      // If we don't know, then assume that we are waiting for one.

      if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
    } // If the user pushes more data while we're writing to dest then we'll end up
    // in ondata again. However, we only want to increase awaitDrain once because
    // dest will only emit one 'drain' event for the multiple writes.
    // => Introduce a guard on increasing awaitDrain.


    var increasedAwaitDrain = false;
    src.on('data', ondata);

    function ondata(chunk) {
      debug$1('ondata');
      increasedAwaitDrain = false;
      var ret = dest.write(chunk);

      if (false === ret && !increasedAwaitDrain) {
        // If the user unpiped during `dest.write()`, it is possible
        // to get stuck in a permanently paused state if that write
        // also returned false.
        // => Check whether `dest` is still a piping destination.
        if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
          debug$1('false write response, pause', src._readableState.awaitDrain);
          src._readableState.awaitDrain++;
          increasedAwaitDrain = true;
        }

        src.pause();
      }
    } // if the dest has an error, then stop piping into it.
    // however, don't suppress the throwing behavior for this.


    function onerror(er) {
      debug$1('onerror', er);
      unpipe();
      dest.removeListener('error', onerror);
      if (listenerCount$1(dest, 'error') === 0) dest.emit('error', er);
    } // Make sure our error handler is attached before userland ones.


    prependListener(dest, 'error', onerror); // Both close and finish should trigger unpipe, but only once.

    function onclose() {
      dest.removeListener('finish', onfinish);
      unpipe();
    }

    dest.once('close', onclose);

    function onfinish() {
      debug$1('onfinish');
      dest.removeListener('close', onclose);
      unpipe();
    }

    dest.once('finish', onfinish);

    function unpipe() {
      debug$1('unpipe');
      src.unpipe(dest);
    } // tell the dest that it's being piped to


    dest.emit('pipe', src); // start the flow if it hasn't been started already.

    if (!state.flowing) {
      debug$1('pipe resume');
      src.resume();
    }

    return dest;
  };

  function pipeOnDrain(src) {
    return function () {
      var state = src._readableState;
      debug$1('pipeOnDrain', state.awaitDrain);
      if (state.awaitDrain) state.awaitDrain--;

      if (state.awaitDrain === 0 && src.listeners('data').length) {
        state.flowing = true;
        flow(src);
      }
    };
  }

  Readable.prototype.unpipe = function (dest) {
    var state = this._readableState; // if we're not piping anywhere, then do nothing.

    if (state.pipesCount === 0) return this; // just one destination.  most common case.

    if (state.pipesCount === 1) {
      // passed in one, but it's not the right one.
      if (dest && dest !== state.pipes) return this;
      if (!dest) dest = state.pipes; // got a match.

      state.pipes = null;
      state.pipesCount = 0;
      state.flowing = false;
      if (dest) dest.emit('unpipe', this);
      return this;
    } // slow case. multiple pipe destinations.


    if (!dest) {
      // remove all.
      var dests = state.pipes;
      var len = state.pipesCount;
      state.pipes = null;
      state.pipesCount = 0;
      state.flowing = false;

      for (var _i = 0; _i < len; _i++) {
        dests[_i].emit('unpipe', this);
      }

      return this;
    } // try to find the right one.


    var i = indexOf(state.pipes, dest);
    if (i === -1) return this;
    state.pipes.splice(i, 1);
    state.pipesCount -= 1;
    if (state.pipesCount === 1) state.pipes = state.pipes[0];
    dest.emit('unpipe', this);
    return this;
  }; // set up data events if they are asked for
  // Ensure readable listeners eventually get something


  Readable.prototype.on = function (ev, fn) {
    var res = EventEmitter.prototype.on.call(this, ev, fn);

    if (ev === 'data') {
      // Start flowing on next tick if stream isn't explicitly paused
      if (this._readableState.flowing !== false) this.resume();
    } else if (ev === 'readable') {
      var state = this._readableState;

      if (!state.endEmitted && !state.readableListening) {
        state.readableListening = state.needReadable = true;
        state.emittedReadable = false;

        if (!state.reading) {
          nextTick(nReadingNextTick, this);
        } else if (state.length) {
          emitReadable(this, state);
        }
      }
    }

    return res;
  };

  Readable.prototype.addListener = Readable.prototype.on;

  function nReadingNextTick(self) {
    debug$1('readable nexttick read 0');
    self.read(0);
  } // pause() and resume() are remnants of the legacy readable stream API
  // If the user uses them, then switch into old mode.


  Readable.prototype.resume = function () {
    var state = this._readableState;

    if (!state.flowing) {
      debug$1('resume');
      state.flowing = true;
      resume(this, state);
    }

    return this;
  };

  function resume(stream, state) {
    if (!state.resumeScheduled) {
      state.resumeScheduled = true;
      nextTick(resume_, stream, state);
    }
  }

  function resume_(stream, state) {
    if (!state.reading) {
      debug$1('resume read 0');
      stream.read(0);
    }

    state.resumeScheduled = false;
    state.awaitDrain = 0;
    stream.emit('resume');
    flow(stream);
    if (state.flowing && !state.reading) stream.read(0);
  }

  Readable.prototype.pause = function () {
    debug$1('call pause flowing=%j', this._readableState.flowing);

    if (false !== this._readableState.flowing) {
      debug$1('pause');
      this._readableState.flowing = false;
      this.emit('pause');
    }

    return this;
  };

  function flow(stream) {
    var state = stream._readableState;
    debug$1('flow', state.flowing);

    while (state.flowing && stream.read() !== null) {}
  } // wrap an old-style stream as the async data source.
  // This is *not* part of the readable stream interface.
  // It is an ugly unfortunate mess of history.


  Readable.prototype.wrap = function (stream) {
    var state = this._readableState;
    var paused = false;
    var self = this;
    stream.on('end', function () {
      debug$1('wrapped end');

      if (state.decoder && !state.ended) {
        var chunk = state.decoder.end();
        if (chunk && chunk.length) self.push(chunk);
      }

      self.push(null);
    });
    stream.on('data', function (chunk) {
      debug$1('wrapped data');
      if (state.decoder) chunk = state.decoder.write(chunk); // don't skip over falsy values in objectMode

      if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;
      var ret = self.push(chunk);

      if (!ret) {
        paused = true;
        stream.pause();
      }
    }); // proxy all the other methods.
    // important when wrapping filters and duplexes.

    for (var i in stream) {
      if (this[i] === undefined && typeof stream[i] === 'function') {
        this[i] = function (method) {
          return function () {
            return stream[method].apply(stream, arguments);
          };
        }(i);
      }
    } // proxy certain important events.


    var events = ['error', 'close', 'destroy', 'pause', 'resume'];
    forEach(events, function (ev) {
      stream.on(ev, self.emit.bind(self, ev));
    }); // when we try to consume some more bytes, simply unpause the
    // underlying stream.

    self._read = function (n) {
      debug$1('wrapped _read', n);

      if (paused) {
        paused = false;
        stream.resume();
      }
    };

    return self;
  }; // exposed for testing purposes only.


  Readable._fromList = fromList; // Pluck off n bytes from an array of buffers.
  // Length is the combined lengths of all the buffers in the list.
  // This function is designed to be inlinable, so please take care when making
  // changes to the function body.

  function fromList(n, state) {
    // nothing buffered
    if (state.length === 0) return null;
    var ret;
    if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
      // read it all, truncate the list
      if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
      state.buffer.clear();
    } else {
      // read part of list
      ret = fromListPartial(n, state.buffer, state.decoder);
    }
    return ret;
  } // Extracts only enough buffered data to satisfy the amount requested.
  // This function is designed to be inlinable, so please take care when making
  // changes to the function body.


  function fromListPartial(n, list, hasStrings) {
    var ret;

    if (n < list.head.data.length) {
      // slice is the same for buffers and strings
      ret = list.head.data.slice(0, n);
      list.head.data = list.head.data.slice(n);
    } else if (n === list.head.data.length) {
      // first chunk is a perfect match
      ret = list.shift();
    } else {
      // result spans more than one buffer
      ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
    }

    return ret;
  } // Copies a specified amount of characters from the list of buffered data
  // chunks.
  // This function is designed to be inlinable, so please take care when making
  // changes to the function body.


  function copyFromBufferString(n, list) {
    var p = list.head;
    var c = 1;
    var ret = p.data;
    n -= ret.length;

    while (p = p.next) {
      var str = p.data;
      var nb = n > str.length ? str.length : n;
      if (nb === str.length) ret += str;else ret += str.slice(0, n);
      n -= nb;

      if (n === 0) {
        if (nb === str.length) {
          ++c;
          if (p.next) list.head = p.next;else list.head = list.tail = null;
        } else {
          list.head = p;
          p.data = str.slice(nb);
        }

        break;
      }

      ++c;
    }

    list.length -= c;
    return ret;
  } // Copies a specified amount of bytes from the list of buffered data chunks.
  // This function is designed to be inlinable, so please take care when making
  // changes to the function body.


  function copyFromBuffer(n, list) {
    var ret = Buffer.allocUnsafe(n);
    var p = list.head;
    var c = 1;
    p.data.copy(ret);
    n -= p.data.length;

    while (p = p.next) {
      var buf = p.data;
      var nb = n > buf.length ? buf.length : n;
      buf.copy(ret, ret.length - n, 0, nb);
      n -= nb;

      if (n === 0) {
        if (nb === buf.length) {
          ++c;
          if (p.next) list.head = p.next;else list.head = list.tail = null;
        } else {
          list.head = p;
          p.data = buf.slice(nb);
        }

        break;
      }

      ++c;
    }

    list.length -= c;
    return ret;
  }

  function endReadable(stream) {
    var state = stream._readableState; // If we get here before consuming all the bytes, then that is a
    // bug in node.  Should never happen.

    if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

    if (!state.endEmitted) {
      state.ended = true;
      nextTick(endReadableNT, state, stream);
    }
  }

  function endReadableNT(state, stream) {
    // Check that we didn't get one last unshift.
    if (!state.endEmitted && state.length === 0) {
      state.endEmitted = true;
      stream.readable = false;
      stream.emit('end');
    }
  }

  function forEach(xs, f) {
    for (var i = 0, l = xs.length; i < l; i++) {
      f(xs[i], i);
    }
  }

  function indexOf(xs, x) {
    for (var i = 0, l = xs.length; i < l; i++) {
      if (xs[i] === x) return i;
    }

    return -1;
  }

  // A bit simpler than readable streams.
  Writable.WritableState = WritableState;
  inherits$1(Writable, EventEmitter);

  function nop() {}

  function WriteReq(chunk, encoding, cb) {
    this.chunk = chunk;
    this.encoding = encoding;
    this.callback = cb;
    this.next = null;
  }

  function WritableState(options, stream) {
    Object.defineProperty(this, 'buffer', {
      get: deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.')
    });
    options = options || {}; // object stream flag to indicate whether or not this stream
    // contains buffers or objects.

    this.objectMode = !!options.objectMode;
    if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode; // the point at which write() starts returning false
    // Note: 0 is a valid value, means that we always return false if
    // the entire buffer is not flushed immediately on write()

    var hwm = options.highWaterMark;
    var defaultHwm = this.objectMode ? 16 : 16 * 1024;
    this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm; // cast to ints.

    this.highWaterMark = ~~this.highWaterMark;
    this.needDrain = false; // at the start of calling end()

    this.ending = false; // when end() has been called, and returned

    this.ended = false; // when 'finish' is emitted

    this.finished = false; // should we decode strings into buffers before passing to _write?
    // this is here so that some node-core streams can optimize string
    // handling at a lower level.

    var noDecode = options.decodeStrings === false;
    this.decodeStrings = !noDecode; // Crypto is kind of old and crusty.  Historically, its default string
    // encoding is 'binary' so we have to make this configurable.
    // Everything else in the universe uses 'utf8', though.

    this.defaultEncoding = options.defaultEncoding || 'utf8'; // not an actual buffer we keep track of, but a measurement
    // of how much we're waiting to get pushed to some underlying
    // socket or file.

    this.length = 0; // a flag to see when we're in the middle of a write.

    this.writing = false; // when true all writes will be buffered until .uncork() call

    this.corked = 0; // a flag to be able to tell if the onwrite cb is called immediately,
    // or on a later tick.  We set this to true at first, because any
    // actions that shouldn't happen until "later" should generally also
    // not happen before the first write call.

    this.sync = true; // a flag to know if we're processing previously buffered items, which
    // may call the _write() callback in the same tick, so that we don't
    // end up in an overlapped onwrite situation.

    this.bufferProcessing = false; // the callback that's passed to _write(chunk,cb)

    this.onwrite = function (er) {
      onwrite(stream, er);
    }; // the callback that the user supplies to write(chunk,encoding,cb)


    this.writecb = null; // the amount that is being written when _write is called.

    this.writelen = 0;
    this.bufferedRequest = null;
    this.lastBufferedRequest = null; // number of pending user-supplied write callbacks
    // this must be 0 before 'finish' can be emitted

    this.pendingcb = 0; // emit prefinish if the only thing we're waiting for is _write cbs
    // This is relevant for synchronous Transform streams

    this.prefinished = false; // True if the error was already emitted and should not be thrown again

    this.errorEmitted = false; // count buffered requests

    this.bufferedRequestCount = 0; // allocate the first CorkedRequest, there is always
    // one allocated and free to use, and we maintain at most two

    this.corkedRequestsFree = new CorkedRequest(this);
  }

  WritableState.prototype.getBuffer = function writableStateGetBuffer() {
    var current = this.bufferedRequest;
    var out = [];

    while (current) {
      out.push(current);
      current = current.next;
    }

    return out;
  };
  function Writable(options) {
    // Writable ctor is applied to Duplexes, though they're not
    // instanceof Writable, they're instanceof Readable.
    if (!(this instanceof Writable) && !(this instanceof Duplex)) return new Writable(options);
    this._writableState = new WritableState(options, this); // legacy.

    this.writable = true;

    if (options) {
      if (typeof options.write === 'function') this._write = options.write;
      if (typeof options.writev === 'function') this._writev = options.writev;
    }

    EventEmitter.call(this);
  } // Otherwise people can pipe Writable streams, which is just wrong.

  Writable.prototype.pipe = function () {
    this.emit('error', new Error('Cannot pipe, not readable'));
  };

  function writeAfterEnd(stream, cb) {
    var er = new Error('write after end'); // TODO: defer error events consistently everywhere, not just the cb

    stream.emit('error', er);
    nextTick(cb, er);
  } // If we get something that is not a buffer, string, null, or undefined,
  // and we're not in objectMode, then that's an error.
  // Otherwise stream chunks are all considered to be of length=1, and the
  // watermarks determine how many objects to keep in the buffer, rather than
  // how many bytes or characters.


  function validChunk(stream, state, chunk, cb) {
    var valid = true;
    var er = false; // Always throw error if a null is written
    // if we are not in object mode then throw
    // if it is not a buffer, string, or undefined.

    if (chunk === null) {
      er = new TypeError('May not write null values to stream');
    } else if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
      er = new TypeError('Invalid non-string/buffer chunk');
    }

    if (er) {
      stream.emit('error', er);
      nextTick(cb, er);
      valid = false;
    }

    return valid;
  }

  Writable.prototype.write = function (chunk, encoding, cb) {
    var state = this._writableState;
    var ret = false;

    if (typeof encoding === 'function') {
      cb = encoding;
      encoding = null;
    }

    if (Buffer.isBuffer(chunk)) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;
    if (typeof cb !== 'function') cb = nop;
    if (state.ended) writeAfterEnd(this, cb);else if (validChunk(this, state, chunk, cb)) {
      state.pendingcb++;
      ret = writeOrBuffer(this, state, chunk, encoding, cb);
    }
    return ret;
  };

  Writable.prototype.cork = function () {
    var state = this._writableState;
    state.corked++;
  };

  Writable.prototype.uncork = function () {
    var state = this._writableState;

    if (state.corked) {
      state.corked--;
      if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
    }
  };

  Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
    // node::ParseEncoding() requires lower case.
    if (typeof encoding === 'string') encoding = encoding.toLowerCase();
    if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
    this._writableState.defaultEncoding = encoding;
    return this;
  };

  function decodeChunk(state, chunk, encoding) {
    if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
      chunk = Buffer.from(chunk, encoding);
    }

    return chunk;
  } // if we're already writing something, then just put this
  // in the queue, and wait our turn.  Otherwise, call _write
  // If we return false, then we need a drain event, so set that flag.


  function writeOrBuffer(stream, state, chunk, encoding, cb) {
    chunk = decodeChunk(state, chunk, encoding);
    if (Buffer.isBuffer(chunk)) encoding = 'buffer';
    var len = state.objectMode ? 1 : chunk.length;
    state.length += len;
    var ret = state.length < state.highWaterMark; // we must ensure that previous needDrain will not be reset to false.

    if (!ret) state.needDrain = true;

    if (state.writing || state.corked) {
      var last = state.lastBufferedRequest;
      state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);

      if (last) {
        last.next = state.lastBufferedRequest;
      } else {
        state.bufferedRequest = state.lastBufferedRequest;
      }

      state.bufferedRequestCount += 1;
    } else {
      doWrite(stream, state, false, len, chunk, encoding, cb);
    }

    return ret;
  }

  function doWrite(stream, state, writev, len, chunk, encoding, cb) {
    state.writelen = len;
    state.writecb = cb;
    state.writing = true;
    state.sync = true;
    if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
    state.sync = false;
  }

  function onwriteError(stream, state, sync, er, cb) {
    --state.pendingcb;
    if (sync) nextTick(cb, er);else cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  }

  function onwriteStateUpdate(state) {
    state.writing = false;
    state.writecb = null;
    state.length -= state.writelen;
    state.writelen = 0;
  }

  function onwrite(stream, er) {
    var state = stream._writableState;
    var sync = state.sync;
    var cb = state.writecb;
    onwriteStateUpdate(state);
    if (er) onwriteError(stream, state, sync, er, cb);else {
      // Check if we're actually ready to finish, but don't emit yet
      var finished = needFinish(state);

      if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
        clearBuffer(stream, state);
      }

      if (sync) {
        /*<replacement>*/
        nextTick(afterWrite, stream, state, finished, cb);
        /*</replacement>*/
      } else {
        afterWrite(stream, state, finished, cb);
      }
    }
  }

  function afterWrite(stream, state, finished, cb) {
    if (!finished) onwriteDrain(stream, state);
    state.pendingcb--;
    cb();
    finishMaybe(stream, state);
  } // Must force callback to be called on nextTick, so that we don't
  // emit 'drain' before the write() consumer gets the 'false' return
  // value, and has a chance to attach a 'drain' listener.


  function onwriteDrain(stream, state) {
    if (state.length === 0 && state.needDrain) {
      state.needDrain = false;
      stream.emit('drain');
    }
  } // if there's something in the buffer waiting, then process it


  function clearBuffer(stream, state) {
    state.bufferProcessing = true;
    var entry = state.bufferedRequest;

    if (stream._writev && entry && entry.next) {
      // Fast case, write everything using _writev()
      var l = state.bufferedRequestCount;
      var buffer = new Array(l);
      var holder = state.corkedRequestsFree;
      holder.entry = entry;
      var count = 0;

      while (entry) {
        buffer[count] = entry;
        entry = entry.next;
        count += 1;
      }

      doWrite(stream, state, true, state.length, buffer, '', holder.finish); // doWrite is almost always async, defer these to save a bit of time
      // as the hot path ends with doWrite

      state.pendingcb++;
      state.lastBufferedRequest = null;

      if (holder.next) {
        state.corkedRequestsFree = holder.next;
        holder.next = null;
      } else {
        state.corkedRequestsFree = new CorkedRequest(state);
      }
    } else {
      // Slow case, write chunks one-by-one
      while (entry) {
        var chunk = entry.chunk;
        var encoding = entry.encoding;
        var cb = entry.callback;
        var len = state.objectMode ? 1 : chunk.length;
        doWrite(stream, state, false, len, chunk, encoding, cb);
        entry = entry.next; // if we didn't call the onwrite immediately, then
        // it means that we need to wait until it does.
        // also, that means that the chunk and cb are currently
        // being processed, so move the buffer counter past them.

        if (state.writing) {
          break;
        }
      }

      if (entry === null) state.lastBufferedRequest = null;
    }

    state.bufferedRequestCount = 0;
    state.bufferedRequest = entry;
    state.bufferProcessing = false;
  }

  Writable.prototype._write = function (chunk, encoding, cb) {
    cb(new Error('not implemented'));
  };

  Writable.prototype._writev = null;

  Writable.prototype.end = function (chunk, encoding, cb) {
    var state = this._writableState;

    if (typeof chunk === 'function') {
      cb = chunk;
      chunk = null;
      encoding = null;
    } else if (typeof encoding === 'function') {
      cb = encoding;
      encoding = null;
    }

    if (chunk !== null && chunk !== undefined) this.write(chunk, encoding); // .end() fully uncorks

    if (state.corked) {
      state.corked = 1;
      this.uncork();
    } // ignore unnecessary end() calls.


    if (!state.ending && !state.finished) endWritable(this, state, cb);
  };

  function needFinish(state) {
    return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
  }

  function prefinish(stream, state) {
    if (!state.prefinished) {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }

  function finishMaybe(stream, state) {
    var need = needFinish(state);

    if (need) {
      if (state.pendingcb === 0) {
        prefinish(stream, state);
        state.finished = true;
        stream.emit('finish');
      } else {
        prefinish(stream, state);
      }
    }

    return need;
  }

  function endWritable(stream, state, cb) {
    state.ending = true;
    finishMaybe(stream, state);

    if (cb) {
      if (state.finished) nextTick(cb);else stream.once('finish', cb);
    }

    state.ended = true;
    stream.writable = false;
  } // It seems a linked list but it is not
  // there will be only 2 of these for each stream


  function CorkedRequest(state) {
    var _this = this;

    this.next = null;
    this.entry = null;

    this.finish = function (err) {
      var entry = _this.entry;
      _this.entry = null;

      while (entry) {
        var cb = entry.callback;
        state.pendingcb--;
        cb(err);
        entry = entry.next;
      }

      if (state.corkedRequestsFree) {
        state.corkedRequestsFree.next = _this;
      } else {
        state.corkedRequestsFree = _this;
      }
    };
  }

  inherits$1(Duplex, Readable);
  var keys = Object.keys(Writable.prototype);

  for (var v$1 = 0; v$1 < keys.length; v$1++) {
    var method = keys[v$1];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
  function Duplex(options) {
    if (!(this instanceof Duplex)) return new Duplex(options);
    Readable.call(this, options);
    Writable.call(this, options);
    if (options && options.readable === false) this.readable = false;
    if (options && options.writable === false) this.writable = false;
    this.allowHalfOpen = true;
    if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;
    this.once('end', onend);
  } // the no-half-open enforcer

  function onend() {
    // if we allow half-open state, or if the writable side ended,
    // then we're ok.
    if (this.allowHalfOpen || this._writableState.ended) return; // no more data can be written.
    // But allow more writes to happen in this tick.

    nextTick(onEndNT, this);
  }

  function onEndNT(self) {
    self.end();
  }

  // a transform stream is a readable/writable stream where you do
  inherits$1(Transform, Duplex);

  function TransformState(stream) {
    this.afterTransform = function (er, data) {
      return afterTransform(stream, er, data);
    };

    this.needTransform = false;
    this.transforming = false;
    this.writecb = null;
    this.writechunk = null;
    this.writeencoding = null;
  }

  function afterTransform(stream, er, data) {
    var ts = stream._transformState;
    ts.transforming = false;
    var cb = ts.writecb;
    if (!cb) return stream.emit('error', new Error('no writecb in Transform class'));
    ts.writechunk = null;
    ts.writecb = null;
    if (data !== null && data !== undefined) stream.push(data);
    cb(er);
    var rs = stream._readableState;
    rs.reading = false;

    if (rs.needReadable || rs.length < rs.highWaterMark) {
      stream._read(rs.highWaterMark);
    }
  }
  function Transform(options) {
    if (!(this instanceof Transform)) return new Transform(options);
    Duplex.call(this, options);
    this._transformState = new TransformState(this); // when the writable side finishes, then flush out anything remaining.

    var stream = this; // start out asking for a readable event once data is transformed.

    this._readableState.needReadable = true; // we have implemented the _read method, and done the other things
    // that Readable wants before the first _read call, so unset the
    // sync guard flag.

    this._readableState.sync = false;

    if (options) {
      if (typeof options.transform === 'function') this._transform = options.transform;
      if (typeof options.flush === 'function') this._flush = options.flush;
    }

    this.once('prefinish', function () {
      if (typeof this._flush === 'function') this._flush(function (er) {
        done(stream, er);
      });else done(stream);
    });
  }

  Transform.prototype.push = function (chunk, encoding) {
    this._transformState.needTransform = false;
    return Duplex.prototype.push.call(this, chunk, encoding);
  }; // This is the part where you do stuff!
  // override this function in implementation classes.
  // 'chunk' is an input chunk.
  //
  // Call `push(newChunk)` to pass along transformed output
  // to the readable side.  You may call 'push' zero or more times.
  //
  // Call `cb(err)` when you are done with this chunk.  If you pass
  // an error, then that'll put the hurt on the whole operation.  If you
  // never call cb(), then you'll never get another chunk.


  Transform.prototype._transform = function (chunk, encoding, cb) {
    throw new Error('Not implemented');
  };

  Transform.prototype._write = function (chunk, encoding, cb) {
    var ts = this._transformState;
    ts.writecb = cb;
    ts.writechunk = chunk;
    ts.writeencoding = encoding;

    if (!ts.transforming) {
      var rs = this._readableState;
      if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
    }
  }; // Doesn't matter what the args are here.
  // _transform does all the work.
  // That we got here means that the readable side wants more data.


  Transform.prototype._read = function (n) {
    var ts = this._transformState;

    if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
      ts.transforming = true;

      this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
    } else {
      // mark that we need a transform, so that any data that comes in
      // will get processed, now that we've asked for it.
      ts.needTransform = true;
    }
  };

  function done(stream, er) {
    if (er) return stream.emit('error', er); // if there's nothing in the write buffer, then that means
    // that nothing more will ever be provided

    var ws = stream._writableState;
    var ts = stream._transformState;
    if (ws.length) throw new Error('Calling transform done when ws.length != 0');
    if (ts.transforming) throw new Error('Calling transform done when still transforming');
    return stream.push(null);
  }

  inherits$1(PassThrough, Transform);
  function PassThrough(options) {
    if (!(this instanceof PassThrough)) return new PassThrough(options);
    Transform.call(this, options);
  }

  PassThrough.prototype._transform = function (chunk, encoding, cb) {
    cb(null, chunk);
  };

  inherits$1(Stream, EventEmitter);
  Stream.Readable = Readable;
  Stream.Writable = Writable;
  Stream.Duplex = Duplex;
  Stream.Transform = Transform;
  Stream.PassThrough = PassThrough; // Backwards-compat with node 0.4.x

  Stream.Stream = Stream;
  // part of this class) is overridden in the Readable class.

  function Stream() {
    EventEmitter.call(this);
  }

  Stream.prototype.pipe = function (dest, options) {
    var source = this;

    function ondata(chunk) {
      if (dest.writable) {
        if (false === dest.write(chunk) && source.pause) {
          source.pause();
        }
      }
    }

    source.on('data', ondata);

    function ondrain() {
      if (source.readable && source.resume) {
        source.resume();
      }
    }

    dest.on('drain', ondrain); // If the 'end' option is not supplied, dest.end() will be called when
    // source gets the 'end' or 'close' events.  Only dest.end() once.

    if (!dest._isStdio && (!options || options.end !== false)) {
      source.on('end', onend);
      source.on('close', onclose);
    }

    var didOnEnd = false;

    function onend() {
      if (didOnEnd) return;
      didOnEnd = true;
      dest.end();
    }

    function onclose() {
      if (didOnEnd) return;
      didOnEnd = true;
      if (typeof dest.destroy === 'function') dest.destroy();
    } // don't leave dangling pipes when there are errors.


    function onerror(er) {
      cleanup();

      if (EventEmitter.listenerCount(this, 'error') === 0) {
        throw er; // Unhandled stream error in pipe.
      }
    }

    source.on('error', onerror);
    dest.on('error', onerror); // remove all the event listeners that were added.

    function cleanup() {
      source.removeListener('data', ondata);
      dest.removeListener('drain', ondrain);
      source.removeListener('end', onend);
      source.removeListener('close', onclose);
      source.removeListener('error', onerror);
      dest.removeListener('error', onerror);
      source.removeListener('end', cleanup);
      source.removeListener('close', cleanup);
      dest.removeListener('close', cleanup);
    }

    source.on('end', cleanup);
    source.on('close', cleanup);
    dest.on('close', cleanup);
    dest.emit('pipe', source); // Allow for unix-like usage: A.pipe(B).pipe(C)

    return dest;
  };

  var simplePeer = Peer;
  var debug$2 = browser$1('simple-peer');
  var MAX_BUFFERED_AMOUNT = 64 * 1024;
  var ICECOMPLETE_TIMEOUT = 5 * 1000;
  var CHANNEL_CLOSING_TIMEOUT = 5 * 1000;
  inherits_browser(Peer, Stream.Duplex);
  /**
   * WebRTC peer connection. Same API as node core `net.Socket`, plus a few extra methods.
   * Duplex stream.
   * @param {Object} opts
   */

  function Peer(opts) {
    var self = this;
    if (!(self instanceof Peer)) return new Peer(opts);
    self._id = browser$3(4).toString('hex').slice(0, 7);

    self._debug('new peer %o', opts);

    opts = Object.assign({
      allowHalfOpen: false
    }, opts);
    Stream.Duplex.call(self, opts);
    self.channelName = opts.initiator ? opts.channelName || browser$3(20).toString('hex') : null; // Needed by _transformConstraints, so set this early

    self._isChromium = typeof window !== 'undefined' && !!window.webkitRTCPeerConnection;
    self.initiator = opts.initiator || false;
    self.channelConfig = opts.channelConfig || Peer.channelConfig;
    self.config = Object.assign({}, Peer.config, opts.config);
    self.constraints = self._transformConstraints(opts.constraints || Peer.constraints);
    self.offerConstraints = self._transformConstraints(opts.offerConstraints || {});
    self.answerConstraints = self._transformConstraints(opts.answerConstraints || {});

    self.sdpTransform = opts.sdpTransform || function (sdp) {
      return sdp;
    };

    self.streams = opts.streams || (opts.stream ? [opts.stream] : []); // support old "stream" option

    self.trickle = opts.trickle !== undefined ? opts.trickle : true;
    self.allowHalfTrickle = opts.allowHalfTrickle !== undefined ? opts.allowHalfTrickle : false;
    self.iceCompleteTimeout = opts.iceCompleteTimeout || ICECOMPLETE_TIMEOUT;
    self.destroyed = false;
    self.connected = false;
    self.remoteAddress = undefined;
    self.remoteFamily = undefined;
    self.remotePort = undefined;
    self.localAddress = undefined;
    self.localPort = undefined;
    self._wrtc = opts.wrtc && typeof opts.wrtc === 'object' ? opts.wrtc : getBrowserRtc$1();

    if (!self._wrtc) {
      if (typeof window === 'undefined') {
        throw makeError$1('No WebRTC support: Specify `opts.wrtc` option in this environment', 'ERR_WEBRTC_SUPPORT');
      } else {
        throw makeError$1('No WebRTC support: Not a supported browser', 'ERR_WEBRTC_SUPPORT');
      }
    }

    self._pcReady = false;
    self._channelReady = false;
    self._iceComplete = false; // ice candidate trickle done (got null candidate)

    self._iceCompleteTimer = null; // send an offer/answer anyway after some timeout

    self._channel = null;
    self._pendingCandidates = [];
    self._isNegotiating = !self.initiator; // is this peer waiting for negotiation to complete?

    self._batchedNegotiation = false; // batch synchronous negotiations

    self._queuedNegotiation = false; // is there a queued negotiation request?

    self._sendersAwaitingStable = [];
    self._senderMap = new Map();
    self._firstStable = true;
    self._closingInterval = null;
    self._remoteTracks = [];
    self._remoteStreams = [];
    self._chunk = null;
    self._cb = null;
    self._interval = null;
    self._pc = new self._wrtc.RTCPeerConnection(self.config, self.constraints);

    if (self._isChromium || self._wrtc && self._wrtc.electronDaemon) {
      // HACK: Electron and Chromium need a promise shim
      shimPromiseAPI(self._wrtc.RTCPeerConnection, self._pc);
    } // We prefer feature detection whenever possible, but sometimes that's not
    // possible for certain implementations.


    self._isReactNativeWebrtc = typeof self._pc._peerConnectionId === 'number';

    self._pc.oniceconnectionstatechange = function () {
      self._onIceStateChange();
    };

    self._pc.onicegatheringstatechange = function () {
      self._onIceStateChange();
    };

    self._pc.onsignalingstatechange = function () {
      self._onSignalingStateChange();
    };

    self._pc.onicecandidate = function (event) {
      self._onIceCandidate(event);
    }; // Other spec events, unused by this implementation:
    // - onconnectionstatechange
    // - onicecandidateerror
    // - onfingerprintfailure
    // - onnegotiationneeded


    if (self.initiator) {
      self._setupData({
        channel: self._pc.createDataChannel(self.channelName, self.channelConfig)
      });
    } else {
      self._pc.ondatachannel = function (event) {
        self._setupData(event);
      };
    }

    if ('addTrack' in self._pc) {
      if (self.streams) {
        self.streams.forEach(function (stream) {
          self.addStream(stream);
        });
      }

      self._pc.ontrack = function (event) {
        self._onTrack(event);
      };
    }

    if (self.initiator) {
      self._needsNegotiation();
    }

    self._onFinishBound = function () {
      self._onFinish();
    };

    self.once('finish', self._onFinishBound);
  }

  Peer.WEBRTC_SUPPORT = !!getBrowserRtc$1();
  /**
   * Expose config, constraints, and data channel config for overriding all Peer
   * instances. Otherwise, just set opts.config, opts.constraints, or opts.channelConfig
   * when constructing a Peer.
   */

  Peer.config = {
    iceServers: [{
      urls: 'stun:stun.l.google.com:19302'
    }, {
      urls: 'stun:global.stun.twilio.com:3478?transport=udp'
    }]
  };
  Peer.constraints = {};
  Peer.channelConfig = {};
  Object.defineProperty(Peer.prototype, 'bufferSize', {
    get: function () {
      var self = this;
      return self._channel && self._channel.bufferedAmount || 0;
    }
  });

  Peer.prototype.address = function () {
    var self = this;
    return {
      port: self.localPort,
      family: 'IPv4',
      address: self.localAddress
    };
  };

  Peer.prototype.signal = function (data) {
    var self = this;
    if (self.destroyed) throw makeError$1('cannot signal after peer is destroyed', 'ERR_SIGNALING');

    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (err) {
        data = {};
      }
    }

    self._debug('signal()');

    if (data.renegotiate && self.initiator) {
      self._debug('got request to renegotiate');

      self._needsNegotiation();
    }

    if (data.candidate) {
      if (self._pc.remoteDescription && self._pc.remoteDescription.type) self._addIceCandidate(data.candidate);else self._pendingCandidates.push(data.candidate);
    }

    if (data.sdp) {
      self._pc.setRemoteDescription(new self._wrtc.RTCSessionDescription(data)).then(function () {
        if (self.destroyed) return;

        self._pendingCandidates.forEach(function (candidate) {
          self._addIceCandidate(candidate);
        });

        self._pendingCandidates = [];
        if (self._pc.remoteDescription.type === 'offer') self._createAnswer();
      }).catch(function (err) {
        self.destroy(makeError$1(err, 'ERR_SET_REMOTE_DESCRIPTION'));
      });
    }

    if (!data.sdp && !data.candidate && !data.renegotiate) {
      self.destroy(makeError$1('signal() called with invalid signal data', 'ERR_SIGNALING'));
    }
  };

  Peer.prototype._addIceCandidate = function (candidate) {
    var self = this;

    try {
      self._pc.addIceCandidate(new self._wrtc.RTCIceCandidate(candidate), noop$1, function (err) {
        self.destroy(makeError$1(err, 'ERR_ADD_ICE_CANDIDATE'));
      });
    } catch (err) {
      self.destroy(makeError$1('error adding candidate: ' + err.message, 'ERR_ADD_ICE_CANDIDATE'));
    }
  };
  /**
   * Send text/binary data to the remote peer.
   * @param {ArrayBufferView|ArrayBuffer|Buffer|string|Blob} chunk
   */


  Peer.prototype.send = function (chunk) {
    var self = this;

    self._channel.send(chunk);
  };
  /**
   * Add a MediaStream to the connection.
   * @param {MediaStream} stream
   */


  Peer.prototype.addStream = function (stream) {
    var self = this;

    self._debug('addStream()');

    stream.getTracks().forEach(function (track) {
      self.addTrack(track, stream);
    });
  };
  /**
   * Add a MediaStreamTrack to the connection.
   * @param {MediaStreamTrack} track
   * @param {MediaStream} stream
   */


  Peer.prototype.addTrack = function (track, stream) {
    var self = this;

    self._debug('addTrack()');

    var sender = self._pc.addTrack(track, stream);

    var submap = self._senderMap.get(track) || new Map(); // nested Maps map [track, stream] to sender

    submap.set(stream, sender);

    self._senderMap.set(track, submap);

    self._needsNegotiation();
  };
  /**
   * Replace a MediaStreamTrack by another in the connection.
   * @param {MediaStreamTrack} oldTrack
   * @param {MediaStreamTrack} newTrack
   * @param {MediaStream} stream
   */


  Peer.prototype.replaceTrack =
  /*#__PURE__*/
  function () {
    var _ref = asyncToGenerator(
    /*#__PURE__*/
    regenerator$1.mark(function _callee(oldTrack, newTrack, stream) {
      var self, submap, sender;
      return regenerator$1.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              self = this;

              self._debug('replaceTrack()');

              submap = self._senderMap.get(oldTrack);
              sender = submap ? submap.get(stream) : null;

              if (!sender) {
                self.destroy(new Error('Cannot replace track that was never added.'));
              }

              if (newTrack) self._senderMap.set(newTrack, submap);

              if (!(sender.replaceTrack != null)) {
                _context.next = 11;
                break;
              }

              _context.next = 9;
              return sender.replaceTrack(newTrack);

            case 9:
              _context.next = 12;
              break;

            case 11:
              self.destroy(makeError$1('replaceTrack is not supported in this browser', 'ERR_UNSUPPORTED_REPLACETRACK'));

            case 12:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this);
    }));

    return function (_x, _x2, _x3) {
      return _ref.apply(this, arguments);
    };
  }();
  /**
   * Remove a MediaStreamTrack from the connection.
   * @param {MediaStreamTrack} track
   * @param {MediaStream} stream
   */


  Peer.prototype.removeTrack = function (track, stream) {
    var self = this;

    self._debug('removeSender()');

    var submap = self._senderMap.get(track);

    var sender = submap ? submap.get(stream) : null;

    if (!sender) {
      self.destroy(new Error('Cannot remove track that was never added.'));
    }

    try {
      self._pc.removeTrack(sender);
    } catch (err) {
      if (err.name === 'NS_ERROR_UNEXPECTED') {
        self._sendersAwaitingStable.push(sender); // HACK: Firefox must wait until (signalingState === stable) https://bugzilla.mozilla.org/show_bug.cgi?id=1133874

      } else {
        self.destroy(err);
      }
    }
  };
  /**
   * Remove a MediaStream from the connection.
   * @param {MediaStream} stream
   */


  Peer.prototype.removeStream = function (stream) {
    var self = this;

    self._debug('removeSenders()');

    stream.getTracks().forEach(function (track) {
      self.removeTrack(track, stream);
    });
  };

  Peer.prototype._needsNegotiation = function () {
    var self = this;

    self._debug('_needsNegotiation');

    if (self._batchedNegotiation) return; // batch synchronous renegotiations

    self._batchedNegotiation = true;
    setTimeout(function () {
      self._batchedNegotiation = false;

      self._debug('starting batched negotiation');

      self.negotiate();
    }, 0);
  };

  Peer.prototype.negotiate = function () {
    var self = this;

    if (self.initiator) {
      if (self._isNegotiating) {
        self._queuedNegotiation = true;

        self._debug('already negotiating, queueing');
      } else {
        self._debug('start negotiation');

        self._createOffer();
      }
    } else {
      if (!self._isNegotiating) {
        self._debug('requesting negotiation from initiator');

        self.emit('signal', {
          // request initiator to renegotiate
          renegotiate: true
        });
      }
    }

    self._isNegotiating = true;
  }; // TODO: Delete this method once readable-stream is updated to contain a default
  // implementation of destroy() that automatically calls _destroy()
  // See: https://github.com/nodejs/readable-stream/issues/283


  Peer.prototype.destroy = function (err) {
    var self = this;

    self._destroy(err, function () {});
  };

  Peer.prototype._destroy = function (err, cb) {
    var self = this;
    if (self.destroyed) return;

    self._debug('destroy (error: %s)', err && (err.message || err));

    self.readable = self.writable = false;
    if (!self._readableState.ended) self.push(null);
    if (!self._writableState.finished) self.end();
    self.destroyed = true;
    self.connected = false;
    self._pcReady = false;
    self._channelReady = false;
    self._remoteTracks = null;
    self._remoteStreams = null;
    self._senderMap = null;
    clearInterval(self._closingInterval);
    self._closingInterval = null;
    clearInterval(self._interval);
    self._interval = null;
    self._chunk = null;
    self._cb = null;
    if (self._onFinishBound) self.removeListener('finish', self._onFinishBound);
    self._onFinishBound = null;

    if (self._channel) {
      try {
        self._channel.close();
      } catch (err) {}

      self._channel.onmessage = null;
      self._channel.onopen = null;
      self._channel.onclose = null;
      self._channel.onerror = null;
    }

    if (self._pc) {
      try {
        self._pc.close();
      } catch (err) {}

      self._pc.oniceconnectionstatechange = null;
      self._pc.onicegatheringstatechange = null;
      self._pc.onsignalingstatechange = null;
      self._pc.onicecandidate = null;

      if ('addTrack' in self._pc) {
        self._pc.ontrack = null;
      }

      self._pc.ondatachannel = null;
    }

    self._pc = null;
    self._channel = null;
    if (err) self.emit('error', err);
    self.emit('close');
    cb();
  };

  Peer.prototype._setupData = function (event) {
    var self = this;

    if (!event.channel) {
      // In some situations `pc.createDataChannel()` returns `undefined` (in wrtc),
      // which is invalid behavior. Handle it gracefully.
      // See: https://github.com/feross/simple-peer/issues/163
      return self.destroy(makeError$1('Data channel event is missing `channel` property', 'ERR_DATA_CHANNEL'));
    }

    self._channel = event.channel;
    self._channel.binaryType = 'arraybuffer';

    if (typeof self._channel.bufferedAmountLowThreshold === 'number') {
      self._channel.bufferedAmountLowThreshold = MAX_BUFFERED_AMOUNT;
    }

    self.channelName = self._channel.label;

    self._channel.onmessage = function (event) {
      self._onChannelMessage(event);
    };

    self._channel.onbufferedamountlow = function () {
      self._onChannelBufferedAmountLow();
    };

    self._channel.onopen = function () {
      self._onChannelOpen();
    };

    self._channel.onclose = function () {
      self._onChannelClose();
    };

    self._channel.onerror = function (err) {
      self.destroy(makeError$1(err, 'ERR_DATA_CHANNEL'));
    }; // HACK: Chrome will sometimes get stuck in readyState "closing", let's check for this condition
    // https://bugs.chromium.org/p/chromium/issues/detail?id=882743


    var isClosing = false;
    self._closingInterval = setInterval(function () {
      // No "onclosing" event
      if (self._channel && self._channel.readyState === 'closing') {
        if (isClosing) self._onChannelClose(); // closing timed out: equivalent to onclose firing

        isClosing = true;
      } else {
        isClosing = false;
      }
    }, CHANNEL_CLOSING_TIMEOUT);
  };

  Peer.prototype._read = function () {};

  Peer.prototype._write = function (chunk, encoding, cb) {
    var self = this;
    if (self.destroyed) return cb(makeError$1('cannot write after peer is destroyed', 'ERR_DATA_CHANNEL'));

    if (self.connected) {
      try {
        self.send(chunk);
      } catch (err) {
        return self.destroy(makeError$1(err, 'ERR_DATA_CHANNEL'));
      }

      if (self._channel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
        self._debug('start backpressure: bufferedAmount %d', self._channel.bufferedAmount);

        self._cb = cb;
      } else {
        cb(null);
      }
    } else {
      self._debug('write before connect');

      self._chunk = chunk;
      self._cb = cb;
    }
  }; // When stream finishes writing, close socket. Half open connections are not
  // supported.


  Peer.prototype._onFinish = function () {
    var self = this;
    if (self.destroyed) return;

    if (self.connected) {
      destroySoon();
    } else {
      self.once('connect', destroySoon);
    } // Wait a bit before destroying so the socket flushes.
    // TODO: is there a more reliable way to accomplish this?


    function destroySoon() {
      setTimeout(function () {
        self.destroy();
      }, 1000);
    }
  };

  Peer.prototype._startIceCompleteTimeout = function () {
    debug$2('started iceComplete timeout');
    var self = this;
    if (self.destroyed) return;
    if (self._iceCompleteTimer) return;
    self._iceCompleteTimer = setTimeout(function () {
      if (!self._iceComplete) {
        self._iceComplete = true;
        self.emit('iceTimeout');
        self.emit('_iceComplete');
      }
    }, this.iceCompleteTimeout);
  };

  Peer.prototype._createOffer = function () {
    var self = this;
    if (self.destroyed) return;

    self._pc.createOffer(self.offerConstraints).then(function (offer) {
      if (self.destroyed) return;
      if (!self.trickle && !self.allowHalfTrickle) offer.sdp = filterTrickle(offer.sdp);
      offer.sdp = self.sdpTransform(offer.sdp);

      self._pc.setLocalDescription(offer).then(onSuccess).catch(onError);

      function onSuccess() {
        self._debug('createOffer success');

        if (self.destroyed) return;
        if (self.trickle || self._iceComplete) sendOffer();else self.once('_iceComplete', sendOffer); // wait for candidates
      }

      function onError(err) {
        self.destroy(makeError$1(err, 'ERR_SET_LOCAL_DESCRIPTION'));
      }

      function sendOffer() {
        if (self.destroyed) return;
        var signal = self._pc.localDescription || offer;

        self._debug('signal');

        self.emit('signal', {
          type: signal.type,
          sdp: signal.sdp
        });
      }
    }).catch(function (err) {
      self.destroy(makeError$1(err, 'ERR_CREATE_OFFER'));
    });
  };

  Peer.prototype._createAnswer = function () {
    var self = this;
    if (self.destroyed) return;

    self._pc.createAnswer(self.answerConstraints).then(function (answer) {
      if (self.destroyed) return;
      if (!self.trickle && !self.allowHalfTrickle) answer.sdp = filterTrickle(answer.sdp);
      answer.sdp = self.sdpTransform(answer.sdp);

      self._pc.setLocalDescription(answer).then(onSuccess).catch(onError);

      function onSuccess() {
        if (self.destroyed) return;
        if (self.trickle || self._iceComplete) sendAnswer();else self.once('_iceComplete', sendAnswer);
      }

      function onError(err) {
        self.destroy(makeError$1(err, 'ERR_SET_LOCAL_DESCRIPTION'));
      }

      function sendAnswer() {
        if (self.destroyed) return;
        var signal = self._pc.localDescription || answer;

        self._debug('signal');

        self.emit('signal', {
          type: signal.type,
          sdp: signal.sdp
        });
      }
    }).catch(function (err) {
      self.destroy(makeError$1(err, 'ERR_CREATE_ANSWER'));
    });
  };

  Peer.prototype._onIceStateChange = function () {
    var self = this;
    if (self.destroyed) return;
    var iceConnectionState = self._pc.iceConnectionState;
    var iceGatheringState = self._pc.iceGatheringState;

    self._debug('iceStateChange (connection: %s) (gathering: %s)', iceConnectionState, iceGatheringState);

    self.emit('iceStateChange', iceConnectionState, iceGatheringState);

    if (iceConnectionState === 'connected' || iceConnectionState === 'completed') {
      self._pcReady = true;

      self._maybeReady();
    }

    if (iceConnectionState === 'failed') {
      self.destroy(makeError$1('Ice connection failed.', 'ERR_ICE_CONNECTION_FAILURE'));
    }

    if (iceConnectionState === 'closed') {
      self.destroy(new Error('Ice connection closed.'));
    }
  };

  Peer.prototype.getStats = function (cb) {
    var self = this; // Promise-based getStats() (standard)

    if (self._pc.getStats.length === 0) {
      self._pc.getStats().then(function (res) {
        var reports = [];
        res.forEach(function (report) {
          reports.push(report);
        });
        cb(null, reports);
      }, function (err) {
        cb(err);
      }); // Two-parameter callback-based getStats() (deprecated, former standard)

    } else if (self._isReactNativeWebrtc) {
      self._pc.getStats(null, function (res) {
        var reports = [];
        res.forEach(function (report) {
          reports.push(report);
        });
        cb(null, reports);
      }, function (err) {
        cb(err);
      }); // Single-parameter callback-based getStats() (non-standard)

    } else if (self._pc.getStats.length > 0) {
      self._pc.getStats(function (res) {
        // If we destroy connection in `connect` callback this code might happen to run when actual connection is already closed
        if (self.destroyed) return;
        var reports = [];
        res.result().forEach(function (result) {
          var report = {};
          result.names().forEach(function (name) {
            report[name] = result.stat(name);
          });
          report.id = result.id;
          report.type = result.type;
          report.timestamp = result.timestamp;
          reports.push(report);
        });
        cb(null, reports);
      }, function (err) {
        cb(err);
      }); // Unknown browser, skip getStats() since it's anyone's guess which style of
      // getStats() they implement.

    } else {
      cb(null, []);
    }
  };

  Peer.prototype._maybeReady = function () {
    var self = this;

    self._debug('maybeReady pc %s channel %s', self._pcReady, self._channelReady);

    if (self.connected || self._connecting || !self._pcReady || !self._channelReady) return;
    self._connecting = true; // HACK: We can't rely on order here, for details see https://github.com/js-platform/node-webrtc/issues/339

    function findCandidatePair() {
      if (self.destroyed) return;
      self.getStats(function (err, items) {
        if (self.destroyed) return; // Treat getStats error as non-fatal. It's not essential.

        if (err) items = [];
        var remoteCandidates = {};
        var localCandidates = {};
        var candidatePairs = {};
        var foundSelectedCandidatePair = false;
        items.forEach(function (item) {
          // TODO: Once all browsers support the hyphenated stats report types, remove
          // the non-hypenated ones
          if (item.type === 'remotecandidate' || item.type === 'remote-candidate') {
            remoteCandidates[item.id] = item;
          }

          if (item.type === 'localcandidate' || item.type === 'local-candidate') {
            localCandidates[item.id] = item;
          }

          if (item.type === 'candidatepair' || item.type === 'candidate-pair') {
            candidatePairs[item.id] = item;
          }
        });
        items.forEach(function (item) {
          // Spec-compliant
          if (item.type === 'transport' && item.selectedCandidatePairId) {
            setSelectedCandidatePair(candidatePairs[item.selectedCandidatePairId]);
          } // Old implementations


          if (item.type === 'googCandidatePair' && item.googActiveConnection === 'true' || (item.type === 'candidatepair' || item.type === 'candidate-pair') && item.selected) {
            setSelectedCandidatePair(item);
          }
        });

        function setSelectedCandidatePair(selectedCandidatePair) {
          foundSelectedCandidatePair = true;
          var local = localCandidates[selectedCandidatePair.localCandidateId];

          if (local && local.ip) {
            // Spec
            self.localAddress = local.ip;
            self.localPort = Number(local.port);
          } else if (local && local.ipAddress) {
            // Firefox
            self.localAddress = local.ipAddress;
            self.localPort = Number(local.portNumber);
          } else if (typeof selectedCandidatePair.googLocalAddress === 'string') {
            // TODO: remove this once Chrome 58 is released
            local = selectedCandidatePair.googLocalAddress.split(':');
            self.localAddress = local[0];
            self.localPort = Number(local[1]);
          }

          var remote = remoteCandidates[selectedCandidatePair.remoteCandidateId];

          if (remote && remote.ip) {
            // Spec
            self.remoteAddress = remote.ip;
            self.remotePort = Number(remote.port);
          } else if (remote && remote.ipAddress) {
            // Firefox
            self.remoteAddress = remote.ipAddress;
            self.remotePort = Number(remote.portNumber);
          } else if (typeof selectedCandidatePair.googRemoteAddress === 'string') {
            // TODO: remove this once Chrome 58 is released
            remote = selectedCandidatePair.googRemoteAddress.split(':');
            self.remoteAddress = remote[0];
            self.remotePort = Number(remote[1]);
          }

          self.remoteFamily = 'IPv4';

          self._debug('connect local: %s:%s remote: %s:%s', self.localAddress, self.localPort, self.remoteAddress, self.remotePort);
        } // Ignore candidate pair selection in browsers like Safari 11 that do not have any local or remote candidates
        // But wait until at least 1 candidate pair is available


        if (!foundSelectedCandidatePair && (!Object.keys(candidatePairs).length || Object.keys(localCandidates).length)) {
          setTimeout(findCandidatePair, 100);
          return;
        } else {
          self._connecting = false;
          self.connected = true;
        }

        if (self._chunk) {
          try {
            self.send(self._chunk);
          } catch (err) {
            return self.destroy(makeError$1(err, 'ERR_DATA_CHANNEL'));
          }

          self._chunk = null;

          self._debug('sent chunk from "write before connect"');

          var cb = self._cb;
          self._cb = null;
          cb(null);
        } // If `bufferedAmountLowThreshold` and 'onbufferedamountlow' are unsupported,
        // fallback to using setInterval to implement backpressure.


        if (typeof self._channel.bufferedAmountLowThreshold !== 'number') {
          self._interval = setInterval(function () {
            self._onInterval();
          }, 150);
          if (self._interval.unref) self._interval.unref();
        }

        self._debug('connect');

        self.emit('connect');
      });
    }

    findCandidatePair();
  };

  Peer.prototype._onInterval = function () {
    var self = this;

    if (!self._cb || !self._channel || self._channel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
      return;
    }

    self._onChannelBufferedAmountLow();
  };

  Peer.prototype._onSignalingStateChange = function () {
    var self = this;
    if (self.destroyed) return;

    if (self._pc.signalingState === 'stable' && !self._firstStable) {
      self._isNegotiating = false; // HACK: Firefox doesn't yet support removing tracks when signalingState !== 'stable'

      self._debug('flushing sender queue', self._sendersAwaitingStable);

      self._sendersAwaitingStable.forEach(function (sender) {
        self._pc.removeTrack(sender);

        self._queuedNegotiation = true;
      });

      self._sendersAwaitingStable = [];

      if (self._queuedNegotiation) {
        self._debug('flushing negotiation queue');

        self._queuedNegotiation = false;

        self._needsNegotiation(); // negotiate again

      }

      self._debug('negotiate');

      self.emit('negotiate');
    }

    self._firstStable = false;

    self._debug('signalingStateChange %s', self._pc.signalingState);

    self.emit('signalingStateChange', self._pc.signalingState);
  };

  Peer.prototype._onIceCandidate = function (event) {
    var self = this;
    if (self.destroyed) return;

    if (event.candidate && self.trickle) {
      self.emit('signal', {
        candidate: {
          candidate: event.candidate.candidate,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          sdpMid: event.candidate.sdpMid
        }
      });
    } else if (!event.candidate && !self._iceComplete) {
      self._iceComplete = true;
      self.emit('_iceComplete');
    } // as soon as we've received one valid candidate start timeout


    if (event.candidate) {
      self._startIceCompleteTimeout();
    }
  };

  Peer.prototype._onChannelMessage = function (event) {
    var self = this;
    if (self.destroyed) return;
    var data = event.data;
    if (data instanceof ArrayBuffer) data = Buffer.from(data);
    self.push(data);
  };

  Peer.prototype._onChannelBufferedAmountLow = function () {
    var self = this;
    if (self.destroyed || !self._cb) return;

    self._debug('ending backpressure: bufferedAmount %d', self._channel.bufferedAmount);

    var cb = self._cb;
    self._cb = null;
    cb(null);
  };

  Peer.prototype._onChannelOpen = function () {
    var self = this;
    if (self.connected || self.destroyed) return;

    self._debug('on channel open');

    self._channelReady = true;

    self._maybeReady();
  };

  Peer.prototype._onChannelClose = function () {
    var self = this;
    if (self.destroyed) return;

    self._debug('on channel close');

    self.destroy();
  };

  Peer.prototype._onTrack = function (event) {
    var self = this;
    if (self.destroyed) return;
    event.streams.forEach(function (eventStream) {
      self._debug('on track');

      self.emit('track', event.track, eventStream);

      self._remoteTracks.push({
        track: event.track,
        stream: eventStream
      });

      if (self._remoteStreams.some(function (remoteStream) {
        return remoteStream.id === eventStream.id;
      })) return; // Only fire one 'stream' event, even though there may be multiple tracks per stream

      self._remoteStreams.push(eventStream);

      setTimeout(function () {
        self.emit('stream', eventStream); // ensure all tracks have been added
      }, 0);
    });
  };

  Peer.prototype.setConstraints = function (constraints) {
    var self = this;

    if (self.initiator) {
      self.offerConstraints = self._transformConstraints(constraints);
    } else {
      self.answerConstraints = self._transformConstraints(constraints);
    }
  };

  Peer.prototype._debug = function () {
    var self = this;
    var args = [].slice.call(arguments);
    args[0] = '[' + self._id + '] ' + args[0];
    debug$2.apply(null, args);
  }; // Transform constraints objects into the new format (unless Chromium)
  // TODO: This can be removed when Chromium supports the new format


  Peer.prototype._transformConstraints = function (constraints) {
    var self = this;

    if (Object.keys(constraints).length === 0) {
      return constraints;
    }

    if ((constraints.mandatory || constraints.optional) && !self._isChromium) {
      // convert to new format
      // Merge mandatory and optional objects, prioritizing mandatory
      var newConstraints = Object.assign({}, constraints.optional, constraints.mandatory); // fix casing

      if (newConstraints.OfferToReceiveVideo !== undefined) {
        newConstraints.offerToReceiveVideo = newConstraints.OfferToReceiveVideo;
        delete newConstraints['OfferToReceiveVideo'];
      }

      if (newConstraints.OfferToReceiveAudio !== undefined) {
        newConstraints.offerToReceiveAudio = newConstraints.OfferToReceiveAudio;
        delete newConstraints['OfferToReceiveAudio'];
      }

      return newConstraints;
    } else if (!constraints.mandatory && !constraints.optional && self._isChromium) {
      // convert to old format
      // fix casing
      if (constraints.offerToReceiveVideo !== undefined) {
        constraints.OfferToReceiveVideo = constraints.offerToReceiveVideo;
        delete constraints['offerToReceiveVideo'];
      }

      if (constraints.offerToReceiveAudio !== undefined) {
        constraints.OfferToReceiveAudio = constraints.offerToReceiveAudio;
        delete constraints['offerToReceiveAudio'];
      }

      return {
        mandatory: constraints // NOTE: All constraints are upgraded to mandatory

      };
    }

    return constraints;
  }; // HACK: Minimal shim to force Chrome and WRTC to use their more reliable callback API


  function shimPromiseAPI(RTCPeerConnection, pc) {
    pc.createOffer = function (constraints) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        RTCPeerConnection.prototype.createOffer.call(_this, resolve, reject, constraints);
      });
    };

    pc.createAnswer = function (constraints) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        RTCPeerConnection.prototype.createAnswer.call(_this2, resolve, reject, constraints);
      });
    };

    pc.setLocalDescription = function (description) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        RTCPeerConnection.prototype.setLocalDescription.call(_this3, description, resolve, reject);
      });
    };

    pc.setRemoteDescription = function (description) {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        RTCPeerConnection.prototype.setRemoteDescription.call(_this4, description, resolve, reject);
      });
    };
  } // HACK: Filter trickle lines when trickle is disabled #354


  function filterTrickle(sdp) {
    return sdp.replace(/a=ice-options:trickle\s\n/g, '');
  }

  function makeError$1(message, code) {
    var err = new Error(message);
    err.code = code;
    return err;
  }

  function noop$1() {}

  function unique_pred(list, compare) {
    var ptr = 1,
        len = list.length,
        a = list[0],
        b = list[0];

    for (var i = 1; i < len; ++i) {
      b = a;
      a = list[i];

      if (compare(a, b)) {
        if (i === ptr) {
          ptr++;
          continue;
        }

        list[ptr++] = a;
      }
    }

    list.length = ptr;
    return list;
  }

  function unique_eq(list) {
    var ptr = 1,
        len = list.length,
        a = list[0],
        b = list[0];

    for (var i = 1; i < len; ++i, b = a) {
      b = a;
      a = list[i];

      if (a !== b) {
        if (i === ptr) {
          ptr++;
          continue;
        }

        list[ptr++] = a;
      }
    }

    list.length = ptr;
    return list;
  }

  function unique(list, compare, sorted) {
    if (list.length === 0) {
      return list;
    }

    if (compare) {
      if (!sorted) {
        list.sort(compare);
      }

      return unique_pred(list, compare);
    }

    if (!sorted) {
      list.sort();
    }

    return unique_eq(list);
  }

  var uniq = unique;

  /*! https://mths.be/punycode v1.4.1 by @mathias */

  /** Highest positive signed 32-bit float value */
  var maxInt = 2147483647; // aka. 0x7FFFFFFF or 2^31-1

  /** Bootstring parameters */

  var base = 36;
  var tMin = 1;
  var tMax = 26;
  var skew = 38;
  var damp = 700;
  var initialBias = 72;
  var initialN = 128; // 0x80

  var delimiter = '-'; // '\x2D'
  var regexNonASCII = /[^\x20-\x7E]/; // unprintable ASCII chars + non-ASCII chars

  var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g; // RFC 3490 separators

  /** Error messages */

  var errors = {
    'overflow': 'Overflow: input needs wider integers to process',
    'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
    'invalid-input': 'Invalid input'
  };
  /** Convenience shortcuts */

  var baseMinusTMin = base - tMin;
  var floor = Math.floor;
  var stringFromCharCode = String.fromCharCode;
  /*--------------------------------------------------------------------------*/

  /**
   * A generic error utility function.
   * @private
   * @param {String} type The error type.
   * @returns {Error} Throws a `RangeError` with the applicable error message.
   */

  function error(type) {
    throw new RangeError(errors[type]);
  }
  /**
   * A generic `Array#map` utility function.
   * @private
   * @param {Array} array The array to iterate over.
   * @param {Function} callback The function that gets called for every array
   * item.
   * @returns {Array} A new array of values returned by the callback function.
   */


  function map$1(array, fn) {
    var length = array.length;
    var result = [];

    while (length--) {
      result[length] = fn(array[length]);
    }

    return result;
  }
  /**
   * A simple `Array#map`-like wrapper to work with domain name strings or email
   * addresses.
   * @private
   * @param {String} domain The domain name or email address.
   * @param {Function} callback The function that gets called for every
   * character.
   * @returns {Array} A new string of characters returned by the callback
   * function.
   */


  function mapDomain(string, fn) {
    var parts = string.split('@');
    var result = '';

    if (parts.length > 1) {
      // In email addresses, only the domain name should be punycoded. Leave
      // the local part (i.e. everything up to `@`) intact.
      result = parts[0] + '@';
      string = parts[1];
    } // Avoid `split(regex)` for IE8 compatibility. See #17.


    string = string.replace(regexSeparators, '\x2E');
    var labels = string.split('.');
    var encoded = map$1(labels, fn).join('.');
    return result + encoded;
  }
  /**
   * Creates an array containing the numeric code points of each Unicode
   * character in the string. While JavaScript uses UCS-2 internally,
   * this function will convert a pair of surrogate halves (each of which
   * UCS-2 exposes as separate characters) into a single code point,
   * matching UTF-16.
   * @see `punycode.ucs2.encode`
   * @see <https://mathiasbynens.be/notes/javascript-encoding>
   * @memberOf punycode.ucs2
   * @name decode
   * @param {String} string The Unicode input string (UCS-2).
   * @returns {Array} The new array of code points.
   */


  function ucs2decode(string) {
    var output = [],
        counter = 0,
        length = string.length,
        value,
        extra;

    while (counter < length) {
      value = string.charCodeAt(counter++);

      if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
        // high surrogate, and there is a next character
        extra = string.charCodeAt(counter++);

        if ((extra & 0xFC00) == 0xDC00) {
          // low surrogate
          output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
        } else {
          // unmatched surrogate; only append this code unit, in case the next
          // code unit is the high surrogate of a surrogate pair
          output.push(value);
          counter--;
        }
      } else {
        output.push(value);
      }
    }

    return output;
  }
  /**
   * Converts a digit/integer into a basic code point.
   * @see `basicToDigit()`
   * @private
   * @param {Number} digit The numeric value of a basic code point.
   * @returns {Number} The basic code point whose value (when used for
   * representing integers) is `digit`, which needs to be in the range
   * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
   * used; else, the lowercase form is used. The behavior is undefined
   * if `flag` is non-zero and `digit` has no uppercase form.
   */


  function digitToBasic(digit, flag) {
    //  0..25 map to ASCII a..z or A..Z
    // 26..35 map to ASCII 0..9
    return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
  }
  /**
   * Bias adaptation function as per section 3.4 of RFC 3492.
   * https://tools.ietf.org/html/rfc3492#section-3.4
   * @private
   */


  function adapt(delta, numPoints, firstTime) {
    var k = 0;
    delta = firstTime ? floor(delta / damp) : delta >> 1;
    delta += floor(delta / numPoints);

    for (;
    /* no initialization */
    delta > baseMinusTMin * tMax >> 1; k += base) {
      delta = floor(delta / baseMinusTMin);
    }

    return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
  }
  /**
   * Converts a string of Unicode symbols (e.g. a domain name label) to a
   * Punycode string of ASCII-only symbols.
   * @memberOf punycode
   * @param {String} input The string of Unicode symbols.
   * @returns {String} The resulting Punycode string of ASCII-only symbols.
   */

  function encode(input) {
    var n,
        delta,
        handledCPCount,
        basicLength,
        bias,
        j,
        m,
        q,
        k,
        t,
        currentValue,
        output = [],

    /** `inputLength` will hold the number of code points in `input`. */
    inputLength,

    /** Cached calculation results */
    handledCPCountPlusOne,
        baseMinusT,
        qMinusT; // Convert the input in UCS-2 to Unicode

    input = ucs2decode(input); // Cache the length

    inputLength = input.length; // Initialize the state

    n = initialN;
    delta = 0;
    bias = initialBias; // Handle the basic code points

    for (j = 0; j < inputLength; ++j) {
      currentValue = input[j];

      if (currentValue < 0x80) {
        output.push(stringFromCharCode(currentValue));
      }
    }

    handledCPCount = basicLength = output.length; // `handledCPCount` is the number of code points that have been handled;
    // `basicLength` is the number of basic code points.
    // Finish the basic string - if it is not empty - with a delimiter

    if (basicLength) {
      output.push(delimiter);
    } // Main encoding loop:


    while (handledCPCount < inputLength) {
      // All non-basic code points < n have been handled already. Find the next
      // larger one:
      for (m = maxInt, j = 0; j < inputLength; ++j) {
        currentValue = input[j];

        if (currentValue >= n && currentValue < m) {
          m = currentValue;
        }
      } // Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
      // but guard against overflow


      handledCPCountPlusOne = handledCPCount + 1;

      if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
        error('overflow');
      }

      delta += (m - n) * handledCPCountPlusOne;
      n = m;

      for (j = 0; j < inputLength; ++j) {
        currentValue = input[j];

        if (currentValue < n && ++delta > maxInt) {
          error('overflow');
        }

        if (currentValue == n) {
          // Represent delta as a generalized variable-length integer
          for (q = delta, k = base;;
          /* no condition */
          k += base) {
            t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;

            if (q < t) {
              break;
            }

            qMinusT = q - t;
            baseMinusT = base - t;
            output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
            q = floor(qMinusT / baseMinusT);
          }

          output.push(stringFromCharCode(digitToBasic(q, 0)));
          bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
          delta = 0;
          ++handledCPCount;
        }
      }

      ++delta;
      ++n;
    }

    return output.join('');
  }
  /**
   * Converts a Unicode string representing a domain name or an email address to
   * Punycode. Only the non-ASCII parts of the domain name will be converted,
   * i.e. it doesn't matter if you call it with a domain that's already in
   * ASCII.
   * @memberOf punycode
   * @param {String} input The domain name or email address to convert, as a
   * Unicode string.
   * @returns {String} The Punycode representation of the given domain name or
   * email address.
   */

  function toASCII(input) {
    return mapDomain(input, function (string) {
      return regexNonASCII.test(string) ? 'xn--' + encode(string) : string;
    });
  }

  // Copyright Joyent, Inc. and other Node contributors.
  //
  // Permission is hereby granted, free of charge, to any person obtaining a
  // copy of this software and associated documentation files (the
  // "Software"), to deal in the Software without restriction, including
  // without limitation the rights to use, copy, modify, merge, publish,
  // distribute, sublicense, and/or sell copies of the Software, and to permit
  // persons to whom the Software is furnished to do so, subject to the
  // following conditions:
  //
  // The above copyright notice and this permission notice shall be included
  // in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
  // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
  // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
  // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
  // USE OR OTHER DEALINGS IN THE SOFTWARE.
  // If obj.hasOwnProperty has been overridden, then calling
  // obj.hasOwnProperty(prop) will break.
  // See: https://github.com/joyent/node/issues/1707
  function hasOwnProperty$2(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  var isArray$2 = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
  };

  function stringifyPrimitive(v) {
    switch (typeof v) {
      case 'string':
        return v;

      case 'boolean':
        return v ? 'true' : 'false';

      case 'number':
        return isFinite(v) ? v : '';

      default:
        return '';
    }
  }

  function stringify(obj, sep, eq, name) {
    sep = sep || '&';
    eq = eq || '=';

    if (obj === null) {
      obj = undefined;
    }

    if (typeof obj === 'object') {
      return map$2(objectKeys(obj), function (k) {
        var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;

        if (isArray$2(obj[k])) {
          return map$2(obj[k], function (v) {
            return ks + encodeURIComponent(stringifyPrimitive(v));
          }).join(sep);
        } else {
          return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
        }
      }).join(sep);
    }

    if (!name) return '';
    return encodeURIComponent(stringifyPrimitive(name)) + eq + encodeURIComponent(stringifyPrimitive(obj));
  }

  function map$2(xs, f) {
    if (xs.map) return xs.map(f);
    var res = [];

    for (var i = 0; i < xs.length; i++) {
      res.push(f(xs[i], i));
    }

    return res;
  }

  var objectKeys = Object.keys || function (obj) {
    var res = [];

    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
    }

    return res;
  };

  function parse$2(qs, sep, eq, options) {
    sep = sep || '&';
    eq = eq || '=';
    var obj = {};

    if (typeof qs !== 'string' || qs.length === 0) {
      return obj;
    }

    var regexp = /\+/g;
    qs = qs.split(sep);
    var maxKeys = 1000;

    if (options && typeof options.maxKeys === 'number') {
      maxKeys = options.maxKeys;
    }

    var len = qs.length; // maxKeys <= 0 means that we should not limit keys count

    if (maxKeys > 0 && len > maxKeys) {
      len = maxKeys;
    }

    for (var i = 0; i < len; ++i) {
      var x = qs[i].replace(regexp, '%20'),
          idx = x.indexOf(eq),
          kstr,
          vstr,
          k,
          v;

      if (idx >= 0) {
        kstr = x.substr(0, idx);
        vstr = x.substr(idx + 1);
      } else {
        kstr = x;
        vstr = '';
      }

      k = decodeURIComponent(kstr);
      v = decodeURIComponent(vstr);

      if (!hasOwnProperty$2(obj, k)) {
        obj[k] = v;
      } else if (isArray$2(obj[k])) {
        obj[k].push(v);
      } else {
        obj[k] = [obj[k], v];
      }
    }

    return obj;
  }

  // Copyright Joyent, Inc. and other Node contributors.
  var url = {
    parse: urlParse,
    resolve: urlResolve,
    resolveObject: urlResolveObject,
    format: urlFormat,
    Url: Url
  };
  function Url() {
    this.protocol = null;
    this.slashes = null;
    this.auth = null;
    this.host = null;
    this.port = null;
    this.hostname = null;
    this.hash = null;
    this.search = null;
    this.query = null;
    this.pathname = null;
    this.path = null;
    this.href = null;
  } // Reference: RFC 3986, RFC 1808, RFC 2396
  // define these here so at least they only have to be
  // compiled once on the first module load.

  var protocolPattern = /^([a-z0-9.+-]+:)/i,
      portPattern = /:[0-9]*$/,
      // Special case for a simple path URL
  simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,
      // RFC 2396: characters reserved for delimiting URLs.
  // We actually just auto-escape these.
  delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],
      // RFC 2396: characters not allowed for various reasons.
  unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),
      // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
  autoEscape = ['\''].concat(unwise),
      // Characters that are never ever allowed in a hostname.
  // Note that any invalid chars are also handled, but these
  // are the ones that are *expected* to be seen, so we fast-path
  // them.
  nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
      hostEndingChars = ['/', '?', '#'],
      hostnameMaxLen = 255,
      hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
      hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
      // protocols that can allow "unsafe" and "unwise" chars.
  unsafeProtocol = {
    'javascript': true,
    'javascript:': true
  },
      // protocols that never have a hostname.
  hostlessProtocol = {
    'javascript': true,
    'javascript:': true
  },
      // protocols that always contain a // bit.
  slashedProtocol = {
    'http': true,
    'https': true,
    'ftp': true,
    'gopher': true,
    'file': true,
    'http:': true,
    'https:': true,
    'ftp:': true,
    'gopher:': true,
    'file:': true
  };

  function urlParse(url, parseQueryString, slashesDenoteHost) {
    if (url && isObject(url) && url instanceof Url) return url;
    var u = new Url();
    u.parse(url, parseQueryString, slashesDenoteHost);
    return u;
  }

  Url.prototype.parse = function (url, parseQueryString, slashesDenoteHost) {
    return parse$3(this, url, parseQueryString, slashesDenoteHost);
  };

  function parse$3(self, url, parseQueryString, slashesDenoteHost) {
    if (!isString(url)) {
      throw new TypeError('Parameter \'url\' must be a string, not ' + typeof url);
    } // Copy chrome, IE, opera backslash-handling behavior.
    // Back slashes before the query string get converted to forward slashes
    // See: https://code.google.com/p/chromium/issues/detail?id=25916


    var queryIndex = url.indexOf('?'),
        splitter = queryIndex !== -1 && queryIndex < url.indexOf('#') ? '?' : '#',
        uSplit = url.split(splitter),
        slashRegex = /\\/g;
    uSplit[0] = uSplit[0].replace(slashRegex, '/');
    url = uSplit.join(splitter);
    var rest = url; // trim before proceeding.
    // This is to support parse stuff like "  http://foo.com  \n"

    rest = rest.trim();

    if (!slashesDenoteHost && url.split('#').length === 1) {
      // Try fast path regexp
      var simplePath = simplePathPattern.exec(rest);

      if (simplePath) {
        self.path = rest;
        self.href = rest;
        self.pathname = simplePath[1];

        if (simplePath[2]) {
          self.search = simplePath[2];

          if (parseQueryString) {
            self.query = parse$2(self.search.substr(1));
          } else {
            self.query = self.search.substr(1);
          }
        } else if (parseQueryString) {
          self.search = '';
          self.query = {};
        }

        return self;
      }
    }

    var proto = protocolPattern.exec(rest);

    if (proto) {
      proto = proto[0];
      var lowerProto = proto.toLowerCase();
      self.protocol = lowerProto;
      rest = rest.substr(proto.length);
    } // figure out if it's got a host
    // user@server is *always* interpreted as a hostname, and url
    // resolution will treat //foo/bar as host=foo,path=bar because that's
    // how the browser resolves relative URLs.


    if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
      var slashes = rest.substr(0, 2) === '//';

      if (slashes && !(proto && hostlessProtocol[proto])) {
        rest = rest.substr(2);
        self.slashes = true;
      }
    }

    var i, hec, l, p;

    if (!hostlessProtocol[proto] && (slashes || proto && !slashedProtocol[proto])) {
      // there's a hostname.
      // the first instance of /, ?, ;, or # ends the host.
      //
      // If there is an @ in the hostname, then non-host chars *are* allowed
      // to the left of the last @ sign, unless some host-ending character
      // comes *before* the @-sign.
      // URLs are obnoxious.
      //
      // ex:
      // http://a@b@c/ => user:a@b host:c
      // http://a@b?@c => user:a host:c path:/?@c
      // v0.12 TODO(isaacs): This is not quite how Chrome does things.
      // Review our test case against browsers more comprehensively.
      // find the first instance of any hostEndingChars
      var hostEnd = -1;

      for (i = 0; i < hostEndingChars.length; i++) {
        hec = rest.indexOf(hostEndingChars[i]);
        if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) hostEnd = hec;
      } // at this point, either we have an explicit point where the
      // auth portion cannot go past, or the last @ char is the decider.


      var auth, atSign;

      if (hostEnd === -1) {
        // atSign can be anywhere.
        atSign = rest.lastIndexOf('@');
      } else {
        // atSign must be in auth portion.
        // http://a@b/c@d => host:b auth:a path:/c@d
        atSign = rest.lastIndexOf('@', hostEnd);
      } // Now we have a portion which is definitely the auth.
      // Pull that off.


      if (atSign !== -1) {
        auth = rest.slice(0, atSign);
        rest = rest.slice(atSign + 1);
        self.auth = decodeURIComponent(auth);
      } // the host is the remaining to the left of the first non-host char


      hostEnd = -1;

      for (i = 0; i < nonHostChars.length; i++) {
        hec = rest.indexOf(nonHostChars[i]);
        if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) hostEnd = hec;
      } // if we still have not hit it, then the entire thing is a host.


      if (hostEnd === -1) hostEnd = rest.length;
      self.host = rest.slice(0, hostEnd);
      rest = rest.slice(hostEnd); // pull out port.

      parseHost(self); // we've indicated that there is a hostname,
      // so even if it's empty, it has to be present.

      self.hostname = self.hostname || ''; // if hostname begins with [ and ends with ]
      // assume that it's an IPv6 address.

      var ipv6Hostname = self.hostname[0] === '[' && self.hostname[self.hostname.length - 1] === ']'; // validate a little.

      if (!ipv6Hostname) {
        var hostparts = self.hostname.split(/\./);

        for (i = 0, l = hostparts.length; i < l; i++) {
          var part = hostparts[i];
          if (!part) continue;

          if (!part.match(hostnamePartPattern)) {
            var newpart = '';

            for (var j = 0, k = part.length; j < k; j++) {
              if (part.charCodeAt(j) > 127) {
                // we replace non-ASCII char with a temporary placeholder
                // we need this to make sure size of hostname is not
                // broken by replacing non-ASCII by nothing
                newpart += 'x';
              } else {
                newpart += part[j];
              }
            } // we test again with ASCII char only


            if (!newpart.match(hostnamePartPattern)) {
              var validParts = hostparts.slice(0, i);
              var notHost = hostparts.slice(i + 1);
              var bit = part.match(hostnamePartStart);

              if (bit) {
                validParts.push(bit[1]);
                notHost.unshift(bit[2]);
              }

              if (notHost.length) {
                rest = '/' + notHost.join('.') + rest;
              }

              self.hostname = validParts.join('.');
              break;
            }
          }
        }
      }

      if (self.hostname.length > hostnameMaxLen) {
        self.hostname = '';
      } else {
        // hostnames are always lower case.
        self.hostname = self.hostname.toLowerCase();
      }

      if (!ipv6Hostname) {
        // IDNA Support: Returns a punycoded representation of "domain".
        // It only converts parts of the domain name that
        // have non-ASCII characters, i.e. it doesn't matter if
        // you call it with a domain that already is ASCII-only.
        self.hostname = toASCII(self.hostname);
      }

      p = self.port ? ':' + self.port : '';
      var h = self.hostname || '';
      self.host = h + p;
      self.href += self.host; // strip [ and ] from the hostname
      // the host field still retains them, though

      if (ipv6Hostname) {
        self.hostname = self.hostname.substr(1, self.hostname.length - 2);

        if (rest[0] !== '/') {
          rest = '/' + rest;
        }
      }
    } // now rest is set to the post-host stuff.
    // chop off any delim chars.


    if (!unsafeProtocol[lowerProto]) {
      // First, make 100% sure that any "autoEscape" chars get
      // escaped, even if encodeURIComponent doesn't think they
      // need to be.
      for (i = 0, l = autoEscape.length; i < l; i++) {
        var ae = autoEscape[i];
        if (rest.indexOf(ae) === -1) continue;
        var esc = encodeURIComponent(ae);

        if (esc === ae) {
          esc = escape(ae);
        }

        rest = rest.split(ae).join(esc);
      }
    } // chop off from the tail first.


    var hash = rest.indexOf('#');

    if (hash !== -1) {
      // got a fragment string.
      self.hash = rest.substr(hash);
      rest = rest.slice(0, hash);
    }

    var qm = rest.indexOf('?');

    if (qm !== -1) {
      self.search = rest.substr(qm);
      self.query = rest.substr(qm + 1);

      if (parseQueryString) {
        self.query = parse$2(self.query);
      }

      rest = rest.slice(0, qm);
    } else if (parseQueryString) {
      // no query string, but parseQueryString still requested
      self.search = '';
      self.query = {};
    }

    if (rest) self.pathname = rest;

    if (slashedProtocol[lowerProto] && self.hostname && !self.pathname) {
      self.pathname = '/';
    } //to support http.request


    if (self.pathname || self.search) {
      p = self.pathname || '';
      var s = self.search || '';
      self.path = p + s;
    } // finally, reconstruct the href based on what has been validated.


    self.href = format$2(self);
    return self;
  } // format a parsed object into a url string


  function urlFormat(obj) {
    // ensure it's an object, and not a string url.
    // If it's an obj, this is a no-op.
    // this way, you can call url_format() on strings
    // to clean up potentially wonky urls.
    if (isString(obj)) obj = parse$3({}, obj);
    return format$2(obj);
  }

  function format$2(self) {
    var auth = self.auth || '';

    if (auth) {
      auth = encodeURIComponent(auth);
      auth = auth.replace(/%3A/i, ':');
      auth += '@';
    }

    var protocol = self.protocol || '',
        pathname = self.pathname || '',
        hash = self.hash || '',
        host = false,
        query = '';

    if (self.host) {
      host = auth + self.host;
    } else if (self.hostname) {
      host = auth + (self.hostname.indexOf(':') === -1 ? self.hostname : '[' + this.hostname + ']');

      if (self.port) {
        host += ':' + self.port;
      }
    }

    if (self.query && isObject(self.query) && Object.keys(self.query).length) {
      query = stringify(self.query);
    }

    var search = self.search || query && '?' + query || '';
    if (protocol && protocol.substr(-1) !== ':') protocol += ':'; // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
    // unless they had them to begin with.

    if (self.slashes || (!protocol || slashedProtocol[protocol]) && host !== false) {
      host = '//' + (host || '');
      if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
    } else if (!host) {
      host = '';
    }

    if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
    if (search && search.charAt(0) !== '?') search = '?' + search;
    pathname = pathname.replace(/[?#]/g, function (match) {
      return encodeURIComponent(match);
    });
    search = search.replace('#', '%23');
    return protocol + host + pathname + search + hash;
  }

  Url.prototype.format = function () {
    return format$2(this);
  };

  function urlResolve(source, relative) {
    return urlParse(source, false, true).resolve(relative);
  }

  Url.prototype.resolve = function (relative) {
    return this.resolveObject(urlParse(relative, false, true)).format();
  };

  function urlResolveObject(source, relative) {
    if (!source) return relative;
    return urlParse(source, false, true).resolveObject(relative);
  }

  Url.prototype.resolveObject = function (relative) {
    if (isString(relative)) {
      var rel = new Url();
      rel.parse(relative, false, true);
      relative = rel;
    }

    var result = new Url();
    var tkeys = Object.keys(this);

    for (var tk = 0; tk < tkeys.length; tk++) {
      var tkey = tkeys[tk];
      result[tkey] = this[tkey];
    } // hash is always overridden, no matter what.
    // even href="" will remove it.


    result.hash = relative.hash; // if the relative url is empty, then there's nothing left to do here.

    if (relative.href === '') {
      result.href = result.format();
      return result;
    } // hrefs like //foo/bar always cut to the protocol.


    if (relative.slashes && !relative.protocol) {
      // take everything except the protocol from relative
      var rkeys = Object.keys(relative);

      for (var rk = 0; rk < rkeys.length; rk++) {
        var rkey = rkeys[rk];
        if (rkey !== 'protocol') result[rkey] = relative[rkey];
      } //urlParse appends trailing / to urls like http://www.example.com


      if (slashedProtocol[result.protocol] && result.hostname && !result.pathname) {
        result.path = result.pathname = '/';
      }

      result.href = result.format();
      return result;
    }

    var relPath;

    if (relative.protocol && relative.protocol !== result.protocol) {
      // if it's a known url protocol, then changing
      // the protocol does weird things
      // first, if it's not file:, then we MUST have a host,
      // and if there was a path
      // to begin with, then we MUST have a path.
      // if it is file:, then the host is dropped,
      // because that's known to be hostless.
      // anything else is assumed to be absolute.
      if (!slashedProtocol[relative.protocol]) {
        var keys = Object.keys(relative);

        for (var v = 0; v < keys.length; v++) {
          var k = keys[v];
          result[k] = relative[k];
        }

        result.href = result.format();
        return result;
      }

      result.protocol = relative.protocol;

      if (!relative.host && !hostlessProtocol[relative.protocol]) {
        relPath = (relative.pathname || '').split('/');

        while (relPath.length && !(relative.host = relPath.shift())) {
        }

        if (!relative.host) relative.host = '';
        if (!relative.hostname) relative.hostname = '';
        if (relPath[0] !== '') relPath.unshift('');
        if (relPath.length < 2) relPath.unshift('');
        result.pathname = relPath.join('/');
      } else {
        result.pathname = relative.pathname;
      }

      result.search = relative.search;
      result.query = relative.query;
      result.host = relative.host || '';
      result.auth = relative.auth;
      result.hostname = relative.hostname || relative.host;
      result.port = relative.port; // to support http.request

      if (result.pathname || result.search) {
        var p = result.pathname || '';
        var s = result.search || '';
        result.path = p + s;
      }

      result.slashes = result.slashes || relative.slashes;
      result.href = result.format();
      return result;
    }

    var isSourceAbs = result.pathname && result.pathname.charAt(0) === '/',
        isRelAbs = relative.host || relative.pathname && relative.pathname.charAt(0) === '/',
        mustEndAbs = isRelAbs || isSourceAbs || result.host && relative.pathname,
        removeAllDots = mustEndAbs,
        srcPath = result.pathname && result.pathname.split('/') || [],
        psychotic = result.protocol && !slashedProtocol[result.protocol];
    relPath = relative.pathname && relative.pathname.split('/') || []; // if the url is a non-slashed url, then relative
    // links like ../.. should be able
    // to crawl up to the hostname, as well.  This is strange.
    // result.protocol has already been set by now.
    // Later on, put the first path part into the host field.

    if (psychotic) {
      result.hostname = '';
      result.port = null;

      if (result.host) {
        if (srcPath[0] === '') srcPath[0] = result.host;else srcPath.unshift(result.host);
      }

      result.host = '';

      if (relative.protocol) {
        relative.hostname = null;
        relative.port = null;

        if (relative.host) {
          if (relPath[0] === '') relPath[0] = relative.host;else relPath.unshift(relative.host);
        }

        relative.host = null;
      }

      mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
    }

    var authInHost;

    if (isRelAbs) {
      // it's absolute.
      result.host = relative.host || relative.host === '' ? relative.host : result.host;
      result.hostname = relative.hostname || relative.hostname === '' ? relative.hostname : result.hostname;
      result.search = relative.search;
      result.query = relative.query;
      srcPath = relPath; // fall through to the dot-handling below.
    } else if (relPath.length) {
      // it's relative
      // throw away the existing file, and take the new path instead.
      if (!srcPath) srcPath = [];
      srcPath.pop();
      srcPath = srcPath.concat(relPath);
      result.search = relative.search;
      result.query = relative.query;
    } else if (!isNullOrUndefined(relative.search)) {
      // just pull out the search.
      // like href='?foo'.
      // Put this after the other two cases because it simplifies the booleans
      if (psychotic) {
        result.hostname = result.host = srcPath.shift(); //occationaly the auth can get stuck only in host
        //this especially happens in cases like
        //url.resolveObject('mailto:local1@domain1', 'local2@domain2')

        authInHost = result.host && result.host.indexOf('@') > 0 ? result.host.split('@') : false;

        if (authInHost) {
          result.auth = authInHost.shift();
          result.host = result.hostname = authInHost.shift();
        }
      }

      result.search = relative.search;
      result.query = relative.query; //to support http.request

      if (!isNull(result.pathname) || !isNull(result.search)) {
        result.path = (result.pathname ? result.pathname : '') + (result.search ? result.search : '');
      }

      result.href = result.format();
      return result;
    }

    if (!srcPath.length) {
      // no path at all.  easy.
      // we've already handled the other stuff above.
      result.pathname = null; //to support http.request

      if (result.search) {
        result.path = '/' + result.search;
      } else {
        result.path = null;
      }

      result.href = result.format();
      return result;
    } // if a url ENDs in . or .., then it must get a trailing slash.
    // however, if it ends in anything else non-slashy,
    // then it must NOT get a trailing slash.


    var last = srcPath.slice(-1)[0];
    var hasTrailingSlash = (result.host || relative.host || srcPath.length > 1) && (last === '.' || last === '..') || last === ''; // strip single dots, resolve double dots to parent dir
    // if the path tries to go above the root, `up` ends up > 0

    var up = 0;

    for (var i = srcPath.length; i >= 0; i--) {
      last = srcPath[i];

      if (last === '.') {
        srcPath.splice(i, 1);
      } else if (last === '..') {
        srcPath.splice(i, 1);
        up++;
      } else if (up) {
        srcPath.splice(i, 1);
        up--;
      }
    } // if the path is allowed to go above the root, restore leading ..s


    if (!mustEndAbs && !removeAllDots) {
      for (; up--; up) {
        srcPath.unshift('..');
      }
    }

    if (mustEndAbs && srcPath[0] !== '' && (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
      srcPath.unshift('');
    }

    if (hasTrailingSlash && srcPath.join('/').substr(-1) !== '/') {
      srcPath.push('');
    }

    var isAbsolute = srcPath[0] === '' || srcPath[0] && srcPath[0].charAt(0) === '/'; // put the host back

    if (psychotic) {
      result.hostname = result.host = isAbsolute ? '' : srcPath.length ? srcPath.shift() : ''; //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')

      authInHost = result.host && result.host.indexOf('@') > 0 ? result.host.split('@') : false;

      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }

    mustEndAbs = mustEndAbs || result.host && srcPath.length;

    if (mustEndAbs && !isAbsolute) {
      srcPath.unshift('');
    }

    if (!srcPath.length) {
      result.pathname = null;
      result.path = null;
    } else {
      result.pathname = srcPath.join('/');
    } //to support request.http


    if (!isNull(result.pathname) || !isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') + (result.search ? result.search : '');
    }

    result.auth = relative.auth || result.auth;
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  };

  Url.prototype.parseHost = function () {
    return parseHost(this);
  };

  function parseHost(self) {
    var host = self.host;
    var port = portPattern.exec(host);

    if (port) {
      port = port[0];

      if (port !== ':') {
        self.port = port.substr(1);
      }

      host = host.substr(0, host.length - port.length);
    }

    if (host) self.hostname = host;
  }

  var ws = {};

  var common = createCommonjsModule(function (module, exports) {
    var Buffer = safeBuffer.Buffer;
    exports.DEFAULT_ANNOUNCE_PEERS = 50;
    exports.MAX_ANNOUNCE_PEERS = 82;

    exports.binaryToHex = function (str) {
      if (typeof str !== 'string') {
        str = String(str);
      }

      return Buffer.from(str, 'binary').toString('hex');
    };

    exports.hexToBinary = function (str) {
      if (typeof str !== 'string') {
        str = String(str);
      }

      return Buffer.from(str, 'hex').toString('binary');
    };

    Object.assign(exports, ws);
  });
  var common_1 = common.DEFAULT_ANNOUNCE_PEERS;
  var common_2 = common.MAX_ANNOUNCE_PEERS;
  var common_3 = common.binaryToHex;
  var common_4 = common.hexToBinary;

  /* global WebSocket, DOMException */

  var simpleWebsocket = Socket;
  var debug$3 = browser$1('simple-websocket'); // websockets in node - will be empty object in browser

  var _WebSocket = typeof ws !== 'function' ? WebSocket : ws;

  var MAX_BUFFERED_AMOUNT$1 = 64 * 1024;
  inherits_browser(Socket, Stream.Duplex);
  /**
   * WebSocket. Same API as node core `net.Socket`. Duplex stream.
   * @param {Object} opts
   * @param {string=} opts.url websocket server url
   * @param {string=} opts.socket raw websocket instance to wrap
   */

  function Socket(opts) {
    var self = this;
    if (!(self instanceof Socket)) return new Socket(opts);
    if (!opts) opts = {}; // Support simple usage: `new Socket(url)`

    if (typeof opts === 'string') {
      opts = {
        url: opts
      };
    }

    if (opts.url == null && opts.socket == null) {
      throw new Error('Missing required `url` or `socket` option');
    }

    if (opts.url != null && opts.socket != null) {
      throw new Error('Must specify either `url` or `socket` option, not both');
    }

    self._id = browser$3(4).toString('hex').slice(0, 7);

    self._debug('new websocket: %o', opts);

    opts = Object.assign({
      allowHalfOpen: false
    }, opts);
    Stream.Duplex.call(self, opts);
    self.connected = false;
    self.destroyed = false;
    self._chunk = null;
    self._cb = null;
    self._interval = null;

    if (opts.socket) {
      self.url = opts.socket.url;
      self._ws = opts.socket;
    } else {
      self.url = opts.url;

      try {
        if (typeof ws === 'function') {
          // `ws` package accepts options
          self._ws = new _WebSocket(opts.url, opts);
        } else {
          self._ws = new _WebSocket(opts.url);
        }
      } catch (err) {
        nextTick(function () {
          self.destroy(err);
        });
        return;
      }
    }

    self._ws.binaryType = 'arraybuffer';

    self._ws.onopen = function () {
      self._onOpen();
    };

    self._ws.onmessage = function (event) {
      self._onMessage(event);
    };

    self._ws.onclose = function () {
      self._onClose();
    };

    self._ws.onerror = function () {
      self.destroy(new Error('connection error to ' + self.url));
    };

    self._onFinishBound = function () {
      self._onFinish();
    };

    self.once('finish', self._onFinishBound);
  }

  Socket.WEBSOCKET_SUPPORT = !!_WebSocket;
  /**
   * Send text/binary data to the WebSocket server.
   * @param {TypedArrayView|ArrayBuffer|Buffer|string|Blob|Object} chunk
   */

  Socket.prototype.send = function (chunk) {
    this._ws.send(chunk);
  }; // TODO: Delete this method once readable-stream is updated to contain a default
  // implementation of destroy() that automatically calls _destroy()
  // See: https://github.com/nodejs/readable-stream/issues/283


  Socket.prototype.destroy = function (err) {
    this._destroy(err, function () {});
  };

  Socket.prototype._destroy = function (err, cb) {
    var self = this;
    if (self.destroyed) return;

    self._debug('destroy (error: %s)', err && (err.message || err));

    self.readable = self.writable = false;
    if (!self._readableState.ended) self.push(null);
    if (!self._writableState.finished) self.end();
    self.connected = false;
    self.destroyed = true;
    clearInterval(self._interval);
    self._interval = null;
    self._chunk = null;
    self._cb = null;
    if (self._onFinishBound) self.removeListener('finish', self._onFinishBound);
    self._onFinishBound = null;

    if (self._ws) {
      var ws$$1 = self._ws;

      var onClose = function () {
        ws$$1.onclose = null;
      };

      if (ws$$1.readyState === _WebSocket.CLOSED) {
        onClose();
      } else {
        try {
          ws$$1.onclose = onClose;
          ws$$1.close();
        } catch (err) {
          onClose();
        }
      }

      ws$$1.onopen = null;
      ws$$1.onmessage = null;

      ws$$1.onerror = function () {};
    }

    self._ws = null;

    if (err) {
      if (typeof DOMException !== 'undefined' && err instanceof DOMException) {
        // Convert Edge DOMException object to Error object
        var code = err.code;
        err = new Error(err.message);
        err.code = code;
      }

      self.emit('error', err);
    }

    self.emit('close');
    cb();
  };

  Socket.prototype._read = function () {};

  Socket.prototype._write = function (chunk, encoding, cb) {
    if (this.destroyed) return cb(new Error('cannot write after socket is destroyed'));

    if (this.connected) {
      try {
        this.send(chunk);
      } catch (err) {
        return this.destroy(err);
      }

      if (typeof ws !== 'function' && this._ws.bufferedAmount > MAX_BUFFERED_AMOUNT$1) {
        this._debug('start backpressure: bufferedAmount %d', this._ws.bufferedAmount);

        this._cb = cb;
      } else {
        cb(null);
      }
    } else {
      this._debug('write before connect');

      this._chunk = chunk;
      this._cb = cb;
    }
  }; // When stream finishes writing, close socket. Half open connections are not
  // supported.


  Socket.prototype._onFinish = function () {
    var self = this;
    if (self.destroyed) return;

    if (self.connected) {
      destroySoon();
    } else {
      self.once('connect', destroySoon);
    } // Wait a bit before destroying so the socket flushes.
    // TODO: is there a more reliable way to accomplish this?


    function destroySoon() {
      setTimeout(function () {
        self.destroy();
      }, 1000);
    }
  };

  Socket.prototype._onMessage = function (event) {
    if (this.destroyed) return;
    var data = event.data;
    if (data instanceof ArrayBuffer) data = Buffer.from(data);
    this.push(data);
  };

  Socket.prototype._onOpen = function () {
    var self = this;
    if (self.connected || self.destroyed) return;
    self.connected = true;

    if (self._chunk) {
      try {
        self.send(self._chunk);
      } catch (err) {
        return self.destroy(err);
      }

      self._chunk = null;

      self._debug('sent chunk from "write before connect"');

      var cb = self._cb;
      self._cb = null;
      cb(null);
    } // Backpressure is not implemented in Node.js. The `ws` module has a buggy
    // `bufferedAmount` property. See: https://github.com/websockets/ws/issues/492


    if (typeof ws !== 'function') {
      self._interval = setInterval(function () {
        self._onInterval();
      }, 150);
      if (self._interval.unref) self._interval.unref();
    }

    self._debug('connect');

    self.emit('connect');
  };

  Socket.prototype._onInterval = function () {
    if (!this._cb || !this._ws || this._ws.bufferedAmount > MAX_BUFFERED_AMOUNT$1) {
      return;
    }

    this._debug('ending backpressure: bufferedAmount %d', this._ws.bufferedAmount);

    var cb = this._cb;
    this._cb = null;
    cb(null);
  };

  Socket.prototype._onClose = function () {
    if (this.destroyed) return;

    this._debug('on close');

    this.destroy();
  };

  Socket.prototype._debug = function () {
    var args = [].slice.call(arguments);
    args[0] = '[' + this._id + '] ' + args[0];
    debug$3.apply(null, args);
  };

  var debug$4 = browser$1('bittorrent-tracker:tracker');

  var Tracker =
  /*#__PURE__*/
  function (_EventEmitter) {
    inheritsLoose(Tracker, _EventEmitter);

    function Tracker(client, announceUrl) {
      var _this;

      _this = _EventEmitter.call(this) || this;
      _this.client = client;
      _this.announceUrl = announceUrl;
      _this.interval = null;
      _this.destroyed = false;
      return _this;
    }

    var _proto = Tracker.prototype;

    _proto.setInterval = function (_setInterval) {
      function setInterval(_x) {
        return _setInterval.apply(this, arguments);
      }

      setInterval.toString = function () {
        return _setInterval.toString();
      };

      return setInterval;
    }(function (intervalMs) {
      var _this2 = this;

      if (intervalMs == null) intervalMs = this.DEFAULT_ANNOUNCE_INTERVAL;
      clearInterval(this.interval);
      debug$4('setInterval %d', intervalMs);

      if (intervalMs) {
        this.interval = setInterval(function () {
          _this2.announce(_this2.client._defaultAnnounceOpts());
        }, intervalMs);
        if (this.interval.unref) this.interval.unref();
      }
    });

    return Tracker;
  }(EventEmitter);

  var tracker = Tracker;

  var debug$5 = browser$1('bittorrent-tracker:websocket-tracker');
  var socketPool = {};
  var RECONNECT_MINIMUM = 10 * 1000;
  var RECONNECT_MAXIMUM = 30 * 60 * 1000;
  var RECONNECT_VARIANCE = 2 * 60 * 1000;
  var OFFER_TIMEOUT = 50 * 1000;

  function noop$2() {}

  var WebSocketTracker =
  /*#__PURE__*/
  function (_Tracker) {
    inheritsLoose(WebSocketTracker, _Tracker);

    function WebSocketTracker(client, announceUrl, opts) {
      var _this;

      _this = _Tracker.call(this, client, announceUrl) || this;
      debug$5('new websocket tracker %s', announceUrl);
      _this.peers = {};
      _this.socket = null;
      _this.reconnecting = false;
      _this.retries = 0;
      _this.reconnectTimer = null;
      _this.expectingResponse = false;

      _this._openSocket();

      return _this;
    }

    var _proto = WebSocketTracker.prototype;

    _proto.announce = function announce(opts) {
      var _this2 = this;

      if (this.destroyed || this.reconnecting) return;

      if (!this.socket.connected) {
        this.socket.once('connect', function () {
          _this2.announce(opts);
        });
        return;
      }

      debug$5('announce', opts);
      var params = Object.assign({}, opts, {
        action: 'announce',
        info_hash: this.client._infoHashBinary,
        peer_id: this.client._peerIdBinary
      });
      if (this._trackerId) params.trackerid = this._trackerId;

      if (opts.event === 'stopped' || opts.event === 'completed') {
        this._send(params);
      } else {
        var numwant = Math.min(opts.numwant, 10);

        this._generateOffers(numwant, function (offers) {
          params.numwant = numwant;
          params.offers = offers;

          _this2._send(params);
        });
      }
    };

    _proto.scrape = function scrape(opts) {
      var _this3 = this;

      if (this.destroyed || this.reconnecting) return;

      if (!this.socket.connected) {
        this.socket.once('connect', function () {
          _this3.scrape(opts);
        });
        return;
      }

      var infoHashes = Array.isArray(opts.infoHash) && opts.infoHash.length > 0 ? opts.infoHash.map(function (infoHash) {
        return infoHash.toString('binary');
      }) : opts.infoHash && opts.infoHash.toString('binary') || this.client._infoHashBinary;
      var params = {
        action: 'scrape',
        info_hash: infoHashes
      };

      this._send(params);
    };

    _proto.destroy = function destroy(cb) {
      if (cb === void 0) {
        cb = noop$2;
      }

      if (this.destroyed) return cb(null);
      this.destroyed = true;
      clearInterval(this.interval);
      clearTimeout(this.reconnectTimer);

      for (var peerId in this.peers) {
        var peer = this.peers[peerId];
        clearTimeout(peer.trackerTimeout);
        peer.destroy();
      }

      this.peers = null;

      if (this.socket) {
        this.socket.removeListener('connect', this._onSocketConnectBound);
        this.socket.removeListener('data', this._onSocketDataBound);
        this.socket.removeListener('close', this._onSocketCloseBound);
        this.socket.removeListener('error', this._onSocketErrorBound);
        this.socket = null;
      }

      this._onSocketConnectBound = null;
      this._onSocketErrorBound = null;
      this._onSocketDataBound = null;
      this._onSocketCloseBound = null;

      if (socketPool[this.announceUrl]) {
        socketPool[this.announceUrl].consumers -= 1;
      }

      if (socketPool[this.announceUrl].consumers > 0) return cb();
      var socket = socketPool[this.announceUrl];
      delete socketPool[this.announceUrl];
      socket.on('error', noop$2);
      socket.once('close', cb);
      if (!this.expectingResponse) return destroyCleanup();
      var timeout = setTimeout(destroyCleanup, common.DESTROY_TIMEOUT);
      socket.once('data', destroyCleanup);

      function destroyCleanup() {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }

        socket.removeListener('data', destroyCleanup);
        socket.destroy();
        socket = null;
      }
    };

    _proto._openSocket = function _openSocket() {
      var _this4 = this;

      this.destroyed = false;
      if (!this.peers) this.peers = {};

      this._onSocketConnectBound = function () {
        _this4._onSocketConnect();
      };

      this._onSocketErrorBound = function (err) {
        _this4._onSocketError(err);
      };

      this._onSocketDataBound = function (data) {
        _this4._onSocketData(data);
      };

      this._onSocketCloseBound = function () {
        _this4._onSocketClose();
      };

      this.socket = socketPool[this.announceUrl];

      if (this.socket) {
        socketPool[this.announceUrl].consumers += 1;
      } else {
        this.socket = socketPool[this.announceUrl] = new simpleWebsocket(this.announceUrl);
        this.socket.consumers = 1;
        this.socket.once('connect', this._onSocketConnectBound);
      }

      this.socket.on('data', this._onSocketDataBound);
      this.socket.once('close', this._onSocketCloseBound);
      this.socket.once('error', this._onSocketErrorBound);
    };

    _proto._onSocketConnect = function _onSocketConnect() {
      if (this.destroyed) return;

      if (this.reconnecting) {
        this.reconnecting = false;
        this.retries = 0;
        this.announce(this.client._defaultAnnounceOpts());
      }
    };

    _proto._onSocketData = function _onSocketData(data) {
      if (this.destroyed) return;
      this.expectingResponse = false;

      try {
        data = JSON.parse(data);
      } catch (err) {
        this.client.emit('warning', new Error('Invalid tracker response'));
        return;
      }

      if (data.action === 'announce') {
        this._onAnnounceResponse(data);
      } else if (data.action === 'scrape') {
        this._onScrapeResponse(data);
      } else {
        this._onSocketError(new Error("invalid action in WS response: " + data.action));
      }
    };

    _proto._onAnnounceResponse = function _onAnnounceResponse(data) {
      var _this5 = this;

      if (data.info_hash !== this.client._infoHashBinary) {
        debug$5('ignoring websocket data from %s for %s (looking for %s: reused socket)', this.announceUrl, common.binaryToHex(data.info_hash), this.client.infoHash);
        return;
      }

      if (data.peer_id && data.peer_id === this.client._peerIdBinary) {
        return;
      }

      debug$5('received %s from %s for %s', JSON.stringify(data), this.announceUrl, this.client.infoHash);
      var failure = data['failure reason'];
      if (failure) return this.client.emit('warning', new Error(failure));
      var warning = data['warning message'];
      if (warning) this.client.emit('warning', new Error(warning));
      var interval = data.interval || data['min interval'];
      if (interval) this.setInterval(interval * 1000);
      var trackerId = data['tracker id'];

      if (trackerId) {
        this._trackerId = trackerId;
      }

      if (data.complete != null) {
        var response = Object.assign({}, data, {
          announce: this.announceUrl,
          infoHash: common.binaryToHex(data.info_hash)
        });
        this.client.emit('update', response);
      }

      var peer;

      if (data.offer && data.peer_id) {
        debug$5('creating peer (from remote offer)');
        peer = this._createPeer();
        peer.id = common.binaryToHex(data.peer_id);
        peer.once('signal', function (answer) {
          var params = {
            action: 'announce',
            info_hash: _this5.client._infoHashBinary,
            peer_id: _this5.client._peerIdBinary,
            to_peer_id: data.peer_id,
            answer: answer,
            offer_id: data.offer_id
          };
          if (_this5._trackerId) params.trackerid = _this5._trackerId;

          _this5._send(params);
        });
        peer.signal(data.offer);
        this.client.emit('peer', peer);
      }

      if (data.answer && data.peer_id) {
        var offerId = common.binaryToHex(data.offer_id);
        peer = this.peers[offerId];

        if (peer) {
          peer.id = common.binaryToHex(data.peer_id);
          peer.signal(data.answer);
          this.client.emit('peer', peer);
          clearTimeout(peer.trackerTimeout);
          peer.trackerTimeout = null;
          delete this.peers[offerId];
        } else {
          debug$5("got unexpected answer: " + JSON.stringify(data.answer));
        }
      }
    };

    _proto._onScrapeResponse = function _onScrapeResponse(data) {
      var _this6 = this;

      data = data.files || {};
      var keys = Object.keys(data);

      if (keys.length === 0) {
        this.client.emit('warning', new Error('invalid scrape response'));
        return;
      }

      keys.forEach(function (infoHash) {
        var response = Object.assign(data[infoHash], {
          announce: _this6.announceUrl,
          infoHash: common.binaryToHex(infoHash)
        });

        _this6.client.emit('scrape', response);
      });
    };

    _proto._onSocketClose = function _onSocketClose() {
      if (this.destroyed) return;
      this.destroy();

      this._startReconnectTimer();
    };

    _proto._onSocketError = function _onSocketError(err) {
      if (this.destroyed) return;
      this.destroy();
      this.client.emit('warning', err);

      this._startReconnectTimer();
    };

    _proto._startReconnectTimer = function _startReconnectTimer() {
      var _this7 = this;

      var ms = Math.floor(Math.random() * RECONNECT_VARIANCE) + Math.min(Math.pow(2, this.retries) * RECONNECT_MINIMUM, RECONNECT_MAXIMUM);
      this.reconnecting = true;
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(function () {
        _this7.retries++;

        _this7._openSocket();
      }, ms);
      if (this.reconnectTimer.unref) this.reconnectTimer.unref();
      debug$5('reconnecting socket in %s ms', ms);
    };

    _proto._send = function _send(params) {
      if (this.destroyed) return;
      this.expectingResponse = true;
      var message = JSON.stringify(params);
      debug$5('send %s', message);
      this.socket.send(message);
    };

    _proto._generateOffers = function _generateOffers(numwant, cb) {
      var self = this;
      var offers = [];
      debug$5('generating %s offers', numwant);

      for (var i = 0; i < numwant; ++i) {
        generateOffer();
      }

      checkDone();

      function generateOffer() {
        var offerId = browser$3(20).toString('hex');
        debug$5('creating peer (from _generateOffers)');

        var peer = self.peers[offerId] = self._createPeer({
          initiator: true
        });

        peer.once('signal', function (offer) {
          offers.push({
            offer: offer,
            offer_id: common.hexToBinary(offerId)
          });
          checkDone();
        });
        peer.trackerTimeout = setTimeout(function () {
          debug$5('tracker timeout: destroying peer (offer_id: "%s")', offerId);
          peer.trackerTimeout = null;
          delete self.peers[offerId];
          peer.destroy('timeout');
        }, OFFER_TIMEOUT);
        if (peer.trackerTimeout.unref) peer.trackerTimeout.unref();
      }

      function checkDone() {
        if (offers.length === numwant) {
          debug$5('generated %s offers', numwant);
          cb(offers);
        }
      }
    };

    _proto._createPeer = function _createPeer(opts) {
      var self = this;
      opts = Object.assign({
        trickle: false,
        config: self.client._rtcConfig,
        wrtc: self.client._wrtc
      }, opts);
      var peer = new simplePeer(opts);
      peer.once('error', onError);
      peer.once('connect', onConnect);
      return peer;

      function onError(err) {
        self.client.emit('warning', new Error("Connection error: " + err.message));
        peer.destroy();
      }

      function onConnect() {
        peer.removeListener('error', onError);
        peer.removeListener('connect', onConnect);
      }
    };

    return WebSocketTracker;
  }(tracker);

  WebSocketTracker.prototype.DEFAULT_ANNOUNCE_INTERVAL = 30 * 1000;
  WebSocketTracker._socketPool = socketPool;
  var websocketTracker = WebSocketTracker;

  var Buffer$1 = safeBuffer.Buffer;
  var debug$6 = browser$1('bittorrent-tracker:client');

  var Client =
  /*#__PURE__*/
  function (_EventEmitter) {
    inheritsLoose(Client, _EventEmitter);

    function Client(opts) {
      var _this;

      if (opts === void 0) {
        opts = {};
      }

      _this = _EventEmitter.call(this) || this;
      if (!opts.peerId) throw new Error('Option `peerId` is required');
      if (!opts.infoHash) throw new Error('Option `infoHash` is required');
      if (!opts.announce) throw new Error('Option `announce` is required');
      _this.peerId = typeof opts.peerId === 'string' ? opts.peerId : opts.peerId.toString('hex');
      _this._peerIdBuffer = Buffer$1.from(_this.peerId, 'hex');
      _this._peerIdBinary = _this._peerIdBuffer.toString('binary');
      _this.infoHash = typeof opts.infoHash === 'string' ? opts.infoHash.toLowerCase() : opts.infoHash.toString('hex');
      _this._infoHashBuffer = Buffer$1.from(_this.infoHash, 'hex');
      _this._infoHashBinary = _this._infoHashBuffer.toString('binary');
      debug$6('new client %s', _this.infoHash);
      _this.destroyed = false;
      _this._port = opts.port;
      _this._getAnnounceOpts = opts.getAnnounceOpts;
      _this._rtcConfig = opts.rtcConfig;
      _this._userAgent = opts.userAgent;
      _this._wrtc = typeof opts.wrtc === 'function' ? opts.wrtc() : opts.wrtc;
      var announce = typeof opts.announce === 'string' ? [opts.announce] : opts.announce == null ? [] : opts.announce;
      announce = announce.map(function (announceUrl) {
        announceUrl = announceUrl.toString();

        if (announceUrl[announceUrl.length - 1] === '/') {
          announceUrl = announceUrl.substring(0, announceUrl.length - 1);
        }

        return announceUrl;
      });
      announce = uniq(announce);
      var webrtcSupport = _this._wrtc !== false && (!!_this._wrtc || simplePeer.WEBRTC_SUPPORT);

      var nextTickWarn = function (err) {
        nextTick(function () {
          _this.emit('warning', err);
        });
      };

      _this._trackers = announce.map(function (announceUrl) {
        var protocol = url.parse(announceUrl).protocol;

        if ((protocol === 'http:' || protocol === 'https:') && typeof ws === 'function') {
          return new ws(assertThisInitialized(_this), announceUrl);
        } else if (protocol === 'udp:' && typeof ws === 'function') {
          return new ws(assertThisInitialized(_this), announceUrl);
        } else if ((protocol === 'ws:' || protocol === 'wss:') && webrtcSupport) {
          if (protocol === 'ws:' && typeof window !== 'undefined' && window.location.protocol === 'https:') {
            nextTickWarn(new Error("Unsupported tracker protocol: " + announceUrl));
            return null;
          }

          return new websocketTracker(assertThisInitialized(_this), announceUrl);
        } else {
          nextTickWarn(new Error("Unsupported tracker protocol: " + announceUrl));
          return null;
        }
      }).filter(Boolean);
      return _this;
    }

    var _proto = Client.prototype;

    _proto.start = function start(opts) {
      debug$6('send `start`');
      opts = this._defaultAnnounceOpts(opts);
      opts.event = 'started';

      this._announce(opts);

      this.setInterval();
    };

    _proto.stop = function stop(opts) {
      debug$6('send `stop`');
      opts = this._defaultAnnounceOpts(opts);
      opts.event = 'stopped';

      this._announce(opts);
    };

    _proto.complete = function complete(opts) {
      debug$6('send `complete`');
      if (!opts) opts = {};
      opts = this._defaultAnnounceOpts(opts);
      opts.event = 'completed';

      this._announce(opts);
    };

    _proto.update = function update(opts) {
      debug$6('send `update`');
      opts = this._defaultAnnounceOpts(opts);
      if (opts.event) delete opts.event;

      this._announce(opts);
    };

    _proto._announce = function _announce(opts) {
      this._trackers.forEach(function (tracker) {
        tracker.announce(opts);
      });
    };

    _proto.scrape = function scrape(opts) {
      debug$6('send `scrape`');
      if (!opts) opts = {};

      this._trackers.forEach(function (tracker) {
        tracker.scrape(opts);
      });
    };

    _proto.setInterval = function setInterval(intervalMs) {
      debug$6('setInterval %d', intervalMs);

      this._trackers.forEach(function (tracker) {
        tracker.setInterval(intervalMs);
      });
    };

    _proto.destroy = function destroy(cb) {
      if (this.destroyed) return;
      this.destroyed = true;
      debug$6('destroy');

      var tasks = this._trackers.map(function (tracker) {
        return function (cb) {
          tracker.destroy(cb);
        };
      });

      runParallel_1(tasks, cb);
      this._trackers = [];
      this._getAnnounceOpts = null;
    };

    _proto._defaultAnnounceOpts = function _defaultAnnounceOpts(opts) {
      if (opts === void 0) {
        opts = {};
      }

      if (opts.numwant == null) opts.numwant = common.DEFAULT_ANNOUNCE_PEERS;
      if (opts.uploaded == null) opts.uploaded = 0;
      if (opts.downloaded == null) opts.downloaded = 0;
      if (this._getAnnounceOpts) opts = Object.assign({}, opts, this._getAnnounceOpts());
      return opts;
    };

    return Client;
  }(EventEmitter);

  Client.scrape = function (opts, cb) {
    cb = once_1(cb);
    if (!opts.infoHash) throw new Error('Option `infoHash` is required');
    if (!opts.announce) throw new Error('Option `announce` is required');
    var clientOpts = Object.assign({}, opts, {
      infoHash: Array.isArray(opts.infoHash) ? opts.infoHash[0] : opts.infoHash,
      peerId: Buffer$1.from('01234567890123456789'),
      port: 6881
    });
    var client = new Client(clientOpts);
    client.once('error', cb);
    client.once('warning', cb);
    var len = Array.isArray(opts.infoHash) ? opts.infoHash.length : 1;
    var results = {};
    client.on('scrape', function (data) {
      len -= 1;
      results[data.infoHash] = data;

      if (len === 0) {
        client.destroy();
        var keys = Object.keys(results);

        if (keys.length === 1) {
          cb(null, results[keys[0]]);
        } else {
          cb(null, results);
        }
      }
    });
    opts.infoHash = Array.isArray(opts.infoHash) ? opts.infoHash.map(function (infoHash) {
      return Buffer$1.from(infoHash, 'hex');
    }) : Buffer$1.from(opts.infoHash, 'hex');
    client.scrape({
      infoHash: opts.infoHash
    });
    return client;
  };

  var lib = Client;

  /* @allex/crypto-util v1.0.0 | MIT licensed | allex <allex.wxn@gmail.com> (http://iallex.com/) */
  var HEX_CHARS$1 = '0123456789abcdef'.split('');

  var safeAdd$1 = function (x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return msw << 16 | lsw & 0xFFFF;
  };

  var ROTL$1 = function (x, n) {
    return x << n | x >>> 32 - n;
  };

  var ensureBuffer$1 = function (s) {
    if (typeof s !== 'string') {
      if (isInstance$1(s, ArrayBuffer) || s && isInstance$1(s.buffer, ArrayBuffer)) {
        s = fromArrayBuffer$2(s);
      }
    } else {
      s = str2utf8b$1(s);
    }

    return s;
  };

  function fromArrayBuffer$2(array) {
    var buf = new Uint8Array(array);
    return buf;
  }

  function str2utf8b$1(str) {
    var binstr = unescape(encodeURIComponent(str)),
        arr = new Uint8Array(binstr.length),
        split = binstr.split('');
    var l = split.length;

    while (l--) {
      arr[l] = split[l].charCodeAt(0);
    }

    return arr;
  }

  function isInstance$1(obj, type) {
    return obj instanceof type || obj != null && obj.constructor != null && obj.constructor.name != null && obj.constructor.name === type.name;
  }

  /*!
   * MD5 implements with pure js. supports string, Buffer, ArrayBuffer, Uint8Array
   *
   * Copyright 2018, Allex Wang (https://iallex.com)
   *
   * Licensed under the MIT license:
   * https://opensource.org/licenses/MIT
   *
   * Based on
   * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
   * Digest Algorithm, as defined in RFC 1321.
   * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
   * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
   * Distributed under the BSD License
   * See http://pajhome.org.uk/crypt/md5 for more info.
   */

  var byteLength$1 = function (s) {
    return s.byteLength ? s.byteLength : s.length;
  };

  function md5cmn(q, a, b, x, s, t) {
    return safeAdd$1(ROTL$1(safeAdd$1(safeAdd$1(a, q), safeAdd$1(x, t)), s), b);
  }

  function md5ff(a, b, c, d, x, s, t) {
    return md5cmn(b & c | ~b & d, a, b, x, s, t);
  }

  function md5gg(a, b, c, d, x, s, t) {
    return md5cmn(b & d | c & ~d, a, b, x, s, t);
  }

  function md5hh(a, b, c, d, x, s, t) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function md5ii(a, b, c, d, x, s, t) {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  function binlMD5(x, len) {
    x[len >> 5] |= 0x80 << len % 32;
    x[(len + 64 >>> 9 << 4) + 14] = len;
    var i;
    var olda;
    var oldb;
    var oldc;
    var oldd;
    var a = 1732584193;
    var b = -271733879;
    var c = -1732584194;
    var d = 271733878;

    for (i = 0; i < x.length; i += 16) {
      olda = a;
      oldb = b;
      oldc = c;
      oldd = d;
      a = md5ff(a, b, c, d, x[i], 7, -680876936);
      d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
      c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
      b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
      a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
      d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
      c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
      b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
      a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
      d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
      c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
      b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
      a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
      d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
      c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
      b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
      a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
      d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
      c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
      b = md5gg(b, c, d, a, x[i], 20, -373897302);
      a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
      d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
      c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
      b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
      a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
      d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
      c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
      b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
      a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
      d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
      c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
      b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
      a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
      d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
      c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
      b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
      a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
      d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
      c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
      b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
      a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
      d = md5hh(d, a, b, c, x[i], 11, -358537222);
      c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
      b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
      a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
      d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
      c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
      b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
      a = md5ii(a, b, c, d, x[i], 6, -198630844);
      d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
      c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
      b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
      a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
      d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
      c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
      b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
      a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
      d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
      c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
      b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
      a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
      d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
      c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
      b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
      a = safeAdd$1(a, olda);
      b = safeAdd$1(b, oldb);
      c = safeAdd$1(c, oldc);
      d = safeAdd$1(d, oldd);
    }

    return [a, b, c, d];
  }

  function binl2rstr(input) {
    var length32 = input.length * 32;
    var output = '';

    for (var i = 0; i < length32; i += 8) {
      output += String.fromCharCode(input[i >> 5] >>> i % 32 & 0xff);
    }

    return output;
  }

  function rstr2binl(input) {
    input = ensureBuffer$1(input);
    var i;
    var output = [];
    output[(input.length >> 2) - 1] = undefined;

    for (i = 0; i < output.length; i += 1) {
      output[i] = 0;
    }

    var length8 = input.length * 8;

    for (i = 0; i < length8; i += 8) {
      output[i >> 5] |= (input[i / 8] & 0xff) << i % 32;
    }

    return output;
  }

  function rstrMD5(s) {
    return binl2rstr(binlMD5(rstr2binl(s), byteLength$1(s) * 8));
  }

  function rstrHMACMD5(key, data) {
    var i;
    var bkey = rstr2binl(key);
    var ipad = [];
    var opad = [];
    ipad[15] = opad[15] = undefined;

    if (bkey.length > 16) {
      bkey = binlMD5(bkey, key.length * 8);
    }

    for (i = 0; i < 16; i += 1) {
      ipad[i] = bkey[i] ^ 0x36363636;
      opad[i] = bkey[i] ^ 0x5c5c5c5c;
    }

    var hash = binlMD5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
    return binl2rstr(binlMD5(opad.concat(hash), 512 + 128));
  }

  function rstr2hex(input) {
    var chars = HEX_CHARS$1;
    var output = '';

    for (var i = 0, x; i < input.length; i += 1) {
      x = input.charCodeAt(i);
      output += chars[x >>> 4 & 0x0f] + chars[x & 0x0f];
    }

    return output;
  }

  function rawMD5(s) {
    return rstrMD5(s);
  }

  function hexMD5(s) {
    return rstr2hex(rawMD5(s));
  }

  function rawHMACMD5(k, d) {
    return rstrHMACMD5(k, d);
  }

  function hexHMACMD5(k, d) {
    return rstr2hex(rawHMACMD5(k, d));
  }

  function md5(string, key, raw) {
    if (!key) {
      if (!raw) {
        return hexMD5(string);
      }

      return rawMD5(string);
    }

    if (!raw) {
      return hexHMACMD5(key, string);
    }

    return rawHMACMD5(key, string);
  }

  (function (Events) {
    Events["SegmentLoaded"] = "segment-loaded";
    Events["SegmentError"] = "segment-error";
    Events["SegmentAbort"] = "segment-abort";
    Events["SegmentTimeout"] = "segment-timeout";
    Events["PeerConnect"] = "peer-connect";
    Events["PeerClose"] = "peer-close";
    Events["PieceBytesLoaded"] = "piece-bytes-loaded";
    Events["PieceBytesUploaded"] = "piece-bytes-uploaded";
  })(exports.Events || (exports.Events = {}));

  var Segment = function () {
    function Segment(id, url, priority, range, data, downloadSpeed) {
      this.id = id;
      this.url = url;
      this.priority = priority;
      this.range = range;
      this.data = data;
      this.downloadSpeed = downloadSpeed;
      this.sn = +id.split('+')[1];
    }

    var _a = Segment;

    _a.new = function (id, url, priority, range, data, speed) {
      if (url === void 0) {
        url = '';
      }

      if (speed === void 0) {
        speed = 0;
      }

      if (id && typeof id === 'object') {
        var seg = id;
        id = seg.id;
        url = seg.url || url;
        priority = priority === undefined ? seg.priority : priority;
        range = seg.range || range;
        data = seg.data || data;
        speed = seg.downloadSpeed || speed;
      }

      if (priority === undefined) {
        priority = 0;
      }

      return new Segment(id, url, priority, range, data, speed);
    };

    return Segment;
  }();

  var SegmentStatus;

  (function (SegmentStatus) {
    SegmentStatus[SegmentStatus["Loaded"] = 0] = "Loaded";
    SegmentStatus[SegmentStatus["LoadingByHttp"] = 1] = "LoadingByHttp";
  })(SegmentStatus || (SegmentStatus = {}));

  var LoaderStatus;

  (function (LoaderStatus) {
    LoaderStatus[LoaderStatus["NULL"] = 0] = "NULL";
    LoaderStatus[LoaderStatus["LOADING"] = 1] = "LOADING";
    LoaderStatus[LoaderStatus["ABORT"] = 2] = "ABORT";
  })(LoaderStatus || (LoaderStatus = {}));
  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.

  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** */

  /* global Reflect, Promise */


  var extendStatics$1 = function (d, b$$1) {
    extendStatics$1 = Object.setPrototypeOf || {
      __proto__: []
    } instanceof Array && function (d, b$$1) {
      d.__proto__ = b$$1;
    } || function (d, b$$1) {
      for (var p$$1 in b$$1) {
        if (b$$1.hasOwnProperty(p$$1)) d[p$$1] = b$$1[p$$1];
      }
    };

    return extendStatics$1(d, b$$1);
  };

  function __extends$1(d, b$$1) {
    extendStatics$1(d, b$$1);

    function __() {
      this.constructor = d;
    }

    d.prototype = b$$1 === null ? Object.create(b$$1) : (__.prototype = b$$1.prototype, new __());
  }

  var __assign$1 = function () {
    __assign$1 = Object.assign || function __assign(t) {
      for (var s, i$$1 = 1, n = arguments.length; i$$1 < n; i$$1++) {
        s = arguments[i$$1];

        for (var p$$1 in s) {
          if (Object.prototype.hasOwnProperty.call(s, p$$1)) t[p$$1] = s[p$$1];
        }
      }

      return t;
    };

    return __assign$1.apply(this, arguments);
  };

  function __decorate$1(decorators, target, key, desc) {
    var c$$1 = arguments.length,
        r = c$$1 < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
        d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i$$1 = decorators.length - 1; i$$1 >= 0; i$$1--) {
      if (d = decorators[i$$1]) r = (c$$1 < 3 ? d(r) : c$$1 > 3 ? d(target, key, r) : d(target, key)) || r;
    }
    return c$$1 > 3 && r && Object.defineProperty(target, key, r), r;
  }
  var debounce$1 = E(C);
  var LoaderCallbacks = {
    0: 'onSuccess',
    1: 'onAbort',
    2: 'onError'
  };
  var ESegmentLoaderState;

  (function (ESegmentLoaderState) {
    ESegmentLoaderState[ESegmentLoaderState["Loaded"] = 0] = "Loaded";
    ESegmentLoaderState[ESegmentLoaderState["Abort"] = 1] = "Abort";
    ESegmentLoaderState[ESegmentLoaderState["Error"] = 2] = "Error";
  })(ESegmentLoaderState || (ESegmentLoaderState = {}));

  var LoadEntryChainMap = new CompositeKeyWeakMap();

  var BaseLoaderEntry = function () {
    function BaseLoaderEntry(segment, ctx, _cbs) {
      if (ctx === void 0) {
        ctx = {};
      }

      if (_cbs === void 0) {
        _cbs = {};
      }

      this.segment = segment;
      this.ctx = ctx;
      this._cbs = _cbs;
      this._pr = A();
      this.stats = {
        trequest: performance.now(),
        retry: 0
      };
    }

    var _a = BaseLoaderEntry.prototype;

    _a.call = function (state, args) {
      var method = LoaderCallbacks[state];
      var fns = this._cbs;
      var f$$1 = fns && fns[method];

      if (f$$1) {
        S(function () {
          return f$$1.apply(null, args || []);
        });
      }

      return this;
    };

    _a.resolve = function (res) {
      var _this = this;

      S(function () {
        return _this._pr && _this._pr.resolve(res);
      });
      return this._pr;
    };

    _a.reject = function (err) {
      var _this = this;

      S(function () {
        return _this._pr && _this._pr.reject(err);
      });
      return this._pr;
    };

    _a.then = function (onfulfilled, onrejected) {
      return this._pr.then(onfulfilled, onrejected);
    };

    _a.catch = function (reject) {
      return this._pr.catch(reject);
    };

    _a.destroy = function () {
      var _this = this;

      if (!this._pr) {
        return;
      }

      this._pr.destroy();

      Object.keys(this).forEach(function (k) {
        return delete _this[k];
      });
    };

    return BaseLoaderEntry;
  }();

  function handleEvent(type, segment) {
    var xargs = [].slice.call(arguments, 2);

    switch (type) {
      case exports.Events.SegmentLoaded:
        this.onLoaded(segment);
        break;

      case exports.Events.SegmentError:
      case exports.Events.SegmentTimeout:
        this.onError(segment, xargs[0]);
        break;

      case exports.Events.SegmentAbort:
        this.onAbort(segment);
        break;
    }
  }

  var AbstractLoader = function (_super) {
    __extends$1(AbstractLoader, _super);

    function AbstractLoader() {
      var _this = _super.call(this) || this;

      var events = [exports.Events.SegmentLoaded, exports.Events.SegmentError, exports.Events.SegmentAbort, exports.Events.SegmentTimeout];
      events.forEach(function (t) {
        return _this.on(t, handleEvent.bind(_this, t));
      });

      _this.on('queue/set', function (k, v$$1) {
        return LoadEntryChainMap.set([_this, k], v$$1);
      });

      return _this;
    }

    var _b = AbstractLoader.prototype;

    _b.onLoaded = function (segment) {
      var _this = this;

      this.call(ESegmentLoaderState.Loaded, segment, [segment], function () {
        _this.done(segment, ESegmentLoaderState.Loaded);
      });
    };

    _b.onError = function (segment, err) {
      var _this = this;

      if (typeof err === 'string') {
        err = new Error(err);
      }

      err = err || B('Unexpected error.');
      var args = [err];
      this.call(ESegmentLoaderState.Error, segment, args, function () {
        _this.done(segment, ESegmentLoaderState.Error, args);
      });
    };

    _b.onAbort = function (segment) {
      var _this = this;

      var err = B("Loading aborted.", LoaderStatus.ABORT);
      this.call(ESegmentLoaderState.Abort, segment, [err], function () {
        _this.done(segment, ESegmentLoaderState.Abort);
      });
    };

    _b.isLoading = function (segment) {
      return this.has(segment.id);
    };

    _b.call = function (state, segment, args, callback) {
      var entry = LoadEntryChainMap.get([this, segment.id]);

      if (entry) {
        var err = void 0;

        if (state === ESegmentLoaderState.Loaded) {
          entry.resolve(args);
        } else {
          err = args[0] || B('load error', 500);
          entry.reject(err);
        }

        callback(err);
        entry.call(state, args);
        S(function () {
          return entry.destroy();
        });
      } else {
        callback(new Error('Invalid load triggered'));
      }
    };

    _b.onComplete = function (segment, state, args) {};

    _b.done = function (segment, state, args) {
      var id = segment.id;
      this.delete(id);
      LoadEntryChainMap.delete([this, id]);
      this.onComplete(segment, state, args);
    };

    return AbstractLoader;
  }(g);

  var debug$7 = browser$1('p2pcore:http-loader');

  var XHRSegmentRequest = function (_super) {
    __extends$1(XHRSegmentRequest, _super);

    function XHRSegmentRequest(xhr, segment, ctx, callbacks) {
      if (ctx === void 0) {
        ctx = {};
      }

      if (callbacks === void 0) {
        callbacks = {};
      }

      var _this = _super.call(this, segment, ctx, callbacks) || this;

      _this.xhr = xhr;
      return _this;
    }

    var _a = XHRSegmentRequest.prototype;

    _a.abort = function () {
      if (this.xhr) {
        this.xhr.abort();
      }
    };

    _a.destroy = function () {
      this.xhr.destroy();
      this.xhr = null;

      _super.prototype.destroy.call(this);
    };

    return XHRSegmentRequest;
  }(BaseLoaderEntry);

  var LoaderHttpImpl = function (_super) {
    __extends$1(LoaderHttpImpl, _super);

    function LoaderHttpImpl(settings) {
      var _this = _super.call(this) || this;

      _this.settings = settings;

      if (!settings.xhrLoader) {
        throw new Error('XHR loader not implement yet.');
      }

      return _this;
    }

    var _b = LoaderHttpImpl.prototype;

    _b.load = function (segment, ctx, callbacks) {
      var _this = this;

      if (this.isLoading(segment)) {
        return Promise.reject(1);
      }

      var url = segment.url;
      debug$7('>>>> %s', url);
      var xhr = new this.settings.xhrLoader();
      var request = new XHRSegmentRequest(xhr, segment, ctx, callbacks);
      var loaderContext = {
        url: url,
        responseType: 'arraybuffer'
      };
      var loaderConfig = {
        timeout: 15000,
        maxRetry: 1,
        retryDelay: 0,
        maxRetryDelay: 45000
      };
      var prevBytesLoaded = 0;
      xhr.load(loaderContext, loaderConfig, {
        onError: function (_a, context, xhr) {
          var code = _a.code,
              text = _a.text;
          var err = B(text, code);

          _this.delete(segment.id);

          _this.emit('segment-error', segment, err);
        },
        onTimeout: function (_a, context, xhr) {
          var code = _a.code,
              text = _a.text;
          var err = B(text, code);

          _this.delete(segment.id);

          _this.emit('segment-timeout', segment, err);
        },
        onProgress: function (stats, context, data, xhr) {
          var loaded = stats.loaded;
          var bytesLoaded = loaded - prevBytesLoaded;

          _this.emit('bytes-loaded', bytesLoaded, segment);

          prevBytesLoaded = loaded;
        },
        onSuccess: function (_a, stats, context, xhr) {
          var data = _a.data,
              url = _a.url;
          segment.data = data;

          _this.emit('segment-loaded', segment);
        }
      });
      this.set(segment.id, request);
      return request.then(null);
    };

    _b.abort = function (segment) {
      var id = segment.id;
      var item = this.get(id);

      if (item) {
        debug$7('http segment abort', id);
        item.abort();
        this.emit('segment-abort', segment);
        this.delete(id);
      }
    };

    _b.destroy = function () {
      this.forEach(function (o) {
        return o && o.destroy();
      });
      this.clear();
    };

    return LoaderHttpImpl;
  }(AbstractLoader);

  var setTimeout$1 = window.setTimeout,
      clearTimeout$1 = window.clearTimeout;
  var debug$1$1 = browser$1('p2pcore:transfer-peer');

  function tryParseJSONBuffer(data) {
    var bytes = new Uint8Array(data);

    if (bytes[0] === 0x7b && bytes[1] === 0x22 && bytes[data.byteLength - 1] === 0x7d) {
      try {
        return JSON.parse(new TextDecoder('utf-8').decode(data));
      } catch (_a) {}
    }

    return null;
  }

  function detectSafari11_0() {
    var userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    var isSafari = userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1;

    if (isSafari) {
      var match = userAgent.match(/version\/(\d+(\.\d+)?)/i);
      var version = match && match.length > 1 && match[1] || '';

      if (version === '11.0') {
        return true;
      }
    }

    return false;
  }

  var EPeerCommand;

  (function (EPeerCommand) {
    EPeerCommand[EPeerCommand["REQUEST"] = 0] = "REQUEST";
    EPeerCommand[EPeerCommand["HEADERS"] = 1] = "HEADERS";
    EPeerCommand[EPeerCommand["LOST"] = 2] = "LOST";
    EPeerCommand[EPeerCommand["INDEXES"] = 3] = "INDEXES";
    EPeerCommand[EPeerCommand["ABORT"] = 4] = "ABORT";
  })(EPeerCommand || (EPeerCommand = {}));

  var getCommandName = function (c$$1) {
    return (EPeerCommand[c$$1] || c$$1 + '').toLowerCase();
  };

  var PeerStream = function () {
    function PeerStream(id, _a) {
      var length = _a.length;
      this.id = id;
      this.bytesLoaded = 0;
      this.length = length;
      this.pieces = new Uint8Array(length);
      this.buffer = this.pieces.buffer;
    }

    var _a = PeerStream.prototype;

    _a.write = function (chunk) {
      this.pieces.set(new Uint8Array(chunk), this.bytesLoaded);
      this.bytesLoaded += chunk.byteLength;
    };

    return PeerStream;
  }();

  var IS_SAFARI11_0 = detectSafari11_0();

  var TransferPeer = function (_super) {
    __extends$1(TransferPeer, _super);

    function TransferPeer(peer, settings) {
      var _this = _super.call(this) || this;

      _this.peer = peer;
      _this.settings = settings;
      _this.remoteAddress = '';
      _this.remotePort = -1;
      _this.remoteFamily = '';
      _this._sid = '';
      _this._indexes = new Map();
      _this._ex = null;
      peer.on('connect', function () {
        return _this.onConnect();
      });
      peer.on('close', function () {
        return _this.onClose();
      });
      peer.on('error', function (error) {
        return _this.onError(error);
      });
      peer.on('data', function (data) {
        return _this.onData(data);
      });
      _this.id = peer.id;
      return _this;
    }

    var _b = TransferPeer.prototype;
    Object.defineProperty(_b, "isIdle", {
      get: function () {
        return !this._sid;
      },
      enumerable: true,
      configurable: true
    });

    _b.address = function () {
      return this.peer.address();
    };

    _b.destroy = function () {
      debug$1$1('peer destroy', this.id, this);
      this.terminateRequest();
      this.peer.destroy();
      this.peer.removeAllListeners();
      this.removeAllListeners();
    };

    _b.hasIndex = function (id) {
      return this._indexes.get(id) === SegmentStatus.Loaded;
    };

    _b.getIndexes = function () {
      return this._indexes;
    };

    _b.sendIndexes = function (indexes) {
      this.send(EPeerCommand.INDEXES, {
        indexes: indexes
      });
    };

    _b.sendBuffer = function (id, data) {
      var _this = this;

      if (!data) {
        this.sendAbsent(id);
        return;
      }

      var length = data.byteLength;
      debug$1$1('start to send buffer with of "%s" to peer:%s ...', id, this.id);
      this.send(EPeerCommand.HEADERS, {
        sid: id,
        length: length
      });
      var webRtcMaxMessageSize = this.settings.webRtcMaxMessageSize;
      var bytesLeft = length;

      var next = function (cb) {
        if (bytesLeft <= 0) {
          cb(null);
          return;
        }

        var bytesToSend = bytesLeft >= webRtcMaxMessageSize ? webRtcMaxMessageSize : bytesLeft;
        var buffer = IS_SAFARI11_0 ? Buffer.from(data.slice(data.byteLength - bytesLeft, data.byteLength - bytesLeft + bytesToSend)) : Buffer.from(data, data.byteLength - bytesLeft, bytesToSend);

        if (_this.peer.isPaused()) {
          return;
        }

        _this.peer.write(buffer);

        bytesLeft -= bytesToSend;
        S(function () {
          return next(cb);
        });
      };

      next(function () {
        debug$1$1('buffer send completed. (id: %s, length: %s)', id, length);

        _this.emit('bytes-uploaded', length);
      });
    };

    _b.sendAbsent = function (id) {
      this.send(EPeerCommand.LOST, {
        sid: id
      });
    };

    _b.requestData = function (id, ctx) {
      if (this._sid) {
        throw new Error('A segment is already downloading: ' + this._sid);
      }

      this._sid = id;
      this._ctx = __assign$1({}, ctx);
      this.send(EPeerCommand.REQUEST, {
        sid: id
      });
      this.setEx();
    };

    _b.cancelRequest = function () {
      var sid = this._sid;

      if (sid) {
        this.terminateRequest();
        this.send(EPeerCommand.ABORT, {
          sid: sid
        });
      }
    };

    _b.onConnect = function () {
      debug$1$1('peer connect', this.id, this);
      Object.assign(this, D(this.peer, ['remoteFamily', 'remoteAddress', 'remotePort']));
      this.emit('connect', this);
    };

    _b.error = function (id, e$$1) {
      if (!id) {
        return;
      }

      var message = typeof e$$1 === 'string' ? e$$1 : e$$1.message;
      this.emit('segment-error', this, id, message);
    };

    _b.onClose = function () {
      debug$1$1('peer close', this.id, this);
      this.emit('close', this);

      if (!this.isIdle) {
        this.terminateRequest();
      }
    };

    _b.onError = function (e$$1) {
      debug$1$1('peer error', this.id, e$$1, this);
      var id = this._sid;

      if (!this.isIdle) {
        this.cancelRequest();
        this.error(id, e$$1.message);
      }
    };

    _b.recvDataPiece = function (data) {
      var st = this._st;

      if (!st) {
        debug$1$1('Illegal data received. segment was not requested or aborted');
        return;
      }

      st.write(data);
      this.emit('bytes-loaded', data.byteLength);
      var sid = st.id,
          bytesLoaded = st.bytesLoaded,
          length = st.length;

      if (bytesLoaded === length) {
        debug$1$1('peer segment pieces recv completed (%s)', sid);
        var buffer = st.buffer;

        if (!this.checkSig(buffer)) {
          debug$1$1('segment pieces integrity checksum failed (%s)', sid, this);
          this.error(sid, 'Checksum failed');
        } else {
          this.emit('segment-loaded', this, sid, buffer);
        }

        this.terminateRequest();
      } else if (bytesLoaded > length) {
        debug$1$1('peer segment pieces length mismatch (%s)', sid, this);
        this.terminateRequest();
        this.error(sid, 'Too many bytes received for segment');
      } else {
        this.setEx(1 - bytesLoaded / length);
      }
    };

    _b.onData = function (data) {
      var command = tryParseJSONBuffer(data);

      if (command == null) {
        this.recvDataPiece(data);
        return;
      }

      if (this._st) {
        debug$1$1('peer segment load is interrupted by a command');
        var sid_1 = this._st.id;
        this.terminateRequest();
        this.error(sid_1, 'Segment load is interrupted by a command');
        return;
      }

      var cmd = command.cmd,
          payload = command.data;
      var sid = payload.sid;
      debug$1$1('<<< received command `%s` from peer:%s.', getCommandName(cmd), this.id, payload);

      switch (cmd) {
        case EPeerCommand.INDEXES:
          this._indexes = new Map(payload.indexes);
          this.emit('data-updated', this._indexes);
          break;

        case EPeerCommand.REQUEST:
          this.emit('segment-request', this, sid);
          break;

        case EPeerCommand.HEADERS:
          if (this._sid === sid) {
            this._st = new PeerStream(sid, payload);
            this.setEx(0.8);
          }

          break;

        case EPeerCommand.LOST:
          if (this._sid === sid) {
            this.terminateRequest();

            this._indexes.delete(sid);

            this.emit('segment-absent', this, sid);
          }

          break;

        case EPeerCommand.ABORT:
          debug$1$1('request canceled, terminate transporting');
          this.peer.pause();
          break;

        default:
          break;
      }
    };

    _b.resume = function () {
      var p$$1 = this.peer;

      if (p$$1.isPaused()) {
        p$$1.resume();
      }
    };

    _b.send = function (cmd, data) {
      debug$1$1('>>> send command `%s` to peer:%s', getCommandName(cmd), this.id, data);
      this.resume();
      this.peer.write(JSON.stringify({
        cmd: cmd,
        data: data
      }));
    };

    _b.checkSig = function (buf) {
      var checksum$$1 = this._ctx.checksum;
      return checksum$$1 ? checksum$$1(buf) : true;
    };

    _b.setEx = function (scale) {
      var _this = this;

      if (scale === void 0) {
        scale = 1;
      }

      this.clearEx();
      return this._ex = setTimeout$1(function () {
        var id = _this._sid;
        _this._ex = null;

        if (!id) {
          return;
        }

        debug$1$1('peer stream timeout. (%s)', id);

        _this.cancelRequest();

        _this.emit('segment-timeout', _this, id);
      }, Math.max(this.settings.p2pLoadTimeout * scale, 10));
    };

    _b.clearEx = function () {
      if (this._ex) {
        clearTimeout$1(this._ex);
        this._ex = null;
      }
    };

    _b.terminateRequest = function () {
      if (!this._sid) return;
      this.clearEx();
      this._sid = '';
      this._ctx = undefined;
      this._st = undefined;
    };

    return TransferPeer;
  }(b);

  var MAX_PEER_NUMBER = 5;
  var PEER_PROTOCOL_VERSION = 1;
  var debug$2$1 = browser$1('p2pcore:p2p-loader');

  var PeerSegmentRequest = function (_super) {
    __extends$1(PeerSegmentRequest, _super);

    function PeerSegmentRequest(peerId, segment, ctx, callbacks) {
      if (ctx === void 0) {
        ctx = {};
      }

      if (callbacks === void 0) {
        callbacks = {};
      }

      var _this = _super.call(this, segment, ctx, callbacks) || this;

      _this.peerId = peerId;
      return _this;
    }

    return PeerSegmentRequest;
  }(BaseLoaderEntry);

  var LoaderP2PImpl = function (_super) {
    __extends$1(LoaderP2PImpl, _super);

    function LoaderP2PImpl(cache, settings) {
      var _this = _super.call(this) || this;

      _this.cache = cache;
      _this.settings = settings;
      _this.tracker = null;
      _this.peers = new Map();
      _this.candidates = new Map();
      _this.swarmId = null;

      _this.onPieceBytesLoaded = function (bytes) {
        _this.emit('bytes-loaded', bytes);
      };

      _this.onPieceBytesUploaded = function (bytes) {
        _this.emit('bytes-uploaded', bytes);
      };

      _this.onPeerConnect = function (peer) {
        var connectedPeer = _this.peers.get(peer.id);

        if (connectedPeer) {
          debug$2$1('tracker peer already connected (in peer connect)', peer.id, peer);
          peer.destroy();
          return;
        }

        _this.peers.set(peer.id, peer);

        var candidatesById = _this.candidates.get(peer.id);

        if (candidatesById) {
          for (var _i = 0, candidatesById_1 = candidatesById; _i < candidatesById_1.length; _i++) {
            var peerCandidate = candidatesById_1[_i];

            if (peerCandidate !== peer) {
              peerCandidate.destroy();
            }
          }

          _this.candidates.delete(peer.id);
        }

        _this.emit('peer-connected', D(peer, ['id', 'remoteFamily', 'remoteAddress', 'remotePort']));
      };

      _this.onPeerClose = function (peer) {
        if (_this.peers.get(peer.id) !== peer) {
          var candidatesById = _this.candidates.get(peer.id);

          if (!candidatesById) {
            return;
          }

          var index = candidatesById.indexOf(peer);

          if (index !== -1) {
            candidatesById.splice(index, 1);
          }

          if (candidatesById.length === 0) {
            _this.candidates.delete(peer.id);
          }

          return;
        }

        _this.forEach(function (req, id) {
          if (req.peerId === peer.id) {
            _this.abort(req.segment);
          }
        });

        _this.peers.delete(peer.id);

        _this.emit('peer-data-updated');

        _this.emit('peer-closed', peer.id);
      };

      _this.onPeerDataUpdated = function (indexes) {
        _this.emit('peer-data-updated');
      };

      _this.onSegmentRequest = function (peer, segmentId) {
        var segment = _this.cache.get(segmentId);

        if (segment) {
          debug$2$1('serve segment:%s to peer:%s', segmentId, peer.id);
          peer.sendBuffer(segmentId, segment.data);
        } else {
          peer.sendAbsent(segmentId);
        }
      };

      _this.onSegmentLoaded = function (peer, segmentId, data) {
        var req = _this.get(segmentId);

        if (req) {
          var segment = req.segment;
          segment.data = data;

          _this.delete(segmentId);

          _this.emit('segment-loaded', segment);
        }
      };

      _this.onSegmentAbsent = function (peer, segmentId) {
        var req = _this.get(segmentId);

        if (req) {
          _this.abort(req.segment);

          _this.emit('peer-data-updated');
        }
      };

      _this.onSegmentError = function (peer, segmentId, description) {
        var req = _this.get(segmentId);

        if (req) {
          _this.delete(segmentId);

          _this.emit('segment-error', req.segment, description);
        }
      };

      _this.onSegmentTimeout = function (peer, segmentId) {
        var req = _this.get(segmentId);

        if (req) {
          _this.delete(segmentId);

          _this.emit('segment-timeout', req.segment);

          peer.destroy();

          if (_this.peers.delete(req.peerId)) {
            _this.emit('peer-data-updated');
          }
        }
      };

      _this.peerId = x((Date.now() + Math.random()).toFixed(12));
      debug$2$1('peer ID', _this.peerId);
      return _this;
    }

    var _a = LoaderP2PImpl.prototype;

    _a.setSwarmId = function (swarmId) {
      if (this.swarmId === swarmId) {
        return;
      }

      this.destroy();
      this.swarmId = swarmId;
      debug$2$1('swarm ID', this.swarmId);
      this.createClient(x(PEER_PROTOCOL_VERSION + "|" + this.swarmId));
    };

    _a.isFull = function () {
      return this.size === this.settings.simultaneousP2PLoads;
    };

    _a.load = function (segment, ctx, callbacks) {
      var _a = this,
          peers = _a.peers,
          getFPSig = _a.settings.getFPSig;

      if (!peers.size) {
        return Promise.reject(B('no available peer.', LoaderStatus.NULL));
      } else if (this.isLoading(segment)) {
        return Promise.resolve(LoaderStatus.LOADING);
      }

      var checksum$$1 = function (data) {
        var md5sum = getFPSig && s$1(getFPSig) && getFPSig(segment);
        var ret = md5sum ? md5sum.toLowerCase() === md5(data) : true;
        debug$2$1('compute and check md5sum of segment "%s" => %s (md5:%s)', segment.id, ret ? 'OK' : 'FAILED', md5sum || 'nil');
        return ret;
      };

      var id = segment.id;

      for (var _i = 0, _b = Array.from(peers.values()); _i < _b.length; _i++) {
        var peer = _b[_i];

        if (peer.isIdle && peer.hasIndex(id)) {
          debug$2$1('>>>> %s', id);
          var request = new PeerSegmentRequest(peer.id, segment, ctx, callbacks);
          this.set(id, request);
          peer.requestData(id, {
            checksum: checksum$$1
          });
          return request.then(null);
        }
      }

      return Promise.reject(B('no available peer', LoaderStatus.NULL));
    };

    _a.abort = function (segment) {
      var id = segment.id;
      var req = this.get(id);

      if (req) {
        debug$2$1('p2p segment abort', id);
        var peer = this.peers.get(req.peerId);

        if (peer) {
          peer.cancelRequest();
        }

        this.delete(id);
        this.emit('segment-abort', segment);
      }
    };

    _a.destroy = function () {
      this.swarmId = null;

      if (this.tracker) {
        this.tracker.stop();
        this.tracker.destroy();
        this.tracker = null;
      }

      this.peers.forEach(function (peer) {
        return peer.destroy();
      });
      this.peers.clear();
      this.clear();
      this.candidates.forEach(function (peerCandidateById) {
        for (var _i = 0, peerCandidateById_1 = peerCandidateById; _i < peerCandidateById_1.length; _i++) {
          var peerCandidate = peerCandidateById_1[_i];
          peerCandidate.destroy();
        }
      });
      this.candidates.clear();
    };

    _a.setIndexes = function (indexes, peerId) {
      if (peerId) {
        var p$$1 = this.peers.get(peerId);
        if (p$$1) p$$1.sendIndexes(indexes);
      } else {
        this.peers.forEach(function (p$$1) {
          return p$$1.sendIndexes(indexes);
        });
      }
    };

    _a.getOvrallSegmentsMap = function () {
      var indexes = new Map();
      this.peers.forEach(function (p$$1) {
        return p$$1.getIndexes().forEach(function (status, segmentId) {
          if (status === SegmentStatus.Loaded) {
            indexes.set(segmentId, SegmentStatus.Loaded);
          } else if (!indexes.get(segmentId)) {
            indexes.set(segmentId, SegmentStatus.LoadingByHttp);
          }
        });
      });
      return indexes;
    };

    _a.createClient = function (infoHash) {
      var _this = this;

      var _a = this.settings,
          useP2P = _a.useP2P,
          trackerAnnounce = _a.trackerAnnounce,
          _b = _a.maxPeerNumber,
          maxPeerNumber = _b === void 0 ? MAX_PEER_NUMBER : _b,
          rtcConfig = _a.rtcConfig;

      if (!useP2P) {
        return;
      }

      var getAnnounceOpts = function () {
        return {
          numwant: Math.max(maxPeerNumber - _this.peers.size, 0)
        };
      };

      var opts = {
        infoHash: infoHash,
        peerId: this.peerId,
        announce: trackerAnnounce,
        getAnnounceOpts: getAnnounceOpts,
        rtcConfig: rtcConfig
      };
      var trackerClient = new lib(opts);
      trackerClient.on('error', function (error) {
        return debug$2$1('tracker error', error);
      });
      trackerClient.on('warning', function (error) {
        return debug$2$1('tracker warning', error);
      });
      trackerClient.on('update', function (data) {
        return debug$2$1('tracker update', data);
      });
      trackerClient.on('peer', this.onTrackerPeer.bind(this));
      trackerClient.start();
      this.tracker = trackerClient;
    };

    _a.onTrackerPeer = function (trackerPeer) {
      debug$2$1('tracker peer %s', trackerPeer.id, trackerPeer);

      if (this.peers.has(trackerPeer.id)) {
        debug$2$1('tracker peer %s already connected', trackerPeer.id);
        trackerPeer.destroy();
        return;
      }

      var peer = new TransferPeer(trackerPeer, this.settings);
      peer.on('connect', this.onPeerConnect);
      peer.on('close', this.onPeerClose);
      peer.on('data-updated', this.onPeerDataUpdated);
      peer.on('segment-request', this.onSegmentRequest);
      peer.on('segment-loaded', this.onSegmentLoaded);
      peer.on('segment-absent', this.onSegmentAbsent);
      peer.on('segment-error', this.onSegmentError);
      peer.on('segment-timeout', this.onSegmentTimeout);
      peer.on('bytes-loaded', this.onPieceBytesLoaded);
      peer.on('bytes-uploaded', this.onPieceBytesUploaded);
      var candidatesById = this.candidates.get(peer.id);

      if (!candidatesById) {
        candidatesById = [];
        this.candidates.set(peer.id, candidatesById);
      }

      candidatesById.push(peer);
    };

    __decorate$1([debounce$1(500)], LoaderP2PImpl.prototype, "setIndexes", null);

    return LoaderP2PImpl;
  }(AbstractLoader);

  var SMOOTH_INTERVAL = 4 * 1000;
  var MEASURE_INTERVAL = 15 * 1000;

  var NumberWithTime = function () {
    function NumberWithTime(value, timeStamp) {
      this.value = value;
      this.timeStamp = timeStamp;
    }

    return NumberWithTime;
  }();

  var SpeedApproximator = function () {
    function SpeedApproximator() {
      this.lastBytes = [];
      this.currentBytesSum = 0;
      this.last = [];
    }

    var _a = SpeedApproximator.prototype;

    _a.addBytes = function (bytes, timeStamp) {
      var lastBytes = this.lastBytes;
      lastBytes.push(new NumberWithTime(bytes, timeStamp));
      this.currentBytesSum += bytes;

      while (timeStamp - lastBytes[0].timeStamp > SMOOTH_INTERVAL) {
        this.currentBytesSum -= lastBytes.shift().value;
      }

      this.last.push(new NumberWithTime(this.currentBytesSum / SMOOTH_INTERVAL, timeStamp));
    };

    _a.getSpeed = function (timeStamp) {
      var lastSpeed = this.last;

      while (lastSpeed.length !== 0 && timeStamp - lastSpeed[0].timeStamp > MEASURE_INTERVAL) {
        lastSpeed.shift();
      }

      return lastSpeed.reduce(function (max, _a) {
        var value = _a.value;
        return max > value ? max : value;
      }, 0);
    };

    _a.getSmoothInterval = function () {
      return SMOOTH_INTERVAL;
    };

    _a.getMeasureInterval = function () {
      return MEASURE_INTERVAL;
    };

    return SpeedApproximator;
  }();

  var values = Object.values;
  var debug$3$1 = browser$1('p2pcore:schedule-loader');
  var defaultSettings = {
    loadConcurrentSize: 6,
    cacheAge: 60 * 60 * 1000,
    cacheSize: '1gb',
    requiredSegmentsPriority: 1,
    httpLoadProbability: 0.04,
    httpLoadProbabilityInterval: 500,
    bufferedSegmentsCount: 20,
    useP2P: true,
    simultaneousP2PLoads: 3,
    webRtcMaxMessageSize: 64 * 1024 - 1,
    p2pLoadTimeout: 30000,
    maxPeerNumber: 5,
    trackerAnnounce: ['wss://tracker.btorrent.xyz/'],
    rtcConfig: {
      iceServers: [{
        urls: 'stun:stun.voxox.com'
      }, {
        urls: 'stun:global.stun.twilio.com:3478?transport=udp'
      }]
    }
  };

  var byteLength$2 = function (s) {
    return s && (s.byteLength || s.length) || 0;
  };

  var SegmentScheduler = function (_super) {
    __extends$1(SegmentScheduler, _super);

    function SegmentScheduler(settings) {
      if (settings === void 0) {
        settings = {};
      }

      var _this = _super.call(this) || this;

      _this._speedApproximator = new SpeedApproximator();
      _this._preSeq = [];
      _this._httpPTS = -999999;

      _this.onPieceBytesLoaded = function (method, bytes) {
        _this._speedApproximator.addBytes(bytes, N());

        _this.emit(exports.Events.PieceBytesLoaded, method, bytes);
      };

      _this.onPieceBytesUploaded = function (method, bytes) {
        _this._speedApproximator.addBytes(bytes, N());

        _this.emit(exports.Events.PieceBytesUploaded, method, bytes);
      };

      _this.onSegmentLoaded = function (method, segment) {
        var id = segment.id;
        var data = segment.data.slice(0);
        debug$3$1('segment loaded: %s (method: "%s", size: %d)', id, method, data.byteLength);
        segment.downloadSpeed = _this._speedApproximator.getSpeed(N());

        _this._cache.set(segment.id, segment);

        _this.emit(exports.Events.SegmentLoaded, segment);

        _this.processQueue();

        _this._lds.p2p.setIndexes(_this.selectIndexes());
      };

      _this.onSegmentError = function (segment, event) {
        _this.emit(exports.Events.SegmentError, segment, event);

        _this.processQueue();
      };

      _this.onPeerConnect = function (peer) {
        _this._lds.p2p.setIndexes(_this.selectIndexes(), peer.id);

        _this.emit(exports.Events.PeerConnect, peer);
      };

      _this.onPeerClose = function (peerId) {
        _this.emit(exports.Events.PeerClose, peerId);
      };

      settings = __assign$1({}, defaultSettings, settings);
      debug$3$1('loader settings: %o', settings);
      var cacheSize = settings.cacheSize,
          maxAge = settings.cacheAge;

      var length = function (n, key) {
        return 1;
      };

      var max = +cacheSize || Infinity;

      if (typeof cacheSize === 'string') {
        max = parse_1(cacheSize);

        length = function (n, key) {
          return byteLength$2(n.data);
        };
      }

      _this._prefs = settings;
      _this._cache = new lruCache({
        max: max,
        maxAge: maxAge,
        length: length,
        updateAgeOnGet: true
      });
      var http = new LoaderHttpImpl(settings);
      http.on('segment-loaded', _this.onSegmentLoaded.bind(_this, 'http'));
      http.on('bytes-loaded', _this.onPieceBytesLoaded.bind(_this, 'http'));
      var p2p = new LoaderP2PImpl(_this._cache, settings);
      p2p.on('segment-loaded', _this.onSegmentLoaded.bind(_this, 'p2p'));
      p2p.on('bytes-loaded', _this.onPieceBytesLoaded.bind(_this, 'p2p'));
      p2p.on('peer-connected', _this.onPeerConnect);
      p2p.on('bytes-uploaded', _this.onPieceBytesUploaded.bind(_this, 'p2p'));
      p2p.on('peer-data-updated', function () {
        return _this.processQueue();
      });
      p2p.on('peer-closed', _this.onPeerClose);
      _this._lds = {
        http: http,
        p2p: p2p
      };
      return _this;
    }

    var _a = SegmentScheduler.prototype;
    Object.defineProperty(_a, "peerId", {
      get: function () {
        return this._lds.p2p.peerId;
      },
      enumerable: true,
      configurable: true
    });

    _a.setSwarmId = function (swarmId) {
      this._lds.p2p.setSwarmId(swarmId);

      return this;
    };

    _a.prefetch = function (segments) {
      var _this = this;

      var _a = this,
          _preSeq = _a._preSeq,
          p2p = _a._lds.p2p;

      _preSeq.forEach(function (segment) {
        if (_this.isLoading(segment) && !segments.find(function (o) {
          return o.id === segment.id;
        })) {
          _this.abort(segment);
        }
      });

      var loaded = this._preSeq.filter(function (o) {
        return o.data;
      }).reduce(function (o, s) {
        return o[s.id] = 1, o;
      }, {});

      segments = segments.reduce(function (l$$1, s) {
        if (!loaded[s.id]) l$$1.push(s);
        return l$$1;
      }, []);
      debug$3$1('prefetch - Renew segments queue ...', segments);
      this._preSeq = segments;
      this.processQueue();

      this._cache.prune();

      p2p.setIndexes(this.selectIndexes());
    };

    _a.getSegment = function (id) {
      var segment = this._preSeq.find(function (o) {
        return o.id === id && !!o.data;
      }) || this._cache.get(id);

      return segment && segment.data ? Segment.new(segment) : undefined;
    };

    _a.getSettings = function () {
      return this._prefs;
    };

    _a.load = function (segment) {
      var _this = this;

      var _a = this,
          _b = _a._prefs,
          bufferedSegmentsCount = _b.bufferedSegmentsCount,
          requiredSegmentsPriority = _b.requiredSegmentsPriority,
          _preSeq = _a._preSeq,
          _c = _a._lds,
          http = _c.http,
          p2p = _c.p2p;

      var id = segment.id,
          priority = segment.priority;
      var p$$1;

      if (requiredSegmentsPriority >= priority) {
        debug$3$1('start to load segment: %s', id);
        p$$1 = p2p.load(segment).catch(function (err) {
          var status = err.code;
          if (status === LoaderStatus.ABORT) return;

          if (priority === 0 && !http.isLoading(segment) && !http.isEmpty()) {
            for (var _i = 0, _preSeq_1 = _preSeq; _i < _preSeq_1.length; _i++) {
              var s = _preSeq_1[_i];
              http.abort(s);
            }
          }

          if (status !== LoaderStatus.NULL) {
            debug$3$1('p2p load "%s" failed.', id, err);
            debug$3$1('trying to http again ... (%s:%s)', id, priority);
          }

          return http.load(segment);
        }).catch(function (err) {
          debug$3$1('http load "%s" failed (priority: %s)', id, priority, err);
          return err;
        });
      } else if (!http.isLoading(segment) && !p2p.isFull() && _preSeq.length - this.getPendings().length < bufferedSegmentsCount) {
        p$$1 = p2p.load(segment).catch(function (err) {
          var status = err.code;

          if (status !== LoaderStatus.NULL && status !== LoaderStatus.ABORT) {
            debug$3$1('p2p load "%s" failed (priority: %s)', id, priority, err);
          }

          if (!_this._cache.has(id) && _this._preSeq.find(function (o) {
            return o.id === id && o.priority <= requiredSegmentsPriority;
          })) {
            return err;
          }
        });
      }

      if (p$$1) {
        p$$1.catch(function (err) {
          _this.onSegmentError(segment, err);
        }).finally(function () {
          return _this.delete(id);
        });
        return this.set(id, p$$1), p$$1;
      }
    };

    _a.isLoading = function (segment, method) {
      return method ? this._lds[method].isLoading(segment) : this.has(segment.id);
    };

    _a.abort = function (segment, silent) {
      if (silent === void 0) {
        silent = true;
      }

      debug$3$1('abort segment', segment);
      var id = segment.id;
      var seg = this.get(id);

      if (seg) {
        values(this._lds).forEach(function (l$$1) {
          return l$$1.abort(segment);
        });
        this.delete(id);

        var idx = this._preSeq.findIndex(function (o) {
          return o.id === id;
        });

        if (idx !== -1) {
          this._preSeq.splice(idx, 1);
        }

        if (!silent) {
          this.emit(exports.Events.SegmentAbort, segment);
        }

        return;
      }

      debug$3$1('abort segment - not found');
    };

    _a.destroy = function () {
      this._preSeq = [];
      values(this._lds).forEach(function (l$$1) {
        return l$$1.destroy();
      });

      this._cache.clear();

      this.removeAllListeners();
    };

    _a.getPendings = function () {
      var _this = this;

      var cache = this._cache;
      return this._preSeq.filter(function (s) {
        return !s.data && !cache.has(s.id) && !_this.isLoading(s);
      });
    };

    _a.processQueue = function () {
      var _this = this;

      var _a = this,
          _prefs = _a._prefs,
          _preSeq = _a._preSeq,
          _b = _a._lds,
          http = _b.http,
          p2p = _b.p2p;

      var list = this.getPendings();

      if (!list.length) {
        debug$3$1('processQueue - segments queue empty.');
        return;
      }

      var head = list[0];
      debug$3$1('process queue [%s:%s] ...', head.id, head.priority);

      for (var i$$1 = -1, l$$1 = list.length; ++i$$1 < l$$1;) {
        var seg = list[i$$1];
        var priority = seg.priority;

        if (priority !== 0 && this.size > _prefs.loadConcurrentSize) {
          return;
        }

        this.load(seg);
      }

      var ts = N();

      if (http.size > 0 || ts - this._httpPTS < _prefs.httpLoadProbabilityInterval) {
        return;
      }

      var pendings = this.getPendings();

      if (!pendings.length || _preSeq.length - pendings.length >= _prefs.bufferedSegmentsCount) {
        return;
      }

      var indexes = p2p.getOvrallSegmentsMap();

      if ((pendings = pendings.filter(function (s) {
        return !indexes.get(s.id);
      })).length) {
        this._httpPTS = ts;

        var _loop_1 = function (s) {
          if (Math.random() <= _prefs.httpLoadProbability) {
            var id_1 = s.id;
            debug$3$1('load/http/rnd> %d|%s|%s', s.priority, id_1, s.url);
            this_1.set(id_1, http.load(s).finally(function () {
              return _this.delete(id_1);
            }));
            return "break";
          }
        };

        var this_1 = this;

        for (var _i = 0, pendings_1 = pendings; _i < pendings_1.length; _i++) {
          var s = pendings_1[_i];

          var state_1 = _loop_1(s);

          if (state_1 === "break") break;
        }
      }
    };

    _a.selectIndexes = function () {
      var indexes = [];

      this._cache.forEach(function (value, key) {
        return indexes.push([key, SegmentStatus.Loaded]);
      });

      this._lds.http.forEach(function (value, key) {
        return indexes.push([key, SegmentStatus.LoadingByHttp]);
      });

      return indexes;
    };

    __decorate$1([debounce$1(30)], SegmentScheduler.prototype, "processQueue", null);

    return SegmentScheduler;
  }(g);

  var SegmentLoader = function (_super) {
    __extends$1(SegmentLoader, _super);

    function SegmentLoader(settings) {
      var _this = _super.call(this) || this;

      _this._pool = new Map();
      _this._swarmId = '';
      var loader = _this._inter = new SegmentScheduler(settings);
      M(_this, loader, Object.values(exports.Events));
      return _this;
    }

    var _a = SegmentLoader;

    _a.isSupported = function () {
      var browserRtc = getBrowserRtc();
      return browserRtc && browserRtc.RTCPeerConnection.prototype.createDataChannel !== undefined;
    };

    var _b = SegmentLoader.prototype;
    Object.defineProperty(_b, "isIdle", {
      get: function () {
        return !this.size;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(_b, "peerId", {
      get: function () {
        return this._inter.peerId;
      },
      enumerable: true,
      configurable: true
    });

    _b.load = function (segment, ctx, callbacks) {
      var _this = this;

      if (!this.isIdle) {
        this.forEach(function (_a) {
          var s = _a.segment;
          return _this.onError(s, 'Cancel segment request: simultaneous segment requests are not supported');
        });
      }

      var swarmId = ctx.swarmId;
      var id = segment.id;
      var req = new BaseLoaderEntry(segment, ctx, callbacks);
      req.catch(function (err) {});
      this.set(id, req);
      this.setSwarmId(swarmId);

      var seg = this._inter.getSegment(id);

      if (seg) {
        this.onLoaded(seg);
      }

      this.prefetch(Array.from(this._pool.values()));
    };

    _b.setSwarmId = function (swarmId) {
      if (this._swarmId !== swarmId) {
        this.clear();

        this._pool.clear();

        this._swarmId = swarmId;
      }

      this._inter.setSwarmId(swarmId);

      return this;
    };

    _b.prefetch = function (segments) {
      var allDic = new Map(segments.map(function (i$$1) {
        return [i$$1.id, i$$1];
      }));

      if (!this.isIdle) {
        this.forEach(function (_a, id) {
          var segment = _a.segment;

          if (!allDic.has(id)) {
            allDic.set(id, segment);
            segments.unshift(segment);
          }
        });
      }

      this._pool = allDic;

      this._inter.prefetch(segments);
    };

    _b.abort = function (segment) {
      var items;

      if (segment) {
        if (typeof segment === 'string') {
          var item = this.values().find(function (o) {
            return o.segment.url === segment;
          });
          items = (segment = item && item.segment) ? [segment] : [];
        } else {
          items = [segment];
        }
      }

      items = items || this.values().map(function (i$$1) {
        return i$$1.segment;
      });

      for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
        var seg = items_1[_i];

        this._inter.abort(seg);

        this.onAbort(seg);
      }
    };

    _b.destroy = function () {
      this._inter.destroy();

      this._pool.clear();

      this.abort();
      this.clear();
      this.removeAllListeners();
    };

    _b.getSettings = function () {
      return this._inter.getSettings();
    };

    _b.onComplete = function (segment, type, args) {
      _super.prototype.onComplete.call(this, segment, type, args);

      this._pool.delete(segment.id);
    };

    __decorate$1([debounce$1(30)], SegmentLoader.prototype, "prefetch", null);

    return SegmentLoader;
  }(AbstractLoader);

  // Playlist manager
  var Playlist = /** @class */ (function () {
    function Playlist(url, manifest) {
      this.url = url;
      this.manifest = manifest;
      this.swarmId = '';
      this.isMaster = false;
      var pos = url.lastIndexOf('/');
      if (pos === -1) {
        throw new Error('Unexpected playlist URL format');
      }
      if (!manifest.segments || !y$1(manifest.level)) {
        this.isMaster = true;
      }
      this.baseUrl = url.substring(0, pos + 1);
    }
    var _a = Playlist;
    // Transform hls.js {ILevel} instance to {Playlist}, This helper also cleanup some
    // noused properties.
    _a.from = function (level) {
      var startSN = level.startSN, fragments = level.fragments;
      var url = level.url;
      // master playlists's url may be a swarm of m3u8 url list
      if (e(url)) {
        url = url[0];
      }
      var manifest = __assign({}, level, { url: url });
      if (fragments) {
        // is a ts segments level playlist, sanitize and cleanup fragment fields
        manifest.mediaSequence = startSN;
        manifest.segments = fragments.map(function (f$$1) {
          var relurl = f$$1.relurl;
          return ['relurl', 'loader', 'levelkey', 'baseurl']
            .reduce(function (o, k) { return (delete o[k], o); }, __assign({}, f$$1, { url: relurl }));
        });
        delete manifest.fragments;
      }
      return new Playlist(url, manifest);
    };
    var _b = Playlist.prototype;
    _b.indexOf = function (url) {
      if (this.isMaster)
        return -1;
      for (var i$$1 = 0; i$$1 < this.manifest.segments.length; ++i$$1) {
        if (url === this.resolveSegUrlByIndex(i$$1)) {
          return i$$1;
        }
      }
      return -1;
    };
    _b.resolveSegUrlByIndex = function (index) {
      return this.resolveSegUrl(this.manifest.segments[index].url);
    };
    _b.resolveSegUrl = function (url) {
      return F(url) ? url : this.baseUrl + url;
    };
    return Playlist;
  }());

  var debug$8 = browser$1('p2phls:segment-mgr');
  var defaultSettings$1 = {
    prefetchCount: 10,
    swarmId: function (url, options) {
      if (options === void 0) { options = {}; }
      return url.split('?')[0];
    }
  };
  var now = Date.now || (function () { return +new Date; });
  var genSegId = function (swarmId, sn) { return swarmId + "+" + sn; };
  var SegmentManager = /** @class */ (function () {
    function SegmentManager(loader, settings) {
      this.master = null; // Optional store master playlist
      this.playlists = new Map(); // Cache all of the variant playlist
      this._queue = [];
      this._current = { url: '', playlist: '' };
      settings = __assign({}, defaultSettings$1, settings);
      this._prefs = settings;
      this._loader = loader;
      this._genSwarmId = (settings.swarmId || defaultSettings$1.swarmId).bind(this);
    }
    var _a = SegmentManager.prototype;
    _a.getSettings = function () {
      return this._prefs;
    };
    _a.setPlaylists = function (info) {
      var _this = this;
      var url = info.url, levels = info.levels;
      if (!levels) {
        debug$8('Invalid HLS.js playlist info', info);
        return this;
      }
      if (url && levels.length > 1) {
        // build master playlist
        var playlists_1 = [];
        var manifest = { playlists: playlists_1 };
        levels.forEach(function (level) {
          var ls = Playlist.from(level);
          _this.playlists.set(ls.url, ls);
          playlists_1.push(ls);
        });
        this.master = new Playlist(url, manifest);
        this.playlists.forEach(function (ls) { return ls.swarmId = _this.getSwarmId(ls.url); });
      }
      else {
        var level = levels[0];
        var url_1 = level.url;
        var playlist = Playlist.from(level); // convert
        var swarmId = this.getSwarmId(url_1);
        if (swarmId !== url_1 || !this.master) {
          playlist.swarmId = swarmId;
          this.playlists.set(url_1, playlist);
          this.updateSegments();
        }
      }
      return this;
    };
    _a.loadSegment = function (url, callbacks) {
      var _this = this;
      var loc = this.getSegmentLoc(url);
      if (!loc) {
        callbacks.onError({ message: 'Segment location not found.', code: 'P2P_404' });
        return;
      }
      var playlist = loc.playlist, index = loc.index;
      var sn = (playlist.manifest.mediaSequence || 0) + index;
      if (this._queue.length > 0) {
        var prev = this._queue[this._queue.length - 1];
        if (prev.sn !== sn - 1) {
          // Reset play _queue in case of segment loading out of sequence
          this._queue = [];
        }
      }
      var swarmId = playlist.swarmId;
      var id = genSegId(swarmId, sn);
      var segment = Segment.new(id, url);
      var start = now();
      debug$8('[%s] fetch segment: %s', id, url);
      var wrapCallback = function (callbacks, cbName) { return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        _this.renewQueue(url);
        var f$$1 = callbacks[cbName];
        debug$8('[%s] handle fetch segment (%s), time elapsed %dms', id, cbName, now() - start);
        if (f$$1)
          return f$$1.apply(void 0, args);
      }; };
      var cbs = Object.keys(callbacks).reduce(function (p$$1, k) {
        p$$1[k] = wrapCallback(callbacks, k);
        return p$$1;
      }, {});
      this._current = { url: url, playlist: playlist.url };
      this._loader.load(segment, { swarmId: swarmId }, cbs);
      this._queue.push({ url: url, sn: sn });
      this.loadSegments(playlist, index);
    };
    /**
     * Update the play _queue in order to sync with the player real segment.
     */
    _a.syncSegment = function (url) {
      if (this._queue.length) {
        this._loader.abort(url);
      }
      if (this.renewQueue(url)) {
        this.updateSegments();
      }
    };
    _a.abortSegment = function (url) {
      debug$8('abort segment: %s', url);
      this._loader.abort(url);
      this.renewQueue(url);
    };
    _a.destroy = function () {
      this._loader.destroy();
      this.master = null;
      this.playlists.clear();
      this._queue = [];
    };
    _a.renewQueue = function (url) {
      var q = this._queue;
      var idx = q.findIndex(function (s) { return s.url === url; });
      if (idx >= 0) {
        this._queue = q.slice(idx + 1);
        return true;
      }
      return false;
    };
    _a.updateSegments = function () {
      if (this._loader.isIdle) {
        return;
      }
      var loc = this.getSegmentLoc(this._current.url);
      if (loc) {
        this.loadSegments(loc.playlist, loc.index);
      }
      else { // the segment not found in current playlist
        var playlist = this.playlists.get(this._current.playlist);
        if (playlist) {
          this.loadSegments(playlist, 0);
        }
      }
    };
    _a.getSegmentLoc = function (url) {
      var entries = this.playlists.values();
      for (var entry = entries.next(); !entry.done; entry = entries.next()) {
        var playlist = entry.value;
        var index = playlist.indexOf(url);
        if (index >= 0) {
          return { playlist: playlist, index: index };
        }
      }
      return undefined;
    };
    _a.loadSegments = function (playlist, offset) {
      var segments = [];
      var swarmId = playlist.swarmId, manifest = playlist.manifest;
      var playlistSegments = manifest.segments;
      var initialSequence = +manifest.mediaSequence || 0;
      var priority = Math.max(0, this._queue.length - 1);
      for (var i$$1 = offset, prefetchCount = this._prefs.prefetchCount, l$$1 = playlistSegments.length; i$$1 < l$$1 && segments.length < prefetchCount; ++i$$1) {
        var url = playlist.resolveSegUrlByIndex(i$$1);
        var id = genSegId(swarmId, initialSequence + i$$1);
        segments.push(Segment.new(id, url, priority++));
      }
      if (segments.length) {
        this._loader.setSwarmId(swarmId).prefetch(segments);
      }
    };
    _a.getSwarmId = function (url) {
      var _a = this, master = _a.master, _genSwarmId = _a._genSwarmId;
      if (master) {
        for (var k = void 0, i$$1 = 0, lists = master.manifest.playlists, l$$1 = lists.length; i$$1 < l$$1; ++i$$1) {
          k = lists[i$$1].url;
          k = F(k) ? k : master.baseUrl + k;
          if (k === url) {
            url = _genSwarmId(master.url) + "+V" + i$$1;
            break;
          }
        }
      }
      return w(_genSwarmId(url));
    };
    return SegmentManager;
  }()); // end of SegmentManager

  var now$1 = (performance && (function () { return performance.now(); })) || Date.now || (function () { return +new Date; }); /* tslint:disable-line */
  var HlsLoaderImpl = /** @class */ (function () {
    function HlsLoaderImpl(cfg) {
      if (typeof cfg.xhrLoader !== 'function') {
        throw new Error('XHR loader required.');
      }
      this._cfg = cfg;
    }
    var _a = HlsLoaderImpl.prototype;
    Object.defineProperty(_a, "_xhr", {
      get: function () {
        var cfg = this._cfg;
        return this._x || (this._x = new cfg.xhrLoader(cfg));
      },
      enumerable: true,
      configurable: true
    });
    _a.load = function (context, config, callbacks) {
      var _this = this;
      this._ctx = context;
      var url = context.url, frag = context.frag;
      if (frag) {
        var startTime_1 = now$1();
        var stats_1 = { trequest: startTime_1, tfirst: startTime_1, loaded: 0, tload: 0, total: 0, speed: 0 };
        this._cfg.segMgr.loadSegment(url, {
          onSuccess: function (segment) {
            var data = segment.data.slice(0);
            var timeStamp = now$1();
            var timeElapsed = timeStamp - startTime_1;
            var speed = segment.downloadSpeed;
            if (speed <= 0) {
              speed = data.byteLength / timeElapsed;
            }
            var size = data.byteLength;
            var downloadTime = size / speed;
            stats_1.tload = Math.max(stats_1.tfirst, now$1());
            stats_1.trequest = Math.max(stats_1.tfirst, startTime_1 - downloadTime);
            stats_1.loaded = stats_1.total = size;
            stats_1.speed = speed * 1000 / 1024; // 'kb/s';
            callbacks.onSuccess({ url: url, data: data }, stats_1, context);
          },
          onError: function (error) {
            _this._xhr.load(context, config, callbacks);
          },
          onTimeout: function (stats) {
            _this._xhr.load(context, config, callbacks);
          }
        });
      }
      else {
        this._xhr.load(context, config, callbacks);
      }
    };
    _a.destroy = function () {
      this.abort();
    };
    _a.abort = function () {
      var _a = this, _ctx = _a._ctx, _cfg = _a._cfg, _xhr = _a._xhr;
      if (_ctx) {
        _cfg.segMgr.abortSegment(_ctx.url);
        // reset context to prevent abort duplicates.
        this._ctx = undefined;
      }
      if (_xhr) {
        _xhr.destroy();
      }
    };
    return HlsLoaderImpl;
  }());

  /// <reference path="../types/globals.d.ts" />
  var debug$9 = browser$1('p2phls:engine');
  var version$3 = '0.0.3';
  var isSupported = function () { return SegmentLoader.isSupported(); };
  var Engine = /** @class */ (function (_super) {
    __extends(Engine, _super);
    function Engine(settings) {
      var _this = this;
      debug$9('hls-loader initialized. (v%s)', version$3);
      _this = _super.call(this) || this;
      var loader = settings.loader, xhrLoader = settings.xhrLoader, segments = settings.segments;
      var p2pLoader = new SegmentLoader(__assign({}, loader, { xhrLoader: xhrLoader }));
      _this._prefs = settings;
      _this._loader = p2pLoader;
      _this._segmgr = new SegmentManager(p2pLoader, segments);
      // Forward loader bindings.
      M(_this, p2pLoader, Object.values(exports.Events));
      return _this;
    }
    var _a = Engine.prototype;
    Object.defineProperty(_a, "peerId", {
      get: function () {
        return this._loader.peerId;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(_a, "settings", {
      get: function () {
        return {
          loader: this._loader.getSettings(),
          segments: this._segmgr.getSettings()
        };
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(_a, "segMgr", {
      get: function () {
        return this._segmgr;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(_a, "xhrLoader", {
      get: function () {
        return this._prefs.xhrLoader;
      },
      enumerable: true,
      configurable: true
    });
    _a.attach = function (hlsObj) {
      if (!hlsObj) {
        throw new Error('Invalid HLS.js instance to attaching.');
      }
      initHlsJsEvents(hlsObj, this);
    };
    _a.loaderCreator = function () {
      return hlsLoaderFactory(HlsLoaderImpl, this);
    };
    _a.syncSegment = function (url) {
      this._segmgr.syncSegment(url);
    };
    _a.setPlaylists = function (e$$1) {
      return this._segmgr.setPlaylists(e$$1);
    };
    _a.destroy = function () {
      this._loader.destroy();
      this._segmgr.destroy();
      this.removeAllListeners();
    };
    return Engine;
  }(EventEmitter));
  function hlsLoaderFactory(LoaderImpl, engine) {
    var segMgr = engine.segMgr, xhrLoader = engine.xhrLoader;
    var L = (function (config) {
      return new LoaderImpl(__assign({ segMgr: segMgr, xhrLoader: xhrLoader }, config));
    });
    L.getEngine = function () { return engine; };
    return L;
  }
  function initHlsJsEvents(hls, engine) {
    var Hls = hls.constructor;
    var HLSEvents = Hls.Events;
    var handleLevelLoaded = function (e$$1) {
      var info = __assign({}, e$$1);
      info.levels = [info.details];
      delete info.details;
      engine.setPlaylists(info);
    };
    hls.on(HLSEvents.MANIFEST_PARSED, function (type, e$$1) {
      debug$9('hls.js manifest parsed: %o', e$$1);
    });
    hls.on(HLSEvents.MANIFEST_LOADED, function (type, e$$1) {
      debug$9('hls.js manifest loaded: %o', e$$1);
    });
    hls.on(HLSEvents.LEVEL_LOADED, function (type, e$$1) {
      debug$9('hls.js level loaded: %o', e$$1);
      handleLevelLoaded(e$$1);
    });
    hls.on(HLSEvents.FRAG_CHANGED, function (type, data) {
      var url = data && data.frag ? data.frag.url : undefined;
      engine.syncSegment(url);
    });
    hls.on(HLSEvents.DESTROYING, function () {
      engine.destroy();
    });
    hls.on(HLSEvents.ERROR, function (type, e$$1) {
      console.error(type, e$$1, e$$1.err);
    });
  }

  exports.version = version$3;
  exports.isSupported = isSupported;
  exports.Engine = Engine;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
