# Implementation Guide - Steps 1 & 2

## Current Status

✅ **Completed:**
- Password hashing functions added (SHA-256 based for Cloudflare Workers)
- Admin endpoint created: `POST /api/admin/clients` - for creating new clients
- Login endpoint updated - removed `client_id` from response (only in JWT token now)
- Authentication framework ready

⏳ **Needs Implementation:**
- Actual MySQL database connection
- Integration with real database queries

---

## Step 1: Implement MySQL Connection

### Challenge with Cloudflare Workers

Cloudflare Workers run in a restricted environment and **cannot directly connect to external MySQL servers** using traditional drivers.

### Recommended Solutions

#### **Option A: Cloudflare D1 (Recommended)** ⭐
**Pros:**
- Native Cloudflare solution, zero external dependencies
- Free tier available
- Simple integration with Workers
- Best performance

**Steps:**
1. Install Wrangler CLI locally
2. Migrate MySQL data to D1 SQLite
3. Update worker.js to use D1 client
4. Deploy

```bash
# Create new D1 database
wrangler d1 create sas-database

# Migrate data (Wrangler will help guide this)
wrangler d1 execute sas-database < DATABASE_SCHEMA.sql
```

---

#### **Option B: External Database Proxy API** 
**Pros:**
- Keeps existing MySQL server
- Works with any Node.js hosting

**Setup:**
1. Create a simple Node.js API server (Vercel, Railway, or local)
2. Handle all DB queries there
3. Worker proxies requests to this API

**Example proxy server code:**
```javascript
// db-proxy-server.js (deploy to Vercel or Railway)
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'sql305.infinityfree.com',
  user: 'if0_41775688',
  password: 'E4Z1aMRH6foh',
  database: 'if0_41775688_sas',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.post('/db/query', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(req.body.query, req.body.params);
    connection.release();
    res.json(rows);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});
```

Then in worker.js:
```javascript
async function queryDatabase(query, params) {
  const response = await fetch('https://your-db-proxy.com/db/query', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query, params})
  });
  return response.json();
}
```

---

#### **Option C: PlanetScale (MySQL-compatible serverless)**
**Pros:**
- MySQL-compatible
- Works well with Workers
- Free tier available

**Steps:**
1. Create PlanetScale account & database
2. Migrate data from Infinity Free MySQL
3. Use with Prisma or mysql2

---

### Recommended Path for You

**I suggest Option A (D1)** because:
- You're already on Cloudflare
- Simplest migration path
- No external dependencies needed
- Costs less (free tier covers most use cases)
- Best performance for Workers

---

## Step 2: Add Authentication with Password Hashing

### Current Implementation

✅ **Added to worker.js:**
```javascript
// Password hashing using Web Crypto API (SHA-256)
async function hashPassword(password) { ... }
async function verifyPassword(password, hash) { ... }
```

⚠️ **Note:** SHA-256 is simpler but bcrypt is stronger for passwords. For production, use actual bcrypt library via:
- Cloudflare Workers with a bcrypt port
- Or PlanetScale + Prisma combo which has better library support

### How It Works

**Creating Client Account:**
```javascript
POST /api/admin/clients
Content-Type: application/json

{
  "email": "client@company.com",
  "password": "MySecurePassword123",
  "company_name": "Acme Corp"
}
```

**Response (201 Created):**
```json
{
  "id": "client_1234567890",
  "email": "client@company.com",
  "company_name": "Acme Corp",
  "message": "Client created successfully"
}
```

**Then Login:**
```javascript
POST /api/auth/login
Content-Type: application/json

{
  "email": "client@company.com",
  "password": "MySecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGc..."
}
```

**Client stores token in localStorage, uses it for all API calls:**
```javascript
headers: {
  'Authorization': 'Bearer eyJhbGc...'
}
```

---

## How to Create New Client Accounts

### Method 1: Admin API Endpoint (Recommended)

Using cURL:
```bash
curl -X POST http://localhost:3000/api/admin/clients \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newclient@example.com",
    "password": "SecurePassword123",
    "company_name": "Client Company Name"
  }'
```

### Method 2: Direct Database Insertion (Temporary)

Until we have a proper UI admin panel, you can insert directly:

```sql
-- Hash the password first (use the hashPassword function output)
INSERT INTO clients (id, email, password_hash, company_name, created_at)
VALUES (
  'client_' || UNIX_TIMESTAMP(),
  'client@example.com',
  '[SHA256_HASH_OF_PASSWORD_HERE]',
  'Client Company Name',
  NOW()
);
```

### Method 3: Create Admin Dashboard UI (Future)

Create `public/admin/clients.html` with a form to:
- List all clients
- Create new clients
- Reset passwords
- Suspend/activate accounts

---

## Next: Connecting to Database

Once you choose Option A (D1), Option B (proxy), or Option C (PlanetScale):

### Update `handleLogin` to query database:

```javascript
async function handleLogin(request) {
  try {
    const data = await request.json();
    const {email, password} = data;

    if (!email || !password) {
      return new Response(JSON.stringify({error: 'Email and password required'}), 
        {status: 400, headers: {...CORS, 'Content-Type': 'application/json'}});
    }

    // Query database for client
    const rows = await queryDatabase(
      'SELECT id, password_hash FROM clients WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return new Response(JSON.stringify({error: 'Invalid credentials'}), 
        {status: 401, headers: {...CORS, 'Content-Type': 'application/json'}});
    }

    // Verify password
    const client = rows[0];
    const passwordValid = await verifyPassword(password, client.password_hash);
    
    if (!passwordValid) {
      return new Response(JSON.stringify({error: 'Invalid credentials'}), 
        {status: 401, headers: {...CORS, 'Content-Type': 'application/json'}});
    }

    // Generate JWT token
    const token = generateToken(client.id);

    return new Response(JSON.stringify({token}), 
      {status: 200, headers: {...CORS, 'Content-Type': 'application/json'}});
  } catch (err) {
    return new Response(JSON.stringify({error: 'Login failed', details: String(err)}), 
      {status: 500, headers: {...CORS, 'Content-Type': 'application/json'}});
  }
}
```

---

## Security Checklist

- ✅ Passwords hashed before storage
- ✅ client_id removed from URL responses
- ✅ JWT tokens used for auth
- ⏳ Need: Admin API key protection
- ⏳ Need: Rate limiting on login
- ⏳ Need: HTTPS only (automatic on Cloudflare)
- ⏳ Need: Refresh token rotation

---

## Testing Sequence

1. **Create client account** (using API endpoint)
2. **Login** with those credentials
3. **Verify token** endpoint
4. **Access protected endpoints** (templates, campaigns)

```bash
# 1. Create client
curl -X POST http://localhost:3000/api/admin/clients \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "company_name": "Test Corp"
  }'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'

# 3. Verify (use token from login response)
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 4. Get templates (protected)
curl -X GET http://localhost:3000/api/templates \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Recommendation: Next Immediate Steps

1. **Choose database option** (D1 recommended)
2. **Set up database proxy/connection**
3. **Test handleLogin with real database queries**
4. **Create admin UI for client management** (optional but helpful)
5. **Test full auth flow end-to-end**
6. **Deploy to Cloudflare**

---
