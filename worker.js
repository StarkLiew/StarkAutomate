const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PATCH, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const WHATCHIMP_API_URL = 'https://app.whatchimp.com/api/v1';

// MySQL Connection Config (from Infinity Free)
const DB_CONFIG = {
  host: 'sql305.infinityfree.com',
  user: 'if0_41775688',
  password: 'E4Z1aMRH6foh',
  database: 'if0_41775688_sas',
  port: 3306
};

addEventListener('fetch', event => {
  event.respondWith(handle(event.request))
})

async function handle(request){
  const url = new URL(request.url);
  if(request.method === 'OPTIONS'){
    return new Response(null, {status:204, headers: CORS})
  }
  
  // Handle authentication endpoints
  if(url.pathname === '/api/auth/login' && request.method === 'POST'){
    return handleLogin(request);
  }
  
  if(url.pathname === '/api/auth/verify' && request.method === 'GET'){
    return handleVerifyToken(request);
  }

  // Handle services API proxy
  if(url.pathname.startsWith('/api/services')){
    return proxyService(request, url);
  }

  // Handle templates API
  if(url.pathname === '/api/templates'){
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if(!token) return new Response(JSON.stringify({error:'Unauthorized'}), {status:401, headers:{...CORS,'Content-Type':'application/json'}});
    
    if(request.method === 'GET') return handleGetTemplates(request, token);
    if(request.method === 'POST') return handleCreateTemplate(request, token);
  }

  // Handle campaigns API
  if(url.pathname === '/api/campaigns'){
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if(!token) return new Response(JSON.stringify({error:'Unauthorized'}), {status:401, headers:{...CORS,'Content-Type':'application/json'}});
    
    if(request.method === 'GET') return handleGetCampaigns(request, token);
    if(request.method === 'POST') return handleCreateCampaign(request, token);
  }

  // Handle analytics API
  if(url.pathname === '/api/analytics'){
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if(!token) return new Response(JSON.stringify({error:'Unauthorized'}), {status:401, headers:{...CORS,'Content-Type':'application/json'}});
    
    if(request.method === 'GET') return handleGetAnalytics(request, token);
  }

  // Handle old enquiry form endpoint
  if(url.pathname === '/api' && request.method === 'POST'){
    return handleEnquiry(request);
  }
  
  return new Response(null, {status:404})
}

function sanitize(v){
  if(!v) return '';
  return String(v).slice(0,1000);
}
function escapeHtml(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Proxy function for services API
async function proxyService(request, url){
  const pathWithoutPrefix = url.pathname.replace('/api/services', '');
  
  // Allowed GET endpoints - add patterns that should be accessible via GET
  const allowedGetEndpoints = [
    /^\/get\//,  // Allow /get/* endpoints
  ];
  
  // Check if method is allowed
  const isGetAllowed = allowedGetEndpoints.some(pattern => pattern.test(pathWithoutPrefix));
  
  // if(request.method === 'POST'){
  //   // POST is always allowed
  // } else if(request.method === 'GET' && isGetAllowed){
  //   // GET is allowed for specific endpoints
  // } else {
  //   return new Response(JSON.stringify({error:'Method not allowed. POST is always allowed, GET only for specific endpoints'}), {
  //     status: 405,
  //     headers: {...CORS, 'Content-Type': 'application/json', 'Allow': 'POST, GET'}
  //   });
  // }
  
  try{
    const whatChimpUrl = new URL(WHATCHIMP_API_URL + pathWithoutPrefix + url.search);
    
    // Create new request headers, forwarding authorization if present
    const headers = new Headers(request.headers);
    headers.delete('host'); // Remove the host header as it will be set by fetch
    
    const proxiedRequest = new Request(whatChimpUrl, {
      method: request.method,
      headers: headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined
    });
    
    const response = await fetch(proxiedRequest);
    
    // Return response with CORS headers
    const responseHeaders = new Headers(response.headers);
    Object.entries(CORS).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  }catch(err){
    return new Response(JSON.stringify({error:'Proxy error', details:String(err)}), {
      status:502, 
      headers:{...CORS,'Content-Type':'application/json'}
    });
  }
}

// ============ AUTHENTICATION HANDLERS ============

// Simple JWT token generation (Note: In production, use proper JWT library)
function generateToken(clientId, secret = 'stark-secret-key') {
  const header = btoa(JSON.stringify({alg: 'HS256', typ: 'JWT'}));
  const payload = btoa(JSON.stringify({client_id: clientId, exp: Date.now() + 86400000}));
  const signature = btoa(header + '.' + payload + secret);
  return header + '.' + payload + '.' + signature;
}

function verifyToken(token, secret = 'stark-secret-key') {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

async function handleLogin(request) {
  try {
    const data = await request.json();
    const {email, password} = data;

    if (!email || !password) {
      return new Response(JSON.stringify({error: 'Email and password required'}), 
        {status: 400, headers: {...CORS, 'Content-Type': 'application/json'}});
    }

    // TODO: Query MySQL database to verify credentials
    // For now, mock authentication - replace with real DB query
    // Query: SELECT id, password_hash FROM clients WHERE email = ?
    const clientId = 'client_' + Date.now();
    const token = generateToken(clientId);

    return new Response(JSON.stringify({token, client_id: clientId}), 
      {status: 200, headers: {...CORS, 'Content-Type': 'application/json'}});
  } catch (err) {
    return new Response(JSON.stringify({error: 'Login failed'}), 
      {status: 400, headers: {...CORS, 'Content-Type': 'application/json'}});
  }
}

async function handleVerifyToken(request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return new Response(JSON.stringify({error: 'No token provided'}), 
      {status: 401, headers: {...CORS, 'Content-Type': 'application/json'}});
  }

  const payload = verifyToken(token);
  if (!payload) {
    return new Response(JSON.stringify({error: 'Invalid token'}), 
      {status: 401, headers: {...CORS, 'Content-Type': 'application/json'}});
  }

  return new Response(JSON.stringify({valid: true, client_id: payload.client_id}), 
    {status: 200, headers: {...CORS, 'Content-Type': 'application/json'}});
}

// ============ TEMPLATES HANDLERS ============

async function handleGetTemplates(request, token) {
  const payload = verifyToken(token);
  if (!payload) {
    return new Response(JSON.stringify({error: 'Unauthorized'}), 
      {status: 401, headers: {...CORS, 'Content-Type': 'application/json'}});
  }

  try {
    // TODO: Query MySQL for templates
    // Query: SELECT * FROM templates WHERE client_id = ? ORDER BY created_at DESC
    const templates = [];

    return new Response(JSON.stringify(templates), 
      {status: 200, headers: {...CORS, 'Content-Type': 'application/json'}});
  } catch (err) {
    return new Response(JSON.stringify({error: 'Failed to fetch templates'}), 
      {status: 500, headers: {...CORS, 'Content-Type': 'application/json'}});
  }
}

async function handleCreateTemplate(request, token) {
  const payload = verifyToken(token);
  if (!payload) {
    return new Response(JSON.stringify({error: 'Unauthorized'}), 
      {status: 401, headers: {...CORS, 'Content-Type': 'application/json'}});
  }

  try {
    const data = await request.json();
    const {purpose, message, cta, cta_url, attachment} = data;

    if (!purpose || !message) {
      return new Response(JSON.stringify({error: 'Missing required fields'}), 
        {status: 400, headers: {...CORS, 'Content-Type': 'application/json'}});
    }

    // TODO: Insert into MySQL templates table
    // Query: INSERT INTO templates (client_id, purpose, message, cta, cta_url, attachment, status, created_at)
    // VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
    const templateId = 'tpl_' + Date.now();

    return new Response(JSON.stringify({id: templateId, status: 'pending'}), 
      {status: 201, headers: {...CORS, 'Content-Type': 'application/json'}});
  } catch (err) {
    return new Response(JSON.stringify({error: 'Failed to create template'}), 
      {status: 500, headers: {...CORS, 'Content-Type': 'application/json'}});
  }
}

// ============ CAMPAIGNS HANDLERS ============

async function handleGetCampaigns(request, token) {
  const payload = verifyToken(token);
  if (!payload) {
    return new Response(JSON.stringify({error: 'Unauthorized'}), 
      {status: 401, headers: {...CORS, 'Content-Type': 'application/json'}});
  }

  try {
    // TODO: Query MySQL for campaigns
    // Query: SELECT * FROM campaigns WHERE client_id = ? ORDER BY created_at DESC
    const campaigns = [];

    return new Response(JSON.stringify(campaigns), 
      {status: 200, headers: {...CORS, 'Content-Type': 'application/json'}});
  } catch (err) {
    return new Response(JSON.stringify({error: 'Failed to fetch campaigns'}), 
      {status: 500, headers: {...CORS, 'Content-Type': 'application/json'}});
  }
}

async function handleCreateCampaign(request, token) {
  const payload = verifyToken(token);
  if (!payload) {
    return new Response(JSON.stringify({error: 'Unauthorized'}), 
      {status: 401, headers: {...CORS, 'Content-Type': 'application/json'}});
  }

  try {
    const data = await request.json();
    const {name, template_id, schedule_date, schedule_time, timezone, sheets_link} = data;

    if (!name || !template_id || !schedule_date || !schedule_time) {
      return new Response(JSON.stringify({error: 'Missing required fields'}), 
        {status: 400, headers: {...CORS, 'Content-Type': 'application/json'}});
    }

    // TODO: Insert into MySQL campaigns table
    // Query: INSERT INTO campaigns (client_id, template_id, name, schedule_date, schedule_time, timezone, sheets_link, status, created_at)
    // VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', NOW())
    const campaignId = 'camp_' + Date.now();

    return new Response(JSON.stringify({id: campaignId, status: 'scheduled'}), 
      {status: 201, headers: {...CORS, 'Content-Type': 'application/json'}});
  } catch (err) {
    return new Response(JSON.stringify({error: 'Failed to create campaign'}), 
      {status: 500, headers: {...CORS, 'Content-Type': 'application/json'}});
  }
}

// ============ ANALYTICS HANDLERS ============

async function handleGetAnalytics(request, token) {
  const payload = verifyToken(token);
  if (!payload) {
    return new Response(JSON.stringify({error: 'Unauthorized'}), 
      {status: 401, headers: {...CORS, 'Content-Type': 'application/json'}});
  }

  try {
    // TODO: Query MySQL for analytics
    // Query: SELECT COUNT(CASE WHEN status='sent' THEN 1 END) as sent,
    //               COUNT(CASE WHEN status='read' THEN 1 END) as read,
    //               COUNT(CASE WHEN status='failed' THEN 1 END) as failed
    //        FROM campaign_messages WHERE campaign_id IN (SELECT id FROM campaigns WHERE client_id = ?)
    const analytics = {
      sent: 0,
      read: 0,
      failed: 0
    };

    return new Response(JSON.stringify(analytics), 
      {status: 200, headers: {...CORS, 'Content-Type': 'application/json'}});
  } catch (err) {
    return new Response(JSON.stringify({error: 'Failed to fetch analytics'}), 
      {status: 500, headers: {...CORS, 'Content-Type': 'application/json'}});
  }
}

// ============ ENQUIRY HANDLER (LEGACY) ============

async function handleEnquiry(request) {
  try{
    const data = await request.json();
    const name = sanitize(data.name);
    const title = sanitize(data.title || '');
    const company = sanitize(data.company);
    const email = sanitize(data.email || '');
    const dialCode = sanitize(data.dialCode || '');
    const phone = sanitize(data.phone || '');
    const subject = sanitize(data.subject || 'service');
    const message = sanitize(data.message || '');

    if(!name || !company){
      return new Response(JSON.stringify({error:'Missing required fields'}), {status:400, headers:{...CORS,'Content-Type':'application/json'}})
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(email && !emailRegex.test(email)){
      return new Response(JSON.stringify({error:'Invalid email address'}), {status:400, headers:{...CORS,'Content-Type':'application/json'}})
    }

    // TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set as environment secrets
    const BOT = TELEGRAM_BOT_TOKEN;
    const CHAT = TELEGRAM_CHAT_ID;
    if(!BOT || !CHAT){
      return new Response(JSON.stringify({error:'Server not configured'}), {status:500, headers:{...CORS,'Content-Type':'application/json'}})
    }

    const text = `<b>New Enquiry</b>\nName: ${escapeHtml(name)}\nTitle: ${escapeHtml(title)}\nCompany: ${escapeHtml(company)}\nEmail: ${escapeHtml(email)}\nPhone: ${escapeHtml(dialCode)} ${escapeHtml(phone)}\nSubject: ${escapeHtml(subject)}\nMessage: ${escapeHtml(message)}`;

    const resp = await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({chat_id: CHAT, text: text, parse_mode: 'HTML'})
    });

    const j = await resp.json();
    if(!j.ok){
      return new Response(JSON.stringify({error:'Telegram error', details:j}), {status:502, headers:{...CORS,'Content-Type':'application/json'}})
    }

    return new Response(JSON.stringify({ok:true}), {status:200, headers:{...CORS,'Content-Type':'application/json'}})
  }catch(err){
    return new Response(JSON.stringify({error:'Bad request', details:String(err)}), {status:400, headers:{...CORS,'Content-Type':'application/json'}})
  }
}
