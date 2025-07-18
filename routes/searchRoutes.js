
const express = require("express");
const db = require("../db"); 
const axios = require("axios");
const puppeteer = require("puppeteer-core");
const { exec } = require("child_process");
let fetch;
(async () => {
  fetch = (await import("node-fetch")).default;
})();

const router = express.Router();

const CHROME_PATH = `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"`;
const USER_DATA_DIR = "C:\\chrome-profile";
async function generateReply(tweetContent) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "mistralai/mixtral-8x7b-instruct", // or other free model
      messages: [
        {
          role: "user",
          content: `Reply smartly to this tweet:\n"${tweetContent}"\nMake it personal, friendly, and relevant.Be professional and do not use emojis and crisp and small contents `,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  const reply = response.data.choices[0]?.message?.content;
  console.log("Reply:", reply);
  return reply;
}
async function getWebSocketDebuggerUrl() {
  try {
    const response = await fetch("http://localhost:9222/json/version");
    const json = await response.json();
    return json.webSocketDebuggerUrl;
  } catch (err) {
    return null;
  }
}

async function launchChromeIfNeeded() {
  const debuggerUrl = await getWebSocketDebuggerUrl();
  if (debuggerUrl) return debuggerUrl;

  console.log("🟡 Launching Chrome with remote debugging...");
  exec(
    `${CHROME_PATH} --headless=new --disable-gpu --remote-debugging-port=9222 --user-data-dir="${USER_DATA_DIR}"`
  );

  let attempts = 0;
  while (attempts < 10) {
    const ws = await getWebSocketDebuggerUrl();
    if (ws) return ws;
    await new Promise((r) => setTimeout(r, 1000));
    attempts++;
  }

  throw new Error("❌ Failed to launch Chrome or fetch debugger WebSocket URL");
}

router.get("/search", async (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword) return res.status(400).json({ error: "Keyword is required" });

  await db.query(`INSERT INTO search_history (keyword) VALUES ($1)`, [keyword]);

  try {
    // 1. Check DB cache first
    const existingTweets = await db.query(
      `SELECT * FROM tweets WHERE keyword = $1 ORDER BY created_at DESC`,
      [keyword]
    );

    if (existingTweets.rows.length > 0) {
      return res.json({
        keyword,
        from: "cache",
        count: existingTweets.rows.length,
        tweets: existingTweets.rows,
      });
    }

    // 2. Continue with scraping if not in cache
    const wsEndpoint = await launchChromeIfNeeded();
    const browser = await puppeteer.connect({
      browserWSEndpoint: wsEndpoint,
      defaultViewport: null,
    });

    const page = await browser.newPage();
    const searchQuery = encodeURIComponent(keyword);
    await page.goto(
      `https://twitter.com/search?q=${searchQuery}&src=typed_query`,
      { waitUntil: "domcontentloaded" }
    );

    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise((res) => setTimeout(res, 1500));
    }

    const scrapedTweets = await page.evaluate(() => {
      const articles = document.querySelectorAll("article");
      return Array.from(articles)
        .map((article) => {
          const text = article.querySelector("div[lang]")?.innerText;
          const idMatch = article
            .querySelector('a[href*="/status/"]')
            ?.getAttribute("href")
            ?.match(/status\/(\d+)/);
          const id = idMatch ? idMatch[1] : null;

          if (!id || !text) return null;

          return {
            id,
            text,
            like_count: Math.floor(Math.random() * 1000),
            retweet_count: Math.floor(Math.random() * 500),
          };
        })
        .filter(Boolean);
    });

    for (const tweet of scrapedTweets) {
      const reply = await generateReply(tweet.text);
      tweet.reply = reply;

      await db.query(
        `INSERT INTO tweets (id, text, reply, like_count, retweet_count, keyword, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (id) DO NOTHING`,
        [
          tweet.id,
          tweet.text,
          reply,
          tweet.like_count,
          tweet.retweet_count,
          keyword,
        ]
      );
    }

    res.json({
      keyword,
      from: "scraped",
      count: scrapedTweets.length,
      tweets: scrapedTweets,
    });
  } catch (err) {
    console.error("❌ Scrape error:", err.message);
    res.status(500).json({ error: "Scraping failed", message: err.message });
  }
});




// router.get("/search", async (req, res) => {
//   const keyword = req.query.keyword;
//   if (!keyword) return res.status(400).json({ error: "Keyword is required" });
//   await db.query(`INSERT INTO search_history (keyword) VALUES ($1)`, [keyword]);

//   let browser;
//   try {
//     const wsEndpoint = await launchChromeIfNeeded();

//     browser = await puppeteer.connect({
//       browserWSEndpoint: wsEndpoint,
//       defaultViewport: null,
//     });

//     const page = await browser.newPage();
//     const searchQuery = encodeURIComponent(keyword);

//     await page.goto(
//       `https://twitter.com/search?q=${searchQuery}&src=typed_query`,
//       {
//         waitUntil: "domcontentloaded",
//       }
//     );

//     for (let i = 0; i < 10; i++) {
//       await page.evaluate(() => window.scrollBy(0, window.innerHeight));
//       await new Promise((res) => setTimeout(res, 1500));
//     }

//     const scrapedTweets = await page.evaluate(() => {
//       const articles = document.querySelectorAll("article");
//       return Array.from(articles)
//         .map((article) => {
//           const text = article.querySelector("div[lang]")?.innerText;
//           const idMatch = article
//             .querySelector('a[href*="/status/"]')
//             ?.getAttribute("href")
//             ?.match(/status\/(\d+)/);
//           const id = idMatch ? idMatch[1] : null;

//           if (!id || !text) return null;

//           return {
//             id,
//             text,
//             like_count: Math.floor(Math.random() * 1000),
//             retweet_count: Math.floor(Math.random() * 500),
//           };
//         })
//         .filter(Boolean);
//     });

//     // Generate replies and save
//     for (const tweet of scrapedTweets) {
//       const reply = await generateReply(tweet.text);
//       tweet.reply = reply;

//       await db.query(
//         `INSERT INTO tweets (id, text, reply, like_count, retweet_count, keyword, created_at)
//          VALUES ($1, $2, $3, $4, $5, $6, NOW())
//       ON CONFLICT (id) DO NOTHING`,
//         [
//           tweet.id,
//           tweet.text,
//           reply,
//           tweet.like_count,
//           tweet.retweet_count,
//           keyword,
//         ]
//       );
//     }

//     res.json({ keyword, count: scrapedTweets.length, tweets: scrapedTweets });
//   } catch (err) {
//     console.error("❌ Scrape error:", err.message);
//     res.status(500).json({ error: "Scraping failed", message: err.message });
//   } finally {
//     if (browser) await browser.disconnect();
//   }
// });

// routes/searchRoutes.js
router.get("/search/history", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, text,reply, like_count, retweet_count, keyword, created_at
      FROM tweets
      ORDER BY created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("❌ Failed to fetch tweet history:", err.message);
    res.status(500).json({ error: "Failed to fetch tweet history" });
  }
});


router.delete("/search/delete/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(`DELETE FROM tweets WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete error:", err.message);
    res.status(500).json({ error: "Delete failed" });
  }
});
// POST /api/post-reply
router.post("/post-reply", async (req, res) => {
  const { tweetId, replyText, accessToken } = req.body;

  try {
    const response = await axios.post(
      "https://api.twitter.com/2/tweets",
      {
        text: replyText,
        reply: { in_reply_to_tweet_id: tweetId },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(200).json({ message: "Reply posted!", data: response.data });
  } catch (err) {
    console.error("Tweet post error", err?.response?.data || err);
    res.status(500).json({ error: "Failed to post tweet" });
  }
});

module.exports = router;
