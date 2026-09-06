// One-off dev utility: removes smoke-test users and prints the current user list.
// Usage: node scripts/cleanup-smoke-users.js
import { MongoClient } from 'mongodb';

const c = new MongoClient('mongodb://localhost:27017');
await c.connect();
const db = c.db('freightquote_ai');
try {
  const del = await db
    .collection('users')
    .deleteMany({ $or: [{ email: /^smoke\./ }, { username: /^smoke\./ }] });
  console.log('smoke users deleted:', del.deletedCount);
  const users = await db
    .collection('users')
    .find({}, { projection: { _id: 0, id: 1, email: 1, role: 1 } })
    .toArray();
  console.log('remaining users:', JSON.stringify(users));
} catch (e) {
  console.error('cleanup failed:', e.message);
  process.exitCode = 1;
} finally {
  await c.close();
}