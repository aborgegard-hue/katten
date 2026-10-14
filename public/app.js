const map = L.map('map', { zoomControl: false, scrollWheelZoom: false }).setView([62.2, 16.2], 5);
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(map);
const pins = L.layerGroup().addTo(map);
const selectedIcon = L.divIcon({ className: '', html: '<div class="selected-pin"></div>', iconSize: [22, 22], iconAnchor: [11, 11] });
const pinIcon = L.divIcon({ className: '', html: '<div class="pin-icon"></div>', iconSize: [26, 26], iconAnchor: [13, 25] });
let selectedMarker;
let selectedPoint;
let turnstileWidget;

function textElement(tag, className, value) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = value;
  return element;
}

function showObservations(observations, demo) {
  pins.clearLayers();
  for (const item of observations) {
    const popup = document.createElement('div');
    popup.append(textElement('div', 'popup-label', item.source === 'demo' ? 'Exempelobservation' : 'Insänt tips'));
    popup.append(textElement('div', 'popup-title', item.place));
    popup.append(textElement('div', 'popup-date', new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${item.observed_on}T12:00:00Z`))));
    popup.append(textElement('p', 'popup-desc', item.description));
    L.marker([item.lat, item.lng], { icon: pinIcon }).bindPopup(popup).addTo(pins);
  }
  document.getElementById('map-count').textContent = `${observations.length} ${observations.length === 1 ? 'observation' : 'observationer'}`;
  document.getElementById('map-status').textContent = demo ? 'Exempelobservationer visas' : 'Påstådda observationer';
}

async function loadObservations() {
  try {
    const response = await fetch('/api/observations');
    if (!response.ok) throw new Error('API saknas');
    const data = await response.json();
    showObservations(data.observations, false);
  } catch {
    const response = await fetch('/demo-observations.json');
    const data = await response.json();
    showObservations(data.observations, true);
  }
}

map.on('click', event => {
  selectedPoint = event.latlng;
  if (selectedMarker) map.removeLayer(selectedMarker);
  selectedMarker = L.marker(selectedPoint, { icon: selectedIcon }).addTo(map);
  document.getElementById('selected-location').textContent = `${selectedPoint.lat.toFixed(2)}° N, ${selectedPoint.lng.toFixed(2)}° Ö`;
});

const form = document.getElementById('report-form');
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
form.elements.observed_on.max = today;
form.elements.observed_on.value = today;

async function setupTurnstile() {
  try {
    const response = await fetch('/api/config');
    const config = await response.json();
    if (!config.turnstileSiteKey) return;
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.onload = () => { turnstileWidget = window.turnstile.render('#turnstile', { sitekey: config.turnstileSiteKey, theme: 'light' }); };
    document.head.append(script);
  } catch { /* The form explains configuration errors when submitted. */ }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const message = document.getElementById('form-message');
  if (!selectedPoint) { message.textContent = 'Välj först en ungefärlig plats på kartan.'; return; }
  const token = window.turnstile && turnstileWidget !== undefined ? window.turnstile.getResponse(turnstileWidget) : '';
  if (!token) { message.textContent = 'Säkerhetskontrollen är inte klar. Försök igen om en stund.'; return; }
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  message.textContent = 'Skickar ditt tips…';
  const values = new FormData(form);
  try {
    const response = await fetch('/api/observations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ place: values.get('place'), observed_on: values.get('observed_on'), description: values.get('description'), lat: selectedPoint.lat, lng: selectedPoint.lng, turnstileToken: token }) });
    const result = await response.json();
    message.textContent = result.message || result.error || 'Något gick fel.';
    if (response.ok) { form.reset(); map.removeLayer(selectedMarker); selectedMarker = null; selectedPoint = null; document.getElementById('selected-location').textContent = 'Ingen punkt vald'; }
  } catch { message.textContent = 'Det gick inte att skicka tipset just nu.'; }
  finally { button.disabled = false; if (window.turnstile && turnstileWidget !== undefined) window.turnstile.reset(turnstileWidget); }
});

loadObservations();
setupTurnstile();
