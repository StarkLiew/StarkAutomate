addEventListener('fetch', event => {
  event.respondWith(handle(event.request))
})

async function handle(request){
  if(request.method !== 'POST'){
    return new Response(JSON.stringify({error:'Only POST allowed'}), {status:405, headers:{'Content-Type':'application/json'}})
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
      return new Response(JSON.stringify({error:'Missing required fields'}), {status:400, headers:{'Content-Type':'application/json'}})
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(email && !emailRegex.test(email)){
      return new Response(JSON.stringify({error:'Invalid email address'}), {status:400, headers:{'Content-Type':'application/json'}})
    }

    // TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set as environment secrets
    const BOT = TELEGRAM_BOT_TOKEN;
    const CHAT = TELEGRAM_CHAT_ID;
    if(!BOT || !CHAT){
      return new Response(JSON.stringify({error:'Server not configured'}), {status:500, headers:{'Content-Type':'application/json'}})
    }

    const text = `<b>New Enquiry</b>\nName: ${escapeHtml(name)}\nTitle: ${escapeHtml(title)}\nCompany: ${escapeHtml(company)}\nEmail: ${escapeHtml(email)}\nPhone: ${escapeHtml(dialCode)} ${escapeHtml(phone)}\nSubject: ${escapeHtml(subject)}\nMessage: ${escapeHtml(message)}`;

    const resp = await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({chat_id: CHAT, text: text, parse_mode: 'HTML'})
    });

    const j = await resp.json();
    if(!j.ok){
      return new Response(JSON.stringify({error:'Telegram error', details:j}), {status:502, headers:{'Content-Type':'application/json'}})
    }

    return new Response(JSON.stringify({ok:true}), {status:200, headers:{'Content-Type':'application/json'}})
  }catch(err){
    return new Response(JSON.stringify({error:'Bad request', details:String(err)}), {status:400, headers:{'Content-Type':'application/json'}})
  }
}

function sanitize(v){
  if(!v) return '';
  return String(v).slice(0,1000);
}
function escapeHtml(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
