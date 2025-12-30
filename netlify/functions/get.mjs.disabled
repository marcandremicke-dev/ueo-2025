
import { getStore } from '@netlify/blobs';

export const handler = async (event) => {
  try {
    // slug als Query (?slug=abc) oder als letztes Segment im Pfad (/get/abc)
    const slug =
      event.queryStringParameters?.slug ||
      (event.path && event.path.split('/').pop()) ||
      '';

    if (!slug) {
      return { statusCode: 400, body: 'Missing slug' };
    }

    const store = getStore('links');
    const url = await store.get(slug, { type: 'text' }); // null/undefined wenn nicht vorhanden

    if (!url) {
      return { statusCode: 404, body: 'Not found' };
    }

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
``
