// netlify/functions/create-link.mjs
import { getStore } from '@netlify/blobs';

export const handler = async (event) => {
  const store = getStore('links');
  const slug = Math.random().toString(36).slice(2, 8);
  const url = `https://example.com/${slug}`;

  await store.set(slug, url);

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url })
  };
};
