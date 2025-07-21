const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

const PORT = 3000;

// ======== CONFIGURATION ========
 const CLIENT_ID='RVp3MTJpY0ZCWWNwYzlMQzVLN1U6MTpjaQ';
  const CLIENT_SECRET='Y_ox3nJz3uOayyFE-ZRmbF2HCYdkdUcFIBUA6Ef4pGwjjD1-f_';
const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPES = 'tweet.read tweet.write users.read offline.access';
const TWEET_ID_TO_REPOST = '1945561925842342362';
// ===============================

// PKCE setup
const code_verifier = crypto.randomBytes(64).toString('hex');
const code_challenge = crypto
  .createHash('sha256')
  .update(code_verifier)
  .digest('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '');

const STATE = crypto.randomBytes(16).toString('hex');

app.get('/', (req, res) => {
  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${encodeURIComponent(SCOPES)}&state=${STATE}&code_challenge=${code_challenge}&code_challenge_method=S256`;

  console.log('\n🔗 Visit this link to authorize:');
  console.log(authUrl);

  res.send(`<a href="${authUrl}">Login with Twitter</a>`);
});

app.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  if (state !== STATE) {
    return res.status(403).send('State mismatch');
  }

  try {
    // Exchange code for access token
    const params = new URLSearchParams();
    params.append('code', code);
    params.append('grant_type', 'authorization_code');
    params.append('client_id', CLIENT_ID);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('code_verifier', code_verifier);

   

    // const tokenRes = await axios.post('https://api.twitter.com/2/oauth2/token', params.toString(), {
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //   },
    // });
const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

const tokenRes = await axios.post('https://api.twitter.com/2/oauth2/token', params.toString(), {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${credentials}`,
  },
});

    const { access_token } = tokenRes.data;
    console.log('✅ Access token received');

    // Get user ID
    const userRes = await axios.get('https://api.twitter.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const userId = userRes.data.data.id;
    console.log(`👤 Authenticated as user ID: ${userId}`);

    // Retweet
    const repostRes = await axios.post(
      `https://api.twitter.com/2/users/${userId}/retweets`,
      { tweet_id: TWEET_ID_TO_REPOST },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('🔁 Retweet complete:', repostRes.data);
    res.send(`✅ Retweet successful: ${JSON.stringify(repostRes.data)}`);
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    res.status(500).send('❌ Error during OAuth or reposting');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
