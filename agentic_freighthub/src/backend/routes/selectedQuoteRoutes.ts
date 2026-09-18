import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { selectedQuotesCollection, nextSequence } from '../db/database';

export const selectedQuoteRouter = Router();
selectedQuoteRouter.use(requireAuth);

const quoteDocsStore: Map<string, any[]> = new Map();

// In-memory store for proof documents per customer (keyed by customer email)
const proofDocsStore: Map<string, any[]> = new Map();

/**
 * POST /api/selected-quotes
 * Customer selects a quote
 */
selectedQuoteRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = req.authUser!;
    const { quoteId, companyName, companyId, originCode, destinationCode, transportMode, tariffAmount, currency, shipperEmail, calculationSnapshot, availableQuotes } = req.body;

    if (!quoteId) {
      res.status(400).json({ success: false, error: 'quoteId is required' });
      return;
    }

    const selectedQuoteId = `SEL-${Date.now()}-${await nextSequence('selected_quote', 'SEL')}`;
    const now = new Date().toISOString();

    const doc: any = {
      selectedQuoteId,
      quoteId,
      customerId: authUser.id,
      customerEmail: authUser.email,
      companyName: companyName || 'FreightHub',
      companyId: companyId || 'COMP-001',
      originCode: originCode || '',
      destinationCode: destinationCode || '',
      transportMode: transportMode || 'FCL',
      tariffAmount: tariffAmount || 0,
      currency: currency || 'INR',
      shipperEmail: shipperEmail || authUser.email,
      status: 'SELECTED',
      agentRemarks: '',
      reviewedBy: '',
      reviewedAt: '',
      createdAt: now,
      updatedAt: now,
    };

    // Store immutable calculation snapshot for the selected quote
    if (calculationSnapshot) {
      doc.calculationSnapshot = calculationSnapshot;
    }

    // Store all available company quotes for agent visibility
    if (Array.isArray(availableQuotes) && availableQuotes.length > 0) {
      doc.availableQuotes = availableQuotes;
    }

    const col = await selectedQuotesCollection();
    await col.insertOne(doc);

    res.json({ success: true, data: doc });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/selected-quotes
 * Customer: their own selections
 * Agent: selections for their company
 * Admin: all
 */
selectedQuoteRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = req.authUser!;
    const col = await selectedQuotesCollection();

    let query: any = {};
    if (authUser.role === 'customer' || authUser.role === 'user') {
      query.customerEmail = authUser.email;
    }
    // freight-agent, admin, customs-officer: see ALL selected quotes

    const items = await col.find(query).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, data: items });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/selected-quotes/:id
 * Agent updates status (APPROVED, REJECTED, UNDER_REVIEW)
 */
selectedQuoteRouter.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = req.authUser!;
    const { id } = req.params;
    const { status, agentRemarks } = req.body;

    const col = await selectedQuotesCollection();
    const item = await col.findOne({ selectedQuoteId: id });

    if (!item) {
      res.status(404).json({ success: false, error: 'Selected quote not found' });
      return;
    }

    if (authUser.role !== 'freight-agent' && authUser.role !== 'admin' && authUser.role !== 'customs-officer') {
      res.status(403).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const update: any = { updatedAt: new Date().toISOString() };
    if (status) update.status = status;
    if (agentRemarks) update.agentRemarks = agentRemarks;
    if (authUser.role === 'freight-agent' || authUser.role === 'admin') {
      update.reviewedBy = authUser.email;
      update.reviewedAt = new Date().toISOString();
    }

    await col.updateOne({ selectedQuoteId: id }, { $set: update });

    const updated = await col.findOne({ selectedQuoteId: id });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/selected-quotes/:id/documents
 * Customer uploads a proof document for a selected quote
 */
selectedQuoteRouter.post('/:id/documents', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = req.authUser!;
    const { id } = req.params;
    const { documentType, fileName, fileUrl, fileSize, mimeType } = req.body;

    if (!fileName || !fileUrl) {
      res.status(400).json({ success: false, error: 'fileName and fileUrl are required' });
      return;
    }

    const col = await selectedQuotesCollection();
    const item = await col.findOne({ selectedQuoteId: id });
    if (!item) {
      res.status(404).json({ success: false, error: 'Selected quote not found' });
      return;
    }

    const docId = `SQDOC-${Date.now()}-${Math.round(Math.random() * 1e4)}`;
    const doc = {
      docId,
      selectedQuoteId: id,
      documentType: documentType || 'OTHER',
      fileName,
      fileUrl,
      fileSize: fileSize || 0,
      mimeType: mimeType || '',
      uploadedBy: authUser.email,
      uploadedAt: new Date().toISOString(),
      status: 'UPLOADED',
    };

    const docs = quoteDocsStore.get(id) || [];
    docs.push(doc);
    quoteDocsStore.set(id, docs);

    res.json({ success: true, data: doc });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/selected-quotes/:id/documents
 * Get all proof documents for a selected quote
 */
selectedQuoteRouter.get('/:id/documents', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const docs = quoteDocsStore.get(id) || [];
    res.json({ success: true, data: docs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/selected-quotes/proof-documents
 * Customer uploads a proof document (Aadhaar, Company Verification, Address Proof)
 * Stored per customer email for completeness checking
 */
selectedQuoteRouter.post('/proof-documents', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = req.authUser!;
    const { documentType, fileName, fileUrl, fileSize, mimeType } = req.body;

    if (!documentType || !fileName || !fileUrl) {
      res.status(400).json({ success: false, error: 'documentType, fileName, and fileUrl are required' });
      return;
    }

    const validTypes = ['AADHAAR', 'COMPANY_VERIFICATION', 'ADDRESS_PROOF'];
    if (!validTypes.includes(documentType)) {
      res.status(400).json({ success: false, error: 'Invalid documentType. Must be AADHAAR, COMPANY_VERIFICATION, or ADDRESS_PROOF' });
      return;
    }

    const customerEmail = authUser.email;
    const docs = proofDocsStore.get(customerEmail) || [];

    // Replace existing document of same type (no duplicates)
    const filtered = docs.filter((d) => d.documentType !== documentType);
    const doc = {
      docId: `PROOF-${Date.now()}-${Math.round(Math.random() * 1e4)}`,
      documentType,
      fileName,
      fileUrl,
      fileSize: fileSize || 0,
      mimeType: mimeType || '',
      uploadedBy: customerEmail,
      uploadedAt: new Date().toISOString(),
      status: 'UPLOADED',
    };
    filtered.push(doc);
    proofDocsStore.set(customerEmail, filtered);

    res.json({ success: true, data: doc });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/selected-quotes/proof-documents
 * Get all proof documents for the authenticated customer
 */
selectedQuoteRouter.get('/proof-documents', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = req.authUser!;
    const customerEmail = authUser.email;
    const docs = proofDocsStore.get(customerEmail) || [];
    res.json({ success: true, data: docs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/selected-quotes/proof-documents/completeness/:customerEmail
 * Freight Agent checks document completeness for a customer
 */
selectedQuoteRouter.get('/proof-documents/completeness/:customerEmail', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = req.authUser!;
    const role = (authUser.role || '').toLowerCase();
    const isInternal = ['freight-agent', 'admin', 'business', 'broker', 'customs-officer', 'customer-officer'].includes(role);

    if (!isInternal) {
      res.status(403).json({ success: false, error: 'Only freight agents can check document completeness' });
      return;
    }

    const { customerEmail } = req.params;
    const docs = proofDocsStore.get(customerEmail) || [];

    const requiredTypes = ['AADHAAR', 'COMPANY_VERIFICATION', 'ADDRESS_PROOF'];
    const uploadedTypes = docs.map((d) => d.documentType);
    const completeness = requiredTypes.map((t) => ({
      documentType: t,
      status: uploadedTypes.includes(t) ? 'UPLOADED' : 'NOT_UPLOADED',
      fileName: docs.find((d) => d.documentType === t)?.fileName || null,
      uploadedAt: docs.find((d) => d.documentType === t)?.uploadedAt || null,
    }));

    const uploadedCount = completeness.filter((c) => c.status === 'UPLOADED').length;
    const missingCount = requiredTypes.length - uploadedCount;

    res.json({
      success: true,
      data: {
        customerEmail,
        completeness,
        uploadedCount,
        missingCount,
        totalRequired: requiredTypes.length,
        isComplete: missingCount === 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
