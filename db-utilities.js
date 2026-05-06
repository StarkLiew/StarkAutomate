// Database Utilities for Stark Automate Dashboard
// Note: This file demonstrates how to implement database operations
// For Cloudflare Workers, you'll need to use either:
// 1. Cloudflare D1 (SQLite) - recommended
// 2. A serverless function layer for MySQL
// 3. Prisma with serverless adapter

// ============ IMPLEMENTATION OPTIONS ============

/*
OPTION 1: Use Cloudflare D1 (SQLite) - RECOMMENDED
- No external database needed
- Built into Cloudflare
- Faster performance
- Easier to deploy

Installation:
npm install -D wrangler @cloudflare/workers-types
npx wrangler d1 create sas-db

Then update wrangler.toml with:
[env.production]
d1_databases = [
  {binding = "DB", database_id = "YOUR_DB_ID"}
]

Usage in worker.js:
const result = await env.DB.prepare(
  'SELECT * FROM clients WHERE email = ?'
).bind(email).first();
*/

/*
OPTION 2: Use External MySQL with Node.js server
- Keep current MySQL database
- Create separate Node.js server for DB queries
- Cloudflare Worker calls your Node server

This requires:
- Deploying a Node.js server (Railway, Render, Heroku)
- Setting up API endpoints for database operations
- Handling auth between Worker and Node server
*/

/*
OPTION 3: Use Prisma ORM with serverless
- Full-featured ORM
- Connection pooling support
- Type safety

Installation:
npm install @prisma/client
npm install -D prisma
npx prisma init
*/

// ============ SAMPLE DATABASE FUNCTIONS ============

// For reference - these would be implemented with your chosen method

// Example with mysql2/promise library (for Node.js server)
/*
const mysql = require('mysql2/promise');

async function getClient(email) {
  const connection = await mysql.createConnection({
    host: 'sql305.infinityfree.com',
    user: 'if0_41775688',
    password: 'E4Z1aMRH6foh',
    database: 'if0_41775688_sas'
  });

  const [rows] = await connection.execute(
    'SELECT id, email, password_hash FROM clients WHERE email = ?',
    [email]
  );

  await connection.end();
  return rows[0];
}

async function createTemplate(clientId, purpose, message, cta, ctaUrl, attachment) {
  const connection = await mysql.createConnection({...});
  
  const [result] = await connection.execute(
    `INSERT INTO templates (id, client_id, purpose, message, cta, cta_url, attachment, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
    ['tpl_' + Date.now(), clientId, purpose, message, cta, ctaUrl, attachment]
  );

  await connection.end();
  return result.insertId;
}

async function getTemplates(clientId) {
  const connection = await mysql.createConnection({...});
  
  const [templates] = await connection.execute(
    'SELECT * FROM templates WHERE client_id = ? ORDER BY created_at DESC',
    [clientId]
  );

  await connection.end();
  return templates;
}

async function getCampaigns(clientId) {
  const connection = await mysql.createConnection({...});
  
  const [campaigns] = await connection.execute(
    `SELECT c.*, t.message FROM campaigns c 
     JOIN templates t ON c.template_id = t.id 
     WHERE c.client_id = ? 
     ORDER BY c.created_at DESC`,
    [clientId]
  );

  await connection.end();
  return campaigns;
}

async function getAnalytics(clientId) {
  const connection = await mysql.createConnection({...});
  
  const [stats] = await connection.execute(
    `SELECT 
      COUNT(CASE WHEN cm.status='sent' THEN 1 END) as sent,
      COUNT(CASE WHEN cm.status='read' THEN 1 END) as read,
      COUNT(CASE WHEN cm.status='failed' THEN 1 END) as failed
    FROM campaign_messages cm
    WHERE cm.campaign_id IN (SELECT id FROM campaigns WHERE client_id = ?)`,
    [clientId]
  );

  await connection.end();
  return stats[0];
}
*/

// ============ SAMPLE CLOUDFLARE D1 USAGE ============

/*
// In worker.js, add this to handle() function:

export default {
  async fetch(request, env, ctx) {
    // Now you can use env.DB for database queries
    
    if (url.pathname === '/api/auth/login') {
      const data = await request.json();
      const client = await env.DB.prepare(
        'SELECT id, email, password_hash FROM clients WHERE email = ?'
      ).bind(data.email).first();
      
      if (!client) {
        return new Response(JSON.stringify({error: 'Invalid credentials'}), 
          {status: 401});
      }
      
      // Verify password with bcrypt
      // Generate JWT token
    }
  }
}
*/

// ============ PASSWORD HASHING (Use bcryptjs) ============

/*
Installation:
npm install bcryptjs

Usage:
import bcrypt from 'bcryptjs';

// Hash password on signup
const hashedPassword = await bcrypt.hash(password, 10);

// Verify password on login
const isValid = await bcrypt.compare(password, storedHash);
*/

// ============ HELPER FUNCTIONS ============

// Generate UUID for records
function generateId(prefix = 'id') {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Format timestamp
function getCurrentTimestamp() {
  return new Date().toISOString();
}

// Validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitize input
function sanitizeInput(value) {
  if (!value) return '';
  return String(value).slice(0, 1000).trim();
}

// ============ MIGRATION SCRIPT ============

/*
To run migrations on Cloudflare D1:

npx wrangler d1 execute sas-db --file=./DATABASE_SCHEMA.sql

Or upload the SQL file directly through D1 dashboard.
*/

module.exports = {
  generateId,
  getCurrentTimestamp,
  isValidEmail,
  sanitizeInput
};
