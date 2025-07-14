const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'buzzly',
  password: 'alokozay',
  port: 5432,
});

module.exports = {
  login: async (username, password) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
      if (result.rows.length > 0) {
        return { success: true, message: 'Login successfullly' };
      } else {
        return { success: false, message: 'Invalid username or password' };
      }
    } catch (err) {
      console.error(err);
      return { success: false, message: 'An error occurred' };
    }
  },
};