import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { selectedQuotesCollection, nextSequence } from '../db/database';

export const selectedQuoteRouter = Router();
selectedQuoteRouter.use(requireAuth);

const quoteDocsStore: Map<string, any[]> = new Map();

/**
 * POST /api/selected-quotes
 * Customer selects a quote
 */
selectedQuoteRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = req.authUser!;
    const { quoteId, companyName, companyId, originCode, destinationCode, transportMode, tariffAmount, currency, shipperEmail } = req.body;

    if (!quoteId) {
      res.status(400).json({ success: false, error: 'quoteId is required' });
      return;
    }

    const selectedQuoteId = `SEL-${Date.now()}-${await nextSequence('selected_quote', 'SEL')}`;
    const now = new Date().toISOString();

    const doc = {
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
