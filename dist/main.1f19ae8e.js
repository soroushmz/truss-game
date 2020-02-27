// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"main.js":[function(require,module,exports) {
// import "linear-algebra";
// import _ from 'lodash'
// import {f1} from './file1'
// import f2 from './file1'
id = "grid";
var canvas = document.getElementById(id);
var ctx = canvas.getContext("2d");
var canvasWidth = 480;
var canvasHeight = 270;
ctx.canvas.width = canvasWidth;
ctx.canvas.height = canvasHeight;
var xTol = 1; //line distance tolerance

var deleteTol = 20; //canvas default tolerance

var lineWidth = 1; //truss line color

var trussColor = "black"; //truss line width

var trussWidth = 5; // snap to point tolerance

var snapTol = 15; // draw joints?

var drawJoints = true;
var jointColor = "red";
var jointRadius = 5;
var data = '<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"> \
            <defs> \
                <pattern id="smallGrid" width="8" height="8" patternUnits="userSpaceOnUse"> \
                    <path d="M 8 0 L 0 0 0 8" fill="none" stroke="gray" stroke-width="0.5" /> \
                </pattern> \
                <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse"> \
                    <rect width="80" height="80" fill="url(#smallGrid)" /> \
                    <path d="M 80 0 L 0 0 0 80" fill="none" stroke="gray" stroke-width="1" /> \
                </pattern> \
            </defs> \
            <rect width="100%" height="100%" fill="url(#smallGrid)" /> \
        </svg>';
var DOMURL = window.URL || window.webkitURL || window;
img = new Image();
svg = new Blob([data], {
  type: "image/svg+xml;charset=utf-8"
});
url = DOMURL.createObjectURL(svg);

img.onload = function () {
  ctx.drawImage(img, 0, 0);
  DOMURL.revokeObjectURL(url);
};

img.src = url;
pinSupport = new component(20, 20, "red", 50, 200, "pinSupport");
rollSupport = new component(20, 20, "red", 430, 200, "rollSupport");

function clear() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  img.onload();
  img.src = url;
  pinSupport = new component(20, 20, "red", 50, 200, "pinSupport");
  rollSupport = new component(20, 20, "red", 430, 200, "rollSupport");
}

function startGame() {
  //   f1();
  //   f2();
  // let x = _.zip(['a', 'b'], [1, 2], [true, false]);
  // console.log({x});
  makeLine();
}

function component(baseWidth, height, color, x, y, type) {
  this.baseWidth = baseWidth;
  this.height = height;
  this.x = x;
  this.y = y - height;

  if (type == "pinSupport") {
    hatchPercent = 0.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + baseWidth / 2, y);
    ctx.lineTo(x, y - height);
    ctx.lineTo(x - baseWidth / 2, y);
    ctx.fill();
    ctx.moveTo(x - baseWidth, y);
    ctx.lineTo(x + baseWidth, y);
    ctx.stroke();
    delta = height * hatchPercent;
    NumberOfHatches = Math.floor(baseWidth / delta);

    for (i = 0; i < NumberOfHatches; ++i) {
      ctx.moveTo(x - baseWidth + (i - 1) * delta, y + delta);
      ctx.lineTo(x - baseWidth + i * delta, y);
      ctx.stroke();
    }

    for (i = 0; i < NumberOfHatches + 1; ++i) {
      ctx.moveTo(x + (i - 1) * delta, y + delta);
      ctx.lineTo(x + i * delta, y);
      ctx.stroke();
    }
  } else if (type == "rollSupport") {
    hatchPercent = 0.2;
    ctx.beginPath();
    ctx.arc(x, y - height / 2, height / 2, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.moveTo(x - baseWidth, y);
    ctx.lineTo(x + baseWidth, y);
    ctx.stroke();
    delta = height * hatchPercent;
    NumberOfHatches = Math.floor(baseWidth / delta);

    for (i = 0; i < NumberOfHatches; ++i) {
      ctx.moveTo(x - baseWidth + (i - 1) * delta, y + delta);
      ctx.lineTo(x - baseWidth + i * delta, y);
      ctx.stroke();
    }

    for (i = 0; i < NumberOfHatches + 1; ++i) {
      ctx.moveTo(x + (i - 1) * delta, y + delta);
      ctx.lineTo(x + i * delta, y);
      ctx.stroke();
    }
  }
}

function makeLine() {
  var firstX = 0;
  var firstY = 0;
  var secondX = 0;
  var secondY = 0;
  var lineList = [];
  var pointList = [];
  var pinPoint = new Point(pinSupport.x, pinSupport.y);
  var rollPoint = new Point(rollSupport.x, rollSupport.y);
  pointList.push(pinPoint, rollPoint);

  onmousedown = function onmousedown(e) {
    firstX = e.clientX;
    firstY = e.clientY;
  };

  onmouseup = function onmouseup(e) {
    secondX = e.clientX;
    secondY = e.clientY;

    if (secondX != firstX || secondY != firstY) {
      var pointFirst = new Point(firstX, firstY);
      var pointSecond = new Point(secondX, secondY);
      pointFirst = snapToPoint(pointFirst, pointList, snapTol);
      pointSecond = snapToPoint(pointSecond, pointList, snapTol);
      pointList.push(pointFirst, pointSecond);
      lineList.push(new Line(pointFirst, pointSecond, xTol));
      drawLine(lineList[lineList.length - 1]);
    }
  };

  ondblclick = function ondblclick(e) {
    var point = new Point(e.clientX, e.clientY);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = lineList[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var line = _step.value;

        if (isPointOnLine(point, line, deleteTol)) {
          lineList = updateGameArea(line, lineList);
          break;
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  };
}

function snapToPoint(point, pointList, tol) {
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = pointList[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      p = _step2.value;

      if (p.distanceTo(point) < tol) {
        return p;
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return point;
}

function Point(x, y) {
  this.x = x;
  this.y = y;

  this.distanceTo = function (P) {
    return Math.pow(Math.pow(x - P.x, 2) + Math.pow(y - P.y, 2), 0.5);
  };
}

function arrayRemove(value, arr) {
  return arr.filter(function (ele) {
    return ele != value;
  });
}

function isPointOnLine(point, Line, tol) {
  if (Line.a === undefined) {
    if (Math.abs(point.x - Line.pointFirst.x) < tol) {
      return true;
    } else {
      return false;
    }
  } else {
    var intersectX = (point.x * (Line.pointSecond.x - Line.pointFirst.x) + (point.y - Line.b) * (Line.pointSecond.y - Line.pointFirst.y)) / (Line.pointSecond.x - Line.pointFirst.x + Line.a * (Line.pointSecond.y - Line.pointFirst.y));
    var intersectY = Line.a * intersectX + Line.b;
    var dist = Math.pow(Math.pow(point.x - intersectX, 2) + Math.pow(point.y - intersectY, 2), 0.5);
    return dist < tol ? true : false;
  }
}

function drawLine(line) {
  ctx.lineWidth = trussWidth;
  ctx.strokeStyle = trussColor;
  ctx.beginPath();
  ctx.moveTo(line.pointFirst.x, line.pointFirst.y);
  ctx.lineTo(line.pointSecond.x, line.pointSecond.y);
  ctx.stroke();

  if (drawJoints = true) {
    ctx.fillStyle = jointColor;
    ctx.beginPath();
    ctx.arc(line.pointFirst.x, line.pointFirst.y, jointRadius, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(line.pointSecond.x, line.pointSecond.y, jointRadius, 0, Math.PI * 2, true);
    ctx.fill();
  }
}

function Line(pointFirst, pointSecond, tol) {
  this.pointFirst = pointFirst;
  this.pointSecond = pointSecond;
  this.a = Math.abs(pointSecond.x - pointFirst.x) > tol ? (pointSecond.y - pointFirst.y) / (pointSecond.x - pointFirst.x) : undefined;
  this.b = Math.abs(pointSecond.x - pointFirst.x) > tol ? pointFirst.y - this.a * pointFirst.x : -pointFirst.y;
}

function updateGameArea(line, lineList) {
  lineList = arrayRemove(line, lineList);
  clear();
  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = lineList[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      line = _step3.value;
      drawLine(line);
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  return lineList;
}

startGame();
},{}],"node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "58313" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["node_modules/parcel-bundler/src/builtins/hmr-runtime.js","main.js"], null)
//# sourceMappingURL=/main.1f19ae8e.js.map