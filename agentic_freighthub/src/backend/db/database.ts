// MongoDB Database Layer — Real persistence for the FreightQuote AI platform
// Collections: users, sessions, shipments, quotes, quote_audit_logs, notifications,
//              audit_logs, weather_assessments, weather_alerts, customs_checks,
//              risk_assessments, risk_alerts, ml_predictions, agent_runs, documents
import { MongoClient, Db, Collection, Document as MongoDocument } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGO_DB_NAME || 'freightquote_ai';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let connectPromise: Promise<Db> | null = null;

export async function getDb(): Promise<Db> {
  if (dbInstance) return dbInstance;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    client = new MongoClient(MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    await client.connect();
    dbInstance = client.db(DB_NAME);
    console.log(`[+] MongoDB connected: ${MONGO_URL} → database "${DB_NAME}"`);
    await ensureIndexes();
    return dbInstance;
  })();

  return connectPromise;
}

export function isDbReady(): boolean {
  return dbInstance !== null;
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    dbInstance = null;
    connectPromise = null;
  }
}

function collection<T extends MongoDocument = MongoDocument>(name: string): Promise<Collection<T>> {
  return getDb().then((db) => db.collection<T>(name));
}

// Typed collection accessors
export const usersCollection = () => collection('users');
export const sessionsCollection = () => collection('sessions');
export const shipmentsCollection = () => collection('shipments');
export const quotesCollection = () => collection('quotes');
export const quoteAuditLogsCollection = () => collection('quote_audit_logs');
export const notificationsCollection = () => collection('notifications');
export const auditLogsCollection = () => collection('audit_logs');
export const weatherAssessmentsCollection = () => collection('weather_assessments');
export const weatherAlertsCollection = () => collection('weather_alerts');
export const customsChecksCollection = () => collection('customs_checks');
export const riskAssessmentsCollection = () => collection('risk_assessments');
export const riskAlertsCollection = () => collection('risk_alerts');
export const mlPredictionsCollection = () => collection('ml_predictions');
export const agentRunsCollection = () => collection('agent_runs');
export const documentsCollection = () => collection('documents');
export const m4DocumentsCollection = () => collection('m4_documents');
export const documentVersionsCollection = () => collection('document_versions');
export const documentAuditLogsCollection = () => collection('document_audit_logs');
export const documentChecklistsCollection = () => collection('document_checklists');
export const companiesCollection = () => collection('companies');
export const verificationRequestsCollection = () => collection('verification_requests');
export const bookingsCollection = () => collection('bookings');
export const selectedQuotesCollection = () => collection('selected_quotes');

async function ensureIndexes(): Promise<void> {
  const db = await getDb();
  try {
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ id: 1 }, { unique: true });
    await db.collection('users').createIndex({ username: 1 }, { unique: true, sparse: true });
    await db.collection('sessions').createIndex({ token: 1 }, { unique: true });
    await db.collection('sessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await db.collection('shipments').createIndex({ shipmentId: 1 }, { unique: true });
    await db.collection('quotes').createIndex({ quoteId: 1 }, { unique: true });
    await db.collection('quotes').createIndex({ shipmentId: 1 });
    await db.collection('quotes').createIndex({ customerEmail: 1 });
    await db.collection('quote_audit_logs').createIndex({ quoteId: 1 });
    await db.collection('notifications').createIndex({ userEmail: 1 });
    await db.collection('audit_logs').createIndex({ timestamp: -1 });
    await db.collection('weather_assessments').createIndex({ shipment_id: 1 });
    await db.collection('customs_checks').createIndex({ check_id: 1 }, { unique: true });
    await db.collection('customs_checks').createIndex({ shipment_id: 1 });
    await db.collection('risk_assessments').createIndex({ shipment_id: 1 });
    await db.collection('agent_runs').createIndex({ runId: 1 }, { unique: true });
    await db.collection('agent_runs').createIndex({ shipmentId: 1 });
    await db.collection('companies').createIndex({ companyId: 1 }, { unique: true });
    await db.collection('verification_requests').createIndex({ requestId: 1 }, { unique: true });
    await db.collection('verification_requests').createIndex({ quoteId: 1 });
    await db.collection('verification_requests').createIndex({ companyId: 1 });
    await db.collection('bookings').createIndex({ bookingRef: 1 }, { unique: true });
    await db.collection('bookings').createIndex({ quoteId: 1 });
    await db.collection('bookings').createIndex({ companyId: 1 });
    await db.collection('bookings').createIndex({ verificationRequestId: 1 });
    // M4 Document indexes
    await db.collection('m4_documents').createIndex({ documentId: 1 }, { unique: true });
    await db.collection('m4_documents').createIndex({ requestId: 1 });
    await db.collection('m4_documents').createIndex({ shipmentId: 1 });
    await db.collection('m4_documents').createIndex({ customerId: 1 });
    await db.collection('m4_documents').createIndex({ companyId: 1 });
    await db.collection('m4_documents').createIndex({ documentType: 1 });
    await db.collection('document_versions').createIndex({ versionId: 1 }, { unique: true });
    await db.collection('document_versions').createIndex({ documentId: 1 });
    await db.collection('document_audit_logs').createIndex({ auditId: 1 }, { unique: true });
    await db.collection('document_audit_logs').createIndex({ documentId: 1 });
    await db.collection('document_audit_logs').createIndex({ requestId: 1 });
    await db.collection('document_checklists').createIndex({ checklistId: 1 }, { unique: true });
    await db.collection('document_checklists').createIndex({ requestId: 1 });
    // Selected Quotes indexes
    await db.collection('selected_quotes').createIndex({ selectedQuoteId: 1 }, { unique: true });
    await db.collection('selected_quotes').createIndex({ quoteId: 1 });
    await db.collection('selected_quotes').createIndex({ customerId: 1 });
    await db.collection('selected_quotes').createIndex({ companyId: 1 });
    await db.collection('selected_quotes').createIndex({ status: 1 });
    console.log('[+] MongoDB indexes ensured');
  } catch (err: any) {
    console.warn('[!] Index creation warning:', err.message);
  }
}


// Counters for human-readable IDs (SHP-1001, Q-2001, ...)
export async function nextSequence(name: string, prefix: string, pad = 4): Promise<string> {
  const db = await getDb();
  const counters = db.collection('counters');
  const result = await counters.findOneAndUpdate(
    { _id: name as any },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  const seq = result ? (result as any).seq ?? 1 : 1;
  return `${prefix}-${String(seq).padStart(pad, '0')}`;
}
