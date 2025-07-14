const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function expandKeyword(originalKeyword) {
  const prompt = `Expand the keyword "${originalKeyword}" into related Twitter search phrases (use OR operator). Only return the search string.`;

  const res = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  return res.choices[0].message.content.trim();
}

module.exports = { expandKeyword };
