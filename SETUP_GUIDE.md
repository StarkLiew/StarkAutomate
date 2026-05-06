# Stark Automate Client Dashboard - Setup Guide

## Project Overview

This dashboard allows clients to:
1. **Login** with email and password (JWT-based authentication)
2. **Manage WhatsApp Message Templates** - Create, submit for approval, and track status
3. **Create & Manage Campaigns** - Schedule messages using approved templates
4. **View Analytics** - Track message delivery, reads, and failures
5. **Light/Dark Mode** - Toggle between themes with green accent (#02a54b)

## Directory Structure

```
/Users/user/Documents/Projects/sas/
├── public/
│   ├── index.html                    # Main website
│   ├── clients/
│   │   ├── login.html               # Client login page
│   │   └── dashboard.html           # Main dashboard (templates, campaigns, analytics)
│   ├── blog/
│   ├── pricing.html
│   └── ...
├── worker.js                        # Cloudflare Worker (API routes)
├── wrangler.toml                    # Cloudflare config
├── package.json
├── DATABASE_SCHEMA.sql              # MySQL database schema
└── SETUP_GUIDE.md                   # This file
```

## Database Setup

### 1. Create MySQL Database

Use phpMyAdmin on Infinity Free to run the SQL script:

```
File: DATABASE_SCHEMA.sql
```

**Quick Steps:**
1. Go to: https://www.infinityfree.net/
2. Login to your account
3. Click "MySQL" in the dashboard
4. Click "phpMyAdmin" 
5. Create database: `if0_41775688_sas`
6. Import `DATABASE_SCHEMA.sql` from the SQL tab

### 2. Database Credentials (Already in worker.js)
```javascript
host: 'sql305.infinityfree.com'
user: 'if0_41775688'
password: 'E4Z1aMRH6foh'
database: 'if0_41775688_sas'
port: 3306
```

## Backend Implementation (Worker.js)

The worker currently has placeholder database calls. You need to add a proper MySQL library and implement these functions:

### 1. Install MySQL Library

Since Cloudflare Workers don't have native MySQL support, you have two options:

**Option A: Use Cloudflare D1 (Recommended)**
- Migrate to D1 SQLite database (easier for Workers)
- Update worker.js to use D1 client

**Option B: Use Remote MySQL API**
- Create a small Node.js server that handles DB queries
- Or use: https://www.sqlalchemy.org/sqlalchemy/ext/asyncio/ with FastAPI

**Option C: Use Prisma with Serverless**
- Add Prisma as a data proxy layer

### 2. Database Query Implementation

Replace the TODO comments in worker.js with actual queries:

**In handleLogin():**
```javascript
// TODO: Query MySQL database to verify credentials
const query = `SELECT id, email, password_hash FROM clients WHERE email = ?`;
// Verify password_hash matches input password (use bcrypt)
// Generate JWT token with client ID
```

**In handleGetTemplates():**
```javascript
const query = `SELECT * FROM templates WHERE client_id = ? ORDER BY created_at DESC`;
```

**In handleCreateTemplate():**
```javascript
const query = `INSERT INTO templates (id, client_id, purpose, message, cta, cta_url, attachment, status, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`;
```

**In handleGetCampaigns():**
```javascript
const query = `SELECT c.*, t.message FROM campaigns c 
JOIN templates t ON c.template_id = t.id 
WHERE c.client_id = ? ORDER BY c.created_at DESC`;
```

**In handleCreateCampaign():**
```javascript
const query = `INSERT INTO campaigns (id, client_id, template_id, name, schedule_date, schedule_time, timezone, sheets_link, status, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', NOW())`;
```

**In handleGetAnalytics():**
```javascript
const query = `SELECT 
  COUNT(CASE WHEN cm.status='sent' THEN 1 END) as sent,
  COUNT(CASE WHEN cm.status='read' THEN 1 END) as read,
  COUNT(CASE WHEN cm.status='failed' THEN 1 END) as failed
FROM campaign_messages cm
WHERE cm.campaign_id IN (SELECT id FROM campaigns WHERE client_id = ?)`;
```

## Frontend Implementation

### 1. Login Page (`public/clients/login.html`)
- ✅ Complete with JWT token storage
- Theme toggle (light/dark)
- Form validation
- Error handling

### 2. Dashboard (`public/clients/dashboard.html`)
- ✅ Sidebar navigation
- ✅ Analytics metrics cards
- ✅ Message template manager
- ✅ Campaign manager
- ✅ Modal forms
- ✅ Light/dark mode toggle
- ⚠️ Needs real API integration

### 3. Features to Complete

**Templates Section:**
- [ ] Display templates by status (all, approved, pending, rejected)
- [ ] Add "Cancel Submission" button for pending templates
- [ ] Show template details in expandable rows

**Campaigns Section:**
- [ ] Display all campaigns
- [ ] Add "Edit" button (only for paused campaigns)
- [ ] Add "Start/Pause/Resume" buttons
- [ ] Add "Delete" button
- [ ] Show campaign status with color-coded badges

**Analytics Section:**
- [ ] Fetch real metrics from backend
- [ ] Show campaign delivery breakdown
- [ ] Add date range filter
- [ ] Display failure reasons

## Deployment

### 1. Deploy to Cloudflare

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy worker
wrangler publish --name starkautomate
```

### 2. Set Environment Secrets

```bash
# Set database credentials (optional, already in worker.js)
wrangler secret put DB_HOST
wrangler secret put DB_USER
wrangler secret put DB_PASSWORD

# Keep existing Telegram secrets
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
```

### 3. Deploy Static Files

```bash
# Option 1: Cloudflare Pages (recommended)
# Upload public/ folder to Cloudflare Pages
# Domain: starkautomate.com

# Option 2: Manually upload
# Use Cloudflare dashboard to upload HTML files
```

### 4. Route Configuration

In Cloudflare Dashboard:
- Set route: `starkautomate.com/clients/*` → serves `public/clients/` files
- Set route: `starkautomate.com/api/*` → routes to Worker
- Set route: `starkautomate.com` → serves `public/` files

## Color Scheme

Primary Green: `#02a54b`
- Primary Light: `#04d861`
- Primary Dark: `#017a3a`

Light Mode:
- Background: `#ffffff`
- Text: `#1a1a1a`
- Surface: `#f5f5f5`

Dark Mode:
- Background: `#0f1419`
- Text: `#e4e4eb`
- Surface: `#1a1a24`

## Testing

### 1. Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Test Templates API
```bash
curl -X GET http://localhost:3000/api/templates \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Campaigns API
```bash
curl -X GET http://localhost:3000/api/campaigns \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Next Steps

1. **Implement MySQL Connection** - Add proper database layer to worker.js
2. **Add Authentication** - Use bcrypt for password hashing
3. **Complete Frontend API Calls** - Integrate dashboard with backend
4. **Add File Upload** - For template attachments (images/videos)
5. **Implement Google Sheets Integration** - Read recipient list from sheets
6. **Add WhatsApp API Integration** - Send actual messages (use WhatsApp Business API)
7. **Add Email Notifications** - Notify clients of template approvals
8. **Add Admin Dashboard** - For approving/rejecting templates

## Security Notes

⚠️ **Important for Production:**
- Use HTTPS only
- Implement rate limiting
- Add CSRF protection
- Validate all inputs server-side
- Use password hashing (bcrypt)
- Implement refresh token rotation
- Add request signing
- Audit all database operations
- Enable CORS restrictions (not `*`)
- Add API key rotation
- Implement monitoring & logging

## Support

For issues or questions about setup, check:
- Cloudflare Workers docs: https://developers.cloudflare.com/workers/
- MySQL docs: https://dev.mysql.com/doc/
- JWT docs: https://jwt.io/
