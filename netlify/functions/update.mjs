
// netlify/functions/update.mjs
import { getStore } from '@netlify/blobs';

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'PUT' && event.httpMethod !== 'PATCH') {
      return {
        statusCode: 405,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'Allow': 'PUT, PATCH' // Konventionell großgeschrieben
        },
        body: 'Method Not Allowed'
      };
    }

    // Body parsen (Base64 optional berücksichtigen)
    let rawBody = event.body || '';
    if (event.isBase64Encoded) {
      rawBody = Buffer.from(rawBody, 'base64').toString('utf8');
    }

    let body = {};
    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        return {
          statusCode: 400,
          headers: { 'content-type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ error: 'Invalid JSON in request body' })
        };
      }
    }

    const { slug, url } = body;
    if (!slug || !url) {
      return {
        statusCode: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: 'Missing "slug" or "url"' })
      };
    }

    // URL validieren & normalisieren ohne Reassignment von const
    let normalizedUrl;
    try {
      const u = new URL(url);
      // optional: normalisieren (ohne Hash)
      normalizedUrl = `${u.origin}${u.pathname}${u.search}`;
    } catch {
      return {
        statusCode: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: 'Invalid URL' })
      };
    }

    const store = await getStore('links');
    await store.set(slug, normalizedUrl);

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ slug, url: normalizedUrl })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        error: 'Server error',
        detail: err?.message ?? String(err)
      })
    };
  }
};
``
