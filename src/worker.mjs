const ORIGIN = 'https://www.casework.work';
const TOPICS = new Set(['Support', 'Bug report', 'Feature idea', 'Privacy request', 'General']);
const MAX_BYTES = 16000;
const escape = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function reply(request, status, message) {
  const headers = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
  if (status === 429) headers['Retry-After'] = '60';
  if ((request.headers.get('Accept') || '').includes('application/json')) {
    return Response.json({ok:status < 300,message}, {status,headers});
  }
  headers['Content-Type'] = 'text/html; charset=utf-8';
  headers['Content-Security-Policy'] = "default-src 'none'; style-src 'self'; base-uri 'none'; frame-ancestors 'none'";
  const title = status < 300 ? 'Message sent' : 'Message not sent';
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} — Casework</title><link rel="stylesheet" href="/assets/site.css"><main class="document"><p class="eyebrow">CASEWORK SUPPORT</p><h1>${title}</h1><p class="lede">${escape(message)}</p><p><a class="button" href="/contact">Back to contact</a></p><p><a href="/support">Read the help guides</a></p></main></html>`, {status,headers});
}
async function readBody(request) {
  if (Number(request.headers.get('Content-Length')) > MAX_BYTES) throw new Error('size');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('body');
  const chunks = []; let size = 0;
  try {
    while (true) {
      const {done,value} = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); throw new Error('size'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const buffer = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk,offset); offset += chunk.byteLength; }
  return new TextDecoder('utf-8',{fatal:true}).decode(buffer);
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/contact') {
      if (url.pathname.startsWith('/api/')) return new Response('Not found',{status:404});
      return env.ASSETS.fetch(request);
    }
    if (request.method !== 'POST') return new Response('Method not allowed',{status:405,headers:{Allow:'POST','Cache-Control':'no-store'}});
    // Do not accept cross-site submissions or allow the client to choose a recipient.
    if (url.origin !== ORIGIN || request.headers.get('Origin') !== ORIGIN) return reply(request,403,'Please submit the form from the Casework website.');
    const type = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
    if (!['application/json','application/x-www-form-urlencoded'].includes(type)) return reply(request,415,'Please use the contact form to send your message.');
    let data;
    try {
      const body = await readBody(request);
      data = type === 'application/json' ? JSON.parse(body) : Object.fromEntries(new URLSearchParams(body));
      if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('body');
    } catch (error) { return reply(request,error.message === 'size' ? 413 : 400,'Please keep your message under 4,000 characters and try again.'); }
    if (typeof data.website !== 'string' || data.website !== '') return reply(request,400,'Please use the contact form to send your message.');
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const email = typeof data.email === 'string' ? data.email.trim() : '';
    const topic = typeof data.topic === 'string' ? data.topic : '';
    const message = typeof data.message === 'string' ? data.message.trim() : '';
    if (name.length > 80 || /[\r\n\x00-\x1f\x7f]/.test(name) || email.length > 254 || !/^[^\s<>@,;:"()\\]+@[^\s<>@,;:"()\\]+\.[^\s<>@,;:"()\\]+$/.test(email) || !TOPICS.has(topic) || message.length < 20 || message.length > 4000 || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(message)) {
      return reply(request,400,'Check your email address and include a message between 20 and 4,000 characters.');
    }
    if (!env.EMAIL || !env.CONTACT_TO || !env.CONTACT_RATE_LIMITER) return reply(request,503,'Support delivery is temporarily unavailable. Please try again shortly.');
    try {
      const ip = request.headers.get('CF-Connecting-IP');
      if (!ip) return reply(request,503,'Support delivery is temporarily unavailable. Please try again shortly.');
      const hash = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ip));
      const key = [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
      const {success} = await env.CONTACT_RATE_LIMITER.limit({key});
      if (!success) return reply(request,429,'Please wait a minute before sending another message.');
      await env.EMAIL.send({
        from:{email:'website@casework.work',name:'Casework website'},
        to:env.CONTACT_TO,
        replyTo:email,
        subject:`Casework website — ${topic}`,
        text:`Topic: ${topic}\nName: ${name || 'Not provided'}\nReply email: ${email}\n\n${message}`
      });
      return reply(request,200,'Thanks for getting in touch. We’ll reply to the email address you provided.');
    } catch {
      // Do not return provider diagnostics or log message bodies, addresses, or IPs.
      return reply(request,503,'Your message could not be delivered. Please try again shortly.');
    }
  }
};
