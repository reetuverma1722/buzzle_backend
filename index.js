

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
