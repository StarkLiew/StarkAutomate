const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const WHATCHIMP_API_URL = 'https://app.whatchimp.com/api/v1';

addEventListener('fetch', event => {
  event.respondWith(handle(event.request))
})

async function handle(request){
  const url = new URL(request.url);
  if(request.method === 'OPTIONS'){
    return new Response(null, {status:204, headers: CORS})
  }
  
  // Handle services API proxy
  if(url.pathname.startsWith('/api/services')){
    return proxyService(request, url);
  }
  
  if(url.pathname !== '/api' || request.method !== 'POST'){
    return new Response(null, {status:404})
  }
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
  
  if(request.method === 'POST'){
    // POST is always allowed
  } else if(request.method === 'GET' && isGetAllowed){
    // GET is allowed for specific endpoints
  } else {
    return new Response(JSON.stringify({error:'Method not allowed. POST is always allowed, GET only for specific endpoints'}), {
      status: 405,
      headers: {...CORS, 'Content-Type': 'application/json', 'Allow': 'POST, GET'}
    });
  }
  
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
