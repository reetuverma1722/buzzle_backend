// const express = require("express");
// const puppeteer = require("puppeteer-core");
// const cors = require("cors");
// const { exec } = require("child_process");
// const fs = require("fs");
// let fetch;
// (async () => { fetch = (await import("node-fetch")).default; })();
// const app = express();
// app.use(cors());
// app.use(express.json());
// const CHROME_PATH = `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"`; 
// const USER_DATA_DIR = "C:\\chrome-profile";
// // Connect to remote-debugging Chrome
// async function getWebSocketDebuggerUrl() {
//   try {
//     const response = await fetch("http://localhost:9222/json/version");
//     return (await response.json()).webSocketDebuggerUrl;
//   } catch { return null; }
// }
// async function launchChromeIfNeeded() {
//   const existing = await getWebSocketDebuggerUrl();
//   if (existing) return existing;
//   console.log("🟡 Launching Chrome...");
//   exec(`${CHROME_PATH} --headless=new --remote-debugging-port=9222 --user-data-dir="${USER_DATA_DIR}"`);
//   for (let i = 0; i < 10; i++) {
//     const ws = await getWebSocketDebuggerUrl();
//     if (ws) return ws;
//     await new Promise(r => setTimeout(r, 1000));
//   }
//   throw new Error("Failed to launch Chrome or fetch WebSocket URL");
// }
// app.post("/reply", async (req, res) => {
//   const { tweetUrl, replyText } = req.body;
//   if (!tweetUrl || !replyText) {
//     return res.status(400).json({ error: "tweetUrl and replyText are required" });
//   }
//   let browser;
//   try {
//     const wsEndpoint = await launchChromeIfNeeded();
//     browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
//     const page = await browser.newPage();
//     // Ensure logged in
//     await page.goto("https://twitter.com/home", { waitUntil: "networkidle2" });
//     if (!await page.$('a[aria-label="Profile"]')) {
//       throw new Error("Not logged in. Please log in to Chrome profile first.");
//     }
//     // Navigate to tweet
//     await page.goto(tweetUrl, { waitUntil: "networkidle2" });
//     await page.waitForSelector('article div[data-testid="tweet"]', { timeout: 15000 });
//     // Click reply
//     const replyBtn = await page.$('div[data-testid="reply"], button[data-testid="reply"]');
//     if (!replyBtn) {
//       await page.screenshot({ path: "error-no-reply-button.png", fullPage: true });
//       throw new Error("Reply button not found — tweet ID may be invalid or tweet deleted.");
//     }
//     await replyBtn.click();
//     // Type the reply
//     await page.waitForSelector('div[data-testid="tweetTextarea_0"]', { timeout: 15000 });
//     await page.type('div[data-testid="tweetTextarea_0"]', replyText, { delay: 30 });
//     // Click post
//     const postBtn = await page.waitForSelector('button[data-testid="tweetButtonInline"]', { timeout: 15000 });
//     await new Promise(r => setTimeout(r, 500)); // short pause that feels human
//     await postBtn.click();
//     return res.json({ success: true, message: "Reply posted!" });
//   } catch (err) {
//     console.error("❌ Reply error:", err.message);
//     try {
//       const pages = browser ? await browser.pages() : [];
//       if (pages.length) {
//         await pages[0].screenshot({ path: "error-during-reply.png", fullPage: true });
//         fs.writeFileSync("error-page.html", await pages[0].content());
//       }
//     } catch (edge) {
//       console.error("⚠️ Screenshot/HTML save failed:", edge.message);
//     }
//     return res.status(500).json({ error: "Reply failed", message: err.message });
//   }
// });
// const PORT = 5000;
// app.listen(PORT, () => console.log(`✅ Reply server running at http://localhost:${PORT}`));
// const express = require("express");
// const puppeteer = require("puppeteer-core");
// const cors = require("cors");
// const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
// const { exec } = require("child_process");
// const app = express();
// app.use(cors());
// app.use(express.json());
// const CHROME_PATH = `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"`; // Adjust path
// const USER_DATA_DIR = "C:\\chrome-profile"; // Your chrome profile path
// async function getWebSocketDebuggerUrl() {
//   try {
//     const response = await fetch("http://localhost:9222/json/version");
//     const json = await response.json();
//     return json.webSocketDebuggerUrl;
//   } catch {
//     return null;
//   }
// }
// async function launchChromeIfNeeded() {
//   const debuggerUrl = await getWebSocketDebuggerUrl();
//   if (debuggerUrl) return debuggerUrl;
//   console.log("🟡 Launching Chrome with remote debugging...");
//   exec(
//     `${CHROME_PATH} --remote-debugging-port=9222 --user-data-dir="${USER_DATA_DIR}" --no-first-run --no-default-browser-check`
//   );
//   // Wait for Chrome to boot up
//   for (let i = 0; i < 15; i++) {
//     const ws = await getWebSocketDebuggerUrl();
//     if (ws) return ws;
//     await new Promise(r => setTimeout(r, 1000));
//   }
//   throw new Error("❌ Failed to launch Chrome or fetch debugger WebSocket URL");
// }
// app.post("/reply", async (req, res) => {
//   const { tweetUrl, replyText } = req.body;
//   if (!tweetUrl || !replyText) {
//     return res.status(400).json({ error: "tweetUrl and replyText are required" });
//   }
//   try {
//     const wsEndpoint = await launchChromeIfNeeded();
//     const browser = await puppeteer.connect({
//       browserWSEndpoint: wsEndpoint,
//       defaultViewport: null,
//     });
//     const page = await browser.newPage();
//     // Go to home to check login
//     await page.goto("https://twitter.com/home", { waitUntil: "networkidle2" });
//     const loggedIn = await page.$('a[aria-label="Profile"]');
//     if (!loggedIn) throw new Error("Not logged in. Please login with the userDataDir profile.");
//     // Go to tweet URL
//     await page.goto(tweetUrl, { waitUntil: "networkidle2" });
//     // Click the reply icon/button to open the reply box
//     await page.waitForSelector('div[role="button"][data-testid="reply"]', { timeout: 15000 });
//     await page.click('div[role="button"][data-testid="reply"]');
//     // Wait for the reply input editable div and focus it
//     await page.waitForSelector('div.public-DraftStyleDefault-block.public-DraftStyleDefault-ltr', { timeout: 15000 });
//     // Use keyboard.type on the contenteditable div
//     const replyInput = await page.$('div.public-DraftStyleDefault-block.public-DraftStyleDefault-ltr');
//     await replyInput.click();
//     await page.keyboard.type(replyText, { delay: 30 });
//     // Wait for the reply (tweet) button to be enabled, then click it
//     await page.waitForSelector('button[data-testid="tweetButtonInline"]:not([disabled])', { timeout: 15000 });
//     await page.click('button[data-testid="tweetButtonInline"]');
//     res.json({ success: true, message: "Reply posted!" });
//     await page.close();
//     // Note: Don't close browser to keep session alive if needed
//   } catch (err) {
//     console.error("❌ Reply error:", err);
//     res.status(500).json({ error: "Reply failed", message: err.message });
//   }
// });
// const PORT = 5000;
// app.listen(PORT, () => {
//   console.log(`✅ Reply server running on http://localhost:${PORT}`);
// });
"use strict";