const express = require('express');
const axios = require('axios');
const app = express();

const PORT = 3000;

app.get('/', async (req, res) => {
  const accessToken = req.query.twitterId;
  const tweetId = req.query.tweetId;
  const reply = req.query.reply;

  if (!accessToken || !tweetId) {
    return res.status(400).send('❌ Missing accessToken or tweetId');
  }

  try {
    // ✅ Step 1: Get user ID
    const userRes = await axios.get('https://api.twitter.com/2/users/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userId = userRes.data?.data?.id;
    if (!userId) return res.status(400).send("❌ Couldn't fetch user ID");

    console.log(`👤 User ID: ${userId}`);
    console.log(`🔁 Retweeting tweet: ${tweetId}`);

    // ✅ Step 2: Retweet
    const retweetRes = await axios.post(
      `https://api.twitter.com/2/users/${userId}/retweets`,
      { tweet_id: tweetId },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // ✅ Step 3: Optional reply
    let replyRes = null;
    if (reply && reply.trim()) {
      replyRes = await axios.post(
        `https://api.twitter.com/2/tweets`,
        {
          text: reply,
          reply: {
            in_reply_to_tweet_id: tweetId,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    res.send({
      message: '✅ Retweet and reply successful',
      retweetData: retweetRes.data,
      replyData: replyRes?.data || null,
    });
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
    res.status(500).send('❌ Failed to retweet or reply');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
