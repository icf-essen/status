/**
 * status-api.icf-essen.de – Lese-Proxy für die Statusseite (Upptime)
 *
 * Warum: Upptime holt Störungsmeldungen im Browser über die GitHub-API.
 * Ohne Anmeldung erlaubt GitHub 60 Abfragen pro Stunde und öffentlicher IPv4.
 * Hinter Starlink (CGNAT) und im Mobilfunk teilen sich viele Nutzer eine IPv4 –
 * die Seite wäre dort schnell gesperrt. Dieser Worker fragt mit einem
 * Token an (5.000/Stunde) und puffert die Antworten kurz.
 *
 * Sicherheit:
 * - nur GET/HEAD, nur die Pfade, die die Statusseite wirklich braucht
 * - nur das Repo icf-essen/status
 * - Token liegt als Secret GITHUB_TOKEN im Worker, nie im Browser
 * - Token sollte nur Lesezugriff auf öffentliche Repos haben
 *
 * Ausfallsicherheit: Ist das Token abgelaufen oder ungültig (401), fragt der
 * Worker ohne Token an. Die Seite läuft dann weiter, nur wieder mit dem
 * kleinen Limit, statt komplett auszufallen.
 */

const UPSTREAM = "https://api.github.com";
const ALLOWED_ORIGIN = "https://status.icf-essen.de";
const CACHE_SECONDS = 60;

// Genau die Abfragen der Upptime-Statusseite:
//   /repos/icf-essen/status/issues               (Störungen, Wartungen, Verlauf)
//   /repos/icf-essen/status/issues/123           (einzelne Störung)
//   /repos/icf-essen/status/issues/123/comments  (Updates zu einer Störung)
//   /repos/icf-essen/status/commits              (Antwortzeit-Grafik)
const ALLOWED_PATH = /^\/repos\/icf-essen\/status\/(issues(\/\d+(\/comments)?)?|commits)$/;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    "Access-Control-Allow-Headers": "accept, content-type, x-github-api-version",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function reply(status, message) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() },
  });
}

async function askGitHub(url, token) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "icf-essen-status-proxy",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { headers });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return reply(405, "Nur lesender Zugriff erlaubt.");
    }

    const incoming = new URL(request.url);
    if (!ALLOWED_PATH.test(incoming.pathname)) {
      return reply(404, "Dieser Pfad wird nicht weitergeleitet.");
    }

    const upstreamUrl = UPSTREAM + incoming.pathname + incoming.search;

    // Kurzer Zwischenspeicher am Cloudflare-Standort: viele Besucher,
    // aber höchstens eine GitHub-Abfrage pro Adresse und Minute.
    const cache = caches.default;
    const cacheKey = new Request(upstreamUrl, { method: "GET" });
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    let upstream = await askGitHub(upstreamUrl, env.GITHUB_TOKEN);
    if (upstream.status === 401 && env.GITHUB_TOKEN) {
      // Token abgelaufen oder widerrufen: ohne Token weitermachen
      upstream = await askGitHub(upstreamUrl, null);
    }

    const headers = new Headers({
      "Content-Type": upstream.headers.get("Content-Type") || "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=${CACHE_SECONDS}`,
      ...corsHeaders(),
    });
    // Octokit wertet den Link-Header für Seitenumbrüche aus
    const link = upstream.headers.get("Link");
    if (link) headers.set("Link", link.split(UPSTREAM).join(incoming.origin));
    // Zur Kontrolle sichtbar lassen, welches Limit gilt
    for (const h of ["X-RateLimit-Limit", "X-RateLimit-Remaining"]) {
      const v = upstream.headers.get(h);
      if (v) headers.set(h, v);
    }

    const response = new Response(upstream.body, { status: upstream.status, headers });
    if (upstream.status === 200) {
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }
    return response;
  },
};
