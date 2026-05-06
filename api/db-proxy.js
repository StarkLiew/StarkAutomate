// Vercel Serverless Function - Database Proxy
// Deploy this to Vercel under /api/db-proxy.js

import mysql from 'mysql2/promise';

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

function jsonResponse(res, status, payload) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-db-api-key');
  res.statusCode = status;
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-db-api-key');
    return res.end();
  }

  if (req.method !== 'POST') {
    return jsonResponse(res, 405, { error: 'Method not allowed' });
  }

  const apiKey = req.headers['x-db-api-key'];
  if (apiKey !== process.env.DB_API_KEY) {
    return jsonResponse(res, 401, { error: 'Unauthorized' });
  }

  try {
    const { query, params } = req.body;

    if (!query) {
      return jsonResponse(res, 400, { error: 'Query required' });
    }

    const connection = await pool.getConnection();
    const [rows] = await connection.execute(query, params || []);
    connection.release();

    return jsonResponse(res, 200, { rows });
  } catch (error) {
    console.error('Database error:', error);
    return jsonResponse(res, 500, {
      error: 'Database error',
      details: error.message,
    });
  }
}
