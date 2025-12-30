
// netlify/functions/update.mjs
import { getStore } from '@netlify/blobs';

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'PUT' && event.httpMethod !== 'PATCH') {
      return {
        statusCode: 405,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'allow': 'PUT, PATCH'
        },
        body: 'Method Not Allowed'
      };
    }

    // Body parsen
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
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

    // URL validieren
    try {
      const u = new URL(url);
      // optional: normalisieren
      url = `${u.origin}${u.pathname}${u.search}`; // wenn du keine Hashes willst
    } catch {
      return {
        statusCode: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: 'Invalid URL' })
      };
    }

    const store = await getStore('links');
    await store.set(slug, url);

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ slug, url })
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
