\
import { connectLambda, getStore } from '@netlify/blobs';

function makeId(len = 8) {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random()*chars.length)];
  return out;
}

export const handler = async (event) => {
  try {
    connectLambda(event);
    const body = JSON.parse(event.body || '{}');
    const { teams, matches } = body;
    if (!Array.isArray(teams) || !Array.isArray(matches)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid payload' }) };
    }

    const store = getStore({ name: 'padel-fast4', consistency: 'strong' });

    // generate unique id
    let id = makeId();
    // naive collision check
    const existing = await store.getJSON(`t/${id}`);
    if (existing) id = makeId();

    const doc = {
      v: 1,
      lockTeamNames: true,
      teams,
      matches,
      createdAt: new Date().toISOString()
    };
    await store.setJSON(`t/${id}`, doc);

    const proto = event.headers['x-forwarded-proto'] || 'https';
    const host = event.headers['x-forwarded-host'] || event.headers.host;
    const url = `${proto}://${host}/t/${id}`;

    return { statusCode: 200, body: JSON.stringify({ id, url }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error', detail: String(e) }) };
  }
}
