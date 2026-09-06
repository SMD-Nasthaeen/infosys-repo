// Smoke-test script for the MongoDB auth layer. Verifies the ID-collision fix.
// Usage: node scripts/smoke-test.js
import { MongoClient } from 'mongodb';

const BASE = 'http://localhost:3000';
let pass = 0;
let fail = 0;

function check(name, cond, detail) {
  if (cond) {
    pass++;
    console.log(`PASS  ${name}${detail ? '  ->  ' + detail : ''}`);
  } else {
    fail++;
    console.log(`FAIL  ${name}${detail ? '  ->  ' + detail : ''}`);
  }
}

async function call(method, path, { body, token } = {}) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(BASE + path, opts);
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  // Wait for server health
  let health = null;
  for (let i = 0; i < 30; i++) {
    try {
      health = await (await fetch(BASE + '/api/health')).json();
      if (health.database === 'connected') break;
    } catch {}
    await sleep(2000);
  }
  check('server health: database connected', health && health.database === 'connected', JSON.stringify(health));

  // Admin login
  const adminLogin = await call('POST', '/api/auth/login', {
    body: { emailOrUsername: 'admin@freighthub.com', password: 'admin1234', role: 'admin' },
  });
  check('admin login succeeds', adminLogin.data.success === true, `id=${adminLogin.data.user?.id} role=${adminLogin.data.user?.role}`);
  const adminToken = adminLogin.data.token;

  // /me resolves session
  const me = await call('GET', '/api/auth/me', { token: adminToken });
  check('session resolves via /me', me.data.success === true && me.data.user.id === 'USR-005');

  // Users list
  const users = await call('GET', '/api/auth/users', { token: adminToken });
  check('user directory lists 6 seeded users', users.data.total === 6, `total=${users.data.total}`);

  // ID COLLISION FIX: admin provision -> expect USR-007 (first after seed)
  const agent = await call('POST', '/api/auth/users', {
    token: adminToken,
    body: { fullName: 'Smoke Agent', username: 'smoke.agent.fix', email: 'smoke.agent.fix@freighthub.in', password: 'agent123', role: 'freight-agent' },
  });
  check('admin-provisioned agent -> USR-007', agent.data.success === true && agent.data.user.id === 'USR-007', `id=${agent.data.user?.id}`);
  const agentId = agent.data.user?.id;

  // ID COLLISION FIX: self-register -> expect USR-008 (distinct, no collision)
  const reg = await call('POST', '/api/auth/register', {
    body: { fullName: 'Smoke User', username: 'smoke.user.fix', email: 'smoke.user.fix@freighthub.in', password: 'user123', role: 'user' },
  });
  check('self-registered user -> USR-008 (no collision)', reg.data.success === true && reg.data.user.id === 'USR-008', `id=${reg.data.user?.id}`);
  const regId = reg.data.user?.id;

  // Verify the two new IDs are distinct
  check('new IDs are distinct (collision fixed)', agentId !== regId, `${agentId} vs ${regId}`);

  // Bad password rejected
  const bad = await call('POST', '/api/auth/login', {
    body: { emailOrUsername: 'aparajita@freighthub.in', password: 'wrongpass', role: 'user' },
  });
  check('bad password rejected with 401', bad.status === 401 && bad.data.success === false);

  // Customer forbidden on /users (403)
  const custLogin = await call('POST', '/api/auth/login', {
    body: { emailOrUsername: 'aparajita@freighthub.in', password: 'user123', role: 'user' },
  });
  const custUsers = await call('GET', '/api/auth/users', { token: custLogin.data.token });
  check('customer role forbidden on /users (403)', custUsers.status === 403);

  // Read-only DB verification of counter + unique index
  const c = new MongoClient('mongodb://localhost:27017');
  await c.connect();
  const db = c.db('freightquote_ai');
  const counter = (await db.collection('counters').find({ _id: 'user_id' }).toArray())[0];
  check('user_id counter >= 8 (no reuse)', counter && counter.seq >= 8, `seq=${counter?.seq}`);
  const idx = await db.collection('users').indexes();
  const idIdx = idx.find((i) => i.key && i.key.id === 1);
  check('unique index on users.id exists', !!idIdx && idIdx.unique === true, `name=${idIdx?.name} unique=${idIdx?.unique}`);
  const allUsers = await db.collection('users').find({}, { projection: { id: 1 } }).toArray();
  const ids = allUsers.map((u) => u.id);
  const uniqueIds = new Set(ids);
  check('no duplicate user ids in DB', ids.length === uniqueIds.size, `count=${ids.length} unique=${uniqueIds.size}`);
  await c.close();

  console.log(`\n==== ${pass} passed, ${fail} failed ====`);
  process.exitCode = fail === 0 ? 0 : 1;
})().catch((e) => {
  console.error('SMOKE TEST CRASHED:', e.message);
  process.exitCode = 1;
});