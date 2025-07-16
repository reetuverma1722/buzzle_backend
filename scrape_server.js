// const express = require('express');
// const puppeteer = require('puppeteer');
// const cors = require('cors');

// const app = express();
// app.use(cors());

// app.get('/api/search', async (req, res) => {
//   const keyword = req.query.keyword;
//   if (!keyword) {
//     return res.status(400).json({ error: 'Keyword is required' });
//   }

//   let browser;
//   try {
//     browser = await puppeteer.connect({
//       browserWSEndpoint: 'ws://localhost:9222/devtools/browser/27c6a559-5011-4fd5-8c52-0705bcbd206c',
//     });

//     const page = await browser.newPage();
//     const searchQuery = encodeURIComponent(keyword);

//     // Navigate to Twitter search page
//     await page.goto(`https://twitter.com/search?q=${searchQuery}&src=typed_query`, {
//       waitUntil: 'domcontentloaded',
//     });

//     // Wait for tweet articles
//     await page.waitForSelector('article', { timeout: 15000 });

//     const tweets = await page.evaluate(() => {
//       const tweetElements = document.querySelectorAll('article div[lang]');
//       return Array.from(tweetElements).map((el) => ({
//         text: el.innerText,
//         public_metrics: {
//           like_count: Math.floor(Math.random() * 1000),
//           retweet_count: Math.floor(Math.random() * 500),
//         },
//       }));
//     });

//     res.json({ keyword, count: tweets.length, tweets });
//   } catch (err) {
//     console.error('❌ Scrape error:', err.message);
//     res.status(500).json({ error: 'Scraping failed', message: err.message });
//   }
// });

// const PORT = 5000;
// app.listen(PORT, () => {
//   console.log(`✅ Scraper server running on http://localhost:${PORT}`);
// });


const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
async function generateReply(tweetContent) {
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'mistralai/mixtral-8x7b-instruct', // or other free model
      messages: [
        {
          role: 'user',
          content: `Reply smartly to this tweet:\n"${tweetContent}"\nMake it personal, friendly, and relevant.`,
        },
      ],
    },
    {
      headers: {
        'Authorization': `Bearer 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`,
        'Content-Type': 'application/json',
      },
    }
  );

  const reply = response.data.choices[0]?.message?.content;
  console.log("Reply:", reply);
  return reply;
}
app.get('/api/search', async (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword) {
    return res.status(400).json({ error: 'Keyword is required' });
  }

  let browser;
  try {
    browser = await puppeteer.connect({
      browserWSEndpoint: 'ws://localhost:9222/devtools/browser/a59052c0-b0f5-45fc-894d-355ae8293a2d',
    });

    const page = await browser.newPage();
    const searchQuery = encodeURIComponent(keyword);

    await page.goto(`https://twitter.com/search?q=${searchQuery}&src=typed_query`, {
      waitUntil: 'domcontentloaded',
    }); 

    await page.waitForSelector('article', { timeout: 15000 });

    // 🔁 Scroll to load more tweets
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise((res) => setTimeout(res, 1500));
    }

   const rawTweets = await page.evaluate(() => {
  const tweetElements = document.querySelectorAll('article div[lang]');
  return Array.from(tweetElements).map((el) => el.innerText);
});

// ✅ Now generate replies in Node.js
const tweets = await Promise.all(
  rawTweets.map(async (text) => {
    const reply = await generateReply(text);
    return {
      text,
      reply,
      public_metrics: {
        like_count: Math.floor(Math.random() * 1000),
        retweet_count: Math.floor(Math.random() * 500),
      },
    };
  })
);

    // 🔢 Sort by likes + retweets (descending) and return top 15
    const topTweets = tweets
      .sort((a, b) => {
        const aScore = a.public_metrics.like_count + a.public_metrics.retweet_count;
        const bScore = b.public_metrics.like_count + b.public_metrics.retweet_count;
        return bScore - aScore;
      })
      .slice(0, 15); // limit to top 15

    res.json({ keyword, count: topTweets.length, tweets: topTweets });
  } catch (err) {
    console.error('❌ Scrape error:', err.message);
    res.status(500).json({ error: 'Scraping failed', message: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Scraper server running on http://localhost:${PORT}`);
});
