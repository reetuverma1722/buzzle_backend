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
app.listen(PORT, function () {
  console.log("\uD83D\uDE80 Server running on port ".concat(PORT));
});