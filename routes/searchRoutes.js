
const db = require('../db'); 

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
        max_results: 10,
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

router.get('/tweets', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM tweets ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching tweets:', err);
    res.status(500).json({ error: 'Failed to fetch tweets' });
  }
});


module.exports = router;


