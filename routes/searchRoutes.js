// routes/searchRoutes.js
const express = require('express');
const axios = require('axios');
const { expandKeyword } = require('../aiSearch');
require('dotenv').config();

const router = express.Router();
const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

router.get('/search', async (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword) return res.status(400).json({ message: 'Keyword is required' });

  try {
    // Expand keyword manually or via AI
    const expandedQuery = `"${keyword}" OR "${keyword} news" OR "${keyword} trends"`;
    console.log('🔍 Expanded Query:', expandedQuery);

    const twitterRes = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
      headers: {
        Authorization: `Bearer ${BEARER_TOKEN}`,
      },
      params: {
        query: expandedQuery,
        max_results: 10,
        'tweet.fields': 'public_metrics,created_at',
      },
    });

    const tweets = twitterRes.data.data || [];

    // ✅ Sort by average of likes and retweets
    const sortedTweets = tweets.sort((a, b) => {
      const aMetrics = a.public_metrics || {};
      const bMetrics = b.public_metrics || {};

      const aAvg = (aMetrics.like_count + aMetrics.retweet_count) / 2;
      const bAvg = (bMetrics.like_count + bMetrics.retweet_count) / 2;

      return bAvg - aAvg; // Descending
    });

    res.json({ data: sortedTweets });
  } catch (err) {
    console.error('Twitter AI Search Error:', err.message);
    res.status(500).json({ message: 'AI-powered Twitter search failed' });
  }
});


module.exports = router;
