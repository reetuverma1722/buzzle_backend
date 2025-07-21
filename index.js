// const express = require('express');
// const bodyParser = require('body-parser');
// const login = require('./login');

// const app = express();
// app.use(bodyParser.json());

// app.post('/login', async (req, res) => {
//   const { username, password } = req.body;
//   const result = await login.login(username, password);
//   res.json(result);
// });

// app.listen(3001, () => {
//   console.log('Server is running on port 3001');
// });

// index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const searchRoutes = require('./routes/searchRoutes');
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json()); 

app.use('/api/auth', authRoutes); 
app.use('/api', searchRoutes); 
const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => {
  const twitterId = req.query.twitterId;

  if (!twitterId) {
    return res.status(400).send('Missing twitterId');
  }

  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${encodeURIComponent(SCOPES)}&state=${STATE}&code_challenge=${code_challenge}&code_challenge_method=S256`;

  console.log('\n🔗 Visit this link to authorize:');
  console.log(authUrl);

  // Store the twitterId in a cookie or session — for now we'll pass it back
  res.redirect(authUrl); // or show login page with the link
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
