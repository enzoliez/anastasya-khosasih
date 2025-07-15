const { Client } = require('pg');
const client = new Client({ connectionString: process.env.PG_URI, ssl: { rejectUnauthorized: false } });
client.connect();

client.query(\`
CREATE TABLE IF NOT EXISTS owo_counts (
  user_id TEXT PRIMARY KEY,
  daily INTEGER DEFAULT 0,
  weekly INTEGER DEFAULT 0,
  monthly INTEGER DEFAULT 0
);\`);

module.exports = {
  async incrementCounts(userId) {
    await client.query(
      \`INSERT INTO owo_counts (user_id, daily, weekly, monthly)
       VALUES ($1, 1, 1, 1)
       ON CONFLICT (user_id)
       DO UPDATE SET
         daily = owo_counts.daily + 1,
         weekly = owo_counts.weekly + 1,
         monthly = owo_counts.monthly + 1;\`,
      [userId]
    );
  },

  async getUserCounts(userId) {
    const res = await client.query(\`SELECT * FROM owo_counts WHERE user_id = $1\`, [userId]);
    if (res.rows.length === 0) {
      return { daily: 0, weekly: 0, monthly: 0 };
    }
    return res.rows[0];
  },

  async getTopCounts(column, limit) {
    const res = await client.query(\`SELECT * FROM owo_counts ORDER BY \${column} DESC LIMIT $1\`, [limit]);
    return res.rows;
  }
};
