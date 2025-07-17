const express = require('express');
const axios = require('axios');
const { expandKeyword } = require('../aiSearch');
require('dotenv').config();

const router = express.Router();

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

router.post('/generateReply', async (req, res) => {
  const { tweetContent } = req.body;
  if (!tweetContent) {
    return res.status(400).send('Tweet content is required');
  }
  try {
    const reply = await generateReply(tweetContent);
    res.status(200).json({ reply });
  } catch (error) {
    console.error('Error generating reply:', error);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;