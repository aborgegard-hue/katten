# Katten i hatten – observationskarta

Mobilanpassad memesida byggd för **[GitHub-repot katten](https://github.com/aborgegard-hue/katten) → Cloudflare Pages → kattenihatten.se hos Loopia**. Besökarnas bidrag lagras i Cloudflare D1 och visas först efter godkännande.

## Starta lokalt

1. Installera Node.js och kör `npm install` i denna mapp.
2. Skapa en D1-databas: `npx wrangler d1 create katten-i-hatten`.
3. Lägg databasens ID i `wrangler.toml` under `database_id`.
4. Kör `npx wrangler d1 migrations apply katten-i-hatten --local`.
5. Kör `npm run dev` och öppna adressen som Wrangler skriver ut.

Den statiska kartan visar inbyggda exempel även före databasen kopplas in. Bidragsformuläret kräver D1 och Turnstile.

## Publicera

1. Lägg mappens innehåll i ett GitHub-repo. Koppla repot till ett Cloudflare Pages-projekt. Byggkommando: lämna tomt. Output-mapp: `public`.
2. Skapa en D1-databas och kör `npx wrangler d1 migrations apply katten-i-hatten --remote`. Anslut databasen i Pages som binding med namnet `DB` för både production och preview. Publicera om efter bindingen.
3. Skapa en Cloudflare Turnstile-widget för domänen. Lägg hemligheten som Pages secret `TURNSTILE_SECRET` och den publika nyckeln som variabel `TURNSTILE_SITE_KEY`.
4. Lägg ett långt slumpat administratörslösenord som Pages secret `ADMIN_TOKEN`. Det används bara i administrationsvyn och sparas inte i webbläsarens lagring.
5. Fyll i verklig ansvarig/organisation och kontaktväg i `public/om.html`, `public/kontakt.html` och `public/integritet.html` före offentlig lansering.
6. Anslut domänen i Cloudflare Pages under Custom domains. Ändra DNS hos Loopia enligt Cloudflares exakta anvisningar för den domänen.

`wrangler.toml` kan användas för lokal utveckling. För Git-integrerad Pages rekommenderas bindings och variabler i Cloudflare Pages-inställningarna.

## Moderering

Besök `/admin.html`. Ange `ADMIN_TOKEN` för att hämta väntande bidrag och godkänna eller avvisa dem. Alla inskick är inledningsvis privata. Kartposition avrundas till två decimaler innan lagring. Servern kräver Turnstile och begränsar antalet bidrag per IP under ett dygn.

## Inför AdSense

Det finns **ingen annonskod** i denna version. Lägg till eget redaktionellt innehåll och färdigställ kontakt- och integritetsuppgifter. När AdSense-kontot och domänen är klara, konfigurera en Google-certifierad CMP (exempelvis Googles Privacy & messaging) och testa samtyckesflödet innan annonskod läggs in. Håll annonser utanför kartan och formuläret. AdSense-godkännande är inte garanterat.

## Uppföljning

Följ trafik i Cloudflare Web Analytics utan att lägga till annonsskript i förtid. Följ kostnader i Cloudflare/Loopia och annonsintäkter i AdSense efter godkännande.
