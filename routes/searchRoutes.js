// // routes/searchRoutes.js
// const express = require('express');
// const axios = require('axios');
// const { expandKeyword } = require('../aiSearch');
// require('dotenv').config();

// const router = express.Router();
// const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

// router.get('/search', async (req, res) => {
//   const keyword = req.query.keyword;
//   if (!keyword) return res.status(400).json({ message: 'Keyword is required' });

//   try {
//     // const expandedQuery = await expandKeyword(keyword);
//     const expandedQuery = `"${keyword}" OR "${keyword} news" OR "${keyword} trends"`;
//     console.log('🔍 Expanded Query:', expandedQuery);

//     const twitterRes = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
//       headers: {
//         Authorization: `Bearer ${BEARER_TOKEN}`,
//       },
//       params: {
//         query: expandedQuery,
//         max_results: 10,
//         'tweet.fields': 'public_metrics,created_at',
//       },
//     });

//     res.json(twitterRes.data);
//   } catch (err) {
//     console.error('Twitter AI Search Error:', err.message);
//     res.status(500).json({ message: 'AI-powered Twitter search failed' });
//   }
// });

// module.exports = router;

const express = require('express');
const axios = require('axios');
const { expandKeyword, generateReply } = require('../aiSearch');
require('dotenv').config();

const router = express.Router();
const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

router.get('/search', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.status(400).json({ message: 'Keyword is required' });

  try {
    const expandedQuery = await expandKeyword(keyword);
    console.log('🔍 Expanded Query:', expandedQuery);

    const twitterRes = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
      },
      params: {
        query: expandedQuery,
        max_results: 3,
        'tweet.fields': 'public_metrics,created_at',
      },
    });

    const tweets = twitterRes.data.data;

    const enrichedTweets = await Promise.all(
      tweets.map(async (tweet) => {
        const comment = await generateReply(tweet.text);
        return {
          post: tweet.text,
          comments: comment,
          metrics: tweet.public_metrics,
        };
      })
    );

    res.json(enrichedTweets);
  } catch (err) {
    console.error('❌ Twitter AI Search Error:', err.message);
    res.status(500).json({ message: 'AI-powered Twitter search failed' });
  }
});

module.exports = router;


