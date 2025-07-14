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
    // const expandedQuery = await expandKeyword(keyword);
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

    res.json(twitterRes.data);
  } catch (err) {
    console.error('Twitter AI Search Error:', err.message);
    res.status(500).json({ message: 'AI-powered Twitter search failed' });
  }
});

module.exports = router;
