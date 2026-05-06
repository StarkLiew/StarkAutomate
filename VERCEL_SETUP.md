# Vercel Database Proxy Setup Guide

This guide walks you through deploying the database proxy to Vercel, which will handle all MySQL queries for your Cloudflare Worker.

## Architecture

```
[Client Browser] 
    ↓
[Cloudflare Worker] (worker.js)
    ↓
[Vercel API] (api/db-proxy.js)
    ↓
[MySQL Database] (Infinity Free)
```

---

## Step 1: Create Vercel Project

### Option A: Deploy from GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New..." → "Project"
4. Select your GitHub repository
5. Click "Import"

### Option B: Deploy from Local

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy from your project directory:
   ```bash
   cd /Users/user/Documents/Projects/sas
   vercel
   ```

3. Follow the prompts (choose "default" for most settings)

---

## Step 2: Set Environment Variables

After deployment, add these environment variables to Vercel:

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add each variable:

| Name | Value |
|------|-------|
| `DB_HOST` | `sql305.infinityfree.com` |
| `DB_USER` | `if0_41775688` |
| `DB_PASSWORD` | `E4Z1aMRH6foh` |
| `DB_NAME` | `if0_41775688_sas` |
| `DB_PORT` | `3306` |
| `DB_API_KEY` | Generate a secure key (e.g., `stark-db-key-2024`) |

4. Click "Save"

---

## Step 3: Update worker.js

Update the Vercel URL and API key in your worker.js:

```javascript
const DB_PROXY_URL = 'https://your-project-name.vercel.app/api/db-proxy';
const DB_API_KEY = 'stark-db-key-2024'; // Use the same key from Step 2
```

Or use environment variables (preferred):

**In wrangler.toml:**
```toml
[env.production]
vars = { DB_PROXY_URL = "https://your-project-name.vercel.app/api/db-proxy", DB_API_KEY = "stark-db-key-2024" }
```

Then in worker.js:
```javascript
const DB_PROXY_URL = ENVIRONMENT.DB_PROXY_URL || 'https://your-project-name.vercel.app/api/db-proxy';
const DB_API_KEY = ENVIRONMENT.DB_API_KEY || 'stark-db-key-2024';
```

---

## Step 4: Test the Connection

### Test Vercel Endpoint Directly

```bash
curl -X POST https://your-project-name.vercel.app/api/db-proxy \
  -H "Content-Type: application/json" \
  -H "x-db-api-key: stark-db-key-2024" \
  -d '{
    "query": "SELECT * FROM clients LIMIT 1",
    "params": []
  }'
```

Expected response:
```json
{
  "rows": [
    {"id": "...", "email": "...", "company_name": "..."}
  ]
}
```

### Test via Worker

```bash
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## Step 5: Deploy Worker to Cloudflare

1. Update wrangler.toml if needed:

```toml
name = "starkautomate"
main = "worker.js"
compatibility_date = "2024-01-01"

[env.production]
vars = { 
  DB_PROXY_URL = "https://your-project-name.vercel.app/api/db-proxy",
  DB_API_KEY = "stark-db-key-2024"
}
```

2. Deploy:
```bash
wrangler publish --env production
```

---

## Troubleshooting

### Issue: "Unauthorized" Error

**Cause:** API key mismatch

**Fix:** Verify that:
- Vercel environment variable `DB_API_KEY` matches
- worker.js `DB_API_KEY` matches
- Request header includes `x-db-api-key: your-key`

### Issue: "Database error" Response

**Cause:** MySQL query failed

**Fix:**
1. Check Vercel logs: `vercel logs`
2. Verify SQL query syntax
3. Check if table exists in database

### Issue: CORS Error

**Cause:** Vercel endpoint blocked by CORS policy

**Fix:** Add CORS headers to Vercel response:

```javascript
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-db-api-key');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // ... rest of handler
}
```

### Issue: "Connection refused" to MySQL

**Cause:** Network connectivity issue

**Fix:**
1. Verify MySQL credentials in Infinity Free
2. Check if database port (3306) is accessible from Vercel
3. Try connecting directly from local machine first

---

## Monitoring & Logs

### View Vercel Logs

```bash
# Real-time logs
vercel logs

# Logs from specific time
vercel logs --since 2h
```

### Monitor Performance

In Vercel Dashboard:
- Click "Analytics"
- View response times and errors
- Check function execution duration

---

## Next Steps

1. ✅ Deploy Vercel proxy
2. ✅ Test database connection
3. Create test client account
4. Test full login flow
5. Deploy Worker to Cloudflare
6. Test end-to-end from dashboard

---

## Quick Reference

**Vercel Dashboard:** https://vercel.com/dashboard
**Vercel Project Settings:** https://vercel.com/projects/[project-name]/settings
**View Logs:** `vercel logs --follow`
**Redeploy:** `vercel --prod`

---
