\
import { connectLambda, getStore } from '@netlify/blobs';

export const handler = async (event) => {
  try {
    connectLambda(event);
    const { id, index, g1, g2 } = JSON.parse(event.body || '{}');
    if (!id || typeof index !== 'number') return { statusCode: 400, body: JSON.stringify({ error: 'Missing id/index' }) };
    const n1 = Number(g1); const n2 = Number(g2);
    if (![0,1,2,3,4].includes(n1) || ![0,1,2,3,4].includes(n2)) return { statusCode: 400, body: JSON.stringify({ error: 'Scores must be 0-4' }) };
    // no draws: exactly one side has 4 and the other 0..3
    const valid = ((n1===4 && n2>=0 && n2<=3) || (n2===4 && n1>=0 && n1<=3)) && !(n1===4 && n2===4);
    if (!valid) return { statusCode: 400, body: JSON.stringify({ error: 'Invalid Fast4 result (needs 4:x, x<=3)' }) };

    const store = getStore({ name: 'padel-fast4', consistency: 'strong' });
    const doc = await store.getJSON(`t/${id}`);
    if (!doc) return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) };

    if (!Array.isArray(doc.matches) || index < 0 || index >= doc.matches.length) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Bad index' }) };
    }
    const tb = (Math.max(n1,n2)===4 && Math.min(n1,n2)===3);
    doc.matches[index].result = { team1Games: n1, team2Games: n2, decidedByTB: tb };

    await store.setJSON(`t/${id}`, doc);
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error', detail: String(e) }) };
  }
}
