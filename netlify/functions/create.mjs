
import { getStore } from '@netlify/blobs';

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const base = body.base || 'https://example.com';
    const slug = Math.random().toString(36).slice(2, 8);
    const url = `${base}/${slug}`;

    const store = getStore('links');
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
