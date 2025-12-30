
import { getStore } from '@netlify/blobs';

export const handler = async (event) => {
  try {
    // slug kann als Query    if (!slug) {    // slug kann als Query ?slug=abc oder als Pfad /get/abc kommen
      return { statusCode: 400, body: 'Missing slug' };
    }

    const store = getStore('links');
    const url = await store.get(slug, { type: 'text' }); // null, falls nicht vorhanden

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

    const slug =
      event.queryStringParameters?.slug ||
      event.path?.split('/').pop() ||
      '';

