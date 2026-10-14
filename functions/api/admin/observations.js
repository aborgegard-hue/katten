function authorized(request, env) {
  const provided = request.headers.get('Authorization')?.replace(/^Bearer /, '') || '';
  return Boolean(env.ADMIN_TOKEN && provided && provided === env.ADMIN_TOKEN);
}

function reply(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function onRequestGet({ request, env }) {
  if (!authorized(request, env)) return reply({ error: 'Åtkomst nekad.' }, 401);
  if (!env.DB) return reply({ error: 'Databasen saknas.' }, 503);
  const results = await env.DB.prepare("SELECT id, place, observed_on, description, lat, lng, status, source, created_at FROM observations WHERE status = 'pending' ORDER BY created_at ASC LIMIT 100").all();
  return reply({ observations: results.results });
}

export async function onRequestPatch({ request, env }) {
  if (!authorized(request, env)) return reply({ error: 'Åtkomst nekad.' }, 401);
  if (!env.DB) return reply({ error: 'Databasen saknas.' }, 503);
  let data;
  try { data = await request.json(); } catch { return reply({ error: 'Ogiltiga uppgifter.' }, 400); }
  const id = Number(data.id);
  const status = String(data.status || '');
  if (!Number.isSafeInteger(id) || id < 1 || !['approved', 'rejected'].includes(status)) return reply({ error: 'Ogiltig åtgärd.' }, 400);
  const result = await env.DB.prepare("UPDATE observations SET status = ? WHERE id = ? AND status = 'pending'").bind(status, id).run();
  if (!result.meta.changes) return reply({ error: 'Bidraget kunde inte uppdateras.' }, 404);
  return reply({ ok: true });
}
