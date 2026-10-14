let token = '';
const list = document.getElementById('admin-list');
const message = document.getElementById('admin-message');

function element(tag, value) {
  const node = document.createElement(tag);
  node.textContent = value;
  return node;
}

async function refresh() {
  const response = await fetch('api/admin/observations', { headers: { Authorization: `Bearer ${token}` } });
  const data = await response.json();
  if (!response.ok) { message.textContent = data.error || 'Kunde inte hämta bidrag.'; return; }
  list.replaceChildren();
  message.textContent = `${data.observations.length} bidrag väntar på granskning.`;
  for (const item of data.observations) {
    const card = document.createElement('article');
    card.className = 'admin-item';
    card.append(element('h2', item.place));
    card.append(element('p', `${item.observed_on} · ${item.lat}, ${item.lng} · inskickat ${item.created_at}`));
    card.append(element('p', item.description));
    const actions = document.createElement('div');
    actions.className = 'admin-actions';
    for (const [label, status, className] of [['Godkänn', 'approved', 'approve'], ['Avvisa', 'rejected', 'reject']]) {
      const button = element('button', label);
      button.type = 'button';
      button.className = className;
      button.addEventListener('click', async () => {
        button.disabled = true;
        const update = await fetch('api/admin/observations', { method: 'PATCH', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item.id, status }) });
        if (update.ok) await refresh();
        else { message.textContent = (await update.json()).error || 'Kunde inte uppdatera.'; button.disabled = false; }
      });
      actions.append(button);
    }
    card.append(actions);
    list.append(card);
  }
}

if (location.hostname.endsWith('.github.io')) {
  document.getElementById('admin-login').style.display = 'none';
  message.textContent = 'Administrationen finns bara på den färdiga Cloudflare-sidan.';
} else {
  document.getElementById('admin-login').addEventListener('submit', async event => {
    event.preventDefault();
    token = document.getElementById('token').value;
    document.getElementById('token').value = '';
    try { await refresh(); } catch { message.textContent = 'Servern kunde inte nås.'; }
  });
}
