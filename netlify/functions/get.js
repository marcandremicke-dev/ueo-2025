\
import { connectLambda, getStore } from '@netlify/blobs';

export const handler = async (event) => {
  try {
    connectLambda(event);
    const id = (event.queryStringParameters && event.queryStringParameters.id) || '';
    if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'Missing id' }) };
    const store = getStore({ name: 'padel-fast4', consistency: 'strong' });
    const doc = await store.getJSON(`t/${id}`);
    if (!doc) return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };
    return { statusCode: 200, body: JSON.stringify(doc) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error', detail: String(e) }) };
  }
}
