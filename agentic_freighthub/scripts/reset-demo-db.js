// Resets the DB to the clean 6-seed state and resets the user_id counter.
// Usage: node scripts/reset-demo-db.js
import { MongoClient } from 'mongodb';

const c = new MongoClient('mongodb://localhost:27017');
await c.connect();
const db = c.db('freightquote_ai');

const del = await db.collection('users').deleteMany({ email: /^smoke\./ });
console.log('deleted leftover smoke users:', del.deletedCount);

// Any users beyond the 6 seeds
const seeds = ['USR-001', 'USR-002', 'USR-003', 'USR-004', 'USR-005', 'USR-006'];
const extra = await db.collection('users').deleteMany({ id: { $nin: seeds } });
console.log('deleted extra users:', extra.deletedCount);

await db.collection('counters').updateOne({ _id: 'user_id' }, { $set: { seq: 6 } }, { upsert: true });
console.log('counter reset to seq=6');

const users = await db.collection('users').find({}, { projection: { _id: 0, id: 1, email: 1 } }).sort({ id: 1 }).toArray();
console.log('users now:', JSON.stringify(users));
const counter = await db.collection('counters').findOne({ _id: 'user_id' });
console.log('counter:', JSON.stringify(counter));

await c.close();
console.log('reset complete');
