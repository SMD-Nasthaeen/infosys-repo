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

    // 3. Verify the customer is allowed to acc
// MY SESSION MISSING LINE 38
// MY SESSION MISSING LINE 39
// MY SESSION MISSING LINE 40
// MY SESSION MISSING LINE 41
// MY SESSION MISSING LINE 42
// MY SESSION MISSING LINE 43
// MY SESSION MISSING LINE 44
// MY SESSION MISSING LINE 45
// MY SESSION MISSING LINE 46
// MY SESSION MISSING LINE 47
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
// MY SESSION MISSING LINE 101
// MY SESSION MISSING LINE 102
// MY SESSION MISSING LINE 103
// MY SESSION MISSING LINE 104
// MY SESSION MISSING LINE 105
// MY SESSION MISSING LINE 106
// MY SESSION MISSING LINE 107
// MY SESSION MISSING LINE 108
// MY SESSION MISSING LINE 109
// MY SESSION MISSING LINE 110
// MY SESSION MISSING LINE 111
// MY SESSION MISSING LINE 112
// MY SESSION MISSING LINE 113
// MY SESSION MISSING LINE 114
// MY SESSION MISSING LINE 115
// MY SESSION MISSING LINE 116
// MY SESSION MISSING LINE 117
// MY SESSION MISSING LINE 118
// MY SESSION MISSING LINE 119
// MY SESSION MISSING LINE 120
// MY SESSION MISSING LINE 121
// MY SESSION MISSING LINE 122
// MY SESSION MISSING LINE 123
// MY SESSION MISSING LINE 124
// MY SESSION MISSING LINE 125
// MY SESSION MISSING LINE 126
// MY SESSION MISSING LINE 127
// MY SESSION MISSING LINE 128
// MY SESSION MISSING LINE 129
// MY SESSION MISSING LINE 130
// MY SESSION MISSING LINE 131
// MY SESSION MISSING LINE 132
// MY SESSION MISSING LINE 133
// MY SESSION MISSING LINE 134
// MY SESSION MISSING LINE 135
// MY SESSION MISSING LINE 136
// MY SESSION MISSING LINE 137
// MY SESSION MISSING LINE 138
// MY SESSION MISSING LINE 139
// MY SESSION MISSING LINE 140
// MY SESSION MISSING LINE 141
// MY SESSION MISSING LINE 142
// MY SESSION MISSING LINE 143
// MY SESSION MISSING LINE 144
// MY SESSION MISSING LINE 145
// MY SESSION MISSING LINE 146
// MY SESSION MISSING LINE 147
// MY SESSION MISSING LINE 148
// MY SESSION MISSING LINE 149
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
      if (request.co
// MY SESSION MISSING LINE 189
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
    const { action, missingInfoRequested, modificationReason, modifiedQuoteData } = req.body;
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
      if (request.companyId !== authUser.companyId || 'COMP-001') {
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
// MY SESSION MISSING LINE 351
// MY SESSION MISSING LINE 352
// MY SESSION MISSING LINE 353
// MY SESSION MISSING LINE 354

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
// MY SESSION MISSING LINE 401
// MY SESSION MISSING LINE 402
// MY SESSION MISSING LINE 403
// MY SESSION MISSING LINE 404
// MY SESSION MISSING LINE 405
// MY SESSION MISSING LINE 406
// MY SESSION MISSING LINE 407
// MY SESSION MISSING LINE 408
// MY SESSION MISSING LINE 409
// MY SESSION MISSING LINE 410
// MY SESSION MISSING LINE 411
// MY SESSION MISSING LINE 412
// MY SESSION MISSING LINE 413
// MY SESSION MISSING LINE 414
// MY SESSION MISSING LINE 415
// MY SESSION MISSING LINE 416
// MY SESSION MISSING LINE 417
// MY SESSION MISSING LINE 418
// MY SESSION MISSING LINE 419
// MY SESSION MISSING LINE 420
// MY SESSION MISSING LINE 421
// MY SESSION MISSING LINE 422
// MY SESSION MISSING LINE 423
// MY SESSION MISSING LINE 424
// MY SESSION MISSING LINE 425
// MY SESSION MISSING LINE 426
// MY SESSION MISSING LINE 427
// MY SESSION MISSING LINE 428
// MY SESSION MISSING LINE 429
// MY SESSION MISSING LINE 430
// MY SESSION MISSING LINE 431
// MY SESSION MISSING LINE 432
// MY SESSION MISSING LINE 433
// MY SESSION MISSING LINE 434
// MY SESSION MISSING LINE 435
// MY SESSION MISSING LINE 436
// MY SESSION MISSING LINE 437
// MY SESSION MISSING LINE 438
// MY SESSION MISSING LINE 439
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
// MY SESSION MISSING LINE 461
// MY SESSION MISSING LINE 462
// MY SESSION MISSING LINE 463
// MY SESSION MISSING LINE 464
// MY SESSION MISSING LINE 465
// MY SESSION MISSING LINE 466
// MY SESSION MISSING LINE 467
// MY SESSION MISSING LINE 468
// MY SESSION MISSING LINE 469
// MY SESSION MISSING LINE 470
// MY SESSION MISSING LINE 471
// MY SESSION MISSING LINE 472
// MY SESSION MISSING LINE 473
// MY SESSION MISSING LINE 474
// MY SESSION MISSING LINE 475
// MY SESSION MISSING LINE 476
// MY SESSION MISSING LINE 477
// MY SESSION MISSING LINE 478
// MY SESSION MISSING LINE 479
// MY SESSION MISSING LINE 480
// MY SESSION MISSING LINE 481
// MY SESSION MISSING LINE 482
// MY SESSION MISSING LINE 483
// MY SESSION MISSING LINE 484
// MY SESSION MISSING LINE 485
// MY SESSION MISSING LINE 486
// MY SESSION MISSING LINE 487
// MY SESSION MISSING LINE 488
// MY SESSION MISSING LINE 489
// MY SESSION MISSING LINE 490
// MY SESSION MISSING LINE 491
// MY SESSION MISSING LINE 492
// MY SESSION MISSING LINE 493
// MY SESSION MISSING LINE 494
// MY SESSION MISSING LINE 495
// MY SESSION MISSING LINE 496
// MY SESSION MISSING LINE 497
// MY SESSION MISSING LINE 498
// MY SESSION MISSING LINE 499
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
    res.status(500).json({
// MY SESSION MISSING LINE 538
// MY SESSION MISSING LINE 539
// MY SESSION MISSING LINE 540
// MY SESSION MISSING LINE 541
// MY SESSION MISSING LINE 542
// MY SESSION MISSING LINE 543
// MY SESSION MISSING LINE 544
// MY SESSION MISSING LINE 545
// MY SESSION MISSING LINE 546
// MY SESSION MISSING LINE 547
// MY SESSION MISSING LINE 548
// MY SESSION MISSING LINE 549
// MY SESSION MISSING LINE 550
// MY SESSION MISSING LINE 551
// MY SESSION MISSING LINE 552
// MY SESSION MISSING LINE 553
// MY SESSION MISSING LINE 554
// MY SESSION MISSING LINE 555
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
// MY SESSION MISSING LINE 601
// MY SESSION MISSING LINE 602
// MY SESSION MISSING LINE 603
// MY SESSION MISSING LINE 604
// MY SESSION MISSING LINE 605
// MY SESSION MISSING LINE 606
// MY SESSION MISSING LINE 607
// MY SESSION MISSING LINE 608
// MY SESSION MISSING LINE 609
// MY SESSION MISSING LINE 610
// MY SESSION MISSING LINE 611
// MY SESSION MISSING LINE 612
// MY SESSION MISSING LINE 613
// MY SESSION MISSING LINE 614
// MY SESSION MISSING LINE 615
// MY SESSION MISSING LINE 616
// MY SESSION MISSING LINE 617
// MY SESSION MISSING LINE 618
// MY SESSION MISSING LINE 619
// MY SESSION MISSING LINE 620
// MY SESSION MISSING LINE 621
// MY SESSION MISSING LINE 622
// MY SESSION MISSING LINE 623
// MY SESSION MISSING LINE 624
// MY SESSION MISSING LINE 625
// MY SESSION MISSING LINE 626
// MY SESSION MISSING LINE 627
// MY SESSION MISSING LINE 628
// MY SESSION MISSING LINE 629

// MY SESSION MISSING LINE 631
// MY SESSION MISSING LINE 632
// MY SESSION MISSING LINE 633
// MY SESSION MISSING LINE 634
// MY SESSION MISSING LINE 635
// MY SESSION MISSING LINE 636
// MY SESSION MISSING LINE 637
// MY SESSION MISSING LINE 638
// MY SESSION MISSING LINE 639
// MY SESSION MISSING LINE 640
// MY SESSION MISSING LINE 641
// MY SESSION MISSING LINE 642
// MY SESSION MISSING LINE 643
// MY SESSION MISSING LINE 644
// MY SESSION MISSING LINE 645
// MY SESSION MISSING LINE 646
// MY SESSION MISSING LINE 647
// MY SESSION MISSING LINE 648
// MY SESSION MISSING LINE 649
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
 * Securely fetch a single b
// MY SESSION MISSING LINE 692
// MY SESSION MISSING LINE 693
// MY SESSION MISSING LINE 694
// MY SESSION MISSING LINE 695
// MY SESSION MISSING LINE 696
// MY SESSION MISSING LINE 697
// MY SESSION MISSING LINE 698
// MY SESSION MISSING LINE 699
// MY SESSION MISSING LINE 700
// MY SESSION MISSING LINE 701
// MY SESSION MISSING LINE 702
// MY SESSION MISSING LINE 703
// MY SESSION MISSING LINE 704
// MY SESSION MISSING LINE 705
// MY SESSION MISSING LINE 706
// MY SESSION MISSING LINE 707
// MY SESSION MISSING LINE 708
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

// MY SESSION MISSING LINE 751
// MY SESSION MISSING LINE 752
// MY SESSION MISSING LINE 753
// MY SESSION MISSING LINE 754
// MY SESSION MISSING LINE 755
// MY SESSION MISSING LINE 756
// MY SESSION MISSING LINE 757
// MY SESSION MISSING LINE 758
// MY SESSION MISSING LINE 759

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
      } el
// MY SESSION MISSING LINE 931
// MY SESSION MISSING LINE 932
// MY SESSION MISSING LINE 933
// MY SESSION MISSING LINE 934
// MY SESSION MISSING LINE 935
// MY SESSION MISSING LINE 936
// MY SESSION MISSING LINE 937
// MY SESSION MISSING LINE 938
// MY SESSION MISSING LINE 939
// MY SESSION MISSING LINE 940
// MY SESSION MISSING LINE 941
// MY SESSION MISSING LINE 942
// MY SESSION MISSING LINE 943
// MY SESSION MISSING LINE 944
// MY SESSION MISSING LINE 945
// MY SESSION MISSING LINE 946
// MY SESSION MISSING LINE 947
// MY SESSION MISSING LINE 948
// MY SESSION MISSING LINE 949
// MY SESSION MISSING LINE 950
// MY SESSION MISSING LINE 951
// MY SESSION MISSING LINE 952
// MY SESSION MISSING LINE 953
// MY SESSION MISSING LINE 954
// MY SESSION MISSING LINE 955
// MY SESSION MISSING LINE 956
// MY SESSION MISSING LINE 957
// MY SESSION MISSING LINE 958
// MY SESSION MISSING LINE 959
// MY SESSION MISSING LINE 960
// MY SESSION MISSING LINE 961
// MY SESSION MISSING LINE 962
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
