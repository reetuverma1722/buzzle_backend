const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // ✅ NEW
const pool = require('../db');
const router = express.Router();
require('dotenv').config(); // ✅ make sure this is here
const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const { expandKeyword } = require('../aiSearch');

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
      [email, hashedPassword]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser.rows[0],
    });
  } catch (err) {
    console.log("register error")
    res.status(500).json({ error: err.message });
  }
});

// 🔐 Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // ✅ Generate JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'secretkey', // fallback secret
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token, // ✅ Send token to client
      user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/google-login', async (req, res) => {
  const { email, name, googleId } = req.body;

  if (!email || !googleId) {
    return res.status(400).json({ message: 'Missing email or googleId' });
  }

  try {
    // 1. Check if user exists
    let userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    let user;
    if (userRes.rows.length === 0) {
      // 2. If not exists, insert new user
      const insertRes = await pool.query(
        'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING *',
        [email, googleId, name] // password will just be googleId placeholder
      );
      user = insertRes.rows[0];
    } else {
      user = userRes.rows[0];
    }

    // 3. Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 4. Return response
    res.status(200).json({
      message: 'Google login successful',
      user,
      token,
    });

  } catch (err) {
    console.error('Google login error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// router.get('/search', async (req, res) => {
//   const keyword = req.query.keyword;
//   if (!keyword) return res.status(400).json({ message: 'Keyword is required' });

//   try {
//     // ❌ Disable OpenAI to avoid 429 error
//     // const expandedQuery = await expandKeyword(keyword);

//     // ✅ Hardcoded fallback (temporary)
//     const expandedQuery = `"${keyword}" OR "${keyword} news" OR "${keyword} insights"`;
//     console.log('🔍 Using fallback query:', expandedQuery);

//     const twitterRes = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
//       headers: {
//         Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
//       },
//       params: {
//         query: expandedQuery,
//         max_results: 10,
//         'tweet.fields': 'public_metrics,created_at',
//       },
//     });

//     res.json(twitterRes.data);
//   } catch (err) {
//     console.error('❌ Twitter API Error:', err.response?.data || err.message);
//     res.status(500).json({ message: 'Twitter search failed' });
//   }
// });
// backend/routes/search.js or similar
router.get('/api/search', async (req, res) => {
  const { keyword } = req.query;
  const expandedQueries = [
    `${keyword}`,
    `${keyword} news`,
    `${keyword} trends`
  ];

  const results = [];

  try {
    for (const query of expandedQueries) {
      const response = await axios.get(
        `https://api.twitter.com/2/tweets/search/recent`,
        {
          headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` },
          params: {
            query: query,
            max_results: 10,
            'tweet.fields': 'public_metrics',
          }
        }
      );

      results.push(...response.data.data);

      // ✅ Add delay here to prevent 429 rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000)); // wait 1 second
    }

    res.json({ data: results });
  } catch (error) {
    console.error("Twitter API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Search failed", detail: error.message });
  }
});


module.exports = router;
