CREATE TABLE IF NOT EXISTS observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  place TEXT NOT NULL,
  observed_on TEXT NOT NULL,
  description TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  source TEXT NOT NULL DEFAULT 'visitor' CHECK (source IN ('visitor', 'demo')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS observations_status_date ON observations(status, observed_on DESC);

CREATE TABLE IF NOT EXISTS submission_limits (
  fingerprint TEXT NOT NULL,
  day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (fingerprint, day)
);

INSERT INTO observations (place, observed_on, description, lat, lng, status, source) VALUES
  ('Kiruna', '2026-10-02', 'En rödvit hatt siktades på en busskur. Vittnet hann aldrig se vem som bar den.', 67.86, 20.23, 'approved', 'demo'),
  ('Luleå', '2026-09-28', 'Någon beställde mjölk i hatt och försvann innan kvittot kom.', 65.58, 22.15, 'approved', 'demo'),
  ('Umeå', '2026-10-05', 'Randiga skuggor vid älven, enligt en mycket bestämd förbipasserande.', 63.83, 20.26, 'approved', 'demo'),
  ('Östersund', '2026-09-17', 'En hatt stack upp bakom en snöhög som inte borde ha funnits i september.', 63.18, 14.64, 'approved', 'demo'),
  ('Sundsvall', '2026-10-01', 'Ett paraply gick åt fel håll i motvind. Katten misstänks.', 62.39, 17.31, 'approved', 'demo'),
  ('Gävle', '2026-09-24', 'Två vittnen såg en hatt. De är oense om katten.', 60.67, 17.14, 'approved', 'demo'),
  ('Uppsala', '2026-10-08', 'En märkligt artig jamning hördes utanför biblioteket.', 59.86, 17.64, 'approved', 'demo'),
  ('Stockholm', '2026-10-10', 'En randig siluett tog sista platsen på tunnelbanan.', 59.33, 18.06, 'approved', 'demo'),
  ('Örebro', '2026-09-20', 'Någon lämnade fotspår och en fråga om fika.', 59.27, 15.21, 'approved', 'demo'),
  ('Karlstad', '2026-10-04', 'En hatt tycktes vinka från andra sidan Klarälven.', 59.38, 13.50, 'approved', 'demo'),
  ('Göteborg', '2026-10-09', 'Spårvagnsföraren rapporterade en ovanligt välklädd passagerare.', 57.71, 11.97, 'approved', 'demo'),
  ('Jönköping', '2026-09-29', 'Katten sågs enligt uppgift balansera på en osynlig linje vid Vättern.', 57.78, 14.16, 'approved', 'demo'),
  ('Kalmar', '2026-10-06', 'En randig hatt dök upp på ett vykort som ingen mindes att ha köpt.', 56.66, 16.36, 'approved', 'demo'),
  ('Halmstad', '2026-09-22', 'Ett kort jam hördes på stranden när solen gick ned.', 56.67, 12.86, 'approved', 'demo'),
  ('Malmö', '2026-10-11', 'En mystisk hatt tog en selfie vid kanalen. Kameran var tom.', 55.61, 13.00, 'approved', 'demo');
