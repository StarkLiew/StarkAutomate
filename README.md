Stark Automation Solutions — Single-page site + Cloudflare Worker

Files:
- index.html  — Single page site (form posts to /api/enquiry)
- worker.js   — Cloudflare Worker that forwards form submissions to Telegram using secrets

Deployment (recommended)
1) Create a Cloudflare Pages site for the static files (index.html).
   - Connect your repo or upload index.html.
   - Configure the Pages site to serve the site (standard).

2) Deploy the Worker to handle /api/enquiry securely (keeps Telegram token secret).
   - Install Wrangler: `npm install -g wrangler`
   - Login: `wrangler login`
   - Create a simple wrangler project or publish directly:
     - `wrangler init stark-enquiry-worker --type=javascript`
     - Replace the generated `index.js` with the contents of worker.js (or copy worker.js into the project)
   - Set secrets (do NOT commit these):
     - `wrangler secret put TELEGRAM_BOT_TOKEN` (paste bot token)
     - `wrangler secret put TELEGRAM_CHAT_ID` (paste chat id or channel id)
   - Publish the worker: `wrangler publish --name stark-enquiry-worker`

3) Route requests from the Pages site to the Worker:
   - Option A (Cloudflare Pages Functions): Deploy the worker as a Pages Function at /api/enquiry (see Pages docs).
   - Option B (Worker route): In Cloudflare dashboard, set a route like `example.com/api/enquiry` to the Worker and point your Pages site to `example.com`.

Telegram setup notes
- Create a bot with @BotFather to get a token.
- To get your chat id, message the bot and use `https://api.telegram.org/bot<token>/getUpdates` or use a tool to find the chat id.

Security notes
- Never embed the bot token or chat id in client-side code.
- Use Wrangler secrets or Cloudflare dashboard environment variables to store TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.

If you want, the worker can be adapted to also store enquiries in a KV namespace or send an acknowledgement email. Tell me if you'd like those changes, or provide your Cloudflare account/route and I can give exact wrangler.toml snippets.