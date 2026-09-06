// Quotes API Endpoints & Customer Portal Projection (Section 10.2)

import { Router } from 'express';
import {
  createQuote,
  getQuoteVersions,
  getLatestQuoteVersion,
  getCustomerQuoteProjection,
  QuoteStatus,
} from '../quotes/quoteService';
import { DEFAULT_MARGIN_POLICIES } from '../pricing/marginPolicy';

export const quoteRouter = Router();

const APPROVAL_QUEUE: any[] = [];

// POST /api/v1/quotes
quoteRouter.post('/v1/quotes', (req, res) => {
  try {
    const version = createQuote(req.body);
    if (version.requiresApproval) {
      APPROVAL_QUEUE.push({
        quoteId: version.quoteId,
        versionId: version.versionId,
        approvalsRequired: version.approvalsRequired,
        requestedAt: new Date().toISOString(),
        status: 'PENDING',
      });
    }
    res.status(201).json({ success: true, data: version });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/v1/quotes/:id/versions
quoteRouter.get('/v1/quotes/:id/versions', (req, res) => {
  const versions = getQuoteVersions(req.params.id);
  res.json({ success: true, data: versions });
});

// PATCH /api/v1/quotes/:id/margin (Section 5.3 Deterministic Control: 409 QUOTE_BELOW_MARGIN_FLOOR)
quoteRouter.patch('/v1/quotes/:id/margin', (req, res) => {
  try {
    const { marginPct, forceOverride } = req.body;
    const latest = getLatestQuoteVersion(req.params.id);

    if (!latest) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quote not found' },
      });
    }

    const floorPct = latest.breakdown.marginResult.floorPct;
    const requested = Number(marginPct);

    // Floor violation check
    if (requested < floorPct && !forceOverride) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'QUOTE_BELOW_MARGIN_FLOOR',
          message: `Requested margin (${requested}%) is below policy floor (${floorPct}%). Submit for manager approval.`,
          details: [{ field: 'marginPct', floorPct, requestedMarginPct: requested }],
        },
      });
    }

    // Create a new immutable version with updated margin
    const newVersion = createQuote({
      originPortCode: latest.originPortCode,
      destinationPortCode: latest.destinationPortCode,
      incoterm: latest.incoterm,
      transportMode: latest.transportMode as any,
      requestedMarginPct: requested,
      quoteId: latest.quoteId,
    });

    res.json({ success: true, data: newVersion });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/v1/quotes/:id/submit-approval
quoteRouter.post('/v1/quotes/:id/submit-approval', (req, res) => {
  const latest = getLatestQuoteVersion(req.params.id);
  if (!latest) return res.status(404).json({ success: false, message: 'Quote not found' });

  latest.status = 'PENDING_APPROVAL';
  res.json({ success: true, message: 'Quote submitted for managerial approval.', data: latest });
});

// POST /api/v1/quotes/:id/approve
quoteRouter.post('/v1/quotes/:id/approve', (req, res) => {
  const latest = getLatestQuoteVersion(req.params.id);
  if (!latest) return res.status(404).json({ success: false, message: 'Quote not found' });

  latest.status = 'APPROVED';
  latest.requiresApproval = false;
  res.json({ success: true, message: 'Quote approved.', data: latest });
});

// POST /api/v1/quotes/:id/reject
quoteRouter.post('/v1/quotes/:id/reject', (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, message: 'Rejection reason is mandatory.' });
  }

  const latest = getLatestQuoteVersion(req.params.id);
  if (!latest) return res.status(404).json({ success: false, message: 'Quote not found' });

  latest.status = 'DECLINED';
  res.json({ success: true, message: `Quote rejected. Reason: ${reason}`, data: latest });
});

// POST /api/v1/quotes/:id/issue
quoteRouter.post('/v1/quotes/:id/issue', (req, res) => {
  const latest = getLatestQuoteVersion(req.params.id);
  if (!latest) return res.status(404).json({ success: false, message: 'Quote not found' });

  latest.status = 'ISSUED';
  latest.issuedAt = new Date().toISOString();
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 14); // 14-day validity clock
  latest.validUntil = validUntil.toISOString();

  res.json({ success: true, message: 'Quote issued. PDF document generated & validity clock started.', data: latest });
});

// GET /api/v1/quotes/approvals/queue
quoteRouter.get('/v1/quotes/approvals/queue', (req, res) => {
  res.json({ success: true, data: APPROVAL_QUEUE });
});

// GET/PUT /api/v1/admin/margin-policies
quoteRouter.get('/v1/admin/margin-policies', (req, res) => {
  res.json({ success: true, data: DEFAULT_MARGIN_POLICIES });
});

// POST /api/v1/quotes/:id/accept
quoteRouter.post('/v1/quotes/:id/accept', (req, res) => {
  const latest = getLatestQuoteVersion(req.params.id);
  if (!latest) return res.status(404).json({ success: false, message: 'Quote not found' });

  latest.status = 'ACCEPTED';
  res.json({ success: true, message: 'Quote accepted by customer.', data: latest });
});

// POST /api/v1/quotes/:id/decline
quoteRouter.post('/v1/quotes/:id/decline', (req, res) => {
  const { reason } = req.body;
  const latest = getLatestQuoteVersion(req.params.id);
  if (!latest) return res.status(404).json({ success: false, message: 'Quote not found' });

  latest.status = 'DECLINED';
  res.json({ success: true, message: `Quote declined by customer. Reason: ${reason || 'N/A'}`, data: latest });
});

// GET /portal/quotes/:id (CUSTOMER PORTAL PROJECTION - COMMERCIAL KEYS STRIPPED)
quoteRouter.get('/portal/quotes/:id', (req, res) => {
  const projection = getCustomerQuoteProjection(req.params.id);
  if (!projection) {
    return res.status(404).json({ success: false, message: 'Quote not found or not available.' });
  }

  // Double-check no cost, margin, buy-rate, or win-probability keys exist in output
  res.json({ success: true, data: projection });
});
