"use strict";

var express = require('express');

var axios = require('axios');

var crypto = require('crypto');

var app = express();
var PORT = 3000;
var REDIRECT_URI = 'http://localhost:3000/callback';
var SCOPES = 'tweet.read tweet.write users.read offline.access';
var code_verifier = crypto.randomBytes(64).toString('hex');
var code_challenge = crypto.createHash('sha256').update(code_verifier).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
var STATE = crypto.randomBytes(16).toString('hex');
app.get('/', function (req, res) {
  var twitterId = req.query.twitterId;

  if (!twitterId) {
    return res.status(400).send('Missing twitterId');
  }

  var authUrl = "https://twitter.com/i/oauth2/authorize?response_type=code&client_id=".concat(twitterId, "&redirect_uri=").concat(encodeURIComponent(REDIRECT_URI), "&scope=").concat(encodeURIComponent(SCOPES), "&state=").concat(STATE, "&code_challenge=").concat(code_challenge, "&code_challenge_method=S256");
  console.log('\n🔗 Visit this link to authorize:');
  console.log(authUrl); // Store the twitterId in a cookie or session — for now we'll pass it back

  res.redirect(authUrl); // or show login page with the link
});
app.listen(PORT, function () {
  console.log("\uD83D\uDE80 Server running at http://localhost:".concat(PORT));
});