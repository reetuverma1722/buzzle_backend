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
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
