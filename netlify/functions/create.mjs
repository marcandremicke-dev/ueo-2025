
// netlify/functions/create.mjs
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

    const baseInput = body.base || 'https://example.com';
    let base;
    try {
      const u = new URL(baseInput);
      base = `${u.origin}${u.pathname}`.replace(/\/+$/, '');
    } catch {
      return {
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid base URL' })
      };
    }

    const slug = Math.random().toString(36).slice(2, 8);
    const url = `${base}/${slug}`;

    // WICHTIG: getStore ist async
    const store = await getStore('links'); // oder: await getStore({ name: 'links' });
    await store.set(slug, url);

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
        error: 'Server error',
        detail: err?.message ?? String(err)
      })
    };
  }
};
