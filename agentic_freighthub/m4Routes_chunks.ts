import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { quotesCollection, verificationRequestsCollection, bookingsCollection, documentsCollection, nextSequence } from '../db/database';
import { SavedQuotation, VerificationRequest, Booking, VerificationChecklist } from '../../types';

export const m4Router = Router();

// Middleware to apply requireAuth to all /api routes in this router
m4Router.use('/api', requireAuth);

/**
 * 1. POST /api/quotes/select
 * Customer selects a quote -> Creates VerificationRequest
 */
m4Router.post('/api/quotes/select', async (req: Request, res: Response): Promise<void> => {
  try {
    const { quoteId } = req.body;
    if (!quoteId) {
      res.status(400).json({ success: false, error: 'quoteId is required' });
      return;
    }

    const authUser = req.authUser!;
    if (authUser.role !== 'user' && authUser.role !== 'customer') {
      res.status(403).json({ success: false, error: 'Only customers can select quotes' });
      return;
    }

    const quotesCol = await quotesCollection();
    const quote = (await quotesCol.findOne({ id: quoteId })) as unknown as SavedQuotation | null;

    if (!quote) {
      res.status(404).json({ success: false, error: 'Quote not found' });
      return;
    }

    // 3. Verify the customer is allowed to access/select that quote
    // For M1-M3 quotes, it's either generic or assigned to the shipper
    // We assume if it's not EXPIRED, DRAFT, etc., it can be selected.
    if (quote.shipperEmail && quote.shipperEmail !== authUser.email) {
      res.status(403).json({ success: false, error: 'You are not authorized to select this quote' });
      return;
    }

    // 4 & 5 & 6. Verify quote is active and not expired
    if (quote.status === 'EXPIRED') {
      res.status(400).json({ success: false, error: 'Quote is expired' });
      return;
    }
    if (quote.expiresAt && Date.now() > new Date(quote.expiresAt).getTime()) {
      res.status(400).json({ success: false, error: 'Quote is expired' });
      return;
    }

    const verReqCol = await verificationRequestsCollection();
    // 7. Prevent duplicate selection
    const existingReq = await verReqCol.findOne({ quoteId });
    if (existingReq) {
      res.status(409).json({ success: false, error: 'A verification request for this quote already exists' });
      return;
    }

    // 8 & 9. Create a VerificationRequest with an IMMUTABLE quoteSnapshot
    const requestId = await nextSequence('verification_request', 'VRQ');
    const companyId = quote.companyId || 'COMP-001'; // Fallback for old quotes

    const newReq: VerificationRequest = {
      requestId,
      quoteId,
      quoteSnapshot: { ...quote },
      customerId: authUser.id,
      companyId,
      status: 'PENDING',
      checklist: {
        shipment: false,
        cargo: false,
        capacity: false,
        route: false,
        schedule: false,
        document: false,
        commercial: false,
      },
      missingInfoRequested: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await verReqCol.insertOne(newReq);
    
    // Update quote status
    await quotesCol.updateOne({ id: quoteId }, { $set: { status: 'SELECTED' } });

    res.status(201).json({ success: true, data: newReq });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 2. GET /api/verifications
// MISSING LINE 101
// MISSING LINE 102
// MISSING LINE 103
// MISSING LINE 104
// MISSING LINE 105
// MISSING LINE 106
// MISSING LINE 107
// MISSING LINE 108
// MISSING LINE 109
// MISSING LINE 110
// MISSING LINE 111
// MISSING LINE 112
// MISSING LINE 113
// MISSING LINE 114
// MISSING LINE 115
// MISSING LINE 116
// MISSING LINE 117
// MISSING LINE 118
// MISSING LINE 119
// MISSING LINE 120
// MISSING LINE 121
// MISSING LINE 122
// MISSING LINE 123
// MISSING LINE 124
// MISSING LINE 125
// MISSING LINE 126
// MISSING LINE 127
// MISSING LINE 128
// MISSING LINE 129
// MISSING LINE 130
// MISSING LINE 131
// MISSING LINE 132
// MISSING LINE 133
// MISSING LINE 134
// MISSING LINE 135
// MISSING LINE 136
// MISSING LINE 137
// MISSING LINE 138
// MISSING LINE 139
// MISSING LINE 140
// MISSING LINE 141
// MISSING LINE 142
// MISSING LINE 143
// MISSING LINE 144
// MISSING LINE 145
// MISSING LINE 146
// MISSING LINE 147
// MISSING LINE 148
// MISSING LINE 149
      }
    } else if (authUser.role === 'user' || authUser.role === 'customer') {
      if (request.customerId !== authUser.id) {
        res.status(403).json({ success: false, error: 'Unauthorized access' });
        return;
      }
    } else if (authUser.role === 'admin' || authUser.role === 'customs-officer') {
      // Unconditional access for global roles
    } else {
      res.status(403).json({ success: false, error: 'Unauthorized access' });
      return;
    }

    res.json({ success: true, data: request });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4. PATCH /api/verifications/:id
 * Agent updates checklist
 */
m4Router.patch('/api/verifications/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { checklist } = req.body;
    const authUser = req.authUser!;
    const verReqCol = await verificationRequestsCollection();

    const request = (await verReqCol.findOne({ requestId: id })) as unknown as VerificationRequest | null;
    if (!request) {
      res.status(404).json({ success: false, error: 'Verification request not found' });
      return;
    }

    // Authorization Check
    if (authUser.role === 'freight-agent') {
      if (request.companyId !== (authUser.companyId || 'COMP-001' || 'COMP-001')) {
        res.status(403).json({ success: false, error: 'Unauthorized cross-company access' });
        return;
      }
    }

    if (!checklist || typeof checklist !== 'object') {
      res.status(400).json({ success: false, error: 'Invalid checklist format' });
      return;
    }

    // Only allow updating boolean checklist fields
    const updatedChecklist = { ...request.checklist };
    for (const key of Object.keys(updatedChecklist)) {
      if (typeof checklist[key] === 'boolean') {
        (updatedChecklist as any)[key] = checklist[key];
      }
    }

    const updateDoc: any = {
      $set: {
        checklist: updatedChecklist,
        updatedAt: new Date().toISOString(),
      },
    };

    if (request.status === 'PENDING') {
      updateDoc.$set.status = 'IN_PROGRESS';
    }

    await verReqCol.updateOne({ requestId: id }, updateDoc);
    
    const finalReq = await verReqCol.findOne({ requestId: id });
    res.json({ success: true, data: finalReq });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 5. POST /api/verifications/:id/action
 * APPROVE, MODIFY, REJECT, REQUEST_INFO
 */
m4Router.post('/api/verifications/:id/action', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, missingInfoRequested, modificationReason, modifiedQuoteData, rejectionReason } = req.body;
    const authUser = req.authUser!;

    if (authUser.role !== 'freight-agent' && authUser.role !== 'customs-officer') {
      res.status(403).json({ success: false, error: 'Only authorized personnel can perform this action' });
      return;
    }

    const verReqCol = await verificationRequestsCollection();
    const request = (await verReqCol.findOne({ requestId: id })) as unknown as VerificationRequest | null;
    if (!request) {
      res.status(404).json({ success: false, error: 'Verification request not found' });
      return;
    }

    if (authUser.role === 'freight-agent') {
      if (request.companyId !== (authUser.companyId || 'COMP-001')) {
        res.status(403).json({ success: false, error: 'Unauthorized cross-company access' });
        return;
      }
    }

    const quotesCol = await quotesCollection();
    const originalQuote = (await quotesCol.findOne({ id: request.quoteId })) as unknown as SavedQuotation | null;
    if (!originalQuote) {
      res.status(404).json({ success: false, error: 'Original quote not found' });
      return;
    }

    // Check expiry
    if (originalQuote.expiresAt && Date.now() > new Date(originalQuote.expiresAt).getTime()) {
      res.status(400).json({ success: false, error: 'Original quote has expired' });
      return;
    }

    const nowIso = new Date().toISOString();

    switch (action) {
      case 'APPROVE':
        await verReqCol.updateOne({ requestId: id }, { $set: { status: 'APPROVED', updatedAt: nowIso } });
        
        // Phase 4/5: Booking Auto-Creation for customs-officer
        if (authUser.role === 'customs-officer') {
           const bookCol = await bookingsCollection();
           // Check by verificationRequestId to prevent duplicates even if quote is revised
           const existingBooking = await bookCol.findOne({ verificationRequestId: id });
           
           if (!existingBooking) {
             const bookingRef = await nextSequence('booking', 'BKG');
             const targetQuote = request.revisedQuoteSnapshot || request.quoteSnapshot;
             const targetQuoteId = request.revisedQuoteId || request.quoteId;
             
             const newBooking: Booking = {
                bookingRef,
                quoteId: targetQuoteId,
                quoteVersion: targetQuote.version || 1,
                shipmentId: targetQuote.shipmentId || 'PENDING',
                companyId: targetQuote.companyId || request.companyId || 'COMP-001',
                customerId: request.customerId,
                quoteSnapshot: { ...targetQuote },
                status: 'CONFIRMED',
                verificationRequestId: id,
                createdAt: nowIso,
                updatedAt: nowIso,
             };
             await bookCol.insertOne(newBooking);
           }
        }
        res.json({ success: true, message: 'Verification Approved' });
        break;

      case 'REJECT': {
        const reason = rejectionReason || 'No reason provided';
        const rejectionRecord = {
          rejectedBy: authUser.id,
          rejectedAt: nowIso,
          reason,
          role: authUser.role as 'freight-agent' | 'customs-officer',
        };
        const existingHistory = request.rejectionHistory || [];
        await verReqCol.updateOne(
          { requestId: id },
          {
            $set: {
              status: 'REJECTED',
              rejectionReason: reason,
              rejectedBy: authUser.id,
              rejectedAt: nowIso,
              rejectionHistory: [...existingHistory, rejectionRecord],
              updatedAt: nowIso,
            },
          }
        );
        await quotesCol.updateOne({ id: request.quoteId }, { $set: { status: 'REJECTED' } });
        res.json({ success: true, message: 'Verification Rejected' });
        break;
      }

      case 'REQUEST_INFO':
        if (!Array.isArray(missingInfoRequested)) {
          res.status(400).json({ success: false, error: 'missingInfoRequested must be an array' });
          return;
        }
        await verReqCol.updateOne(
          { requestId: id },
          { $set: { status: 'INFO_REQUESTED', missingInfoRequested, updatedAt: nowIso } }
        );
        res.json({ success: true, message: 'Info Requested' });
        break;

      case 'MODIFY':
        if (!modificationReason) {
          res.status(400).json({ success: false, error: 'modificationReason is required for MODIFY action' });
          return;
        }
        
        // Mark original as SUPERSEDED
        await quotesCol.updateOne({ id: request.quoteId }, { $set: { status: 'SUPERSEDED' } });

        const newVersion = (originalQuote.version || 1) + 1;
        const newQuoteId = await nextSequence('quote', 'QT');

        const revisedQuote: SavedQuotation = {
          ...originalQuote,
          id: newQuoteId,
          version: newVersion,
          parentQuoteId: originalQuote.id,
          modificationReason,
          status: 'ISSUED', // Issued for customer to accept
          createdAt: nowIso,
          // Merge any modifiedQuoteData safely if needed, preserving M1-M3 context
          ...(modifiedQuoteData || {}),
        };
        // Safely remove MongoDB _id if spread operator caught it from the database result
        if ((revisedQuote as any)._id) delete (revisedQuote as any)._id;

        await quotesCol.insertOne(revisedQuote);
        
        // Update the verification request with the new revised quote ID and snapshot
        await verReqCol.updateOne(
          { requestId: id },
          { 
            $set: { 
              status: 'REVISION_ISSUED',
              revisedQuoteId: newQuoteId,
              revisedQuoteSnapshot: { ...revisedQuote },
              updatedAt: nowIso
            } 
          }
        );
        res.json({ success: true, message: 'Quote Revision Issued', data: revisedQuote });
        break;

      default:
        res.status(400).json({ success: false, error: 'Invalid action' });
        break;
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 6. POST /api/quotes/:id/customer-action
 * ACCEPT, REJECT
 */
m4Router.post('/api/quotes/:id/customer-action', async (req: Request, res: Response): Promise<void> => {
// MISSING LINE 401
// MISSING LINE 402
// MISSING LINE 403
// MISSING LINE 404
// MISSING LINE 405
// MISSING LINE 406
// MISSING LINE 407
// MISSING LINE 408
// MISSING LINE 409
// MISSING LINE 410
// MISSING LINE 411
// MISSING LINE 412
// MISSING LINE 413
// MISSING LINE 414
// MISSING LINE 415
// MISSING LINE 416
// MISSING LINE 417
// MISSING LINE 418
// MISSING LINE 419
// MISSING LINE 420
// MISSING LINE 421
// MISSING LINE 422
// MISSING LINE 423
// MISSING LINE 424
// MISSING LINE 425
// MISSING LINE 426
// MISSING LINE 427
// MISSING LINE 428
// MISSING LINE 429
// MISSING LINE 430
// MISSING LINE 431
// MISSING LINE 432
// MISSING LINE 433
// MISSING LINE 434
// MISSING LINE 435
// MISSING LINE 436
// MISSING LINE 437
// MISSING LINE 438
// MISSING LINE 439
        { $or: [{ quoteId: targetQuoteId }, { revisedQuoteId: targetQuoteId }] }, 
        { $set: { status: 'APPROVED', updatedAt: new Date().toISOString() } }
      );

      res.json({ success: true, message: 'Quote Accepted' });
    } else if (action === 'REJECT') {
      const targetQuoteId = quote.id;
      await quotesCol.updateOne({ id: targetQuoteId }, { $set: { status: 'REJECTED' } });
      
      const verReqCol = await verificationRequestsCollection();
      await verReqCol.updateOne(
        { $or: [{ quoteId: targetQuoteId }, { revisedQuoteId: targetQuoteId }] }, 
        { $set: { status: 'REJECTED', updatedAt: new Date().toISOString() } }
      );

      res.json({ success: true, message: 'Quote Rejected' });
    } else {
      res.status(400).json({ success: false, error: 'Invalid action' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
// MISSING LINE 461
// MISSING LINE 462
// MISSING LINE 463
// MISSING LINE 464
// MISSING LINE 465
// MISSING LINE 466
// MISSING LINE 467
// MISSING LINE 468
// MISSING LINE 469
// MISSING LINE 470
// MISSING LINE 471
// MISSING LINE 472
// MISSING LINE 473
// MISSING LINE 474
// MISSING LINE 475
// MISSING LINE 476
// MISSING LINE 477
// MISSING LINE 478
// MISSING LINE 479
// MISSING LINE 480
// MISSING LINE 481
// MISSING LINE 482
// MISSING LINE 483
// MISSING LINE 484
// MISSING LINE 485
// MISSING LINE 486
// MISSING LINE 487
// MISSING LINE 488
// MISSING LINE 489
// MISSING LINE 490
// MISSING LINE 491
// MISSING LINE 492
// MISSING LINE 493
// MISSING LINE 494
// MISSING LINE 495
// MISSING LINE 496
// MISSING LINE 497
// MISSING LINE 498
// MISSING LINE 499
    const nowIso = new Date().toISOString();
    const resubmissionCount = (request.resubmissionCount || 0) + 1;

    // Reset status to PENDING for agent re-review
    // Preserve rejection history, update resubmission metadata
    await verReqCol.updateOne(
      { requestId: id },
      {
        $set: {
          status: 'PENDING',
          rejectionReason: undefined,
          rejectedBy: undefined,
          rejectedAt: undefined,
          resubmissionCount,
          lastResubmittedAt: nowIso,
          updatedAt: nowIso,
        },
      }
    );

    // Also reset the quote status back to ISSUED so it can be reviewed again
    const quotesCol = await quotesCollection();
    await quotesCol.updateOne(
      { id: request.quoteId },
      { $set: { status: 'ISSUED', updatedAt: nowIso } }
    );

    // Reset the selected quote status if it exists
    const selectedCol = await selectedQuotesCollection();
    await selectedCol.updateOne(
      { quoteId: request.quoteId, customerId: authUser.id },
      { $set: { status: 'UNDER_REVIEW', updatedAt: nowIso } }
    );

    const updated = await verReqCol.findOne({ requestId: id });
    res.json({ success: true, data: updated, message: 'Verification resubmitted for review' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 7. POST /api/bookings
 * Create Booking from ACCEPTED quote
 */
m4Router.post('/api/bookings', async (req: Request, res: Response): Promise<void> => {
  try {
    const { quoteId } = req.body;
    const authUser = req.authUser!;

    if (authUser.role !== 'user' && authUser.role !== 'customer') {
      res.status(403).json({ success: false, error: 'Only customers can create bookings' });
      return;
    }

    const quotesCol = await quotesCollection();
    const quote = (await quotesCol.findOne({ id: quoteId })) as unknown as SavedQuotation | null;
    if (!quote) {
      res.status(404).json({ success: false, error: 'Quote not found' });
      return;
    }

    if (quote.shipperEmail && quote.shipperEmail !== authUser.email) {
      res.status(403).json({ success: false, error: 'You do not own this quote' });
      return;
    }

    if (quote.status !== 'ACCEPTED') {
      res.status(400).json({ success: false, error: 'Quote must be ACCEPTED before booking' });
      return;
    }

    if (quote.expiresAt && Date.now() > new Date(quote.expiresAt).getTime()) {
      res.status(400).json({ success: false, error: 'Quote is expired' });
      return;
    }

    const bookCol = await bookingsCollection();
    const existingBooking = await bookCol.findOne({ quoteId });
    if (existingBooking) {
      res.status(409).json({ success: false, error: 'Booking already exists for this quote version' });
      return;
    }

    const bookingRef = await nextSequence('booking', 'BKG');
    
    const newBooking: Booking = {
      bookingRef,
      quoteId: quote.id,
      quoteVersion: quote.version || 1,
      shipmentId: quote.shipmentId || 'PENDING',
      companyId: quote.companyId || 'COMP-001',
      customerId: authUser.id,
      quoteSnapshot: { ...quote },
      status: 'CONFIRMED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await bookCol.insertOne(newBooking);
    res.status(201).json({ success: true, data: newBooking });
// MISSING LINE 601
// MISSING LINE 602
// MISSING LINE 603
// MISSING LINE 604
// MISSING LINE 605
// MISSING LINE 606
// MISSING LINE 607
// MISSING LINE 608
// MISSING LINE 609
// MISSING LINE 610
// MISSING LINE 611
// MISSING LINE 612
// MISSING LINE 613
// MISSING LINE 614
// MISSING LINE 615
// MISSING LINE 616
// MISSING LINE 617
// MISSING LINE 618
// MISSING LINE 619
// MISSING LINE 620
// MISSING LINE 621
// MISSING LINE 622
// MISSING LINE 623
// MISSING LINE 624
// MISSING LINE 625
// MISSING LINE 626
// MISSING LINE 627
// MISSING LINE 628
// MISSING LINE 629

// MISSING LINE 631
// MISSING LINE 632
// MISSING LINE 633
// MISSING LINE 634
// MISSING LINE 635
// MISSING LINE 636
// MISSING LINE 637
// MISSING LINE 638
// MISSING LINE 639
// MISSING LINE 640
// MISSING LINE 641
// MISSING LINE 642
// MISSING LINE 643
// MISSING LINE 644
// MISSING LINE 645
// MISSING LINE 646
// MISSING LINE 647
// MISSING LINE 648
// MISSING LINE 649
    } else {
      res.status(403).json({ success: false, error: 'Unauthorized access' });
      return;
    }

    res.json({ success: true, data: document });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 9. GET /api/bookings
 * Securely fetch bookings based on user role
 */
m4Router.get('/api/bookings', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = req.authUser!;
    const bookCol = await bookingsCollection();

    let query: any = {};
    if (authUser.role === 'customer' || authUser.role === 'user') {
      query.customerId = authUser.id;
    } else if (authUser.role === 'freight-agent') {
      query.companyId = authUser.companyId || 'COMP-001';
    } else if (authUser.role === 'admin' || authUser.role === 'customs-officer') {
      // Admin and customs officers can see all bookings
    } else {
      res.status(403).json({ success: false, error: 'Unauthorized access' });
      return;
    }

    const bookings = await bookCol.find(query).toArray();
    res.json({ success: true, data: bookings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 10. GET /api/bookings/:id
 * Securely fetch a single booking
 */
m4Router.get('/api/bookings/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authUser = req.authUser!;
    const bookCol = await bookingsCollection();

    const booking = await bookCol.findOne({ bookingRef: id }) as unknown as Booking | null;
    if (!booking) {
      res.status(404).json({ success: false, error: 'Booking not found' });
      return;
    }

    // Enforce authorization checks
    if (authUser.role === 'customer' || authUser.role === 'user') {
      if (booking.customerId !== authUser.id) {
        res.status(403).json({ success: false, error: 'Unauthorized access' });
        return;
      }
    } else if (authUser.role === 'freight-agent') {
      if (booking.companyId !== (authUser.companyId || 'COMP-001')) {
        res.status(403).json({ success: false, error: 'Unauthorized cross-company access' });
        return;
      }
    } else if (authUser.role === 'admin' || authUser.role === 'customs-officer') {
      // Unconditional access
    } else {
      res.status(403).json({ success: false, error: 'Unauthorized access' });
      return;
    }

    res.json({ success: true, data: booking });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 11. GET /api/tracking
 * Customer-specific per-quote tracking.
 * Accepts optional query param `quoteIds` (JSON array) to include quotes
 * that exist only in localStorage (not in the DB).
 * Returns per-quote tracking with exactly 4 stages:
 *   QUOTE_GENERATED -> AGENT_REVIEW -> CUSTOMS_OFFICER_REVIEW -> BOOKED
 * Booked quotes are excluded from the active response.
 */
m4Router.get('/api/tracking', async (req: Request, res: Response): Promise<void> => {
  try {
    const authUser = req.authUser!;
    const role = (authUser.role || '').toLowerCase();
    if (role !== 'customer' && role !== 'user') {
      res.status(403).json({ success: false, error: 'Only customers can access tracking' });
      return;
    }

    const selectedCol = await selectedQuotesCollection();
    const verReqCol = await verificationRequestsCollection();
    const bookCol = await bookingsCollection();

// MISSING LINE 751
// MISSING LINE 752
// MISSING LINE 753
// MISSING LINE 754
// MISSING LINE 755
// MISSING LINE 756
// MISSING LINE 757
// MISSING LINE 758
// MISSING LINE 759

    // 1. All selected quotes for this customer
    const selectedQuotes = await selectedCol
      .find({ customerId })
      .sort({ createdAt: -1 })
      .toArray();

    // 2. All verification requests for this customer
    const verRequests = await verReqCol
      .find({ customerId })
      .toArray();

    // 3. All bookings for this customer
    const bookings = await bookCol
      .find({ customerId })
      .toArray();

    // Build lookup maps
    const selectedByQuoteId = new Map<string, any>();
    for (const sq of selectedQuotes) selectedByQuoteId.set(sq.quoteId, sq);

    const verReqByQuoteId = new Map<string, any>();
    for (const vr of verRequests) verReqByQuoteId.set(vr.quoteId, vr);

    const bookingByQuoteId = new Map<string, any>();
    for (const bk of bookings) {
      bookingByQuoteId.set(bk.quoteId, bk);
      if (bk.verificationRequestId) {
        const vr = verRequests.find((v: any) => v.requestId === bk.verificationRequestId);
        if (vr) bookingByQuoteId.set(vr.quoteId, bk);
      }
    }

    // 4. Collect ALL known quote IDs (from DB + client localStorage)
    const allQuoteIds = new Set<string>();
    for (const sq of selectedQuotes) allQuoteIds.add(sq.quoteId);
    for (const vr of verRequests) allQuoteIds.add(vr.quoteId);
    for (const bk of bookings) allQuoteIds.add(bk.quoteId);
    for (const qid of clientQuoteIds) allQuoteIds.add(qid);

    // 5. Build per-quote tracking records with 4 stages
    const shipments: any[] = [];

    for (const quoteId of allQuoteIds) {
      const sq = selectedByQuoteId.get(quoteId) || null;
      const vr = verReqByQuoteId.get(quoteId) || null;
      const bk = bookingByQuoteId.get(quoteId) || null;

      // Determine quote metadata (priority: selected_quote > verification_request > booking)
      const companyName = sq?.companyName || vr?.quoteSnapshot?.companyName || bk?.quoteSnapshot?.companyName || 'FreightHub';
      const companyId = sq?.companyId || vr?.companyId || bk?.companyId || '';
      const originCode = sq?.originCode || vr?.quoteSnapshot?.originCode || bk?.quoteSnapshot?.originCode || '';
      const destinationCode = sq?.destinationCode || vr?.quoteSnapshot?.destinationCode || bk?.quoteSnapshot?.destinationCode || '';
      const transportMode = sq?.transportMode || vr?.quoteSnapshot?.transportMode || bk?.quoteSnapshot?.transportMode || '';
      const tariffAmount = sq?.tariffAmount || vr?.quoteSnapshot?.tariffAmount || bk?.quoteSnapshot?.tariffAmount || 0;
      const currency = sq?.currency || vr?.quoteSnapshot?.currency || bk?.quoteSnapshot?.currency || 'INR';

      // Timestamps
      const quoteCreatedAt = sq?.createdAt || vr?.createdAt || bk?.createdAt || new Date().toISOString();
      const updatedAt = sq?.updatedAt || vr?.updatedAt || bk?.updatedAt || quoteCreatedAt;

      // Status strings
      const sqStatus = (sq?.status || '').toUpperCase();
      const vrStatus = vr ? (vr.status || '').toUpperCase() : null;
      const bkStatus = bk ? (bk.status || '').toUpperCase() : null;

      // --- Stage 1: QUOTE GENERATED — always completed ---
      const quoteGeneratedStatus = 'COMPLETED';

      // --- Stage 2: AGENT REVIEW ---
      let agentReviewStatus = 'PENDING';
      let agentReviewTimestamp: string | null = null;
      let agentReviewRemarks: string | null = null;

      if (!sq && !vr && !bk) {
        // Unselected quote — only QUOTE GENERATED exists
        agentReviewStatus = 'PENDING';
      } else if (sqStatus === 'SELECTED') {
        agentReviewStatus = 'WAITING';
      } else if (sqStatus === 'UNDER_REVIEW') {
        agentReviewStatus = 'IN_PROGRESS';
        agentReviewTimestamp = sq.reviewedAt || null;
      } else if (sqStatus === 'APPROVED' || sqStatus === 'CUSTOMS_APPROVED' || sqStatus === 'BOOKED') {
        agentReviewStatus = 'COMPLETED';
        agentReviewTimestamp = sq.reviewedAt || null;
        agentReviewRemarks = sq.agentRemarks || null;
      } else if (sqStatus === 'REJECTED') {
        const isCustomsRejection = vr && vr.rejectionHistory && vr.rejectionHistory.length > 0 && 
                                   vr.rejectionHistory[vr.rejectionHistory.length - 1].role === 'customs-officer';
        
        if (isCustomsRejection) {
        // Verification request exists but no selected_quote record
        if (vrStatus === 'PENDING' || vrStatus === 'IN_PROGRESS') {
          agentReviewStatus = 'COMPLETED';
        } else if (vrStatus === 'INFO_REQUESTED' || vrStatus === 'REVISION_ISSUED') {
          agentReviewStatus = 'COMPLETED';
          agentReviewRemarks = 'Agent has issued a revision.';
        } else if (vrStatus === 'APPROVED') {
          agentReviewStatus = 'COMPLETED';
        } else if (vrStatus === 'REJECTED') {
          agentReviewStatus = 'REJECTED';
        }
      }

      // --- Stage 3: CUSTOMS OFFICER REVIEW ---
      let customsReviewStatus = 'PENDING';
      let customsReviewTimestamp: string | null = null;
      let customsReviewRemarks: string | null = null;
      let customsMissingInfo: string[] = [];

      if (vr) {
        if (vrStatus === 'PENDING') {
          customsReviewStatus = agentReviewStatus === 'COMPLETED' ? 'WAITING' : 'PENDING';
        } else if (vrStatus === 'IN_PROGRESS') {
          customsReviewStatus = 'IN_PROGRESS';
        } else if (vrStatus === 'INFO_REQUESTED' || vrStatus === 'REVISION_ISSUED') {
          customsReviewStatus = 'INFO_REQUESTED';
          customsMissingInfo = vr.missingInfoRequested || [];
        } else if (vrStatus === 'APPROVED') {
          customsReviewStatus = 'COMPLETED';
          customsReviewTimestamp = vr.updatedAt || null;
          customsReviewRemarks = vr.agentRemarks || null;
        } else if (vrStatus === 'REJECTED') {
          customsReviewStatus = 'REJECTED';
          customsReviewTimestamp = vr.updatedAt || null;
          customsReviewRemarks = vr.agentRemarks || null;
        }
      } else if (agentReviewStatus === 'COMPLETED' && sqStatus !== 'REJECTED') {
        customsReviewStatus = 'WAITING';
      }

      // --- Stage 4: BOOKED ---
      let bookedStatus = 'PENDING';
      let bookedTimestamp: string | null = null;
      let bookingRef: string | null = null;

      if (bk) {
        if (bkStatus === 'CONFIRMED' || bkStatus === 'PROCESSING' || bkStatus === 'READY_FOR_DISPATCH' || bkStatus === 'COMPLETED') {
          bookedStatus = 'COMPLETED';
          bookedTimestamp = bk.createdAt || null;
          bookingRef = bk.bookingRef || null;
        } else if (bkStatus === 'CANCELLED') {
          bookedStatus = 'CANCELLED';
        }
      }

      // Hide fully booked quotes from active tracking
      if (bkStatus === 'CONFIRMED' || bkStatus === 'PROCESSING' || bkStatus === 'READY_FOR_DISPATCH' || bkStatus === 'COMPLETED') {
        continue;
      }

      // Determine current stage for badge display
      let currentStage = 'QUOTE_GENERATED';
      let stageStatus = 'PENDING';

      if (bookedStatus === 'COMPLETED') {
        currentStage = 'BOOKED';
        stageStatus = 'COMPLETED';
      } else if (customsReviewStatus === 'IN_PROGRESS' || customsReviewStatus === 'WAITING' || customsReviewStatus === 'INFO_REQUESTED') {
        currentStage = 'CUSTOMS_OFFICER_REVIEW';
        stageStatus = customsReviewStatus === 'INFO_REQUESTED' ? 'ACTION_REQUIRED' : 'CURRENT';
      } else if (customsReviewStatus === 'COMPLETED') {
        currentStage = 'CUSTOMS_OFFICER_REVIEW';
        stageStatus = 'COMPLETED';
      } else if (customsReviewStatus === 'REJECTED') {
        currentStage = 'CUSTOMS_OFFICER_REVIEW';
        stageStatus = 'REJECTED';
      } else if (agentReviewStatus === 'IN_PROGRESS' || agentReviewStatus === 'WAITING') {
        currentStage = 'AGENT_REVIEW';
        stageStatus = 'CURRENT';
      } else if (agentReviewStatus === 'COMPLETED') {
        currentStage = 'AGENT_REVIEW';
        stageStatus = 'COMPLETED';
      } else if (agentReviewStatus === 'REJECTED') {
        currentStage = 'AGENT_REVIEW';
        stageStatus = 'REJECTED';
      } else if (quoteGeneratedStatus === 'COMPLETED') {
        currentStage = 'QUOTE_GENERATED';
        stageStatus = 'COMPLETED';
      }

      // Build the 4-stage timeline
      const timeline = [
        {
          step: 'QUOTE_GENERATED',
          label: 'Quote Generated',
          description: 'Your freight quotation has been generated.',
          status: quoteGeneratedStatus,
          timestamp: quoteCreatedAt,
        },
        {
          step: 'AGENT_REVIEW',
          label: 'Agent Review',
          description: agentReviewStatus === 'WAITING'
            ? (vr?.resubmissionCount ? `Resubmitted after previous rejection. Waiting for freight agent to review.` : 'Waiting for freight agent to review your quotation.')
            : agentReviewStatus === 'IN_PROGRESS'
            ? 'Freight agent is reviewing your quotation and documents.'
            : agentReviewStatus === 'COMPLETED'
            ? 'Freight agent has completed the review.'
            : agentReviewStatus === 'REJECTED'
            ? 'Freight agent has rejected this quotation.'
            : 'Pending agent review.',
          status: agentReviewStatus,
          timestamp: agentReviewTimestamp,
          remarks: agentReviewRemarks || null,
        },
        {
          step: 'CUSTOMS_OFFICER_REVIEW',
          label: 'Customs Officer Review',
          description: customsReviewStatus === 'INFO_REQUESTED'
            ? 'Additional information requested by Customs Officer.'
            : customsReviewStatus === 'IN_PROGRESS'
            ? 'Customs Officer is reviewing the shipment and documents.'
            : customsReviewStatus === 'COMPLETED'
            ? 'Customs Officer has approved the shipment.'
            : customsReviewStatus === 'REJECTED'
            ? (vr?.rejectionReason || 'Customs Officer has rejected this quotation.')
            : customsReviewStatus === 'WAITING'
            ? 'Waiting for Customs Officer review.'
            : 'Pending customs officer review.',
          status: customsReviewStatus,
          timestamp: customsReviewTimestamp,
          remarks: customsReviewRemarks || null,
          missingInfo: customsMissingInfo.length > 0 ? customsMissingInfo : undefined,
          rejectionReason: vr?.rejectionReason || null,
          resubmissionCount: vr?.resubmissionCount || 0,
          lastResubmittedAt: vr?.lastResubmittedAt || null,
        },
        {
          step: 'BOOKED',
          label: 'Booked',
          description: bookedStatus === 'COMPLETED'
            ? 'Booking has been confirmed.'
            : 'Booking will be created after customs approval.',
          status: bookedStatus,
          timestamp: bookedTimestamp,
          bookingRef: bookingRef || null,
        },
      ];

      shipments.push({
