"use strict";

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
var express = require('express');

var cors = require('cors');

var dotenv = require('dotenv');

var authRoutes = require('./routes/authRoutes');

var searchRoutes = require('./routes/searchRoutes');

dotenv.config();
var app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api', searchRoutes);
var PORT = process.env.PORT || 5000;
app.get('/', function (req, res) {
  var twitterId = req.query.twitterId;

  if (!twitterId) {
    return res.status(400).send('Missing twitterId');
  }

  var authUrl = "https://twitter.com/i/oauth2/authorize?response_type=code&client_id=".concat(CLIENT_ID, "&redirect_uri=").concat(encodeURIComponent(REDIRECT_URI), "&scope=").concat(encodeURIComponent(SCOPES), "&state=").concat(STATE, "&code_challenge=").concat(code_challenge, "&code_challenge_method=S256");
  console.log('\n🔗 Visit this link to authorize:');
  console.log(authUrl); // Store the twitterId in a cookie or session — for now we'll pass it back

  res.redirect(authUrl); // or show login page with the link
});
app.listen(PORT, function () {
  console.log("\uD83D\uDE80 Server running on port ".concat(PORT));
});