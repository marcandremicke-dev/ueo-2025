
import { getStore } from '@netlify/blobs';

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'allow': 'POST'
        },
        body: 'Method Not Allowed'
      };
    }

    // Body robust parsen
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch {
        return {
          statusCode: 400,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ error: 'Invalid JSON in request body' })
        };
      }
    }

    // base validieren & normalisieren
    const baseInput = body.base || 'https://example.com';
    let base;
    try {
      const u = new URL(baseInput);
      // Trailing slash entfernen
      base = `${u.origin}${u.pathname}`.replace(/\/+$/, '');
    } catch {
      return {
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid base URL' })
      };
    }

    // Slug generieren (hier simpel; bei Bedarf kollisionssicher machen)
    const slug = Math.random().toString(36).slice(2, 8);
    const url = `${base}/${slug}`;

    // WICHTIG: getStore ist async
    const store = await getStore('links'); // oder await getStore({ name: 'links' });
    await store.set(slug, url); // Speichert den String unter dem Key "slug"

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, url })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        error: '        error: 'Server error',
        detail: err?.message ?? String(err)
      })
    };
  }
