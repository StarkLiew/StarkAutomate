# Quick Start Guide - Stark Automate Dashboard

## 1. Database Setup (5 min)

```bash
# Connect to Infinity Free MySQL
# Via phpMyAdmin: https://your-account.infinityfree.net/

# Copy and paste the entire content of:
# DATABASE_SCHEMA.sql

# Execute in SQL tab
```

**Credentials to use:**
- Host: `sql305.infinityfree.com`
- User: `if0_41775688`
- Password: `E4Z1aMRH6foh`
- Database: Create `if0_41775688_sas`

## 2. Deploy Worker

```bash
# Install Wrangler (if not already installed)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy the worker
cd /Users/user/Documents/Projects/sas
wrangler publish --name starkautomate
```

## 3. Deploy Static Files

```bash
# Option A: Cloudflare Pages (Recommended)
# 1. Go to https://pages.cloudflare.com
# 2. Connect your Git repo or upload files
# 3. Set build command: none (static files)
# 4. Set publish directory: public/

# Option B: Manual upload via Cloudflare dashboard
# 1. Upload public/ folder to your domain
```

## 4. Test Login

```bash
# Visit: https://starkautomate.com/clients/login.html

# Test credentials:
# Note: First, you need to add test user to database:
INSERT INTO clients (id, email, password_hash, company_name, status)
VALUES ('test_client_1', 'test@example.com', 'hashed_password', 'Test Company', 'active');

# Then login with those credentials
```

## 5. File Structure After Setup

```
sas/
├── public/
│   ├── index.html              # Marketing homepage
│   ├── clients/
│   │   ├── login.html          # Login page
│   │   └── dashboard.html      # Dashboard
│   └── ...
├── worker.js                   # API backend
├── wrangler.toml               # Worker config
├── DATABASE_SCHEMA.sql         # DB schema
├── SETUP_GUIDE.md              # Full guide
├── IMPLEMENTATION_CHECKLIST.md # TODO list
└── QUICK_START.md              # This file
```

## 6. Routes

After deployment:

```
https://starkautomate.com/                    → index.html (marketing)
https://starkautomate.com/clients/login.html  → Login page
https://starkautomate.com/clients/dashboard.html → Dashboard (after login)
https://starkautomate.com/api/auth/login      → API endpoint
https://starkautomate.com/api/templates       → API endpoint
https://starkautomate.com/api/campaigns       → API endpoint
https://starkautomate.com/api/analytics       → API endpoint
```

## 7. Key Features Implemented

✅ **Login & Auth**
- Email/password authentication
- JWT token storage
- Automatic redirect to login if not authenticated

✅ **Dashboard**
- Message template manager (add, cancel, track status)
- Campaign manager (create, schedule, pause, edit)
- Analytics dashboard (KPIs: sent, read, failed)
- Light/dark mode toggle
- Green theme (#02a54b)
- Responsive mobile design

✅ **Backend**
- API routes structure
- CORS configuration
- Token verification
- Database placeholders (ready for implementation)

## 8. Features To Implement

⚠️ **Still Need:**
1. Database connection layer (MySQL queries)
2. Password hashing (bcrypt)
3. Google Sheets integration
4. WhatsApp API integration
5. File upload for attachments
6. Admin approval panel

## 9. Troubleshooting

**Issue: "Cannot POST /api/auth/login"**
→ Check worker.js is deployed: `wrangler publish --name starkautomate`

**Issue: "Unauthorized" on API calls**
→ Ensure token is being sent: `Authorization: Bearer YOUR_TOKEN`

**Issue: Database connection fails**
→ Verify database credentials and IP whitelist on Infinity Free

**Issue: Login page loads but dashboard doesn't**
→ Open browser console (F12), check for JavaScript errors

## 10. Important: Database Implementation

**Current Status:** API endpoints have placeholder code

**Next Action Required:**
Choose ONE method to implement database queries:

**Method A: Cloudflare D1 (RECOMMENDED)**
- Fastest, most integrated
- Requires migrating MySQL → SQLite
- Setup time: 10 minutes

**Method B: External MySQL (CURRENT)**
- Requires Node.js server layer
- More complex setup
- Works with current database

**Method C: Prisma ORM**
- Full-featured ORM
- Connection pooling included
- Setup time: 15 minutes

See `SETUP_GUIDE.md` for detailed comparison.

## 11. Test Checklist

- [ ] Can login with test credentials
- [ ] JWT token appears in localStorage
- [ ] Dashboard loads after login
- [ ] Can create message template
- [ ] Can create campaign
- [ ] Analytics page shows metrics
- [ ] Dark mode toggle works
- [ ] Responsive on mobile

## 12. Useful Commands

```bash
# Check worker logs
wrangler tail --format pretty

# Test worker locally
wrangler dev

# List published workers
wrangler list

# Delete published worker
wrangler delete --name starkautomate

# Update worker.js and redeploy
wrangler publish --name starkautomate
```

## 13. Support Resources

- Cloudflare Workers: https://developers.cloudflare.com/workers/
- MySQL: https://dev.mysql.com/doc/
- JWT: https://jwt.io/
- Infinity Free: https://www.infinityfree.net/

---

**Questions?** Check SETUP_GUIDE.md or IMPLEMENTATION_CHECKLIST.md for more details.
