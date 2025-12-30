
// netlify/functions/create-link.mjs
import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';

/** CORS-Header (falls du eine feste Domain hast, setze die statt "*") */
function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
  };
}

/** Basis-URL ermitteln & normalisieren (ohne trailing slash) */
function resolveBaseUrl(body) {
  const baseInput =
    body?.base ||
    process.env.PUBLIC_BASE_URL ||
    process.env.URL ||
    process.env.DEPLOY_URL ||
    'http://localhost:8888';

  const u = new URL(baseInput);
  return `${u.origin}${u.pathname}`.replace(/\/+$/, '');
}

/** Kryptografisch zufälliger, kurzer Slug */
function generateSlug(len = 10) {
  const bytes = crypto.randomBytes(Math.ceil((len * 5) / 8));
  const base36 = BigInt('0x' + bytes.toString('hex')).toString(36);
  return base36.slice(0, len);
}

/** Prüft, ob vollständige Turnierdaten vorliegen */
function isCompletePayload(body) {
  const { pots, teams, fixtures } = body || {};
  const potsOk =
    Array.isArray(pots) &&
    pots.length > 0 &&
    pots.every((p) => Array.isArray(p) && p.every((s) => typeof s === 'string' && s.trim()));
  const teamsOk = Array.isArray(teams) && teams.length > 0;
  const fixturesOk = Array.isArray(fixtures) && fixtures.length > 0;
  return potsOk && teamsOk && fixturesOk;
}

export const handler = async (event) => {
  try {
    // CORS Preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: { ...corsHeaders(), allow: 'POST, OPTIONS' },
      };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          ...corsHeaders(),
          'content-type': 'text/plain; charset=utf-8',
          allow: 'POST, OPTIONS',
        },
        body: 'Method Not Allowed',
      };
    }

    // Body (inkl. Base64) lesen
    let raw = event.body || '';
    if (event.isBase64Encoded) {
      raw = Buffer.from(raw, 'base64').toString('utf8');
    }

    let body = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return {
        statusCode: 400,
        headers: { ...corsHeaders(), 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    // Basis-URL & Route
    const base = resolveBaseUrl(body);
    const routePrefix = body.routePrefix || '/t'; // z. B. '/turnier' wenn gewünscht

    // Store öffnen (WICHTIG: async)
    const store = await getStore('tournaments'); // oder await getStore({ name: 'tournaments' });

    // Eindeutigen Slug erzeugen (5 Versuche)
    let slug;
    for (let i = 0; i < 5; i += 1) {
      const candidate = generateSlug(10);
      // eslint-disable-next-line no-await-in-loop
      const exists = await store.get(candidate);
      if (!exists) {
        slug = candidate;
        break;
      }
    }
    if (!slug) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders(), 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: 'Could not generate unique link' }),
      };
    }

    const now = new Date().toISOString();
    const complete = isCompletePayload(body);

    // Dokument vorbereiten:
    // Wenn vollständige Daten mitkommen → status 'ready'
    // Sonst minimaler Entwurf → status 'draft' (kannst du später per update-Funktion füllen)
    const document = {
      id: slug,
      createdAt: now,
      updatedAt: now,
      status: complete ? 'ready' : 'draft',
      meta: body.meta || {},

      // Optional-Daten:
      pots: complete ? body.pots : body.pots ?? [],
      teams: complete ? body.teams : body.teams ?? [],
      fixtures: complete ? body.fixtures : body.fixtures ?? [],

      version: 1,
    };

    // Speichern (String ist universell kompatibel)
    await store.set(slug, JSON.stringify(document));

    // Freigabefähiger Link
    const url = `${base}${routePrefix}/${slug}`;

    return {
      statusCode: 201,
      headers: {
        ...corsHeaders(),
        'content-type': 'application/json; charset=utf-8',
        location: url,
      },
      body: JSON.stringify({ slug, url, status: document.status }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders(), 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        error: 'Server error',
        detail: err?.message ?? String        detail: err?.message ?? String(err),
      }),
    };
  }
