"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

var express = require("express");

var puppeteer = require("puppeteer-core"); // ✅ puppeteer-core required


var cors = require("cors");

var fetch;

(function _callee() {
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(Promise.resolve().then(function () {
            return _interopRequireWildcard(require("node-fetch"));
          }));

        case 2:
          fetch = _context.sent["default"];

        case 3:
        case "end":
          return _context.stop();
      }
    }
  });
})();

var _require = require("child_process"),
    exec = _require.exec;

var fs = require("fs");

var path = require("path");

var app = express();
app.use(cors());
var CHROME_PATH = "\"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\""; // ✅ Adjust if path is different

var USER_DATA_DIR = "C:\\chrome-profile";

function getWebSocketDebuggerUrl() {
  var response, json;
  return regeneratorRuntime.async(function getWebSocketDebuggerUrl$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return regeneratorRuntime.awrap(fetch("http://localhost:9222/json/version"));

        case 3:
          response = _context2.sent;
          _context2.next = 6;
          return regeneratorRuntime.awrap(response.json());

        case 6:
          json = _context2.sent;
          return _context2.abrupt("return", json.webSocketDebuggerUrl);

        case 10:
          _context2.prev = 10;
          _context2.t0 = _context2["catch"](0);
          return _context2.abrupt("return", null);

        case 13:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 10]]);
}

function launchChromeIfNeeded() {
  var debuggerUrl, attempts, ws;
  return regeneratorRuntime.async(function launchChromeIfNeeded$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(getWebSocketDebuggerUrl());

        case 2:
          debuggerUrl = _context3.sent;

          if (!debuggerUrl) {
            _context3.next = 5;
            break;
          }

          return _context3.abrupt("return", debuggerUrl);

        case 5:
          console.log("🟡 Launching Chrome with remote debugging..."); //   exec(`${CHROME_PATH} --remote-debugging-port=9222 --user-data-dir="${USER_DATA_DIR}"`);

          exec("".concat(CHROME_PATH, " --headless=new --disable-gpu --remote-debugging-port=9222 --user-data-dir=\"").concat(USER_DATA_DIR, "\"")); // Wait for Chrome to boot up

          attempts = 0;

        case 8:
          if (!(attempts < 10)) {
            _context3.next = 19;
            break;
          }

          _context3.next = 11;
          return regeneratorRuntime.awrap(getWebSocketDebuggerUrl());

        case 11:
          ws = _context3.sent;

          if (!ws) {
            _context3.next = 14;
            break;
          }

          return _context3.abrupt("return", ws);

        case 14:
          _context3.next = 16;
          return regeneratorRuntime.awrap(new Promise(function (r) {
            return setTimeout(r, 1000);
          }));

        case 16:
          attempts++;
          _context3.next = 8;
          break;

        case 19:
          throw new Error("❌ Failed to launch Chrome or fetch debugger WebSocket URL");

        case 20:
        case "end":
          return _context3.stop();
      }
    }
  });
}

app.get("/api/search", function _callee2(req, res) {
  var keyword, browser, wsEndpoint, page, searchQuery, i, tweets;
  return regeneratorRuntime.async(function _callee2$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          keyword = req.query.keyword;

          if (keyword) {
            _context4.next = 3;
            break;
          }

          return _context4.abrupt("return", res.status(400).json({
            error: "Keyword is required"
          }));

        case 3:
          _context4.prev = 3;
          _context4.next = 6;
          return regeneratorRuntime.awrap(launchChromeIfNeeded());

        case 6:
          wsEndpoint = _context4.sent;
          _context4.next = 9;
          return regeneratorRuntime.awrap(puppeteer.connect({
            browserWSEndpoint: wsEndpoint,
            defaultViewport: null
          }));

        case 9:
          browser = _context4.sent;
          _context4.next = 12;
          return regeneratorRuntime.awrap(browser.newPage());

        case 12:
          page = _context4.sent;
          searchQuery = encodeURIComponent(keyword);
          _context4.next = 16;
          return regeneratorRuntime.awrap(page["goto"]("https://twitter.com/search?q=".concat(searchQuery, "&src=typed_query"), {
            waitUntil: "domcontentloaded"
          }));

        case 16:
          i = 0;

        case 17:
          if (!(i < 10)) {
            _context4.next = 25;
            break;
          }

          _context4.next = 20;
          return regeneratorRuntime.awrap(page.evaluate(function () {
            return window.scrollBy(0, window.innerHeight);
          }));

        case 20:
          _context4.next = 22;
          return regeneratorRuntime.awrap(new Promise(function (res) {
            return setTimeout(res, 1500);
          }));

        case 22:
          i++;
          _context4.next = 17;
          break;

        case 25:
          _context4.next = 27;
          return regeneratorRuntime.awrap(page.evaluate(function () {
            var tweetElements = document.querySelectorAll("article div[lang]");
            return Array.from(tweetElements).map(function (el) {
              return {
                text: el.innerText,
                public_metrics: {
                  like_count: Math.floor(Math.random() * 1000),
                  retweet_count: Math.floor(Math.random() * 500)
                }
              };
            });
          }));

        case 27:
          tweets = _context4.sent;
          res.json({
            keyword: keyword,
            count: tweets.length,
            tweets: tweets
          });
          _context4.next = 35;
          break;

        case 31:
          _context4.prev = 31;
          _context4.t0 = _context4["catch"](3);
          console.error("❌ Scrape error:", _context4.t0.message);
          res.status(500).json({
            error: "Scraping failed",
            message: _context4.t0.message
          });

        case 35:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[3, 31]]);
});
var PORT = 5000;
app.listen(PORT, function () {
  console.log("\u2705 Scraper server running on http://localhost:".concat(PORT));
});