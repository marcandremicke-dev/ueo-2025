
import { getStore } from '@netlify/blobs';

export const handler = async (event) => {
  try {
    if (event.httpMethod !== 'PUT' && event.httpMethod !== 'PATCH') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const { slug, url } = body;

    if (!slug || !url) {
      return { statusCode: 400, body: 'Missing slug or url' };
    }

    const store = getStore('links');
    await store.set(slug, url);

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true, slug, url })
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
