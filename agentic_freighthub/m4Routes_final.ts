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

    // For M1-M3 quotes, it's either generic or assigned to the shipper

    // We assume if it's not EXPIRED, DRAFT, etc., it can be selected.

    if (quote.shipperEmail && quote.shipperEmail !== authUser.email) {

      res.status(403).json({ success: false, error: 'You are not authorized to select this quote' });

      return;
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


  }

});



/**

 * 2. GET /api/verifications

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
      return;
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

        if (!modificationReason) {

          res.status(400).json({ success: false, error: 'modificationReason is required for MODIFY action' });



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

  }

});



/**

 * 6. POST /api/quotes/:id/customer-action

 * ACCEPT, REJECT

 */

m4Router.post('/api/quotes/:id/customer-action', async (req: Request, res: Response): Promise<void> => {

// STILL MISSING LINE 751
// STILL MISSING LINE 752
// STILL MISSING LINE 753
// STILL MISSING LINE 754
// STILL MISSING LINE 755
// STILL MISSING LINE 756
// STILL MISSING LINE 757
// STILL MISSING LINE 758
// STILL MISSING LINE 759
// STILL MISSING LINE 760
// STILL MISSING LINE 761
// STILL MISSING LINE 762
// STILL MISSING LINE 763
// STILL MISSING LINE 764
// STILL MISSING LINE 765
// STILL MISSING LINE 766
// STILL MISSING LINE 767
// STILL MISSING LINE 768
// STILL MISSING LINE 769
// STILL MISSING LINE 770
// STILL MISSING LINE 771
// STILL MISSING LINE 772
// STILL MISSING LINE 773
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

      );



      res.json({ success: true, message: 'Quote Rejected' });

    } else {

      res.status(400).json({ success: false, error: 'Invalid action' });

    }

  } catch (err: any) {

    res.status(500).json({ success: false, error: err.message });

// STILL MISSING LINE 832
// STILL MISSING LINE 833
// STILL MISSING LINE 834
// STILL MISSING LINE 835
// STILL MISSING LINE 836
// STILL MISSING LINE 837
// STILL MISSING LINE 838
// STILL MISSING LINE 839
// STILL MISSING LINE 840
// STILL MISSING LINE 841
// STILL MISSING LINE 842
// STILL MISSING LINE 843
// STILL MISSING LINE 844
// STILL MISSING LINE 845
// STILL MISSING LINE 846
// STILL MISSING LINE 847
// STILL MISSING LINE 848
// STILL MISSING LINE 849
// STILL MISSING LINE 850
// STILL MISSING LINE 851
// STILL MISSING LINE 852
// STILL MISSING LINE 853
// STILL MISSING LINE 854
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

      { quoteId: request.quoteId, customerId: authUser.id },

      { $set: { status: 'UNDER_REVIEW', updatedAt: nowIso } }

    );



    const updated = await verReqCol.findOne({ requestId: id });

    res.json({ success: true, data: updated, message: 'Verification resubmitted for review' });

  } catch (err: any) {

    res.status(500).json({ success: false, error: err.message });

  }
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

// STILL MISSING LINE 1073
// STILL MISSING LINE 1074
// STILL MISSING LINE 1075
// STILL MISSING LINE 1076
// STILL MISSING LINE 1077
// STILL MISSING LINE 1078
// STILL MISSING LINE 1079
// STILL MISSING LINE 1080
// STILL MISSING LINE 1081
// STILL MISSING LINE 1082
// STILL MISSING LINE 1083
// STILL MISSING LINE 1084
// STILL MISSING LINE 1085
// STILL MISSING LINE 1086
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
      query.companyId = authUser.companyId || 'COMP-001';

    } else if (authUser.role === 'admin' || authUser.role === 'customs-officer') {

      // Admin and customs officers can see all bookings

    } else {

      res.status(403).json({ success: false, error: 'Unauthorized access' });

      return;

    }



    const bookings = await bookCol.find(query).toArray();
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




    res.status(500).json({ success: false, error: err.message });

  }

});





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
