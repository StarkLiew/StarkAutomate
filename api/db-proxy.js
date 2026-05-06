// Vercel Serverless Function - Database Proxy
// Deploy this to Vercel under /api/db-proxy.js

import mysql from 'mysql2/promise';

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify API key
  const apiKey = req.headers['x-db-api-key'];
  if (apiKey !== process.env.DB_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { query, params } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.execute(query, params || []);
    connection.release();

    return res.status(200).json({ rows });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ 
      error: 'Database error',
      details: error.message 
    });
  }
}
