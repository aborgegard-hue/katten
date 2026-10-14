const SWEDEN = { minLat: 55.2, maxLat: 69.2, minLng: 10.8, maxLng: 24.3 };

function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T12:00:00Z`);
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value && value <= today;
}

async function fingerprint(request, secret) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const day = new Date().toISOString().slice(0, 10);
  const bytes = new TextEncoder().encode(`${day}:${ip}:${secret}`);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ error: 'Databasen är inte ansluten.' }, 503);
  const result = await env.DB.prepare(
    "SELECT id, place, observed_on, description, lat, lng, source FROM observations WHERE status = 'approved' ORDER BY observed_on DESC, id DESC LIMIT 500"
  ).all();
  return json({ observations: result.results });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB || !env.TURNSTILE_SECRET || !env.ADMIN_TOKEN) return json({ error: 'Bidrag är inte aktiverade ännu.' }, 503);
  let data;
  try { data = await request.json(); } catch { return json({ error: 'Ogiltiga uppgifter.' }, 400); }
  const place = String(data.place || '').trim();
  const description = String(data.description || '').trim();
  const date = String(data.observed_on || '');
  const lat = Number(data.lat);
  const lng = Number(data.lng);
  const token = String(data.turnstileToken || '');
  if (place.length < 2 || place.length > 80 || description.length < 15 || description.length > 500 || !validDate(date) || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < SWEDEN.minLat || lat > SWEDEN.maxLat || lng < SWEDEN.minLng || lng > SWEDEN.maxLng || !token) {
    return json({ error: 'Kontrollera ort, datum, beskrivning och kartpunkt.' }, 400);
  }
  const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: env.TURNSTILE_SECRET, response: token, remoteip: request.headers.get('CF-Connecting-IP') || undefined })
  });
  const checked = await verification.json();
  if (!checked.success) return json({ error: 'Säkerhetskontrollen misslyckades. Försök igen.' }, 400);
  const day = new Date().toISOString().slice(0, 10);
  const key = await fingerprint(request, env.ADMIN_TOKEN);
  await env.DB.prepare('INSERT INTO submission_limits (fingerprint, day, count) VALUES (?, ?, 1) ON CONFLICT(fingerprint, day) DO UPDATE SET count = count + 1').bind(key, day).run();
  const limit = await env.DB.prepare('SELECT count FROM submission_limits WHERE fingerprint = ? AND day = ?').bind(key, day).first();
  if (limit.count > 3) return json({ error: 'Du har nått dagens gräns för bidrag.' }, 429);
  await env.DB.prepare('INSERT INTO observations (place, observed_on, description, lat, lng) VALUES (?, ?, ?, ?, ?)')
    .bind(place, date, description, Math.round(lat * 100) / 100, Math.round(lng * 100) / 100).run();
  return json({ message: 'Tack! Din observation väntar på granskning.' }, 201);
}
